// ตารางจับคู่ asset (rule 16 · "ใช้แทนของเดิม"): projects/<slug>/asset-map.json → {"map": {"chedi-bell": "user:my-chedi"}}
// ใช้ตอน render/stills/cover/validate — แทนทุก layer ที่เป็น asset นั้น โดยเก็บ vector เดิมไว้เป็นสำรอง (…|chedi-bell)
// ไม่แก้ shots.json → Shot list ที่อนุมัติแล้วไม่ล้าสมัย แต่ Render/QA/ปก จะล้าสมัย (assetsFingerprint)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT} from './settings.mjs';
import {imagesMap, imageSize} from './images.mjs';

const R = (...xs) => path.join(ROOT, ...xs);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const F = 1000;
export const TARGET_RE = /^(img|ref|user):[a-z0-9][a-z0-9-]{0,63}$/;
export const KEY_RE = /^((img|ref|user):)?[a-z0-9][a-z0-9-]{0,63}$/;

export const loadAssetMap = (slug) => readJson(R('projects', slug, 'asset-map.json'), {map: {}}).map ?? {};
export const saveAssetMap = (slug, map) => {
  const f = R('projects', slug, 'asset-map.json');
  const tmp = `${f}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({map}, null, 1) + '\n');
  fs.renameSync(tmp, f);
};

/** asset → {key ที่ใช้จับคู่, vector สำรอง} */
const parts = (a) => {
  const m = a.match(/^(img|ref|user):([^|]+)(?:\|(.+))?$/);
  if (m) return {full: `${m[1]}:${m[2]}`, fallback: m[3] ?? null};
  if (a.startsWith('placeholder:')) return null;
  return {full: null, fallback: a};
};
/** หา target สำหรับ layer นี้ (จับคู่ด้วย id รูปก่อน แล้วค่อยชื่อ vector) */
const ANIM_PROPS = ['grow', 'build', 'fall', 'wave', 'speed', 'from', 'to', 'highlight', 'count', 'text', 'at', 'fade', 'sink', 'pack', 'toMud', 'wipe'];
/** ค่าใน map: "user:x" หรือ {"to": "user:x", "keepAnimated": true} (ช็อตที่มี props ขยับยังใช้ของเดิม) */
export const entryOf = (v) => (typeof v === 'string' ? {to: v, keepAnimated: false} : v && typeof v.to === 'string' ? {to: v.to, keepAnimated: !!v.keepAnimated} : null);
const targetFor = (asset, map, props = {}) => {
  const p = parts(asset);
  if (!p) return null;
  const e = entryOf((p.full && map[p.full]) || (p.fallback && map[p.fallback]) || null);
  if (!e) return null;
  if (e.keepAnimated && Object.keys(props ?? {}).some((k) => ANIM_PROPS.includes(k) && props[k] !== false)) return null;
  const t = e.to;
  if (t === p.full) return null;
  return {asset: `${t}${p.fallback ? `|${p.fallback}` : ''}`};
};

export const eachLayer = (project, fn) => {
  for (const sc of project.scenes ?? []) for (const sh of sc.shots) for (const l of sh.layers ?? []) fn(l, sh.id, sh);
  for (const c of project.covers ?? []) for (const l of c.layers ?? []) fn(l, `cover-${c.id}`, null);
};

/** แทนที่ใน project (แก้ในหน่วยความจำ ไม่เขียนไฟล์) */
export const applyAssetMap = (project, map) => {
  let n = 0;
  if (!map || !Object.keys(map).length) return 0;
  eachLayer(project, (l) => {
    const t = targetFor(l.asset, map, l.props);
    if (t) { l.mappedFrom = l.asset; l.asset = t.asset; n++; }
  });
  return n;
};

/** ลายนิ้วมือของภาพที่วิดีโอใช้จริง (รูป AI ที่เลือก · ภาพจริงที่อนุมัติ · asset นำเข้า · ตารางจับคู่) */
export const assetsFingerprint = (slug) => {
  const shots = readJson(R('projects', slug, 'shots.json'), null);
  if (!shots) return null;
  const map = loadAssetMap(slug);
  const p = JSON.parse(JSON.stringify(shots));
  applyAssetMap(p, map);
  const ids = new Set();
  eachLayer(p, (l) => { const x = parts(l.asset); if (x?.full) ids.add(x.full.startsWith('img:') ? x.full.slice(4) : x.full); });
  const im = imagesMap(slug);
  const rows = [...ids].sort().map((id) => {
    const i = im[id];
    if (!i) return `${id}:-`;
    const f = R('public', i.src);
    const st = fs.existsSync(f) ? fs.statSync(f) : null;
    return `${id}:${i.src}:${st?.size ?? 0}:${Math.round(st?.mtimeMs ?? 0)}`;
  });
  return crypto.createHash('sha1').update(JSON.stringify({map, rows})).digest('hex').slice(0, 12);
};

/** สัดส่วน vector จาก src/assets (vb: [w, h]) — ไม่ต้อง import TSX */
let VB = null;
export const vectorAspects = () => {
  if (VB) return VB;
  VB = {};
  const idx = fs.readFileSync(R('src', 'assets', 'index.ts'), 'utf8');
  const mods = Object.fromEntries([...idx.matchAll(/import \* as (\w+) from '\.\/(\w+)'/g)].map((m) => [m[1], m[2]]));
  const vbOf = {};
  for (const [alias, file] of Object.entries(mods)) {
    const f = R('src', 'assets', `${file}.tsx`);
    if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/export const (\w+): AssetDef = \{\s*vb: \[(\d+),\s*(\d+)\]/g)) vbOf[`${alias}.${m[1]}`] = +m[3] / +m[2];
  }
  for (const m of idx.matchAll(/^\s*'?([\w-]+)'?:\s*(\w+\.\w+),/gm)) if (vbOf[m[2]]) VB[m[1]] = vbOf[m[2]];
  return VB;
};


/** ผลกระทบถ้าจับคู่ from → to (ยังไม่บันทึก) */
export const mapImpact = (slug, from, to, keepAnimated = false) => {
  const shots = readJson(R('projects', slug, 'shots.json'), null);
  if (!shots) throw Object.assign(new Error('ยังไม่มี shots.json'), {code: 400});
  if (!KEY_RE.test(from) || !TARGET_RE.test(to)) throw Object.assign(new Error('ชื่อ asset ไม่ถูกต้อง'), {code: 400});
  const im = imagesMap(slug);
  const key = to.startsWith('img:') ? to.slice(4) : to;
  const info = im[key];
  const warnings = [];
  if (!info) warnings.push(`${to} ยังไม่พร้อมใช้ (ยังไม่เลือก/ไม่อนุมัติ/ไม่มีไฟล์) — ระหว่างนี้วิดีโอใช้ vector เดิม`);
  const size = info ? imageSize(R('public', info.src)) : null;
  const W = shots.meta?.width ?? 1920;
  const shotsHit = [], coversHit = [], anim = new Set();
  let maxPx = 0;
  const base = from.includes(':') ? null : from;
  const vAspect = base ? vectorAspects()[base] : null;
  eachLayer(shots, (l, where, sh) => {
    const t = targetFor(l.asset, {[from]: {to, keepAnimated}}, l.props);
    if (!t) return;
    const list = where.startsWith('cover-') ? coversHit : shotsHit;
    if (!list.includes(where)) list.push(where);
    for (const k of Object.keys(l.props ?? {})) if (ANIM_PROPS.includes(k) && l.props[k] !== false) anim.add(k);
    const cam = sh?.camera;
    const zs = cam ? [cam.from?.z ?? 0, cam.to?.z ?? 0] : [0];
    const s = Math.max(...zs.map((z) => F / Math.max(50, (l.z ?? 1000) - z)));
    maxPx = Math.max(maxPx, (l.cover ? W : l.w ?? 600) * s);
  });
  if (!shotsHit.length && !coversHit.length) warnings.push(`ไม่มีช็อตไหนใช้ "${from}" — ไม่มีอะไรเปลี่ยน`);
  if (info && vAspect) {
    const r = info.aspect / vAspect;
    if (r > 1.35 || r < 0.74) warnings.push(`สัดส่วนต่างจากของเดิมมาก (เดิม ${vAspect.toFixed(2)} · ใหม่ ${info.aspect.toFixed(2)} สูง/กว้าง) — ภาพจะสูง/เตี้ยกว่าที่วางไว้ อาจทับตัวหนังสือหรือซับ`);
  }
  if (size && maxPx > size.w * 1.15) warnings.push(`ความละเอียดไม่พอ: ช็อตที่ใหญ่สุดต้องการ ~${Math.round(maxPx)}px แต่รูปกว้าง ${size.w}px — อาจแตก`);
  if (anim.size) warnings.push(`ของเดิมมีท่าขยับ (${[...anim].join(', ')}) — รูปนิ่งจะไม่มีท่าเหล่านี้ (เลือก "เก็บช็อตที่ขยับไว้เป็นของเดิม" ได้)`);
  if (info?.kind === 'photo') warnings.push('รูปชนิด photo จะแสดงแบบติดกระดาษ (ขอบขาว + เงา)');
  return {from, to, keepAnimated, shots: shotsHit, covers: coversHit, ready: !!info, warnings,
    stale: ['preview', 'qa', ...(coversHit.length ? ['cover'] : [])], voiceUnaffected: true};
};
