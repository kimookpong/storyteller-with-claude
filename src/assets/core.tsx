import React from 'react';
import type {Pal} from './palette';

export type DrawArgs = {p: Pal; t: number; dur: number; props: Record<string, any>; uid: string};
export type AssetDef = {vb: [number, number]; draw: (a: DrawArgs) => React.ReactNode};

/** pseudo random แบบ deterministic */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** สีเงา: collage ใช้ลายเส้นแกะ (hatch) แทนสีทึบ */
export const shadeFill = (p: Pal, uid: string, color: string) => (p.style === 'collage' ? `url(#hatch-${uid})` : color);

export const Defs: React.FC<{p: Pal; uid: string}> = ({p, uid}) => (
  <defs>
    <pattern id={`hatch-${uid}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="9" height="9" fill={p.shade} />
      <line x1="0" y1="0" x2="0" y2="9" stroke={p.ink} strokeWidth="2.2" opacity="0.55" />
    </pattern>
    <pattern id={`dots-${uid}`} width="10" height="10" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2.2" fill={p.ink} opacity="0.35" />
    </pattern>
    <radialGradient id={`glow-${uid}`}>
      <stop offset="0" stopColor={p.glow} stopOpacity="0.9" />
      <stop offset="0.4" stopColor={p.glow} stopOpacity="0.35" />
      <stop offset="1" stopColor={p.glow} stopOpacity="0" />
    </radialGradient>
    {/* ขอบกระดาษขาว + เงาลอย สำหรับ collage cut-out */}
    <filter id={`cut-${uid}`} x="-10%" y="-10%" width="120%" height="120%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="7" result="rough" />
      <feFlood floodColor="#FBF6EC" />
      <feComposite in2="rough" operator="in" result="paper" />
      <feGaussianBlur in="rough" stdDeviation="6" result="sb" />
      <feOffset in="sb" dx="6" dy="10" result="so" />
      <feFlood floodColor="#000" floodOpacity="0.35" />
      <feComposite in2="so" operator="in" result="shadow" />
      <feMerge>
        <feMergeNode in="shadow" />
        <feMergeNode in="paper" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

/** เส้นหยัก ๆ แบบวาดมือ */
export const wobblePath = (pts: [number, number][], seed = 1, amp = 3) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x + (rnd(seed + i) - 0.5) * amp},${y + (rnd(seed + i * 7) - 0.5) * amp}`).join(' ');
