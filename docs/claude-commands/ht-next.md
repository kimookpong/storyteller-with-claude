---
description: HistoryTeller — ทำ stage ถัดไปที่ยังไม่อนุมัติ
argument-hint: <slug>
---
โปรเจกต์: `projects/$ARGUMENTS/`

1. รัน `npm run budget -- $ARGUMENTS` (งบ + persona ของโปรเจกต์ จาก settings.json) แล้วอ่าน @rules/13-ui-protocol.md แล้วอ่าน `projects/$ARGUMENTS/status.json` + feedback ที่ยัง `open` ใน `feedback.jsonl`
2. ถ้ามี feedback ค้าง → ทำแบบ `/ht-feedback` ก่อน
3. หา stage แรกตามลำดับ 00-pipeline ที่ไม่ใช่ `approved`
   - `review` → ไม่ต้องทำอะไร บอกผู้ใช้ว่ารอเขาตัดสินใน HistoryTeller
   - `todo` / `draft` / ล้าสมัย → ทำ stage นั้นตาม rule ที่เกี่ยวข้อง (อ่าน `note` ของ stage ก่อน — ถ้า by: user คือคำสั่งแก้)
   - `voice` / `preview` / ภาพนิ่ง / ปก ที่ต้องรันบนเครื่อง → ลองรันถ้าทำได้ ถ้าติดเน็ตหรือเครื่องมือ ให้บอกผู้ใช้กดปุ่มใน HistoryTeller
4. หลังแก้ `shots.json` รัน `node scripts/validate.mjs projects/$ARGUMENTS` ให้ผ่านเสมอ
5. ตั้ง stage เป็น `review` + `note` สรุป — **ห้ามอนุมัติเอง** แล้วสรุปให้ผู้ใช้ 1–2 ประโยค
