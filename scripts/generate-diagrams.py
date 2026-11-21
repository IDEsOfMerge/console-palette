#!/usr/bin/env python3
"""
Programmatically renders the Console Palette README architecture and release-timeline
diagrams as 2x Retina Dark and Light PNGs from pure geometric SVG vectors:
  - assets/diagrams/release-timeline-dark.png  &  release-timeline-light.png (1920x1140)
  - assets/diagrams/build-pipeline-dark.png    &  build-pipeline-light.png   (1920x936)

Run with: python3 scripts/generate-diagrams.py
"""

import glob
import html
import os
import re
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PALETTES_DIR = os.path.join(ROOT, "palettes")
OUT_DIR = os.path.join(ROOT, "assets", "diagrams")

FONT_SANS = "'Liberation Sans', 'DejaVu Sans', sans-serif"
FONT_MONO = "'DejaVu Sans Mono', 'Liberation Mono', monospace"

ERAS = [
    {
        "id": "8bit",
        "title": "8-BIT PIONEERS",
        "span": "1977–1989",
        "accent": "gold",
        "consoles": [
            ("Atari 2600", "Atari 2600", 1977, "Atari"),
            ("NES", "NES", 1985, "Nintendo"),
            ("Sega Master System", "Master System", 1985, "Sega"),
            ("Game Boy", "Game Boy (DMG)", 1989, "Nintendo"),
        ],
    },
    {
        "id": "16bit",
        "title": "16-BIT GOLDEN AGE",
        "span": "1987–1990",
        "accent": "ruby",
        "consoles": [
            ("TurboGrafx-16", "TurboGrafx-16", 1987, "NEC"),
            ("Sega Genesis", "Sega Genesis", 1988, "Sega"),
            ("SNES", "SNES / SFC", 1990, "Nintendo"),
            ("Neo Geo AES", "Neo Geo AES", 1990, "SNK"),
        ],
    },
    {
        "id": "polygon",
        "title": "32/64-BIT POLYGON",
        "span": "1994–1998",
        "accent": "violet",
        "consoles": [
            ("Sega Saturn", "Sega Saturn", 1994, "Sega"),
            ("PlayStation", "PlayStation", 1994, "Sony"),
            ("Nintendo 64", "Nintendo 64", 1996, "Nintendo"),
            ("Game Boy Color", "Game Boy Color", 1998, "Nintendo"),
        ],
    },
    {
        "id": "millennial",
        "title": "128-BIT & MILLENNIAL",
        "span": "1998–2001",
        "accent": "sapphire",
        "consoles": [
            ("Sega Dreamcast", "Sega Dreamcast", 1998, "Sega"),
            ("PlayStation 2", "PlayStation 2", 2000, "Sony"),
            ("Game Boy Advance", "Game Boy Advance", 2001, "Nintendo"),
            ("Nintendo GameCube", "GameCube", 2001, "Nintendo"),
            ("Xbox", "Xbox", 2001, "Microsoft"),
        ],
    },
    {
        "id": "hd",
        "title": "HD, MOTION & PORTABLE",
        "span": "2004–2011",
        "accent": "teal",
        "consoles": [
            ("Nintendo DS", "Nintendo DS", 2004, "Nintendo"),
            ("PlayStation Portable", "PSP", 2004, "Sony"),
            ("Xbox 360", "Xbox 360", 2005, "Microsoft"),
            ("Nintendo Wii", "Nintendo Wii", 2006, "Nintendo"),
            ("PlayStation 3", "PlayStation 3", 2006, "Sony"),
            ("Nintendo 3DS", "Nintendo 3DS", 2011, "Nintendo"),
            ("PlayStation Vita", "PS Vita", 2011, "Sony"),
        ],
    },
    {
        "id": "modern",
        "title": "MODERN & HYBRID",
        "span": "2013–2022",
        "accent": "emerald",
        "consoles": [
            ("PlayStation 4", "PlayStation 4", 2013, "Sony"),
            ("Xbox One", "Xbox One", 2013, "Microsoft"),
            ("Nintendo Switch", "Nintendo Switch", 2017, "Nintendo"),
            ("PlayStation 5", "PlayStation 5", 2020, "Sony"),
            ("Xbox Series X|S", "Xbox Series X|S", 2020, "Microsoft"),
            ("Steam Deck", "Steam Deck", 2022, "Valve"),
        ],
    },
]


def load_palette_swatches():
    by_console = {}
    for path in sorted(glob.glob(os.path.join(PALETTES_DIR, "*.js"))):
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        m_con = re.search(r"console:\s*(?:'((?:\\'|[^'])+)'|\"([^\"]+)\")", text)
        m_mode = re.search(r"mode:\s*['\"](light|dark)['\"]", text)
        m_bg = re.search(r"bg:\s*['\"](#[0-9A-Fa-f]{6})['\"]", text)
        m_cur = re.search(r"accentCursor:\s*['\"](#[0-9A-Fa-f]{6})['\"]", text)
        m_kw = re.search(r"accentKeyword:\s*['\"](#[0-9A-Fa-f]{6})['\"]", text)
        if not (m_con and m_mode and m_bg):
            continue
        raw_con = m_con.group(1) or m_con.group(2)
        con = raw_con.replace("\\'", "'")
        mode = m_mode.group(1)
        by_console.setdefault(con, {})[mode] = {
            "bg": m_bg.group(1),
            "cursor": (m_cur.group(1) if m_cur else m_kw.group(1)),
            "keyword": (m_kw.group(1) if m_kw else m_bg.group(1)),
        }
    return by_console


def get_theme(mode: str) -> dict:
    if mode == "dark":
        return {
            "bg": "#0D1117",
            "surface": "#161B22",
            "surface_alt": "#131922",
            "pill_bg": "#1F2631",
            "border": "#30363D",
            "border_soft": "#242B35",
            "text": "#E6EDF3",
            "text_sub": "#9BA6B2",
            "text_muted": "#7D8590",
            "line": "#6E7B8F",
            "swatch_stroke": "#444C56",
            "accents": {
                "gold":     {"fg": "#EAB938", "bg": "#241E11", "bd": "#7A601C"},
                "emerald":  {"fg": "#56D39A", "bg": "#11241D", "bd": "#246B4F"},
                "sapphire": {"fg": "#58A6FF", "bg": "#111E30", "bd": "#285B94"},
                "teal":     {"fg": "#39D2C0", "bg": "#102424", "bd": "#216D66"},
                "violet":   {"fg": "#B495F8", "bg": "#1D1730", "bd": "#5C4799"},
                "ruby":     {"fg": "#F47067", "bg": "#291518", "bd": "#8A3633"},
            },
        }
    return {
        "bg": "#F6F8FA",
        "surface": "#FFFFFF",
        "surface_alt": "#F1F4F8",
        "pill_bg": "#EAEEF2",
        "border": "#D0D7DE",
        "border_soft": "#E1E6EC",
        "text": "#1F2328",
        "text_sub": "#4B535D",
        "text_muted": "#656D76",
        "line": "#6E7781",
        "swatch_stroke": "#B8C0C8",
        "accents": {
            "gold":     {"fg": "#9A6700", "bg": "#FFF8E3", "bd": "#D4A72C"},
            "emerald":  {"fg": "#116329", "bg": "#E9F9EE", "bd": "#4AC26B"},
            "sapphire": {"fg": "#0969DA", "bg": "#EAF4FF", "bd": "#54AEFF"},
            "teal":     {"fg": "#0B6B68", "bg": "#E5F9F7", "bd": "#38B5AE"},
            "violet":   {"fg": "#6639BA", "bg": "#F4EEFF", "bd": "#A475F9"},
            "ruby":     {"fg": "#CF222E", "bg": "#FFEFEF", "bd": "#FF8182"},
        },
    }


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def build_release_timeline_svg(mode: str, swatches: dict) -> str:
    t = get_theme(mode)
    acc = t["accents"]
    W, H = 960, 570

    # --- Chronological ruler (1977 -> 2022) ---
    rx0, rx1, spine_y = 58.0, 902.0, 108.0

    def year_x(yr: int) -> float:
        return rx0 + (yr - 1977) * (rx1 - rx0) / 45.0

    ruler_parts = []
    for yr in (1977, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2022):
        x = year_x(yr)
        ruler_parts.append(
            f'  <line x1="{x:.1f}" y1="{spine_y - 5:.1f}" x2="{x:.1f}" y2="{spine_y + 7:.1f}" '
            f'stroke="{t["border"]}" stroke-width="1.2"/>'
        )
        lbl_col = acc["sapphire"]["fg"] if yr in (1977, 2022) else t["text_muted"]
        fw = "700" if yr in (1977, 2022) else "500"
        ruler_parts.append(
            f'  <text x="{x:.1f}" y="{spine_y + 21:.1f}" text-anchor="middle" '
            f'font-family="{FONT_MONO}" font-size="9.5" font-weight="{fw}" fill="{lbl_col}">{yr}</text>'
        )

    ruler_parts.append(
        f'  <line x1="{rx0:.1f}" y1="{spine_y:.1f}" x2="{rx1:.1f}" y2="{spine_y:.1f}" '
        f'stroke="{t["border"]}" stroke-width="2.5" stroke-linecap="round"/>'
    )

    legend_items = [
        ("8-bit", acc["gold"]["fg"], 30.0),
        ("16-bit", acc["ruby"]["fg"], 34.0),
        ("32/64-bit", acc["violet"]["fg"], 49.0),
        ("128-bit", acc["sapphire"]["fg"], 40.0),
        ("HD/Port", acc["teal"]["fg"], 44.0),
        ("Modern", acc["emerald"]["fg"], 40.0),
    ]
    total_w = sum(11.0 + tw for _, _, tw in legend_items) + 12.0 * (len(legend_items) - 1)
    lx = 918.0 - total_w + 4.0
    for lbl, col, tw in legend_items:
        ruler_parts.append(f'  <circle cx="{lx:.1f}" cy="84" r="3.8" fill="{col}"/>')
        ruler_parts.append(
            f'  <text x="{lx + 7.5:.1f}" y="87.5" font-family="{FONT_SANS}" '
            f'font-size="9.5" font-weight="600" fill="{t["text_sub"]}">{esc(lbl)}</text>'
        )
        lx += 11.0 + tw + 12.0

    # Group same-year launches so dots stack cleanly vertically without overlap
    by_year = {}
    for era in ERAS:
        col = acc[era["accent"]]["fg"]
        for _, _, yr, _ in era["consoles"]:
            by_year.setdefault(yr, []).append(col)

    for yr, cols in sorted(by_year.items()):
        x = year_x(yr)
        n = len(cols)
        for idx, col in enumerate(cols):
            if n == 1:
                cy, r = spine_y, 5.2
            elif n == 2:
                cy = spine_y - 5.5 if idx == 0 else spine_y + 5.5
                r = 4.3
            else:
                cy = spine_y + (idx - (n - 1) / 2.0) * 8.2
                r = 3.8
            ruler_parts.append(
                f'  <circle cx="{x:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{col}" '
                f'stroke="{t["surface"]}" stroke-width="1.4"/>'
            )

    def render_console_row(x0: float, w: float, y: float, full_name: str, disp: str, yr: int, maker: str, era_fg: str) -> str:
        sw = swatches.get(full_name, {})
        l_bg = sw.get("light", {}).get("bg", "#F2F4F7")
        d_bg = sw.get("dark", {}).get("bg", "#0D1117")
        id_col = sw.get(mode, {}).get("cursor", era_fg)

        sw_w = 28.0
        sw_x = x0 + w - 11.0 - sw_w
        mk_short = {"Nintendo": "NIN", "Microsoft": "MS", "Sony": "SONY", "Sega": "SEGA", "Atari": "ATARI", "NEC": "NEC", "SNK": "SNK", "Valve": "VALVE"}.get(maker, maker)
        plat_w = max(28.0, len(mk_short) * 5.2 + 8.0)
        plat_x = sw_x - 6.0 - plat_w

        return "\n".join([
            f'  <text x="{x0 + 11:.1f}" y="{y:.1f}" font-family="{FONT_MONO}" font-size="10" font-weight="700" fill="{era_fg}">{yr}</text>',
            f'  <text x="{x0 + 44:.1f}" y="{y:.1f}" font-family="{FONT_SANS}" font-size="11" font-weight="600" fill="{t["text"]}">{esc(disp)}</text>',
            f'  <rect x="{plat_x:.1f}" y="{y - 10:.1f}" width="{plat_w:.1f}" height="13.5" rx="3.2" fill="{t["pill_bg"]}"/>',
            f'  <text x="{plat_x + plat_w / 2:.1f}" y="{y - 0.5:.1f}" text-anchor="middle" font-family="{FONT_MONO}" font-size="8" font-weight="600" fill="{t["text_muted"]}">{esc(mk_short)}</text>',
            f'  <rect x="{sw_x:.1f}" y="{y - 8.2:.1f}" width="8" height="9.5" rx="2" fill="{l_bg}" stroke="{t["swatch_stroke"]}" stroke-width="0.7"/>',
            f'  <rect x="{sw_x + 10:.1f}" y="{y - 8.2:.1f}" width="8" height="9.5" rx="2" fill="{d_bg}" stroke="{t["swatch_stroke"]}" stroke-width="0.7"/>',
            f'  <rect x="{sw_x + 20:.1f}" y="{y - 8.2:.1f}" width="8" height="9.5" rx="2" fill="{id_col}" stroke="{t["swatch_stroke"]}" stroke-width="0.7"/>',
        ])

    def render_card_shell(x: float, y: float, w: float, h: float, title: str, span: str, accent_key: str) -> str:
        a = acc[accent_key]
        return (
            f'  <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="8" '
            f'fill="{t["surface"]}" stroke="{t["border"]}" stroke-width="1.2"/>\n'
            f'  <path d="M {x + 8:.1f},{y:.1f} H {x + w - 8:.1f} Q {x + w:.1f},{y:.1f} {x + w:.1f},{y + 4:.1f} '
            f'L {x + w:.1f},{y + 4:.1f} H {x:.1f} Q {x:.1f},{y:.1f} {x + 8:.1f},{y:.1f} Z" fill="{a["fg"]}"/>\n'
            f'  <rect x="{x + 1:.1f}" y="{y + 4:.1f}" width="{w - 2:.1f}" height="27" fill="{a["bg"]}"/>\n'
            f'  <line x1="{x:.1f}" y1="{y + 31:.1f}" x2="{x + w:.1f}" y2="{y + 31:.1f}" stroke="{t["border_soft"]}" stroke-width="1"/>\n'
            f'  <text x="{x + 12:.1f}" y="{y + 21.5:.1f}" font-family="{FONT_MONO}" font-size="10" font-weight="700" letter-spacing="0.5" fill="{a["fg"]}">{esc(title)}</text>\n'
            f'  <text x="{x + w - 12:.1f}" y="{y + 21.5:.1f}" text-anchor="end" font-family="{FONT_MONO}" font-size="9.5" font-weight="600" fill="{t["text_muted"]}">{esc(span)}</text>'
        )

    cards_parts = []
    card_w, gap = 292.0, 14.0

    # Row 1: 3 cards (8-bit, 16-bit, 32/64-bit) — 4 consoles each
    row1_y, row1_h = 152.0, 148.0
    for i, era in enumerate(ERAS[:3]):
        cx = 28.0 + i * (card_w + gap)
        a = acc[era["accent"]]
        cards_parts.append(render_card_shell(cx, row1_y, card_w, row1_h, era["title"], era["span"], era["accent"]))
        start_y = row1_y + 52.0
        pitch = 26.5
        for j, (full_c, disp_c, yr, mk) in enumerate(era["consoles"]):
            ry = start_y + j * pitch
            if j > 0:
                cards_parts.append(
                    f'  <line x1="{cx + 11:.1f}" y1="{ry - 16.0:.1f}" x2="{cx + card_w - 11:.1f}" y2="{ry - 16.0:.1f}" '
                    f'stroke="{t["border_soft"]}" stroke-width="0.8"/>'
                )
            cards_parts.append(render_console_row(cx, card_w, ry, full_c, disp_c, yr, mk, a["fg"]))

    # Row 2: 3 cards (128-bit: 5 items, HD/Portable: 7 items, Modern: 6 items)
    row2_y, row2_h = 314.0, 232.0
    for i, era in enumerate(ERAS[3:]):
        cx = 28.0 + i * (card_w + gap)
        a = acc[era["accent"]]
        cards_parts.append(render_card_shell(cx, row2_y, card_w, row2_h, era["title"], era["span"], era["accent"]))
        n_items = len(era["consoles"])
        start_y = row2_y + 52.0
        pitch = 27.5 if n_items == 7 else (31.0 if n_items == 6 else 35.0)
        for j, (full_c, disp_c, yr, mk) in enumerate(era["consoles"]):
            ry = start_y + j * pitch
            if j > 0:
                cards_parts.append(
                    f'  <line x1="{cx + 11:.1f}" y1="{ry - pitch * 0.58:.1f}" x2="{cx + card_w - 11:.1f}" y2="{ry - pitch * 0.58:.1f}" '
                    f'stroke="{t["border_soft"]}" stroke-width="0.8"/>'
                )
            cards_parts.append(render_console_row(cx, card_w, ry, full_c, disp_c, yr, mk, a["fg"]))

    a_sap = acc["sapphire"]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <rect x="0.5" y="0.5" width="{W - 1}" height="{H - 1}" rx="12" fill="{t["bg"]}" stroke="{t["border"]}" stroke-width="1"/>

  <!-- Header -->
  <text x="28" y="34" font-family="{FONT_SANS}" font-size="17" font-weight="700" fill="{t["text"]}">Console Palette — 30 Iconic Gaming Consoles by Launch Year (1977–2022)</text>
  <text x="28" y="53" font-family="{FONT_SANS}" font-size="11.5" fill="{t["text_sub"]}">60 Light &amp; Dark OKLCH themes spanning six hardware eras  ·  swatches show Light bg · Dark bg · identity accent</text>

  <rect x="748" y="18" width="184" height="24" rx="12" fill="{a_sap["bg"]}" stroke="{a_sap["bd"]}" stroke-width="1"/>
  <text x="840" y="33.5" text-anchor="middle" font-family="{FONT_MONO}" font-size="10" font-weight="700" letter-spacing="0.5" fill="{a_sap["fg"]}">30 CONSOLES · 60 THEMES</text>

  <!-- Chronological Decade Ruler -->
  <rect x="28" y="68" width="904" height="72" rx="8" fill="{t["surface"]}" stroke="{t["border"]}" stroke-width="1.2"/>
  <text x="42" y="87.5" font-family="{FONT_MONO}" font-size="9.5" font-weight="700" letter-spacing="0.7" fill="{t["text_muted"]}">HARDWARE LAUNCH CADENCE (1977 → 2022)</text>
{chr(10).join(ruler_parts)}

  <!-- Six Hardware Era Cards -->
{chr(10).join(cards_parts)}
</svg>
'''


def build_pipeline_svg(mode: str) -> str:
    t = get_theme(mode)
    acc = t["accents"]
    W, H = 960, 468

    line_c = t["line"]
    purple_c = acc["violet"]["fg"]
    green_c = acc["emerald"]["fg"]
    gold_c = acc["gold"]["fg"]
    blue_c = acc["sapphire"]["fg"]
    teal_c = acc["teal"]["fg"]

    def stage_header(x: float, w: float, label: str) -> str:
        return (
            f'  <rect x="{x:.1f}" y="66" width="{w:.1f}" height="20" rx="4" fill="{t["surface_alt"]}" stroke="{t["border_soft"]}" stroke-width="1"/>\n'
            f'  <text x="{x + w / 2:.1f}" y="79.5" text-anchor="middle" font-family="{FONT_MONO}" font-size="9.5" font-weight="700" letter-spacing="0.8" fill="{t["text_muted"]}">{esc(label)}</text>'
        )

    def box_card(x: float, y: float, w: float, h: float, title: str, lines: list, accent_key: str, tag: str = "", dashed: bool = False, stripe_left: bool = True) -> str:
        a = acc[accent_key]
        dash_attr = ' stroke-dasharray="5,4"' if dashed else ""
        stroke_col = a["bd"]
        parts = [
            f'  <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="8" fill="{t["surface"]}" stroke="{stroke_col}" stroke-width="1.4"{dash_attr}/>',
        ]
        if stripe_left:
            parts.append(
                f'  <rect x="{x + 1:.1f}" y="{y + 6:.1f}" width="3.5" height="{h - 12:.1f}" rx="1.75" fill="{a["fg"]}"/>'
            )
        tx = x + 13.0
        ty = y + (23.0 if tag else (20.0 if len(lines) == 1 else 24.0))
        if tag:
            tag_w = len(tag) * 5.6 + 12.0
            parts.append(
                f'  <rect x="{x + w - tag_w - 8:.1f}" y="{y + 7:.1f}" width="{tag_w:.1f}" height="15" rx="3.5" fill="{a["bg"]}" stroke="{a["bd"]}" stroke-width="0.8"/>'
            )
            parts.append(
                f'  <text x="{x + w - tag_w / 2 - 8:.1f}" y="{y + 17.5:.1f}" text-anchor="middle" font-family="{FONT_MONO}" font-size="8" font-weight="700" letter-spacing="0.5" fill="{a["fg"]}">{esc(tag)}</text>'
            )
            ty = y + 32.0
        parts.append(
            f'  <text x="{tx:.1f}" y="{ty:.1f}" font-family="{FONT_MONO}" font-size="11.5" font-weight="700" fill="{t["text"]}">{esc(title)}</text>'
        )
        for i, ln in enumerate(lines):
            ly = ty + 16.0 + i * 14.5
            col = t["text_sub"] if i == 0 else t["text_muted"]
            parts.append(
                f'  <text x="{tx:.1f}" y="{ly:.1f}" font-family="{FONT_SANS}" font-size="10.5" fill="{col}">{esc(ln)}</text>'
            )
        return "\n".join(parts)

    def artifact_card(x: float, y: float, w: float, h: float, title: str, subtitle: str, accent_key: str) -> str:
        a = acc[accent_key]
        return (
            f'  <rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" rx="7" fill="{t["surface"]}" stroke="{t["border"]}" stroke-width="1.2"/>\n'
            f'  <rect x="{x + 1:.1f}" y="{y + 6:.1f}" width="3.5" height="{h - 12:.1f}" rx="1.75" fill="{a["fg"]}"/>\n'
            f'  <text x="{x + 13:.1f}" y="{y + 18.5:.1f}" font-family="{FONT_MONO}" font-size="11" font-weight="700" fill="{t["text"]}">{esc(title)}</text>\n'
            f'  <text x="{x + 13:.1f}" y="{y + 33.5:.1f}" font-family="{FONT_SANS}" font-size="10" fill="{t["text_sub"]}">{esc(subtitle)}</text>'
        )

    c1_x, c1_w = 24.0, 168.0
    c2_x, c2_w = 228.0, 184.0
    c3_x, c3_w = 448.0, 222.0
    c4_x, c4_w = 710.0, 226.0

    swatch_colors = ["#34E08C", "#FF4D5E", "#38A2FF", "#A288FF", "#F5C428"]
    mini_sw = "\n".join(
        f'  <rect x="{c1_x + 13 + i * 18:.1f}" y="232" width="13" height="9" rx="2" fill="{c}"/>'
        for i, c in enumerate(swatch_colors)
    )

    a_val = acc["violet"]
    val_x, val_y, val_w, val_h = c4_x, 180.0, c4_w, 122.0
    val_card = f'''  <rect x="{val_x:.1f}" y="{val_y:.1f}" width="{val_w:.1f}" height="{val_h:.1f}" rx="8" fill="{t["surface"]}" stroke="{a_val["bd"]}" stroke-width="1.5"/>
  <rect x="{val_x + 1:.1f}" y="{val_y + 6:.1f}" width="3.5" height="{val_h - 12:.1f}" rx="1.75" fill="{a_val["fg"]}"/>
  <rect x="{val_x + val_w - 76:.1f}" y="{val_y + 7:.1f}" width="68" height="15" rx="3.5" fill="{a_val["bg"]}" stroke="{a_val["bd"]}" stroke-width="0.8"/>
  <text x="{val_x + val_w - 42:.1f}" y="{val_y + 17.5:.1f}" text-anchor="middle" font-family="{FONT_MONO}" font-size="8" font-weight="700" letter-spacing="0.5" fill="{a_val["fg"]}">AUDIT GATE</text>
  <text x="{val_x + 13:.1f}" y="{val_y + 34:.1f}" font-family="{FONT_MONO}" font-size="11.5" font-weight="700" fill="{t["text"]}">scripts/validate.js</text>
  <line x1="{val_x + 13:.1f}" y1="{val_y + 44:.1f}" x2="{val_x + val_w - 12:.1f}" y2="{val_y + 44:.1f}" stroke="{t["border_soft"]}" stroke-width="1"/>
  <text x="{val_x + 13:.1f}" y="{val_y + 61:.1f}" font-family="{FONT_SANS}" font-size="10.2" fill="{t["text_sub"]}"><tspan fill="{green_c}" font-weight="700">✓</tspan> 1,200/1,200 WCAG AA + APCA</text>
  <text x="{val_x + 13:.1f}" y="{val_y + 78:.1f}" font-family="{FONT_SANS}" font-size="10.2" fill="{t["text_sub"]}"><tspan fill="{green_c}" font-weight="700">✓</tspan> CIEDE2000 + Machado CVD</text>
  <text x="{val_x + 13:.1f}" y="{val_y + 95:.1f}" font-family="{FONT_SANS}" font-size="10.2" fill="{t["text_sub"]}"><tspan fill="{green_c}" font-weight="700">✓</tspan> Zero-CDN Explorer CSP</text>
  <text x="{val_x + 13:.1f}" y="{val_y + 112:.1f}" font-family="{FONT_SANS}" font-size="10.2" fill="{t["text_sub"]}"><tspan fill="{green_c}" font-weight="700">✓</tspan> 9,120 verified Positron keys</text>'''

    a_ok = acc["emerald"]
    ok_x, ok_y, ok_w, ok_h = c4_x, 346.0, c4_w, 66.0
    ok_card = f'''  <rect x="{ok_x:.1f}" y="{ok_y:.1f}" width="{ok_w:.1f}" height="{ok_h:.1f}" rx="8" fill="{a_ok["bg"]}" stroke="{a_ok["bd"]}" stroke-width="1.6"/>
  <rect x="{ok_x + 1:.1f}" y="{ok_y + 6:.1f}" width="3.5" height="{ok_h - 12:.1f}" rx="1.75" fill="{a_ok["fg"]}"/>
  <text x="{ok_x + 13:.1f}" y="{ok_y + 25:.1f}" font-family="{FONT_SANS}" font-size="12" font-weight="700" fill="{a_ok["fg"]}">✓  CI &amp; vsce package succeed</text>
  <text x="{ok_x + 13:.1f}" y="{ok_y + 43:.1f}" font-family="{FONT_SANS}" font-size="10.2" fill="{t["text_sub"]}">GitHub Actions green · .vsix built</text>
  <text x="{ok_x + 13:.1f}" y="{ok_y + 57:.1f}" font-family="{FONT_MONO}" font-size="9.2" fill="{t["text_muted"]}">VS Code · Positron · Open VSX</text>'''

    connectors = f'''  <path d="M 192,188 L 206,188 Q 212,188 212,182 L 212,140 Q 212,134 218,134 L 226,134"
        fill="none" stroke="{gold_c}" stroke-width="1.8" marker-end="url(#arr-gold-{mode})"/>
  <path d="M 192,226 L 206,226 Q 212,226 212,232 L 212,337 Q 212,343 218,343 L 226,343"
        fill="none" stroke="{gold_c}" stroke-width="1.8" marker-end="url(#arr-gold-{mode})"/>
  <path d="M 320,202 L 320,174"
        fill="none" stroke="{purple_c}" stroke-width="1.8" marker-end="url(#arr-violet-{mode})"/>
  <path d="M 412,256 L 708,256"
        fill="none" stroke="{purple_c}" stroke-width="2.0" marker-end="url(#arr-violet-{mode})"/>
  <rect x="503" y="246.5" width="112" height="19" rx="9.5" fill="{acc["violet"]["bg"]}" stroke="{acc["violet"]["bd"]}" stroke-width="0.9"/>
  <text x="559" y="259" text-anchor="middle" font-family="{FONT_MONO}" font-size="8.8" font-weight="700" fill="{purple_c}">COLORIMETRY ENGINE</text>
  <path d="M 412,126 L 424,126 Q 430,126 430,120 L 430,120 Q 430,114 436,114 L 446,114"
        fill="none" stroke="{blue_c}" stroke-width="1.7" marker-end="url(#arr-blue-{mode})"/>
  <path d="M 412,142 L 424,142 Q 430,142 430,148 L 430,160 Q 430,166 436,166 L 446,166"
        fill="none" stroke="{blue_c}" stroke-width="1.7" marker-end="url(#arr-blue-{mode})"/>
  <path d="M 412,158 L 422,158 Q 428,158 428,164 L 428,212 Q 428,218 434,218 L 446,218"
        fill="none" stroke="{blue_c}" stroke-width="1.7" marker-end="url(#arr-blue-{mode})"/>
  <path d="M 412,334 L 424,334 Q 430,334 430,328 L 430,300 Q 430,294 436,294 L 446,294"
        fill="none" stroke="{teal_c}" stroke-width="1.7" marker-end="url(#arr-teal-{mode})"/>
  <path d="M 412,350 L 446,350"
        fill="none" stroke="{teal_c}" stroke-width="1.7" marker-end="url(#arr-teal-{mode})"/>
  <path d="M 670,114 L 708,114"
        fill="none" stroke="{gold_c}" stroke-width="1.7" stroke-dasharray="5,4" marker-end="url(#arr-gold-{mode})"/>
  <path d="M 670,166 L 686,166 Q 692,166 692,172 L 692,198 Q 692,204 698,204 L 708,204"
        fill="none" stroke="{line_c}" stroke-width="1.6" marker-end="url(#arr-line-{mode})"/>
  <path d="M 670,218 L 708,218"
        fill="none" stroke="{line_c}" stroke-width="1.6" marker-end="url(#arr-line-{mode})"/>
  <path d="M 670,294 L 684,294 Q 690,294 690,288 L 690,280 Q 690,274 696,274 L 708,274"
        fill="none" stroke="{line_c}" stroke-width="1.6" marker-end="url(#arr-line-{mode})"/>
  <path d="M 670,350 L 690,350 Q 696,350 696,344 L 696,294 Q 696,288 702,288 L 708,288"
        fill="none" stroke="{line_c}" stroke-width="1.6" marker-end="url(#arr-line-{mode})"/>
  <path d="M 823,302 L 823,343"
        fill="none" stroke="{green_c}" stroke-width="2.2" marker-end="url(#arr-green-{mode})"/>
  <rect x="774" y="313" width="98" height="17" rx="8.5" fill="{a_ok["bg"]}" stroke="{a_ok["bd"]}" stroke-width="0.9"/>
  <text x="823" y="324.5" text-anchor="middle" font-family="{FONT_MONO}" font-size="8.5" font-weight="700" fill="{green_c}">ALL GATES PASS</text>'''

    def marker(mid: str, color: str) -> str:
        return (
            f'    <marker id="{mid}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">\n'
            f'      <path d="M 1,1.5 L 8.5,5 L 1,8.5 z" fill="{color}"/>\n'
            f'    </marker>'
        )

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <defs>
{marker(f"arr-gold-{mode}", gold_c)}
{marker(f"arr-violet-{mode}", purple_c)}
{marker(f"arr-blue-{mode}", blue_c)}
{marker(f"arr-teal-{mode}", teal_c)}
{marker(f"arr-line-{mode}", line_c)}
{marker(f"arr-green-{mode}", green_c)}
  </defs>

  <rect x="0.5" y="0.5" width="{W - 1}" height="{H - 1}" rx="12" fill="{t["bg"]}" stroke="{t["border"]}" stroke-width="1"/>

  <text x="24" y="34" font-family="{FONT_SANS}" font-size="17" font-weight="700" fill="{t["text"]}">Console Palette — Build, Colorimetry &amp; Validation Pipeline</text>
  <text x="24" y="52" font-family="{FONT_SANS}" font-size="11.5" fill="{t["text_sub"]}">Deterministic OKLCH expansion from 60 hardware palettes to VS Code / Positron themes, offline Explorers &amp; automated CI gates</text>

{stage_header(c1_x, c1_w, "1 · SOURCE PALETTES")}
{stage_header(c2_x, c2_w, "2 · BUILD & ENGINE")}
{stage_header(c3_x, c3_w, "3 · GENERATED ARTIFACTS")}
{stage_header(c4_x, c4_w, "4 · AUDIT, CI & RUNTIME")}

{connectors}

{box_card(c1_x, 152, c1_w, 102, "palettes/*.js", ["60 bespoke console palettes", "~45 hardware tokens each"], "gold", tag="INPUT")}
{mini_sw}

{box_card(c2_x, 96, c2_w, 76, "generate-themes.js", ["OKLCH perceptual mixing", "& Positron key synthesis"], "sapphire", tag="SCRIPTS")}
{box_card(c2_x, 202, c2_w, 76, "color-science.js", ["OKLCH · WCAG · APCA", "CIEDE2000 · Machado CVD"], "violet", tag="SHARED")}
{box_card(c2_x, 304, c2_w, 76, "generate-explorer.js", ["Zero-CDN self-contained", "interactive HTML bundles"], "teal", tag="SCRIPTS")}

{artifact_card(c3_x, 92,  c3_w, 44, "theme-metadata.json", "console · maker · mode · slug · year", "gold")}
{artifact_card(c3_x, 144, c3_w, 44, "package.json", "contributes.themes (60 entries)", "sapphire")}
{artifact_card(c3_x, 196, c3_w, 44, "themes/*.json", "60 full VS Code + Positron themes", "sapphire")}
{artifact_card(c3_x, 272, c3_w, 44, "site/index.html", "GitHub Pages Explorer", "teal")}
{artifact_card(c3_x, 326, c3_w, 44, "assets/explorer/explorer.html", "VS Code Webview Explorer", "teal")}

{box_card(c4_x, 92, c4_w, 72, "extension.js", ["QuickPick · Webview Explorer", "smart toggle · status bar"], "gold", tag="RUNTIME", dashed=True)}
{val_card}
{ok_card}

  <line x1="24" y1="430" x2="936" y2="430" stroke="{t["border_soft"]}" stroke-width="1"/>
  <line x1="28" y1="448" x2="54" y2="448" stroke="{blue_c}" stroke-width="1.8"/>
  <text x="61" y="451.5" font-family="{FONT_SANS}" font-size="10" fill="{t["text_muted"]}">Build / generation flow</text>

  <line x1="200" y1="448" x2="226" y2="448" stroke="{purple_c}" stroke-width="2.0"/>
  <text x="233" y="451.5" font-family="{FONT_SANS}" font-size="10" fill="{t["text_muted"]}">Shared colorimetry engine</text>

  <line x1="396" y1="448" x2="422" y2="448" stroke="{gold_c}" stroke-width="1.8" stroke-dasharray="5,4"/>
  <text x="429" y="451.5" font-family="{FONT_SANS}" font-size="10" fill="{t["text_muted"]}">Runtime read (zero npm deps)</text>

  <text x="936" y="451.5" text-anchor="end" font-family="{FONT_MONO}" font-size="9.5" fill="{t["text_muted"]}">python3 scripts/generate-diagrams.py</text>
</svg>
'''


def render_png(svg_text: str, out_path: str, width: int, height: int):
    with tempfile.TemporaryDirectory() as tmpdir:
        svg_path = os.path.join(tmpdir, "diagram.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_text)
        subprocess.run(
            ["rsvg-convert", "-w", str(width), "-h", str(height), svg_path, "-o", out_path],
            check=True,
        )
    size_kb = os.path.getsize(out_path) / 1024.0
    print(f"Generated {os.path.relpath(out_path, ROOT)} ({size_kb:.1f} KB, {width}x{height})")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    swatches = load_palette_swatches()
    assert len(swatches) == 30, f"Expected 30 consoles from palettes/*.js, found {len(swatches)}"
    for era in ERAS:
        for full_c, _, _, _ in era["consoles"]:
            assert full_c in swatches and "light" in swatches[full_c] and "dark" in swatches[full_c], (
                f"Missing light/dark palette swatches for {full_c!r}"
            )

    for mode in ("dark", "light"):
        render_png(
            build_release_timeline_svg(mode, swatches),
            os.path.join(OUT_DIR, f"release-timeline-{mode}.png"),
            1920,
            1140,
        )
        render_png(
            build_pipeline_svg(mode),
            os.path.join(OUT_DIR, f"build-pipeline-{mode}.png"),
            1920,
            936,
        )


if __name__ == "__main__":
    main()
