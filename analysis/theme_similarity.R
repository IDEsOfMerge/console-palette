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
  "Modern, Hybrid & Portable PC" = "#178246",
  "Next-Gen & Spatial Era" = "#B43072"
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
    subtitle = sprintf("%d themes × 13 syntax roles in CIE Lab (scaled) -- PC1 %.1f%%, PC2 %.1f%% of variance.", nrow(feature_matrix), var_explained[1], var_explained[2]),
    x = sprintf("PC1 (%.1f%%)", var_explained[1]), y = sprintf("PC2 (%.1f%%)", var_explained[2]),
    color = "Hardware Era", shape = "Mode"
  ) +
  theme_minimal(base_size = 12) +
  theme(legend.position = "right")

ggsave("assets/color-science/theme-pca.png", p_pca, width = 13, height = 9.5, dpi = 150)
cat("Saved assets/color-science/theme-pca.png\n")

# ---------- Per-Mode CIEDE2000 Classical MDS & Split-Triangle Heatmap ----------

compute_de00_matrix <- function(slugs, df_lab) {
  n <- length(slugs)
  D <- matrix(0, nrow = n, ncol = n, dimnames = list(slugs, slugs))
  split_lab <- lapply(slugs, function(s) {
    sub <- df_lab[df_lab$theme_slug == s, ]
    sub[match(ROLE_ORDER, sub$role), c("L", "a", "b")]
  })
  for (i in seq_len(n - 1)) {
    for (j in seq(i + 1, n)) {
      d <- mean(delta_e00(split_lab[[i]], split_lab[[j]]))
      D[i, j] <- d
      D[j, i] <- d
    }
  }
  D
}

mds_results <- list()
for (mode_name in c("light", "dark")) {
  mode_meta <- meta %>% filter(mode == mode_name)
  all_slugs <- mode_meta$theme_slug
  poly_slugs <- setdiff(all_slugs, "gameboy-dark")

  D_all <- compute_de00_matrix(all_slugs, data)
  D_poly <- D_all[poly_slugs, poly_slugs, drop = FALSE]
  fit <- cmdscale(D_poly, k = 2, eig = TRUE)
  pos_sum <- sum(pmax(fit$eig, 0))
  v1 <- round(100 * fit$eig[1] / pos_sum, 1)
  v2 <- round(100 * fit$eig[2] / pos_sum, 1)
  pts <- fit$points
  if (pts[paste0("xbox-", mode_name), 1] < 0) pts[, 1] <- -pts[, 1]
  if (pts[paste0("nes-", mode_name), 2] < 0) pts[, 2] <- -pts[, 2]

  mds_df <- mode_meta %>%
    mutate(
      mds1 = ifelse(theme_slug %in% poly_slugs, pts[match(theme_slug, poly_slugs), 1], NA_real_),
      mds2 = ifelse(theme_slug %in% poly_slugs, pts[match(theme_slug, poly_slugs), 2], NA_real_),
      is_outlier = theme_slug == "gameboy-dark",
      panel_label = sprintf("%s Themes (Dim 1 %.1f%% + Dim 2 %.1f%% = %.1f%%)",
                            tools::toTitleCase(mode_name), v1, v2, v1 + v2)
    )
  mds_results[[mode_name]] <- list(df = mds_df, D_all = D_all, v1 = v1, v2 = v2)
}

mds_all_df <- bind_rows(mds_results$light$df, mds_results$dark$df) %>%
  left_join(data %>% filter(role == "accentKeyword") %>% select(theme_slug, kw_hex = hex), by = "theme_slug")

p_mds <- ggplot(mds_all_df %>% filter(!is_outlier), aes(mds1, mds2, label = console)) +
  geom_hline(yintercept = 0, color = "grey85", linetype = "dashed") +
  geom_vline(xintercept = 0, color = "grey85", linetype = "dashed") +
  geom_point(aes(color = kw_hex), size = 3.4) +
  scale_color_identity() +
  ggrepel::geom_text_repel(size = 2.7, max.overlaps = 40, seed = 1, segment.color = "grey75") +
  facet_wrap(~panel_label, scales = "free") +
  labs(
    title = "Perceptual Similarity Landscape -- Classical MDS on CIEDE2000 (dE00)",
    subtitle = "Pairwise mean dE00 across 13 syntax roles, split by polarity (Game Boy Dark held out as 1989 DMG-01 LCD outlier).",
    x = "MDS Dim 1", y = "MDS Dim 2"
  ) +
  theme_minimal(base_size = 12) +
  theme(strip.text = element_text(face = "bold"))

ggsave("assets/color-science/theme-mds.png", p_mds, width = 16, height = 8.5, dpi = 150)
cat("Saved assets/color-science/theme-mds.png\n")

# Ward-ordered 39x39 split-triangle distance matrix (upper = Light, lower = Dark)
consoles <- unique(meta$console)
l_map <- setNames(meta$theme_slug[meta$mode == "light"], meta$console[meta$mode == "light"])
d_map <- setNames(meta$theme_slug[meta$mode == "dark"], meta$console[meta$mode == "dark"])
comb_mat <- do.call(rbind, lapply(consoles, function(cn) {
  c(feature_matrix[l_map[[cn]], ], feature_matrix[d_map[[cn]], ])
}))
rownames(comb_mat) <- consoles
hc_con <- hclust(dist(scale(comb_mat)), method = "ward.D2")
ord_con <- consoles[hc_con$order]

DL <- mds_results$light$D_all[l_map[ord_con], l_map[ord_con]]
DD <- mds_results$dark$D_all[d_map[ord_con], d_map[ord_con]]
nc <- length(ord_con)
hm_df <- expand.grid(row_i = seq_len(nc), col_i = seq_len(nc)) %>%
  mutate(
    row_con = factor(ord_con[row_i], levels = rev(ord_con)),
    col_con = factor(ord_con[col_i], levels = ord_con),
    de = ifelse(row_i == col_i, NA_real_, ifelse(row_i < col_i, DL[cbind(row_i, col_i)], DD[cbind(row_i, col_i)]))
  )

p_hm <- ggplot(hm_df, aes(col_con, row_con, fill = pmin(de, 26))) +
  geom_tile(color = "white", linewidth = 0.25) +
  scale_fill_gradientn(
    colors = c("#14245E", "#1E5498", "#408EB0", "#98C4C0", "#E2E0CD", "#F8F2E4"),
    na.value = "#D8D6CE",
    name = "Mean dE00\n(capped 26)"
  ) +
  coord_equal() +
  labs(
    title = "Pairwise Perceptual Distance Matrix -- All 39 Consoles (CIEDE2000)",
    subtitle = "Ward-ordered split-triangle matrix: upper-right = Light mode, lower-left = Dark mode.",
    x = NULL, y = NULL
  ) +
  theme_minimal(base_size = 10) +
  theme(axis.text.x = element_text(angle = 55, hjust = 1, vjust = 1), panel.grid = element_blank())

ggsave("assets/color-science/theme-distance-heatmap.png", p_hm, width = 13, height = 12.5, dpi = 150)
cat("Saved assets/color-science/theme-distance-heatmap.png\n")
