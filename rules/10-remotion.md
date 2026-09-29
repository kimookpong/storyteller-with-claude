# 10 · Remotion Rules

## โครงสร้าง (มีอยู่จริงใน repo)
```
src/
  Root.tsx               // composition ต่อโปรเจกต์ + "project" (โปรเจกต์ใดก็ได้ผ่าน --props) + "shot" + "cover" + calculateMetadata
  Main.tsx               // TransitionSeries ของ scene + เสียง VO (ถ้ามี) + SoundLayer
  audio/SoundLayer.tsx   // เพลงประกอบ (duck ใต้ VO, สลับโทนตามยุค) + SFX อัตโนมัติ (rule 08)
  types.ts               // schema ของ shots.json
  timing/resolve.ts      // VO timing / ประมาณจากตัวอักษร → เฟรมของ scene/shot
  camera/camera.ts       // สูตรกล้อง + DOF (rule 06) — ที่เดียวเท่านั้น
  camera/Stage.tsx       // วาง layer ตาม z, anim, blur, era filter
  assets/                // คลังภาพ SVG (vector/collage จาก asset เดียวกัน ผ่าน palette)
    palette.ts core.tsx common.tsx history.tsx world.tsx index.ts Asset.tsx
  era/eras.ts            // ค่า texture ต่อยุค (rule 05)
  era/EraTexture.tsx     // paper/grain/halftone/vignette/scratch/flicker overlay
  era/transitions.tsx    // burn / ink / tear / zoom / dust / scroll / vhs / flash
  text/ThaiText.tsx      // TextLayer, Subtitles (Intl.Segmenter), SourceLine
  data/Data.tsx          // counter, bar, unit, map (d3-geo + world-atlas)
  shots/ShotRenderer.tsx scenes/SceneRenderer.tsx
  cover/Cover.tsx        // Still "cover" (rule 12) — ใช้ Stage + EraTexture ชุดเดียวกับช็อต
public/textures/         // paper.jpg, grain0-3.png
public/audio/            // music/*.wav + sfx/*.wav (npm run audio → scripts/gen-audio.py)
public/<slug>/vo/        // เสียงจาก scripts/tts.py
projects/<slug>/         // brief, facts, beats, script, shots.json
scripts/lib/settings.mjs // settings + สูตรงบ (ต้นฉบับเดียว) · npm run budget -- <slug>
presets/                 // formats / styles / voices (+ persona .md)
scripts/validate.mjs     // npm run validate (เกณฑ์จาก settings)
scripts/stills.mjs       // npm run stills → out/stills/*.png
scripts/cover.mjs        // npm run cover → out/cover/<slug>-<id>.jpg (1280×720) + -mobile.png
scripts/render.mjs       // npm run render / HistoryTeller: props (shots + settings) → composition "project" → master
scripts/master.mjs       // loudnorm −14 LUFS → out/<slug>-master.mp4
scripts/era-sheet.mjs    // npm run eras → out/eras/<era>.png
app/                     // HistoryTeller UI (npm run app) — server.mjs + lib/ + web/ ไม่มี dependency เพิ่ม (rule 13)
```

## เพิ่ม asset ใหม่
- เขียน `AssetDef` ({vb, draw}) ใน `src/assets/*.tsx` โดยใช้สีจาก `p` (Pal) เท่านั้น → ได้ทั้งแบบ vector และ collage ฟรี
- ใช้ `shadeFill(p, uid, สี)` สำหรับเงา (collage จะกลายเป็นลายเส้นแกะ), `sk(p)` สำหรับเส้นขอบ
- ลงทะเบียนใน `src/assets/index.ts`
- ห้ามลอกตัวละคร/โลโก้ของใคร (rule 04)

## รูปจาก AI
- layer `img:<id>|<fallback>` → `Asset.tsx` ใช้ `<Img>` จาก `project.images` (render/stills/cover ใส่ให้จาก `images.lock.json` ผ่าน `scripts/lib/images.mjs`) · ยังไม่เลือก → วาด vector fallback
- สัดส่วนรูปอ่านจากไฟล์จริง · plate ไม่ใส่ขอบกระดาษ collage · era texture/DOF/กล้องใช้เหมือน vector

## กติกา
- ความยาวทั้งหมดคำนวณใน `calculateMetadata` จาก `public/<slug>/vo/<sceneId>.json` (`durationMs`, `cues`) ที่ `scripts/tts.py` สร้าง; ถ้ายังไม่มีเสียงครบทุกซีน จะประมาณเวลาจากตัวอักษรและไม่ใส่เสียง — **ห้าม hardcode `durationInFrames`**
- เวลาตัดช็อต = `cues[shotId]` แปลงเป็นเฟรม (`Math.round(ms/1000*fps)`)
- ทุกแอนิเมชันใช้ `useCurrentFrame()` + `interpolate()` / `spring()` — ห้าม CSS transition/animation, ห้าม `Math.random()` (ใช้ `random(seed)` ของ Remotion)
- โหลด asset ด้วย `staticFile()`, รูปใช้ `<Img>`, เสียงใช้ `<Audio>` / `<Sequence>`
- Scene = `<Series.Sequence>`; transition ข้ามยุคใช้ `@remotion/transitions` (`TransitionSeries`)
- Fonts: `@remotion/google-fonts` (Kanit, IBMPlexSansThai, Mali) และรอโหลดก่อน render
- Blur: CSS `filter: blur()` ต่อ layer ได้ แต่ถ้า > 10px และ layer ใหญ่ ให้ render ช้า → ยอมรับได้ หรือ pre-blur asset
- Texture: `<Img>` เต็มจอ + `mixBlendMode: 'multiply' | 'overlay' | 'screen'`, grain เป็น sequence/loop สั้นที่ seed ตามเฟรม
- Stop-motion (collage): quantize เฟรม `Math.floor(frame / (30/12)) * (30/12)` ก่อน interpolate
- `placeholder:<name>` → render กล่องสีตาม palette + ชื่อ เพื่อเช็ก timing/กล้องก่อนมี asset จริง
- ต้องมี `npm run validate` ตรวจ: schema, cue marker ครบ, sourceRef มีจริงใน facts.md, ยุคมีใน eras.ts, persona ของ voice, งบความยาว/ตัวอักษร/ช็อตจาก settings

## Render
- `node scripts/render.mjs <slug>` (= `npm run render` สำหรับ coffee-world, ปุ่ม Render ใน HistoryTeller) — สร้าง props จาก shots.json + settings (อัตราพูด เพลง SFX) แล้ว render composition `project` และ master เสียง
- composition `coffee-world` ใน Studio ไม่มี settings → ไม่มีเพลง/SFX (ใช้พรีวิวภาพเท่านั้น)
- เช็กแบบเร็ว: render still ของเฟรมแรกของทุกช็อต (`remotion still`) ก่อน render เต็ม
