# 09 · `shots.json` Schema

`shots.json` คือสัญญากลางระหว่าง "บท" กับ "โค้ด" — Remotion อ่านไฟล์นี้อย่างเดียว

```ts
type Project = {
  meta: { slug: string; title: string; fps: 30; width: 1920 | 1080; height: 1080 | 1920; targetSec: number }; // ขนาด = format ใน settings.json (แนวตั้ง 1080×1920) · targetSec = ค่าใน settings.json
  sources: Record<string, string>; // sourceRef → ข้อความ "ที่มา" บนจอ (ต้องมีใน facts.md ด้วย)
  scenes: Scene[];
  covers?: CoverSpec[];            // ปก YouTube — ดู 12-cover
};

type Scene = {
  id: string;                 // "S01"
  beat: "hook"|"setup"|"act1"|"act2"|"act3"|"payoff"|"outro";
  era: Era;                   // ดู 05
  vo: string;                 // subtitle text, มี cue marker [#shotId] คั่น
  voEn?: string;              // คำแปลอังกฤษ (ซับ/ไฟล์ .en.srt) — cue marker ชุดเดียวกับ vo (rule 03)
  voTTS: string;              // ข้อความสำหรับ TTS — ใส่ cue marker [#shotId] จุดเดียวกับ vo
  voFile: string;             // "vo/S01.wav" (สร้างโดย scripts/tts.py)
  holdAfter?: number;         // วินาทีที่ให้ภาพเล่าต่อหลังเสียงจบ
  transitionIn?: string;      // default = transition ของ era
  shots: Shot[];
};

type Shot = {
  id: string;                 // "S01-02"
  kind: "parallax"|"vector"|"collage"|"data"|"title";
  description: string;        // ภาพอะไร สื่ออะไร (ภาษาคน)
  layers: Layer[];            // parallax ต้อง ≥ 3
  camera?: { move: Move; from: Cam; to: Cam; ease?: Ease };
  focus?: { target: string; rackTo?: string; rackAtCue?: string };
  text?: { content: string; role: "title"|"kicker"|"label"|"number"|"note"; x?: number; y?: number; delay?: number; sourceRef?: string }[];
  data?: // ดู src/types.ts
    | { chart: "counter"; to: number; suffix?: string; label?: string; sourceRef: string }
    | { chart: "bar"; items: {label: string; value: number; highlight?: boolean}[]; unit: string; title?: string; sourceRef: string }
    | { chart: "unit"; count: number; perIcon: string; label: string; sourceRef: string }
    | { chart: "map"; from: {center: [lon, lat]; scale: number}; to?: {...}; routes?: {path: [lon, lat][]; delay?: number}[]; pins?: {at: [lon, lat]; label: string}[] };
  sfx?: { name: "pop"|"bloop"|"whoosh"|"paper"|"tick"|"stamp"; at?: "start"|"end"|number; volume?: number }[]; // ไม่ใส่ = อัตโนมัติตาม kind (rule 08), [] = เงียบ
};

type Layer = {
  id: "bg"|"mg"|"subject"|"fg"|string;
  asset: string;              // path ใน public/ หรือ "placeholder:<ชื่อ>"
  style: "vector"|"collage";
  z: number;                  // ดู 06
  x?: number; y?: number; w?: number; // world units: ที่ z=1000 คือพิกเซลจากกลางจอ; ที่ z อื่นคูณ z/1000
  cover?: boolean;            // ขยายอัตโนมัติให้คลุมเฟรมตลอดการเคลื่อนกล้อง (ฉากหลัง)
  rot?: number; flip?: boolean; opacity?: number; delay?: number;
  props?: Record<string, unknown>; // ค่าเฉพาะ asset เช่น bean: {expr, hat}
  anim?: "float"|"pop"|"stop-motion"|"sway"|"slide-left"|"slide-right"|"slide-up"|"drop"|"bob"|"spin"|"none";
};
```

## Cue marker → ความยาวช็อต
- ใส่ `[#S01-02]` ทั้งใน `vo` และ `voTTS` ตรงคำที่ภาพต้องตัดไปช็อตนั้น (ช็อตแรกของซีนไม่ต้องใส่)
- `scripts/tts.py` (OpenRouter / Gemini) สังเคราะห์เสียง **ทีละช่วงระหว่าง marker** แล้วต่อกัน → ได้เวลาตัดจริงใน `public/<slug>/vo/<sceneId>.json` (`cues`) เพราะ API ไม่ส่ง timestamp กลับมา
- ข้อแลก: แต่ละช่วงพูดแยกกัน น้ำเสียงระหว่างช่วงอาจต่างกันเล็กน้อย → อย่าวาง marker กลางประโยค ให้วางตรงจุดหายใจ/จบวลี
- ถ้าไม่มีไฟล์ timing → แบ่งเวลาตาม **สัดส่วนจำนวนตัวอักษร** ระหว่าง marker
- ทุก shot id ในซีน (ยกเว้นตัวแรก) ต้องมี marker ใน `vo` ครบ ไม่งั้น validation fail
