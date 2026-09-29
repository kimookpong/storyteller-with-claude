// node scripts/post.mjs <slug>          → ข้อมูลตั้งต้นสำหรับเขียน post.json + ตรวจ post.json (ถ้ามี) + out/<slug>-post.md
// node scripts/post.mjs <slug> --kit    → เฉพาะข้อมูลตั้งต้น (ให้ Claude อ่านก่อนเขียน) · rules/14-post.md
import fs from 'node:fs';
import {assemble, toMarkdown, mmss} from './lib/post.mjs';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('ใช้: node scripts/post.mjs <slug> [--kit]'); process.exit(1); }
const r = assemble(slug);
const k = r.kit;
console.log(`โพสต์ · ${k.title}\nformat ${k.format} · ยาว ${k.durationSec ? mmss(k.durationSec) : '?'}${k.durationEstimated ? ' (ประมาณ — ยังไม่มีเสียงครบ)' : ''} · แหล่งอ้างอิง ${k.sources} รายการ`);
console.log(`แพลตฟอร์มที่เหมาะกับ format นี้: ${k.platforms.join(', ')}`);
if (k.covers.length) console.log(`ปก: ${k.covers.map((c) => `${c.id} "${c.title}"`).join(' · ')}`);
console.log(`เวลาเริ่มซีน: ${k.sceneStarts.join(' · ')}`);
if (process.argv.includes('--kit')) process.exit(0);
if (!r.exists) { console.log(`\nℹ ยังไม่มี projects/${slug}/post.json — ดูรูปแบบใน rules/14-post.md`); process.exit(0); }
console.log('');
for (const p of r.platforms) {
  console.log(`${p.name}${p.fit ? '' : ' (ไม่ตรง format)'}`);
  for (const f of p.fields) console.log(`  ${f.state === 'over' ? '✗' : f.state === 'meh' ? '~' : '✓'} ${f.label} ${f.count}/${f.limit}${f.ideal ? ` (แนะนำ ${f.ideal[0]}–${f.ideal[1]})` : ''}`);
  if (p.hashtags.length) console.log(`    แฮชแท็ก ${p.hashtags.length}: ${p.hashtags.join(' ')}`);
}
if (r.chapters.length) console.log(`\nบท YouTube ${r.chapters.length}: ${r.chapters.map((c) => `${mmss(c.start)} ${c.title}`).join(' · ')}`);
for (const w of r.warnings) console.log('⚠ ' + w);
for (const e of r.errors) console.log('✗ ' + e);
fs.mkdirSync('out', {recursive: true});
fs.writeFileSync(`out/${slug}-post.md`, toMarkdown(r));
console.log(`\n→ out/${slug}-post.md`);
if (r.errors.length) process.exit(1);
console.log('✓ post ผ่าน');
