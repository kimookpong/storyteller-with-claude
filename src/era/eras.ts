import type {Era} from '../types';

export type Transition = 'burn' | 'ink' | 'tear' | 'zoom' | 'dust' | 'scroll' | 'vhs' | 'flash';
export type EraSpec = {
  label: string; // ชื่อไทย (UI)
  paper: number; // ความเข้ม texture กระดาษ (multiply)
  grain: number;
  vignette: string;
  halftone: number;
  flicker: boolean;
  scratches: boolean;
  stopMotionFps: number;
  transitionIn: Transition;
  filter: (s: number) => string; // s = ความแรง 0..1 (bg=1, subject≈0.25)
  vintage: boolean; // ตัวเลข/แผนที่ใช้โทนกระดาษเก่า
  tint?: string; // overlay สีทับทั้งเฟรม (multiply)
  scanlines?: number; // ความเข้มเส้น CRT (80s-90s)
  tracking?: boolean; // แถบ VHS tracking วิ่ง
  glow?: string; // overlay เรืองแสง (screen) — future
};

// rule 05 — ตารางพื้นผิวตามยุค (ทุก key ที่นี่ = ยุคที่ใช้ได้จริง · validate อ่านรายชื่อจากไฟล์นี้)
export const ERAS: Record<Era, EraSpec> = {
  prehistoric: {
    label: 'ยุคหิน', paper: 0.45, grain: 0.2, vignette: 'rgba(40,20,5,0.8)', halftone: 0, flicker: true, scratches: false,
    stopMotionFps: 8, transitionIn: 'dust', vintage: true, tint: 'rgba(170,95,35,0.14)',
    filter: (s) => `sepia(${0.35 * s}) saturate(${1 - 0.2 * s}) contrast(${1 + 0.08 * s}) brightness(${1 - 0.05 * s})`,
  },
  ancient: {
    label: 'โบราณ', paper: 0.45, grain: 0.1, vignette: 'rgba(90,60,20,0.6)', halftone: 0, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'scroll', vintage: true, tint: 'rgba(215,175,95,0.12)',
    filter: (s) => `sepia(${0.25 * s}) saturate(${1 - 0.05 * s}) contrast(${1 + 0.04 * s})`,
  },
  medieval: {
    label: 'ยุคกลาง', paper: 0.4, grain: 0.12, vignette: 'rgba(70,30,5,0.7)', halftone: 0, flicker: false, scratches: false,
    stopMotionFps: 8, transitionIn: 'burn', vintage: true,
    filter: (s) => `sepia(${0.3 * s}) saturate(${1 - 0.15 * s}) contrast(${1 + 0.05 * s})`,
  },
  'early-modern': {
    label: 'ต้นสมัยใหม่', paper: 0.35, grain: 0.1, vignette: 'rgba(30,20,10,0.6)', halftone: 0.1, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'ink', vintage: true,
    filter: (s) => `sepia(${0.4 * s}) contrast(${1 + 0.08 * s})`,
  },
  '1800s': {
    label: '1800s', paper: 0.4, grain: 0.16, vignette: 'rgba(40,25,10,0.75)', halftone: 0, flicker: true, scratches: true,
    stopMotionFps: 12, transitionIn: 'tear', vintage: true,
    filter: (s) => `sepia(${0.65 * s}) contrast(${1 + 0.1 * s}) brightness(${1 - 0.03 * s})`,
  },
  'early-1900s': {
    label: 'ต้น 1900s', paper: 0.3, grain: 0.18, vignette: 'rgba(20,20,20,0.7)', halftone: 0.22, flicker: true, scratches: true,
    stopMotionFps: 12, transitionIn: 'tear', vintage: true,
    filter: (s) => `grayscale(${0.7 * s}) sepia(${0.25 * s}) contrast(${1 + 0.12 * s})`,
  },
  'mid-century': {
    label: 'กลางศตวรรษ 20', paper: 0.2, grain: 0.1, vignette: 'rgba(60,30,20,0.45)', halftone: 0.15, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'tear', vintage: true, tint: 'rgba(255,215,160,0.10)',
    filter: (s) => `saturate(${1 + 0.25 * s}) contrast(${1 + 0.05 * s})`,
  },
  '80s-90s': {
    label: '80s–90s', paper: 0, grain: 0.12, vignette: 'rgba(20,0,40,0.6)', halftone: 0, flicker: true, scratches: false,
    stopMotionFps: 12, transitionIn: 'vhs', vintage: false, scanlines: 0.12, tracking: true, tint: 'rgba(255,60,200,0.05)',
    filter: (s) => `saturate(${1 + 0.2 * s}) contrast(${1 + 0.08 * s})`,
  },
  '2000s': {
    label: '2000s', paper: 0, grain: 0.05, vignette: 'rgba(0,20,60,0.4)', halftone: 0, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'zoom', vintage: false,
    filter: (s) => `saturate(${1 + 0.1 * s})`,
  },
  present: {
    label: 'ปัจจุบัน', paper: 0, grain: 0.05, vignette: 'rgba(5,10,25,0.45)', halftone: 0, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'zoom', vintage: false, filter: () => 'none',
  },
  future: {
    label: 'อนาคต', paper: 0, grain: 0.04, vignette: 'rgba(20,0,60,0.55)', halftone: 0, flicker: false, scratches: false,
    stopMotionFps: 12, transitionIn: 'flash', vintage: false, glow: 'radial-gradient(ellipse at 50% 40%, rgba(140,110,255,0.22) 0%, transparent 60%)',
    filter: (s) => `saturate(${1 + 0.15 * s}) brightness(${1 + 0.03 * s})`,
  },
};
