import {Easing, interpolate} from 'remotion';
import type {Ease, Vec3} from '../types';
import {W, H} from '../theme/tokens';

// สูตรกล้องเดียวทั้งโปรเจกต์ (rule 06)
export const F = 1000;
export const APERTURE = 10;
export const MAX_BLUR = 14;

export const EASE: Record<Ease, (t: number) => number> = {
  inOutCubic: Easing.inOut(Easing.cubic),
  outExpo: Easing.out(Easing.exp),
  outCubic: Easing.out(Easing.cubic),
  inOutSine: Easing.inOut(Easing.sin),
  linear: (t) => t,
};

export const camAt = (from: Vec3, to: Vec3, t: number, ease: Ease = 'inOutCubic'): Vec3 => {
  const e = EASE[ease](Math.min(1, Math.max(0, t)));
  return {x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, z: from.z + (to.z - from.z) * e};
};

export const project = (lx: number, ly: number, lz: number, cam: Vec3, w = W, h = H) => {
  const d = Math.max(50, lz - cam.z);
  const scale = F / d;
  return {x: (lx - cam.x) * scale + w / 2, y: (ly - cam.y) * scale + h / 2, scale, d};
};

export const blurFor = (lz: number, focusZ: number, cam: Vec3) => {
  const d = Math.max(50, lz - cam.z);
  const dF = Math.max(50, focusZ - cam.z);
  return Math.min(MAX_BLUR, (APERTURE * Math.abs(d - dF)) / d);
};

/** ความกว้างขั้นต่ำให้ layer ปกคลุมเฟรมตลอดการเคลื่อนกล้อง (+ขอบเผื่อ 20%) */
/** aspect = สูง/กว้าง ของ asset (ฉากหลัง vector = 9/16) */
export const coverWidth = (lz: number, cams: Vec3[], lx = 0, w = W, h = H, aspect = 9 / 16) => {
  let need = 0;
  for (const c of cams) {
    const d = Math.max(50, lz - c.z);
    const s = F / d;
    const halfW = (w / 2 + Math.abs((lx - c.x) * s)) / s;
    const halfH = (h / 2 + Math.abs(c.y * s)) / s;
    // ความกว้างที่ทำให้ asset คลุมทั้งกว้างและสูงของเฟรม (ตามสัดส่วนของ asset เอง)
    need = Math.max(need, 2 * Math.max(halfW, halfH / aspect));
  }
  return need * 1.2;
};

export const lerp = (a: number, b: number, t: number) => interpolate(t, [0, 1], [a, b]);
