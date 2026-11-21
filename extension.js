'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vscode = require('vscode');
const themeMetadata = require('./theme-metadata.json');

const DEFAULT_THEME = 'SNES Light';
const TOGGLE_COMMAND_ID = 'consolePalette.toggleTheme';
const PICK_COMMAND_ID = 'consolePalette.pickTheme';
const RANDOM_COMMAND_ID = 'consolePalette.randomTheme';
const RANDOM_SAME_MODE_COMMAND_ID = 'consolePalette.randomThemeSameMode';
const SYNC_OS_PAIR_COMMAND_ID = 'consolePalette.syncOsThemePair';
const EXPLORER_COMMAND_ID = 'consolePalette.openExplorer';

function findByLabel(label) {
  return themeMetadata.find((t) => t.label === label);
}

function findSibling(entry) {
  if (!entry || typeof entry.slug !== 'string') return undefined;
  const otherMode = entry.mode === 'light' ? 'dark' : 'light';
  const consoleSlug = entry.slug.replace(/-(light|dark)$/, '');
  return themeMetadata.find((t) => t.slug.replace(/-(light|dark)$/, '') === consoleSlug && t.mode === otherMode);
}

function findPairForConsole(consoleOrEntry) {
  if (!consoleOrEntry) return null;
  let consoleName = null;
  let consoleSlug = null;

  if (typeof consoleOrEntry === 'object') {
    consoleName = consoleOrEntry.console || null;
    if (typeof consoleOrEntry.slug === 'string') {
      consoleSlug = consoleOrEntry.slug.replace(/-(light|dark)$/, '');
    }
  } else if (typeof consoleOrEntry === 'string') {
    const byLabel = findByLabel(consoleOrEntry);
    if (byLabel) {
      consoleName = byLabel.console;
      consoleSlug = byLabel.slug.replace(/-(light|dark)$/, '');
    } else {
      consoleName = consoleOrEntry;
      consoleSlug = consoleOrEntry.replace(/-(light|dark)$/, '');
    }
  } else {
    return null;
  }

  const matches = themeMetadata.filter(
    (t) =>
      (consoleName && t.console === consoleName) ||
      (consoleSlug && t.slug.replace(/-(light|dark)$/, '') === consoleSlug)
  );
  const light = matches.find((t) => t.mode === 'light');
  const dark = matches.find((t) => t.mode === 'dark');
  if (!light || !dark) return null;
  return { light, dark };
}

async function setTheme(label) {
  await vscode.workspace.getConfiguration('workbench').update('colorTheme', label, vscode.ConfigurationTarget.Global);
}

function escapeHtmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function shouldShowStatusBar(visibilitySetting, isConsoleThemeActive) {
  if (visibilitySetting === 'never') return false;
  if (visibilitySetting === 'whenActive') return Boolean(isConsoleThemeActive);
  return true;
}

function buildQuickPickItems(currentThemeLabel, separatorKind) {
  const sepKind =
    separatorKind !== undefined
      ? separatorKind
      : vscode && vscode.QuickPickItemKind && vscode.QuickPickItemKind.Separator !== undefined
        ? vscode.QuickPickItemKind.Separator
        : -1;

  // Group by console, preserving the chronological (release-year) order
  // baked into theme-metadata.json by the generator.
  const consoles = [];
  for (const entry of themeMetadata) {
    let bucket = consoles.find((c) => c.console === entry.console);
    if (!bucket) {
      bucket = { console: entry.console, maker: entry.maker, year: entry.year, entries: [] };
      consoles.push(bucket);
    }
    bucket.entries.push(entry);
  }

  const items = [];
  for (const bucket of consoles) {
    items.push({
      label: `${bucket.console} (${bucket.year} · ${bucket.maker})`,
      kind: sepKind,
    });
    const light = bucket.entries.find((e) => e.mode === 'light');
    const dark = bucket.entries.find((e) => e.mode === 'dark');
    for (const entry of [light, dark]) {
      if (!entry) continue;
      const isCurrent = entry.label === currentThemeLabel;
      const modeLabel = entry.mode === 'light' ? 'Light' : 'Dark';
      const meta = `${modeLabel} · ${entry.year} · ${entry.maker} · ${entry.era}`;
      items.push({
        label: entry.label,
        description: isCurrent ? `${meta}  $(check) Active` : meta,
        detail: entry.subtitle || undefined,
        themeLabel: entry.label,
      });
    }
  }

  return items;
}

function pickRandomTheme(currentLabel, options = {}) {
  const sameMode = typeof options === 'boolean' ? options : Boolean(options && options.sameMode);
  const rng = options && typeof options.rng === 'function' ? options.rng : Math.random;

  const currentEntry = findByLabel(currentLabel);
  let pool = themeMetadata;
  if (sameMode && currentEntry) {
    pool = themeMetadata.filter((t) => t.mode === currentEntry.mode);
  }
  const choices = pool.filter((t) => t.label !== currentLabel);
  const candidates = choices.length > 0 ? choices : pool;
  const idx = Math.floor(rng() * candidates.length);
  return candidates[Math.min(Math.max(idx, 0), candidates.length - 1)];
}

function buildWebviewHtmlFromSource(rawHtml, cspSource, nonce, initialThemeLabel) {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />`;

  return String(rawHtml)
    .replace('{{CSP_META}}', () => cspMeta)
    .replace(/\{\{CSP_NONCE\}\}/g, () => nonce)
    .replace('data-initial-theme=""', () => `data-initial-theme="${escapeHtmlAttr(initialThemeLabel)}"`);
}

function buildWebviewHtml(context, webview, initialThemeLabel) {
  const htmlPath = path.join(context.extensionPath, 'assets', 'explorer', 'explorer.html');
  const rawHtml = fs.readFileSync(htmlPath, 'utf8');
  const nonce = crypto.randomBytes(16).toString('base64');
  return buildWebviewHtmlFromSource(rawHtml, webview.cspSource, nonce, initialThemeLabel);
}

function activate(context) {
  let explorerPanel = null;

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = PICK_COMMAND_ID;
  statusBarItem.tooltip = 'Console Palette: pick a gaming console theme (live preview)';

  function updateStatusBarItem() {
    const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    const entry = findByLabel(currentLabel);
    const visibility = vscode.workspace
      .getConfiguration('consolePalette')
      .get('showStatusBarItem', 'always');

    statusBarItem.text = entry ? `$(symbol-color) ${entry.label}` : '$(symbol-color) Console Palette';
    if (shouldShowStatusBar(visibility, Boolean(entry))) {
      statusBarItem.show();
    } else {
      statusBarItem.hide();
    }
  }
  updateStatusBarItem();

  const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
    const themeChanged = e.affectsConfiguration('workbench.colorTheme');
    const statusBarChanged = e.affectsConfiguration('consolePalette.showStatusBarItem');
    if (themeChanged || statusBarChanged) {
      updateStatusBarItem();
    }
    if (themeChanged && explorerPanel) {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      explorerPanel.webview
        .postMessage({ type: 'activeThemeChanged', label: currentLabel })
        .then(undefined, () => {});
    }
  });

  async function handleToggle() {
    try {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      const currentEntry = findByLabel(currentLabel);
      const sibling = currentEntry ? findSibling(currentEntry) : undefined;
      const nextLabel = sibling ? sibling.label : DEFAULT_THEME;

      // Only workbench.colorTheme is touched, via the standard configuration API.
      await setTheme(nextLabel);
      vscode.window.setStatusBarMessage(`Theme switched to "${nextLabel}"`, 3000);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to toggle theme -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  const toggleDisposable = vscode.commands.registerCommand(TOGGLE_COMMAND_ID, handleToggle);

  const pickDisposable = vscode.commands.registerCommand(PICK_COMMAND_ID, async () => {
    try {
      const originalTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      const items = buildQuickPickItems(originalTheme, vscode.QuickPickItemKind.Separator);
      const activeItem = items.find((item) => item.themeLabel === originalTheme) || null;

      const qp = vscode.window.createQuickPick();
      qp.title = 'Console Palette — 39 Iconic Consoles · 78 Themes';
      qp.placeholder = 'Filter by console, maker, year, or era · Arrow for live preview · Enter to keep · Esc to restore';
      qp.matchOnDescription = true;
      qp.matchOnDetail = true;
      qp.items = items;
      if (activeItem) qp.activeItems = [activeItem];

      let accepted = false;
      let lastPreviewed = originalTheme;

      qp.onDidChangeActive((active) => {
        const candidate = active && active[0] && active[0].themeLabel;
        if (candidate && candidate !== lastPreviewed) {
          lastPreviewed = candidate;
          setTheme(candidate).catch(() => {});
        }
      });

      qp.onDidAccept(async () => {
        const selected = qp.selectedItems && qp.selectedItems[0];
        if (selected && selected.themeLabel) {
          accepted = true;
          qp.hide();
          await setTheme(selected.themeLabel);
        }
      });

      qp.onDidHide(async () => {
        qp.dispose();
        if (!accepted && originalTheme && lastPreviewed !== originalTheme) {
          await setTheme(originalTheme).catch(() => {});
        }
      });

      qp.show();
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to open theme picker -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  const randomDisposable = vscode.commands.registerCommand(RANDOM_COMMAND_ID, async () => {
    try {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      const pick = pickRandomTheme(currentLabel);
      await setTheme(pick.label);
      vscode.window.setStatusBarMessage(`Random theme: "${pick.label}"`, 3000);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to pick a random theme -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  const randomSameModeDisposable = vscode.commands.registerCommand(RANDOM_SAME_MODE_COMMAND_ID, async () => {
    try {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      const pick = pickRandomTheme(currentLabel, { sameMode: true });
      await setTheme(pick.label);
      vscode.window.setStatusBarMessage(`Random ${pick.mode} theme: "${pick.label}"`, 3000);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to pick a random theme -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  const syncOsPairDisposable = vscode.commands.registerCommand(SYNC_OS_PAIR_COMMAND_ID, async () => {
    try {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme');
      const currentEntry = findByLabel(currentLabel);
      let pair = currentEntry ? findPairForConsole(currentEntry) : null;

      if (!pair) {
        const consoleItems = [];
        const seen = new Set();
        for (const entry of themeMetadata) {
          if (seen.has(entry.console)) continue;
          seen.add(entry.console);
          const candidatePair = findPairForConsole(entry.console);
          if (!candidatePair) continue;
          consoleItems.push({
            label: entry.console,
            description: `${entry.year} · ${entry.maker} · ${entry.era}`,
            detail: `${candidatePair.light.label} ↔ ${candidatePair.dark.label}`,
            consoleName: entry.console,
          });
        }

        const chosen = await vscode.window.showQuickPick(consoleItems, {
          title: 'Console Palette — Sync OS Light/Dark Pair',
          placeHolder: 'Choose a console whose Light & Dark themes will follow your OS appearance',
          matchOnDescription: true,
          matchOnDetail: true,
        });
        if (!chosen) return;
        pair = findPairForConsole(chosen.consoleName || chosen.label);
      }

      if (!pair) {
        vscode.window.showErrorMessage('Console Palette: could not find both Light and Dark themes for that console.');
        return;
      }

      const workbenchConfig = vscode.workspace.getConfiguration('workbench');
      const windowConfig = vscode.workspace.getConfiguration('window');
      await workbenchConfig.update(
        'preferredLightColorTheme',
        pair.light.label,
        vscode.ConfigurationTarget.Global
      );
      await workbenchConfig.update(
        'preferredDarkColorTheme',
        pair.dark.label,
        vscode.ConfigurationTarget.Global
      );
      await windowConfig.update('autoDetectColorScheme', true, vscode.ConfigurationTarget.Global);

      vscode.window.showInformationMessage(
        `Console Palette: OS Light/Dark auto-switching synced to "${pair.light.label}" ↔ "${pair.dark.label}".`
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to sync OS Light/Dark pair -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  const explorerDisposable = vscode.commands.registerCommand(EXPLORER_COMMAND_ID, () => {
    try {
      const currentLabel = vscode.workspace.getConfiguration('workbench').get('colorTheme') || '';
      if (explorerPanel) {
        explorerPanel.reveal(vscode.ViewColumn.Active);
        explorerPanel.webview.postMessage({ type: 'activeThemeChanged', label: currentLabel }).then(undefined, () => {});
        return;
      }

      explorerPanel = vscode.window.createWebviewPanel(
        'consolePalette.explorer',
        'Console Palette Explorer',
        vscode.ViewColumn.Active,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'assets', 'explorer')],
        }
      );

      explorerPanel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');
      explorerPanel.webview.html = buildWebviewHtml(context, explorerPanel.webview, currentLabel);

      explorerPanel.webview.onDidReceiveMessage(
        async (msg) => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.type === 'applyTheme' && typeof msg.label === 'string' && findByLabel(msg.label)) {
            await setTheme(msg.label);
          } else if (msg.type === 'copyText' && typeof msg.text === 'string') {
            await vscode.env.clipboard.writeText(msg.text);
          }
        },
        undefined,
        context.subscriptions
      );

      explorerPanel.onDidDispose(
        () => {
          explorerPanel = null;
        },
        undefined,
        context.subscriptions
      );
    } catch (err) {
      vscode.window.showErrorMessage(
        `Console Palette: failed to open Explorer -- ${err instanceof Error ? err.message : String(err)}`
      );
    }
  });

  context.subscriptions.push(
    statusBarItem,
    configListener,
    toggleDisposable,
    pickDisposable,
    randomDisposable,
    randomSameModeDisposable,
    syncOsPairDisposable,
    explorerDisposable
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
  findByLabel,
  findSibling,
  findPairForConsole,
  escapeHtmlAttr,
  shouldShowStatusBar,
  buildQuickPickItems,
  pickRandomTheme,
  buildWebviewHtmlFromSource,
};
