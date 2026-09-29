# ออกแบบส่วนขยาย — TikTok/Shorts · เสียงพากย์เร็ว · ซับ 2 ภาษา · ภาพจาก AI

> วิเคราะห์ 2026-09-29 · ต่อจาก `docs/SETTINGS-DESIGN.md` (settings 3 แกน: format · style · voice + targetSec)
> หลักเดิมยังใช้: ทุกตัวเลขคำนวณใน `scripts/lib/settings.mjs` ที่เดียว · Claude ไม่อนุมัติเอง · งานที่ใช้เน็ต (TTS/รูป) รันบน Mac ผ่านปุ่มใน HistoryTeller

## 0. สรุปสั้น
| เรื่อง | ทำได้ไหม | ขนาดงาน | จุดที่ต้องแก้หลัก |
|---|---|---|---|
| 1. TikTok 30 วิ / 1 นาที (9:16) | ได้ | **ใหญ่** | ตอนนี้โค้ด fix 1920×1080 ไว้ 5 ไฟล์ · สูตรงบ Shorts ยังใช้ hook ≥ 8 วิ · ต้องมี format แนวตั้ง + style จังหวะเร็ว |
| 2. พากย์เร็ว รัว ๆ | ได้ | **เล็ก** | เพิ่ม voice preset ใหม่ + ลดช่องว่างระหว่างช่วงเสียง · ต้องวัดอัตราพูดจริง |
| 3. ซับไทย + อังกฤษ | ได้ | **กลาง** | เพิ่ม `voEn` ต่อซีน (cue เดียวกัน) · Subtitles 2 ภาษา · export .srt |
| 4. สร้างภาพด้วย AI แทน vector | ได้ (แบบผสม) | **ใหญ่** | สคริปต์ `imagegen.py` ผ่าน OpenRouter (key เดียวกับ TTS) · layer ชนิดรูป · หน้าเลือกรูปใน UI |

ลำดับที่แนะนำ: **2 → 3 → 1 → 4** (เร็วสุดก่อน และ 1 กับ 4 ต้องแก้ renderer ทั้งคู่ — ทำ 1 ก่อนจะได้ออกแบบรูปให้รองรับทั้ง 16:9 และ 9:16 ตั้งแต่แรก)

---

## 1. ประเภทคลิปสั้น TikTok / Reels / YouTube Shorts (30 วิ · 1 นาที)

### 1.1 ปัญหาของระบบตอนนี้
- `src/theme/tokens.ts` มี `W=1920, H=1080` ถูก import ใน `camera.ts`, `Stage.tsx`, `ThaiText.tsx`, `Data.tsx`, `Cover.tsx` → วิดีโอแนวตั้งจะวางผิดทั้งหมด
- `budget()` มีโหมด short (T ≤ 75) แต่ hook = `clamp(T×0.067, 8, 15)` → 30 วิ ได้ hook 8 วิ (ยาวไปสำหรับ TikTok ที่คนตัดสินใจใน 1–2 วิ)
- ข้อความบนจอ/ซับวางด้วยพิกัด 1920×1080 ตายตัว · มีแค่ format `landscape-16x9`

### 1.2 ของใหม่
**format `portrait-9x16`** (`presets/formats/portrait-9x16.json`)
```json
{"id": "portrait-9x16", "name": "TikTok / Reels / Shorts 9:16", "width": 1080, "height": 1920, "fps": 30,
 "safe": {"top": 160, "bottom": 420, "left": 90, "right": 150},
 "subtitle": {"mode": "caption", "y": 1300, "fontSize": 64, "maxLineChars": 16, "maxLines": 1},
 "cover": {"width": 1080, "height": 1920, "gridCrop": "3:4"}}
```
- safe zone อิงค่าที่ใช้กันทั่วไปของ TikTok (บน ~108px, ล่าง ~320px, ขวา ~120px ปุ่มหัวใจ/แชร์) แล้วเผื่อเพิ่ม เพราะคำบรรยายคลิปของ TikTok กินพื้นที่ล่างมากกว่านั้นเมื่อพิมพ์ยาว
- ข้อความ/ซับทั้งหมดอยู่ในกรอบกลาง ~900×1160 → ใช้ได้ทั้ง TikTok, Reels, YouTube Shorts ไฟล์เดียว

**style `shorts-punch`** (จังหวะเร็ว): `shotSec` 1.2–2.5 วิ (ยาวสุด 4) · parallax 20–35% · data 20–35% · ยุค ≤ 2 · ห้ามภาพนิ่ง > 0.5 วิ · SFX ถี่ขึ้น · เพลงดังกว่าเดิมเล็กน้อย

**โครงเรื่อง "สรุปจบในคลิปเดียว"** (แทนสูตร short เดิมใน `budget()`)
| ความยาว | Hook | ส่วนกลาง | Payoff | Loop line | ช็อต |
|---|---|---|---|---|---|
| 0:30 | 0–3 วิ | reveal 2 ครั้ง (3–22) | 22–28 | 28–30 | 14–22 |
| 1:00 | 0–3 วิ | context สั้น + reveal 3 ครั้ง (3–52) | 52–58 | 58–60 | 26–40 |
- Hook = ประโยคแรกคือคำถาม/ตัวเลขที่แรงที่สุด **ภาพแรกต้องขยับตั้งแต่เฟรมแรก** (ไม่มี fade-in)
- ไม่มี "สวัสดี" / "ติดตามตอนต่อไป" / CTA ยาว · 1 คลิป = 1 คำถาม ตอบจบในคลิป
- Loop line: ประโยคสุดท้ายโยงกลับไปประโยคแรก (คนดูวนซ้ำ = TikTok ดันยอด)
- ตัวเลขเยอะไม่ได้: ≤ 3 ตัวเลขต่อ 30 วิ

**งบตัวอักษร** (สูตรเดิม `T × 0.95 × r` แต่ speech ratio ของ Shorts ≈ 0.97 เพราะแทบไม่มีช่วงเงียบ)
| เสียง | 0:30 | 1:00 |
|---|---|---|
| ปกติ (r ≈ 11) | ~320 ตัวอักษร | ~640 |
| พากย์เร็ว (r ≈ 15, ประมาณ — ต้องวัดจริง) | ~435 | ~870 |

### 1.3 ต้องแก้ในโค้ด
1. `W/H` → อ่านจาก `useVideoConfig()` (5 ไฟล์) · `Root.tsx` ตั้ง width/height จาก format ใน `calculateMetadata`
2. พิกัดข้อความ: เปลี่ยนเป็น **สัดส่วน** (`x: 0.5, y: 0.3` = กลางจอ 30% จากบน) หรือ anchor (`"top" | "center" | "lower"`) — shots.json เดิมยังรองรับพิกัด px ได้
3. `Subtitles` โหมด `caption` (แนวตั้ง): ตัวใหญ่ 1 บรรทัด ขึ้นทีละวลี 2–4 คำ ไฮไลต์คำที่กำลังพูด (แบบคลิป TikTok) · โหมด `box` (แนวนอน) เหมือนเดิม
4. แผนที่/กราฟ (`Data.tsx`): layout แนวตั้ง (bar แนวนอนเรียงลง, แผนที่ scale ตามความกว้าง)
5. `validate.mjs`: ตรวจข้อความ/ซับอยู่ใน safe zone ของ format · hook ≤ 3 วิ · ไม่มีคำลา/CTA
6. ปก: TikTok ใช้ภาพจากเฟรม + ตัวหนังสือ — `Cover` รองรับ 1080×1920 และเช็กว่าหัวข้ออยู่ในกรอบ 3:4 กลางจอ (หน้าโปรไฟล์ตัดเป็น 3:4)
7. HistoryTeller: หน้าโปรเจกต์ใหม่เลือก "YouTube (แนวนอน)" / "TikTok · Reels · Shorts (แนวตั้ง)" · ความยาว 30 วิ / 1 นาที · render ได้ `out/<slug>-9x16.mp4`

### 1.4 ทำจากโปรเจกต์ยาวได้ไหม
แนะนำ **"แตกคลิปสั้นจากโปรเจกต์ยาว"**: สร้างโปรเจกต์ใหม่ `adam-short-1` ที่มี `"derivedFrom": "adam"` → ใช้ `facts.md` และภาพ (asset/รูป) ร่วมกันได้ แต่ **เขียนบท + ช็อตใหม่** (แปลงภาพ 16:9 เป็น 9:16 อัตโนมัติจะได้ภาพที่แย่ เพราะองค์ประกอบคนละแบบ) · 1 โปรเจกต์ยาว 5 นาทีแตกได้ ~3–5 คลิปสั้น (1 คลิป/1 mini-reveal)

---

## 2. เสียงพากย์แบบเร็ว รัว ๆ

### 2.1 voice preset ใหม่ `fast-hype` ("เล่าเร็ว รัว ๆ")
```json
{"id": "fast-hype", "name": "เล่าเร็ว รัว ๆ",
 "persona": {"pronoun": "เรา", "particles": ["เลย", "นะ", "อะ"], "polite": null,
             "banned": ["สวัสดี", "ติดตาม", "กดไลก์", "ดังนั้นจึง", "ซึ่งได้แก่", "ครับ", "ค่ะ"], "limits": {"…": 3}},
 "tts": {"model": "google/gemini-3.8-flash-tts", "voice": "Puck",
         "style": "Fast, punchy Thai explainer like a viral short video: rapid-fire delivery, high energy, almost no pauses, clear articulation, excited on numbers.",
         "gapMs": 40, "paraGapMs": 220, "tempo": 1.0,
         "audition": ["Puck", "Fenrir", "Laomedeia", "Sadachbia", "Zephyr", "Autonoe"]},
 "charsPerSec": 15.0, "calibrated": null}
```
- **ความเร็วมาจาก style prompt + ช่องว่างสั้น** (Gemini TTS ไม่มีพารามิเตอร์ speed ตรง ๆ) → ตัวเลข 15 ตัว/วิ เป็นค่าประมาณ ต้องกด "ลองเสียง" แล้ววัดจริงก่อนเขียนบท (เหมือน r=10.2 ของ coffee-world)
- `tempo` (ไม่บังคับ, 1.0–1.15): เร่งด้วย ffmpeg `atempo` หลังสังเคราะห์ — **เป็นส่วนหนึ่งของสไตล์ ไม่ใช่ทางแก้บทยาวเกิน** (rule 01 ยังห้ามเร่งเพื่อแก้บท) · งบคำนวณจาก `charsPerSec × tempo`
- persona (`presets/voices/fast-hype.md`): ประโยคสั้นมาก ≤ 12 พยางค์ · ขึ้นต้นด้วยตัวเลข/คำกริยา · ไม่เกริ่น · `…` ใช้ได้แค่ก่อน reveal (≤ 3 ครั้ง)

### 2.2 สิ่งที่ต้องแก้
- `tts.py`: ตอนนี้สังเคราะห์ทีละช่วงระหว่าง cue แล้วต่อด้วยช่องว่าง `gapMs` → เสียงเร็วต้อง gap ≤ 50ms + `trim_silence` ตัดหัวท้ายชิดขึ้น (keep 15ms แทน 40ms) ไม่งั้นจะสะดุดเป็นจังหวะ ๆ
- ช็อตเร็วตามเสียง: ถ้าใช้ `fast-hype` กับ style ปกติ ช็อตจะยาวเกินคำพูด → แนะนำคู่กับ `shorts-punch`
- ใช้กับคลิปยาวได้ แต่ 5 นาทีเร็วตลอดคนดูล้า → UI เตือนเมื่อ `fast-hype` + targetSec > 120

---

## 3. ซับ 2 ภาษา (ไทย + อังกฤษ)

### 3.1 ข้อมูล
- เพิ่ม `voEn` ต่อซีนใน shots.json — **cue marker ชุดเดียวกับ `vo`** (`[#S01-02]`) แปลทีละช่วง ช่วงต่อช่วง → เวลาตรงกับเสียงไทยโดยอัตโนมัติ (ใช้ `cues` จากไฟล์ timing เดิม)
- Claude แปลใน stage 4 (บทพากย์) · `script.md` มีบรรทัด `**EN:**` ใต้ `**VO:**` · ผู้ใช้อนุมัติพร้อมบท
- แนวแปล: แปลความหมาย ไม่แปลคำต่อคำ · ≤ 42 ตัวอักษร/บรรทัด · ชื่อเฉพาะสะกดสากล (Jebel Irhoud, Atrahasis) · คำลงท้ายไทย (นะ/อะ) ไม่ต้องแปล

### 3.2 การแสดงผล (`settings.json` → `subtitles`)
```json
"subtitles": {"mode": "th+en", "burn": true, "export": ["srt", "vtt"]}
```
| mode | แนวนอน 16:9 | แนวตั้ง 9:16 |
|---|---|---|
| `th` | เหมือนเดิม | caption ตัวใหญ่ |
| `th+en` | กล่องเดียว: ไทย 40px ≤ 2 บรรทัด + อังกฤษ 30px ≤ 2 บรรทัด สีอ่อนลง | ไทย 60px 1 บรรทัด + อังกฤษ 38px 1 บรรทัด |
| `en` | อังกฤษอย่างเดียว | อังกฤษอย่างเดียว |
| `off` | ไม่ฝังซับ | ไม่ฝังซับ |
- ภายใน 1 ช่วง cue ถ้าข้อความยาว ตัดเป็นหลายชุดโดย **ไทยกับอังกฤษแบ่งเป็นจำนวนชุดเท่ากัน** สลับพร้อมกัน (ตามสัดส่วนความยาว)
- ขยับ layer/ข้อความบนจอขึ้นเมื่อซับสูงขึ้น: validate เช็กว่าข้อความไม่ชนกล่องซับ (ปัญหาเดียวกับที่เพิ่งแก้ใน adam)

### 3.3 ไฟล์ซับแยก
- `scripts/subs.mjs <slug>` → `out/<slug>.th.srt`, `out/<slug>.en.srt` (+ .vtt) จากเวลาจริงของเสียง
- **YouTube แนะนำ:** ฝังไทย (`th`) + อัปโหลด `.en.srt` เป็นคำบรรยายภาษาอังกฤษ (คนดูเปิด/ปิดได้, ค้นหาเจอด้วยภาษาอังกฤษ) · **TikTok:** ฝัง `th+en` (ไม่มีระบบซับหลายภาษาแบบไฟล์)
- ข้อความบนจอ (label/ตัวเลข/ปก) ยังเป็นภาษาไทย — ถ้าอยากได้คลิปภาษาอังกฤษเต็มตัว (เสียงอังกฤษด้วย) เป็นอีกงานหนึ่ง (`voice` ภาษาอังกฤษ + `text.contentEn`) ยังไม่รวมในรอบนี้

---

## 4. สร้าง object เป็น "รูปภาพ" (AI image) แทน vector

### 4.1 ทางเลือก
| แบบ | ข้อดี | ข้อเสีย |
|---|---|---|
| A. vector ในโค้ด (ตอนนี้) | คม, ขยับได้ทุกส่วน (กะพริบตา, เข็มนาฬิกา), ฟรี, คุมสไตล์ได้ 100% | ดูเรียบ/ธรรมดา, วาดทีละชิ้นช้า |
| B. **AI image ทั้งหมด** | สวย รายละเอียดเยอะ ได้ภาพเร็ว | ขยับได้แค่ทั้งชิ้น (ลอย/เด้ง/parallax), ตัวอักษรในรูปมักผิด, สไตล์ไหลได้, มีค่าใช้จ่าย |
| C. **ผสม (แนะนำ)** | ฉาก/ตัวละคร/ของ = รูป AI · ข้อมูล/กราฟ/แผนที่/ตัวหนังสือ/นาฬิกา/ลูกศร = vector | ต้องมีกติกาว่าอะไรเป็นอะไร |

→ แนะนำ **C**: ตั้งใน style preset `"render": "hybrid"` (หรือ `"vector"` แบบเดิม) · ตัวหนังสือ/ตัวเลข **ห้ามอยู่ในรูป** ใส่ด้วย Remotion เสมอ (อ่านชัด แก้ง่าย แปลได้)

### 4.2 Pipeline (stage 6 ขยาย → "ภาพ")
```
assets.md ─► images.json ─► python scripts/imagegen.py <slug> ─► public/<slug>/img/<id>.png ─► ผู้ใช้เลือกรูปใน HistoryTeller ─► shots.json ใช้ "img:<id>"
```
**`projects/<slug>/images.json`** (Claude เขียนจาก assets.md)
```json
{"style": "สไตล์รวมจาก preset (ดู 4.3)",
 "images": [
  {"id": "clay-buddy-happy", "kind": "cutout", "aspect": "1:1", "prompt": "a small round lump of reddish clay with simple cute eyes and a smile …", "refs": ["clay-buddy-sheet"], "variants": 3},
  {"id": "earth-young-plate", "kind": "plate", "aspect": "16:9", "prompt": "the young Earth glowing with molten cracks, seen from space …"},
  {"id": "cuneiform-tablet", "kind": "cutout", "aspect": "3:4", "prompt": "an ancient clay tablet with wedge-shaped marks, no readable text …"}
 ]}
```
- `kind`: `plate` = ฉากหลังเต็มเฟรม (ไม่ต้องโปร่งใส) · `cutout` = ของ/ตัวละครพื้นโปร่งใส (ใช้เป็น layer ใน parallax) · `texture`
- **parallax ต้องแยกชั้น:** สร้าง bg plate (ไม่มีพระเอก) + cutout พระเอก + cutout ฉากหน้า แยกกัน — ไม่ตัดจากภาพเดียว

**`scripts/imagegen.py`** (รันบน Mac ปุ่ม "สร้างภาพ" — cloud ถูกบล็อกเหมือน TTS)
- เรียก OpenRouter Image API `POST /api/v1/images` (key เดียวกับ TTS ใน `.env`) — รองรับ `aspect_ratio`, `resolution`, `background: "transparent"`, `input_references`, `n`
- cache ด้วย hash(model|prompt|style|refs|size) — แก้ prompt รูปเดียว จ่ายรูปเดียว
- ได้ผู้สมัคร `variants` รูป → `public/<slug>/img/_cand/<id>-1..3.png` → ผู้ใช้เลือก → คัดลอกเป็น `<id>.png` + บันทึก model/prompt/cost ใน `images.lock.json`
- cutout: ใช้โมเดลที่ทำพื้นโปร่งใสได้เอง (`background: transparent`) · ถ้าโมเดลทำไม่ได้ → สั่งพื้นสีเรียบแล้วลบพื้นด้วย `rembg` (ติดตั้งบน Mac, ต้องโหลดโมเดล ~170MB ครั้งแรก)

**Renderer**
- layer `"asset": "img:clay-buddy-happy"` → `<Img src={staticFile('<slug>/img/…png')}>` ใช้กล้อง/DOF/anim/era texture เดิมได้ทั้งหมด
- collage style = ภาพเดียวกัน + filter กระดาษ/halftone/ขอบขาว (มีอยู่แล้วใน `cut-` filter + EraTexture)
- **สีหน้า/ท่าทางต่างกัน = รูปต่างกัน** (`clay-buddy-happy`, `-wow`, `-confused`…) เพราะรูปขยับเฉพาะส่วนไม่ได้
- validate: ตรวจว่ารูปที่อ้างถึงมีไฟล์จริง + ถูกเลือกแล้ว

### 4.3 คุมสไตล์ + ตัวละครให้คงที่
- style preset เพิ่ม `imageStyle` เช่น kurzgesagt-vox → *"flat 2D vector-like illustration, soft gradients, rounded shapes, no outlines, dark navy background palette #0E1A2B, accent #FFC94A #FF6B4A"* (บรรยายลักษณะ **ห้ามใส่ชื่อช่อง/ศิลปิน** — rule 04)
- ต่อท้ายทุก prompt: *"no text, no letters, no watermark, no logo"*
- ตัวละคร anchor: สร้าง **character sheet** 1 รูปก่อน (ผู้ใช้อนุมัติ) → ทุกรูปของตัวละครส่ง sheet เป็น `input_references` → หน้าตาคงที่
- era: ใช้ prompt เสริมต่อยุค (prehistoric = "cave-painting ochre tones" ฯลฯ) + texture overlay เดิมของ Remotion ช่วยให้ภาพต่างที่มาดูเป็นชุดเดียวกัน

### 4.4 ต้นทุน (ประมาณ — ราคาเปลี่ยนตามโมเดล/ความละเอียด เช็ก `GET /api/v1/images/models`)
- ราคาต่อรูปบน OpenRouter ต่างกันมาก (~1 เซนต์ ถึง ~20 เซนต์ต่อรูปตาม model/quality)
- คลิป 5 นาที ≈ 40–60 รูป × 3 ตัวเลือก ≈ 120–180 ครั้ง → **ประมาณ $2–$30/คลิป** · คลิปสั้น 1 นาที ≈ 15–25 รูป
- ประหยัด: สร้างตัวเลือก 1 รูปก่อน (`variants: 1`) ขอเพิ่มเฉพาะที่ไม่ชอบ · ใช้รูปซ้ำข้ามคลิปสั้นที่แตกจากคลิปยาว

### 4.5 ความเสี่ยง / กติกา
- **ภาพบุคคลศักดิ์สิทธิ์ (เช่นโปรเจกต์ adam):** AI อาจวาดหน้าคนมาเอง → prompt ห้ามใบหน้า + **ผู้ใช้ต้องตรวจทุกรูปก่อนใช้** (ไม่มี auto-approve)
- ลิขสิทธิ์/เงื่อนไข: ตรวจเงื่อนไขเชิงพาณิชย์ของโมเดลที่เลือก · บันทึก model + prompt + วันที่ทุกรูปใน `assets.md` (ต่อยอดตาราง license เดิม)
- YouTube: ภาพแนวการ์ตูน/เห็นชัดว่าไม่จริง **ไม่ต้องติดป้าย AI** ตามนโยบาย altered/synthetic content (ต้องติดเมื่อเป็นภาพสมจริงที่ทำให้เข้าใจผิดว่าเป็นเหตุการณ์จริง) → หลีกเลี่ยงสไตล์ภาพถ่ายสมจริงของเหตุการณ์ประวัติศาสตร์
- รูปคม: plate สำหรับ parallax ต้องใหญ่กว่าเฟรม (cover ×1.2–1.5) → สร้างที่ 2K ขึ้นไป

### 4.6 HistoryTeller
หน้าใหม่ **"ภาพ"** (หลัง Asset list): การ์ดต่อรูป = prompt (แก้ได้) · ผู้สมัคร 1–3 รูป · ปุ่ม เลือก / สร้างใหม่ / ขอแก้ (feedback `target: img:<id>`) · ยอดเงินที่ใช้ไป · stage `images` ต้องอนุมัติก่อน Render

---

## 5. แผนทำ

> สถานะ 2026-09-29: **รอบ 1 ✅** (fast-hype, tts gap/trim/tempo, คำเตือนในงบ) · **รอบ 2 ✅** (voEn, ซับ 2 ภาษา, subs.mjs, validate, Settings/Preview UI, แปล adam เป็นตัวอย่าง) · **รอบ 3 ✅** (portrait-9x16, shorts-punch, สูตรคลิปสั้น, W/H จาก useVideoConfig, ซับ caption แนวตั้ง, ปกแนวตั้ง, validate safe zone/hook/CTA, UI เลือกแนวตั้ง + แตกจากโปรเจกต์, ตัวอย่าง adam-short-1) · **รอบ 4 ✅** (images.json, imagegen.py + cache/cost/ลบพื้นเขียว, layer img:<id>|fallback, หน้าเลือกรูปใน Asset list, validate, นำร่อง adam 13 รูป)
| รอบ | งาน | ผลที่เห็น |
|---|---|---|
| 1 | voice `fast-hype` + ปรับ tts.py (gap/trim/tempo) + ปุ่มลองเสียง | ฟังเสียงเร็วได้ทันที · วัด r จริง |
| 2 | ซับ 2 ภาษา: `voEn`, Subtitles 2 ภาษา, `subs.mjs` (.srt/.vtt), validate, ตัวเลือกใน Settings · แปลบท adam เป็นตัวอย่าง | render adam ใหม่มีซับ TH+EN + ไฟล์ .en.srt |
| 3 | 9:16: refactor W/H, format + style `shorts-punch`, สูตร Shorts ใหม่, caption แนวตั้ง, safe-zone validate, ปกแนวตั้ง, UI เลือกแนวตั้ง/30 วิ/1 นาที · ทำ `adam-short-1` เป็นตัวอย่าง | คลิป TikTok 30 วิ ตัวแรก |
| 4 | ภาพ AI: `images.json`, `imagegen.py`, layer `img:`, หน้า "ภาพ", rules 04/10/13 · ทดลองกับ adam (ตัวละคร + 5 ฉากสำคัญก่อน) | เทียบ vector vs รูป ในคลิปเดียวกัน |

## 6. ต้องตัดสินใจก่อนเริ่ม
1. ลำดับ 2 → 3 → 1 → 4 โอเคไหม (หรืออยากได้ภาพ AI ก่อน)
2. ภาพ AI: งบต่อคลิปประมาณเท่าไร / อยากลองโมเดลไหน (จะทดสอบ 2–3 โมเดลกับตัวละครก้อนดินให้เลือก)
3. ซับบน YouTube: ฝัง TH+EN ทั้งคู่ หรือ ฝังไทย + ไฟล์ EN แยก
4. คลิปสั้น: แตกจากโปรเจกต์ยาว (ใช้ facts/ภาพร่วม) หรือเริ่มเรื่องใหม่แยกเป็นหลัก
