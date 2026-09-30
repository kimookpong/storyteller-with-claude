// ค่าของ format ที่ใช้ตอน render (ขนาดเฟรมมาจาก useVideoConfig; ส่วนนี้คือ safe zone + ซับ) — มาจาก presets/formats/*.json
import React from 'react';

export type SubCfg = {mode?: 'box' | 'caption'; fontSize: number; bottom?: number; y?: number; maxLineChars: number; maxLines: number; enFontSize?: number; enMaxLineChars?: number};
export type Safe = {top: number; bottom: number; left: number; right: number};
export type FormatCfg = {id: string; width: number; height: number; safe: Safe; subtitle: SubCfg};

export const LANDSCAPE: FormatCfg = {id: 'landscape-16x9', width: 1920, height: 1080, safe: {top: 64, bottom: 64, left: 96, right: 96},
  subtitle: {mode: 'box', fontSize: 40, bottom: 64, maxLineChars: 38, maxLines: 2, enFontSize: 30, enMaxLineChars: 48}};
export const PORTRAIT: FormatCfg = {id: 'portrait-9x16', width: 1080, height: 1920, safe: {top: 160, bottom: 420, left: 90, right: 150},
  subtitle: {mode: 'caption', fontSize: 64, y: 1300, maxLineChars: 16, maxLines: 2, enFontSize: 38, enMaxLineChars: 28}};

/** safe ใน preset เขียนได้ 2 แบบ: {x, y} หรือ {top, bottom, left, right} */
export const normSafe = (s: any, d: Safe): Safe => (!s ? d : {top: s.top ?? s.y ?? d.top, bottom: s.bottom ?? s.y ?? d.bottom, left: s.left ?? s.x ?? d.left, right: s.right ?? s.x ?? d.right});

/** format ของโปรเจกต์: จาก settings (render ผ่าน HistoryTeller) หรือเดาจาก meta (stills/cover/Studio) */
export const formatOf = (p: {meta: {width: number; height: number}; settings?: any}): FormatCfg => {
  const f = p.settings?.format;
  const base = (f?.height ?? p.meta.height) > (f?.width ?? p.meta.width) ? PORTRAIT : LANDSCAPE;
  if (!f) return base;
  return {id: f.id ?? base.id, width: f.width ?? base.width, height: f.height ?? base.height, safe: normSafe(f.safe, base.safe), subtitle: {...base.subtitle, ...(f.subtitle ?? {})}};
};

export const FormatContext = React.createContext<FormatCfg>(LANDSCAPE);

/** รูปจาก AI (scripts/imagegen.py → public/<slug>/img/<id>.png) — render.mjs ใส่ให้จาก images.lock.json */
export type ImageInfo = {src: string; aspect: number; kind?: 'plate' | 'cutout' | 'texture' | 'photo' | 'logo'; credit?: string};
export const ImagesContext = React.createContext<Record<string, ImageInfo>>({});
export const useImages = () => React.useContext(ImagesContext);
export const useFormat = () => React.useContext(FormatContext);
