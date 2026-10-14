"""Synthesize the promo soundtrack: warm pad, plucked-string arpeggios, a soft pulse,
split-flap clicks timed to the departures board, and a whoosh for each plane flyby.

Usage: python3 make_audio.py cues.json out.wav   (cues.json is written by render_promo.mjs)
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)
cues = json.load(open(sys.argv[1]))
fps, dur, cuts = cues["fps"], cues["seconds"], cues["cuts"]
n = int(SR * dur)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def smooth(x, ms):
    k = max(1, int(SR * ms / 1000))
    return np.convolve(x, np.ones(k) / k, mode="same")


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    L[i : i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    R[i : i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


# one chord per section: intro Dsus2, Asia D, Africa Bm, Middle East G, outro Dadd9
sections = [0.0] + cuts + [dur]
chords = [[50, 57, 62, 64], [50, 57, 62, 66, 69], [47, 54, 59, 62, 66], [43, 50, 55, 59, 62], [50, 57, 62, 64, 66, 69]]

# pad: soft additive saws, crossfaded between sections
for k, (a, b) in enumerate(zip(sections[:-1], sections[1:])):
    a0, b0 = max(0, a - 0.25), min(dur, b + 0.25)
    seg = np.arange(int((b0 - a0) * SR)) / SR
    env = np.minimum(1, seg / 0.35) * np.minimum(1, (b0 - a0 - seg) / 0.35)
    if k == 0:
        env *= np.linspace(0.3, 1, len(seg))
    tone = np.zeros(len(seg))
    for m in chords[k]:
        for det in (-0.08, 0.08):
            f = midi(m + det)
            for h in range(1, 7):
                tone += np.sin(2 * np.pi * f * h * seg + h) / h**1.6
    add(tone * env / len(chords[k]), a0, pan=0.0, gain=0.11)

# plucked strings (Karplus-Strong) arpeggiating each chord, alternating pan
def pluck(freq, length=1.2, bright=0.5):
    p = int(SR / freq)
    buf = rng.uniform(-1, 1, p)
    buf = smooth(buf, 0.04) if bright < 0.5 else buf
    out = np.empty(int(SR * length))
    for i in range(len(out)):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * np.minimum(1, np.arange(len(out)) / 40)


step = 0.25
for k in range(1, 5):
    a, b = sections[k], sections[k + 1]
    notes = [m + 12 for m in chords[k]]
    order = notes + notes[-2:0:-1]
    s, j = a, 0
    while s < b - 0.05:
        add(pluck(midi(order[j % len(order)])), s, pan=-0.45 if j % 2 else 0.45, gain=0.16)
        s += step
        j += 1

# pulse: soft kick on the beat, shaker on the off-beat, from Asia to the outro
for s in np.arange(cuts[0], cuts[-1] + 0.01, 0.5):
    seg = np.arange(int(0.25 * SR)) / SR
    f = 50 + 70 * np.exp(-seg * 30)
    add(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-seg * 14), s, gain=0.42)
    noise = np.diff(rng.normal(0, 1, int(0.06 * SR) + 1)) * np.exp(-np.arange(int(0.06 * SR)) / SR * 70)
    add(noise, s + 0.25, pan=0.3, gain=0.035)

# split-flap clicks: one per flapping cell per frame, scattered within the frame
for fi, count in enumerate(cues["flaps"]):
    for _ in range(min(count, 12)):
        ln = int(0.004 * SR)
        click = np.diff(rng.normal(0, 1, ln + 1)) * np.exp(-np.arange(ln) / ln * 5)
        add(click, fi / fps + rng.uniform(0, 1 / fps), pan=rng.uniform(-0.6, 0.6), gain=0.05)

# whoosh: filtered noise swelling as the plane crosses left to right
for c in cuts:
    ln = int(1.1 * SR)
    seg = np.arange(ln) / ln
    env = np.sin(np.pi * seg) ** 2
    w = smooth(rng.normal(0, 1, ln), 0.6) - smooth(rng.normal(0, 1, ln), 6) * 0.5
    i = int((c - 0.6) * SR)
    pan = -0.9 + 1.8 * seg
    w = w * env * 0.5
    end = min(n, i + ln)
    L[i:end] += (w * np.cos((pan + 1) * np.pi / 4))[: end - i]
    R[i:end] += (w * np.sin((pan + 1) * np.pi / 4))[: end - i]

# outro chime: a small bell as the logo lands
for m, d in ((86, 0.0), (90, 0.08), (93, 0.16)):
    seg = np.arange(int(1.8 * SR)) / SR
    f = midi(m)
    bell = sum(np.sin(2 * np.pi * f * r * seg) * a for r, a in ((1, 1), (2.76, 0.4), (5.4, 0.15))) * np.exp(-seg * 3)
    add(bell, cuts[-1] + 0.15 + d, pan=0.2 - d * 2, gain=0.09)

mixdown = np.stack([L, R], axis=1)
mixdown *= np.minimum(1, (dur - t) / 0.35)[:, None]
mixdown = np.tanh(mixdown * 1.2)
mixdown *= 0.89 / np.abs(mixdown).max()

with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mixdown * 32767).astype("<i2").tobytes())
