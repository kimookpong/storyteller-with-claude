import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import type {Transition} from './eras';

type P = {kind: Transition};

const blobPolygon = (r: number, seed: string, n = 48) =>
  Array.from({length: n})
    .map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.85 + random(`${seed}${i}`) * 0.3);
      return `${50 + Math.cos(a) * rr * 0.5625}% ${50 + Math.sin(a) * rr}%`;
    })
    .join(',');

const tearPolygon = (x: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= 30; i++) pts.push(`${x + (random(`t${i}`) - 0.5) * 3}% ${(i / 30) * 100}%`);
  return `0% 0%, ${pts.join(',')}, 0% 100%`;
};

const Pres: React.FC<TransitionPresentationComponentProps<P>> = ({children, presentationDirection, presentationProgress: p, passedProps}) => {
  const k = passedProps.kind;
  const entering = presentationDirection === 'entering';
  if (k === 'zoom') {
    const s = entering ? 1.25 - 0.25 * p : 1 - 0.15 * p;
    return <AbsoluteFill style={{transform: `scale(${s})`, opacity: entering ? p : 1 - p}}>{children}</AbsoluteFill>;
  }
  if (!entering) return <AbsoluteFill>{children}</AbsoluteFill>;
  if (k === 'dust') {
    // ฝุ่นฟุ้ง: จางผ่านม่านสีดิน
    const veil = p < 0.5 ? p * 2 : (1 - p) * 2;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{opacity: p}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(circle, rgba(190,140,80,0.9) 0%, rgba(90,55,25,0.95) 100%)', opacity: veil * 0.85}} />
      </AbsoluteFill>
    );
  }
  if (k === 'scroll') {
    // ม้วนกระดาษคลี่จากกลางออกด้านข้าง
    const half = p * 52;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `inset(0 ${Math.max(0, 50 - half - 1.5)}% 0 ${Math.max(0, 50 - half - 1.5)}%)`, background: '#D9C49A'}} />
        <AbsoluteFill style={{clipPath: `inset(0 ${Math.max(0, 50 - half)}% 0 ${Math.max(0, 50 - half)}%)`}}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  if (k === 'vhs') {
    // VHS: แถบแนวนอนสลับ + เลื่อนข้าง
    const bands = 12;
    return (
      <AbsoluteFill style={{background: '#000'}}>
        {Array.from({length: bands}).map((_, i) => {
          const on = p > (random(`v${i}`) * 0.7);
          const shift = on ? (1 - Math.min(1, (p - random(`v${i}`) * 0.7) / 0.3)) * 60 * (i % 2 ? 1 : -1) : 0;
          return on ? (
            <AbsoluteFill key={i} style={{clipPath: `inset(${(i / bands) * 100}% 0 ${100 - ((i + 1) / bands) * 100}% 0)`, transform: `translateX(${shift}px)`}}>{children}</AbsoluteFill>
          ) : null;
        })}
      </AbsoluteFill>
    );
  }
  if (k === 'flash') {
    const w = p < 0.4 ? p / 0.4 : Math.max(0, 1 - (p - 0.4) / 0.6);
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{opacity: Math.min(1, p * 1.6), transform: `scale(${1.08 - 0.08 * p})`}}>{children}</AbsoluteFill>
        <AbsoluteFill style={{background: 'radial-gradient(circle, #FFFFFF 0%, #CBB8FF 60%, #6A4DFF 100%)', opacity: w * 0.9, mixBlendMode: 'screen'}} />
      </AbsoluteFill>
    );
  }
  if (k === 'tear') {
    const x = p * 125 - 10;
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(${tearPolygon(x + 1.4)})`, background: '#F6EEDD'}} />
        <AbsoluteFill style={{clipPath: `polygon(${tearPolygon(x)})`}}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const r = p * 170;
  if (k === 'burn') {
    return (
      <AbsoluteFill>
        <AbsoluteFill style={{clipPath: `polygon(${blobPolygon(r + 3, 'b')})`, background: 'radial-gradient(circle, #FFB347 0%, #7A2E0A 100%)'}} />
        <AbsoluteFill style={{clipPath: `polygon(${blobPolygon(r, 'b')})`}}>{children}</AbsoluteFill>
      </AbsoluteFill>
    );
  }
  // ink
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{clipPath: `polygon(${blobPolygon(r + 4, 'i')})`, background: '#1A120B'}} />
      <AbsoluteFill style={{clipPath: `polygon(${blobPolygon(r, 'i')})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const eraTransition = (kind: Transition): TransitionPresentation<P> => ({component: Pres, props: {kind}});
