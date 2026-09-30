// ประเมินว่า asset ไหนควรเป็น vector (วาดด้วยโค้ด) หรือ PNG (รูป AI · ยังมี vector สำรอง) — rule 04 "vector หรือ PNG"
// คิดจากการใช้งานจริงใน shots.json: ขนาดบนจอ · ระยะซูมกล้อง · จำนวนช็อต · props ที่ขยับ · ฉากหลังเต็มจอ · style
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, loadSettings, resolve} from './settings.mjs';
import {imagesSpec} from './images.mjs';

const R = (...xs) => path.join(ROOT, ...xs);
const readJson = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const F = 1000;
const AI_PX = 1344; // ด้านยาวของรูป AI โดยประมาณ

const baseOf = (a) => {
  if (a.startsWith('placeholder:') || a.startsWith('ref:')) return null;
  if (a.startsWith('img:')) { const [id, fb] = a.slice(4).split('|'); return {name: fb || null, img: id}; }
  return {name: a, img: null};
};

/** ค่าเฉลี่ยค่ารูปต่อ 1 ผู้สมัคร จาก images.lock.json ทุกโปรเจกต์ (ไม่มีข้อมูล = 0.04 USD) */
const avgCost = () => {
  let n = 0, s = 0;
  for (const d of fs.existsSync(R('projects')) ? fs.readdirSync(R('projects')) : []) {
    const l = readJson(R('projects', d, 'images.lock.json'));
    for (const cs of Object.values(l?.candidates ?? {})) for (const c of cs) if (typeof c.cost === 'number') { n++; s += c.cost; }
  }
  return n ? s / n : 0.04;
};

export const planAssets = (slug) => {
  const shots = readJson(R('projects', slug, 'shots.json'));
  if (!shots) return null;
  const hints = readJson(R('presets', 'asset-hints.json'), {vectorOnly: {}, animatedProps: [], variantProps: []});
  const st = resolve(loadSettings(slug));
  const render = st.style?.render ?? 'vector';
  const W = shots.meta?.width ?? 1920;
  const aiIds = new Set((imagesSpec(slug)?.images ?? []).map((x) => x.id));
  const A = {};
  const use = (l, where, cam) => {
    const b = baseOf(l.asset);
    if (!b?.name) return;
    const a = (A[b.name] ??= {name: b.name, shots: new Set(), covers: 0, maxFrac: 0, maxPx: 0, cover: false, anim: new Set(), staticUses: 0, combos: new Set(), variants: {}, imgIds: new Set()});
    if (where.startsWith('cover')) a.covers++; else a.shots.add(where);
    if (b.img) a.imgIds.add(b.img);
    const zs = cam ? [cam.from?.z ?? 0, cam.to?.z ?? 0] : [0];
    const s = Math.max(...zs.map((z) => F / Math.max(50, (l.z ?? 1000) - z)));
    if (l.cover) { a.cover = true; a.maxFrac = Math.max(a.maxFrac, 1); a.maxPx = Math.max(a.maxPx, W * Math.max(1, s)); }
    else { const px = (l.w ?? 600) * s; a.maxFrac = Math.max(a.maxFrac, px / W); a.maxPx = Math.max(a.maxPx, px); }
    let moving = false;
    for (const [k, v] of Object.entries(l.props ?? {})) {
      if (hints.animatedProps.includes(k) && v !== false) { a.anim.add(k); moving = true; }
      else (a.variants[k] ??= new Set()).add(JSON.stringify(v));
    }
    if (!moving) {
      a.staticUses++;
      const key = Object.entries(l.props ?? {}).filter(([k]) => ['expr', 'mode', 'cloth', 'kind', 'silhouette'].includes(k)).sort().map(([k, v]) => `${k}=${JSON.stringify(v)}`).join('&');
      if (!(key.includes('silhouette=true'))) a.combos.add(key);
    }
  };
  for (const sc of shots.scenes) for (const sh of sc.shots) for (const l of sh.layers ?? []) use(l, sh.id, sh.camera);
  for (const c of shots.covers ?? []) for (const l of c.layers ?? []) use(l, `cover-${c.id}`, null);

  const cost = avgCost();
  const rows = Object.values(A).map((a) => {
    const reasons = [];
    const nUse = a.shots.size + a.covers;
    const variants = Math.max(1, a.combos.size);
    let rec, score = 0;
    if (hints.vectorOnly[a.name]) { rec = 'vector'; reasons.push(hints.vectorOnly[a.name]); }
    else if (a.anim.size && a.staticUses < 2) { rec = 'vector'; reasons.push(`ขยับเป็นส่วน (${[...a.anim].join(', ')})`); }
    else if (!a.cover && a.maxFrac < 0.15) { rec = 'vector'; reasons.push(`เล็กบนจอ (≤ ${Math.round(a.maxFrac * 100)}% ของความกว้าง)`); }
    else {
      if (a.cover) { score += 3; reasons.push('ฉากหลังเต็มจอ'); }
      else if (a.maxFrac >= 0.35) { score += 2; reasons.push(`พระเอกของเฟรม (${Math.round(Math.min(1, a.maxFrac) * 100)}% ของจอ)`); }
      if (nUse >= 3) { score += 1; reasons.push(`ใช้ ${nUse} ช็อต — คุ้มค่ารูป`); }
      if (a.covers) { score += 1; reasons.push('อยู่บนปก'); }
      if (render === 'image' || render === 'hybrid') { score += 1; reasons.push(`style เน้นภาพ (${render})`); }
      if (render === 'vector') { score -= 1; reasons.push('style เน้น vector'); }
      rec = score >= 2 ? 'png' : 'vector';
      if (a.anim.size) reasons.push(`ช็อตที่ใช้ ${[...a.anim].join(', ')} ยังเป็น vector`);
      if (rec === 'vector' && !reasons.length) reasons.push('ใช้น้อย/ขนาดกลาง — vector คุ้มกว่า');
    }
    const warn = rec === 'png' && a.maxPx > AI_PX * 1.25 ? `ต้องการ ~${Math.round(a.maxPx)}px ตอนซูมสุด — รูป AI ~${AI_PX}px อาจไม่คม` : null;
    const has = [...a.imgIds].filter((id) => aiIds.has(id));
    return {name: a.name, rec, score, reasons, uses: nUse, maxFrac: +a.maxFrac.toFixed(2), maxPx: Math.round(a.maxPx), variants: rec === 'png' ? variants : 0,
      hasImg: has, mismatch: rec === 'png' ? !has.length : has.length > 0, warn};
  }).sort((x, y) => (y.rec === 'png') - (x.rec === 'png') || y.score - x.score || y.uses - x.uses);
  const pngs = rows.filter((r) => r.rec === 'png');
  const images = pngs.reduce((s, r) => s + r.variants, 0);
  return {slug, render, costPer: +cost.toFixed(4), rows, summary: {png: pngs.length, vector: rows.length - pngs.length, images, estCost: +(images * 2 * cost).toFixed(2), mismatches: rows.filter((r) => r.mismatch).length}};
};
