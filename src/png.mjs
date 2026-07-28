import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const outputDir = path.resolve(process.argv[2] || 'dist');
const names = await fs.readdir(outputDir);
const svgFiles = names.filter((name) => name.endsWith('.svg')).sort();
if (!svgFiles.length) throw new Error('No SVG preview files found.');

const pngFiles = [];
for (const svgName of svgFiles) {
  const pngName = svgName.replace(/\.svg$/i, '.png');
  await sharp(path.join(outputDir, svgName))
    .png({ compressionLevel: 9 })
    .toFile(path.join(outputDir, pngName));
  pngFiles.push(pngName);
}

const resultPath = path.join(outputDir, 'result.json');
const result = JSON.parse(await fs.readFile(resultPath, 'utf8'));
result.output_format = 'png';
result.preview_files = pngFiles;
result.source_files = svgFiles;
result.publication_ready = false;
await fs.writeFile(resultPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const figures = pngFiles.map((name) => `<figure><img src="${name}" alt="${name}"><figcaption>${name}</figcaption></figure>`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>GDS BEDS preview</title><style>body{font-family:Arial,sans-serif;margin:32px;background:#eef3f7;color:#10273c}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}figure{margin:0;background:#fff;padding:12px;border-radius:12px;box-shadow:0 3px 14px #0002}img{width:100%;height:auto;display:block;border-radius:8px}figcaption{padding:10px 2px 2px;font-size:13px}</style></head><body><h1>GDS BEDS internal preview</h1><p>Dry-run output. Not publication-ready.</p><main>${figures}</main></body></html>`;
await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
console.log(JSON.stringify({ ok: true, png_files: pngFiles }));
