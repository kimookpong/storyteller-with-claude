# 01 · Spec & Timing

> ตัวเลขทุกตัวในไฟล์นี้ **คำนวณจาก `projects/<slug>/settings.json`** — ดูค่าจริงของโปรเจกต์ด้วย
> `npm run budget -- <slug>` (หรือหน้า Settings ใน HistoryTeller) · สูตรอยู่ที่ `scripts/lib/settings.mjs` ที่เดียว
> ห้ามจำตัวเลข 3 นาทีจากโปรเจกต์เก่ามาใช้

## Settings 3 แกน (เลือกตอนเริ่มโปรเจกต์ · stage 0)
| แกน | ไฟล์ preset | กำหนดอะไร |
|---|---|---|
| `format` | `presets/formats/*.json` | ขนาดเฟรม, fps, safe area, subtitle, ปก |
| `style` | `presets/styles/*.json` | แนวทางภาพ: สัดส่วนชนิดช็อต, จังหวะภาพ, ยุคที่ใช้ได้ (ดู 04–06) |
| `voice` | `presets/voices/*.json` + `.md` | บุคลิกผู้เล่า (ดู 03), เสียง TTS, **อัตราพูด** (ตัวอักษร/วินาที) |
| `targetSec` | – | ความยาวเป้าหมาย |
| `subtitles` | – | ซับที่ฝังในวิดีโอ: `th` (ค่าเริ่ม) · `th+en` · `en` · `off` — ดู rule 07 |

`overrides` ใน settings.json ใช้ปรับค่าเฉพาะโปรเจกต์ได้ (เช่น `{"voice": {"tts": {"voice": "Achird"}}}`)

## format
| id | ขนาด | ใช้กับ | safe zone (ข้อความ/ซับ) | ซับ |
|---|---|---|---|---|
| `landscape-16x9` | 1920×1080 | YouTube | ≥ 96px ซ้าย-ขวา, ≥ 64px บน-ล่าง | กล่องล่าง (box) |
| `portrait-9x16` | 1080×1920 | TikTok · Reels · Shorts | บน 160 · ล่าง 420 · ซ้าย 90 · ขวา 150 | ตัวใหญ่กลางค่อนล่าง y≈1300 ไฮไลต์คำที่พูด (caption) |
- `meta.width/height` ใน shots.json ต้องตรงกับ format (validate ตรวจ) · layer ใช้พิกัดจากกลางจอเหมือนเดิม · `text.x/y` เป็นพิกเซลของ format นั้น
- คลิปสั้น (≤ 1:15) ใช้สัดส่วนเวลาพูด 0.97 (แทบไม่มีช่วงเงียบ)

## สเปกเทคนิค (format: landscape-16x9)
- 1920×1080, 16:9, **30 fps**, H.264, yuv420p
- Safe area: title/text ห่างขอบ ≥ 96px ซ้าย-ขวา, ≥ 64px บน-ล่าง

## สูตรงบ (T = targetSec, r = charsPerSec ของ voice)
```
ยอมรับความยาว   T ± 8.3%
เวลาพูด          ≈ T × 0.95            (5% = head/tail/transition — วัดจาก coffee-world)
บท (ตัวอักษรไทย ไม่นับวรรค)  สูงสุด ≈ T × 0.95 × r · ต่ำสุด = สูงสุด × 0.88 · เกิน สูงสุด × 1.09 = ต้องตัด
ช็อต             T / shotSec.max … T / shotSec.min   (จาก style)
mini-reveal      ≥ T / 35
```
- บทยาวเกิน = **ตัดบท** ห้ามแก้ด้วยการเร่งเสียง
- r ของเสียงที่ยังไม่ได้วัดจริงเป็นค่าประมาณ → หลังสร้างเสียงซีนแรก ให้เทียบเวลาจริงแล้วปรับ `charsPerSec` ใน preset/overrides

### ตัวอย่าง (style kurzgesagt-vox · voice friend-sleepy-male r = 10.2)
| ความยาว | บท (ตัวอักษร) | ช็อต | mini-reveal | โครงเรื่อง (02) |
|---|---|---|---|---|
| 1:00 | 510–580 | 13–17 | 2 | Shorts |
| 3:00 | 1,535–1,745 | 40–50 | 5 | 7 beat |
| 5:00 | 2,555–2,905 | 67–83 | 9 | 7 beat (act แตกช่วงย่อย) |
| 8:00 | 4,090–4,650 | 107–133 | 14 | แบ่งบท (chapter) |

## งบต่อ beat (ดู 02)
`npm run budget -- <slug>` พิมพ์ตาราง beat พร้อมเวลา / ตัวอักษร / ช็อต ของโปรเจกต์ — beats.md ต้องใช้ตัวเลขชุดนี้

## จังหวะภาพ
- ช็อตเฉลี่ยตาม `style.shotSec` (kurzgesagt-vox: 3.6–4.5 วิ), ยาวสุด `shotSec.hardMax` และต้องมีการเคลื่อนไหวภายในตลอด
- ช็อตสั้นสุด 1.2 วินาที (ยกเว้น montage)
- ห้ามภาพนิ่งสนิทเกิน 1 วินาที (อย่างน้อยต้องมี drift/float/parallax เบา ๆ)

## ความจริงของเวลา
- ความยาว scene = ความยาวไฟล์ VO + head 6 เฟรม + tail 12 เฟรม (+ `holdAfter` ถ้ากำหนด)
- ความยาวช็อตในซีน = แบ่งตาม cue marker ใน VO (ดู 09) ห้าม hardcode
- ยังไม่มีเสียง → ประมาณจาก `charsPerSec` ของ voice preset
