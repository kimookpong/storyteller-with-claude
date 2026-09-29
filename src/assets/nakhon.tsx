// asset ของเรื่อง "กำเนิดนครศรี" (projects/nakhon) — วาดเองทั้งหมด ใช้สีจาก palette (rule 10)
// ห้ามโลโก้ UNESCO / ภาพถ่ายโบราณสถานจริง · บุคคลในประวัติศาสตร์เป็นเงาหนังตะลุง ไม่มีใบหน้า (brief)
import React from 'react';
import {AssetDef, rnd, shadeFill} from './core';
import {sk, Pal} from './palette';
import {FONT} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const leather = (p: Pal) => (vec(p) ? {body: '#8C3B2A', dark: '#5E2418', trim: '#FFC94A', hole: '#2A120C'} : {body: p.coffee, dark: p.deep, trim: p.gold, hole: p.ink});

// ---------- Character anchor: น้องคอน — เด็กสไตล์หนังตะลุง (ออกแบบใหม่ ไม่ใช่ตัวหนังดั้งเดิม) ----------
// props.expr: happy · wow · confused · point · bow
export const khonKid: AssetDef = {
  vb: [320, 480],
  draw: ({p, t, props, uid}) => {
    const expr = (props.expr as string) ?? 'happy';
    const L = leather(p);
    const bow = expr === 'bow' ? -18 * clamp01(t / 0.6) : 0;
    const arm = expr === 'point' ? -70 : expr === 'wow' ? -110 + Math.sin(t * 9) * 8 : -20 + Math.sin(t * 3) * 14;
    const holes = Array.from({length: 14}, (_, i) => [118 + (i % 4) * 26 + (rnd(i) - 0.5) * 6, 250 + Math.floor(i / 4) * 30]);
    return (
      <g>
        <ellipse cx="160" cy="468" rx="70" ry="8" fill="#000" opacity="0.18" />
        {/* ไม้ตับ (ไม้คีบตัวหนัง) */}
        <path d="M160,470 L160,300" stroke={vec(p) ? '#C8A27A' : p.mid} strokeWidth="8" strokeLinecap="round" />
        <g transform={`rotate(${bow} 160 380) translate(0,${Math.sin(t * 2.2) * 3})`}>
          {/* ขา */}
          <path d="M132,380 L118,450 L140,452 L152,390 Z M170,390 L184,452 L206,448 L190,380 Z" fill={L.dark} {...sk(p)} />
          {/* ตัว (ผ้านุ่ง + เสื้อ) */}
          <path d="M112,230 Q160,210 208,230 L218,390 Q160,410 102,390 Z" fill={L.body} {...sk(p)} />
          <path d="M104,340 Q160,360 216,340 L218,390 Q160,410 102,390 Z" fill={shadeFill(p, uid, L.dark)} />
          <path d="M112,232 Q160,214 208,232" stroke={L.trim} strokeWidth="7" fill="none" />
          {holes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 4 : 6} fill={L.hole} opacity="0.9" />)}
          {/* แขนหลัง (นิ่ง) */}
          <path d="M116,244 L92,320 L104,326 L128,252 Z" fill={L.dark} />
          {/* หัว — ด้านข้างแบบตัวหนัง แต่ตาสองข้างให้อ่านอารมณ์ง่าย */}
          <circle cx="160" cy="160" r="66" fill={L.body} {...sk(p)} />
          <path d="M112,112 Q160,70 208,112" stroke={L.trim} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M160,94 L150,52 Q160,30 172,52 Z" fill={L.dark} {...sk(p, 0.6)} />
          <circle cx="160" cy="44" r="14" fill={L.dark} />
          <circle cx="160" cy="44" r="5" fill={L.trim} />
          {[0, 1].map((k) => {
            const cx = 138 + k * 44;
            return expr === 'happy' || expr === 'bow'
              ? <path key={k} d={`M${cx - 11},162 q11,-12 22,0`} stroke="#FBEBD5" strokeWidth="6" fill="none" strokeLinecap="round" />
              : <g key={k}><ellipse cx={cx} cy="160" rx="12" ry={expr === 'wow' ? 16 : 13} fill="#FBEBD5" /><circle cx={cx + 2} cy="162" r="6" fill={L.hole} /></g>;
          })}
          {expr === 'confused' && <path d="M124,138 L150,146 M196,136 L170,146" stroke="#FBEBD5" strokeWidth="5" strokeLinecap="round" />}
          {expr === 'wow' ? <ellipse cx="160" cy="196" rx="10" ry="13" fill={L.hole} />
            : expr === 'confused' ? <path d="M146,198 q7,-6 14,0 q7,6 14,0" stroke="#FBEBD5" strokeWidth="5" fill="none" strokeLinecap="round" />
            : <path d="M144,190 Q160,210 176,190" stroke="#FBEBD5" strokeWidth="6" fill="none" strokeLinecap="round" />}
          <circle cx="122" cy="180" r="8" fill={p.red} opacity="0.45" /><circle cx="198" cy="180" r="8" fill={p.red} opacity="0.45" />
          {/* แขนหน้า + ไม้ชักแขน */}
          <g transform={`rotate(${arm} 204 246)`}>
            <path d="M198,240 L270,250 L268,264 L196,256 Z" fill={L.body} {...sk(p, 0.8)} />
            <circle cx="274" cy="257" r="11" fill={L.body} />
            <path d="M274,257 L300,330" stroke={vec(p) ? '#C8A27A' : p.mid} strokeWidth="4" />
          </g>
        </g>
      </g>
    );
  },
};

// ---------- เจดีย์ทรงระฆัง (แบบลังกา) — props.build 0–1 (ไม่ใส่ = ขึ้นเองตามเวลา), cloth, glow ----------
export const chediBell: AssetDef = {
  vb: [420, 640],
  draw: ({p, t, props, uid}) => {
    const build = props.build ?? (props.grow ? clamp01(t / 1.6) : 1);
    const white = vec(p) ? '#F4EFE4' : p.base;
    const shade = vec(p) ? '#D9D0BE' : p.shade;
    const gold = p.gold;
    const clip = 640 - 640 * build;
    return (
      <g>
        {props.glow !== false && <ellipse cx="210" cy="140" rx="200" ry="200" fill={`url(#glow-${uid})`} opacity={0.6 * build} />}
        <clipPath id={`cb-${uid}`}><rect x="0" y={clip} width="420" height="640" /></clipPath>
        <g clipPath={`url(#cb-${uid})`}>
          <rect x="30" y="590" width="360" height="40" rx="4" fill={shade} {...sk(p)} />
          <rect x="60" y="552" width="300" height="40" rx="4" fill={white} {...sk(p)} />
          <rect x="88" y="518" width="244" height="36" rx="4" fill={shade} {...sk(p)} />
          <path d="M92,520 C92,420 150,360 210,356 C270,360 328,420 328,520 Z" fill={white} {...sk(p)} />
          <path d="M92,520 C92,420 150,360 210,356 C170,380 140,440 150,520 Z" fill={shadeFill(p, uid, shade)} opacity="0.7" />
          <rect x="170" y="318" width="80" height="40" fill={white} {...sk(p)} />
          {Array.from({length: 9}, (_, i) => (
            <ellipse key={i} cx="210" cy={306 - i * 20} rx={36 - i * 3.4} ry="9" fill={gold} {...sk(p, 0.6)} />
          ))}
          <path d="M196,130 L210,20 L224,130 Z" fill={gold} {...sk(p, 0.6)} />
          <circle cx="210" cy="22" r="6" fill="#FFF3C4" />
          {props.cloth && (
            <g>
              <path d="M96,470 C150,445 270,445 324,470 L324,500 C270,475 150,475 96,500 Z" fill={p.gold} opacity="0.95" />
              <path d="M104,440 C160,418 262,418 316,440 L318,460 C262,438 160,438 102,460 Z" fill={p.red} opacity="0.9" />
            </g>
          )}
        </g>
      </g>
    );
  },
};

// ---------- ป้าย "มรดกโลก" แบบวาดเอง (ไม่ใช่ตราสัญลักษณ์ UNESCO) ----------
export const heritageBadge: AssetDef = {
  vb: [420, 420],
  draw: ({p, t, props}) => {
    const s = clamp01(t / 0.35);
    const text = (props.text as string) ?? 'มรดกโลก';
    const year = (props.year as string) ?? '2026';
    return (
      <g transform={`translate(210 210) scale(${0.6 + 0.4 * s}) rotate(${-8 + 8 * s})`}>
        <circle r="190" fill={p.gold} opacity="0.25" />
        <circle r="168" fill={vec(p) ? '#0E1A2B' : p.base} stroke={p.gold} strokeWidth="14" />
        {Array.from({length: 16}, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <ellipse key={i} cx={Math.cos(a) * 140} cy={Math.sin(a) * 140} rx="16" ry="7" fill={p.gold} transform={`rotate(${(a * 180) / Math.PI + 90} ${Math.cos(a) * 140} ${Math.sin(a) * 140})`} />;
        })}
        <text y="-6" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="50" fill={vec(p) ? "#FFFFFF" : p.ink}>{text}</text>
        <text y="70" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="58" fill={p.gold}>{year}</text>
      </g>
    );
  },
};

// ---------- แผ่นจารึกหิน (ลายอักษรนามธรรม ไม่ใช่ข้อความจริง) ----------
export const stoneInscription: AssetDef = {
  vb: [360, 500],
  draw: ({p, uid}) => {
    const stone = vec(p) ? '#8E8A80' : p.mid;
    return (
      <g>
        <path d="M30,480 L30,90 Q30,20 180,20 Q330,20 330,90 L330,480 Z" fill={stone} {...sk(p)} />
        <path d="M30,480 L30,90 Q30,20 180,20 Q80,60 70,480 Z" fill={shadeFill(p, uid, vec(p) ? '#6F6B62' : p.shade)} opacity="0.6" />
        {Array.from({length: 11}, (_, r) => (
          <path key={r} d={Array.from({length: 9}, (_, k) => `M${66 + k * 28},${104 + r * 33} q6,-${6 + rnd(r * 9 + k) * 8} 12,0 q4,${4 + rnd(k + r) * 6} 10,0`).join(' ')}
            stroke={vec(p) ? '#4E4A43' : p.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.8" />
        ))}
      </g>
    );
  },
};

// ---------- เงากษัตริย์แบบหนังตะลุง (ไม่มีใบหน้า) ----------
export const shadowKing: AssetDef = {
  vb: [340, 560],
  draw: ({p, t}) => {
    const L = leather(p);
    const sil = vec(p) ? '#1A1A1A' : p.ink;
    return (
      <g transform={`translate(0,${Math.sin(t * 1.6) * 3})`}>
        <path d="M170,550 L170,420" stroke={vec(p) ? '#C8A27A' : p.mid} strokeWidth="8" />
        <path d="M110,240 Q170,215 230,240 L250,430 Q170,452 90,430 Z" fill={sil} />
        {Array.from({length: 12}, (_, i) => <circle key={i} cx={122 + (i % 4) * 32} cy={272 + Math.floor(i / 4) * 44} r="7" fill={L.trim} opacity="0.85" />)}
        <path d="M112,242 Q170,222 228,242" stroke={L.trim} strokeWidth="8" fill="none" />
        <ellipse cx="170" cy="180" rx="52" ry="60" fill={sil} />
        {/* ชฎา */}
        <path d="M122,146 Q170,120 218,146 L200,110 Q186,60 170,20 Q154,60 140,110 Z" fill={L.trim} {...sk(p, 0.6)} />
        <path d="M140,110 Q170,98 200,110 M148,80 Q170,70 192,80" stroke={L.dark} strokeWidth="4" fill="none" />
        <path d="M228,260 L300,300 L292,312 L222,276 Z" fill={sil} />
        <path d="M296,306 L322,390" stroke={vec(p) ? '#C8A27A' : p.mid} strokeWidth="4" />
      </g>
    );
  },
};

// ---------- ชฎา/มงกุฎ — props.fall: ตกลงพื้นแล้วจาง ----------
export const crownFall: AssetDef = {
  vb: [240, 300],
  draw: ({p, t, props}) => {
    const f = props.fall ? clamp01(t / 0.9) : 0;
    const y = f * 90 - (f > 0.8 ? (f - 0.8) * 40 : 0);
    const op = props.fall ? 1 - clamp01((t - 1.4) / 1.2) * 0.75 : 1;
    return (
      <g opacity={op} transform={`translate(0,${y}) rotate(${f * 24} 120 200)`}>
        <path d="M60,200 Q120,170 180,200 L160,150 Q142,80 120,20 Q98,80 80,150 Z" fill={p.gold} {...sk(p)} />
        <path d="M80,150 Q120,134 160,150 M88,112 Q120,100 152,112" stroke={vec(p) ? '#B8862A' : p.ink} strokeWidth="5" fill="none" />
        <circle cx="120" cy="178" r="10" fill={p.red} />
      </g>
    );
  },
};

// ---------- เรือสำเภา (ใบเรือมีโครงไม้ไผ่) ----------
export const junkShip: AssetDef = {
  vb: [560, 480],
  draw: ({p, t, props, uid}) => {
    const sail = (props.color as string) ?? (vec(p) ? '#C9553B' : p.red);
    const hull = vec(p) ? '#5A3426' : p.coffee;
    const sil = props.silhouette ? (vec(p) ? '#101822' : p.ink) : null;
    return (
      <g transform={`rotate(${Math.sin(t * 1.3 + (props.phase ?? 0)) * 3} 280 400)`}>
        {[[190, 70, 160], [320, 110, 130]].map(([x, top, w], i) => (
          <g key={i}>
            <path d={`M${x},${top - 20} L${x},370`} stroke={sil ?? hull} strokeWidth="9" />
            <path d={`M${x - w / 2},${top} L${x + w / 2},${top + 10} L${x + w / 2 + 12},340 L${x - w / 2 + 6},340 Z`} fill={sil ?? sail} {...sk(p)} />
            {!sil && Array.from({length: 6}, (_, k) => <path key={k} d={`M${x - w / 2 + 2},${top + 20 + k * 48} L${x + w / 2 + 4},${top + 30 + k * 48}`} stroke="#3A1E14" strokeWidth="4" opacity="0.6" />)}
          </g>
        ))}
        <path d="M60,350 L500,350 Q480,440 400,450 L150,450 Q80,440 60,350 Z" fill={sil ?? hull} {...sk(p)} />
        {!sil && <path d="M60,350 L500,350 L494,372 L66,372 Z" fill={shadeFill(p, uid, '#3A1E14')} opacity="0.7" />}
        <path d="M60,350 L30,320 L70,345 Z M500,350 L540,300 L505,345 Z" fill={sil ?? hull} />
      </g>
    );
  },
};

// ---------- มือยกโหวต (เอกฉันท์) ----------
export const voteHands: AssetDef = {
  vb: [760, 380],
  draw: ({p, t}) => {
    const cols = ['#F2B38F', '#C98B64', '#E0A27C', '#A86E4E', '#F5C3A0', '#8E5A3E', '#DDA07A'];
    return (
      <g>
        {cols.map((c, i) => {
          const up = clamp01((t - i * 0.08) / 0.35);
          const x = 60 + i * 105;
          return (
            <g key={i} transform={`translate(${x},${380 - 300 * up})`}>
              <rect x="-26" y="120" width="52" height="220" rx="20" fill={vec(p) ? '#3A5A8C' : p.mid} />
              <rect x="-30" y="20" width="60" height="110" rx="26" fill={vec(p) ? c : p.skin} {...sk(p)} />
              {[0, 1, 2, 3].map((k) => <rect key={k} x={-28 + k * 15} y={-18 - (k === 1 || k === 2 ? 10 : 0)} width="12" height="60" rx="6" fill={vec(p) ? c : p.skin} />)}
              <rect x="22" y="40" width="14" height="46" rx="7" fill={vec(p) ? c : p.skin} transform="rotate(-30 29 63)" />
            </g>
          );
        })}
      </g>
    );
  },
};

// ---------- หมุดแผนที่ยักษ์ ----------
export const giantPin: AssetDef = {
  vb: [260, 420],
  draw: ({p}) => (
    <g>
      <ellipse cx="130" cy="404" rx="54" ry="12" fill="#000" opacity="0.25" />
      <path d="M130,400 C90,300 20,240 20,130 A110,110 0 1 1 240,130 C240,240 170,300 130,400 Z" fill={p.red} {...sk(p)} />
      <circle cx="130" cy="128" r="48" fill={vec(p) ? '#FFFFFF' : p.base} />
      <circle cx="130" cy="128" r="20" fill={p.gold} />
    </g>
  ),
};
