---
description: HistoryTeller — แก้ทุกคำขอที่ค้างในคิว feedback
argument-hint: <slug>
---
โปรเจกต์: `projects/$ARGUMENTS/`

1. รัน `npm run budget -- $ARGUMENTS` (งบ + persona ของโปรเจกต์ จาก settings.json) แล้วอ่าน @rules/13-ui-protocol.md แล้วพับ `projects/$ARGUMENTS/feedback.jsonl` ตาม `id` → เอาเฉพาะที่สถานะล่าสุดเป็น `open`
2. ทำทีละข้อตาม `target`:
   - `shot:<id>` / `scene:<id>` → แก้ `shots.json` (และ `script.md` ถ้าเปลี่ยนบท) → validate
   - `vo:<scene>` → แก้ `voTTS` ของซีนนั้น แล้วบอกผู้ใช้กด "สร้างใหม่" ของซีนนั้นในหน้าเสียงพากย์
   - `stage:<key>` / `brief` / `script` / ฯลฯ → แก้ไฟล์ของ stage นั้น
   - `cover:<id>` → แก้ `covers` ใน shots.json → validate → บอกผู้ใช้กด "Render ปกใหม่"
   - `qa:<key>` → แก้ต้นเหตุตาม rules/11
3. เสร็จแต่ละข้อ: **append** `{"id":"<id>","status":"done","by":"claude","note":"<ทำอะไรไป>","at":"<ISO time>"}` (ห้ามแก้บรรทัดเดิม)
4. ตั้ง stage ที่ได้รับผลกระทบเป็น `review` + note — ห้ามอนุมัติเอง
5. สรุปให้ผู้ใช้: ทำอะไรไปกี่ข้อ ข้อไหนต้องกดปุ่มในเครื่อง (render ภาพนิ่ง/เสียง/ปก)
