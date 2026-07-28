import fs from 'node:fs/promises';
import path from 'node:path';
import { readManifest, formatOf } from './manifest.mjs';

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrap(text, max = 30, limit = 4) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= max || !line) line = next;
    else {
      lines.push(line);
      line = word;
      if (lines.length >= limit - 1) break;
    }
  }
  if (line && lines.length < limit) lines.push(line);
  return lines;
}

function text(lines, x, y, size, step, weight = 700, fill = '#fff') {
  return lines.map((line, i) => `<text x="${x}" y="${y + i * step}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`).join('');
}

const themes = {
  template_insight_light: { bg: '#F3F7FA', panel: '#FFFFFF', headline: '#071B33', body: '#10253E', accent: '#0D5EA6', eyebrow: '#0D5EA6', footer: '#5F7185' },
  template_announcement_dark: { bg: '#071B33', panel: '#0B2E52', headline: '#FFFFFF', body: '#8FE3F1', accent: '#28B8D8', eyebrow: '#8FE3F1', footer: '#A8BED0' },
  template_carousel_cover: { bg: '#0D5EA6', panel: '#0D5EA6', headline: '#FFFFFF', body: '#8FE3F1', accent: '#B8D82E', eyebrow: '#FFFFFF', footer: '#D7EEF5' },
  template_offer_card: { bg: '#F3F7FA', panel: '#FFFFFF', headline: '#071B33', body: '#5F7185', accent: '#B8D82E', eyebrow: '#0D5EA6', footer: '#5F7185' },
};

function svg({ width, height, templateId, fields, index, total }) {
  const theme = themes[templateId] || themes.template_insight_light;
  const margin = Math.round(width * 0.065);
  const headline = String(fields['field.headline'] || '').trim();
  const body = String(fields['field.body'] || '').trim();
  const category = String(fields['field.category'] || 'GDS BEDS').trim().toUpperCase();
  const destination = String(fields['field.destination'] || '').trim();
  const hotelName = String(fields['field.hotel_name'] || '').trim();
  const offerMeta = String(fields['field.offer_meta'] || '').trim();
  const price = String(fields['field.price'] || '').trim();
  const headlineLines = wrap(hotelName || headline, 27, 4);
  const bodyLines = wrap(offerMeta || body, 47, 4);
  const headlineSize = Math.round(width * 0.064);
  const bodySize = Math.round(width * 0.027);
  const heroY = Math.round(height * 0.18);
  const heroH = Math.round(height * 0.31);
  const textY = templateId === 'template_offer_card' ? Math.round(height * 0.59) : Math.round(height * 0.39);
  const brandY = height - margin;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="${theme.bg}"/>
    <rect x="${margin}" y="${margin}" width="${width - margin * 2}" height="${height - margin * 2}" rx="28" fill="${theme.panel}"/>
    <rect x="${margin + 38}" y="${margin + 42}" width="12" height="${height - margin * 2 - 84}" rx="6" fill="${theme.accent}"/>
    <text x="${margin + 78}" y="${margin + 78}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(width * 0.021)}" font-weight="700" fill="${theme.eyebrow}" letter-spacing="2">${esc(destination || category)}</text>
    ${templateId === 'template_offer_card' ? `<rect x="${margin + 78}" y="${heroY}" width="${width - margin * 2 - 156}" height="${heroH}" rx="22" fill="#071B33"/><text x="${width / 2}" y="${heroY + heroH / 2}" text-anchor="middle" font-family="Arial" font-size="${Math.round(width * 0.022)}" fill="#8FE3F1">LICENSED HOTEL IMAGE</text>` : ''}
    ${text(headlineLines, margin + 78, textY, headlineSize, Math.round(headlineSize * 1.08), 700, theme.headline)}
    ${text(bodyLines, margin + 78, textY + headlineLines.length * Math.round(headlineSize * 1.08) + 42, bodySize, Math.round(bodySize * 1.42), 400, theme.body)}
    ${price ? `<text x="${margin + 78}" y="${height - margin - 92}" font-family="Arial" font-size="${Math.round(width * 0.056)}" font-weight="700" fill="#0D5EA6">${esc(price)}</text>` : ''}
    <text x="${margin + 78}" y="${brandY}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(width * 0.026)}" font-weight="700" fill="${theme.headline}" letter-spacing="3">GDS BEDS</text>
    <text x="${width - margin - 78}" y="${brandY}" text-anchor="end" font-family="Arial" font-size="${Math.round(width * 0.018)}" fill="${theme.footer}">INTERNAL PREVIEW • NOT FOR PUBLISHING</text>
    ${total > 1 ? `<text x="${width - margin - 78}" y="${margin + 78}" text-anchor="end" font-family="Arial" font-size="${Math.round(width * 0.022)}" font-weight="700" fill="${theme.eyebrow}">${index}/${total}</text>` : ''}
  </svg>`;
}

const manifestPath = arg('--manifest', process.env.MANIFEST_PATH || 'manifest.json');
const out = path.resolve(arg('--output', process.env.OUTPUT_DIR || 'dist'));
const manifest = await readManifest(manifestPath);
const format = formatOf(manifest);
const canvas = manifest.canvas || {};
const width = Number(canvas.width || manifest.width);
const height = Number(canvas.height || manifest.height);

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

const entries = format === 'carousel'
  ? manifest.slides.map((slide, i) => ({
      templateId: slide.template_id || manifest.template_id,
      fields: slide.fields || manifest.fields || {},
      suffix: `slide-${String(i + 1).padStart(2, '0')}`,
    }))
  : [{
      templateId: manifest.template_id,
      fields: manifest.fields || {},
      suffix: 'preview',
    }];

const files = [];
for (let i = 0; i < entries.length; i++) {
  const entry = entries[i];
  const name = `${manifest.post_code}-${entry.suffix}.svg`;
  await fs.writeFile(path.join(out, name), svg({ width, height, ...entry, index: i + 1, total: entries.length }), 'utf8');
  files.push(name);
}

const result = {
  ok: true,
  render_id: process.env.RENDER_ID || manifest.render_id || `RND-${manifest.post_code}`,
  post_code: manifest.post_code,
  format,
  template_id: manifest.template_id,
  schema_version: manifest.schema_version,
  generated_at: new Date().toISOString(),
  files,
  publication_ready: false,
};

await fs.writeFile(path.join(out, 'result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result));
