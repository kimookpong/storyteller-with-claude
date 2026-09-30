// asset ของเรื่อง "ตำนานหาดสระบัว" (projects/srabua) — วาดเองทั้งหมด ใช้สีจาก palette (rule 10)
// ปูลม (หาดทราย) · ปูก้ามดาบ (หาดเลน/ป่าชายเลน) — ออกแบบใหม่ ไม่อิงตัวละครใด
import React from 'react';
import {AssetDef, rnd, shadeFill} from './core';
import {sk, Pal} from './palette';
import {FONT} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const SAND = '#F1E3C2', SAND_D = '#D9C49A', MUD = '#7A5A3C', MUD_D = '#5C4128';

const Eyes: React.FC<{p: Pal; x: number; y: number; gap: number; expr: string; t: number; stalk?: number}> = ({p, x, y, gap, expr, t, stalk = 34}) => (
  <g>
    {[-1, 1].map((k) => {
      const cx = x + k * gap;
      return (
        <g key={k}>
          <path d={`M${cx},${y + stalk} L${cx},${y + 6}`} stroke={p.ink} strokeWidth="6" strokeLinecap="round" />
          <ellipse cx={cx} cy={y} rx="15" ry={expr === 'sad' ? 11 : 16} fill="#fff" {...sk(p, 0.6)} />
          <circle cx={cx + Math.sin(t * 0.8) * 2} cy={y + (expr === 'sad' ? 3 : 1)} r="7" fill={p.ink} />
          {expr === 'sad' && <path d={`M${cx - 15},${y - 8} L${cx + 15},${y - 12 * k}`} stroke={p.ink} strokeWidth="4" />}
        </g>
      );
    })}
  </g>
);

// ---------- ปูลม (ghost crab) — props.expr happy|confused|sad · pack (แบกเป้) · sink 0–1 (จมเลน) ----------
export const ghostCrab: AssetDef = {
  vb: [340, 300],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const body = vec(p) ? '#F3E6C8' : p.base, shade = vec(p) ? '#D9C49A' : p.shade;
    const sink = clamp01(props.sink ?? 0) * 60;
    const walk = props.pack ? Math.sin(t * 10) * 6 : Math.sin(t * 3) * 2;
    return (
      <g transform={`translate(0,${sink})`}>
        {!sink && <ellipse cx="170" cy="286" rx="110" ry="10" fill="#000" opacity="0.15" />}
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <path d={`M${120 - i * 10},${210 + i * 8} q-${40 + i * 6},${10 + walk} -${56 + i * 4},${56 - i * 4}`} stroke={shade} strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d={`M${220 + i * 10},${210 + i * 8} q${40 + i * 6},${10 - walk} ${56 + i * 4},${56 - i * 4}`} stroke={shade} strokeWidth="10" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <path d="M100,200 Q170,120 240,200 Q240,250 170,256 Q100,250 100,200 Z" fill={body} {...sk(p)} />
        <path d="M100,200 Q140,236 170,256 Q100,250 100,200 Z" fill={shadeFill(p, uid, shade)} opacity="0.6" />
        <path d="M112,196 q-38,-30 -58,-10 q10,26 44,24 Z M228,196 q38,-30 58,-10 q-10,26 -44,24 Z" fill={body} {...sk(p, 0.8)} />
        <Eyes p={p} x={170} y={128} gap={34} expr={expr} t={t} />
        {expr === 'confused' ? <path d="M156,222 q7,-6 14,0 q7,6 14,0" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          : expr === 'sad' ? <path d="M154,228 Q170,216 186,228" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          : <path d="M152,216 Q170,234 188,216" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />}
        {props.pack && (
          <g>
            <rect x="196" y="150" width="70" height="66" rx="16" fill={p.red} {...sk(p)} />
            <rect x="206" y="176" width="50" height="20" rx="6" fill="#000" opacity="0.15" />
            <path d="M206,160 Q180,180 196,206" stroke="#7A2A1A" strokeWidth="6" fill="none" />
          </g>
        )}
        {sink > 0 && <path d={`M40,${256 - sink + 30} q130,-26 260,0 L300,${300} L40,300 Z`} fill={vec(p) ? MUD : p.coffee} />}
      </g>
    );
  },
};

// ---------- ปูก้ามดาบ (fiddler crab) — ก้ามข้างเดียวใหญ่ · props.expr · wave ----------
export const fiddlerCrab: AssetDef = {
  vb: [360, 300],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const body = vec(p) ? '#3F6FB5' : p.mid, shade = vec(p) ? '#2B4F86' : p.shade, claw = vec(p) ? '#FF6B4A' : p.red;
    const wave = props.wave !== false ? Math.sin(t * 5) * 14 : 0;
    return (
      <g>
        <ellipse cx="170" cy="286" rx="110" ry="10" fill="#000" opacity="0.15" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <path d={`M${122 - i * 8},${214 + i * 10} q-40,12 -54,${52 - i * 6}`} stroke={shade} strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d={`M${218 + i * 8},${214 + i * 10} q40,12 54,${52 - i * 6}`} stroke={shade} strokeWidth="10" fill="none" strokeLinecap="round" />
          </g>
        ))}
        <path d="M104,210 Q170,138 236,210 Q236,254 170,260 Q104,254 104,210 Z" fill={body} {...sk(p)} />
        <path d="M104,210 Q140,244 170,260 Q104,254 104,210 Z" fill={shadeFill(p, uid, shade)} opacity="0.6" />
        <path d="M118,208 q-22,-14 -30,4 q12,12 30,4 Z" fill={claw} opacity="0.8" />
        <g transform={`rotate(${-wave} 232 200)`}>
          <path d="M232,200 L276,150" stroke={claw} strokeWidth="18" strokeLinecap="round" />
          <path d="M262,160 Q330,90 344,60 Q300,64 276,96 Q300,100 318,82 Q300,130 262,160 Z" fill={claw} {...sk(p)} />
        </g>
        <Eyes p={p} x={170} y={146} gap={30} expr={expr} t={t} stalk={30} />
        <path d={expr === 'sad' ? 'M156,236 Q170,226 184,236' : 'M154,228 Q170,244 186,228'} stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    );
  },
};

// ---------- โพลารอยด์ — props.scene beach|mud|split|forest · caption · wipe (เลนค่อย ๆ ทับ) · q (ใส่ ?) ----------
const Scene: React.FC<{p: Pal; kind: string; w: number; h: number; t: number; wipe: boolean; uid: string}> = ({p, kind, w, h, t, wipe, uid}) => {
  const k = wipe ? clamp01((t - 0.3) / 1.6) : kind === 'mud' ? 1 : 0;
  const sky = <rect width={w} height={h * 0.5} fill="#9FD3E8" />;
  const sea = <rect y={h * 0.42} width={w} height={h * 0.14} fill="#3FA7C4" />;
  const beach = (
    <g>
      <rect y={h * 0.54} width={w} height={h * 0.46} fill={SAND} />
      {[[0.22, '#FF6B4A'], [0.55, '#FFC94A'], [0.8, '#3FD6C6']].map(([x, c], i) => (
        <g key={i}><path d={`M${w * (x as number)},${h * 0.62} l0,${h * 0.22}`} stroke="#555" strokeWidth="3" /><path d={`M${w * (x as number) - 34},${h * 0.64} q34,-34 68,0 Z`} fill={c as string} /></g>
      ))}
      {[0.35, 0.68].map((x, i) => <circle key={i} cx={w * x} cy={h * 0.8} r="7" fill="#6B4B3A" />)}
    </g>
  );
  const forest = (
    <g>
      <rect y={h * 0.54} width={w} height={h * 0.46} fill={MUD} />
      {Array.from({length: 7}, (_, i) => <ellipse key={i} cx={w * (0.08 + i * 0.14)} cy={h * (0.5 + (i % 2) * 0.05)} rx={w * 0.1} ry={h * 0.13} fill={i % 2 ? '#2F7A4B' : '#3E9A5E'} />)}
    </g>
  );
  if (kind === 'forest') return <g>{sky}{sea}{forest}</g>;
  if (kind === 'split') return <g>{sky}{sea}{beach}<clipPath id={`spl-${uid}`}><rect x={w / 2} width={w / 2} height={h} /></clipPath><g clipPath={`url(#spl-${uid})`}>{forest}</g><path d={`M${w / 2},0 L${w / 2},${h}`} stroke="#fff" strokeWidth="4" strokeDasharray="10 8" /></g>;
  return (
    <g>{sky}{sea}{beach}
      {k > 0 && <path d={`M0,${h * (1 - 0.46 * k) - 10} q${w * 0.25},-18 ${w * 0.5},0 t${w * 0.5},0 L${w},${h} L0,${h} Z`} fill={MUD} opacity="0.95" />}
    </g>
  );
};
export const polaroid: AssetDef = {
  vb: [460, 540],
  draw: ({p, t, props, uid}) => {
    const kind = (props.scene as string) ?? 'beach';
    const aged = kind !== 'forest';
    return (
      <g>
        <rect x="8" y="12" width="444" height="520" rx="6" fill="#000" opacity="0.2" />
        <rect x="0" y="0" width="444" height="520" rx="6" fill="#FBF6EC" {...sk(p)} />
        <svg x="26" y="26" width="392" height="392" viewBox="0 0 392 392">
          <g style={{filter: aged ? 'sepia(0.35) saturate(0.8)' : undefined}}><Scene p={p} kind={kind} w={392} h={392} t={t} wipe={!!props.wipe} uid={uid} /></g>
        </svg>
        {props.caption && <text x="222" y="478" textAnchor="middle" fontFamily={FONT.hand} fontSize="40" fontWeight={700} fill="#2A3A5A">{props.caption as string}</text>}
        {props.q && <text x="392" y="100" textAnchor="middle" fontFamily={FONT.hand} fontSize="110" fontWeight={700} fill="#E8413C">?</text>}
      </g>
    );
  },
};

// ---------- ร่มชายหาด ----------
export const beachUmbrella: AssetDef = {
  vb: [300, 360],
  draw: ({p, t, props}) => {
    const c = (props.color as string) ?? (vec(p) ? '#FF6B4A' : p.red);
    return (
      <g transform={`rotate(${Math.sin(t * 1.5) * 2} 150 340)`}>
        <path d="M150,90 L150,350" stroke={vec(p) ? '#6B5A48' : p.deep} strokeWidth="8" />
        <path d="M10,110 Q150,-20 290,110 Z" fill={c} {...sk(p)} />
        {[0, 1, 2].map((i) => <path key={i} d={`M${57 + i * 93},110 Q${104 + i * 47 - 60 + i * 13},30 150,20`} stroke="#fff" strokeWidth="14" fill="none" opacity="0.7" />)}
      </g>
    );
  },
};

// ---------- พื้นหาด: ทราย → เลน (props.mud 0–1 · toMud = ค่อย ๆ เปลี่ยนตามเวลา) ----------
export const sandGround: AssetDef = {
  vb: [2400, 420],
  draw: ({p, t, props}) => {
    const m = props.toMud ? clamp01((t - 0.2) / 1.8) : clamp01(props.mud ?? 0);
    const mix = (a: string, b: string) => {
      const h = (s: string) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
      const [x, y] = [h(a), h(b)];
      return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * m)).join(',')})`;
    };
    return (
      <g>
        <path d="M0,60 Q600,20 1200,50 T2400,40 L2400,420 L0,420 Z" fill={vec(p) ? mix(SAND, MUD) : p.base} />
        <path d="M0,60 Q600,20 1200,50 T2400,40 L2400,90 Q1200,110 0,100 Z" fill={vec(p) ? mix(SAND_D, MUD_D) : p.shade} opacity="0.7" />
        {Array.from({length: 40}, (_, i) => <circle key={i} cx={rnd(i) * 2400} cy={130 + rnd(i + 9) * 260} r={3 + rnd(i + 3) * 5} fill={vec(p) ? mix(SAND_D, MUD_D) : p.shade} opacity="0.6" />)}
        {m > 0.5 && Array.from({length: 8}, (_, i) => <ellipse key={`w${i}`} cx={150 + i * 290} cy={200 + (i % 3) * 60} rx="60" ry="10" fill="#9FC3D0" opacity={(m - 0.5) * 0.8} />)}
      </g>
    );
  },
};

// ---------- ต้นโกงกาง (รากค้ำยัน) — props.grow (โตตามเวลา) ----------
export const mangroveTree: AssetDef = {
  vb: [420, 520],
  draw: ({p, t, props}) => {
    const g = props.grow ? clamp01((t - 0.1) / 2.2) : 1;
    const trunk = vec(p) ? '#6B4B32' : p.coffee;
    const leaf = vec(p) ? '#3E9A5E' : p.green, leaf2 = vec(p) ? '#2F7A4B' : p.greenDark;
    const s = 0.25 + 0.75 * g;
    return (
      <g transform={`translate(210 500) scale(${s}) translate(-210 -500)`}>
        {[-150, -95, -45, 45, 95, 150].map((dx, i) => <path key={i} d={`M210,300 Q${210 + dx * 0.5},${360} ${210 + dx},500`} stroke={trunk} strokeWidth="10" fill="none" strokeLinecap="round" opacity={clamp01(g * 1.6 - i * 0.12)} />)}
        <path d="M200,500 L204,230 L216,230 L220,500 Z" fill={trunk} {...sk(p)} />
        <ellipse cx="210" cy="190" rx={170 * clamp01(g * 1.3)} ry={120 * clamp01(g * 1.3)} fill={leaf2} />
        <ellipse cx="170" cy="160" rx={110 * clamp01(g * 1.3)} ry={90 * clamp01(g * 1.3)} fill={leaf} />
        <ellipse cx="260" cy="170" rx={100 * clamp01(g * 1.3)} ry={80 * clamp01(g * 1.3)} fill={leaf} opacity="0.9" />
      </g>
    );
  },
};

// ---------- เงาชาวบ้านปลูกกล้า (ไม่มีใบหน้า) ----------
export const planterSilhouette: AssetDef = {
  vb: [520, 360],
  draw: ({p, t}) => {
    const c = vec(p) ? '#1B2433' : p.ink;
    return (
      <g>
        {[0, 1, 2].map((i) => {
          const x = 90 + i * 170, bend = Math.sin(t * 2 + i) * 6;
          return (
            <g key={i}>
              <circle cx={x + 18 + bend} cy="120" r="24" fill={c} />
              <path d={`M${x},150 Q${x + 30 + bend},140 ${x + 40 + bend},200 L${x + 20},300 L${x - 6},300 Z`} fill={c} />
              <path d={`M${x + 30 + bend},170 L${x + 70},250`} stroke={c} strokeWidth="14" strokeLinecap="round" />
              <path d={`M${x + 70},250 l0,-50`} stroke={vec(p) ? '#3E9A5E' : p.green} strokeWidth="6" />
              <ellipse cx={x + 70} cy="196" rx="14" ry="8" fill={vec(p) ? '#3E9A5E' : p.green} />
            </g>
          );
        })}
      </g>
    );
  },
};

// ---------- กุ้ง/ปลาตัวเล็ก ว่ายผ่าน ----------
export const seaLife: AssetDef = {
  vb: [600, 300],
  draw: ({p, t}) => (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const x = ((t * (60 + i * 20) + i * 150) % 700) - 50, y = 60 + i * 55 + Math.sin(t * 3 + i) * 8;
        return i % 2 ? (
          <g key={i} transform={`translate(${x} ${y})`}><ellipse rx="34" ry="14" fill={vec(p) ? '#FFC94A' : p.gold} /><path d="M-34,0 l-20,-14 l0,28 Z" fill={vec(p) ? '#FFC94A' : p.gold} /><circle cx="18" cy="-3" r="3" fill={p.ink} /></g>
        ) : (
          <g key={i} transform={`translate(${x} ${y})`}><path d="M-30,0 Q0,-24 30,0 Q0,10 -30,0 Z" fill={vec(p) ? '#FF8FB1' : p.red} /><path d="M30,0 q20,-20 34,-10 M30,0 q22,-4 36,6" stroke={vec(p) ? '#FF8FB1' : p.red} strokeWidth="3" fill="none" /></g>
        );
      })}
    </g>
  ),
};

// ---------- ไอคอน: สนามฟุตบอล · บ้าน ----------
export const footballField: AssetDef = {
  vb: [120, 80],
  draw: ({p}) => (
    <g>
      <rect x="2" y="2" width="116" height="76" rx="6" fill={vec(p) ? '#3E9A5E' : p.green} />
      <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.9"><rect x="8" y="8" width="104" height="64" /><path d="M60,8 L60,72" /><circle cx="60" cy="40" r="11" /><rect x="8" y="26" width="14" height="28" /><rect x="98" y="26" width="14" height="28" /></g>
    </g>
  ),
};
export const villageHouse: AssetDef = {
  vb: [120, 110],
  draw: ({p, props}) => (
    <g>
      <path d="M10,52 L60,10 L110,52 Z" fill={(props.color as string) ?? (vec(p) ? '#FF6B4A' : p.red)} {...sk(p)} />
      <rect x="22" y="50" width="76" height="52" fill={vec(p) ? '#F3E6C8' : p.base} {...sk(p)} />
      <rect x="50" y="70" width="20" height="32" fill={vec(p) ? '#6B4B32' : p.coffee} />
      {[18, 38, 58, 78, 98].map((x) => <path key={x} d={`M${x},102 l0,8`} stroke={vec(p) ? '#6B4B32' : p.coffee} strokeWidth="5" />)}
    </g>
  ),
};
