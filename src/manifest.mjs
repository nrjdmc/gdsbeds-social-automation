import fs from 'node:fs/promises';

const FORMATS = new Set(['single_image', 'static', 'carousel', 'reel']);
const TEMPLATE_IDS = new Set([
  'template_insight_light',
  'template_announcement_dark',
  'template_carousel_cover',
  'template_offer_card',
]);

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required.`);
}

function validateFields(fields, context) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new Error(`${context}.fields must be an object.`);
  requireString(fields['field.category'], `${context}.fields[field.category]`);
  requireString(fields['field.headline'], `${context}.fields[field.headline]`);
  if (String(fields['field.headline']).length > 90) throw new Error(`${context} headline exceeds 90 characters.`);
  if (String(fields['field.body'] || '').length > 280) throw new Error(`${context} body exceeds 280 characters.`);
}

export function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Manifest must be an object.');
  const format = String(manifest.format || manifest.render_type || '').toLowerCase();
  if (!FORMATS.has(format)) throw new Error(`Unsupported format: ${format || '(missing)'}`);
  requireString(manifest.post_code, 'post_code');
  requireString(manifest.schema_version, 'schema_version');
  requireString(manifest.template_id, 'template_id');
  if (!TEMPLATE_IDS.has(manifest.template_id)) throw new Error(`Unsupported template_id: ${manifest.template_id}`);
  if (manifest.publishing_allowed !== false) throw new Error('publishing_allowed must be false for internal preview renders.');

  const canvas = manifest.canvas || {};
  const width = Number(canvas.width || manifest.width);
  const height = Number(canvas.height || manifest.height);
  if (width !== 1080 || height !== 1080) throw new Error('Canvas must be exactly 1080x1080.');

  if (format === 'carousel') {
    if (!Array.isArray(manifest.slides) || manifest.slides.length < 2) throw new Error('Carousel requires at least two slides.');
    manifest.slides.forEach((slide, index) => {
      requireString(slide.template_id, `slides[${index}].template_id`);
      if (!TEMPLATE_IDS.has(slide.template_id)) throw new Error(`Unsupported slides[${index}].template_id: ${slide.template_id}`);
      validateFields(slide.fields, `slides[${index}]`);
    });
  } else if (format === 'reel') {
    if (!Array.isArray(manifest.scenes) || manifest.scenes.length < 1) throw new Error('Reel requires at least one scene.');
  } else {
    validateFields(manifest.fields, 'manifest');
  }

  return true;
}

export async function readManifest(file) {
  const raw = await fs.readFile(file, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
  validateManifest(manifest);
  return manifest;
}

export function formatOf(manifest) {
  const value = String(manifest.format || manifest.render_type).toLowerCase();
  return value === 'static' ? 'single_image' : value;
}
