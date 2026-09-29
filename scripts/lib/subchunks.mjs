// แบ่งซับ 1 ช่วง cue เป็นชุด ๆ (ไทย/อังกฤษสลับพร้อมกัน) — ใช้ทั้ง scripts/subs.mjs (.srt) และ src/text/subchunks.ts (วิดีโอ)
// ⚠ ถ้าแก้ไฟล์นี้ ต้องแก้ src/text/subchunks.ts ให้ตรงกัน (Remotion import .mjs นอก src ไม่ได้สะดวก)
export const SUB = {thMax: 38, enMax: 48, lines: 2};

export const thaiWords = (s) => {
  const Seg = Intl.Segmenter;
  if (!Seg) return s.split(/(\s+)/);
  return Array.from(new Seg('th', {granularity: 'word'}).segment(s), (x) => x.segment);
};
const wrap = (words, max) => {
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + w).trim().length > max && cur.trim()) { lines.push(cur.trim()); cur = w.trimStart(); } else cur += w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
};
export const wrapThai = (s, max) => wrap(thaiWords(s), max);
export const wrapWords = (s, max) => wrap(s.split(/(\s+)/), max);
const clean = (s) => String(s ?? '').replace(/\[#[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
const spread = (lines, n) => Array.from({length: n}, (_, i) => lines.slice(Math.round((i * lines.length) / n), Math.round(((i + 1) * lines.length) / n)));

/** → [{th: string[], en: string[], from: 0..1, to: 0..1}] ตามสัดส่วนความยาว (ไทยเป็นหลัก) */
export const subChunks = (th, en, mode = 'th', o = SUB) => {
  const T = mode === 'en' ? [] : wrapThai(clean(th), o.thMax);
  const E = mode === 'th' ? [] : wrapWords(clean(en), o.enMax);
  const n = Math.max(1, Math.ceil(T.length / o.lines), Math.ceil(E.length / o.lines));
  if (!T.length && !E.length) return [];
  const tg = spread(T, n), eg = spread(E, n);
  const w = tg.map((g, i) => Math.max(1, (T.length ? g.join('') : eg[i].join('')).length));
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  return tg.map((g, i) => {
    const from = acc / total;
    acc += w[i];
    return {th: g, en: eg[i], from, to: acc / total};
  });
};
