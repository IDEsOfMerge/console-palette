# Changelog

All notable changes to **Console Palette** will be documented in this file.

## [1.0.0] — 2026-11-20

### Added
- **60 perceptually calibrated Light & Dark themes across 30 iconic gaming consoles (1977–2022)** spanning 6 hardware eras and 8 makers (Atari, Nintendo, Sega, NEC/Hudson, SNK, Sony, Microsoft, Valve):
  - **8-bit Pioneers (1977–1989)**: Atari 2600, NES, Sega Master System, Game Boy (with an authentic 1989 DMG-01 4-shade olive LCD monochrome hardware tribute in *Game Boy Dark*).
  - **16-bit Golden Age (1987–1990)**: TurboGrafx-16 (PC Engine Light ↔ TurboGrafx-16 Dark), Sega Genesis, SNES (NA lavender-violet + Super Famicom 4-color ABXY), Neo Geo AES.
  - **32/64-bit Polygon Era (1994–1998)**: Sega Saturn, PlayStation, Nintendo 64, Game Boy Color.
  - **128-bit & Millennial Classics (1998–2001)**: Sega Dreamcast, PlayStation 2, Game Boy Advance, Nintendo GameCube, Xbox.
  - **HD, Motion & Portable Era (2004–2011)**: Nintendo DS, PlayStation Portable, Xbox 360, Nintendo Wii, PlayStation 3, Nintendo 3DS, PlayStation Vita.
  - **Modern, Hybrid & Portable PC (2013–2022)**: PlayStation 4, Xbox One, Nintendo Switch, PlayStation 5, Xbox Series X|S, Steam Deck.
- **Perceptual OKLCH colorimetry & automated validation pipeline**:
  - `1,200 / 1,200` foreground and syntax tokens clearing WCAG 2.1 AA (`≥ 4.5:1` on `editor.background`, `≥ 3.8:1` on `editor.lineHighlightBackground`).
  - `960 / 960` ANSI terminal colors verified for contrast and canonical hue fidelity.
  - `9,120` verified Positron IDE workbench color token usages across all 60 themes.
  - Zero severe (`< 5 ΔE*ab`) and zero moderate (`< 10 ΔE*ab`) critical adjacent syntax collisions under simulated protanopia, deuteranopia, and tritanopia (Machado, Oliveira & Fernandes 2009) across all 59 polychromatic themes.
- **Offline Interactive Workbench & Colorimetry Explorer** (`Console Palette: Open Palette & Colorimetry Explorer`) with live R / Python / TypeScript / Quarto+SQL syntax previews, real-time dichromacy simulation, OKLab chromaticity polygons, OKLCH lightness ladder, one-click hex copy, and **Live-sync IDE** support, plus a zero-CDN GitHub Pages web bundle (`site/index.html`).
- **Smart per-console Light ↔ Dark toggle** (`Ctrl+K Ctrl+G` / `Cmd+K Cmd+G`), chronological live-preview QuickPick (`Console Palette: Pick Console Theme`), Random Theme command, active Status Bar badge, and Welcome Walkthrough.
- **Algorithmic visual & analytical suite**: 4× supersampled 3D-beveled Light/Dark gamepad crest icon, 2× Retina Dark/Light Retro Terminal banners, launch-timeline and build-pipeline diagrams, Hardware Lineage Metro Map, animated IDE showcase GIF, 538 local swatch PNGs, and CIE Lab PCA / Ward's clustering / CVD audit visualizations.
