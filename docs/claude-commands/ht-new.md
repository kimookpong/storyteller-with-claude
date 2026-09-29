---
description: HistoryTeller — ทำ Brief (stage 1) จาก request.md ของโปรเจกต์ใหม่
argument-hint: <slug>
---
โปรเจกต์: `projects/$ARGUMENTS/`

1. รัน `npm run budget -- $ARGUMENTS` (งบ + persona ของโปรเจกต์ จาก settings.json) แล้วอ่าน @rules/13-ui-protocol.md และ @rules/00-pipeline.md
2. อ่าน `projects/$ARGUMENTS/request.md` (ข้อมูลจากผู้ใช้ผ่าน HistoryTeller) — ช่องไหนเขียนว่า "[ให้ Claude เสนอ]" ให้เสนอเอง
3. ตั้ง stage `brief` ใน `status.json` เป็น `draft` (by: claude) ระหว่างทำ
4. เขียน `projects/$ARGUMENTS/brief.md` ตาม stage 1: หัวข้อ, คำถามหลัก (Hook), กลุ่มคนดู, 1 ประโยคที่อยากให้จำ, metaphor หลัก (rule 02), character anchor (rule 04), ยุคที่จะใช้ ≤ 4 (rule 05)
5. ตั้ง `brief` เป็น `review` + `note` สรุป 1 บรรทัด — **ห้ามอนุมัติเอง**
6. บอกผู้ใช้สั้น ๆ ให้ไปอนุมัติหรือขอแก้ในหน้า Brief ของ HistoryTeller
