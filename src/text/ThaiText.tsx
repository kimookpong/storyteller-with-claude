import React from 'react';
import {AbsoluteFill, spring, useVideoConfig} from 'remotion';
import type {TextItem} from '../types';
import {C, FONT, W, H} from '../theme/tokens';
import {subChunks, SubMode} from './subchunks';
import {useFormat} from '../format';

/** ตัดคำไทยด้วย Intl.Segmenter (rule 07) */
export const thaiWords = (s: string): string[] => {
  const Seg = (Intl as any).Segmenter;
  if (!Seg) return s.split(/(\s+)/);
  return Array.from(new Seg('th', {granularity: 'word'}).segment(s), (x: any) => x.segment as string);
};

/** แบ่งเป็นบรรทัดไม่เกิน max ตัวอักษร โดยไม่ตัดกลางคำ */
export const wrapThai = (s: string, max: number): string[] => {
  const lines: string[] = [];
  let cur = '';
  for (const w of thaiWords(s)) {
    if ((cur + w).trim().length > max && cur.trim()) {
      lines.push(cur.trim());
      cur = w.trimStart();
    } else cur += w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
};

const ROLE: Record<TextItem['role'], React.CSSProperties> = {
  title: {fontFamily: FONT.display, fontWeight: 700, fontSize: 104, color: C.white, textShadow: '0 6px 30px rgba(0,0,0,0.45)'},
  kicker: {fontFamily: FONT.display, fontWeight: 500, fontSize: 44, color: C.accent2, letterSpacing: 1, background: 'rgba(14,26,43,0.78)', padding: '6px 30px', borderRadius: 999},
  number: {fontFamily: FONT.display, fontWeight: 700, fontSize: 170, color: C.accent2, textShadow: '0 8px 40px rgba(0,0,0,0.4)'},
  label: {fontFamily: FONT.body, fontWeight: 600, fontSize: 46, color: C.white, background: 'rgba(14,26,43,0.72)', padding: '8px 28px', borderRadius: 999},
  note: {fontFamily: FONT.hand, fontWeight: 700, fontSize: 60, color: C.marker},
};

export const TextLayer: React.FC<{items?: TextItem[]; t: number; fps: number; vintage?: boolean}> = ({items, t, fps, vintage}) => {
  const {width: VW, height: VH} = useVideoConfig();
  if (!items?.length) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {items.map((it, i) => {
        const tl = t - (it.delay ?? 0.15);
        const s = tl < 0 ? 0 : spring({frame: tl * fps, fps, config: {damping: 14}});
        return (
          <div key={i}
            style={{
              position: 'absolute', left: it.x ?? VW / 2, top: it.y ?? VH / 2, lineHeight: 1.45, whiteSpace: 'nowrap',
              transform: `translate(-50%,-50%) translateY(${(1 - s) * 40}px) rotate(${it.rot ?? (it.role === 'note' ? -4 : 0)}deg)`,
              opacity: s, ...ROLE[it.role], ...(vintage && it.role === 'number' ? {color: C.marker, textShadow: '0 4px 0 rgba(242,232,213,0.9)'} : {}), ...(it.color ? {color: it.color} : {}), ...(it.size ? {fontSize: it.size} : {}),
            }}>
            {it.content}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const SourceLine: React.FC<{text?: string}> = ({text}) => {
  const f = useFormat();
  const caption = f.subtitle.mode === 'caption';
  // แนวตั้ง: ล่างจอเป็นพื้นที่ UI ของ TikTok → ย้ายที่มาไปมุมบนซ้าย (ใน safe zone)
  return text ? (
    <div style={{position: 'absolute', left: f.safe.left, ...(caption ? {top: f.safe.top} : {bottom: 40}), fontFamily: FONT.body, fontSize: 20, color: '#fff', opacity: 0.6, textShadow: '0 1px 4px #000'}}>ที่มา: {text}</div>
  ) : null;
};

/** subtitle (rule 07)
 *  box (แนวนอน): ไทย ≤2 บรรทัด + อังกฤษ ≤2 บรรทัด ในกล่องเดียว
 *  caption (แนวตั้ง/TikTok): ตัวใหญ่ 1 บรรทัด กลางจอค่อนล่าง ไฮไลต์คำที่กำลังพูด + อังกฤษบรรทัดเล็กใต้
 *  การแบ่งชุด/เวลาอยู่ใน subchunks.ts (ตรรกะเดียวกับไฟล์ .srt จาก scripts/subs.mjs) */
export const Subtitles: React.FC<{text: string; textEn?: string; mode?: SubMode; t: number; dur: number}> = ({text, textEn, mode = 'th', t, dur}) => {
  const f = useFormat();
  const sc = f.subtitle;
  const caption = sc.mode === 'caption';
  const chunks = subChunks(text, textEn, mode === 'off' ? 'th' : mode, {thMax: sc.maxLineChars, enMax: sc.enMaxLineChars ?? 48, lines: sc.maxLines});
  if (!chunks.length) return null;
  const k = dur > 0 ? t / dur : 0;
  const c = chunks.find((x) => k < x.to) ?? chunks[chunks.length - 1];
  const both = c.th.length > 0 && c.en.length > 0;
  if (caption) {
    // ไฮไลต์คำตามสัดส่วนเวลาในชุด (ไม่มี timestamp รายคำ — ประมาณจากความยาว)
    const lineWords = c.th.map((l) => thaiWords(l));
    const words = lineWords.flat();
    const local = (k - c.from) / Math.max(0.001, c.to - c.from);
    const total = words.reduce((a, w) => a + w.trim().length, 0) || 1;
    let acc = 0;
    const cur = words.findIndex((w) => { acc += w.trim().length; return acc / total > local; });
    const stroke = '0 0 2px #0E1A2B, 0 0 3px #0E1A2B, 0 4px 0 #0E1A2B, 0 8px 24px rgba(0,0,0,0.6)';
    return (
      <div style={{position: 'absolute', left: f.safe.left, right: f.safe.right, top: sc.y ?? 1300, transform: 'translateY(-50%)', textAlign: 'center'}}>
        {c.th.length > 0 && (
          <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: sc.fontSize, lineHeight: 1.35, color: '#fff', textShadow: stroke}}>
            {lineWords.map((lw, li) => {
              const base = lineWords.slice(0, li).reduce((n, x) => n + x.length, 0);
              return <div key={li}>{lw.map((w, i) => <span key={i} style={{color: base + i === cur ? C.accent2 : '#fff'}}>{w}</span>)}</div>;
            })}
          </div>
        )}
        {c.en.map((l, i) => (
          <div key={i} style={{fontFamily: FONT.body, fontWeight: 600, fontSize: both ? sc.enFontSize ?? 38 : Math.round(sc.fontSize * 0.8), lineHeight: 1.35, color: both ? '#DDE6F5' : '#fff', textShadow: stroke, marginTop: 6}}>{l}</div>
        ))}
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, right: 0, bottom: both ? (sc.bottom ?? 64) - 16 : sc.bottom ?? 64, display: 'flex', justifyContent: 'center'}}>
      <div style={{background: 'rgba(14,26,43,0.72)', borderRadius: 14, padding: '10px 30px', textAlign: 'center', maxWidth: 1500}}>
        {c.th.map((l, i) => <div key={'t' + i} style={{fontFamily: FONT.body, fontWeight: 500, fontSize: sc.fontSize, lineHeight: 1.5, color: '#fff'}}>{l}</div>)}
        {c.en.map((l, i) => (
          <div key={'e' + i} style={{fontFamily: FONT.body, fontWeight: 500, fontSize: both ? sc.enFontSize ?? 30 : sc.fontSize - 2, lineHeight: 1.4, color: both ? '#C9D6EE' : '#fff', marginTop: both && i === 0 ? 4 : 0}}>{l}</div>
        ))}
      </div>
    </div>
  );
};
