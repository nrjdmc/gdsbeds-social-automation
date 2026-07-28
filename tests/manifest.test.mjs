import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest, formatOf } from '../src/manifest.mjs';

const fields = {
  'field.category': 'HOTEL SUPPLY',
  'field.headline': 'Global hotel supply for travel professionals',
  'field.body': 'Professional B2B accommodation and destination services.',
  'field.media': 'https://example.com/licensed.jpg',
};

const base = {
  schema_version: '1.0',
  post_code: 'GDS-TEST-001',
  platform: 'instagram',
  format: 'single_image',
  template_id: 'template_insight_light',
  publishing_allowed: false,
  canvas: { width: 1080, height: 1080 },
  fields,
};

test('valid Figma static manifest', () => {
  assert.equal(validateManifest(base), true);
  assert.equal(formatOf(base), 'single_image');
});

test('valid Figma carousel manifest', () => {
  const carousel = {
    ...base,
    format: 'carousel',
    template_id: 'template_carousel_cover',
    slides: [
      { template_id: 'template_carousel_cover', fields },
      { template_id: 'template_insight_light', fields },
    ],
  };
  assert.equal(validateManifest(carousel), true);
});

test('rejects unsupported template', () => {
  assert.throws(() => validateManifest({ ...base, template_id: 'unknown' }), /Unsupported template_id/);
});

test('rejects publishable preview', () => {
  assert.throws(() => validateManifest({ ...base, publishing_allowed: true }), /publishing_allowed must be false/);
});

test('rejects non-square canvas', () => {
  assert.throws(() => validateManifest({ ...base, canvas: { width: 1080, height: 1350 } }), /1080x1080/);
});

test('rejects headline overflow', () => {
  assert.throws(() => validateManifest({ ...base, fields: { ...fields, 'field.headline': 'x'.repeat(91) } }), /headline exceeds 90/);
});
