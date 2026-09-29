import React from 'react';
import {AssetDef, rnd, shadeFill, wobblePath} from './core';
import {sk} from './palette';
import {C, FONT} from '../theme/tokens';

export const mountains: AssetDef = {
  vb: [2400, 800],
  draw: ({p, props, uid}) => {
    const near = props.near as boolean;
    const seed = near ? 7 : 2;
    const pts: [number, number][] = [[0, 800]];
    for (let i = 0; i <= 12; i++) pts.push([i * 200, (near ? 380 : 200) + rnd(i + seed) * (near ? 260 : 320)]);
    pts.push([2400, 800]);
    const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ') + 'Z';
    const col = near ? (p.style === 'vector' ? '#3B2F5C' : '#7A6245') : p.style === 'vector' ? '#5B4A80' : '#A58E6B';
    return (
      <g>
        <path d={d} fill={col} {...sk(p)} />
        {near && <path d={d} fill={shadeFill(p, uid, '#2A2045')} opacity="0.35" transform="translate(40,30)" />}
      </g>
    );
  },
};

export const goat: AssetDef = {
  vb: [440, 380],
  draw: ({p, t, props, uid}) => {
    const jump = props.jump ? Math.abs(Math.sin(t * 4.2)) * 70 : 0;
    const legA = props.jump ? Math.sin(t * 8.4) * 16 : 0;
    const body = p.style === 'vector' ? '#EDE4D6' : p.base;
    return (
      <g transform={`translate(0,${-jump})`}>
        <ellipse cx="220" cy={370 + jump} rx={110 - jump * 0.6} ry="10" fill="#000" opacity="0.2" />
        {[[140, legA], [180, -legA], [280, legA], [310, -legA]].map(([x, a], i) => (
          <path key={i} d={`M${x},250 l${a * 0.4},100`} stroke={p.style === 'vector' ? '#8C7A66' : p.deep} strokeWidth="16" strokeLinecap="round" />
        ))}
        <ellipse cx="225" cy="210" rx="130" ry="70" fill={body} {...sk(p)} />
        <path d="M110,230 Q225,300 350,230 Q300,280 225,282 Q150,280 110,230 Z" fill={shadeFill(p, uid, '#CDBFAA')} opacity="0.7" />
        <path d="M350,190 L400,120 Q420,110 430,130 L420,190 Q400,215 370,215 Z" fill={body} {...sk(p)} />
        <path d="M400,122 Q380,60 340,70 M408,118 Q410,60 380,48" stroke={p.style === 'vector' ? '#8C7A66' : p.ink} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M415,200 l-6,40 l-12,-34" fill={p.style === 'vector' ? '#8C7A66' : p.deep} />
        <circle cx="408" cy="150" r="7" fill={p.ink} />
        <path d="M95,190 q-25,-20 -10,-40" stroke={body} strokeWidth="18" strokeLinecap="round" fill="none" />
        {props.cherry && <circle cx="428" cy="178" r="10" fill={p.red} {...sk(p, 0.5)} />}
      </g>
    );
  },
};

export const cherryBranch: AssetDef = {
  vb: [620, 420],
  draw: ({p, t}) => (
    <g transform={`rotate(${Math.sin(t * 1.1) * 2} 20 200)`}>
      <path d="M0,220 C160,200 380,160 610,120" stroke={p.style === 'vector' ? '#5A3A2A' : p.deep} strokeWidth="16" fill="none" strokeLinecap="round" {...(p.stroke ? {} : {})} />
      {[80, 200, 330, 460, 560].map((x, i) => (
        <g key={i}>
          <path d={`M${x},${210 - i * 20} C${x + 30},${100 - i * 20} ${x + 120},${90 - i * 20} ${x + 150},${120 - i * 20} C${x + 110},${170 - i * 20} ${x + 50},${200 - i * 20} ${x},${210 - i * 20} Z`}
            fill={i % 2 ? p.greenDark : p.green} {...sk(p)} />
          <path d={`M${x + 10},${250 - i * 20} C${x + 40},${340 - i * 20} ${x + 120},${350 - i * 20} ${x + 140},${320 - i * 20} C${x + 110},${280 - i * 20} ${x + 50},${260 - i * 20} ${x + 10},${250 - i * 20} Z`}
            fill={i % 2 ? p.green : p.greenDark} {...sk(p)} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={x + 20 + k * 22} cy={228 - i * 20 + (k % 2) * 16} r="17" fill={k === 1 ? '#B8322A' : p.red} {...sk(p, 0.6)} />
          ))}
        </g>
      ))}
    </g>
  ),
};

export const sufi: AssetDef = {
  vb: [340, 560],
  draw: ({p, t, uid}) => {
    const robe = p.style === 'vector' ? '#E9E2D2' : p.base;
    return (
      <g>
        <ellipse cx="170" cy="545" rx="120" ry="12" fill="#000" opacity="0.2" />
        <path d="M170,150 C80,170 50,400 40,540 L300,540 C290,400 260,170 170,150 Z" fill={robe} {...sk(p)} />
        <path d="M170,150 C120,170 90,400 80,540 L140,540 C140,400 150,250 170,150 Z" fill={shadeFill(p, uid, '#CFC6B2')} opacity="0.7" />
        <path d="M100,250 L170,300 L240,250" stroke={p.style === 'vector' ? '#6B8B7A' : p.deep} strokeWidth="18" fill="none" strokeLinecap="round" />
        <circle cx="170" cy="112" r="56" fill={p.skin} {...sk(p)} />
        <path d="M112,96 C110,20 230,20 228,96 Q170,70 112,96 Z" fill={p.style === 'vector' ? '#3C6E5A' : p.green} {...sk(p)} />
        <path d="M112,96 Q170,80 228,96" stroke={p.style === 'vector' ? '#2C5444' : p.ink} strokeWidth="8" fill="none" />
        <path d="M148,118 q8,6 16,0 M178,118 q8,6 16,0" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M130,150 Q170,210 210,150 Q170,170 130,150 Z" fill={p.style === 'vector' ? '#5B4636' : p.deep} />
        <g transform={`translate(220,${300 + Math.sin(t * 1.5) * 4})`}>
          <path d="M0,0 L60,0 L52,50 L8,50 Z" fill={p.style === 'vector' ? '#C9A36B' : p.gold} {...sk(p)} />
          <ellipse cx="30" cy="2" rx="30" ry="6" fill={p.coffee} />
          {[0, 1].map((i) => (
            <path key={i} d={`M${20 + i * 18},-10 c-10,-20 10,-30 0,-50`} stroke={p.style === 'vector' ? '#fff' : p.ink} strokeWidth="5" fill="none" opacity={0.3 + 0.2 * Math.sin(t * 2 + i)} />
          ))}
        </g>
      </g>
    );
  },
};

export const lantern: AssetDef = {
  vb: [260, 420],
  draw: ({p, t, uid}) => (
    <g>
      <circle cx="130" cy="260" r={130 + Math.sin(t * 5) * 4} fill={`url(#glow-${uid})`} />
      <line x1="130" y1="0" x2="130" y2="170" stroke={p.ink} strokeWidth="5" />
      <path d="M90,170 L170,170 L190,240 L130,330 L70,240 Z" fill={p.style === 'vector' ? '#C99A3C' : p.gold} {...sk(p)} />
      <path d="M100,190 L160,190 L172,240 L130,305 L88,240 Z" fill="#FFE39A" opacity={0.85 + 0.15 * Math.sin(t * 7)} />
    </g>
  ),
};

export const mochaPort: AssetDef = {
  vb: [2200, 760],
  draw: ({p, uid}) => {
    const wall = p.style === 'vector' ? '#E8D9C0' : p.base;
    const shade = p.style === 'vector' ? '#C9B394' : p.mid;
    const blds = [[60, 300, 170], [250, 420, 150], [420, 260, 200], [640, 480, 160], [820, 340, 190], [1250, 380, 170], [1440, 300, 210], [1680, 450, 150], [1850, 330, 200]];
    return (
      <g>
        {blds.map(([x, h, w], i) => (
          <g key={i}>
            <rect x={x} y={760 - h} width={w} height={h} fill={i % 2 ? wall : shade} {...sk(p)} />
            <rect x={x} y={760 - h} width={w} height="18" fill={p.style === 'vector' ? '#B89A74' : p.shade} />
            {Array.from({length: Math.floor(h / 80)}).map((_, j) => (
              <g key={j}>
                <path d={`M${x + 30},${760 - h + 60 + j * 80} h28 v38 h-28 z`} fill={p.style === 'vector' ? '#6C4E3A' : p.deep} />
                <path d={`M${x + w - 60},${760 - h + 60 + j * 80} h28 v38 h-28 z`} fill={p.style === 'vector' ? '#6C4E3A' : p.deep} />
              </g>
            ))}
          </g>
        ))}
        <rect x="1060" y="130" width="70" height="630" fill={wall} {...sk(p)} />
        <rect x="1045" y="250" width="100" height="24" fill={shade} {...sk(p)} />
        <path d="M1060,130 L1095,40 L1130,130 Z" fill={wall} {...sk(p)} />
        <path d="M980,760 L980,560 Q1095,430 1210,560 L1210,760 Z" fill={shade} {...sk(p)} />
        <rect x="0" y="740" width="2200" height="20" fill={shadeFill(p, uid, '#A68B6A')} />
      </g>
    );
  },
};

export const dhow: AssetDef = {
  vb: [560, 480],
  draw: ({p, t, uid}) => (
    <g transform={`rotate(${Math.sin(t * 1.4) * 3} 280 400)`}>
      <path d="M270,40 L275,360" stroke={p.style === 'vector' ? '#5A3A2A' : p.deep} strokeWidth="12" />
      <path d="M260,50 Q480,200 470,330 L270,330 Z" fill={p.style === 'vector' ? '#F4ECDC' : p.base} {...sk(p)} />
      <path d="M260,50 Q360,180 380,330 L270,330 Z" fill={shadeFill(p, uid, '#DCCFB6')} opacity="0.6" />
      <path d="M40,350 L520,350 Q490,440 400,450 L140,450 Q70,430 40,350 Z" fill={p.style === 'vector' ? '#8C5A3A' : p.coffeeLight} {...sk(p)} />
      <path d="M60,380 L505,380" stroke={p.style === 'vector' ? '#6B4028' : p.ink} strokeWidth="6" />
      {[0, 1, 2].map((i) => <rect key={i} x={170 + i * 70} y="310" width="50" height="40" rx="6" fill={p.style === 'vector' ? '#C9A36B' : p.mid} {...sk(p, 0.6)} />)}
    </g>
  ),
};

export const sea: AssetDef = {
  vb: [2400, 360],
  draw: ({p, t}) => (
    <g>
      <rect y="40" width="2400" height="320" fill={p.style === 'vector' ? p.seaDark : p.seaDark} />
      {[0, 1, 2].map((r) => (
        <path key={r}
          d={`M0,${40 + r * 90} ${Array.from({length: 25}).map((_, i) => `Q${i * 100 + 50 + ((t * 40 * (r + 1)) % 100)},${20 + r * 90} ${i * 100 + 100},${40 + r * 90}`).join(' ')} L2400,360 L0,360 Z`}
          fill={r === 0 ? p.sea : r === 1 ? p.seaDark : p.style === 'vector' ? '#153E6B' : p.shade} opacity={r === 0 ? 1 : 0.8} {...sk(p, 0.5)} />
      ))}
    </g>
  ),
};

export const documentPaper: AssetDef = {
  vb: [560, 720],
  draw: ({p, props, uid}) => (
    <g>
      <path d={wobblePath([[20, 20], [540, 26], [534, 700], [26, 694]], 3, 8) + 'Z'} fill={p.style === 'vector' ? '#F4ECDC' : p.base} {...sk(p)} />
      <text x="280" y="110" textAnchor="middle" fontFamily={(props.font as string) ?? 'serif'} fontStyle="italic" fontWeight={700} fontSize={(props.titleSize as number) ?? 48} fill={p.ink}>{(props.title as string) ?? ''}</text>
      {Array.from({length: 11}).map((_, i) => (
        <path key={i} d={wobblePath([[70, 170 + i * 40], [490 - (i % 3) * 40, 170 + i * 40]], i + 10, 3)} stroke={p.ink} strokeWidth="5" opacity="0.5" />
      ))}
      {props.seal !== false && <g><circle cx="430" cy="620" r="52" fill={p.style === 'vector' ? '#C8442F' : C.marker} /><circle cx="430" cy="620" r="36" fill="none" stroke="#7A1E12" strokeWidth="5" /></g>}
      {props.year && <text x="110" y="640" fontFamily={FONT.display} fontWeight={600} fontSize="54" fill={p.ink}>{props.year as string}</text>}
      <rect x="20" y="20" width="520" height="680" fill={`url(#dots-${uid})`} opacity={p.style === 'collage' ? 0.25 : 0} />
    </g>
  ),
};
