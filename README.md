<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/banner/banner-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/banner/banner-light.png">
  <img alt="Console Palette — 49 Years of Hardware (1977–2026) · 39 Iconic Gaming Consoles · 78 Light &amp; Dark Themes · VS Code / Positron · OKLCH Colorimetry · 100% WCAG AA · APCA-W3 · CIEDE2000 · CVD Safe" src="assets/banner/banner-dark.png" width="900">
</picture>

# Console Palette

**A Light and Dark color theme for every iconic gaming console.**
39 consoles · 78 themes · one VS Code / Positron extension.

*An independent tribute to 49 years of gaming console industrial design, controller color craft, and display hardware (1977–2026).*

![hardware eras](https://img.shields.io/badge/hardware_eras-1977%E2%80%932026-3B8CE8?style=flat-square)
[![explorer](https://img.shields.io/badge/live_explorer-interactive_workbench-6247B8?style=flat-square)](https://idesofmerge.github.io/console-palette/)
[![build](https://github.com/idesofmerge/console-palette/actions/workflows/build.yml/badge.svg)](https://github.com/idesofmerge/console-palette/actions/workflows/build.yml)
![version](https://img.shields.io/badge/version-1.1.0-264EB5?style=flat-square)
![themes](https://img.shields.io/badge/themes-78-7209B7?style=flat-square)
![consoles](https://img.shields.io/badge/consoles-39-00A896?style=flat-square)
![contrast](https://img.shields.io/badge/WCAG_AA-100%25_(1560%2F1560)-2A5F25?style=flat-square)
![perceptual](https://img.shields.io/badge/OKLCH_%C2%B7_APCA_%C2%B7_CIEDE2000-verified-1B5EA8?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

**[Launch the Live Interactive Workbench & Colorimetry Explorer ↗](https://idesofmerge.github.io/console-palette/)**
*(Or run **`Console Palette: Open Palette & Colorimetry Explorer`** directly inside VS Code / Positron!)*

<br>

<img src="assets/showcase/console-palette-demo.gif" alt="Animated preview of Console Palette themes running in a VS Code and Positron IDE workbench — cycling across Atari 2600, Game Boy, SNES, PlayStation, Sega Dreamcast, Xbox, and Nintendo Switch 2 in Light and Dark modes with live WCAG contrast readouts and the Ctrl+K Ctrl+G per-console toggle" width="900">

</div>

---

Every pair in **Console Palette** is individually authored from its machine's authentic outer plastic shell, controller face buttons, LED indicators, boot/BIOS screen, and display hardware — never a generic syntax template reskinned onto a new background:

- **Atari 2600**, **Atari Lynx**, and **Atari Jaguar** anchor the full Atari lineage — from 1977 Heavy Sixer oiled walnut and cartridge rainbow bands to 1989 backlit color LCD cyan/orange and 1993 Tempest 2000 electric violet & Jaguar Claw crimson.
- **PlayStation (PS1)** maps syntax roles directly to the iconic DualShock geometric quartet — Triangle Emerald, Circle Coral, Cross Cobalt, and Square Rose — anchored by the unmistakable amber-orange startup BIOS diamond.
- **SNES** unites both regional legends in one pair: North American neutral-cool grey shell & violet switches alongside the Japanese/PAL Super Famicom four-color ABXY palette.
- **Game Boy Dark** & **Virtual Boy Dark** honor Nintendo's most iconic display experiments — the 1989 DMG-01's 4-shade olive STN LCD (`#0F380F`–`#9BBC0F`) with a perceptually monotonic OKLCH ramp, and the 1995 pitch-black stereoscopic visor illuminated by blazing 650nm crimson LEDs.
- **Playdate**, **Nintendo Switch 2**, **ROG Xbox Ally**, **Steam Machine**, and **Steam Frame** carry the craft all the way through **2026** — canary yellow & 1-bit Sharp Memory LCD ink, magnetic Joy-Con 2 Light Blue & Light Red rails, White/Black Ally emerald & ROG crimson, 6-inch cube walnut/red-fabric faceplates with 17-LED cyan-blue progress strips, and pancake-lens SteamVR teal with Half-Life Lambda amber.

Every palette is synthesized and verified in **OKLCH** perceptual color space against **WCAG 2.1**, **APCA-W3**, **CIEDE2000** (ΔE₀₀), and **Machado et al. (2009)** dichromacy simulation. Design inspiration comes strictly from **industrial color language and hardware atmosphere** — no console logos, trademarks, sprites, or copyrighted assets are included or referenced anywhere in this repository.

## The 39 consoles, by launch year

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/release-timeline-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/diagrams/release-timeline-light.png">
  <img alt="Console Palette — 39 Iconic Gaming Consoles by Launch Year (1977–2026) across 7 hardware eras: 8-bit Pioneers (Atari 2600, NES, Master System, Game Boy, Atari Lynx), 16-bit Golden Age (TurboGrafx-16, Sega Genesis, SNES, Neo Geo AES), 32/64-bit Polygon (Atari Jaguar, Sega Saturn, PlayStation, Virtual Boy, Nintendo 64, Game Boy Color), 128-bit &amp; Millennial (Sega Dreamcast, PlayStation 2, Game Boy Advance, GameCube, Xbox), HD, Motion &amp; Portable (Nintendo DS, PSP, Xbox 360, Nintendo Wii, PlayStation 3, Nintendo 3DS, PS Vita), Modern &amp; Hybrid (PlayStation 4, Xbox One, Nintendo Switch, PlayStation 5, Xbox Series X|S, Steam Deck, Playdate), and Next-Gen &amp; Spatial (PlayStation Portal, Nintendo Switch 2, ROG Xbox Ally, Steam Machine, Steam Frame)" src="assets/diagrams/release-timeline-dark.png" width="900">
</picture>

## ...and by hardware lineage

Organized as a transit metro map across manufacturer lines — solid lines trace main hardware generations across **Atari**, **Nintendo**, **Sega**, **PlayStation**, **Xbox**, **Valve / Steam**, and **Arcade / Indie** platforms, while dashed lines mark handheld, companion, and spatial branches (**Virtual Boy**, **PSP → PS Vita → PlayStation Portal**, **ROG Xbox Ally**, and **Steam Frame**), with **Nintendo Home** and **Nintendo Handheld** converging at **Nintendo Switch → Switch 2**:

<img src="assets/timeline/timeline-metro.png" alt="Console Palette Hardware Lineage Metro Map across 39 iconic consoles from 1977 to 2026 showing manufacturer tracks for Atari, Arcade/16-bit, Panic/Indie, Nintendo Home and Handheld converging at Switch and Switch 2, Sega, PlayStation branching to PSP, PS Vita and PlayStation Portal, Xbox to ROG Xbox Ally, and Valve Steam Deck to Steam Machine and Steam Frame" width="900">

```sh
python3 scripts/generate-color-science-assets.py  # or: Rscript --vanilla analysis/timeline_metro.R
```

## Every pair tells a hardware story

Four examples of how a Light/Dark pair is built — anchored to each console's real plastic finish, controller buttons, and display lighting while maintaining strict perceptual contrast and OKLCH lightness separation:

### SNES (1990) — neutral-cool grey shell & Super Famicom 4-color ABXY

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/E2E3E8.png) `#E2E3E8` classic SNES neutral-cool shell | ![](assets/swatches/0F0F1A.png) `#0F0F1A` Mode-7 midnight indigo-slate |
| Keywords | ![](assets/swatches/5442BA.png) `#5442BA` North American concave violet | ![](assets/swatches/816DE2.png) `#816DE2` luminous SNES lavender |
| Strings | ![](assets/swatches/A1001F.png) `#A1001F` Super Famicom Red A button | ![](assets/swatches/F35051.png) `#F35051` CRT crimson-coral A button |
| Functions | ![](assets/swatches/005092.png) `#005092` Super Famicom Blue X button | ![](assets/swatches/31A8FF.png) `#31A8FF` luminous Super Famicom azure |
| Types | ![](assets/swatches/005F22.png) `#005F22` Super Famicom Green Y button | ![](assets/swatches/35B35E.png) `#35B35E` crisp Mode-7 emerald Y button |
| **Identity accent** | ![](assets/swatches/5E44B8.png) `#5E44B8` **SNES switch violet** | ![](assets/swatches/A288FF.png) `#A288FF` glowing violet focus |

### PlayStation (1994) — iconic PS1 cement grey, amber boot diamond & △ ○ × □ quartet

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/DDDFE2.png) `#DDDFE2` unmistakable 1994 PlayStation grey | ![](assets/swatches/111215.png) `#111215` black-bottomed CD & BIOS void |
| Keywords | ![](assets/swatches/006D42.png) `#006D42` **△ Triangle** emerald green | ![](assets/swatches/1DCD83.png) `#1DCD83` luminous Triangle emerald |
| Strings | ![](assets/swatches/9A001F.png) `#9A001F` **○ Circle** coral crimson | ![](assets/swatches/FF706D.png) `#FF706D` glowing Circle coral |
| Functions | ![](assets/swatches/003775.png) `#003775` **× Cross** cobalt blue | ![](assets/swatches/2291F8.png) `#2291F8` electric Cross sapphire |
| Types | ![](assets/swatches/6A004D.png) `#6A004D` **□ Square** rose-magenta | ![](assets/swatches/F87CC9.png) `#F87CC9` neon Square rose pink |
| **Identity accent** | ![](assets/swatches/DE6A16.png) `#DE6A16` **Sony boot diamond orange** | ![](assets/swatches/F58426.png) `#F58426` glowing BIOS startup amber |

### Sega Dreamcast (1998) — frost-white shell, fiery orange swirl & VMU teal

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/F2F5F8.png) `#F2F5F8` 9/9/99 frost-white casing | ![](assets/swatches/0E1214.png) `#0E1214` Sega Sports Black edition |
| Keywords | ![](assets/swatches/B14500.png) `#B14500` fiery Dreamcast swirl orange | ![](assets/swatches/FF8F62.png) `#FF8F62` glowing spiral swirl tangerine |
| Strings | ![](assets/swatches/AC0D37.png) `#AC0D37` controller crimson B accent | ![](assets/swatches/FF6B77.png) `#FF6B77` arcade coral-crimson |
| Functions | ![](assets/swatches/004E97.png) `#004E97` Sega / PAL swirl cobalt blue | ![](assets/swatches/0087D8.png) `#0087D8` luminous GD-ROM sky blue |
| Types | ![](assets/swatches/006959.png) `#006959` VMU screen deep seafoam-teal | ![](assets/swatches/00BA9D.png) `#00BA9D` backlit VMU seafoam-cyan |
| **Identity accent** | ![](assets/swatches/E04F0E.png) `#E04F0E` **Dreamcast swirl orange** | ![](assets/swatches/FF6B1A.png) `#FF6B1A` radiant swirl beacon |

### Nintendo Switch (2017) — OLED White / Basic Black UI & Neon Joy-Con duotone

| Role | Light | Dark |
|---|---|---|
| Background | ![](assets/swatches/F3F5F6.png) `#F3F5F6` Switch OLED White / Basic White UI | ![](assets/swatches/17191C.png) `#17191C` Switch Basic Black matte charcoal |
| Keywords | ![](assets/swatches/007095.png) `#007095` **Neon Blue Joy-Con** cyan-azure | ![](assets/swatches/00A9CD.png) `#00A9CD` glowing **Neon Blue Joy-Con** |
| Strings | ![](assets/swatches/BE0030.png) `#BE0030` **Neon Red Joy-Con** crimson | ![](assets/swatches/FD3E4E.png) `#FD3E4E` blazing **Neon Red Joy-Con** |
| Functions | ![](assets/swatches/2748AC.png) `#2748AC` docked cobalt-indigo | ![](assets/swatches/86ADFF.png) `#86ADFF` crisp Home-grid periwinkle |
| Types | ![](assets/swatches/006531.png) `#006531` Splatoon / eShop emerald | ![](assets/swatches/30C46C.png) `#30C46C` luminous Splatoon lime-emerald |
| **Identity accent** | ![](assets/swatches/E60012.png) `#E60012` **Nintendo Switch Red** | ![](assets/swatches/FF3E4D.png) `#FF3E4D` radiant Neon Red cursor |

## The full catalog

<details>
<summary><strong>All 78 themes across 39 iconic consoles, era by era — click to expand</strong></summary>

Each swatch strip reads left to right: **background · keywords · strings · functions · types**. Every single theme has unique primary hexes — zero copy-pasted syntax templates across consoles.

<!-- CATALOG:START -->
**8-bit Pioneers (1977–1989)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Atari 2600** (1977 · Atari) | ![](assets/swatches/F7EFE1.png) ![](assets/swatches/BD4000.png) ![](assets/swatches/A80227.png) ![](assets/swatches/005995.png) ![](assets/swatches/004A48.png) | ![](assets/swatches/18110D.png) ![](assets/swatches/FF885B.png) ![](assets/swatches/FF646D.png) ![](assets/swatches/0089CF.png) ![](assets/swatches/00AFA8.png) |
| **NES** (1985 · Nintendo) | ![](assets/swatches/E8E7E6.png) ![](assets/swatches/A00021.png) ![](assets/swatches/005A20.png) ![](assets/swatches/00326B.png) ![](assets/swatches/006E71.png) | ![](assets/swatches/161718.png) ![](assets/swatches/F24971.png) ![](assets/swatches/41BB5E.png) ![](assets/swatches/0094F3.png) ![](assets/swatches/00CFD1.png) |
| **Sega Master System** (1985 · Sega) | ![](assets/swatches/F0F3F5.png) ![](assets/swatches/0058B2.png) ![](assets/swatches/B50528.png) ![](assets/swatches/005C24.png) ![](assets/swatches/00727A.png) | ![](assets/swatches/111315.png) ![](assets/swatches/82C2FF.png) ![](assets/swatches/FF6D6F.png) ![](assets/swatches/009B55.png) ![](assets/swatches/00ADB7.png) |
| **Game Boy** (1989 · Nintendo) | ![](assets/swatches/E8E6DA.png) ![](assets/swatches/98256B.png) ![](assets/swatches/425100.png) ![](assets/swatches/0A2B85.png) ![](assets/swatches/005C3D.png) | ![](assets/swatches/0F380F.png) ![](assets/swatches/9BBC0F.png) ![](assets/swatches/B6D63C.png) ![](assets/swatches/8CC42B.png) ![](assets/swatches/A6CF52.png) |
| **Atari Lynx** (1989 · Atari) | ![](assets/swatches/E2E8EC.png) ![](assets/swatches/005355.png) ![](assets/swatches/AF3B00.png) ![](assets/swatches/004C9D.png) ![](assets/swatches/007131.png) | ![](assets/swatches/0D1114.png) ![](assets/swatches/00C6C8.png) ![](assets/swatches/FF7A49.png) ![](assets/swatches/0F98F8.png) ![](assets/swatches/76EE95.png) |

**16-bit Golden Age (1987–1990)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **TurboGrafx-16** (1987 · NEC / Hudson) | ![](assets/swatches/F6F3EC.png) ![](assets/swatches/A00013.png) ![](assets/swatches/851363.png) ![](assets/swatches/0068A2.png) ![](assets/swatches/00513F.png) | ![](assets/swatches/13100F.png) ![](assets/swatches/F36800.png) ![](assets/swatches/CC50A0.png) ![](assets/swatches/009EC9.png) ![](assets/swatches/05CC97.png) |
| **Sega Genesis** (1988 · Sega) | ![](assets/swatches/EAEDF1.png) ![](assets/swatches/0057B6.png) ![](assets/swatches/B3102A.png) ![](assets/swatches/005A14.png) ![](assets/swatches/007580.png) | ![](assets/swatches/0E1115.png) ![](assets/swatches/78BBFF.png) ![](assets/swatches/FF6F6F.png) ![](assets/swatches/079C48.png) ![](assets/swatches/00D5E1.png) |
| **SNES** (1990 · Nintendo) | ![](assets/swatches/E2E3E8.png) ![](assets/swatches/5442BA.png) ![](assets/swatches/A1001F.png) ![](assets/swatches/005092.png) ![](assets/swatches/005F22.png) | ![](assets/swatches/0F0F1A.png) ![](assets/swatches/816DE2.png) ![](assets/swatches/F35051.png) ![](assets/swatches/31A8FF.png) ![](assets/swatches/35B35E.png) |
| **Neo Geo AES** (1990 · SNK) | ![](assets/swatches/F3EFE3.png) ![](assets/swatches/593A00.png) ![](assets/swatches/AB0024.png) ![](assets/swatches/00315F.png) ![](assets/swatches/004F4F.png) | ![](assets/swatches/110E0A.png) ![](assets/swatches/E9B600.png) ![](assets/swatches/FF6D70.png) ![](assets/swatches/0F94F5.png) ![](assets/swatches/00C7C6.png) |

**32/64-bit Polygon Era (1993–1998)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Atari Jaguar** (1993 · Atari) | ![](assets/swatches/E7E9ED.png) ![](assets/swatches/4945BF.png) ![](assets/swatches/B92144.png) ![](assets/swatches/005157.png) ![](assets/swatches/007214.png) | ![](assets/swatches/0D0E12.png) ![](assets/swatches/9BA5FF.png) ![](assets/swatches/FF6F73.png) ![](assets/swatches/00A3AC.png) ![](assets/swatches/6AD96C.png) |
| **Sega Saturn** (1994 · Sega) | ![](assets/swatches/E9F1F3.png) ![](assets/swatches/005352.png) ![](assets/swatches/A00C60.png) ![](assets/swatches/00569E.png) ![](assets/swatches/167C34.png) | ![](assets/swatches/0E1216.png) ![](assets/swatches/00C8C8.png) ![](assets/swatches/E04E9A.png) ![](assets/swatches/2EA2FF.png) ![](assets/swatches/7BE88F.png) |
| **PlayStation** (1994 · Sony) | ![](assets/swatches/DDDFE2.png) ![](assets/swatches/006D42.png) ![](assets/swatches/9A001F.png) ![](assets/swatches/003775.png) ![](assets/swatches/6A004D.png) | ![](assets/swatches/111215.png) ![](assets/swatches/1DCD83.png) ![](assets/swatches/FF706D.png) ![](assets/swatches/2291F8.png) ![](assets/swatches/F87CC9.png) |
| **Virtual Boy** (1995 · Nintendo) | ![](assets/swatches/E2E3E4.png) ![](assets/swatches/AA0024.png) ![](assets/swatches/AB3E00.png) ![](assets/swatches/003D60.png) ![](assets/swatches/005E5B.png) | ![](assets/swatches/0F0606.png) ![](assets/swatches/FF7474.png) ![](assets/swatches/FF8E61.png) ![](assets/swatches/00A6F9.png) ![](assets/swatches/00C9B7.png) |
| **Nintendo 64** (1996 · Nintendo) | ![](assets/swatches/E0E1E3.png) ![](assets/swatches/005B29.png) ![](assets/swatches/A60026.png) ![](assets/swatches/00326E.png) ![](assets/swatches/36187C.png) | ![](assets/swatches/18191C.png) ![](assets/swatches/4FCB6A.png) ![](assets/swatches/FF2E30.png) ![](assets/swatches/0092F9.png) ![](assets/swatches/AD9EFF.png) |
| **Game Boy Color** (1998 · Nintendo) | ![](assets/swatches/F2F0E2.png) ![](assets/swatches/80005E.png) ![](assets/swatches/A3061D.png) ![](assets/swatches/291A85.png) ![](assets/swatches/007776.png) | ![](assets/swatches/120B1C.png) ![](assets/swatches/FD74D0.png) ![](assets/swatches/FF6658.png) ![](assets/swatches/1B92F4.png) ![](assets/swatches/00F0EF.png) |

**128-bit & Millennial Classics (1998–2001)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Sega Dreamcast** (1998 · Sega) | ![](assets/swatches/F2F5F8.png) ![](assets/swatches/B14500.png) ![](assets/swatches/AC0D37.png) ![](assets/swatches/004E97.png) ![](assets/swatches/006959.png) | ![](assets/swatches/0E1214.png) ![](assets/swatches/FF8F62.png) ![](assets/swatches/FF6B77.png) ![](assets/swatches/0087D8.png) ![](assets/swatches/00BA9D.png) |
| **PlayStation 2** (2000 · Sony) | ![](assets/swatches/EBF1F9.png) ![](assets/swatches/0055BA.png) ![](assets/swatches/9F0026.png) ![](assets/swatches/004551.png) ![](assets/swatches/006F44.png) | ![](assets/swatches/040A1D.png) ![](assets/swatches/66B9FF.png) ![](assets/swatches/FF6D72.png) ![](assets/swatches/0093A0.png) ![](assets/swatches/27C37E.png) |
| **Game Boy Advance** (2001 · Nintendo) | ![](assets/swatches/DFEEF9.png) ![](assets/swatches/4049BD.png) ![](assets/swatches/A00023.png) ![](assets/swatches/00565F.png) ![](assets/swatches/00783B.png) | ![](assets/swatches/0A0D1F.png) ![](assets/swatches/8289FF.png) ![](assets/swatches/FF6E6A.png) ![](assets/swatches/00B2BF.png) ![](assets/swatches/59DA86.png) |
| **Nintendo GameCube** (2001 · Nintendo) | ![](assets/swatches/E7E7EC.png) ![](assets/swatches/5140C0.png) ![](assets/swatches/BC1E31.png) ![](assets/swatches/003561.png) ![](assets/swatches/006D3E.png) | ![](assets/swatches/0F0B26.png) ![](assets/swatches/8E85FF.png) ![](assets/swatches/FF706C.png) ![](assets/swatches/44B1FF.png) ![](assets/swatches/42D488.png) |
| **Xbox** (2001 · Microsoft) | ![](assets/swatches/EBF2EB.png) ![](assets/swatches/005E1A.png) ![](assets/swatches/AF0526.png) ![](assets/swatches/003C76.png) ![](assets/swatches/00767B.png) | ![](assets/swatches/091309.png) ![](assets/swatches/64CA36.png) ![](assets/swatches/F73D4C.png) ![](assets/swatches/0086DD.png) ![](assets/swatches/00CBCD.png) |

**HD, Motion & Portable Era (2004–2011)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **Nintendo DS** (2004 · Nintendo) | ![](assets/swatches/EEF2F5.png) ![](assets/swatches/006093.png) ![](assets/swatches/BC1E36.png) ![](assets/swatches/004A4B.png) ![](assets/swatches/0F692B.png) | ![](assets/swatches/0D1216.png) ![](assets/swatches/31C6FF.png) ![](assets/swatches/FC2E54.png) ![](assets/swatches/009594.png) ![](assets/swatches/53C66B.png) |
| **PlayStation Portable** (2004 · Sony) | ![](assets/swatches/F2F0F6.png) ![](assets/swatches/713DAC.png) ![](assets/swatches/8D0050.png) ![](assets/swatches/004950.png) ![](assets/swatches/007750.png) | ![](assets/swatches/100B1A.png) ![](assets/swatches/CBA8FF.png) ![](assets/swatches/E34D91.png) ![](assets/swatches/00A2AE.png) ![](assets/swatches/2ACC8A.png) |
| **Xbox 360** (2005 · Microsoft) | ![](assets/swatches/F2F4EF.png) ![](assets/swatches/007715.png) ![](assets/swatches/B03E00.png) ![](assets/swatches/004675.png) ![](assets/swatches/481880.png) | ![](assets/swatches/111412.png) ![](assets/swatches/68CE50.png) ![](assets/swatches/FB6E23.png) ![](assets/swatches/0095EE.png) ![](assets/swatches/C0A3FF.png) |
| **Nintendo Wii** (2006 · Nintendo) | ![](assets/swatches/F4F8F9.png) ![](assets/swatches/005D77.png) ![](assets/swatches/A10025.png) ![](assets/swatches/2343AB.png) ![](assets/swatches/007B50.png) | ![](assets/swatches/0D1113.png) ![](assets/swatches/00C3DB.png) ![](assets/swatches/FF6C73.png) ![](assets/swatches/85B3FF.png) ![](assets/swatches/58E79F.png) |
| **PlayStation 3** (2006 · Sony) | ![](assets/swatches/EBECEF.png) ![](assets/swatches/1A57AD.png) ![](assets/swatches/B30F2F.png) ![](assets/swatches/004857.png) ![](assets/swatches/006350.png) | ![](assets/swatches/121315.png) ![](assets/swatches/8FBFFF.png) ![](assets/swatches/FF6C6E.png) ![](assets/swatches/0091A8.png) ![](assets/swatches/00B292.png) |
| **Nintendo 3DS** (2011 · Nintendo) | ![](assets/swatches/E9F6F6.png) ![](assets/swatches/007B2E.png) ![](assets/swatches/BF3700.png) ![](assets/swatches/004E5B.png) ![](assets/swatches/1E2A8C.png) | ![](assets/swatches/081214.png) ![](assets/swatches/45CC66.png) ![](assets/swatches/FC6D2C.png) ![](assets/swatches/00D4DE.png) ![](assets/swatches/92A8FF.png) |
| **PlayStation Vita** (2011 · Sony) | ![](assets/swatches/E9F3F9.png) ![](assets/swatches/006DA9.png) ![](assets/swatches/B71638.png) ![](assets/swatches/006C37.png) ![](assets/swatches/771C80.png) | ![](assets/swatches/030814.png) ![](assets/swatches/00BFF6.png) ![](assets/swatches/FF6B7E.png) ![](assets/swatches/18B04A.png) ![](assets/swatches/BA51BF.png) |

**Modern, Hybrid & Portable PC (2013–2022)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **PlayStation 4** (2013 · Sony) | ![](assets/swatches/E9F0F9.png) ![](assets/swatches/0051C4.png) ![](assets/swatches/B4112E.png) ![](assets/swatches/005758.png) ![](assets/swatches/00793E.png) | ![](assets/swatches/03132F.png) ![](assets/swatches/00A5F8.png) ![](assets/swatches/F83F4B.png) ![](assets/swatches/009190.png) ![](assets/swatches/30B866.png) |
| **Xbox One** (2013 · Microsoft) | ![](assets/swatches/EFF2EF.png) ![](assets/swatches/006936.png) ![](assets/swatches/A3002D.png) ![](assets/swatches/00669D.png) ![](assets/swatches/58066C.png) | ![](assets/swatches/131614.png) ![](assets/swatches/53D46F.png) ![](assets/swatches/F63C52.png) ![](assets/swatches/008BB3.png) ![](assets/swatches/C776DF.png) |
| **Nintendo Switch** (2017 · Nintendo) | ![](assets/swatches/F3F5F6.png) ![](assets/swatches/007095.png) ![](assets/swatches/BE0030.png) ![](assets/swatches/2748AC.png) ![](assets/swatches/006531.png) | ![](assets/swatches/17191C.png) ![](assets/swatches/00A9CD.png) ![](assets/swatches/FD3E4E.png) ![](assets/swatches/86ADFF.png) ![](assets/swatches/30C46C.png) |
| **PlayStation 5** (2020 · Sony) | ![](assets/swatches/F4F6F9.png) ![](assets/swatches/124FC6.png) ![](assets/swatches/B11536.png) ![](assets/swatches/004858.png) ![](assets/swatches/006954.png) | ![](assets/swatches/0E1013.png) ![](assets/swatches/74B6FF.png) ![](assets/swatches/FF6271.png) ![](assets/swatches/00A0B9.png) ![](assets/swatches/00CC9B.png) |
| **Xbox Series X\|S** (2020 · Microsoft) | ![](assets/swatches/F3F5F3.png) ![](assets/swatches/006A31.png) ![](assets/swatches/A1001D.png) ![](assets/swatches/006E9C.png) ![](assets/swatches/373F9F.png) | ![](assets/swatches/09100B.png) ![](assets/swatches/56DC69.png) ![](assets/swatches/F73D4E.png) ![](assets/swatches/008DBE.png) ![](assets/swatches/828AFC.png) |
| **Steam Deck** (2022 · Valve) | ![](assets/swatches/EFF3F6.png) ![](assets/swatches/005E9D.png) ![](assets/swatches/B73E00.png) ![](assets/swatches/00524B.png) ![](assets/swatches/007037.png) | ![](assets/swatches/101315.png) ![](assets/swatches/4EB7FF.png) ![](assets/swatches/FF794F.png) ![](assets/swatches/00A49F.png) ![](assets/swatches/3AC570.png) |
| **Playdate** (2022 · Panic) | ![](assets/swatches/F9F2DA.png) ![](assets/swatches/A54F00.png) ![](assets/swatches/9F002C.png) ![](assets/swatches/004271.png) ![](assets/swatches/007560.png) | ![](assets/swatches/13110E.png) ![](assets/swatches/EAB700.png) ![](assets/swatches/FF757A.png) ![](assets/swatches/00B0FC.png) ![](assets/swatches/00BA9A.png) |

**Next-Gen & Spatial Era (2023–2026)**

| Console | Light (bg · keyword · string · function · type) | Dark (bg · keyword · string · function · type) |
|---|---|---|
| **PlayStation Portal** (2023 · Sony) | ![](assets/swatches/F2F5F9.png) ![](assets/swatches/0058B0.png) ![](assets/swatches/B30E35.png) ![](assets/swatches/005158.png) ![](assets/swatches/007749.png) | ![](assets/swatches/0A0E14.png) ![](assets/swatches/6BB8FF.png) ![](assets/swatches/FF3953.png) ![](assets/swatches/009498.png) ![](assets/swatches/29C479.png) |
| **Nintendo Switch 2** (2025 · Nintendo) | ![](assets/swatches/F1F4F6.png) ![](assets/swatches/00738E.png) ![](assets/swatches/BB1F24.png) ![](assets/swatches/194AAC.png) ![](assets/swatches/176421.png) | ![](assets/swatches/131517.png) ![](assets/swatches/00C2E6.png) ![](assets/swatches/FF6E66.png) ![](assets/swatches/73A8FF.png) ![](assets/swatches/50DF92.png) |
| **ROG Xbox Ally** (2025 · Microsoft / ASUS) | ![](assets/swatches/F1F4F2.png) ![](assets/swatches/1C6900.png) ![](assets/swatches/A90034.png) ![](assets/swatches/005F8E.png) ![](assets/swatches/50107C.png) | ![](assets/swatches/0D110F.png) ![](assets/swatches/009F32.png) ![](assets/swatches/F04662.png) ![](assets/swatches/0089BC.png) ![](assets/swatches/A569DD.png) |
| **Steam Machine** (2026 · Valve) | ![](assets/swatches/F3EDE6.png) ![](assets/swatches/005668.png) ![](assets/swatches/AF002B.png) ![](assets/swatches/0351AF.png) ![](assets/swatches/00703C.png) | ![](assets/swatches/0F1214.png) ![](assets/swatches/00A9CF.png) ![](assets/swatches/FB4156.png) ![](assets/swatches/8CBDFF.png) ![](assets/swatches/2CC473.png) |
| **Steam Frame** (2026 · Valve) | ![](assets/swatches/EBF3F6.png) ![](assets/swatches/006869.png) ![](assets/swatches/B04000.png) ![](assets/swatches/0B319A.png) ![](assets/swatches/702385.png) | ![](assets/swatches/070D12.png) ![](assets/swatches/00C7C5.png) ![](assets/swatches/FF732B.png) ![](assets/swatches/4C9FFF.png) ![](assets/swatches/E5A2FF.png) |
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
code --install-extension console-palette-1.1.0.vsix
# or in Positron:
positron --install-extension console-palette-1.1.0.vsix
```

Or launch an Extension Development Host without packaging:

```sh
code --extensionDevelopmentPath="<full path to this folder>"
# or: positron --extensionDevelopmentPath="<full path to this folder>"
```

## Selecting & previewing themes

- **Console Palette: Open Palette & Colorimetry Explorer** (Command Palette or Welcome walkthrough): opens a 100% offline interactive workbench & colorimetry studio directly inside VS Code / Positron — filter all 39 consoles by name, maker (`All · Atari · Nintendo · Sony · Sega · Microsoft · Valve · Arcade & Indie`), year, or era (`/`), open the **Interactive Perceptual Similarity Map** (`M`) to explore all themes in 2D CIEDE2000 MDS space with live `ΔE₀₀` distance inspection, hop directly between **Nearest Chromatic Neighbors** chips, launch **Side-by-Side Compare** (`C`) with dual OKLab chromaticity polygons, preview R / Python / TypeScript / Quarto+SQL buffers, simulate Protanopia / Deuteranopia / Tritanopia in real time, export palettes for **VS Code**, **Ghostty**, **WezTerm**, **Alacritty**, or **CSS variables**, copy stateful shareable links, and click **Apply to Workbench** (or toggle **Live-sync IDE**) to switch your editor theme on the fly. The exact same explorer is also hosted on the web via **[GitHub Pages](https://idesofmerge.github.io/console-palette/)**.
- **Console Palette: Pick Console Theme** (Command Palette or click the active theme badge in the bottom-right status bar): opens a release-ordered quick-pick grouped by all 39 consoles (searchable by console name, maker, launch year, or era) with **live theme preview** as you arrow up/down, hardware subtitle notes on every entry, an `Active` indicator on your current theme, and clean `Esc` rollback if you cancel.
- **Preferences: Color Theme** (`Ctrl+K Ctrl+T` / `Cmd+K Cmd+T`): standard alphabetical VS Code / Positron picker across all 78 themes.
- **Console Palette: Random Theme** & **Random Theme (Same Mode)**: jump to a random theme across the catalog, or stay locked to your current Light or Dark polarity.
- **Console Palette: Sync Current Console with OS Light/Dark**: binds your active console's Light & Dark pair to `workbench.preferredLightColorTheme` and `workbench.preferredDarkColorTheme` and enables `window.autoDetectColorScheme` in one click.
- **Status Bar Badge Setting** (`consolePalette.showStatusBarItem`): configure the bottom-right theme badge to show `"always"`, `"whenActive"` (only when a Console Palette theme is selected), or `"never"`.
- **Welcome: Open Walkthrough** → **Welcome to Console Palette**: interactive first-run walkthrough covering theme picking, per-console Light/Dark toggling, hardware identity accents, and launching the interactive Explorer.

## Smart Light ↔ Dark per-console toggle

Run **Console Palette: Toggle Theme** from the Command Palette or press `Ctrl+K Ctrl+G` (`Cmd+K Cmd+G` on macOS). Unlike a generic light/dark switch, it flips between the Light and Dark variant of **whichever console you're currently using** (e.g. *PlayStation Light* ↔ *PlayStation Dark*, *Nintendo Switch 2 Light* ↔ *Nintendo Switch 2 Dark*, *Steam Machine Light* ↔ *Steam Machine Dark*, *Game Boy Light* ↔ *Game Boy Dark*). If a non-Console Palette theme is active, it starts on *SNES Light*. Only the standard `workbench.colorTheme` User setting is read or written.

## How the themes are built

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/diagrams/build-pipeline-dark.png">
  <source media="(prefers-color-scheme: light)" srcset="assets/diagrams/build-pipeline-light.png">
  <img alt="Console Palette Build, Colorimetry &amp; Validation Pipeline: palettes/*.js (78 bespoke console palettes) and shared scripts/color-science.js (OKLCH, WCAG, APCA, CIEDE2000, Machado CVD) feed scripts/generate-themes.js and scripts/generate-explorer.js to emit theme-metadata.json, package.json, themes/*.json, site/index.html, and assets/explorer/explorer.html; theme-metadata.json is read at runtime by extension.js, while scripts/validate.js and 43 unit tests audit 1,560/1,560 WCAG AA + APCA-W3, CIEDE2000 + Machado CVD, zero-CDN Explorer CSP, and 11,856 verified Positron keys so CI and vsce package succeed" src="assets/diagrams/build-pipeline-dark.png" width="900">
</picture>

Hand-authoring ~400 workbench, Command Center, AI Chat/Inline Chat, Test Explorer, Terminal Sticky Scroll, TextMate, semantic-token, and Positron IDE keys across 78 themes doesn't scale by hand, so `scripts/generate-themes.js` expands each console's ~45-token hardware palette (`palettes/*.js`) using OKLCH perceptual mixing, `scripts/generate-explorer.js` compiles the self-contained GitHub Pages (`site/index.html`) and VS Code Webview (`assets/explorer/explorer.html`) interactive explorers from those same modules, and `scripts/validate.js` + `test/*.test.js` enforce multi-gate colorimetric, zero-CDN CSP, and unit-test verification on every build (see [CONTRIBUTING.md](CONTRIBUTING.md) for details):

```sh
npm run build                            # regenerate themes/*.json, package.json, theme-metadata.json & Explorer bundles
npm run validate                         # audit all 78 themes, Explorer CSP & Positron key provenance
npm test                                 # run 43 zero-dependency unit tests (node --test test/*.test.js)
npm run swatches                         # regenerate 677 local swatch PNGs in assets/swatches/
npm run package                          # package lightweight .vsix (README-only media excluded)
python3 scripts/generate-icon.py         # regenerate 4x supersampled 3D-beveled Light/Dark gamepad icon
python3 scripts/generate-banner.py       # regenerate Dark/Light 2x Retina README banners
python3 scripts/generate-diagrams.py     # regenerate Dark/Light 2x Retina timeline & pipeline diagrams
python3 scripts/generate-showcase-gif.py # regenerate animated VS Code / Positron IDE showcase GIF
```

## Accessibility & perceptual contrast

Every single theme must clear strict automated perceptual gates before `generate-themes.js` or `validate.js` will succeed:

- **100% WCAG 2.1 AA compliance (`1,560 / 1,560` foreground & syntax tokens)**: all 20 foreground/syntax tokens in all 78 themes clear **≥ 4.5:1** on `editor.background` (actual range across the family: **`4.61:1` to `16.53:1`**) and **≥ 3.8:1** on `editor.lineHighlightBackground`.
- **APCA-W3 spatial contrast**: primary body text (`fg` on `bg`) achieves **`|Lc| = 83.2` to `99.8`** (`12.65:1`–`16.53:1` WCAG) across all 77 polychromatic themes, tuned to avoid OLED halation in Dark mode while keeping Light plastic-shell surfaces glare-free and crisp.
- **Figure–ground hierarchy**: comments (`fgComment`) clear AA comfortably (`4.77:1`–`6.96:1`) while remaining perceptually subordinate to active code tokens so documentation never competes with control flow.
- **1,248 / 1,248 ANSI terminal tokens verified**: all 16 ANSI colors in every integrated terminal / Positron console clear contrast gates while preserving canonical terminal hue bands (so red errors stay red and green diffs stay green regardless of a console's keyword accent).

| Representative Theme | Editor `fg` / `bg` (WCAG) | Editor `fg` / `bg` (`|Lc|` APCA) | Comment / `bg` | Tightest foreground/syntax role / `bg` |
|---|---|---|---|---|
| **Nintendo Switch Light** | `16.23:1` | `98.4` | `6.77:1` | `5.12:1` |
| **Sega Dreamcast Light** | `16.11:1` | `98.2` | `6.76:1` | `5.16:1` |
| **Nintendo Switch 2 Light** | `16.00:1` | `97.6` | `6.73:1` | `4.95:1` |
| **Playdate Light** | `15.84:1` | `96.7` | `6.65:1` | `5.04:1` |
| **Virtual Boy Dark** | `14.31:1` | `84.0` | `6.64:1` | `4.71:1` |
| **SNES Light** | `13.82:1` | `88.1` | `5.84:1` | `4.75:1` |
| **Nintendo 64 Light** | `13.57:1` | `86.9` | `5.66:1` | `4.72:1` |
| **Steam Machine Dark** | `13.57:1` | `84.2` | `6.28:1` | `5.09:1` |
| **Game Boy Dark** *(1989 DMG-01 LCD ramp)* | `8.83:1` | `74.8` | `4.77:1` | `4.61:1` |

## Color science

Every theme's 13 adjacent syntax-relevant roles (`keyword`, `storage`, `string`, `regex`, `function`, `function-dim`, `type`, `interface`, `number`, `decorator`, `namespace`, `error`, `warning` — **1,014 syntax tokens** across 78 themes) are synthesized in Björn Ottosson's **OKLCH** perceptual color space and audited in **CIE 1976 `L*a*b*`** (`CIEDE2000` ΔE₀₀ for normal-vision categorical distinctness and **Machado, Oliveira & Fernandes (2009)** physiological cone-matrix simulation for protanopia, deuteranopia, and tritanopia).

<img src="assets/color-science/theme-colorspace-grid.png" alt="All 78 themes' 10 core syntax colors plotted in the CIE a*-b* plane, connected in fixed semantic order across a 6x13 chronological grid" width="900">

Plotting each theme's 10 core syntax roles in the CIE `a*`–`b*` chromaticity plane and connecting them in fixed role order reveals each console's chromatic signature at a glance: *Game Boy Dark* collapses into a tight olive-chartreuse needle near a single hue angle (authentic 1989 DMG-01 LCD), while every other console spans a wide, balanced polygon tailored to its specific hardware accent architecture.

<img src="assets/color-science/family-fingerprint.png" alt="Chromatic polygons of all 78 themes faceted across all 7 hardware eras" width="900">

<img src="assets/color-science/pca-global.png" alt="Global PCA of all 1,014 syntax tokens across 78 themes in CIE Lab space, colored by semantic role" width="750">

An unscaled global PCA across all **1,014 syntax tokens** (`PC1 = 50.7%`, `PC2 = 39.6%`, explaining **90.3%** of total perceptual variance in 2D) shows how semantic roles occupy structured, well-separated regions while giving consoles expressive cross-hue freedom where hardware identity calls for violet keywords (SNES/GameCube/PSP/Atari Jaguar), orange/gold keywords (Dreamcast/Atari 2600/Playdate), emerald keywords (Xbox/PS1/N64/ROG Xbox Ally), or sapphire/cyan keywords (PS2/PS4/PS5/PS Portal/Switch/Switch 2/Steam Machine).

### Which console themes look like each other

Measuring mean **CIEDE2000 (`ΔE₀₀`)** distance across all 13 syntax roles between every pair of consoles — factored by Light and Dark polarity so luminance never masks chromatic identity — maps the entire family into a 2D **Classical MDS perceptual landscape** (`52.3%` of Light distance variance, `54.8%` of polychromatic Dark distance variance; `analysis/data/theme-mds.csv`), a **Ward-ordered 39×39 split-triangle distance matrix**, and a full **78-theme Ward's hierarchical dendrogram**:

<img src="assets/color-science/theme-mds.png" alt="Side-by-side Classical MDS perceptual similarity landscape on pairwise mean CIEDE2000 distances across all 39 Light themes and 38 polychromatic Dark themes (with Game Boy Dark shown in an off-chart monochrome outlier callout at mean 41.2 ΔE00), drawn with each theme's real editor background and signature keyword accent" width="900">

<img src="assets/color-science/theme-distance-heatmap.png" alt="Ward-ordered 39x39 split-triangle pairwise CIEDE2000 perceptual distance matrix across all 39 consoles: upper-right triangle shows Light mode, lower-left triangle shows Dark mode, diagonal shows split Light and Dark keyword swatches" width="900">

<img src="assets/color-science/theme-dendrogram.png" alt="Ward's hierarchical clustering dendrogram of all 78 themes on 39-D standardized CIE Lab profiles" width="900">

Three empirical patterns emerge directly from the geometry without any manual grouping:

1. **Mirror-symmetric Light & Dark chromatic topography + DMG-01 isolation**: Orienting Light and Dark MDS along the same semantic poles reveals nearly identical hardware neighborhoods in both modes — **Indigo/Violet** on the left (*Atari Jaguar*, *SNES*, *GameCube*, *PSP*), **Emerald/Primary** on the right (*Xbox 360*, *PS1*, *N64*, *Xbox One*, *3DS*), **Warm Red/Amber** at the top (*NES*, *Neo Geo AES*, *TurboGrafx-16*, *Dreamcast*, *Virtual Boy*), and **Deep Cobalt/Cyan** at the bottom (*PS Vita*, *Master System*, *Genesis*, *PS4*) — while **Game Boy Dark** sits cleanly off-chart at **mean `41.2 ΔE₀₀`** (`36.8–45.5`) from every polychromatic Dark theme, quantifying its faithful 1989 DMG-01 olive LCD ramp.
2. **Manufacturer color DNA forms unmistakable diagonal blocks**: **Sega Master System ↔ Sega Genesis** (`0.97` Light / `1.76` Dark `ΔE₀₀`), **PlayStation 2 / PlayStation Portal / PlayStation 3 / PlayStation 5** (`1.60–2.83 ΔE₀₀`), **Nintendo Switch ↔ Nintendo Switch 2** (`1.92` Light / `2.59` Dark `ΔE₀₀`), and **Xbox / Xbox One / Xbox Series X\|S / ROG Xbox Ally** cluster automatically as tight dark-indigo blocks along the distance matrix diagonal.
3. **Cross-generation industrial kin pair as nearest neighbors**: **SNES** and **Nintendo GameCube** pair directly in *both* Light and Dark modes (Nintendo's lavender-indigo heritage), **PlayStation (PS1)** and **Nintendo 64** pair in *both* modes (1994–1996 neutral-grey/charcoal shells with primary button quartets), **Steam Machine Dark** lands beside **Nintendo Switch Dark** (`1.82 ΔE₀₀` — matte black + electric cyan & crimson), and fiery orange hardware icons (**Atari 2600** and **Sega Dreamcast**) pair directly from color coordinates alone.

### Color-vision-deficiency (CVD) resilience via OKLCH lightness staggering

Categorical syntax palettes that rely purely on hue (such as an isoluminant red string next to a green keyword) collapse under protanopia or deuteranopia. To prevent this scientifically, every Console Palette theme staggers adjacent syntax roles across **OKLCH perceptual lightness (`L`)** as well as hue — because luminance contrast survives all three cone deficiencies even when chromatic axes collapse.

<img src="assets/color-science/cvd-swatch-grid.png" alt="Dichromacy simulation across 12 representative console themes spanning 1977 to 2026 showing 10 syntax roles under Normal Vision, Protanopia, Deuteranopia, and Tritanopia" width="850">

Across all **6,084 role-pairs** (`78 themes × 78 pairs`) and **1,638 critical adjacent syntax pairs** (`keyword`, `storage`, `string`, `function`, `type`, `number`, `error`):

- **77 polychromatic themes (`1,617` critical pairs)**: **0 severe collisions** (`< 5 ΔE*ab`) and **0 moderate collisions** (`< 10 ΔE*ab`) under simulated protanopia, deuteranopia, or tritanopia. Every critical syntax pair stays `≥ 10.37 ΔE*ab` apart across all three CVD simulations.
- **Game Boy Dark (monochrome hardware tribute)**: accounts for the only **3** critical pairs below `10 ΔE*ab` in the entire 78-theme family (`accentStorage`/`colorError` at `2.46`, `accentKeyword`/`accentType` at `7.63`, and `accentKeyword`/`accentStorage` at `9.67`), preserved intentionally as a documented, faithful tribute to the 1989 Game Boy's single-hue olive LCD ramp while still clearing WCAG AA (`4.61:1`–`8.83:1`) on every token.

```sh
node scripts/export-color-data.js                  # export 1,170 token rows (Lab + OKLCH + WCAG + APCA) to analysis/data/colors.csv
python3 scripts/generate-color-science-assets.py   # regenerate all high-DPI PNG plots + audit CSVs + metro map
# Pure-R analytical scripts are also included:
Rscript --vanilla analysis/color_science.R
Rscript --vanilla analysis/theme_similarity.R
Rscript --vanilla analysis/timeline_metro.R
```

## Notes

- An independent, unofficial tribute to gaming hardware industrial design — not affiliated with or endorsed by Atari, Nintendo, Sega, NEC, SNK, Sony, Microsoft, ASUS, Panic, or Valve.
- Zero runtime `npm` dependencies — `extension.js` uses only the built-in `vscode` API and static `theme-metadata.json`.
- Positron-specific workbench tokens (`positronConsole.*`, `positronVariables.*`, `positronPlots.*`, `positronDataExplorer.*`, etc.) are strictly validated against Positron's upstream color registry (`11,856` verified usages across 78 themes).
- No console logos, trademarks, sprites, or copyrighted assets appear anywhere in this repository — every visual (extension icon, README banners, animated IDE showcase GIF, 677 swatch PNGs, timeline & architecture diagrams, Hardware Lineage Metro Map, and color-science plots) is generated algorithmically from hex coordinates and geometric primitives.

## License

MIT — see [LICENSE](LICENSE).
