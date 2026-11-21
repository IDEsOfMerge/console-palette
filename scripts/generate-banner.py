#!/usr/bin/env python3
"""
Programmatically renders the Console Palette README Retro ASCII banners
(`assets/banner/banner-dark.png` and `assets/banner/banner-light.png`,
1920x616 @ 2x Retina) from pure geometric SVG vectors:
  - Double-line Unicode box-drawing terminal frame
  - Upper dithered Light-shell D-pad cross / Lower 4-button jewel diamond
  - 5x5 pixel-block ANSI-Shadow lettering for CONSOLE / PALETTE
  - 49 Years of Console Hardware (1977-2026) & OKLCH colorimetry footer

Run with: python3 scripts/generate-banner.py
"""

import os
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "banner")

BLOCK_FONT = {
    "C": ["01111", "10000", "10000", "10000", "01111"],
    "O": ["01110", "10001", "10001", "10001", "01110"],
    "N": ["10001", "11001", "10101", "10011", "10001"],
    "S": ["01111", "10000", "01110", "00001", "11110"],
    "L": ["10000", "10000", "10000", "10000", "11111"],
    "E": ["11111", "10000", "11110", "10000", "11111"],
    "P": ["11110", "10001", "11110", "10000", "10000"],
    "A": ["01110", "10001", "11111", "10001", "10001"],
    "T": ["11111", "00100", "00100", "00100", "00100"],
}


def render_ansi_word(word, x_center, y_top, cell_w, cell_h, fill, shadow_stroke):
    """Render ANSI-Shadow pixel-block letters with geometric right/bottom shadow edges."""
    gap = 1.5
    widths = [len(BLOCK_FONT[ch][0]) for ch in word]
    total_units = sum(widths) + gap * (len(word) - 1)
    start_x = x_center - (total_units * cell_w) / 2.0

    rects = []
    shadows = []
    cursor_u = 0.0
    for ch in word:
        grid = BLOCK_FONT[ch]
        rows, cols = len(grid), len(grid[0])
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == "1":
                    rx = start_x + (cursor_u + c) * cell_w
                    ry = y_top + r * cell_h
                    rects.append(
                        f'    <rect x="{rx:.1f}" y="{ry:.1f}" '
                        f'width="{cell_w + 0.45:.2f}" height="{cell_h + 0.45:.2f}" fill="{fill}"/>'
                    )
                    right_empty = (c + 1 == cols) or (grid[r][c + 1] == "0")
                    bot_empty = (r + 1 == rows) or (grid[r + 1][c] == "0")
                    if right_empty:
                        shadows.append(
                            f'    <line x1="{rx + cell_w + 2.5:.1f}" y1="{ry + 1.5:.1f}" '
                            f'x2="{rx + cell_w + 2.5:.1f}" y2="{ry + cell_h + 2.5:.1f}" '
                            f'stroke="{shadow_stroke}" stroke-width="1.6"/>'
                        )
                    if bot_empty:
                        shadows.append(
                            f'    <line x1="{rx + 1.5:.1f}" y1="{ry + cell_h + 2.5:.1f}" '
                            f'x2="{rx + cell_w + 2.5:.1f}" y2="{ry + cell_h + 2.5:.1f}" '
                            f'stroke="{shadow_stroke}" stroke-width="1.6"/>'
                        )
        cursor_u += cols + gap
    return "\n".join(shadows + rects)


def build_retro_banner_svg(mode: str) -> str:
    is_dark = mode == "dark"
    bg        = "#0D1117" if is_dark else "#F6F8FA"
    frame_c   = "#5A6780" if is_dark else "#6E7781"
    inner_c   = "#3B4559" if is_dark else "#959DA8"

    top_accent = "#4DA8FF" if is_dark else "#0969DA"
    bot_accent = "#B495F8" if is_dark else "#6639BA"
    dpad_fg    = "#DCE6F4" if is_dark else "#2B3442"
    dpad_sh    = "#7088B0" if is_dark else "#6B788E"

    btn_em  = "#34E08C" if is_dark else "#137D47"
    btn_red = "#FF4D5E" if is_dark else "#CC2232"
    btn_blu = "#42A2FF" if is_dark else "#1462CC"
    btn_gld = "#F5C428" if is_dark else "#B87E06"

    word_top  = "#EAF1FA" if is_dark else "#1F2328"
    word_sh1  = "#3B8CE8" if is_dark else "#1E66CC"
    word_bot  = "#DDD3F6" if is_dark else "#2B2244"
    word_sh2  = "#8D6BE8" if is_dark else "#704FC2"
    text_c    = "#C9D1D9" if is_dark else "#24292F"
    muted_c   = "#8B949E" if is_dark else "#57606A"

    L, T, R, B = 16, 14, 944, 294
    DIV_X = 216
    MID_Y = 132
    BOT_Y = 242
    D = 4
    cx = (L + DIV_X) / 2.0  # 116.0

    # Upper icon: Dithered Classic D-Pad Cross centered at (cx, 84)
    dcy = 84.0
    arm = 36.0
    half = 12.0
    cross_pts = (
        f"{cx - half:.1f},{dcy - arm:.1f} {cx + half:.1f},{dcy - arm:.1f} "
        f"{cx + half:.1f},{dcy - half:.1f} {cx + arm:.1f},{dcy - half:.1f} "
        f"{cx + arm:.1f},{dcy + half:.1f} {cx + half:.1f},{dcy + half:.1f} "
        f"{cx + half:.1f},{dcy + arm:.1f} {cx - half:.1f},{dcy + arm:.1f} "
        f"{cx - half:.1f},{dcy + half:.1f} {cx - arm:.1f},{dcy + half:.1f} "
        f"{cx - arm:.1f},{dcy - half:.1f} {cx - half:.1f},{dcy - half:.1f}"
    )
    dpad_svg = f'''    <polygon points="{cross_pts}" fill="{dpad_fg}"/>
    <rect x="{cx:.1f}" y="{dcy - half:.1f}" width="{arm:.1f}" height="{half * 2:.1f}" fill="url(#dith-dpad-{mode})"/>
    <rect x="{cx - half:.1f}" y="{dcy:.1f}" width="{half * 2:.1f}" height="{arm:.1f}" fill="url(#dith-dpad-{mode})"/>
    <circle cx="{cx:.1f}" cy="{dcy:.1f}" r="7.5" fill="{bg}" stroke="{top_accent}" stroke-width="1.5"/>
    <polygon points="{cross_pts}" fill="none" stroke="{top_accent}" stroke-width="1.5" stroke-linejoin="round"/>'''

    # Lower icon: 4-Button Console Chromatic Diamond centered at (cx, 180)
    bcy = 180.0
    boff = 24.0
    br = 12.5
    btn_svg = f'''    <line x1="{cx:.1f}" y1="{bcy - boff:.1f}" x2="{cx + boff:.1f}" y2="{bcy:.1f}" stroke="{inner_c}" stroke-width="1.4"/>
    <line x1="{cx + boff:.1f}" y1="{bcy:.1f}" x2="{cx:.1f}" y2="{bcy + boff:.1f}" stroke="{inner_c}" stroke-width="1.4"/>
    <line x1="{cx:.1f}" y1="{bcy + boff:.1f}" x2="{cx - boff:.1f}" y2="{bcy:.1f}" stroke="{inner_c}" stroke-width="1.4"/>
    <line x1="{cx - boff:.1f}" y1="{bcy:.1f}" x2="{cx:.1f}" y2="{bcy - boff:.1f}" stroke="{inner_c}" stroke-width="1.4"/>
    <circle cx="{cx:.1f}" cy="{bcy - boff:.1f}" r="{br}" fill="{btn_em}" stroke="{bg}" stroke-width="2"/>
    <circle cx="{cx + boff:.1f}" cy="{bcy:.1f}" r="{br}" fill="{btn_red}" stroke="{bg}" stroke-width="2"/>
    <circle cx="{cx:.1f}" cy="{bcy + boff:.1f}" r="{br}" fill="{btn_blu}" stroke="{bg}" stroke-width="2"/>
    <circle cx="{cx - boff:.1f}" cy="{bcy:.1f}" r="{br}" fill="{btn_gld}" stroke="{bg}" stroke-width="2"/>'''

    right_cx = (DIV_X + R) / 2.0
    word_console = render_ansi_word("CONSOLE", right_cx, 54, 14.0, 11.5, word_top, word_sh1)
    word_palette = render_ansi_word("PALETTE", right_cx, 154, 14.0, 11.5, word_bot, word_sh2)

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 308" width="960" height="308">
  <defs>
    <pattern id="dith-dpad-{mode}" width="6" height="6" patternUnits="userSpaceOnUse">
      <rect x="0" y="0" width="3" height="3" fill="{dpad_sh}"/>
      <rect x="3" y="3" width="3" height="3" fill="{dpad_sh}"/>
    </pattern>
  </defs>

  <rect width="960" height="308" rx="10" fill="{bg}"/>

  <g fill="none">
    <rect x="{L}" y="{T}" width="{R - L}" height="{B - T}" stroke="{frame_c}" stroke-width="1.6"/>
    <rect x="{L + D}" y="{T + D}" width="{R - L - 2*D}" height="{B - T - 2*D}" stroke="{frame_c}" stroke-width="1.6"/>
    <line x1="{DIV_X}" y1="{T + D}" x2="{DIV_X}" y2="{BOT_Y}" stroke="{inner_c}" stroke-width="1.5"/>
    <line x1="{L + D}" y1="{MID_Y}" x2="{R - D}" y2="{MID_Y}" stroke="{inner_c}" stroke-width="1.5"/>
    <line x1="{L + D}" y1="{BOT_Y}" x2="{R - D}" y2="{BOT_Y}" stroke="{frame_c}" stroke-width="1.6"/>
    <line x1="{L + D}" y1="{BOT_Y + D}" x2="{R - D}" y2="{BOT_Y + D}" stroke="{frame_c}" stroke-width="1.6"/>
  </g>

  <text x="{cx}" y="36" text-anchor="middle" font-family="'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="700" letter-spacing="1.6" fill="{top_accent}">── SHELL ──</text>
  <g>
{dpad_svg}
  </g>
  <g>
{btn_svg}
  </g>
  <text x="{cx}" y="234" text-anchor="middle" font-family="'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="700" letter-spacing="1.6" fill="{bot_accent}">── BIOS ──</text>

  <text x="{right_cx}" y="36" text-anchor="middle" font-family="'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12.5" font-weight="700" letter-spacing="1.8" fill="{top_accent}">──── 49 YEARS OF HARDWARE · 1977–2026 ────</text>
  <g>
{word_console}
  </g>
  <g>
{word_palette}
  </g>

  <text x="480" y="264" text-anchor="middle" font-family="'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12.5" font-weight="600" letter-spacing="1.2" fill="{text_c}">39 ICONIC GAMING CONSOLES  ·  78 LIGHT &amp; DARK THEMES  ·  VS CODE / POSITRON</text>
  <text x="480" y="282" text-anchor="middle" font-family="'DejaVu Sans Mono', ui-monospace, SFMono-Regular, Menlo, monospace" font-size="12" font-weight="500" letter-spacing="1.2" fill="{muted_c}">OKLCH COLORIMETRY  ·  100% WCAG AA  ·  APCA-W3  ·  CIEDE2000  ·  CVD SAFE</text>
</svg>
'''


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmpdir:
        for mode in ("dark", "light"):
            svg_path = os.path.join(tmpdir, f"banner-{mode}.svg")
            png_path = os.path.join(OUT_DIR, f"banner-{mode}.png")
            with open(svg_path, "w", encoding="utf-8") as f:
                f.write(build_retro_banner_svg(mode))
            subprocess.run(
                ["rsvg-convert", "-w", "1920", "-h", "616", svg_path, "-o", png_path],
                check=True,
            )
            size_kb = os.path.getsize(png_path) / 1024.0
            print(f"Generated {os.path.relpath(png_path, ROOT)} ({size_kb:.1f} KB, 1920x616)")


if __name__ == "__main__":
    main()
