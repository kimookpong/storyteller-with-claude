// เรนเดอร์ภาพนิ่งของทุกช็อต (QA ก่อนเรนเดอร์เต็ม)
// node scripts/stills.mjs [frame] [shotId...]   · โปรเจกต์: HT_SLUG=<slug> (ค่าเริ่ม coffee-world)
// → out/stills/<slug>/<shotId>.png
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {imagesMap} from './lib/images.mjs';

const slug = process.env.HT_SLUG || 'coffee-world';
const project = JSON.parse(fs.readFileSync(`projects/${slug}/shots.json`, 'utf8'));
project.images = imagesMap(slug); // รูปจาก AI ที่เลือกแล้ว (img:<id>)
const frame = Number(process.argv[2] ?? 60);
const only = process.argv.slice(3);
const ids = project.scenes.flatMap((s) => s.shots.map((x) => x.id)).filter((id) => !only.length || only.includes(id));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const dir = `out/stills/${slug}`;
fs.mkdirSync(dir, {recursive: true});
for (const shotId of ids) {
  const inputProps = {shotId, project};
  const comp = await selectComposition({serveUrl, id: 'shot', inputProps, browserExecutable});
  await renderStill({composition: comp, serveUrl, output: `${dir}/${shotId}.png`, frame, inputProps, browserExecutable, scale: 0.5});
  process.stdout.write(shotId + ' ');
}
console.log(`\ndone → ${dir}/`);
