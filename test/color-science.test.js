'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const cs = require('../scripts/color-science');

const HEX6_RE = /^#[0-9A-F]{6}$/;

function loadPalette(slug) {
  return require(path.join(__dirname, '..', 'palettes', `${slug}.js`));
}

function clonePalette(palette) {
  return JSON.parse(JSON.stringify(palette));
}

describe('color-science: hexToRgb & rgbToHex', () => {
  it('converts canonical 6-digit hex strings with exact channels', () => {
    assert.deepEqual(cs.hexToRgb('#000000'), { r: 0, g: 0, b: 0, a: 1 });
    assert.deepEqual(cs.hexToRgb('#FFFFFF'), { r: 255, g: 255, b: 255, a: 1 });
    assert.deepEqual(cs.hexToRgb('#FF0000'), { r: 255, g: 0, b: 0, a: 1 });
    assert.deepEqual(cs.hexToRgb('#00FF00'), { r: 0, g: 255, b: 0, a: 1 });
    assert.deepEqual(cs.hexToRgb('#0000FF'), { r: 0, g: 0, b: 255, a: 1 });
    assert.deepEqual(cs.hexToRgb('#123456'), { r: 0x12, g: 0x34, b: 0x56, a: 1 });
  });

  it('handles lowercase, uppercase, omitted leading #, whitespace, and 8-digit alpha', () => {
    assert.deepEqual(cs.hexToRgb('#a1b2c3'), { r: 0xa1, g: 0xb2, b: 0xc3, a: 1 });
    assert.deepEqual(cs.hexToRgb('#A1B2C3'), { r: 0xa1, g: 0xb2, b: 0xc3, a: 1 });
    assert.deepEqual(cs.hexToRgb('a1b2c3'), { r: 0xa1, g: 0xb2, b: 0xc3, a: 1 });
    assert.deepEqual(cs.hexToRgb('  #4F8A10  '), { r: 0x4f, g: 0x8a, b: 0x10, a: 1 });

    const withAlpha = cs.hexToRgb('#10203080');
    assert.equal(withAlpha.r, 0x10);
    assert.equal(withAlpha.g, 0x20);
    assert.equal(withAlpha.b, 0x30);
    assert.ok(Math.abs(withAlpha.a - 0x80 / 255) < 1e-12);
    assert.equal(cs.hexToRgb('#AABBCC00').a, 0);
    assert.equal(cs.hexToRgb('#AABBCCFF').a, 1);
  });

  it('formats uppercase #RRGGBB, rounds fractional channels, and clamps out-of-range values', () => {
    assert.equal(cs.rgbToHex({ r: 0, g: 0, b: 0 }), '#000000');
    assert.equal(cs.rgbToHex({ r: 255, g: 255, b: 255 }), '#FFFFFF');
    assert.equal(cs.rgbToHex({ r: 10, g: 171, b: 205 }), '#0AABCD');
    assert.equal(cs.rgbToHex({ r: -25, g: 127.6, b: 999 }), '#0080FF');
  });

  it('round-trips hex -> rgb -> hex losslessly across diverse inputs', () => {
    const samples = [
      '#000000',
      '#ffffff',
      'ff00aa',
      '#0f380f',
      '#5442BA',
      '#E2E3E8',
      '010203',
      '#7f8081',
    ];
    for (const raw of samples) {
      const normalized = `#${raw.replace('#', '').toUpperCase()}`;
      assert.equal(cs.rgbToHex(cs.hexToRgb(raw)), normalized);
    }
  });
});

describe('color-science: hexToOklch & oklchToHex', () => {
  it('round-trips primaries, secondaries, neutrals, black, and white accurately', () => {
    const samples = [
      { name: 'red', hex: '#FF0000' },
      { name: 'crimson', hex: '#CC2222' },
      { name: 'green', hex: '#00FF00' },
      { name: 'forest green', hex: '#1E8A44' },
      { name: 'blue', hex: '#0000FF' },
      { name: 'cobalt blue', hex: '#2455D6' },
      { name: 'orange', hex: '#FF7A00' },
      { name: 'violet', hex: '#7A38CC' },
      { name: 'dark grey', hex: '#404040' },
      { name: 'mid grey', hex: '#808080' },
      { name: 'light grey', hex: '#C0C0C0' },
      { name: 'white', hex: '#FFFFFF' },
      { name: 'black', hex: '#000000' },
    ];

    for (const { name, hex } of samples) {
      const oklch = cs.hexToOklch(hex);
      assert.ok(oklch.L >= 0 && oklch.L <= 1, `${name}: L out of [0,1]: ${oklch.L}`);
      assert.ok(oklch.C >= 0, `${name}: negative chroma: ${oklch.C}`);
      assert.ok(oklch.h >= 0 && oklch.h < 360, `${name}: hue out of [0,360): ${oklch.h}`);

      const roundTripped = cs.oklchToHex(oklch);
      assert.match(roundTripped, HEX6_RE, `${name}: invalid hex ${roundTripped}`);

      const orig = cs.hexToRgb(hex);
      const back = cs.hexToRgb(roundTripped);
      assert.ok(Math.abs(orig.r - back.r) <= 1, `${name}: R mismatch ${orig.r} vs ${back.r}`);
      assert.ok(Math.abs(orig.g - back.g) <= 1, `${name}: G mismatch ${orig.g} vs ${back.g}`);
      assert.ok(Math.abs(orig.b - back.b) <= 1, `${name}: B mismatch ${orig.b} vs ${back.b}`);
      assert.ok(cs.deltaE00Hex(hex, roundTripped) < 0.5, `${name}: dE00 too large`);
    }
  });

  it('produces zero/near-zero chroma for achromatic neutrals and expected lightness bounds', () => {
    const black = cs.hexToOklch('#000000');
    const grey = cs.hexToOklch('#808080');
    const white = cs.hexToOklch('#FFFFFF');

    assert.ok(black.L < 1e-4 && black.C < 1e-4);
    assert.ok(grey.L > 0.5 && grey.L < 0.7 && grey.C < 1e-4);
    assert.ok(white.L > 0.999 && white.C < 1e-4);
  });

  it('gamut-maps extreme out-of-gamut OKLCH inputs to valid #RRGGBB hex strings', () => {
    const extremeInputs = [
      { L: 0.7, C: 0.5, h: 140 },
      { L: 0.5, C: 0.9, h: 25 },
      { L: 0.85, C: 0.45, h: 260 },
      { L: 0.25, C: 0.6, h: 320 },
      { L: 1.5, C: 0.3, h: 90 },
      { L: -0.2, C: 0.3, h: 90 },
      { L: 0.5, C: -0.1, h: 180 },
    ];

    for (const input of extremeInputs) {
      const hex = cs.oklchToHex(input);
      assert.match(hex, HEX6_RE, `Expected valid #RRGGBB for ${JSON.stringify(input)}, got ${hex}`);
    }

    assert.equal(cs.oklchToHex({ L: 0, C: 0.3, h: 120 }), '#000000');
    assert.equal(cs.oklchToHex({ L: 1, C: 0.3, h: 120 }), '#FFFFFF');

    // Out-of-gamut chroma clamping preserves lightness closely.
    const clamped = cs.oklchToHex({ L: 0.65, C: 0.6, h: 145 });
    const clampedLch = cs.hexToOklch(clamped);
    assert.ok(Math.abs(clampedLch.L - 0.65) < 0.03, `Expected L≈0.65, got ${clampedLch.L}`);
  });
});

describe('color-science: hexToLab, deltaE76 & deltaE00Hex', () => {
  it('maps black, white, and neutral greys to expected CIE L*a*b* coordinates', () => {
    const black = cs.hexToLab('#000000');
    const white = cs.hexToLab('#FFFFFF');
    const grey = cs.hexToLab('#808080');

    assert.ok(Math.abs(black.L) < 1e-6 && Math.abs(black.a) < 1e-6 && Math.abs(black.b) < 1e-6);
    assert.ok(Math.abs(white.L - 100) < 0.05 && Math.abs(white.a) < 0.05 && Math.abs(white.b) < 0.05);
    assert.ok(grey.L > 50 && grey.L < 56 && Math.abs(grey.a) < 0.05 && Math.abs(grey.b) < 0.05);
  });

  it('satisfies identity (distance === 0 for identical colors)', () => {
    for (const hex of ['#000000', '#FFFFFF', '#5442BA', '#A1001F', '#005F22', '#808080']) {
      const lab = cs.hexToLab(hex);
      assert.equal(cs.deltaE76(lab, lab), 0);
      assert.equal(cs.deltaE00Hex(hex, hex), 0);
    }
  });

  it('satisfies symmetry d(a, b) ≈ d(b, a) across hue quadrants and blue rotation zone', () => {
    const pairs = [
      ['#CC2222', '#2266CC'],
      ['#FF8800', '#5442BA'],
      ['#005F22', '#805C00'],
      ['#1A2B88', '#4B3A99'],
      ['#E2E3E8', '#17181E'],
      ['#808080', '#9944AA'],
    ];

    for (const [a, b] of pairs) {
      const labA = cs.hexToLab(a);
      const labB = cs.hexToLab(b);
      assert.ok(Math.abs(cs.deltaE76(labA, labB) - cs.deltaE76(labB, labA)) < 1e-12);
      assert.ok(Math.abs(cs.deltaE00Hex(a, b) - cs.deltaE00Hex(b, a)) < 1e-10);
    }
  });

  it('orders perceptually similar colors closer than opposite/complementary colors', () => {
    const base = '#2050A0';
    const nearby = '#2858A8';
    const opposite = '#E0B020';

    const labBase = cs.hexToLab(base);
    const labNearby = cs.hexToLab(nearby);
    const labOpposite = cs.hexToLab(opposite);

    assert.ok(cs.deltaE76(labBase, labNearby) < cs.deltaE76(labBase, labOpposite));
    assert.ok(cs.deltaE00Hex(base, nearby) < cs.deltaE00Hex(base, opposite));

    // Also verify metric triangle-like separation on RGB primaries vs minor shade steps.
    assert.ok(cs.deltaE00Hex('#808080', '#8A8A8A') < cs.deltaE00Hex('#FF0000', '#00FF00'));
    assert.ok(cs.deltaE00Hex('#FF0000', '#E81010') < cs.deltaE00Hex('#FF0000', '#0000FF'));
  });

  it('matches known perceptible separation benchmarks and Sharma (2005) CIEDE2000 reference', () => {
    // Pure black vs pure white spans full L* range (~100).
    const d76BW = cs.deltaE76(cs.hexToLab('#000000'), cs.hexToLab('#FFFFFF'));
    const d00BW = cs.deltaE00Hex('#000000', '#FFFFFF');
    assert.ok(Math.abs(d76BW - 100) < 0.1, `Expected dE76(B,W) ≈ 100, got ${d76BW}`);
    assert.ok(d00BW > 95 && d00BW <= 105, `Expected dE00(B,W) ≈ 100, got ${d00BW}`);

    // Subtle grey step is small but perceptible; distinct hues have large separation.
    const subtle = cs.deltaE00Hex('#808080', '#8A8A8A');
    assert.ok(subtle > 1.0 && subtle < 6.0, `Expected subtle dE00 in (1, 6), got ${subtle}`);
    assert.ok(cs.deltaE00Hex('#A1001F', '#005F22') > 40);

    // Sharma, Wu & Dalal (2005) Table 1, Pair 1: reference dE00 = 2.0425.
    const sharmaPair1 = cs.ciede2000(
      { L: 50.0, a: 2.6772, b: -79.7751 },
      { L: 50.0, a: 0.0, b: -82.7485 }
    );
    assert.ok(Math.abs(sharmaPair1 - 2.0425) < 1e-3, `Expected ~2.0425, got ${sharmaPair1}`);
  });
});

describe('color-science: contrastRatio (WCAG 2.1)', () => {
  it('returns 21 for pure white vs black and 1 for identical colors', () => {
    assert.equal(cs.contrastRatio('#FFFFFF', '#000000'), 21);
    assert.equal(cs.contrastRatio('#000000', '#FFFFFF'), 21);
    for (const hex of ['#000000', '#FFFFFF', '#5442BA', '#808080', '#0F380F']) {
      assert.equal(cs.contrastRatio(hex, hex), 1);
    }
  });

  it('is symmetric for arbitrary color pairs', () => {
    const pairs = [
      ['#17181E', '#E2E3E8'],
      ['#5442BA', '#E2E3E8'],
      ['#C5DF56', '#0F380F'],
      ['#FF7A00', '#121626'],
    ];
    for (const [a, b] of pairs) {
      assert.equal(cs.contrastRatio(a, b), cs.contrastRatio(b, a));
    }
  });

  it('changes monotonically when lightening or darkening a surface', () => {
    const ramp = ['#000000', '#262626', '#4D4D4D', '#737373', '#999999', '#BFBFBF', '#E6E6E6', '#FFFFFF'];

    // Against black, lighter colors strictly increase contrast ratio.
    for (let i = 1; i < ramp.length; i++) {
      assert.ok(
        cs.contrastRatio(ramp[i], '#000000') > cs.contrastRatio(ramp[i - 1], '#000000'),
        `Expected ${ramp[i]} > ${ramp[i - 1]} contrast on black`
      );
    }

    // Against white, lighter colors strictly decrease contrast ratio.
    for (let i = 1; i < ramp.length; i++) {
      assert.ok(
        cs.contrastRatio(ramp[i], '#FFFFFF') < cs.contrastRatio(ramp[i - 1], '#FFFFFF'),
        `Expected ${ramp[i]} < ${ramp[i - 1]} contrast on white`
      );
    }
  });
});

describe('color-science: apcaContrast', () => {
  it('returns positive Lc for dark text on light background and negative Lc for light text on dark background', () => {
    const darkOnLight = cs.apcaContrast('#17181E', '#E2E3E8');
    const lightOnDark = cs.apcaContrast('#E2E3E8', '#17181E');

    assert.ok(darkOnLight > 0, `Expected positive Lc, got ${darkOnLight}`);
    assert.ok(lightOnDark < 0, `Expected negative Lc, got ${lightOnDark}`);
  });

  it('returns 0 for identical colors', () => {
    for (const hex of ['#000000', '#444444', '#808080', '#E2E3E8', '#FFFFFF']) {
      assert.equal(cs.apcaContrast(hex, hex), 0);
    }
  });

  it('produces |Lc| > 100 for pure black and pure white pairs', () => {
    const blackOnWhite = cs.apcaContrast('#000000', '#FFFFFF');
    const whiteOnBlack = cs.apcaContrast('#FFFFFF', '#000000');

    assert.ok(blackOnWhite > 100, `Expected black-on-white Lc > 100, got ${blackOnWhite}`);
    assert.ok(whiteOnBlack < -100, `Expected white-on-black Lc < -100, got ${whiteOnBlack}`);
    assert.ok(Math.abs(whiteOnBlack) > 100);
  });
});

describe('color-science: readableTextOn', () => {
  it('chooses light text on dark surfaces and dark text on light surfaces', () => {
    for (const darkBg of ['#000000', '#121626', '#0F380F', '#2B1438']) {
      assert.equal(cs.readableTextOn(darkBg), '#FAF8F5');
    }
    for (const lightBg of ['#FFFFFF', '#E2E3E8', '#F5E8C8', '#D6E8D0']) {
      assert.equal(cs.readableTextOn(lightBg), '#141418');
    }
  });

  it('honors custom candidates and falls back to #000000/#FFFFFF when custom candidates fail 4.5:1', () => {
    assert.equal(cs.readableTextOn('#101010', '#F0F0F0', '#202020'), '#F0F0F0');
    assert.equal(cs.readableTextOn('#F0F0F0', '#EEEEEE', '#111111'), '#111111');

    // On mid-grey #777777, low-contrast custom candidates both fail 4.5:1 -> fallback to black or white.
    const fallback = cs.readableTextOn('#777777', '#888888', '#666666');
    assert.ok(fallback === '#000000' || fallback === '#FFFFFF');
  });
});

describe('color-science: simulateCvd', () => {
  const cvdTypes = ['protan', 'deutan', 'tritan'];

  it('returns valid #RRGGBB hex strings for protan, deutan, and tritan, and throws on unknown types', () => {
    const samples = ['#FF0000', '#00FF00', '#0000FF', '#FF7A00', '#5442BA', '#E2E3E8', '#000000', '#FFFFFF'];
    for (const type of cvdTypes) {
      for (const hex of samples) {
        assert.match(cs.simulateCvd(hex, type), HEX6_RE);
      }
    }

    assert.throws(() => cs.simulateCvd('#FF0000', 'unknown'), /Unknown CVD type/);
  });

  it('keeps pure achromatic grays neutral across all dichromacy matrices', () => {
    const grays = ['#000000', '#404040', '#808080', '#BFBFBF', '#FFFFFF'];
    for (const type of cvdTypes) {
      for (const gray of grays) {
        const sim = cs.simulateCvd(gray, type);
        const rgb = cs.hexToRgb(sim);
        const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
        assert.ok(spread <= 1, `${type} shifted neutral ${gray} -> ${sim} (spread ${spread})`);
      }
    }
  });

  it('compresses red/green CIE Lab distance under deutan and protan', () => {
    const red = '#C82820';
    const green = '#288C28';
    const normalDist = cs.deltaE76(cs.hexToLab(red), cs.hexToLab(green));

    for (const type of ['protan', 'deutan']) {
      const simRed = cs.simulateCvd(red, type);
      const simGreen = cs.simulateCvd(green, type);
      const cvdDist = cs.deltaE76(cs.hexToLab(simRed), cs.hexToLab(simGreen));

      assert.ok(
        cvdDist < normalDist * 0.5,
        `Expected ${type} to compress red/green distance (${cvdDist.toFixed(1)} vs normal ${normalDist.toFixed(1)})`
      );
    }
  });
});

describe('color-science: auditPalette', () => {
  it('passes with 0 errors on shipped palettes (snes-light, n64-dark, switch-light, gameboy-dark)', () => {
    for (const slug of ['snes-light', 'n64-dark', 'switch-light', 'gameboy-dark']) {
      const palette = loadPalette(slug);
      const result = cs.auditPalette(palette);

      assert.equal(result.slug, slug);
      assert.deepEqual(result.errors, [], `${slug} unexpectedly failed audit: ${result.errors.join('; ')}`);
      assert.ok(result.metrics.fgBg >= (slug === 'gameboy-dark' ? 5.8 : 7.0));
      assert.ok(result.metrics.minSyntaxCr >= 4.5);
      assert.equal(result.metrics.severeCvdCount, 0);
    }
  });

  it('rejects a synthetic palette with low fg/bg contrast with clear error messages', () => {
    const lowContrast = clonePalette(loadPalette('snes-light'));
    lowContrast.slug = 'synthetic-low-contrast';
    lowContrast.tokens.fg = '#D4D5DC'; // very close to bg #E2E3E8

    const result = cs.auditPalette(lowContrast);
    assert.ok(result.errors.length > 0, 'Expected low-contrast palette to produce errors');
    assert.ok(
      result.errors.some((msg) => msg.includes('primary fg/bg contrast') && msg.includes('< 7:1')),
      `Expected primary fg/bg contrast error, got: ${result.errors.join(' | ')}`
    );
    assert.ok(
      result.errors.some((msg) => msg.includes('APCA |Lc|')),
      `Expected APCA |Lc| error, got: ${result.errors.join(' | ')}`
    );
  });

  it('rejects a synthetic polychromatic palette with colliding accentKeyword/accentString under CVD', () => {
    const cvdCollision = clonePalette(loadPalette('snes-light'));
    cvdCollision.slug = 'synthetic-cvd-collision';
    // Both pass WCAG AA >= 4.5:1 on bg #E2E3E8 & >= 3.8:1 on bgLine #D8D8DE,
    // and are strongly separated in normal vision (dE76 ≈ 57, dE00 ≈ 40),
    // yet collapse together under deuteranopia (dE76 ≈ 3.0 < 5.0).
    cvdCollision.tokens.accentKeyword = '#8F3214';
    cvdCollision.tokens.accentString = '#465900';

    const result = cs.auditPalette(cvdCollision);
    assert.ok(result.errors.length > 0, 'Expected CVD collision palette to produce errors');
    assert.ok(result.metrics.severeCvdCount >= 1, 'Expected severeCvdCount >= 1');
    assert.ok(
      result.errors.some(
        (msg) =>
          msg.includes('severe deutan collision') &&
          msg.includes('accentKeyword') &&
          msg.includes('accentString')
      ),
      `Expected severe deutan collision error for accentKeyword & accentString, got: ${result.errors.join(' | ')}`
    );
  });
});
