import type {Project, Timeline, SceneTiming} from '../types';

export const CUE_RE = /\[#([A-Za-z0-9_-]+)\]/g;
const DEFAULT_CPS = 10.5; // ใช้เมื่อไม่มี settings (ค่าจริงมาจาก voice preset: project.settings.voice.charsPerSec)
const HEAD = 6 / 30;
const TAIL = 12 / 30;

export type VoTiming = {durationMs: number; cues: Record<string, number>};

const speakChars = (s: string) => s.replace(CUE_RE, '').replace(/[\s…]/g, '').length;
const estimateSec = (s: string, cps = DEFAULT_CPS) => speakChars(s) / cps + (s.match(/…/g)?.length ?? 0) * 0.3 + (s.split(/\n\s*\n/).length - 1) * 0.8;

/** แบ่ง vo ตาม cue marker → [{shotId, text}] */
export const splitByCue = (vo: string, firstId: string) => {
  const parts: {id: string; text: string}[] = [];
  let last = 0;
  let id = firstId;
  vo.replace(CUE_RE, (m, cue, idx: number) => {
    parts.push({id, text: vo.slice(last, idx).trim()});
    id = cue;
    last = idx + m.length;
    return m;
  });
  parts.push({id, text: vo.slice(last).trim()});
  return parts;
};

/** extraTail(i) = เฟรมที่ซีน i ต้องยืดท้าย เพื่อไม่ให้ transition ไปทับเสียง */
export const resolveTimeline = (p: Project, vo: Record<string, VoTiming | null>, extraTail: (i: number) => number = () => 0): Timeline => {
  const fps = p.meta.fps;
  const cps = p.settings?.voice?.charsPerSec ?? DEFAULT_CPS;
  let cursor = 0;
  const scenes: SceneTiming[] = p.scenes.map((s, si) => {
    const parts = splitByCue(s.vo, s.shots[0].id);
    const en = s.voEn ? Object.fromEntries(splitByCue(s.voEn, s.shots[0].id).map((x) => [x.id, x.text])) : {};
    const real = vo[s.id];
    const speech = real ? real.durationMs / 1000 : estimateSec(s.voTTS || s.vo, cps);
    const sceneSec = HEAD + speech + TAIL + (s.holdAfter ?? 0);
    const dur = Math.round(sceneSec * fps) + extraTail(si);
    // เวลาเริ่มของแต่ละช็อต (วินาทีนับจากเริ่มพูด)
    const total = parts.reduce((a, x) => a + speakChars(x.text), 0) || 1;
    let acc = 0;
    const starts = parts.map((x) => {
      const cueMs = real?.cues?.[x.id];
      const st = cueMs !== undefined ? cueMs / 1000 : (acc / total) * speech;
      acc += speakChars(x.text);
      return st;
    });
    const shots = parts.map((x, i) => {
      const from = i === 0 ? 0 : Math.round((HEAD + starts[i]) * fps);
      const to = i === parts.length - 1 ? dur : Math.round((HEAD + starts[i + 1]) * fps);
      return {id: x.id, from, dur: Math.max(1, to - from), subtitle: x.text, subtitleEn: en[x.id]};
    });
    const st: SceneTiming = {id: s.id, from: cursor, dur, shots, estimated: !real, voFrames: real ? Math.round(speech * fps) : null};
    cursor += dur;
    return st;
  });
  return {scenes, total: cursor};
};
