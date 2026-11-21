# Console Palette -- color science analysis
#
# Quantifies all 60 themes' palettes: a global PCA of the whole family's
# color space, per-theme colorspace diagrams (dots + connecting lines in
# the CIE a*-b* chroma/hue plane), and a color-vision-deficiency (CVD)
# distinguishability audit -- flagging any theme where two syntax-adjacent
# roles become too close together under simulated protanopia, deuteranopia,
# or tritanopia.
#
# Run from the repo root with: Rscript --vanilla analysis/color_science.R

source("analysis/color_math.R")
library(dplyr)
library(tidyr)
library(ggplot2)

dir.create("analysis/plots", showWarnings = FALSE, recursive = TRUE)
dir.create("assets/color-science", showWarnings = FALSE, recursive = TRUE)

ERA_ORDER <- c(
  "Atari 2600", "NES", "Sega Master System", "Game Boy",
  "TurboGrafx-16", "Sega Genesis", "SNES", "Neo Geo AES",
  "Sega Saturn", "PlayStation", "Nintendo 64", "Game Boy Color",
  "Sega Dreamcast", "PlayStation 2", "Game Boy Advance", "Nintendo GameCube", "Xbox",
  "Nintendo DS", "PlayStation Portable", "Xbox 360", "Nintendo Wii", "PlayStation 3", "Nintendo 3DS", "PlayStation Vita",
  "PlayStation 4", "Xbox One", "Nintendo Switch", "PlayStation 5", "Xbox Series X|S", "Steam Deck"
)

ERA_COLORS <- c(
  "8-bit Pioneers" = "#A86910",
  "16-bit Golden Age" = "#C22A3C",
  "32/64-bit Polygon Era" = "#743AC2",
  "128-bit & Millennial Classics" = "#1456B8",
  "HD, Motion & Portable Era" = "#0C8288",
  "Modern, Hybrid & Portable PC" = "#178246"
)

POLYGON_ROLES <- c(
  "accentKeyword", "accentStorage", "accentString", "accentRegex",
  "accentFunction", "accentType", "accentInterface", "accentNumber",
  "accentDecorator", "accentNamespace"
)
AUDIT_ROLES <- c(
  "accentKeyword", "accentStorage", "accentString", "accentRegex",
  "accentFunction", "accentFunctionDim", "accentType", "accentInterface",
  "accentNumber", "accentDecorator", "accentNamespace", "colorError", "colorWarning"
)

raw <- read.csv("analysis/data/colors.csv", stringsAsFactors = FALSE)
lab <- srgb_to_lab(raw$hex)
data <- bind_cols(raw, lab[, c("L", "a", "b")]) %>%
  mutate(console = factor(console, levels = ERA_ORDER))

cat(sprintf("Loaded %d color rows across %d themes.\n", nrow(data), length(unique(data$theme_slug))))

pca_input <- data %>% filter(role_kind == "syntax")
pca <- prcomp(pca_input[, c("L", "a", "b")], center = TRUE, scale. = FALSE)
pca_df <- bind_cols(pca_input, as.data.frame(pca$x[, 1:2]))
var_explained <- round(100 * pca$sdev^2 / sum(pca$sdev^2), 1)

p_pca <- ggplot(pca_df, aes(PC1, PC2, color = role, shape = mode)) +
  geom_point(size = 2.0, alpha = 0.75) +
  scale_shape_manual(values = c(light = 21, dark = 19)) +
  labs(
    title = "Global PCA of syntax-role colors across all 60 themes (CIE Lab space)",
    subtitle = sprintf("PC1 explains %.1f%% of variance, PC2 %.1f%% -- unscaled Lab", var_explained[1], var_explained[2]),
    x = sprintf("PC1 (%.1f%%)", var_explained[1]), y = sprintf("PC2 (%.1f%%)", var_explained[2]),
    color = "Syntax role", shape = "Mode"
  ) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "right")

ggsave("analysis/plots/pca_global.png", p_pca, width = 10, height = 7, dpi = 150)
cat("Saved analysis/plots/pca_global.png\n")
