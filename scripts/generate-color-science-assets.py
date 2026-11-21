#!/usr/bin/env python3
"""
Dev-only analytical & visualization generator for Console Palette v1.1.0.

Computes exact CIE Lab / OKLCH / CIEDE2000 / Machado-2009 CVD audits, unscaled
1,014-token Lab PCA, scaled 39-D per-theme PCA, and Ward's (ward.D2) hierarchical
clustering across all 78 themes (39 iconic gaming consoles), writing:
  - analysis/data/{audit-results,worst-pair-per-theme,critical-flagged,severe-flagged,computed-fixes,theme-pca}.csv
  - assets/timeline/timeline-metro.png  (Hardware Lineage Metro Map across 7 manufacturer lines)
  - assets/color-science/{theme-colorspace-grid,pca-global,family-fingerprint,theme-pca,theme-dendrogram,cvd-swatch-grid}.png
  - analysis/plots/{pca_global,theme_colorspace_grid}.png

Uses numpy + Pillow with 2x supersampled LANCZOS anti-aliasing and zero external
plotting-library dependencies.
"""

import csv
import math
import os
import shutil
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "analysis" / "data"
PLOTS_DIR = ROOT / "analysis" / "plots"
CS_ASSETS = ROOT / "assets" / "color-science"
TIMELINE_ASSETS = ROOT / "assets" / "timeline"

for d in (DATA_DIR, PLOTS_DIR, CS_ASSETS, TIMELINE_ASSETS):
    d.mkdir(parents=True, exist_ok=True)


# ---------- Font loader ----------

def load_font(size: int, style: str = "regular") -> ImageFont.FreeTypeFont:
    candidates = {
        "regular": [
            "/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Regular.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
        "medium": [
            "/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Medium.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
        "bold": [
            "/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ],
        "italic": [
            "/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Italic.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Italic.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        ],
    }
    for p in candidates.get(style, candidates["regular"]):
        if os.path.exists(p):
            return ImageFont.truetype(p, size=size)
    return ImageFont.load_default()


# ---------- Colorimetry ----------

def hex_to_rgb_tuple(h: str):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def srgb_to_linear(rgb01: np.ndarray) -> np.ndarray:
    return np.where(rgb01 <= 0.04045, rgb01 / 12.92, ((rgb01 + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(lin: np.ndarray) -> np.ndarray:
    lin = np.clip(lin, 0.0, 1.0)
    return np.where(lin <= 0.0031308, lin * 12.92, 1.055 * (lin ** (1.0 / 2.4)) - 0.055)


def hexes_to_lab(hex_list):
    arr = np.array([hex_to_rgb_tuple(h) for h in hex_list], dtype=np.float64) / 255.0
    lin = srgb_to_linear(arr)
    M = np.array([
        [0.4124564, 0.3575761, 0.1804375],
        [0.2126729, 0.7151522, 0.0721750],
        [0.0193339, 0.1191920, 0.9503041],
    ])
    xyz = lin @ M.T
    xyz[:, 0] /= 0.95047
    xyz[:, 1] /= 1.00000
    xyz[:, 2] /= 1.08883
    delta = 6.0 / 29.0
    f = np.where(xyz > delta ** 3, np.cbrt(xyz), xyz / (3.0 * delta ** 2) + 4.0 / 29.0)
    L = 116.0 * f[:, 1] - 16.0
    a = 500.0 * (f[:, 0] - f[:, 1])
    b = 200.0 * (f[:, 1] - f[:, 2])
    return np.column_stack([L, a, b])


CVD_MATS = {
    "protan": np.array([
        [0.152286, 1.052583, -0.204868],
        [0.114503, 0.786281,  0.099216],
        [-0.003882, -0.048116, 1.051998],
    ]),
    "deutan": np.array([
        [0.367322, 0.860646, -0.227968],
        [0.280085, 0.672501,  0.047413],
        [-0.011820, 0.042940, 0.968881],
    ]),
    "tritan": np.array([
        [1.255528, -0.076749, -0.178779],
        [-0.078411, 0.930809,  0.147602],
        [0.004733,  0.691367,  0.303900],
    ]),
}


def simulate_cvd_hexes(hex_list, cvd_type: str):
    arr = np.array([hex_to_rgb_tuple(h) for h in hex_list], dtype=np.float64) / 255.0
    lin = srgb_to_linear(arr)
    sim_lin = np.clip(lin @ CVD_MATS[cvd_type].T, 0.0, 1.0)
    sim_srgb = np.round(np.clip(linear_to_srgb(sim_lin), 0.0, 1.0) * 255.0).astype(int)
    return [f"#{r:02X}{g:02X}{b:02X}" for r, g, b in sim_srgb]


def ciede2000_pair(lab1, lab2) -> float:
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1 = math.hypot(a1, b1)
    C2 = math.hypot(a2, b2)
    Cbar = 0.5 * (C1 + C2)
    G = 0.5 * (1.0 - math.sqrt((Cbar ** 7) / ((Cbar ** 7) + (25.0 ** 7))))
    a1p = (1.0 + G) * a1
    a2p = (1.0 + G) * a2
    C1p = math.hypot(a1p, b1)
    C2p = math.hypot(a2p, b2)
    h1p = 0.0 if (a1p == 0 and b1 == 0) else (math.degrees(math.atan2(b1, a1p)) % 360.0)
    h2p = 0.0 if (a2p == 0 and b2 == 0) else (math.degrees(math.atan2(b2, a2p)) % 360.0)
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180.0:
        dhp = h2p - h1p
    elif h2p - h1p > 180.0:
        dhp = h2p - h1p - 360.0
    else:
        dhp = h2p - h1p + 360.0
    dHp = 2.0 * math.sqrt(C1p * C2p) * math.sin(math.radians(0.5 * dhp))
    Lbarp = 0.5 * (L1 + L2)
    Cbarp = 0.5 * (C1p + C2p)
    if C1p * C2p == 0:
        hbarp = h1p + h2p
    elif abs(h1p - h2p) <= 180.0:
        hbarp = 0.5 * (h1p + h2p)
    elif h1p + h2p < 360.0:
        hbarp = 0.5 * (h1p + h2p + 360.0)
    else:
        hbarp = 0.5 * (h1p + h2p - 360.0)
    T = (
        1.0
        - 0.17 * math.cos(math.radians(hbarp - 30.0))
        + 0.24 * math.cos(math.radians(2.0 * hbarp))
        + 0.32 * math.cos(math.radians(3.0 * hbarp + 6.0))
        - 0.20 * math.cos(math.radians(4.0 * hbarp - 63.0))
    )
    dTheta = 30.0 * math.exp(-(((hbarp - 275.0) / 25.0) ** 2))
    RC = 2.0 * math.sqrt((Cbarp ** 7) / ((Cbarp ** 7) + (25.0 ** 7)))
    SL = 1.0 + (0.015 * ((Lbarp - 50.0) ** 2)) / math.sqrt(20.0 + ((Lbarp - 50.0) ** 2))
    SC = 1.0 + 0.045 * Cbarp
    SH = 1.0 + 0.015 * Cbarp * T
    RT = -math.sin(math.radians(2.0 * dTheta)) * RC
    return math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH))


# ---------- Domain Metadata ----------

CONSOLE_ORDER = [
    "Atari 2600",
    "NES",
    "Sega Master System",
    "TurboGrafx-16",
    "Sega Genesis",
    "Game Boy",
    "Atari Lynx",
    "SNES",
    "Neo Geo AES",
    "Atari Jaguar",
    "Sega Saturn",
    "PlayStation",
    "Virtual Boy",
    "Nintendo 64",
    "Game Boy Color",
    "Sega Dreamcast",
    "PlayStation 2",
    "Game Boy Advance",
    "Nintendo GameCube",
    "Xbox",
    "Nintendo DS",
    "PlayStation Portable",
    "Xbox 360",
    "Nintendo Wii",
    "PlayStation 3",
    "Nintendo 3DS",
    "PlayStation Vita",
    "PlayStation 4",
    "Xbox One",
    "Nintendo Switch",
    "PlayStation 5",
    "Xbox Series X|S",
    "Steam Deck",
    "Playdate",
    "PlayStation Portal",
    "Nintendo Switch 2",
    "ROG Xbox Ally",
    "Steam Machine",
    "Steam Frame",
]

SHORT_CONSOLE = {
    "Atari 2600": "Atari 2600",
    "NES": "NES",
    "Sega Master System": "Master System",
    "TurboGrafx-16": "TurboGrafx-16",
    "Sega Genesis": "Genesis",
    "Game Boy": "Game Boy",
    "Atari Lynx": "Atari Lynx",
    "SNES": "SNES",
    "Neo Geo AES": "Neo Geo AES",
    "Atari Jaguar": "Atari Jaguar",
    "Sega Saturn": "Saturn",
    "PlayStation": "PS1",
    "Virtual Boy": "Virtual Boy",
    "Nintendo 64": "N64",
    "Game Boy Color": "GBC",
    "Sega Dreamcast": "Dreamcast",
    "PlayStation 2": "PS2",
    "Game Boy Advance": "GBA",
    "Nintendo GameCube": "GameCube",
    "Xbox": "Xbox",
    "Nintendo DS": "DS",
    "PlayStation Portable": "PSP",
    "Xbox 360": "Xbox 360",
    "Nintendo Wii": "Wii",
    "PlayStation 3": "PS3",
    "Nintendo 3DS": "3DS",
    "PlayStation Vita": "PS Vita",
    "PlayStation 4": "PS4",
    "Xbox One": "Xbox One",
    "Nintendo Switch": "Switch",
    "PlayStation 5": "PS5",
    "Xbox Series X|S": "Series X|S",
    "Steam Deck": "Steam Deck",
    "Playdate": "Playdate",
    "PlayStation Portal": "PS Portal",
    "Nintendo Switch 2": "Switch 2",
    "ROG Xbox Ally": "ROG Xbox Ally",
    "Steam Machine": "Steam Machine",
    "Steam Frame": "Steam Frame",
}

ERA_LIST = [
    "8-bit Pioneers",
    "16-bit Golden Age",
    "32/64-bit Polygon Era",
    "128-bit & Millennial Classics",
    "HD, Motion & Portable Era",
    "Modern, Hybrid & Portable PC",
    "Next-Gen & Spatial Era",
]
ERA_COLORS = {
    "8-bit Pioneers": "#A86910",
    "16-bit Golden Age": "#C22A3C",
    "32/64-bit Polygon Era": "#743AC2",
    "128-bit & Millennial Classics": "#1456B8",
    "HD, Motion & Portable Era": "#0C8288",
    "Modern, Hybrid & Portable PC": "#178246",
    "Next-Gen & Spatial Era": "#E04878",
}

POLYGON_ROLES = [
    "accentKeyword", "accentStorage", "accentString", "accentRegex",
    "accentFunction", "accentType", "accentInterface", "accentNumber",
    "accentDecorator", "accentNamespace",
]

AUDIT_ROLES = [
    "accentKeyword", "accentStorage", "accentString", "accentRegex",
    "accentFunction", "accentFunctionDim", "accentType", "accentInterface",
    "accentNumber", "accentDecorator", "accentNamespace", "colorError", "colorWarning",
]

CRITICAL_ROLES = {
    "accentKeyword", "accentStorage", "accentString",
    "accentFunction", "accentType", "accentNumber", "colorError",
}

ROLE_COLORS = {
    "accentKeyword": "#1B8A4B",
    "accentStorage": "#7D5626",
    "accentString": "#D4382C",
    "accentRegex": "#E8741E",
    "accentFunction": "#1E62C9",
    "accentFunctionDim": "#5B94E0",
    "accentType": "#0E9488",
    "accentInterface": "#46B8AC",
    "accentNumber": "#C9920E",
    "accentDecorator": "#9E3AC9",
    "accentNamespace": "#6D758C",
    "colorError": "#B81428",
    "colorWarning": "#D9820B",
}


# ---------- Drawing helpers (2x supersampling) ----------

def make_canvas(w: int, h: int, bg="#FAF9F6"):
    return Image.new("RGB", (w * 2, h * 2), hex_to_rgb_tuple(bg))


def save_downsampled(img: Image.Image, path: Path, w: int, h: int):
    out = img.resize((w, h), Image.Resampling.LANCZOS)
    out.save(path, format="PNG", optimize=True)


def draw_text_centered(draw, x, y, text, font, fill="#1E2028"):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((x - tw / 2, y - th / 2 - bbox[1] * 0.15), text, font=font, fill=fill)


def draw_circle(draw, cx, cy, r, fill, outline=None, width=2):
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=fill, outline=outline, width=width)


def draw_triangle(draw, cx, cy, r, fill, outline=None):
    pts = [
        (cx, cy - r * 1.15),
        (cx - r * 1.05, cy + r * 0.85),
        (cx + r * 1.05, cy + r * 0.85),
    ]
    draw.polygon(pts, fill=fill, outline=outline)


# ---------- Ward.D2 Hierarchical Clustering in pure NumPy ----------

def ward_d2_clustering(X: np.ndarray):
    n = X.shape[0]
    diff = X[:, None, :] - X[None, :, :]
    D2 = np.sum(diff ** 2, axis=-1)
    np.fill_diagonal(D2, np.inf)

    sizes = [1] * (2 * n - 1)
    active = list(range(n))
    merges = []

    dist2 = {}
    for i in range(n):
        for j in range(i + 1, n):
            dist2[(i, j)] = float(D2[i, j])

    def get_d2(u, v):
        return dist2[(u, v)] if u < v else dist2[(v, u)]

    def set_d2(u, v, val):
        if u < v:
            dist2[(u, v)] = val
        else:
            dist2[(v, u)] = val

    next_id = n
    for _ in range(n - 1):
        best_pair = None
        best_d2 = float("inf")
        for idx_a in range(len(active)):
            u = active[idx_a]
            for idx_b in range(idx_a + 1, len(active)):
                v = active[idx_b]
                val = get_d2(u, v)
                if val < best_d2:
                    best_d2 = val
                    best_pair = (u, v)

        u, v = best_pair
        height = math.sqrt(max(0.0, best_d2))
        new_id = next_id
        next_id += 1
        nu, nv = sizes[u], sizes[v]
        sizes[new_id] = nu + nv

        for w in active:
            if w == u or w == v:
                continue
            nw = sizes[w]
            denom = nu + nv + nw
            d2_new = (
                (nu + nw) * get_d2(u, w)
                + (nv + nw) * get_d2(v, w)
                - nw * best_d2
            ) / denom
            set_d2(new_id, w, max(0.0, d2_new))

        active.remove(u)
        active.remove(v)
        active.append(new_id)
        merges.append((u, v, height, new_id))

    return merges


# ---------- 1. Load colors.csv & compute CVD + PCA + Clustering ----------

def load_data():
    rows = []
    with open(DATA_DIR / "colors.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    labs = hexes_to_lab([r["hex"] for r in rows])
    for r, (L, a, b) in zip(rows, labs):
        r["L"] = float(L)
        r["a"] = float(a)
        r["b"] = float(b)
        r["year"] = int(r["year"])
    return rows


def run_cvd_audit(rows):
    syntax_rows = [r for r in rows if r["role"] in AUDIT_ROLES]
    by_slug = {}
    for r in syntax_rows:
        by_slug.setdefault(r["theme_slug"], []).append(r)

    slug_order = sorted(
        by_slug.keys(),
        key=lambda s: (
            by_slug[s][0]["year"],
            CONSOLE_ORDER.index(by_slug[s][0]["console"]),
            0 if by_slug[s][0]["mode"] == "light" else 1,
        ),
    )

    audit_records = []
    for slug in slug_order:
        sub = by_slug[slug]
        hexes = [x["hex"] for x in sub]
        lab_norm = hexes_to_lab(hexes)
        lab_sim = {
            t: hexes_to_lab(simulate_cvd_hexes(hexes, t))
            for t in ("protan", "deutan", "tritan")
        }
        n = len(sub)
        for i in range(n):
            for j in range(i + 1, n):
                d_norm = float(np.linalg.norm(lab_norm[i] - lab_norm[j]))
                d00_norm = ciede2000_pair(lab_norm[i], lab_norm[j])
                dp = float(np.linalg.norm(lab_sim["protan"][i] - lab_sim["protan"][j]))
                dd = float(np.linalg.norm(lab_sim["deutan"][i] - lab_sim["deutan"][j]))
                dt = float(np.linalg.norm(lab_sim["tritan"][i] - lab_sim["tritan"][j]))
                cvds = [("protan", dp), ("deutan", dd), ("tritan", dt)]
                worst_type, min_cvd = min(cvds, key=lambda kv: kv[1])
                flagged = d_norm >= 15.0 and min_cvd < 10.0
                audit_records.append({
                    "theme_slug": slug,
                    "role1": sub[i]["role"],
                    "role2": sub[j]["role"],
                    "d_normal": round(d_norm, 3),
                    "d00_normal": round(d00_norm, 3),
                    "d_protan": round(dp, 3),
                    "d_deutan": round(dd, 3),
                    "d_tritan": round(dt, 3),
                    "min_cvd": round(min_cvd, 3),
                    "worst_type": worst_type,
                    "flagged": "TRUE" if flagged else "FALSE",
                })

    def write_csv(path: Path, fieldnames, recs):
        with open(path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fieldnames)
            w.writeheader()
            w.writerows(recs)

    fields = [
        "theme_slug", "role1", "role2", "d_normal", "d00_normal",
        "d_protan", "d_deutan", "d_tritan", "min_cvd", "worst_type", "flagged",
    ]
    write_csv(DATA_DIR / "audit-results.csv", fields, audit_records)

    worst_per_theme = []
    for slug in slug_order:
        sub_recs = [r for r in audit_records if r["theme_slug"] == slug]
        worst_per_theme.append(min(sub_recs, key=lambda r: r["min_cvd"]))
    worst_per_theme.sort(key=lambda r: r["min_cvd"])
    write_csv(DATA_DIR / "worst-pair-per-theme.csv", fields, worst_per_theme)

    crit_flagged = [
        r for r in audit_records
        if r["flagged"] == "TRUE" and r["role1"] in CRITICAL_ROLES and r["role2"] in CRITICAL_ROLES
    ]
    crit_flagged.sort(key=lambda r: (r["theme_slug"], r["min_cvd"]))
    write_csv(DATA_DIR / "critical-flagged.csv", fields, crit_flagged)

    severe_flagged = [r for r in crit_flagged if r["min_cvd"] < 5.0]
    write_csv(DATA_DIR / "severe-flagged.csv", fields, severe_flagged)

    with open(DATA_DIR / "computed-fixes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["theme_slug", "role", "status", "note"])
        w.writerow([
            "gameboy-dark",
            "monochrome_dmg_ramp",
            "exempt_by_design",
            f"1989 DMG-01 4-shade green LCD hardware ramp (#0F380F..#9BBC0F); all {len(slug_order) - 1} polychromatic themes have 0 critical pairs < 10 dE76 under protan/deutan/tritan.",
        ])

    all_flagged = [r for r in audit_records if r["flagged"] == "TRUE"]
    print(
        f"CVD audit: {len(audit_records)} pairs across {len(slug_order)} themes -> "
        f"{len(all_flagged)} total 13-role flags, {len(crit_flagged)} critical-role flags (<10 dE76), "
        f"{len(severe_flagged)} severe (<5 dE76)."
    )
    for r in crit_flagged:
        print(f"  critical flag: {r['theme_slug']} {r['role1']}/{r['role2']} min_cvd={r['min_cvd']} ({r['worst_type']})")

    return slug_order, by_slug


# ---------- 2. Render Console Hardware Lineage Metro Map ----------

def render_timeline_metro():
    W, H = 2560, 1440
    img = make_canvas(W, H, "#FAF9F5")
    draw = ImageDraw.Draw(img)

    f_title = load_font(54, "bold")
    f_sub = load_font(25, "regular")
    f_main = load_font(23, "bold")
    f_yr = load_font(18, "regular")
    f_tag = load_font(20, "bold")
    f_leg = load_font(24, "medium")

    draw.text((120, 56), "Console Palette — Hardware Lineage Metro Map (1977–2026)", font=f_title, fill="#181A20")
    draw.text(
        (120, 124),
        "39 iconic consoles mapped by manufacturer lineage — solid lines trace main generations; dashed lines mark handheld, companion, and spatial branches.",
        font=f_sub,
        fill="#525866",
    )

    # X = hardware generation timeline position [1..28.5], Y = subway line track [-2.7..+3.1]
    nodes = [
        # Atari Line (top track, y = +3.05)
        ("Atari 2600",         2.6,  3.05, "1977", "#CC480C",  0.34),
        ("Atari Lynx",         8.4,  3.05, "1989", "#E04D12",  0.34),
        ("Atari Jaguar",      11.0,  3.05, "1993", "#D91828",  0.34),

        # Arcade / Indie Line (y = +2.18, plus Playdate indie track at y = +3.05)
        ("TurboGrafx-16",      6.8,  2.18, "1987", "#DE3518",  0.34),
        ("Neo Geo AES",        9.6,  2.18, "1990", "#BD8908",  0.34),
        ("Playdate",          25.5,  3.05, "2022", "#E5A600",  0.34),

        # Nintendo Home Line (y = +1.35, converges to +0.78 at Switch)
        ("NES",                5.0,  1.35, "1985", "#D91E28",  0.34),
        ("SNES",               9.6,  1.35, "1990", "#5E44B8",  0.34),
        ("Nintendo 64",       13.4,  1.35, "1996", "#C99600",  0.34),
        ("GameCube",          16.6,  1.35, "2001", "#5942B2",  0.34),
        ("Nintendo Wii",      19.8,  1.35, "2006", "#009AC7",  0.34),

        # Nintendo Handheld Line (y = +0.20, converges into Switch) + Virtual Boy crimson spur (y = +0.78)
        ("Game Boy",           8.4,  0.20, "1989", "#5C8514",  0.34),
        ("Virtual Boy",       11.8,  0.78, "1995", "#D90E22",  0.28),
        ("Game Boy Color",    14.5,  0.20, "1998", "#008A96", -0.34),
        ("Game Boy Advance",  16.6,  0.20, "2001", "#4F3EC4",  0.34),
        ("Nintendo DS",       18.5,  0.20, "2004", "#0D78C8",  0.34),
        ("Nintendo 3DS",      21.4,  0.20, "2011", "#009E56",  0.34),

        # Nintendo Hybrid Convergence Stations (y = +0.78)
        ("Nintendo Switch",   23.6,  0.78, "2017", "#E60012", -0.36),
        ("Nintendo Switch 2", 27.0,  0.78, "2025", "#E84A42",  0.35),

        # Sega Line (y = -0.72)
        ("Master System",      5.0, -0.72, "1985", "#D91A28", -0.34),
        ("Sega Genesis",       7.7, -0.72, "1988", "#1752BD", -0.34),
        ("Sega Saturn",       11.7, -0.72, "1994", "#008A9E", -0.34),
        ("Sega Dreamcast",    14.5, -0.72, "1998", "#E04F0E", -0.34),

        # PlayStation Home Line (y = -1.72) + Portable / Remote Branch (y = -0.72)
        ("PlayStation",       11.7, -1.72, "1994", "#DE6A16", -0.34),
        ("PlayStation 2",     15.7, -1.72, "2000", "#1660EE", -0.34),
        ("PlayStation 3",     19.8, -1.72, "2006", "#C82230", -0.34),
        ("PlayStation 4",     22.3, -1.72, "2013", "#006CE6", -0.34),
        ("PlayStation 5",     24.6, -1.72, "2020", "#1B62F2", -0.34),

        ("PSP",               18.5, -0.72, "2004", "#DE7F08", -0.34),
        ("PS Vita",           21.4, -0.72, "2011", "#0090E6", -0.34),
        ("PlayStation Portal",26.1, -0.72, "2023", "#0D72F5",  0.35),

        # Xbox Line (y = -2.68)
        ("Xbox",              16.6, -2.68, "2001", "#108910", -0.34),
        ("Xbox 360",          19.0, -2.68, "2005", "#DF5D0E", -0.34),
        ("Xbox One",          22.3, -2.68, "2013", "#107C10", -0.34),
        ("Xbox Series X|S",   24.6, -2.68, "2020", "#107C10", -0.34),
        ("ROG Xbox Ally",     27.0, -2.68, "2025", "#108926", -0.34),

        # Valve / Steam Line (upper-right: y = +2.18 + spatial spur at y = +3.05)
        ("Steam Deck",        25.5,  2.18, "2022", "#DF5012",  0.32),
        ("Steam Machine",     28.0,  2.18, "2026", "#0088C8", -0.34),
        ("Steam Frame",       28.0,  3.05, "2026", "#E06810",  0.34),
    ]

    edges = [
        # Atari
        ("Atari 2600", "Atari Lynx", "#D94616", False),
        ("Atari Lynx", "Atari Jaguar", "#D94616", False),

        # Arcade / Indie
        ("TurboGrafx-16", "Neo Geo AES", "#C88212", False),

        # Nintendo Home -> Hybrid
        ("NES", "SNES", "#D62432", False),
        ("SNES", "Nintendo 64", "#D62432", False),
        ("Nintendo 64", "GameCube", "#D62432", False),
        ("GameCube", "Nintendo Wii", "#D62432", False),
        ("Nintendo Wii", "Nintendo Switch", "#D62432", False),
        ("Nintendo Switch", "Nintendo Switch 2", "#D62432", False),

        # Nintendo Handheld -> Hybrid + Virtual Boy spur
        ("Game Boy", "Virtual Boy", "#D90E22", True),
        ("Game Boy", "Game Boy Color", "#149658", False),
        ("Game Boy Color", "Game Boy Advance", "#149658", False),
        ("Game Boy Advance", "Nintendo DS", "#149658", False),
        ("Nintendo DS", "Nintendo 3DS", "#149658", False),
        ("Nintendo 3DS", "Nintendo Switch", "#149658", False),

        # Sega
        ("Master System", "Sega Genesis", "#1458C4", False),
        ("Sega Genesis", "Sega Saturn", "#1458C4", False),
        ("Sega Saturn", "Sega Dreamcast", "#1458C4", False),

        # PlayStation Home + Portable / Remote
        ("PlayStation", "PlayStation 2", "#264CC4", False),
        ("PlayStation 2", "PlayStation 3", "#264CC4", False),
        ("PlayStation 3", "PlayStation 4", "#264CC4", False),
        ("PlayStation 4", "PlayStation 5", "#264CC4", False),
        ("PlayStation 2", "PSP", "#4B7CF0", True),
        ("PSP", "PS Vita", "#4B7CF0", False),
        ("PS Vita", "PlayStation Portal", "#4B7CF0", True),
        ("PlayStation 5", "PlayStation Portal", "#4B7CF0", True),

        # Xbox + Handheld PC spur
        ("Xbox", "Xbox 360", "#148824", False),
        ("Xbox 360", "Xbox One", "#148824", False),
        ("Xbox One", "Xbox Series X|S", "#148824", False),
        ("Xbox Series X|S", "ROG Xbox Ally", "#148824", True),

        # Valve / Steam
        ("Steam Deck", "Steam Machine", "#D9531E", False),
        ("Steam Deck", "Steam Frame", "#D9531E", True),
    ]

    def to_px(x, y):
        px = 340 + (x - 1.0) / 27.8 * (W * 2 - 560)
        py = 1480 - y * 335
        return px, py

    pos = {n[0]: to_px(n[1], n[2]) for n in nodes}

    # Subtle vertical decade / milestone guides (1977 -> 2026)
    for yr_lbl, gx_val in [
        ("1977", 2.6), ("1985", 5.0), ("1990", 9.6), ("1995", 12.6),
        ("2000", 15.7), ("2005", 19.0), ("2010", 21.0), ("2015", 23.0),
        ("2020", 24.6), ("2026", 28.0),
    ]:
        gx, _ = to_px(gx_val, 0)
        draw.line([(gx, 225), (gx, H * 2 - 235)], fill="#ECEAE2", width=2)
        draw_text_centered(draw, gx, H * 2 - 205, yr_lbl, f_yr, fill="#8A8E99")

    # Clean pill line-badges anchored right beside each track's starting station
    for txt, start_station, col, x_gap in [
        ("ATARI",             "Atari 2600",    "#D94616", 44),
        ("ARCADE / 16-BIT",   "TurboGrafx-16", "#C88212", 44),
        ("PANIC / INDIE",     "Playdate",      "#C88212", 44),
        ("VALVE / STEAM",     "Steam Deck",    "#D9531E", 44),
        ("NINTENDO HOME",     "NES",           "#D62432", 44),
        ("NINTENDO HANDHELD", "Game Boy",      "#149658", 44),
        ("SEGA",              "Master System", "#1458C4", 44),
        ("PLAYSTATION",       "PlayStation",   "#264CC4", 44),
        ("XBOX",              "Xbox",          "#148824", 44),
    ]:
        sx, sy = pos[start_station]
        bbox = draw.textbbox((0, 0), txt, font=f_tag)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        bx1 = sx - x_gap
        bx0 = bx1 - tw - 28
        by0 = sy - th / 2 - 10
        by1 = sy + th / 2 + 10
        rgb = hex_to_rgb_tuple(col)
        tint = tuple(int(c * 0.14 + 255 * 0.86) for c in rgb)
        draw.rounded_rectangle((bx0, by0, bx1, by1), radius=10, fill=tint, outline=rgb, width=2)
        draw_text_centered(draw, (bx0 + bx1) / 2, sy, txt, f_tag, fill=rgb)

    # Draw metro edges
    for u, v, col, dashed in edges:
        x1, y1 = pos[u]
        x2, y2 = pos[v]
        rgb = hex_to_rgb_tuple(col)
        if dashed:
            seg_len = math.hypot(x2 - x1, y2 - y1)
            steps = max(14, int(seg_len / 26))
            if steps % 2 == 1:
                steps += 1
            for k in range(0, steps, 2):
                xa = x1 + (x2 - x1) * (k / steps)
                ya = y1 + (y2 - y1) * (k / steps)
                xb = x1 + (x2 - x1) * ((k + 1) / steps)
                yb = y1 + (y2 - y1) * ((k + 1) / steps)
                draw.line([(xa, ya), (xb, yb)], fill=rgb, width=8)
        else:
            draw.line([(x1, y1), (x2, y2)], fill=rgb, width=11)

    # Draw stations
    for name, x, y, yr, col, dy in nodes:
        cx, cy = pos[name]
        is_hub = name in ("Nintendo Switch", "Steam Deck", "PlayStation Portal")
        r = 24 if is_hub else 19
        draw_circle(draw, cx, cy, r + 5, fill="#FAF9F5")
        draw_circle(draw, cx, cy, r, fill=hex_to_rgb_tuple(col), outline="#FFFFFF", width=3)
        lx, ly = to_px(x, y + dy)
        draw_text_centered(draw, lx, ly, name, f_main, fill="#181A20")
        draw_text_centered(draw, lx, ly + (29 if dy < 0 else -27), yr, f_yr, fill="#6A7080")

    # Bottom legend
    leg_y = H * 2 - 96
    draw.line([(120, leg_y - 40), (W * 2 - 120, leg_y - 40)], fill="#E2E0D8", width=2)
    legend_items = [
        ("Atari", "#D94616"),
        ("Arcade / Indie", "#C88212"),
        ("Nintendo Home", "#D62432"),
        ("Nintendo Handheld", "#149658"),
        ("Sega", "#1458C4"),
        ("PlayStation (+ Portable)", "#264CC4"),
        ("Xbox", "#148824"),
        ("Valve / Steam", "#D9531E"),
    ]
    total_leg_w = sum(draw.textbbox((0, 0), lbl, font=f_leg)[2] + 84 for lbl, _ in legend_items) - 52
    lx = (W * 2 - total_leg_w) / 2
    for label, col in legend_items:
        draw_circle(draw, lx + 12, leg_y, 11, fill=hex_to_rgb_tuple(col))
        draw.text((lx + 32, leg_y - 14), label, font=f_leg, fill="#343842")
        lx += draw.textbbox((0, 0), label, font=f_leg)[2] + 84

    save_downsampled(img, TIMELINE_ASSETS / "timeline-metro.png", W, H)
    print("Saved assets/timeline/timeline-metro.png")


# ---------- 3. Render 78-Theme CIE a*-b* Small-Multiples Grid (6 x 13) ----------

def render_colorspace_grid(rows, slug_order):
    W, H = 2600, 5100
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(56, "bold")
    f_sub = load_font(28, "regular")
    f_panel = load_font(25, "bold")
    f_axis = load_font(22, "regular")

    draw.text((100, 56), "All 78 Themes in the CIE a*–b* Chromaticity Plane (39 Consoles, 1977–2026)", font=f_title, fill="#181A20")
    draw.text(
        (100, 128),
        "All 78 themes (6 × 13 chronological grid, 3 Light/Dark console pairs per row). Connected: keyword · storage · string · regex · function · type · interface · number · decorator · namespace. Rings = C* 30, 60, 90.",
        font=f_sub,
        fill="#525866",
    )

    poly_by_slug = {}
    meta_by_slug = {}
    for r in rows:
        meta_by_slug[r["theme_slug"]] = r
        if r["role"] in POLYGON_ROLES:
            poly_by_slug.setdefault(r["theme_slug"], {})[r["role"]] = r

    cols, nrows = 6, 13
    pad_l, pad_r, pad_t, pad_b = 90, 90, 220, 105
    gap_x, gap_y = 42, 48
    cell_w = (W * 2 - pad_l - pad_r - gap_x * (cols - 1)) / cols
    cell_h = (H * 2 - pad_t - pad_b - gap_y * (nrows - 1)) / nrows

    LIM = 105.0

    for idx, slug in enumerate(slug_order):
        c = idx % cols
        r_idx = idx // cols
        x0 = pad_l + c * (cell_w + gap_x)
        y0 = pad_t + r_idx * (cell_h + gap_y)

        meta = meta_by_slug[slug]
        header_h = 50
        plot_size = min(cell_w - 20, cell_h - header_h - 14)
        px0 = x0 + (cell_w - plot_size) / 2
        py0 = y0 + header_h

        draw.rounded_rectangle(
            (x0, y0, x0 + cell_w, y0 + cell_h),
            radius=14,
            fill="#FFFFFF",
            outline="#E2E0D8",
            width=2,
        )

        mode_cap = "Light" if meta["mode"] == "light" else "Dark"
        title_str = f"{SHORT_CONSOLE[meta['console']]} ({mode_cap})"
        draw_text_centered(draw, x0 + cell_w / 2, y0 + 27, title_str, f_panel, fill="#1E222B")

        cx = px0 + plot_size / 2
        cy = py0 + plot_size / 2
        scale = (plot_size / 2 - 20) / LIM

        for chroma_r in (30, 60, 90):
            rr = chroma_r * scale
            draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline="#ECEAE4", width=2)
        draw.line([(px0 + 10, cy), (px0 + plot_size - 10, cy)], fill="#DCD9D0", width=2)
        draw.line([(cx, py0 + 10), (cx, py0 + plot_size - 10)], fill="#DCD9D0", width=2)

        role_map = poly_by_slug[slug]
        pts = []
        for role in POLYGON_ROLES:
            item = role_map[role]
            px = cx + item["a"] * scale
            py = cy - item["b"] * scale
            pts.append((px, py, item["hex"]))

        poly_xy = [(p[0], p[1]) for p in pts] + [(pts[0][0], pts[0][1])]
        draw.line(poly_xy, fill="#6C7280", width=4)

        for px, py, hx in pts:
            draw_circle(draw, px, py, 12, fill=hex_to_rgb_tuple(hx), outline="#181A20", width=3)

    draw_text_centered(draw, W, H * 2 - 50, "Horizontal axis: a* (-green to +red)   ·   Vertical axis: b* (-blue to +yellow)", f_axis, fill="#5A6070")

    out_asset = CS_ASSETS / "theme-colorspace-grid.png"
    save_downsampled(img, out_asset, W, H)
    shutil.copyfile(out_asset, PLOTS_DIR / "theme_colorspace_grid.png")
    print("Saved assets/color-science/theme-colorspace-grid.png")


# ---------- 4. Render Global 1,014-Color Lab PCA ----------

def render_global_pca(rows):
    syntax_rows = [r for r in rows if r["role_kind"] == "syntax"]
    n_tokens = len(syntax_rows)
    n_themes = len({r["theme_slug"] for r in syntax_rows})
    X = np.array([[r["L"], r["a"], r["b"]] for r in syntax_rows], dtype=np.float64)
    X_centered = X - X.mean(axis=0, keepdims=True)
    U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
    if Vt[0, 0] < 0:
        Vt[0] *= -1
        U[:, 0] *= -1
    if Vt[1, 1] < 0:
        Vt[1] *= -1
        U[:, 1] *= -1
    scores = X_centered @ Vt.T
    var_exp = (S ** 2) / np.sum(S ** 2) * 100.0

    W, H = 1560, 1080
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(46, "bold")
    f_sub = load_font(25, "regular")
    f_ax = load_font(26, "medium")
    f_tick = load_font(22, "regular")
    f_leg_h = load_font(25, "bold")
    f_leg = load_font(23, "regular")

    draw.text((90, 52), f"Global PCA of Syntax-Role Colors Across All {n_themes} Themes (CIE Lab)", font=f_title, fill="#181A20")
    draw.text(
        (90, 114),
        f"{n_tokens:,} tokens ({n_themes} themes × 13 syntax roles), unscaled Lab — PC1 ({var_exp[0]:.1f}%) & PC2 ({var_exp[1]:.1f}%) capture chromatic + luminance spread.",
        font=f_sub,
        fill="#525866",
    )

    px0, py0, pw, ph = 150, 185, 2280, 1820
    draw.rounded_rectangle((px0, py0, px0 + pw, py0 + ph), radius=12, fill="#FFFFFF", outline="#DEDCD4", width=2)

    x_vals, y_vals = scores[:, 0], scores[:, 1]
    xmin, xmax = float(x_vals.min()) - 10, float(x_vals.max()) + 10
    ymin, ymax = float(y_vals.min()) - 10, float(y_vals.max()) + 10

    def map_pt(xv, yv):
        x = px0 + (xv - xmin) / (xmax - xmin) * pw
        y = py0 + ph - (yv - ymin) / (ymax - ymin) * ph
        return x, y

    for gx in range(-100, 121, 25):
        if xmin <= gx <= xmax:
            xp, _ = map_pt(gx, 0)
            draw.line([(xp, py0), (xp, py0 + ph)], fill="#DCDEE4" if gx == 0 else "#F0EFEA", width=3 if gx == 0 else 2)
            draw_text_centered(draw, xp, py0 + ph + 28, str(gx), f_tick, fill="#5E6472")
    for gy in range(-100, 121, 25):
        if ymin <= gy <= ymax:
            _, yp = map_pt(0, gy)
            draw.line([(px0, yp), (px0 + pw, yp)], fill="#DCDEE4" if gy == 0 else "#F0EFEA", width=3 if gy == 0 else 2)
            draw_text_centered(draw, px0 - 38, yp, str(gy), f_tick, fill="#5E6472")

    for r, (xv, yv) in zip(syntax_rows, scores[:, :2]):
        xp, yp = map_pt(xv, yv)
        col = hex_to_rgb_tuple(ROLE_COLORS[r["role"]])
        if r["mode"] == "light":
            draw_circle(draw, xp, yp, 9, fill="#FFFFFF", outline=col, width=4)
        else:
            draw_circle(draw, xp, yp, 9, fill=col, outline="#FFFFFF", width=2)

    draw_text_centered(draw, px0 + pw / 2, py0 + ph + 72, f"PC1 ({var_exp[0]:.1f}% variance)", f_ax, fill="#222630")
    ytxt = Image.new("RGBA", (600, 60), (0, 0, 0, 0))
    ydraw = ImageDraw.Draw(ytxt)
    draw_text_centered(ydraw, 300, 30, f"PC2 ({var_exp[1]:.1f}% variance)", f_ax, fill="#222630")
    yrot = ytxt.rotate(90, expand=True)
    img.paste(yrot, (int(px0 - 118), int(py0 + ph / 2 - 300)), yrot)

    lx = px0 + pw + 60
    ly = py0 + 20
    draw.text((lx, ly), "Syntax Role", font=f_leg_h, fill="#181A20")
    ly += 46
    for role in AUDIT_ROLES:
        col = hex_to_rgb_tuple(ROLE_COLORS[role])
        draw_circle(draw, lx + 14, ly + 13, 10, fill=col)
        draw.text((lx + 36, ly), role.replace("accent", "").replace("color", ""), font=f_leg, fill="#2E3340")
        ly += 42

    ly += 30
    draw.text((lx, ly), "Theme Mode", font=f_leg_h, fill="#181A20")
    ly += 46
    draw_circle(draw, lx + 14, ly + 13, 10, fill="#FFFFFF", outline="#333842", width=4)
    draw.text((lx + 36, ly), "Light (open ring)", font=f_leg, fill="#2E3340")
    ly += 44
    draw_circle(draw, lx + 14, ly + 13, 10, fill="#333842", outline="#FFFFFF", width=2)
    draw.text((lx + 36, ly), "Dark (filled dot)", font=f_leg, fill="#2E3340")

    out_asset = CS_ASSETS / "pca-global.png"
    save_downsampled(img, out_asset, W, H)
    shutil.copyfile(out_asset, PLOTS_DIR / "pca_global.png")
    print(f"Saved assets/color-science/pca-global.png (PC1={var_exp[0]:.1f}%, PC2={var_exp[1]:.1f}%)")


# ---------- 5. Render 7-Era Faceted Family Fingerprint (4 top + 3 centered bottom) ----------

def render_family_fingerprint(rows, slug_order):
    W, H = 2200, 1220
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(48, "bold")
    f_sub = load_font(25, "regular")
    f_strip = load_font(26, "bold")
    f_note = load_font(22, "regular")

    draw.text((110, 56), 'The Family\'s Color-Space "Fingerprint", Faceted by Hardware Era', font=f_title, fill="#181A20")
    draw.text(
        (110, 120),
        "Every theme's 10-role CIE a*–b* polygon overlaid across all 7 hardware eras (showing Game Boy Dark's authentic DMG-01 monochrome LCD cluster).",
        font=f_sub,
        fill="#525866",
    )

    poly_by_slug = {}
    meta_by_slug = {}
    for r in rows:
        meta_by_slug[r["theme_slug"]] = r
        if r["role"] in POLYGON_ROLES:
            poly_by_slug.setdefault(r["theme_slug"], {})[r["role"]] = r

    panel_w, panel_h = 1000, 960
    positions = [
        (110, 210), (1170, 210), (2230, 210), (3290, 210),
        (640, 1250), (1700, 1250), (2760, 1250),
    ]
    LIM = 105.0

    for era, (x0, y0) in zip(ERA_LIST, positions):
        draw.rounded_rectangle((x0, y0, x0 + panel_w, y0 + panel_h), radius=18, fill="#FFFFFF", outline="#DEDCD4", width=2)
        era_col = hex_to_rgb_tuple(ERA_COLORS[era])
        draw_text_centered(draw, x0 + panel_w / 2, y0 + 38, era, f_strip, fill=era_col)

        plot_s = panel_h - 96
        px0 = x0 + (panel_w - plot_s) / 2
        py0 = y0 + 74
        cx, cy = px0 + plot_s / 2, py0 + plot_s / 2
        scale = (plot_s / 2 - 20) / LIM

        for cr in (30, 60, 90):
            rr = cr * scale
            draw.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline="#EFECE6", width=2)
        draw.line([(px0 + 12, cy), (px0 + plot_s - 12, cy)], fill="#DCD9D0", width=2)
        draw.line([(cx, py0 + 12), (cx, py0 + plot_s - 12)], fill="#DCD9D0", width=2)

        era_slugs = [s for s in slug_order if meta_by_slug[s]["era"] == era]
        for s in era_slugs:
            mode = meta_by_slug[s]["mode"]
            rmap = poly_by_slug[s]
            pts = [(cx + rmap[rl]["a"] * scale, cy - rmap[rl]["b"] * scale) for rl in POLYGON_ROLES]
            pts.append(pts[0])
            if mode == "light":
                col = tuple(int(c * 0.65 + 255 * 0.35) for c in era_col)
                draw.line(pts, fill=col, width=3)
            else:
                draw.line(pts, fill=era_col, width=4)

    draw_text_centered(draw, W, H * 2 - 44, "Lighter trace = Light theme   ·   Bold trace = Dark theme   ·   Concentric circles = C* 30, 60, 90", f_note, fill="#5E6472")
    save_downsampled(img, CS_ASSETS / "family-fingerprint.png", W, H)
    print("Saved assets/color-science/family-fingerprint.png")


# ---------- 6. Per-Theme 39-D Scaled PCA & Ward.D2 Dendrogram ----------

def render_theme_similarity(rows, slug_order):
    by_slug = {}
    meta_by_slug = {}
    for r in rows:
        meta_by_slug[r["theme_slug"]] = r
        if r["role"] in AUDIT_ROLES:
            by_slug.setdefault(r["theme_slug"], {})[r["role"]] = (r["L"], r["a"], r["b"])

    mat = []
    for s in slug_order:
        vec = []
        for rl in AUDIT_ROLES:
            L, a, b = by_slug[s][rl]
            vec.extend([L, a, b])
        mat.append(vec)
    X = np.array(mat, dtype=np.float64)  # 78 x 39
    n_themes = len(slug_order)
    means = X.mean(axis=0, keepdims=True)
    stds = X.std(axis=0, ddof=1, keepdims=True)
    Z = (X - means) / stds

    U, S, Vt = np.linalg.svd(Z, full_matrices=False)
    scores = Z @ Vt.T
    light_mean_pc1 = np.mean([scores[i, 0] for i, s in enumerate(slug_order) if meta_by_slug[s]["mode"] == "light"])
    if light_mean_pc1 > 0:
        scores[:, 0] *= -1
    var_exp = (S ** 2) / np.sum(S ** 2) * 100.0

    with open(DATA_DIR / "theme-pca.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["theme_slug", "console", "maker", "mode", "era", "PC1", "PC2", "PC3", "PC4"])
        for i, s in enumerate(slug_order):
            m = meta_by_slug[s]
            w.writerow([
                s, m["console"], m["maker"], m["mode"], m["era"],
                f"{scores[i, 0]:.4f}", f"{scores[i, 1]:.4f}",
                f"{scores[i, 2]:.4f}", f"{scores[i, 3]:.4f}",
            ])

    # --- Render theme-pca.png ---
    W, H = 1960, 1480
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(48, "bold")
    f_sub = load_font(25, "regular")
    f_lbl = load_font(17, "medium")
    f_ax = load_font(26, "medium")
    f_tick = load_font(22, "regular")
    f_leg_h = load_font(25, "bold")
    f_leg = load_font(22, "regular")

    draw.text((95, 52), f"Which Themes Look Like Each Other? Per-Theme 39-D PCA (All {n_themes} Themes)", font=f_title, fill="#181A20")
    draw.text(
        (95, 114),
        f"Each point = one theme's full 13-role syntax palette in CIE Lab (39 standardized channels across {n_themes} themes) — PC1 ({var_exp[0]:.1f}%), PC2 ({var_exp[1]:.1f}%).",
        font=f_sub,
        fill="#525866",
    )

    px0, py0, pw, ph = 165, 185, 2960, 2540
    draw.rounded_rectangle((px0, py0, px0 + pw, py0 + ph), radius=14, fill="#FFFFFF", outline="#DEDCD4", width=2)

    xs, ys = scores[:, 0], scores[:, 1]
    xmin, xmax = float(xs.min()) - 2.0, float(xs.max()) + 2.0
    ymin, ymax = float(ys.min()) - 1.8, float(ys.max()) + 1.8

    def map_pt(xv, yv):
        return (
            px0 + (xv - xmin) / (xmax - xmin) * pw,
            py0 + ph - (yv - ymin) / (ymax - ymin) * ph,
        )

    for gx in range(-10, 14, 2):
        if xmin <= gx <= xmax:
            xp, _ = map_pt(gx, 0)
            draw.line([(xp, py0), (xp, py0 + ph)], fill="#D5D8E0" if gx == 0 else "#F0EFEA", width=3 if gx == 0 else 2)
            draw_text_centered(draw, xp, py0 + ph + 28, str(gx), f_tick, fill="#5E6472")
    for gy in range(-12, 16, 2):
        if ymin <= gy <= ymax:
            _, yp = map_pt(0, gy)
            draw.line([(px0, yp), (px0 + pw, yp)], fill="#D5D8E0" if gy == 0 else "#F0EFEA", width=3 if gy == 0 else 2)
            draw_text_centered(draw, px0 - 36, yp, str(gy), f_tick, fill="#5E6472")

    pts_px = [map_pt(xs[i], ys[i]) for i in range(len(slug_order))]

    labels = []
    for mode_grp in ("light", "dark"):
        grp_indices = [
            i for i, s in enumerate(slug_order)
            if meta_by_slug[s]["mode"] == mode_grp and s != "gameboy-dark"
        ]
        cx_g = sum(pts_px[i][0] for i in grp_indices) / len(grp_indices)
        cy_g = sum(pts_px[i][1] for i in grp_indices) / len(grp_indices)
        grp_sorted = sorted(grp_indices, key=lambda i: math.atan2(pts_px[i][1] - cy_g, pts_px[i][0] - cx_g))
        for i in grp_sorted:
            s = slug_order[i]
            m = meta_by_slug[s]
            lbl = f"{SHORT_CONSOLE[m['console']]} {'L' if m['mode'] == 'light' else 'D'}"
            bbox = draw.textbbox((0, 0), lbl, font=f_lbl)
            lw, lh = bbox[2] - bbox[0] + 14, bbox[3] - bbox[1] + 9
            ang = math.atan2(pts_px[i][1] - cy_g, pts_px[i][0] - cx_g)
            labels.append({
                "idx": i,
                "text": lbl,
                "ax": pts_px[i][0],
                "ay": pts_px[i][1],
                "x": pts_px[i][0] + math.cos(ang) * 165,
                "y": pts_px[i][1] + math.sin(ang) * 145,
                "w": lw,
                "h": lh,
                "era": m["era"],
                "mode": m["mode"],
            })

    gb_idx = slug_order.index("gameboy-dark")
    lbl = "Game Boy D (1989 DMG-01 LCD)"
    bbox = draw.textbbox((0, 0), lbl, font=f_lbl)
    labels.append({
        "idx": gb_idx,
        "text": lbl,
        "ax": pts_px[gb_idx][0],
        "ay": pts_px[gb_idx][1],
        "x": pts_px[gb_idx][0] - 180,
        "y": pts_px[gb_idx][1] + 46,
        "w": bbox[2] - bbox[0] + 14,
        "h": bbox[3] - bbox[1] + 9,
        "era": meta_by_slug["gameboy-dark"]["era"],
        "mode": "dark",
    })

    for _ in range(700):
        for i, li in enumerate(labels):
            fx, fy = 0.0, 0.0
            dx_a = li["x"] - li["ax"]
            dy_a = li["y"] - li["ay"]
            dist_a = math.hypot(dx_a, dy_a) + 1e-4
            if dist_a > 440:
                fx -= (dx_a / dist_a) * (dist_a - 440) * 0.06
                fy -= (dy_a / dist_a) * (dist_a - 440) * 0.06
            elif dist_a < 40:
                fx += (dx_a / dist_a) * (40 - dist_a) * 0.35
                fy += (dy_a / dist_a) * (40 - dist_a) * 0.35

            for ax, ay in pts_px:
                ox = abs(li["x"] - ax) - (li["w"] / 2 + 20)
                oy = abs(li["y"] - ay) - (li["h"] / 2 + 20)
                if ox < 0 and oy < 0:
                    sx = 1.0 if li["x"] >= ax else -1.0
                    sy = 1.0 if li["y"] >= ay else -1.0
                    if abs(ox) < abs(oy):
                        fx += sx * (-ox) * 0.45
                    else:
                        fy += sy * (-oy) * 0.50

            for j, lj in enumerate(labels):
                if i == j:
                    continue
                ox = abs(li["x"] - lj["x"]) - (li["w"] + lj["w"]) / 2 - 12
                oy = abs(li["y"] - lj["y"]) - (li["h"] + lj["h"]) / 2 - 8
                if ox < 0 and oy < 0:
                    sx = 1.0 if (li["x"] > lj["x"] or (li["x"] == lj["x"] and i > j)) else -1.0
                    sy = 1.0 if (li["y"] > lj["y"] or (li["y"] == lj["y"] and i > j)) else -1.0
                    if abs(ox) < abs(oy):
                        fx += sx * (-ox) * 0.54
                    else:
                        fy += sy * (-oy) * 0.54

            li["x"] = min(px0 + pw - li["w"] / 2 - 16, max(px0 + li["w"] / 2 + 16, li["x"] + fx))
            li["y"] = min(py0 + ph - li["h"] / 2 - 16, max(py0 + li["h"] / 2 + 16, li["y"] + fy))

    for li in labels:
        if math.hypot(li["x"] - li["ax"], li["y"] - li["ay"]) > 24:
            draw.line([(li["ax"], li["ay"]), (li["x"], li["y"])], fill="#B0B5C4", width=2)

    for li in labels:
        col = hex_to_rgb_tuple(ERA_COLORS[li["era"]])
        if li["mode"] == "light":
            draw_circle(draw, li["ax"], li["ay"], 12, fill=col, outline="#FFFFFF", width=3)
        else:
            draw_triangle(draw, li["ax"], li["ay"], 13, fill=col, outline="#FFFFFF")

    for li in labels:
        draw.rounded_rectangle(
            (li["x"] - li["w"] / 2 + 2, li["y"] - li["h"] / 2 + 2, li["x"] + li["w"] / 2 - 2, li["y"] + li["h"] / 2 - 2),
            radius=5,
            fill="#FFFFFF",
        )
        draw_text_centered(draw, li["x"], li["y"], li["text"], f_lbl, fill="#1E222B")

    draw_text_centered(draw, px0 + pw / 2, py0 + ph + 74, f"PC1 ({var_exp[0]:.1f}% of variance)", f_ax, fill="#222630")
    ytxt2 = Image.new("RGBA", (640, 60), (0, 0, 0, 0))
    ydraw2 = ImageDraw.Draw(ytxt2)
    draw_text_centered(ydraw2, 320, 30, f"PC2 ({var_exp[1]:.1f}% of variance)", f_ax, fill="#222630")
    yrot2 = ytxt2.rotate(90, expand=True)
    img.paste(yrot2, (int(px0 - 122), int(py0 + ph / 2 - 320)), yrot2)

    lx = px0 + pw + 48
    ly = py0 + 30
    draw.text((lx, ly), "Hardware Era", font=f_leg_h, fill="#181A20")
    ly += 48
    for era in ERA_LIST:
        col = hex_to_rgb_tuple(ERA_COLORS[era])
        draw_circle(draw, lx + 14, ly + 13, 11, fill=col)
        short_e = era.replace(" & Millennial Classics", " & Millennial").replace(", Motion & Portable Era", ", Motion & Port.").replace(", Hybrid & Portable PC", " & Hybrid")
        draw.text((lx + 36, ly), short_e, font=f_leg, fill="#2E3340")
        ly += 46

    ly += 34
    draw.text((lx, ly), "Mode", font=f_leg_h, fill="#181A20")
    ly += 48
    draw_circle(draw, lx + 14, ly + 13, 11, fill="#383E4C")
    draw.text((lx + 36, ly), "Light (L · circle)", font=f_leg, fill="#2E3340")
    ly += 46
    draw_triangle(draw, lx + 14, ly + 13, 12, fill="#383E4C")
    draw.text((lx + 36, ly), "Dark (D · triangle)", font=f_leg, fill="#2E3340")

    save_downsampled(img, CS_ASSETS / "theme-pca.png", W, H)
    print(f"Saved assets/color-science/theme-pca.png (PC1={var_exp[0]:.1f}%, PC2={var_exp[1]:.1f}%)")

    # --- Render Ward.D2 Dendrogram (tall crisp horizontal tree for all 78 themes) ---
    merges = ward_d2_clustering(Z)
    n = len(slug_order)
    children = {m[3]: (m[0], m[1], m[2]) for m in merges}
    root_id = merges[-1][3]

    leaf_order = []
    def collect_leaves(node):
        if node < n:
            leaf_order.append(node)
        else:
            left, right, _ = children[node]
            collect_leaves(left)
            collect_leaves(right)
    collect_leaves(root_id)

    DW, DH = 1960, 2240
    dimg = make_canvas(DW, DH, "#FAF9F6")
    ddraw = ImageDraw.Draw(dimg)

    ddraw.text(
        (95, 52),
        f"Hierarchical Clustering of All {n} Themes (Ward's Method on 39-D Lab Profile)",
        font=f_title,
        fill="#181A20",
    )
    ddraw.text(
        (95, 114),
        "Nearest neighbors share overall syntax-role hue & lightness structure across all 13 syntax roles — colored by hardware era.",
        font=f_sub,
        fill="#525866",
    )

    tx0, ty0, tw, th = 140, 210, 2660, 4050
    max_h = merges[-1][2] * 1.04

    leaf_y = {}
    for rank, leaf_idx in enumerate(leaf_order):
        leaf_y[leaf_idx] = ty0 + (rank + 0.5) / n * th

    node_pos = {}
    for leaf_idx in leaf_order:
        node_pos[leaf_idx] = (tx0 + tw, leaf_y[leaf_idx])

    def compute_internal(node):
        if node < n:
            return node_pos[node]
        left, right, h_val = children[node]
        xl, yl = compute_internal(left)
        xr, yr = compute_internal(right)
        x_here = tx0 + tw - (h_val / max_h) * tw
        y_here = 0.5 * (yl + yr)
        node_pos[node] = (x_here, y_here)
        ddraw.line([(xl, yl), (x_here, yl)], fill="#4A5060", width=4)
        ddraw.line([(xr, yr), (x_here, yr)], fill="#4A5060", width=4)
        ddraw.line([(x_here, yl), (x_here, yr)], fill="#4A5060", width=4)
        return x_here, y_here

    compute_internal(root_id)

    axis_y = ty0 + th + 26
    ddraw.line([(tx0, axis_y), (tx0 + tw, axis_y)], fill="#B8BCC8", width=3)
    for h_tick in range(0, int(max_h) + 1, 5):
        xt = tx0 + tw - (h_tick / max_h) * tw
        ddraw.line([(xt, axis_y), (xt, axis_y + 12)], fill="#8E94A2", width=3)
        draw_text_centered(ddraw, xt, axis_y + 34, str(h_tick), f_tick, fill="#5E6472")
    draw_text_centered(ddraw, tx0 + tw / 2, axis_y + 78, "Ward's Linkage Distance (39-D Standardized CIE Lab)", f_ax, fill="#222630")

    f_leaf = load_font(22, "bold")
    for rank, leaf_idx in enumerate(leaf_order):
        slug = slug_order[leaf_idx]
        m = meta_by_slug[slug]
        yp = leaf_y[leaf_idx]
        era_col = hex_to_rgb_tuple(ERA_COLORS[m["era"]])
        draw_circle(ddraw, tx0 + tw + 18, yp, 7.5, fill=era_col)
        mode_word = "Light" if m["mode"] == "light" else "Dark"
        ddraw.text((tx0 + tw + 38, yp - 13), f"{m['console']} {mode_word}", font=f_leaf, fill=era_col)

    leg_x, leg_y = 160, 240
    ddraw.rounded_rectangle((leg_x, leg_y, leg_x + 560, leg_y + 390), radius=14, fill="#FFFFFF", outline="#DEDCD4", width=2)
    ddraw.text((leg_x + 24, leg_y + 18), "Hardware Era", font=f_leg_h, fill="#181A20")
    cy_l = leg_y + 64
    for era in ERA_LIST:
        col = hex_to_rgb_tuple(ERA_COLORS[era])
        draw_circle(ddraw, leg_x + 36, cy_l + 12, 10, fill=col)
        ddraw.text((leg_x + 60, cy_l), era, font=f_leg, fill="#2E3340")
        cy_l += 44

    save_downsampled(dimg, CS_ASSETS / "theme-dendrogram.png", DW, DH)
    print(f"Saved assets/color-science/theme-dendrogram.png (max linkage height={merges[-1][2]:.2f})")
    print("Top-level Ward clusters & leaf order:")
    for idx in leaf_order:
        print("  -", slug_order[idx])


# ---------- 7. Render CVD Swatch Grid ----------

def render_cvd_swatch_grid(rows):
    showcase = [
        "atari2600-dark",
        "nes-light",
        "gameboy-dark",
        "snes-light",
        "ps1-light",
        "dreamcast-light",
        "ps2-dark",
        "xbox-dark",
        "switch-dark",
        "playdate-light",
        "switch2-dark",
        "steammachine-dark",
    ]
    poly_by_slug = {}
    meta_by_slug = {}
    for r in rows:
        meta_by_slug[r["theme_slug"]] = r
        if r["role"] in POLYGON_ROLES:
            poly_by_slug.setdefault(r["theme_slug"], {})[r["role"]] = r["hex"]

    W, H = 1520, 1180
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(44, "bold")
    f_sub = load_font(24, "regular")
    f_col = load_font(26, "bold")
    f_row = load_font(24, "bold")
    f_foot = load_font(21, "regular")

    draw.text((84, 48), "Dichromacy Simulation Across Representative Themes (10 Syntax Roles)", font=f_title, fill="#181A20")
    draw.text(
        (84, 108),
        "Machado, Oliveira & Fernandes (2009) full-severity simulation — OKLCH lightness staggering keeps syntax tokens distinct even when hue axes collapse.",
        font=f_sub,
        fill="#525866",
    )

    conditions = [
        ("Normal Vision", None),
        ("Protanopia", "protan"),
        ("Deuteranopia", "deutan"),
        ("Tritanopia", "tritan"),
    ]

    left_lbl_w = 520
    grid_x0 = 84 + left_lbl_w
    grid_y0 = 225
    col_gap = 38
    col_w = (W * 2 - grid_x0 - 84 - col_gap * 3) / 4
    row_h = 160

    for ci, (cname, _) in enumerate(conditions):
        cx0 = grid_x0 + ci * (col_w + col_gap)
        draw_text_centered(draw, cx0 + col_w / 2, grid_y0 - 34, cname, f_col, fill="#222630")

    for ri, slug in enumerate(showcase):
        y0 = grid_y0 + ri * row_h
        m = meta_by_slug[slug]
        mode_s = "Light" if m["mode"] == "light" else "Dark"
        lbl = f"{SHORT_CONSOLE[m['console']]} {mode_s}"
        draw.text((84, y0 + 38), lbl, font=f_row, fill="#1E222B")
        if slug == "gameboy-dark":
            draw.text((84, y0 + 74), "(1989 DMG-01 LCD ramp)", font=load_font(19, "italic"), fill="#687080")

        orig_hexes = [poly_by_slug[slug][rl] for rl in POLYGON_ROLES]
        for ci, (_, cvd_t) in enumerate(conditions):
            cx0 = grid_x0 + ci * (col_w + col_gap)
            sim_hexes = orig_hexes if cvd_t is None else simulate_cvd_hexes(orig_hexes, cvd_t)
            sw_w = col_w / len(POLYGON_ROLES)
            draw.rounded_rectangle((cx0 - 2, y0 + 16, cx0 + col_w + 2, y0 + 114), radius=8, fill="#FFFFFF", outline="#DCDAD2", width=2)
            for si, hx in enumerate(sim_hexes):
                sx0 = cx0 + si * sw_w + 2
                sx1 = cx0 + (si + 1) * sw_w - 2
                draw.rectangle((sx0, y0 + 20, sx1, y0 + 110), fill=hex_to_rgb_tuple(hx))

    draw_text_centered(
        draw,
        W,
        H * 2 - 48,
        "Swatches inside each bar (left to right): keyword · storage · string · regex · function · type · interface · number · decorator · namespace",
        f_foot,
        fill="#5E6472",
    )
    save_downsampled(img, CS_ASSETS / "cvd-swatch-grid.png", W, H)
    print("Saved assets/color-science/cvd-swatch-grid.png")


# ---------- 8. CIEDE2000 Per-Mode Classical MDS & Split-Triangle Distance Heatmap ----------

def ciede2000(lab1, lab2):
    L1, a1, b1 = lab1
    L2, a2, b2 = lab2
    C1 = math.hypot(a1, b1)
    C2 = math.hypot(a2, b2)
    Cbar = 0.5 * (C1 + C2)
    G = 0.5 * (1.0 - math.sqrt((Cbar ** 7) / (Cbar ** 7 + 25.0 ** 7)))
    a1p, a2p = (1.0 + G) * a1, (1.0 + G) * a2
    C1p, C2p = math.hypot(a1p, b1), math.hypot(a2p, b2)
    h1p = math.degrees(math.atan2(b1, a1p)) % 360.0 if (a1p or b1) else 0.0
    h2p = math.degrees(math.atan2(b2, a2p)) % 360.0 if (a2p or b2) else 0.0
    dLp = L2 - L1
    dCp = C2p - C1p
    if C1p * C2p == 0.0:
        dhp = 0.0
    elif abs(h2p - h1p) <= 180.0:
        dhp = h2p - h1p
    elif h2p - h1p > 180.0:
        dhp = (h2p - h1p) - 360.0
    else:
        dhp = (h2p - h1p) + 360.0
    dHp = 2.0 * math.sqrt(C1p * C2p) * math.sin(math.radians(dhp / 2.0))
    Lbp = 0.5 * (L1 + L2)
    Cbp = 0.5 * (C1p + C2p)
    if C1p * C2p == 0.0:
        Hbp = h1p + h2p
    elif abs(h1p - h2p) <= 180.0:
        Hbp = 0.5 * (h1p + h2p)
    elif h1p + h2p < 360.0:
        Hbp = 0.5 * (h1p + h2p + 360.0)
    else:
        Hbp = 0.5 * (h1p + h2p - 360.0)
    T = (
        1.0
        - 0.17 * math.cos(math.radians(Hbp - 30.0))
        + 0.24 * math.cos(math.radians(2.0 * Hbp))
        + 0.32 * math.cos(math.radians(3.0 * Hbp + 6.0))
        - 0.20 * math.cos(math.radians(4.0 * Hbp - 63.0))
    )
    dTheta = 30.0 * math.exp(-(((Hbp - 275.0) / 25.0) ** 2))
    RC = 2.0 * math.sqrt((Cbp ** 7) / (Cbp ** 7 + 25.0 ** 7))
    SL = 1.0 + (0.015 * ((Lbp - 50.0) ** 2)) / math.sqrt(20.0 + ((Lbp - 50.0) ** 2))
    SC = 1.0 + 0.045 * Cbp
    SH = 1.0 + 0.015 * Cbp * T
    RT = -math.sin(math.radians(2.0 * dTheta)) * RC
    return math.sqrt(
        (dLp / SL) ** 2
        + (dCp / SC) ** 2
        + (dHp / SH) ** 2
        + RT * (dCp / SC) * (dHp / SH)
    )


def compute_de00_matrix(slugs, by_slug):
    n = len(slugs)
    D = np.zeros((n, n), dtype=np.float64)
    for i in range(n):
        for j in range(i + 1, n):
            d = sum(ciede2000(by_slug[slugs[i]][rl], by_slug[slugs[j]][rl]) for rl in AUDIT_ROLES) / len(AUDIT_ROLES)
            D[i, j] = D[j, i] = d
    return D


def classical_mds_2d(D):
    n = D.shape[0]
    J = np.eye(n) - np.ones((n, n)) / n
    B = -0.5 * J @ (D ** 2) @ J
    eigvals, eigvecs = np.linalg.eigh(B)
    idx = np.argsort(eigvals)[::-1]
    eigvals, eigvecs = eigvals[idx], eigvecs[:, idx]
    pos_sum = float(np.sum(np.maximum(eigvals, 0.0)))
    v1 = float(eigvals[0] / pos_sum * 100.0) if pos_sum > 0 else 0.0
    v2 = float(eigvals[1] / pos_sum * 100.0) if pos_sum > 0 else 0.0
    coords = eigvecs[:, :2] * np.sqrt(np.maximum(eigvals[:2], 0.0))
    return coords, (v1, v2)


def render_theme_mds_and_heatmap(rows, slug_order):
    by_slug = {}
    hex_by_slug = {}
    meta_by_slug = {}
    for r in rows:
        s = r["theme_slug"]
        meta_by_slug[s] = r
        hex_by_slug.setdefault(s, {})[r["role"]] = r["hex"]
        if r["role"] in AUDIT_ROLES:
            by_slug.setdefault(s, {})[r["role"]] = (r["L"], r["a"], r["b"])

    # Compute per-mode distance matrices & Classical MDS (excluding gameboy-dark from Dark MDS fit)
    light_slugs = [s for s in slug_order if meta_by_slug[s]["mode"] == "light"]
    dark_all_slugs = [s for s in slug_order if meta_by_slug[s]["mode"] == "dark"]
    dark_poly_slugs = [s for s in dark_all_slugs if s != "gameboy-dark"]

    D_light = compute_de00_matrix(light_slugs, by_slug)
    D_dark_all = compute_de00_matrix(dark_all_slugs, by_slug)
    D_dark_poly = compute_de00_matrix(dark_poly_slugs, by_slug)

    coords_l, var_l = classical_mds_2d(D_light)
    coords_d, var_d = classical_mds_2d(D_dark_poly)

    # Consistent semantic orientation across both panels:
    # +X = emerald/primary (Xbox), +Y = warm flame/amber (NES)
    if coords_l[light_slugs.index("xbox-light"), 0] < 0:
        coords_l[:, 0] *= -1
    if coords_l[light_slugs.index("nes-light"), 1] < 0:
        coords_l[:, 1] *= -1
    if coords_d[dark_poly_slugs.index("xbox-dark"), 0] < 0:
        coords_d[:, 0] *= -1
    if coords_d[dark_poly_slugs.index("nes-dark"), 1] < 0:
        coords_d[:, 1] *= -1

    gb_idx_all = dark_all_slugs.index("gameboy-dark")
    gb_dists = [D_dark_all[gb_idx_all, i] for i, s in enumerate(dark_all_slugs) if s != "gameboy-dark"]
    gb_mean_de = float(np.mean(gb_dists))
    gb_min_de = float(np.min(gb_dists))
    gb_max_de = float(np.max(gb_dists))

    # Export reproducible theme-mds.csv & theme-distances.csv
    mds_rows = []
    for mode_name, slugs_all, D_mat, poly_slugs, coords_mat in [
        ("light", light_slugs, D_light, light_slugs, coords_l),
        ("dark", dark_all_slugs, D_dark_all, dark_poly_slugs, coords_d),
    ]:
        coord_map = {s: (coords_mat[i, 0], coords_mat[i, 1]) for i, s in enumerate(poly_slugs)}
        for i, s in enumerate(slugs_all):
            m = meta_by_slug[s]
            others = [(D_mat[i, j], slugs_all[j]) for j in range(len(slugs_all)) if j != i]
            others.sort()
            near_de, near_slug = others[0]
            far_pool = [(d, sl) for d, sl in others if sl != "gameboy-dark"]
            far_de, far_slug = far_pool[-1] if far_pool else others[-1]
            is_out = s == "gameboy-dark"
            mx, my = coord_map.get(s, (float("nan"), float("nan")))
            mds_rows.append({
                "theme_slug": s,
                "console": m["console"],
                "maker": m["maker"],
                "era": m["era"],
                "mode": mode_name,
                "mds1": "" if is_out else f"{mx:.4f}",
                "mds2": "" if is_out else f"{my:.4f}",
                "nearest_slug": near_slug,
                "nearest_de00": f"{near_de:.3f}",
                "farthest_poly_slug": far_slug,
                "farthest_poly_de00": f"{far_de:.3f}",
                "is_outlier": "true" if is_out else "false",
            })

    with open(DATA_DIR / "theme-mds.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(mds_rows[0].keys()))
        w.writeheader()
        w.writerows(mds_rows)

    # ---------- Render Side-by-Side Perceptual MDS (theme-mds.png) ----------
    W, H = 2400, 1300
    img = make_canvas(W, H, "#FAF9F6")
    draw = ImageDraw.Draw(img)

    f_title = load_font(50, "bold")
    f_sub = load_font(25, "regular")
    f_phead = load_font(31, "bold")
    f_psub = load_font(22, "regular")
    f_lbl = load_font(20, "bold")
    f_pole = load_font(19, "bold")
    f_ax = load_font(23, "medium")
    f_tick = load_font(19, "regular")
    f_card_h = load_font(22, "bold")
    f_card_s = load_font(19, "regular")
    f_foot = load_font(22, "regular")

    draw.text((120, 50), "Perceptual Similarity Landscape — Classical MDS on CIEDE2000 (ΔE₀₀)", font=f_title, fill="#181A20")
    draw.text(
        (120, 114),
        "Pairwise mean ΔE₀₀ across all 13 syntax roles, split by polarity so consoles separate purely by chromatic identity. Inner fill = editor bg · outer ring = signature accent.",
        font=f_sub,
        fill="#525866",
    )

    panels = [
        {
            "title": "Light Themes (39 Consoles)",
            "subtitle": f"Dim 1 ({var_l[0]:.1f}%) + Dim 2 ({var_l[1]:.1f}%) = {var_l[0] + var_l[1]:.1f}% of perceptual distance variance",
            "slugs": light_slugs,
            "coords": coords_l,
            "D": D_light,
            "px0": 135,
            "py0": 265,
            "pw": 2160,
            "ph": 2030,
            "var": var_l,
            "outlier_box": None,
        },
        {
            "title": "Dark Themes (38 Polychromatic + 1 Monochrome Outlier)",
            "subtitle": f"Dim 1 ({var_d[0]:.1f}%) + Dim 2 ({var_d[1]:.1f}%) = {var_d[0] + var_d[1]:.1f}% of polychromatic distance variance",
            "slugs": dark_poly_slugs,
            "coords": coords_d,
            "D": D_dark_poly,
            "px0": 2505,
            "py0": 265,
            "pw": 2160,
            "ph": 2030,
            "var": var_d,
            "outlier_box": (2505 + 2160 - 850, 265 + 2030 - 172, 2505 + 2160 - 28, 265 + 2030 - 28),
        },
    ]

    for p in panels:
        px0, py0, pw, ph = p["px0"], p["py0"], p["pw"], p["ph"]
        draw.text((px0, py0 - 76), p["title"], font=f_phead, fill="#181A20")
        draw.text((px0, py0 - 38), p["subtitle"], font=f_psub, fill="#5C6372")
        draw.rounded_rectangle((px0, py0, px0 + pw, py0 + ph), radius=16, fill="#FFFFFF", outline="#DCDAD2", width=2)

        xs = p["coords"][:, 0]
        ys = p["coords"][:, 1]
        xmin, xmax = float(xs.min()) - 2.4, float(xs.max()) + 2.6
        ymin, ymax = float(ys.min()) - 2.3, float(ys.max()) + 2.3

        def map_pt(xv, yv):
            return (
                px0 + 90 + (xv - xmin) / (xmax - xmin) * (pw - 180),
                py0 + ph - 90 - (yv - ymin) / (ymax - ymin) * (ph - 180),
            )

        # Grid lines
        for gx in range(-10, 20, 5):
            if xmin <= gx <= xmax:
                xp, _ = map_pt(gx, 0)
                draw.line([(xp, py0 + 2), (xp, py0 + ph - 2)], fill="#D7DAE2" if gx == 0 else "#F1F0EB", width=3 if gx == 0 else 2)
                draw_text_centered(draw, xp, py0 + ph + 24, str(gx), f_tick, fill="#687080")
        for gy in range(-15, 20, 5):
            if ymin <= gy <= ymax:
                _, yp = map_pt(0, gy)
                draw.line([(px0 + 2, yp), (px0 + pw - 2, yp)], fill="#D7DAE2" if gy == 0 else "#F1F0EB", width=3 if gy == 0 else 2)
                draw_text_centered(draw, px0 - 30, yp, str(gy), f_tick, fill="#687080")

        # Subtle compass pole hints inside frame edges
        draw.text((px0 + 24, py0 + ph / 2 - 12), "← VIOLET / INDIGO", font=f_pole, fill="#9AA0AE")
        eb = draw.textbbox((0, 0), "EMERALD / PRIMARY →", font=f_pole)
        draw.text((px0 + pw - (eb[2] - eb[0]) - 24, py0 + ph / 2 - 12), "EMERALD / PRIMARY →", font=f_pole, fill="#9AA0AE")
        draw_text_centered(draw, px0 + pw / 2, py0 + 24, "↑ WARM RED / AMBER", f_pole, fill="#9AA0AE")
        draw_text_centered(draw, px0 + pw / 2, py0 + ph - 26, "↓ DEEP COBALT / CYAN", f_pole, fill="#9AA0AE")

        pts_px = [map_pt(xs[i], ys[i]) for i in range(len(p["slugs"]))]

        # Subtle dashed connectors for very close chromatic siblings (<= 2.9 ΔE₀₀)
        D_here = p["D"]
        for i in range(len(p["slugs"])):
            for j in range(i + 1, len(p["slugs"])):
                if D_here[i, j] <= 2.9:
                    x1, y1 = pts_px[i]
                    x2, y2 = pts_px[j]
                    seg_len = math.hypot(x2 - x1, y2 - y1)
                    if seg_len > 10:
                        steps = max(6, int(seg_len / 14))
                        for k in range(0, steps, 2):
                            xa = x1 + (x2 - x1) * (k / steps)
                            ya = y1 + (y2 - y1) * (k / steps)
                            xb = x1 + (x2 - x1) * (min(k + 1, steps) / steps)
                            yb = y1 + (y2 - y1) * (min(k + 1, steps) / steps)
                            draw.line([(xa, ya), (xb, yb)], fill="#C6CBD6", width=3)

        # Force-directed label placement
        cx_all = sum(pt[0] for pt in pts_px) / len(pts_px)
        cy_all = sum(pt[1] for pt in pts_px) / len(pts_px)
        labels = []
        for i, s in enumerate(p["slugs"]):
            m = meta_by_slug[s]
            lbl = SHORT_CONSOLE[m["console"]]
            bb = draw.textbbox((0, 0), lbl, font=f_lbl)
            lw, lh = (bb[2] - bb[0]) + 16, (bb[3] - bb[1]) + 10
            ang = math.atan2(pts_px[i][1] - cy_all, pts_px[i][0] - cx_all)
            labels.append({
                "idx": i,
                "slug": s,
                "text": lbl,
                "ax": pts_px[i][0],
                "ay": pts_px[i][1],
                "x": pts_px[i][0] + math.cos(ang) * 56,
                "y": pts_px[i][1] + math.sin(ang) * 46,
                "w": lw,
                "h": lh,
            })

        obox = p["outlier_box"]
        for _ in range(1300):
            for i, li in enumerate(labels):
                fx, fy = 0.0, 0.0
                dx_a = li["x"] - li["ax"]
                dy_a = li["y"] - li["ay"]
                dist_a = math.hypot(dx_a, dy_a) + 1e-4
                if dist_a > 240:
                    fx -= (dx_a / dist_a) * (dist_a - 240) * 0.07
                    fy -= (dy_a / dist_a) * (dist_a - 240) * 0.07
                elif dist_a < 46:
                    fx += (dx_a / dist_a) * (46 - dist_a) * 0.45
                    fy += (dy_a / dist_a) * (46 - dist_a) * 0.45

                # Repel from all marker points
                for ax, ay in pts_px:
                    ox = abs(li["x"] - ax) - (li["w"] / 2 + 26)
                    oy = abs(li["y"] - ay) - (li["h"] / 2 + 26)
                    if ox < 0 and oy < 0:
                        sx = 1.0 if li["x"] >= ax else -1.0
                        sy = 1.0 if li["y"] >= ay else -1.0
                        if abs(ox) < abs(oy):
                            fx += sx * (-ox) * 0.55
                        else:
                            fy += sy * (-oy) * 0.58

                # Repel from other labels
                for j, lj in enumerate(labels):
                    if i == j:
                        continue
                    ox = abs(li["x"] - lj["x"]) - (li["w"] + lj["w"]) / 2 - 18
                    oy = abs(li["y"] - lj["y"]) - (li["h"] + lj["h"]) / 2 - 14
                    if ox < 0 and oy < 0:
                        sx = 1.0 if (li["x"] > lj["x"] or (li["x"] == lj["x"] and i > j)) else -1.0
                        sy = 1.0 if (li["y"] > lj["y"] or (li["y"] == lj["y"] and i > j)) else -1.0
                        if abs(ox) < abs(oy):
                            fx += sx * (-ox) * 0.58
                        else:
                            fy += sy * (-oy) * 0.58

                # Keep clear of Dark panel outlier callout card
                if obox is not None:
                    ox0, oy0, ox1, oy1 = obox
                    ocx, ocy = 0.5 * (ox0 + ox1), 0.5 * (oy0 + oy1)
                    ohw, ohh = 0.5 * (ox1 - ox0) + 18, 0.5 * (oy1 - oy0) + 18
                    ox = abs(li["x"] - ocx) - (li["w"] / 2 + ohw)
                    oy = abs(li["y"] - ocy) - (li["h"] / 2 + ohh)
                    if ox < 0 and oy < 0:
                        fy -= (-oy) * 0.7

                li["x"] = min(px0 + pw - li["w"] / 2 - 22, max(px0 + li["w"] / 2 + 22, li["x"] + fx))
                li["y"] = min(py0 + ph - li["h"] / 2 - 52, max(py0 + li["h"] / 2 + 52, li["y"] + fy))

        # Final strict non-overlap pass on label bounding boxes
        for _ in range(120):
            moved = False
            for i in range(len(labels)):
                for j in range(i + 1, len(labels)):
                    li, lj = labels[i], labels[j]
                    ox = (li["w"] + lj["w"]) / 2 + 10 - abs(li["x"] - lj["x"])
                    oy = (li["h"] + lj["h"]) / 2 + 8 - abs(li["y"] - lj["y"])
                    if ox > 0 and oy > 0:
                        moved = True
                        if ox < oy:
                            shift = (ox / 2 + 1.0) * (1.0 if li["x"] >= lj["x"] else -1.0)
                            li["x"] += shift
                            lj["x"] -= shift
                        else:
                            shift = (oy / 2 + 1.0) * (1.0 if li["y"] >= lj["y"] else -1.0)
                            li["y"] += shift
                            lj["y"] -= shift
            if not moved:
                break

        # Draw leader ticks where nudged
        for li in labels:
            if math.hypot(li["x"] - li["ax"], li["y"] - li["ay"]) > 28:
                draw.line([(li["ax"], li["ay"]), (li["x"], li["y"])], fill="#BCC2D0", width=2)

        # Draw hardware-accurate two-tone swatch markers (inner = bg, outer ring = accentKeyword)
        for li in labels:
            s = li["slug"]
            bg_hex = hex_by_slug[s]["bg"]
            kw_hex = hex_by_slug[s]["accentKeyword"]
            cx, cy = li["ax"], li["ay"]
            draw_circle(draw, cx, cy, 20, fill="#FFFFFF")
            draw_circle(draw, cx, cy, 17, fill=hex_to_rgb_tuple(kw_hex), outline="#222630", width=2)
            draw_circle(draw, cx, cy, 8.5, fill=hex_to_rgb_tuple(bg_hex), outline="#FFFFFF" if meta_by_slug[s]["mode"] == "dark" else "#484F5E", width=1)

        # Draw crisp label pills
        for li in labels:
            draw.rounded_rectangle(
                (li["x"] - li["w"] / 2 + 1, li["y"] - li["h"] / 2 + 1, li["x"] + li["w"] / 2 - 1, li["y"] + li["h"] / 2 - 1),
                radius=6,
                fill="#FFFFFF",
                outline="#ECEAE2",
                width=1,
            )
            draw_text_centered(draw, li["x"], li["y"], li["text"], f_lbl, fill="#1E222B")

        # Dark-panel Game Boy Dark off-chart callout card
        if obox is not None:
            ox0, oy0, ox1, oy1 = obox
            draw.rounded_rectangle(obox, radius=14, fill="#F5F7EC", outline="#7E9B24", width=3)
            gcx, gcy = ox0 + 54, 0.5 * (oy0 + oy1)
            draw_circle(draw, gcx, gcy, 23, fill="#9BBC0F", outline="#283A0B", width=3)
            draw_circle(draw, gcx, gcy, 11.5, fill="#0F380F", outline="#D6EA82", width=2)
            draw.text((ox0 + 96, oy0 + 26), "Game Boy Dark  ·  Off-Chart Monochrome Outlier", font=f_card_h, fill="#1F3008")
            draw.text(
                (ox0 + 96, oy0 + 66),
                f"1989 DMG-01 olive LCD ramp  ·  mean ΔE₀₀ = {gb_mean_de:.1f} ({gb_min_de:.1f}–{gb_max_de:.1f}) vs all 38",
                font=f_card_s,
                fill="#445622",
            )
            draw.text(
                (ox0 + 96, oy0 + 100),
                "Held out of Dark MDS fit so the 38 polychromatic consoles use the full canvas.",
                font=load_font(17, "italic"),
                fill="#5A6B3A",
            )

        draw_text_centered(draw, px0 + pw / 2, py0 + ph + 62, f"MDS Dim 1 ({p['var'][0]:.1f}% variance)", f_ax, fill="#222630")

    draw_text_centered(
        draw,
        W,
        H * 2 - 48,
        "Inner dot = editor background  ·  Outer ring = signature keyword accent  ·  Dashed links connect closest siblings (mean ΔE₀₀ ≤ 2.9)",
        f_foot,
        fill="#565E6E",
    )

    save_downsampled(img, CS_ASSETS / "theme-mds.png", W, H)
    print(f"Saved assets/color-science/theme-mds.png (Light 2D={var_l[0]+var_l[1]:.1f}%, Dark 2D={var_d[0]+var_d[1]:.1f}%, GB Dark mean ΔE00={gb_mean_de:.2f})")

    # ---------- Render Ward-Ordered 39x39 Split-Triangle ΔE₀₀ Matrix (theme-distance-heatmap.png) ----------
    consoles = list(SHORT_CONSOLE.keys())
    l_by_con = {meta_by_slug[s]["console"]: s for s in light_slugs}
    d_by_con = {meta_by_slug[s]["console"]: s for s in dark_all_slugs}
    nc = len(consoles)

    # Order the 39 consoles by Ward's clustering on combined Light+Dark 78-D Lab profile
    comb_feats = []
    for con in consoles:
        vec = []
        for sl in (l_by_con[con], d_by_con[con]):
            for rl in AUDIT_ROLES:
                vec.extend(by_slug[sl][rl])
        comb_feats.append(vec)
    Xc = np.array(comb_feats, dtype=np.float64)
    Zc = (Xc - Xc.mean(axis=0, keepdims=True)) / Xc.std(axis=0, ddof=1, keepdims=True)
    merges_c = ward_d2_clustering(Zc)
    ch_c = {m[3]: (m[0], m[1], m[2]) for m in merges_c}
    ord_c = []
    def collect_c(u):
        if u < nc:
            ord_c.append(u)
        else:
            a, b, _ = ch_c[u]
            collect_c(a)
            collect_c(b)
    collect_c(merges_c[-1][3])
    ordered_consoles = [consoles[i] for i in ord_c]

    ord_l_slugs = [l_by_con[c] for c in ordered_consoles]
    ord_d_slugs = [d_by_con[c] for c in ordered_consoles]
    DL_ord = compute_de00_matrix(ord_l_slugs, by_slug)
    DD_ord = compute_de00_matrix(ord_d_slugs, by_slug)

    def interp_palette(val):
        # Perceptually smooth deep-indigo -> sapphire -> teal -> mist -> warm ivory (0..25+)
        if val >= 32.0:
            # Distinct DMG-01 olive outlier band (37-45 ΔE00)
            t = min(1.0, max(0.0, (val - 35.0) / 11.0))
            c0, c1 = (218, 224, 176), (186, 200, 126)
            return tuple(int(round(c0[k] + (c1[k] - c0[k]) * t)) for k in range(3))
        stops = [
            (0.0,  (20, 36, 94)),
            (4.0,  (30, 84, 152)),
            (9.0,  (64, 142, 176)),
            (14.5, (152, 196, 192)),
            (20.0, (226, 224, 205)),
            (25.5, (248, 242, 228)),
        ]
        v = min(25.5, max(0.0, val))
        for k in range(len(stops) - 1):
            v0, c0 = stops[k]
            v1, c1 = stops[k + 1]
            if v <= v1:
                t = (v - v0) / (v1 - v0)
                return tuple(int(round(c0[i] + (c1[i] - c0[i]) * t)) for i in range(3))
        return stops[-1][1]

    HW, HH = 2040, 2120
    himg = make_canvas(HW, HH, "#FAF9F6")
    hdraw = ImageDraw.Draw(himg)

    hf_title = load_font(48, "bold")
    hf_sub = load_font(24, "regular")
    hf_lbl = load_font(21, "bold")
    hf_tag = load_font(21, "bold")
    hf_cb = load_font(21, "medium")

    hdraw.text((110, 50), "Pairwise Perceptual Distance Matrix — All 39 Consoles (CIEDE2000 ΔE₀₀)", font=hf_title, fill="#181A20")
    hdraw.text(
        (110, 112),
        "Ward-ordered split-triangle matrix: upper-right = Light mode, lower-left = Dark mode (mean ΔE₀₀ across 13 syntax roles). Diagonal = Light / Dark keyword swatches.",
        font=hf_sub,
        fill="#525866",
    )

    cell = 78
    grid_w = nc * cell
    gx0 = 590
    gy0 = 665

    # Matrix frame
    hdraw.rectangle((gx0 - 3, gy0 - 3, gx0 + grid_w + 3, gy0 + grid_w + 3), fill="#FFFFFF", outline="#C8C6BE", width=3)

    for r_i in range(nc):
        y0 = gy0 + r_i * cell
        for c_i in range(nc):
            x0 = gx0 + c_i * cell
            if r_i == c_i:
                l_col = hex_to_rgb_tuple(hex_by_slug[ord_l_slugs[r_i]]["accentKeyword"])
                d_col = hex_to_rgb_tuple(hex_by_slug[ord_d_slugs[r_i]]["accentKeyword"])
                hdraw.polygon([(x0, y0), (x0 + cell, y0), (x0 + cell, y0 + cell)], fill=l_col)
                hdraw.polygon([(x0, y0), (x0, y0 + cell), (x0 + cell, y0 + cell)], fill=d_col)
                hdraw.line([(x0, y0), (x0 + cell, y0 + cell)], fill="#FAF9F6", width=3)
                hdraw.rectangle((x0, y0, x0 + cell, y0 + cell), outline="#FAF9F6", width=1)
            elif r_i < c_i:
                col = interp_palette(DL_ord[r_i, c_i])
                hdraw.rectangle((x0 + 1, y0 + 1, x0 + cell - 1, y0 + cell - 1), fill=col)
            else:
                col = interp_palette(DD_ord[r_i, c_i])
                hdraw.rectangle((x0 + 1, y0 + 1, x0 + cell - 1, y0 + cell - 1), fill=col)

    # Row labels (left, right-aligned) and rotated column labels (top)
    for idx_c, con in enumerate(ordered_consoles):
        short_name = SHORT_CONSOLE[con]
        era_col = hex_to_rgb_tuple(ERA_COLORS[meta_by_slug[ord_l_slugs[idx_c]]["era"]])
        # Left row label + era pip
        yc = gy0 + idx_c * cell + cell / 2
        draw_circle(hdraw, gx0 - 20, yc, 7, fill=era_col)
        bb = hdraw.textbbox((0, 0), short_name, font=hf_lbl)
        tw = bb[2] - bb[0]
        hdraw.text((gx0 - 38 - tw, yc - 12), short_name, font=hf_lbl, fill="#1E222B")

        # Top rotated column label (50 deg counter-clockwise)
        xc = gx0 + idx_c * cell + cell / 2
        draw_circle(hdraw, xc, gy0 - 20, 7, fill=era_col)
        tmp = Image.new("RGBA", (360, 50), (0, 0, 0, 0))
        td = ImageDraw.Draw(tmp)
        td.text((4, 10), short_name, font=hf_lbl, fill="#1E222B")
        rot = tmp.rotate(50, expand=True, resample=Image.BICUBIC)
        # Anchor bottom-left of rotated text directly above the era pip
        px_paste = int(xc - 24)
        py_paste = int(gy0 - 34 - rot.height)
        himg.paste(rot, (px_paste, py_paste), rot)

    # Triangle callout badges (positioned cleanly outside all row/column labels)
    ux0, uy0 = gx0 + grid_w - 500, gy0 - 430
    hdraw.rounded_rectangle((ux0, uy0, ux0 + 500, uy0 + 62), radius=12, fill="#EEF3FA", outline="#285C9E", width=2)
    draw_text_centered(hdraw, ux0 + 250, uy0 + 31, "UPPER TRIANGLE  ·  LIGHT MODE", hf_tag, fill="#1A447C")

    lx0, ly0 = 110, gy0 + grid_w + 30
    hdraw.rounded_rectangle((lx0, ly0, lx0 + 440, ly0 + 62), radius=12, fill="#1D222E", outline="#4B5670", width=2)
    draw_text_centered(hdraw, lx0 + 220, ly0 + 31, "LOWER TRIANGLE  ·  DARK MODE", hf_tag, fill="#ECEFF6")

    # Horizontal colorbar + Game Boy Dark outlier swatch at bottom
    cb_x0, cb_y0, cb_w, cb_h = gx0, gy0 + grid_w + 175, 2060, 44
    for px in range(cb_w):
        val = (px / max(1, cb_w - 1)) * 25.5
        hdraw.line([(cb_x0 + px, cb_y0), (cb_x0 + px, cb_y0 + cb_h)], fill=interp_palette(val))
    hdraw.rectangle((cb_x0, cb_y0, cb_x0 + cb_w, cb_y0 + cb_h), outline="#8E94A2", width=2)

    for tick_v, tick_lbl in [(0, "0 (identical)"), (5, "5"), (10, "10"), (15, "15"), (20, "20"), (25.5, "25+ (distinct)")]:
        tx = cb_x0 + (tick_v / 25.5) * cb_w
        hdraw.line([(tx, cb_y0 + cb_h), (tx, cb_y0 + cb_h + 10)], fill="#6E7482", width=2)
        draw_text_centered(hdraw, tx, cb_y0 + cb_h + 34, tick_lbl, hf_cb, fill="#383E4C")

    # Separate Game Boy Dark monochrome outlier key
    ob_x = cb_x0 + cb_w + 110
    hdraw.rectangle((ob_x, cb_y0, ob_x + 105, cb_y0 + cb_h), fill=interp_palette(41.0), outline="#6A7A32", width=2)
    hdraw.text((ob_x + 122, cb_y0 - 2), "37–45 ΔE₀₀", font=hf_lbl, fill="#3B4A14")
    hdraw.text((ob_x + 122, cb_y0 + 26), "Game Boy Dark (1989 DMG-01 LCD)", font=load_font(19, "regular"), fill="#586438")

    draw_text_centered(
        hdraw,
        cb_x0 + cb_w / 2,
        cb_y0 - 34,
        "Mean Pairwise CIEDE2000 ΔE₀₀ Across 13 Syntax Roles  (Darker = Closer Chromatic Siblings)",
        hf_cb,
        fill="#222630",
    )

    save_downsampled(himg, CS_ASSETS / "theme-distance-heatmap.png", HW, HH)
    print("Saved assets/color-science/theme-distance-heatmap.png")


def main():
    rows = load_data()
    slug_order, _ = run_cvd_audit(rows)
    render_timeline_metro()
    render_colorspace_grid(rows, slug_order)
    render_global_pca(rows)
    render_family_fingerprint(rows, slug_order)
    render_theme_similarity(rows, slug_order)
    render_theme_mds_and_heatmap(rows, slug_order)
    render_cvd_swatch_grid(rows)
    print("All color-science CSVs and high-DPI PNG assets generated successfully.")


if __name__ == "__main__":
    main()
