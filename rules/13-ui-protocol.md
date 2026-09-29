# 13 · HistoryTeller UI Protocol (Claude ↔ UI)

ผู้ใช้ทำงานผ่านหน้า **HistoryTeller** (`npm run app` → http://127.0.0.1:4700) ส่วน Claude แก้ไฟล์
ทั้งสองฝั่งคุยกันผ่านไฟล์ 2 ไฟล์ในโปรเจกต์ — **ไม่มีช่องทางอื่น**

## ไฟล์สัญญา

### `projects/<slug>/status.json`
```json
{
  "stages": {
    "brief":  {"state": "approved", "at": "…", "by": "user", "hash": "…"},
    "shots":  {"state": "review",   "at": "…", "by": "claude", "note": "สรุปสั้น ๆ ว่าทำอะไร"}
  },
  "qa":    {"manual": {"hook": true}},
  "cover": {"selected": "A"}
}
```
- stage keys: `brief research beats script shots assets voice preview qa cover post` (ตรงกับ 00-pipeline ข้อ 1–11)
- `state`: `todo` → `draft` (Claude กำลังทำ / ผู้ใช้ขอแก้) → `review` (รอผู้ใช้) → `approved`
- `hash` เขียนโดย UI ตอนอนุมัติ — ถ้าไฟล์เปลี่ยนหลังอนุมัติ UI จะโชว์ "ล้าสมัย" เอง **ห้ามแก้ `hash`**
- `note` ใน stage ที่ state = `draft` และ `by: user` = คำสั่งแก้จากผู้ใช้ → อ่านก่อนทำ

### `projects/<slug>/feedback.jsonl` — append-only, 1 บรรทัด = 1 event
```json
{"id":"fb-002-dc27","target":"shot:S04-04","text":"บับเบิลเด้งช้าไป","status":"open","by":"user","at":"…"}
{"id":"fb-002-dc27","status":"done","by":"claude","note":"delay 0.4 → 1.1","at":"…"}
```
- `target`: `project` · `settings` · `brief|research|beats|script|assets` · `stage:<key>` · `scene:S03` · `shot:S04-08` · `vo:S02` · `cover:B` · `post` / `post:<platform>` (แก้ข้อความใน post.json) · `qa:<key>` · `img:<id>` (แก้ prompt ใน images.json — แล้วบอกผู้ใช้กด “สร้างใหม่” ของรูปนั้น)
- สถานะล่าสุดของแต่ละ `id` = event ล่าสุด (`open` / `done` / `dismissed`)
- **ห้ามแก้หรือลบบรรทัดเดิม** — ปิดงานด้วยการ append บรรทัดใหม่เท่านั้น

## `projects/<slug>/settings.json` (stage 0)
```json
{"format": "landscape-16x9", "style": "kurzgesagt-vox", "voice": "friend-sleepy-male", "targetSec": 180, "subtitles": "th", "overrides": {}}
```
- ผู้ใช้ตั้งผ่านหน้า Settings · ทุกเกณฑ์ (งบคำ/ช็อต/ความยาว/persona) คำนวณจากไฟล์นี้ — ดู `npm run budget -- <slug>`
- stage ที่อนุมัติแล้วเก็บ `settingsHash` · settings เปลี่ยน → UI โชว์ "ล้าสมัย" เอง (ห้ามแก้ `settingsHash`)
- Claude **อ่านได้เสมอ แต่ไม่แก้ settings.json เอง** ยกเว้นผู้ใช้สั่งในแชต/feedback (`target: settings`)

## กติกาสำหรับ Claude
1. เริ่มงานทุกครั้ง: อ่าน `status.json` + feedback ที่ยัง `open` + รัน `npm run budget -- <slug>` (หรืออ่าน settings.json + preset) ก่อนเขียนอะไร
2. ลำดับงาน: **feedback ที่ค้าง → stage แรกที่ไม่ใช่ `approved`** (ตาม 00-pipeline)
3. ระหว่างทำ stage: ตั้ง `state: "draft", by: "claude"`; เสร็จแล้วตั้ง `state: "review"` + `note` สรุป ≤ 1 บรรทัด
4. แก้ feedback เสร็จ: append `{"id", "status":"done", "by":"claude", "note", "at"}` — ทำไม่ได้/ไม่ควรทำ → `status: "open"` คงไว้ แล้วบอกเหตุผลในแชต
5. **ห้ามตั้ง `approved` เอง** (checkpoint เป็นของผู้ใช้) และห้ามแตะ `qa.manual` / `cover.selected` / `images.lock.json` → `selected` (ผู้ใช้เลือกรูปเอง)
6. แก้ไฟล์ต้นน้ำหลังอนุมัติ (เช่น script) → ตั้ง stage ปลายน้ำที่กระทบเป็น `review` พร้อม note ว่าต้องทำใหม่
7. งานที่ต้องใช้เน็ต/เครื่องผู้ใช้ (tts, imagegen, render, stills, cover) — ถ้ารันเองไม่ได้ ให้บอกผู้ใช้กดปุ่มใน HistoryTeller (หน้า เสียงพากย์ / Preview & Render / ปก) **อย่าหาทางอ้อม**
8. เขียน JSON ให้ถูกต้องเสมอ (UI อ่านไฟล์ทันทีที่เปลี่ยน) — status.json เขียนทั้งไฟล์, feedback.jsonl ต่อท้ายบรรทัดเดียว

## โปรเจกต์ใหม่
UI สร้าง `projects/<slug>/request.md` (หัวข้อ/คำถาม/คนดู/ประโยคที่อยากให้จำ) + `status.json` ให้
Claude ทำ `brief.md` จาก request.md → ตั้ง brief เป็น `review`
Render ใช้ composition `project` (props จาก shots.json) — ไม่ต้องเพิ่มโปรเจกต์ใน `src/Root.tsx`

## คำสั่งลัด (`.claude/commands/` — ต้นฉบับอยู่ที่ `docs/claude-commands/` ติดตั้งด้วย `mkdir -p .claude/commands && cp docs/claude-commands/*.md .claude/commands/`)
- `/ht-new <slug>` — ทำ Brief จาก request.md
- `/ht-next <slug>` — ทำ stage ถัดไปที่ยังไม่อนุมัติ
- `/ht-feedback <slug>` — แก้ทุกคำขอที่ค้าง
