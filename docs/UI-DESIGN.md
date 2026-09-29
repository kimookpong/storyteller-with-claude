# HistoryTeller with Claude — UI Design

> สถานะ: **MVP ใช้งานได้แล้ว** (`npm run app`) · โปรโตคอลฝั่ง Claude: `rules/13-ui-protocol.md` · อ้างอิง pipeline ใน `rules/00-pipeline.md`
>
> MVP ทำแบบไม่มี dependency เพิ่ม (Node http + vanilla JS) เพื่อให้รันได้ทันทีโดยไม่ต้อง `npm install` ใหม่ — Remotion Player / waveform ยังเป็นงาน V2

## 1. ปัญหาที่ UI ต้องแก้ (จากการใช้งานจริง)

| ปัญหาที่เจอ | ผลกระทบ | UI แก้ยังไง |
|---|---|---|
| ไม่รู้ว่าโปรเจกต์อยู่ stage ไหน / อะไรอนุมัติแล้ว | ต้องถาม Claude หรือเปิดไฟล์ไล่ดู | Stage rail 10 ขั้น + สถานะต่อขั้น (ร่าง / รออนุมัติ / อนุมัติ / ล้าสมัย) |
| Checkpoint อนุมัติเกิดในแชต | ไม่มีบันทึก, Claude ข้ามขั้นได้ | ปุ่ม **อนุมัติ / ขอแก้** เขียนลง `status.json` — Claude ห้ามอนุมัติเอง |
| สั่งแก้ภาพต้องพิมพ์ shot id เอง | สื่อสารผิดช็อต, เสียเวลา | กดที่ช็อต → คอมเมนต์ → เข้าคิว `feedback.jsonl` ผูกกับ `shot:S04-08` |
| คำสั่ง tts / render ต้องรันใน Terminal (sandbox ของ Claude ถูกบล็อกเน็ต) | สลับหน้าต่างไปมา | UI server รันบน Mac → มีเน็ต/ffmpeg/Remotion ครบ กดปุ่มเดียว + log สด |
| ไฟล์วิดีโอหลายเวอร์ชัน สับสนว่าตัวไหนมีเสียง | เปิดไฟล์เก่าแล้วคิดว่าบั๊ก | หน้า Output แสดง badge: มีเสียง / LUFS / ความยาว / เวลา render / "ล่าสุด" |
| แก้ `shots.json` ด้วยมือยาก | ต้องพึ่ง Claude ทุกเรื่องเล็ก | Storyboard + ฟอร์มแก้ค่าง่าย ๆ (ตำแหน่ง text, delay) — เรื่องใหญ่ส่งให้ Claude |
| QA checklist ติ๊กด้วยตา | พลาดง่าย | ติ๊กอัตโนมัติจาก validate / ffprobe / loudness, เหลือข้อที่ต้องใช้คนตัดสิน |
| เลือกปกจากไฟล์ jpg | ไม่เห็นบริบทจริง | จำลองฟีด YouTube (เดสก์ท็อป + มือถือ) เทียบ A/B แล้วกดเลือก |

## 2. หลักการออกแบบ

1. **Claude เขียน · UI แสดงและตัดสิน** — Claude (Cowork / Claude Code) เป็นคนสร้างและแก้ไฟล์ทั้งหมด UI ไม่แต่งเนื้อหาเอง แต่ทำให้ "ดู เทียบ อนุมัติ สั่งงาน" ง่ายที่สุด
2. **ไฟล์คือความจริงหนึ่งเดียว** — ไม่มีฐานข้อมูลแยก UI อ่าน/เขียนไฟล์ใน `projects/<slug>/` และอัปเดตทันทีเมื่อ Claude แก้ไฟล์ (file watcher)
3. **คนเป็นเจ้าของ checkpoint** — อนุมัติได้จาก UI เท่านั้น แก้ไฟล์ต้นน้ำหลังอนุมัติ → ขั้นปลายน้ำขึ้น "ล้าสมัย" อัตโนมัติ
4. **ทุกปุ่มที่ต้องใช้ Claude = prompt พร้อมใช้** — กดแล้วได้ข้อความที่อ้างไฟล์/ช็อตถูกต้อง คัดลอกไปวางใน Cowork ได้เลย
5. **ภาษาไทยเป็นหลัก** ศัพท์เทคนิคคงไว้ (shot, cue, render) — ฟอนต์ IBM Plex Sans Thai / Kanit ชุดเดียวกับวิดีโอ

## 3. สถาปัตยกรรม

```
┌──────────── Mac ของผู้ใช้ ────────────────────────────┐
│  Browser: http://127.0.0.1:4700  (HistoryTeller UI)    │
│      │  REST + SSE                                    │
│  app/server (Node) ── รัน npm scripts ที่อนุญาต ──> tts.py / validate / stills / render / cover
│      │  อ่าน/เขียน + watch                               │
│  projects/<slug>/  brief.md facts.md beats.md script.md shots.json
│                    status.json  feedback.jsonl          │
│  public/<slug>/vo/*.wav|json   out/…                    │
└──────────────▲────────────────────────────────────────┘
               │ แก้ไฟล์ (โฟลเดอร์ที่เชื่อมไว้)
        Claude ใน Cowork / Claude Code  ← อ่าน CLAUDE.md + status.json + feedback.jsonl
```

- `app/web` — Vite + React; พรีวิววิดีโอด้วย `@remotion/player` นำเข้า `src/Main` ตรง ๆ (ไม่ต้อง render ก่อนดู)
- `app/server` — `node:http` เล็ก ๆ ผูก 127.0.0.1 เท่านั้น, **รันได้เฉพาะคำสั่งใน whitelist**, ไม่ส่ง `.env` ออกหน้าเว็บ
- เริ่มด้วย `npm run app`

### ไฟล์สัญญาใหม่ (Claude ↔ UI)

`projects/<slug>/status.json`
```json
{
  "stages": {
    "brief":    {"state": "approved", "at": "2026-09-28T08:00:00+07:00", "hash": "…"},
    "research": {"state": "approved"},
    "beats":    {"state": "approved"},
    "script":   {"state": "approved"},
    "shots":    {"state": "review"},
    "assets":   {"state": "draft"},
    "voice":    {"state": "done"},
    "preview":  {"state": "todo"},
    "qa":       {"state": "todo"},
    "cover":    {"state": "review", "selected": null}
  }
}
```
state: `todo` → `draft` (Claude กำลังทำ) → `review` (รอคน) → `approved` · `stale` = ไฟล์ต้นน้ำเปลี่ยนหลังอนุมัติ (เทียบ `hash`)

`projects/<slug>/feedback.jsonl` — 1 บรรทัด 1 คำขอ
```json
{"id":"fb-012","target":"shot:S04-08","text":"ป้ายทับซับ ย้ายขึ้นบน","status":"open","at":"…"}
{"id":"fb-012","status":"done","by":"claude","note":"ย้าย y 960→110","at":"…"}
```
target: `brief` · `script:S03` · `shot:S04-08` · `vo:S02` · `cover:B` · `project`

### โปรโตคอลฝั่ง Claude (เพิ่มใน CLAUDE.md)
1. เริ่มงานทุกครั้ง: อ่าน `status.json` + feedback ที่ `open`
2. ทำงานตาม stage แรกที่ไม่ใช่ `approved` หรือแก้ feedback ที่ค้าง
3. เสร็จแล้ว: ตั้ง stage เป็น `review`, ปิด feedback ด้วย `status: done` + `note`
4. **ห้ามตั้ง `approved` เอง** และห้ามรันขั้นที่ต้องใช้เน็ตถ้า sandbox ถูกบล็อก — ให้บอกผู้ใช้กดปุ่มใน UI แทน

คำสั่งลัดสำหรับ Claude (skill / slash command): `/ht-new <หัวข้อ>` · `/ht-next` · `/ht-feedback`

## 4. หน้าจอ

| # | หน้า | เนื้อหาหลัก | Action |
|---|---|---|---|
| 1 | **โปรเจกต์ทั้งหมด** | การ์ดโปรเจกต์: ปก, stage ปัจจุบัน, ความยาว, "ต้องทำอะไรต่อ" | สร้างโปรเจกต์ใหม่ (ฟอร์มหัวข้อ/กลุ่มคนดู/ประโยคที่อยากให้จำ → prompt `/ht-new`) |
| 2 | **Workspace** (โครงหลัก) | ซ้าย: stage rail · กลาง: เนื้อหา stage · ขวา: แผง Claude (prompt ถัดไป, คิว feedback, กิจกรรมล่าสุด) | อนุมัติ / ขอแก้ / คัดลอก prompt |
| 3 | Brief & Research | brief.md, ตาราง facts + ป้ายความมั่นใจ + ลิงก์แหล่ง | เตือน fact ความมั่นใจต่ำที่ถูกใช้ในบท |
| 4 | Beats | ไทม์ไลน์ 3:00 แบ่งสีตามยุค + จุด mini-reveal | เช็กระยะ reveal 30–40s |
| 5 | Script | VO ต่อซีน, cue เป็น chip, มิเตอร์งบตัวอักษร 1,500–1,800, ไฮไลต์คำต้องห้ามสด | คอมเมนต์ต่อซีน |
| 6 | **Storyboard** | กริดช็อตตามซีน (ภาพนิ่งจาก `stills`), ป้าย kind/era, ช่วง VO ของช็อต | คลิกช็อต → รายละเอียด + คอมเมนต์ + แก้ค่าเล็ก |
| 7 | Voice | เครื่องเล่นต่อซีน + waveform + จุด cue, เทียบเวลาประมาณ vs จริง | สร้างเสียงใหม่เฉพาะซีน |
| 8 | Preview & Render | Remotion Player, สลับซับ, รายการไฟล์ output + badge เสียง/LUFS | Render / Master / เปิดโฟลเดอร์ |
| 9 | QA | เช็กลิสต์ rule 11: อัตโนมัติ ✓/✗ + ข้อที่คนต้องติ๊ก | ส่งข้อไม่ผ่านเป็น feedback |
| 10 | Cover | ปก A/B/C ขนาดเต็ม + จำลองฟีด YouTube มือถือ | เลือกปก → `status.json` |

แถบล่าง: **Jobs** (validate / tts / stills / render / cover) พร้อม progress และ log

## 5. แผนทำ

| เฟส | ขอบเขต | ได้อะไร |
|---|---|---|
| MVP | server + status/feedback + Workspace + Storyboard (ภาพนิ่ง) + Jobs + Output badges | เลิกใช้ Terminal, สั่งแก้รายช็อตได้ |
| V2 | Remotion Player, Voice waveform, QA อัตโนมัติ, Cover feed | ตรวจงานจบในหน้าเดียว |
| V3 | ปุ่ม "ให้ Claude ทำเลย" ผ่าน `claude -p` (Claude Code headless บน Mac), หลายโปรเจกต์/template | ลดการคัดลอก prompt |

## 6. ความเสี่ยง
- **Claude กับ UI แก้ไฟล์เดียวกันพร้อมกัน** → UI แก้แค่ `status.json` / `feedback.jsonl` / ค่าเล็กใน shots.json ผ่าน server (เขียนแบบ atomic + เช็ก mtime)
- **Remotion Player ใน Vite** ต้อง map `public/` และ font — ถ้าติด ใช้ iframe Remotion Studio แทนในเฟสแรก
- **`claude -p` ใช้ credit/สิทธิ์ของผู้ใช้** → เป็นตัวเลือก ปิดไว้เป็นค่าเริ่มต้น
