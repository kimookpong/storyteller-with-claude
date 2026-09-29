// ไฟล์ซับจากเวลาจริงของเสียงพากย์ → out/<slug>.th.srt / .en.srt (+ .vtt)
// node scripts/subs.mjs <slug>   (render.mjs เรียกให้เองหลัง render)
// เวลา = สูตรเดียวกับ src/timing/resolve.ts + Main.tsx (head 6 / tail 12 เฟรม, transition ซ้อนซีน) · ตัดชุดด้วย scripts/lib/subchunks.mjs
import fs from 'node:fs';
import {subChunks} from './lib/subchunks.mjs';
import {loadSettings, resolve, budget} from './lib/settings.mjs';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('ใช้: node scripts/subs.mjs <slug>'); process.exit(1); }
const p = JSON.parse(fs.readFileSync(`projects/${slug}/shots.json`, 'utf8'));
const fps = p.meta.fps ?? 30;
const CUE = /\[#([A-Za-z0-9_-]+)\]/g;
const HEAD = 6 / 30, TAIL = 12 / 30;
const speakChars = (s) => s.replace(CUE, '').replace(/[\s…]/g, '').length;
const r = resolve(loadSettings(slug));
const cps = budget(r).charsPerSec;
// ตัดชุดตาม format เดียวกับในวิดีโอ (แนวตั้ง = บรรทัดสั้น 1 บรรทัด) — ค่าเริ่มตรงกับ src/format.ts
const sc = r.format.subtitle ?? {};
const CHUNK = {thMax: sc.maxLineChars ?? 38, enMax: sc.enMaxLineChars ?? 48, lines: sc.maxLines ?? 2};
const est = (s) => speakChars(s) / cps + (s.match(/…/g)?.length ?? 0) * 0.3 + (s.split(/\n\s*\n/).length - 1) * 0.8;
const split = (vo, first) => {
  const out = []; let last = 0, id = first;
  vo.replace(CUE, (m, cue, idx) => { out.push({id, text: vo.slice(last, idx).trim()}); id = cue; last = idx + m.length; return m; });
  out.push({id, text: vo.slice(last).trim()});
  return out;
};
const tf = (i) => (i === 0 ? 0 : p.scenes[i].era !== p.scenes[i - 1].era ? 20 : 12);
const n = p.scenes.length;
let missing = 0, start = 0;
const cues = [];
p.scenes.forEach((s, i) => {
  let vo = null;
  try { vo = JSON.parse(fs.readFileSync(`public/${slug}/vo/${s.id}.json`, 'utf8')); } catch { missing++; }
  const parts = split(s.vo, s.shots[0].id);
  const en = s.voEn ? Object.fromEntries(split(s.voEn, s.shots[0].id).map((x) => [x.id, x.text])) : {};
  const speech = vo ? vo.durationMs / 1000 : est(s.voTTS || s.vo);
  const extra = tf(i + 1 < n ? i + 1 : 0);
  const dur = Math.round((HEAD + speech + TAIL + (s.holdAfter ?? 0)) * fps) + extra;
  const total = parts.reduce((a, x) => a + speakChars(x.text), 0) || 1;
  let acc = 0;
  const st = parts.map((x) => { const c = vo?.cues?.[x.id]; const v = c !== undefined ? c / 1000 : (acc / total) * speech; acc += speakChars(x.text); return v; });
  parts.forEach((x, k) => {
    const from = k === 0 ? 0 : Math.round((HEAD + st[k]) * fps);
    const to = k === parts.length - 1 ? dur : Math.round((HEAD + st[k + 1]) * fps);
    cues.push({a: (start + from) / fps, b: (start + to) / fps, th: x.text, en: en[x.id] ?? ''});
  });
  start += dur - (i + 1 < n ? tf(i + 1) : 0);
});
const ts = (sec, sep) => {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${sep}${String(ms % 1000).padStart(3, '0')}`;
};
const build = (lang) => {
  const items = [];
  for (const c of cues) {
    for (const ch of subChunks(c.th, c.en, lang, CHUNK)) {
      const lines = lang === 'th' ? ch.th : ch.en;
      if (!lines.length) continue;
      items.push({a: c.a + (c.b - c.a) * ch.from, b: c.a + (c.b - c.a) * ch.to - 0.04, text: lines.join('\n')});
    }
  }
  // ซีนซ้อนกันช่วง transition → ตัดท้ายชุดก่อนหน้าไม่ให้ทับชุดถัดไป
  for (let i = 0; i + 1 < items.length; i++) items[i].b = Math.min(items[i].b, items[i + 1].a - 0.04);
  return items;
};
fs.mkdirSync('out', {recursive: true});
const langs = ['th', ...(p.scenes.some((s) => s.voEn) ? ['en'] : [])];
for (const lang of langs) {
  const items = build(lang);
  fs.writeFileSync(`out/${slug}.${lang}.srt`, items.map((x, i) => `${i + 1}\n${ts(x.a, ',')} --> ${ts(x.b, ',')}\n${x.text}\n`).join('\n'));
  fs.writeFileSync(`out/${slug}.${lang}.vtt`, 'WEBVTT\n\n' + items.map((x) => `${ts(x.a, '.')} --> ${ts(x.b, '.')}\n${x.text}\n`).join('\n'));
  console.log(`✓ out/${slug}.${lang}.srt / .vtt  (${items.length} ชุด)`);
}
if (missing) console.log(`⚠ ยังไม่มีเสียง ${missing} ซีน — เวลาในไฟล์ซับเป็นค่าประมาณ (สร้างเสียงแล้วรันใหม่)`);
if (!p.scenes.some((s) => s.voEn)) console.log('ℹ ยังไม่มีคำแปล voEn — ได้เฉพาะซับไทย');
