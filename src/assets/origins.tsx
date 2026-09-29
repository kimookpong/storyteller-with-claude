// asset ของเรื่อง "กำเนิดโลกและอาดัม" (projects/adam) — วาดเองทั้งหมด ใช้สีจาก palette (rule 10)
// ข้อห้าม: ไม่วาดใบหน้าบุคคลศักดิ์สิทธิ์ — คน = เงา/มือ/แสงเท่านั้น
import React from 'react';
import {AssetDef, rnd, shadeFill, wobblePath} from './core';
import {sk, Pal} from './palette';
import {C, FONT} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clay = (p: Pal) => (vec(p) ? {body: '#C9784A', shade: '#9C5532', light: '#E8A273'} : {body: p.coffeeLight, shade: p.coffee, light: p.mid});
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** ขอบแสงให้เงาดำอ่านออกบนพื้นมืด (vector เท่านั้น) */
const rim = (p: Pal) => (vec(p) ? {stroke: '#FFE6A6', strokeWidth: 5, strokeOpacity: 0.45, strokeLinejoin: 'round' as const} : {});

// ---------- Character anchor: ก้อนดิน ----------
export const clayBuddy: AssetDef = {
  vb: [300, 300],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const c = clay(p);
    const blink = t % 3.4 > 3.25;
    const sq = 1 + Math.sin(t * 2.2) * 0.012;
    const ey = 150;
    const look = expr === 'thinking' ? -6 : Math.sin(t * 0.5) * 2;
    return (
      <g transform={`translate(150,284) scale(${2 - sq},${sq}) translate(-150,-284)`}>
        <ellipse cx="150" cy="286" rx="118" ry="12" fill="#000" opacity="0.2" />
        <path d="M40,232 C18,150 62,58 150,54 C238,50 286,140 264,232 C252,272 204,284 150,284 C96,284 52,272 40,232 Z" fill={c.body} {...sk(p)} />
        <path d="M40,232 C18,150 62,58 150,54 C92,80 70,170 96,280 C66,272 48,262 40,232 Z" fill={shadeFill(p, uid, c.shade)} opacity="0.55" />
        <ellipse cx="200" cy="96" rx="30" ry="16" fill="#fff" opacity={vec(p) ? 0.18 : 0} transform="rotate(20 200 96)" />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M${190 + i * 14},${200 + (i % 2) * 22} q8,-6 16,0`} stroke={c.shade} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
        ))}
        {blink || expr === 'shy' ? (
          <g stroke={p.ink} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d={`M96,${ey} q16,10 32,0`} /><path d={`M172,${ey} q16,10 32,0`} />
          </g>
        ) : (
          <g>
            <ellipse cx="112" cy={ey} rx="18" ry={expr === 'wow' ? 25 : 21} fill="#fff" {...sk(p, 0.6)} />
            <ellipse cx="188" cy={ey} rx="18" ry={expr === 'wow' ? 25 : 21} fill="#fff" {...sk(p, 0.6)} />
            <circle cx={115 + look} cy={ey + 3 - (expr === 'thinking' ? 8 : 0)} r="9.5" fill={p.ink} />
            <circle cx={191 + look} cy={ey + 3 - (expr === 'thinking' ? 8 : 0)} r="9.5" fill={p.ink} />
            <circle cx={118 + look} cy={ey - 2} r="3" fill="#fff" />
            <circle cx={194 + look} cy={ey - 2} r="3" fill="#fff" />
          </g>
        )}
        {expr === 'confused' && <path d="M92,118 L130,126 M208,114 L172,124" stroke={p.ink} strokeWidth="6" strokeLinecap="round" />}
        {expr === 'wow' ? <ellipse cx="150" cy="212" rx="15" ry="19" fill={p.ink} />
          : expr === 'confused' ? <path d="M126,214 q12,-8 24,0 q12,8 24,0" stroke={p.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
          : expr === 'thinking' ? <path d="M134,214 h32" stroke={p.ink} strokeWidth="6" strokeLinecap="round" />
          : <path d="M124,200 Q150,232 176,200" stroke={p.ink} strokeWidth="7" fill={vec(p) ? '#5A2A18' : 'none'} strokeLinecap="round" />}
        <ellipse cx="86" cy="192" rx="15" ry="9" fill={p.red} opacity={expr === 'shy' ? 0.7 : 0.35} />
        <ellipse cx="214" cy="192" rx="15" ry="9" fill={p.red} opacity={expr === 'shy' ? 0.7 : 0.35} />
        {expr === 'thinking' && <circle cx="250" cy="70" r="10" fill={p.base} opacity={0.5 + 0.5 * Math.sin(t * 3)} />}
      </g>
    );
  },
};

// ---------- โลก ----------
const LANDS = ['M60,70 q40,-30 90,-10 q30,30 -10,60 q-50,20 -80,-10 z', 'M200,40 q60,-10 90,30 q10,50 -40,70 q-40,-10 -50,-100 z',
  'M130,160 q40,-10 60,30 q-10,60 -50,70 q-30,-40 -10,-100 z', 'M300,150 q50,0 60,40 q-20,30 -60,10 z'];
export const earthGlobe: AssetDef = {
  vb: [600, 600],
  draw: ({p, t, uid}) => {
    const off = (t * 18) % 400;
    return (
      <g>
        <circle cx="300" cy="300" r="290" fill={`url(#glow-${uid})`} opacity={vec(p) ? 0.5 : 0} />
        <clipPath id={`gl-${uid}`}><circle cx="300" cy="300" r="250" /></clipPath>
        <circle cx="300" cy="300" r="250" fill={p.sea} {...sk(p)} />
        <g clipPath={`url(#gl-${uid})`}>
          {[-400, 0, 400].map((dx) => (
            <g key={dx} transform={`translate(${60 + dx - off},120) scale(1.3)`}>
              {LANDS.map((d, i) => <path key={i} d={d} fill={p.green} {...sk(p, 0.7)} />)}
            </g>
          ))}
          <path d="M50,300 A250,250 0 0,0 550,300 A250,250 0 0,1 300,550 A250,250 0 0,1 50,300" fill={shadeFill(p, uid, p.seaDark)} opacity="0.45" />
          <ellipse cx="220" cy="200" rx="120" ry="70" fill="#fff" opacity={vec(p) ? 0.12 : 0} />
        </g>
      </g>
    );
  },
};

export const moltenEarth: AssetDef = {
  vb: [600, 600],
  draw: ({p, t, uid}) => {
    const hot = vec(p) ? '#FF7A3A' : '#C86A3A';
    const crust = vec(p) ? '#3A2620' : p.deep;
    return (
      <g>
        <circle cx="300" cy="300" r="295" fill={`url(#glow-${uid})`} opacity={0.6 + 0.2 * Math.sin(t * 2)} />
        <circle cx="300" cy="300" r="250" fill={hot} {...sk(p)} />
        {Array.from({length: 9}).map((_, i) => (
          <path key={i} d={wobblePath([[120 + rnd(i) * 360, 120 + rnd(i + 3) * 360], [160 + rnd(i + 1) * 300, 150 + rnd(i + 5) * 300], [200 + rnd(i + 2) * 200, 200 + rnd(i + 8) * 250]], i, 30) + 'Z'}
            fill={crust} opacity="0.85" />
        ))}
        <circle cx="300" cy="300" r="250" fill="none" stroke="#FFD27A" strokeWidth="10" opacity={0.4 + 0.3 * Math.sin(t * 3)} />
        <path d="M50,300 A250,250 0 0,0 550,300 A250,250 0 0,1 300,550 A250,250 0 0,1 50,300" fill={shadeFill(p, uid, '#7A2E14')} opacity="0.4" />
      </g>
    );
  },
};

export const soilGround: AssetDef = {
  vb: [2400, 500],
  draw: ({p, uid}) => {
    const c = clay(p);
    return (
      <g>
        <path d="M0,120 C400,40 800,90 1200,60 C1600,30 2000,100 2400,70 L2400,500 L0,500 Z" fill={c.shade} {...sk(p)} />
        <path d="M0,200 C500,150 900,210 1400,170 C1800,140 2100,200 2400,180 L2400,500 L0,500 Z" fill={shadeFill(p, uid, vec(p) ? '#6E3B22' : p.deep)} opacity="0.8" />
        {Array.from({length: 40}).map((_, i) => (
          <ellipse key={i} cx={rnd(i) * 2400} cy={140 + rnd(i + 9) * 330} rx={8 + rnd(i + 2) * 22} ry={6 + rnd(i + 4) * 12} fill={c.light} opacity="0.5" />
        ))}
      </g>
    );
  },
};

// ---------- หิน / แร่ / นาฬิกาในหิน ----------
const rockPath = 'M40,210 L70,90 L180,40 L320,60 L400,150 L380,260 L250,300 L100,290 Z';
export const oldRock: AssetDef = {
  vb: [440, 330],
  draw: ({p, uid}) => (
    <g>
      <path d={rockPath} fill={vec(p) ? '#8A8F9C' : p.mid} {...sk(p)} />
      <path d="M40,210 L70,90 L180,40 L150,170 L250,300 L100,290 Z" fill={shadeFill(p, uid, vec(p) ? '#5E6472' : p.shade)} opacity="0.6" />
      <path d="M180,40 L150,170 L400,150" stroke={p.ink} strokeWidth="4" fill="none" opacity="0.3" />
    </g>
  ),
};

export const meteorite: AssetDef = {
  vb: [440, 330],
  draw: ({p, uid}) => (
    <g>
      <path d="M60,170 C50,90 140,40 230,50 C330,60 400,120 390,200 C380,270 290,300 200,290 C110,280 70,240 60,170 Z" fill={vec(p) ? '#4A4550' : p.deep} {...sk(p)} />
      {[[140, 120, 26], [250, 110, 18], [300, 200, 30], [170, 220, 20], [220, 170, 12]].map(([x, y, r], i) => (
        <g key={i}><circle cx={x} cy={y} r={r} fill={shadeFill(p, uid, '#2E2A33')} /><circle cx={x - r * 0.25} cy={y - r * 0.25} r={r * 0.5} fill="#fff" opacity="0.08" /></g>
      ))}
      <path d="M60,170 C70,90 140,50 200,50" stroke="#FFB070" strokeWidth="8" fill="none" opacity={vec(p) ? 0.5 : 0} strokeLinecap="round" />
    </g>
  ),
};

export const rockClock: AssetDef = {
  vb: [620, 440],
  draw: ({p, t, uid}) => {
    const open = clamp01((t - 0.2) / 0.6) * 40;
    const rock = vec(p) ? '#8A8F9C' : p.mid;
    return (
      <g>
        <g transform={`translate(${-open},0)`}>
          <path d="M60,260 L100,90 L240,40 L300,60 L300,400 L150,390 Z" fill={rock} {...sk(p)} />
          <path d="M60,260 L100,90 L200,120 L150,390 Z" fill={shadeFill(p, uid, vec(p) ? '#5E6472' : p.shade)} opacity="0.6" />
        </g>
        <g transform={`translate(${open},0)`}>
          <path d="M320,60 L420,50 L560,140 L570,300 L450,400 L320,400 Z" fill={rock} {...sk(p)} />
        </g>
        <g opacity={clamp01((t - 0.4) / 0.4)}>
          <circle cx="310" cy="230" r="120" fill={p.base} stroke={C.accent2} strokeWidth="12" />
          {Array.from({length: 12}).map((_, i) => <rect key={i} x="306" y="122" width="8" height="22" rx="3" fill={p.ink} transform={`rotate(${i * 30} 310 230)`} />)}
          <rect x="304" y="150" width="12" height="84" rx="6" fill={p.ink} transform={`rotate(${t * 90} 310 230)`} />
          <rect x="305" y="176" width="10" height="58" rx="5" fill={C.accent1} transform={`rotate(${t * 8} 310 230)`} />
          <circle cx="310" cy="230" r="10" fill={p.ink} />
        </g>
      </g>
    );
  },
};

export const balanceScale: AssetDef = {
  vb: [900, 420],
  draw: ({p, t}) => {
    const tilt = Math.sin(clamp01(t / 1.6) * Math.PI * 3) * (1 - clamp01(t / 1.6)) * 6;
    const metal = vec(p) ? C.accent2 : p.gold;
    return (
      <g>
        <path d="M430,400 L470,400 L460,90 L440,90 Z" fill={metal} {...sk(p)} />
        <rect x="360" y="392" width="180" height="22" rx="10" fill={metal} {...sk(p)} />
        <g transform={`rotate(${tilt} 450 90)`}>
          <rect x="120" y="82" width="660" height="16" rx="8" fill={metal} {...sk(p)} />
          {[150, 750].map((x) => (
            <g key={x}>
              <path d={`M${x},98 L${x - 90},250 M${x},98 L${x + 90},250`} stroke={p.ink} strokeWidth="4" opacity="0.6" />
              <path d={`M${x - 120},250 L${x + 120},250 Q${x},310 ${x - 120},250 Z`} fill={metal} {...sk(p)} />
            </g>
          ))}
        </g>
        <circle cx="450" cy="90" r="18" fill={p.ink} />
      </g>
    );
  },
};

export const fingerSilhouette: AssetDef = {
  vb: [700, 500],
  draw: ({p}) => (
    <g>
      <path d="M0,500 L0,300 C120,260 300,230 480,200 C560,186 640,200 650,240 C660,280 610,300 540,306 C420,320 260,380 160,500 Z" fill={vec(p) ? '#1A2438' : p.ink} opacity="0.95" {...rim(p)} />
      <path d="M560,212 C600,208 630,220 636,244" stroke="#fff" strokeWidth="6" fill="none" opacity="0.12" strokeLinecap="round" />
    </g>
  ),
};

export const zirconGrain: AssetDef = {
  vb: [200, 200],
  draw: ({p, t, uid}) => (
    <g>
      <circle cx="100" cy="100" r="96" fill={`url(#glow-${uid})`} opacity={vec(p) ? 0.4 + 0.2 * Math.sin(t * 3) : 0} />
      <path d="M100,20 L150,70 L140,160 L100,185 L60,160 L50,70 Z" fill={vec(p) ? '#E88A5A' : p.coffeeLight} {...sk(p)} />
      <path d="M100,20 L100,185 L60,160 L50,70 Z" fill={shadeFill(p, uid, vec(p) ? '#B4583A' : p.coffee)} opacity="0.6" />
      <path d="M70,70 L100,40" stroke="#fff" strokeWidth="6" opacity="0.5" strokeLinecap="round" />
    </g>
  ),
};

// ---------- อะตอม / ดาว ----------
const atomDef = (label: string, col: string): AssetDef => ({
  vb: [300, 300],
  draw: ({p, t}) => (
    <g>
      {[0, 60, 120].map((r) => <ellipse key={r} cx="150" cy="150" rx="130" ry="46" fill="none" stroke={vec(p) ? '#9FB4D8' : p.ink} strokeWidth="5" opacity="0.6" transform={`rotate(${r + t * 20} 150 150)`} />)}
      {[0, 1, 2].map((i) => {
        const a = t * 2.4 + i * 2.1;
        const rr = (i * 60 + t * 20) * Math.PI / 180;
        const x = 130 * Math.cos(a), y = 46 * Math.sin(a);
        return <circle key={i} cx={150 + x * Math.cos(rr) - y * Math.sin(rr)} cy={150 + x * Math.sin(rr) + y * Math.cos(rr)} r="10" fill={vec(p) ? C.accent3 : p.ink} />;
      })}
      <circle cx="150" cy="150" r="58" fill={vec(p) ? col : p.base} {...sk(p)} />
      <text x="150" y="170" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="58" fill={vec(p) ? '#10213A' : p.ink}>{label}</text>
    </g>
  ),
});
export const atomC = atomDef('C', '#9AA3B5');
export const atomO = atomDef('O', '#6EC6FF');
export const atomCa = atomDef('Ca', '#F4F1EA');
export const atomFe = atomDef('Fe', '#E8845A');

export const starBurst: AssetDef = {
  vb: [700, 700],
  draw: ({p, t, uid}) => {
    const k = clamp01(t / 1.2);
    return (
      <g>
        <circle cx="350" cy="350" r={120 + 220 * k} fill={`url(#glow-${uid})`} opacity={1 - 0.4 * k} />
        {Array.from({length: 16}).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          const r0 = 90, r1 = 120 + 220 * k * (0.7 + rnd(i) * 0.5);
          return <path key={i} d={`M${350 + Math.cos(a) * r0},${350 + Math.sin(a) * r0} L${350 + Math.cos(a) * r1},${350 + Math.sin(a) * r1}`} stroke={vec(p) ? (i % 2 ? C.accent2 : C.accent1) : p.ink} strokeWidth="10" strokeLinecap="round" opacity={1 - k * 0.5} />;
        })}
        <circle cx="350" cy="350" r={90 - 30 * k} fill={vec(p) ? '#FFF3C4' : p.gold} {...sk(p)} />
        {Array.from({length: 10}).map((_, i) => {
          const a = rnd(i + 30) * Math.PI * 2, d = 140 + 180 * k * (0.5 + rnd(i) * 0.6);
          return <circle key={i} cx={350 + Math.cos(a) * d} cy={350 + Math.sin(a) * d} r={9} fill={vec(p) ? C.accent3 : p.ink} opacity={k} />;
        })}
      </g>
    );
  },
};

const boxDef = (kind: 'star' | 'bang'): AssetDef => ({
  vb: [420, 420],
  draw: ({p, t, uid}) => (
    <g>
      <rect x="10" y="10" width="400" height="400" rx="40" fill={vec(p) ? '#1C3350' : p.base} {...sk(p)} />
      {kind === 'star' ? (
        <g transform={`rotate(${t * 10} 210 210)`}>
          <circle cx="210" cy="210" r="150" fill={`url(#glow-${uid})`} />
          <path d="M210,90 L240,180 L330,210 L240,240 L210,330 L180,240 L90,210 L180,180 Z" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} />
        </g>
      ) : (
        <g>
          {Array.from({length: 24}).map((_, i) => {
            const a = (i / 24) * Math.PI * 2, d = 40 + ((t * 60 + i * 13) % 150);
            return <circle key={i} cx={210 + Math.cos(a) * d} cy={210 + Math.sin(a) * d} r="7" fill={vec(p) ? C.accent4 : p.ink} opacity={1 - d / 200} />;
          })}
          <circle cx="210" cy="210" r="34" fill={vec(p) ? '#fff' : p.gold} />
          <text x="210" y="222" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="34" fill="#10213A">H</text>
        </g>
      )}
    </g>
  ),
});
export const starBox = boxDef('star');
export const bigbangBox = boxDef('bang');

// ---------- ฟอสซิล / เมโสโปเตเมีย ----------
export const skullSketch: AssetDef = {
  vb: [460, 400],
  draw: ({p, uid}) => (
    <g>
      <path d="M70,210 C50,110 140,40 250,44 C360,48 420,120 410,200 C404,250 370,270 350,300 L330,350 L250,356 L230,320 L150,318 C100,300 80,260 70,210 Z" fill={p.base} {...sk(p)} />
      <path d="M70,210 C50,110 140,40 250,44 C170,70 120,150 150,318 C100,300 80,260 70,210 Z" fill={shadeFill(p, uid, p.mid)} opacity="0.6" />
      <ellipse cx="300" cy="200" rx="42" ry="34" fill={p.ink} opacity="0.85" />
      <path d="M340,250 L360,280 L336,284 Z" fill={p.ink} opacity="0.8" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={258 + i * 16} y="326" width="10" height="22" rx="3" fill={p.base} stroke={p.ink} strokeWidth="2" />)}
      <path d="M120,120 C160,100 200,96 230,110" stroke={p.ink} strokeWidth="3" fill="none" opacity="0.4" />
    </g>
  ),
};

const wedges = (x0: number, y0: number, rows: number, cols: number, seed: number, ink: string) =>
  Array.from({length: rows * cols}).map((_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    if (rnd(seed + i) < 0.18) return null;
    const x = x0 + c * 34 + rnd(seed + i * 3) * 6, y = y0 + r * 44;
    const rot = rnd(seed + i * 5) < 0.3 ? 90 : 0;
    return <path key={i} d={`M${x},${y} l18,6 l-18,6 z M${x + 18},${y + 6} l10,0`} fill={ink} stroke={ink} strokeWidth="2" opacity="0.75" transform={`rotate(${rot} ${x + 10} ${y + 6})`} />;
  });
export const cuneiformTablet: AssetDef = {
  vb: [480, 600],
  draw: ({p, uid}) => {
    const c = clay(p);
    return (
      <g>
        <path d="M40,60 C40,30 70,20 240,20 C410,20 440,30 440,60 L446,540 C446,570 420,580 240,580 C60,580 34,570 34,540 Z" fill={c.light} {...sk(p)} />
        <path d="M34,540 C34,570 60,580 240,580 C420,580 446,570 446,540 L446,500 C400,540 100,540 34,500 Z" fill={shadeFill(p, uid, c.shade)} opacity="0.5" />
        {wedges(70, 70, 11, 10, 3, vec(p) ? '#6B3620' : p.ink)}
        <path d="M60,300 L420,300" stroke={c.shade} strokeWidth="3" opacity="0.5" />
      </g>
    );
  },
};

export const handsShapingClay: AssetDef = {
  vb: [700, 500],
  draw: ({p, t, uid}) => {
    const c = clay(p);
    const sq = Math.sin(t * 2) * 6;
    const hand = vec(p) ? '#1A2438' : p.ink;
    return (
      <g>
        <ellipse cx="350" cy="420" rx="200" ry="22" fill="#000" opacity="0.2" />
        <path d={`M240,${420} C230,${300 - sq} 300,${230 + sq} 350,${230 + sq} C400,${230 + sq} 470,${300 - sq} 460,420 Z`} fill={c.body} {...sk(p)} />
        <path d={`M240,420 C230,${300 - sq} 300,${230 + sq} 350,${230 + sq} C300,260 280,340 300,420 Z`} fill={shadeFill(p, uid, c.shade)} opacity="0.5" />
        <path d={`M0,360 C80,320 160,300 ${230 + sq},300 C260,300 262,340 238,352 C180,380 120,420 60,500 L0,500 Z`} fill={hand} opacity="0.95" {...rim(p)} />
        <path d={`M700,360 C620,320 540,300 ${470 - sq},300 C440,300 438,340 462,352 C520,380 580,420 640,500 L700,500 Z`} fill={hand} opacity="0.95" {...rim(p)} />
      </g>
    );
  },
};

export const redDropSymbol: AssetDef = {
  vb: [120, 160],
  draw: ({p}) => <path d="M60,10 C80,50 110,80 110,110 C110,140 88,154 60,154 C32,154 10,140 10,110 C10,80 40,50 60,10 Z" fill={vec(p) ? '#D9463A' : p.red} {...sk(p)} />,
};

export const hoe: AssetDef = {
  vb: [300, 420],
  draw: ({p}) => (
    <g>
      <rect x="140" y="30" width="20" height="380" rx="10" fill={vec(p) ? '#A86B45' : p.coffeeLight} {...sk(p)} transform="rotate(-12 150 220)" />
      <path d="M60,40 L200,40 L210,90 L50,100 Z" fill={vec(p) ? '#8A8F9C' : p.mid} {...sk(p)} transform="rotate(-12 150 220)" />
    </g>
  ),
};

export const paperTimeline: AssetDef = {
  vb: [1500, 200],
  draw: ({p, t}) => {
    const k = clamp01(t / 1.2);
    return (
      <g>
        <path d={wobblePath([[20, 60], [1480, 50], [1486, 150], [14, 160]], 5, 8) + 'Z'} fill={p.base} {...sk(p)} />
        <path d={`M80,105 L${80 + 1340 * k},105`} stroke={p.ink} strokeWidth="8" strokeLinecap="round" />
        {k > 0.97 && <path d="M1400,80 L1440,105 L1400,130" stroke={p.ink} strokeWidth="8" fill="none" strokeLinecap="round" />}
        {[0.2, 0.75].map((x, i) => <circle key={i} cx={80 + 1340 * x} cy="105" r="14" fill={C.marker} opacity={k > x ? 1 : 0} />)}
      </g>
    );
  },
};

// ---------- คัมภีร์ / แสง / เงาร่าง (ไม่มีใบหน้า) ----------
export const scroll: AssetDef = {
  vb: [900, 560],
  draw: ({p, t, uid}) => {
    const w = 120 + 580 * clamp01((t - 0.1) / 0.9);
    const x0 = 450 - w / 2;
    return (
      <g>
        <rect x={x0} y="60" width={w} height="440" fill={vec(p) ? '#F1E3C2' : p.base} {...sk(p)} />
        <g opacity={clamp01((t - 0.6) / 0.5)}>
          {Array.from({length: 8}).map((_, i) => (
            <path key={i} d={wobblePath([[x0 + 50, 130 + i * 44], [x0 + w - 50 - (i % 3) * 30, 130 + i * 44]], i + 20, 4)} stroke={p.ink} strokeWidth="6" opacity="0.4" strokeDasharray="30 12" />
          ))}
        </g>
        {[x0, x0 + w].map((x, i) => (
          <g key={i}>
            <rect x={x - 30} y="40" width="60" height="480" rx="30" fill={shadeFill(p, uid, vec(p) ? '#C9A66B' : p.mid)} {...sk(p)} />
            <rect x={x - 12} y="16" width="24" height="528" rx="12" fill={vec(p) ? '#6B3E26' : p.coffee} />
          </g>
        ))}
      </g>
    );
  },
};

export const lightRays: AssetDef = {
  vb: [2400, 1200],
  draw: ({p, t}) => (
    <g>
      {Array.from({length: 9}).map((_, i) => {
        const x = 300 + i * 230, sway = Math.sin(t * 0.6 + i) * 30;
        return <path key={i} d={`M${x - 40 + sway},0 L${x + 60 + sway},0 L${x + 260},1200 L${x - 180},1200 Z`} fill={vec(p) ? '#FFE6A6' : p.glow} opacity={0.08 + 0.05 * Math.sin(t + i)} />;
      })}
    </g>
  ),
};

const figurePath = 'M250,70 C290,70 312,100 312,136 C312,172 290,200 250,200 C210,200 188,172 188,136 C188,100 210,70 250,70 Z M170,230 C200,214 300,214 330,230 C370,250 380,330 370,420 L340,430 L330,640 L270,640 L250,470 L230,640 L170,640 L160,430 L130,420 C120,330 130,250 170,230 Z';
const figureDef = (mode: 'dust' | 'breath'): AssetDef => ({
  vb: [500, 680],
  draw: ({p, t, uid}) => {
    const c = clay(p);
    const k = mode === 'dust' ? clamp01((t - 0.2) / 1.6) : 1;
    const glow = mode === 'breath' ? clamp01((t - 0.6) / 1.2) : 0;
    return (
      <g>
        {mode === 'breath' && <circle cx="250" cy="320" r="330" fill={`url(#glow-${uid})`} opacity={glow * 0.8} />}
        {Array.from({length: 70}).map((_, i) => {
          const tx = 170 + rnd(i) * 160, ty = 80 + rnd(i + 50) * 540;
          const sx = rnd(i + 7) * 500, sy = 600 + rnd(i + 9) * 80;
          return <circle key={i} cx={sx + (tx - sx) * k} cy={sy + (ty - sy) * k} r={4 + rnd(i + 3) * 5} fill={c.light} opacity={(1 - k) * 0.8 + 0.1} />;
        })}
        <path d={figurePath} fillRule="nonzero" fill={mode === 'breath' ? (vec(p) ? '#E9B27F' : c.light) : c.shade} opacity={0.15 + 0.8 * k} {...sk(p)} />
        {mode === 'breath' && Array.from({length: 4}).map((_, i) => (
          <path key={i} d={`M${-40 - i * 30},${80 + i * 50} C60,${60 + i * 40} 150,${120 + i * 10} 220,140`} stroke={vec(p) ? '#FFF3C4' : p.gold} strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray="60 400" strokeDashoffset={-((t * 260 + i * 90) % 460)} opacity="0.8" />
        ))}
      </g>
    );
  },
});
export const dustFigureSilhouette = figureDef('dust');
export const breathLightFigure = figureDef('breath');

export const handSilhouette: AssetDef = {
  vb: [900, 420],
  draw: ({p}) => {
    const hand = vec(p) ? '#1A2438' : p.ink;
    return (
      <g opacity="0.95">
        <path d="M0,420 L0,260 C120,210 260,180 380,190 C420,194 430,230 400,250 C330,290 260,330 220,420 Z" fill={hand} {...rim(p)} />
        <path d="M900,420 L900,260 C780,210 640,180 520,190 C480,194 470,230 500,250 C570,290 640,330 680,420 Z" fill={hand} {...rim(p)} />
        <path d="M300,196 C340,190 380,190 396,206" stroke="#fff" strokeWidth="5" fill="none" opacity="0.1" />
      </g>
    );
  },
};

// ---------- ลวดลายเรขาคณิต (ไม่มีรูปบุคคล / ไม่มีตัวอักษรคัมภีร์จริง) ----------
const star8 = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.72 : r;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return 'M' + pts.join(' L') + ' Z';
};
export const geometricPatternVellum: AssetDef = {
  vb: [1000, 640],
  draw: ({p, uid}) => {
    const ink = vec(p) ? '#C9A66B' : p.ink;
    return (
      <g>
        <path d={wobblePath([[20, 24], [980, 18], [986, 620], [14, 626]], 11, 10) + 'Z'} fill={vec(p) ? '#EBDDBE' : p.base} {...sk(p)} />
        {Array.from({length: 5 * 3}).map((_, i) => {
          const cx = 140 + (i % 5) * 180, cy = 150 + Math.floor(i / 5) * 170;
          return (
            <g key={i}>
              <path d={star8(cx, cy, 70)} fill="none" stroke={ink} strokeWidth="5" />
              <path d={star8(cx, cy, 36)} fill={i % 2 ? (vec(p) ? '#2E6F8E' : p.sea) : (vec(p) ? '#A8442F' : p.red)} opacity="0.75" />
            </g>
          );
        })}
        <rect x="40" y="40" width="920" height="560" fill="none" stroke={ink} strokeWidth="8" />
        <rect x="20" y="20" width="960" height="600" fill={`url(#dots-${uid})`} opacity={p.style === 'collage' ? 0.2 : 0} />
      </g>
    );
  },
};

export const eightPointStar: AssetDef = {
  vb: [440, 440],
  draw: ({p, t, uid}) => (
    <g transform={`rotate(${t * 6} 220 220)`}>
      <circle cx="220" cy="220" r="210" fill={`url(#glow-${uid})`} opacity={vec(p) ? 0.45 : 0} />
      <path d={star8(220, 220, 190)} fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} />
      <path d={star8(220, 220, 120)} fill={vec(p) ? '#2E6F8E' : p.sea} {...sk(p)} />
      <circle cx="220" cy="220" r="46" fill={vec(p) ? '#F4F1EA' : p.base} />
    </g>
  ),
};

export const blankCalendar: AssetDef = {
  vb: [420, 440],
  draw: ({p, uid}) => (
    <g>
      <rect x="20" y="40" width="380" height="380" rx="30" fill={p.base} {...sk(p)} />
      <path d="M20,70 Q20,40 50,40 L370,40 Q400,40 400,70 L400,130 L20,130 Z" fill={vec(p) ? C.accent1 : p.red} {...sk(p)} />
      {[110, 310].map((x) => <rect key={x} x={x - 10} y="14" width="20" height="60" rx="10" fill={p.ink} />)}
      {Array.from({length: 12}).map((_, i) => <rect key={i} x={50 + (i % 4) * 82} y={160 + Math.floor(i / 4) * 80} width="60" height="56" rx="8" fill={shadeFill(p, uid, p.mid)} opacity="0.5" />)}
      <text x="210" y="112" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="56" fill="#fff">?</text>
    </g>
  ),
};

// ---------- คนเดินทาง (เงาเล็ก ไม่มีหน้า) ----------
const walker = (x: number, y: number, s: number, ph: number, col: string, key: number) => {
  const leg = Math.sin(ph) * 10;
  return (
    <g key={key} transform={`translate(${x},${y}) scale(${s})`} fill={col}>
      <circle cx="0" cy="-86" r="14" />
      <path d="M-14,-68 L14,-68 L18,-20 L-18,-20 Z" />
      <path d={`M-8,-22 L${-12 - leg},20 M8,-22 L${12 + leg},20`} stroke={col} strokeWidth="9" strokeLinecap="round" />
      <path d="M16,-60 L30,20" stroke={col} strokeWidth="4" />
    </g>
  );
};
export const walkingGroupSilhouette: AssetDef = {
  vb: [520, 240],
  draw: ({p, t}) => {
    const col = vec(p) ? '#1A2438' : p.ink;
    return <g>{Array.from({length: 7}).map((_, i) => walker(50 + i * 64 + t * 12, 200 - (i % 2) * 14, 0.9 + (i % 3) * 0.15, t * 5 + i, col, i))}</g>;
  },
};

// ---------- ต้นไม้สายพ่อ (F05) ----------
const patriDef = (one: boolean): AssetDef => ({
  vb: [1100, 560],
  draw: ({p, t}) => {
    const ink = vec(p) ? '#9FB4D8' : p.ink;
    const hi = vec(p) ? C.accent2 : p.red;
    const roots = [150, 330, 510, 690, 870, 1010];
    const keep = 2;
    const fade = one ? clamp01((t - 0.4) / 1.2) : 0;
    return (
      <g>
        {roots.map((x, i) => {
          const isKeep = i === keep;
          const op = isKeep ? 1 : 1 - fade * 0.85;
          const endY = isKeep ? 60 : 180 + rnd(i) * 180;
          return (
            <g key={i} opacity={op}>
              <path d={`M${x},500 C${x},400 ${x + (i % 2 ? 40 : -40)},${endY + 80} ${x},${endY}`} stroke={isKeep && one ? hi : ink} strokeWidth={isKeep && one ? 12 : 8} fill="none" strokeLinecap="round" />
              <circle cx={x} cy="500" r="26" fill={isKeep && one ? hi : ink} />
              {!isKeep && one && <path d={`M${x - 16},${endY - 16} l32,32 M${x + 16},${endY - 16} l-32,32`} stroke={C.marker} strokeWidth="7" opacity={fade} />}
            </g>
          );
        })}
        {one && <g opacity={fade}>{[0, 1, 2, 3].map((i) => <circle key={i} cx={330 + (i - 1.5) * 90} cy={40} r="16" fill={hi} />)}<path d="M330,60 L195,40 M330,60 L465,40" stroke={hi} strokeWidth="6" /></g>}
      </g>
    );
  },
});
export const patrilineTreeMany = patriDef(false);
export const patrilineTreeOne = patriDef(true);

// ---------- ไอคอนประกอบ ----------
export const ruler: AssetDef = {
  vb: [400, 120],
  draw: ({p}) => (
    <g transform="rotate(-10 200 60)">
      <rect x="10" y="20" width="380" height="80" rx="10" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} />
      {Array.from({length: 19}).map((_, i) => <rect key={i} x={28 + i * 19} y="20" width="4" height={i % 5 ? 20 : 38} fill={p.ink} />)}
    </g>
  ),
};

export const book: AssetDef = {
  vb: [400, 300],
  draw: ({p, uid}) => (
    <g>
      <path d="M200,60 C150,30 70,30 20,50 L20,270 C70,250 150,250 200,280 Z" fill={p.base} {...sk(p)} />
      <path d="M200,60 C250,30 330,30 380,50 L380,270 C330,250 250,250 200,280 Z" fill={p.base} {...sk(p)} />
      <path d="M200,60 L200,280" stroke={p.ink} strokeWidth="5" />
      {Array.from({length: 5}).map((_, i) => <path key={i} d={`M50,${90 + i * 30} C100,${80 + i * 30} 150,${84 + i * 30} 180,${96 + i * 30}`} stroke={p.ink} strokeWidth="4" opacity="0.35" fill="none" />)}
      <path d="M20,270 C70,250 150,250 200,280 C250,250 330,250 380,270 L380,286 L20,286 Z" fill={shadeFill(p, uid, vec(p) ? C.accent4 : p.shade)} />
    </g>
  ),
};

export const magnifier: AssetDef = {
  vb: [300, 300],
  draw: ({p}) => (
    <g>
      <path d="M180,180 L270,270" stroke={vec(p) ? '#6B3E26' : p.coffee} strokeWidth="30" strokeLinecap="round" />
      <circle cx="120" cy="120" r="90" fill={vec(p) ? '#9CD3F0' : p.sky2} opacity="0.6" stroke={vec(p) ? C.accent3 : p.ink} strokeWidth="18" />
      <path d="M70,90 Q90,60 120,56" stroke="#fff" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
    </g>
  ),
};

export const heartStar: AssetDef = {
  vb: [300, 280],
  draw: ({p, t}) => (
    <g transform={`translate(150,140) scale(${1 + Math.sin(t * 3) * 0.04}) translate(-150,-140)`}>
      <path d="M150,260 C60,190 20,140 20,90 C20,50 50,20 90,20 C120,20 140,40 150,60 C160,40 180,20 210,20 C250,20 280,50 280,90 C280,140 240,190 150,260 Z" fill={vec(p) ? C.accent4 : p.red} {...sk(p)} />
      <path d="M150,90 L162,122 L196,124 L170,144 L178,176 L150,158 L122,176 L130,144 L104,124 L138,122 Z" fill={vec(p) ? '#FFF3C4' : p.gold} />
    </g>
  ),
};

export const questionSplit: AssetDef = {
  vb: [520, 520],
  draw: ({t, uid}) => {
    const k = clamp01((t - 0.5) / 0.6) * 60;
    const Q = (col: string) => (
      <g>
        <path d="M170,170 C170,100 220,60 270,60 C330,60 370,100 370,160 C370,220 320,240 290,262 C270,278 266,296 266,330" stroke={col} strokeWidth="58" fill="none" strokeLinecap="round" />
        <circle cx="266" cy="430" r="36" fill={col} />
      </g>
    );
    return (
      <g>
        <clipPath id={`qs-l-${uid}`}><rect x="0" y="0" width="266" height="520" /></clipPath>
        <clipPath id={`qs-r-${uid}`}><rect x="266" y="0" width="254" height="520" /></clipPath>
        <g transform={`translate(${-k},0)`} clipPath={`url(#qs-l-${uid})`}>{Q(C.accent3)}</g>
        <g transform={`translate(${k},0)`} clipPath={`url(#qs-r-${uid})`}>{Q(C.accent4)}</g>
      </g>
    );
  },
};
