#!/usr/bin/env python3
"""
Programmatically renders the original Console Palette extension icon (`icon.png`,
256x256 RGBA, 4x supersampled from 1024x1024) as a vertically split, 3D-beveled
Light & Dark minimalist gamepad crest:
  - Left half (Light): warm sculpted console-shell alabaster with a precision
    chamfered graphite D-pad cross
  - Right half (Dark): deep faceted midnight obsidian-indigo with four beveled
    jewel face buttons in the universal console chromatic quartet (Emerald,
    Crimson-Coral, Sapphire-Cyan, and Amber-Gold)

100% algorithmic SDF geometry (NumPy + Pillow) — zero copied logos or artwork.
Run with: python3 scripts/generate-icon.py
"""

import math
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PATH = os.path.join(ROOT, "icon.png")

SIZE = 1024
FINAL_SIZE = 256


def sd_rounded_box(xs, ys, cx, cy, hx, hy, r):
    """Exact signed distance to an axis-aligned rounded rectangle (negative inside)."""
    px = np.abs(xs - cx) - (hx - r)
    py = np.abs(ys - cy) - (hy - r)
    qx = np.maximum(px, 0.0)
    qy = np.maximum(py, 0.0)
    return np.hypot(qx, qy) + np.minimum(np.maximum(px, py), 0.0) - r


def sd_circle(xs, ys, cx, cy, r):
    return np.hypot(xs - cx, ys - cy) - r


def sd_gamepad_body(xs, ys):
    """
    Smooth union of a sculpted classic gamepad body: central pill + twin ergonomic
    lower rounded handles so the icon reads immediately as a controller at 42px.
    """
    cx, cy = SIZE * 0.5, SIZE * 0.48
    # Main horizontal deck
    d_deck = sd_rounded_box(xs, ys, cx, cy - 28.0, 412.0, 224.0, 198.0)
    # Left & right contoured shoulder/grip lobes
    d_left = sd_circle(xs, ys, cx - 236.0, cy + 72.0, 206.0)
    d_right = sd_circle(xs, ys, cx + 236.0, cy + 72.0, 206.0)
    # Smooth min (polynomial smin) for clean ergonomic contour
    k = 64.0
    h1 = np.clip(0.5 + 0.5 * (d_left - d_deck) / k, 0.0, 1.0)
    d1 = d_left * (1.0 - h1) + d_deck * h1 - k * h1 * (1.0 - h1)
    h2 = np.clip(0.5 + 0.5 * (d_right - d1) / k, 0.0, 1.0)
    d2 = d_right * (1.0 - h2) + d1 * h2 - k * h2 * (1.0 - h2)
    return d2


def compute_normal(dist_field):
    gy, gx = np.gradient(dist_field)
    mag = np.hypot(gx, gy) + 1e-6
    return gx / mag, gy / mag


def shade_surface(xs, ys, dist, palette, noise, light_dir=(-0.58, -0.81), bevel_w=38.0):
    nx, ny = compute_normal(dist)
    lx, ly = light_dir
    cx, cy = SIZE * 0.5, SIZE * 0.5

    # Directional planar sheen across the flat face
    proj = ((xs - cx) * lx + (ys - cy) * ly) / 680.0
    proj = np.clip(proj * 0.5 + 0.5, 0.0, 1.0)

    c_shadow = np.array(palette["shadow"], dtype=np.float32)
    c_mid = np.array(palette["mid"], dtype=np.float32)
    c_high = np.array(palette["high"], dtype=np.float32)
    c_spec = np.array(palette["spec"], dtype=np.float32)
    c_rim = np.array(palette["rim_dark"], dtype=np.float32)

    t_low = np.clip(proj * 2.0, 0.0, 1.0)[..., None]
    t_hi = np.clip((proj - 0.5) * 2.0, 0.0, 1.0)[..., None]
    face_rgb = np.where(
        proj[..., None] < 0.5,
        c_shadow * (1.0 - t_low) + c_mid * t_low,
        c_mid * (1.0 - t_hi) + c_high * t_hi,
    )
    face_rgb = face_rgb + (noise[..., None] - 0.5) * palette["grain"]

    # Chamfered bevel along boundary
    edge_dot = nx * lx + ny * ly  # outward normal dot light
    bevel_t = np.clip(edge_dot * 0.5 + 0.5, 0.0, 1.0)[..., None]
    bevel_rgb = np.where(
        bevel_t > 0.55,
        c_high * (1.0 - (bevel_t - 0.55) / 0.45) + c_spec * ((bevel_t - 0.55) / 0.45),
        c_rim * (1.0 - bevel_t / 0.55) + c_mid * (bevel_t / 0.55),
    )
    bevel_rgb = bevel_rgb + (noise[..., None] - 0.5) * (palette["grain"] * 0.6)

    in_dist = np.maximum(-dist, 0.0)
    in_bevel = in_dist < bevel_w
    ridge = np.exp(-((in_dist - bevel_w) / (bevel_w * 0.22)) ** 2) * 0.14

    rgb = np.where(in_bevel[..., None], bevel_rgb, face_rgb)
    rgb = rgb + ridge[..., None] * (bevel_t - 0.35)

    # Crisp hairline rim for separation on both Light & Dark IDE sidebars
    outer_rim = in_dist < 8.0
    rim_mix = np.where((edge_dot > 0.05)[..., None], c_spec * 0.8 + c_high * 0.2, c_rim * 0.92)
    rgb = np.where(outer_rim[..., None], rgb * 0.3 + rim_mix * 0.7, rgb)
    return np.clip(rgb, 0.0, 1.0)


def draw_jewel_button(canvas, xs, ys, cx, cy, r, base_rgb, light_dir=(-0.58, -0.81)):
    dx = xs - cx
    dy = ys - cy
    dist = np.hypot(dx, dy)
    inside = dist <= r
    # Recessed dark bezel ring around button
    ring = (dist > r) & (dist <= r + 11.0)
    canvas[ring, :3] = canvas[ring, :3] * 0.38
    if not np.any(inside):
        return

    # Spherical dome normal
    nx = np.clip(dx / r, -1.0, 1.0)
    ny = np.clip(dy / r, -1.0, 1.0)
    nz = np.sqrt(np.maximum(0.0, 1.0 - nx * nx - ny * ny))

    lx, ly, lz = light_dir[0] * 0.65, light_dir[1] * 0.65, 0.76
    ln = math.sqrt(lx * lx + ly * ly + lz * lz)
    lx, ly, lz = lx / ln, ly / ln, lz / ln

    ndotl = np.clip(nx * lx + ny * ly + nz * lz, 0.0, 1.0)
    # Blinn-Phong glossy specular glint
    hx, hy, hz = lx, ly, lz + 1.0
    hn = math.sqrt(hx * hx + hy * hy + hz * hz)
    spec = np.power(np.clip((nx * hx + ny * hy + nz * hz) / hn, 0.0, 1.0), 28.0)

    col = np.array(base_rgb, dtype=np.float32)
    shaded = col * (0.42 + 0.72 * ndotl[..., None]) + np.array([1.0, 1.0, 1.0], dtype=np.float32) * (0.58 * spec[..., None])
    # Subtle inner rim darkening
    edge_fade = np.clip((r - dist) / (r * 0.16), 0.0, 1.0)[..., None]
    shaded = shaded * (0.68 + 0.32 * edge_fade)
    shaded = np.clip(shaded, 0.0, 1.0)

    # Anti-aliased boundary
    aa = np.clip((r - dist) * 0.65 + 0.5, 0.0, 1.0)[..., None]
    mask = dist <= r + 1.5
    canvas[mask, :3] = canvas[mask, :3] * (1.0 - aa[mask]) + shaded[mask] * aa[mask]


def build_icon():
    ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)

    # Deterministic brushed micro-grain
    rng = np.random.default_rng(1977)
    coarse = rng.random((SIZE // 4, SIZE // 4), dtype=np.float32)
    fine = rng.random((SIZE, SIZE), dtype=np.float32)
    coarse_up = np.array(
        Image.fromarray((coarse * 255).astype(np.uint8)).resize((SIZE, SIZE), Image.Resampling.BILINEAR),
        dtype=np.float32,
    ) / 255.0
    noise = coarse_up * 0.65 + fine * 0.35

    body_sdf = sd_gamepad_body(xs, ys)

    # Classic console shell Light palette (warm SNES/PS1/Wii alabaster-ivory)
    light_shell = {
        "spec": (1.00, 0.99, 0.96),
        "high": (0.94, 0.92, 0.87),
        "mid": (0.85, 0.83, 0.78),
        "shadow": (0.68, 0.66, 0.62),
        "rim_dark": (0.44, 0.43, 0.42),
        "grain": 0.045,
    }

    # Midnight console chassis Dark palette (PS2/GameCube/Steam Deck obsidian-indigo)
    dark_shell = {
        "spec": (0.52, 0.60, 0.82),
        "high": (0.24, 0.28, 0.40),
        "mid": (0.13, 0.16, 0.24),
        "shadow": (0.07, 0.09, 0.15),
        "rim_dark": (0.04, 0.05, 0.09),
        "grain": 0.055,
    }

    # Slight stylish diagonal split (tilted 8 degrees) across center for dynamic Light/Dark contrast
    seam_x = SIZE * 0.5 + (ys - SIZE * 0.5) * 0.14
    is_left = xs < seam_x
    seam_dist = np.abs(xs - seam_x)

    rgb_light = shade_surface(xs, ys, body_sdf, light_shell, noise)
    rgb_dark = shade_surface(xs, ys, body_sdf, dark_shell, noise)
    body_rgb = np.where(is_left[..., None], rgb_light, rgb_dark)

    # Crisp split-horizon bevel groove along the Light/Dark seam
    seam_groove = (seam_dist < 7.0) & (body_sdf < 0.0)
    seam_hi_l = (xs >= seam_x - 13.0) & (xs < seam_x - 6.0) & (body_sdf < -12.0)
    seam_hi_r = (xs > seam_x + 6.0) & (xs <= seam_x + 13.0) & (body_sdf < -12.0)
    body_rgb[seam_groove] *= 0.35
    body_rgb[seam_hi_l] = np.clip(body_rgb[seam_hi_l] * 0.88, 0.0, 1.0)
    body_rgb[seam_hi_r] = np.clip(body_rgb[seam_hi_r] + 0.10, 0.0, 1.0)

    # Anti-aliased outer body alpha
    body_alpha = np.clip(-body_sdf * 0.65 + 0.5, 0.0, 1.0)

    canvas = np.zeros((SIZE, SIZE, 4), dtype=np.float32)
    canvas[..., :3] = body_rgb
    canvas[..., 3] = body_alpha

    # --- Left half: 3D-beveled precision D-pad cross ---
    dpad_cx, dpad_cy = SIZE * 0.5 - 224.0, SIZE * 0.485
    d_horiz = sd_rounded_box(xs, ys, dpad_cx, dpad_cy, 118.0, 42.0, 16.0)
    d_vert = sd_rounded_box(xs, ys, dpad_cx, dpad_cy, 42.0, 118.0, 16.0)
    d_dpad = np.minimum(d_horiz, d_vert)

    # Recessed well shadow under D-pad
    dpad_well = (d_dpad >= 0.0) & (d_dpad < 16.0) & (body_sdf < -18.0)
    canvas[dpad_well, :3] *= 0.62

    dpad_palette = {
        "spec": (0.52, 0.56, 0.64),
        "high": (0.31, 0.34, 0.40),
        "mid": (0.20, 0.22, 0.27),
        "shadow": (0.12, 0.13, 0.17),
        "rim_dark": (0.06, 0.07, 0.10),
        "grain": 0.04,
    }
    dpad_rgb = shade_surface(xs, ys, d_dpad, dpad_palette, noise, bevel_w=16.0)
    dpad_aa = np.clip(-d_dpad * 0.65 + 0.5, 0.0, 1.0)[..., None]
    dpad_mask = d_dpad < 2.0
    canvas[dpad_mask, :3] = canvas[dpad_mask, :3] * (1.0 - dpad_aa[dpad_mask]) + dpad_rgb[dpad_mask] * dpad_aa[dpad_mask]

    # Subtle concave center pivot dimple in the D-pad
    dimple_r = np.hypot(xs - dpad_cx, ys - dpad_cy)
    dimple = dimple_r < 24.0
    dimple_shade = 0.78 + 0.22 * (dimple_r / 24.0)
    canvas[dimple, :3] *= dimple_shade[dimple, None]

    # --- Right half: 4 iconic jewel-beveled face buttons ---
    btn_cx, btn_cy = SIZE * 0.5 + 226.0, SIZE * 0.485
    btn_off = 82.0
    btn_r = 44.0
    buttons = [
        (btn_cx, btn_cy - btn_off, (0.18, 0.88, 0.56)),  # Top: Emerald (Triangle / A / Xbox)
        (btn_cx + btn_off, btn_cy, (0.98, 0.28, 0.36)),  # Right: Crimson-Coral (Circle / NES / Switch Red)
        (btn_cx, btn_cy + btn_off, (0.20, 0.66, 1.00)),  # Bottom: Sapphire-Cyan (Cross / Switch Blue / PS5)
        (btn_cx - btn_off, btn_cy, (0.98, 0.78, 0.16)),  # Left: Amber-Gold (C-stick / Neo Geo / 16-BIT)
    ]
    for bx, by, col in buttons:
        draw_jewel_button(canvas, xs, ys, bx, by, btn_r, col)

    # --- Subtle center Select/Start LED indicator pills ---
    for px, py, col in [
        (SIZE * 0.5 - 46.0, SIZE * 0.565, (0.48, 0.50, 0.56)),
        (SIZE * 0.5 + 42.0, SIZE * 0.565, (0.30, 0.86, 0.96)),
    ]:
        d_pill = sd_rounded_box(xs, ys, px, py, 24.0, 9.0, 9.0)
        pmask = d_pill < 1.5
        paa = np.clip(-d_pill * 0.65 + 0.5, 0.0, 1.0)[..., None]
        canvas[pmask, :3] = canvas[pmask, :3] * (1.0 - paa[pmask]) + np.array(col, dtype=np.float32) * paa[pmask]

    fg_img = Image.fromarray((np.clip(canvas, 0.0, 1.0) * 255).astype(np.uint8), mode="RGBA")

    # Subtle ambient contact shadow for universal Light/Dark sidebar readability
    alpha_ch = fg_img.split()[3]
    shadow_alpha = alpha_ch.filter(ImageFilter.GaussianBlur(radius=16))
    shadow_arr = np.array(shadow_alpha, dtype=np.float32) * 0.28
    shadow_rgba = np.zeros((SIZE, SIZE, 4), dtype=np.uint8)
    shadow_rgba[..., 0] = 10
    shadow_rgba[..., 1] = 12
    shadow_rgba[..., 2] = 22
    shadow_rgba[..., 3] = np.clip(shadow_arr, 0, 255).astype(np.uint8)
    shadow_img = Image.fromarray(shadow_rgba, mode="RGBA")

    composed = Image.alpha_composite(shadow_img, fg_img)
    final = composed.resize((FINAL_SIZE, FINAL_SIZE), Image.Resampling.LANCZOS)
    final.save(OUT_PATH, optimize=True)
    print(f"Generated {OUT_PATH} ({FINAL_SIZE}x{FINAL_SIZE}, {os.path.getsize(OUT_PATH)} bytes)")


if __name__ == "__main__":
    build_icon()
