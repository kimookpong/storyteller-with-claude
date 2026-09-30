// นำเข้า asset ของผู้ใช้ (rules/16-user-assets.md)
//   node scripts/import-asset.mjs list <slug>                                   → รายการที่โปรเจกต์นี้ใช้ได้ (โปรเจกต์ + คลังกลาง) พร้อมคำอธิบาย
//   node scripts/import-asset.mjs add <slug|--library> <ไฟล์ภาพ> --id my-logo --desc "…" --owner "…" [--title …] [--kind photo|cutout|plate|logo] [--credit …] [--tags a,b] [--era present] [--replace]
//   node scripts/import-asset.mjs remove <slug|--library> <id>
import fs from 'node:fs';
import {addImport, availableImports, removeImport, KINDS} from './lib/imports.mjs';

const [cmd, target, ...rest] = process.argv.slice(2);
const slugOf = (t) => {
  if (t === '--library') return null;
  if (!t || !/^[a-z0-9][a-z0-9-]*$/.test(t) || !fs.existsSync(`projects/${t}`)) { console.error(`ไม่พบโปรเจกต์ "${t ?? ''}"`); process.exit(1); }
  return t;
};
const opts = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  if (rest[i].startsWith('--')) { const k = rest[i].slice(2); const v = rest[i + 1] && !rest[i + 1].startsWith('--') ? rest[++i] : true; opts[k] = v; }
  else pos.push(rest[i]);
}
try {
  if (cmd === 'list') {
    const slug = slugOf(target);
    const xs = availableImports(slug);
    if (!xs.length) { console.log('ยังไม่มี asset นำเข้า — เพิ่มได้ในหน้า Asset list ของ HistoryTeller หรือคำสั่ง add'); process.exit(0); }
    for (const x of xs) {
      console.log(`user:${x.id}  [${x.kind} · ${x.width}×${x.height} · ${x.scope === 'library' ? 'คลังกลาง' : 'โปรเจกต์'}]  ${x.title || ''}`);
      console.log(`   ${x.description}`);
      console.log(`   ที่มา: ${x.owner}${x.credit ? ` · เครดิต: ${x.credit}` : ''}${x.tags?.length ? ` · แท็ก: ${x.tags.join(', ')}` : ''}${x.era ? ` · ยุค: ${x.era}` : ''}`);
    }
  } else if (cmd === 'add') {
    const slug = slugOf(target);
    const file = pos[0];
    if (!file || !fs.existsSync(file)) throw new Error('ระบุไฟล์ภาพที่มีอยู่จริง');
    const rec = addImport(slug, fs.readFileSync(file), {id: opts.id, title: opts.title, description: opts.desc ?? opts.description, kind: opts.kind, owner: opts.owner, credit: opts.credit, tags: opts.tags, era: opts.era, replace: !!opts.replace});
    console.log(`✓ นำเข้า user:${rec.id} → public/${rec.file} (${rec.width}×${rec.height})`);
  } else if (cmd === 'remove') {
    removeImport(slugOf(target), pos[0]);
    console.log(`✓ ลบ ${pos[0]}`);
  } else {
    console.log(`ใช้: list <slug> · add <slug|--library> <file> --id … --desc … --owner … · remove <slug|--library> <id>\nkind: ${Object.entries(KINDS).map(([k, v]) => `${k} = ${v}`).join(' · ')}`);
  }
} catch (e) { console.error('✗ ' + e.message); process.exit(1); }
