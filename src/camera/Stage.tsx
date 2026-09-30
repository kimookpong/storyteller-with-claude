import React from 'react';
import {AbsoluteFill, random, spring, useVideoConfig} from 'remotion';
import type {Era, Layer, Shot, Vec3} from '../types';
import {Asset, assetAspect, NO_CUT, parseImg} from '../assets/Asset';
import {useImages} from '../format';
import {blurFor, camAt, coverWidth, project} from './camera';
import {ERAS} from '../era/eras';
import {W, H} from '../theme/tokens';

const defaultCamera = (shot: Shot): NonNullable<Shot['camera']> => {
  if (shot.camera) return shot.camera;
  if (shot.kind === 'collage') return {move: 'drift', from: {x: -25, y: 0, z: 0}, to: {x: 25, y: -10, z: 50}, ease: 'inOutSine'};
  if (shot.kind === 'data' || shot.kind === 'title') return {move: 'drift', from: {x: 0, y: 0, z: 0}, to: {x: 0, y: 0, z: 50}, ease: 'inOutSine'};
  return {move: 'drift', from: {x: -20, y: 10, z: 0}, to: {x: 20, y: -10, z: 70}, ease: 'inOutSine'};
};

type AnimOut = {dx: number; dy: number; rot: number; scale: number; opacity: number};
const animate = (l: Layer, t: number, fps: number, stopFps: number, collage: boolean): AnimOut => {
  const o: AnimOut = {dx: 0, dy: 0, rot: 0, scale: 1, opacity: 1};
  const d = l.delay ?? 0;
  const tl = t - d;
  const sp = (damping = 13) => (tl < 0 ? 0 : spring({frame: tl * fps, fps, config: {damping, mass: 0.8}}));
  const seed = l.id + l.asset;
  switch (l.anim) {
    case 'pop': {
      const s = sp(10);
      o.scale = s;
      o.opacity = tl < 0 ? 0 : 1;
      break;
    }
    case 'slide-left':
      o.dx = -(1 - sp()) * 1400;
      break;
    case 'slide-right':
      o.dx = (1 - sp()) * 1400;
      break;
    case 'slide-up':
      o.dy = (1 - sp()) * 900;
      break;
    case 'drop':
      o.dy = -(1 - sp(9)) * 900;
      o.opacity = tl < 0 ? 0 : 1;
      break;
    case 'float':
      o.dy = Math.sin(t * 1.5 + random(seed) * 6) * 10;
      o.rot = Math.sin(t * 1.1 + random(seed) * 6) * 1.5;
      break;
    case 'sway':
      o.rot = Math.sin(t * 1.2) * 3;
      break;
    case 'bob':
      o.dy = -Math.abs(Math.sin(t * 3)) * 12;
      break;
    case 'spin':
      o.rot = t * 25;
      break;
    default:
      break;
  }
  // collage: สั่นแบบ stop-motion (rule 04/05)
  if (collage && l.style === 'collage' && l.anim !== 'none') {
    const step = Math.floor(t * stopFps);
    o.dx += (random(`${seed}x${step}`) - 0.5) * 5;
    o.dy += (random(`${seed}y${step}`) - 0.5) * 5;
    o.rot += (random(`${seed}r${step}`) - 0.5) * 1.6;
  }
  return o;
};

export const Stage: React.FC<{shot: Shot; t: number; dur: number; fps: number; era: Era}> = ({shot, t, dur, fps, era}) => {
  const cam = defaultCamera(shot);
  const {width: VW, height: VH} = useVideoConfig();
  const images = useImages();
  const e = ERAS[era];
  const collageShot = shot.kind === 'collage';
  // stop-motion: quantize เวลาของ asset ภายใน (กล้องยังลื่น)
  const tq = collageShot ? Math.floor(t * e.stopMotionFps) / e.stopMotionFps : t;
  const c: Vec3 = camAt(cam.from, cam.to, t / Math.max(0.001, dur), cam.ease);
  const byId = Object.fromEntries(shot.layers.map((l) => [l.id, l]));
  const fTarget = shot.focus?.target ?? (byId.subject ? 'subject' : undefined);
  let focusZ = fTarget && byId[fTarget] ? byId[fTarget].z : 1000;
  if (shot.focus?.rackTo && byId[shot.focus.rackTo]) {
    const at = (shot.focus.rackAt ?? 0.5) * dur;
    const k = Math.min(1, Math.max(0, (t - at) / 0.5));
    const ke = k * k * (3 - 2 * k);
    focusZ = focusZ + (byId[shot.focus.rackTo].z - focusZ) * ke;
  }
  const layers = [...shot.layers].sort((a, b) => b.z - a.z);
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {layers.map((l) => {
        const lx = l.x ?? 0;
        const ly = l.y ?? 0;
        const w = l.cover ? coverWidth(l.z, [cam.from, cam.to], lx, VW, VH, assetAspect(l.asset, images)) : (l.w ?? 600);
        const pr = project(lx, ly, l.z, c, VW, VH);
        const a = animate(l, collageShot ? tq : t, fps, e.stopMotionFps, collageShot);
        const blur = shot.kind === 'parallax' || shot.focus ? blurFor(l.z, focusZ, c) : 0;
        const strength = l.id === 'subject' ? 0.25 : l.id === 'fg' ? 0.6 : 1;
        const eraF = e.filter(strength);
        // collage cut-out: ขอบกระดาษขาว + เงาลอย (CSS drop-shadow เร็วกว่า SVG filter มาก)
        const o = Math.max(2, 5 * Math.min(1.6, pr.scale));
        const pim = parseImg(l.asset);
        const cut = l.style === 'collage' && !NO_CUT.has(pim && !images[pim.id] ? pim.fallback ?? l.asset : l.asset) && !(pim && images[pim.id] && (images[pim.id].kind === 'plate' || images[pim.id].kind === 'photo' || images[pim.id].kind === 'logo' || l.cover))
          ? `drop-shadow(${o}px 0 0 #FBF6EC) drop-shadow(-${o}px 0 0 #FBF6EC) drop-shadow(0 ${o}px 0 #FBF6EC) drop-shadow(0 -${o}px 0 #FBF6EC) drop-shadow(${o * 1.2}px ${o * 2}px ${o}px rgba(0,0,0,0.3))`
          : '';
        const filter = [cut, eraF !== 'none' ? eraF : '', blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : ''].filter(Boolean).join(' ') || undefined;
        const pw = w * pr.scale;
        const ph = pw * assetAspect(l.asset, images);
        return (
          <div key={l.id}
            style={{
              position: 'absolute', left: pr.x + a.dx * pr.scale, top: pr.y + a.dy * pr.scale, width: pw, height: ph,
              transform: `translate(-50%,-50%) rotate(${(l.rot ?? 0) + a.rot}deg) scale(${(l.flip ? -1 : 1) * a.scale},${a.scale})`,
              opacity: (l.opacity ?? 1) * a.opacity, filter,
            }}>
            <Asset name={l.asset} style={l.style} t={Math.max(0, (collageShot ? tq : t) - (l.delay ?? 0))} dur={dur} props={l.props} width={pw} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export {W, H};
