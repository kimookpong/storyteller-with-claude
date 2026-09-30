// การใช้ asset ในคลิป (หน้า Asset list): ช็อต/ปกที่ใช้ · แบบ (props) ที่ใช้จริง · style · ภาพ AI / ภาพจริง / ของผู้ใช้ที่มาแทน
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const readJson = (p, d = null) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

/** แยก "img:<id>|<fallback>" / "ref:…" / "user:…" → {kind, id, name(vector)} */
export const parseAsset = (a) => {
  const m = /^(img|ref|user):([a-z0-9-]+)(?:\|(.+))?$/.exec(a ?? '');
  if (m) return {kind: m[1], id: m[2], name: m[3] ?? null};
  if (/^placeholder:/.test(a ?? '')) return {kind: 'placeholder', id: a.slice(12), name: null};
  return {kind: 'vector', id: null, name: a};
};

export const assetUsage = (slug) => {
  const shots = readJson(path.join(ROOT, 'projects', slug, 'shots.json'));
  if (!shots) return null;
  const V = {}; // vector name → usage
  const X = {img: {}, ref: {}, user: {}};
  const add = (l, where, era) => {
    const a = parseAsset(l.asset);
    if (a.kind in X) (X[a.kind][a.id] ??= new Set()).add(where);
    if (!a.name) return;
    const v = (V[a.name] ??= {name: a.name, shots: [], covers: [], styles: new Set(), variants: new Map(), eras: new Set(), replacedBy: new Set()});
    if (where.startsWith('cover:')) { if (!v.covers.includes(where.slice(6))) v.covers.push(where.slice(6)); }
    else if (!v.shots.includes(where)) v.shots.push(where);
    v.styles.add(l.style ?? 'vector');
    if (era) v.eras.add(era);
    if (a.kind !== 'vector') v.replacedBy.add(`${a.kind}:${a.id}`);
    const props = l.props ?? {};
    const key = JSON.stringify(props);
    const cur = v.variants.get(key) ?? {props, style: l.style ?? 'vector', where: []};
    cur.where.push(where);
    v.variants.set(key, cur);
  };
  for (const sc of shots.scenes ?? []) for (const sh of sc.shots ?? []) {
    for (const l of sh.layers ?? []) add(l, sh.id, sc.era);
    if (sh.data?.chart === 'unit' && sh.data.icon) add({asset: sh.data.icon, style: 'vector', props: {}}, sh.id, sc.era);
  }
  for (const c of shots.covers ?? []) for (const l of c.layers ?? []) add(l, `cover:${c.id}`, c.era);
  const vectors = Object.values(V).map((v) => ({
    name: v.name, shots: v.shots, covers: v.covers, uses: v.shots.length + v.covers.length, styles: [...v.styles], eras: [...v.eras],
    replacedBy: [...v.replacedBy],
    variants: [...v.variants.values()].sort((a, b) => b.where.length - a.where.length).slice(0, 12).map((x) => ({props: x.props, style: x.style, where: [...new Set(x.where)]})),
    variantCount: v.variants.size,
  })).sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name));
  const list = (o) => Object.fromEntries(Object.entries(o).map(([k, s]) => [k, [...s]]));
  return {vectors, img: list(X.img), ref: list(X.ref), user: list(X.user)};
};
