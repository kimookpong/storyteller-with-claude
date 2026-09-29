# 08 · Audio

- **Master**: −14 LUFS integrated, true peak ≤ −1 dBTP (`scripts/master.mjs` ทำอัตโนมัติหลัง render)
- **VO**: ชัดที่สุดเสมอ, ตัดเสียงหายใจแรง ๆ ออก แต่เก็บ breath เบา ๆ ไว้

## เพลงประกอบ (ทำอัตโนมัติใน `src/audio/SoundLayer.tsx`)
- ambient / lo-fi / synth นุ่ม ไม่มีเนื้อร้อง — วนต่อกันทั้งคลิป เฟดเข้า/ออกหัวท้าย
- **duck ใต้ VO**: ความดัง `musicUnderVo` ตอนมีเสียงพากย์ (≈ −20 dB ใต้ VO) · `musicGap` ในช่วงว่าง/ก่อน reveal (ค่าอยู่ใน `presets/styles/*.json` → `audio`)
- **เปลี่ยนยุค → เปลี่ยน texture เพลง**: ยุคที่ `vintage` (ใน `eras.ts`) ใช้ `lofi-pad-vintage` (กรองแบบวิทยุเก่า + เสียงแผ่นเสียง) ยุคอื่นใช้ `lofi-pad` — ทำนองเดียวกัน crossfade 24 เฟรมตอนเปลี่ยนซีน
- ปิดเพลงทั้งโปรเจกต์: หน้า Settings หรือ `"overrides": {"style": {"audio": {"music": null}}}`
- เพลงของช่องเอง: `npm run audio` (`scripts/gen-audio.py`) — ใช้เพลงอื่นได้โดยวางไฟล์ใน `public/audio/music/` แล้วชี้ path ใน preset/overrides **+ ระบุ license ใน assets.md**

## SFX (อัตโนมัติตามชนิดช็อต · ความดัง `sfxVolume`)
| ช็อต | SFX เริ่มช็อต |
|---|---|
| parallax · data (แผนที่/กราฟ) | `whoosh` |
| vector | `pop` |
| title | `bloop` |
| collage | `paper` (กระดาษกรอบแกรบ) |
| data counter | `tick` |
| มี layer `stamp` | `stamp` ตรงเวลา `props.at` |

- กำหนดเองต่อช็อต: `"sfx": [{"name": "stamp", "at": 0.6}]` (at = วินาทีจากต้นช็อต หรือ `"start"`/`"end"`) · เงียบ: `"sfx": []`
- ชื่อที่ใช้ได้: `pop` `bloop` `whoosh` `paper` `tick` `stamp` (`public/audio/sfx/`) — validate ตรวจชื่อ
- ใช้เฉพาะเพลง/SFX ที่มีสิทธิ์ใช้ (ระบุ license ใน `assets.md`)
