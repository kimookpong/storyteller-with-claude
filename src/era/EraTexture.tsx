import React from 'react';
import {AbsoluteFill, Img, random, staticFile, useCurrentFrame} from 'remotion';
import type {Era} from '../types';
import {ERAS} from './eras';

/** overlay พื้นผิวยุค — วางเหนือภาพ แต่ใต้ตัวหนังสือ/ตัวเลข (rule 05) */
export const EraTexture: React.FC<{era: Era}> = ({era}) => {
  const f = useCurrentFrame();
  const e = ERAS[era];
  const g = Math.floor(f / 2) % 4;
  const ox = Math.floor(random(`gx${Math.floor(f / 2)}`) * 200) - 100;
  const oy = Math.floor(random(`gy${Math.floor(f / 2)}`) * 120) - 60;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {e.paper > 0 && <Img src={staticFile('textures/paper.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: e.paper}} />}
      {e.halftone > 0 && (
        <Img src={staticFile('textures/halftone.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: e.halftone, mixBlendMode: 'multiply'}} />
      )}
      <Img src={staticFile(`textures/grain${g}.png`)} style={{position: 'absolute', left: -120 + ox, top: -80 + oy, width: 2160, height: 1240, mixBlendMode: 'overlay', opacity: e.grain}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%, transparent 55%, ${e.vignette} 100%)`}} />
      {e.scratches &&
        [0, 1, 2].map((i) =>
          random(`s${i}-${f}`) > 0.55 ? (
            <div key={i} style={{position: 'absolute', left: `${random(`sx${i}-${f}`) * 100}%`, top: 0, bottom: 0, width: 1.5, background: 'rgba(40,25,10,0.22)'}} />
          ) : null,
        )}
      {e.flicker && <AbsoluteFill style={{background: '#000', opacity: random(`fl${f}`) * 0.06}} />}
      {e.tint && <AbsoluteFill style={{background: e.tint, mixBlendMode: 'multiply'}} />}
      {e.glow && <AbsoluteFill style={{background: e.glow, mixBlendMode: 'screen'}} />}
      {e.scanlines ? (
        <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.9) 0px, rgba(0,0,0,0.9) 1px, transparent 1px, transparent 4px)', opacity: e.scanlines}} />
      ) : null}
      {e.tracking && random(`tr${Math.floor(f / 6)}`) > 0.7 ? (
        <div style={{position: 'absolute', left: 0, right: 0, top: `${random(`ty${Math.floor(f / 6)}`) * 90}%`, height: 18 + random(`th${Math.floor(f / 6)}`) * 30, background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(1.5px)'}} />
      ) : null}
    </AbsoluteFill>
  );
};
