# Storyteller with Claude 🎬

> ระบบผลิต **วิดีโอ infographic ภาษาไทย** ด้วย Claude + [Remotion](https://www.remotion.dev/) — ตั้งแต่ไอเดีย ค้นคว้า เขียนบท ทำ shot list เสียงพากย์ ภาพ ไปจนถึง render และปก พร้อมหน้า UI **HistoryTeller** ให้คนอนุมัติ/สั่งแก้ทีละขั้น

_A Thai-language explainer-video pipeline: Claude writes the research, script and shot list; Remotion renders a 2.5D parallax / collage infographic video (16:9 YouTube or 9:16 TikTok/Reels/Shorts); a small local web UI keeps a human in the loop at every stage._

**สร้างโดย [Hakim Mudor (@kimookpong)](https://github.com/kimookpong)** — ถ้านำไปใช้หรือต่อยอด รบกวนให้เครดิตและลิงก์กลับมาที่ repo นี้ด้วยครับ 🙏

---

## ทำอะไรได้บ้าง

- **Pipeline 11 ขั้น** (`rules/00-pipeline.md`): Brief → ค้นคว้า (facts + แหล่งอ้างอิง) → Beat sheet → บทพากย์ → Shot list → Asset list → เสียงพากย์ → Remotion → QA → ปก → ข้อความโพสต์ — แต่ละขั้นมี checkpoint ให้คนอนุมัติ
- **ตั้งค่าต่อโปรเจกต์ 3+ แกน** (`projects/<slug>/settings.json`)
  - **Format:** แนวนอน 16:9 (YouTube) · แนวตั้ง 9:16 (TikTok / Reels / Shorts) พร้อม safe zone
  - **ความยาว:** 30 วิ – 10 นาที → ระบบคำนวณงบตัวอักษร / จำนวนช็อต / โครงเรื่องให้เอง (`npm run budget -- <slug>`)
  - **Style:** 8 แบบ เช่น Kurzgesagt × Vox Collage, cinematic parallax, retro newsreel, shorts punch
  - **Voice:** 8 บุคลิกผู้เล่า (เพื่อนเล่าตอนดึก, สารคดี, ผู้เฒ่าเล่าตำนาน, เล่าเร็วแบบคลิปสั้น ฯลฯ)
  - **ซับ:** ไทย / ไทย+อังกฤษ / อังกฤษ / ปิด → ได้ไฟล์ `.srt` `.vtt` ด้วย
- **ภาพ vector วาดด้วยโค้ด** (SVG ใน `src/assets/`) + **พื้นผิวตามยุค** (ก่อนประวัติศาสตร์ → อนาคต) + กล้อง 2.5D parallax / depth of field
- **ภาพ AI แบบผสม (ไม่บังคับ):** `images.json` → สร้างผ่าน OpenRouter แล้วคนเลือกรูปเอง · ทุก layer มี vector สำรอง
- **เสียงพากย์ TTS** (Gemini TTS ผ่าน OpenRouter) + เพลง/SFX + ปรับเสียง −14 LUFS
- **ข้อความโพสต์ลงแพลตฟอร์ม** (`rules/14-post.md`): ชื่อคลิป/คำอธิบาย/แคปชัน/แฮชแท็กสำหรับ YouTube · TikTok · Instagram · Facebook · X ตาม format — ระบบใส่บทคลิป (chapters) จากเวลาเสียงจริง รายการที่มาจาก `facts.md` และเครดิตให้เอง พร้อมนับตัวอักษรเทียบข้อจำกัดของแต่ละแพลตฟอร์ม (`presets/platforms.json`) และปุ่มคัดลอกในหน้า HistoryTeller
- **ตรวจงานอัตโนมัติ** (`validate.mjs`): ทุกตัวเลขต้องมีแหล่งใน `facts.md`, คำต้องห้ามของ persona, safe zone, ความยาว hook ฯลฯ

## ภาพรวมการทำงาน

```
request.md ──► brief ──► facts ──► beats ──► script ──► shots.json ──► assets / images
                 ▲          ▲         ▲         ▲            │
                 └── คนอนุมัติ/สั่งแก้ใน HistoryTeller ──────┘
                                                           ▼
                        TTS (vo/*.wav) ──► Remotion render ──► QA ──► ปก ──► ข้อความโพสต์
```

Claude ทำงานตาม rule ใน `CLAUDE.md` + `rules/` · คนสั่งงานผ่านคำสั่งลัด `/ht-new` `/ht-next` `/ht-feedback` (ดู `docs/claude-commands/`) และกดอนุมัติในหน้า HistoryTeller — **Claude ห้ามอนุมัติเอง**

## เริ่มใช้งาน

**ต้องมี:** Node.js 20+ · Python 3.9+ · ffmpeg (ไม่มีก็ได้ จะใช้ตัวที่มากับ Remotion) · API key ของ [OpenRouter](https://openrouter.ai/) (สำหรับ TTS และภาพ AI เท่านั้น)

```bash
git clone https://github.com/kimookpong/storyteller-with-claude.git
cd storyteller-with-claude
npm install
cp .env.example .env          # ใส่ OPENROUTER_API_KEY=...
npm run app                   # HistoryTeller → http://127.0.0.1:4700
```

แล้วเปิดโปรเจกต์นี้ใน Claude (Claude Code / Cowork) เพื่อให้ทำแต่ละ stage

### คำสั่งหลัก

| คำสั่ง                                              | ทำอะไร                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run app`                                       | หน้า HistoryTeller (สร้างโปรเจกต์ · ตั้งค่า · อนุมัติ · สั่งแก้ · กดรันงาน)        |
| `npm run budget -- <slug>`                          | งบของโปรเจกต์: ความยาว ตัวอักษร ช็อต beat persona                                  |
| `node scripts/validate.mjs projects/<slug>`         | ตรวจ `shots.json` ตาม rule                                                         |
| `python3 scripts/tts.py projects/<slug>/shots.json` | เสียงพากย์ (ลองเสียง: `--audition --slug <slug>`)                                  |
| `python3 scripts/imagegen.py <slug> --dry-run`      | ดู prompt ภาพ AI ก่อนสร้างจริง                                                     |
| `npm run studio`                                    | Remotion Studio                                                                    |
| `HT_SLUG=<slug> npm run stills`                     | ภาพนิ่งทุกช็อต → `out/stills/<slug>/`                                              |
| `node scripts/render.mjs <slug>`                    | render → `out/<slug>.mp4` + `-master.mp4` + ซับ                                    |
| `node scripts/cover.mjs <slug>`                     | ปกทุกแบบ → `out/cover/`                                                            |
| `node scripts/post.mjs <slug>`                      | ตรวจข้อความโพสต์ + ส่งออก `out/<slug>-post.md` (`--kit` = ข้อมูลตั้งต้นให้ Claude) |

## โครงสร้าง repo

```
CLAUDE.md          กติกาหลักที่ Claude อ่านทุกครั้ง
rules/             rule ทีละเรื่อง (โครงเรื่อง ภาษา ภาพ กล้อง เสียง schema QA ปก UI)
presets/           formats · styles · voices (+ persona .md) · platforms (ข้อจำกัดโพสต์) · channel (เครดิตท้ายโพสต์)
projects/<slug>/   งานแต่ละเรื่อง: request, brief, facts, beats, script, shots.json, post.json, status (ไม่อยู่ใน repo)
src/               โค้ด Remotion (composition, asset SVG, กล้อง, ข้อมูล/กราฟ, ตัวอักษรไทย, ซับ)
scripts/           budget, validate, tts, imagegen, render, stills, cover, subs
app/               HistoryTeller (Node server + หน้าเว็บ ไม่มี dependency เพิ่ม)
public/            texture, เพลง/SFX (ไฟล์ต่อโปรเจกต์ public/<slug>/ ไม่ได้อยู่ใน repo)
docs/              เอกสารออกแบบ + คำสั่ง Claude
templates/         แม่แบบ script / shots
```

### เริ่มเรื่องใหม่

repo นี้ **ไม่รวมงานของแต่ละเรื่อง** (`projects/<slug>/` และไฟล์สื่อใน `public/<slug>/` ถูก `.gitignore` ไว้) — สร้างเรื่องแรกได้เลย:

1. `npm run app` → กด **“+ เริ่มเรื่องใหม่”** ใส่หัวข้อ เลือก format / ความยาว / style / เสียง
2. ใน Claude พิมพ์ `/ht-new <slug>` → ได้ Brief · จากนั้น `/ht-next <slug>` ทีละ stage แล้วกดอนุมัติในหน้าเว็บ
3. ดูรูปแบบไฟล์ได้จาก `templates/` (`script.md`, `shots.example.json`) และ schema ใน `rules/09-shotlist-schema.md`

> ภาพ vector ของเรื่องที่ผู้สร้างเคยทำ (`src/assets/origins.tsx`, `feed.tsx`, `nakhon.tsx`) ยังอยู่ในโค้ด ใช้ซ้ำในเรื่องใหม่ได้

## หมายเหตุเรื่องลิขสิทธิ์ / การใช้งาน

- **สไตล์ภาพ** ได้แรงบันดาลใจจาก "หลักการ" ของ Kurzgesagt และ Vox — **ไม่มีส่วนเกี่ยวข้องหรือได้รับการรับรองจากทั้งสองช่อง** และไม่ได้ลอกตัวละคร/กราฟิกของใคร (ดู `rules/04-visual-style.md`)
- **Remotion** มีเงื่อนไข license ของตัวเอง (บริษัทบางขนาดต้องซื้อ company license) — ดู [remotion.dev/license](https://www.remotion.dev/license)
- **ภาพ/เสียงจาก AI**: ตรวจเงื่อนไขเชิงพาณิชย์ของโมเดลที่ใช้ (บันทึก model + วันที่ใน `images.lock.json`) ก่อนเปิดรายได้
- **ข้อเท็จจริงในคลิป** ต้องอ้างแหล่งใน `facts.md` ของแต่ละเรื่องเสมอ — ตรวจซ้ำก่อนเผยแพร่
- ฟอนต์ Kanit / IBM Plex Sans Thai / Mali (SIL Open Font License ผ่าน Fontsource) · แผนที่จาก world-atlas (Natural Earth)

## เครดิต

- **ผู้สร้าง / ออกแบบระบบ:** [Hakim Mudor (@kimookpong)](https://github.com/kimookpong)
- พัฒนาร่วมกับ **Claude** (Anthropic) — rule, โค้ด และเนื้อหาตัวอย่างส่วนใหญ่เขียนผ่านการทำงานคู่กับ Claude
- เครื่องมือ: Remotion · React · d3-geo · OpenRouter (Gemini TTS / image)

ถ้าเอาไปใช้ ต่อยอด หรือทำคลิปจากระบบนี้ รบกวนใส่เครดิต **"Storyteller with Claude by Hakim Mudor (@kimookpong)"** พร้อมลิงก์ repo ครับ ⭐
