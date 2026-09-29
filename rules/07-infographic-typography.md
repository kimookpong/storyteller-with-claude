# 07 · Infographic & Typography

## ข้อมูล
- 1 ช็อต = 1 ตัวเลข/1 การเปรียบเทียบ
- ตัวเลขสำคัญต้อง **นับขึ้น (counter)** ประกอบเสียง และจบตรงคำที่พูดตัวเลข
- กราฟที่อนุญาต: bar, line, stacked unit (จุด/ไอคอนแทนจำนวน), area-scale (วงกลม/สี่เหลี่ยมเทียบขนาด), map
- ห้าม pie > 4 ชิ้น, ห้าม 3D chart, ห้ามแกน y ไม่เริ่มที่ 0 สำหรับ bar
- Scale comparison แบบ Kurzgesagt: ของเล็กอยู่ก่อน แล้ว pull-out ให้เห็นของใหญ่
- ตัวเลขทุกตัวบนจอต้องมี `sourceRef` ชี้ไปที่ `facts.md`; ใส่ source เล็ก ๆ มุมล่าง (≥ 18px, opacity 60%)

## ตัวอักษรไทย
| ใช้กับ | ฟอนต์ (Google Fonts) |
|-------|------------------|
| หัวข้อ / ตัวเลขใหญ่ | **Kanit** 600–700 |
| เนื้อความ / label | **IBM Plex Sans Thai** 400–500 (หรือ Noto Sans Thai) |
| ลายมือบน collage | **Mali** หรือ **Itim** |
- `line-height` ≥ **1.45** (สระบน/ล่าง + วรรณยุกต์ไทยโดนตัด ถ้าแน่นกว่านี้)
- ตัดคำด้วย `Intl.Segmenter('th', {granularity:'word'})` — ห้ามตัดกลางคำ
- On-screen text ≤ **7 คำ** ต่อช็อต (subtitle ไม่นับ); หัวข้อ ≥ 64px, label ≥ 32px
- ตัวเลขใช้เลขอารบิก, ใส่คอมมาหลักพัน, หน่วยเป็นไทย ("8,000 ล้านคน")

## Subtitle (ถ้าเปิด — settings `subtitles`: `th` · `th+en` · `en` · `off`)
- ไทย ≤ 2 บรรทัด ≤ 38 ตัวอักษร/บรรทัด (40px) · อังกฤษ ≤ 2 บรรทัด ≤ 48 ตัวอักษร (30px สีอ่อน ใต้ไทย) · กล่องพื้นหลัง `--bg-deep` 70%
- ไทย/อังกฤษแบ่งเป็นจำนวนชุดเท่ากันและสลับพร้อมกัน (`src/text/subchunks.ts` = `scripts/lib/subchunks.mjs`)
- โหมด `th+en` กล่องสูงขึ้น (~200px) → ข้อความบนจอต้องอยู่เหนือ y ≈ 800
- ไฟล์ซับ: `node scripts/subs.mjs <slug>` → `out/<slug>.th|en.srt/.vtt` (render.mjs เรียกให้เอง) · YouTube แนะนำฝังไทย + อัปโหลด .en.srt
- ไม่ใส่ texture, ไม่เบลอ, อยู่เหนือทุก layer
