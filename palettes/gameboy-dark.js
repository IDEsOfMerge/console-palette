'use strict';

// Game Boy (1989) -- Dark
//
// Signature hardware tribute: the ONE deliberately monochrome theme in Console Palette.
// The original 1989 DMG-01 Game Boy had no color -- only a reflective olive-chartreuse STN
// LCD driven by 2-bit shade registers. Those canonical DMG shades anchor this palette directly:
// #0F380F (darkest pixel, `bg`), #306230 (structural borders/chrome), and #8BAC0F / #9BBC0F
// (classic mid-bright LCD phosphor tones).
//
// Active syntax roles glide monotonically along the exact DMG phosphor curve in OKLCH space so
// every token clears WCAG AA 4.5:1 while bold/italic typographic weights reinforce boundaries.
// One deliberate hardware exception remains: `colorError` and `gitDelete` wear the glowing red
// left-bezel battery LED (#E67C46) -- the sole warm light on the original handheld face.

module.exports = {
  slug: 'gameboy-dark',
  label: 'Game Boy Dark',
  console: 'Game Boy',
  maker: 'Nintendo',
  era: '8-bit Pioneers',
  year: 1989,
  subtitle: '1989 DMG-01 4-shade reflective olive-green dot-matrix LCD phosphor ramp',
  tokens: {
    mode: 'dark',
    bg: '#0F380F',
    fg: '#C5DF56',
    bgLine: '#184418',
    bgWidget: '#204E20',
    bgInput: '#0B2E0B',
    bgSidebar: '#153F14',
    bgPanel: '#133C12',
    bgActivity: '#1B4719',
    tintHover: '#26561A',
    tintSelect: '#35691C',
    fgSecondary: '#98BA38',
    fgMuted: '#6A8F28',
    fgVariable: '#BBD84A',
    fgPunct: '#86AC2D',
    fgComment: '#83A825',
    fgParameter: '#A9CC44',
    fgProperty: '#9EC23B',
    borderSubtle: '#265226',
    borderStrong: '#5E8534',
    accentKeyword: '#9BBC0F',
    accentStorage: '#7FB032',
    accentString: '#B6D63C',
    accentRegex: '#D2E86B',
    accentFunction: '#8CC42B',
    accentFunctionDim: '#7AA836',
    accentType: '#A6CF52',
    accentInterface: '#BFE072',
    accentNumber: '#D6EB63',
    accentDecorator: '#CBE683',
    accentNamespace: '#7DA646',
    accentCursor: '#D6EB63',
    accentFocus: '#9BBC0F',
    accentBadge: '#B6D63C',
    accentButton: '#306230',
    accentStatusBar: '#1B4A1B',
    colorError: '#E67C46',
    colorWarning: '#D4B83C',
    colorInfo: '#96C96E',
    gitAdd: '#8CC42B',
    gitDelete: '#E67C46',
    ansi: {
      black: '#184418',
      red: '#E47A44',
      green: '#8CC42B',
      yellow: '#C8C438',
      blue: '#7EB368',
      magenta: '#A6B856',
      cyan: '#88C478',
      white: '#9BBC0F',
      brightBlack: '#7BA124',
      brightRed: '#EE8C56',
      brightGreen: '#A8D84E',
      brightYellow: '#DCE868',
      brightBlue: '#98CCA0',
      brightMagenta: '#C0CF7A',
      brightCyan: '#B2E09C',
      brightWhite: '#D8EE78',
    },
  },
};
