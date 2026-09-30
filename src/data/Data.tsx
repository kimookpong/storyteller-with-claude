import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useVideoConfig} from 'remotion';

/** แนวตั้ง (9:16) = จอแคบ → ย่อกราฟ/ตัวเลข */
const usePortrait = () => { const v = useVideoConfig(); return v.height > v.width; };
import {geoNaturalEarth1, geoPath} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import type {DataSpec, Era} from '../types';
import {ERAS} from '../era/eras';
import {C, FONT, W, H} from '../theme/tokens';
import {Asset} from '../assets/Asset';

const LAND = feature(world as any, (world as any).objects.countries) as any;
const ease = Easing.out(Easing.exp);

const Counter: React.FC<{d: Extract<DataSpec, {chart: 'counter'}>; t: number; dur: number; vintage: boolean}> = ({d, t, dur, vintage}) => {
  const end = Math.min(2.2, dur * 0.7);
  const k = interpolate(t, [0.2, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const dec = d.decimals ?? 0;
  const v = (d.to * k).toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec});
  const portrait = usePortrait();
  const digits = d.to.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}).length;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', padding: portrait ? '0 90px' : 0}}>
      <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: portrait ? Math.min(170, Math.floor(1500 / Math.max(5, digits))) : 190, color: vintage ? C.marker : C.accent2, lineHeight: 1.2, textShadow: vintage ? '0 5px 0 rgba(242,232,213,0.9)' : '0 10px 50px rgba(0,0,0,0.45)', fontVariantNumeric: 'tabular-nums'}}>
        {v}
      </div>
      {d.suffix && <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 70, color: vintage ? '#2A1E14' : C.white, lineHeight: 1.45}}>{d.suffix}</div>}
      {d.label && <div style={{fontFamily: FONT.body, fontWeight: 500, fontSize: 40, color: vintage ? '#2A1E14' : C.white, opacity: 0.85, marginTop: 10, lineHeight: 1.45}}>{d.label}</div>}
    </AbsoluteFill>
  );
};

const Bar: React.FC<{d: Extract<DataSpec, {chart: 'bar'}>; t: number; fps: number}> = ({d, t, fps}) => {
  const max = Math.max(...d.items.map((x) => x.value));
  const portrait = usePortrait();
  const barMax = portrait ? 420 : 1000;
  return (
    <AbsoluteFill style={{padding: portrait ? '320px 90px' : '150px 220px', justifyContent: 'center'}}>
      {d.title && <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 60, color: C.white, marginBottom: 40, lineHeight: 1.45}}>{d.title}</div>}
      {d.items.map((it, i) => {
        const s = t < 0.2 + i * 0.25 ? 0 : spring({frame: (t - 0.2 - i * 0.25) * fps, fps, config: {damping: 18}});
        const col = it.highlight ? C.accent1 : '#5B7299';
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', margin: '18px 0'}}>
            <div style={{width: portrait ? 230 : 280, flex: 'none', fontFamily: FONT.body, fontWeight: 600, fontSize: portrait ? 38 : 44, color: C.white, lineHeight: 1.45}}>{it.label}</div>
            <div style={{height: 78, width: (it.value / max) * barMax * s, background: col, borderRadius: 14, boxShadow: it.highlight ? `0 0 40px ${C.accent1}88` : 'none'}} />
            <div style={{marginLeft: 24, fontFamily: FONT.display, fontWeight: 700, fontSize: 56, color: it.highlight ? C.accent2 : C.white, opacity: s}}>
              {Math.round(it.value * s)}{d.unit}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Unit: React.FC<{d: Extract<DataSpec, {chart: 'unit'}>; t: number; fps: number}> = ({d, t, fps}) => {
  const cols = d.cols ?? (usePortrait() ? 5 : 10);
  const size = d.size ?? 110;
  // highlight = ไอคอน N ตัวแรกเต็ม ที่เหลือจาง (เช่น 65 จาก 77) · ขึ้นทีละตัวรวมไม่เกิน ~1.6 วิ
  const stepT = Math.min(0.06, 1.6 / Math.max(1, d.count));
  const hi = d.highlight ?? d.count;
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, ${size}px)`, gap: Math.round(size * 0.16)}}>
        {Array.from({length: d.count}).map((_, i) => {
          const tl = t - 0.2 - i * stepT;
          const s = tl < 0 ? 0 : spring({frame: tl * fps, fps, config: {damping: 11}});
          const fillAt = 0.4 + d.count * stepT + i * stepT * 0.5;
          const on = i < hi && t >= fillAt;
          return (
            <div key={i} style={{transform: `scale(${s})`}}>
              <Asset name={d.icon ?? 'farmer'} t={t} dur={1} width={size} props={d.highlight != null ? {dim: !on} : undefined} />
            </div>
          );
        })}
      </div>
      <div style={{marginTop: 40, fontFamily: FONT.body, fontWeight: 600, fontSize: 44, color: C.white, lineHeight: 1.45}}>{d.label}</div>
      <div style={{marginTop: 6, fontFamily: FONT.body, fontSize: 30, color: C.white, opacity: 0.7}}>1 ตัว = {d.perIcon}</div>
    </AbsoluteFill>
  );
};

const MapChart: React.FC<{d: Extract<DataSpec, {chart: 'map'}>; t: number; dur: number; era: Era}> = ({d, t, dur, era}) => {
  const vintage = ERAS[era].vintage;
  const {width: W, height: H} = useVideoConfig();
  const k = interpolate(t, [0, dur], [0, 1], {easing: Easing.inOut(Easing.cubic)});
  const to = d.to ?? d.from;
  const center: [number, number] = [d.from.center[0] + (to.center[0] - d.from.center[0]) * k, d.from.center[1] + (to.center[1] - d.from.center[1]) * k];
  const scale = d.from.scale * Math.pow(to.scale / d.from.scale, k);
  const proj = geoNaturalEarth1().rotate([-center[0], 0]).center([0, center[1]]).scale(scale).translate([W / 2, H / 2]);
  const path = geoPath(proj);
  const ink = vintage ? '#3A2A18' : '#10213A';
  return (
    <AbsoluteFill>
      <svg width={W} height={H}>
        <rect width={W} height={H} fill={vintage ? '#CDBB98' : '#0E1A2B'} />
        <path d={path({type: 'Sphere'} as any) ?? ''} fill={vintage ? '#B9C4B6' : '#16304F'} />
        {LAND.features.map((f: any, i: number) => (
          <path key={i} d={path(f) ?? ''} fill={vintage ? '#EADCBF' : '#2B4A73'} stroke={vintage ? ink : '#0E1A2B'} strokeWidth={vintage ? 1.6 : 1.2} />
        ))}
        {(d.routes ?? []).map((r, i) => {
          const prog = interpolate(t, [(r.delay ?? 0.3), (r.delay ?? 0.3) + 1.6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
          const dd = path({type: 'LineString', coordinates: r.path} as any) ?? '';
          return (
            <g key={i}>
              <path d={dd} fill="none" stroke={r.color ?? (vintage ? C.marker : C.accent2)} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - prog} />
            </g>
          );
        })}
        {(d.pins ?? []).map((pn, i) => {
          const xy = proj(pn.at);
          if (!xy) return null;
          const tl = t - (pn.delay ?? 0.4);
          const s = tl < 0 ? 0 : Math.min(1, tl / 0.25);
          return (
            <g key={i} transform={`translate(${xy[0]},${xy[1]})`} opacity={s}>
              <circle r={14 * s} fill={vintage ? C.marker : C.accent1} stroke="#fff" strokeWidth="4" />
              <text y={-30} textAnchor="middle" fontFamily={FONT.display} fontWeight={600} fontSize="44" fill={vintage ? ink : '#fff'} stroke={vintage ? '#F2E8D5' : '#0E1A2B'} strokeWidth="8" paintOrder="stroke">{pn.label}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

export const DataLayer: React.FC<{d: DataSpec; t: number; dur: number; fps: number; era: Era}> = ({d, t, dur, fps, era}) => {
  if (d.chart === 'counter') return <Counter d={d} t={t} dur={dur} vintage={ERAS[era].vintage} />;
  if (d.chart === 'bar') return <Bar d={d} t={t} fps={fps} />;
  if (d.chart === 'unit') return <Unit d={d} t={t} fps={fps} />;
  return <MapChart d={d} t={t} dur={dur} era={era} />;
};
