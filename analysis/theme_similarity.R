# Console Palette -- per-theme 39-D similarity PCA & Ward's hierarchical clustering
#
# Run from the repo root with: Rscript --vanilla analysis/theme_similarity.R

source("analysis/color_math.R")
library(dplyr)
library(tidyr)
library(ggplot2)
library(ggrepel)

dir.create("assets/color-science", showWarnings = FALSE, recursive = TRUE)

ERA_COLORS <- c(
  "8-bit Pioneers" = "#A86910",
  "16-bit Golden Age" = "#C22A3C",
  "32/64-bit Polygon Era" = "#743AC2",
  "128-bit & Millennial Classics" = "#1456B8",
  "HD, Motion & Portable Era" = "#0C8288",
  "Modern, Hybrid & Portable PC" = "#178246"
)

ROLE_ORDER <- c(
  "accentKeyword", "accentStorage", "accentString", "accentRegex",
  "accentFunction", "accentFunctionDim", "accentType", "accentInterface",
  "accentNumber", "accentDecorator", "accentNamespace", "colorError", "colorWarning"
)

raw <- read.csv("analysis/data/colors.csv", stringsAsFactors = FALSE) %>%
  filter(role %in% ROLE_ORDER)
lab <- srgb_to_lab(raw$hex)
data <- bind_cols(raw, lab[, c("L", "a", "b")])

wide <- data %>%
  select(theme_slug, console, maker, era, mode, year, role, L, a, b) %>%
  pivot_wider(names_from = role, values_from = c(L, a, b), names_glue = "{role}_{.value}")

feature_cols <- as.vector(t(outer(ROLE_ORDER, c("L", "a", "b"), paste, sep = "_")))
stopifnot(all(feature_cols %in% names(wide)))
feature_matrix <- as.matrix(wide[, feature_cols])
rownames(feature_matrix) <- wide$theme_slug

cat(sprintf("Built a %d theme x %d feature matrix (13 syntax roles x L/a/b).\n", nrow(feature_matrix), ncol(feature_matrix)))

meta <- wide %>%
  select(theme_slug, console, maker, era, mode, year) %>%
  mutate(era = factor(era, levels = names(ERA_COLORS)), label = paste(console, mode))

pca <- prcomp(feature_matrix, center = TRUE, scale. = TRUE)
var_explained <- round(100 * pca$sdev^2 / sum(pca$sdev^2), 1)

pca_df <- bind_cols(meta, as.data.frame(pca$x[, 1:4]))
write.csv(pca_df %>% select(theme_slug, console, maker, mode, era, PC1, PC2, PC3, PC4), "analysis/data/theme-pca.csv", row.names = FALSE)

p_pca <- ggplot(pca_df, aes(PC1, PC2, color = era, shape = mode, label = label)) +
  geom_hline(yintercept = 0, color = "grey85") +
  geom_vline(xintercept = 0, color = "grey85") +
  geom_point(size = 2.8) +
  scale_color_manual(values = ERA_COLORS) +
  scale_shape_manual(values = c(light = 16, dark = 17)) +
  ggrepel::geom_text_repel(size = 2.6, max.overlaps = 40, seed = 1, segment.size = 0.3, segment.color = "grey70") +
  labs(
    title = "Which console themes look like each other? A per-theme 39-D PCA",
    subtitle = sprintf("60 themes × 13 syntax roles in CIE Lab (scaled) -- PC1 %.1f%%, PC2 %.1f%% of variance.", var_explained[1], var_explained[2]),
    x = sprintf("PC1 (%.1f%%)", var_explained[1]), y = sprintf("PC2 (%.1f%%)", var_explained[2]),
    color = "Hardware Era", shape = "Mode"
  ) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "right")

ggsave("assets/color-science/theme-pca.png", p_pca, width = 13, height = 9.5, dpi = 150)
cat("Saved assets/color-science/theme-pca.png\n")
