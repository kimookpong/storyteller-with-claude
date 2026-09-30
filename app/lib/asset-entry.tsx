// bundle สำหรับเบราว์เซอร์ (HistoryTeller หน้า Asset list) — วาด asset เป็น SVG ด้วยโค้ดเดียวกับวิดีโอ
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {ASSETS} from '../../src/assets/index';
import {Defs} from '../../src/assets/core';
import {VECTOR, COLLAGE} from '../../src/assets/palette';

let n = 0;
export const names = Object.keys(ASSETS).sort();
export const vb = (name: string) => ASSETS[name]?.vb ?? null;
/** คืน SVG string · t = วินาที (ท่าขยับ) · style vector|collage */
export const render = (name: string, o: {t?: number; dur?: number; style?: 'vector' | 'collage'; props?: Record<string, unknown>} = {}) => {
  const def = ASSETS[name];
  if (!def) return '';
  const p = o.style === 'collage' ? COLLAGE : VECTOR;
  const uid = `pv${n++}`;
  const [w, h] = def.vb;
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet" style={{overflow: 'visible', width: '100%', height: '100%'}}>
      <Defs p={p} uid={uid} />
      {def.draw({p, t: o.t ?? 1.5, dur: o.dur ?? 4, props: (o.props ?? {}) as Record<string, any>, uid})}
    </svg>,
  );
};
