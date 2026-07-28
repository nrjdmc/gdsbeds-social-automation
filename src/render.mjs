import fs from 'node:fs/promises';
import path from 'node:path';
import { readManifest, formatOf } from './manifest.mjs';

function arg(name, fallback) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; }
function esc(v='') { return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;'); }
function wrap(text, max=30, limit=4) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean); const lines=[]; let line='';
  for (const word of words) { const next=line ? line+' '+word : word; if (next.length <= max || !line) line=next; else { lines.push(line); line=word; if (lines.length >= limit-1) break; } }
  if (line && lines.length < limit) lines.push(line); return lines;
}
function text(lines,x,y,size,step,weight=700,fill='#fff') { return lines.map((l,i)=>`<text x="${x}" y="${y+i*step}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(l)}</text>`).join(''); }
function svg({width,height,headline,body,eyebrow,index,total}) {
  const margin=Math.round(width*.075), hs=Math.round(width*.071), bs=Math.round(width*.033), y=Math.round(height*.55);
  const h=wrap(headline,29,4), b=wrap(body,48,4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#07162b"/><stop offset=".58" stop-color="#123653"/><stop offset="1" stop-color="#1f6b94"/></linearGradient><radialGradient id="g"><stop offset="0" stop-color="#69c3df" stop-opacity=".42"/><stop offset="1" stop-color="#69c3df" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><circle cx="82%" cy="16%" r="32%" fill="url(#g)"/><circle cx="82%" cy="16%" r="18%" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"/><text x="${margin}" y="${Math.round(height*.1)}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(width*.032)}" font-weight="700" fill="#fff" letter-spacing="4">GDS BEDS</text><rect x="${margin}" y="${y-58}" width="90" height="5" rx="2" fill="#61bddb"/><text x="${margin}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(width*.024)}" font-weight="700" fill="#dbeaf2" letter-spacing="2">${esc(String(eyebrow || 'PROFESSIONAL TRAVEL ACCESS').toUpperCase())}</text>${text(h,margin,y+95,hs,Math.round(hs*1.08))}${text(b,margin,y+95+h.length*Math.round(hs*1.08)+55,bs,Math.round(bs*1.4),400,'#dbeaf2')}<text x="${margin}" y="${height-margin}" font-family="Arial,Helvetica,sans-serif" font-size="${Math.round(width*.023)}" fill="#a8bed0">INTERNAL PREVIEW • ASSET REQUIRED BEFORE PUBLISHING</text>${total>1 ? `<text x="${width-margin}" y="${height-margin}" text-anchor="end" font-family="Arial" font-size="${Math.round(width*.025)}" font-weight="700" fill="#fff">${index}/${total}</text>` : ''}</svg>`;
}

const manifestPath=arg('--manifest',process.env.MANIFEST_PATH || 'manifest.json');
const out=path.resolve(arg('--output',process.env.OUTPUT_DIR || 'dist'));
const m=await readManifest(manifestPath); const format=formatOf(m); const c=m.canvas || {}; const width=Number(c.width || m.width), height=Number(c.height || m.height);
await fs.rm(out,{recursive:true,force:true}); await fs.mkdir(out,{recursive:true});
const entries = format === 'reel' ? m.scenes.map((s,i)=>({headline:s.overlay || s.headline || m.topic || m.post_code,body:s.visual || s.body || '',eyebrow:s.role || 'scene',suffix:'scene-'+String(i+1).padStart(2,'0')})) : (Array.isArray(m.slides) && m.slides.length ? m.slides.map((s,i)=>({headline:s.headline || m.topic || m.post_code,body:s.body || m.caption || '',eyebrow:s.role || 'slide',suffix:'slide-'+String(i+1).padStart(2,'0')})) : [{headline:m.headline || m.topic || m.post_code,body:m.body || m.caption || '',eyebrow:'single',suffix:'preview'}]);
const files=[];
for (let i=0;i<entries.length;i++) { const e=entries[i]; const name=`${m.post_code}-${e.suffix}.svg`; await fs.writeFile(path.join(out,name),svg({width,height,...e,index:i+1,total:entries.length}),'utf8'); files.push(name); }
const result={ok:true,render_id:process.env.RENDER_ID || m.render_id || 'RND-'+m.post_code,post_code:m.post_code,format,generated_at:new Date().toISOString(),files,publication_ready:false};
await fs.writeFile(path.join(out,'result.json'),JSON.stringify(result,null,2)+'\n','utf8'); console.log(JSON.stringify(result));
