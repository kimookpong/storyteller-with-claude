// ตรวจ shots.json ตาม rule (09, 11) + เกณฑ์จาก settings.json — node scripts/validate.mjs projects/<slug>
import fs from 'node:fs';
import path from 'node:path';
import {loadSettings, resolve, budget, supportedEras} from './lib/settings.mjs';
import {imagesSpec, imagesMap} from './lib/images.mjs';

const dir = process.argv[2] ?? 'projects/coffee-world';
const slug = path.basename(path.resolve(dir));
const p = JSON.parse(fs.readFileSync(path.join(dir, 'shots.json'), 'utf8'));
const facts = fs.existsSync(path.join(dir, 'facts.md')) ? fs.readFileSync(path.join(dir, 'facts.md'), 'utf8') : '';
const assetSrc = fs.readFileSync('src/assets/index.ts', 'utf8');
const assets = new Set([...assetSrc.matchAll(/^\s*'?([\w-]+)'?:\s/gm)].map((m) => m[1]));
const IMG_SPEC = new Set((imagesSpec(slug)?.images ?? []).map((x) => x.id));
const IMG_OK = imagesMap(slug);
const imgPending = new Set();
const assetOk = (a, where) => {
  if (a.startsWith('placeholder:')) return;
  if (a.startsWith('img:')) {
    const [id, fb] = a.slice(4).split('|');
    if (!IMG_SPEC.has(id)) errors.push(`${where}: รูป "${id}" ไม่มีใน images.json`);
    else if (!IMG_OK[id]) imgPending.add(id + (fb ? '' : ' (ไม่มี fallback)'));
    if (fb && !assets.has(fb)) errors.push(`${where}: fallback "${fb}" ของรูป ${id} ไม่มีใน asset vector`);
    return;
  }
  if (!assets.has(a)) errors.push(`${where}: ไม่พบ asset "${a}"`);
};
const errors = [];
const warns = [];
const CUE = /\[#([A-Za-z0-9_-]+)\]/g;
const chars = (s) => s.replace(CUE, '').replace(/[\s…]/g, '').length;
const settings = loadSettings(slug);
let res;
try { res = resolve(settings); } catch (e) { console.log('✗ settings: ' + e.message); process.exit(1); }
const B = budget(res);
const persona = res.voice.persona;
const reEsc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BANNED = persona.banned?.length ? new RegExp(persona.banned.map(reEsc).join('|')) : null;
const ERAS_OK = supportedEras();

function plainEq(a, b) { return a.replace(/[\s*]/g, '') === b.replace(/[\s*]/g, ''); }
let totalChars = 0;
let estSec = 0;
const kinds = [];
for (const s of p.scenes) {
  const ids = s.shots.map((x) => x.id);
  const cues = [...s.vo.matchAll(CUE)].map((m) => m[1]);
  if (JSON.stringify(ids.slice(1)) !== JSON.stringify(cues)) errors.push(`${s.id}: cue ใน vo ไม่ตรงกับ shot ids (${cues.join(',')} vs ${ids.slice(1).join(',')})`);
  const ttsCues = [...(s.voTTS ?? '').matchAll(CUE)].map((m) => m[1]);
  if (JSON.stringify(ttsCues) !== JSON.stringify(cues)) warns.push(`${s.id}: cue ใน voTTS ไม่ตรงกับ vo (TTS จะใช้สัดส่วนตัวอักษรแทน)`);
  // ซับอังกฤษ (rule 03/09): cue ชุดเดียวกับ vo · ไม่มีอักษรไทย · ช่วงละไม่ยาวเกิน
  if (s.voEn) {
    const enCues = [...s.voEn.matchAll(CUE)].map((m) => m[1]);
    if (JSON.stringify(enCues) !== JSON.stringify(cues)) errors.push(`${s.id}: cue ใน voEn ไม่ตรงกับ vo (${enCues.join(',')} vs ${cues.join(',')})`);
    if (/[\u0E00-\u0E7F]/.test(s.voEn)) warns.push(`${s.id}: voEn มีอักษรไทย`);
    for (const seg of s.voEn.split(CUE).filter((_, i) => i % 2 === 0)) if (seg.trim().length > 170) warns.push(`${s.id}: ซับอังกฤษช่วงหนึ่งยาว ${seg.trim().length} ตัวอักษร (ควร ≤ 170 — ตัดให้กระชับ)`);
  } else if (res.subtitles.includes('en')) errors.push(`${s.id}: ตั้งซับ "${res.subtitles}" แต่ยังไม่มี voEn (คำแปลอังกฤษ)`);
  totalChars += chars(s.vo);
  // อัตราพูดที่วัดจริงรวมช่วงหยุดแล้ว · +0.6 วิ/ซีน = head/tail (coffee-world: ประมาณ 174 · จริง 174.3)
  estSec += chars(s.vo) / B.charsPerSec + 0.6 + (s.holdAfter ?? 0);
  const bad = BANNED && s.vo.match(BANNED);
  if (bad) errors.push(`${s.id}: มีคำต้องห้าม "${bad[0]}" (voice: ${res.voice.id})`);
  if (persona.polite && !persona.polite.allowedBeats.includes(s.beat) && s.vo.includes(persona.polite.word)) errors.push(`${s.id}: มี "${persona.polite.word}" กลางเรื่อง (ใช้ได้เฉพาะ ${persona.polite.allowedBeats.join(', ')})`);
  if (!ERAS_OK.includes(s.era)) errors.push(`${s.id}: ยุค "${s.era}" ยังไม่มีใน src/era/eras.ts (มี: ${ERAS_OK.join(', ')})`);
  else if (!res.style.eras.includes(s.era)) warns.push(`${s.id}: ยุค "${s.era}" ไม่อยู่ในสไตล์ ${res.style.id}`);
  for (const sh of s.shots) {
    kinds.push(sh.kind);
    if (sh.kind === 'parallax' && sh.layers.length < 3) errors.push(`${sh.id}: parallax ต้องมี ≥3 layer`);
    for (const x of sh.sfx ?? []) if (!fs.existsSync(path.join('public', 'audio', 'sfx', `${x.name}.wav`))) errors.push(`${sh.id}: ไม่พบ SFX "${x.name}" (public/audio/sfx/)`);
    for (const l of sh.layers) assetOk(l.asset, sh.id);
    const refs = [sh.data?.sourceRef, ...(sh.text ?? []).map((t) => t.sourceRef)].filter(Boolean);
    for (const r of refs) {
      if (!p.sources?.[r]) errors.push(`${sh.id}: sourceRef ${r} ไม่มีใน sources`);
      if (!facts.includes(`| ${r} |`)) errors.push(`${sh.id}: sourceRef ${r} ไม่มีใน facts.md`);
    }
  }
}
for (const [word, max] of Object.entries(persona.limits ?? {})) {
  const n = p.scenes.reduce((a, s) => a + (s.vo.split(word).length - 1), 0);
  if (n > max) errors.push(`คำว่า "${word}" ${n} ครั้ง (≤${max})`);
}
// ---- format (rule 01/07): ขนาดเฟรม + safe zone ของข้อความ ----
const F = res.format;
if (p.meta.width !== F.width || p.meta.height !== F.height) errors.push(`meta ${p.meta.width}×${p.meta.height} ไม่ตรงกับ format "${F.id}" (${F.width}×${F.height}) — แก้ meta ใน shots.json`);
const sf = F.safe ?? {};
const SAFE = {top: sf.top ?? sf.y ?? 64, bottom: sf.bottom ?? sf.y ?? 64, left: sf.left ?? sf.x ?? 96, right: sf.right ?? sf.x ?? 96};
const subTop = F.subtitle?.mode === 'caption' ? (F.subtitle.y ?? 1300) - 90 : F.height - (F.subtitle?.bottom ?? 64) - (res.subtitles.includes('en') && res.subtitles !== 'en' ? 210 : 130);
for (const s of p.scenes) for (const sh of s.shots) for (const tx of sh.text ?? []) {
  const x = tx.x ?? F.width / 2, y = tx.y ?? F.height / 2;
  if (x < SAFE.left || x > F.width - SAFE.right || y < SAFE.top || y > F.height - SAFE.bottom) warns.push(`${sh.id}: ข้อความ "${tx.content}" (${x},${y}) อยู่นอก safe zone ของ ${F.id}`);
  else if (res.subtitles !== 'off' && Math.abs(y - (F.subtitle?.mode === 'caption' ? F.subtitle.y ?? 1300 : subTop + 60)) < 110) warns.push(`${sh.id}: ข้อความ "${tx.content}" y=${y} อาจทับซับ`);
}
// ---- คลิปสั้น (rule 02): hook ≤ 3 วิ · ไม่มีคำทักทาย/CTA ----
if (B.structure === 'short' && p.scenes[0]) {
  const s0 = p.scenes[0];
  const firstSeg = s0.vo.split(CUE)[0];
  const sec = chars(firstSeg) / B.charsPerSec;
  if (sec > 3.5) warns.push(`${s0.id}: ประโยคแรก (hook) ยาว ~${sec.toFixed(1)} วิ — คลิปสั้นควร ≤ 3 วิ`);
  for (const s of p.scenes) { const m = s.vo.match(/สวัสดี|ติดตาม|กดไลก์|กดแชร์|ตอนหน้า|ตอนต่อไป/); if (m) warns.push(`${s.id}: คลิปสั้นไม่ควรมี "${m[0]}" (จบในตัว ไม่ขอ CTA)`); }
}
const eraCount = new Set(p.scenes.map((s) => s.era)).size;
if (eraCount > res.style.maxEras) warns.push(`ใช้ ${eraCount} ยุค (ควร ≤ ${res.style.maxEras})`);
const par = kinds.filter((k) => k === 'parallax').length / kinds.length;
const [pMin, pMax] = res.style.mix.parallax;
if (par * 100 < pMin || par * 100 > pMax) warns.push(`สัดส่วน parallax ${(par * 100).toFixed(0)}% (ควร ${pMin}–${pMax}%)`);
let run = 0;
for (const k of kinds) { run = k === 'parallax' ? run + 1 : 0; if (run > res.style.maxParallaxRun) { errors.push(`parallax ติดกันเกิน ${res.style.maxParallaxRun} ช็อต`); break; } }
if (kinds.length < B.shots[0] || kinds.length > B.shots[1]) warns.push(`จำนวนช็อต ${kinds.length} (ควร ${B.shots[0]}–${B.shots[1]})`);
if (totalChars < B.chars.min || totalChars > B.chars.hard) warns.push(`ตัวอักษรรวม ${totalChars} (ควร ${B.chars.min.toLocaleString()}–${B.chars.max.toLocaleString()})`);
if (estSec < B.estSec[0] || estSec > B.estSec[1]) warns.push(`เวลาประมาณ ${estSec.toFixed(0)}s (เป้า ${B.targetSec}s)`);

// ---- ปก YouTube (rule 12) ----
const visLen = (x) => x.replace(/\*/g, '').replace(/[ัิ-ฺ็-๎]/g, '').length;
if (!p.covers?.length) warns.push('ยังไม่มี covers (ปก YouTube — rule 12)');
for (const c of p.covers ?? []) {
  const tag = `cover ${c.id}`;
  if (!c.title) { errors.push(`${tag}: ไม่มี title`); continue; }
  const lines = c.title.split('\n');
  const words = c.title.replace(/\*/g, '').trim().split(/\s+|\n/).filter(Boolean);
  if (lines.length > 2) errors.push(`${tag}: หัวข้อเกิน 2 บรรทัด`);
  if (lines.some((l) => visLen(l) > 10)) warns.push(`${tag}: บรรทัดยาวเกิน 10 ตัวอักษร — มือถืออ่านยาก`);
  if (visLen(c.title) > 18) warns.push(`${tag}: หัวข้อยาว ${visLen(c.title)} ตัวอักษร (ควร ≤ 18)`);
  if (plainEq(c.title, p.meta.title)) warns.push(`${tag}: หัวข้อเหมือนชื่อคลิปเป๊ะ — ควรเสริม ไม่ใช่ซ้ำ`);
  const all = [c.title, c.kicker, c.note].filter(Boolean).join(' ');
  if (/\d/.test(all)) {
    if (!c.sourceRef) errors.push(`${tag}: มีตัวเลขแต่ไม่มี sourceRef`);
    else if (!facts.includes(`| ${c.sourceRef} |`)) errors.push(`${tag}: sourceRef ${c.sourceRef} ไม่มีใน facts.md`);
  }
  if (!c.layers?.length) errors.push(`${tag}: ไม่มี layers`);
  for (const l of c.layers ?? []) assetOk(l.asset, tag);
  if (c.focus && !(c.layers ?? []).some((l) => l.id === c.focus)) errors.push(`${tag}: focus "${c.focus}" ไม่มีใน layers`);
}

console.log(`scenes ${p.scenes.length} · shots ${kinds.length} · covers ${p.covers?.length ?? 0} · parallax ${(par * 100).toFixed(0)}% · chars ${totalChars} · est ${estSec.toFixed(0)}s`);
if (imgPending.size) warns.push(`รูป AI ยังไม่ได้เลือก ${imgPending.size} รูป (ช็อตใช้ vector fallback ไปก่อน · ไม่มี fallback = กล่องชื่อ): ${[...imgPending].slice(0, 8).join(', ')}${imgPending.size > 8 ? '…' : ''} — python scripts/imagegen.py ${slug} แล้วเลือกในหน้า Asset list`);
warns.forEach((w) => console.log('⚠', w));
errors.forEach((e) => console.log('✗', e));
if (errors.length) process.exit(1);
console.log('✓ validate ผ่าน');
