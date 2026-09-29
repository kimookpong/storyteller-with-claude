#!/usr/bin/env python3
"""
สร้างเพลงประกอบ + SFX ของช่องเอง (rule 08) — ไม่มีลิขสิทธิ์ของคนอื่น ใช้ได้ทุกคลิป
ต้องมี numpy:  pip install numpy
  python scripts/gen-audio.py            → public/audio/music/*.wav + public/audio/sfx/*.wav

- music/lofi-pad.wav          pad อุ่น ๆ + ระฆังเบา ๆ (ยุคปัจจุบัน/อนาคต)  วนต่อกันได้ไร้รอยต่อ
- music/lofi-pad-vintage.wav  ทำนองเดียวกัน กรองเสียงแบบวิทยุเก่า + เสียงแผ่นเสียงแตก (ยุคเก่า)
- sfx/pop · bloop · whoosh · paper · tick · stamp
"""
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
rng = np.random.default_rng(7)


def write(path: Path, x: np.ndarray, peak=0.89):
    path.parent.mkdir(parents=True, exist_ok=True)
    x = x / max(1e-9, np.max(np.abs(x))) * peak
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())
    print(f"✓ {path.relative_to(ROOT)}  {len(x) / SR:.1f}s")


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):  # one-pole — พอสำหรับไฟล์สั้น
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def lowpass_fast(x, cutoff, passes=2):
    # one-pole แบบ vectorized ผ่าน scipy ถ้ามี ไม่งั้นใช้ loop
    try:
        from scipy.signal import lfilter
        a = np.exp(-2 * np.pi * cutoff / SR)
        for _ in range(passes):
            x = lfilter([1 - a], [1, -a], x)
        return x
    except ImportError:
        for _ in range(passes):
            x = lowpass(x, cutoff)
        return x


def highpass_fast(x, cutoff):
    return x - lowpass_fast(x, cutoff, 1)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def env(n, a, r, sustain=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * sustain
    rel = int(r * SR)
    if rel > 0 and rel < n:
        e[-rel:] *= np.linspace(1, 0, rel) ** 2
    return e


# ---------------- music ----------------
BPM = 72
BEAT = 60 / BPM
BAR = 4 * BEAT
CHORDS = [  # Am9 · Fmaj7 · Cmaj7 · G6 (โน้ต MIDI)
    [57, 60, 64, 67, 71],
    [53, 57, 60, 64, 69],
    [48, 55, 59, 64, 67],
    [55, 59, 62, 64, 71],
]
MELODY = [76, 72, 74, 69, 72, 67, 71, 74]  # ระฆังเบา ๆ ทีละโน้ต (pentatonic-ish)


def pad_voice(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.12, 0.0, 0.12):  # detune ให้ฟุ้ง
        ff = f * 2 ** (det / 12)
        x += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(2 * np.pi * 2 * ff * t + 0.3)
    return x * env(n, 1.2, 1.4)


def bell(f, dur=2.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 3)
    return x * np.exp(-t * 1.6) * env(n, 0.004, 0.2)


def music(vintage=False):
    bars_per_chord = 2
    loop = len(CHORDS) * bars_per_chord * BAR * 2  # 2 รอบ ≈ 53 วิ
    n = int(loop * SR)
    tail = int(3 * SR)
    out = np.zeros(n + tail)
    t0 = 0.0
    k = 0
    while t0 < loop - 1e-6:
        ch = CHORDS[k % len(CHORDS)]
        d = bars_per_chord * BAR
        s = int(t0 * SR)
        for note in ch:
            v = pad_voice(midi(note), d + 1.4) * 0.16
            out[s:s + len(v)] += v[: len(out) - s]
        for j in range(2):  # ระฆัง 2 โน้ตต่อคอร์ด
            m = MELODY[(k * 2 + j) % len(MELODY)]
            bs = int((t0 + j * BAR + BEAT * (0.5 if j else 0)) * SR)
            b = bell(midi(m)) * 0.22
            out[bs:bs + len(b)] += b[: len(out) - bs]
        t0 += d
        k += 1
    out = lowpass_fast(out, 3200)
    # วนไร้รอยต่อ: เอาหางเสียงทับหัว
    out[:tail] += out[n:n + tail]
    out = out[:n]
    if vintage:
        out = highpass_fast(lowpass_fast(out, 1800, 3), 180)
        crackle = np.zeros(n)
        idx = rng.integers(0, n, size=int(loop * 9))
        crackle[idx] = rng.uniform(-1, 1, size=len(idx))
        crackle = lowpass_fast(crackle, 5000, 1) * 0.35
        hiss = lowpass_fast(rng.normal(0, 1, n), 4000, 1) * 0.012
        wow = 1 + 0.004 * np.sin(2 * np.pi * 0.5 * np.arange(n) / SR)
        out = out * wow + crackle * np.max(np.abs(out)) * 0.12 + hiss * np.max(np.abs(out))
    return out


# ---------------- sfx ----------------
def sfx_pop():
    n = int(0.18 * SR); t = np.arange(n) / SR
    f = 900 * np.exp(-t * 18) + 380
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28)


def sfx_bloop():
    n = int(0.3 * SR); t = np.arange(n) / SR
    f = 260 + 520 * (1 - np.exp(-t * 14))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * env(n, 0.005, 0.05)


def sfx_whoosh():
    n = int(0.9 * SR); t = np.arange(n) / SR
    x = rng.normal(0, 1, n)
    shape = np.sin(np.pi * t / t[-1]) ** 2
    lo = lowpass_fast(x, 900, 2); hi = lowpass_fast(x, 2600, 2)
    mix = lo * (1 - t / t[-1]) + hi * (t / t[-1])
    return highpass_fast(mix, 200) * shape


def sfx_paper():
    n = int(0.5 * SR)
    x = np.zeros(n)
    for _ in range(28):  # กรอบแกรบ = เสียงแตกสั้น ๆ หลายครั้ง
        s = rng.integers(0, n - 2000)
        L = rng.integers(200, 1800)
        x[s:s + L] += rng.normal(0, 1, L) * np.exp(-np.arange(L) / (L / 3)) * rng.uniform(0.3, 1)
    return highpass_fast(lowpass_fast(x, 6000, 1), 900) * env(n, 0.01, 0.1)


def sfx_tick():
    n = int(0.06 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * 0.6 + rng.normal(0, 0.3, n)) * np.exp(-t * 120)


def sfx_stamp():
    n = int(0.45 * SR); t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * np.cumsum(120 * np.exp(-t * 8) + 55) / SR) * np.exp(-t * 14)
    slap = lowpass_fast(rng.normal(0, 1, n), 3000, 1) * np.exp(-t * 60) * 0.6
    return thud + slap


if __name__ == "__main__":
    out = ROOT / "public" / "audio"
    write(out / "music" / "lofi-pad.wav", music(False), peak=0.5)
    write(out / "music" / "lofi-pad-vintage.wav", music(True), peak=0.5)
    for name, fn in [("pop", sfx_pop), ("bloop", sfx_bloop), ("whoosh", sfx_whoosh), ("paper", sfx_paper), ("tick", sfx_tick), ("stamp", sfx_stamp)]:
        write(out / "sfx" / f"{name}.wav", fn(), peak=0.7)
