// Asset ที่ผู้ใช้นำเข้าเอง (โลโก้ ภาพถ่ายของตัวเอง ภาพที่มีสิทธิ์ใช้) — rules/16-user-assets.md
// โปรเจกต์: projects/<slug>/imports.json + public/<slug>/user/<id>.<ext>
// คลัง (ใช้ได้ทุกโปรเจกต์): library/library.json + public/_library/<id>.<ext>
// ใช้ในช็อต: "user:<id>|<vector-fallback>" — หาในโปรเจกต์ก่อน แล้วค่อยหาในคลัง
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './settings.mjs';

const R = (...xs) => path.join(ROOT, ...xs);
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, o) => { fs.mkdirSync(path.dirname(f), {recursive: true}); const tmp = `${f}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify(o, null, 1) + '\n'); fs.renameSync(tmp, f); };

export const KINDS = {
  photo: 'ภาพถ่าย/เอกสาร — แสดงแบบติดกระดาษ (ขอบขาว + เงา)',
  cutout: 'ภาพพื้นโปร่งใส (PNG) — วางลอยเหมือนตัวละคร/สิ่งของ',
  plate: 'ฉากหลังเต็มจอ',
  logo: 'โลโก้/ลายน้ำ — แสดงตามจริง ไม่ใส่ filter',
};
export const ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const metaFile = (slug) => (slug ? R('projects', slug, 'imports.json') : R('library', 'library.json'));
const dirRel = (slug) => (slug ? `${slug}/user` : '_library');

/** ขนาดภาพจาก header (PNG/JPEG/WebP) */
export const sniff = (b) => {
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return {ext: '.png', w: b.readUInt32BE(16), h: b.readUInt32BE(20)};
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const k = b.toString('ascii', 12, 16);
    if (k === 'VP8X') return {ext: '.webp', w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3)};
    if (k === 'VP8L') { const v = b.readUInt32LE(21); return {ext: '.webp', w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1}; }
    return {ext: '.webp', w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff};
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9;) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return {ext: '.jpg', w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5)};
      i += 2 + b.readUInt16BE(i + 2);
    }
    return {ext: '.jpg', w: 0, h: 0};
  }
  return null;
};

export const loadImports = (slug) => readJson(metaFile(slug), {assets: []}).assets ?? [];

const clean = (m) => ({
  title: String(m.title ?? '').trim().slice(0, 120),
  description: String(m.description ?? '').trim().slice(0, 1000),
  kind: KINDS[m.kind] ? m.kind : 'photo',
  tags: (Array.isArray(m.tags) ? m.tags : String(m.tags ?? '').split(',')).map((x) => String(x).trim()).filter(Boolean).slice(0, 12),
  era: m.era ? String(m.era) : null,
  owner: String(m.owner ?? '').trim().slice(0, 200),
  credit: String(m.credit ?? '').trim().slice(0, 200),
});

/** นำเข้าไฟล์ภาพ (Buffer) → คืน record · slug = null คือคลังกลาง */
export const addImport = (slug, buf, meta) => {
  const s = sniff(buf);
  if (!s) throw Object.assign(new Error('รองรับเฉพาะ PNG / JPEG / WebP'), {code: 400});
  if (buf.length > 20 * 1024 * 1024) throw Object.assign(new Error('ไฟล์ใหญ่เกิน 20MB'), {code: 400});
  const id = String(meta.id ?? '').trim().toLowerCase();
  if (!ID_RE.test(id)) throw Object.assign(new Error('id ใช้ได้แค่ a-z 0-9 และ - (เช่น my-logo)'), {code: 400});
  const m = clean(meta);
  if (!m.description) throw Object.assign(new Error('ใส่คำอธิบายด้วย — Claude ใช้คำอธิบายนี้ตัดสินว่าจะใช้ภาพในช็อตไหน'), {code: 400});
  if (!m.owner) throw Object.assign(new Error('ระบุที่มา/สิทธิ์ของภาพ (เช่น "ถ่ายเอง", "โลโก้ของช่อง", "ซื้อ license จาก …")'), {code: 400});
  const list = loadImports(slug);
  if (list.some((x) => x.id === id) && !meta.replace) throw Object.assign(new Error(`มี id "${id}" อยู่แล้ว`), {code: 409});
  const rel = `${dirRel(slug)}/${id}${s.ext}`;
  fs.mkdirSync(R('public', dirRel(slug)), {recursive: true});
  for (const old of list.filter((x) => x.id === id)) if (old.file !== rel && fs.existsSync(R('public', old.file))) fs.unlinkSync(R('public', old.file));
  fs.writeFileSync(R('public', rel), buf);
  const rec = {id, ...m, file: rel, width: s.w, height: s.h, bytes: buf.length, importedAt: new Date().toISOString()};
  writeJson(metaFile(slug), {assets: [...list.filter((x) => x.id !== id), rec]});
  return rec;
};

export const updateImport = (slug, id, meta) => {
  const list = loadImports(slug);
  const i = list.findIndex((x) => x.id === id);
  if (i < 0) throw Object.assign(new Error('ไม่พบ asset'), {code: 404});
  list[i] = {...list[i], ...clean({...list[i], ...meta}), updatedAt: new Date().toISOString()};
  writeJson(metaFile(slug), {assets: list});
  return list[i];
};

export const removeImport = (slug, id) => {
  const list = loadImports(slug);
  const x = list.find((a) => a.id === id);
  if (!x) throw Object.assign(new Error('ไม่พบ asset'), {code: 404});
  if (fs.existsSync(R('public', x.file))) fs.unlinkSync(R('public', x.file));
  writeJson(metaFile(slug), {assets: list.filter((a) => a.id !== id)});
  return {ok: true};
};

/** ทุก asset ที่โปรเจกต์นี้ใช้ได้ (โปรเจกต์ทับคลังเมื่อ id ซ้ำ) */
export const availableImports = (slug) => {
  const own = loadImports(slug).map((x) => ({...x, scope: 'project'}));
  const lib = loadImports(null).filter((x) => !own.some((o) => o.id === x.id)).map((x) => ({...x, scope: 'library'}));
  return [...own, ...lib].filter((x) => fs.existsSync(R('public', x.file)));
};

/** {"user:<id>": {src, aspect, kind, credit}} สำหรับ Remotion (project.images) */
export const importsMap = (slug) => Object.fromEntries(availableImports(slug).map((x) => [`user:${x.id}`, {
  src: x.file, aspect: x.width ? x.height / x.width : 0.75, kind: x.kind, ...(x.credit ? {credit: x.credit} : {}),
}]));
