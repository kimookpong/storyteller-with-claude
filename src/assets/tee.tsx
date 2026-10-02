// asset ของเรื่อง "ที' ลมฟ้าอากาศ คือใคร" (projects/tee-person) — การ์ตูนสดใส · ไม่มีใบหน้าของบุคคลจริง
// metaphor: เสียงเตือนจากหลังม่าน (เงาถือร่ม ไม่มีหน้า) → ม่านเปิดเจอแค่ร่ม + "?" · มาสคอต: ก้อนเมฆน้อย
import React from 'react';
import {AssetDef, rnd} from './core';
import {sk, Pal} from './palette';
import {FONT, C} from '../theme/tokens';

const vec = (p: Pal) => p.style === 'vector';
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

// ---------- หน้าต่างม่าน — props.open 0–1 · opening (เปิดตามเวลา at→+1.2s) · shadow (เงาถือร่มบนม่าน) · empty (ห้องว่าง: ร่ม + "?") ----------
export const curtainWindow: AssetDef = {
  vb: [700, 820],
  draw: ({p, t, props, uid}) => {
    const at = (props.at as number) ?? 0.4;
    const open = props.opening ? ease((t - at) / 1.2) : clamp01((props.open as number) ?? 0);
    const wall = vec(p) ? '#FFE3B3' : p.base, frame = vec(p) ? '#8A5A3C' : p.coffee, cur = vec(p) ? '#FF7A7A' : p.red, curD = vec(p) ? '#E0585E' : p.deep;
    const room = vec(p) ? '#FFF6D8' : p.mid;
    const sway = Math.sin(t * 2) * 4;
    const halfW = 250 * (1 - open * 0.78);
    return (
      <g>
        <rect x="20" y="20" width="660" height="780" rx="40" fill={wall} {...sk(p)} />
        <rect x="80" y="100" width="540" height="560" rx="24" fill={frame} />
        <rect x="100" y="120" width="500" height="520" rx="14" fill={room} />
        <defs><radialGradient id={`lt-${uid}`}><stop offset="0" stopColor="#FFF3B0" stopOpacity="0.9" /><stop offset="1" stopColor="#FFF3B0" stopOpacity="0" /></radialGradient></defs>
        {open > 0.05 && <circle cx="350" cy="380" r={260 * open} fill={`url(#lt-${uid})`} />}
        {props.empty && open > 0.3 && (
          <g opacity={clamp01((open - 0.3) / 0.4)}>
            <path d="M300,600 L420,300" stroke="#3A3A4A" strokeWidth="10" strokeLinecap="round" />
            <path d="M330,330 Q420,240 520,300 Q470,300 420,300 Q380,295 330,330 Z" fill={vec(p) ? '#4C8DFF' : p.sea} />
            <path d="M420,300 L420,285" stroke="#3A3A4A" strokeWidth="8" />
            <rect x="180" y="420" width="120" height="150" rx="16" fill="#fff" {...sk(p)} />
            <text x="240" y="530" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="110" fill={vec(p) ? C.accent1 : p.red}>?</text>
          </g>
        )}
        <rect x="90" y="96" width="520" height="22" rx="11" fill={frame} />
        {[0, 1].map((k) => {
          const x0 = k ? 600 - halfW : 100;
          return (
            <g key={k}>
              <path d={`M${x0},118 L${x0 + halfW},118 Q${x0 + halfW + (k ? -1 : 1) * sway},380 ${x0 + halfW},640 L${x0},640 Z`} fill={cur} {...sk(p)} />
              {[0.25, 0.5, 0.75].map((f) => <path key={f} d={`M${x0 + halfW * f},125 L${x0 + halfW * f + sway * 0.5},635`} stroke={curD} strokeWidth="6" opacity="0.5" />)}
            </g>
          );
        })}
        {props.shadow && open < 0.4 && (
          <g fill="#3B2440" opacity={0.55 * (1 - open / 0.4)}>
            <circle cx="350" cy="330" r="46" />
            <path d="M290,640 Q290,420 350,400 Q410,420 410,640 Z" />
            <path d="M250,300 Q350,190 450,300 Z" />
            <path d="M350,300 L350,420" stroke="#3B2440" strokeWidth="8" />
          </g>
        )}
        <rect x="60" y="660" width="580" height="34" rx="12" fill={frame} />
        {[0, 1, 2].map((i) => <circle key={i} cx={190 + i * 160} cy="730" r="26" fill={vec(p) ? '#7BD389' : p.green} />)}
      </g>
    );
  },
};

// ---------- ก้อนเมฆน้อย (มาสคอต) — props.expr curious|shock|happy · umbrella · q (เครื่องหมาย ?) ----------
export const cloudKid: AssetDef = {
  vb: [440, 400],
  draw: ({p, t, props}) => {
    const expr = (props.expr as string) ?? 'curious';
    const bob = Math.sin(t * 2.4) * 6;
    const body = vec(p) ? '#FFFFFF' : p.base, sh = vec(p) ? '#D8E6F7' : p.mid, ink = '#2B2F45';
    return (
      <g transform={`translate(0,${bob})`}>
        {props.umbrella && (
          <g>
            <path d="M330,260 L330,110" stroke={ink} strokeWidth="8" strokeLinecap="round" />
            <path d="M230,120 Q330,20 430,120 Q400,105 380,120 Q355,100 330,120 Q305,100 280,120 Q260,105 230,120 Z" fill={vec(p) ? '#FFC94A' : p.gold} {...sk(p)} />
          </g>
        )}
        <path d="M80,300 Q30,300 40,250 Q30,190 100,190 Q110,120 190,130 Q240,80 300,140 Q380,140 370,210 Q420,230 395,285 Q390,310 340,305 Z" fill={body} {...sk(p)} />
        <path d="M80,300 L340,305 Q390,310 395,285 Q350,300 80,292 Z" fill={sh} />
        {expr === 'shock' ? <><circle cx="170" cy="225" r="14" fill={ink} /><circle cx="270" cy="225" r="14" fill={ink} /><ellipse cx="220" cy="270" rx="16" ry="20" fill={ink} /></>
          : expr === 'happy' ? <><path d="M150,228 Q170,208 190,228" stroke={ink} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M250,228 Q270,208 290,228" stroke={ink} strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M195,258 Q220,282 245,258" stroke={ink} strokeWidth="8" fill="none" strokeLinecap="round" /></>
          : <><circle cx="170" cy="228" r="11" fill={ink} /><circle cx="270" cy="222" r="11" fill={ink} /><path d="M200,268 Q222,260 244,268" stroke={ink} strokeWidth="7" fill="none" strokeLinecap="round" /></>}
        <circle cx="140" cy="258" r="14" fill="#FF9FB2" opacity="0.6" /><circle cx="300" cy="254" r="14" fill="#FF9FB2" opacity="0.6" />
        {props.q && <text x="90" y="120" fontFamily={FONT.display} fontWeight={700} fontSize="110" fill={vec(p) ? C.accent2 : p.gold} transform={`rotate(${-10 + Math.sin(t * 3) * 6} 110 90)`}>?</text>}
        {expr === 'shock' && [0, 1, 2].map((i) => <path key={i} d={`M${60 + i * 20},${150 - i * 8} l-20,-18`} stroke={ink} strokeWidth="6" strokeLinecap="round" />)}
      </g>
    );
  },
};

// ---------- ซอยการ์ตูน — props.rain (ฝนตก) · alerts (จำนวนมือถือเด้ง "แชร์!") · dry (หลังฝน มีแดด) ----------
export const rainStreet: AssetDef = {
  vb: [1600, 1000],
  draw: ({p, t, props}) => {
    const cols = ['#FFB86B', '#7FC8F8', '#FF8FA3', '#9BE3A0', '#C9A7FF', '#FFD76B'];
    const n = (props.alerts as number) ?? 0;
    return (
      <g>
        {props.dry && <circle cx="1350" cy="160" r="90" fill="#FFD84D" />}
        {Array.from({length: 6}).map((_, i) => {
          const x = 30 + i * 262, h = 380 + rnd(i) * 180, y = 760 - h;
          const col = vec(p) ? cols[i] : [p.base, p.mid, p.coffeeLight][i % 3];
          return (
            <g key={i}>
              <rect x={x} y={y} width="230" height={h} rx="18" fill={col} {...sk(p)} />
              <path d={`M${x - 16},${y + 10} L${x + 115},${y - 90} L${x + 246},${y + 10} Z`} fill={vec(p) ? '#E0585E' : p.red} {...sk(p)} />
              {[0, 1].map((r) => [0, 1].map((c) => <rect key={`${r}${c}`} x={x + 34 + c * 96} y={y + 50 + r * 120} width="66" height="80" rx="10" fill="#FFF6C8" opacity="0.9" />))}
              <rect x={x + 80} y={760 - 120} width="70" height="120" rx="10" fill="#7A4A30" />
              {i < n && (() => { const k = clamp01((t - 0.3 - i * 0.25) / 0.2); return k > 0 && (
                <g transform={`translate(${x + 115},${y - 150}) scale(${k})`}>
                  <rect x="-80" y="-44" width="160" height="70" rx="20" fill="#fff" {...sk(p)} />
                  <path d="M-10,26 L0,48 L10,26 Z" fill="#fff" />
                  <text x="0" y="6" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="38" fill={vec(p) ? C.accent1 : p.red}>แชร์!</text>
                </g>); })()}
            </g>
          );
        })}
        <rect x="0" y="760" width="1600" height="240" fill={vec(p) ? '#6B7A99' : p.shade} />
        {props.rain && <ellipse cx="800" cy="880" rx="700" ry="50" fill="#9CC9F5" opacity="0.6" />}
        {props.rain && Array.from({length: 70}).map((_, i) => {
          const x = rnd(i * 3) * 1600, sp = 600 + rnd(i) * 300, y = ((t * sp + rnd(i * 7) * 1000) % 1000);
          return <path key={i} d={`M${x},${y} l-10,34`} stroke="#CFE8FF" strokeWidth="5" strokeLinecap="round" opacity="0.8" />;
        })}
      </g>
    );
  },
};

// ---------- มือถือการ์ตูน — จอว่าง (วางรูปจริงทับได้) · props.notif ข้อความแจ้งเตือนเด้ง ----------
export const phoneCartoon: AssetDef = {
  vb: [360, 640],
  draw: ({p, t, props}) => (
    <g transform={`rotate(${Math.sin(t * 1.5) * 2} 180 320)`}>
      <rect x="10" y="10" width="340" height="620" rx="48" fill={vec(p) ? '#2B2F45' : p.ink} {...sk(p)} />
      <rect x="30" y="70" width="300" height="490" rx="16" fill={vec(p) ? '#DDEBFF' : p.base} />
      <rect x="140" y="34" width="80" height="14" rx="7" fill="#555" />
      <circle cx="180" cy="596" r="18" fill="#555" />
      {props.notif && (() => { const k = ease((t - 0.3) / 0.4); return (
        <g transform={`translate(0,${(1 - k) * -60})`} opacity={k}>
          <rect x="40" y="84" width="280" height="80" rx="14" fill="#fff" />
          <circle cx="76" cy="124" r="18" fill={vec(p) ? C.accent1 : p.red} />
          <text x="104" y="134" fontFamily={FONT.display} fontWeight={700} fontSize="30" fill="#2B2F45">{props.notif as string}</text>
        </g>); })()}
    </g>
  ),
};

// ---------- บอร์ดประกาศ (ติดรูปจริงทับ) — props.title ----------
export const noticeBoard: AssetDef = {
  vb: [800, 680],
  draw: ({p, props}) => (
    <g>
      <rect x="20" y="20" width="760" height="640" rx="30" fill={vec(p) ? '#C98B55' : p.coffeeLight} {...sk(p)} />
      <rect x="50" y="110" width="700" height="520" rx="16" fill={vec(p) ? '#E9B87E' : p.base} />
      {Array.from({length: 40}).map((_, i) => <circle key={i} cx={70 + rnd(i) * 660} cy={130 + rnd(i + 50) * 480} r="4" fill="#B07A4A" opacity="0.5" />)}
      <text x="400" y="86" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="54" fill="#fff">{(props.title as string) ?? ''}</text>
      {[[110, 150], [690, 150]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="16" fill={vec(p) ? C.accent1 : p.red} />)}
    </g>
  ),
};

// ---------- ป้ายข่าวลือ — เงาคนไม่มีหน้า + ตรา ✗ (props.at เวลาปั๊ม) ----------
export const rumorSign: AssetDef = {
  vb: [420, 560],
  draw: ({p, t, props}) => {
    const k = clamp01((t - ((props.at as number) ?? 0.6)) / 0.15);
    return (
      <g>
        <rect x="190" y="400" width="40" height="150" fill="#8A5A3C" />
        <rect x="20" y="20" width="380" height="400" rx="26" fill="#fff" {...sk(p)} />
        <g fill="#9AA3B8"><circle cx="210" cy="160" r="70" /><path d="M90,400 Q100,250 210,250 Q320,250 330,400 Z" /></g>
        <text x="210" y="200" textAnchor="middle" fontFamily={FONT.display} fontWeight={700} fontSize="120" fill="#fff" opacity="0.9">?</text>
        {k > 0 && <g opacity={k} transform={`translate(210,220) scale(${1.6 - 0.6 * k}) rotate(-12)`}>
          <path d="M-120,-120 L120,120 M120,-120 L-120,120" stroke={vec(p) ? C.accent1 : p.red} strokeWidth="34" strokeLinecap="round" />
        </g>}
      </g>
    );
  },
};
