# 00 · Pipeline

ทุกโปรเจกต์อยู่ใน `projects/<slug>/` ทำตามลำดับ ห้ามข้าม stage

| # | Stage | Output | Checkpoint |
|---|-------|--------|-----------|
| 0 | Settings | `settings.json` — format · style · voice · ความยาว (rule 01) → `npm run budget -- <slug>` | ผู้ใช้เลือกใน HistoryTeller (Claude เสนอได้ แต่ไม่แก้เองหลังเริ่มงาน) |
| 1 | Brief | `brief.md` — หัวข้อ, คำถามหลักที่คนดูจะได้คำตอบ, กลุ่มคนดู, 1 ประโยคที่อยากให้จำ | ✅ ผู้ใช้อนุมัติ |
| 2 | Research | `facts.md` — ข้อเท็จจริง/ตัวเลข + แหล่งที่มา + ระดับความมั่นใจ | |
| 3 | Beat sheet | `beats.md` — ตาม `02-story-structure` + ตาราง beat จาก `npm run budget` พร้อม timecode และ `era` ของแต่ละ beat | ✅ ผู้ใช้อนุมัติ |
| 4 | Script | `script.md` — บทพากย์เต็ม ตาม `03-narration-thai` + persona ใน `presets/voices/<voice>.md` + ตรวจงบคำ | ✅ ผู้ใช้อนุมัติ |
| 5 | Shot list | `shots.json` — ตาม `09-shotlist-schema` | |
| 6 | Asset list (+ ภาพ AI) | `assets.md` — รายการภาพ/เลเยอร์ + license · ถ้าใช้ภาพ AI: `images.json` (rule 04) → ผู้ใช้กด “สร้างภาพ” แล้วเลือกรูปในหน้า Asset list (`imagegen.py` → `public/<slug>/img/`) | ✅ ผู้ใช้เลือกรูป |
| 7 | Voice | `python scripts/tts.py projects/<slug>/shots.json` (OpenRouter → Gemini TTS) → `public/<slug>/vo/<sceneId>.wav` + `.json` (timing) 1 ชุดต่อ scene | ✅ ฟังเสียงก่อนทำภาพ |
| 8 | Remotion | composition อ่าน `shots.json` + วัดความยาวเสียงจริง | |
| 9 | QA | `npm run validate` + `npm run stills` (contact sheet ทุกช็อต) + ผ่าน `11-qa-checklist` | ✅ ผู้ใช้อนุมัติ render |
| 10 | Cover | `covers` ใน `shots.json` ตาม `12-cover` (2–3 แบบ) → `npm run cover` → `out/cover/<slug>-<id>.jpg` + ภาพเช็กมือถือ | ✅ ผู้ใช้เลือกปก |
| 11 | Post | `post.json` ตาม `14-post` — ชื่อคลิป/แคปชัน/แฮชแท็กของแต่ละแพลตฟอร์ม (บทคลิป ที่มา เครดิต ระบบประกอบให้) → `node scripts/post.mjs <slug>` ตรวจความยาว + `out/<slug>-post.md` | ✅ ผู้ใช้อนุมัติข้อความ |

## ยังไม่มีเสียง?
ทำภาพก่อนได้: ถ้าไม่มี `public/<slug>/vo/*.json` ระบบจะประมาณเวลาจากจำนวนตัวอักษร (`charsPerSec` ของ voice preset) และแสดง subtitle แทนเสียง พออัดเสียงแล้ว render ใหม่ ความยาวช็อตจะปรับตามเสียงจริงเอง

## กติกา
- ค่าใน settings ล็อกตามลำดับ: ความยาว/style ก่อน stage 3, voice (บุคลิก) ก่อน stage 4, format ก่อน stage 5, เสียง TTS ก่อน stage 7 — เปลี่ยนหลังจากนั้น stage ที่อนุมัติแล้วจะขึ้น "ล้าสมัย" (rule 13)
- แก้ script หลังอนุมัติ → ต้อง regenerate `shots.json` ของ scene ที่กระทบ
- ถ้าข้อมูลใน `facts.md` มีความมั่นใจต่ำ ให้บทพูดใช้คำกันไว้ ("ประมาณ", "เขาว่ากันว่า") หรือตัดทิ้ง
- ยังไม่มี asset จริง → ใช้ placeholder component (สีตาม palette + ป้ายชื่อ) เพื่อให้ timing/กล้องตรวจได้ก่อน
