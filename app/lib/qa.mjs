// QA ตาม rules/11 — ข้อที่เครื่องตรวจได้ทำอัตโนมัติ ข้อที่ต้องใช้คนตัดสินเก็บการติ๊กใน status.json
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {P, loadShots, loadStatus, splitByCue} from './project.mjs';
import {listOutputs, probe} from './media.mjs';
import {loadSettings, resolve as resolveSettings, budget} from '../../scripts/lib/settings.mjs';

export const runValidate = (slug) => {
  const r = spawnSync('node', ['scripts/validate.mjs', `projects/${slug}`], {cwd: P(), encoding: 'utf8', timeout: 30000});
  const lines = `${r.stdout ?? ''}${r.stderr ?? ''}`.split('\n').filter(Boolean);
  const m = lines[0]?.match(/shots (\d+).*parallax (\d+)%.*chars (\d+).*est (\d+)s/);
  return {
    ok: r.status === 0, lines,
    errors: lines.filter((l) => l.startsWith('✗')).map((l) => l.slice(2)),
    warns: lines.filter((l) => l.startsWith('⚠')).map((l) => l.slice(2)),
    shots: m ? Number(m[1]) : null, parallax: m ? Number(m[2]) : null, chars: m ? Number(m[3]) : null, est: m ? Number(m[4]) : null,
  };
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** ข้อความบนจอที่ทับกล่อง subtitle — ประมาณกล่องจากความยาวข้อความ (ซับ: 40px, ≤38 ตัว/บรรทัด, bottom 64px) */
const visLen = (x) => String(x).replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\s]/g, '').length;
const overlapSuspects = (shots) => {
  const res = [];
  for (const s of shots?.scenes ?? []) {
    const parts = splitByCue(s.vo ?? '', s.shots[0]?.id);
    for (const sh of s.shots) {
      const sub = parts.find((p) => p.id === sh.id)?.text ?? '';
      const n = visLen(sub);
      if (!n || !sh.text?.length) continue;
      const lines = Math.min(2, Math.ceil(n / 34));
      const sw = Math.min(1700, Math.min(n, 38) * 22 + 60);
      const sub_ = {x0: 960 - sw / 2, x1: 960 + sw / 2, y0: 1080 - 64 - (lines * 60 + 20), y1: 1080 - 64};
      for (const t of sh.text) {
        const size = t.size ?? ({title: 104, number: 170, note: 60, label: 46, kicker: 44}[t.role] ?? 46);
        const pad = t.role === 'label' || t.role === 'kicker' ? 60 : 0;
        const w = visLen(t.content) * size * 0.6 + pad;
        const h = size * 1.45;
        const x = t.x ?? 960;
        const y = t.y ?? 540;
        const box = {x0: x - w / 2, x1: x + w / 2, y0: y - h / 2, y1: y + h / 2};
        if (box.x0 < sub_.x1 && box.x1 > sub_.x0 && box.y0 < sub_.y1 && box.y1 > sub_.y0) { res.push(sh.id); break; }
      }
    }
  }
  return res;
};

export const MANUAL = {
  hook: 'Hook ถูกตอบใน Payoff',
  reveal: 'มี mini-reveal ทุก 30–40 วิ + data moment ใหญ่ 1 ครั้ง',
  talk: 'อ่านออกเสียงแล้วเหมือนคนคุยกันจริง (ลอง 3 ประโยคสุ่ม)',
  hero: 'ทุกเฟรมมีพระเอกสไตล์เดียว, accent ≤ 2 สี',
  edge: 'ขอบ layer ไม่โผล่ตอนกล้องขยับ (ดูจากภาพนิ่ง/preview)',
  mute: 'ปิดเสียงแล้วยังเข้าใจเรื่องคร่าว ๆ',
};

export const qaReport = async (slug) => {
  const shots = loadShots(slug);
  const res = resolveSettings(loadSettings(slug));
  const B = budget(res);
  const persona = res.voice.persona;
  const limitTxt = Object.entries(persona.limits ?? {}).map(([w, n]) => `“${w}” ≤ ${n}`).join(' · ');
  const v = runValidate(slug);
  const status = loadStatus(slug);
  // ใช้ไฟล์ master ล่าสุด (out/ ก่อน แล้วค่อย dump/archive)
  const outs = listOutputs(slug);
  const master = outs.find((o) => o.master && o.dir === 'out') ?? outs.find((o) => o.master) ?? outs.find((o) => o.dir === 'out') ?? outs[0];
  const info = master ? await probe(master.path) : null;
  const assets = fs.existsSync(P('projects', slug, 'assets.md')) ? fs.readFileSync(P('projects', slug, 'assets.md'), 'utf8') : null;
  const suspects = overlapSuspects(shots);
  const has = (re) => v.errors.some((e) => re.test(e));
  const A = (key, text, pass, value, warn = false) => ({key, text, type: 'auto', result: pass ? 'pass' : warn ? 'warn' : 'fail', value});
  const M = (key) => ({key, text: MANUAL[key], type: 'manual', checked: !!status.qa.manual[key]});
  const groups = [
    {name: 'เรื่องและข้อมูล', items: [
      M('hook'),
      A('src', 'ทุกตัวเลขมี sourceRef และตรงกับ facts.md', !has(/sourceRef/), has(/sourceRef/) ? v.errors.filter((e) => /sourceRef/.test(e)).length + ' จุด' : 'ครบ'),
      M('reveal'),
    ]},
    {name: 'เสียงบรรยาย', items: [
      A('len', `ความยาวรวม ${fmt(B.acceptSec[0])}–${fmt(B.acceptSec[1])} (จากไฟล์จริง)`, !!info?.duration && info.duration >= B.acceptSec[0] && info.duration <= B.acceptSec[1], info?.duration ? fmt(info.duration) : 'ยังไม่มีวิดีโอ', !info),
      A('words', `ไม่มีคำต้องห้ามของเสียง ${res.voice.name}${persona.polite ? ` / “${persona.polite.word}” กลางเรื่อง` : ''}${limitTxt ? ` / ${limitTxt}` : ''}`, !has(/คำต้องห้าม|กลางเรื่อง|คำว่า "/), has(/คำต้องห้าม|กลางเรื่อง|คำว่า "/) ? 'พบ' : '0 จุด'),
      M('talk'),
    ]},
    {name: 'ภาพ', items: [
      A('shots', `${B.shots[0]}–${B.shots[1]} ช็อต · parallax ${res.style.mix.parallax.join('–')}% · ไม่ติดกันเกิน ${res.style.maxParallaxRun}`, v.shots >= B.shots[0] && v.shots <= B.shots[1] && v.parallax >= res.style.mix.parallax[0] && v.parallax <= res.style.mix.parallax[1] && !has(/ติดกันเกิน/), v.shots != null ? `${v.shots} · ${v.parallax}%` : '?'),
      A('overlap', 'ตัวหนังสือบนจอไม่ทับ subtitle', suspects.length === 0, suspects.length ? suspects.join(', ') : 'ไม่พบ', false),
      M('hero'), M('edge'), M('mute'),
    ]},
    {name: 'เทคนิค', items: [
      A('validate', '`npm run validate` ผ่าน', v.ok, v.ok ? `ผ่าน · ⚠ ${v.warns.length}` : `✗ ${v.errors.length}`),
      A('loud', '−14 LUFS · peak ≤ −1 dBTP', info?.lufs != null && Math.abs(info.lufs + 14) <= 1 && (info.peak ?? 0) <= -1, info?.lufs != null ? `${info.lufs.toFixed(1)} / ${info.peak?.toFixed(1)}` : info ? 'วัดไม่ได้' : 'ยังไม่มีวิดีโอ', !info),
      (() => {
        const pending = assets ? (assets.match(/⚠/g) ?? []).length - (assets.match(/⚠ = /g) ?? []).length : 0; // ไม่นับบรรทัดคำอธิบายสัญลักษณ์
        const ok = !!assets && /license|ลิขสิทธิ์/i.test(assets) && pending === 0;
        return A('license', 'license ภาพ/เพลง/เสียงระบุครบใน assets.md', ok, !assets ? 'ไม่มี assets.md' : pending ? `ค้าง ⚠ ${pending} ข้อ` : 'ครบ', !!assets && pending > 0);
      })(),
    ]},
  ];
  const all = groups.flatMap((g) => g.items);
  return {
    groups, validate: v, measuredFrom: master?.path ?? null,
    autoPass: all.filter((i) => i.type === 'auto' && i.result === 'pass').length,
    autoTotal: all.filter((i) => i.type === 'auto').length,
    manualDone: all.filter((i) => i.type === 'manual' && i.checked).length,
    manualTotal: all.filter((i) => i.type === 'manual').length,
    failing: all.filter((i) => (i.type === 'auto' && i.result !== 'pass') || (i.type === 'manual' && !i.checked)).map((i) => i.key),
  };
};
