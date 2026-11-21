# Contributing to Console Palette

Thank you for your interest in **Console Palette**! Whether you are proposing a new gaming console, refining an existing palette's hardware fidelity, improving VS Code / Positron token coverage, or tightening our color-science tooling, this guide covers how the project is structured and verified.

Want to suggest a console without writing code? Open a **[Request a Gaming Console](.github/ISSUE_TEMPLATE/console-request.yml)** issue (you can preview all 60 existing themes first in the **[Live Interactive Workbench & Colorimetry Explorer](https://idesofmerge.github.io/console-palette/)**).

---

## Architecture & Source of Truth

Console Palette ships with **zero runtime `npm` dependencies** and generates all extension themes, metadata, and interactive Explorer bundles deterministically from compact palette modules:

```text
palettes/<slug>-{light,dark}.js   (~45 named hardware tokens + 16 ANSI colors + console metadata)
scripts/color-science.js          (OKLCH synthesis, WCAG 2.1, APCA-W3, CIEDE2000, Machado 2009 CVD)
        │
        ▼   npm run build
        ├── themes/<slug>-{light,dark}-color-theme.json   (full VS Code + Positron theme JSON)
        ├── package.json                                  (contributes.themes catalog)
        ├── theme-metadata.json                           (runtime metadata read by extension.js)
        ├── site/index.html                               (GitHub Pages Interactive Explorer)
        └── assets/explorer/explorer.html                 (offline VS Code / Positron Webview Explorer)
```

> **Important:** Never hand-edit `themes/*.json`, `theme-metadata.json`, `site/index.html`, or `assets/explorer/explorer.html`. Edit the source modules in `palettes/` or generator scripts in `scripts/` and run `npm run build`. CI enforces a clean `git diff` across all generated outputs on every pull request.

---

## Perceptual Quality Gates

Every palette is synthesized in **OKLCH** perceptual color space and must pass automated multi-gate auditing in `scripts/color-science.js` and `scripts/validate.js` before a build or PR can pass:

- **WCAG 2.1 AA contrast (`≥ 4.5:1`)** — all **20 foreground & syntax roles** must achieve `≥ 4.5:1` on `editor.background` (`bg`) and `≥ 3.8:1` on `editor.lineHighlightBackground` (`bgLine`). Primary body text (`fg` on `bg`) requires `≥ 7.0:1` (`≥ 5.8:1` for authentic monochrome hardware tributes such as `gameboy-dark`), `fg` on `bgSidebar` requires `≥ 4.5:1`, and `fgSecondary` on `bgActivity` requires `≥ 3.5:1`.
- **ANSI terminal contrast & hue fidelity** — all **16 ANSI terminal colors** are verified for contrast (`≥ 4.2:1`, `brightBlack ≥ 3.5:1`) while staying within canonical OKLCH hue bands so red errors, green diffs, and cyan/blue diagnostics remain semantically recognizable.
- **APCA-W3 spatial contrast & figure–ground hierarchy** — primary body text (`fg` on `bg`) clears `|Lc| ≥ 70` (`≥ 55` monochrome), while comments (`fgComment`) clear WCAG AA (`≥ 4.5:1`) yet remain perceptually subordinate (`commentBg ≤ fgBg − 2.0`) so documentation never competes with active code.
- **CIEDE2000 distinctness (`ΔE₀₀ ≥ 8.5`)** — adjacent semantic syntax pairs must stay `≥ 8.5 ΔE₀₀` apart in normal vision with zero duplicate hexes across paired roles.
- **Machado et al. (2009) CVD resilience (`≥ 10 ΔE*ab`)** — critical adjacent syntax pairs (`keyword`, `storage`, `string`, `function`, `type`, `number`, `error`) are simulated under protanopia, deuteranopia, and tritanopia. Severe collisions (`< 5 ΔE*ab`) fail the build; polychromatic themes must stagger OKLCH lightness (`L`) alongside hue to hold `≥ 10 ΔE*ab` across all three cone deficiencies.
- **Verified `positron*` key provenance** — every Positron IDE workbench color key is checked against the confirmed upstream registry (`src/vs/workbench/common/theme.ts` in `posit-dev/positron`). Unrecognized `positron*` keys fail validation.
- **Zero-CDN Content Security Policy** — both `site/index.html` and `assets/explorer/explorer.html` must be 100% self-contained with no external HTTP(S) scripts, stylesheets, or images, and `assets/explorer/explorer.html` must preserve the `{{CSP_META}}` and `{{CSP_NONCE}}` placeholders injected by `extension.js`.

---

## Development Commands

Requires **Node.js 22+** (no `npm install` needed for core builds, validation, or tests):

```sh
npm run build      # Regenerate themes/*.json, package.json, theme-metadata.json & Explorer bundles
npm run validate   # Audit all themes, perceptual gates, Explorer CSP & positron* key provenance
npm test           # Run unit tests (node --test test/*.test.js) for colorimetry & extension logic
npm run swatches   # Regenerate local swatch PNGs in assets/swatches/
npm run package    # Build a local .vsix package via @vscode/vsce
```

To test your changes interactively in an Extension Development Host without packaging:

```sh
code --extensionDevelopmentPath="$PWD"
# or in Positron:
positron --extensionDevelopmentPath="$PWD"
```

### Optional Visual & Analytical Scripts (Python 3 / R)

When adding a new console or refreshing analytical figures and README media:

```sh
node scripts/generate-readme-catalog.js           # Refresh the README catalog swatch table
node scripts/export-color-data.js                 # Export Lab + OKLCH + WCAG + APCA CSV to analysis/data/colors.csv
python3 scripts/generate-color-science-assets.py  # Regenerate color-science plots, audit CSVs & metro map
python3 scripts/generate-icon.py                  # Regenerate extension icon (icon.png)
python3 scripts/generate-banner.py                # Regenerate Dark/Light README banners
python3 scripts/generate-diagrams.py              # Regenerate Dark/Light timeline & pipeline diagrams
python3 scripts/generate-showcase-gif.py          # Regenerate animated IDE showcase GIF

# Pure-R analytical reproductions:
Rscript --vanilla analysis/color_science.R
Rscript --vanilla analysis/theme_similarity.R
Rscript --vanilla analysis/timeline_metro.R
```

---

## Adding or Tuning a Console Palette

1. **Create or edit** both `palettes/<slug>-light.js` and `palettes/<slug>-dark.js` (use an existing pair such as `palettes/snes-light.js` and `palettes/snes-dark.js` as a reference for metadata and token keys).
2. If you are adding a **brand-new console** (expanding the catalog beyond 30 consoles / 60 themes), update `EXPECTED_THEME_COUNT` in `scripts/validate.js` and refresh the catalog via `node scripts/generate-readme-catalog.js`.
3. Run `npm run build`, `npm run swatches`, `npm run validate`, and `npm test`, ensuring zero errors and zero CVD warnings on polychromatic themes.
4. Preview both themes in the Extension Development Host (and inside the Interactive Explorer) across Light, Dark, and Protanopia / Deuteranopia / Tritanopia views.
5. Open a pull request describing the hardware finish, button/display color sources, and any perceptual trade-offs.

---

## IP & Trademark Hygiene

Console Palette is an **independent, unofficial tribute** to gaming hardware industrial design and is not affiliated with or endorsed by any console manufacturer.

- Draw inspiration **strictly from industrial color language and hardware atmosphere** — outer plastic finishes, controller button hues, indicator LEDs, and display characteristics (CRT, LCD, OLED).
- **Never** include, trace, or link copyrighted assets: **zero** console logos, brand wordmarks, game sprites, box art, controller artwork, or trademarks anywhere in code, themes, documentation, issues, or pull requests.
- Every visual asset in this repository (icon, banners, swatches, diagrams, showcase GIF, and plots) must remain algorithmically generated from hex coordinates and clean geometric primitives.
