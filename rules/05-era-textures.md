# 05 · Era Textures — พื้นผิวเปลี่ยนตามยุค

ทุก scene ต้องมี field `era` ค่า texture จะถูก apply อัตโนมัติ (overlay + tint + grain + motion feel)

**รองรับในโค้ดแล้วทั้ง 11 ยุค** (`src/era/eras.ts` + `transitions.tsx`) · style preset กำหนดว่าใช้ยุคไหนได้ (`presets/styles/*.json` → `eras`) · `npm run validate` แจ้ง error ถ้าใช้ยุคที่ไม่มีในโค้ด
ยุคที่เพิ่มหลังสุด (prehistoric, ancient, early-1900s, mid-century, 80s-90s, 2000s, future) **ยังไม่เคย render จริง** — โปรเจกต์แรกที่ใช้ให้ render ภาพนิ่งตรวจก่อน

| era | Texture | Tint / สี | Grain & Artifact | Motion feel | Transition เข้า |
|-----|---------|-----------|------------------|-------------|----------------|
| `prehistoric` | ผนังถ้ำ, หิน | ดิน/ocher (tint) | หยาบ, noise หนัก, flicker เงาไฟ | stop-motion 8fps | ฝุ่นฟุ้ง (dust) |
| `ancient` | กระดาษปาปิรัส, ดินเผา | ทราย/ทอง (tint) | fiber กระดาษ | slide แนวนอน | ม้วนกระดาษคลี่ (scroll) |
| `medieval` | หนังแกะ (vellum), ภาพพิมพ์แกะไม้ | น้ำตาลเข้ม + แดงชาด | ขอบไหม้, คราบ | stop-motion 8fps | ขอบไหม้ลาม |
| `early-modern` (1600–1700) | ภาพพิมพ์แกะ, กระดาษหยาบ | sepia อ่อน | halftone จาง ๆ | stop-motion 12fps | หมึกซึม (ink) |
| `1800s` | ภาพแกะเส้น (engraving), sepia | sepia | ขีดข่วน, vignette | stop-motion 12fps | หมึกซึม |
| `early-1900s` | หนังสือพิมพ์ halftone | ขาวดำ + เหลืองกระดาษ | halftone dot, film flicker | กระตุกแบบฟิล์ม | กระดาษฉีก |
| `mid-century` (50–70s) | สิ่งพิมพ์ offset, Kodachrome | สีอิ่ม + tint อุ่น | halftone จาง | เด้งนิด ๆ | กระดาษฉีก |
| `80s-90s` | VHS, CRT | neon/magenta | scanline + แถบ tracking | tracking glitch | VHS (แถบสลับ) |
| `2000s` | เว็บยุคแรก, glossy | ฟ้าวาว | grain บาง | window pop-up | zoom-through |
| `present` | Kurzgesagt flat สะอาด | palette หลัก | grain บางมาก | spring นุ่ม | zoom-through |
| `future` | flat + glow + hologram | ม่วง/ฟ้าเรือง | glow (screen) | ลอยตัว | แสงวาบ (flash) |

## กฎ
- Texture apply หนักที่ **BG / collage layer** (60–100%), เบาที่ **subject vector** (≤ 25%)
- UI ข้อมูล/ตัวเลข/subtitle **ไม่ใส่ texture** (ต้องอ่านง่ายเสมอ)
- เปลี่ยนยุคต้องมี transition 12–24 เฟรม ตรงกับประโยคเชื่อมเวลาในบท
- เรื่องหนึ่ง ≤ 4 ยุค; ย้อนไปมาได้แต่ต้องใช้ transition เดิมของยุคนั้นซ้ำ (สร้างความจำ)
- ถ้าเรื่องไม่มีมิติเวลา ให้ใช้ `era` เป็น "โลก" แทนได้ (เช่น `micro`=จุลทรรศน์, `cosmic`=อวกาศ) — ต้องเพิ่มทั้งแถวในตารางนี้ **และ** entry ใน `src/era/eras.ts` + `Era` ใน `src/types.ts`
