"""Synthesize the promo soundtrack: a hummed nasheed, voices only, no instruments.

A lead voice hums a maqam melody (with vibrato, slides and grace notes), a group of voices joins
it scene by scene, a low hummed drone holds the tonic, and a soft hummed "dum" pulse gives the
middle scenes their drive. The voices climb as FULKI flips in, land on the tonic with the plane,
and fade out under the contact details. The board's split-flap clicks sit quietly underneath.

Usage: python3 make_audio.py cues.json out.wav [variant]
  hijaz   maqam Hijaz on D: the classic, uplifting sound (default)
  bayati  maqam Bayati on D, with its quarter-tone second: softer and more devotional
cues.json is written by render_promo.mjs: frame rate, length, scene cuts, logo landing time,
and how many board cells flap in each frame.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
CR = 1000  # control rate for pitch and loudness curves
cues = json.load(open(sys.argv[1]))
VARIANT = sys.argv[3] if len(sys.argv) > 3 else "hijaz"
rng = np.random.default_rng(31)
fps, dur, cuts, land = cues["fps"], cues["seconds"], cues["cuts"], cues["land"]
n, nc = int(SR * dur), int(CR * dur)
t = np.arange(n) / SR
tc = np.arange(nc) / CR
dry = np.zeros((n, 2))
send = np.zeros((n, 2))

# scale degrees 0..6 (+ octaves) in semitones above the tonic D
MAQAM = {"hijaz": [0, 1, 4, 5, 7, 8, 10], "bayati": [0, 1.5, 3, 5, 7, 8, 10]}[VARIANT]
TONIC = 50  # D3


def semis(deg):
    o, d = divmod(deg, 7)
    return 12 * o + MAQAM[int(d)]


# ---------- the melody: (degree, length); None is a breath. Lengths are eighths of the scene grid ----------
c0, c1, c2, c3 = cuts
U = (c1 - c0) / 8  # each region scene is 8 eighths
INTRO = [(0, 0.55), (1, 0.12), (0, 0.12), (2, 0.3), (3, 0.3), (4, 0.85)]  # seconds, free rhythm
PHRASES = [
    [(4, 1), (3, .5), (2, .5), (3, 1), (2, .5), (1, .5), (0, 2), (None, .5), (2, .5), (3, 1)],  # Asia
    [(4, 1), (5, .5), (4, .5), (3, 1), (2, .5), (3, .5), (4, 2), (None, .5), (5, .5), (6, 1)],  # Africa
    [(7, 1.5), (6, .5), (5, .5), (4, .5), (5, 1), (4, .5), (3, .5), (2, 1.5), (4, 1.5)],        # Middle East
]
CLIMB = [(4, 1), (5, 1), (6, 1)]  # while FULKI flips in; the top note then holds until the plane lands
FINALE = [(7, 0.55), (6, 0.16), (5, 0.16), (4, 0.5), (3, 0.18), (2, 0.18), (1, 0.32)]  # seconds


def timeline():
    """The lead line as (start, end, degree) in seconds."""
    out, s = [], 0.3
    for d, ln in INTRO:
        out.append((s, s + ln, d)); s += ln
    for a, ph in zip((c0, c1, c2), PHRASES):
        s = a
        for d, ln in ph:
            out.append((s, s + ln * U, d)); s += ln * U
    s = c3
    for d, ln in CLIMB:
        out.append((s, s + ln * U, d)); s += ln * U
    out.append((s, land, 7))
    s = land
    for d, ln in FINALE:
        out.append((s, s + ln, d)); s += ln
    out.append((s, dur - 0.2, 0))
    return out


# ---------- a humming voice ----------
def smooth(x, ms):
    k = max(1, int(CR * ms / 1000))
    w = np.exp(-0.5 * (np.arange(-3 * k, 3 * k + 1) / k) ** 2)
    return np.convolve(np.pad(x, 3 * k, mode="edge"), w / w.sum(), mode="valid")


def wobble(ms):
    """Slow random variation with unit spread."""
    x = smooth(rng.normal(0, 1, nc), ms)
    return x / (x.std() + 1e-9)


def resonance(f, fc, bw):
    return 1 / np.sqrt((1 - (f / fc) ** 2) ** 2 + (f * bw / fc**2) ** 2)


def hum_spectrum(f, size=1.0):
    """Nasal murmur (lips closed, sound through the nose): a strong resonance near 250 Hz,
    a dip near 1 kHz and a faint ring near 2.2 kHz, scaled by the singer's vocal tract size."""
    f = f / size
    dip = 0.25 + np.abs(1 - (f / 980) ** 2) / (1 + (f / 980) ** 2)
    return (resonance(f, 255, 110) * dip + 0.12 * resonance(f, 2200, 320)) / resonance(255.0, 255, 110)


def sing(notes, a, b, shift=0.0, size=1.0, vib=1.0, late=0.0, breath=0.02, glide=40, pan=0.0, gain=1.0, verb=0.5):
    """Render one hummed voice over a..b seconds following notes [(start, end, degree)]."""
    pitch = np.full(nc, np.nan)
    gate = np.zeros(nc)
    onset = np.zeros(nc)  # seconds since the current note began
    length = np.zeros(nc)
    changes = np.zeros(nc)
    prev = None
    for s, e, d in notes:
        s, e = s + late, e + late
        j0, j1 = max(0, int(s * CR)), min(nc, int(e * CR))
        if d is None or j1 <= j0:
            prev = None
            continue
        pitch[j0:j1] = TONIC + semis(d) + shift
        if prev is not None and e - s > 0.6 and prev != d:  # a grace note from above into long notes
            pitch[j0 : min(j1, j0 + int(0.07 * CR))] = TONIC + semis(d + 1) + shift
        gate[j0:j1] = 1
        onset[j0:j1] = tc[j0:j1] - s
        length[j0:j1] = e - s
        changes[j0] = 1
        prev = d
    # hold the last pitch through breaths, so slides start where the voice left off
    idx = np.where(~np.isnan(pitch), np.arange(nc), 0)
    np.maximum.accumulate(idx, out=idx)
    pitch = pitch[idx]
    pitch[np.isnan(pitch)] = TONIC + shift
    pitch = smooth(pitch, glide / 2)
    # vibrato grows in on held notes; a slow drift keeps the intonation human
    depth = 0.28 * vib * np.clip((onset - 0.2) / 0.35, 0, 1) * (length > 0.4)
    rate = 5.2 + 0.3 * wobble(400)
    pitch += depth * np.sin(2 * np.pi * np.cumsum(rate) / CR + rng.random() * 6) + 0.04 * wobble(80)
    # loudness: soft onsets, a slight dip at each new note, a gentle swell through the note, shimmer
    dip = smooth(changes, 25)
    loud = smooth(gate, 35) * (1 - 0.12 * dip / (dip.max() + 1e-9))
    loud *= 0.9 + 0.1 * np.sin(np.pi * np.clip(onset / np.maximum(length, 0.1), 0, 1))
    loud *= 1 + 0.04 * wobble(50)
    # additive synthesis at audio rate, over the active span only
    s0, s1 = int(a * SR), min(n, int(b * SR))
    ta = t[s0:s1]
    f0 = 440 * 2 ** ((np.interp(ta, tc, pitch) - 69) / 12)
    amp = np.clip(np.interp(ta, tc, loud), 0, None)
    phase = 2 * np.pi * np.cumsum(f0) / SR
    out = np.zeros(len(ta))
    for k in range(1, 80):
        fk = k * f0
        if fk.min() > 5500:
            break
        out += hum_spectrum(fk, size) * k**-1.1 * np.sin(k * phase + k * 0.7) * (fk < 6000)
    # breath through the nose
    spec = np.fft.rfft(rng.normal(0, 1, len(ta)))
    br = np.fft.irfft(spec * np.exp(-((np.fft.rfftfreq(len(ta), 1 / SR) - 600) / 900) ** 2), len(ta))
    out = out / 3 + breath * br / (np.abs(br).max() + 1e-9)
    put(out * amp, a, pan, gain, verb)


def put(sig, start, pan=0.0, gain=1.0, verb=0.3):
    i = int(round(start * SR))
    sig = sig[: max(0, n - i)] * gain
    lr = np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)])
    dry[i : i + len(sig)] += sig[:, None] * lr
    send[i : i + len(sig)] += sig[:, None] * lr * verb


def inhale(at, gain=0.035):
    """A quiet breath in through the nose just before a phrase."""
    x = np.arange(int(0.28 * SR)) / SR
    spec = np.fft.rfft(rng.normal(0, 1, len(x)))
    noise = np.fft.irfft(spec * np.exp(-((np.fft.rfftfreq(len(x), 1 / SR) - 1800) / 1500) ** 2), len(x))
    put(noise / (np.abs(noise).max() + 1e-9) * np.sin(np.pi * x / x[-1]) ** 2, max(0, at - 0.28), 0.1, gain, 0.4)


def reverb(x, length=2.8, damp=5000):
    """A warm hall: decaying, darkened noise with a short pre-delay."""
    ir_len = int(length * SR)
    xs = np.arange(ir_len) / SR
    f = np.maximum(np.fft.rfftfreq(ir_len, 1 / SR), 1)
    out = np.zeros_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + ir_len)))
    for ch in range(2):
        ir = np.fft.irfft(np.fft.rfft(rng.normal(0, 1, ir_len)) / (1 + (f / damp) ** 2) / (1 + (120 / f) ** 2), ir_len)
        ir *= np.exp(-xs * 6.9 / length)
        ir[: int(0.02 * SR)] = 0
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir / np.sqrt((ir**2).sum()), size), size)[: len(x)]
    return out


# ---------- arrangement ----------
lead = timeline()
full = VARIANT != "bayati"

# lead voice, with a close double for body
sing(lead, 0, dur, vib=1.0, breath=0.025, gain=1.0, verb=0.55)
sing(lead, 0, dur, shift=0.06, size=0.96, vib=0.6, late=0.018, breath=0.03, pan=0.15, gain=0.35, verb=0.7)
for at in (0.3, c0, c1, c2, c3):
    inhale(at)

# drone: the group hums the tonic an octave down (and the fifth, in Hijaz), swelling in from the start
sing([(0.0, dur - 0.1, 0)], 0, dur, shift=-12, size=1.1, vib=0.15, breath=0.04, pan=-0.35, gain=0.32, verb=0.6)
sing([(0.0, dur - 0.1, 0)], 0, dur, shift=-11.92, size=1.05, vib=0.15, breath=0.04, pan=0.35, gain=0.28, verb=0.6)
if full:
    sing([(c0, dur - 0.1, 4)], c0, dur, shift=-12, size=1.08, vib=0.1, breath=0.04, gain=0.18, verb=0.6)

# the group joins the melody in unison (from Africa in Hijaz, from the Middle East in Bayati);
# in Hijaz the Middle East adds a line a fourth below
group_from = c1 if full else c2
group = [(s, e, d) for s, e, d in lead if s >= group_from - 0.01]
for k, (sh, size, pan) in enumerate(((0.1, 0.93, -0.6), (-0.09, 1.06, 0.6), (0.04, 0.98, -0.2))):
    sing(group, group_from, dur, shift=sh, size=size, vib=0.7, late=0.02 + 0.015 * k, breath=0.05, pan=pan,
         gain=0.3 if full else 0.22, verb=0.8)
if full:
    fourth = [(s, e, None if d is None else d - 3) for s, e, d in lead if s >= c2 - 0.01]
    for sh, size, pan in ((0.05, 1.04, -0.5), (-0.05, 1.1, 0.5)):
        sing(fourth, c2, dur, shift=sh, size=size, vib=0.6, late=0.03, breath=0.05, pan=pan, gain=0.24, verb=0.8)

# a low hummed "dum" pulse in 3-3-2 up to the landing (a soft heartbeat in Bayati)
for s in np.arange(group_from, land - 0.05, U):
    step = int(round((s - c0) / U)) % 8
    if step in (0, 3, 6) or (full and s >= c2 and step == 7):
        sing([(s, s + 0.16, 0)], s, s + 0.4, shift=-12, size=1.15, vib=0, glide=10, breath=0.02,
             gain=(0.5 if step == 0 else 0.35) * (1 if full else 0.6), verb=0.25)

# the landing: the whole group arrives on the tonic chord and holds it under the finale
chord = [(-12, 0), (0, 0), (0, 2), (0, 4)] if full else [(-12, 0), (0, 0), (0, 4)]
for k, (octv, deg) in enumerate(chord):
    sing([(land, dur - 0.2, deg)], land - 0.02, dur, shift=octv + 0.05 * (-1) ** k, size=1.0 + 0.04 * k,
         vib=0.5, late=0.01 * k, breath=0.05, pan=-0.6 + 0.4 * k, gain=0.28, verb=0.85)

# split-flap clicks from the board and the logo, kept low under the voices
for fi, count in enumerate(cues["flaps"]):
    for _ in range(min(count, 8)):
        x = np.arange(int(0.01 * SR)) / SR
        click = rng.normal(0, 1, len(x)) * np.exp(-x * 700) + 0.3 * np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 400)
        put(click, fi / fps + rng.uniform(0, 1 / fps), rng.uniform(-0.5, 0.5), 0.012, 0.05)

# ---------- master ----------
mix = dry + reverb(send) * 0.8
mix *= (np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 1.2))[:, None]
mix *= 10 ** (-14 / 20) / np.sqrt((mix**2).mean())  # loudness to about -14 dBFS RMS
knee = 0.7
mag = np.abs(mix)
mix = np.where(mag < knee, mix, np.sign(mix) * (knee + (0.98 - knee) * np.tanh((mag - knee) / (0.98 - knee))))
mix *= 0.85  # headroom for the AAC encoder

with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mix * 32767).astype("<i2").tobytes())
