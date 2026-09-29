// Settings ของโปรเจกต์ (แนวทางวิดีโอ · ความยาว · เสียงพากย์) + งบที่คำนวณได้ — ต้นฉบับเดียวของตัวเลขทั้งหมด
// ใช้โดย: scripts/validate.mjs, scripts/tts.py (ผ่าน CLI --json), app/ (HistoryTeller)
// CLI:  node scripts/lib/settings.mjs <slug>          → ตารางงบ
//       node scripts/lib/settings.mjs <slug> --json   → JSON {settings, resolved, budget}
//       node scripts/lib/settings.mjs --target 300 --voice doc-narrator --style archive-doc
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const R = (...xs) => path.join(ROOT, ...xs);
const readJson = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

export const DEFAULTS = {format: 'landscape-16x9', style: 'kurzgesagt-vox', voice: 'friend-sleepy-male', targetSec: 180, subtitles: 'th'};
/** ซับที่ฝังในวิดีโอ: ไทย · ไทย+อังกฤษ · อังกฤษ · ไม่ฝัง (ไฟล์ .srt/.vtt ออกทุกภาษาที่มีเสมอ) */
export const SUB_MODES = {th: 'ไทย', 'th+en': 'ไทย + อังกฤษ', en: 'อังกฤษ', off: 'ไม่ฝังซับ'};
export const LENGTH_CHOICES = [30, 60, 180, 300, 480, 600];
const KINDS = {format: 'formats', style: 'styles', voice: 'voices'};

export const listPresets = () => {
  const out = {};
  for (const [k, dir] of Object.entries(KINDS)) {
    const d = R('presets', dir);
    out[k] = fs.existsSync(d)
      ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).sort().map((f) => readJson(path.join(d, f))).filter(Boolean)
      : [];
  }
  return out;
};
export const loadPreset = (kind, id) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(String(id))) throw new Error(`ชื่อ preset ไม่ถูกต้อง: ${id}`);
  const p = readJson(R('presets', KINDS[kind], `${id}.json`));
  if (!p) throw new Error(`ไม่พบ preset ${kind} "${id}" (presets/${KINDS[kind]}/${id}.json)`);
  return p;
};

/** ยุคที่ Remotion รองรับจริง (key ของ ERAS ใน src/era/eras.ts) */
export const supportedEras = () => {
  const src = fs.existsSync(R('src', 'era', 'eras.ts')) ? fs.readFileSync(R('src', 'era', 'eras.ts'), 'utf8') : '';
  const body = src.slice(src.indexOf('export const ERAS'));
  return [...body.matchAll(/^\s{2}'?([a-z0-9-]+)'?:\s*\{/gm)].map((m) => m[1]);
};

const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const merge = (a, b) => {
  if (!isObj(b)) return b === undefined ? a : b;
  const o = {...(isObj(a) ? a : {})};
  for (const [k, v] of Object.entries(b)) o[k] = merge(o[k], v);
  return o;
};

export const settingsPath = (slug) => R('projects', slug, 'settings.json');
/** settings.json ของโปรเจกต์ (ไม่มีไฟล์ = ค่าเริ่มต้น + targetSec จาก shots.json) */
export const loadSettings = (slug) => {
  const s = readJson(settingsPath(slug));
  const meta = readJson(R('projects', slug, 'shots.json'))?.meta;
  return {...DEFAULTS, ...(meta?.targetSec ? {targetSec: meta.targetSec} : {}), ...(s ?? {}), exists: !!s};
};

export const resolve = (settings) => {
  const s = {...DEFAULTS, ...settings};
  const o = s.overrides ?? {};
  const T = Number(s.targetSec);
  if (!Number.isFinite(T) || T < 30 || T > 1800) throw new Error(`targetSec ต้องอยู่ระหว่าง 30–1800 วินาที (ได้ ${s.targetSec})`);
  if (!(s.subtitles in SUB_MODES)) throw new Error(`subtitles ต้องเป็น ${Object.keys(SUB_MODES).join(' / ')} (ได้ ${s.subtitles})`);
  return {
    targetSec: Math.round(T),
    subtitles: s.subtitles,
    format: merge(loadPreset('format', s.format), o.format),
    style: merge(loadPreset('style', s.style), o.style),
    voice: merge(loadPreset('voice', s.voice), o.voice),
  };
};

const round5 = (x) => Math.round(x / 5) * 5;
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const SPEECH_RATIO = 0.95; // coffee-world: เสียง 165.5 วิ ในวิดีโอ 174.3 วิ

/** งบทั้งหมดจาก targetSec + อัตราพูดของเสียง + จังหวะภาพของ style */
export const budget = (res) => {
  const T = res.targetSec;
  // อัตราพูดจริง = charsPerSec × tempo (tempo = เร่งทั้งซีนด้วย ffmpeg ใน tts.py)
  const r = +(res.voice.charsPerSec * (res.voice.tts?.tempo ?? 1)).toFixed(2);
  const sh = res.style.shotSec;
  const short = T <= 75;
  // คลิปสั้นแทบไม่มีช่วงเงียบ/transition → พูดได้ ~97% ของเวลา
  const SR = short ? 0.97 : SPEECH_RATIO;
  const charsMax = round5(T * SR * r);
  const tol = Math.round(T * 0.083);
  // beat: hook/outro คงที่ช่วงหนึ่ง ส่วนกลางแบ่งตามสัดส่วนของโครง 3 นาทีเดิม
  // คลิปยาว: hook/outro เกือบคงที่ · คลิปสั้น (≤ 1:15, rule 02): hook ≤ 3 วิ, reveal 2–3 ครั้ง, payoff, loop line (outro) ≤ 3 วิ
  const hook = short ? 3 : Math.round(clamp(T * 0.067, 8, 15));
  const outro = short ? (T <= 40 ? 2 : 3) : Math.round(clamp(T * 0.028, 4, 10));
  const mid = T - hook - outro;
  const plan = (short
    ? T <= 40
      ? [['hook', hook], ['act1', 0.37], ['act2', 0.37], ['payoff', 0.26], ['outro', outro]]
      : [['hook', hook], ['setup', 0.13], ['act1', 0.26], ['act2', 0.26], ['act3', 0.22], ['payoff', 0.13], ['outro', outro]]
    : [['hook', hook], ['setup', 0.11], ['act1', 0.245], ['act2', 0.276], ['act3', 0.245], ['payoff', 0.124], ['outro', outro]]
  ).map(([k, v]) => [k, v < 1 ? Math.round(v * mid) : v]);
  const sum = plan.reduce((a, [, v]) => a + v, 0);
  plan[plan.length - 2][1] += T - sum; // ปัดเศษเข้า payoff
  let t = 0;
  const avgShot = (sh.min + sh.max) / 2;
  const beats = plan.map(([key, sec]) => {
    const b = {key, from: t, to: t + sec, sec, chars: round5(sec * SR * r), shots: [Math.max(1, Math.round(sec / sh.max)), Math.max(1, Math.round(sec / sh.min))]};
    t += sec;
    return b;
  });
  const actsSec = beats.filter((b) => /^act/.test(b.key)).reduce((a, b) => a + b.sec, 0);
  return {
    targetSec: T,
    acceptSec: [T - tol, T + tol],
    estSec: [Math.round(T * 0.889), T + tol],
    speechSec: short ? [Math.round(T * 0.85), Math.round(T * 1.05)] : [Math.round(T * 0.833), Math.round(T * 1.028)],
    charsPerSec: r,
    chars: {min: round5(charsMax * 0.88), max: charsMax, hard: round5(charsMax * 1.09)},
    shots: [Math.round(T / sh.max), Math.round(T / sh.min)],
    avgShotSec: avgShot,
    reveals: short ? (T <= 40 ? 2 : 3) : Math.max(1, Math.round(T / 35)),
    structure: short ? 'short' : T >= 420 ? 'chapters' : 'beats',
    warnings: [
      ...(res.format.height > res.format.width && T > 90 ? [`แนวตั้ง ${T} วิ — ระบบออกแบบโครงคลิปสั้นไว้ที่ 30 วิ / 1 นาที`] : []),
      ...(res.format.height > res.format.width && res.style.shotSec.max > 3 ? [`แนวตั้งควรใช้สไตล์จังหวะเร็ว (เช่น "shorts-punch") — สไตล์นี้ช็อตยาว ${res.style.shotSec.min}–${res.style.shotSec.max} วิ`] : []),
      ...(res.format.height <= res.format.width && short ? ['คลิปสั้น ≤ 1:15 ในแนวนอน — ถ้าจะลง TikTok/Reels/Shorts ให้เลือก format แนวตั้ง 9:16'] : []),
      ...(res.voice.pace === 'fast' && T > 120 ? [`เสียง "${res.voice.name}" เร็วมาก — คลิปยาวเกิน 2 นาทีคนดูจะล้า (แนะนำคลิปสั้น)`] : []),
      ...(res.voice.calibrated ? [] : [`อัตราพูด ${res.voice.charsPerSec} ตัว/วิ ยังไม่วัดจริง — กด "ลองเสียง" ก่อนเขียนบท`]),
    ],
    chapters: T >= 420 ? clamp(Math.round(actsSec / 105), 3, 5) : null,
    beats,
  };
};

/** ลายนิ้วมือของ settings ส่วนที่ stage นั้นขึ้นอยู่ — เปลี่ยนแล้ว stage นั้น "ล้าสมัย" (rule 13) */
export const settingsFingerprint = (settings, stageKey) => {
  const s = {...DEFAULTS, ...settings};
  const o = s.overrides ?? {};
  const deps = {
    beats: [s.targetSec, s.style],
    // ซับอังกฤษ = บทต้องมีคำแปล (voEn) → เปิด en ทีหลังทำให้บทล้าสมัย (ต่อท้ายเฉพาะตอนเปิด เพื่อไม่ให้ hash เดิมเปลี่ยน)
    script: [s.targetSec, s.voice, o.voice?.persona, o.voice?.charsPerSec, ...(String(s.subtitles).includes('en') ? ['en'] : [])],
    shots: [s.targetSec, s.style, s.format, o.style && {...o.style, audio: undefined}, o.format],
    voice: [s.voice, o.voice?.tts],
    cover: [s.format, s.style],
    preview: [s.style, o.style?.audio],
  }[stageKey];
  if (!deps) return null;
  return crypto.createHash('sha1').update(JSON.stringify(deps)).digest('hex').slice(0, 10);
};

/** สิ่งที่ Claude ต้องรู้ตอนเขียนบท/ช็อต — ใช้ใน prompt และ `npm run budget` */
export const describe = (res, b) => {
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const p = res.voice.persona;
  const lines = [
    `รูปแบบ: ${res.format.name} (${res.format.width}×${res.format.height})`,
    `ความยาว ${mmss(b.targetSec)} (ยอมรับ ${mmss(b.acceptSec[0])}–${mmss(b.acceptSec[1])}) · โครง: ${{short: `คลิปสั้นจบในตัว (hook ≤ 3 วิ → reveal ${b.reveals} ครั้ง → payoff → ประโยควนกลับ)`, beats: '7 beat (rule 02)', chapters: `แบ่ง ${b.chapters} บท (rule 02)`}[b.structure]}`,
    `บท ${b.chars.min.toLocaleString()}–${b.chars.max.toLocaleString()} ตัวอักษร (เกิน ${b.chars.hard.toLocaleString()} = ต้องตัด) · อัตราพูด ${b.charsPerSec} ตัว/วิ${(res.voice.tts?.tempo ?? 1) !== 1 ? ` (รวม tempo ×${res.voice.tts.tempo})` : ''}${res.voice.calibrated ? '' : ' (ยังไม่วัดจริง — ประมาณ)'}`,
    `ช็อต ${b.shots[0]}–${b.shots[1]} (เฉลี่ย ${res.style.shotSec.min}–${res.style.shotSec.max} วิ, ยาวสุด ${res.style.shotSec.hardMax} วิ) · mini-reveal ≥ ${b.reveals} ครั้ง`,
    `สไตล์: ${res.style.name} — parallax ${res.style.mix.parallax.join('–')}%, collage ${res.style.mix.collage.join('–')}%, data ${res.style.mix.data.join('–')}% · ยุคที่ใช้ได้: ${res.style.eras.join(', ')} (≤ ${res.style.maxEras})`,
    `เสียง: ${res.voice.name} (${res.voice.tts.voice}) · สรรพนาม "${p.pronoun}" · คำลงท้าย: ${p.particles.join(' ') || '— ไม่ใช้'}${p.polite ? ` · "${p.polite.word}" ใช้ได้เฉพาะ ${p.polite.allowedBeats.join(', ')}` : ''} · แนวทาง: ${res.voice.guide}`,
    `เพลง/SFX (rule 08): ${res.style.audio?.music ? `เพลงประกอบ (ยุคเก่า/ใหม่สลับโทนเอง) ดังช่วงว่าง ${res.style.audio.musicGap} · ใต้เสียงพากย์ ${res.style.audio.musicUnderVo}` : 'ไม่มีเพลง'} · SFX ${res.style.audio?.sfx ? `อัตโนมัติตามชนิดช็อต (${res.style.audio.sfxVolume})` : 'ปิด'}`,
    `ซับ: ${SUB_MODES[res.subtitles]}${res.subtitles.includes('en') ? ' — บทต้องมีคำแปลอังกฤษ voEn ทุกซีน (cue เดียวกับ vo)' : ''} · ไฟล์ .srt/.vtt ทุกภาษาที่มี`,
    ...b.warnings.filter((w) => !/ยังไม่วัดจริง/.test(w)).map((w) => `⚠ ${w}`),
    'Beat:',
    ...b.beats.map((x) => `  ${x.key.padEnd(7)} ${mmss(x.from)}–${mmss(x.to)}  ~${x.chars} ตัวอักษร  ${x.shots[0]}–${x.shots[1]} ช็อต`),
  ];
  return lines.join('\n');
};

// ---------- CLI ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : undefined; };
  const slug = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  try {
    const base = slug ? loadSettings(slug) : {...DEFAULTS};
    const s = {...base, ...(opt('target') ? {targetSec: Number(opt('target'))} : {}), ...(opt('voice') ? {voice: opt('voice')} : {}), ...(opt('style') ? {style: opt('style')} : {})};
    const res = resolve(s);
    const b = budget(res);
    if (args.includes('--json')) {
      console.log(JSON.stringify({settings: s, resolved: res, budget: b, supportedEras: supportedEras()}));
    } else {
      console.log(`${slug ? `projects/${slug}/settings.json${s.exists ? '' : ' (ยังไม่มีไฟล์ — ใช้ค่าเริ่มต้น)'}` : 'ค่าเริ่มต้น'}\n`);
      console.log(describe(res, b));
    }
  } catch (e) {
    console.error('✗ ' + e.message);
    process.exit(1);
  }
}
