import React from 'react';
import {AssetDef, rnd, shadeFill} from './core';
import {sk} from './palette';
import {C, FONT} from '../theme/tokens';

// ---------- ฉากหลัง ----------
export const sky: AssetDef = {
  vb: [1920, 1080],
  draw: ({p, t, props, uid}) => {
    const mode = (props.mode as string) ?? 'dawn';
    const vec = p.style === 'vector';
    const top = vec ? ({dawn: '#1B2A55', night: '#0B1530', day: '#3C7BC4', dusk: '#2A1E4A'} as any)[mode] : ({dawn: '#B98A6A', night: '#2F3A52', day: '#8FB0B4', dusk: '#B7715A'} as any)[mode];
    const bot = vec ? ({dawn: '#F59A6B', night: '#22385C', day: '#9CD3F0', dusk: '#E0705A'} as any)[mode] : ({dawn: '#EBCB9C', night: '#5E6A80', day: '#E6D8B6', dusk: '#E9B97E'} as any)[mode];
    return (
      <g>
        <linearGradient id={`sk-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
        <rect width="1920" height="1080" fill={`url(#sk-${uid})`} />
        {(mode === 'night' || mode === 'dusk') &&
          Array.from({length: 90}).map((_, i) => (
            <circle key={i} cx={rnd(i) * 1920} cy={rnd(i + 99) * 700} r={1 + rnd(i + 5) * 2.2} fill={vec || mode === 'night' ? '#FFF6DA' : p.ink}
              opacity={0.35 + 0.5 * Math.abs(Math.sin(t * (0.8 + rnd(i)) + i))} />
          ))}
      </g>
    );
  },
};

export const bgColor: AssetDef = {
  vb: [1920, 1080],
  draw: ({p, uid, props}) => (
    <g>
      <radialGradient id={`bg-${uid}`} cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stopColor={p.style === 'vector' ? (props.c1 ?? C.bgMid) : p.base} />
        <stop offset="1" stopColor={p.style === 'vector' ? (props.c2 ?? C.bgDeep) : p.mid} />
      </radialGradient>
      <rect width="1920" height="1080" fill={`url(#bg-${uid})`} />
    </g>
  ),
};

/** แผ่นกระดาษพื้นหลัง collage + เส้นบรรทัด/ตาราง */
export const paperBg: AssetDef = {
  vb: [1920, 1080],
  draw: ({p, props}) => {
    const tone = (props.tone as string) ?? p.base;
    return (
      <g>
        <rect width="1920" height="1080" fill={p.mid} />
        <path d={`M40,60 ${Array.from({length: 40}).map((_, i) => `L${40 + i * 46},${50 + rnd(i) * 22}`).join(' ')} L1880,1030 ${Array.from({length: 40}).map((_, i) => `L${1880 - i * 46},${1030 + rnd(i + 50) * 22}`).join(' ')} Z`} fill={tone} />
        {props.lines && Array.from({length: 22}).map((_, i) => <line key={i} x1="60" x2="1860" y1={110 + i * 44} y2={110 + i * 44} stroke={p.shade} strokeWidth="1.5" opacity="0.4" />)}
        {Array.from({length: 26}).map((_, i) => (
          <circle key={i} cx={rnd(i * 3) * 1920} cy={rnd(i * 5) * 1080} r={20 + rnd(i) * 70} fill={p.shade} opacity={0.05 + rnd(i + 2) * 0.06} />
        ))}
      </g>
    );
  },
};

export const sun: AssetDef = {
  vb: [600, 600],
  draw: ({p, t, uid}) => (
    <g>
      <circle cx="300" cy="300" r={290} fill={`url(#glow-${uid})`} opacity={0.8 + 0.1 * Math.sin(t * 2)} />
      <circle cx="300" cy="300" r="110" fill={p.style === 'vector' ? '#FFD37A' : p.gold} {...sk(p)} />
      <circle cx="300" cy="300" r="80" fill={p.style === 'vector' ? '#FFE9B0' : p.glow} opacity="0.7" />
    </g>
  ),
};

export const moon: AssetDef = {
  vb: [400, 400],
  draw: ({p, uid}) => (
    <g>
      <circle cx="200" cy="200" r="190" fill={`url(#glow-${uid})`} opacity="0.6" />
      <mask id={`mm-${uid}`}><rect width="400" height="400" fill="#fff" /><circle cx="236" cy="176" r="74" fill="#000" /></mask>
      <circle cx="200" cy="200" r="80" fill={p.style === 'vector' ? '#F6EFD8' : p.glow} mask={`url(#mm-${uid})`} />
    </g>
  ),
};

export const city: AssetDef = {
  vb: [2400, 700],
  draw: ({p, t, props}) => {
    const far = props.far as boolean;
    const col = far ? p.shade : p.deep;
    return (
      <g>
        {Array.from({length: 26}).map((_, i) => {
          const w = 70 + rnd(i + (far ? 40 : 0)) * 90;
          const h = (far ? 220 : 300) + rnd(i * 3 + (far ? 11 : 0)) * (far ? 260 : 360);
          const x = i * 94 - 20;
          return (
            <g key={i}>
              <rect x={x} y={700 - h} width={w} height={h} fill={col} {...sk(p, 0.7)} opacity={far ? 0.7 : 1} />
              {!far && Array.from({length: Math.floor(h / 46)}).map((__, j) =>
                Array.from({length: Math.floor(w / 30)}).map((___, k) => {
                  const on = rnd(i * 100 + j * 10 + k) > 0.55;
                  return on ? <rect key={`${j}-${k}`} x={x + 10 + k * 28} y={700 - h + 20 + j * 46} width="14" height="20"
                    fill={p.style === 'vector' ? '#FFD68A' : p.glow} opacity={0.55 + 0.35 * Math.sin(t * 0.7 + i + j)} /> : null;
                }),
              )}
            </g>
          );
        })}
      </g>
    );
  },
};

export const windowFrame: AssetDef = {
  vb: [1920, 1080],
  draw: ({p}) => {
    const c = p.style === 'vector' ? '#0A1424' : p.deep;
    return (
      <g fill={c} {...sk(p)}>
        <path fillRule="evenodd" d="M0,0H1920V1080H0Z M170,90H1750V990H170Z" />
        <rect x="945" y="90" width="30" height="900" />
        <rect x="170" y="520" width="1580" height="26" />
      </g>
    );
  },
};

export const table: AssetDef = {
  vb: [2000, 360],
  draw: ({p, uid}) => (
    <g>
      <rect x="0" y="40" width="2000" height="320" fill={p.style === 'vector' ? '#3A2A40' : p.coffeeLight} {...sk(p)} />
      <rect x="0" y="0" width="2000" height="60" rx="10" fill={p.style === 'vector' ? '#5A4260' : p.mid} {...sk(p)} />
      <rect x="0" y="60" width="2000" height="40" fill={shadeFill(p, uid, '#2A1E30')} opacity="0.6" />
    </g>
  ),
};

// ---------- ตัวละคร anchor: "เมล็ด" ----------
const Hat: React.FC<{kind: string; p: any}> = ({kind, p}) => {
  const s = sk(p);
  if (kind === 'fez') return <g><path d="M112,62 L188,62 L178,8 L122,8 Z" fill={p.red} {...s} /><path d="M150,8 Q170,0 176,40" stroke={p.ink} strokeWidth="4" fill="none" /><circle cx="176" cy="42" r="7" fill={p.gold} /></g>;
  if (kind === 'tricorn') return <g><path d="M70,62 Q150,-10 230,62 Q150,40 70,62 Z" fill={p.deep} {...s} /><path d="M90,58 Q150,70 210,58" stroke={p.gold} strokeWidth="5" fill="none" /></g>;
  if (kind === 'captain') return <g><path d="M92,60 Q150,-6 208,60 Z" fill={p.ink} {...s} /><rect x="86" y="54" width="128" height="14" rx="6" fill={p.ink} /><circle cx="150" cy="36" r="9" fill={p.gold} /></g>;
  if (kind === 'straw') return <g><ellipse cx="150" cy="60" rx="95" ry="18" fill="#E8C66A" {...s} /><path d="M108,58 Q150,0 192,58 Z" fill="#E8C66A" {...s} /><rect x="110" y="44" width="80" height="10" fill={p.red} /></g>;
  return null;
};

export const bean: AssetDef = {
  vb: [300, 380],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const blink = (t % 3.2) > 3.05 || expr === 'sleepy';
    const body = p.style === 'vector' ? '#8A4B2A' : p.coffeeLight;
    const bodyShade = p.style === 'vector' ? '#6B3620' : p.coffee;
    const eyeY = 170;
    return (
      <g>
        <ellipse cx="150" cy="352" rx="70" ry="12" fill="#000" opacity="0.18" />
        <path d="M118,300 L112,346 M182,300 L188,346" stroke={bodyShade} strokeWidth="12" strokeLinecap="round" />
        <ellipse cx="150" cy="190" rx="112" ry="140" fill={body} {...sk(p)} />
        <path d="M150,58 C110,120 190,200 150,320" stroke={bodyShade} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.8" />
        <ellipse cx="112" cy="130" rx="26" ry="44" fill="#fff" opacity={p.style === 'vector' ? 0.12 : 0} />
        <path d="M150,58 C70,70 40,200 80,290 C60,200 80,110 150,58 Z" fill={shadeFill(p, uid, bodyShade)} opacity="0.5" />
        {blink ? (
          <g stroke={p.ink} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d={`M92,${eyeY} q16,${expr === 'sleepy' ? 6 : 10} 32,0`} />
            <path d={`M176,${eyeY} q16,${expr === 'sleepy' ? 6 : 10} 32,0`} />
          </g>
        ) : (
          <g>
            <ellipse cx="108" cy={eyeY} rx="17" ry={expr === 'wow' ? 24 : 20} fill="#fff" {...sk(p, 0.6)} />
            <ellipse cx="192" cy={eyeY} rx="17" ry={expr === 'wow' ? 24 : 20} fill="#fff" {...sk(p, 0.6)} />
            <circle cx={112 + Math.sin(t * 0.6) * 2} cy={eyeY + 3} r="9" fill={p.ink} />
            <circle cx={196 + Math.sin(t * 0.6) * 2} cy={eyeY + 3} r="9" fill={p.ink} />
            <circle cx="115" cy={eyeY - 1} r="3" fill="#fff" />
            <circle cx="199" cy={eyeY - 1} r="3" fill="#fff" />
          </g>
        )}
        {expr === 'sly' && <path d="M88,146 L128,154 M212,146 L172,154" stroke={p.ink} strokeWidth="6" strokeLinecap="round" />}
        {expr === 'wow' ? (
          <ellipse cx="150" cy="232" rx="16" ry="20" fill={p.ink} />
        ) : expr === 'sleepy' ? (
          <path d="M136,236 q14,8 28,0" stroke={p.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M122,222 Q150,256 178,222" stroke={p.ink} strokeWidth="7" fill={p.style === 'vector' ? '#3A1A10' : 'none'} strokeLinecap="round" />
        )}
        <ellipse cx="82" cy="214" rx="14" ry="8" fill={p.red} opacity="0.35" />
        <ellipse cx="218" cy="214" rx="14" ry="8" fill={p.red} opacity="0.35" />
        <g transform="translate(0,0)"><Hat kind={(props.hat as string) ?? 'none'} p={p} /></g>
        {props.bag && <g><path d="M232,210 q40,10 44,70 l-50,6 z" fill={p.mid} {...sk(p)} /><path d="M236,214 L200,110" stroke={p.deep} strokeWidth="6" /></g>}
      </g>
    );
  },
};

// ---------- ถ้วยกาแฟ ----------
export const cup: AssetDef = {
  vb: [420, 460],
  draw: ({p, t, props, uid}) => {
    const body = (props.color as string) ?? (p.style === 'vector' ? '#F4F1EA' : p.base);
    const steam = props.steam !== false;
    return (
      <g>
        {steam && [0, 1, 2].map((i) => {
          const ph = t * 1.1 + i * 1.3;
          const y0 = 150;
          const up = (ph % 2.6) * 30;
          return (
            <path key={i} d={`M${160 + i * 45},${y0 - up} c-20,-30 20,-50 0,-80 c-20,-30 20,-50 0,-80`}
              stroke={p.style === 'vector' ? '#FFFFFF' : p.ink} strokeWidth="10" fill="none" strokeLinecap="round"
              opacity={0.45 * (1 - (ph % 2.6) / 2.6)} />
          );
        })}
        <ellipse cx="200" cy="440" rx="170" ry="18" fill="#000" opacity="0.2" />
        <path d="M320,230 q90,0 80,80 q-10,70 -95,70" stroke={body} strokeWidth="30" fill="none" {...(p.stroke ? {} : {})} />
        <path d="M60,170 L340,170 L318,410 Q312,440 280,440 L120,440 Q88,440 82,410 Z" fill={body} {...sk(p)} />
        <path d="M60,170 L140,170 L150,440 L120,440 Q88,440 82,410 Z" fill={shadeFill(p, uid, '#D6D9E4')} opacity="0.6" />
        <ellipse cx="200" cy="172" rx="140" ry="24" fill={p.coffee} {...sk(p)} />
        <ellipse cx="200" cy="176" rx="110" ry="14" fill={p.coffeeLight} opacity="0.5" />
        {props.logo && <text x="200" y="320" textAnchor="middle" fontFamily={FONT.display} fontSize="64" fill={p.coffee}>{props.logo as string}</text>}
      </g>
    );
  },
};

// ---------- FG particles ----------
export const dust: AssetDef = {
  vb: [1920, 1080],
  draw: ({p, t, props}) => (
    <g>
      {Array.from({length: (props.count as number) ?? 26}).map((_, i) => {
        const x = (rnd(i) * 1920 + t * (10 + rnd(i + 3) * 30)) % 1920;
        const y = (rnd(i + 9) * 1080 - t * (6 + rnd(i + 4) * 14) + 1080) % 1080;
        return <circle key={i} cx={x} cy={y} r={6 + rnd(i + 1) * 26} fill={(props.color as string) ?? (p.style === 'vector' ? '#FFE6A6' : p.base)} opacity={0.12 + rnd(i + 2) * 0.25} />;
      })}
    </g>
  ),
};

export const leavesFg: AssetDef = {
  vb: [1920, 1080],
  draw: ({p, t}) => {
    const leaf = (x: number, y: number, r: number, s: number, i: number) => (
      <g key={i} transform={`translate(${x},${y}) rotate(${r + Math.sin(t * 0.8 + i) * 4}) scale(${s})`}>
        <path d="M0,0 C60,-80 220,-80 300,0 C220,80 60,80 0,0 Z" fill={i % 2 ? p.greenDark : p.green} {...sk(p)} />
        <path d="M10,0 L290,0" stroke={p.greenDark} strokeWidth="6" opacity="0.6" />
      </g>
    );
    return <g>{[leaf(-60, 120, 20, 1.3, 0), leaf(-40, 980, -30, 1.5, 1), leaf(1980, 900, 200, 1.4, 2), leaf(1960, 60, 150, 1.1, 3)]}</g>;
  },
};

// ---------- คำอธิบายแบบวาดมือ ----------
export const markerCircle: AssetDef = {
  vb: [600, 320],
  draw: ({p, t, props}) => {
    const d = 'M300,20 C470,15 590,80 580,165 C570,260 420,305 290,300 C140,295 15,240 20,160 C25,80 150,25 330,30 C420,34 470,50 500,70';
    const prog = Math.min(1, Math.max(0, (t - ((props.at as number) ?? 0.2)) / 0.5));
    return <path d={d} fill="none" stroke={(props.color as string) ?? C.marker} strokeWidth="12" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog} opacity={p ? 0.95 : 1} />;
  },
};

export const arrow: AssetDef = {
  vb: [420, 200],
  draw: ({t, props}) => {
    const prog = Math.min(1, Math.max(0, (t - ((props.at as number) ?? 0.2)) / 0.45));
    const col = (props.color as string) ?? C.marker;
    return (
      <g stroke={col} strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20,150 C120,160 260,140 380,60" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog} />
        {prog > 0.95 && <path d="M320,48 L384,58 L360,118" />}
      </g>
    );
  },
};

export const stamp: AssetDef = {
  vb: [560, 280],
  draw: ({t, props}) => {
    const col = (props.color as string) ?? C.marker;
    const at = (props.at as number) ?? 0.15;
    const k = t < at ? 0 : Math.min(1, (t - at) / 0.12);
    const s = 1.8 - 0.8 * k;
    return (
      <g opacity={k} transform={`translate(280,140) scale(${s}) rotate(-8) translate(-280,-140)`}>
        <rect x="20" y="20" width="520" height="240" rx="26" fill="none" stroke={col} strokeWidth="14" />
        <rect x="42" y="42" width="476" height="196" rx="16" fill="none" stroke={col} strokeWidth="5" />
        <text x="280" y="178" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={(props.size as number) ?? 110} fill={col}>
          {props.text as string}
        </text>
      </g>
    );
  },
};

export const clock: AssetDef = {
  vb: [420, 420],
  draw: ({p, t}) => {
    const a = -t * 540;
    return (
      <g>
        <circle cx="210" cy="210" r="190" fill={p.style === 'vector' ? '#F4F1EA' : p.base} stroke={p.style === 'vector' ? C.accent2 : p.ink} strokeWidth="18" />
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x="205" y="36" width="10" height="30" rx="4" fill={p.ink} transform={`rotate(${i * 30} 210 210)`} />
        ))}
        <rect x="203" y="80" width="14" height="140" rx="7" fill={p.ink} transform={`rotate(${a} 210 210)`} />
        <rect x="204" y="120" width="12" height="100" rx="6" fill={C.accent1} transform={`rotate(${a / 12} 210 210)`} />
        <circle cx="210" cy="210" r="14" fill={p.ink} />
        <path d="M60,90 A190,190 0 0,0 40,250" stroke={C.accent2} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.8" />
        <path d="M30,130 L60,90 L90,120" stroke={C.accent2} strokeWidth="10" fill="none" strokeLinecap="round" />
      </g>
    );
  },
};

export const wantedPoster: AssetDef = {
  vb: [620, 820],
  draw: (a) => {
    const {p} = a;
    return (
      <g>
        <rect x="10" y="10" width="600" height="800" fill={p.base} {...sk(p)} />
        <rect x="40" y="40" width="540" height="740" fill="none" stroke={p.ink} strokeWidth="4" />
        <text x="310" y="140" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="92" fill={p.ink}>ต้องการตัว</text>
        <g transform="translate(160,170) scale(1)">{bean.draw({...a, props: {expr: 'sly'}})}</g>
        <text x="310" y="630" textAnchor="middle" fontFamily={FONT.body} fontWeight={600} fontSize="40" fill={p.ink}>ข้อหา: ทำให้คนนอนไม่หลับ</text>
        <text x="310" y="720" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="64" fill={C.marker}>รางวัล ???</text>
      </g>
    );
  },
};
