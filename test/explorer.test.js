'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  loadThemeDataset,
  jacobiEigenSymmetric,
  computeClassicalMds2d,
  enrichDatasetWithSimilarity,
} = require('../scripts/generate-explorer');

const ROOT_DIR = path.join(__dirname, '..');

describe('explorer: Classical MDS & eigensolver math', () => {
  it('recovers exact eigenvalues and orthogonal eigenvectors on a symmetric matrix', () => {
    const A = [
      [4, 1, 1],
      [1, 3, 0],
      [1, 0, 2],
    ];
    const eigs = jacobiEigenSymmetric(A);
    assert.equal(eigs.length, 3);
    // Eigenvalues sorted descending and sum equals trace (4 + 3 + 2 = 9)
    assert.ok(eigs[0].val >= eigs[1].val && eigs[1].val >= eigs[2].val);
    const trace = eigs.reduce((s, e) => s + e.val, 0);
    assert.ok(Math.abs(trace - 9) < 1e-8, `Expected trace 9, got ${trace}`);
    // Verify A * v = lambda * v for each eigenpair
    for (const { val, vec } of eigs) {
      for (let i = 0; i < 3; i++) {
        const av = A[i][0] * vec[0] + A[i][1] * vec[1] + A[i][2] * vec[2];
        assert.ok(Math.abs(av - val * vec[i]) < 1e-7);
      }
    }
  });

  it('reconstructs pairwise Euclidean distances up to rigid transform via computeClassicalMds2d', () => {
    // 4 points forming a 3x4 rectangle in 2D
    const pts = [
      [0, 0],
      [3, 0],
      [3, 4],
      [0, 4],
    ];
    const D = pts.map((a) => pts.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
    const { coords, v1, v2 } = computeClassicalMds2d(D);
    assert.ok(Math.abs(v1 + v2 - 100) < 0.2, `2D rectangle should explain ~100% variance, got ${v1 + v2}`);
    for (let i = 0; i < 4; i++) {
      for (let j = i + 1; j < 4; j++) {
        const dRec = Math.hypot(coords[i][0] - coords[j][0], coords[i][1] - coords[j][1]);
        assert.ok(Math.abs(dRec - D[i][j]) < 1e-5, `Distance (${i},${j}) mismatch: ${dRec} vs ${D[i][j]}`);
      }
    }
  });
});

describe('explorer: 78-theme CIEDE2000 similarity & MDS metadata invariants', () => {
  const dataset = loadThemeDataset();
  const mdsMeta = enrichDatasetWithSimilarity(dataset);

  it('computes valid Light (39) and Dark (38 polychromatic + Game Boy Dark outlier) MDS coordinates', () => {
    assert.equal(dataset.length, 78);
    assert.ok(mdsMeta.light.v1 > 20 && mdsMeta.light.v2 > 10 && mdsMeta.light.v1 + mdsMeta.light.v2 <= 100);
    assert.ok(mdsMeta.dark.v1 > 20 && mdsMeta.dark.v2 > 10 && mdsMeta.dark.v1 + mdsMeta.dark.v2 <= 100);

    const lightThemes = dataset.filter((t) => t.mode === 'light');
    const darkThemes = dataset.filter((t) => t.mode === 'dark');
    assert.equal(lightThemes.length, 39);
    assert.equal(darkThemes.length, 39);

    for (const t of dataset) {
      assert.ok(t.mds, `Missing mds metadata on ${t.slug}`);
      if (t.slug === 'gameboy-dark') {
        assert.equal(t.mds.outlier, true);
        assert.ok(t.mds.meanDe > 35 && t.mds.meanDe < 50);
      } else {
        assert.equal(Boolean(t.mds.outlier), false);
        assert.ok(Number.isFinite(t.mds.x) && Number.isFinite(t.mds.y));
        assert.ok(t.mds.nx >= 0 && t.mds.nx <= 1);
        assert.ok(t.mds.ny >= 0 && t.mds.ny <= 1);
      }
    }

    // Consistent semantic pole orientation: Xbox on +x, NES on +y in both modes
    const bySlug = new Map(dataset.map((t) => [t.slug, t]));
    assert.ok(bySlug.get('xbox-light').mds.x > 0);
    assert.ok(bySlug.get('xbox-dark').mds.x > 0);
    assert.ok(bySlug.get('nes-light').mds.y > 0);
    assert.ok(bySlug.get('nes-dark').mds.y > 0);
  });

  it('populates sorted non-self same-mode nearest neighbors and polychromatic farthest neighbor for every theme', () => {
    const bySlug = new Map(dataset.map((t) => [t.slug, t]));
    for (const t of dataset) {
      assert.equal(t.neighbors.length, 4, `${t.slug} should have 4 nearest neighbors`);
      for (let i = 0; i < t.neighbors.length; i++) {
        const nb = t.neighbors[i];
        assert.notEqual(nb.slug, t.slug);
        assert.equal(bySlug.get(nb.slug).mode, t.mode);
        assert.ok(nb.de > 0);
        if (i > 0) assert.ok(nb.de >= t.neighbors[i - 1].de);
      }
      assert.ok(t.farthest && t.farthest.slug !== t.slug);
      assert.notEqual(t.farthest.slug, 'gameboy-dark');
      assert.ok(t.farthest.de >= t.neighbors[t.neighbors.length - 1].de);
    }

    // Known close hardware siblings pair directly
    assert.equal(bySlug.get('switch2-dark').neighbors[0].slug, 'switch-dark');
    assert.equal(bySlug.get('genesis-light').neighbors[0].slug, 'mastersystem-light');
  });
});

describe('explorer: built HTML bundles & export formats', () => {
  for (const rel of ['site/index.html', 'assets/explorer/explorer.html']) {
    it(`${rel} embeds MDS map, neighbor bar, all 8 export formats, and zero external URLs`, () => {
      const html = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
      assert.ok(html.includes('id="map-strip"'));
      assert.ok(html.includes('id="mds-svg"'));
      assert.ok(html.includes('id="neighbor-bar"'));
      assert.ok(html.includes('const MDS_META = '));
      for (const opt of ['vscode', 'ghostty', 'wezterm', 'alacritty', 'windowsterminal', 'kitty', 'iterm2', 'css']) {
        assert.ok(html.includes(`value="${opt}"`), `${rel} missing export option "${opt}"`);
      }
      assert.equal(/<(?:script|link|img)\b[^>]+(?:src|href)=["']https?:\/\//i.test(html), false);
    });
  }
});
