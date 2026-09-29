// สำเนา TypeScript ของ scripts/lib/subchunks.mjs — ⚠ แก้คู่กันเสมอ (ตรรกะเดียวกับไฟล์ .srt)
export type SubMode = 'th' | 'th+en' | 'en' | 'off';
export const SUB = {thMax: 38, enMax: 48, lines: 2};

export const thaiWords = (s: string): string[] => {
  const Seg = (Intl as any).Segmenter;
  if (!Seg) return s.split(/(\s+)/);
  return Array.from(new Seg('th', {granularity: 'word'}).segment(s), (x: any) => x.segment as string);
};
const wrap = (words: string[], max: number) => {
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + w).trim().length > max && cur.trim()) { lines.push(cur.trim()); cur = w.trimStart(); } else cur += w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
};
export const wrapThai = (s: string, max: number) => wrap(thaiWords(s), max);
export const wrapWords = (s: string, max: number) => wrap(s.split(/(\s+)/), max);
const clean = (s?: string) => String(s ?? '').replace(/\[#[^\]]+\]/g, '').replace(/\s+/g, ' ').trim();
const spread = (lines: string[], n: number) => Array.from({length: n}, (_, i) => lines.slice(Math.round((i * lines.length) / n), Math.round(((i + 1) * lines.length) / n)));

export type SubChunk = {th: string[]; en: string[]; from: number; to: number};
export const subChunks = (th: string, en: string | undefined, mode: SubMode = 'th', o = SUB): SubChunk[] => {
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
