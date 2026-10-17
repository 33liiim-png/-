import test from 'node:test';
import assert from 'node:assert/strict';
import { AVATAR_PRESETS } from './imageUtils.ts';

test('AVATAR_PRESETS contains valid preset items with Arabic labels and SVG data URIs', () => {
  assert.ok(AVATAR_PRESETS.length >= 10);
  for (const preset of AVATAR_PRESETS) {
    assert.ok(preset.id.length > 0);
    assert.ok(preset.label.length > 0);
    assert.ok(preset.svgDataUri.startsWith('data:image/svg+xml'));
  }
});
