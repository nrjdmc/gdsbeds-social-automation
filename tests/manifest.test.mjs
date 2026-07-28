import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifest, formatOf } from '../src/manifest.mjs';
const base={post_code:'GDS-TEST-001',format:'single_image',canvas:{width:1080,height:1350}};
test('valid static manifest',()=>{assert.equal(validateManifest(base),true);assert.equal(formatOf(base),'single_image');});
test('valid carousel manifest',()=>assert.equal(validateManifest({...base,format:'carousel',slides:[{},{}]}),true));
test('valid reel manifest',()=>assert.equal(validateManifest({...base,format:'reel',canvas:{width:1080,height:1920},scenes:[{start:0,end:5}]}),true));
test('invalid format',()=>assert.throws(()=>validateManifest({...base,format:'other'}),/Unsupported format/));
