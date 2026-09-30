#!/usr/bin/env python3
"""
ภาพจริงจากการค้นคว้า (ขึ้นจอใน collage) — projects/<slug>/refs.json → public/<slug>/ref/ + refs.lock.json   (rule 04 · rule 15)

  python3 scripts/refs.py <slug>              # ดึงข้อมูล license + ดาวน์โหลดทุกรูปที่ยังไม่มี
  python3 scripts/refs.py <slug> --only a b   # เฉพาะบาง id
  python3 scripts/refs.py <slug> --force      # ดึงใหม่
  python3 scripts/refs.py <slug> --dry-run    # ตรวจ license อย่างเดียว ไม่ดาวน์โหลดรูป

refs.json:
  {"refs": [{"id": "chedi-1900", "provider": "commons", "file": "File:Wat Phra Mahathat.jpg",
             "use": "onscreen", "factRef": "F21", "note": "ภาพพระธาตุเก่า"}]}
  provider: commons (file = "File:…") · openverse (key = uuid) · met (key = objectID)

license ตรวจจาก API ของแหล่งเสมอ (ไม่เชื่อข้อความใน refs.json):
  ok      = Public domain / CC0 / PDM / CC BY
  flag    = CC BY-SA (ใช้ได้ แต่ต้องใส่เครดิต + ระวังเงื่อนไข share-alike) · มีคำเตือนสิทธิ์บุคคล/เครื่องหมายการค้า
  blocked = NC / ND / ไม่รู้ license / ไม่มีไฟล์รูป
ผู้ใช้ต้องกด "ใช้รูปนี้" ในหน้า ค้นคว้า ของ HistoryTeller ก่อน รูปจึงขึ้นในวิดีโอ (approved ใน refs.lock.json)
"""
from __future__ import annotations
import argparse, hashlib, html, json, re, sys, time, urllib.error, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
UA = "StorytellerWithClaude/1.0 (https://github.com/kimookpong/storyteller-with-claude)"
MAX_W = 2400


def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get(url: str, binary=False, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*" if binary else "application/json"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                data = r.read()
                return data if binary else json.loads(data.decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503) and attempt < 2:
                time.sleep(2 * (attempt + 1)); continue
            raise
        except urllib.error.URLError:
            if attempt < 2:
                time.sleep(2); continue
            raise


def strip_html(s):
    # extmetadata บางช่องเป็นตัวเลข/bool (เช่น CommonsMetadataExtension = 1.2) → แปลงเป็น str ก่อน
    if s is None: return ""
    if not isinstance(s, str): s = str(s)
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def classify(lic: str) -> tuple[str, list[str]]:
    l = (lic or "").lower().replace("_", "-")
    flags = []
    if not l:
        return "blocked", ["ไม่รู้ license"]
    if re.search(r"\bnc\b|non-?commercial", l):
        return "blocked", ["ห้ามใช้เชิงพาณิชย์ (NC)"]
    if re.search(r"\bnd\b|no-?deriv", l):
        return "blocked", ["ห้ามดัดแปลง (ND) — ครอป/ใส่ filter ไม่ได้"]
    if re.search(r"public domain|pdm|cc0|\bpd\b|pd-|no known copyright", l):
        return "ok", flags
    if re.search(r"\bfal\b|free art|licence art libre|art libre", l):
        return "flag", ["Free Art License (copyleft แบบ BY-SA): ต้องใส่เครดิต + ผลงานดัดแปลงต้องใช้ license เดียวกัน (ตรวจก่อนหารายได้)"]
    if re.fullmatch(r"gfdl[\w .-]*", l):
        return "flag", ["GFDL อย่างเดียว: ต้องแนบข้อความ license — ไม่เหมาะกับวิดีโอ ใช้เมื่อหาภาพอื่นไม่ได้"]
    if "by-sa" in l or "by sa" in l:
        return "flag", ["CC BY-SA: ต้องใส่เครดิต + เงื่อนไข share-alike (ตรวจก่อนหารายได้)"]
    if re.search(r"cc[- ]by|\bby\b|attribution", l):
        return "ok", flags
    return "blocked", [f"license ไม่รู้จัก: {lic}"]


def fetch_commons(ref):
    title = ref.get("file") or ref.get("key")
    if not title:
        raise ValueError("commons ต้องมี file (เช่น \"File:Example.jpg\")")
    if not title.startswith("File:"):
        title = "File:" + title
    q = urllib.parse.urlencode({"action": "query", "titles": title, "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
                                "iiurlwidth": MAX_W, "format": "json", "formatversion": "2"})
    d = get(f"https://commons.wikimedia.org/w/api.php?{q}")
    page = (d.get("query", {}).get("pages") or [{}])[0]
    if page.get("missing") or not page.get("imageinfo"):
        raise ValueError(f"ไม่พบไฟล์บน Commons: {title}")
    ii = page["imageinfo"][0]
    md = {k: strip_html(v.get("value")) for k, v in (ii.get("extmetadata") or {}).items()}
    lic = md.get("LicenseShortName") or md.get("License") or ""
    flags = []
    if md.get("Restrictions"):
        flags.append(f"ข้อจำกัดเพิ่ม: {md['Restrictions']}")
    return {"title": md.get("ObjectName") or title[5:], "author": md.get("Artist") or md.get("Credit") or "ไม่ระบุ",
            "license": lic, "licenseUrl": md.get("LicenseUrl", ""), "sourceUrl": ii.get("descriptionurl", ""),
            "fileUrl": ii.get("thumburl") or ii.get("url"), "mime": ii.get("mime", ""), "extraFlags": flags}


def fetch_openverse(ref):
    key = ref.get("key")
    if not key:
        raise ValueError("openverse ต้องมี key (uuid ของรูป)")
    d = get(f"https://api.openverse.org/v1/images/{urllib.parse.quote(key)}/")
    lic = f"{d.get('license', '')} {d.get('license_version', '')}".strip()
    lic = "CC0" if d.get("license") == "cc0" else "Public Domain Mark" if d.get("license") == "pdm" else f"CC {lic.upper()}"
    return {"title": d.get("title") or key, "author": d.get("creator") or "ไม่ระบุ", "license": lic, "licenseUrl": d.get("license_url", ""),
            "sourceUrl": d.get("foreign_landing_url", ""), "fileUrl": d.get("url"), "mime": "", "extraFlags": []}


def fetch_met(ref):
    key = ref.get("key")
    if not key:
        raise ValueError("met ต้องมี key (objectID)")
    d = get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{urllib.parse.quote(str(key))}")
    pd = bool(d.get("isPublicDomain"))
    return {"title": d.get("title") or str(key), "author": d.get("artistDisplayName") or "The Metropolitan Museum of Art",
            "license": "CC0 (Met Open Access)" if pd else "", "licenseUrl": "https://creativecommons.org/publicdomain/zero/1.0/" if pd else "",
            "sourceUrl": d.get("objectURL", ""), "fileUrl": d.get("primaryImage") or d.get("primaryImageSmall"), "mime": "", "extraFlags": []}


PROVIDERS = {"commons": fetch_commons, "openverse": fetch_openverse, "met": fetch_met}
EXT = {b"\xff\xd8": ".jpg", b"\x89P": ".png", b"GI": ".gif", b"RI": ".webp"}


def attribution(m):
    return f"{m['title']} — {m['author']} · {m['license']}".strip(" ·")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", a.slug):
        sys.exit("slug ไม่ถูกต้อง")
    pdir = REPO / "projects" / a.slug
    spec_f, lock_f = pdir / "refs.json", pdir / "refs.lock.json"
    if not spec_f.exists():
        sys.exit(f"ไม่มี {spec_f.relative_to(REPO)} — ให้ Claude ทำใน stage 2 ตาม rules/15-research-images.md")
    spec = json.loads(spec_f.read_text(encoding="utf-8"))
    lock = json.loads(lock_f.read_text(encoding="utf-8")) if lock_f.exists() else {"refs": {}}
    lock.setdefault("refs", {})
    out = REPO / "public" / a.slug / "ref"
    out.mkdir(parents=True, exist_ok=True)
    ids = [r["id"] for r in spec.get("refs", [])]
    if len(ids) != len(set(ids)):
        sys.exit("id ใน refs.json ซ้ำกัน")
    n_ok = n_bad = 0
    for ref in spec.get("refs", []):
        rid = ref["id"]
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", rid):
            print(f"✗ {rid}: id ต้องเป็น a-z 0-9 -"); n_bad += 1; continue
        if a.only and rid not in a.only:
            continue
        old = lock["refs"].get(rid, {})
        if old.get("file") and (REPO / "public" / old["file"]).exists() and not a.force and old.get("provider") == ref.get("provider"):
            print(f"· {rid}: มีแล้ว ({old.get('status')})"); continue
        prov = PROVIDERS.get(ref.get("provider", ""))
        if not prov:
            print(f"✗ {rid}: provider ต้องเป็น {', '.join(PROVIDERS)}"); n_bad += 1; continue
        try:
            m = prov(ref)
        except Exception as e:  # noqa: BLE001
            print(f"✗ {rid}: {e}"); lock["refs"][rid] = {**old, "status": "error", "error": str(e), "at": now()}; n_bad += 1; continue
        status, flags = classify(m["license"])
        flags += m.pop("extraFlags", [])
        if status != "blocked" and any(re.search(r"personality|trademark|บุคคล", f, re.I) for f in flags):
            status = "flag"
        if not m.get("fileUrl"):
            status, flags = "blocked", flags + ["ไม่มีไฟล์รูปให้ดาวน์โหลด"]
        rec = {**{k: v for k, v in old.items() if k in ("approved",)}, "provider": ref["provider"], "status": status, "flags": flags,
               **m, "attribution": attribution(m), "use": ref.get("use", "onscreen"), "at": now()}
        if status != "blocked" and not a.dry_run:
            data = get(m["fileUrl"], binary=True, timeout=120)
            ext = EXT.get(data[:2], ".jpg")
            rel = f"{a.slug}/ref/{rid}{ext}"
            (REPO / "public" / rel).write_bytes(data)
            rec.update(file=rel, bytes=len(data), sha1=hashlib.sha1(data).hexdigest()[:12])
        if status == "blocked":
            rec["approved"] = False
        lock["refs"][rid] = rec
        mark = {"ok": "✓", "flag": "⚑", "blocked": "✗"}[status]
        print(f"{mark} {rid}: {m['license'] or '?'} · {m['author'][:60]}{' · ' + '; '.join(flags) if flags else ''}")
        n_ok += status != "blocked"
        n_bad += status == "blocked"
        time.sleep(0.4)
    lock_f.write_text(json.dumps(lock, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\nใช้ได้ {n_ok} · ใช้ไม่ได้ {n_bad} → {lock_f.relative_to(REPO)}")
    print("ขั้นต่อไป: เปิดหน้า ค้นคว้า ใน HistoryTeller แล้วกด \"ใช้รูปนี้\" ทีละรูป")


if __name__ == "__main__":
    main()
