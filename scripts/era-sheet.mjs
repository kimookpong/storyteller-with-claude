// ภาพตัวอย่างพื้นผิวของทุกยุค (rule 05) — ใช้ตรวจยุคที่ยังไม่เคย render
// node scripts/era-sheet.mjs [era...]  → out/eras/<era>.png
// ใช้ช็อตตัวอย่างเดียวกัน (กระดาษ + collage + ตัวละคร vector + ตัวหนังสือ) แล้วเปลี่ยนแค่ era
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const src = fs.readFileSync('src/era/eras.ts', 'utf8');
const all = [...src.slice(src.indexOf('export const ERAS')).matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s*\{/gm)].map((m) => m[1]);
const only = process.argv.slice(2);
const eras = all.filter((e) => !only.length || only.includes(e));

const sample = (id) => ({
  id, kind: 'parallax', description: 'era sample',
  layers: [
    {id: 'bg', asset: 'paper-bg', style: 'collage', z: 1400, cover: true},
    {id: 'doc', asset: 'document', style: 'collage', z: 1150, x: -470, y: 10, w: 430, rot: -5, props: {title: 'Archive', year: '1700'}},
    {id: 'cup', asset: 'cup', style: 'collage', z: 1100, x: 430, y: 140, w: 330},
    {id: 'subject', asset: 'bean', style: 'vector', z: 1000, x: 0, y: 40, w: 330, props: {expr: 'sly'}},
    {id: 'fg', asset: 'dust', style: 'vector', z: 600, x: 0, y: 0, w: 1560, props: {count: 10}},
  ],
  camera: {move: 'drift', from: {x: 0, y: 0, z: 0}, to: {x: 10, y: 0, z: 20}},
  text: [{content: '2,000,000,000', role: 'number', x: 960, y: 170}, {content: 'ตัวอย่างยุค', role: 'label', x: 960, y: 930}],
});
const project = {
  meta: {slug: 'era-sheet', title: 'era sheet', fps: 30, width: 1920, height: 1080, targetSec: 10},
  sources: {},
  scenes: eras.map((era, i) => ({id: `E${i}`, beat: 'act1', era, vo: '', voTTS: '', voFile: 'vo/x.wav', shots: [sample(`E${i}-01`)]})),
};
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync('out/eras', {recursive: true});
for (const [i, era] of eras.entries()) {
  const inputProps = {shotId: `E${i}-01`, project};
  const comp = await selectComposition({serveUrl, id: 'shot', inputProps, browserExecutable});
  await renderStill({composition: comp, serveUrl, output: `out/eras/${era}.png`, frame: 45, inputProps, browserExecutable, scale: 0.4});
  process.stdout.write(`${era} `);
}
console.log('\ndone → out/eras/');
