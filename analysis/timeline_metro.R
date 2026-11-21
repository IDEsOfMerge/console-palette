# Console Palette -- hardware lineage metro map (39 iconic consoles, 1977-2026)
#
# Run from the repo root with: Rscript --vanilla analysis/timeline_metro.R
# (High-DPI 2x supersampled production version is rendered by scripts/generate-color-science-assets.py)

library(ggplot2)
library(dplyr)

dir.create("assets/timeline", showWarnings = FALSE, recursive = TRUE)

nodes <- tribble(
  ~name, ~x, ~y, ~line, ~color, ~label_dy,
  # Atari Line
  "Atari 2600", 2.6, 3.05, "Atari", "#CC480C", 0.32,
  "Atari Lynx", 8.4, 3.05, "Atari", "#E04D12", 0.32,
  "Atari Jaguar", 11.0, 3.05, "Atari", "#D91828", 0.32,

  # Arcade / Indie
  "TurboGrafx-16", 6.8, 2.18, "Arcade / Indie", "#DE3518", 0.32,
  "Neo Geo AES", 9.6, 2.18, "Arcade / Indie", "#BD8908", 0.32,
  "Playdate", 25.5, 3.05, "Arcade / Indie", "#E5A600", 0.32,

  # Nintendo Home
  "NES", 5.0, 1.35, "Nintendo Home", "#D91E28", 0.32,
  "SNES", 9.6, 1.35, "Nintendo Home", "#5E44B8", 0.32,
  "Nintendo 64", 13.4, 1.35, "Nintendo Home", "#C99600", 0.32,
  "GameCube", 16.6, 1.35, "Nintendo Home", "#5942B2", 0.32,
  "Nintendo Wii", 19.8, 1.35, "Nintendo Home", "#009AC7", 0.32,

  # Nintendo Handheld + Virtual Boy spur
  "Game Boy", 8.4, 0.20, "Nintendo Handheld", "#5C8514", 0.32,
  "Virtual Boy", 11.8, 0.78, "Nintendo Handheld", "#D90E22", 0.28,
  "Game Boy Color", 14.5, 0.20, "Nintendo Handheld", "#008A96", -0.32,
  "Game Boy Advance", 16.6, 0.20, "Nintendo Handheld", "#4F3EC4", 0.32,
  "Nintendo DS", 18.5, 0.20, "Nintendo Handheld", "#0D78C8", 0.32,
  "Nintendo 3DS", 21.4, 0.20, "Nintendo Handheld", "#009E56", 0.32,

  # Nintendo Hybrid
  "Nintendo Switch", 23.6, 0.78, "Hybrid", "#E60012", -0.34,
  "Nintendo Switch 2", 27.0, 0.78, "Hybrid", "#E84A42", 0.34,

  # Sega
  "Master System", 5.0, -0.72, "Sega", "#D91A28", -0.32,
  "Sega Genesis", 7.7, -0.72, "Sega", "#1752BD", -0.32,
  "Sega Saturn", 11.7, -0.72, "Sega", "#008A9E", -0.32,
  "Sega Dreamcast", 14.5, -0.72, "Sega", "#E04F0E", -0.32,

  # PlayStation Home + Portable / Remote
  "PlayStation", 11.7, -1.72, "PlayStation", "#DE6A16", -0.32,
  "PlayStation 2", 15.7, -1.72, "PlayStation", "#1660EE", -0.32,
  "PlayStation 3", 19.8, -1.72, "PlayStation", "#C82230", -0.32,
  "PlayStation 4", 22.3, -1.72, "PlayStation", "#006CE6", -0.32,
  "PlayStation 5", 24.6, -1.72, "PlayStation", "#1B62F2", -0.32,
  "PSP", 18.5, -0.72, "PlayStation Portable", "#DE7F08", -0.32,
  "PS Vita", 21.4, -0.72, "PlayStation Portable", "#0090E6", -0.32,
  "PlayStation Portal", 26.1, -0.72, "PlayStation Portable", "#0D72F5", 0.34,

  # Xbox
  "Xbox", 16.6, -2.68, "Xbox", "#108910", -0.32,
  "Xbox 360", 19.0, -2.68, "Xbox", "#DF5D0E", -0.32,
  "Xbox One", 22.3, -2.68, "Xbox", "#107C10", -0.32,
  "Xbox Series X|S", 24.6, -2.68, "Xbox", "#107C10", -0.32,
  "ROG Xbox Ally", 27.0, -2.68, "Xbox", "#108926", -0.32,

  # Valve / Steam
  "Steam Deck", 25.5, 2.18, "Valve / Steam", "#DF5012", 0.32,
  "Steam Machine", 28.0, 2.18, "Valve / Steam", "#0088C8", -0.32,
  "Steam Frame", 28.0, 3.05, "Valve / Steam", "#E06810", 0.32
)

edges <- tribble(
  ~from, ~to, ~branch_color, ~lty,
  "Atari 2600", "Atari Lynx", "#D94616", "solid",
  "Atari Lynx", "Atari Jaguar", "#D94616", "solid",
  "TurboGrafx-16", "Neo Geo AES", "#C88212", "solid",
  "NES", "SNES", "#D62432", "solid",
  "SNES", "Nintendo 64", "#D62432", "solid",
  "Nintendo 64", "GameCube", "#D62432", "solid",
  "GameCube", "Nintendo Wii", "#D62432", "solid",
  "Nintendo Wii", "Nintendo Switch", "#D62432", "solid",
  "Nintendo Switch", "Nintendo Switch 2", "#D62432", "solid",
  "Game Boy", "Virtual Boy", "#D90E22", "dashed",
  "Game Boy", "Game Boy Color", "#149658", "solid",
  "Game Boy Color", "Game Boy Advance", "#149658", "solid",
  "Game Boy Advance", "Nintendo DS", "#149658", "solid",
  "Nintendo DS", "Nintendo 3DS", "#149658", "solid",
  "Nintendo 3DS", "Nintendo Switch", "#149658", "solid",
  "Master System", "Sega Genesis", "#1458C4", "solid",
  "Sega Genesis", "Sega Saturn", "#1458C4", "solid",
  "Sega Saturn", "Sega Dreamcast", "#1458C4", "solid",
  "PlayStation", "PlayStation 2", "#264CC4", "solid",
  "PlayStation 2", "PlayStation 3", "#264CC4", "solid",
  "PlayStation 3", "PlayStation 4", "#264CC4", "solid",
  "PlayStation 4", "PlayStation 5", "#264CC4", "solid",
  "PlayStation 2", "PSP", "#4B7CF0", "dashed",
  "PSP", "PS Vita", "#4B7CF0", "solid",
  "PS Vita", "PlayStation Portal", "#4B7CF0", "dashed",
  "PlayStation 5", "PlayStation Portal", "#4B7CF0", "dashed",
  "Xbox", "Xbox 360", "#148824", "solid",
  "Xbox 360", "Xbox One", "#148824", "solid",
  "Xbox One", "Xbox Series X|S", "#148824", "solid",
  "Xbox Series X|S", "ROG Xbox Ally", "#148824", "dashed",
  "Steam Deck", "Steam Machine", "#D9531E", "solid",
  "Steam Deck", "Steam Frame", "#D9531E", "dashed"
)

edge_coords <- edges %>%
  left_join(nodes %>% select(name, x, y), by = c("from" = "name")) %>%
  rename(x1 = x, y1 = y) %>%
  left_join(nodes %>% select(name, x, y), by = c("to" = "name")) %>%
  rename(x2 = x, y2 = y)

p <- ggplot() +
  geom_segment(
    data = edge_coords,
    aes(x = x1, y = y1, xend = x2, yend = y2, color = branch_color, linetype = lty),
    linewidth = 1.3, lineend = "round"
  ) +
  scale_color_identity() +
  scale_linetype_identity() +
  geom_point(data = nodes, aes(x, y, fill = color), size = 4.2, shape = 21, color = "white", stroke = 1) +
  scale_fill_identity() +
  geom_text(data = nodes, aes(x, y + label_dy, label = name), size = 3.2, fontface = "bold", hjust = 0.5) +
  labs(
    title = "Console Palette -- Hardware Lineage Metro Map (39 Iconic Consoles, 1977-2026)",
    subtitle = "39 iconic consoles mapped by manufacturer lineage -- solid lines trace main generations; dashed lines mark handheld, companion, and spatial branches."
  ) +
  theme_void(base_size = 12) +
  theme(plot.title = element_text(face = "bold", size = 16), plot.margin = margin(18, 30, 18, 30))

ggsave("assets/timeline/timeline-metro.png", p, width = 22, height = 11, dpi = 150)
cat("Saved assets/timeline/timeline-metro.png\n")
