// node scripts/asset-plan.mjs <slug>  → ตาราง: asset ไหนควรเป็น vector / PNG พร้อมเหตุผลและค่ารูปโดยประมาณ (rule 04)
import {planAssets} from './lib/assetplan.mjs';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('ใช้: node scripts/asset-plan.mjs <slug>'); process.exit(1); }
const p = planAssets(slug);
if (!p) { console.error(`ไม่มี projects/${slug}/shots.json`); process.exit(1); }
console.log(`asset plan · ${slug} · style render: ${p.render}\n`);
for (const r of p.rows) {
  const tag = r.rec === 'png' ? 'PNG   ' : 'vector';
  const now = r.hasImg.length ? ` [มีใน images.json: ${r.hasImg.join(', ')}]` : '';
  console.log(`${r.mismatch ? '≠' : ' '} ${tag} ${r.name.padEnd(24)} ใช้ ${String(r.uses).padStart(2)} · ${String(Math.round(Math.min(r.maxFrac, 9) * 100)).padStart(3)}% จอ${r.variants > 1 ? ` · ${r.variants} แบบ` : ''} — ${r.reasons.join(' · ')}${now}${r.warn ? `\n         ⚠ ${r.warn}` : ''}`);
}
const s = p.summary;
console.log(`\nแนะนำ PNG ${s.png} ชิ้น (${s.images} รูป · ผู้สมัคร 2 แบบ/รูป ≈ $${s.estCost} ที่ ~$${p.costPer}/รูป) · vector ${s.vector} ชิ้น`);
if (s.mismatches) console.log(`≠ ${s.mismatches} ชิ้นไม่ตรงกับ images.json ตอนนี้ — Claude ตัดสินใน assets.md (คำแนะนำไม่ใช่คำสั่ง)`);
