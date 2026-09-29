import React from 'react';
import {AssetDef, rnd, shadeFill} from './core';
import {sk} from './palette';
import {C, FONT} from '../theme/tokens';

export const coffeehouse: AssetDef = {
  vb: [1500, 1000],
  draw: ({p, t, uid}) => {
    const wall = p.style === 'vector' ? '#3B4A6B' : p.mid;
    const beam = p.style === 'vector' ? '#1E2A44' : p.deep;
    const win = p.style === 'vector' ? '#FFC96A' : p.glow;
    return (
      <g>
        <path d="M60,260 L750,40 L1440,260 Z" fill={p.style === 'vector' ? '#8A3E3A' : p.coffeeLight} {...sk(p)} />
        <rect x="100" y="260" width="1300" height="740" fill={wall} {...sk(p)} />
        {[100, 420, 1080, 1400].map((x, i) => <rect key={i} x={x - 14} y="260" width="28" height="740" fill={beam} />)}
        <rect x="100" y="560" width="1300" height="26" fill={beam} />
        {[[160, 320], [470, 320], [870, 320], [1140, 320], [160, 640], [1140, 640]].map(([x, y], i) => (
          <g key={i}>
            <rect x={x} y={y} width="200" height="190" fill={win} opacity={0.85 + 0.1 * Math.sin(t * 3 + i)} {...sk(p)} />
            <path d={`M${x + 100},${y} v190 M${x},${y + 95} h200`} stroke={beam} strokeWidth="10" />
          </g>
        ))}
        <rect x="600" y="660" width="300" height="340" rx="12" fill={p.style === 'vector' ? '#5A2E22' : p.coffee} {...sk(p)} />
        <circle cx="860" cy="840" r="12" fill={C.accent2} />
        <g transform={`rotate(${Math.sin(t * 1.3) * 3} 750 600)`}>
          <line x1="650" y1="600" x2="650" y2="625" stroke={beam} strokeWidth="6" />
          <line x1="850" y1="600" x2="850" y2="625" stroke={beam} strokeWidth="6" />
          <rect x="580" y="610" width="340" height="0" />
        </g>
        <g transform={`rotate(${Math.sin(t * 1.3) * 2.5} 750 180)`}>
          <line x1="640" y1="170" x2="640" y2="200" stroke={beam} strokeWidth="6" />
          <line x1="860" y1="170" x2="860" y2="200" stroke={beam} strokeWidth="6" />
          <rect x="560" y="196" width="380" height="110" rx="14" fill={p.style === 'vector' ? '#F4ECDC' : p.base} {...sk(p)} />
          <text x="750" y="272" textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize="58" fill={p.ink}>COFFEE</text>
        </g>
        <rect x="100" y="960" width="1300" height="40" fill={shadeFill(p, uid, '#141C30')} opacity="0.7" />
      </g>
    );
  },
};

export const gent: AssetDef = {
  vb: [280, 560],
  draw: ({p, t, props, uid}) => {
    const coats = ['#C8442F', '#2E6FA8', '#3E8E6A', '#7A4FA0', '#B8862E'];
    const coat = p.style === 'vector' ? coats[((props.v as number) ?? 0) % coats.length] : [p.coffeeLight, p.shade, p.deep, p.mid, p.coffee][((props.v as number) ?? 0) % 5];
    const talk = props.talk ? Math.sin(t * 6 + ((props.v as number) ?? 0)) * 12 : 0;
    return (
      <g>
        <ellipse cx="140" cy="548" rx="90" ry="10" fill="#000" opacity="0.2" />
        <path d="M110,420 L100,540 M170,420 L180,540" stroke={p.ink} strokeWidth="18" strokeLinecap="round" />
        <path d="M70,210 Q140,180 210,210 L230,440 L50,440 Z" fill={coat} {...sk(p)} />
        <path d="M70,210 Q100,196 130,192 L120,440 L50,440 Z" fill={shadeFill(p, uid, '#00000033')} opacity="0.5" />
        <path d="M130,200 L140,300 L150,200 Z" fill="#fff" />
        <path d={`M208,230 Q260,${260 - talk} 240,${310 - talk}`} stroke={coat} strokeWidth="30" fill="none" strokeLinecap="round" />
        <g transform={`translate(${220},${290 - talk})`}>
          <path d="M0,0 L36,0 L31,30 L5,30 Z" fill="#fff" {...sk(p, 0.6)} />
        </g>
        <path d="M70,230 Q40,300 60,360" stroke={coat} strokeWidth="30" fill="none" strokeLinecap="round" />
        <path d="M86,120 Q70,210 100,200 M194,120 Q210,210 180,200" stroke="#EDEDED" strokeWidth="26" strokeLinecap="round" fill="none" />
        <circle cx="140" cy="120" r="58" fill={p.skin} {...sk(p)} />
        <circle cx="120" cy="118" r="6" fill={p.ink} />
        <circle cx="160" cy="118" r="6" fill={p.ink} />
        <path d={props.talk && Math.sin(t * 9) > 0 ? 'M126,146 q14,14 28,0 Z' : 'M126,148 q14,6 28,0'} stroke={p.ink} strokeWidth="5" fill={p.ink} />
        <path d="M60,80 Q140,0 220,80 Q140,60 60,80 Z" fill={p.ink} {...sk(p)} />
        <path d="M50,84 Q140,40 230,84" stroke={p.ink} strokeWidth="12" fill="none" />
      </g>
    );
  },
};

export const bubble: AssetDef = {
  vb: [520, 280],
  draw: ({p, props}) => (
    <g>
      <path d="M40,20 H480 Q510,20 510,50 V190 Q510,220 480,220 H150 L90,272 L100,220 H40 Q10,220 10,190 V50 Q10,20 40,20 Z" fill="#fff" stroke={p.style === 'collage' ? p.ink : 'none'} strokeWidth="4" />
      <text x="260" y="148" textAnchor="middle" fontFamily={FONT.display} fontWeight={600} fontSize={(props.size as number) ?? 64} fill={C.bgDeep}>{props.text as string}</text>
    </g>
  ),
};

export const newspaper: AssetDef = {
  vb: [560, 720],
  draw: ({p, props}) => (
    <g>
      <rect x="10" y="10" width="540" height="700" fill={p.style === 'vector' ? '#EDE7DA' : p.base} {...sk(p)} />
      <text x="280" y="92" textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize="64" fill={p.ink}>{(props.title as string) ?? 'THE GAZETTE'}</text>
      <rect x="40" y="112" width="480" height="6" fill={p.ink} />
      <text x="280" y="180" textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize="34" fill={p.ink}>{(props.head as string) ?? 'SHIPS ARRIVED'}</text>
      {[0, 1, 2].map((c) => Array.from({length: 16}).map((_, i) => (
        <rect key={`${c}-${i}`} x={40 + c * 165} y={220 + i * 28} width={140 - rnd(c * 20 + i) * 40} height="10" fill={p.ink} opacity="0.35" />
      )))}
    </g>
  ),
};

export const tallship: AssetDef = {
  vb: [760, 700],
  draw: ({p, t, uid}) => {
    const sail = p.style === 'vector' ? '#F4ECDC' : p.base;
    const hull = p.style === 'vector' ? '#5A3426' : p.coffee;
    return (
      <g transform={`rotate(${Math.sin(t * 1.2) * 2.5} 380 600)`}>
        {[220, 380, 540].map((x, i) => (
          <g key={i}>
            <line x1={x} y1={60 + i * 10} x2={x} y2="540" stroke={hull} strokeWidth="12" />
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M${x - 90 + k * 12},${100 + k * 130 + i * 10} Q${x},${80 + k * 130 + i * 10 + 30} ${x + 90 - k * 12},${100 + k * 130 + i * 10} L${x + 100 - k * 10},${210 + k * 130 + i * 10} Q${x},${240 + k * 130 + i * 10} ${x - 100 + k * 10},${210 + k * 130 + i * 10} Z`}
                fill={sail} {...sk(p)} />
            ))}
          </g>
        ))}
        <path d="M40,520 L720,520 Q690,640 600,660 L160,660 Q80,640 40,520 Z" fill={hull} {...sk(p)} />
        <path d="M60,560 L705,560" stroke={p.style === 'vector' ? C.accent2 : p.ink} strokeWidth="8" />
        <path d="M40,520 L720,520 Q690,640 600,660 L400,660 Z" fill={shadeFill(p, uid, '#00000044')} opacity="0.35" />
        <path d={`M540,60 l0,-40 l60,${14 + Math.sin(t * 4) * 6} l-60,14`} fill={p.style === 'vector' ? C.accent1 : p.red} />
      </g>
    );
  },
};

export const coin: AssetDef = {
  vb: [220, 220],
  draw: ({p, t}) => {
    const sx = Math.cos(t * 5);
    return (
      <g transform={`translate(110,110) scale(${Math.abs(sx) * 0.9 + 0.1},1)`}>
        <circle r="96" fill={p.style === 'vector' ? '#C98A4A' : p.gold} {...sk(p)} />
        <circle r="74" fill="none" stroke={p.style === 'vector' ? '#9C6432' : p.ink} strokeWidth="6" />
        <text y="26" textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize="78" fill={p.style === 'vector' ? '#7A4A22' : p.ink}>1d</text>
      </g>
    );
  },
};

export const greenhouse: AssetDef = {
  vb: [1000, 700],
  draw: ({p, t, uid}) => {
    const frame = p.style === 'vector' ? '#E6EEF5' : p.ink;
    return (
      <g>
        <path d="M60,680 L60,300 Q500,-40 940,300 L940,680 Z" fill={p.style === 'vector' ? '#9FD8E8' : p.sky2} opacity="0.55" />
        <path d="M300,420 q50,-80 100,0 q60,-70 110,10 q40,-60 90,0 L600,680 L320,680 Z" fill={p.green} {...sk(p)} />
        {[380, 470, 560].map((x, i) => <circle key={i} cx={x} cy={430 + (i % 2) * 20} r="12" fill={p.red} />)}
        <path d="M60,680 L60,300 Q500,-40 940,300 L940,680" fill="none" stroke={frame} strokeWidth="14" />
        {[200, 350, 500, 650, 800].map((x, i) => <line key={i} x1={x} y1="680" x2={x} y2={x === 500 ? 45 : 140 + Math.abs(500 - x) * 0.45} stroke={frame} strokeWidth="7" />)}
        {[400, 540].map((y, i) => <line key={i} x1="60" y1={y} x2="940" y2={y} stroke={frame} strokeWidth="7" />)}
        <path d={`M120,340 L260,180`} stroke="#fff" strokeWidth="12" opacity={0.35 + 0.15 * Math.sin(t * 2)} strokeLinecap="round" />
        <rect x="40" y="670" width="920" height="30" fill={shadeFill(p, uid, '#7A8C99')} />
      </g>
    );
  },
};

export const seedling: AssetDef = {
  vb: [260, 360],
  draw: ({p, t}) => (
    <g>
      <g transform={`rotate(${Math.sin(t * 1.6) * 4} 130 200)`}>
        <path d="M130,210 C130,150 125,110 130,60" stroke={p.greenDark} strokeWidth="10" fill="none" />
        <path d="M130,120 C80,80 40,110 50,140 C80,150 110,140 130,120 Z" fill={p.green} {...sk(p)} />
        <path d="M130,90 C180,50 220,80 212,112 C180,122 150,112 130,90 Z" fill={p.green} {...sk(p)} />
        <path d="M130,62 C110,30 130,10 140,20 C150,35 142,52 130,62 Z" fill={p.greenDark} {...sk(p)} />
      </g>
      <path d="M50,200 L210,200 L190,340 L70,340 Z" fill={p.style === 'vector' ? '#C7653E' : p.coffeeLight} {...sk(p)} />
      <rect x="40" y="190" width="180" height="30" rx="6" fill={p.style === 'vector' ? '#A84E2E' : p.shade} {...sk(p)} />
    </g>
  ),
};

export const waterCup: AssetDef = {
  vb: [260, 320],
  draw: ({p, t}) => {
    const tilt = 35 + Math.sin(t * 1.5) * 8;
    return (
      <g>
        <g transform={`rotate(${tilt} 130 120)`}>
          <path d="M70,40 L190,40 L180,190 L80,190 Z" fill={p.style === 'vector' ? '#B9C6D6' : p.mid} {...sk(p)} />
          <path d="M72,70 L188,70 L180,190 L80,190 Z" fill={p.style === 'vector' ? '#5AB4E6' : p.sea} opacity="0.8" />
        </g>
        {[0, 1, 2].map((i) => {
          const y = ((t * 220 + i * 70) % 200) + 120;
          return <path key={i} d={`M${60 - i * 4},${y} q-10,18 0,26 q10,-8 0,-26 Z`} fill={p.style === 'vector' ? '#7CCBF2' : p.sea} />;
        })}
      </g>
    );
  },
};

export const island: AssetDef = {
  vb: [1400, 620],
  draw: ({p, t, uid}) => {
    const palm = (x: number, h: number, i: number) => (
      <g key={i}>
        <path d={`M${x},560 Q${x + 20},${560 - h / 2} ${x + 40},${560 - h}`} stroke={p.style === 'vector' ? '#7A5236' : p.deep} strokeWidth="18" fill="none" />
        {[0, 72, 144, 216, 288].map((a, k) => (
          <path key={k} transform={`rotate(${a + Math.sin(t * 1.3 + i) * 5} ${x + 40} ${560 - h})`}
            d={`M${x + 40},${560 - h} q60,-30 130,20 q-70,-10 -130,-20 Z`} fill={k % 2 ? p.greenDark : p.green} {...sk(p)} />
        ))}
      </g>
    );
    return (
      <g>
        <path d="M0,620 Q200,360 520,330 Q800,300 1000,420 Q1250,480 1400,620 Z" fill={p.style === 'vector' ? '#2FA37A' : p.green} {...sk(p)} />
        <path d="M0,620 Q300,520 700,560 Q1100,600 1400,620 Z" fill={p.style === 'vector' ? '#F2D59A' : p.mid} {...sk(p)} />
        <path d="M520,330 Q800,300 1000,420 Q800,380 560,400 Z" fill={shadeFill(p, uid, '#1E7A5A')} opacity="0.4" />
        {palm(300, 260, 0)}{palm(420, 330, 1)}{palm(980, 280, 2)}
      </g>
    );
  },
};

export const plantation: AssetDef = {
  vb: [2400, 800],
  draw: ({p, props}) => {
    const far = props.far as boolean;
    const hill = far ? (p.style === 'vector' ? '#2E8C6A' : p.green) : p.style === 'vector' ? '#1F6E52' : p.greenDark;
    const base = far ? 300 : 420;
    return (
      <g>
        <path d={`M0,800 L0,${base} Q600,${base - 180} 1200,${base - 40} Q1800,${base + 80} 2400,${base - 120} L2400,800 Z`} fill={hill} {...sk(p)} />
        {Array.from({length: far ? 6 : 8}).map((_, r) =>
          Array.from({length: 40}).map((__, i) => {
            const x = i * 62 + (r % 2) * 30;
            const y = base + 40 + r * (far ? 60 : 55) - Math.sin((x / 2400) * Math.PI) * 60;
            return <circle key={`${r}-${i}`} cx={x} cy={y} r={far ? 16 : 22} fill={p.style === 'vector' ? (r % 2 ? '#3FD6A0' : '#34B98A') : p.green} {...sk(p, 0.4)} />;
          }),
        )}
      </g>
    );
  },
};

export const sacks: AssetDef = {
  vb: [700, 520],
  draw: ({p, props, uid}) => {
    const s = (x: number, y: number, i: number) => (
      <g key={i}>
        <path d={`M${x},${y + 30} Q${x - 10},${y + 180} ${x + 20},${y + 200} L${x + 200},${y + 200} Q${x + 230},${y + 180} ${x + 220},${y + 30} Q${x + 110},${y - 10} ${x},${y + 30} Z`}
          fill={p.style === 'vector' ? '#D8B98A' : p.mid} {...sk(p)} />
        <path d={`M${x},${y + 30} Q${x - 10},${y + 180} ${x + 20},${y + 200} L${x + 70},${y + 200} Q${x + 40},${y + 120} ${x + 50},${y + 20} Z`} fill={shadeFill(p, uid, '#B8966A')} opacity="0.6" />
        <text x={x + 110} y={y + 130} textAnchor="middle" fontFamily="serif" fontWeight={700} fontSize="34" fill={p.style === 'vector' ? '#5A3A22' : p.ink}>{(props.label as string) ?? 'BRASIL'}</text>
      </g>
    );
    return <g>{[s(20, 300, 0), s(250, 300, 1), s(480, 300, 2), s(135, 110, 3), s(365, 110, 4)]}</g>;
  },
};

export const trophy: AssetDef = {
  vb: [360, 460],
  draw: ({p, t, uid}) => (
    <g>
      <circle cx="180" cy="170" r={170 + Math.sin(t * 3) * 6} fill={`url(#glow-${uid})`} />
      <path d="M90,40 L270,40 Q270,220 180,240 Q90,220 90,40 Z" fill={p.style === 'vector' ? C.accent2 : p.gold} {...sk(p)} />
      <path d="M90,70 Q20,70 40,140 Q60,190 110,190 M270,70 Q340,70 320,140 Q300,190 250,190" stroke={p.style === 'vector' ? '#E0A92E' : p.ink} strokeWidth="16" fill="none" />
      <rect x="160" y="236" width="40" height="80" fill={p.style === 'vector' ? '#E0A92E' : p.shade} />
      <rect x="100" y="310" width="160" height="60" rx="10" fill={p.style === 'vector' ? '#5A3A22' : p.deep} {...sk(p)} />
      <text x="180" y="170" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="120" fill={p.style === 'vector' ? '#8A5A12' : p.ink}>1</text>
    </g>
  ),
};

export const farmer: AssetDef = {
  vb: [120, 200],
  draw: ({p}) => (
    <g>
      <path d="M25,90 Q60,75 95,90 L100,195 L20,195 Z" fill={p.style === 'vector' ? C.accent3 : p.green} />
      <circle cx="60" cy="58" r="26" fill={p.skin} />
      <ellipse cx="60" cy="38" rx="50" ry="10" fill="#E8C66A" />
      <path d="M38,38 Q60,4 82,38 Z" fill="#E8C66A" />
    </g>
  ),
};
