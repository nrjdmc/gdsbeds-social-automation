import fs from 'node:fs/promises';

const FORMATS = new Set(['single_image','static','carousel','reel']);

export function validateManifest(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) throw new Error('Manifest must be an object.');
  const format = String(m.format || m.render_type || '').toLowerCase();
  if (!FORMATS.has(format)) throw new Error('Unsupported format: ' + (format || '(missing)'));
  if (!m.post_code || typeof m.post_code !== 'string') throw new Error('post_code is required.');
  const c = m.canvas || {};
  const width = Number(c.width || m.width);
  const height = Number(c.height || m.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 320 || height < 320) throw new Error('Valid canvas dimensions are required.');
  if (format === 'carousel' && (!Array.isArray(m.slides) || m.slides.length < 2)) throw new Error('Carousel requires at least two slides.');
  if (format === 'reel' && (!Array.isArray(m.scenes) || m.scenes.length < 1)) throw new Error('Reel requires at least one scene.');
  return true;
}

export async function readManifest(file) {
  const raw = await fs.readFile(file, 'utf8');
  let manifest;
  try { manifest = JSON.parse(raw); } catch (error) { throw new Error('Invalid JSON: ' + error.message); }
  validateManifest(manifest);
  return manifest;
}

export function formatOf(m) {
  const value = String(m.format || m.render_type).toLowerCase();
  return value === 'static' ? 'single_image' : value;
}
