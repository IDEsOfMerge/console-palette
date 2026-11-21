<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner/banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner/banner-light.png">
  <img alt="Console Palette — 45 Years of Hardware (1977–2022) · 30 Iconic Gaming Consoles · 60 Light &amp; Dark Themes · VS Code / Positron · OKLCH Colorimetry · 100% WCAG AA · APCA-W3 · CIEDE2000 · CVD Safe" src="assets/banner/banner-dark.png" width="900">
</picture>

# Console Palette

**A Light and Dark color theme for every iconic gaming console.**
30 consoles · 60 themes · one VS Code / Positron extension.

*An independent tribute to 45 years of gaming console industrial design, controller color craft, and display hardware (1977–2022).*

![hardware eras](https://img.shields.io/badge/hardware_eras-1977%E2%80%932022-3B8CE8?style=flat-square)
[![explorer](https://img.shields.io/badge/live_explorer-interactive_workbench-6247B8?style=flat-square)](https://idesofmerge.github.io/console-palette/)
[![build](https://github.com/idesofmerge/console-palette/actions/workflows/build.yml/badge.svg)](https://github.com/idesofmerge/console-palette/actions/workflows/build.yml)
![version](https://img.shields.io/badge/version-1.0.0-264EB5?style=flat-square)
![themes](https://img.shields.io/badge/themes-60-7209B7?style=flat-square)
![consoles](https://img.shields.io/badge/consoles-30-00A896?style=flat-square)
![contrast](https://img.shields.io/badge/WCAG_AA-100%25_(1200%2F1200)-2A5F25?style=flat-square)
![perceptual](https://img.shields.io/badge/OKLCH_%C2%B7_APCA_%C2%B7_CIEDE2000-verified-1B5EA8?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

**[Launch the Live Interactive Workbench & Colorimetry Explorer ↗](https://idesofmerge.github.io/console-palette/)**
*(Or run **`Console Palette: Open Palette & Colorimetry Explorer`** directly inside VS Code / Positron!)*

<br>

<img src="assets/showcase/console-palette-demo.gif" alt="Animated preview of Console Palette themes running in a VS Code and Positron IDE workbench — cycling across SNES, PlayStation, Game Boy, Sega Dreamcast, Original Xbox, and Nintendo Switch in Light and Dark modes with live WCAG contrast readouts and the Ctrl+K Ctrl+G per-console toggle" width="900">

</div>

---

Every pair in **Console Palette** is individually authored from its machine's authentic outer plastic shell, controller face buttons, LED indicators, boot/BIOS screen, and display hardware — never a generic syntax template reskinned onto a new background:

- **PlayStation (PS1)** maps syntax roles directly to the iconic DualShock geometric quartet — Triangle Emerald, Circle Coral, Cross Cobalt, and Square Rose — anchored by the unmistakable amber-orange startup BIOS diamond.
- **SNES** unites both regional legends in one pair: North American warm grey-lavender shell & violet switches alongside the Japanese/PAL Super Famicom four-color ABXY palette.
- **TurboGrafx-16** flips across the Pacific on Light ↔ Dark toggle: crisp ivory Japanese **PC Engine** with vermilion HuCard accents in Light mode, and stealth charcoal-black North American **TurboGrafx-16** with blazing tangerine lettering in Dark mode.
- **Game Boy Dark** honors the 1989 DMG-01's iconic 4-shade reflective olive-green STN LCD (`#0F380F`–`#9BBC0F`) with a perceptually monotonic OKLCH lightness ramp that still clears WCAG AA across every role, keeping only the glowing left-bezel battery LED for errors.
- **Sega Dreamcast**, **Original Xbox**, **Nintendo Switch**, and **Steam Deck** anchor their entire syntax envelopes to each console's unmistakable hardware signature — orange swirl & VMU seafoam, radioactive flubber emerald, Neon Blue & Neon Red Joy-Cons, and OLED flame-orange & Steam steel-blue.

Every palette is synthesized and verified in **OKLCH** perceptual color space against **WCAG 2.1**, **APCA-W3**, **CIEDE2000** (ΔE₀₀), and **Machado et al. (2009)** dichromacy simulation. Design inspiration comes strictly from **industrial color language and hardware atmosphere** — no console logos, trademarks, sprites, or copyrighted assets are included or referenced anywhere in this repository.

## The 30 consoles, by launch year

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/release-timeline-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/diagrams/release-timeline-light.png">
  <img alt="Console Palette — 30 Iconic Gaming Consoles by Launch Year (1977–2022) across 6 hardware eras: 8-bit Pioneers (Atari 2600, NES, Master System, Game Boy), 16-bit Golden Age (TurboGrafx-16, Sega Genesis, SNES, Neo Geo AES), 32/64-bit Polygon (Sega Saturn, PlayStation, Nintendo 64, Game Boy Color), 128-bit &amp; Millennial (Sega Dreamcast, PlayStation 2, Game Boy Advance, GameCube, Original Xbox), HD, Motion &amp; Portable (Nintendo DS, PSP, Xbox 360, Nintendo Wii, PlayStation 3, Nintendo 3DS, PS Vita), and Modern &amp; Hybrid (PlayStation 4, Xbox One, Nintendo Switch, PlayStation 5, Xbox Series X|S, Steam Deck)" src="assets/diagrams/release-timeline-dark.png" width="900">
</picture>

## ...and by hardware lineage

Organized as a transit metro map across manufacturer lines — showing how **Nintendo Home** (NES → Wii) and **Nintendo Handheld** (Game Boy → 3DS) physically converge into the hybrid **Nintendo Switch**, how **PlayStation** branches into **PSP → PS Vita**, and how **Sega**, **Xbox**, **Arcade Pioneers**, and **Steam Deck** trace 45 years of hardware evolution:

<img src="assets/timeline/timeline-metro.png" alt="Console Palette Hardware Lineage Metro Map across 30 iconic consoles from 1977 to 2022 showing manufacturer tracks for Arcade/Pioneers, Nintendo Home and Handheld converging at Nintendo Switch, Sega, PlayStation branching to PSP and PS Vita, Xbox, and Steam Deck" width="900">

```sh
python3 scripts/generate-color-science-assets.py  # or: Rscript --vanilla analysis/timeline_metro.R
```

## Every pair tells a hardware story

Four examples of how a Light/Dark pair is built — anchored to each console's real plastic finish, controller buttons, and display lighting while maintaining strict perceptual contrast and OKLCH lightness separation:

### SNES (1990) — warm grey-lavender shell & Super Famicom 4-color ABXY

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/E9E9F2.png) `#E9E9F2` classic warm grey-lavender shell | ![](assets/swatches/0E0E19.png) `#0E0E19` Mode-7 midnight indigo-slate |
| Keywords | ![](assets/swatches/4D35A9.png) `#4D35A9` North American concave violet | ![](assets/swatches/BAB3FF.png) `#BAB3FF` luminous SNES lavender |
| Strings | ![](assets/swatches/AC0D27.png) `#AC0D27` Super Famicom Red A button | ![](assets/swatches/FF7059.png) `#FF7059` CRT coral-ruby A button |
| Functions | ![](assets/swatches/004783.png) `#004783` Super Famicom Blue X button | ![](assets/swatches/008FE4.png) `#008FE4` luminous Super Famicom azure |
| Types | ![](assets/swatches/006F30.png) `#006F30` Super Famicom Green Y button | ![](assets/swatches/50CA73.png) `#50CA73` crisp Mode-7 emerald Y button |
| **Identity accent** | ![](assets/swatches/6247B8.png) `#6247B8` **SNES switch violet** | ![](assets/swatches/A288FF.png) `#A288FF` glowing violet focus |

### PlayStation (1994) — iconic PS1 grey, amber boot diamond & △ ○ × □ quartet

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/E5E7EA.png) `#E5E7EA` unmistakable 1994 PlayStation grey | ![](assets/swatches/0B0E16.png) `#0B0E16` black-bottomed CD & BIOS void |
| Keywords | ![](assets/swatches/00603A.png) `#00603A` **△ Triangle** emerald green | ![](assets/swatches/36D38B.png) `#36D38B` luminous Triangle emerald |
| Strings | ![](assets/swatches/AF1B3E.png) `#AF1B3E` **○ Circle** coral crimson | ![](assets/swatches/FF836E.png) `#FF836E` glowing Circle coral |
| Functions | ![](assets/swatches/003471.png) `#003471` **× Cross** cobalt blue | ![](assets/swatches/188AF1.png) `#188AF1` electric Cross sapphire |
| Types | ![](assets/swatches/8C256A.png) `#8C256A` **□ Square** rose-magenta | ![](assets/swatches/F67DC8.png) `#F67DC8` neon Square rose pink |
| **Identity accent** | ![](assets/swatches/DE6A16.png) `#DE6A16` **Sony boot diamond orange** | ![](assets/swatches/F58426.png) `#F58426` glowing BIOS startup amber |

### Sega Dreamcast (1998) — frost-white shell, orange spiral swirl & VMU teal

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/EEF2F7.png) `#EEF2F7` 9/9/99 frost-white casing | ![](assets/swatches/0B1013.png) `#0B1013` Sega Sports Black edition |
| Keywords | ![](assets/swatches/6F2A00.png) `#6F2A00` burnt Dreamcast swirl orange | ![](assets/swatches/FF9464.png) `#FF9464` glowing spiral swirl tangerine |
| Strings | ![](assets/swatches/A81939.png) `#A81939` controller crimson B accent | ![](assets/swatches/FF767F.png) `#FF767F` arcade coral-crimson |
| Functions | ![](assets/swatches/002853.png) `#002853` Sega / PAL swirl cobalt blue | ![](assets/swatches/35A8FF.png) `#35A8FF` luminous GD-ROM sky blue |
| Types | ![](assets/swatches/006657.png) `#006657` VMU screen deep seafoam-teal | ![](assets/swatches/02E7C3.png) `#02E7C3` backlit VMU seafoam-cyan |
| **Identity accent** | ![](assets/swatches/E05212.png) `#E05212` **Dreamcast swirl orange** | ![](assets/swatches/FF6B1E.png) `#FF6B1E` radiant swirl beacon |

### Nintendo Switch (2017) — OLED White / Basic Black UI & Neon Joy-Con duotone

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/F0F3F6.png) `#F0F3F6` Switch OLED White / Basic White UI | ![](assets/swatches/0F1216.png) `#0F1216` Switch Basic Black Home UI |
| Keywords | ![](assets/swatches/00713C.png) `#00713C` Splatoon / eShop emerald | ![](assets/swatches/64EE93.png) `#64EE93` luminous Joy-Con lime-emerald |
| Strings | ![](assets/swatches/C92035.png) `#C92035` **Neon Red Joy-Con** crimson | ![](assets/swatches/FF7F89.png) `#FF7F89` glowing Neon Coral-Red Joy-Con |
| Functions | ![](assets/swatches/003C4D.png) `#003C4D` **Neon Blue Joy-Con** deep cyan | ![](assets/swatches/0099B6.png) `#0099B6` luminous Neon Cyan-Blue Joy-Con |
| Types | ![](assets/swatches/1D44A3.png) `#1D44A3` docked cobalt-indigo | ![](assets/swatches/8BAAFF.png) `#8BAAFF` crisp Home-grid periwinkle |
| **Identity accent** | ![](assets/swatches/E60012.png) `#E60012` **Nintendo Switch Red** | ![](assets/swatches/FF4554.png) `#FF4554` radiant Neon Red cursor |

## The full catalog

<details>
<summary><strong>All 60 themes across 30 iconic consoles, era by era — click to expand</strong></summary>

Each swatch strip reads left to right: **background · keywords · strings · functions · types**. Every single theme has unique primary hexes — zero copy-pasted syntax templates across consoles.

<!-- CATALOG:START -->
**8-bit Pioneers (1977–1989)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Atari 2600** (1977 · Atari) | ![](assets/swatches/F3EBDC.png) ![](assets/swatches/720023.png) ![](assets/swatches/A92743.png) ![](assets/swatches/003760.png) ![](assets/swatches/006966.png) | ![](assets/swatches/150E0A.png) ![](assets/swatches/FF9C6C.png) ![](assets/swatches/FF817C.png) ![](assets/swatches/0091DB.png) ![](assets/swatches/00C7C3.png) |
| **NES** (1985 · Nintendo) | ![](assets/swatches/ECEAE5.png) ![](assets/swatches/730015.png) ![](assets/swatches/005032.png) ![](assets/swatches/00336D.png) ![](assets/swatches/006B6E.png) | ![](assets/swatches/0E1115.png) ![](assets/swatches/FF8F90.png) ![](assets/swatches/4BBE64.png) ![](assets/swatches/008EE9.png) ![](assets/swatches/00D1D6.png) |
| **Sega Master System** (1985 · Sega) | ![](assets/swatches/EBF1F6.png) ![](assets/swatches/004AA5.png) ![](assets/swatches/900001.png) ![](assets/swatches/004123.png) ![](assets/swatches/006169.png) | ![](assets/swatches/0A0F15.png) ![](assets/swatches/7BBFFF.png) ![](assets/swatches/FF7777.png) ![](assets/swatches/009255.png) ![](assets/swatches/00DCE9.png) |
| **Game Boy** (1989 · Nintendo) | ![](assets/swatches/E8E6DA.png) ![](assets/swatches/8A155F.png) ![](assets/swatches/3B6F30.png) ![](assets/swatches/011873.png) ![](assets/swatches/003E28.png) | ![](assets/swatches/0F380F.png) ![](assets/swatches/9BBC0F.png) ![](assets/swatches/B6D63C.png) ![](assets/swatches/8CC42B.png) ![](assets/swatches/A6CF52.png) |

**16-bit Golden Age (1987–1990)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **TurboGrafx-16** (1987 · NEC / Hudson) | ![](assets/swatches/F5F1E8.png) ![](assets/swatches/8B000F.png) ![](assets/swatches/4A002E.png) ![](assets/swatches/00304C.png) ![](assets/swatches/004C36.png) | ![](assets/swatches/140D0B.png) ![](assets/swatches/FF9460.png) ![](assets/swatches/D55CA9.png) ![](assets/swatches/00A0D0.png) ![](assets/swatches/05CC97.png) |
| **Sega Genesis** (1988 · Sega) | ![](assets/swatches/E8EEF4.png) ![](assets/swatches/004D9E.png) ![](assets/swatches/B52337.png) ![](assets/swatches/003315.png) ![](assets/swatches/004950.png) | ![](assets/swatches/090D14.png) ![](assets/swatches/79B9FF.png) ![](assets/swatches/FF958F.png) ![](assets/swatches/3CA059.png) ![](assets/swatches/00D7E3.png) |
| **SNES** (1990 · Nintendo) | ![](assets/swatches/E9E9F2.png) ![](assets/swatches/4D35A9.png) ![](assets/swatches/AC0D27.png) ![](assets/swatches/004783.png) ![](assets/swatches/006F30.png) | ![](assets/swatches/0E0E19.png) ![](assets/swatches/BAB3FF.png) ![](assets/swatches/FF7059.png) ![](assets/swatches/008FE4.png) ![](assets/swatches/50CA73.png) |
| **Neo Geo AES** (1990 · SNK) | ![](assets/swatches/F2EEE1.png) ![](assets/swatches/6D4700.png) ![](assets/swatches/B82131.png) ![](assets/swatches/003666.png) ![](assets/swatches/005454.png) | ![](assets/swatches/0F0C07.png) ![](assets/swatches/DEAD00.png) ![](assets/swatches/FF847D.png) ![](assets/swatches/008EED.png) ![](assets/swatches/00C7C6.png) |

**32/64-bit Polygon Era (1994–1998)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Sega Saturn** (1994 · Sega) | ![](assets/swatches/E7F1F5.png) ![](assets/swatches/004444.png) ![](assets/swatches/89004D.png) ![](assets/swatches/00508D.png) ![](assets/swatches/256B35.png) | ![](assets/swatches/071016.png) ![](assets/swatches/00CECD.png) ![](assets/swatches/D74A8A.png) ![](assets/swatches/3FA7FF.png) ![](assets/swatches/86F298.png) |
| **PlayStation** (1994 · Sony) | ![](assets/swatches/E5E7EA.png) ![](assets/swatches/00603A.png) ![](assets/swatches/AF1B3E.png) ![](assets/swatches/003471.png) ![](assets/swatches/8C256A.png) | ![](assets/swatches/0B0E16.png) ![](assets/swatches/36D38B.png) ![](assets/swatches/FF836E.png) ![](assets/swatches/188AF1.png) ![](assets/swatches/F67DC8.png) |
| **Nintendo 64** (1996 · Nintendo) | ![](assets/swatches/EBECE4.png) ![](assets/swatches/136524.png) ![](assets/swatches/B71F30.png) ![](assets/swatches/002450.png) ![](assets/swatches/2B0062.png) | ![](assets/swatches/0F0F17.png) ![](assets/swatches/76EC8C.png) ![](assets/swatches/FFA59F.png) ![](assets/swatches/008CEF.png) ![](assets/swatches/B09CFF.png) |
| **Game Boy Color** (1998 · Nintendo) | ![](assets/swatches/F2F0E2.png) ![](assets/swatches/8C0667.png) ![](assets/swatches/A72123.png) ![](assets/swatches/2A1C86.png) ![](assets/swatches/006F61.png) | ![](assets/swatches/110B1A.png) ![](assets/swatches/E663BC.png) ![](assets/swatches/FC694F.png) ![](assets/swatches/0C8CED.png) ![](assets/swatches/00D9D7.png) |

**128-bit & Millennial Classics (1998–2001)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Sega Dreamcast** (1998 · Sega) | ![](assets/swatches/EEF2F7.png) ![](assets/swatches/6F2A00.png) ![](assets/swatches/A81939.png) ![](assets/swatches/002853.png) ![](assets/swatches/006657.png) | ![](assets/swatches/0B1013.png) ![](assets/swatches/FF9464.png) ![](assets/swatches/FF767F.png) ![](assets/swatches/35A8FF.png) ![](assets/swatches/02E7C3.png) |
| **PlayStation 2** (2000 · Sony) | ![](assets/swatches/EAF0F9.png) ![](assets/swatches/004EAC.png) ![](assets/swatches/AF1C33.png) ![](assets/swatches/003D48.png) ![](assets/swatches/006641.png) | ![](assets/swatches/050A19.png) ![](assets/swatches/90CBFF.png) ![](assets/swatches/FF817D.png) ![](assets/swatches/009BAB.png) ![](assets/swatches/43D58F.png) |
| **Game Boy Advance** (2001 · Nintendo) | ![](assets/swatches/DFEEF9.png) ![](assets/swatches/373DAD.png) ![](assets/swatches/B01C2E.png) ![](assets/swatches/00464D.png) ![](assets/swatches/006C34.png) | ![](assets/swatches/090C1D.png) ![](assets/swatches/A8B2FF.png) ![](assets/swatches/FE6749.png) ![](assets/swatches/00A6B2.png) ![](assets/swatches/48CB78.png) |
| **Nintendo GameCube** (2001 · Nintendo) | ![](assets/swatches/EAEBF5.png) ![](assets/swatches/4735B0.png) ![](assets/swatches/B11631.png) ![](assets/swatches/003763.png) ![](assets/swatches/006539.png) | ![](assets/swatches/0D0B1D.png) ![](assets/swatches/B5B5FF.png) ![](assets/swatches/FF8B7B.png) ![](assets/swatches/0090DF.png) ![](assets/swatches/5EEB9E.png) |
| **Original Xbox** (2001 · Microsoft) | ![](assets/swatches/E8F0E8.png) ![](assets/swatches/2F4700.png) ![](assets/swatches/A00021.png) ![](assets/swatches/003C77.png) ![](assets/swatches/00595A.png) | ![](assets/swatches/081008.png) ![](assets/swatches/6DD043.png) ![](assets/swatches/FF856F.png) ![](assets/swatches/008EE7.png) ![](assets/swatches/00D8DA.png) |

**HD, Motion & Portable Era (2004–2011)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Nintendo DS** (2004 · Nintendo) | ![](assets/swatches/ECF4F9.png) ![](assets/swatches/003F5E.png) ![](assets/swatches/B50033.png) ![](assets/swatches/005B5A.png) ![](assets/swatches/007B4E.png) | ![](assets/swatches/081016.png) ![](assets/swatches/4FCDFF.png) ![](assets/swatches/FF7D93.png) ![](assets/swatches/009CA4.png) ![](assets/swatches/70EA97.png) |
| **PlayStation Portable** (2004 · Sony) | ![](assets/swatches/EEF0F7.png) ![](assets/swatches/0061A2.png) ![](assets/swatches/7B0045.png) ![](assets/swatches/003E43.png) ![](assets/swatches/006644.png) | ![](assets/swatches/060D17.png) ![](assets/swatches/99D6FF.png) ![](assets/swatches/E15493.png) ![](assets/swatches/009CA5.png) ![](assets/swatches/2ACC8A.png) |
| **Xbox 360** (2005 · Microsoft) | ![](assets/swatches/EEF1EA.png) ![](assets/swatches/33782D.png) ![](assets/swatches/3D1200.png) ![](assets/swatches/003669.png) ![](assets/swatches/2F005D.png) | ![](assets/swatches/0C110D.png) ![](assets/swatches/6DD056.png) ![](assets/swatches/FF7E2D.png) ![](assets/swatches/3DA9FF.png) ![](assets/swatches/CFBAFF.png) |
| **Nintendo Wii** (2006 · Nintendo) | ![](assets/swatches/F0F6F9.png) ![](assets/swatches/00575B.png) ![](assets/swatches/AE2134.png) ![](assets/swatches/0C3092.png) ![](assets/swatches/007B50.png) | ![](assets/swatches/050F14.png) ![](assets/swatches/00CAE3.png) ![](assets/swatches/FF847B.png) ![](assets/swatches/6BA7FF.png) ![](assets/swatches/63F0A8.png) |
| **PlayStation 3** (2006 · Sony) | ![](assets/swatches/ECEDF3.png) ![](assets/swatches/122B8E.png) ![](assets/swatches/AD203D.png) ![](assets/swatches/003B4F.png) ![](assets/swatches/006B59.png) | ![](assets/swatches/0B0D14.png) ![](assets/swatches/8EB3FF.png) ![](assets/swatches/FF8083.png) ![](assets/swatches/0099B8.png) ![](assets/swatches/00CBA7.png) |
| **Nintendo 3DS** (2011 · Nintendo) | ![](assets/swatches/E6F4F4.png) ![](assets/swatches/187332.png) ![](assets/swatches/7A2600.png) ![](assets/swatches/004B57.png) ![](assets/swatches/0D1372.png) | ![](assets/swatches/061013.png) ![](assets/swatches/51D26E.png) ![](assets/swatches/E46118.png) ![](assets/swatches/00ABC3.png) ![](assets/swatches/92A8FF.png) |
| **PlayStation Vita** (2011 · Sony) | ![](assets/swatches/E8F1F9.png) ![](assets/swatches/004885.png) ![](assets/swatches/AB0B37.png) ![](assets/swatches/006338.png) ![](assets/swatches/894CAB.png) | ![](assets/swatches/020A19.png) ![](assets/swatches/00A4F7.png) ![](assets/swatches/FFA4A7.png) ![](assets/swatches/00B56B.png) ![](assets/swatches/E2A8FF.png) |

**Modern, Hybrid & Portable PC (2013–2022)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **PlayStation 4** (2013 · Sony) | ![](assets/swatches/EAF0F7.png) ![](assets/swatches/0047AE.png) ![](assets/swatches/C13140.png) ![](assets/swatches/004748.png) ![](assets/swatches/006E35.png) | ![](assets/swatches/040D1E.png) ![](assets/swatches/67BCFF.png) ![](assets/swatches/FF7E8C.png) ![](assets/swatches/00AEB0.png) ![](assets/swatches/6CEA95.png) |
| **Xbox One** (2013 · Microsoft) | ![](assets/swatches/EDF2ED.png) ![](assets/swatches/006537.png) ![](assets/swatches/AD2039.png) ![](assets/swatches/004B74.png) ![](assets/swatches/7E3D9B.png) | ![](assets/swatches/0B100D.png) ![](assets/swatches/4BC867.png) ![](assets/swatches/FF9D9A.png) ![](assets/swatches/0094E9.png) ![](assets/swatches/E0A0FF.png) |
| **Nintendo Switch** (2017 · Nintendo) | ![](assets/swatches/F0F3F6.png) ![](assets/swatches/00713C.png) ![](assets/swatches/C92035.png) ![](assets/swatches/003C4D.png) ![](assets/swatches/1D44A3.png) | ![](assets/swatches/0F1216.png) ![](assets/swatches/64EE93.png) ![](assets/swatches/FF7F89.png) ![](assets/swatches/0099B6.png) ![](assets/swatches/8BAAFF.png) |
| **PlayStation 5** (2020 · Sony) | ![](assets/swatches/EEF2F9.png) ![](assets/swatches/0643B5.png) ![](assets/swatches/AF223D.png) ![](assets/swatches/003C4A.png) ![](assets/swatches/006B55.png) | ![](assets/swatches/090C16.png) ![](assets/swatches/8CC2FF.png) ![](assets/swatches/FF7F87.png) ![](assets/swatches/009AB2.png) ![](assets/swatches/00CC9B.png) |
| **Xbox Series X\|S** (2020 · Microsoft) | ![](assets/swatches/EDF3EE.png) ![](assets/swatches/277934.png) ![](assets/swatches/880015.png) ![](assets/swatches/004868.png) ![](assets/swatches/4753B2.png) | ![](assets/swatches/080E09.png) ![](assets/swatches/64E474.png) ![](assets/swatches/FF968C.png) ![](assets/swatches/00A6DF.png) ![](assets/swatches/B4BDFF.png) |
| **Steam Deck** (2022 · Valve) | ![](assets/swatches/EAF0F5.png) ![](assets/swatches/005388.png) ![](assets/swatches/8F2400.png) ![](assets/swatches/004744.png) ![](assets/swatches/006732.png) | ![](assets/swatches/080F15.png) ![](assets/swatches/85CDFF.png) ![](assets/swatches/FE692E.png) ![](assets/swatches/00B3B5.png) ![](assets/swatches/5BDB87.png) |
<!-- CATALOG:END -->

*(Swatch PNGs are generated locally by `scripts/generate-swatches.js` — no third-party badge service, no network dependency for viewers, nothing to go stale.)*

</details>

## Installing from the Marketplace or Open VSX

Search for **Console Palette** in the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`) in VS Code, Positron, or any VS Code-compatible editor, or install from the command line:

```sh
code --install-extension idesofmerge.console-palette
# or in Positron:
positron --install-extension idesofmerge.console-palette
```

## Packaging & installing locally

From this repository root:

```sh
npx --yes @vscode/vsce package
code --install-extension console-palette-1.0.0.vsix
# or in Positron:
positron --install-extension console-palette-1.0.0.vsix
```

Or launch an Extension Development Host without packaging:

```sh
code --extensionDevelopmentPath="<full path to this folder>"
# or: positron --extensionDevelopmentPath="<full path to this folder>"
```

## Selecting & previewing themes

- **Console Palette: Open Palette & Colorimetry Explorer** (Command Palette or Welcome walkthrough): opens a 100% offline interactive workbench & colorimetry studio directly inside VS Code / Positron — preview R, Python, TypeScript, and Quarto/SQL buffers across all 60 themes, inspect live OKLCH / WCAG 2.1 / APCA readouts and OKLab chromaticity polygons, simulate Protanopia / Deuteranopia / Tritanopia in real time, and click **Apply to Workbench** (or toggle **Live-sync IDE**) to switch your editor theme on the fly. The exact same explorer is also hosted on the web via **[GitHub Pages](https://idesofmerge.github.io/console-palette/)**.
- **Console Palette: Pick Console Theme** (Command Palette or click the active theme badge in the bottom-right status bar): opens a release-ordered quick-pick grouped by all 30 consoles (with launch year & maker) with **live theme preview** as you arrow up/down, hardware subtitle notes on every entry, an `Active` indicator on your current theme, and clean `Esc` rollback if you cancel.
- **Preferences: Color Theme** (`Ctrl+K Ctrl+T` / `Cmd+K Cmd+T`): standard alphabetical VS Code / Positron picker across all 60 themes.
- **Console Palette: Random Theme**: jumps to a random theme across the other 59 themes — great for touring the catalog.
- **Welcome: Open Walkthrough** → **Welcome to Console Palette**: interactive first-run walkthrough covering theme picking, per-console Light/Dark toggling, hardware identity accents, and launching the interactive Explorer.

## Smart Light ↔ Dark per-console toggle

Run **Console Palette: Toggle Theme** from the Command Palette or press `Ctrl+K Ctrl+G` (`Cmd+K Cmd+G` on macOS). Unlike a generic light/dark switch, it flips between the Light and Dark variant of **whichever console you're currently using** (e.g. *PlayStation Light* ↔ *PlayStation Dark*, *Steam Deck Light* ↔ *Steam Deck Dark*, *Game Boy Light* ↔ *Game Boy Dark*). If a non-Console Palette theme is active, it starts on *SNES Light*. Only the standard `workbench.colorTheme` User setting is read or written.

## How the themes are built

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/build-pipeline-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/diagrams/build-pipeline-light.png">
  <img alt="Console Palette Build, Colorimetry &amp; Validation Pipeline: palettes/*.js (60 bespoke console palettes) and shared scripts/color-science.js (OKLCH, WCAG, APCA, CIEDE2000, Machado CVD) feed scripts/generate-themes.js and scripts/generate-explorer.js to emit theme-metadata.json, package.json, themes/*.json, site/index.html, and assets/explorer/explorer.html; theme-metadata.json is read at runtime by extension.js, while scripts/validate.js audits 1,200/1,200 WCAG AA + APCA-W3, CIEDE2000 + Machado CVD, zero-CDN Explorer CSP, and 9,120 verified Positron keys so CI and vsce package succeed" src="assets/diagrams/build-pipeline-dark.png" width="900">
</picture>

Hand-authoring ~350 workbench, TextMate, semantic-token, and Positron IDE keys across 60 themes doesn't scale by hand, so `scripts/generate-themes.js` expands each console's ~45-token hardware palette (`palettes/*.js`) using OKLCH perceptual mixing, `scripts/generate-explorer.js` compiles the self-contained GitHub Pages (`site/index.html`) and VS Code Webview (`assets/explorer/explorer.html`) interactive explorers from those same modules, and `scripts/validate.js` enforces multi-gate colorimetric and zero-CDN CSP verification on every build:

```sh
node scripts/generate-themes.js          # regenerate themes/*.json + package.json + theme-metadata.json
node scripts/generate-explorer.js        # regenerate site/index.html + assets/explorer/explorer.html
node scripts/generate-swatches.js        # regenerate 538 local swatch PNGs in assets/swatches/
python3 scripts/generate-icon.py         # regenerate 4x supersampled 3D-beveled Light/Dark gamepad icon
python3 scripts/generate-banner.py       # regenerate Dark/Light 2x Retina README banners
python3 scripts/generate-diagrams.py     # regenerate Dark/Light 2x Retina timeline & pipeline diagrams
python3 scripts/generate-showcase-gif.py # regenerate animated VS Code / Positron IDE showcase GIF
node scripts/validate.js                 # audit all 60 themes, Explorer CSP & Positron key provenance
```

## Accessibility & perceptual contrast

Every single theme must clear strict automated perceptual gates before `generate-themes.js` or `validate.js` will succeed:

- **100% WCAG 2.1 AA compliance (`1,200 / 1,200` foreground & syntax tokens)**: all 20 foreground/syntax tokens in all 60 themes clear **≥ 4.5:1** on `editor.background` (actual range across the family: **`4.61:1` to `15.84:1`**) and **≥ 3.8:1** on `editor.lineHighlightBackground`.
- **APCA-W3 spatial contrast**: primary body text (`fg` on `bg`) achieves **`|Lc| = 82.8` to `98.2`** (`13.27:1`–`15.84:1` WCAG) across all 59 polychromatic themes, tuned to avoid OLED halation in Dark mode while keeping Light plastic-shell surfaces glare-free and crisp.
- **Figure–ground hierarchy**: comments (`fgComment`) clear AA comfortably (`4.77:1`–`6.52:1`) while remaining perceptually subordinate to active code tokens so documentation never competes with control flow.
- **960 / 960 ANSI terminal tokens verified**: all 16 ANSI colors in every integrated terminal / Positron console clear contrast gates while preserving canonical terminal hue bands (so red errors stay red and green diffs stay green regardless of a console's keyword accent).

| Representative Theme | Editor `fg` / `bg` (WCAG) | Editor `fg` / `bg` (`|Lc|` APCA) | Comment / `bg` | Tightest foreground/syntax role / `bg` |
|---|---|---|---|---|
| **Nintendo Switch Light** | `15.55:1` | `96.8` | `6.38:1` | `5.04:1` |
| **Sega Dreamcast Light** | `15.40:1` | `96.2` | `6.34:1` | `5.76:1` |
| **SNES Light** | `14.34:1` | `91.6` | `5.91:1` | `5.25:1` |
| **Original Xbox Dark** | `13.68:1` | `83.2` | `6.11:1` | `4.87:1` |
| **PlayStation Dark** | `13.66:1` | `83.2` | `6.06:1` | `4.86:1` |
| **Steam Deck Dark** | `13.66:1` | `83.2` | `6.10:1` | `4.86:1` |
| **Game Boy Dark** *(1989 DMG-01 LCD ramp)* | `8.83:1` | `74.8` | `4.77:1` | `4.61:1` |

## Color science

Every theme's 13 adjacent syntax-relevant roles (`keyword`, `storage`, `string`, `regex`, `function`, `function-dim`, `type`, `interface`, `number`, `decorator`, `namespace`, `error`, `warning` — **780 syntax tokens** across 60 themes) are synthesized in Björn Ottosson's **OKLCH** perceptual color space and audited in **CIE 1976 `L*a*b*`** (`CIEDE2000` ΔE₀₀ for normal-vision categorical distinctness and **Machado, Oliveira & Fernandes (2009)** physiological cone-matrix simulation for protanopia, deuteranopia, and tritanopia).

<img src="assets/color-science/theme-colorspace-grid.png" alt="All 60 themes' 10 core syntax colors plotted in the CIE a*-b* plane, connected in fixed semantic order across a 6x10 chronological grid" width="900">

Plotting each theme's 10 core syntax roles in the CIE `a*`–`b*` chromaticity plane and connecting them in fixed role order reveals each console's chromatic signature at a glance: *Game Boy Dark* collapses into a tight olive-chartreuse needle near a single hue angle (authentic 1989 DMG-01 LCD), while every other console spans a wide, balanced polygon tailored to its specific hardware accent architecture.

<img src="assets/color-science/family-fingerprint.png" alt="Chromatic polygons of all 60 themes faceted across the 6 hardware eras" width="900">

<img src="assets/color-science/pca-global.png" alt="Global PCA of all 780 syntax tokens across 60 themes in CIE Lab space, colored by semantic role" width="750">

An unscaled global PCA across all **780 syntax tokens** (`PC1 = 50.7%`, `PC2 = 36.4%`, explaining **87.1%** of total perceptual variance in 2D) shows how semantic roles occupy structured, well-separated regions while giving consoles expressive cross-hue freedom where hardware identity calls for violet keywords (SNES/GameCube), orange keywords (Dreamcast/Atari), emerald keywords (Xbox/PS1/Switch), or sapphire keywords (PS2/PS4/PS5/Genesis).

### Which console themes look like each other

Converting each theme's 13 syntax roles into a **39-dimensional CIE `L*a*b*` feature vector** (`analysis/theme_similarity.R`) lets us compare entire themes side-by-side via standardized PCA (`PC1 = 44.9%`, `PC2 = 14.1%`) and **Ward's minimum-variance hierarchical clustering**:

<img src="assets/color-science/theme-pca.png" alt="Per-theme 39-D standardized CIE Lab PCA across all 60 themes, colored by hardware era and shaped by Light/Dark mode" width="900">

<img src="assets/color-science/theme-dendrogram.png" alt="Ward's hierarchical clustering dendrogram of all 60 themes on 39-D standardized CIE Lab profiles" width="900">

Three empirical patterns emerge directly from the geometry without any manual grouping:

1. **Clean polarity separation + 1989 DMG-01 hardware isolation**: All 30 Light themes and 30 Dark themes split cleanly along `PC1`, while **Game Boy Dark** branches off completely alone at the top of the Dark supercluster (and sits isolated in the upper-right of `PC1`–`PC2`), quantitatively confirming its unique 1989 DMG-01 olive LCD ramp.
2. **Manufacturer color DNA clusters automatically**: **PlayStation 2, 3, 4, and 5** form a consecutive four-generation PlayStation block in *both* Light and Dark modes; **Original Xbox, Xbox One, and Xbox Series X\|S** cluster directly together in Dark mode; and **Sega Master System + Sega Genesis** pair up cleanly in both modes from their shared Sega cobalt-and-crimson DNA.
3. **Cross-generation industrial kin pair as nearest neighbors**: **SNES** and **Nintendo GameCube** pair directly together in *both* Light and Dark modes (Nintendo's signature lavender-indigo heritage), while warm amber/tangerine hardware icons (**Atari 2600**, **TurboGrafx-16**, and **Sega Dreamcast**) group naturally from color coordinates alone.

### Color-vision-deficiency (CVD) resilience via OKLCH lightness staggering

Categorical syntax palettes that rely purely on hue (such as an isoluminant red string next to a green keyword) collapse under protanopia or deuteranopia. To prevent this scientifically, every Console Palette theme staggers adjacent syntax roles across **OKLCH perceptual lightness (`L`)** as well as hue — because luminance contrast survives all three cone deficiencies even when chromatic axes collapse.

<img src="assets/color-science/cvd-swatch-grid.png" alt="Dichromacy simulation across 12 representative console themes showing 10 syntax roles under Normal Vision, Protanopia, Deuteranopia, and Tritanopia" width="850">

Across all **4,680 role-pairs** (`60 themes × 78 pairs`) and **1,260 critical adjacent syntax pairs** (`keyword`, `storage`, `string`, `function`, `type`, `number`, `error`):

- **59 polychromatic themes (`1,239` critical pairs)**: **0 severe collisions** (`< 5 ΔE*ab`) and **0 moderate collisions** (`< 10 ΔE*ab`) under simulated protanopia, deuteranopia, or tritanopia. Every critical syntax pair stays `≥ 10.40 ΔE*ab` apart across all three CVD simulations.
- **Game Boy Dark (monochrome hardware tribute)**: accounts for the only **3** critical pairs below `10 ΔE*ab` in the entire 60-theme family (`accentStorage`/`colorError` at `2.46`, `accentKeyword`/`accentType` at `7.63`, and `accentKeyword`/`accentStorage` at `9.67`), preserved intentionally as a documented, faithful tribute to the 1989 Game Boy's single-hue olive LCD ramp while still clearing WCAG AA (`4.61:1`–`8.83:1`) on every token.

```sh
node scripts/export-color-data.js                  # export 900 token rows (Lab + OKLCH + WCAG + APCA) to analysis/data/colors.csv
python3 scripts/generate-color-science-assets.py   # regenerate all high-DPI PNG plots + audit CSVs + metro map
# Pure-R analytical scripts are also included:
Rscript --vanilla analysis/color_science.R
Rscript --vanilla analysis/theme_similarity.R
Rscript --vanilla analysis/timeline_metro.R
```

## Notes

- An independent, unofficial tribute to gaming hardware industrial design — not affiliated with or endorsed by Atari, Nintendo, Sega, NEC, SNK, Sony, Microsoft, or Valve.
- Zero runtime `npm` dependencies — `extension.js` uses only the built-in `vscode` API and static `theme-metadata.json`.
- Positron-specific workbench tokens (`positronConsole.*`, `positronVariables.*`, `positronPlots.*`, `positronDataExplorer.*`, etc.) are strictly validated against Positron's upstream color registry (`9,120` verified usages across 60 themes).
- No console logos, trademarks, sprites, or copyrighted assets appear anywhere in this repository — every visual (extension icon, README banners, animated IDE showcase GIF, 538 swatch PNGs, timeline & architecture diagrams, Hardware Lineage Metro Map, and color-science plots) is generated algorithmically from hex coordinates and geometric primitives.

## License

MIT — see [LICENSE](LICENSE).
