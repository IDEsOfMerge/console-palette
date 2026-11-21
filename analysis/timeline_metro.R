# Console Palette -- hardware lineage metro map (30 iconic consoles)
#
# Run from the repo root with: Rscript --vanilla analysis/timeline_metro.R
# (High-DPI 2x supersampled production version is rendered by scripts/generate-color-science-assets.py)

library(ggplot2)
library(dplyr)

dir.create("assets/timeline", showWarnings = FALSE, recursive = TRUE)

nodes <- tribble(
  ~name, ~x, ~y, ~line, ~color, ~label_dy,
  "Atari 2600", 2.6, 2.25, "Pioneers", "#C84B14", 0.30,
  "TurboGrafx-16", 7.2, 2.25, "Pioneers", "#E03C1F", 0.30,
  "Neo Geo AES", 9.6, 2.25, "Pioneers", "#B8860B", 0.30,

  "NES", 5.0, 1.30, "Nintendo Home", "#D92027", 0.30,
  "SNES", 9.6, 1.30, "Nintendo Home", "#6247B8", 0.30,
  "Nintendo 64", 12.2, 1.30, "Nintendo Home", "#C99600", 0.30,
  "GameCube", 14.8, 1.30, "Nintendo Home", "#5942B2", 0.30,
  "Nintendo Wii", 17.8, 1.30, "Nintendo Home", "#009AC7", 0.30,

  "Game Boy", 8.0, 0.32, "Nintendo Handheld", "#5C8514", 0.30,
  "Game Boy Color", 12.8, 0.32, "Nintendo Handheld", "#008A96", -0.32,
  "Game Boy Advance", 14.8, 0.32, "Nintendo Handheld", "#4F3EC4", 0.30,
  "Nintendo DS", 16.9, 0.32, "Nintendo Handheld", "#0082C8", 0.30,
  "Nintendo 3DS", 19.6, 0.32, "Nintendo Handheld", "#009E56", 0.30,
  "Nintendo Switch", 22.0, 0.82, "Hybrid", "#E60012", 0.32,

  "Master System", 5.0, -0.58, "Sega", "#D91E2A", -0.32,
  "Sega Genesis", 8.0, -0.58, "Sega", "#1752BD", -0.32,
  "Sega Saturn", 11.0, -0.58, "Sega", "#008A9E", -0.32,
  "Sega Dreamcast", 13.4, -0.58, "Sega", "#E05212", -0.32,

  "PlayStation", 11.0, -1.42, "PlayStation", "#DE6A16", -0.32,
  "PlayStation 2", 14.0, -1.42, "PlayStation", "#1B5CE6", -0.32,
  "PlayStation 3", 17.8, -1.42, "PlayStation", "#3E52B8", -0.32,
  "PlayStation 4", 20.6, -1.42, "PlayStation", "#006CE6", -0.32,
  "PlayStation 5", 23.4, -1.42, "PlayStation", "#1B62F2", -0.32,
  "PSP", 16.9, -0.58, "PlayStation Portable", "#D47B0A", -0.32,
  "PS Vita", 19.6, -0.58, "PlayStation Portable", "#0D78E6", -0.32,

  "Xbox", 14.8, -2.24, "Xbox", "#108910", -0.32,
  "Xbox 360", 17.3, -2.24, "Xbox", "#DE6214", -0.32,
  "Xbox One", 20.6, -2.24, "Xbox", "#107C10", -0.32,
  "Xbox Series X|S", 23.4, -2.24, "Xbox", "#189E32", -0.32,

  "Steam Deck", 24.2, 2.05, "Portable PC", "#D9531E", 0.32
)

edges <- tribble(
  ~from, ~to, ~branch_color,
  "Atari 2600", "TurboGrafx-16", "#C86A18",
  "TurboGrafx-16", "Neo Geo AES", "#C86A18",
  "NES", "SNES", "#D62432",
  "SNES", "Nintendo 64", "#D62432",
  "Nintendo 64", "GameCube", "#D62432",
  "GameCube", "Nintendo Wii", "#D62432",
  "Nintendo Wii", "Nintendo Switch", "#D62432",
  "Game Boy", "Game Boy Color", "#149658",
  "Game Boy Color", "Game Boy Advance", "#149658",
  "Game Boy Advance", "Nintendo DS", "#149658",
  "Nintendo DS", "Nintendo 3DS", "#149658",
  "Nintendo 3DS", "Nintendo Switch", "#149658",
  "Master System", "Sega Genesis", "#1458C4",
  "Sega Genesis", "Sega Saturn", "#1458C4",
  "Sega Saturn", "Sega Dreamcast", "#1458C4",
  "PlayStation", "PlayStation 2", "#264CC4",
  "PlayStation 2", "PlayStation 3", "#264CC4",
  "PlayStation 3", "PlayStation 4", "#264CC4",
  "PlayStation 4", "PlayStation 5", "#264CC4",
  "PlayStation 2", "PSP", "#4B7CF0",
  "PSP", "PS Vita", "#4B7CF0",
  "Xbox", "Xbox 360", "#148824",
  "Xbox 360", "Xbox One", "#148824",
  "Xbox One", "Xbox Series X|S", "#148824",
  "Nintendo Switch", "Steam Deck", "#D9531E"
)

edge_coords <- edges %>%
  left_join(nodes %>% select(name, x, y), by = c("from" = "name")) %>%
  rename(x1 = x, y1 = y) %>%
  left_join(nodes %>% select(name, x, y), by = c("to" = "name")) %>%
  rename(x2 = x, y2 = y)

p <- ggplot() +
  geom_segment(data = edge_coords, aes(x = x1, y = y1, xend = x2, yend = y2, color = branch_color),
               linewidth = 1.3, lineend = "round") +
  scale_color_identity() +
  geom_point(data = nodes, aes(x, y, fill = color), size = 4.2, shape = 21, color = "white", stroke = 1) +
  scale_fill_identity() +
  geom_text(data = nodes, aes(x, y + label_dy, label = name), size = 3.4, fontface = "bold", hjust = 0.5) +
  labs(
    title = "Console Palette -- Hardware Lineage Metro Map (30 Iconic Consoles, 1977-2022)",
    subtitle = "Nintendo Home & Handheld lines converge at Nintendo Switch; PlayStation branches into PSP & PS Vita."
  ) +
  theme_void(base_size = 12) +
  theme(plot.title = element_text(face = "bold", size = 16), plot.margin = margin(18, 30, 18, 30))

ggsave("assets/timeline/timeline-metro.png", p, width = 20, height = 10, dpi = 150)
cat("Saved assets/timeline/timeline-metro.png\n")
