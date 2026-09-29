#!/usr/bin/env node
// HistoryTeller with Claude — local UI server (ไม่มี dependency ภายนอก)
// npm run app  →  http://127.0.0.1:4700
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {
  P, STAGES, validSlug, listSlugs, loadShots, deriveStages, setStage, loadStatus, saveStatus,
  loadFeedback, addFeedback, updateFeedback, voInfo, stillsInfo, coversInfo, docs, summary, splitByCue, speakChars, writeAtomic,
} from './lib/project.mjs';
import {BIN, listOutputs, probe} from './lib/media.mjs';
import {JOBS, startJob, cancelJob, listJobs, getJob, onJobEvent} from './lib/jobs.mjs';
import {qaReport, MANUAL} from './lib/qa.mjs';
import {imagesSpec, imagesLock} from '../scripts/lib/images.mjs';
import {listPresets, loadSettings, resolve as resolveSettings, budget, describe, settingsPath, supportedEras, DEFAULTS, LENGTH_CHOICES, SUB_MODES, settingsFingerprint} from '../scripts/lib/settings.mjs';
import {assemble as assemblePost} from '../scripts/lib/post.mjs';

const PORT = Number(process.env.HT_PORT || 4700);
const HOST = '127.0.0.1';
const WEB = P('app', 'web');
const MEDIA_ROOTS = ['out/', 'public/'];
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.webm': 'video/webm', '.ico': 'image/x-icon',
  '.srt': 'application/x-subrip; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8',
};

// ---------- SSE ----------
const clients = new Set();
const broadcast = (ev) => {
  const data = `data: ${JSON.stringify(ev)}\n\n`;
  for (const res of clients) res.write(data);
};
onJobEvent(broadcast);
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25000).unref();

// ---------- เฝ้าไฟล์: Claude แก้ไฟล์ → UI อัปเดตเอง ----------
let pending = new Set();
let timer = null;
const flush = () => {
  const paths = [...pending];
  pending = new Set();
  const slugs = new Set();
  for (const p of paths) {
    const m = p.match(/^(?:projects|public)\/([a-z0-9-]+)\//) ?? p.match(/^out\/(?:[^/]+\/)*([a-z0-9-]+?)(?:-master|-[A-Z](?:-mobile)?)?\.(?:mp4|jpg|png)$/);
    if (m) slugs.add(m[1]);
    const st = p.match(/^out\/stills\/([a-z0-9-]+)\//);
    if (st) slugs.add(st[1]);
  }
  broadcast({type: 'fs', paths: paths.slice(0, 50), slugs: [...slugs]});
};
const watchDir = (rel) => {
  if (!fs.existsSync(P(rel))) fs.mkdirSync(P(rel), {recursive: true});
  const cb = (_ev, f) => {
    if (!f) return;
    const p = `${rel}/${String(f).replace(/\\/g, '/')}`;
    if (/\.tmp$|\.ht-media-cache|\/\.cache\/|\.props-/.test(p)) return;
    pending.add(p);
    clearTimeout(timer);
    timer = setTimeout(flush, 350);
  };
  try {
    fs.watch(P(rel), {recursive: true}, cb);
  } catch {
    fs.watch(P(rel), cb); // ระบบที่ไม่รองรับ recursive
  }
};
['projects', 'public', 'out'].forEach(watchDir);

// ---------- helpers ----------
const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const fail = (res, code, msg) => send(res, code, {error: msg});
const readBody = (req) => new Promise((resolve, reject) => {
  let b = '';
  req.on('data', (d) => { b += d; if (b.length > 1e6) { reject(new Error('body ใหญ่เกิน')); req.destroy(); } });
  req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('JSON ไม่ถูกต้อง')); } });
});
const safeRel = (rel) => {
  const norm = path.posix.normalize(decodeURIComponent(rel)).replace(/^\/+/, '');
  if (norm.includes('..') || !MEDIA_ROOTS.some((r) => norm.startsWith(r))) return null;
  if (/(^|\/)\.env|\.cache\//.test(norm)) return null;
  return norm;
};
const serveFile = (req, res, abs, cacheable = false) => {
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return fail(res, 404, 'ไม่พบไฟล์');
  const st = fs.statSync(abs);
  const type = TYPES[path.extname(abs).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  const headers = {'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': cacheable ? 'max-age=3600' : 'no-cache', 'Last-Modified': st.mtime.toUTCString()};
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
    if (start >= st.size || start > end) { res.writeHead(416, {'Content-Range': `bytes */${st.size}`}); return res.end(); }
    res.writeHead(206, {...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1});
    return fs.createReadStream(abs, {start, end}).pipe(res);
  }
  res.writeHead(200, {...headers, 'Content-Length': st.size});
  fs.createReadStream(abs).pipe(res);
};

const settingsInfo = (slug) => {
  const s = loadSettings(slug);
  try {
    const r = resolveSettings(s);
    const b = budget(r);
    return {settings: s, resolved: r, budget: b, text: describe(r, b), error: null};
  } catch (e) {
    return {settings: s, resolved: null, budget: null, text: null, error: e.message};
  }
};
/** ผล audition ล่าสุดของ voice preset ที่โปรเจกต์ใช้ (out/audition/<preset>/results.json) */
const auditionInfo = (slug) => {
  const out = {};
  const base = P('out', 'audition');
  if (!fs.existsSync(base)) return out;
  for (const d of fs.readdirSync(base)) {
    const f = path.join(base, d, 'results.json');
    if (!fs.existsSync(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(f, 'utf8'));
      out[d] = {...j, voices: Object.fromEntries(Object.entries(j.voices ?? {}).map(([v, x]) => [v, {...x, path: `out/audition/${d}/${x.file}`, mtime: fs.existsSync(path.join(base, d, x.file)) ? fs.statSync(path.join(base, d, x.file)).mtimeMs : 0}]))};
    } catch {}
  }
  return out;
};
const cleanSettings = (b) => {
  const s = {
    format: String(b.format ?? DEFAULTS.format), style: String(b.style ?? DEFAULTS.style), voice: String(b.voice ?? DEFAULTS.voice),
    targetSec: Math.round(Number(b.targetSec ?? DEFAULTS.targetSec)),
  };
  if (b.subtitles && b.subtitles !== DEFAULTS.subtitles) s.subtitles = String(b.subtitles);
  if (b.overrides && typeof b.overrides === 'object') s.overrides = b.overrides;
  resolveSettings(s); // โยน error ถ้า preset ไม่มี / ความยาวผิด
  return s;
};

// ---------- รูปจาก AI (scripts/imagegen.py) ----------
const imagesInfo = (slug) => {
  const spec = imagesSpec(slug);
  if (!spec) return null;
  const lock = imagesLock(slug);
  const used = {};
  for (const s of loadShots(slug)?.scenes ?? []) for (const sh of s.shots) for (const l of sh.layers ?? []) if (l.asset.startsWith('img:')) (used[l.asset.slice(4).split('|')[0]] ??= []).push(sh.id);
  return {
    cost: lock.cost ?? 0,
    items: (spec.images ?? []).map((x) => ({
      id: x.id, kind: x.kind ?? 'cutout', aspect: x.aspect ?? null, prompt: x.prompt, refs: x.refs ?? [], usedIn: used[x.id] ?? [],
      candidates: (lock.candidates?.[x.id] ?? []).filter((c) => fs.existsSync(P(c.file))).map((c) => ({k: c.k, file: c.file, cost: c.cost, model: c.model, mtime: fs.statSync(P(c.file)).mtimeMs})),
      selected: lock.selected?.[x.id]?.k ?? null,
    })),
  };
};

const projectDetail = (slug) => {
  const shots = loadShots(slug);
  const status = loadStatus(slug);
  const scenes = (shots?.scenes ?? []).map((s) => {
    const parts = splitByCue(s.vo ?? '', s.shots[0]?.id);
    return {
      id: s.id, beat: s.beat, era: s.era, vo: s.vo, chars: speakChars(s.vo ?? ''),
      shots: s.shots.map((sh) => ({
        id: sh.id, kind: sh.kind, description: sh.description,
        vo: parts.find((p) => p.id === sh.id)?.text ?? '',
        layers: (sh.layers ?? []).map((l) => l.asset),
        text: (sh.text ?? []).map((t) => t.content),
        data: sh.data?.chart ?? null,
      })),
    };
  });
  return {
    slug, meta: shots?.meta ?? null, hasShots: !!shots,
    stages: deriveStages(slug), status: {cover: status.cover, qa: status.qa},
    docs: docs(slug), scenes, sources: shots?.sources ?? {},
    vo: voInfo(slug, shots), stills: stillsInfo(slug, shots), covers: coversInfo(slug, shots),
    feedback: loadFeedback(slug).map(({history, ...f}) => f),
    manualQa: MANUAL,
    settings: settingsInfo(slug),
    audition: auditionInfo(slug),
    images: imagesInfo(slug),
    post: postInfo(slug),
    eraSamples: fs.existsSync(P('out', 'eras')) ? fs.readdirSync(P('out', 'eras')).filter((x) => x.endsWith('.png')).map((x) => ({era: x.replace(/\.png$/, ''), path: `out/eras/${x}`, mtime: fs.statSync(P('out', 'eras', x)).mtimeMs})) : [],
  };
};

const postInfo = (slug) => { try { return assemblePost(slug); } catch (e) { return {exists: false, error: String(e.message ?? e)}; } };

// ---------- routes ----------
const routes = [];
const route = (method, re, fn) => routes.push({method, re, fn});

route('GET', /^\/api\/health$/, () => ({ok: true, root: P(), ffprobe: !!BIN.ffprobe, ffmpeg: !!BIN.ffmpeg, remotion: fs.existsSync(P('node_modules', '.bin', 'remotion')), openrouterKey: /OPENROUTER_API_KEY=\S+/.test(fs.existsSync(P('.env')) ? fs.readFileSync(P('.env'), 'utf8') : ''), jobs: Object.fromEntries(Object.entries(JOBS).map(([k, v]) => [k, v.label]))}));
route('GET', /^\/api\/projects$/, () => listSlugs().map(summary));
route('GET', /^\/api\/presets$/, () => ({...listPresets(), defaults: DEFAULTS, lengths: LENGTH_CHOICES, subModes: SUB_MODES, supportedEras: supportedEras()}));
route('POST', /^\/api\/budget$/, async (req) => {
  const s = cleanSettings(await readBody(req));
  const r = resolveSettings(s);
  const b = budget(r);
  return {settings: s, budget: b, text: describe(r, b)};
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/settings$/, async (req, m) => {
  const b = await readBody(req);
  const next = cleanSettings(b);
  const before = deriveStages(m[1]).filter((x) => x.state === 'stale').map((x) => x.key);
  writeAtomic(settingsPath(m[1]), JSON.stringify(next, null, 2) + '\n');
  const after = deriveStages(m[1]);
  return {ok: true, newlyStale: after.filter((x) => x.state === 'stale' && !before.includes(x.key)).map((x) => x.key)};
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/settings\/preview$/, async (req, m) => {
  // ถ้าบันทึกค่านี้ stage ไหนจะล้าสมัย (ไม่เขียนไฟล์)
  const next = cleanSettings(await readBody(req));
  const cur = loadSettings(m[1]);
  const st = deriveStages(m[1]);
  const affected = st.filter((x) => x.state === 'approved' && settingsFingerprint(cur, x.key) !== settingsFingerprint(next, x.key)).map((x) => x.key);
  const r = resolveSettings(next);
  const bb = budget(r);
  return {affected, budget: bb, text: describe(r, bb)};
});
route('POST', /^\/api\/projects$/, async (req) => {
  const b = await readBody(req);
  const slug = String(b.slug ?? '').trim();
  if (!validSlug(slug)) throw Object.assign(new Error('slug ใช้ได้แค่ a-z 0-9 และ - (เช่น thai-tea)'), {code: 400});
  if (fs.existsSync(P('projects', slug))) throw Object.assign(new Error('มีโปรเจกต์ชื่อนี้แล้ว'), {code: 409});
  const f = (k) => String(b[k] ?? '').trim();
  if (!f('topic')) throw Object.assign(new Error('ต้องมีหัวข้อ'), {code: 400});
  // แตกคลิปสั้นจากโปรเจกต์ยาว: ใช้ facts.md + asset ร่วมกัน แต่บท/ช็อตเขียนใหม่ตาม format (docs/EXPANSION-DESIGN.md 1.4)
  const from = f('derivedFrom');
  if (from && (!validSlug(from) || !fs.existsSync(P('projects', from)))) throw Object.assign(new Error('ไม่พบโปรเจกต์ต้นทาง ' + from), {code: 400});
  const md = `# คำขอเริ่มโปรเจกต์ — ${f('topic')}\n\n> สร้างจาก HistoryTeller · Claude: ใช้ไฟล์นี้ทำ \`brief.md\` (stage 1) ตาม rules/00 แล้วตั้งสถานะ brief เป็น "review"\n\n- **หัวข้อ:** ${f('topic')}\n- **คำถามหลักที่คนดูจะได้คำตอบ:** ${f('question') || '[ให้ Claude เสนอ]'}\n- **กลุ่มคนดู:** ${f('audience') || '[ให้ Claude เสนอ]'}\n- **ประโยคที่อยากให้จำ:** ${f('takeaway') || '[ให้ Claude เสนอ]'}\n- **หมายเหตุ:** ${f('notes') || '-'}\n${from ? `- **แตกจากโปรเจกต์:** \`projects/${from}\` — facts.md คัดลอกมาแล้ว (Research = คัดเฉพาะที่ใช้ + ยืนยัน) · ใช้ asset/ตัวละครชุดเดียวกัน · **บทและช็อตเขียนใหม่** ให้เข้ากับความยาว/format นี้\n` : ''}`;
  const settings = cleanSettings(b.settings ?? {});
  const r = resolveSettings(settings);
  const bb = budget(r);
  writeAtomic(P('projects', slug, 'request.md'), md + `\n## Settings (projects/${slug}/settings.json)\n\n\`\`\`\n${describe(r, bb)}\n\`\`\`\n`);
  writeAtomic(settingsPath(slug), JSON.stringify(settings, null, 2) + '\n');
  if (from && fs.existsSync(P('projects', from, 'facts.md'))) {
    writeAtomic(P('projects', slug, 'facts.md'), `<!-- คัดลอกจาก projects/${from}/facts.md ตอนสร้างโปรเจกต์ — Ref เดิมใช้ต่อได้ -->\n` + fs.readFileSync(P('projects', from, 'facts.md'), 'utf8'));
  }
  saveStatus(slug, {stages: {brief: {state: 'todo', at: new Date().toISOString(), by: 'user'}}, qa: {manual: {}}, cover: {selected: null}});
  return {slug};
});
route('GET', /^\/api\/p\/([a-z0-9-]+)$/, (_req, m) => projectDetail(m[1]));
route('POST', /^\/api\/p\/([a-z0-9-]+)\/stage\/([a-z]+)$/, async (req, m) => {
  const b = await readBody(req);
  const action = b.action;
  const note = b.note ? String(b.note).slice(0, 2000) : undefined;
  if (action === 'approve') setStage(m[1], m[2], 'approved', note);
  else if (action === 'reopen') setStage(m[1], m[2], 'review', note);
  else if (action === 'request-changes') {
    if (!note) throw Object.assign(new Error('บอกหน่อยว่าอยากให้แก้อะไร'), {code: 400});
    setStage(m[1], m[2], 'draft', note);
    addFeedback(m[1], `stage:${m[2]}`, note);
  } else throw Object.assign(new Error('action ไม่ถูกต้อง'), {code: 400});
  return {ok: true, stages: deriveStages(m[1])};
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/feedback$/, async (req, m) => {
  const b = await readBody(req);
  const target = String(b.target ?? 'project');
  const text = String(b.text ?? '').trim();
  if (!/^(project|brief|research|beats|script|assets|stage:[a-z]+|post|post:[a-z]+|scene:S\d+|shot:S\d+-\d+|vo:S\d+|cover:[A-Z]|qa:[a-z]+)$/.test(target)) throw Object.assign(new Error('target ไม่ถูกต้อง'), {code: 400});
  if (!text) throw Object.assign(new Error('ข้อความว่าง'), {code: 400});
  return addFeedback(m[1], target, text.slice(0, 4000));
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/feedback\/([a-z0-9-]+)$/, async (req, m) => {
  const b = await readBody(req);
  return updateFeedback(m[1], m[2], b.status, b.note ? String(b.note).slice(0, 2000) : undefined);
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/cover$/, async (req, m) => {
  const b = await readBody(req);
  const ids = (loadShots(m[1])?.covers ?? []).map((c) => c.id);
  if (b.id !== null && !ids.includes(b.id)) throw Object.assign(new Error('ไม่พบปก ' + b.id), {code: 400});
  const s = loadStatus(m[1]);
  s.cover = {selected: b.id, at: new Date().toISOString()};
  if (b.id) s.stages.cover = {state: 'approved', at: new Date().toISOString(), by: 'user', note: `เลือกปก ${b.id}`};
  saveStatus(m[1], s);
  return {ok: true};
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/qa$/, async (req, m) => {
  const b = await readBody(req);
  if (!MANUAL[b.key]) throw Object.assign(new Error('ไม่รู้จักข้อ ' + b.key), {code: 400});
  const s = loadStatus(m[1]);
  s.qa.manual[b.key] = !!b.checked;
  saveStatus(m[1], s);
  return {ok: true};
});
route('GET', /^\/api\/p\/([a-z0-9-]+)\/qa$/, (_req, m) => qaReport(m[1]));
route('GET', /^\/api\/p\/([a-z0-9-]+)\/outputs$/, async (_req, m) => {
  const outs = listOutputs(m[1]);
  // วัดความดังไฟล์ใน out/ และไฟล์ master ทุกที่ (ไฟล์อื่นวัดแค่ความยาว/มีเสียง)
  return Promise.all(outs.map(async (o) => ({...o, ...(await probe(o.path, {loudness: o.dir === 'out' || o.master}))})));
});
route('POST', /^\/api\/p\/([a-z0-9-]+)\/images\/select$/, async (req, m) => {
  const b = await readBody(req);
  const slug = m[1];
  const lock = imagesLock(slug);
  const c = (lock.candidates?.[b.id] ?? []).find((x) => String(x.k) === String(b.k));
  if (!c || !validSlug(String(b.id))) throw Object.assign(new Error('ไม่พบรูปผู้สมัคร'), {code: 404});
  fs.mkdirSync(P('public', slug, 'img'), {recursive: true});
  fs.copyFileSync(P(c.file), P('public', slug, 'img', `${b.id}.png`));
  const kind = (imagesSpec(slug)?.images ?? []).find((x) => x.id === b.id)?.kind ?? 'cutout';
  lock.selected = {...(lock.selected ?? {}), [b.id]: {...c, kind, selectedAt: new Date().toISOString()}};
  writeAtomic(P('projects', slug, 'images.lock.json'), JSON.stringify(lock, null, 2) + '\n');
  return {ok: true};
});
route('GET', /^\/api\/p\/([a-z0-9-]+)\/subs$/, (_req, m) => {
  // ไฟล์ซับจาก scripts/subs.mjs: out/<slug>.<th|en>.<srt|vtt>
  const re = new RegExp(`^${m[1]}\\.(th|en)\\.(srt|vtt)$`);
  return fs.existsSync(P('out')) ? fs.readdirSync(P('out')).filter((f) => re.test(f)).sort()
    .map((f) => ({path: `out/${f}`, name: f, lang: f.split('.').at(-2), mtime: fs.statSync(P('out', f)).mtimeMs})) : [];
});
route('GET', /^\/api\/jobs$/, () => listJobs());
route('POST', /^\/api\/jobs$/, async (req) => {
  const b = await readBody(req);
  try { return startJob(b.slug, b.job, {scene: b.scene || undefined, preset: b.preset || undefined, image: b.image || undefined, force: !!b.force}); } catch (e) { throw Object.assign(e, {code: 409}); }
});
route('GET', /^\/api\/jobs\/(job-\d+)$/, (_req, m) => {
  const j = getJob(m[1]);
  if (!j) throw Object.assign(new Error('ไม่พบงาน'), {code: 404});
  const {proc, ...rest} = j;
  return rest;
});
route('POST', /^\/api\/jobs\/(job-\d+)\/cancel$/, (_req, m) => ({ok: cancelJob(m[1])}));

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  // กัน DNS rebinding / CSRF: รับเฉพาะ host ของเครื่องนี้ และ POST ต้องมาจากหน้า UI เอง
  const host = (req.headers.host ?? '').replace(/:\d+$/, '');
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(host)) return fail(res, 403, 'host ไม่อนุญาต');
  if (req.method === 'POST') {
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(origin)) return fail(res, 403, 'origin ไม่อนุญาต');
    if (!String(req.headers['content-type'] ?? '').includes('application/json')) return fail(res, 415, 'ต้องเป็น JSON');
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const p = url.pathname;
  try {
    if (p === '/api/events') {
      res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive'});
      res.write(`data: ${JSON.stringify({type: 'hello'})}\n\n`);
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (p.startsWith('/media/')) {
      const rel = safeRel(p.slice(7));
      if (!rel) return fail(res, 403, 'path ไม่อนุญาต');
      return serveFile(req, res, P(rel));
    }
    if (p.startsWith('/api/')) {
      const slugM = p.match(/^\/api\/p\/([^/]+)/);
      if (slugM && (!validSlug(slugM[1]) || !fs.existsSync(P('projects', slugM[1])))) return fail(res, 404, 'ไม่พบโปรเจกต์');
      for (const r of routes) {
        const m = r.method === req.method && p.match(r.re);
        if (m) return send(res, 200, await r.fn(req, m));
      }
      return fail(res, 404, 'ไม่พบ API');
    }
    // หน้าเว็บ
    const file = p === '/' ? 'index.html' : p.slice(1);
    const abs = path.join(WEB, path.posix.normalize(file));
    if (!abs.startsWith(WEB)) return fail(res, 403, 'ไม่อนุญาต');
    return serveFile(req, res, fs.existsSync(abs) ? abs : path.join(WEB, 'index.html'));
  } catch (e) {
    return fail(res, e.code && Number.isInteger(e.code) ? e.code : 500, e.message);
  }
});

// เปิดซ้ำ/พอร์ตชน: ถ้า HistoryTeller เปิดอยู่แล้วให้บอก URL เดิม · ถ้าเป็นโปรแกรมอื่นให้ลองพอร์ตถัดไป
const tryListen = (port, left) => {
  server.once('error', async (e) => {
    if (e.code !== 'EADDRINUSE') throw e;
    try {
      const r = await fetch(`http://${HOST}:${port}/api/health`, {signal: AbortSignal.timeout(1500)});
      const j = await r.json();
      if (j?.root) {
        console.log(`\n  HistoryTeller เปิดอยู่แล้ว →  http://${HOST}:${port}`);
        console.log(`  (มีอีกหน้าต่าง Terminal รัน npm run app อยู่ · จะปิดตัวเก่า: กด Ctrl+C ในหน้าต่างนั้น หรือ  lsof -ti :${port} | xargs kill)\n`);
        process.exit(0);
      }
    } catch {}
    if (left <= 0) {
      console.error(`\n  ✗ พอร์ต ${PORT}–${port} ถูกใช้หมด — ตั้งพอร์ตเอง: HT_PORT=4800 npm run app\n`);
      process.exit(1);
    }
    console.log(`  พอร์ต ${port} ถูกโปรแกรมอื่นใช้อยู่ — ลอง ${port + 1}`);
    tryListen(port + 1, left - 1);
  });
  server.listen(port, HOST);
};
server.once('listening', () => {
  const port = server.address().port;
  {
    console.log(`\n  HistoryTeller with Claude  →  http://${HOST}:${port}\n`);
    console.log(`  โฟลเดอร์: ${P()}`);
    console.log(`  ffprobe: ${BIN.ffprobe ? '✓' : '✗ (ติดตั้ง ffmpeg เพื่อดูความยาว/ความดังของวิดีโอ)'} · โปรเจกต์: ${listSlugs().join(', ') || '-'}\n`);
    console.log(`  ${STAGES.length} stages · กด Ctrl+C เพื่อปิด\n`);
  }
});
tryListen(PORT, 10);
