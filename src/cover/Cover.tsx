import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {ImagesContext} from '../format';
import type {CoverSpec, Project, Shot} from '../types';
import {Stage} from '../camera/Stage';
import {EraTexture} from '../era/EraTexture';
import {C, FONT, W, H} from '../theme/tokens';

// ปก YouTube (rule 12) — ออกแบบที่ 1920×1080 แล้ว export ย่อเป็น 1280×720
const FPS = 30;
const PAD = 110;

/** "กาแฟ\n*ยึดโลก*" → บรรทัด + คำที่อยู่ใน *…* เป็นสีไฮไลต์ */
const rich = (line: string, hi: string) =>
  line.split(/(\*[^*]+\*)/).filter(Boolean).map((part, i) =>
    part.startsWith('*') && part.endsWith('*')
      ? <span key={i} style={{color: hi}}>{part.slice(1, -1)}</span>
      : <React.Fragment key={i}>{part}</React.Fragment>,
  );

export const plainTitle = (s: string) => s.replace(/\*/g, '');
/** ความกว้างที่มองเห็น: ไม่นับสระบน/ล่างและวรรณยุกต์ไทย */
export const visibleLen = (s: string) => plainTitle(s).replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length;

/** ขนาดตัวอักษรหัวข้อ: บรรทัดยิ่งสั้น ตัวยิ่งใหญ่ (กว้างราว 55% ของจอ) */
const titleSize = (lines: string[]) => {
  const longest = Math.max(...lines.map((l) => visibleLen(l)), 1);
  return Math.round(Math.min(230, Math.max(120, 1080 / (longest * 0.62))));
};

export const Cover: React.FC<{cover: CoverSpec}> = ({cover}) => {
  const era = cover.era ?? 'present';
  const side = cover.side ?? 'left';
  const cam = cover.camera ?? {x: 0, y: 0, z: 0};
  const at = cover.at ?? 2.5; // เวลาที่ "หยุดภาพ" — ให้ anim pop/drop เล่นจบก่อน
  const shot: Shot = {
    id: `cover-${cover.id}`,
    kind: cover.kind ?? 'parallax',
    description: 'cover',
    layers: cover.layers,
    camera: {move: 'static', from: cam, to: cam},
    focus: cover.focus ? {target: cover.focus} : undefined,
    bg: cover.bg,
  };
  const {width: W, height: H} = useVideoConfig();
  // แนวตั้ง (TikTok/Reels/Shorts): ตัวหนังสือกลางจอในกรอบ 3:4 (หน้าโปรไฟล์ตัดเป็น 3:4) · ไม่ใช้ side ซ้าย/ขวา
  const portrait = H > W;
  const lines = cover.title.split('\n');
  const size = cover.titleSize ?? (portrait ? Math.min(150, titleSize(lines)) : titleSize(lines));
  const hi = cover.highlight ?? C.accent2;
  const align = side === 'left' ? 'flex-start' : 'flex-end';
  const scrimDir = side === 'left' ? 'to right' : 'to left';
  return (
    <AbsoluteFill style={{background: cover.bg ?? C.bgDeep, overflow: 'hidden'}}>
      <Stage shot={shot} t={at} dur={at + 1} fps={FPS} era={era} />
      <EraTexture era={era} />
      {/* scrim ฝั่งตัวหนังสือ ให้อ่านออกเสมอไม่ว่าพื้นจะสว่างแค่ไหน */}
      <AbsoluteFill style={{background: portrait
        ? `linear-gradient(to bottom, rgba(14,26,43,0) 12%, rgba(14,26,43,${cover.scrim ?? 0.82}) 30%, rgba(14,26,43,${(cover.scrim ?? 0.82) * 0.6}) 50%, rgba(14,26,43,0) 64%)`
        : `linear-gradient(${scrimDir}, rgba(14,26,43,${cover.scrim ?? 0.82}) 0%, rgba(14,26,43,${(cover.scrim ?? 0.82) * 0.6}) 38%, rgba(14,26,43,0) 62%)`}} />
      <div style={portrait ? {
        position: 'absolute', left: 90, right: 90, top: H * 0.24, height: H * 0.3,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 18, textAlign: 'center',
      } : {
        position: 'absolute', top: 0, bottom: 0, ...(side === 'left' ? {left: PAD} : {right: PAD}), width: W * 0.58,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: align, gap: 18,
        textAlign: side === 'left' ? 'left' : 'right',
      }}>
        {cover.kicker && (
          <div style={{fontFamily: FONT.display, fontWeight: 600, fontSize: 64, lineHeight: 1.45, color: C.white, background: C.accent1,
            padding: '4px 34px', borderRadius: 999, transform: `rotate(${side === 'left' ? -2 : 2}deg)`, boxShadow: '0 8px 0 rgba(0,0,0,0.25)'}}>
            {cover.kicker}
          </div>
        )}
        <div style={{fontFamily: FONT.display, fontWeight: 700, fontSize: size, lineHeight: 1.18, color: C.white, whiteSpace: 'nowrap',
          paddingTop: size * 0.12, paddingBottom: size * 0.1,
          textShadow: `0 ${size * 0.05}px 0 ${C.bgDeep}, 0 0 ${size * 0.25}px rgba(0,0,0,0.55)`}}>
          {lines.map((l, i) => <div key={i}>{rich(l, hi)}</div>)}
        </div>
      </div>
      {cover.note && (
        <div style={{position: 'absolute', left: cover.noteAt?.[0] ?? (side === 'left' ? W * 0.68 : W * 0.3), top: cover.noteAt?.[1] ?? H * 0.16,
          transform: `translate(-50%,-50%) rotate(${side === 'left' ? 6 : -6}deg)`, fontFamily: FONT.hand, fontWeight: 700, fontSize: 96, lineHeight: 1.45,
          color: C.marker, whiteSpace: 'nowrap', textShadow: `0 0 6px #FBF6EC, 0 0 14px #FBF6EC, 0 0 22px #FBF6EC`}}>
          {cover.note}
        </div>
      )}
    </AbsoluteFill>
  );
};

/** Still "cover": --props='{"coverId":"B"}' */
export const CoverStill: React.FC<{project: Project; coverId?: string}> = ({project, coverId}) => {
  const covers = project.covers ?? [];
  const cover = covers.find((c) => c.id === coverId) ?? covers[0];
  if (!cover) {
    return (
      <AbsoluteFill style={{background: C.bgDeep, color: C.accent2, fontFamily: FONT.body, fontSize: 56, alignItems: 'center', justifyContent: 'center'}}>
        ยังไม่มี "covers" ใน shots.json (ดู rules/12-cover.md)
      </AbsoluteFill>
    );
  }
  return (
    <ImagesContext.Provider value={project.images ?? {}}>
      <Cover cover={cover} />
    </ImagesContext.Provider>
  );
};
