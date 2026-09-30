// ลบโปรเจกต์แบบกู้คืนได้: ย้าย projects/<slug>, public/<slug>, ไฟล์ out/ ของเรื่องนั้น → projects/_trash/<slug>-<เวลา>/
// ล้างถังขยะ = ลบถาวร (ทำจากหน้า HistoryTeller เท่านั้น — Claude ไม่ลบโปรเจกต์เอง · rule 13)
import fs from 'node:fs';
import path from 'node:path';
import {P, listSlugs, validSlug} from './project.mjs';

const TRASH = P('projects', '_trash');
const stamp = () => new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-'); // 20260929-061929

/** ไฟล์/โฟลเดอร์ใน out/ ที่เป็นของ slug นี้ — กันชนกับ slug ที่ขึ้นต้นเหมือนกัน (adam vs adam-short-1) โดยเลือกเจ้าของที่ชื่อยาวสุด */
const ownerOf = (name, slugs) => slugs.filter((s) => name === s || name.startsWith(s + '.') || name.startsWith(s + '-')).sort((a, b) => b.length - a.length)[0];
const outItems = (slug) => {
  const slugs = listSlugs();
  const items = [];
  for (const dir of ['out', 'out/cover', 'out/stills', 'out/dump', 'out/archive', 'out/audition']) {
    const abs = P(dir);
    if (!fs.existsSync(abs)) continue;
    for (const n of fs.readdirSync(abs)) if (ownerOf(n, slugs) === slug) items.push(path.join(dir, n));
  }
  return items;
};

const move = (fromRel, toAbs) => {
  fs.mkdirSync(path.dirname(toAbs), {recursive: true});
  fs.renameSync(P(fromRel), toAbs);
};

export const trashProject = (slug) => {
  if (!validSlug(slug) || !fs.existsSync(P('projects', slug))) throw Object.assign(new Error('ไม่พบโปรเจกต์'), {code: 404});
  const id = `${slug}-${stamp()}`;
  const root = path.join(TRASH, id);
  const moved = [];
  const items = [path.join('projects', slug), ...(fs.existsSync(P('public', slug)) ? [path.join('public', slug)] : []), ...outItems(slug)];
  for (const rel of items) { move(rel, path.join(root, rel)); moved.push(rel); }
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({slug, deletedAt: new Date().toISOString(), items: moved}, null, 2));
  return {id, items: moved};
};

const dirSize = (abs) => {
  let n = 0;
  for (const e of fs.readdirSync(abs, {withFileTypes: true})) {
    const f = path.join(abs, e.name);
    n += e.isDirectory() ? dirSize(f) : fs.statSync(f).size;
  }
  return n;
};

export const listTrash = () => {
  if (!fs.existsSync(TRASH)) return [];
  return fs.readdirSync(TRASH).filter((d) => fs.existsSync(path.join(TRASH, d, 'manifest.json'))).map((d) => {
    const m = JSON.parse(fs.readFileSync(path.join(TRASH, d, 'manifest.json'), 'utf8'));
    return {id: d, slug: m.slug, deletedAt: m.deletedAt, items: m.items.length, bytes: dirSize(path.join(TRASH, d)), canRestore: !fs.existsSync(P('projects', m.slug))};
  }).sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
};

const trashDir = (id) => {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id) || !fs.existsSync(path.join(TRASH, id, 'manifest.json'))) throw Object.assign(new Error('ไม่พบในถังขยะ'), {code: 404});
  return path.join(TRASH, id);
};

export const restoreTrash = (id) => {
  const root = trashDir(id);
  const m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  if (fs.existsSync(P('projects', m.slug))) throw Object.assign(new Error(`มีโปรเจกต์ชื่อ ${m.slug} อยู่แล้ว`), {code: 409});
  for (const rel of m.items) if (fs.existsSync(P(rel))) throw Object.assign(new Error(`มีไฟล์ ${rel} อยู่แล้ว — กู้คืนทับไม่ได้`), {code: 409});
  for (const rel of m.items) { fs.mkdirSync(path.dirname(P(rel)), {recursive: true}); fs.renameSync(path.join(root, rel), P(rel)); }
  fs.rmSync(root, {recursive: true, force: true});
  return {slug: m.slug};
};

export const purgeTrash = (id) => { fs.rmSync(trashDir(id), {recursive: true, force: true}); return {ok: true}; };
