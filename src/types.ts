export type Era = 'prehistoric' | 'ancient' | 'medieval' | 'early-modern' | '1800s' | 'early-1900s' | 'mid-century' | '80s-90s' | '2000s' | 'present' | 'future';
export type Vec3 = {x: number; y: number; z: number};
export type Ease = 'inOutCubic' | 'outExpo' | 'outCubic' | 'linear' | 'inOutSine';

export type Layer = {
  id: string;
  asset: string;
  style?: 'vector' | 'collage';
  z: number;
  x?: number;
  y?: number;
  w?: number;
  cover?: boolean;
  rot?: number;
  flip?: boolean;
  opacity?: number;
  anim?: 'none' | 'float' | 'pop' | 'stop-motion' | 'sway' | 'slide-left' | 'slide-right' | 'slide-up' | 'drop' | 'bob' | 'spin';
  delay?: number;
  props?: Record<string, unknown>;
};

export type TextItem = {
  content: string;
  role: 'title' | 'label' | 'number' | 'note' | 'kicker';
  x?: number;
  y?: number;
  delay?: number;
  color?: string;
  size?: number;
  rot?: number;
  sourceRef?: string;
};

export type DataSpec =
  | {chart: 'counter'; to: number; suffix?: string; label?: string; sourceRef: string; decimals?: number}
  | {chart: 'bar'; items: {label: string; value: number; highlight?: boolean}[]; unit: string; title?: string; sourceRef: string}
  | {chart: 'unit'; count: number; perIcon: string; label: string; sourceRef: string; icon?: string; highlight?: number; cols?: number; size?: number}
  | {chart: 'map'; from: {center: [number, number]; scale: number}; to?: {center: [number, number]; scale: number};
      routes?: {path: [number, number][]; delay?: number; color?: string}[];
      pins?: {at: [number, number]; label: string; delay?: number}[]; sourceRef?: string};

export type Shot = {
  id: string;
  kind: 'parallax' | 'vector' | 'collage' | 'data' | 'title';
  description: string;
  layers: Layer[];
  camera?: {move: string; from: Vec3; to: Vec3; ease?: Ease};
  focus?: {target: string; rackTo?: string; rackAt?: number};
  text?: TextItem[];
  data?: DataSpec;
  bg?: string;
  /** SFX (rule 08): ไม่ใส่ = อัตโนมัติตาม kind · [] = เงียบ · at = 'start' | 'end' | วินาทีจากต้นช็อต */
  sfx?: {name: string; at?: 'start' | 'end' | number; volume?: number}[];
};

export type Scene = {
  id: string;
  beat: string;
  era: Era;
  vo: string;
  /** คำแปลอังกฤษสำหรับซับ — cue marker ชุดเดียวกับ vo (rule 03/09) */
  voEn?: string;
  voTTS: string;
  voFile: string;
  holdAfter?: number;
  shots: Shot[];
};

/** เพลง/SFX (rule 08) — มาจาก style preset (`presets/styles/*.json` → audio) */
export type AudioSettings = {
  music?: {modern?: string; vintage?: string} | null; // path ใน public/
  musicGap: number; // ความดังเพลงช่วงไม่มีเสียงพากย์ (0–1)
  musicUnderVo: number; // ความดังเพลงตอนมีเสียงพากย์ (duck)
  sfx: boolean;
  sfxVolume: number;
};

/** ปก YouTube (rule 12) — วางฉากด้วย layer ชุดเดียวกับช็อต */
export type CoverSpec = {
  id: string;                 // "A", "B" … (ทำ 2–3 แบบไว้เทียบ)
  era?: Era;                  // default 'present'
  kind?: Shot['kind'];        // default 'parallax' (มี DOF)
  layers: Layer[];
  camera?: Vec3;              // กล้องนิ่ง default {0,0,0}
  focus?: string;             // layer id ที่ชัด (ที่เหลือเบลอตามระยะ)
  bg?: string;
  at?: number;                // วินาทีที่หยุดภาพ (ให้ anim เล่นจบ) default 2.5
  title: string;              // ขึ้นบรรทัดด้วย \n, *คำ* = สีไฮไลต์
  titleSize?: number;         // px ที่ 1920×1080 (default คำนวณจากความยาวบรรทัด)
  highlight?: string;         // สีไฮไลต์ default accent-2
  kicker?: string;            // ป้ายเล็กเหนือหัวข้อ
  note?: string;              // ลายมือปากกาแดง
  noteAt?: [number, number];  // ตำแหน่ง note (px)
  side?: 'left' | 'right';    // ฝั่งตัวหนังสือ default left
  scrim?: number;             // ความเข้มแถบมืดหลังตัวหนังสือ 0–1 default 0.82
  sourceRef?: string;         // บังคับถ้ามีตัวเลขในข้อความ
};

export type Project = {
  meta: {slug: string; title: string; fps: number; width: number; height: number; targetSec: number};
  sources: Record<string, string>;
  scenes: Scene[];
  covers?: CoverSpec[];
  /** settings ที่ resolve แล้ว (HistoryTeller ใส่ให้ตอน render ผ่าน props) — ดู scripts/lib/settings.mjs */
  /** รูปจาก AI ที่เลือกแล้ว (render.mjs ใส่จาก images.lock.json) — layer ใช้ "img:<id>" */
  images?: Record<string, {src: string; aspect: number; kind?: 'plate' | 'cutout' | 'texture' | 'photo' | 'logo'; credit?: string}>;
  settings?: {targetSec: number; subtitles?: 'th' | 'th+en' | 'en' | 'off'; voice?: {id: string; charsPerSec: number}; style?: {id: string}; format?: {id: string; width: number; height: number; fps: number}; audio?: AudioSettings | null};
};

export type ShotTiming = {id: string; from: number; dur: number; subtitle: string; subtitleEn?: string};
export type SceneTiming = {id: string; from: number; dur: number; shots: ShotTiming[]; estimated: boolean; voFrames?: number | null};
export type Timeline = {scenes: SceneTiming[]; total: number};
