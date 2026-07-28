import { readManifest } from './manifest.mjs';
const i=process.argv.indexOf('--manifest'); const file=i>=0 ? process.argv[i+1] : (process.env.MANIFEST_PATH || 'manifest.json');
const m=await readManifest(file); console.log(JSON.stringify({ok:true,post_code:m.post_code,format:m.format || m.render_type}));
