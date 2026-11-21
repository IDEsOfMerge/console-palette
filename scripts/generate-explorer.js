#!/usr/bin/env node
'use strict';

// Generates the self-contained, zero-CDN interactive Console Palette &
// Colorimetry Explorer in two deployment targets from a single source of truth
// (`palettes/*.js` + `theme-metadata.json`):
//   1. `site/index.html` (+ `site/.nojekyll`, `site/icon.png`) for GitHub Pages
//   2. `assets/explorer/explorer.html` for the in-editor VS Code / Positron
//      Webview command (`consolePalette.openExplorer`) with strict nonce CSP.
//
// Run with: node scripts/generate-explorer.js

const fs = require('fs');
const path = require('path');
const { hexToLab, ciede2000 } = require('./color-science');

const ROOT_DIR = path.join(__dirname, '..');
const PALETTES_DIR = path.join(ROOT_DIR, 'palettes');
const META_PATH = path.join(ROOT_DIR, 'theme-metadata.json');
const SITE_DIR = path.join(ROOT_DIR, 'site');
const WEBVIEW_DIR = path.join(ROOT_DIR, 'assets', 'explorer');

const ERA_GROUPS = [
  {
    era: '8-bit Pioneers',
    consoles: ['Atari 2600', 'NES', 'Sega Master System', 'Game Boy', 'Atari Lynx'],
  },
  {
    era: '16-bit Golden Age',
    consoles: ['TurboGrafx-16', 'Sega Genesis', 'SNES', 'Neo Geo AES'],
  },
  {
    era: '32/64-bit Polygon Era',
    consoles: ['Atari Jaguar', 'Sega Saturn', 'PlayStation', 'Virtual Boy', 'Nintendo 64', 'Game Boy Color'],
  },
  {
    era: '128-bit & Millennial Classics',
    consoles: ['Sega Dreamcast', 'PlayStation 2', 'Game Boy Advance', 'Nintendo GameCube', 'Xbox'],
  },
  {
    era: 'HD, Motion & Portable Era',
    consoles: ['Nintendo DS', 'PlayStation Portable', 'Xbox 360', 'Nintendo Wii', 'PlayStation 3', 'Nintendo 3DS', 'PlayStation Vita'],
  },
  {
    era: 'Modern, Hybrid & Portable PC',
    consoles: ['PlayStation 4', 'Xbox One', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S', 'Steam Deck', 'Playdate'],
  },
  {
    era: 'Next-Gen & Spatial Era',
    consoles: ['PlayStation Portal', 'Nintendo Switch 2', 'ROG Xbox Ally', 'Steam Machine', 'Steam Frame'],
  },
];

const SHORT_CONSOLE_NAMES = {
  'Atari 2600': 'Atari 2600',
  'NES': 'NES',
  'Sega Master System': 'Master System',
  'Game Boy': 'Game Boy',
  'Atari Lynx': 'Atari Lynx',
  'TurboGrafx-16': 'TurboGrafx-16',
  'Sega Genesis': 'Genesis',
  'SNES': 'SNES',
  'Neo Geo AES': 'Neo Geo',
  'Atari Jaguar': 'Atari Jaguar',
  'Sega Saturn': 'Saturn',
  'PlayStation': 'PS1',
  'Virtual Boy': 'Virtual Boy',
  'Nintendo 64': 'N64',
  'Game Boy Color': 'GBC',
  'Sega Dreamcast': 'Dreamcast',
  'PlayStation 2': 'PS2',
  'Game Boy Advance': 'GBA',
  'Nintendo GameCube': 'GameCube',
  'Xbox': 'Xbox',
  'Nintendo DS': 'DS',
  'PlayStation Portable': 'PSP',
  'Xbox 360': 'Xbox 360',
  'Nintendo Wii': 'Wii',
  'PlayStation 3': 'PS3',
  'Nintendo 3DS': '3DS',
  'PlayStation Vita': 'PS Vita',
  'PlayStation 4': 'PS4',
  'Xbox One': 'Xbox One',
  'Nintendo Switch': 'Switch',
  'PlayStation 5': 'PS5',
  'Xbox Series X|S': 'Series X|S',
  'Steam Deck': 'Steam Deck',
  'Playdate': 'Playdate',
  'PlayStation Portal': 'PS Portal',
  'Nintendo Switch 2': 'Switch 2',
  'ROG Xbox Ally': 'Xbox Ally',
  'Steam Machine': 'Steam Machine',
  'Steam Frame': 'Steam Frame',
};

function extractRationale(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split(/\r?\n/);
  const commentLines = [];
  for (const line of lines) {
    if (line.startsWith("'use strict'")) continue;
    if (line.trim() === '') {
      if (commentLines.length > 0) continue;
      continue;
    }
    if (line.startsWith('//')) {
      commentLines.push(line.replace(/^\/\/\s?/, ''));
    } else if (line.startsWith('module.exports')) {
      break;
    }
  }
  const body = commentLines.slice(1).filter((l, idx) => !(idx === 0 && l.trim() === ''));
  return body.join(' ').replace(/\s+/g, ' ').trim();
}

function loadThemeDataset() {
  const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
  const bySlug = new Map();

  for (const file of fs.readdirSync(PALETTES_DIR).filter((f) => f.endsWith('.js')).sort()) {
    const full = path.join(PALETTES_DIR, file);
    const mod = require(full);
    bySlug.set(mod.slug, { mod, rationale: extractRationale(full) });
  }

  return meta.map((entry) => {
    const found = bySlug.get(entry.slug);
    if (!found) throw new Error(`Missing palette module for slug: ${entry.slug}`);
    const { mod, rationale } = found;
    const tk = mod.tokens;
    const eraObj = ERA_GROUPS.find((g) => g.consoles.includes(mod.console));
    return {
      slug: mod.slug,
      label: mod.label,
      console: mod.console,
      maker: mod.maker,
      shortConsole: SHORT_CONSOLE_NAMES[mod.console] || mod.console,
      era: eraObj ? eraObj.era : mod.era,
      year: mod.year,
      mode: tk.mode,
      subtitle: mod.subtitle,
      story: rationale,
      t: {
        bg: tk.bg,
        fg: tk.fg,
        bgLine: tk.bgLine,
        bgWidget: tk.bgWidget,
        bgSidebar: tk.bgSidebar,
        bgPanel: tk.bgPanel,
        bgActivity: tk.bgActivity,
        tintSelect: tk.tintSelect,
        borderSubtle: tk.borderSubtle,
        borderStrong: tk.borderStrong,
        fgSecondary: tk.fgSecondary,
        fgMuted: tk.fgMuted,
        fgVariable: tk.fgVariable,
        fgPunct: tk.fgPunct,
        fgComment: tk.fgComment,
        fgParameter: tk.fgParameter,
        fgProperty: tk.fgProperty,
        kw: tk.accentKeyword,
        stor: tk.accentStorage,
        str: tk.accentString,
        rx: tk.accentRegex,
        fn: tk.accentFunction,
        fnDim: tk.accentFunctionDim,
        type: tk.accentType,
        iface: tk.accentInterface,
        num: tk.accentNumber,
        dec: tk.accentDecorator,
        ns: tk.accentNamespace,
        cur: tk.accentCursor,
        foc: tk.accentFocus,
        badge: tk.accentBadge,
        status: tk.accentStatusBar,
        err: tk.colorError,
        warn: tk.colorWarning,
        info: tk.colorInfo,
        gitAdd: tk.gitAdd,
        gitDel: tk.gitDelete,
      },
      ansi: tk.ansi,
    };
  });
}

const SIMILARITY_KEYS = ['kw', 'stor', 'str', 'rx', 'fn', 'fnDim', 'type', 'iface', 'num', 'dec', 'ns', 'err', 'warn'];

function jacobiEigenSymmetric(A) {
  const n = A.length;
  const M = A.map((row) => row.slice());
  const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  const maxIter = Math.max(80, n * n * 6);
  for (let iter = 0; iter < maxIter; iter++) {
    let p = 0;
    let q = 1;
    let maxVal = 0;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const av = Math.abs(M[i][j]);
        if (av > maxVal) {
          maxVal = av;
          p = i;
          q = j;
        }
      }
    }
    if (maxVal < 1e-10) break;
    const diff = M[q][q] - M[p][p];
    const t = Math.abs(M[p][q]) < 1e-18 * Math.abs(diff)
      ? M[p][q] / diff
      : (() => {
          const phi = diff / (2 * M[p][q]);
          return (phi >= 0 ? 1 : -1) / (Math.abs(phi) + Math.sqrt(phi * phi + 1));
        })();
    const c = 1 / Math.sqrt(1 + t * t);
    const s = t * c;
    const tau = s / (1 + c);
    const h = t * M[p][q];
    M[p][p] -= h;
    M[q][q] += h;
    M[p][q] = 0;
    M[q][p] = 0;
    for (let k = 0; k < n; k++) {
      if (k !== p && k !== q) {
        const mkp = M[k][p];
        const mkq = M[k][q];
        M[k][p] = M[p][k] = mkp - s * (mkq + tau * mkp);
        M[k][q] = M[q][k] = mkq + s * (mkp - tau * mkq);
      }
      const vkp = V[k][p];
      const vkq = V[k][q];
      V[k][p] = vkp - s * (vkq + tau * vkp);
      V[k][q] = vkq + s * (vkp - tau * vkq);
    }
  }
  const pairs = Array.from({ length: n }, (_, i) => ({
    val: M[i][i],
    vec: V.map((row) => row[i]),
  }));
  pairs.sort((a, b) => b.val - a.val);
  return pairs;
}

function computeClassicalMds2d(D) {
  const n = D.length;
  const D2 = D.map((row) => row.map((v) => v * v));
  const rowMean = D2.map((row) => row.reduce((a, b) => a + b, 0) / n);
  const grandMean = rowMean.reduce((a, b) => a + b, 0) / n;
  const B = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => -0.5 * (D2[i][j] - rowMean[i] - rowMean[j] + grandMean))
  );
  const eigs = jacobiEigenSymmetric(B);
  const posSum = eigs.reduce((acc, e) => acc + Math.max(0, e.val), 0) || 1;
  const l0 = Math.max(0, eigs[0].val);
  const l1 = Math.max(0, eigs[1].val);
  const s0 = Math.sqrt(l0);
  const s1 = Math.sqrt(l1);
  const coords = Array.from({ length: n }, (_, i) => [eigs[0].vec[i] * s0, eigs[1].vec[i] * s1]);
  return {
    coords,
    v1: Math.round((l0 / posSum) * 1000) / 10,
    v2: Math.round((l1 / posSum) * 1000) / 10,
  };
}

function enrichDatasetWithSimilarity(dataset) {
  const labBySlug = new Map();
  for (const th of dataset) {
    labBySlug.set(
      th.slug,
      SIMILARITY_KEYS.map((k) => hexToLab(th.t[k]))
    );
  }
  const pairDe = (slugA, slugB) => {
    const la = labBySlug.get(slugA);
    const lb = labBySlug.get(slugB);
    let sum = 0;
    for (let i = 0; i < la.length; i++) sum += ciede2000(la[i], lb[i]);
    return sum / la.length;
  };

  const mdsMeta = {};
  for (const mode of ['light', 'dark']) {
    const allMode = dataset.filter((th) => th.mode === mode);
    const polyMode = allMode.filter((th) => th.slug !== 'gameboy-dark');
    const nAll = allMode.length;
    const DAll = Array.from({ length: nAll }, () => Array(nAll).fill(0));
    for (let i = 0; i < nAll; i++) {
      for (let j = i + 1; j < nAll; j++) {
        const d = pairDe(allMode[i].slug, allMode[j].slug);
        DAll[i][j] = DAll[j][i] = d;
      }
    }

    const nPoly = polyMode.length;
    const DPoly = Array.from({ length: nPoly }, () => Array(nPoly).fill(0));
    for (let i = 0; i < nPoly; i++) {
      for (let j = i + 1; j < nPoly; j++) {
        const d = pairDe(polyMode[i].slug, polyMode[j].slug);
        DPoly[i][j] = DPoly[j][i] = d;
      }
    }

    const { coords, v1, v2 } = computeClassicalMds2d(DPoly);
    // Consistent orientation across Light and Dark: Xbox on +x, NES on +y
    const xboxIdx = polyMode.findIndex((th) => th.slug === `xbox-${mode}`);
    const nesIdx = polyMode.findIndex((th) => th.slug === `nes-${mode}`);
    if (xboxIdx >= 0 && coords[xboxIdx][0] < 0) coords.forEach((p) => { p[0] = -p[0]; });
    if (nesIdx >= 0 && coords[nesIdx][1] < 0) coords.forEach((p) => { p[1] = -p[1]; });

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const spanX = maxX - minX || 1;
    const spanY = maxY - minY || 1;

    polyMode.forEach((th, idx) => {
      const [x, y] = coords[idx];
      th.mds = {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
        nx: Math.round(((x - minX) / spanX) * 10000) / 10000,
        ny: Math.round(((y - minY) / spanY) * 10000) / 10000,
      };
    });

    const modeMeta = { v1, v2, minX: Math.round(minX * 10) / 10, maxX: Math.round(maxX * 10) / 10, minY: Math.round(minY * 10) / 10, maxY: Math.round(maxY * 10) / 10 };

    allMode.forEach((th, i) => {
      const dists = [];
      for (let j = 0; j < nAll; j++) {
        if (i === j) continue;
        dists.push({ slug: allMode[j].slug, de: Math.round(DAll[i][j] * 10) / 10 });
      }
      dists.sort((a, b) => a.de - b.de);
      th.neighbors = dists.slice(0, 4);
      const farPool = dists.filter((d) => d.slug !== 'gameboy-dark');
      th.farthest = farPool[farPool.length - 1] || dists[dists.length - 1];
      if (th.slug === 'gameboy-dark') {
        const meanDe = dists.reduce((s, d) => s + d.de, 0) / dists.length;
        th.mds = {
          outlier: true,
          meanDe: Math.round(meanDe * 10) / 10,
          minDe: dists[0].de,
          maxDe: dists[dists.length - 1].de,
        };
        modeMeta.gbMeanDe = th.mds.meanDe;
        modeMeta.gbMinDe = th.mds.minDe;
        modeMeta.gbMaxDe = th.mds.maxDe;
      }
    });

    mdsMeta[mode] = modeMeta;
  }

  return mdsMeta;
}

function buildHtml({ dataset, mdsMeta, target }) {
  const isWeb = target === 'web';
  const totalConsoles = ERA_GROUPS.reduce((acc, g) => acc + g.consoles.length, 0);
  const cspTag = isWeb
    ? `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; script-src 'unsafe-inline';" />`
    : '{{CSP_META}}';
  const scriptOpen = isWeb ? '<script>' : '<script nonce="{{CSP_NONCE}}">';
  const seoTags = isWeb
    ? `
  <meta name="description" content="Interactive workbench preview and perceptual colorimetry explorer for Console Palette — featuring 78 scientifically tuned Light and Dark VS Code & Positron themes across 39 iconic gaming consoles (1977–2026)." />
  <meta property="og:title" content="Console Palette — Interactive Workbench & Colorimetry Explorer" />
  <meta property="og:description" content="Explore all 78 OKLCH-calibrated Light and Dark themes for VS Code & Positron across 39 iconic consoles with live R/Python/TypeScript syntax previews, interactive CIEDE2000 similarity map, WCAG 2.1 + APCA contrast readouts, and real-time dichromacy simulation." />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://idesofmerge.github.io/console-palette/" />
  <meta property="og:image" content="https://idesofmerge.github.io/console-palette/og-preview.png" />
  <meta property="og:image:alt" content="Console Palette — 39 Iconic Gaming Consoles · 78 OKLCH Themes for VS Code & Positron" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://idesofmerge.github.io/console-palette/og-preview.png" />
  <link rel="icon" type="image/png" href="icon.png" />`
    : '';

  const serializedData = JSON.stringify(dataset);
  const serializedEras = JSON.stringify(ERA_GROUPS);
  const serializedMdsMeta = JSON.stringify(mdsMeta);

  return `<!DOCTYPE html>
<html lang="en" data-shell-mode="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${cspTag}
  <title>Console Palette — Interactive Workbench &amp; Perceptual Colorimetry Explorer</title>${seoTags}
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    :root {
      color-scheme: dark;
      --shell-bg: #111317;
      --shell-surface: #181b21;
      --shell-elevated: #1f232b;
      --shell-border: #2b303b;
      --shell-border-strong: #3d4454;
      --shell-text: #eceff4;
      --shell-muted: #9aa3b2;
      --shell-accent: #c9a227;
      --shell-accent-fg: #121316;
      --shell-radius: 10px;
      --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --font-mono: ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    }

    html[data-shell-mode="light"],
    body[data-shell-mode="light"] {
      color-scheme: light;
      --shell-bg: #f4f2ec;
      --shell-surface: #ffffff;
      --shell-elevated: #ece9e0;
      --shell-border: #d8d3c6;
      --shell-border-strong: #b8b1a0;
      --shell-text: #181b20;
      --shell-muted: #575e6b;
      --shell-accent: #1d4e89;
      --shell-accent-fg: #ffffff;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--shell-bg);
      color: var(--shell-text);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      transition: background-color 160ms ease, color 160ms ease;
    }

    .page-wrap {
      max-width: 1320px;
      margin: 0 auto;
      padding: 20px 20px 44px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* Top Header */
    .topbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 18px;
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-gem {
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }

    .brand h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 650;
      letter-spacing: -0.015em;
      line-height: 1.2;
    }

    .brand-sub {
      margin: 2px 0 0;
      font-size: 12px;
      color: var(--shell-muted);
    }

    .top-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    button, select, .btn-link {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 550;
      line-height: 1;
      border-radius: 7px;
      border: 1px solid var(--shell-border);
      background: var(--shell-elevated);
      color: var(--shell-text);
      padding: 8px 12px;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background-color 120ms ease, border-color 120ms ease, transform 80ms ease;
    }

    button:hover, select:hover, .btn-link:hover {
      border-color: var(--shell-border-strong);
    }

    button:active {
      transform: translateY(1px);
    }

    .btn-primary {
      background: var(--shell-text);
      color: var(--shell-bg);
      border-color: var(--shell-text);
      font-weight: 600;
    }

    .btn-primary:hover {
      opacity: 0.92;
      border-color: var(--shell-text);
    }

    .kbd-hint {
      font-family: var(--font-mono);
      font-size: 10px;
      padding: 2px 5px;
      border-radius: 4px;
      background: rgba(127, 127, 127, 0.18);
      opacity: 0.85;
    }

    .sync-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--shell-muted);
      padding: 6px 10px;
      border-radius: 7px;
      border: 1px solid var(--shell-border);
      background: var(--shell-elevated);
      cursor: pointer;
      user-select: none;
    }

    .sync-toggle input {
      margin: 0;
      cursor: pointer;
    }

    /* Era Game Selector Rail */
    .era-panel {
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .era-groups {
      display: flex;
      flex-wrap: wrap;
      gap: 12px 18px;
    }

    .era-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .era-label {
      font-size: 10px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--shell-muted);
    }

    .era-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .game-pill {
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
      background: var(--shell-bg);
      border: 1px solid var(--shell-border);
      color: var(--shell-muted);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .game-pill:hover {
      color: var(--shell-text);
      border-color: var(--shell-border-strong);
    }

    .game-pill[aria-pressed="true"] {
      background: var(--shell-text);
      color: var(--shell-bg);
      border-color: var(--shell-text);
      font-weight: 600;
    }

    .mini-strip {
      display: inline-flex;
      border-radius: 3px;
      overflow: hidden;
      border: 1px solid rgba(128, 128, 128, 0.35);
      height: 10px;
      flex-shrink: 0;
    }

    .mini-strip span {
      width: 5px;
      height: 10px;
      display: block;
    }

    /* Story + Mode/CVD Control Bar */
    .story-bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: start;
      padding: 16px 18px;
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
    }

    @media (max-width: 920px) {
      .story-bar { grid-template-columns: 1fr; }
    }

    .story-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 8px 12px;
    }

    .story-title {
      margin: 0;
      font-size: 16px;
      font-weight: 650;
      letter-spacing: -0.01em;
    }

    .story-sub {
      font-size: 12.5px;
      color: var(--shell-muted);
    }

    .story-text {
      margin: 7px 0 0;
      font-size: 13px;
      line-height: 1.55;
      color: var(--shell-muted);
      max-width: 82ch;
    }

    .control-clusters {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    @media (max-width: 920px) {
      .control-clusters { align-items: flex-start; }
    }

    .seg-group {
      display: inline-flex;
      background: var(--shell-bg);
      padding: 3px;
      border-radius: 8px;
      border: 1px solid var(--shell-border);
      gap: 2px;
      flex-wrap: wrap;
    }

    .seg-btn {
      border: none;
      background: transparent;
      color: var(--shell-muted);
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 11.5px;
      font-weight: 550;
    }

    .seg-btn:hover {
      color: var(--shell-text);
    }

    .seg-btn[aria-selected="true"],
    .seg-btn[aria-pressed="true"] {
      background: var(--shell-surface);
      color: var(--shell-text);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.14);
    }

    /* Simulated Positron / VS Code Workbench */
    .workbench {
      border-radius: var(--shell-radius);
      overflow: hidden;
      border: 1px solid var(--shell-border-strong);
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
      font-family: var(--font-mono);
    }

    .wb-titlebar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      height: 36px;
      border-bottom: 1px solid transparent;
      font-size: 12px;
    }

    .wb-tabs {
      display: flex;
      align-items: stretch;
      height: 100%;
      gap: 2px;
      overflow-x: auto;
    }

    .wb-dots {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-right: 10px;
    }

    .wb-dots span {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .wb-tab {
      border: none;
      border-top: 2px solid transparent;
      border-radius: 0;
      padding: 0 13px;
      font-family: var(--font-mono);
      font-size: 11.5px;
      background: transparent;
      cursor: pointer;
      height: 100%;
      white-space: nowrap;
    }

    .wb-pill {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
    }

    .wb-body {
      display: grid;
      grid-template-columns: 44px 235px 1fr;
      min-height: 370px;
    }

    @media (max-width: 960px) {
      .wb-body { grid-template-columns: 1fr; }
      .wb-activity { display: none; }
      .wb-sidebar {
        border-right: none;
        border-bottom: 1px solid transparent;
      }
    }

    .wb-activity {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0;
      gap: 14px;
      border-right: 1px solid transparent;
    }

    .wb-act-icon {
      width: 44px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-left: 2px solid transparent;
      opacity: 0.85;
    }

    .wb-sidebar {
      padding: 12px;
      border-right: 1px solid transparent;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      font-size: 11.5px;
    }

    .wb-sec-head {
      font-family: var(--font-sans);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .wb-file-item {
      padding: 4px 7px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .wb-var-row {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 6px;
      padding: 3px 0;
      font-size: 11px;
    }

    .wb-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .wb-editor {
      margin: 0;
      padding: 14px 0;
      font-family: var(--font-mono);
      font-size: 12.5px;
      line-height: 1.62;
      overflow-x: auto;
      flex: 1;
    }

    .code-line {
      display: flex;
      padding: 0 16px 0 0;
      min-width: max-content;
    }

    .line-num {
      width: 42px;
      padding-right: 14px;
      text-align: right;
      user-select: none;
      flex-shrink: 0;
    }

    .wb-console {
      padding: 10px 16px 12px;
      border-top: 1px solid transparent;
      font-size: 11.5px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ansi-strip {
      display: grid;
      grid-template-columns: repeat(16, minmax(0, 1fr));
      gap: 4px;
      padding-top: 4px;
    }

    .ansi-cell {
      height: 16px;
      border-radius: 3px;
      border: 1px solid rgba(128, 128, 128, 0.28);
      cursor: pointer;
      padding: 0;
      transition: transform 90ms ease;
    }

    .ansi-cell:hover {
      transform: scaleY(1.25);
    }

    .wb-statusbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 5px 12px;
      font-size: 11.5px;
    }

    @keyframes blinkCursor {
      0%, 49% { opacity: 1; }
      50%, 100% { opacity: 0.18; }
    }

    .sim-cursor {
      display: inline-block;
      width: 7px;
      height: 1.12em;
      vertical-align: text-bottom;
      margin-left: 1px;
      animation: blinkCursor 1.1s infinite;
    }

    /* Science Studio Grid */
    .studio-grid {
      display: grid;
      grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
      gap: 16px;
      align-items: start;
    }

    @media (max-width: 1024px) {
      .studio-grid { grid-template-columns: 1fr; }
    }

    .panel-card {
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }

    .panel-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
    }

    .panel-head h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 650;
    }

    .panel-meta {
      font-family: var(--font-mono);
      font-size: 11.5px;
      color: var(--shell-muted);
    }

    .table-scroll {
      overflow-x: auto;
      max-width: 100%;
    }

    table.audit-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .audit-table th {
      text-align: left;
      font-weight: 600;
      color: var(--shell-muted);
      padding: 7px 8px;
      border-bottom: 1px solid var(--shell-border);
      font-size: 11px;
      white-space: nowrap;
    }

    .audit-table td {
      padding: 6.5px 8px;
      border-bottom: 1px solid var(--shell-border);
      font-family: var(--font-mono);
      font-size: 11.5px;
      white-space: nowrap;
    }

    .audit-table tr.token-row {
      cursor: pointer;
      transition: background-color 100ms ease;
    }

    .audit-table tr.token-row:hover {
      background: var(--shell-elevated);
    }

    .audit-table td.role-cell {
      font-family: var(--font-sans);
      font-weight: 500;
    }

    .swatch-chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }

    .swatch-box {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(128, 128, 128, 0.35);
      display: inline-block;
      flex-shrink: 0;
    }

    .canvas-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }

    .canvas-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      border-radius: 8px;
      background: var(--shell-bg);
      border: 1px solid var(--shell-border);
      width: 100%;
      overflow: hidden;
    }

    .canvas-wrap canvas {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .pair-compare {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 8px;
      border-top: 1px solid var(--shell-border);
      font-size: 12px;
      color: var(--shell-muted);
      flex-wrap: wrap;
    }

    /* Env actions, Compare Toggle & Multi-Format Export */
    #env-actions {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .export-group {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      max-width: 100%;
    }

    #export-format {
      padding: 7px 10px;
      max-width: 100%;
    }

    #btn-compare-toggle[aria-pressed="true"],
    #btn-map-toggle[aria-pressed="true"] {
      background: var(--shell-accent);
      color: var(--shell-accent-fg);
      border-color: var(--shell-accent);
      font-weight: 600;
    }

    /* Search & Manufacturer Filter Bar */
    .era-filter-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--shell-border);
    }

    .console-search {
      font-family: var(--font-sans);
      font-size: 12px;
      padding: 6.5px 10px;
      border-radius: 7px;
      border: 1px solid var(--shell-border);
      background: var(--shell-bg);
      color: var(--shell-text);
      flex: 1 1 230px;
      min-width: 180px;
      max-width: 360px;
      outline: none;
      transition: border-color 120ms ease;
    }

    .console-search::placeholder {
      color: var(--shell-muted);
    }

    .console-search:focus {
      border-color: var(--shell-accent);
    }

    .maker-chips {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 5px;
    }

    .maker-chip {
      padding: 5px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 550;
      background: var(--shell-bg);
      border: 1px solid var(--shell-border);
      color: var(--shell-muted);
    }

    .maker-chip:hover {
      color: var(--shell-text);
      border-color: var(--shell-border-strong);
    }

    .maker-chip[aria-pressed="true"] {
      background: var(--shell-text);
      color: var(--shell-bg);
      border-color: var(--shell-text);
      font-weight: 600;
    }

    .filter-count {
      margin-left: auto;
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--shell-muted);
      white-space: nowrap;
    }

    .era-empty {
      padding: 12px 4px 4px;
      font-size: 12.5px;
      color: var(--shell-muted);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
    }

    .era-empty[hidden],
    .era-groups[hidden],
    .compare-strip[hidden],
    .map-strip[hidden] {
      display: none;
    }

    /* Nearest Chromatic Neighbors Strip inside Story Bar */
    .neighbor-bar {
      margin-top: 9px;
      padding-top: 9px;
      border-top: 1px dashed var(--shell-border);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
    }

    .neighbor-lbl {
      font-family: var(--font-mono);
      font-size: 10.5px;
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--shell-muted);
      margin-right: 2px;
    }

    .neighbor-chip-wrap {
      display: inline-flex;
      align-items: stretch;
      border-radius: 6px;
      border: 1px solid var(--shell-border);
      background: var(--shell-bg);
      overflow: hidden;
      transition: border-color 120ms ease;
    }

    .neighbor-chip-wrap:hover {
      border-color: var(--shell-border-strong);
    }

    .neighbor-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3.5px 8px;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--shell-text);
      font-size: 11.5px;
      font-weight: 550;
      cursor: pointer;
    }

    .neighbor-chip:hover {
      background: var(--shell-elevated);
    }

    .neighbor-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      flex-shrink: 0;
      border: 2.5px solid currentColor;
      box-sizing: border-box;
    }

    .neighbor-de {
      font-family: var(--font-mono);
      font-size: 10.5px;
      color: var(--shell-muted);
    }

    .neighbor-cmp-btn {
      padding: 3px 6px;
      border: none;
      border-left: 1px solid var(--shell-border);
      border-radius: 0;
      background: transparent;
      color: var(--shell-muted);
      font-size: 11px;
      cursor: pointer;
    }

    .neighbor-cmp-btn:hover {
      background: var(--shell-elevated);
      color: var(--shell-text);
    }

    .neighbor-sep {
      color: var(--shell-border-strong);
      margin: 0 2px;
      user-select: none;
    }

    /* Interactive Perceptual Similarity Map Strip */
    .map-strip {
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .map-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 268px;
      gap: 14px;
      align-items: stretch;
    }

    .mds-svg-wrap {
      background: var(--shell-bg);
      border: 1px solid var(--shell-border);
      border-radius: 8px;
      overflow: hidden;
      position: relative;
      min-width: 0;
    }

    #mds-svg {
      display: block;
      width: 100%;
      height: auto;
      user-select: none;
    }

    .mds-node {
      cursor: pointer;
      transition: opacity 140ms ease;
    }

    .mds-node:hover .mds-label-bg,
    .mds-node.is-active .mds-label-bg {
      stroke-width: 1.5;
    }

    .mds-node.is-dimmed {
      opacity: 0.24;
    }

    .mds-inspector {
      background: var(--shell-bg);
      border: 1px solid var(--shell-border);
      border-radius: 8px;
      padding: 12px 13px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
    }

    .mds-insp-head {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .mds-insp-kicker {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--shell-muted);
    }

    .mds-insp-title {
      font-size: 14.5px;
      font-weight: 700;
      line-height: 1.25;
      color: var(--shell-text);
    }

    .mds-insp-meta {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--shell-muted);
    }

    .mds-insp-sub {
      font-size: 11.5px;
      color: var(--shell-muted);
      line-height: 1.4;
      margin: 2px 0 0;
    }

    .mds-insp-swatches {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 5px;
    }

    .mds-insp-sw {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      font-family: var(--font-mono);
      font-size: 9.5px;
      color: var(--shell-muted);
    }

    .mds-insp-sw span {
      width: 100%;
      height: 18px;
      border-radius: 4px;
      border: 1px solid var(--shell-border-strong);
    }

    .mds-insp-dist {
      padding: 8px 10px;
      border-radius: 6px;
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      font-family: var(--font-mono);
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .mds-insp-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .mds-insp-actions button {
      flex: 1 1 auto;
      justify-content: center;
      font-size: 11.5px;
      padding: 6px 10px;
    }

    .mds-legend-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 6px 12px;
      font-size: 11px;
      color: var(--shell-muted);
    }

    .era-reset-btn {
      padding: 4px 9px;
      font-size: 11px;
    }

    /* Side-by-Side Compare Strip */
    .compare-strip {
      background: var(--shell-surface);
      border: 1px solid var(--shell-border);
      border-radius: var(--shell-radius);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .compare-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 8px 14px;
    }

    .compare-title-wrap {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 6px 12px;
    }

    .compare-title-wrap h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 650;
    }

    .compare-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      max-width: 100%;
    }

    .compare-label {
      font-size: 12px;
      font-weight: 550;
      color: var(--shell-muted);
    }

    #compare-select {
      padding: 7px 10px;
      max-width: 100%;
    }

    .compare-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .compare-card {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--shell-border-strong);
      border-top-width: 3px;
      font-family: var(--font-mono);
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .compare-card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 6px 10px;
      padding: 8px 12px;
      border-bottom: 1px solid transparent;
      font-family: var(--font-sans);
      font-size: 12px;
    }

    .compare-card-title {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .compare-badge {
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 650;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .compare-meta-sub {
      font-size: 11px;
    }

    .compare-code {
      margin: 0;
      padding: 10px 0;
      font-family: var(--font-mono);
      font-size: 11.5px;
      line-height: 1.55;
      overflow-x: auto;
      flex: 1;
    }

    .compare-metrics {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 6px 12px;
      padding: 7px 12px;
      border-top: 1px solid transparent;
      font-size: 11px;
    }

    .compare-swatches {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 5px;
      padding: 7px 10px 8px;
      border-top: 1px solid transparent;
    }

    .compare-swatch {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 4px 5px;
      border-radius: 5px;
      border: 1px solid rgba(128, 128, 128, 0.28);
      background: transparent;
      font-family: var(--font-mono);
      font-size: 10px;
      font-weight: 550;
      cursor: pointer;
      min-width: 0;
    }

    .compare-swatch-dot {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      border: 1px solid rgba(128, 128, 128, 0.4);
      flex-shrink: 0;
    }

    .toast {
      position: fixed;
      bottom: 18px;
      right: 18px;
      background: var(--shell-text);
      color: var(--shell-bg);
      padding: 8px 14px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 150ms ease, transform 150ms ease;
      z-index: 50;
    }

    .toast[data-visible="true"] {
      opacity: 1;
      transform: translateY(0);
    }

    footer.foot {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      color: var(--shell-muted);
      padding-top: 4px;
    }

    footer.foot a {
      color: var(--shell-text);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* Mobile & Narrow-Viewport Responsive Polish */
    @media (max-width: 780px) {
      .page-wrap {
        padding: 12px 12px 32px;
        gap: 12px;
      }

      .topbar {
        padding: 12px 14px;
        gap: 10px;
      }

      .brand {
        min-width: 0;
      }

      .top-actions {
        width: 100%;
        gap: 6px;
      }

      .export-group {
        flex-wrap: wrap;
        width: 100%;
      }

      #export-format {
        flex: 1 1 160px;
        min-width: 0;
      }

      #env-actions {
        width: 100%;
        gap: 6px;
      }

      .era-filter-bar {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }

      .console-search {
        flex: none;
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }

      .filter-count {
        margin-left: 0;
      }

      .compare-strip,
      .map-strip {
        padding: 12px;
      }

      .map-layout {
        grid-template-columns: 1fr;
      }

      .compare-controls {
        width: 100%;
      }

      #compare-select {
        flex: 1 1 180px;
        min-width: 0;
      }

      .compare-grid {
        grid-template-columns: 1fr;
      }

      .compare-swatches {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .wb-titlebar {
        height: auto;
        flex-wrap: wrap;
        gap: 6px;
        padding: 6px 10px;
      }

      .wb-tabs {
        width: 100%;
        height: auto;
      }

      .wb-tab {
        padding: 6px 10px;
      }

      .wb-body {
        grid-template-columns: 1fr;
      }

      .wb-activity {
        display: none;
      }

      .wb-sidebar {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-right: none;
        border-bottom: 1px solid transparent;
        padding: 10px 12px;
      }

      .ansi-strip {
        grid-template-columns: repeat(8, minmax(0, 1fr));
      }

      .wb-statusbar > div {
        flex-wrap: wrap;
        gap: 6px 12px;
      }

      .panel-card {
        padding: 12px 14px;
      }

      .canvas-wrap canvas {
        max-width: 100%;
        height: auto;
      }
    }
  </style>
</head>
<body data-shell-mode="dark" data-target="${target}" data-initial-theme="">
  <div class="page-wrap">
    <header class="topbar">
      <div class="brand">
        <svg class="brand-gem" viewBox="0 0 36 26" aria-hidden="true">
          <rect id="pad-left" x="1" y="3" width="17" height="20" rx="8" fill="#E6E4DC" />
          <rect id="pad-right" x="18" y="3" width="17" height="20" rx="8" fill="#232B45" />
          <rect x="6" y="11" width="7" height="2.6" rx="0.8" fill="#222834" />
          <rect x="8.2" y="8.8" width="2.6" height="7" rx="0.8" fill="#222834" />
          <circle id="btn-top" cx="26.5" cy="9.2" r="1.9" fill="#34E08C" />
          <circle id="btn-right" cx="29.8" cy="12.5" r="1.9" fill="#FF4D5E" />
          <circle id="btn-bot" cx="26.5" cy="15.8" r="1.9" fill="#38A2FF" />
          <circle id="btn-left" cx="23.2" cy="12.5" r="1.9" fill="#F5C428" />
        </svg>
        <div>
          <h1>Console Palette</h1>
          <p class="brand-sub">49 Years of Gaming Hardware (1977–2026) · 39 Iconic Consoles · 78 OKLCH-Calibrated Themes</p>
        </div>
      </div>

      <div class="top-actions" id="top-actions">
        <button type="button" id="btn-prev-theme" title="Previous theme (Left Arrow)">←</button>
        <button type="button" id="btn-toggle-mode" class="btn-primary" title="Flip Light and Dark variant of current console (T)">
          <span id="toggle-mode-label">Switch to Light</span>
          <span class="kbd-hint">T</span>
        </button>
        <button type="button" id="btn-next-theme" title="Next theme (Right Arrow)">→</button>
        <button type="button" id="btn-random-theme" title="Jump to a random theme (R)">
          Random <span class="kbd-hint">R</span>
        </button>
        <button type="button" id="btn-compare-toggle" aria-pressed="false" title="Toggle side-by-side comparison mode (C)">
          Compare <span class="kbd-hint">C</span>
        </button>
        <button type="button" id="btn-map-toggle" aria-pressed="false" title="Toggle interactive perceptual similarity map (M)">
          Map <span class="kbd-hint">M</span>
        </button>
        <span class="export-group">
          <select id="export-format" aria-label="Export palette format" title="Choose palette export format">
            <option value="vscode">VS Code settings.json</option>
            <option value="ghostty">Ghostty</option>
            <option value="wezterm">WezTerm (TOML)</option>
            <option value="alacritty">Alacritty (TOML)</option>
            <option value="windowsterminal">Windows Terminal (JSON)</option>
            <option value="kitty">Kitty (.conf)</option>
            <option value="iterm2">iTerm2 (.itermcolors)</option>
            <option value="css">CSS Variables</option>
          </select>
          <button type="button" id="btn-copy-export" title="Copy active theme in selected format">Copy Export</button>
        </span>
        <span id="env-actions"></span>
      </div>
    </header>

    <nav class="era-panel era-rail" aria-label="Gaming consoles by hardware era">
      <div class="era-filter-bar">
        <input type="search" id="console-search" class="console-search" placeholder="Filter consoles by name, maker, year, or era… (/)" aria-label="Filter consoles by name, maker, year, or era" autocomplete="off" spellcheck="false" />
        <div class="maker-chips" id="maker-chips" role="group" aria-label="Filter by manufacturer">
          <button type="button" class="maker-chip" data-maker="All" aria-pressed="true">All</button>
          <button type="button" class="maker-chip" data-maker="Atari" aria-pressed="false">Atari</button>
          <button type="button" class="maker-chip" data-maker="Nintendo" aria-pressed="false">Nintendo</button>
          <button type="button" class="maker-chip" data-maker="Sony" aria-pressed="false">Sony</button>
          <button type="button" class="maker-chip" data-maker="Sega" aria-pressed="false">Sega</button>
          <button type="button" class="maker-chip" data-maker="Microsoft" aria-pressed="false">Microsoft</button>
          <button type="button" class="maker-chip" data-maker="Valve" aria-pressed="false">Valve</button>
          <button type="button" class="maker-chip" data-maker="Arcade &amp; Indie" aria-pressed="false">Arcade &amp; Indie</button>
        </div>
        <span class="filter-count" id="filter-count" aria-live="polite">Showing ${totalConsoles} / ${totalConsoles} consoles</span>
      </div>
      <div class="era-groups" id="era-groups"></div>
      <div class="era-empty" id="era-empty" hidden>No matching consoles. <button type="button" id="btn-reset-filters" class="era-reset-btn">Reset filters</button></div>
    </nav>

    <section class="story-bar" aria-labelledby="active-theme-heading">
      <div>
        <div class="story-head">
          <h2 class="story-title" id="active-theme-heading"></h2>
          <span class="story-sub" id="active-theme-subtitle"></span>
        </div>
        <p class="story-text" id="active-theme-story"></p>
        <div class="neighbor-bar" id="neighbor-bar" aria-label="Nearest chromatic neighbors by CIEDE2000"></div>
      </div>

      <div class="control-clusters">
        <div class="seg-group" role="tablist" aria-label="Vision simulation">
          <button type="button" class="seg-btn cvd-btn" data-cvd="normal" role="tab" aria-selected="true">Normal <span class="kbd-hint">1</span></button>
          <button type="button" class="seg-btn cvd-btn" data-cvd="protan" role="tab" aria-selected="false">Protanopia <span class="kbd-hint">2</span></button>
          <button type="button" class="seg-btn cvd-btn" data-cvd="deutan" role="tab" aria-selected="false">Deuteranopia <span class="kbd-hint">3</span></button>
          <button type="button" class="seg-btn cvd-btn" data-cvd="tritan" role="tab" aria-selected="false">Tritanopia <span class="kbd-hint">4</span></button>
        </div>
      </div>
    </section>

    <section class="map-strip" id="map-strip" aria-label="Interactive Perceptual Similarity Map" hidden>
      <div class="compare-head">
        <div class="compare-title-wrap">
          <h2>Perceptual Similarity Map (CIEDE2000 MDS)</h2>
          <span class="panel-meta" id="map-variance-note"></span>
        </div>
        <div class="compare-controls">
          <div class="seg-group" role="group" aria-label="Map polarity">
            <button type="button" class="seg-btn map-mode-btn" data-map-mode="light" aria-pressed="false">Light (39)</button>
            <button type="button" class="seg-btn map-mode-btn" data-map-mode="dark" aria-pressed="true">Dark (39)</button>
          </div>
          <label class="compare-label" for="map-color-by">Color:</label>
          <select id="map-color-by" aria-label="Color map nodes by">
            <option value="swatch">Theme Swatch</option>
            <option value="era">Hardware Era</option>
            <option value="maker">Manufacturer</option>
          </select>
        </div>
      </div>
      <div class="map-layout">
        <div class="mds-svg-wrap">
          <svg id="mds-svg" viewBox="0 0 920 470" role="img" aria-label="2D Classical MDS scatter plot of Console Palette themes in CIEDE2000 color space"></svg>
        </div>
        <aside class="mds-inspector" id="mds-inspector" aria-live="polite"></aside>
      </div>
      <div class="mds-legend-row">
        <span>Inner dot = editor bg · outer ring = signature keyword accent · dotted links = top-3 nearest siblings to active theme</span>
        <span>Click node to activate · Shift+Click to compare</span>
      </div>
    </section>

    <section class="compare-strip" id="compare-strip" aria-label="Side-by-side theme comparison" hidden>
      <div class="compare-head">
        <div class="compare-title-wrap">
          <h2>Side-by-Side Compare</h2>
          <span class="panel-meta" id="compare-vision-note"></span>
        </div>
        <div class="compare-controls">
          <label class="compare-label" for="compare-select">Theme B:</label>
          <select id="compare-select" aria-label="Select comparison theme"></select>
          <button type="button" id="btn-compare-swap" title="Swap Theme A (active) and Theme B (compare target)">Swap A ↔ B</button>
        </div>
      </div>
      <div class="compare-grid" id="compare-grid"></div>
    </section>

    <main class="workbench" id="workbench" aria-label="Simulated Positron and VS Code Workbench">
      <div class="wb-titlebar" id="wb-titlebar">
        <div class="wb-tabs">
          <div class="wb-dots" aria-hidden="true">
            <span id="dot-close"></span>
            <span id="dot-min"></span>
            <span id="dot-max"></span>
          </div>
          <button type="button" class="wb-tab lang-tab" id="tab-r" data-lang="r">color_science.R</button>
          <button type="button" class="wb-tab lang-tab" id="tab-py" data-lang="py">oklch_gamut.py</button>
          <button type="button" class="wb-tab lang-tab" id="tab-ts" data-lang="ts">extension.ts</button>
          <button type="button" class="wb-tab lang-tab" id="tab-qmd" data-lang="qmd">report.qmd</button>
        </div>
        <span class="wb-pill" id="wb-vision-pill"></span>
      </div>

      <div class="wb-body">
        <aside class="wb-activity" id="wb-activity" aria-hidden="true">
          <div class="wb-act-icon" id="act-icon-active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"/></svg>
          </div>
          <div class="wb-act-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </div>
          <div class="wb-act-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="9" r="3"/><path d="M6 9v6M18 12c0 3-3 4-12 4"/></svg>
          </div>
          <div class="wb-act-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></svg>
          </div>
        </aside>

        <aside class="wb-sidebar" id="wb-sidebar">
          <div>
            <div class="wb-sec-head" id="wb-exp-head">Explorer · Workspace</div>
            <div id="wb-file-list"></div>
          </div>
          <div id="wb-positron-pane" style="padding-top:10px;border-top:1px solid transparent">
            <div class="wb-sec-head" id="wb-var-head">Positron · Variables</div>
            <div id="wb-var-list"></div>
          </div>
        </aside>

        <div class="wb-main">
          <pre class="wb-editor" id="wb-editor"></pre>
          <div class="wb-console" id="wb-console">
            <div id="wb-console-lines"></div>
            <div>
              <div class="wb-sec-head" id="wb-ansi-head" style="margin-bottom:4px">Integrated Terminal · 16 ANSI Slots (click any swatch to copy hex)</div>
              <div class="ansi-strip" id="ansi-strip"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="wb-statusbar" id="wb-statusbar">
        <div style="display:flex;align-items:center;gap:14px">
          <span id="sb-git">⎇ main · Positron R 4.4</span>
          <span id="sb-cvd-gate"></span>
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <span id="sb-contrast"></span>
          <strong id="sb-label"></strong>
        </div>
      </div>
    </main>

    <section class="studio-grid" aria-label="Perceptual Colorimetry Audit">
      <div class="panel-card">
        <div class="panel-head">
          <h2>Perceptual Token Inspector (click any row to copy hex)</h2>
          <span class="panel-meta" id="audit-summary-badge"></span>
        </div>
        <div class="table-scroll">
          <table class="audit-table">
            <thead>
              <tr>
                <th>Semantic Role</th>
                <th>Hex</th>
                <th>OKLCH (L% · C · H°)</th>
                <th>WCAG / bg</th>
                <th>WCAG / line</th>
                <th>APCA |Lc|</th>
              </tr>
            </thead>
            <tbody id="audit-tbody"></tbody>
          </table>
        </div>
      </div>

      <div class="canvas-stack">
        <div class="panel-card">
          <div class="panel-head">
            <h2>OKLab a–b Chromaticity Polygon</h2>
            <span class="panel-meta" id="chroma-meta">Solid = active · Dashed = Light/Dark sibling</span>
          </div>
          <div class="canvas-wrap">
            <canvas id="canvas-chroma" width="320" height="260"></canvas>
          </div>
          <div class="pair-compare" id="pair-compare-box"></div>
        </div>

        <div class="panel-card">
          <div class="panel-head">
            <h2>OKLCH Lightness Staggering &amp; CVD Safety</h2>
            <span class="panel-meta" id="cvd-min-readout"></span>
          </div>
          <div class="canvas-wrap">
            <canvas id="canvas-lightness" width="320" height="190"></canvas>
          </div>
        </div>
      </div>
    </section>

    <footer class="foot">
      <span>Every color synthesized in OKLCH &amp; verified against WCAG 2.1, APCA-W3, CIEDE2000 &amp; Machado et al. (2009) dichromacy matrices. Zero copyrighted console logos or artwork.</span>
      <span id="footer-links"></span>
    </footer>
  </div>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  ${scriptOpen}
    (function () {
      'use strict';

      const THEMES = ${serializedData};
      const ERAS = ${serializedEras};
      const MDS_META = ${serializedMdsMeta};
      const IS_WEB = document.body.dataset.target === 'web';
      const vscodeApi = (!IS_WEB && typeof acquireVsCodeApi === 'function') ? acquireVsCodeApi() : null;

      // --- Colorimetry Math ---
      function hexToRgb(hex) {
        const h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      function rgbToHex(r, g, b) {
        const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0').toUpperCase();
        return '#' + c(r) + c(g) + c(b);
      }
      function srgbToLin(c) {
        const u = c / 255;
        return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4);
      }
      function linToSrgb(u) {
        const x = Math.max(0, Math.min(1, u));
        return (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255;
      }
      const CVD_MATRICES = {
        protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
        deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
        tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]],
      };
      function simHex(hex, mode) {
        if (!mode || mode === 'normal') return hex;
        const [r, g, b] = hexToRgb(hex).map(srgbToLin);
        const m = CVD_MATRICES[mode];
        return rgbToHex(
          linToSrgb(m[0][0] * r + m[0][1] * g + m[0][2] * b),
          linToSrgb(m[1][0] * r + m[1][1] * g + m[1][2] * b),
          linToSrgb(m[2][0] * r + m[2][1] * g + m[2][2] * b)
        );
      }
      function hexToOklch(hex) {
        const [r, g, b] = hexToRgb(hex).map(srgbToLin);
        const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
        const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
        const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
        const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
        const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
        const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
        return { L, C: Math.hypot(a, b2), H: (Math.atan2(b2, a) * 180 / Math.PI + 360) % 360, a, b: b2 };
      }
      function hexToLab(hex) {
        const [r, g, b] = hexToRgb(hex).map(srgbToLin);
        const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
        const y = (0.2126729 * r + 0.7151522 * g + 0.0721750 * b);
        const z = (0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883;
        const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
        const fx = f(x), fy = f(y), fz = f(z);
        return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
      }
      function deltaE76(h1, h2) {
        const a = hexToLab(h1), b = hexToLab(h2);
        return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
      }
      function relLum(hex) {
        const [r, g, b] = hexToRgb(hex).map(srgbToLin);
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      }
      function wcag(h1, h2) {
        const l1 = relLum(h1), l2 = relLum(h2);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      }
      function apcaLc(txtHex, bgHex) {
        const lin = (h) => hexToRgb(h).map((c) => Math.pow(c / 255, 2.4));
        const yOf = ([r, g, b]) => {
          const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
          return y > 0.022 ? y : y + Math.pow(0.022 - y, 1.414);
        };
        const yt = yOf(lin(txtHex)), yb = yOf(lin(bgHex));
        if (Math.abs(yb - yt) < 0.0005) return 0;
        if (yb > yt) {
          const s = (Math.pow(yb, 0.56) - Math.pow(yt, 0.57)) * 1.14;
          return s < 0.1 ? 0 : (s - 0.027) * 100;
        }
        const s = (Math.pow(yb, 0.65) - Math.pow(yt, 0.62)) * 1.14;
        return s > -0.1 ? 0 : (s + 0.027) * 100;
      }

      // --- State ---
      let activeSlug = 'snes-dark';
      let workbenchActiveLabel = document.body.dataset.initialTheme || '';
      let activeLang = 'r';
      let activeCvd = 'normal';
      let liveSyncWorkbench = false;
      let searchQuery = '';
      let activeMaker = 'All';
      let compareEnabled = false;
      let compareSlug = null;
      let compareUserPinned = false;
      let mapEnabled = false;
      let mapMode = 'dark';
      let mapModePinned = false;
      let mapColorBy = 'swatch';
      let mapHoverSlug = null;

      const TOTAL_CONSOLES = ERAS.reduce((acc, g) => acc + g.consoles.length, 0);

      function parseUrlHash(rawHash) {
        const cleaned = String(rawHash || '').replace(/^#/, '').trim();
        if (!cleaned) return {};
        const parts = cleaned.split('&');
        const out = {};
        if (parts[0] && !parts[0].includes('=')) out.slug = decodeURIComponent(parts[0]);
        for (const p of parts) {
          const eq = p.indexOf('=');
          if (eq <= 0) continue;
          const k = decodeURIComponent(p.slice(0, eq));
          const v = decodeURIComponent(p.slice(eq + 1));
          out[k] = v;
        }
        return out;
      }

      function applyHashState(rawHash) {
        const parsed = parseUrlHash(rawHash);
        let changed = false;
        compareEnabled = false;
        compareSlug = null;
        compareUserPinned = false;
        activeCvd = 'normal';
        mapEnabled = false;
        mapModePinned = false;
        if (parsed.slug && THEMES.some((t) => t.slug === parsed.slug)) {
          activeSlug = parsed.slug;
          changed = true;
        }
        if (parsed.compare && THEMES.some((t) => t.slug === parsed.compare)) {
          compareEnabled = true;
          compareSlug = parsed.compare;
          compareUserPinned = true;
          changed = true;
        } else if (parsed.compare === '1') {
          compareEnabled = true;
          changed = true;
        }
        if (parsed.cvd && ['normal', 'protan', 'deutan', 'tritan'].includes(parsed.cvd)) {
          activeCvd = parsed.cvd;
          changed = true;
        }
        if (parsed.map === '1' || parsed.map === 'light' || parsed.map === 'dark') {
          mapEnabled = true;
          if (parsed.map === 'light' || parsed.map === 'dark') {
            mapMode = parsed.map;
            mapModePinned = true;
          }
          changed = true;
        }
        return changed;
      }

      function buildShareHash() {
        const parts = [activeSlug];
        if (compareEnabled) {
          const cmp = compareSlug || (findSibling(getActiveTheme()) || {}).slug;
          if (cmp) parts.push('compare=' + encodeURIComponent(cmp));
        }
        if (activeCvd !== 'normal') parts.push('cvd=' + encodeURIComponent(activeCvd));
        if (mapEnabled) parts.push('map=' + (mapModePinned ? mapMode : '1'));
        return '#' + parts.join('&');
      }

      function syncUrlHash() {
        if (!IS_WEB || !window.history || !window.history.replaceState) return;
        const nextHash = buildShareHash();
        if (window.location.hash !== nextHash) {
          window.history.replaceState(null, '', nextHash);
        }
      }

      // Initialize starting theme & view state from VS Code active theme or URL hash
      if (workbenchActiveLabel) {
        const match = THEMES.find((t) => t.label === workbenchActiveLabel);
        if (match) activeSlug = match.slug;
      } else if (IS_WEB && window.location.hash) {
        applyHashState(window.location.hash);
      }

      function escHtml(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function getActiveTheme() {
        return THEMES.find((x) => x.slug === activeSlug) || THEMES[0];
      }

      function matchesMaker(th, maker) {
        if (!maker || maker === 'All') return true;
        if (maker === 'Microsoft') return th.maker.includes('Microsoft');
        if (maker === 'Arcade & Indie') return ['NEC / Hudson', 'SNK', 'Panic'].includes(th.maker);
        return th.maker === maker;
      }

      function matchesConsoleFilter(th) {
        if (!matchesMaker(th, activeMaker)) return false;
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        const hay = [
          th.console,
          th.shortConsole,
          th.label,
          th.maker,
          String(th.year),
          th.era,
          th.subtitle,
          th.slug,
        ].join(' ').toLowerCase();
        return q.split(/\\s+/).every((part) => hay.includes(part));
      }

      function getNavigableThemes() {
        const filtered = THEMES.filter((t) => matchesConsoleFilter(t));
        return filtered.length > 0 ? filtered : THEMES;
      }

      let toastTimer = null;
      function showToast(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.dataset.visible = 'true';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { el.dataset.visible = 'false'; }, 1900);
      }

      function copyText(txt, label) {
        const toastMsg = label || ('Copied ' + txt);
        if (vscodeApi) {
          vscodeApi.postMessage({ type: 'copyText', text: txt });
          showToast(toastMsg);
          return;
        }
        const fallbackCopy = () => {
          try {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          } catch (_) {}
          showToast(toastMsg);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(() => showToast(toastMsg)).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
      }

      function findSibling(th) {
        const other = th.mode === 'light' ? 'dark' : 'light';
        return THEMES.find((x) => x.console === th.console && x.mode === other);
      }

      function getCompareTheme(cur) {
        if (compareUserPinned && compareSlug) {
          const pinned = THEMES.find((x) => x.slug === compareSlug);
          if (pinned) return pinned;
        }
        const sib = findSibling(cur) || THEMES.find((x) => x.slug !== cur.slug) || cur;
        compareSlug = sib.slug;
        return sib;
      }

      function formatPaletteExport(th, fmt) {
        const t = th.t;
        const a = th.ansi;
        const ansiOrder = [
          'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
          'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite',
        ];
        if (fmt === 'vscode') {
          return {
            text: '"workbench.colorTheme": "' + th.label + '"',
            label: 'Copied VS Code settings.json for ' + th.label,
          };
        }
        if (fmt === 'ghostty') {
          const lines = [
            '# Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ')',
            'background = ' + t.bg,
            'foreground = ' + t.fg,
            'cursor-color = ' + t.cur,
            'cursor-text = ' + t.bg,
            'selection-background = ' + t.tintSelect,
            'selection-foreground = ' + t.fg,
          ];
          ansiOrder.forEach((slot, idx) => {
            lines.push('palette = ' + idx + '=' + a[slot]);
          });
          return {
            text: lines.join('\\n'),
            label: 'Copied Ghostty theme for ' + th.label,
          };
        }
        if (fmt === 'wezterm') {
          const lines = [
            '# Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ')',
            '[metadata]',
            'name = "' + th.label + '"',
            'author = "Console Palette"',
            '',
            '[colors]',
            'foreground = "' + t.fg + '"',
            'background = "' + t.bg + '"',
            'cursor_bg = "' + t.cur + '"',
            'cursor_fg = "' + t.bg + '"',
            'cursor_border = "' + t.cur + '"',
            'selection_bg = "' + t.tintSelect + '"',
            'selection_fg = "' + t.fg + '"',
            'ansi = [',
          ];
          ansiOrder.slice(0, 8).forEach((slot) => {
            lines.push('  "' + a[slot] + '",');
          });
          lines.push(']');
          lines.push('brights = [');
          ansiOrder.slice(8).forEach((slot) => {
            lines.push('  "' + a[slot] + '",');
          });
          lines.push(']');
          return {
            text: lines.join('\\n'),
            label: 'Copied WezTerm TOML for ' + th.label,
          };
        }
        if (fmt === 'alacritty') {
          const lines = [
            '# Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ')',
            '[colors.primary]',
            'background = "' + t.bg + '"',
            'foreground = "' + t.fg + '"',
            '',
            '[colors.cursor]',
            'text = "' + t.bg + '"',
            'cursor = "' + t.cur + '"',
            '',
            '[colors.selection]',
            'text = "' + t.fg + '"',
            'background = "' + t.tintSelect + '"',
            '',
            '[colors.normal]',
            'black = "' + a.black + '"',
            'red = "' + a.red + '"',
            'green = "' + a.green + '"',
            'yellow = "' + a.yellow + '"',
            'blue = "' + a.blue + '"',
            'magenta = "' + a.magenta + '"',
            'cyan = "' + a.cyan + '"',
            'white = "' + a.white + '"',
            '',
            '[colors.bright]',
            'black = "' + a.brightBlack + '"',
            'red = "' + a.brightRed + '"',
            'green = "' + a.brightGreen + '"',
            'yellow = "' + a.brightYellow + '"',
            'blue = "' + a.brightBlue + '"',
            'magenta = "' + a.brightMagenta + '"',
            'cyan = "' + a.brightCyan + '"',
            'white = "' + a.brightWhite + '"',
          ];
          return {
            text: lines.join('\\n'),
            label: 'Copied Alacritty TOML for ' + th.label,
          };
        }
        if (fmt === 'windowsterminal') {
          const scheme = {
            name: 'Console Palette — ' + th.label,
            background: t.bg,
            foreground: t.fg,
            cursorColor: t.cur,
            selectionBackground: t.tintSelect,
            black: a.black,
            red: a.red,
            green: a.green,
            yellow: a.yellow,
            blue: a.blue,
            purple: a.magenta,
            cyan: a.cyan,
            white: a.white,
            brightBlack: a.brightBlack,
            brightRed: a.brightRed,
            brightGreen: a.brightGreen,
            brightYellow: a.brightYellow,
            brightBlue: a.brightBlue,
            brightPurple: a.brightMagenta,
            brightCyan: a.brightCyan,
            brightWhite: a.brightWhite,
          };
          return {
            text: JSON.stringify(scheme, null, 2),
            label: 'Copied Windows Terminal JSON for ' + th.label,
          };
        }
        if (fmt === 'kitty') {
          const lines = [
            '# Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ')',
            'background ' + t.bg,
            'foreground ' + t.fg,
            'cursor ' + t.cur,
            'cursor_text_color ' + t.bg,
            'selection_background ' + t.tintSelect,
            'selection_foreground ' + t.fg,
            'active_border_color ' + t.foc,
            'inactive_border_color ' + t.borderSubtle,
          ];
          ansiOrder.forEach((slot, idx) => {
            lines.push('color' + idx + ' ' + a[slot]);
          });
          return {
            text: lines.join('\\n'),
            label: 'Copied Kitty config for ' + th.label,
          };
        }
        if (fmt === 'iterm2') {
          const itermEntry = (keyName, hexVal) => {
            const [r, g, b] = hexToRgb(hexVal.slice(0, 7));
            return [
              '  <key>' + keyName + '</key>',
              '  <dict>',
              '    <key>Color Space</key>',
              '    <string>sRGB</string>',
              '    <key>Red Component</key>',
              '    <real>' + (r / 255).toFixed(6) + '</real>',
              '    <key>Green Component</key>',
              '    <real>' + (g / 255).toFixed(6) + '</real>',
              '    <key>Blue Component</key>',
              '    <real>' + (b / 255).toFixed(6) + '</real>',
              '  </dict>',
            ].join('\\n');
          };
          const blocks = [
            itermEntry('Background Color', t.bg),
            itermEntry('Foreground Color', t.fg),
            itermEntry('Bold Color', t.fg),
            itermEntry('Cursor Color', t.cur),
            itermEntry('Cursor Text Color', t.bg),
            itermEntry('Selection Color', t.tintSelect),
            itermEntry('Selected Text Color', t.fg),
          ];
          ansiOrder.forEach((slot, idx) => {
            blocks.push(itermEntry('Ansi ' + idx + ' Color', a[slot]));
          });
          const xml = [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
            '<plist version="1.0">',
            '<!-- Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ') -->',
            '<dict>',
            blocks.join('\\n'),
            '</dict>',
            '</plist>',
          ].join('\\n');
          return {
            text: xml,
            label: 'Copied iTerm2 .itermcolors XML for ' + th.label,
          };
        }
        const cssLines = [
          '/* Console Palette — ' + th.label + ' (' + th.year + ' · ' + th.maker + ') */',
          ':root {',
          '  --cp-bg: ' + t.bg + ';',
          '  --cp-bg-line: ' + t.bgLine + ';',
          '  --cp-bg-sidebar: ' + t.bgSidebar + ';',
          '  --cp-bg-panel: ' + t.bgPanel + ';',
          '  --cp-fg: ' + t.fg + ';',
          '  --cp-fg-secondary: ' + t.fgSecondary + ';',
          '  --cp-fg-muted: ' + t.fgMuted + ';',
          '  --cp-fg-comment: ' + t.fgComment + ';',
          '  --cp-border: ' + t.borderSubtle + ';',
          '  --cp-selection: ' + t.tintSelect + ';',
          '  --cp-cursor: ' + t.cur + ';',
          '  --cp-focus: ' + t.foc + ';',
          '  --cp-keyword: ' + t.kw + ';',
          '  --cp-storage: ' + t.stor + ';',
          '  --cp-string: ' + t.str + ';',
          '  --cp-regex: ' + t.rx + ';',
          '  --cp-function: ' + t.fn + ';',
          '  --cp-type: ' + t.type + ';',
          '  --cp-interface: ' + t.iface + ';',
          '  --cp-number: ' + t.num + ';',
          '  --cp-decorator: ' + t.dec + ';',
          '  --cp-namespace: ' + t.ns + ';',
          '  --cp-error: ' + t.err + ';',
          '  --cp-warning: ' + t.warn + ';',
          '  --cp-info: ' + t.info + ';',
        ];
        ansiOrder.forEach((slot, idx) => {
          cssLines.push('  --cp-ansi-' + idx + ': ' + a[slot] + ';');
        });
        cssLines.push('}');
        return {
          text: cssLines.join('\\n'),
          label: 'Copied CSS Variables for ' + th.label,
        };
      }

      // Populate Compare target dropdown with all 78 themes
      const compareSelect = document.getElementById('compare-select');
      THEMES.forEach((t) => {
        const opt = document.createElement('option');
        opt.value = t.slug;
        opt.textContent = t.label + ' (' + t.year + ' · ' + t.maker + ')';
        compareSelect.appendChild(opt);
      });

      // Environment-specific action buttons
      const envWrap = document.getElementById('env-actions');
      const footLinks = document.getElementById('footer-links');
      if (vscodeApi) {
        envWrap.innerHTML =
          '<button type="button" id="btn-apply-vscode">Apply to Workbench</button>' +
          '<label class="sync-toggle" title="Automatically apply every clicked theme to your Positron / VS Code window">' +
          '<input type="checkbox" id="chk-live-sync" /> Live-sync IDE</label>';
        footLinks.textContent = 'Running inside VS Code / Positron Webview · Strict offline CSP';

        document.getElementById('btn-apply-vscode').addEventListener('click', () => {
          const cur = getActiveTheme();
          if (cur) {
            workbenchActiveLabel = cur.label;
            vscodeApi.postMessage({ type: 'applyTheme', label: cur.label });
            showToast('Applied "' + cur.label + '" to Workbench');
            render();
          }
        });
        document.getElementById('chk-live-sync').addEventListener('change', (e) => {
          liveSyncWorkbench = !!e.target.checked;
          if (liveSyncWorkbench) {
            const cur = getActiveTheme();
            if (cur) {
              workbenchActiveLabel = cur.label;
              vscodeApi.postMessage({ type: 'applyTheme', label: cur.label });
            }
          }
          render();
        });
        window.addEventListener('message', (event) => {
          const msg = event.data;
          if (msg && msg.type === 'activeThemeChanged' && msg.label) {
            workbenchActiveLabel = msg.label;
            const match = THEMES.find((t) => t.label === msg.label);
            if (match && match.slug !== activeSlug) {
              activeSlug = match.slug;
            }
            render();
          }
        });
      } else {
        envWrap.innerHTML =
          '<button type="button" id="btn-share-url" title="Copy direct link to this theme">Share Link</button>' +
          '<a class="btn-link" href="vscode:extension/idesofmerge.console-palette" title="Open extension in VS Code">Install in VS Code</a>' +
          '<a class="btn-link" href="https://github.com/idesofmerge/console-palette" target="_blank" rel="noopener">GitHub ↗</a>';
        footLinks.innerHTML =
          '<a href="https://github.com/idesofmerge/console-palette#color-science" target="_blank" rel="noopener">Color-Science Write-Up</a> · ' +
          '<a href="https://github.com/idesofmerge/console-palette" target="_blank" rel="noopener">MIT License</a>';

        document.getElementById('btn-share-url').addEventListener('click', () => {
          const url = window.location.origin + window.location.pathname + buildShareHash();
          copyText(url, 'Copied direct link (' + buildShareHash() + ')');
        });
      }

      function selectSlug(slug, fromUserAction) {
        activeSlug = slug;
        const cur = getActiveTheme();
        if (!mapModePinned) mapMode = cur.mode;
        syncUrlHash();
        if (fromUserAction && vscodeApi && liveSyncWorkbench) {
          workbenchActiveLabel = cur.label;
          vscodeApi.postMessage({ type: 'applyTheme', label: cur.label });
        }
        render();
      }

      function openCompareWith(slug) {
        if (!THEMES.some((t) => t.slug === slug)) return;
        compareEnabled = true;
        compareSlug = slug;
        compareUserPinned = true;
        syncUrlHash();
        render();
      }

      // Render 7-era chronological console selector strip with search & maker filtering
      function renderEraRail(cur) {
        document.querySelectorAll('.maker-chip').forEach((chip) => {
          chip.setAttribute('aria-pressed', String(chip.dataset.maker === activeMaker));
        });

        const container = document.getElementById('era-groups');
        const emptyHint = document.getElementById('era-empty');
        const countEl = document.getElementById('filter-count');
        container.innerHTML = '';

        let visibleCount = 0;
        ERAS.forEach((group) => {
          const matching = [];
          group.consoles.forEach((consoleName) => {
            const target = THEMES.find((t) => t.console === consoleName && t.mode === cur.mode) || THEMES.find((t) => t.console === consoleName);
            if (target && matchesConsoleFilter(target)) matching.push(target);
          });
          if (matching.length === 0) return;

          const block = document.createElement('div');
          block.className = 'era-block';
          const lbl = document.createElement('div');
          lbl.className = 'era-label';
          lbl.textContent = group.era;
          block.appendChild(lbl);

          const pills = document.createElement('div');
          pills.className = 'era-pills';
          matching.forEach((target) => {
            visibleCount++;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'game-pill';
            btn.setAttribute('aria-pressed', String(target.console === cur.console));
            btn.title = target.console + ' (' + target.year + ' · ' + target.maker + ') — ' + target.subtitle;

            const strip = document.createElement('span');
            strip.className = 'mini-strip';
            [target.t.bg, target.t.kw, target.t.str, target.t.fn, target.t.type].forEach((hx) => {
              const s = document.createElement('span');
              s.style.backgroundColor = simHex(hx, activeCvd);
              strip.appendChild(s);
            });
            btn.appendChild(strip);
            btn.appendChild(document.createTextNode(target.shortConsole));
            btn.addEventListener('click', () => selectSlug(target.slug, true));
            pills.appendChild(btn);
          });
          block.appendChild(pills);
          container.appendChild(block);
        });

        countEl.textContent = 'Showing ' + visibleCount + ' / ' + TOTAL_CONSOLES + ' consoles';
        container.hidden = visibleCount === 0;
        emptyHint.hidden = visibleCount > 0;
      }

      function sp(color, text, extra) {
        return '<span style="color:' + color + (extra ? ';' + extra : '') + '">' + text + '</span>';
      }

      function buildCodeSample(c, lang, th) {
        const cur = '<span class="sim-cursor" style="background:' + c.cur + '"></span>';
        if (lang === 'r') {
          return [
            sp(c.fgComment, '# Console Palette · Perceptual OKLCH & CIEDE2000 audit in Positron', 'font-style:italic'),
            sp(c.fn, 'library') + sp(c.fgPunct, '(') + sp(c.ns, 'tidyverse') + sp(c.fgPunct, ')'),
            '',
            sp(c.dec, '#| label: verify-' + escHtml(th.slug), 'font-style:italic'),
            sp(c.fn, 'audit_theme') + ' ' + sp(c.kw, '&lt;-', 'font-weight:700') + ' ' + sp(c.kw, 'function', 'font-weight:700') + sp(c.fgPunct, '(') + sp(c.fgParameter, 'palette_df', 'font-style:italic') + sp(c.fgPunct, ', ') + sp(c.fgParameter, 'min_aa', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, '4.5') + sp(c.fgPunct, ') {'),
            '  ' + sp(c.fgVariable, 'verified') + ' ' + sp(c.kw, '&lt;-', 'font-weight:700') + ' ' + sp(c.fgParameter, 'palette_df', 'font-style:italic') + ' ' + sp(c.kw, '|&gt;', 'font-weight:700'),
            '    ' + sp(c.ns, 'dplyr') + sp(c.fgPunct, '::') + sp(c.fn, 'filter') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'console') + ' ' + sp(c.fgPunct, '==') + ' ' + sp(c.str, '"' + escHtml(th.console) + '"') + sp(c.fgPunct, ')') + ' ' + sp(c.kw, '|&gt;', 'font-weight:700'),
            '    ' + sp(c.fn, 'mutate') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'aa_ok') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.fgVariable, 'wcag_ratio') + ' ' + sp(c.fgPunct, '&gt;=') + ' ' + sp(c.fgParameter, 'min_aa', 'font-style:italic') + sp(c.fgPunct, ', ') + sp(c.fgProperty, 'year') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year) + 'L') + sp(c.fgPunct, ')'),
            '  ' + sp(c.kw, 'return', 'font-weight:700') + sp(c.fgPunct, '(') + sp(c.fgVariable, 'verified') + sp(c.fgPunct, ')') + cur,
            sp(c.fgPunct, '}'),
          ];
        }
        if (lang === 'py') {
          return [
            sp(c.fgComment, '# Binary-search OKLCH gamut mapper &amp; Machado (2009) cone transform', 'font-style:italic'),
            sp(c.kw, 'from', 'font-weight:700') + ' ' + sp(c.ns, 'dataclasses') + ' ' + sp(c.kw, 'import', 'font-weight:700') + ' ' + sp(c.fn, 'dataclass'),
            sp(c.kw, 'import', 'font-weight:700') + ' ' + sp(c.ns, 're'),
            '',
            sp(c.dec, '@dataclass(frozen=True)', 'font-style:italic'),
            sp(c.stor, 'class', 'font-style:italic') + ' ' + sp(c.type, 'ConsoleSpec', 'font-weight:700') + sp(c.fgPunct, ':'),
            '    ' + sp(c.fgProperty, 'slug') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'str', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.str, '"' + escHtml(th.slug) + '"'),
            '    ' + sp(c.fgProperty, 'release_year') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'int', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year)),
            '',
            sp(c.stor, 'def', 'font-style:italic') + ' ' + sp(c.fn, 'is_valid_hex') + sp(c.fgPunct, '(') + sp(c.fgParameter, 'token', 'font-style:italic') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'str', 'font-style:italic') + sp(c.fgPunct, ') -&gt;') + ' ' + sp(c.iface, 'bool', 'font-style:italic') + sp(c.fgPunct, ':'),
            '    ' + sp(c.kw, 'return', 'font-weight:700') + ' ' + sp(c.ns, 're') + sp(c.fgPunct, '.') + sp(c.fn, 'match') + sp(c.fgPunct, '(') + sp(c.rx, 'r"^#[0-9A-F]{6}$"') + sp(c.fgPunct, ', ') + sp(c.fgParameter, 'token', 'font-style:italic') + sp(c.fgPunct, ')') + ' ' + sp(c.kw, 'is not', 'font-weight:700') + ' ' + sp(c.num, 'None') + cur,
          ];
        }
        if (lang === 'ts') {
          return [
            sp(c.fgComment, '// Live-preview QuickPick &amp; smart per-console Light/Dark toggle', 'font-style:italic'),
            sp(c.kw, 'export', 'font-weight:700') + ' ' + sp(c.stor, 'interface', 'font-style:italic') + ' ' + sp(c.iface, 'ConsoleThemeEntry', 'font-style:italic') + ' ' + sp(c.fgPunct, '{'),
            '  ' + sp(c.stor, 'readonly', 'font-style:italic') + ' ' + sp(c.fgProperty, 'label') + sp(c.fgPunct, ':') + ' ' + sp(c.type, 'string', 'font-weight:700') + sp(c.fgPunct, ';'),
            '  ' + sp(c.fgProperty, 'mode') + sp(c.fgPunct, ':') + ' ' + sp(c.str, '"light"') + ' ' + sp(c.kw, '|', 'font-weight:700') + ' ' + sp(c.str, '"dark"') + sp(c.fgPunct, ';'),
            sp(c.fgPunct, '}'),
            '',
            sp(c.dec, '@command', 'font-style:italic') + sp(c.fgPunct, '(') + sp(c.str, '"consolePalette.toggleTheme"') + sp(c.fgPunct, ')'),
            sp(c.kw, 'export async', 'font-weight:700') + ' ' + sp(c.stor, 'function', 'font-style:italic') + ' ' + sp(c.fn, 'activatePair') + sp(c.fgPunct, '(') + sp(c.fgParameter, 'entry', 'font-style:italic') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'ConsoleThemeEntry', 'font-style:italic') + sp(c.fgPunct, ') {'),
            '  ' + sp(c.stor, 'const', 'font-style:italic') + ' ' + sp(c.fgVariable, 'themesTotal') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(THEMES.length)) + sp(c.fgPunct, ';'),
            '  ' + sp(c.kw, 'await', 'font-weight:700') + ' ' + sp(c.ns, 'workbench') + sp(c.fgPunct, '.') + sp(c.fn, 'setColorTheme') + sp(c.fgPunct, '(') + sp(c.str, '"' + escHtml(th.label) + '"') + sp(c.fgPunct, ')') + cur,
            sp(c.fgPunct, '}'),
          ];
        }
        return [
          sp(c.fgPunct, '---'),
          sp(c.fgProperty, 'title') + sp(c.fgPunct, ': ') + sp(c.str, '"' + escHtml(th.label) + ' — Colorimetry Report"'),
          sp(c.fgProperty, 'format') + sp(c.fgPunct, ': ') + sp(c.type, 'html', 'font-weight:700'),
          sp(c.fgPunct, '---'),
          '',
          sp(c.kw, '## ' + escHtml(th.console) + ' (' + th.year + ' · ' + escHtml(th.maker) + ')', 'font-weight:700'),
          '',
          sp(c.fg, 'Every foreground &amp; syntax token clears ') + sp(c.fg, '**WCAG 2.1 AA (4.5:1)**', 'font-weight:700') + sp(c.fg, ' on ') + sp(c.type, '\\x60editor.background\\x60') + sp(c.fg, '.'),
          '',
          sp(c.dec, '\\x60\\x60\\x60{sql}', 'font-style:italic'),
          sp(c.kw, 'SELECT', 'font-weight:700') + ' ' + sp(c.fgProperty, 'slug') + sp(c.fgPunct, ', ') + sp(c.fn, 'MIN') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'wcag_ratio') + sp(c.fgPunct, ') ') + sp(c.kw, 'AS', 'font-weight:700') + ' ' + sp(c.fgVariable, 'tightest_role') + ' ' + sp(c.kw, 'FROM', 'font-weight:700') + ' ' + sp(c.type, 'palettes', 'font-weight:700') + ' ' + sp(c.kw, 'WHERE', 'font-weight:700') + ' ' + sp(c.fgProperty, 'year') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year)) + sp(c.fgPunct, ';') + cur,
          sp(c.dec, '\\x60\\x60\\x60', 'font-style:italic'),
        ];
      }

      function buildMiniCodeSample(c, lang, th) {
        const cur = '<span class="sim-cursor" style="background:' + c.cur + '"></span>';
        if (lang === 'r') {
          return [
            sp(c.fgComment, '# ' + escHtml(th.label) + ' · OKLCH contrast check', 'font-style:italic'),
            sp(c.fn, 'verify') + ' ' + sp(c.kw, '&lt;-', 'font-weight:700') + ' ' + sp(c.kw, 'function', 'font-weight:700') + sp(c.fgPunct, '(') + sp(c.fgParameter, 'df', 'font-style:italic') + sp(c.fgPunct, ', ') + sp(c.fgParameter, 'floor', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, '4.5') + sp(c.fgPunct, ') {'),
            '  ' + sp(c.fgParameter, 'df', 'font-style:italic') + ' ' + sp(c.kw, '|&gt;', 'font-weight:700') + ' ' + sp(c.ns, 'dplyr') + sp(c.fgPunct, '::') + sp(c.fn, 'filter') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'console') + ' ' + sp(c.fgPunct, '==') + ' ' + sp(c.str, '"' + escHtml(th.console) + '"') + sp(c.fgPunct, ')') + ' ' + sp(c.kw, '|&gt;', 'font-weight:700'),
            '    ' + sp(c.fn, 'mutate') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'ok') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.fgVariable, 'ratio') + ' ' + sp(c.fgPunct, '&gt;=') + ' ' + sp(c.fgParameter, 'floor', 'font-style:italic') + sp(c.fgPunct, ', ') + sp(c.fgProperty, 'yr') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year) + 'L') + sp(c.fgPunct, ')'),
            '  ' + sp(c.kw, 'return', 'font-weight:700') + sp(c.fgPunct, '(') + sp(c.fgVariable, 'ok') + sp(c.fgPunct, ')') + cur,
            sp(c.fgPunct, '}'),
          ];
        }
        if (lang === 'py') {
          return [
            sp(c.fgComment, '# ' + escHtml(th.label) + ' · OKLCH gamut &amp; CVD check', 'font-style:italic'),
            sp(c.dec, '@dataclass(frozen=True)', 'font-style:italic'),
            sp(c.stor, 'class', 'font-style:italic') + ' ' + sp(c.type, 'PaletteSpec', 'font-weight:700') + sp(c.fgPunct, ':'),
            '    ' + sp(c.fgProperty, 'slug') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'str', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.str, '"' + escHtml(th.slug) + '"'),
            '    ' + sp(c.fgProperty, 'year') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'int', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year)) + '  ' + sp(c.fgComment, '# ' + escHtml(th.maker), 'font-style:italic') + cur,
            '    ' + sp(c.fgProperty, 'wcag_aa') + sp(c.fgPunct, ':') + ' ' + sp(c.iface, 'bool', 'font-style:italic') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, 'True'),
          ];
        }
        if (lang === 'ts') {
          return [
            sp(c.fgComment, '// ' + escHtml(th.label) + ' · Workbench Theme Spec', 'font-style:italic'),
            sp(c.kw, 'export', 'font-weight:700') + ' ' + sp(c.stor, 'interface', 'font-style:italic') + ' ' + sp(c.iface, 'ThemePair', 'font-style:italic') + ' ' + sp(c.fgPunct, '{'),
            '  ' + sp(c.stor, 'readonly', 'font-style:italic') + ' ' + sp(c.fgProperty, 'slug') + sp(c.fgPunct, ':') + ' ' + sp(c.type, 'string', 'font-weight:700') + sp(c.fgPunct, ';') + ' ' + sp(c.fgComment, '// ' + escHtml(th.slug), 'font-style:italic'),
            '  ' + sp(c.fgProperty, 'mode') + sp(c.fgPunct, ':') + ' ' + sp(c.str, '"' + escHtml(th.mode) + '"') + sp(c.fgPunct, '; ') + sp(c.fgProperty, 'year') + sp(c.fgPunct, ':') + ' ' + sp(c.num, String(th.year)) + sp(c.fgPunct, ';'),
            '  ' + sp(c.fgProperty, 'apply') + sp(c.fgPunct, ': () =&gt;') + ' ' + sp(c.fn, 'setTheme') + sp(c.fgPunct, '(') + sp(c.str, '"' + escHtml(th.label) + '"') + sp(c.fgPunct, ');') + cur,
            sp(c.fgPunct, '}'),
          ];
        }
        return [
          sp(c.fgPunct, '---'),
          sp(c.fgProperty, 'title') + sp(c.fgPunct, ': ') + sp(c.str, '"' + escHtml(th.label) + '"'),
          sp(c.fgPunct, '---'),
          sp(c.kw, '## ' + escHtml(th.console) + ' (' + th.year + ' · ' + escHtml(th.maker) + ')', 'font-weight:700'),
          sp(c.kw, 'SELECT', 'font-weight:700') + ' ' + sp(c.fgProperty, 'slug') + sp(c.fgPunct, ', ') + sp(c.fn, 'MIN') + sp(c.fgPunct, '(') + sp(c.fgProperty, 'wcag') + sp(c.fgPunct, ') ') + sp(c.kw, 'FROM', 'font-weight:700') + ' ' + sp(c.type, 'palettes', 'font-weight:700') + ' ' + sp(c.kw, 'WHERE', 'font-weight:700') + ' ' + sp(c.fgProperty, 'year') + ' ' + sp(c.fgPunct, '=') + ' ' + sp(c.num, String(th.year)) + sp(c.fgPunct, ';') + cur,
          sp(c.fg, 'All 18 semantic roles clear ') + sp(c.fg, '**WCAG 2.1 AA (4.5:1)**', 'font-weight:700') + sp(c.fg, '.'),
        ];
      }

      const AUDIT_ROLES = [
        ['Editor Text (fg)', 'fg'],
        ['Secondary UI Text', 'fgSecondary'],
        ['Comment (fgComment)', 'fgComment'],
        ['Variable', 'fgVariable'],
        ['Parameter (italic)', 'fgParameter'],
        ['Property', 'fgProperty'],
        ['Keyword (bold)', 'kw'],
        ['Storage / Modifier', 'stor'],
        ['String Literal', 'str'],
        ['Regex / Escape', 'rx'],
        ['Function / Method', 'fn'],
        ['Type / Class (bold)', 'type'],
        ['Interface / Trait', 'iface'],
        ['Number / Constant', 'num'],
        ['Decorator / Macro', 'dec'],
        ['Namespace / Module', 'ns'],
        ['Diagnostic Error', 'err'],
        ['Diagnostic Warning', 'warn'],
      ];

      const POLY_KEYS = ['kw', 'stor', 'str', 'rx', 'fn', 'type', 'iface', 'num', 'dec', 'ns'];
      const POLY_NAMES = ['kw', 'sto', 'str', 'rgx', 'fn', 'typ', 'ifc', 'num', 'dec', 'ns'];
      const CRITICAL_KEYS = ['kw', 'stor', 'str', 'fn', 'type', 'num', 'err'];
      const COMPARE_SWATCH_ROLES = ['bg', 'kw', 'str', 'fn', 'type', 'cur'];

      function computeMinCritDe(simTokens) {
        let minCritDe = Infinity;
        let minPairNames = '';
        for (let i = 0; i < CRITICAL_KEYS.length; i++) {
          for (let j = i + 1; j < CRITICAL_KEYS.length; j++) {
            const k1 = CRITICAL_KEYS[i], k2 = CRITICAL_KEYS[j];
            const d = deltaE76(simTokens[k1], simTokens[k2]);
            if (d < minCritDe) {
              minCritDe = d;
              minPairNames = k1 + '/' + k2;
            }
          }
        }
        return { minCritDe, minPairNames };
      }

      function buildCompareCard(roleTag, th, sim) {
        const card = document.createElement('div');
        card.className = 'compare-card';
        card.style.backgroundColor = sim.bg;
        card.style.color = sim.fg;
        card.style.borderColor = sim.borderStrong;
        card.style.borderTopColor = sim.foc;

        const head = document.createElement('div');
        head.className = 'compare-card-head';
        head.style.backgroundColor = sim.bgActivity;
        head.style.borderBottomColor = sim.borderSubtle;
        head.innerHTML =
          '<span class="compare-card-title">' +
            '<span class="compare-badge" style="background:' + sim.bgLine + ';color:' + sim.fgSecondary + '">' + escHtml(roleTag) + '</span>' +
            '<strong style="color:' + sim.fg + '">' + escHtml(th.label) + '</strong>' +
          '</span>' +
          '<span class="compare-meta-sub" style="color:' + sim.fgSecondary + '">' + th.year + ' · ' + escHtml(th.maker) + '</span>';
        card.appendChild(head);

        const pre = document.createElement('pre');
        pre.className = 'compare-code';
        pre.style.backgroundColor = sim.bg;
        const lines = buildMiniCodeSample(sim, activeLang, th);
        pre.innerHTML = lines.map((ln, idx) => {
          const hi = idx === 3;
          return '<div class="code-line" style="background:' + (hi ? sim.bgLine : 'transparent') + '">' +
            '<span class="line-num" style="color:' + (hi ? sim.fgSecondary : sim.fgMuted) + '">' + (idx + 1) + '</span>' +
            '<span>' + (ln || ' ') + '</span></div>';
        }).join('');
        card.appendChild(pre);

        const fgW = wcag(sim.fg, sim.bg).toFixed(2);
        const fgLc = Math.abs(apcaLc(sim.fg, sim.bg)).toFixed(1);
        const crit = computeMinCritDe(sim);
        const cvdText = th.slug === 'gameboy-dark'
          ? 'DMG-01 Mono (' + crit.minCritDe.toFixed(1) + ')'
          : 'Min ΔE*ab ' + crit.minCritDe.toFixed(1) + ' (' + crit.minPairNames + ')';

        const metrics = document.createElement('div');
        metrics.className = 'compare-metrics';
        metrics.style.backgroundColor = sim.bgPanel;
        metrics.style.borderTopColor = sim.borderSubtle;
        metrics.style.color = sim.fgSecondary;
        metrics.innerHTML =
          '<span>WCAG fg/bg <strong style="color:' + sim.fg + '">' + fgW + ':1</strong></span>' +
          '<span>APCA |Lc| <strong style="color:' + sim.fg + '">' + fgLc + '</strong></span>' +
          '<span style="color:' + sim.type + '">' + escHtml(cvdText) + '</span>';
        card.appendChild(metrics);

        const swatches = document.createElement('div');
        swatches.className = 'compare-swatches';
        swatches.style.backgroundColor = sim.bgSidebar;
        swatches.style.borderTopColor = sim.borderSubtle;
        COMPARE_SWATCH_ROLES.forEach((role) => {
          const hex = sim[role];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'compare-swatch';
          btn.style.color = sim.fgSecondary;
          btn.style.borderColor = sim.borderSubtle;
          btn.title = th.label + ' · ' + role + ': ' + hex + ' (click to copy)';
          btn.innerHTML = '<span class="compare-swatch-dot" style="background:' + hex + '"></span><span>' + role + '</span>';
          btn.addEventListener('click', () => copyText(hex, 'Copied ' + th.label + ' ' + role + ' (' + hex + ')'));
          swatches.appendChild(btn);
        });
        card.appendChild(swatches);

        return card;
      }

      function renderCompareStrip(th, c, cmpTheme, simCmp, cvdTitle) {
        const strip = document.getElementById('compare-strip');
        const toggleBtn = document.getElementById('btn-compare-toggle');
        toggleBtn.setAttribute('aria-pressed', String(compareEnabled));
        strip.hidden = !compareEnabled;
        if (!compareEnabled || !cmpTheme || !simCmp) return;

        compareSelect.value = cmpTheme.slug;
        document.getElementById('compare-vision-note').textContent =
          cvdTitle + ' · Dashed OKLab polygon tracks Theme B';

        const grid = document.getElementById('compare-grid');
        grid.innerHTML = '';
        grid.appendChild(buildCompareCard('Theme A · Active', th, c));
        grid.appendChild(buildCompareCard('Theme B · Compare', cmpTheme, simCmp));
      }

      function drawChromaCanvas(simCur, simRef, isLightShell, isCompareActive) {
        const canvas = document.getElementById('canvas-chroma');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = 320, h = 260;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2, cy = h / 2;
        const maxC = 0.27;
        const scale = 108 / maxC;
        const gridColor = isLightShell ? 'rgba(24,27,32,0.12)' : 'rgba(236,239,244,0.12)';
        const labelColor = isLightShell ? 'rgba(24,27,32,0.58)' : 'rgba(236,239,244,0.58)';

        ctx.strokeStyle = gridColor;
        ctx.lineWidth = 1;
        [0.08, 0.16, 0.24].forEach((r) => {
          ctx.beginPath();
          ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(16, cy); ctx.lineTo(w - 16, cy);
        ctx.moveTo(cx, 12); ctx.lineTo(cx, h - 12);
        ctx.stroke();

        ctx.fillStyle = labelColor;
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText('+a (red)', w - 58, cy - 5);
        ctx.fillText('-a (green)', 14, cy - 5);
        ctx.fillText('+b (yellow)', cx + 5, 20);
        ctx.fillText('-b (blue)', cx + 5, h - 10);

        if (simRef) {
          const refPts = POLY_KEYS.map((k) => {
            const hex = simRef[k];
            const ok = hexToOklch(hex);
            return { x: cx + ok.a * scale, y: cy - ok.b * scale, hex };
          });
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = isCompareActive
            ? (isLightShell ? 'rgba(24,27,32,0.55)' : 'rgba(236,239,244,0.55)')
            : (isLightShell ? 'rgba(24,27,32,0.32)' : 'rgba(236,239,244,0.32)');
          ctx.lineWidth = isCompareActive ? 1.5 : 1.25;
          ctx.beginPath();
          refPts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          if (isCompareActive) {
            refPts.forEach((p) => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
              ctx.fillStyle = p.hex;
              ctx.fill();
              ctx.lineWidth = 1;
              ctx.strokeStyle = isLightShell ? 'rgba(24,27,32,0.5)' : 'rgba(236,239,244,0.5)';
              ctx.stroke();
            });
          }
        }

        const pts = POLY_KEYS.map((k, idx) => {
          const hex = simCur[k];
          const ok = hexToOklch(hex);
          return { x: cx + ok.a * scale, y: cy - ok.b * scale, hex, lbl: POLY_NAMES[idx] };
        });

        ctx.beginPath();
        pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.strokeStyle = simCur.foc;
        ctx.lineWidth = 1.9;
        ctx.stroke();

        pts.forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.2, 0, Math.PI * 2);
          ctx.fillStyle = p.hex;
          ctx.fill();
          ctx.lineWidth = 1.3;
          ctx.strokeStyle = simCur.bg;
          ctx.stroke();
        });
      }

      function drawLightnessCanvas(simCur, isLightShell) {
        const canvas = document.getElementById('canvas-lightness');
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = 320, h = 190;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const padL = 34, padR = 14, padT = 16, padB = 28;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const yOfL = (L) => padT + (1 - L) * plotH;

        const gridColor = isLightShell ? 'rgba(24,27,32,0.12)' : 'rgba(236,239,244,0.12)';
        const txtColor = isLightShell ? 'rgba(24,27,32,0.62)' : 'rgba(236,239,244,0.62)';

        ctx.font = '10px ui-monospace, monospace';
        [0, 0.25, 0.5, 0.75, 1].forEach((lv) => {
          const y = yOfL(lv);
          ctx.strokeStyle = gridColor;
          ctx.beginPath();
          ctx.moveTo(padL, y); ctx.lineTo(w - padR, y);
          ctx.stroke();
          ctx.fillStyle = txtColor;
          ctx.fillText(Math.round(lv * 100) + '%', 4, y + 3);
        });

        // Background & comment reference lines
        const bgL = hexToOklch(simCur.bg).L;
        const cmtL = hexToOklch(simCur.fgComment).L;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = simCur.fgComment;
        ctx.beginPath();
        ctx.moveTo(padL, yOfL(cmtL)); ctx.lineTo(w - padR, yOfL(cmtL));
        ctx.stroke();
        ctx.restore();

        const step = plotW / POLY_KEYS.length;
        POLY_KEYS.forEach((k, i) => {
          const hex = simCur[k];
          const L = hexToOklch(hex).L;
          const x = padL + step * (i + 0.5);
          const y = yOfL(L);
          const yBg = yOfL(bgL);

          ctx.strokeStyle = hex;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(x, yBg);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fillStyle = hex;
          ctx.fill();
          ctx.lineWidth = 1.2;
          ctx.strokeStyle = simCur.bg;
          ctx.stroke();

          ctx.fillStyle = txtColor;
          ctx.fillText(POLY_NAMES[i], x - 9, h - 10);
        });
      }

      const ERA_COLORS_MAP = {
        '8-bit Pioneers': '#C47B14',
        '16-bit Golden Age': '#D43044',
        '32/64-bit Polygon Era': '#8648DB',
        '128-bit & Millennial Classics': '#246CE0',
        'HD, Motion & Portable Era': '#0EA0A6',
        'Modern, Hybrid & Portable PC': '#1FA458',
        'Next-Gen & Spatial Era': '#D43E88',
      };
      const MAKER_COLORS_MAP = {
        Atari: '#E04D12',
        Nintendo: '#E02434',
        Sony: '#2266EE',
        Sega: '#1688CC',
        Microsoft: '#18A034',
        Valve: '#00A8C6',
        'Arcade & Indie': '#D49A10',
      };
      const SIM_KEYS_CLIENT = ['kw', 'stor', 'str', 'rx', 'fn', 'fnDim', 'type', 'iface', 'num', 'dec', 'ns', 'err', 'warn'];

      function makerBucketOf(maker) {
        const m = String(maker || '').toLowerCase();
        if (m.includes('atari')) return 'Atari';
        if (m.includes('nintendo')) return 'Nintendo';
        if (m.includes('sony')) return 'Sony';
        if (m.includes('sega')) return 'Sega';
        if (m.includes('microsoft') || m.includes('asus')) return 'Microsoft';
        if (m.includes('valve')) return 'Valve';
        return 'Arcade & Indie';
      }

      function ciede2000Client(lab1, lab2) {
        const [L1, a1, b1] = lab1, [L2, a2, b2] = lab2;
        const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2);
        const Cbar = 0.5 * (C1 + C2);
        const Cbar7 = Math.pow(Cbar, 7);
        const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + 6103515625)));
        const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
        const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
        const h1p = (a1p || b1) ? ((Math.atan2(b1, a1p) * 180 / Math.PI) + 360) % 360 : 0;
        const h2p = (a2p || b2) ? ((Math.atan2(b2, a2p) * 180 / Math.PI) + 360) % 360 : 0;
        const dLp = L2 - L1, dCp = C2p - C1p;
        let dhp = 0;
        if (C1p * C2p !== 0) {
          if (Math.abs(h2p - h1p) <= 180) dhp = h2p - h1p;
          else dhp = (h2p - h1p > 180) ? (h2p - h1p - 360) : (h2p - h1p + 360);
        }
        const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * Math.PI / 180);
        const Lbp = 0.5 * (L1 + L2), Cbp = 0.5 * (C1p + C2p);
        let Hbp = h1p + h2p;
        if (C1p * C2p !== 0) {
          if (Math.abs(h1p - h2p) <= 180) Hbp = 0.5 * (h1p + h2p);
          else Hbp = (h1p + h2p < 360) ? 0.5 * (h1p + h2p + 360) : 0.5 * (h1p + h2p - 360);
        }
        const rad = Math.PI / 180;
        const T = 1 - 0.17 * Math.cos((Hbp - 30) * rad) + 0.24 * Math.cos(2 * Hbp * rad) + 0.32 * Math.cos((3 * Hbp + 6) * rad) - 0.20 * Math.cos((4 * Hbp - 63) * rad);
        const dTheta = 30 * Math.exp(-Math.pow((Hbp - 275) / 25, 2));
        const Cbp7 = Math.pow(Cbp, 7);
        const RC = 2 * Math.sqrt(Cbp7 / (Cbp7 + 6103515625));
        const SL = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
        const SC = 1 + 0.045 * Cbp;
        const SH = 1 + 0.015 * Cbp * T;
        const RT = -Math.sin(2 * dTheta * rad) * RC;
        return Math.sqrt(Math.pow(dLp / SL, 2) + Math.pow(dCp / SC, 2) + Math.pow(dHp / SH, 2) + RT * (dCp / SC) * (dHp / SH));
      }

      function meanSyntaxDe00(thA, thB) {
        if (!thA || !thB || thA.slug === thB.slug) return 0;
        let sum = 0;
        for (let i = 0; i < SIM_KEYS_CLIENT.length; i++) {
          const k = SIM_KEYS_CLIENT[i];
          sum += ciede2000Client(hexToLab(thA.t[k]), hexToLab(thB.t[k]));
        }
        return sum / SIM_KEYS_CLIENT.length;
      }

      function renderNeighborBar(th) {
        const bar = document.getElementById('neighbor-bar');
        if (!bar || !th.neighbors) return;
        bar.innerHTML = '';

        const lbl = document.createElement('span');
        lbl.className = 'neighbor-lbl';
        lbl.textContent = 'Nearest (ΔE₀₀):';
        bar.appendChild(lbl);

        const makeChip = (slug, de, isFar) => {
          const target = THEMES.find((x) => x.slug === slug);
          if (!target) return null;
          const wrap = document.createElement('span');
          wrap.className = 'neighbor-chip-wrap';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'neighbor-chip';
          btn.title = (isFar ? 'Most perceptually distinct ' : 'Chromatic neighbor ') + target.label + ' (mean ΔE₀₀ ' + de.toFixed(1) + ') — click to activate, Shift+Click to compare';
          const dot = document.createElement('span');
          dot.className = 'neighbor-dot';
          dot.style.backgroundColor = simHex(target.t.bg, activeCvd);
          dot.style.borderColor = simHex(target.t.kw, activeCvd);
          btn.appendChild(dot);
          btn.appendChild(document.createTextNode(target.shortConsole + ' '));
          const deSpan = document.createElement('span');
          deSpan.className = 'neighbor-de';
          deSpan.textContent = de.toFixed(1);
          btn.appendChild(deSpan);
          btn.addEventListener('click', (e) => {
            if (e.shiftKey) openCompareWith(target.slug);
            else selectSlug(target.slug, true);
          });

          const cmpBtn = document.createElement('button');
          cmpBtn.type = 'button';
          cmpBtn.className = 'neighbor-cmp-btn';
          cmpBtn.textContent = '⇄';
          cmpBtn.title = 'Compare ' + th.label + ' vs ' + target.label;
          cmpBtn.setAttribute('aria-label', 'Compare with ' + target.label);
          cmpBtn.addEventListener('click', () => openCompareWith(target.slug));

          wrap.appendChild(btn);
          wrap.appendChild(cmpBtn);
          return wrap;
        };

        th.neighbors.forEach((n) => {
          const el = makeChip(n.slug, n.de, false);
          if (el) bar.appendChild(el);
        });

        if (th.farthest) {
          const sep = document.createElement('span');
          sep.className = 'neighbor-sep';
          sep.textContent = '·';
          bar.appendChild(sep);

          const flbl = document.createElement('span');
          flbl.className = 'neighbor-lbl';
          flbl.textContent = 'Farthest:';
          bar.appendChild(flbl);

          const fel = makeChip(th.farthest.slug, th.farthest.de, true);
          if (fel) bar.appendChild(fel);
        }
      }

      function renderMapInspector(inspTheme, activeTheme) {
        const panel = document.getElementById('mds-inspector');
        if (!panel || !inspTheme) return;
        const isSelf = inspTheme.slug === activeTheme.slug;
        const sw = [
          ['BG', simHex(inspTheme.t.bg, activeCvd)],
          ['KW', simHex(inspTheme.t.kw, activeCvd)],
          ['STR', simHex(inspTheme.t.str, activeCvd)],
          ['FN', simHex(inspTheme.t.fn, activeCvd)],
          ['TYPE', simHex(inspTheme.t.type, activeCvd)],
        ];

        let distHtml = '';
        if (isSelf) {
          const n0 = inspTheme.neighbors && inspTheme.neighbors[0];
          const n0t = n0 ? THEMES.find((x) => x.slug === n0.slug) : null;
          const ft = inspTheme.farthest ? THEMES.find((x) => x.slug === inspTheme.farthest.slug) : null;
          distHtml =
            '<div><strong>Nearest:</strong> ' + escHtml(n0t ? n0t.shortConsole : '—') + (n0 ? ' (' + n0.de.toFixed(1) + ' ΔE₀₀)' : '') + '</div>' +
            '<div><strong>Farthest:</strong> ' + escHtml(ft ? ft.shortConsole : '—') + (inspTheme.farthest ? ' (' + inspTheme.farthest.de.toFixed(1) + ' ΔE₀₀)' : '') + '</div>';
          if (inspTheme.mds && inspTheme.mds.outlier) {
            distHtml += '<div><strong>Outlier:</strong> mean ' + inspTheme.mds.meanDe.toFixed(1) + ' ΔE₀₀ vs 38</div>';
          }
        } else {
          const de = meanSyntaxDe00(activeTheme, inspTheme);
          distHtml =
            '<div><strong>vs ' + escHtml(activeTheme.shortConsole) + ':</strong> ' + de.toFixed(1) + ' mean ΔE₀₀</div>' +
            '<div style="color:var(--shell-muted)">' + (inspTheme.mode === activeTheme.mode ? 'Same polarity (13 syntax roles)' : 'Cross-polarity distance') + '</div>';
        }

        panel.innerHTML =
          '<div class="mds-insp-head">' +
            '<span class="mds-insp-kicker">' + (isSelf ? 'Active Theme' : 'Inspected Console') + '</span>' +
            '<div class="mds-insp-title">' + escHtml(inspTheme.label) + '</div>' +
            '<div class="mds-insp-meta">' + inspTheme.year + ' · ' + escHtml(inspTheme.maker) + ' · ' + escHtml(inspTheme.era) + '</div>' +
            '<p class="mds-insp-sub">' + escHtml(inspTheme.subtitle) + '</p>' +
          '</div>' +
          '<div class="mds-insp-swatches">' +
            sw.map(([lbl, hx]) => '<div class="mds-insp-sw"><span style="background:' + hx + '"></span>' + lbl + '</div>').join('') +
          '</div>' +
          '<div class="mds-insp-dist">' + distHtml + '</div>' +
          '<div class="mds-insp-actions">' +
            '<button type="button" id="mds-btn-activate" class="btn-primary"' + (isSelf ? ' disabled' : '') + '>' + (isSelf ? '✓ Active' : 'Activate') + '</button>' +
            '<button type="button" id="mds-btn-compare"' + (isSelf ? ' disabled' : '') + '>Compare vs Active</button>' +
          '</div>';

        const actBtn = document.getElementById('mds-btn-activate');
        const cmpBtn = document.getElementById('mds-btn-compare');
        if (actBtn && !isSelf) actBtn.addEventListener('click', () => selectSlug(inspTheme.slug, true));
        if (cmpBtn && !isSelf) cmpBtn.addEventListener('click', () => openCompareWith(inspTheme.slug));
      }

      function renderSimilarityMap(activeTheme, isLightShell) {
        const strip = document.getElementById('map-strip');
        const toggleBtn = document.getElementById('btn-map-toggle');
        toggleBtn.setAttribute('aria-pressed', String(mapEnabled));
        strip.hidden = !mapEnabled;
        if (!mapEnabled) return;

        document.querySelectorAll('.map-mode-btn').forEach((b) => {
          b.setAttribute('aria-pressed', String(b.dataset.mapMode === mapMode));
        });
        document.getElementById('map-color-by').value = mapColorBy;

        const metaMode = MDS_META[mapMode];
        const sumVar = (metaMode.v1 + metaMode.v2).toFixed(1);
        document.getElementById('map-variance-note').textContent =
          (mapMode === 'light' ? '39 Light themes' : '38 Polychromatic Dark + 1 DMG-01 outlier') +
          ' · Dim 1 (' + metaMode.v1.toFixed(1) + '%) + Dim 2 (' + metaMode.v2.toFixed(1) + '%) = ' + sumVar + '% variance';

        const svg = document.getElementById('mds-svg');
        const NS = 'http://www.w3.org/2000/svg';
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        const el = (tag, attrs, text) => {
          const node = document.createElementNS(NS, tag);
          for (const [k, v] of Object.entries(attrs || {})) node.setAttribute(k, String(v));
          if (text !== undefined) node.textContent = text;
          return node;
        };

        const W = 920, H = 470;
        const padL = 54, padR = 48, padT = 36, padB = 34;
        const pw = W - padL - padR, ph = H - padT - padB;
        const gridStroke = isLightShell ? '#E6E3DA' : '#262B36';
        const zeroStroke = isLightShell ? '#C8C4B8' : '#3A4254';
        const poleFill = isLightShell ? '#7A8190' : '#6B7487';
        const lblBgFill = isLightShell ? 'rgba(255,255,255,0.9)' : 'rgba(18,21,28,0.88)';
        const lblTextFill = isLightShell ? '#1A1E26' : '#E8ECF4';

        // Zero axes
        const zx = padL + ((0 - metaMode.minX) / ((metaMode.maxX - metaMode.minX) || 1)) * pw;
        const zy = padT + ph - ((0 - metaMode.minY) / ((metaMode.maxY - metaMode.minY) || 1)) * ph;

        for (let f = 0.2; f <= 0.81; f += 0.2) {
          svg.appendChild(el('line', { x1: (padL + f * pw).toFixed(1), y1: padT, x2: (padL + f * pw).toFixed(1), y2: padT + ph, stroke: gridStroke, 'stroke-width': 1 }));
          svg.appendChild(el('line', { x1: padL, y1: (padT + f * ph).toFixed(1), x2: padL + pw, y2: (padT + f * ph).toFixed(1), stroke: gridStroke, 'stroke-width': 1 }));
        }
        if (zx > padL && zx < padL + pw) {
          svg.appendChild(el('line', { x1: zx.toFixed(1), y1: padT, x2: zx.toFixed(1), y2: padT + ph, stroke: zeroStroke, 'stroke-width': 1.2, 'stroke-dasharray': '4,4' }));
        }
        if (zy > padT && zy < padT + ph) {
          svg.appendChild(el('line', { x1: padL, y1: zy.toFixed(1), x2: padL + pw, y2: zy.toFixed(1), stroke: zeroStroke, 'stroke-width': 1.2, 'stroke-dasharray': '4,4' }));
        }

        // Compass pole labels
        const poleAttrs = { fill: poleFill, 'font-family': 'var(--font-mono)', 'font-size': 9.5, 'font-weight': 700, 'letter-spacing': '0.06em' };
        svg.appendChild(el('text', { ...poleAttrs, x: padL + pw / 2, y: 20, 'text-anchor': 'middle' }, '↑ WARM RED / AMBER'));
        svg.appendChild(el('text', { ...poleAttrs, x: padL + pw / 2, y: H - 11, 'text-anchor': 'middle' }, '↓ DEEP COBALT / CYAN'));
        svg.appendChild(el('text', { ...poleAttrs, x: 14, y: padT + ph / 2, 'text-anchor': 'start' }, '← INDIGO / VIOLET'));
        svg.appendChild(el('text', { ...poleAttrs, x: W - 14, y: padT + ph / 2, 'text-anchor': 'end' }, 'EMERALD / PRIMARY →'));

        const modeThemes = THEMES.filter((t) => t.mode === mapMode);
        const polyThemes = modeThemes.filter((t) => t.mds && !t.mds.outlier);
        const posBySlug = new Map();
        polyThemes.forEach((t) => {
          const px = padL + 16 + t.mds.nx * (pw - 32);
          const py = padT + ph - 16 - t.mds.ny * (ph - 32);
          posBySlug.set(t.slug, [px, py]);
        });

        // Dotted proximity tethers from active theme to top-3 nearest neighbors (if active is in this map mode)
        const actPos = posBySlug.get(activeTheme.slug);
        if (actPos && activeTheme.neighbors) {
          activeTheme.neighbors.slice(0, 3).forEach((nb, ni) => {
            const np = posBySlug.get(nb.slug);
            if (!np) return;
            svg.appendChild(el('line', {
              x1: actPos[0].toFixed(1),
              y1: actPos[1].toFixed(1),
              x2: np[0].toFixed(1),
              y2: np[1].toFixed(1),
              stroke: simHex(activeTheme.t.cur, activeCvd),
              'stroke-width': ni === 0 ? 1.8 : 1.2,
              'stroke-opacity': ni === 0 ? 0.85 : 0.45,
              'stroke-dasharray': '3,3',
            }));
          });
        }

        // Compute collision-free label positions for the interactive SVG
        const hasOutlierCard = Boolean(modeThemes.find((t) => t.mds && t.mds.outlier));
        const oxCard = W - 278, oyCard = H - 72, owCard = 264, ohCard = 48;
        const lblNodes = polyThemes.map((t) => {
          const [px, py] = posBySlug.get(t.slug);
          const lblText = t.shortConsole;
          const approxW = lblText.length * 5.7 + 10;
          const approxH = 13.5;
          return {
            slug: t.slug,
            ax: px,
            ay: py,
            x: px,
            y: py < padT + 30 ? py + 17 : py - 14,
            w: approxW,
            h: approxH,
          };
        });
        for (let iter = 0; iter < 180; iter++) {
          for (let i = 0; i < lblNodes.length; i++) {
            const li = lblNodes[i];
            let fx = 0, fy = 0;
            const dxA = li.x - li.ax, dyA = li.y - li.ay;
            const dA = Math.hypot(dxA, dyA) + 1e-4;
            if (dA > 78) { fx -= (dxA / dA) * (dA - 78) * 0.08; fy -= (dyA / dA) * (dA - 78) * 0.08; }
            else if (dA < 17) { fx += (dxA / dA) * (17 - dA) * 0.40; fy += (dyA / dA) * (17 - dA) * 0.40; }
            for (let m = 0; m < lblNodes.length; m++) {
              const mx = lblNodes[m].ax, my = lblNodes[m].ay;
              const ox = Math.abs(li.x - mx) - (li.w / 2 + 13);
              const oy = Math.abs(li.y - my) - (li.h / 2 + 13);
              if (ox < 0 && oy < 0) {
                if (Math.abs(ox) < Math.abs(oy)) fx += (li.x >= mx ? 1 : -1) * (-ox) * 0.52;
                else fy += (li.y >= my ? 1 : -1) * (-oy) * 0.55;
              }
            }
            for (let j = 0; j < lblNodes.length; j++) {
              if (i === j) continue;
              const lj = lblNodes[j];
              const ox = Math.abs(li.x - lj.x) - (li.w + lj.w) / 2 - 4;
              const oy = Math.abs(li.y - lj.y) - (li.h + lj.h) / 2 - 3;
              if (ox < 0 && oy < 0) {
                const sx = (li.x > lj.x || (li.x === lj.x && i > j)) ? 1 : -1;
                const sy = (li.y > lj.y || (li.y === lj.y && i > j)) ? 1 : -1;
                if (Math.abs(ox) < Math.abs(oy)) fx += sx * (-ox) * 0.52;
                else fy += sy * (-oy) * 0.52;
              }
            }
            if (hasOutlierCard) {
              const ocx = oxCard + owCard / 2, ocy = oyCard + ohCard / 2;
              const ox = Math.abs(li.x - ocx) - (li.w / 2 + owCard / 2 + 8);
              const oy = Math.abs(li.y - ocy) - (li.h / 2 + ohCard / 2 + 8);
              if (ox < 0 && oy < 0) fy -= (-oy) * 0.65;
            }
            li.x = Math.min(W - padR - li.w / 2 + 26, Math.max(padL + li.w / 2 - 26, li.x + fx));
            li.y = Math.min(H - padB - li.h / 2 + 4, Math.max(padT + li.h / 2 - 4, li.y + fy));
          }
        }
        // Final strict AABB pass
        for (let pass = 0; pass < 40; pass++) {
          let moved = false;
          for (let i = 0; i < lblNodes.length; i++) {
            for (let j = i + 1; j < lblNodes.length; j++) {
              const li = lblNodes[i], lj = lblNodes[j];
              const ox = (li.w + lj.w) / 2 + 3 - Math.abs(li.x - lj.x);
              const oy = (li.h + lj.h) / 2 + 2 - Math.abs(li.y - lj.y);
              if (ox > 0 && oy > 0) {
                moved = true;
                if (ox < oy) {
                  const s = (ox / 2 + 0.5) * (li.x >= lj.x ? 1 : -1);
                  li.x += s; lj.x -= s;
                } else {
                  const s = (oy / 2 + 0.5) * (li.y >= lj.y ? 1 : -1);
                  li.y += s; lj.y -= s;
                }
              }
            }
          }
          if (!moved) break;
        }
        const lblBySlug = new Map(lblNodes.map((ln) => [ln.slug, ln]));

        // Render clickable console nodes (active node last so it always floats on top)
        const filterActive = Boolean(searchQuery.trim() || activeMaker !== 'All');
        const orderedPoly = polyThemes.slice().sort((a, b) => (a.slug === activeTheme.slug ? 1 : b.slug === activeTheme.slug ? -1 : 0));
        orderedPoly.forEach((t) => {
          const [px, py] = posBySlug.get(t.slug);
          const ln = lblBySlug.get(t.slug);
          const isAct = t.slug === activeTheme.slug;
          const isCmp = compareEnabled && t.slug === compareSlug;
          const matched = !filterActive || matchesConsoleFilter(t);

          const g = el('g', {
            class: 'mds-node' + (isAct ? ' is-active' : '') + (!matched ? ' is-dimmed' : ''),
            tabindex: 0,
            role: 'button',
            'aria-label': t.label + ' (' + t.year + ' ' + t.maker + ')',
          });

          let ringCol = simHex(t.t.kw, activeCvd);
          let fillCol = simHex(t.t.bg, activeCvd);
          if (mapColorBy === 'era') {
            ringCol = ERA_COLORS_MAP[t.era] || ringCol;
            fillCol = isLightShell ? '#FFFFFF' : '#151820';
          } else if (mapColorBy === 'maker') {
            ringCol = MAKER_COLORS_MAP[makerBucketOf(t.maker)] || ringCol;
            fillCol = isLightShell ? '#FFFFFF' : '#151820';
          }

          if (Math.hypot(ln.x - px, ln.y - py) > 16) {
            g.appendChild(el('line', {
              x1: px.toFixed(1),
              y1: py.toFixed(1),
              x2: ln.x.toFixed(1),
              y2: ln.y.toFixed(1),
              stroke: zeroStroke,
              'stroke-width': 0.9,
            }));
          }

          if (isAct || isCmp) {
            g.appendChild(el('circle', {
              cx: px.toFixed(1),
              cy: py.toFixed(1),
              r: isAct ? 14 : 12.5,
              fill: 'none',
              stroke: isAct ? simHex(t.t.cur, activeCvd) : 'var(--shell-accent)',
              'stroke-width': isAct ? 2.2 : 1.6,
              'stroke-dasharray': isCmp && !isAct ? '3,2' : '',
            }));
          }

          g.appendChild(el('circle', {
            cx: px.toFixed(1),
            cy: py.toFixed(1),
            r: isAct ? 8.5 : 7,
            fill: ringCol,
            stroke: isLightShell ? '#1E222B' : '#F2F5FA',
            'stroke-width': isAct ? 1.5 : 0.9,
          }));
          g.appendChild(el('circle', {
            cx: px.toFixed(1),
            cy: py.toFixed(1),
            r: isAct ? 4.2 : 3.4,
            fill: fillCol,
          }));

          const lblText = t.shortConsole;
          g.appendChild(el('rect', {
            class: 'mds-label-bg',
            x: (ln.x - ln.w / 2).toFixed(1),
            y: (ln.y - ln.h / 2).toFixed(1),
            width: ln.w.toFixed(1),
            height: ln.h.toFixed(1),
            rx: 3,
            fill: lblBgFill,
            stroke: isAct ? ringCol : 'transparent',
            'stroke-width': isAct ? 1.2 : 0,
          }));
          g.appendChild(el('text', {
            x: ln.x.toFixed(1),
            y: (ln.y + 3.2).toFixed(1),
            'text-anchor': 'middle',
            fill: lblTextFill,
            'font-family': 'var(--font-sans)',
            'font-size': isAct ? 9.8 : 9,
            'font-weight': isAct ? 700 : 550,
          }, lblText));

          g.addEventListener('mouseenter', () => {
            mapHoverSlug = t.slug;
            renderMapInspector(t, activeTheme);
          });
          g.addEventListener('focus', () => {
            mapHoverSlug = t.slug;
            renderMapInspector(t, activeTheme);
          });
          g.addEventListener('click', (e) => {
            if (e.shiftKey) openCompareWith(t.slug);
            else selectSlug(t.slug, true);
          });
          g.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (e.shiftKey) openCompareWith(t.slug);
              else selectSlug(t.slug, true);
            }
          });
          svg.appendChild(g);
        });

        // Game Boy Dark interactive outlier callout card on Dark map
        const gbDark = modeThemes.find((t) => t.mds && t.mds.outlier);
        if (gbDark) {
          const isAct = gbDark.slug === activeTheme.slug;
          const ox = W - 278, oy = H - 72, ow = 264, oh = 48;
          const gg = el('g', {
            class: 'mds-node' + (isAct ? ' is-active' : ''),
            tabindex: 0,
            role: 'button',
            'aria-label': 'Game Boy Dark — Off-Chart 1989 DMG-01 LCD outlier',
          });
          gg.appendChild(el('rect', {
            x: ox, y: oy, width: ow, height: oh, rx: 8,
            fill: isLightShell ? '#F4F6EA' : '#182410',
            stroke: isAct ? '#C6E830' : '#7E9B24',
            'stroke-width': isAct ? 2.2 : 1.3,
          }));
          gg.appendChild(el('circle', { cx: ox + 22, cy: oy + oh / 2, r: 9.5, fill: simHex(gbDark.t.kw, activeCvd), stroke: '#283A0B', 'stroke-width': 1.2 }));
          gg.appendChild(el('circle', { cx: ox + 22, cy: oy + oh / 2, r: 4.5, fill: simHex(gbDark.t.bg, activeCvd) }));
          gg.appendChild(el('text', {
            x: ox + 40, y: oy + 19,
            fill: isLightShell ? '#1F3008' : '#D2EA72',
            'font-family': 'var(--font-sans)', 'font-size': 10.5, 'font-weight': 700,
          }, 'Game Boy Dark · Off-Chart Outlier'));
          gg.appendChild(el('text', {
            x: ox + 40, y: oy + 34,
            fill: isLightShell ? '#495B24' : '#96B252',
            'font-family': 'var(--font-mono)', 'font-size': 9.2,
          }, '1989 DMG-01 LCD · mean ' + gbDark.mds.meanDe.toFixed(1) + ' ΔE₀₀'));
          gg.addEventListener('mouseenter', () => { mapHoverSlug = gbDark.slug; renderMapInspector(gbDark, activeTheme); });
          gg.addEventListener('focus', () => { mapHoverSlug = gbDark.slug; renderMapInspector(gbDark, activeTheme); });
          gg.addEventListener('click', (e) => { if (e.shiftKey) openCompareWith(gbDark.slug); else selectSlug(gbDark.slug, true); });
          gg.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (e.shiftKey) openCompareWith(gbDark.slug);
              else selectSlug(gbDark.slug, true);
            }
          });
          svg.appendChild(gg);
        }

        const initialInsp = (mapHoverSlug && modeThemes.find((t) => t.slug === mapHoverSlug)) ||
          (activeTheme.mode === mapMode ? activeTheme : modeThemes[0]);
        renderMapInspector(initialInsp, activeTheme);
      }

      function render() {
        const th = getActiveTheme();
        const sib = findSibling(th);
        const cmpTheme = compareEnabled ? getCompareTheme(th) : sib;
        const isLightShell = th.mode === 'light';
        document.documentElement.dataset.shellMode = th.mode;
        document.body.dataset.shellMode = th.mode;

        // Split gamepad brand mark reflects active console pair's Light/Dark accents
        const lightPair = th.mode === 'light' ? th : (sib || th);
        const darkPair = th.mode === 'dark' ? th : (sib || th);
        document.getElementById('pad-left').setAttribute('fill', lightPair.t.bg);
        document.getElementById('pad-right').setAttribute('fill', darkPair.t.bg);
        document.getElementById('btn-top').setAttribute('fill', th.t.kw);
        document.getElementById('btn-right').setAttribute('fill', th.t.str);
        document.getElementById('btn-bot').setAttribute('fill', th.t.fn);
        document.getElementById('btn-left').setAttribute('fill', th.t.cur);

        document.getElementById('toggle-mode-label').textContent =
          th.mode === 'light' ? 'Switch to Dark' : 'Switch to Light';

        const applyBtn = document.getElementById('btn-apply-vscode');
        if (applyBtn) {
          const isApplied = workbenchActiveLabel === th.label;
          applyBtn.textContent = isApplied ? '✓ Active in Workbench' : 'Apply to Workbench';
        }

        renderEraRail(th);

        document.getElementById('active-theme-heading').textContent = th.label + ' (' + th.year + ' · ' + th.maker + ')';
        document.getElementById('active-theme-subtitle').textContent = th.subtitle;
        document.getElementById('active-theme-story').textContent = th.story;
        renderNeighborBar(th);

        document.querySelectorAll('.cvd-btn').forEach((btn) => {
          btn.setAttribute('aria-selected', String(btn.dataset.cvd === activeCvd));
        });

        // Simulate tokens
        const c = {};
        for (const [k, v] of Object.entries(th.t)) c[k] = simHex(v, activeCvd);
        const simCmp = cmpTheme ? Object.fromEntries(Object.entries(cmpTheme.t).map(([k, v]) => [k, simHex(v, activeCvd)])) : null;
        const cvdTitle = { normal: 'Normal Trichromacy', protan: 'Simulated Protanopia', deutan: 'Simulated Deuteranopia', tritan: 'Simulated Tritanopia' }[activeCvd];

        renderSimilarityMap(th, isLightShell);
        renderCompareStrip(th, c, cmpTheme, simCmp, cvdTitle);

        // Workbench styling
        const wb = document.getElementById('workbench');
        wb.style.backgroundColor = c.bg;
        wb.style.color = c.fg;

        const titlebar = document.getElementById('wb-titlebar');
        titlebar.style.backgroundColor = c.bgActivity;
        titlebar.style.borderBottomColor = c.borderSubtle;
        document.getElementById('dot-close').style.backgroundColor = c.str;
        document.getElementById('dot-min').style.backgroundColor = c.num;
        document.getElementById('dot-max').style.backgroundColor = c.kw;

        document.querySelectorAll('.lang-tab').forEach((tab) => {
          const isAct = tab.dataset.lang === activeLang;
          tab.style.backgroundColor = isAct ? c.bg : 'transparent';
          tab.style.color = isAct ? c.fg : c.fgMuted;
          tab.style.borderTopColor = isAct ? c.foc : 'transparent';
          tab.style.fontWeight = isAct ? '600' : '400';
        });

        const pill = document.getElementById('wb-vision-pill');
        pill.textContent = cvdTitle;
        pill.style.backgroundColor = c.bgLine;
        pill.style.color = c.fgSecondary;

        const actBar = document.getElementById('wb-activity');
        actBar.style.backgroundColor = c.bgActivity;
        actBar.style.borderRightColor = c.borderSubtle;
        actBar.style.color = c.fgMuted;
        const actIcon = document.getElementById('act-icon-active');
        actIcon.style.color = c.fg;
        actIcon.style.borderLeftColor = c.foc;

        const sidebar = document.getElementById('wb-sidebar');
        sidebar.style.backgroundColor = c.bgSidebar;
        sidebar.style.borderRightColor = c.borderSubtle;
        sidebar.style.borderBottomColor = c.borderSubtle;
        document.getElementById('wb-exp-head').style.color = c.fgMuted;
        document.getElementById('wb-var-head').style.color = c.fgMuted;
        document.getElementById('wb-positron-pane').style.borderTopColor = c.borderSubtle;

        const files = [
          ['color_science.R', 'r', 'R'],
          ['oklch_gamut.py', 'py', 'PY'],
          ['extension.ts', 'ts', 'TS'],
          ['report.qmd', 'qmd', 'QMD'],
        ];
        const fileList = document.getElementById('wb-file-list');
        fileList.innerHTML = '';
        files.forEach(([fname, code, tag]) => {
          const row = document.createElement('div');
          row.className = 'wb-file-item';
          const isCur = activeLang === code;
          row.style.backgroundColor = isCur ? c.tintSelect : 'transparent';
          row.style.color = isCur ? c.fg : c.fgSecondary;
          row.innerHTML = '<span>' + fname + '</span><span style="font-size:10px;color:' + c.type + '">' + tag + '</span>';
          row.addEventListener('click', () => { activeLang = code; render(); });
          fileList.appendChild(row);
        });

        // Compute minimum critical pair DeltaE76 under current vision mode
        const { minCritDe, minPairNames } = computeMinCritDe(c);

        document.getElementById('wb-var-list').innerHTML = [
          '<div class="wb-var-row"><span style="color:' + c.fgVariable + '">active_slug</span><span style="color:' + c.str + '">"' + escHtml(th.slug) + '"</span></div>',
          '<div class="wb-var-row"><span style="color:' + c.fgVariable + '">release_yr</span><span style="color:' + c.num + '">' + th.year + 'L</span></div>',
          '<div class="wb-var-row"><span style="color:' + c.fgVariable + '">min_de76</span><span style="color:' + c.fn + '">' + minCritDe.toFixed(1) + '</span></div>',
          '<div class="wb-var-row"><span style="color:' + c.fgVariable + '">wcag_gate</span><span style="color:' + c.kw + ';font-weight:700">TRUE</span></div>',
        ].join('');

        // Editor code lines
        const codeLines = buildCodeSample(c, activeLang, th);
        const ed = document.getElementById('wb-editor');
        ed.style.backgroundColor = c.bg;
        ed.innerHTML = codeLines.map((ln, idx) => {
          const hi = idx === 5;
          return '<div class="code-line" style="background:' + (hi ? c.bgLine : 'transparent') + '">' +
            '<span class="line-num" style="color:' + (hi ? c.fgSecondary : c.fgMuted) + '">' + (idx + 1) + '</span>' +
            '<span>' + (ln || ' ') + '</span></div>';
        }).join('');

        // Console + 16 ANSI strip
        const con = document.getElementById('wb-console');
        con.style.backgroundColor = c.bgPanel;
        con.style.borderTopColor = c.borderSubtle;
        document.getElementById('wb-ansi-head').style.color = c.fgMuted;

        const fgW = wcag(c.fg, c.bg).toFixed(2);
        const fgLc = Math.abs(apcaLc(c.fg, c.bg)).toFixed(1);
        document.getElementById('wb-console-lines').innerHTML =
          '<div><span style="color:' + c.kw + ';font-weight:700">&gt;</span> <span style="color:' + c.fn + '">audit_palette</span><span style="color:' + c.fgPunct + '">(</span><span style="color:' + c.str + '">"' + escHtml(th.slug) + '"</span><span style="color:' + c.fgPunct + '">)</span></div>' +
          '<div style="color:' + c.fgSecondary + ';margin-top:2px">✔ fg/bg = <span style="color:' + c.num + '">' + fgW + ':1</span> (APCA |Lc| <span style="color:' + c.num + '">' + fgLc + '</span>) · min critical pair ΔE*ab = <span style="color:' + c.type + '">' + minCritDe.toFixed(1) + '</span> (' + minPairNames + ')</div>';

        const ansiOrder = [
          'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
          'brightBlack', 'brightRed', 'brightGreen', 'brightYellow', 'brightBlue', 'brightMagenta', 'brightCyan', 'brightWhite'
        ];
        const ansiStrip = document.getElementById('ansi-strip');
        ansiStrip.innerHTML = '';
        ansiOrder.forEach((slot) => {
          const rawHex = th.ansi[slot];
          const sHex = simHex(rawHex, activeCvd);
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'ansi-cell';
          cell.style.backgroundColor = sHex;
          cell.title = 'ansi.' + slot + ': ' + sHex + ' (WCAG ' + wcag(sHex, c.bgPanel).toFixed(2) + ':1) — click to copy';
          cell.addEventListener('click', () => copyText(sHex, 'Copied ansi.' + slot + ' (' + sHex + ')'));
          ansiStrip.appendChild(cell);
        });

        // Status Bar
        const sb = document.getElementById('wb-statusbar');
        sb.style.backgroundColor = c.status;
        sb.style.color = relLum(c.status) > 0.24 ? '#11161C' : '#F6F7FA';
        document.getElementById('sb-cvd-gate').textContent =
          th.slug === 'gameboy-dark'
            ? '1989 DMG-01 Monochrome LCD Tribute'
            : 'Critical CVD min ΔE*ab: ' + minCritDe.toFixed(1);
        document.getElementById('sb-contrast').textContent = 'WCAG ' + fgW + ':1 · |Lc| ' + fgLc;
        document.getElementById('sb-label').textContent = th.label;

        // Audit Table
        const tbody = document.getElementById('audit-tbody');
        tbody.innerHTML = '';
        let minRoleW = Infinity;
        AUDIT_ROLES.forEach(([roleLabel, key]) => {
          const hex = c[key];
          const ok = hexToOklch(hex);
          const wBg = wcag(hex, c.bg);
          const wLine = wcag(hex, c.bgLine);
          const lc = Math.abs(apcaLc(hex, c.bg));
          if (wBg < minRoleW) minRoleW = wBg;

          const tr = document.createElement('tr');
          tr.className = 'token-row';
          tr.title = 'Click to copy ' + hex;
          tr.innerHTML =
            '<td class="role-cell">' + roleLabel + '</td>' +
            '<td><span class="swatch-chip"><span class="swatch-box" style="background:' + hex + '"></span>' + hex + '</span></td>' +
            '<td>' + (ok.L * 100).toFixed(1) + '% · ' + ok.C.toFixed(3) + ' · ' + ok.H.toFixed(0) + '°</td>' +
            '<td><strong>' + wBg.toFixed(2) + ':1</strong></td>' +
            '<td>' + wLine.toFixed(2) + ':1</td>' +
            '<td>' + lc.toFixed(1) + '</td>';
          tr.addEventListener('click', () => copyText(hex, 'Copied ' + roleLabel + ' (' + hex + ')'));
          tbody.appendChild(tr);
        });

        document.getElementById('audit-summary-badge').textContent =
          '18/18 roles >= 4.5:1 · Floor: ' + minRoleW.toFixed(2) + ':1';
        document.getElementById('cvd-min-readout').textContent =
          'Min critical ΔE*ab (' + activeCvd + '): ' + minCritDe.toFixed(1) + ' (' + minPairNames + ')';

        // Chromaticity legend & pair comparison box
        document.getElementById('chroma-meta').textContent = (compareEnabled && cmpTheme)
          ? 'Solid = ' + th.label + ' · Dashed = ' + cmpTheme.label
          : 'Solid = active · Dashed = Light/Dark sibling';

        const pairBox = document.getElementById('pair-compare-box');
        if (cmpTheme && simCmp) {
          const relationLabel = compareEnabled ? 'Compare target:' : 'Paired variant:';
          pairBox.innerHTML =
            '<span>' + relationLabel + ' <strong>' + escHtml(cmpTheme.label) + '</strong></span>' +
            '<span class="swatch-chip">Identity cursor: <span class="swatch-box" style="background:' + c.cur + '"></span><code>' + c.cur + '</code> ↔ <span class="swatch-box" style="background:' + simCmp.cur + '"></span><code>' + simCmp.cur + '</code></span>';
        }

        drawChromaCanvas(c, simCmp, isLightShell, compareEnabled);
        drawLightnessCanvas(c, isLightShell);
      }

      // Controls & Keyboard Shortcuts
      const searchInput = document.getElementById('console-search');
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        const cur = getActiveTheme();
        renderEraRail(cur);
        if (mapEnabled) renderSimilarityMap(cur, cur.mode === 'light');
      });
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          searchQuery = '';
          searchInput.value = '';
          searchInput.blur();
          const cur = getActiveTheme();
          renderEraRail(cur);
          if (mapEnabled) renderSimilarityMap(cur, cur.mode === 'light');
        }
      });

      document.querySelectorAll('.maker-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          activeMaker = chip.dataset.maker || 'All';
          const cur = getActiveTheme();
          renderEraRail(cur);
          if (mapEnabled) renderSimilarityMap(cur, cur.mode === 'light');
        });
      });

      document.getElementById('btn-reset-filters').addEventListener('click', () => {
        searchQuery = '';
        searchInput.value = '';
        activeMaker = 'All';
        const cur = getActiveTheme();
        renderEraRail(cur);
        if (mapEnabled) renderSimilarityMap(cur, cur.mode === 'light');
      });

      document.getElementById('btn-copy-export').addEventListener('click', () => {
        const cur = getActiveTheme();
        const fmt = document.getElementById('export-format').value || 'vscode';
        const out = formatPaletteExport(cur, fmt);
        copyText(out.text, out.label);
      });

      document.getElementById('btn-compare-toggle').addEventListener('click', () => {
        compareEnabled = !compareEnabled;
        syncUrlHash();
        render();
      });

      document.getElementById('btn-map-toggle').addEventListener('click', () => {
        mapEnabled = !mapEnabled;
        if (mapEnabled && !mapModePinned) {
          mapMode = getActiveTheme().mode;
        }
        mapHoverSlug = null;
        syncUrlHash();
        render();
      });

      document.querySelectorAll('.map-mode-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          mapMode = btn.dataset.mapMode || 'dark';
          mapModePinned = true;
          mapHoverSlug = null;
          syncUrlHash();
          render();
        });
      });

      document.getElementById('map-color-by').addEventListener('change', (e) => {
        mapColorBy = e.target.value || 'swatch';
        render();
      });

      compareSelect.addEventListener('change', (e) => {
        compareSlug = e.target.value;
        compareUserPinned = true;
        syncUrlHash();
        render();
      });

      document.getElementById('btn-compare-swap').addEventListener('click', () => {
        const cur = getActiveTheme();
        const target = getCompareTheme(cur);
        if (!target || target.slug === cur.slug) return;
        compareSlug = cur.slug;
        compareUserPinned = true;
        selectSlug(target.slug, true);
      });

      document.getElementById('btn-toggle-mode').addEventListener('click', () => {
        const cur = getActiveTheme();
        const sib = findSibling(cur);
        if (sib) selectSlug(sib.slug, true);
      });

      document.getElementById('btn-prev-theme').addEventListener('click', () => {
        const pool = getNavigableThemes();
        const idx = pool.findIndex((x) => x.slug === activeSlug);
        const nextIdx = idx === -1 ? pool.length - 1 : (idx - 1 + pool.length) % pool.length;
        selectSlug(pool[nextIdx].slug, true);
      });

      document.getElementById('btn-next-theme').addEventListener('click', () => {
        const pool = getNavigableThemes();
        const idx = pool.findIndex((x) => x.slug === activeSlug);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % pool.length;
        selectSlug(pool[nextIdx].slug, true);
      });

      document.getElementById('btn-random-theme').addEventListener('click', () => {
        const navPool = getNavigableThemes();
        const base = navPool.length > 1 ? navPool : THEMES;
        const pool = base.filter((x) => x.slug !== activeSlug);
        selectSlug(pool[Math.floor(Math.random() * pool.length)].slug, true);
      });

      document.querySelectorAll('.lang-tab').forEach((tab) => {
        tab.addEventListener('click', () => { activeLang = tab.dataset.lang; render(); });
      });

      document.querySelectorAll('.cvd-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeCvd = btn.dataset.cvd;
          syncUrlHash();
          render();
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const k = e.key.toLowerCase();
        if (e.key === '/') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        } else if (k === 'c') {
          document.getElementById('btn-compare-toggle').click();
        } else if (k === 'm') {
          document.getElementById('btn-map-toggle').click();
        } else if (k === 't') {
          document.getElementById('btn-toggle-mode').click();
        } else if (k === 'r') {
          document.getElementById('btn-random-theme').click();
        } else if (e.key === 'ArrowLeft') {
          document.getElementById('btn-prev-theme').click();
        } else if (e.key === 'ArrowRight') {
          document.getElementById('btn-next-theme').click();
        } else if (k === '1') { activeCvd = 'normal'; syncUrlHash(); render(); }
        else if (k === '2') { activeCvd = 'protan'; syncUrlHash(); render(); }
        else if (k === '3') { activeCvd = 'deutan'; syncUrlHash(); render(); }
        else if (k === '4') { activeCvd = 'tritan'; syncUrlHash(); render(); }
      });

      window.addEventListener('hashchange', () => {
        if (!IS_WEB) return;
        if (applyHashState(window.location.hash)) {
          if (!mapModePinned) mapMode = getActiveTheme().mode;
          render();
        }
      });

      window.addEventListener('resize', () => render());
      if (!mapModePinned) mapMode = getActiveTheme().mode;
      render();
    })();
  </script>
</body>
</html>
`;
}

function main() {
  const dataset = loadThemeDataset();
  const mdsMeta = enrichDatasetWithSimilarity(dataset);
  fs.mkdirSync(SITE_DIR, { recursive: true });
  fs.mkdirSync(WEBVIEW_DIR, { recursive: true });

  const webHtml = buildHtml({ dataset, mdsMeta, target: 'web' });
  const webviewHtml = buildHtml({ dataset, mdsMeta, target: 'webview' });

  fs.writeFileSync(path.join(SITE_DIR, 'index.html'), webHtml);
  fs.writeFileSync(path.join(SITE_DIR, '.nojekyll'), '');
  fs.copyFileSync(path.join(ROOT_DIR, 'icon.png'), path.join(SITE_DIR, 'icon.png'));
  fs.copyFileSync(path.join(ROOT_DIR, 'assets', 'banner', 'banner-dark.png'), path.join(SITE_DIR, 'og-preview.png'));

  fs.writeFileSync(path.join(WEBVIEW_DIR, 'explorer.html'), webviewHtml);

  console.log(
    `Generated site/index.html (${(Buffer.byteLength(webHtml) / 1024).toFixed(1)} KB), site/og-preview.png, and assets/explorer/explorer.html (${(Buffer.byteLength(webviewHtml) / 1024).toFixed(1)} KB) across ${dataset.length} themes.`
  );
}

if (require.main === module) {
  main();
}

module.exports = {
  loadThemeDataset,
  jacobiEigenSymmetric,
  computeClassicalMds2d,
  enrichDatasetWithSimilarity,
  buildHtml,
};
