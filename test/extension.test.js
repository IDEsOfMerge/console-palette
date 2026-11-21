'use strict';

const { describe, it, afterEach, after } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const EXTENSION_MODULE_PATH = require.resolve(path.join(REPO_ROOT, 'extension.js'));
const themeMetadata = require(path.join(REPO_ROOT, 'theme-metadata.json'));

const ORIGINAL_MODULE_LOAD = Module._load;

function createVscodeMock(initialSettings = {}) {
  const settings = new Map(
    Object.entries({
      'workbench.colorTheme': 'SNES Light',
      'consolePalette.showStatusBarItem': 'always',
      ...initialSettings,
    })
  );

  const configListeners = [];
  const commands = new Map();
  const updateCalls = [];
  const statusBarItems = [];
  const quickPicks = [];
  const webviewPanels = [];
  const infoMessages = [];
  const errorMessages = [];
  const statusBarMessages = [];
  const showQuickPickCalls = [];
  const clipboardWrites = [];
  let nextQuickPickResult = undefined;

  function makeConfigChangeEvent(changedKeys) {
    const keys = Array.isArray(changedKeys) ? changedKeys : [changedKeys];
    return {
      affectsConfiguration(section) {
        return keys.some(
          (k) => k === section || k.startsWith(`${section}.`) || section.startsWith(`${k}.`)
        );
      },
    };
  }

  function fireConfigChange(changedKeys) {
    const event = makeConfigChangeEvent(changedKeys);
    for (const listener of [...configListeners]) {
      listener(event);
    }
  }

  function setSetting(fullKey, value, { fireEvent = true } = {}) {
    settings.set(fullKey, value);
    if (fireEvent) {
      fireConfigChange(fullKey);
    }
  }

  function registerCommand(id, handler) {
    commands.set(id, handler);
    return {
      dispose() {
        if (commands.get(id) === handler) {
          commands.delete(id);
        }
      },
    };
  }

  const StatusBarAlignment = { Left: 1, Right: 2 };
  const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
  const ViewColumn = { Active: -1, Beside: -2, One: 1, Two: 2 };
  const QuickPickItemKind = { Separator: -1, Default: 0 };

  const Uri = {
    file(fsPath) {
      return {
        fsPath,
        path: fsPath,
        scheme: 'file',
        toString() {
          return `file://${fsPath}`;
        },
      };
    },
    joinPath(base, ...segments) {
      const basePath = (base && (base.fsPath || base.path)) || String(base || '');
      const joined = path.join(basePath, ...segments);
      return Uri.file(joined);
    },
  };

  const vscode = {
    StatusBarAlignment,
    ConfigurationTarget,
    ViewColumn,
    QuickPickItemKind,
    Uri,
    workspace: {
      getConfiguration(section) {
        const resolveKey = (key) => (section ? `${section}.${key}` : key);
        return {
          get(key, defaultValue) {
            const fullKey = resolveKey(key);
            if (settings.has(fullKey) && settings.get(fullKey) !== undefined) {
              return settings.get(fullKey);
            }
            return defaultValue;
          },
          has(key) {
            return settings.has(resolveKey(key));
          },
          update(key, value, target) {
            const fullKey = resolveKey(key);
            updateCalls.push({ section: section || '', key, fullKey, value, target });
            settings.set(fullKey, value);
            fireConfigChange(fullKey);
            return Promise.resolve();
          },
        };
      },
      onDidChangeConfiguration(listener, thisArgs, disposables) {
        const bound = thisArgs ? listener.bind(thisArgs) : listener;
        configListeners.push(bound);
        const disposable = {
          dispose() {
            const idx = configListeners.indexOf(bound);
            if (idx >= 0) configListeners.splice(idx, 1);
          },
        };
        if (Array.isArray(disposables)) disposables.push(disposable);
        return disposable;
      },
    },
    commands: {
      registerCommand,
      async executeCommand(id, ...args) {
        const handler = commands.get(id);
        if (!handler) {
          throw new Error(`Command not registered: ${id}`);
        }
        return handler(...args);
      },
    },
    window: {
      registerCommand,
      createStatusBarItem(...args) {
        let id;
        let alignment;
        let priority;
        if (typeof args[0] === 'string') {
          [id, alignment, priority] = args;
        } else {
          [alignment, priority] = args;
        }
        const item = {
          id,
          alignment,
          priority,
          text: '',
          command: undefined,
          tooltip: undefined,
          visible: false,
          disposed: false,
          show() {
            this.visible = true;
          },
          hide() {
            this.visible = false;
          },
          dispose() {
            this.disposed = true;
            this.visible = false;
          },
        };
        statusBarItems.push(item);
        return item;
      },
      createQuickPick() {
        const activeListeners = [];
        const acceptListeners = [];
        const hideListeners = [];
        let hideFired = false;

        const qp = {
          title: '',
          placeholder: '',
          matchOnDescription: false,
          matchOnDetail: false,
          items: [],
          activeItems: [],
          selectedItems: [],
          shown: false,
          hidden: false,
          disposed: false,
          onDidChangeActive(cb) {
            activeListeners.push(cb);
            return { dispose() {} };
          },
          onDidAccept(cb) {
            acceptListeners.push(cb);
            return { dispose() {} };
          },
          onDidHide(cb) {
            hideListeners.push(cb);
            return { dispose() {} };
          },
          show() {
            this.shown = true;
            this.hidden = false;
            hideFired = false;
          },
          hide() {
            if (hideFired) return;
            hideFired = true;
            this.hidden = true;
            for (const cb of [...hideListeners]) {
              cb();
            }
          },
          dispose() {
            this.disposed = true;
          },
          async _emitDidChangeActive(items) {
            this.activeItems = items;
            for (const cb of [...activeListeners]) {
              await cb(items);
            }
            await Promise.resolve();
          },
          async _emitDidAccept(selectedItems) {
            if (selectedItems !== undefined) {
              this.selectedItems = selectedItems;
              this.activeItems = selectedItems;
            }
            for (const cb of [...acceptListeners]) {
              await cb();
            }
            await Promise.resolve();
          },
          async _emitDidHide() {
            if (hideFired) return;
            hideFired = true;
            this.hidden = true;
            for (const cb of [...hideListeners]) {
              await cb();
            }
            await Promise.resolve();
          },
        };
        quickPicks.push(qp);
        return qp;
      },
      createWebviewPanel(viewType, title, showOptions, options) {
        const messageListeners = [];
        const disposeListeners = [];
        const webview = {
          cspSource: 'https://vscode-resource.mock',
          html: '',
          postedMessages: [],
          postMessage(msg) {
            this.postedMessages.push(msg);
            return Promise.resolve(true);
          },
          onDidReceiveMessage(cb, thisArgs, disposables) {
            const bound = thisArgs ? cb.bind(thisArgs) : cb;
            messageListeners.push(bound);
            const disp = { dispose() {} };
            if (Array.isArray(disposables)) disposables.push(disp);
            return disp;
          },
          async _emitDidReceiveMessage(msg) {
            for (const cb of [...messageListeners]) {
              await cb(msg);
            }
          },
        };
        const panel = {
          viewType,
          title,
          showOptions,
          options,
          iconPath: undefined,
          webview,
          revealCount: 0,
          disposed: false,
          reveal() {
            this.revealCount += 1;
          },
          onDidDispose(cb, thisArgs, disposables) {
            const bound = thisArgs ? cb.bind(thisArgs) : cb;
            disposeListeners.push(bound);
            const disp = { dispose() {} };
            if (Array.isArray(disposables)) disposables.push(disp);
            return disp;
          },
          dispose() {
            if (this.disposed) return;
            this.disposed = true;
            for (const cb of [...disposeListeners]) {
              cb();
            }
          },
        };
        webviewPanels.push(panel);
        return panel;
      },
      showInformationMessage(msg, ...items) {
        infoMessages.push({ msg, items });
        return Promise.resolve(undefined);
      },
      showErrorMessage(msg, ...items) {
        errorMessages.push({ msg, items });
        return Promise.resolve(undefined);
      },
      setStatusBarMessage(text, timeout) {
        statusBarMessages.push({ text, timeout });
        return { dispose() {} };
      },
      showQuickPick(items, options) {
        showQuickPickCalls.push({ items, options });
        const result =
          typeof nextQuickPickResult === 'function'
            ? nextQuickPickResult(items, options)
            : nextQuickPickResult;
        return Promise.resolve(result);
      },
    },
    env: {
      clipboard: {
        writeText(text) {
          clipboardWrites.push(text);
          return Promise.resolve();
        },
      },
    },
  };

  return {
    vscode,
    settings,
    commands,
    updateCalls,
    statusBarItems,
    quickPicks,
    webviewPanels,
    infoMessages,
    errorMessages,
    statusBarMessages,
    showQuickPickCalls,
    clipboardWrites,
    setSetting,
    fireConfigChange,
    setNextQuickPickResult(val) {
      nextQuickPickResult = val;
    },
  };
}

function setupExtension(initialSettings = {}) {
  const mock = createVscodeMock(initialSettings);

  Module._load = function mockedLoad(request, parent, isMain) {
    if (request === 'vscode') {
      return mock.vscode;
    }
    return ORIGINAL_MODULE_LOAD.call(this, request, parent, isMain);
  };

  delete require.cache[EXTENSION_MODULE_PATH];
  const ext = require(EXTENSION_MODULE_PATH);

  const context = {
    extensionPath: REPO_ROOT,
    extensionUri: mock.vscode.Uri.file(REPO_ROOT),
    subscriptions: [],
  };

  ext.activate(context);

  return {
    ext,
    mock,
    context,
    invokeCommand: (id, ...args) => mock.vscode.commands.executeCommand(id, ...args),
  };
}

afterEach(() => {
  Module._load = ORIGINAL_MODULE_LOAD;
  delete require.cache[EXTENSION_MODULE_PATH];
});

after(() => {
  Module._load = ORIGINAL_MODULE_LOAD;
});

describe('extension: activation & command registration', () => {
  it('registers all 6 commands and displays the status bar badge on activation', () => {
    const { mock, context } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });

    const expectedCommands = [
      'consolePalette.toggleTheme',
      'consolePalette.pickTheme',
      'consolePalette.randomTheme',
      'consolePalette.randomThemeSameMode',
      'consolePalette.syncOsThemePair',
      'consolePalette.openExplorer',
    ];

    assert.equal(mock.commands.size, expectedCommands.length);
    for (const id of expectedCommands) {
      assert.equal(typeof mock.commands.get(id), 'function', `Expected command "${id}" to be registered`);
    }

    assert.equal(mock.statusBarItems.length, 1);
    const badge = mock.statusBarItems[0];
    assert.equal(badge.visible, true);
    assert.equal(badge.command, 'consolePalette.pickTheme');
    assert.ok(badge.text.includes('SNES Light'), `Expected status bar text to contain active theme, got "${badge.text}"`);
    assert.ok(badge.tooltip && badge.tooltip.length > 0);
    assert.ok(context.subscriptions.length >= expectedCommands.length + 2);
  });
});

describe('extension: toggleTheme', () => {
  it('flips Nintendo 64 Light <-> Nintendo 64 Dark and PlayStation Dark <-> PlayStation Light', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'Nintendo 64 Light' });

    await invokeCommand('consolePalette.toggleTheme');
    assert.equal(mock.settings.get('workbench.colorTheme'), 'Nintendo 64 Dark');

    await invokeCommand('consolePalette.toggleTheme');
    assert.equal(mock.settings.get('workbench.colorTheme'), 'Nintendo 64 Light');

    mock.setSetting('workbench.colorTheme', 'PlayStation Dark');
    await invokeCommand('consolePalette.toggleTheme');
    assert.equal(mock.settings.get('workbench.colorTheme'), 'PlayStation Light');

    await invokeCommand('consolePalette.toggleTheme');
    assert.equal(mock.settings.get('workbench.colorTheme'), 'PlayStation Dark');
  });

  it('falls back to SNES Light when active theme is external', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'Default Dark+' });

    await invokeCommand('consolePalette.toggleTheme');
    assert.equal(mock.settings.get('workbench.colorTheme'), 'SNES Light');
    assert.equal(mock.errorMessages.length, 0);
  });
});

describe('extension: showStatusBarItem setting', () => {
  it('shows badge for "always" even when an external theme is active', () => {
    const { mock } = setupExtension({
      'workbench.colorTheme': 'Default Dark+',
      'consolePalette.showStatusBarItem': 'always',
    });

    const badge = mock.statusBarItems[0];
    assert.equal(badge.visible, true);
    assert.ok(badge.text.includes('Console Palette'));
  });

  it('hides badge for "whenActive" on external themes and shows it when a Console Palette theme is active', () => {
    const { mock } = setupExtension({
      'workbench.colorTheme': 'Default Dark+',
      'consolePalette.showStatusBarItem': 'whenActive',
    });

    const badge = mock.statusBarItems[0];
    assert.equal(badge.visible, false);

    mock.setSetting('workbench.colorTheme', 'Nintendo Switch Dark');
    assert.equal(badge.visible, true);
    assert.ok(badge.text.includes('Nintendo Switch Dark'));

    mock.setSetting('workbench.colorTheme', 'Default Light+');
    assert.equal(badge.visible, false);
  });

  it('always hides badge for "never" regardless of active theme, and responds to live config changes', () => {
    const { mock } = setupExtension({
      'workbench.colorTheme': 'SNES Light',
      'consolePalette.showStatusBarItem': 'never',
    });

    const badge = mock.statusBarItems[0];
    assert.equal(badge.visible, false);

    mock.setSetting('workbench.colorTheme', 'Default Dark+');
    assert.equal(badge.visible, false);

    mock.setSetting('consolePalette.showStatusBarItem', 'always');
    assert.equal(badge.visible, true);

    mock.setSetting('consolePalette.showStatusBarItem', 'never');
    assert.equal(badge.visible, false);
  });
});

describe('extension: pickTheme', () => {
  it('builds 30 chronological console separators + 60 theme items with year & maker in descriptions', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });

    await invokeCommand('consolePalette.pickTheme');
    assert.equal(mock.quickPicks.length, 1);

    const qp = mock.quickPicks[0];
    assert.equal(qp.shown, true);
    assert.equal(qp.matchOnDescription, true);
    assert.equal(qp.matchOnDetail, true);

    const separators = qp.items.filter((i) => i.kind === mock.vscode.QuickPickItemKind.Separator);
    const themeItems = qp.items.filter((i) => i.kind !== mock.vscode.QuickPickItemKind.Separator);

    assert.equal(separators.length, 30);
    assert.equal(themeItems.length, 60);
    assert.equal(qp.items.length, 90);

    // Verify chronological release-year order matching theme-metadata.json.
    const metaByLabel = new Map(themeMetadata.map((m) => [m.label, m]));
    let prevYear = 0;
    for (const item of themeItems) {
      const entry = metaByLabel.get(item.themeLabel);
      assert.ok(entry, `Missing metadata for QuickPick item "${item.themeLabel}"`);
      assert.ok(entry.year >= prevYear, `Non-chronological order: ${entry.label} (${entry.year}) after ${prevYear}`);
      prevYear = entry.year;

      assert.ok(
        item.description.includes(String(entry.year)),
        `Expected "${item.label}" description "${item.description}" to include year ${entry.year}`
      );
      assert.ok(
        item.description.includes(entry.maker),
        `Expected "${item.label}" description "${item.description}" to include maker ${entry.maker}`
      );
      assert.ok(
        item.description.includes(entry.era),
        `Expected "${item.label}" description "${item.description}" to include era ${entry.era}`
      );
    }

    assert.equal(themeItems[0].themeLabel, 'Atari 2600 Light');
    assert.equal(themeItems[themeItems.length - 1].themeLabel, 'Steam Deck Dark');
    assert.equal(qp.activeItems[0].themeLabel, 'SNES Light');
  });

  it('live-previews highlighted themes on onDidChangeActive and rolls back on Esc (onDidHide without accept)', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });

    await invokeCommand('consolePalette.pickTheme');
    const qp = mock.quickPicks[0];

    const previewTarget = qp.items.find((i) => i.themeLabel === 'PlayStation Dark');
    assert.ok(previewTarget);

    await qp._emitDidChangeActive([previewTarget]);
    assert.equal(mock.settings.get('workbench.colorTheme'), 'PlayStation Dark');

    // Simulate Esc (hide without accepting).
    await qp._emitDidHide();
    assert.equal(qp.disposed, true);
    assert.equal(mock.settings.get('workbench.colorTheme'), 'SNES Light');
  });

  it('commits the accepted theme on onDidAccept without rolling back on hide', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });

    await invokeCommand('consolePalette.pickTheme');
    const qp = mock.quickPicks[0];

    const chosen = qp.items.find((i) => i.themeLabel === 'Sega Dreamcast Dark');
    assert.ok(chosen);

    await qp._emitDidChangeActive([chosen]);
    await qp._emitDidAccept([chosen]);
    assert.equal(qp.disposed, true);
    assert.equal(mock.settings.get('workbench.colorTheme'), 'Sega Dreamcast Dark');
  });
});

describe('extension: randomTheme & randomThemeSameMode', () => {
  it('randomTheme never selects the currently active theme', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });
    const validLabels = new Set(themeMetadata.map((t) => t.label));

    for (let i = 0; i < 30; i++) {
      const before = mock.settings.get('workbench.colorTheme');
      await invokeCommand('consolePalette.randomTheme');
      const afterTheme = mock.settings.get('workbench.colorTheme');
      assert.ok(validLabels.has(afterTheme), `Expected valid theme label, got "${afterTheme}"`);
      assert.notEqual(afterTheme, before, 'randomTheme should never re-select the active theme');
    }
  });

  it('randomThemeSameMode stays in dark mode on dark themes and light mode on light themes', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'Nintendo 64 Dark' });
    const metaByLabel = new Map(themeMetadata.map((t) => [t.label, t]));

    for (let i = 0; i < 20; i++) {
      const before = mock.settings.get('workbench.colorTheme');
      await invokeCommand('consolePalette.randomThemeSameMode');
      const next = mock.settings.get('workbench.colorTheme');
      const entry = metaByLabel.get(next);
      assert.ok(entry, `Expected valid Console Palette theme, got "${next}"`);
      assert.equal(entry.mode, 'dark', `Expected dark theme, got "${next}" (${entry.mode})`);
      assert.notEqual(next, before);
    }

    mock.setSetting('workbench.colorTheme', 'SNES Light');
    for (let i = 0; i < 20; i++) {
      const before = mock.settings.get('workbench.colorTheme');
      await invokeCommand('consolePalette.randomThemeSameMode');
      const next = mock.settings.get('workbench.colorTheme');
      const entry = metaByLabel.get(next);
      assert.ok(entry, `Expected valid Console Palette theme, got "${next}"`);
      assert.equal(entry.mode, 'light', `Expected light theme, got "${next}" (${entry.mode})`);
      assert.notEqual(next, before);
    }
  });
});

describe('extension: syncOsThemePair', () => {
  it('syncs preferredLightColorTheme, preferredDarkColorTheme, and autoDetectColorScheme for Nintendo Switch Dark', async () => {
    const { mock, invokeCommand } = setupExtension({
      'workbench.colorTheme': 'Nintendo Switch Dark',
    });

    await invokeCommand('consolePalette.syncOsThemePair');

    assert.equal(mock.settings.get('workbench.preferredLightColorTheme'), 'Nintendo Switch Light');
    assert.equal(mock.settings.get('workbench.preferredDarkColorTheme'), 'Nintendo Switch Dark');
    assert.equal(mock.settings.get('window.autoDetectColorScheme'), true);

    const lightUpdate = mock.updateCalls.find((c) => c.fullKey === 'workbench.preferredLightColorTheme');
    const darkUpdate = mock.updateCalls.find((c) => c.fullKey === 'workbench.preferredDarkColorTheme');
    const autoUpdate = mock.updateCalls.find((c) => c.fullKey === 'window.autoDetectColorScheme');
    assert.equal(lightUpdate.target, mock.vscode.ConfigurationTarget.Global);
    assert.equal(darkUpdate.target, mock.vscode.ConfigurationTarget.Global);
    assert.equal(autoUpdate.target, mock.vscode.ConfigurationTarget.Global);
    assert.equal(mock.infoMessages.length, 1);
    assert.equal(mock.errorMessages.length, 0);
  });

  it('prompts via showQuickPick when active theme is external and syncs chosen console pair', async () => {
    const { mock, invokeCommand } = setupExtension({
      'workbench.colorTheme': 'Default Dark+',
    });

    mock.setNextQuickPickResult((items) => items.find((i) => i.label === 'PlayStation'));
    await invokeCommand('consolePalette.syncOsThemePair');

    assert.equal(mock.showQuickPickCalls.length, 1);
    assert.equal(mock.showQuickPickCalls[0].items.length, 30);
    assert.equal(mock.settings.get('workbench.preferredLightColorTheme'), 'PlayStation Light');
    assert.equal(mock.settings.get('workbench.preferredDarkColorTheme'), 'PlayStation Dark');
    assert.equal(mock.settings.get('window.autoDetectColorScheme'), true);
  });
});

describe('extension: openExplorer', () => {
  it('injects strict CSP with random nonce, replaces placeholders, and HTML-escapes initialThemeLabel', async () => {
    const maliciousLabel = 'Fake "Theme" <script>&</script>';
    const { mock, invokeCommand } = setupExtension({
      'workbench.colorTheme': maliciousLabel,
    });

    await invokeCommand('consolePalette.openExplorer');
    assert.equal(mock.webviewPanels.length, 1);

    const panel = mock.webviewPanels[0];
    const html = panel.webview.html;

    assert.ok(!html.includes('{{CSP_META}}'), 'Raw {{CSP_META}} placeholder should be replaced');
    assert.ok(!html.includes('{{CSP_NONCE}}'), 'Raw {{CSP_NONCE}} placeholder should be replaced');
    assert.ok(html.includes('<meta http-equiv="Content-Security-Policy"'));
    assert.ok(html.includes("default-src 'none'"));

    const nonceMatch = html.match(/script-src 'nonce-([^']+)'/);
    assert.ok(nonceMatch && nonceMatch[1].length >= 16, 'Expected non-empty random CSP nonce');
    const firstNonce = nonceMatch[1];
    assert.ok(
      html.includes(`<script nonce="${firstNonce}">`),
      'Expected <script> tag to carry the exact CSP nonce'
    );

    assert.ok(
      html.includes('data-initial-theme="Fake &quot;Theme&quot; &lt;script&gt;&amp;&lt;/script&gt;"'),
      'Expected initialThemeLabel to be HTML-attribute-escaped'
    );
    assert.ok(
      !html.includes(`data-initial-theme="${maliciousLabel}"`),
      'Unescaped theme label must not appear in attribute'
    );

    // Reopening after dispose generates a fresh random nonce.
    panel.dispose();
    await invokeCommand('consolePalette.openExplorer');
    assert.equal(mock.webviewPanels.length, 2);
    const secondNonceMatch = mock.webviewPanels[1].webview.html.match(/script-src 'nonce-([^']+)'/);
    assert.ok(secondNonceMatch && secondNonceMatch[1].length >= 16);
    assert.notEqual(secondNonceMatch[1], firstNonce);
  });

  it('handles applyTheme and copyText webview messages safely while ignoring unknown theme labels', async () => {
    const { mock, invokeCommand } = setupExtension({ 'workbench.colorTheme': 'SNES Light' });

    await invokeCommand('consolePalette.openExplorer');
    const panel = mock.webviewPanels[0];

    // Valid theme label is applied.
    await panel.webview._emitDidReceiveMessage({ type: 'applyTheme', label: 'Nintendo 64 Dark' });
    assert.equal(mock.settings.get('workbench.colorTheme'), 'Nintendo 64 Dark');

    // Unknown/untrusted theme label is ignored.
    const updatesBefore = mock.updateCalls.length;
    await panel.webview._emitDidReceiveMessage({ type: 'applyTheme', label: 'Unknown Malicious Theme' });
    await panel.webview._emitDidReceiveMessage({ type: 'applyTheme', label: 12345 });
    await panel.webview._emitDidReceiveMessage(null);
    assert.equal(mock.updateCalls.length, updatesBefore);
    assert.equal(mock.settings.get('workbench.colorTheme'), 'Nintendo 64 Dark');

    // copyText copies to VS Code clipboard.
    await panel.webview._emitDidReceiveMessage({ type: 'copyText', text: '#5442BA' });
    assert.deepEqual(mock.clipboardWrites, ['#5442BA']);
  });
});

describe('extension: exported pure helpers', () => {
  it('exposes and validates findByLabel, findSibling, findPairForConsole, escapeHtmlAttr, shouldShowStatusBar, buildWebviewHtmlFromSource', () => {
    const { ext } = setupExtension();

    const n64Light = ext.findByLabel('Nintendo 64 Light');
    assert.equal(n64Light.slug, 'n64-light');
    assert.equal(ext.findByLabel('Not A Real Theme'), undefined);

    const n64Dark = ext.findSibling(n64Light);
    assert.equal(n64Dark.label, 'Nintendo 64 Dark');
    assert.equal(ext.findSibling(null), undefined);

    const switchPair = ext.findPairForConsole('Nintendo Switch Dark');
    assert.equal(switchPair.light.label, 'Nintendo Switch Light');
    assert.equal(switchPair.dark.label, 'Nintendo Switch Dark');
    assert.equal(ext.findPairForConsole('Unknown Console'), null);

    assert.equal(ext.escapeHtmlAttr('a & "b" <c>'), 'a &amp; &quot;b&quot; &lt;c&gt;');
    assert.equal(ext.escapeHtmlAttr(''), '');

    assert.equal(ext.shouldShowStatusBar('always', false), true);
    assert.equal(ext.shouldShowStatusBar('whenActive', false), false);
    assert.equal(ext.shouldShowStatusBar('whenActive', true), true);
    assert.equal(ext.shouldShowStatusBar('never', true), false);

    const rendered = ext.buildWebviewHtmlFromSource(
      '<html><head>{{CSP_META}}</head><body data-initial-theme=""><script nonce="{{CSP_NONCE}}"></script></body></html>',
      'https://csp.example',
      'TEST_NONCE_123',
      'SNES & "Light" $&'
    );
    assert.ok(rendered.includes("img-src https://csp.example data:"));
    assert.ok(rendered.includes("script-src 'nonce-TEST_NONCE_123'"));
    assert.ok(rendered.includes('<script nonce="TEST_NONCE_123">'));
    assert.ok(rendered.includes('data-initial-theme="SNES &amp; &quot;Light&quot; $&amp;"'));
  });
});
