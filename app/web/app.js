// HistoryTeller with Claude — หน้าเว็บ (vanilla JS, ไม่มี build step)
// หลัก: Claude เขียนไฟล์ · หน้านี้แสดง อนุมัติ สั่งงาน (docs/UI-DESIGN.md)

const $app = document.getElementById('app');
const S = {
  health: null, projects: [], slug: null, stage: null, d: null,
  outputs: null, qa: null, jobs: [], logs: {}, activity: [],
  scene: null, shot: null, video: null, drafts: {}, showRaw: false, reqNote: null,
  presets: null, sdraft: null, sdraftSlug: null, spreview: null, ndraft: null, nbudget: null,
};

// ---------------- utils ----------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const api = async (path, opts = {}) => {
  const r = await fetch(path, {...opts, headers: {'Content-Type': 'application/json', ...(opts.headers ?? {})}, body: opts.body ? JSON.stringify(opts.body) : undefined});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
  return j;
};
const media = (rel, v) => `/media/${rel.split('/').map(encodeURIComponent).join('/')}${v ? `?v=${Math.round(v)}` : ''}`;
let toastT;
const toast = (msg, err = false) => {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.className = ''), err ? 5000 : 2600);
};
const ago = (t) => {
  if (!t) return '';
  const s = (Date.now() - new Date(t).getTime()) / 1000;
  if (s < 60) return 'เมื่อสักครู่';
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`;
  if (s < 86400) return `${Math.floor(s / 3600)} ชม.ที่แล้ว`;
  return new Date(t).toLocaleDateString('th-TH', {day: 'numeric', month: 'short'});
};
const clock = (t) => new Date(t).toLocaleTimeString('th-TH', {hour: '2-digit', minute: '2-digit'});
const mmss = (s) => (s == null ? '–' : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`);
const mb = (b) => (b == null ? '' : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.round(b / 1e3)} KB`);
const copy = async (text) => {
  try { await navigator.clipboard.writeText(text); toast('คัดลอกแล้ว — วางใน Claude ได้เลย'); }
  catch { toast('คัดลอกไม่ได้ — เลือกข้อความแล้วกด ⌘C', true); }
};

const STATE_TH = {approved: 'อนุมัติแล้ว', review: 'รอคุณตัดสิน', draft: 'Claude กำลังทำ', todo: 'ยังไม่ทำ', stale: 'ล้าสมัย — ไฟล์เปลี่ยนหลังอนุมัติ'};
const STATE_MARK = {approved: '✓', review: '!', draft: '…', todo: '', stale: '↻'};
const ERA_TH = {prehistoric: 'ยุคหิน', ancient: 'โบราณ', medieval: 'ยุคกลาง', 'early-modern': 'ต้นสมัยใหม่', '1800s': '1800s', 'early-1900s': 'ต้น 1900s', 'mid-century': 'กลางศตวรรษ 20', '80s-90s': '80s–90s', '2000s': '2000s', present: 'ปัจจุบัน', future: 'อนาคต'};
const ERA_COLOR = {prehistoric: '#7A4A22', ancient: '#9A7A2E', medieval: '#8A5A2B', 'early-modern': '#6B4E8C', '1800s': '#9C6B1F', 'early-1900s': '#4A4A4A', 'mid-century': '#B5502F', '80s-90s': '#A0287E', '2000s': '#2F7FA8', present: '#2F5DA8', future: '#5B3FC4'};

// ---------------- markdown (เล็ก ๆ พอสำหรับไฟล์ในโปรเจกต์) ----------------
const inline = (s) => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\[#([A-Za-z0-9_-]+)\]/g, '<span class="cue">$1</span>');
const md = (src) => {
  const lines = String(src ?? '').replace(/\r/g, '').split('\n');
  let html = '';
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*\|/.test(l)) {
      const rows = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const body = rows.filter((r) => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r));
      html += '<table><thead><tr>' + cells(body[0]).map((c) => `<th>${inline(c)}</th>`).join('') + '</tr></thead><tbody>'
        + body.slice(1).map((r) => '<tr>' + cells(r).map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>';
      continue;
    }
    if (/^```/.test(l)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      html += `<pre class="promptbox">${esc(buf.join('\n'))}</pre>`;
      continue;
    }
    const h = l.match(/^(#{1,3})\s+(.*)$/);
    if (h) { html += `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`; i++; continue; }
    if (/^\s*[-*]\s+/.test(l)) {
      html += '<ul>';
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) html += `<li>${inline(lines[i++].replace(/^\s*[-*]\s+/, ''))}</li>`;
      html += '</ul>';
      continue;
    }
    if (/^>\s?/.test(l)) { html += `<blockquote>${inline(l.replace(/^>\s?/, ''))}</blockquote>`; i++; continue; }
    if (!l.trim()) { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3}\s|\s*\||\s*[-*]\s|>|```)/.test(lines[i])) para.push(lines[i++]);
    html += `<p>${inline(para.join(' '))}</p>`;
  }
  return html;
};

// ---------------- data loading ----------------
const loadProjects = async () => { S.projects = await api('/api/projects'); };
const loadProject = async () => {
  if (!S.slug) return;
  S.d = await api(`/api/p/${S.slug}`);
};
const loadOutputs = async () => { if (S.slug) { S.outputs = await api(`/api/p/${S.slug}/outputs`); S.subs = await api(`/api/p/${S.slug}/subs`).catch(() => []); } };
const loadQa = async () => { if (S.slug) S.qa = await api(`/api/p/${S.slug}/qa`); };
const loadJobs = async () => { S.jobs = await api('/api/jobs'); };

// ---------------- routing ----------------
const parse = () => {
  const m = location.hash.match(/^#\/p\/([a-z0-9-]+)(?:\/([a-z]+))?/);
  return m ? {slug: m[1], stage: m[2] ?? null} : {slug: null, stage: null};
};
const go = (h) => { location.hash = h; };
const route = async () => {
  const r = parse();
  const changed = r.slug !== S.slug;
  S.slug = r.slug;
  if (!S.slug) {
    S.d = null;
    await loadProjects().catch((e) => toast(e.message, true));
    return render();
  }
  if (changed) { S.d = null; S.outputs = null; S.qa = null; S.scene = null; S.shot = null; S.video = null; }
  try { if (!S.d || changed) await loadProject(); } catch (e) { toast(e.message, true); return go('#/'); }
  S.stage = r.stage ?? firstOpenStage()?.key ?? 'brief';
  if (S.stage === 'settings') initSettingsDraft();
  if (!r.stage) history.replaceState(null, '', `#/p/${S.slug}/${S.stage}`);
  S.reqNote = null;
  render();
  if (S.stage === 'preview') loadOutputs().then(render).catch(() => {});
  if (S.stage === 'qa') loadQa().then(render).catch((e) => toast(e.message, true));
};
window.addEventListener('hashchange', route);

const firstOpenStage = () => S.d?.stages.find((s) => s.state !== 'approved');
const openFb = () => (S.d?.feedback ?? []).filter((f) => f.status === 'open');

// ---------------- Claude prompt ถัดไป ----------------
const nextPrompt = () => {
  const d = S.d;
  if (!d) return null;
  const open = openFb();
  if (open.length) {
    return {
      who: 'claude',
      title: `มีคำขอแก้ค้าง ${open.length} รายการ`,
      text: `/ht-feedback ${d.slug}\nแก้คำขอที่ค้างใน projects/${d.slug}/feedback.jsonl (${open.slice(0, 4).map((f) => f.target).join(', ')}${open.length > 4 ? ', …' : ''})\nเสร็จแต่ละข้อ → append status "done" + note แล้วตั้ง stage ที่แก้เป็น "review" (ตาม rules/13-ui-protocol.md)`,
    };
  }
  const st = firstOpenStage();
  if (!st) return {who: 'done', title: 'ครบทุก stage แล้ว', text: null};
  if (st.state === 'review') return {who: 'you', title: `รอคุณตัดสิน: ${st.n} · ${st.name}`, text: null, stage: st.key};
  const verb = st.state === 'stale' ? 'ไฟล์ต้นน้ำเปลี่ยน — ตรวจและอัปเดต' : st.state === 'draft' ? 'ทำต่อ/แก้ตามโน้ต' : 'ทำ';
  const needsMac = ['voice', 'preview'].includes(st.key);
  if (st.key === 'brief' && !st.exists && d.docs['request.md']) {
    return {who: 'claude', title: 'ให้ Claude ทำ Brief จากคำขอ', stage: 'brief',
      text: `/ht-new ${d.slug}\nอ่าน projects/${d.slug}/request.md แล้วทำ brief.md (stage 1) ตาม rules/00-pipeline.md\nเสร็จแล้วตั้ง brief เป็น "review" ใน projects/${d.slug}/status.json`};
  }
  return {
    who: needsMac ? 'you' : 'claude',
    title: needsMac ? `stage ${st.n} ต้องรันบนเครื่องนี้` : `ให้ Claude ${verb} stage ${st.n}`,
    text: needsMac ? null : `/ht-next ${d.slug}\n${verb} stage ${st.n} (${st.name}) ตาม rules/00-pipeline.md — งบ/persona: npm run budget -- ${d.slug}${st.note ? `\nโน้ตจากผู้ใช้: ${st.note}` : ''}\nเสร็จแล้วตั้งสถานะเป็น "review" ใน projects/${d.slug}/status.json (ตาม rules/13-ui-protocol.md — ห้ามอนุมัติเอง)`,
    stage: st.key,
  };
};

// ---------------- views: common ----------------
const logo = (size = 28) => `<svg width="${size}" height="${size}" viewBox="0 0 34 34" fill="none" stroke="#FFC94A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="7" width="26" height="20" rx="3"/><path d="M4 12h26M9 7v5M15 7v5M21 7v5M27 7v5"/><path d="M14 17l6 3.5-6 3.5z" fill="#FFC94A"/></svg>`;
const healthChips = () => {
  const h = S.health;
  if (!h) return '';
  const c = (ok, t) => `<span class="hchip">${t} ${ok ? '✓' : '✗'}</span>`;
  return `${c(h.ffprobe, 'ffmpeg')}${c(h.remotion, 'Remotion')}${c(h.openrouterKey, 'OpenRouter key')}`;
};

const stageRail = () => `
  <nav class="side" aria-label="ขั้นตอนการผลิต">
    <a class="brand" href="#/">${logo(24)}<b style="font-size:18px">HistoryTeller</b></a>
    <div class="proj"><span class="small" style="color:var(--navy-muted)">โปรเจกต์</span><b>${esc(S.d.meta?.title ?? S.slug)}</b><span class="mono small" style="color:var(--navy-muted)">${esc(S.slug)}</span></div>
    <a class="stage-link ${S.stage === 'settings' ? 'on' : ''}" href="#/p/${S.slug}/settings" ${S.stage === 'settings' ? 'aria-current="page"' : ''}>
      <span class="dot ${S.d.settings?.settings?.exists ? 'approved' : 'review'}">⚙</span>
      <span><span class="nm">0 · ตั้งค่า</span><span class="st ${S.d.settings?.settings?.exists ? 'approved' : 'review'}">${esc(settingsLine())}</span></span>
    </a>
    <div>${S.d.stages.map((s) => `
      <a class="stage-link ${s.key === S.stage ? 'on' : ''}" href="#/p/${S.slug}/${s.key}" ${s.key === S.stage ? 'aria-current="page"' : ''}>
        <span class="dot ${s.state}">${STATE_MARK[s.state]}</span>
        <span><span class="nm">${s.n} · ${esc(s.name)}</span><span class="st ${s.state}">${STATE_TH[s.state].split(' — ')[0]}</span></span>
      </a>`).join('')}
    </div>
  </nav>`;

const stageHead = (st, extra = '') => {
  const actions = st.state === 'approved'
    ? `<button class="btn" data-act="stage" data-a="reopen">เปิดให้แก้อีกครั้ง</button>`
    : `<button class="btn" data-act="req-open">ขอแก้…</button><button class="btn primary" data-act="stage" data-a="approve" ${st.exists || ['qa', 'assets'].includes(st.key) ? '' : 'disabled title="ยังไม่มีไฟล์ของ stage นี้"'}>อนุมัติ ${esc(st.name)}</button>`;
  return `
  <div class="stagehead">
    <div class="grow">
      <div class="eyebrow">Stage ${st.n}${st.checkpoint ? ' · checkpoint' : ''} · <span class="st-${st.state}" style="font-weight:600;color:${{approved: 'var(--ok)', review: 'var(--warn-ink)', stale: 'var(--accent)', draft: 'var(--blue-ink)', todo: 'var(--muted)'}[st.state]}">${STATE_TH[st.state]}</span>${st.at ? ` · ${ago(st.at)}` : ''}</div>
      <h1 style="font-size:27px">${esc(st.name)}</h1>
    </div>
    ${extra}${actions}
  </div>
  ${st.note ? `<div class="banner info"><span>โน้ต:</span><span>${esc(st.note)}</span></div>` : ''}
  ${S.reqNote !== null ? `
    <div class="card pad stack">
      <label class="f">อยากให้ Claude แก้อะไรใน ${esc(st.name)}
        <textarea rows="3" data-draft="req" placeholder="เช่น ตัด Act 2 ให้สั้นลง 20 วิ">${esc(S.reqNote)}</textarea></label>
      <div class="row"><span class="grow small muted">ระบบจะตั้ง stage เป็น "Claude กำลังทำ" และเพิ่มคำขอในคิว</span>
        <button class="btn" data-act="req-cancel">ยกเลิก</button><button class="btn primary" data-act="stage" data-a="request-changes">ส่งให้ Claude</button></div>
    </div>` : ''}`;
};

const emptyState = (title, body) => `<div class="card pad stack" style="align-items:flex-start"><h2 style="font-size:19px">${esc(title)}</h2><div class="muted">${body}</div></div>`;


// ---------------- settings (stage 0) ----------------
const clone = (x) => JSON.parse(JSON.stringify(x ?? null));
const mmssT = (t) => `${Math.floor(t / 60)}:${String(Math.round(t % 60)).padStart(2, '0')}`;
const lenLabel = (t) => (t % 60 === 0 ? `${t / 60} นาที` : mmssT(t));
const presetById = (kind, id) => S.presets?.[kind]?.find((p) => p.id === id);
const settingsLine = () => {
  const st = S.d?.settings;
  if (!st?.resolved) return st?.error ? 'settings ผิดพลาด' : '';
  const r = st.resolved;
  return `${lenLabel(r.targetSec)} · ${r.voice.tts.voice}${st.settings.exists ? '' : ' (ค่าเริ่มต้น)'}`;
};
const stripSettings = (x) => {
  const o = {format: x.format, style: x.style, voice: x.voice, targetSec: Number(x.targetSec)};
  if (x.subtitles && x.subtitles !== 'th') o.subtitles = x.subtitles;
  const ov = clone(x.overrides ?? {});
  if (ov.voice?.tts && !ov.voice.tts.voice) delete ov.voice.tts;
  if (ov.voice && ov.voice.charsPerSec === '') delete ov.voice.charsPerSec;
  if (ov.voice && !Object.keys(ov.voice).length) delete ov.voice;
  if (Object.keys(ov).length) o.overrides = ov;
  return o;
};
const initSettingsDraft = () => {
  if (!S.d || S.sdraftSlug === S.slug) return;
  S.sdraft = stripSettings(S.d.settings.settings);
  S.sdraftSlug = S.slug;
  S.spreview = null;
  previewSettings();
};
let pvT;
const previewSettings = () => {
  clearTimeout(pvT);
  pvT = setTimeout(async () => {
    try {
      if (S.slug && S.sdraft) S.spreview = await api(`/api/p/${S.slug}/settings/preview`, {method: 'POST', body: stripSettings(S.sdraft)});
      else if (!S.slug && S.ndraft) S.nbudget = await api('/api/budget', {method: 'POST', body: stripSettings(S.ndraft)});
    } catch (e) { S.spreview = {error: e.message}; S.nbudget = {error: e.message}; }
    render();
  }, 200);
};
const sameSettings = (a, b) => JSON.stringify(stripSettings(a)) === JSON.stringify(stripSettings(b));

/** ตัวเลือก length/style/voice/format — ใช้ทั้งหน้า Settings และฟอร์มโปรเจกต์ใหม่ */
const settingsPicker = (d, scope, compact = false) => {
  const P = S.presets;
  if (!P || !d) return '<div class="muted small">กำลังโหลด preset…</div>';
  const custom = !P.lengths.includes(Number(d.targetSec));
  const card = (kind, p) => {
    const on = d[kind] === p.id;
    const meta = kind === 'voice'
      ? `<span class="small muted">${esc(p.tts.voice)} · ${p.charsPerSec} ตัว/วิ${p.calibrated ? ' (วัดแล้ว)' : ' (ประมาณ)'}</span>`
      : kind === 'style' ? `<span class="small muted">ช็อตเฉลี่ย ${p.shotSec.min}–${p.shotSec.max} วิ · parallax ${p.mix.parallax.join('–')}%</span>`
      : kind === 'format' && !p.summary ? `<span class="small muted">${p.width}×${p.height}</span>` : '';
    return `<button class="pick ${on ? 'on' : ''}" aria-pressed="${on}" data-act="sd-set" data-scope="${scope}" data-k="${kind}" data-v="${esc(p.id)}">
      <b>${esc(p.name)}</b>${!compact && p.summary ? `<span class="small">${esc(p.summary)}</span>` : ''}${meta}</button>`;
  };
  return `
  <div class="stack" style="gap:14px">
    <div class="stack" style="gap:6px"><b>รูปแบบ (format)</b><div class="picks">${P.format.map((p) => card('format', p)).join('')}</div>
      <span class="small muted">เลือกแนวตั้ง → ตั้งสไตล์ “คลิปสั้น จังหวะเร็ว” และความยาว 1 นาทีให้อัตโนมัติ (เปลี่ยนเองได้)</span></div>
    <div class="stack" style="gap:6px"><b>ความยาวคลิป</b>
      <div class="row" style="flex-wrap:wrap;gap:6px">
        ${P.lengths.map((t) => `<button class="tab ${Number(d.targetSec) === t ? 'on' : ''}" data-act="sd-set" data-scope="${scope}" data-k="targetSec" data-v="${t}">${t === 30 ? '30 วิ (TikTok)' : t === 60 ? '1 นาที (TikTok/Shorts)' : lenLabel(t)}</button>`).join('')}
        <label class="row small" style="gap:6px">กำหนดเอง <input class="f mono" style="width:90px" type="number" min="30" max="1800" step="15" data-sdraft="${scope}:targetSec" value="${esc(d.targetSec)}"> วินาที</label>
        ${custom ? `<span class="pill plain">${mmssT(Number(d.targetSec) || 0)}</span>` : ''}
      </div></div>
    <div class="stack" style="gap:6px"><b>แนวทางวิดีโอ (style)</b><div class="picks">${P.style.map((p) => card('style', p)).join('')}</div></div>
    <div class="stack" style="gap:6px"><b>เสียงพากย์ / ผู้เล่า (voice)</b><div class="picks">${P.voice.map((p) => card('voice', p)).join('')}</div></div>
    <div class="stack" style="gap:6px"><b>ซับในวิดีโอ</b>
      <div class="row" style="flex-wrap:wrap;gap:6px">${Object.entries(P.subModes ?? {th: 'ไทย'}).map(([k, v]) => `<button class="tab ${(d.subtitles ?? 'th') === k ? 'on' : ''}" data-act="sd-set" data-scope="${scope}" data-k="subtitles" data-v="${k}">${esc(v)}</button>`).join('')}</div>
      <span class="small muted">ไฟล์ซับ .srt / .vtt (ไทย และอังกฤษถ้ามีคำแปล) ออกให้ทุกครั้งหลัง Render — อัปโหลดเป็นคำบรรยายบน YouTube ได้</span></div>
  </div>`;
};

const settingsView = () => {
  const cur = S.d.settings;
  const d = S.sdraft;
  if (!d) return '<div class="muted">กำลังโหลด…</div>';
  const pv = S.spreview;
  const changed = !sameSettings(d, cur.settings);
  const vp = presetById('voice', d.voice);
  const ov = d.overrides?.voice ?? {};
  const aud = S.d.audition?.[d.voice];
  const auditionVoices = vp?.tts?.audition ?? [];
  return `
  <div class="stagehead"><div class="grow"><div class="eyebrow">Stage 0 · Settings · <code>projects/${esc(S.slug)}/settings.json</code></div>
    <h1 style="font-size:27px">ตั้งค่าโปรเจกต์</h1></div>
    <button class="btn" data-act="sd-reset" ${changed ? '' : 'disabled'}>ยกเลิกการแก้</button>
    <button class="btn primary" data-act="sd-save" ${changed || !cur.settings.exists ? '' : 'disabled'}>${cur.settings.exists ? 'บันทึก' : 'บันทึก (สร้าง settings.json)'}</button></div>
  ${cur.error ? `<div class="banner bad">settings.json ผิดพลาด: ${esc(cur.error)}</div>` : ''}
  ${!cur.settings.exists ? '<div class="banner info">ยังไม่มี settings.json — ตอนนี้ใช้ค่าเริ่มต้น กดบันทึกเพื่อสร้างไฟล์</div>' : ''}
  ${pv?.affected?.length ? `<div class="banner bad"><span>ถ้าบันทึก stage ที่อนุมัติแล้วจะ <b>ล้าสมัย</b>: ${pv.affected.map((k) => esc(S.d.stages.find((x) => x.key === k)?.name ?? k)).join(', ')}${pv.affected.includes('voice') ? ' — ต้องสร้างเสียงพากย์ใหม่ทั้งเรื่อง (เสียค่า TTS เต็ม)' : ''}</span></div>` : ''}
  ${pv?.error ? `<div class="banner bad">${esc(pv.error)}</div>` : ''}
  <div class="setgrid">
    <div class="card pad">${settingsPicker(d, 'p')}</div>
    <div class="stack">
      <div class="card pad stack" style="gap:8px"><b>งบที่คำนวณได้ ${changed ? '<span class="pill warn">ยังไม่บันทึก</span>' : ''}</b>
        <pre class="promptbox" style="margin:0;white-space:pre-wrap">${esc(pv?.text ?? cur.text ?? '')}</pre>
        <div class="small muted">Claude ใช้ตัวเลขชุดเดียวกันนี้ผ่าน <code>npm run budget -- ${esc(S.slug)}</code></div></div>
      <div class="card pad stack" style="gap:10px"><b>ปรับเสียงละเอียด (overrides)</b>
        <label class="f">เสียง TTS (ค่าใน preset: ${esc(vp?.tts?.voice ?? '')})
          <select data-sdraft="p:ttsVoice"><option value="">— ตาม preset —</option>${auditionVoices.map((v) => `<option ${ov.tts?.voice === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        <label class="f">อัตราพูด (ตัวอักษร/วินาที) · preset: ${vp?.charsPerSec ?? ''}${vp?.calibrated ? '' : ' (ประมาณ)'}
          <input type="number" step="0.1" min="5" max="20" data-sdraft="p:cps" value="${esc(ov.charsPerSec ?? '')}" placeholder="ตาม preset"></label>
        <div class="small muted">ค่าจริงที่ดีที่สุด = ตัวอักษรในบท ÷ ความยาวเสียงจริงหลังสร้างเสียงแล้ว (coffee-world วัดได้ 10.2)</div>
      </div>
    </div>
  </div>
  <div class="card pad stack">
    <div class="row"><b class="grow">ลองเสียง (audition) — ${esc(vp?.name ?? d.voice)}</b>
      <button class="btn dark" data-act="audition" data-preset="${esc(d.voice)}" ${S.health && !S.health.openrouterKey ? 'disabled title="ยังไม่มี OPENROUTER_API_KEY"' : ''}>สร้างเสียงตัวอย่าง ${auditionVoices.length} เสียง</button></div>
    <div class="small muted">ประโยคทดสอบ: “${esc(vp?.tts?.auditionText ?? '')}” · ไฟล์อยู่ที่ <code>out/audition/${esc(d.voice)}/</code> · ความเร็วจากประโยคเดียวใช้เทียบกันเอง (บทจริงมีช่วงหยุด จะช้ากว่า)</div>
    ${aud ? `<div class="aud">${Object.entries(aud.voices).map(([v, x]) => `
      <div class="aud-row ${ (ov.tts?.voice ?? vp?.tts?.voice) === v ? 'on' : ''}"><b class="mono">${esc(v)}</b><audio controls preload="none" src="${media(x.path, x.mtime)}"></audio>
        <span class="small">${x.charsPerSec} ตัว/วิ</span>
        <button class="btn sm" data-act="sd-voice" data-v="${esc(v)}">${(ov.tts?.voice ?? vp?.tts?.voice) === v ? '✓ ใช้อยู่' : 'ใช้เสียงนี้'}</button></div>`).join('')}</div>`
      : '<div class="small muted">ยังไม่เคยลองเสียงของ preset นี้</div>'}
  </div>
  <div class="card pad stack">
    <b>เพลงและเสียงประกอบ (rule 08)</b>
    ${(() => {
      const base = presetById('style', d.style)?.audio ?? {};
      const oa = d.overrides?.style?.audio ?? {};
      const musicOn = oa.music === undefined ? !!base.music : !!oa.music;
      const sfxOn = oa.sfx === undefined ? !!base.sfx : !!oa.sfx;
      return `<label class="row"><input type="checkbox" data-sdraft="p:music" ${musicOn ? 'checked' : ''}> เพลงประกอบ — ลดเสียงเองใต้เสียงพากย์ (${base.musicUnderVo ?? ''}) ดังขึ้นในช่วงว่าง (${base.musicGap ?? ''}) และเปลี่ยนเป็นโทนแผ่นเสียงเก่าในยุคอดีต</label>
      <label class="row"><input type="checkbox" data-sdraft="p:sfx" ${sfxOn ? 'checked' : ''}> SFX อัตโนมัติ — whoosh (parallax) · pop (vector) · กระดาษ (collage) · tick (ตัวนับ) · ตราประทับ</label>
      <div class="aud">
        ${base.music?.modern ? `<div class="aud-row"><b class="small">เพลง · ยุคปัจจุบัน</b><audio controls preload="none" src="${media('public/' + base.music.modern)}"></audio><span></span><span></span></div>` : ''}
        ${base.music?.vintage ? `<div class="aud-row"><b class="small">เพลง · ยุคเก่า</b><audio controls preload="none" src="${media('public/' + base.music.vintage)}"></audio><span></span><span></span></div>` : ''}
      </div>
      <div class="row" style="flex-wrap:wrap;gap:6px">${['whoosh', 'pop', 'bloop', 'paper', 'tick', 'stamp'].map((n) => `<button class="btn sm" data-act="play-sfx" data-n="${n}">▶ ${n}</button>`).join('')}</div>
      <div class="small muted">เสียงทั้งหมดสร้างเองด้วย <code>npm run audio</code> (scripts/gen-audio.py) — ไม่มีลิขสิทธิ์คนอื่น · ปิด SFX เฉพาะช็อตได้ด้วย <code>"sfx": []</code> ใน shots.json · มีผลตอน render ครั้งถัดไป</div>`;
    })()}
  </div>
  <div class="card pad stack">
    <div class="row"><b class="grow">พื้นผิวตามยุค — ${esc(presetById('style', d.style)?.name ?? d.style)} ใช้ได้ ${presetById('style', d.style)?.eras?.length ?? 0} ยุค (เรื่องหนึ่ง ≤ ${presetById('style', d.style)?.maxEras ?? 4})</b>
      <button class="btn" data-act="job" data-job="eras">${S.d.eraSamples?.length ? 'Render ตัวอย่างใหม่' : 'Render ตัวอย่างทุกยุค'}</button></div>
    <div class="small muted">ช็อตตัวอย่างเดียวกัน เปลี่ยนแค่ยุค · ยุคที่เพิ่มใหม่ยังไม่เคย render จริง ควรดูตรงนี้ก่อนใช้ในเรื่องจริง</div>
    <div class="eras">${(presetById('style', d.style)?.eras ?? []).map((era) => {
      const x = S.d.eraSamples?.find((e) => e.era === era);
      return `<figure><div class="frame">${x ? `<img src="${media(x.path, x.mtime)}" alt="ตัวอย่างยุค ${esc(ERA_TH[era] ?? era)}" loading="lazy">` : '<div class="ph">ยังไม่ render</div>'}</div>
        <figcaption><span class="pill" style="background:${ERA_COLOR[era] ?? '#555'};color:#fff">${esc(ERA_TH[era] ?? era)}</span> <span class="mono small muted">${esc(era)}</span></figcaption></figure>`;
    }).join('')}</div>
  </div>`;
};

// ---------------- stage views ----------------
/** รูปจาก AI (images.json → scripts/imagegen.py) — เลือกผู้สมัคร / สร้างใหม่ / ขอแก้ */
const imagesView = () => {
  const im = S.d.images;
  if (!im) return `<div class="banner info small"><span class="grow">โปรเจกต์นี้ใช้ภาพ vector ในโค้ดทั้งหมด — ถ้าอยากได้ภาพจาก AI ให้ Claude เขียน <code>images.json</code> (rule 04 · ภาพจาก AI)</span></div>`;
  const pending = im.items.filter((x) => x.selected == null).length;
  const card = (x) => `
    <div class="card pad stack" style="gap:8px">
      <div class="row" style="gap:8px"><b class="mono grow">${esc(x.id)}</b><span class="pill plain">${x.kind === 'plate' ? 'ฉากหลัง' : x.kind === 'cutout' ? 'ตัดพื้น' : esc(x.kind)}${x.aspect ? ' · ' + esc(x.aspect) : ''}</span>
        ${x.selected != null ? `<span class="pill ok">เลือก #${x.selected}</span>` : '<span class="pill warn">ยังไม่เลือก</span>'}</div>
      <div class="small muted">${esc(x.prompt)}</div>
      ${x.usedIn.length ? `<div class="small muted">ใช้ใน ${x.usedIn.map(esc).join(', ')}</div>` : ''}${x.refs.length ? `<div class="small muted">อ้างอิง: ${x.refs.map(esc).join(', ')}</div>` : ''}
      ${x.candidates.length ? `<div class="row" style="gap:8px;flex-wrap:wrap">${x.candidates.map((c) => `
        <button class="imgcand ${x.selected === c.k ? 'on' : ''}" data-act="img-select" data-id="${esc(x.id)}" data-k="${c.k}" title="${esc(c.model)} · $${(c.cost ?? 0).toFixed(3)}">
          <img src="${media(c.file, c.mtime)}" alt="${esc(x.id)} #${c.k}" loading="lazy"><span class="small">#${c.k}</span></button>`).join('')}</div>` : '<div class="small muted">ยังไม่มีผู้สมัคร</div>'}
      <div class="row" style="gap:6px">
        <button class="btn sm" data-act="job" data-job="imagegen" data-image="${esc(x.id)}" ${x.candidates.length ? 'data-force="1"' : ''}>${x.candidates.length ? 'สร้างใหม่' : 'สร้างภาพ'}</button>
        <button class="btn sm" data-act="fb-img" data-id="${esc(x.id)}">ขอแก้ prompt…</button></div>
    </div>`;
  return `
  <div class="card pad stack" style="gap:12px;margin-bottom:16px">
    <div class="row" style="gap:10px"><b class="grow">ภาพจาก AI · ${im.items.length} รูป${pending ? ` · <span style="color:var(--warn-ink)">ยังไม่เลือก ${pending}</span>` : ''}</b>
      <span class="small muted">ใช้ไปแล้ว $${Number(im.cost).toFixed(2)}</span>
      <button class="btn dark" data-act="job" data-job="imagegen">สร้างภาพที่ยังไม่มี</button></div>
    <div class="small muted">สร้างผ่าน OpenRouter (key เดียวกับเสียงพากย์) · กดรูปเพื่อเลือก · ตรวจทุกรูปก่อนใช้ (ห้ามมีใบหน้าบุคคลศักดิ์สิทธิ์/ตัวหนังสือในรูป)</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px">${im.items.map(card).join('')}</div>
  </div>`;
};

const docView = (file, st) => {
  const text = S.d.docs[file];
  if (!text) {
    const req = S.d.docs['request.md'];
    if (st.key === 'brief' && req) return `<div class="banner info">ยังไม่มี brief.md — Claude จะทำจากคำขอนี้</div><div class="md">${md(req)}</div>`;
    return emptyState(`ยังไม่มี ${file}`, `ให้ Claude ทำ stage นี้ — ดูปุ่มคัดลอก prompt ในแผง Claude ด้านขวา`);
  }
  return `<div class="md">${md(text)}</div>`;
};

const BANNED = /(ดังนั้นจึง|ซึ่งได้แก่|อันเป็น|ทั้งนี้|ท่านผู้ชม|ครับ)/g;
const scriptView = () => {
  if (!S.d.scenes.length || S.showRaw) {
    return `${S.d.scenes.length ? '<div><button class="btn sm" data-act="raw">ดูแบบแยกซีน</button></div>' : ''}${docView('script.md', {key: 'script'})}`;
  }
  const total = S.d.scenes.reduce((a, s) => a + s.chars, 0);
  const bc = S.d.settings?.budget?.chars ?? {min: 1500, max: 1800, hard: 1900};
  const W = bc.hard * 1.1;
  const col = total < bc.min ? 'var(--warn-ink)' : total > bc.max ? 'var(--accent)' : 'var(--ok-ink)';
  return `
  <div class="card pad stack">
    <div class="row"><b class="grow">งบตัวอักษร (จาก settings)</b><span style="font-family:var(--display);font-size:22px;font-weight:600;color:${col}">${total.toLocaleString()}</span><span class="muted small">/ ${bc.min.toLocaleString()}–${bc.max.toLocaleString()} (${esc(settingsLine())})</span></div>
    <div class="meter" aria-hidden="true"><div class="band" style="left:${bc.min / W * 100}%;width:${(bc.max - bc.min) / W * 100}%"></div><div class="fill" style="width:${Math.min(100, total / W * 100)}%;opacity:.85"></div></div>
    <div class="row small muted"><span class="grow">แถบเขียว = ช่วงที่พอดีกับความยาวที่ตั้งไว้ · ไฮไลต์แดง = คำต้องห้าม (rule 03)</span><button class="btn sm" data-act="raw">ดู script.md ทั้งไฟล์</button></div>
  </div>
  ${S.d.scenes.map((s) => `
    <div class="card pad stack">
      <div class="row"><b style="font-family:var(--display);font-size:17px">${s.id}</b><span class="pill plain">${esc(s.beat)}</span><span class="pill" style="background:${ERA_COLOR[s.era] ?? '#555'};color:#fff">${esc(ERA_TH[s.era] ?? s.era)}</span><span class="grow"></span><span class="small muted">${s.chars} ตัวอักษร · ${s.shots.length} ช็อต</span>
        <button class="btn sm" data-act="fb-scene" data-id="${s.id}">คอมเมนต์ซีนนี้</button></div>
      <div class="scene-vo">${inline(s.vo).replace(BANNED, '<mark class="ban">$1</mark>')}</div>
    </div>`).join('')}`;
};

const shotFrame = (sh) => {
  const st = S.d.stills[sh.id];
  const openHere = openFb().some((f) => f.target === `shot:${sh.id}`);
  return `<div class="frame">${st ? `<img src="${media(st.path, st.mtime)}" alt="ภาพนิ่ง ${sh.id}" loading="lazy">` : `<div class="ph">${esc(sh.description)}</div>`}
    ${st?.maybeStale ? '<span class="tagl pill bad">อาจล้าสมัย</span>' : !st ? '<span class="tagl pill plain">ยังไม่มีภาพนิ่ง</span>' : ''}
    ${openHere ? '<span class="tagr pill warn">คำขอค้าง</span>' : ''}</div>`;
};

const shotsView = () => {
  if (!S.d.scenes.length) return emptyState('ยังไม่มี shots.json', 'ให้ Claude ทำ Shot list ตาม rules/09 หลังบทพากย์ได้รับอนุมัติ');
  const scene = S.d.scenes.find((s) => s.id === S.scene) ?? S.d.scenes[0];
  S.scene = scene.id;
  const sh = scene.shots.find((x) => x.id === S.shot) ?? scene.shots[0];
  S.shot = sh.id;
  const staleCount = Object.values(S.d.stills).filter((x) => x.maybeStale).length;
  const noStills = !Object.keys(S.d.stills).length;
  const fbs = (S.d.feedback ?? []).filter((f) => f.target === `shot:${sh.id}`);
  return `
  ${noStills ? `<div class="banner warn"><span class="grow">ยังไม่มีภาพนิ่ง — กด “ภาพนิ่งทุกช็อต” เพื่อดูภาพจริงแทนคำอธิบาย</span><button class="btn sm dark" data-act="job" data-job="stills">ภาพนิ่งทุกช็อต</button></div>`
    : staleCount ? `<div class="banner bad"><span class="grow">ภาพนิ่ง ${staleCount} ช็อตเก่ากว่า shots.json — อาจไม่ตรงกับของจริง</span><button class="btn sm dark" data-act="job" data-job="stills">Render ภาพนิ่งใหม่</button></div>` : ''}
  <div class="tabs" role="tablist">${S.d.scenes.map((s) => `<button class="tab ${s.id === scene.id ? 'on' : ''}" role="tab" aria-selected="${s.id === scene.id}" data-act="scene" data-id="${s.id}">${s.id} · ${esc(ERA_TH[s.era] ?? s.era)}</button>`).join('')}</div>
  <div class="card pad detail">
    <div>${shotFrame(sh)}</div>
    <div class="stack" style="gap:8px">
      <div class="row"><h2 style="font-size:20px">${sh.id}</h2><span class="kind ${sh.kind}">${sh.kind}</span>${sh.data ? `<span class="pill plain">${esc(sh.data)}</span>` : ''}</div>
      <div class="kv"><b>ภาพ:</b> ${esc(sh.description)}</div>
      <div class="kv" style="padding:8px 12px;border-radius:10px;background:var(--ground)"><b>VO:</b> “${esc(sh.vo)}”</div>
      ${sh.text.length ? `<div class="kv"><b>ตัวหนังสือบนจอ:</b> ${sh.text.map(esc).join(' · ')}</div>` : ''}
      <div class="kv small"><b>layers:</b> <span class="mono">${sh.layers.map(esc).join(', ') || '–'}</span></div>
      <label class="f">สั่งแก้ช็อตนี้
        <textarea rows="2" data-draft="shot:${sh.id}" placeholder="เช่น ให้ป้ายขึ้นช้ากว่านี้ 0.5 วิ">${esc(S.drafts[`shot:${sh.id}`] ?? '')}</textarea></label>
      <div class="row"><span class="grow small muted">${fbs.length ? `${fbs.length} คำขอของช็อตนี้` : ''}</span><button class="btn primary" data-act="fb-send" data-target="shot:${sh.id}">เพิ่มเข้าคิวให้ Claude</button></div>
      ${fbs.slice(0, 2).map(fbItem).join('')}
    </div>
  </div>
  <div class="sgrid">${scene.shots.map((x) => `
    <button class="shot ${x.id === sh.id ? 'on' : ''}" data-act="shot" data-id="${x.id}" aria-pressed="${x.id === sh.id}">
      ${shotFrame(x)}
      <span class="row" style="gap:6px"><span class="mono" style="font-weight:500">${x.id}</span><span class="kind ${x.kind}">${x.kind}</span></span>
      <span class="vo">${esc(x.vo)}</span>
    </button>`).join('')}</div>`;
};

const voiceView = () => {
  if (!S.d.scenes.length) return emptyState('ยังไม่มี shots.json', 'ต้องมี Shot list ก่อนสร้างเสียงพากย์');
  const vo = S.d.vo;
  const total = Object.values(vo).reduce((a, v) => a + (v?.durationMs ?? 0), 0) / 1000;
  const missing = S.d.scenes.filter((s) => !vo[s.id]).length;
  const net = S.health && !S.health.openrouterKey;
  const sp = S.d.settings?.budget?.speechSec ?? [150, 185];
  return `
  ${net ? '<div class="banner bad">ยังไม่มี OPENROUTER_API_KEY ใน .env — สร้างเสียงไม่ได้ (ดู .env.example)</div>' : ''}
  <div class="card pad row">
    <div class="grow"><div class="small muted">เสียงพากย์รวม</div><div style="font-family:var(--display);font-size:26px;font-weight:600">${total.toFixed(1)} วิ <span class="small muted" style="font-family:var(--body);font-weight:400">งบ ${sp[0]}–${sp[1]} วิ · เสียง ${esc(S.d.settings?.resolved?.voice?.tts?.voice ?? '')}</span></div></div>
    ${missing ? `<span class="pill warn">ขาด ${missing} ซีน</span>` : total >= sp[0] && total <= sp[1] ? '<span class="pill ok">อยู่ในงบ</span>' : '<span class="pill warn">นอกงบ — ตรวจงบคำ (rule 01)</span>'}
    <button class="btn dark" data-act="job" data-job="tts">สร้างเสียงทุกซีน</button>
  </div>
  <div class="card pad">
    ${S.d.scenes.map((s) => {
      const v = vo[s.id];
      return `<div class="vo-row">
        <b class="mono">${s.id}</b>
        ${v?.wav ? `<audio controls preload="none" src="${media(v.wav, v.mtime)}"></audio>` : '<span class="muted small">ยังไม่มีไฟล์เสียง</span>'}
        <span>${v ? `${(v.durationMs / 1000).toFixed(1)} วิ` : '–'}</span>
        <span>${v ? (v.cues === v.expectedCues ? `<span class="pill ok">cue ${v.cues}/${v.expectedCues}</span>` : `<span class="pill bad">cue ${v.cues}/${v.expectedCues}</span>`) : ''}</span>
        <span class="row" style="gap:6px"><button class="btn sm" data-act="fb-vo" data-id="${s.id}">คอมเมนต์</button><button class="btn sm" data-act="job" data-job="tts" data-scene="${s.id}">สร้างใหม่</button></span>
      </div>`;
    }).join('')}
  </div>
  <div class="small muted">ช่วงที่ไม่ได้แก้บทจะใช้ cache (ไม่เสียเงินซ้ำ) · ถ้าอ่านคำไหนผิด ให้ Claude แก้ <code>voTTS</code> ของซีนนั้น</div>`;
};

const outBadges = (o) => {
  const b = [];
  if (o.duration) b.push(`<span class="pill plain">${mmss(o.duration)}</span>`);
  if (o.hasAudio === true) b.push('<span class="pill ok">มีเสียง</span>');
  if (o.hasAudio === false) b.push('<span class="pill bad">ไม่มีเสียง</span>');
  if (o.lufs != null) b.push(`<span class="pill ${Math.abs(o.lufs + 14) <= 1 ? 'ok' : 'warn'}">${o.lufs.toFixed(1)} LUFS</span>`);
  if (o.height) b.push(`<span class="pill plain">${o.height}p</span>`);
  if (o.bytes) b.push(`<span class="pill plain">${mb(o.bytes)}</span>`);
  return b.join('');
};
const previewView = () => {
  const outs = S.outputs;
  const best = outs?.find((o) => o.dir === 'out' && o.master && o.hasAudio) ?? outs?.find((o) => o.hasAudio);
  const cur = outs?.find((o) => o.path === S.video) ?? best ?? outs?.[0];
  return `
  <div class="card pad stack">
    <div class="row"><b class="grow">คำสั่งบนเครื่องนี้</b><span class="small muted">พรีวิวสดทีละเฟรม: <code>npm run studio</code></span></div>
    <div class="jobgrid">
      <button class="btn dark" data-act="job" data-job="render">Render วิดีโอ + master เสียง</button>
      <button class="btn" data-act="job" data-job="master">ปรับเสียง −14 LUFS อย่างเดียว</button>
      <button class="btn" data-act="job" data-job="stills">ภาพนิ่งทุกช็อต</button>
      <button class="btn" data-act="job" data-job="validate">ตรวจ shots.json</button>
      <button class="btn" data-act="job" data-job="subs">ไฟล์ซับ .srt/.vtt</button>
    </div>
    ${S.subs?.length ? `<div class="row small" style="flex-wrap:wrap;gap:6px"><span class="muted">ไฟล์ซับ (อัปโหลดเป็นคำบรรยายบน YouTube):</span>${S.subs.map((x) => `<a class="pill plain" href="${media(x.path, x.mtime)}" download="${esc(x.name)}">${x.lang === 'en' ? 'อังกฤษ' : 'ไทย'} · ${esc(x.name.split('.').pop())}</a>`).join('')}</div>` : ''}
  </div>
  ${outs == null ? '<div class="muted">กำลังตรวจไฟล์วิดีโอ… (วัดความดังครั้งแรกใช้เวลาสักครู่)</div>'
    : !outs.length ? emptyState('ยังไม่มีวิดีโอ', 'กด “Render วิดีโอ + master เสียง” — ใช้เวลาหลายนาที ดู log ในแผงขวา')
    : `<div style="display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px;align-items:start">
      <div class="stack">${cur ? `<video controls preload="metadata" src="${media(cur.path, cur.mtime)}"></video><div class="small muted mono">${esc(cur.path)}</div>` : ''}</div>
      <div class="stack" style="gap:10px">${outs.map((o) => `
        <button class="out ${o.path === cur?.path ? 'on' : ''} ${o === best ? 'best' : ''}" data-act="video" data-path="${esc(o.path)}">
          <span class="row" style="gap:6px"><span class="mono small grow" style="font-weight:500;overflow:hidden;text-overflow:ellipsis">${esc(o.name)}</span>${o === best ? '<span class="pill dark">ไฟล์สำหรับอัปโหลด</span>' : ''}</span>
          <span class="row" style="gap:6px;flex-wrap:wrap">${outBadges(o)}</span>
          <span class="small muted">${esc(o.dir)} · ${new Date(o.mtime).toLocaleString('th-TH', {dateStyle: 'short', timeStyle: 'short'})}${o.hasAudio === false ? ' · เวอร์ชันก่อนมีเสียงพากย์?' : ''}</span>
        </button>`).join('')}</div>
    </div>`}`;
};

const qaView = () => {
  const q = S.qa;
  if (!q) return '<div class="muted">กำลังตรวจ… (รัน validate + วัดไฟล์วิดีโอ)</div>';
  const fails = q.failing.length;
  return `
  <div class="stats">
    <div class="card stat"><div class="small muted">ตรวจอัตโนมัติ</div><div class="v">${q.autoPass} / ${q.autoTotal} <span class="small muted">ผ่าน</span></div></div>
    <div class="card stat"><div class="small muted">คุณต้องดูเอง</div><div class="v">${q.manualDone} / ${q.manualTotal} <span class="small muted">ติ๊กแล้ว</span></div></div>
    <div class="card stat" style="${fails ? 'background:var(--accent-soft);border-color:#F0C3B2' : 'background:var(--ok-soft)'}"><div class="small" style="color:${fails ? 'var(--accent-ink)' : 'var(--ok-ink)'}">ยังไม่ผ่าน</div><div class="v" style="color:${fails ? 'var(--accent-ink)' : 'var(--ok-ink)'}">${fails} <span class="small">ข้อ</span></div></div>
  </div>
  <div class="row"><span class="small muted grow">วัดจาก ${q.measuredFrom ? `<code>${esc(q.measuredFrom)}</code>` : 'ยังไม่มีวิดีโอใน out/'}</span>
    <button class="btn" data-act="qa-refresh">ตรวจใหม่</button>
    <button class="btn" data-act="qa-send" ${q.groups.flatMap((g) => g.items).some((i) => i.type === 'auto' && i.result !== 'pass') ? '' : 'disabled'}>ส่งข้ออัตโนมัติที่ไม่ผ่านให้ Claude</button></div>
  <div class="card pad" style="padding-top:6px">
    ${q.groups.map((g) => `<div style="padding:12px 0 2px;font-family:var(--display);font-weight:500;color:var(--muted)">${esc(g.name)}</div>
      ${g.items.map((i) => `<div class="qa-item">
        ${i.type === 'manual'
          ? `<button class="qa-ic ${i.checked ? 'on' : 'off'}" data-act="qa-tick" data-key="${i.key}" data-on="${!i.checked}" aria-pressed="${i.checked}" aria-label="${i.checked ? 'ยกเลิกติ๊ก' : 'ติ๊ก'}: ${esc(i.text)}">${i.checked ? '✓' : ''}</button>`
          : `<span class="qa-ic ${i.result}" aria-hidden="true">${{pass: '✓', fail: '✗', warn: '!'}[i.result]}</span>`}
        <span class="grow">${inline(i.text)}</span>
        ${i.type === 'auto' ? `<span class="mono small" style="color:${{pass: 'var(--ok-ink)', fail: 'var(--accent-ink)', warn: 'var(--warn-ink)'}[i.result]}">${esc(i.value)}</span>` : ''}
        <span class="small muted" style="width:62px;text-align:right">${i.type === 'auto' ? 'อัตโนมัติ' : 'คุณดู'}</span>
      </div>`).join('')}`).join('')}
  </div>
  ${q.validate.warns.length || q.validate.errors.length ? `<details class="card pad"><summary>ผล validate (${q.validate.errors.length} ✗ · ${q.validate.warns.length} ⚠)</summary><div class="joblog" style="margin-top:10px">${esc(q.validate.lines.join('\n'))}</div></details>` : ''}`;
};

const coverView = () => {
  const cs = S.d.covers;
  if (!cs.length) return emptyState('ยังไม่มีปก', 'ให้ Claude เพิ่ม <code>covers</code> ใน shots.json ตาม rules/12-cover.md (2–3 แบบ)');
  const sel = S.d.status.cover.selected;
  const rendered = cs.some((c) => c.image);
  return `
  <div class="row"><span class="grow small muted">ปกจริงจาก <code>npm run cover</code> · 1280×720 JPEG ≤ 2MB</span><button class="btn ${rendered ? '' : 'dark'}" data-act="job" data-job="cover">${rendered ? 'Render ปกใหม่' : 'Render ปก'}</button></div>
  <div class="covers">${cs.map((c) => `
    <div class="cover ${c.id === sel ? 'on' : ''}">
      ${c.image ? `<img src="${media(c.image, c.mtime)}" alt="ปก ${c.id}">` : '<div class="frame"><div class="ph">ยังไม่ได้ render</div></div>'}
      <div class="row"><b style="font-family:var(--display);font-size:18px">${c.id}</b><span class="pill plain">${esc(ERA_TH[c.era] ?? c.era)}</span>
        ${c.bytes ? `<span class="pill ${c.bytes <= 2 * 1024 * 1024 ? 'ok' : 'bad'}">${mb(c.bytes)}</span>` : ''}
        ${c.sourceRef ? `<span class="pill blue">${esc(c.sourceRef)}</span>` : ''}<span class="grow"></span>${c.id === sel ? '<span class="pill ok">✓ ใช้ปกนี้</span>' : ''}</div>
      <div class="small">${esc(c.title.replace(/\*/g, '').replace(/\n/g, ' / '))}${c.kicker ? ` · <span class="muted">${esc(c.kicker)}</span>` : ''}</div>
      <div class="row"><button class="btn sm" data-act="fb-cover" data-id="${c.id}">ขอแก้ปกนี้</button><span class="grow"></span>
        <button class="btn sm ${c.id === sel ? 'ok' : 'primary'}" data-act="cover-pick" data-id="${c.id}" ${c.image ? '' : 'disabled'}>${c.id === sel ? '✓ เลือกแล้ว' : `ใช้ปก ${c.id}`}</button></div>
    </div>`).join('')}</div>
  ${rendered ? `<div class="card pad stack">
    <div><b>ดูในฟีดมือถือ</b> <span class="small muted">— ขนาดจริงที่คนเห็นก่อนกด อ่านหัวข้อออกไหม? มุมขวาล่างถูกเวลาคลิปทับ</span></div>
    <div class="feed">${cs.filter((c) => c.image).map((c) => `<div class="it"><div class="th"><img src="${media(c.mobile ?? c.image, c.mtime)}" alt="ปก ${c.id} ขนาดฟีด"><span class="dur">${mmss(S.d.vo ? Object.values(S.d.vo).reduce((a, v) => a + (v?.durationMs ?? 0), 0) / 1000 + 8 : null)}</span></div>
      <div class="small" style="font-weight:600;line-height:1.4">${esc(S.d.meta?.title ?? '')}</div><div class="small muted">[ชื่อช่อง] · ปก ${c.id}</div></div>`).join('')}</div>
  </div>` : ''}`;
};

// ---------------- stage 11: ข้อความโพสต์ ----------------
const POST_ICON = {youtube: '▶', tiktok: '♪', instagram: '◎', facebook: 'f', x: '𝕏'};
const postView = () => {
  const r = S.d.post;
  if (!r) return '<div class="muted">กำลังโหลด…</div>';
  const k = r.kit ?? {};
  const head = `<div class="card pad stack">
    <div class="row"><b class="grow">ข้อมูลตั้งต้น</b><span class="pill plain">${esc(k.format ?? '')}</span>
      <span class="pill ${k.durationEstimated ? 'warn' : 'ok'}">ยาว ${k.durationSec ? mmss(k.durationSec) : '?'}${k.durationEstimated ? ' (ประมาณ)' : ''}</span>
      <span class="pill blue">แหล่งอ้างอิง ${k.sources ?? 0}</span></div>
    <div class="small muted">แพลตฟอร์มที่เหมาะกับ format นี้: ${(k.platforms ?? []).map((p) => `<b>${esc(p)}</b>`).join(' · ')} — ข้อความ Claude เขียนใน <code>projects/${esc(S.slug)}/post.json</code> ตาม rules/14-post.md · บทคลิป/ที่มา/เครดิตระบบใส่ให้เอง</div>
  </div>`;
  if (!r.exists) return head + emptyState('ยังไม่มีข้อความโพสต์', `ให้ Claude ทำ stage 11 — <code>/ht-next ${esc(S.slug)}</code> (ควรทำหลังได้เสียงพากย์แล้ว เวลาในบทคลิปจะตรง)`);
  const msgs = [...(r.errors ?? []).map((e) => `<div class="small" style="color:var(--accent-ink)">✗ ${esc(e)}</div>`), ...(r.warnings ?? []).map((w) => `<div class="small" style="color:var(--warn-ink)">⚠ ${esc(w)}</div>`)].join('');
  const cnt = (f) => `<span class="pill ${f.state === 'over' ? 'bad' : f.state === 'meh' ? 'warn' : 'ok'}" title="${f.ideal ? `แนะนำ ${f.ideal[0]}–${f.ideal[1]}` : ''}">${f.count.toLocaleString()} / ${f.limit.toLocaleString()}</span>`;
  const card = (p) => `<div class="card pad stack postcard">
    <div class="row"><span class="pficon">${POST_ICON[p.id] ?? '•'}</span><b class="grow" style="font-family:var(--display);font-size:17px">${esc(p.name)}</b>
      ${p.fit ? '' : '<span class="pill plain">ไม่ตรง format</span>'}${p.cover ? `<span class="pill blue">ปก ${esc(p.cover)}</span>` : ''}
      ${p.hashtags.length ? `<span class="pill ${p.hashtagIdeal && (p.hashtags.length < p.hashtagIdeal[0] || p.hashtags.length > p.hashtagIdeal[1]) ? 'warn' : 'plain'}"># ${p.hashtags.length}</span>` : ''}
      <button class="btn sm" data-act="fb-post" data-id="${esc(p.id)}">ขอแก้</button></div>
    ${p.fields.map((f) => `<div class="stack" style="gap:6px">
      <div class="row"><span class="small muted grow">${esc(f.label)}</span>${cnt(f)}<button class="btn sm" data-act="copy-cmd" data-text="${esc(f.text)}">คัดลอก</button></div>
      <pre class="posttext">${esc(f.text)}</pre></div>`).join('')}
    ${p.tips ? `<div class="small muted">💡 ${esc(p.tips)}</div>` : ''}
  </div>`;
  return `${head}
  <div class="row"><span class="grow small muted">${r.aiDisclosure == null ? '' : `ติดป้ายเนื้อหา AI: <b>${r.aiDisclosure ? 'ต้องติด' : 'ไม่ต้อง'}</b>`}${r.notes ? ` · ${esc(r.notes)}` : ''}</span>
    <button class="btn" data-act="job" data-job="post">ส่งออก out/${esc(S.slug)}-post.md</button></div>
  ${msgs ? `<div class="card pad stack" style="gap:4px">${msgs}</div>` : ''}
  <div class="postgrid">${r.platforms.map(card).join('')}</div>`;
};

// ---------------- Claude panel ----------------
const fbItem = (f) => `
  <div class="fb ${f.status}">
    <span class="row" style="gap:6px"><span class="tg grow">${esc(f.target)}</span><span class="small muted">${ago(f.createdAt ?? f.at)}</span></span>
    <span style="font-size:13.5px">${esc(f.text)}</span>
    ${f.status === 'done' ? `<span class="nt">✓ ${esc(f.note ?? 'เสร็จแล้ว')}${f.by === 'claude' ? ' — Claude' : ''}</span>` : ''}
    ${f.status === 'dismissed' ? '<span class="small muted">ยกเลิกแล้ว</span>' : ''}
    ${f.status === 'open' ? `<span class="row" style="gap:6px;justify-content:flex-end"><button class="btn sm" data-act="fb-status" data-id="${f.id}" data-s="dismissed">ยกเลิก</button><button class="btn sm" data-act="fb-status" data-id="${f.id}" data-s="done">เสร็จแล้ว</button></span>` : ''}
  </div>`;

const claudePanel = () => {
  const np = nextPrompt();
  const fb = S.d.feedback ?? [];
  const open = fb.filter((f) => f.status === 'open');
  const closed = fb.filter((f) => f.status !== 'open').slice(0, 3);
  const job = S.jobs[0];
  const stageTarget = ['brief', 'research', 'beats', 'script', 'assets'].includes(S.stage) ? S.stage : 'project';
  return `
  <aside class="panel" aria-label="แผง Claude">
    <div class="stack" style="gap:8px">
      <h2 style="font-size:19px">ถัดไป</h2>
      ${np.who === 'you' ? `<div class="nextbox"><b>${esc(np.title)}</b>${np.stage && np.stage !== S.stage ? ` — <a href="#/p/${S.slug}/${np.stage}">ไปที่ stage</a>` : ''}</div>`
        : np.who === 'done' ? `<div class="banner ok">${esc(np.title)}</div>`
        : `<div class="small" style="font-weight:600">${esc(np.title)}</div><div class="promptbox">${esc(np.text)}</div>
           <button class="btn dark" data-act="copy-next">คัดลอก prompt ไปให้ Claude</button>`}
    </div>
    <div class="stack" style="gap:8px">
      <div class="row"><h3 style="font-size:16px" class="grow">คิวงาน Claude</h3><span class="small muted">ค้าง ${open.length}</span></div>
      ${open.map(fbItem).join('') || '<div class="small muted">ไม่มีคำขอค้าง</div>'}
      <label class="f small">เพิ่มคำขอ (${stageTarget === 'project' ? 'ทั้งโปรเจกต์' : esc(stageTarget)})
        <textarea rows="2" data-draft="${stageTarget}">${esc(S.drafts[stageTarget] ?? '')}</textarea></label>
      <button class="btn" data-act="fb-send" data-target="${stageTarget}">เพิ่มเข้าคิว</button>
      ${closed.length ? `<details><summary class="small muted">เสร็จล่าสุด (${fb.length - open.length})</summary><div class="stack" style="gap:6px;margin-top:8px">${closed.map(fbItem).join('')}</div></details>` : ''}
    </div>
    <div class="stack" style="gap:8px">
      <div class="row"><h3 style="font-size:16px" class="grow">งานบนเครื่องนี้</h3>
        ${job ? `<span class="pill ${{running: 'warn', ok: 'ok', error: 'bad', cancelled: 'plain'}[job.status]}">${{running: 'กำลังรัน', ok: 'เสร็จ', error: 'ผิดพลาด', cancelled: 'ยกเลิก'}[job.status]}</span>` : ''}</div>
      ${job ? `<div class="small"><b>${esc(job.label)}</b>${job.scene ? ` · ${job.scene}` : ''} · ${esc(job.slug)} · ${clock(job.startedAt)}${job.endedAt ? ` (${Math.round((job.endedAt - job.startedAt) / 1000)} วิ)` : ''}</div>
        <div class="joblog" id="joblog">${esc((S.logs[job.id] ?? job.logTail ?? '').slice(-6000)) || '…'}</div>
        ${job.status === 'running' ? `<button class="btn sm" data-act="job-cancel" data-id="${job.id}">หยุดงาน</button>` : ''}` : '<div class="small muted">ยังไม่มีงาน — ปุ่มสั่งงานอยู่ในแต่ละ stage</div>'}
    </div>
    ${S.activity.length ? `<div class="stack" style="gap:6px"><h3 style="font-size:16px">ไฟล์ที่เพิ่งเปลี่ยน</h3><ul class="activity">${S.activity.slice(0, 6).map((a) => `<li>${clock(a.t)} · <span class="mono">${esc(a.p)}</span></li>`).join('')}</ul></div>` : ''}
  </aside>`;
};

// ---------------- pages ----------------
const homePage = () => {
  const lenText = (s) => (s == null ? '' : s < 90 ? `${s} วิ` : mmssT(s));
  const whose = (p) => {
    const first = p.stages.find((s) => s.state !== 'approved');
    if (!first) return {kind: 'done', first};
    return {kind: ['review', 'stale'].includes(first.state) ? 'you' : 'claude', first};
  };
  const card = (p) => {
    const st = p.stages;
    const done = st.filter((s) => s.state === 'approved').length;
    const w = whose(p);
    const portrait = !!p.format?.portrait;
    const fmt = portrait ? '<span class="fbadge tt">▯ TikTok · 9:16</span>' : '<span class="fbadge yt">▭ YouTube · 16:9</span>';
    const thumb = p.thumb
      ? (portrait ? `<img class="tblur" src="${media(p.thumb)}" alt=""><img class="tfit" src="${media(p.thumb)}" alt="">` : `<img class="tcover" src="${media(p.thumb)}" alt="">`)
      : `<div class="empty">${logo(40)}<span>ยังไม่มีปก/ภาพนิ่ง</span></div>`;
    const chips = [
      p.voice ? `<span class="chip">🎙 ${esc(p.voice)}</span>` : '',
      p.subtitles && p.subtitles !== 'th' ? `<span class="chip">ซับ ${esc({'th+en': 'ไทย+อังกฤษ', en: 'อังกฤษ', off: 'ไม่ฝัง'}[p.subtitles] ?? p.subtitles)}</span>` : '',
      p.derivedFrom ? `<a class="chip link" href="#/p/${esc(p.derivedFrom)}">↳ แตกจาก ${esc(p.derivedFrom)}</a>` : '',
    ].join('');
    const next = w.kind === 'done'
      ? '<div class="nextbox done"><b>ครบทุก stage แล้ว</b> — พร้อมอัปโหลด</div>'
      : w.kind === 'you'
        ? `<div class="nextbox you"><span class="who">ตาคุณ</span><span class="grow">${w.first.n} · ${esc(w.first.name)} — ${w.first.state === 'stale' ? 'ล้าสมัย ต้องตรวจใหม่' : 'รอคุณตัดสิน'}</span></div>`
        : `<div class="nextbox claude"><span class="who">ตา Claude</span><span class="grow">${w.first.n} · ${esc(w.first.name)}</span>
            <button class="btn sm" data-act="copy-cmd" data-text="/ht-next ${esc(p.slug)}" title="คัดลอกคำสั่งไปวางใน Claude">คัดลอก /ht-next</button></div>`;
    return `<article class="card pcard">
      <a class="thumbwrap ${portrait ? 'portrait' : ''}" href="#/p/${p.slug}" aria-label="เปิด ${esc(p.title)}">${thumb}
        <span class="badges">${fmt}${p.targetSec ? `<span class="fbadge">${lenText(p.targetSec)}</span>` : ''}</span></a>
      <div class="pad stack" style="gap:10px">
        <div><div class="ptitle">${esc(p.title)}</div>
          <div class="mono small muted">${esc(p.slug)} · ${p.scenes} ซีน · ${p.shots} ช็อต${p.eras.length ? ` · ${p.eras.length} ยุค` : ''}</div></div>
        ${chips ? `<div class="chips">${chips}</div>` : ''}
        <div class="row" style="gap:10px"><div class="segs grow" aria-label="ความคืบหน้า ${done}/${st.length}">${st.map((s) => `<span class="${s.state}" title="${s.n} · ${esc(s.name)}: ${STATE_TH[s.state]}"></span>`).join('')}</div>
          <span class="small muted" style="white-space:nowrap">${done}/${st.length}</span></div>
        ${next}
        ${p.openFeedback ? `<div class="small" style="color:var(--accent-ink)">คำขอแก้ค้าง ${p.openFeedback} รายการ — <code>/ht-feedback ${esc(p.slug)}</code></div>` : ''}
        <div class="row" style="gap:8px;margin-top:auto"><a class="btn primary grow" href="#/p/${p.slug}">เปิด Workspace</a><a class="btn" href="#/p/${p.slug}/settings" title="ตั้งค่าโปรเจกต์">ตั้งค่า</a></div>
      </div></article>`;
  };
  const all = [...S.projects].sort((a, b) => (b.updated ?? 0) - (a.updated ?? 0));
  const flt = S.homeFilter ?? 'all';
  const groups = {
    all: all, you: all.filter((p) => whose(p).kind === 'you'), claude: all.filter((p) => whose(p).kind === 'claude'),
    yt: all.filter((p) => !p.format?.portrait), tt: all.filter((p) => p.format?.portrait),
  };
  const tabs = [['all', 'ทั้งหมด'], ['you', 'รอคุณตัดสิน'], ['claude', 'รอ Claude'], ['yt', 'YouTube 16:9'], ['tt', 'TikTok 9:16']];
  const list = groups[flt] ?? all;
  const f = S.drafts;
  const slugOk = /^[a-z0-9][a-z0-9-]{0,63}$/.test(f.nslug ?? '');
  const newOpen = S.newOpen ?? !S.projects.length;
  const newPanel = `
    <section class="card pad newp" aria-label="เริ่มเรื่องใหม่">
      <div class="row"><h2 class="grow" style="font-size:21px">เริ่มเรื่องใหม่</h2>${S.projects.length ? '<button class="btn sm" data-act="new-toggle">ปิด</button>' : ''}</div>
      <div class="small muted">ระบบจะสร้าง <code>projects/&lt;slug&gt;/request.md</code> + <code>settings.json</code> แล้วให้ Claude ทำ Brief (stage 1) ด้วย <code>/ht-new &lt;slug&gt;</code></div>
      <div class="newgrid">
        <div class="stack" style="gap:10px">
          <label class="f">หัวข้อ<input data-draft="ntopic" value="${esc(f.ntopic ?? '')}" placeholder="เช่น ชาไทยมาจากไหน"></label>
          <div class="two">
            <label class="f">ชื่อโฟลเดอร์ (slug)<input data-draft="nslug" value="${esc(f.nslug ?? '')}" placeholder="thai-tea" class="mono"></label>
            <label class="f">แตกจากโปรเจกต์ (ไม่บังคับ)
              <select data-draft="nfrom"><option value="">— เรื่องใหม่ —</option>${S.projects.map((p) => `<option value="${esc(p.slug)}" ${f.nfrom === p.slug ? 'selected' : ''}>${esc(p.title ?? p.slug)}</option>`).join('')}</select></label>
          </div>
          ${f.nslug && !slugOk ? '<div class="small" style="color:var(--accent)">slug ใช้ได้แค่ a-z 0-9 และ -</div>' : ''}
          <label class="f">คำถามที่คนดูจะได้คำตอบ<input data-draft="nquestion" value="${esc(f.nquestion ?? '')}"></label>
          <div class="two">
            <label class="f">กลุ่มคนดู<input data-draft="naudience" value="${esc(f.naudience ?? '')}"></label>
            <label class="f">ประโยคที่อยากให้จำ<input data-draft="ntakeaway" value="${esc(f.ntakeaway ?? '')}"></label>
          </div>
          ${f.nfrom ? '<div class="small muted">แตกจากเรื่องยาว: คัดลอก facts.md และใช้ภาพ/ตัวละครร่วมกัน แต่บทและช็อตเขียนใหม่ — เหมาะกับคลิปสั้นแนวตั้ง</div>' : ''}
          ${S.nbudget?.text ? `<pre class="promptbox" style="margin:0;white-space:pre-wrap">${esc(S.nbudget.text.split('\nBeat:')[0])}</pre>` : ''}
          <button class="btn primary" data-act="new-project" ${f.ntopic && slugOk ? '' : 'disabled'}>สร้างโปรเจกต์</button>
        </div>
        <div class="stack" style="gap:6px"><b>รูปแบบ · ความยาว · แนวทาง · เสียง</b>${settingsPicker(S.ndraft, 'n', true)}</div>
      </div>
    </section>`;
  return `
  <header class="topbar"><a class="brand" href="#/">${logo()}<b>HistoryTeller</b><span>with Claude</span></a><span class="grow"></span>${healthChips()}</header>
  <main class="home">
    <div class="homehead">
      <div class="grow"><h1 style="font-size:30px">โปรเจกต์</h1>
        <div class="muted small">${S.projects.length} โปรเจกต์ · รอคุณตัดสิน ${groups.you.length} · รอ Claude ${groups.claude.length}</div></div>
      <details class="helpbox" ${f._help ? 'open' : ''}><summary>ทำงานคู่กับ Claude ยังไง</summary>
        <ol>
          <li><b>คุณ</b> ตั้งหัวข้อ อนุมัติ หรือสั่งแก้ในหน้านี้ (อนุมัติได้จากหน้านี้เท่านั้น)</li>
          <li><b>Claude</b> (Cowork / Claude Code ที่เชื่อมโฟลเดอร์นี้) รับคำสั่งลัดแล้วแก้ไฟล์ใน <code>projects/</code>:
            <code class="cue">/ht-new</code> Brief · <code class="cue">/ht-next</code> stage ถัดไป · <code class="cue">/ht-feedback</code> แก้คำขอที่ค้าง</li>
          <li><b>หน้านี้</b> เห็นไฟล์เปลี่ยนทันที และรันเสียง / ภาพ / render / ปก บนเครื่องนี้ให้</li>
        </ol></details>
      <button class="btn primary" data-act="new-toggle" aria-expanded="${newOpen}">+ เริ่มเรื่องใหม่</button>
    </div>
    ${newOpen ? newPanel : ''}
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button class="tab ${flt === k ? 'on' : ''}" role="tab" aria-selected="${flt === k}" data-act="home-filter" data-k="${k}">${l} <span class="cnt">${groups[k].length}</span></button>`).join('')}</div>
    ${list.length ? `<div class="projects">${list.map(card).join('')}</div>` : emptyState('ไม่มีโปรเจกต์ในกลุ่มนี้', 'ลองเลือกแท็บอื่น หรือกด “+ เริ่มเรื่องใหม่”')}
  </main>`;
};

const mainInner = () => {
  if (S.stage === 'settings') return settingsView();
  const st = S.d.stages.find((s) => s.key === S.stage) ?? S.d.stages[0];
  const body = {
    brief: () => docView('brief.md', st), research: () => docView('facts.md', st), beats: () => docView('beats.md', st),
    script: scriptView, shots: shotsView, assets: () => imagesView() + docView('assets.md', st), voice: voiceView, preview: previewView, qa: qaView, cover: coverView, post: postView,
  }[st.key]();
  return stageHead(st) + body;
};
const workspace = () => `<div class="ws">${stageRail()}<main class="main" id="main">${mainInner()}</main>${claudePanel()}</div>`;

// ---------------- render (แทนที่เฉพาะส่วนที่เปลี่ยน กันวิดีโอ/เสียงรีเซ็ต) ----------------
let last = {};
const render = () => {
  if (!S.slug) {
    const h = homePage();
    if (last.home !== h || $app.querySelector('.ws')) {
      const fk = document.activeElement?.dataset?.draft ?? document.activeElement?.dataset?.sdraft;
      const fsel = fk ? (document.activeElement.dataset.draft ? `[data-draft="${CSS.escape(fk)}"]` : `[data-sdraft="${CSS.escape(fk)}"]`) : null;
      $app.innerHTML = h;
      last = {home: h};
      const el = fsel && document.querySelector(fsel);
      if (el) { el.focus(); try { el.selectionStart = el.selectionEnd = el.value.length; } catch {} }
    }
    return;
  }
  if (!S.d) return;
  if (!$app.querySelector('.ws')) { $app.innerHTML = workspace(); last = {}; }
  const parts = {side: stageRail(), main: `<main class="main" id="main">${mainInner()}</main>`, panel: claudePanel()};
  const ws = $app.querySelector('.ws');
  const focus = document.activeElement?.dataset?.draft;
  const sfocus = document.activeElement?.dataset?.sdraft;
  const scroll = ws.children[1].scrollTop;
  const logEl = document.getElementById('joblog');
  const logAtBottom = !logEl || logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 30;
  if (last.side !== parts.side) { ws.children[0].outerHTML = parts.side; last.side = parts.side; }
  if (last.main !== parts.main) {
    ws.children[1].outerHTML = parts.main;
    last.main = parts.main;
    ws.children[1].scrollTop = scroll;
  }
  if (last.panel !== parts.panel) { ws.children[2].outerHTML = parts.panel; last.panel = parts.panel; }
  const nl = document.getElementById('joblog');
  if (nl && logAtBottom) nl.scrollTop = nl.scrollHeight;
  if (focus || sfocus) {
    const el = document.querySelector(focus ? `[data-draft="${CSS.escape(focus)}"]` : `[data-sdraft="${CSS.escape(sfocus)}"]`);
    if (el && document.activeElement !== el) { el.focus(); try { el.selectionStart = el.selectionEnd = el.value.length; } catch {} }
  }
};

// ---------------- events ----------------
document.addEventListener('input', (e) => {
  const sd = e.target.dataset?.sdraft;
  if (sd) {
    const [scope, field] = sd.split(':');
    const d = scope === 'n' ? S.ndraft : S.sdraft;
    if (!d) return;
    if (field === 'targetSec') d.targetSec = Number(e.target.value) || d.targetSec;
    if (field === 'music' || field === 'sfx') {
      d.overrides ??= {};
      d.overrides.style ??= {};
      d.overrides.style.audio ??= {};
      if (field === 'music') { if (e.target.checked) delete d.overrides.style.audio.music; else d.overrides.style.audio.music = null; }
      if (field === 'sfx') { if (e.target.checked) delete d.overrides.style.audio.sfx; else d.overrides.style.audio.sfx = false; }
      if (!Object.keys(d.overrides.style.audio).length) delete d.overrides.style.audio;
      if (!Object.keys(d.overrides.style).length) delete d.overrides.style;
      render();
    }
    if (field === 'ttsVoice' || field === 'cps') {
      d.overrides ??= {};
      d.overrides.voice ??= {};
      if (field === 'ttsVoice') { if (e.target.value) d.overrides.voice.tts = {voice: e.target.value}; else delete d.overrides.voice.tts; }
      if (field === 'cps') { const v = parseFloat(e.target.value); if (v > 0) d.overrides.voice.charsPerSec = v; else delete d.overrides.voice.charsPerSec; }
    }
    previewSettings();
    return;
  }
  const k = e.target.dataset?.draft;
  if (!k) return;
  if (k === 'req') S.reqNote = e.target.value;
  else S.drafts[k] = e.target.value;
  if (!S.slug && /^n/.test(k)) {
    if (k === 'ntopic' && !S.drafts._slugTouched) {
      // เดา slug จากหัวข้อภาษาอังกฤษไม่ได้ — ปล่อยให้ผู้ใช้กรอกเอง
    }
    if (k === 'nslug') S.drafts._slugTouched = true;
    const btn = document.querySelector('[data-act="new-project"]');
    if (btn) btn.disabled = !(S.drafts.ntopic && /^[a-z0-9][a-z0-9-]{0,63}$/.test(S.drafts.nslug ?? ''));
  }
});

const refresh = async (what = []) => {
  try {
    if (S.slug) await loadProject(); else await loadProjects();
    if (S.slug && (S.stage === 'preview' || what.includes('outputs'))) await loadOutputs();
    if (S.slug && S.stage === 'qa') await loadQa();
  } catch (e) { toast(e.message, true); }
  render();
};

const ACT = {
  async stage(el) {
    const a = el.dataset.a;
    const note = a === 'request-changes' ? (S.reqNote ?? '').trim() : undefined;
    if (a === 'request-changes' && !note) return toast('พิมพ์ก่อนว่าอยากให้แก้อะไร', true);
    await api(`/api/p/${S.slug}/stage/${S.stage}`, {method: 'POST', body: {action: a, note}});
    S.reqNote = null;
    toast({approve: 'อนุมัติแล้ว', reopen: 'เปิดให้แก้แล้ว', 'request-changes': 'ส่งคำขอแก้เข้าคิว Claude แล้ว'}[a]);
    await refresh();
  },
  'req-open'() { S.reqNote = ''; render(); document.querySelector('[data-draft="req"]')?.focus(); },
  'req-cancel'() { S.reqNote = null; render(); },
  raw() { S.showRaw = !S.showRaw; render(); },
  scene(el) { S.scene = el.dataset.id; S.shot = null; render(); },
  shot(el) { S.shot = el.dataset.id; render(); document.getElementById('main')?.scrollTo({top: 0, behavior: 'smooth'}); },
  video(el) { S.video = el.dataset.path; render(); },
  async 'fb-send'(el) {
    const target = el.dataset.target;
    const text = (S.drafts[target] ?? '').trim();
    if (!text) return toast('พิมพ์คำขอก่อน', true);
    await api(`/api/p/${S.slug}/feedback`, {method: 'POST', body: {target, text}});
    S.drafts[target] = '';
    toast('เพิ่มเข้าคิวแล้ว — คัดลอก prompt ในแผงขวาไปให้ Claude');
    await refresh();
  },
  async 'fb-status'(el) {
    await api(`/api/p/${S.slug}/feedback/${el.dataset.id}`, {method: 'POST', body: {status: el.dataset.s}});
    await refresh();
  },
  'fb-scene'(el) { promptFeedback(`scene:${el.dataset.id}`, `คอมเมนต์ซีน ${el.dataset.id}`); },
  'fb-vo'(el) { promptFeedback(`vo:${el.dataset.id}`, `คอมเมนต์เสียงซีน ${el.dataset.id} (เช่น คำที่อ่านผิด)`); },
  'fb-post'(el) { promptFeedback(`post:${el.dataset.id}`, `อยากให้แก้อะไรในข้อความโพสต์ ${el.dataset.id}`); },
  'fb-cover'(el) { promptFeedback(`cover:${el.dataset.id}`, `อยากให้แก้อะไรในปก ${el.dataset.id}`); },
  'fb-img'(el) { promptFeedback(`img:${el.dataset.id}`, `อยากให้รูป ${el.dataset.id} เปลี่ยนอะไร (Claude จะแก้ prompt ใน images.json แล้วคุณกดสร้างใหม่)`); },
  'copy-cmd'(el) { copy(el.dataset.text); },
  'home-filter'(el) { S.homeFilter = el.dataset.k; render(); },
  'new-toggle'() { S.newOpen = !(S.newOpen ?? !S.projects.length); if (S.newOpen) { S.drafts._nset = true; previewSettings(); } render(); },
  'copy-next'() { const np = nextPrompt(); if (np?.text) copy(np.text); },
  async 'img-select'(el) {
    await api(`/api/p/${S.slug}/images/select`, {method: 'POST', body: {id: el.dataset.id, k: el.dataset.k}});
    toast(`เลือก ${el.dataset.id} #${el.dataset.k}`);
    await refresh();
  },
  async job(el) {
    const j = await api('/api/jobs', {method: 'POST', body: {slug: S.slug, job: el.dataset.job, scene: el.dataset.scene, image: el.dataset.image, force: el.dataset.force === '1'}});
    S.logs[j.id] = '';
    await loadJobs();
    toast(`เริ่ม: ${j.label}`);
    render();
  },
  async 'job-cancel'(el) { await api(`/api/jobs/${el.dataset.id}/cancel`, {method: 'POST', body: {}}); },
  async 'qa-tick'(el) {
    await api(`/api/p/${S.slug}/qa`, {method: 'POST', body: {key: el.dataset.key, checked: el.dataset.on === 'true'}});
    await refresh();
  },
  async 'qa-refresh'() { S.qa = null; render(); await refresh(); },
  async 'qa-send'() {
    const fails = S.qa.groups.flatMap((g) => g.items).filter((i) => i.type === 'auto' && i.result !== 'pass');
    for (const i of fails) await api(`/api/p/${S.slug}/feedback`, {method: 'POST', body: {target: `qa:${i.key}`, text: `QA ไม่ผ่าน: ${i.text.replace(/`/g, '')} (${i.value})`}});
    toast(`ส่ง ${fails.length} ข้อเข้าคิว Claude แล้ว`);
    await refresh();
  },
  async 'cover-pick'(el) {
    await api(`/api/p/${S.slug}/cover`, {method: 'POST', body: {id: el.dataset.id}});
    toast(`เลือกปก ${el.dataset.id} แล้ว`);
    await refresh();
  },
  'sd-set'(el) {
    const d = el.dataset.scope === 'n' ? S.ndraft : S.sdraft;
    const k = el.dataset.k;
    d[k] = k === 'targetSec' ? Number(el.dataset.v) : el.dataset.v;
    if (k === 'voice' && d.overrides?.voice) delete d.overrides.voice; // override ของเสียงเดิมไม่ใช้กับเสียงใหม่
    // แนวตั้ง (TikTok/Reels/Shorts): ตั้งสไตล์/ความยาวที่แนะนำให้ (preset format → recommend)
    const rec = k === 'format' ? presetById('format', el.dataset.v)?.recommend : null;
    if (rec) {
      if (rec.style && presetById('style', rec.style)) d.style = rec.style;
      if (rec.targetSec && !rec.targetSec.includes(Number(d.targetSec))) d.targetSec = rec.targetSec[rec.targetSec.length - 1];
    }
    render();
    previewSettings();
  },
  'play-sfx'(el) { try { new Audio(media(`public/audio/sfx/${el.dataset.n}.wav`)).play(); } catch {} },
  'sd-reset'() { S.sdraftSlug = null; initSettingsDraft(); render(); },
  'sd-voice'(el) {
    S.sdraft.overrides ??= {};
    S.sdraft.overrides.voice ??= {};
    const pv = presetById('voice', S.sdraft.voice)?.tts?.voice;
    if (el.dataset.v === pv) delete S.sdraft.overrides.voice.tts; else S.sdraft.overrides.voice.tts = {voice: el.dataset.v};
    render();
    previewSettings();
  },
  async 'sd-save'() {
    const r = await api(`/api/p/${S.slug}/settings`, {method: 'POST', body: stripSettings(S.sdraft)});
    toast(r.newlyStale.length ? `บันทึกแล้ว — ล้าสมัย: ${r.newlyStale.join(', ')}` : 'บันทึก settings แล้ว');
    S.sdraftSlug = null;
    await refresh();
    initSettingsDraft();
    render();
  },
  async audition(el) {
    const j = await api('/api/jobs', {method: 'POST', body: {slug: S.slug, job: 'audition', preset: el.dataset.preset}});
    S.logs[j.id] = '';
    await loadJobs();
    toast(`เริ่ม: ${j.label}`);
    render();
  },
  async 'new-project'() {
    const f = S.drafts;
    const r = await api('/api/projects', {method: 'POST', body: {slug: f.nslug, topic: f.ntopic, question: f.nquestion, audience: f.naudience, takeaway: f.ntakeaway, derivedFrom: f.nfrom || '', settings: stripSettings(S.ndraft)}});
    for (const k of ['nslug', 'ntopic', 'nquestion', 'naudience', 'ntakeaway', 'nfrom', '_slugTouched']) delete S.drafts[k];
    toast('สร้างแล้ว — คัดลอก prompt /ht-new ในแผงขวาไปให้ Claude');
    go(`#/p/${r.slug}/brief`);
  },
};
const promptFeedback = (target, label) => {
  const text = window.prompt(label);
  if (!text?.trim()) return;
  api(`/api/p/${S.slug}/feedback`, {method: 'POST', body: {target, text: text.trim()}})
    .then(() => { toast('เพิ่มเข้าคิวแล้ว'); return refresh(); })
    .catch((e) => toast(e.message, true));
};
document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACT[el.dataset.act];
  if (!fn) return;
  e.preventDefault();
  try { await fn(el); } catch (err) { toast(err.message, true); }
});

document.addEventListener('toggle', (e) => {
  if (e.target.matches?.('details.nset')) S.drafts._nset = e.target.open;
  if (e.target.matches?.('details.helpbox')) S.drafts._help = e.target.open;
}, true);

// ---------------- live updates ----------------
let fsT;
const connect = () => {
  const es = new EventSource('/api/events');
  es.onmessage = (m) => {
    const ev = JSON.parse(m.data);
    if (ev.type === 'fs') {
      for (const p of ev.paths) S.activity.unshift({t: Date.now(), p});
      S.activity = S.activity.slice(0, 20);
      if (!S.slug || ev.slugs.includes(S.slug) || ev.paths.some((p) => p.startsWith('out/'))) {
        clearTimeout(fsT);
        fsT = setTimeout(() => refresh(ev.paths.some((p) => /\.(mp4|srt)$/.test(p)) ? ['outputs'] : []), 250);
      }
    } else if (ev.type === 'job-log') {
      S.logs[ev.id] = (S.logs[ev.id] ?? '') + ev.text;
      const el = document.getElementById('joblog');
      if (el && S.jobs[0]?.id === ev.id) {
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
        el.textContent = S.logs[ev.id].slice(-6000);
        if (atBottom) el.scrollTop = el.scrollHeight;
      }
    } else if (ev.type === 'job') {
      loadJobs().then(() => {
        if (ev.job.status === 'ok') toast(`เสร็จ: ${ev.job.label}`);
        if (ev.job.status === 'error') toast(`ผิดพลาด: ${ev.job.label} — ดู log`, true);
        if (ev.job.status !== 'running') refresh(['outputs']); else render();
      });
    }
  };
  es.onerror = () => { es.close(); setTimeout(connect, 2000); };
};

(async () => {
  try { S.health = await api('/api/health'); } catch {}
  try { S.presets = await api('/api/presets'); S.ndraft = clone(S.presets.defaults); previewSettings(); } catch {}
  await loadJobs().catch(() => {});
  connect();
  await route();
})();
