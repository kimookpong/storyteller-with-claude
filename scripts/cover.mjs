// เรนเดอร์ปก YouTube ทุกแบบใน shots.json → out/cover/ (rule 12)
// node scripts/cover.mjs [slug] [coverId...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';
import {imagesMap} from './lib/images.mjs';
import {loadAssetMap, applyAssetMap} from './lib/assetmap.mjs';

const slug = process.argv[2] ?? 'coffee-world';
const only = process.argv.slice(3);
const project = JSON.parse(fs.readFileSync(`projects/${slug}/shots.json`, 'utf8'));
project.images = imagesMap(slug); // รูปจาก AI ที่เลือกแล้ว (img:<id>)
applyAssetMap(project, loadAssetMap(slug)); // ตารางจับคู่ asset (rule 16)
const covers = (project.covers ?? []).filter((c) => !only.length || only.includes(c.id));
if (!covers.length) {
  console.error(`ไม่มี "covers" ใน projects/${slug}/shots.json — ดู rules/12-cover.md`);
  process.exit(1);
}
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const dir = 'out/cover';
fs.mkdirSync(dir, {recursive: true});
const MAX = 2 * 1024 * 1024; // YouTube: ≤ 2MB

for (const c of covers) {
  const inputProps = {project, coverId: c.id};
  const comp = await selectComposition({serveUrl, id: 'cover', inputProps, browserExecutable});
  const jpg = `${dir}/${slug}-${c.id}.jpg`;
  // แนวนอน: ไฟล์ส่ง YouTube 1280×720 JPEG · แนวตั้ง (TikTok/Reels/Shorts): 1080×1920 เต็มขนาด
  const portrait = comp.height > comp.width;
  const scale = portrait ? 1 : 2 / 3;
  const size = `${Math.round(comp.width * scale)}×${Math.round(comp.height * scale)}`;
  await renderStill({composition: comp, serveUrl, output: jpg, inputProps, browserExecutable, scale, imageFormat: 'jpeg', jpegQuality: 90});
  // เช็กบนมือถือ: ขนาดจริงที่คนเห็นในฟีด (~320×180)
  await renderStill({composition: comp, serveUrl, output: `${dir}/${slug}-${c.id}-mobile.png`, inputProps, browserExecutable, scale: 1 / 6, imageFormat: 'png'});
  const kb = fs.statSync(jpg).size / 1024;
  console.log(`✓ ${jpg}  ${size}  ${kb.toFixed(0)} KB${kb * 1024 > MAX ? '  ⚠ เกิน 2MB — ลด jpegQuality' : ''}`);
}
console.log(`\nเทียบแบบ: เปิด ${dir}/*-mobile.png — ถ้าอ่านหัวข้อไม่ออกที่ขนาดนี้ ให้ตัดคำ/ขยายตัวอักษร`);
