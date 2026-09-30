// asset ของเรื่อง "ประเทศไทยเคยน้ำท่วมหนักแล้วกี่ครั้ง" (projects/thai-flood) — วาดเองทั้งหมด ใช้สีจาก palette (rule 10)
// metaphor: วงกบประตูที่ขีดปีน้ำท่วม (ขีดเรียงตามเวลา ไม่ใช่ความลึกน้ำ) · ตัวละคร: เรือกระดาษพับจากหนังสือพิมพ์ (ไม่มีใบหน้า)
import React from 'react';
import {AssetDef, rnd, shadeFill} from './core';
import {sk, Pal} from './palette';
import {FONT, C} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const WOOD = '#B07A4A', WOOD_D = '#7E5230', WOOD_L = '#D39B63';
const PAPERS: Record<string, [string, string]> = {old: ['#E8D6AE', '#6B4E2A'], mid: ['#DCD7CC', '#3A3A3A'], new: ['#F7F4EC', '#1C2A3A']};

// ---------- เรือกระดาษ — props.print old|mid|new (หน้าหนังสือพิมพ์ตามยุค) · props.head พาดหัวสั้น ๆ ----------
export const paperBoat: AssetDef = {
  vb: [440, 300],
  draw: ({p, t, props, uid}) => {
    const [paper, ink] = PAPERS[(props.print as string) ?? 'new'] ?? PAPERS.new;
    const base = vec(p) ? paper : p.base, line = vec(p) ? ink : p.ink;
    const tilt = Math.sin(t * 2.2) * 3;
    return (
      <g transform={`rotate(${tilt} 220 230)`}>
        <ellipse cx="220" cy="262" rx="190" ry="14" fill="#000" opacity="0.12" />
        {/* ใบเรือ (สามเหลี่ยมกลาง) */}
        <path d="M220,20 L320,170 L120,170 Z" fill={base} {...sk(p)} />
        <path d="M220,20 L220,170 L120,170 Z" fill={shadeFill(p, uid, vec(p) ? '#000' : p.shade)} opacity={vec(p) ? 0.08 : 0.5} />
        {/* ลำเรือ */}
        <path d="M30,150 L410,150 L350,250 L90,250 Z" fill={base} {...sk(p)} />
        <path d="M30,150 L90,250 L140,150 Z M410,150 L350,250 L300,150 Z" fill={vec(p) ? '#000' : p.shade} opacity={vec(p) ? 0.1 : 0.4} />
        {/* ตัวหนังสือพิมพ์ */}
        {props.head && <text x="220" y="140" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="30" fill={line} opacity="0.85">{props.head as string}</text>}
        {Array.from({length: 5}).map((_, i) => (
          <rect key={i} x={150 + (i % 2) * 6} y={60 + i * 16} width={140 - i * 22} height="6" fill={line} opacity="0.35" transform={`translate(${i * 11},0)`} />
        ))}
        {Array.from({length: 4}).map((_, i) => (
          <rect key={`h${i}`} x={110 + i * 6} y={172 + i * 18} width={220 - i * 18} height="7" fill={line} opacity="0.3" />
        ))}
      </g>
    );
  },
};

// ---------- วงกบประตู + ขีดปี — props.marks (เก่า→ใหม่ ล่าง→บน) · at/step (ขีดทีละอัน) · from (index แรกที่ animate)
// · hi (index ไฮไลต์) · pen (ขีดสุดท้ายกำลังวาด) · dark (โคนวงกบจมเงา) · empty (ที่ว่าง "?" เหนือขีดล่าสุด) · top/bottom (ช่วง y ของขีด)
export const doorFrame: AssetDef = {
  vb: [620, 1500],
  draw: ({p, t, props, uid}) => {
    const marks = (props.marks as string[]) ?? [];
    const n = marks.length;
    const top = (props.top as number) ?? 220, bottom = (props.bottom as number) ?? 1380;
    const gap = n > 1 ? Math.min(130, (bottom - top) / (n - 1 + (props.empty ? 1 : 0))) : 0;
    const from = (props.from as number) ?? n, at = (props.at as number) ?? 0.3, step = (props.step as number) ?? 0.22;
    const hi = props.hi as number | undefined;
    const wood = vec(p) ? WOOD : p.coffeeLight, woodD = vec(p) ? WOOD_D : p.coffee, wall = vec(p) ? '#EDE3CF' : p.base;
    const yOf = (i: number) => bottom - i * gap;
    const penK = props.pen ? clamp01((t - at) / 0.6) : 1;
    return (
      <g>
        <rect x="250" y="0" width="370" height="1500" fill={wall} />
        <rect x="0" y="0" width="200" height="1500" fill={vec(p) ? '#3B2A1E' : p.deep} />
        <rect x="170" y="0" width="100" height="1500" fill={wood} {...sk(p)} />
        <rect x="170" y="0" width="22" height="1500" fill={woodD} opacity="0.6" />
        <rect x="248" y="0" width="12" height="1500" fill={vec(p) ? WOOD_L : p.mid} opacity="0.7" />
        {Array.from({length: 9}).map((_, i) => (
          <path key={i} d={`M${196 + rnd(i) * 60},${i * 170} q${6 - rnd(i + 3) * 12},80 0,${150}`} stroke={woodD} strokeWidth="3" fill="none" opacity="0.35" />
        ))}
        {marks.map((m, i) => {
          const k = i < from ? 1 : clamp01((t - at - (i - from) * step) / 0.18);
          if (k <= 0) return null;
          const last = i === n - 1 && props.pen;
          const w = last ? 230 * penK : 230 * k;
          const col = i === hi ? (vec(p) ? C.accent1 : p.red) : vec(p) ? '#1C2A3A' : p.ink;
          const y = yOf(i);
          return (
            <g key={i} opacity={last ? 1 : k}>
              <path d={`M175,${y} L${175 + w},${y + (rnd(i) - 0.5) * 6}`} stroke={col} strokeWidth={i === hi ? 9 : 6} strokeLinecap="round" />
              <text x="420" y={y + 16} fontFamily={FONT.display} fontWeight={700} fontSize={(props.size as number) ?? 46} fill={col}
                opacity={last ? clamp01((t - at - 0.4) / 0.3) : 1}>{m}</text>
            </g>
          );
        })}
        {props.pen && (
          <g transform={`translate(${175 + 230 * penK},${yOf(n - 1) - 8}) rotate(35)`}>
            <rect x="-10" y="-150" width="22" height="140" rx="6" fill={vec(p) ? '#FF5A4A' : p.red} {...sk(p, 0.6)} />
            <path d="M-10,-10 L12,-10 L1,12 Z" fill={vec(p) ? '#1C2A3A' : p.ink} />
          </g>
        )}
        {props.empty && (
          <g opacity={0.5 + 0.3 * Math.sin(t * 3)}>
            <path d={`M175,${yOf(n)} L405,${yOf(n)}`} stroke={vec(p) ? '#1C2A3A' : p.ink} strokeWidth="5" strokeDasharray="14 12" />
            <text x="420" y={yOf(n) + 18} fontFamily={FONT.display} fontWeight={700} fontSize="58" fill={vec(p) ? C.accent1 : p.red}>?</text>
          </g>
        )}
        {props.dark && (
          <>
            <defs><linearGradient id={`df-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></linearGradient></defs>
            <rect x="0" y="700" width="620" height="800" fill={`url(#df-${uid})`} />
          </>
        )}
      </g>
    );
  },
};

// ---------- หลังคาทรงไทย (เงา ไม่ลงรายละเอียด) — props.color · props.tiers 2–3 ----------
export const thaiRoof: AssetDef = {
  vb: [900, 620],
  draw: ({p, props}) => {
    const col = (props.color as string) ?? (vec(p) ? '#2A2436' : p.deep);
    const tiers = (props.tiers as number) ?? 3;
    return (
      <g fill={col}>
        {Array.from({length: tiers}).map((_, i) => {
          const w = 760 - i * 150, x = 450 - w / 2, y = 380 - i * 110;
          return <path key={i} d={`M${x},${y + 90} L${450},${y - 40} L${x + w},${y + 90} L${x + w - 40},${y + 110} L${x + 40},${y + 110} Z`} />;
        })}
        <path d={`M440,${380 - (tiers - 1) * 110 - 40} q10,-70 30,-90 q-6,40 -14,90 Z`} />
        {[0, 1].map((k) => <path key={k} d={`M${k ? 860 : 40},470 q${k ? 30 : -30},-40 ${k ? 10 : -10},-80 q${k ? -6 : 6},30 ${k ? -30 : 30},60 Z`} />)}
        <rect x="120" y="490" width="660" height="130" />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={150 + i * 90} y="500" width="26" height="120" fill={vec(p) ? '#1A1624' : p.ink} opacity="0.5" />)}
      </g>
    );
  },
};

// ---------- เรือพาย + คนนั่ง (เงา ไม่มีใบหน้า) — props.people 1–4 · props.color ----------
export const rowboat: AssetDef = {
  vb: [760, 320],
  draw: ({p, t, props}) => {
    const n = Math.max(1, Math.min(4, (props.people as number) ?? 3));
    const hull = vec(p) ? '#5C3A22' : p.coffee, fig = (props.color as string) ?? (vec(p) ? '#1C1A28' : p.ink);
    const row = Math.sin(t * 3) * 18;
    return (
      <g>
        <path d="M20,200 Q380,250 740,190 L700,250 Q380,290 60,250 Z" fill={hull} {...sk(p)} />
        <path d="M40,212 Q380,258 720,204" stroke={vec(p) ? '#8A5A36' : p.coffeeLight} strokeWidth="8" fill="none" />
        {Array.from({length: n}).map((_, i) => {
          const x = 180 + i * (400 / Math.max(1, n - 1 || 1)) * (n > 1 ? 1 : 0) + (n === 1 ? 200 : 0);
          const paddler = i === n - 1;
          return (
            <g key={i} fill={fig}>
              <circle cx={x} cy={paddler ? 118 : 128} r="24" />
              <path d={`M${x - 34},215 Q${x - 38},${paddler ? 150 : 160} ${x},${paddler ? 145 : 155} Q${x + 38},${paddler ? 150 : 160} ${x + 34},215 Z`} />
              {!paddler && i === 0 && <path d={`M${x - 30},108 L${x},70 L${x + 30},108 Z`} opacity="0.9" />}
              {paddler && <path d={`M${x + 10},160 L${x + 120 + row},270`} stroke={fig} strokeWidth="9" strokeLinecap="round" />}
            </g>
          );
        })}
        {[0, 1, 2].map((i) => <path key={`r${i}`} d={`M${60 + i * 240 + ((t * 30) % 60)},290 q40,-12 80,0`} stroke={vec(p) ? '#CFE3F2' : p.mid} strokeWidth="5" fill="none" opacity="0.6" />)}
      </g>
    );
  },
};

// ---------- อนุสาวรีย์ประชาธิปไตย (ลดทอนรูปทรง) — ป้อมกลาง + ปีก 4 ด้าน ----------
export const democracyMonument: AssetDef = {
  vb: [1100, 900],
  draw: ({p, uid}) => {
    const stone = vec(p) ? '#E6DCC8' : p.base, sh = vec(p) ? '#B9AC93' : p.shade, ink = vec(p) ? '#2A2A30' : p.ink;
    const Wing = ({x, flip}: {x: number; flip?: boolean}) => (
      <g transform={flip ? `translate(${2 * x},0) scale(-1,1)` : undefined}>
        <path d={`M${x - 70},860 L${x - 40},260 Q${x - 10},200 ${x + 40},250 L${x + 70},860 Z`} fill={stone} {...sk(p)} />
        <path d={`M${x + 5},250 Q${x + 25},230 ${x + 40},250 L${x + 70},860 L${x + 20},860 Z`} fill={shadeFill(p, uid, sh)} opacity="0.8" />
      </g>
    );
    return (
      <g>
        <ellipse cx="550" cy="872" rx="520" ry="26" fill="#000" opacity="0.15" />
        <Wing x={190} /><Wing x={910} flip />
        <Wing x={350} /><Wing x={750} flip />
        <rect x="430" y="520" width="240" height="340" rx="10" fill={stone} {...sk(p)} />
        <rect x="600" y="520" width="70" height="340" fill={shadeFill(p, uid, sh)} opacity="0.8" />
        <rect x="470" y="600" width="160" height="200" rx="80" fill={ink} opacity="0.35" />
        <path d="M450,520 Q550,380 650,520 Z" fill={stone} {...sk(p)} />
        <rect x="505" y="400" width="90" height="36" rx="10" fill={vec(p) ? C.accent2 : p.gold} {...sk(p, 0.6)} />
        <path d="M520,400 Q550,330 580,400 Z" fill={vec(p) ? C.accent2 : p.gold} {...sk(p, 0.6)} />
      </g>
    );
  },
};

// ---------- เรือหางยาว (หันขวา) + คนขับเงา + ละอองน้ำ ----------
export const longtailBoat: AssetDef = {
  vb: [980, 360],
  draw: ({p, t}) => {
    const hull = vec(p) ? '#2F6FB0' : p.shade, trim = vec(p) ? '#F2C14E' : p.gold, fig = vec(p) ? '#1C1A28' : p.ink;
    return (
      <g>
        {Array.from({length: 7}).map((_, i) => (
          <circle key={i} cx={40 + i * 26 + rnd(i) * 20} cy={250 - i * 12 - Math.abs(Math.sin(t * 8 + i)) * 20} r={8 + rnd(i + 4) * 10} fill={vec(p) ? '#DDEFFA' : p.mid} opacity="0.7" />
        ))}
        <path d="M150,210 L20,300" stroke={vec(p) ? '#555' : p.ink} strokeWidth="10" strokeLinecap="round" />
        <rect x="140" y="170" width="70" height="50" rx="10" fill={vec(p) ? '#3A3A42' : p.deep} {...sk(p, 0.6)} />
        <path d="M200,200 L940,150 Q960,170 900,250 L260,280 Q210,280 200,240 Z" fill={hull} {...sk(p)} />
        <path d="M210,210 L930,160" stroke={trim} strokeWidth="10" />
        <path d="M860,160 Q930,120 960,110" stroke={trim} strokeWidth="8" fill="none" />
        <g fill={fig}><circle cx="250" cy="120" r="22" /><path d="M222,205 Q222,150 250,145 Q280,150 280,205 Z" /></g>
      </g>
    );
  },
};

// ---------- รถเมล์ยุคเก่า (ด้านข้าง) — props.num เลขสาย · props.flood 0–1 (ระดับน้ำ) · ไม่มีโลโก้หน่วยงานจริง ----------
export const cityBus: AssetDef = {
  vb: [1040, 480],
  draw: ({p, props}) => {
    const body = vec(p) ? '#E9DFC6' : p.base, band = vec(p) ? '#C8452E' : p.red, glass = vec(p) ? '#8FB6D6' : p.mid;
    const fl = clamp01((props.flood as number) ?? 0);
    return (
      <g>
        <rect x="20" y="60" width="1000" height="340" rx="40" fill={body} {...sk(p)} />
        <rect x="20" y="300" width="1000" height="50" fill={band} />
        {Array.from({length: 7}).map((_, i) => <rect key={i} x={70 + i * 125} y="110" width="100" height="120" rx="12" fill={glass} {...sk(p, 0.5)} />)}
        <rect x="920" y="100" width="80" height="200" rx="12" fill={glass} {...sk(p, 0.5)} />
        <rect x="880" y="70" width="120" height="44" rx="8" fill="#1C1A28" />
        <text x="940" y="104" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="36" fill="#FFD66B">{(props.num as string) ?? '58'}</text>
        {[200, 820].map((x) => <g key={x}><circle cx={x} cy="400" r="60" fill="#22222A" /><circle cx={x} cy="400" r="24" fill="#888" /></g>)}
        {fl > 0 && <rect x="0" y={480 - fl * 260} width="1040" height={fl * 260} fill={vec(p) ? '#6FA6C8' : p.sea} opacity="0.85" />}
      </g>
    );
  },
};

// ---------- ไฟจราจร (ไฟแดงสะท้อนน้ำได้) ----------
export const trafficLight: AssetDef = {
  vb: [200, 760],
  draw: ({p, t}) => (
    <g>
      <rect x="92" y="200" width="18" height="560" fill={vec(p) ? '#2C3444' : p.ink} />
      <rect x="50" y="20" width="100" height="250" rx="22" fill={vec(p) ? '#1C222E' : p.deep} {...sk(p)} />
      {['#FF5A4A', '#553', '#243'].map((c, i) => (
        <circle key={i} cx="100" cy={70 + i * 75} r="28" fill={c} opacity={i === 0 ? 0.8 + 0.2 * Math.sin(t * 4) : 1} />
      ))}
      <circle cx="100" cy="70" r="60" fill="#FF5A4A" opacity="0.18" />
    </g>
  ),
};

// ---------- ไอคอนหยดน้ำ (unit chart) — props.dim ----------
export const floodDrop: AssetDef = {
  vb: [120, 140],
  draw: ({p, props}) => (
    <g opacity={props.dim ? 0.25 : 1}>
      <path d="M60,8 Q100,70 100,92 A40,40 0 0 1 20,92 Q20,70 60,8 Z" fill={props.dim ? (vec(p) ? '#8C96A8' : p.mid) : (vec(p) ? '#4FB3F0' : p.sea)} {...sk(p, 0.6)} />
      {!props.dim && <path d="M42,88 q2,-14 12,-22" stroke="#fff" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.7" />}
    </g>
  ),
};
