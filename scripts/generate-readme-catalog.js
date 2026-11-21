#!/usr/bin/env node
'use strict';

// Dev-only tool: prints the era-grouped color-swatch catalog table for
// README.md, reading directly from palettes/*.js so it can never drift from
// the actual shipped colors. Run with:
//   node scripts/generate-readme-catalog.js
// then place the output into README.md between the CATALOG markers.

const fs = require('fs');
const path = require('path');

const ERAS = [
  {
    title: '8-bit Pioneers (1977–1989)',
    consoles: ['Atari 2600', 'NES', 'Sega Master System', 'Game Boy'],
  },
  {
    title: '16-bit Golden Age (1987–1990)',
    consoles: ['TurboGrafx-16', 'Sega Genesis', 'SNES', 'Neo Geo AES'],
  },
  {
    title: '32/64-bit Polygon Era (1994–1998)',
    consoles: ['Sega Saturn', 'PlayStation', 'Nintendo 64', 'Game Boy Color'],
  },
  {
    title: '128-bit & Millennial Classics (1998–2001)',
    consoles: ['Sega Dreamcast', 'PlayStation 2', 'Game Boy Advance', 'Nintendo GameCube', 'Original Xbox'],
  },
  {
    title: 'HD, Motion & Portable Era (2004–2011)',
    consoles: ['Nintendo DS', 'PlayStation Portable', 'Xbox 360', 'Nintendo Wii', 'PlayStation 3', 'Nintendo 3DS', 'PlayStation Vita'],
  },
  {
    title: 'Modern, Hybrid & Portable PC (2013–2022)',
    consoles: ['PlayStation 4', 'Xbox One', 'Nintendo Switch', 'PlayStation 5', 'Xbox Series X|S', 'Steam Deck'],
  },
];

function loadPalettes() {
  const dir = path.join(__dirname, '..', 'palettes');
  const byConsole = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
    const p = require(path.join(dir, f));
    byConsole[p.console] = byConsole[p.console] || {};
    byConsole[p.console][p.tokens.mode] = p;
    byConsole[p.console].year = p.year;
    byConsole[p.console].maker = p.maker;
  }
  return byConsole;
}

function swatch(hex) {
  return `![](assets/swatches/${hex.replace('#', '').toUpperCase()}.png)`;
}

function strip(t) {
  return [t.bg, t.accentKeyword, t.accentString, t.accentFunction, t.accentType].map(swatch).join(' ');
}

function main() {
  const byConsole = loadPalettes();
  let out = '';
  for (const era of ERAS) {
    out += `\n**${era.title}**\n\n`;
    out += `| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |\n`;
    out += `|---|---|---|\n`;
    for (const consoleName of era.consoles) {
      const entry = byConsole[consoleName];
      if (!entry) { console.error('MISSING CONSOLE:', consoleName); continue; }
      const light = entry.light ? strip(entry.light.tokens) : '—';
      const dark = entry.dark ? strip(entry.dark.tokens) : '—';
      const safeName = consoleName.replace(/\|/g, '\\|');
      out += `| **${safeName}** (${entry.year} · ${entry.maker}) | ${light} | ${dark} |\n`;
    }
  }
  process.stdout.write(out);
}

main();
