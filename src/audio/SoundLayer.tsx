import React from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';
import type {Project, Shot, Timeline} from '../types';
import {ERAS} from '../era/eras';

// rule 08 — เพลงประกอบ (duck ใต้เสียงพากย์, เปลี่ยนโทนตามยุค) + SFX ต่อช็อต
// ตำแหน่งทุกอย่างคำนวณจาก timeline เดียวกับภาพ — ไม่มีเวลา hardcode

export const SFX_FILES: Record<string, string> = {
  pop: 'audio/sfx/pop.wav', bloop: 'audio/sfx/bloop.wav', whoosh: 'audio/sfx/whoosh.wav',
  paper: 'audio/sfx/paper.wav', tick: 'audio/sfx/tick.wav', stamp: 'audio/sfx/stamp.wav',
};
/** ปรับความดังแต่ละเสียงให้พอ ๆ กัน (whoosh เป็น noise กว้าง ฟังดังกว่าที่วัดได้) */
const SFX_GAIN: Record<string, number> = {pop: 1, bloop: 0.9, whoosh: 0.55, paper: 0.8, tick: 0.7, stamp: 1};
const VO_HEAD = 6; // เสียงพากย์เริ่มหลังต้นซีน 6 เฟรม (Main.tsx)
const RAMP = 8; // เฟรมที่ใช้ลด/เพิ่มเสียงเพลง
const XFADE = 24; // crossfade เพลงยุคเก่า ↔ ใหม่

/** SFX อัตโนมัติตามชนิดช็อต (rule 08) */
const autoSfx = (shot: Shot): {name: string; at: number}[] => {
  if (shot.sfx) return shot.sfx.map((x) => ({name: x.name, at: typeof x.at === 'number' ? x.at : x.at === 'end' ? -1 : 0}));
  const out: {name: string; at: number}[] = [];
  const base = {parallax: 'whoosh', vector: 'pop', title: 'bloop', collage: 'paper', data: shot.data?.chart === 'counter' ? 'tick' : 'whoosh'}[shot.kind];
  if (base) out.push({name: base, at: 0});
  const stamp = shot.layers.find((l) => l.asset === 'stamp');
  if (stamp) out.push({name: 'stamp', at: Number((stamp.props as any)?.at ?? 0.2)});
  return out;
};

export const SoundLayer: React.FC<{project: Project; timeline: Timeline; starts: number[]; total: number; withVo: boolean}> = ({project, timeline, starts, total, withVo}) => {
  const a = project.settings?.audio;
  if (!a) return null;
  const fps = project.meta.fps;
  // ช่วงที่มีเสียงพากย์ (เฟรมรวมของทั้งเรื่อง)
  const vo = withVo
    ? timeline.scenes.map((s, i) => (s.voFrames ? [starts[i] + VO_HEAD, starts[i] + VO_HEAD + s.voFrames] : null)).filter(Boolean) as number[][]
    : [];
  const duck = (f: number) => {
    let k = 0; // 0 = ช่วงว่าง, 1 = มีเสียงพากย์
    for (const [s, e] of vo) {
      const v = interpolate(f, [s - RAMP, s, e, e + RAMP], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      if (v > k) k = v;
    }
    return a.musicGap + (a.musicUnderVo - a.musicGap) * k;
  };
  // น้ำหนักเพลงยุคเก่า (0..1) ตามยุคของซีนที่กำลังเล่น + crossfade
  const vintageAt = (f: number) => {
    let i = starts.length - 1;
    while (i > 0 && f < starts[i]) i--;
    const cur = ERAS[project.scenes[i].era].vintage ? 1 : 0;
    const prev = i > 0 ? (ERAS[project.scenes[i - 1].era].vintage ? 1 : 0) : cur;
    return interpolate(f, [starts[i], starts[i] + XFADE], [prev, cur], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  };
  const fadeInOut = (f: number) => interpolate(f, [0, 20, total - 45, total], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const hasVintage = project.scenes.some((s) => ERAS[s.era].vintage) && a.music?.vintage;
  const hasModern = project.scenes.some((s) => !ERAS[s.era].vintage) && a.music?.modern;

  const sfx: {key: string; from: number; name: string}[] = [];
  if (a.sfx) {
    project.scenes.forEach((scene, i) => {
      const tm = timeline.scenes[i];
      for (const st of tm.shots) {
        const shot = scene.shots.find((x) => x.id === st.id);
        if (!shot) continue;
        for (const [j, x] of autoSfx(shot).entries()) {
          if (!SFX_FILES[x.name]) continue;
          const from = starts[i] + st.from + (x.at < 0 ? Math.max(0, st.dur - 10) : Math.round(x.at * fps));
          if (from <= 2) continue; // ไม่ใส่ที่เฟรมแรกของคลิป
          sfx.push({key: `${st.id}-${j}`, from, name: x.name});
        }
      }
    });
  }
  return (
    <>
      {hasModern && <Audio src={staticFile(a.music!.modern!)} loop volume={(f) => duck(f) * fadeInOut(f) * (1 - vintageAt(f))} />}
      {hasVintage && <Audio src={staticFile(a.music!.vintage!)} loop volume={(f) => duck(f) * fadeInOut(f) * vintageAt(f)} />}
      {sfx.map((x) => (
        <Sequence key={x.key} from={x.from} durationInFrames={Math.round(1.2 * fps)} name={`sfx ${x.name}`}>
          <Audio src={staticFile(SFX_FILES[x.name])} volume={a.sfxVolume * (SFX_GAIN[x.name] ?? 1)} />
        </Sequence>
      ))}
    </>
  );
};
