// asset ของเรื่อง "TikTok นิยมขนาดไหน" (projects/tiktok) — วาดเองทั้งหมด ใช้สีจาก palette (rule 10)
// ห้ามโลโก้/UI จริงของแพลตฟอร์มใด ๆ (rule 04) → มือถือ/ฟีด/ไอคอนแบบทั่วไป
import React from 'react';
import {AssetDef, rnd, shadeFill, wobblePath} from './core';
import {sk, Pal} from './palette';
import {C, FONT} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const skinOf = (p: Pal) => (vec(p) ? {body: '#F2B38F', shade: '#D98C68', nail: '#FBE3D6'} : {body: p.skin, shade: p.skinShade, nail: p.base});

// ---------- Character anchor: นิ้วโป้ง ----------
export const thumbBuddy: AssetDef = {
  vb: [260, 360],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const s = skinOf(p);
    const blink = t % 3.3 > 3.15 || expr === 'sleepy';
    const bob = Math.sin(t * 2) * 3;
    const ey = 175;
    return (
      <g transform={`translate(0,${bob})`}>
        <ellipse cx="130" cy="350" rx="80" ry="10" fill="#000" opacity="0.18" />
        <path d="M60,340 L60,150 C60,70 100,30 130,30 C160,30 200,70 200,150 L200,340 Z" fill={s.body} {...sk(p)} />
        <path d="M60,340 L60,150 C60,70 100,30 130,30 C105,60 92,120 100,340 Z" fill={shadeFill(p, uid, s.shade)} opacity="0.5" />
        <path d="M92,60 C100,40 118,34 130,34 C150,34 164,46 170,62 C150,74 110,74 92,60 Z" fill={s.nail} opacity="0.9" {...sk(p, 0.6)} />
        <path d="M70,290 q60,14 120,0 M70,310 q60,12 120,0" stroke={s.shade} strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
        {blink ? (
          <g stroke={p.ink} strokeWidth="6" strokeLinecap="round" fill="none">
            <path d={`M92,${ey} q14,${expr === 'sleepy' ? 6 : 9} 28,0`} /><path d={`M140,${ey} q14,${expr === 'sleepy' ? 6 : 9} 28,0`} />
          </g>
        ) : (
          <g>
            <ellipse cx="106" cy={ey} rx="15" ry={expr === 'wow' ? 21 : 17} fill="#fff" {...sk(p, 0.6)} />
            <ellipse cx="154" cy={ey} rx="15" ry={expr === 'wow' ? 21 : 17} fill="#fff" {...sk(p, 0.6)} />
            <circle cx={109 + Math.sin(t * 0.7) * 2} cy={ey + 2} r="8" fill={p.ink} />
            <circle cx={157 + Math.sin(t * 0.7) * 2} cy={ey + 2} r="8" fill={p.ink} />
            <circle cx="112" cy={ey - 2} r="2.6" fill="#fff" /><circle cx="160" cy={ey - 2} r="2.6" fill="#fff" />
          </g>
        )}
        {expr === 'sleepy' && <path d="M88,160 h36 M136,160 h36" stroke={p.ink} strokeWidth="5" strokeLinecap="round" opacity="0.6" />}
        {expr === 'confused' && <path d="M88,146 L122,154 M172,144 L140,154" stroke={p.ink} strokeWidth="5" strokeLinecap="round" />}
        {expr === 'wow' ? <ellipse cx="130" cy="228" rx="13" ry="17" fill={p.ink} />
          : expr === 'confused' ? <path d="M110,230 q10,-7 20,0 q10,7 20,0" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          : expr === 'sleepy' ? <path d="M118,230 q12,6 24,0" stroke={p.ink} strokeWidth="5" fill="none" strokeLinecap="round" />
          : <path d="M108,218 Q130,246 152,218" stroke={p.ink} strokeWidth="6" fill={vec(p) ? '#7A3322' : 'none'} strokeLinecap="round" />}
        <ellipse cx="84" cy="206" rx="12" ry="7" fill={p.red} opacity="0.35" /><ellipse cx="176" cy="206" rx="12" ry="7" fill={p.red} opacity="0.35" />
        {props.wave && <path d={`M200,${150 + Math.sin(t * 8) * 10} q30,-20 40,-50`} stroke={s.body} strokeWidth="18" strokeLinecap="round" fill="none" />}
      </g>
    );
  },
};

// ---------- มือถือทั่วไป (ไม่มีโลโก้) + ฟีดเลื่อน ----------
const FEED = ['#FF6B4A', '#3FD6C6', '#B28CFF', '#FFC94A', '#5B8DEF', '#FF8FB1'];
export const phoneFeed: AssetDef = {
  vb: [300, 560],
  draw: ({p, t, props, uid}) => {
    const glow = props.glow !== false;
    const speed = (props.speed as number) ?? 1;
    const off = (t * 180 * speed) % 440;
    const future = props.future === true;
    return (
      <g>
        {glow && <ellipse cx="150" cy="280" rx="260" ry="330" fill={`url(#glow-${uid})`} opacity={vec(p) ? 0.45 : 0.2} />}
        <rect x="10" y="10" width="280" height="540" rx="40" fill={vec(p) ? '#141A24' : p.ink} {...sk(p)} />
        <clipPath id={`scr-${uid}`}><rect x="24" y="44" width="252" height="480" rx="22" /></clipPath>
        <g clipPath={`url(#scr-${uid})`}>
          <rect x="24" y="44" width="252" height="480" fill={future ? '#1B1340' : vec(p) ? '#0E1A2B' : p.base} />
          {[-1, 0, 1, 2].map((i) => {
            const y = 44 + i * 440 - off + 440;
            const col = FEED[(i + Math.floor((t * speed * 180) / 440) + 12) % FEED.length];
            return (
              <g key={i} transform={`translate(0,${y - 440})`}>
                <rect x="34" y="54" width="232" height="420" rx="16" fill={col} opacity={vec(p) ? 0.85 : 0.5} />
                <circle cx="150" cy="230" r="46" fill="#fff" opacity="0.25" />
                <path d="M138,208 L170,230 L138,252 Z" fill="#fff" opacity="0.8" />
                {[0, 1, 2].map((k) => <circle key={k} cx="246" cy={300 + k * 44} r="12" fill="#fff" opacity="0.55" />)}
                <rect x="48" y="420" width="140" height="10" rx="5" fill="#fff" opacity="0.6" />
                <rect x="48" y="440" width="90" height="10" rx="5" fill="#fff" opacity="0.4" />
              </g>
            );
          })}
          {future && <rect x="24" y="44" width="252" height="480" fill="none" stroke={C.accent4} strokeWidth="6" opacity={0.5 + 0.3 * Math.sin(t * 3)} />}
        </g>
        <rect x="120" y="22" width="60" height="10" rx="5" fill="#000" opacity="0.6" />
      </g>
    );
  },
};

// ---------- ไอคอนแอปทั่วไป (ไม่ใช่โลโก้จริง) ----------
export const appIcon: AssetDef = {
  vb: [240, 240],
  draw: ({p, props}) => {
    const col = (props.color as string) ?? (vec(p) ? '#FF6B4A' : p.red);
    const glyph = (props.glyph as string) ?? 'play';
    return (
      <g>
        <rect x="14" y="14" width="212" height="212" rx="54" fill={col} {...sk(p)} />
        <rect x="14" y="14" width="212" height="100" rx="54" fill="#fff" opacity="0.12" />
        {glyph === 'note'
          ? <g fill="#fff"><rect x="128" y="60" width="14" height="96" rx="6" /><ellipse cx="112" cy="160" rx="30" ry="22" /><path d="M136,60 q40,6 46,40 q-18,-18 -46,-16 Z" /></g>
          : <path d="M92,70 L170,120 L92,170 Z" fill="#fff" />}
      </g>
    );
  },
};

// ---------- เชฟ (ตัวละครสมมติ ตัวกลมใส่หมวกเชฟ) + สมุดจด ----------
export const chef: AssetDef = {
  vb: [320, 420],
  draw: ({p, t, props, uid}) => {
    const write = props.write !== false;
    const body = vec(p) ? '#F4F1EA' : p.base;
    const pen = Math.sin(t * 9) * 6;
    return (
      <g>
        <ellipse cx="160" cy="410" rx="100" ry="10" fill="#000" opacity="0.18" />
        <path d="M70,400 C60,300 80,200 160,200 C240,200 260,300 250,400 Z" fill={body} {...sk(p)} />
        <path d="M70,400 C60,300 80,200 160,200 C120,230 110,320 120,400 Z" fill={shadeFill(p, uid, vec(p) ? '#D6D9E4' : p.mid)} opacity="0.6" />
        {[250, 290, 330].map((y) => <circle key={y} cx="160" cy={y} r="7" fill={vec(p) ? '#5B7299' : p.ink} />)}
        <circle cx="160" cy="150" r="72" fill={vec(p) ? '#F2B38F' : p.skin} {...sk(p)} />
        <path d="M96,96 C80,40 130,20 150,44 C160,10 210,14 214,50 C250,40 262,90 226,104 L226,120 L98,120 Z" fill={body} {...sk(p)} />
        <rect x="98" y="104" width="128" height="24" rx="6" fill={vec(p) ? '#E6E1D6' : p.mid} {...sk(p, 0.6)} />
        <circle cx="136" cy="156" r="8" fill={p.ink} /><circle cx="184" cy="156" r="8" fill={p.ink} />
        <path d="M138,186 q22,18 44,0" stroke={p.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M120,182 q-14,-4 -20,6 M200,182 q14,-4 20,6" stroke={vec(p) ? '#6B3E26' : p.ink} strokeWidth="7" strokeLinecap="round" fill="none" />
        {write && (
          <g>
            <rect x="178" y="250" width="110" height="130" rx="8" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} transform="rotate(-8 233 315)" />
            {[0, 1, 2, 3].map((k) => <path key={k} d={`M${196},${280 + k * 22} h${60 - (k % 2) * 20}`} stroke={p.ink} strokeWidth="4" opacity="0.5" transform="rotate(-8 233 315)" />)}
            <path d={`M${230 + pen},${300} l40,-50`} stroke={p.ink} strokeWidth="7" strokeLinecap="round" />
          </g>
        )}
      </g>
    );
  },
};

export const buffetPlate: AssetDef = {
  vb: [320, 220],
  draw: ({p, props, uid}) => {
    const empty = props.empty === true;
    const col = (props.color as string) ?? (vec(p) ? '#FF6B4A' : p.red);
    return (
      <g>
        <ellipse cx="160" cy="170" rx="150" ry="40" fill={vec(p) ? '#F4F1EA' : p.base} {...sk(p)} />
        <ellipse cx="160" cy="166" rx="110" ry="26" fill={shadeFill(p, uid, vec(p) ? '#D6D9E4' : p.mid)} opacity="0.6" />
        {!empty && (
          <g>
            <path d="M80,160 C80,90 240,90 240,160 Z" fill={col} {...sk(p)} />
            <ellipse cx="130" cy="120" rx="22" ry="10" fill="#fff" opacity="0.3" />
            {[0, 1, 2].map((k) => <circle key={k} cx={120 + k * 40} cy={138 - (k % 2) * 10} r="12" fill={vec(p) ? C.accent2 : p.gold} />)}
          </g>
        )}
        {empty && <path d="M110,160 q50,-10 100,0" stroke={p.ink} strokeWidth="4" opacity="0.3" fill="none" />}
      </g>
    );
  },
};

export const restaurant: AssetDef = {
  vb: [420, 360],
  draw: ({p, props, uid}) => {
    const big = props.big === true;
    const w = big ? 400 : 260;
    const x0 = (420 - w) / 2;
    const awn = (props.color as string) ?? (vec(p) ? '#FF6B4A' : p.red);
    return (
      <g>
        <rect x={x0} y="110" width={w} height="240" fill={vec(p) ? '#F4ECDC' : p.base} {...sk(p)} />
        <rect x={x0} y="110" width={w * 0.3} height="240" fill={shadeFill(p, uid, vec(p) ? '#D9CDB5' : p.mid)} opacity="0.5" />
        {Array.from({length: big ? 8 : 5}).map((_, i) => (
          <path key={i} d={`M${x0 + (i * w) / (big ? 8 : 5)},110 l${w / (big ? 8 : 5)},0 l0,40 q-${w / (big ? 16 : 10)},24 -${w / (big ? 8 : 5)},0 Z`} fill={i % 2 ? '#fff' : awn} {...sk(p, 0.6)} />
        ))}
        <rect x={x0 + 20} y="60" width={w - 40} height="46" rx="10" fill={vec(p) ? '#1C3350' : p.ink} />
        <rect x={x0 + w / 2 - 36} y="230" width="72" height="120" rx="6" fill={vec(p) ? '#6B3E26' : p.coffee} {...sk(p, 0.6)} />
        <rect x={x0 + 24} y="190" width={w / 2 - 70} height="80" rx="6" fill={vec(p) ? '#9CD3F0' : p.sky2} opacity="0.8" {...sk(p, 0.6)} />
        <rect x={x0 + w / 2 + 46} y="190" width={w / 2 - 70} height="80" rx="6" fill={vec(p) ? '#9CD3F0' : p.sky2} opacity="0.8" {...sk(p, 0.6)} />
      </g>
    );
  },
};

// ---------- ไอคอนสัญญาณฟีด (ทั่วไป) ----------
export const signalIcon: AssetDef = {
  vb: [200, 200],
  draw: ({p, props}) => {
    const k = (props.kind as string) ?? 'like';
    const bg = {like: '#FF5A6E', share: '#3FD6C6', comment: '#5B8DEF', note: '#B28CFF', hashtag: '#FFC94A', globe: '#3FA7FF', play: '#FF6B4A', follow: '#9AA3B5'}[k] ?? '#9AA3B5';
    const g = {
      like: <path d="M100,150 C60,120 44,100 44,78 C44,60 58,48 74,48 C86,48 96,56 100,66 C104,56 114,48 126,48 C142,48 156,60 156,78 C156,100 140,120 100,150 Z" fill="#fff" />,
      share: <path d="M60,130 C70,90 100,76 130,76 L130,56 L160,90 L130,124 L130,104 C104,104 80,112 60,130 Z" fill="#fff" />,
      comment: <path d="M50,60 h100 a14,14 0 0 1 14,14 v46 a14,14 0 0 1 -14,14 h-56 l-26,22 v-22 h-18 a14,14 0 0 1 -14,-14 v-46 a14,14 0 0 1 14,-14 Z" fill="#fff" />,
      note: <g fill="#fff"><rect x="104" y="46" width="12" height="80" rx="5" /><ellipse cx="92" cy="130" rx="24" ry="18" /><path d="M110,46 q34,6 38,34 q-14,-14 -38,-12 Z" /></g>,
      hashtag: <text x="100" y="138" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="110" fill="#fff">#</text>,
      globe: <g stroke="#fff" strokeWidth="9" fill="none"><circle cx="100" cy="100" r="50" /><ellipse cx="100" cy="100" rx="22" ry="50" /><path d="M50,100 h100" /></g>,
      play: <path d="M80,60 L146,100 L80,140 Z" fill="#fff" />,
      follow: <g fill="#fff"><circle cx="90" cy="80" r="24" /><path d="M46,150 c4,-34 84,-34 88,0 Z" /><path d="M140,70 v40 M120,90 h40" stroke="#fff" strokeWidth="10" strokeLinecap="round" /></g>,
    }[k];
    return <g><circle cx="100" cy="100" r="92" fill={vec(p) ? bg : p.base} {...sk(p)} />{g}</g>;
  },
};

// ---------- สมุดจดของเชฟ ----------
export const notebook: AssetDef = {
  vb: [360, 440],
  draw: ({p, t}) => {
    const lines = Math.min(8, Math.floor(t * 2.5));
    return (
      <g>
        <rect x="20" y="20" width="320" height="400" rx="16" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} />
        <rect x="44" y="44" width="272" height="352" rx="8" fill={vec(p) ? '#FFF8E6' : p.base} />
        {Array.from({length: lines}).map((_, i) => (
          <g key={i}><circle cx="70" cy={84 + i * 40} r="7" fill={vec(p) ? FEED[i % FEED.length] : p.ink} />
            <path d={`M90,${84 + i * 40} h${120 + rnd(i) * 80}`} stroke={p.ink} strokeWidth="5" strokeLinecap="round" opacity="0.5" /></g>
        ))}
        {Array.from({length: 6}).map((_, i) => <circle key={i} cx="20" cy={70 + i * 60} r="8" fill={p.ink} />)}
      </g>
    );
  },
};

// ---------- ปฏิทินทั้งปี (data moment) ----------
export const calendarYear: AssetDef = {
  vb: [1100, 560],
  draw: ({p, t, props}) => {
    const hi = (props.highlight as number) ?? 25;
    const k = clamp01((t - 0.3) / 1.6);
    const on = Math.round(hi * k);
    const cols = 37;
    return (
      <g>
        <rect x="0" y="0" width="1100" height="560" rx="24" fill={vec(p) ? '#152238' : p.base} {...sk(p)} />
        {Array.from({length: 365}).map((_, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          const lit = i < on;
          return <rect key={i} x={40 + c * 28} y={50 + r * 48} width="22" height="36" rx="5"
            fill={lit ? (vec(p) ? C.accent1 : p.red) : vec(p) ? '#2B4A73' : p.mid} opacity={lit ? 1 : 0.8} />;
        })}
      </g>
    );
  },
};

// ---------- ป้ายราคา / เวทีสปอตไลต์ / ห้องนอน / ไม้บรรทัดยืด ----------
export const priceTag: AssetDef = {
  vb: [460, 240],
  draw: ({p, props}) => (
    <g transform="rotate(-6 230 120)">
      <path d="M60,30 L420,30 L420,210 L60,210 L10,120 Z" fill={vec(p) ? '#F4ECDC' : p.base} {...sk(p)} />
      <circle cx="56" cy="120" r="12" fill={vec(p) ? '#0E1A2B' : p.ink} />
      <text x="240" y="140" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize={(props.size as number) ?? 64} fill={vec(p) ? '#B8431F' : p.red}>{(props.text as string) ?? '$'}</text>
    </g>
  ),
};

export const spotlightStage: AssetDef = {
  vb: [800, 600],
  draw: ({p, t}) => (
    <g>
      <path d={`M${360 + Math.sin(t) * 20},0 L${440 + Math.sin(t) * 20},0 L620,520 L180,520 Z`} fill={vec(p) ? '#FFE6A6' : p.glow} opacity="0.35" />
      <ellipse cx="400" cy="520" rx="260" ry="50" fill={vec(p) ? '#FFE6A6' : p.glow} opacity="0.5" />
      <rect x="80" y="520" width="640" height="70" rx="12" fill={vec(p) ? '#6B3E26' : p.coffee} {...sk(p)} />
    </g>
  ),
};

export const bedroom: AssetDef = {
  vb: [1920, 1080],
  draw: ({p}) => (
    <g>
      <rect width="1920" height="1080" fill={vec(p) ? '#0B1322' : p.deep} />
      <rect x="1240" y="140" width="420" height="340" rx="10" fill={vec(p) ? '#15284A' : p.mid} stroke={vec(p) ? '#22385C' : p.ink} strokeWidth="18" />
      <circle cx="1540" cy="240" r="46" fill="#FFF3C4" opacity="0.8" />
      <path d="M0,760 L1920,720 L1920,1080 L0,1080 Z" fill={vec(p) ? '#141D30' : p.shade} />
      <path d="M140,700 C140,640 200,620 300,620 L1100,620 C1180,620 1220,660 1220,720 L1220,900 L140,900 Z" fill={vec(p) ? '#23355A' : p.mid} {...sk(p)} />
      <path d="M180,620 C180,560 240,540 330,560 L520,600 L520,640 L180,640 Z" fill={vec(p) ? '#2E4775' : p.base} {...sk(p)} />
    </g>
  ),
};

export const stretchRuler: AssetDef = {
  vb: [1200, 160],
  draw: ({p, t, props}) => {
    const to = (props.to as number) ?? 1;
    const from = (props.from as number) ?? to;
    const k = clamp01((t - 0.2) / 1.0);
    const len = 1180 * (from + (to - from) * k);
    return (
      <g>
        <rect x="10" y="40" width={len} height="80" rx="12" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} />
        {Array.from({length: Math.floor(len / 24)}).map((_, i) => <rect key={i} x={26 + i * 24} y="40" width="4" height={i % 5 ? 20 : 40} fill={p.ink} />)}
      </g>
    );
  },
};

export const coinStack: AssetDef = {
  vb: [300, 300],
  draw: ({p}) => (
    <g>
      {Array.from({length: 7}).map((_, i) => (
        <g key={i}><ellipse cx="150" cy={250 - i * 26} rx="100" ry="30" fill={vec(p) ? '#E0A526' : p.gold} {...sk(p)} />
          <ellipse cx="150" cy={244 - i * 26} rx="100" ry="30" fill={vec(p) ? C.accent2 : p.gold} {...sk(p)} /></g>
      ))}
      <text x="150" y={96} textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="60" fill={vec(p) ? '#8E5A00' : p.ink}>$</text>
    </g>
  ),
};
