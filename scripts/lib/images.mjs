// รูปจาก AI ของโปรเจกต์ (scripts/imagegen.py) → map ที่ Remotion ใช้ (project.images) — ใช้โดย render/stills/cover/validate/HistoryTeller
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './settings.mjs';

const R = (...xs) => path.join(ROOT, ...xs);
const readJson = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

export const imagesSpec = (slug) => readJson(R('projects', slug, 'images.json'));
export const imagesLock = (slug) => readJson(R('projects', slug, 'images.lock.json'), {selected: {}, candidates: {}, cost: 0});

/** กว้าง/สูงของ PNG/JPEG/WebP จาก header (ไม่ต้องมี lib) */
export const imageSize = (file) => {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return {w: b.readUInt32BE(16), h: b.readUInt32BE(20)};
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const k = b.toString('ascii', 12, 16);
    if (k === 'VP8X') return {w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3)};
    if (k === 'VP8L') { const v = b.readUInt32LE(21); return {w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1}; }
    return {w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff};
  }
  for (let i = 2; i < b.length - 9;) { // JPEG SOF
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return {w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5)};
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
};

/** {id: {src, aspect, kind}} ของรูปที่ "เลือกแล้ว" เท่านั้น (src = path ใน public/) */
export const imagesMap = (slug) => {
  const spec = imagesSpec(slug);
  const lock = imagesLock(slug);
  const kinds = Object.fromEntries((spec?.images ?? []).map((x) => [x.id, x.kind ?? 'cutout']));
  const out = {};
  for (const [id, sel] of Object.entries(lock.selected ?? {})) {
    const rel = `${slug}/img/${id}.png`;
    const abs = R('public', rel);
    if (!fs.existsSync(abs)) continue;
    const sz = imageSize(abs);
    out[id] = {src: rel, aspect: sz ? sz.h / sz.w : 1, kind: kinds[id] ?? sel.kind ?? 'cutout'};
  }
  return out;
};
