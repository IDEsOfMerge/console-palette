# Changelog

All notable changes to **Console Palette** will be documented in this file.

## [1.1.0] — 2026-11-20

### Added
- **Expanded Console Palette to 39 iconic gaming consoles (78 Light & Dark OKLCH themes) spanning 49 years of hardware (1977–2026)** across **7 hardware eras**, adding **9 new consoles (18 themes)**:
  - **Atari lineage expansion**: **Atari Lynx** (1989 · backlit color LCD cyan & Atari flame-orange) and **Atari Jaguar** (1993 · Tempest 2000 electric violet, Jaguar Claw crimson & AvP acid green) — joined with **Atari 2600** (1977) under a dedicated **Atari** Explorer filter chip and **ATARI** Hardware Lineage Metro Map track.
  - **Classic & Indie hardware**: **Virtual Boy** (1995 · neutral matte controller grey Light & pitch-black 650nm crimson-LED visor Dark) and **Playdate** (2022 · warm canary-yellow chassis & 1-bit Sharp Memory LCD ink Light, Teenage Engineering studio-charcoal & blazing Playdate Yellow Dark).
  - **New 7th Era — Next-Gen & Spatial Era (2023–2026)**:
    - **PlayStation Portal** (2023 · DualSense White / Midnight Black grips with glowing sapphire Remote Play lightbars).
    - **Nintendo Switch 2** (2025 · Basic Light / matte-black Basic Dark illuminated by magnetic Joy-Con 2 Light Blue & Light Red rail accents).
    - **ROG Xbox Ally** (2025 · White Ally Light & Black Ally X Dark uniting Xbox Guide emerald with ROG Fearless-Eye crimson & Nebula cyan).
    - **Steam Machine** (2026 · swappable walnut & red-fabric magnetic faceplates Light / 6-inch matte-black cube with 17-LED addressable blue-cyan status bar Dark).
    - **Steam Frame** (2026 · optical frosted-silver / light-blocker VR obsidian with pancake-lens SteamVR cyan-teal & Half-Life Lambda amber).
- **Updated colorimetry, Explorer & visual suite**: `1,560 / 1,560` WCAG 2.1 AA foreground/syntax tokens, `1,248 / 1,248` ANSI slots, `11,856` verified `positron*` keys, **0 severe / 0 moderate CVD collisions** across all 77 polychromatic themes (`≥ 10.37 ΔE*ab`), `6×13` 78-theme colorspace grid, 7-era fingerprint & timeline diagrams, 1977–2026 Hardware Lineage Metro Map, 677 local swatch PNGs, and 43 zero-dependency unit tests.

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
- **Modern VS Code & Positron UI coverage**: full styling across Command Center, AI Chat / Inline Chat, Test Explorer, Terminal Sticky Scroll, and `9,120` verified Positron IDE workbench color token usages across all 60 themes.
- **Offline Interactive Workbench & Colorimetry Explorer** (`Console Palette: Open Palette & Colorimetry Explorer`) with live search and manufacturer filter chips, Side-by-Side Compare mode (`C`), multi-format palette export (**VS Code**, **Ghostty**, **WezTerm**, **Alacritty**, **CSS variables**), live R / Python / TypeScript / Quarto+SQL syntax previews, real-time dichromacy simulation, dual OKLab chromaticity polygons, OKLCH lightness ladder, one-click hex copy, responsive mobile layout, and **Live-sync IDE** support, plus a zero-CDN GitHub Pages web bundle (`site/index.html` with OpenGraph preview card).
- **Rich extension ergonomics**: smart per-console Light ↔ Dark toggle (`Ctrl+K Ctrl+G` / `Cmd+K Cmd+G`), chronological live-preview QuickPick searchable by maker/year/era (`Console Palette: Pick Console Theme`), Random Theme & mode-preserving Random Theme, one-click OS Light/Dark pair sync (`Console Palette: Sync Current Console with OS Light/Dark`), configurable Status Bar badge (`consolePalette.showStatusBarItem`), Welcome Walkthrough, lightweight `.vsix` packaging (~431 KB), and 42 zero-dependency unit tests (`node --test`).
- **Algorithmic visual & analytical suite**: 4× supersampled 3D-beveled Light/Dark gamepad crest icon, 2× Retina Dark/Light Retro Terminal banners, launch-timeline and build-pipeline diagrams, Hardware Lineage Metro Map, animated IDE showcase GIF, 536 local swatch PNGs, and CIE Lab PCA / Ward's clustering / CVD audit visualizations.
