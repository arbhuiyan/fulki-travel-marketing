"""Synthesize a reel's soundtrack: a short music bed in the reel's style and sound effects on its cues.

Usage: python3 make_audio.py cues.json out.wav
cues.json is written by render_reel.mjs:
  {"seconds": 15, "music": {"style": "pop", "bpm": 124, "key": 0}, "end": 12.4, "cues": [[t, "pop", gain], ...]}

Music styles (all instruments are synthesized here, nothing is sampled):
  pop        four-on-the-floor kick, claps, offbeat hats, a bouncy bass and bright plucked chords
  lofi       slow swung beat, soft kick and rim, warm electric-piano seventh chords, vinyl crackle
  tropical   soft kick, shaker, marimba chords and a round sub bass
  corporate  a clean pulse: kick, light hats, eighth-note piano chords and a soft pad
  warm       acoustic: plucked-string arpeggios, a soft kick on one and three, brushed noise
  synth      retro synthwave: detuned saw pad, sixteenth-note arpeggio, gated snare and a pumping bass
The music fades in, plays through the reel, lands on a held tonic chord at "end" (the logo) and rings out.

Sound effects: whoosh, swoosh, pop, click, type, send, receive, stamp, print, tear, flip, pin, buzz, shutter,
ding, riser, impact, tick, thud.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)
cfg = json.load(open(sys.argv[1]))
dur = cfg["seconds"]
music = cfg.get("music", {})
STYLE = music.get("style", "pop")
END = cfg.get("end", dur - 2.5)
n = int(SR * dur)
mus = np.zeros((n, 2))
fx = np.zeros((n, 2))


# ---------- building blocks ----------
def env_ad(length, attack, decay):
    x = np.arange(int(length * SR)) / SR
    return x, np.minimum(1, x / max(attack, 1e-4)) * np.exp(-x / decay)


def spectral(x, shape):
    """Filter x through a magnitude response shape(f) (in Hz), via one FFT."""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) * shape(np.maximum(f, 1)), len(x))


def lowpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (f / fc) ** (2 * order)))


def highpass(x, fc, order=2):
    return spectral(x, lambda f: 1 / np.sqrt(1 + (fc / f) ** (2 * order)))


def bandpass(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def noise(length):
    return rng.normal(0, 1, int(length * SR))


def midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def place(buf, sig, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    if sig.ndim == 1:
        sig = np.stack([sig * np.sqrt(0.5 * (1 - pan)), sig * np.sqrt(0.5 * (1 + pan))], 1)
    j0 = max(0, -i)
    seg = sig[j0 : len(buf) - i]
    buf[i + j0 : i + j0 + len(seg)] += gain * seg


def reverb(x, length=2.2, damp=6000, wet=0.25):
    ir_len = int(length * SR)
    xs = np.arange(ir_len) / SR
    out = np.zeros_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + ir_len)))
    for ch in range(2):
        ir = lowpass(rng.normal(0, 1, ir_len), damp) * np.exp(-xs * 6.9 / length)
        ir[: int(0.015 * SR)] = 0
        ir /= np.sqrt((ir**2).sum())
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x + wet * out


# ---------- instruments ----------
def kick(length=0.45, punch=1.0):
    x = np.arange(int(length * SR)) / SR
    f = 45 + 110 * np.exp(-x * 28)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 7)
    click = lowpass(noise(length), 4000) * np.exp(-x * 300) * 0.25
    return np.tanh(1.6 * (body + click * punch))


def clap():
    out = np.zeros(int(0.3 * SR))
    for k, lag in enumerate((0, 0.011, 0.022)):
        x = np.arange(int(0.25 * SR)) / SR
        b = bandpass(noise(0.25), 900, 5000) * np.exp(-x * (60 if k < 2 else 18))
        i = int(lag * SR)
        out[i : i + len(b)] += b[: len(out) - i]
    return out / np.abs(out).max()


def snare(length=0.3):
    x = np.arange(int(length * SR)) / SR
    tone = np.sin(2 * np.pi * 185 * x) * np.exp(-x * 30)
    sn = bandpass(noise(length), 1200, 9000) * np.exp(-x * 16)
    return 0.6 * tone + 0.8 * sn / np.abs(sn).max()


def hat(open_=False):
    length = 0.25 if open_ else 0.06
    x = np.arange(int(length * SR)) / SR
    h = highpass(noise(length), 7000) * np.exp(-x * (14 if open_ else 70))
    return h / np.abs(h).max()


def shaker():
    x = np.arange(int(0.12 * SR)) / SR
    s = bandpass(noise(0.12), 5000, 11000) * np.sin(np.pi * x / 0.12) ** 2
    return s / np.abs(s).max()


def rim():
    x = np.arange(int(0.08 * SR)) / SR
    r = np.sin(2 * np.pi * 1700 * x) * np.exp(-x * 90) + 0.5 * bandpass(noise(0.08), 2000, 6000) * np.exp(-x * 120)
    return r / np.abs(r).max()


def pluck(m, length=1.2, bright=0.5):
    """Karplus-Strong plucked string."""
    f = midi(m)
    period = int(SR / f)
    buf = lowpass(rng.uniform(-1, 1, period * 4), 2000 + 6000 * bright)[:period]
    out = np.zeros(int(length * SR))
    out[:period] = buf
    for i in range(period, len(out), period):
        seg = out[i - period : i]
        avg = 0.996 * 0.5 * (seg + np.roll(seg, 1))
        out[i : i + period] = avg[: len(out) - i]
    return out / (np.abs(out).max() + 1e-9)


def epiano(m, length=1.6):
    f = midi(m)
    x, e = env_ad(length, 0.004, 0.9)
    tone = np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 3) + 0.2 * np.sin(2 * np.pi * 7.1 * f * x) * np.exp(-x * 30)
    return tone * e * (1 + 0.15 * np.sin(2 * np.pi * 4.5 * x))


def piano(m, length=1.4):
    f = midi(m)
    x, e = env_ad(length, 0.002, 0.6)
    tone = sum(a * np.sin(2 * np.pi * f * k * x * (1 + 0.0004 * k * k)) * np.exp(-x * k * 1.2) for k, a in ((1, 1), (2, .5), (3, .25), (4, .12), (5, .06)))
    return tone * e


def marimba(m, length=0.8):
    f = midi(m)
    x, e = env_ad(length, 0.002, 0.28)
    return (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * 4 * f * x) * np.exp(-x * 25)) * e


def saw(f, x, detune=0.0):
    ph = (f * (1 + detune) * x) % 1
    return 2 * ph - 1


def pad(ms, length, bright=1800):
    x = np.arange(int(length * SR)) / SR
    s = sum(saw(midi(m), x, d) for m in ms for d in (-0.006, 0, 0.007))
    s = lowpass(s, bright, 2) / (3 * len(ms))
    att = np.minimum(1, x / 0.25) * np.minimum(1, (length - x) / 0.3)
    return s * att


def bass(m, length, kind="sine"):
    f = midi(m)
    x = np.arange(int(length * SR)) / SR
    if kind == "saw":
        s = lowpass(saw(f, x) + saw(f, x, 0.004), 500, 2)
    else:
        s = np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 2 * f * x)
    return s * np.minimum(1, x / 0.008) * np.minimum(1, np.maximum(0, length - x) / 0.03)


# ---------- the music ----------
STYLES = {
    #            bpm  progression (semitones above the key, chord quality)              swing
    "pop":       (124, [(0, "maj"), (7, "maj"), (9, "min"), (5, "maj")], 0.0),
    "lofi":      (84,  [(2, "min7"), (7, "dom7"), (0, "maj7"), (9, "min7")], 0.18),
    "tropical":  (102, [(0, "maj"), (5, "maj"), (7, "maj"), (5, "maj")], 0.0),
    "corporate": (116, [(0, "maj"), (9, "min"), (5, "maj"), (7, "maj")], 0.0),
    "warm":      (94,  [(0, "maj"), (9, "min"), (5, "maj"), (7, "sus4")], 0.08),
    "synth":     (98,  [(9, "min"), (5, "maj"), (0, "maj"), (7, "maj")], 0.0),
}
QUAL = {"maj": [0, 4, 7], "min": [0, 3, 7], "maj7": [0, 4, 7, 11], "min7": [0, 3, 7, 10], "dom7": [0, 4, 7, 10], "sus4": [0, 5, 7]}
bpm0, prog, swing = STYLES[STYLE]
BPM = music.get("bpm", bpm0)
KEY = 48 + music.get("key", 0)  # C3 by default
beat = 60 / BPM
bar = 4 * beat


def at_step(b, s):
    """Time of sixteenth s of beat b, with swing on the off sixteenths."""
    return b * beat + s * beat / 4 + (swing * beat / 4 if s % 2 else 0)


def voicing(root, qual, octave=0):
    return [KEY + 12 + octave * 12 + root + q for q in QUAL[qual]]


beats = int(END / beat)  # play up to the logo
drums = np.zeros((n, 2))
keys = np.zeros((n, 2))
low = np.zeros((n, 2))
for b in range(beats):
    t0 = b * beat
    root, qual = prog[(b // 4) % len(prog)]
    ch = voicing(root, qual)
    intro = b < 4  # the first bar: chords only, the beat comes in after
    if STYLE == "pop":
        if not intro:
            place(drums, kick(), t0, 0.9)
            place(drums, hat(), at_step(b, 2), 0.25, 0.3)
            if b % 2:
                place(drums, clap(), t0, 0.45, -0.1)
            if b % 4 == 0:
                place(low, bass(KEY - 12 + root, beat * 0.45), t0, 0.5)
            place(low, bass(KEY - 12 + root, beat * 0.4), at_step(b, 2), 0.45)
        for s in (0, 3) if b % 2 else (2,):
            for k, m in enumerate(ch):
                place(keys, pluck(m + 12, 0.6, 0.7), at_step(b, s) + k * 0.004, 0.16, (k - 1) * 0.4)
    elif STYLE == "lofi":
        if not intro:
            if b % 4 in (0, 2):
                place(drums, kick(0.4, 0.4), t0, 0.7)
            if b % 4 == 2:
                place(drums, kick(0.4, 0.4), at_step(b, 3), 0.45)
            if b % 2:
                place(drums, rim(), t0, 0.35, 0.1)
            for s in (0, 2):
                place(drums, hat(), at_step(b, s), 0.12 if s else 0.18, -0.3)
            if b % 4 == 0:
                place(low, bass(KEY - 12 + root, bar * 0.9), t0, 0.5)
        if b % 4 == 0:
            for k, m in enumerate(ch):
                place(keys, epiano(m, bar * 1.1), t0 + k * 0.012, 0.16, (k - 1.5) * 0.3)
        if b % 4 == 3 and not intro:
            place(keys, epiano(ch[-1] + 12, beat), at_step(b, 2), 0.1, 0.4)
    elif STYLE == "tropical":
        if not intro:
            place(drums, kick(0.35, 0.5), t0, 0.7 if b % 2 == 0 else 0.45)
            for s in range(4):
                place(drums, shaker(), at_step(b, s), 0.12 if s % 2 == 0 else 0.2, 0.4)
            if b % 2:
                place(drums, rim(), at_step(b, 2), 0.25, -0.2)
            place(low, bass(KEY - 12 + root, beat * 0.6), t0, 0.55)
        for s, k in ((0, 0), (2, 1), (3, 2)) if b % 2 == 0 else ((1, 2), (2, 1)):
            place(keys, marimba(ch[k] + 12), at_step(b, s), 0.3, (k - 1) * 0.5)
    elif STYLE == "corporate":
        if not intro:
            place(drums, kick(0.35, 0.6), t0, 0.7)
            place(drums, hat(), at_step(b, 2), 0.18, 0.3)
            if b % 2:
                place(drums, snare(0.2), t0, 0.18)
            place(low, bass(KEY - 12 + root, beat * 0.9), t0, 0.4)
        for s in (0, 2):
            for k, m in enumerate(ch):
                place(keys, piano(m + 12, 0.5), at_step(b, s), 0.1 if s else 0.13, (k - 1) * 0.3)
        if b % 4 == 0:
            place(keys, pad(ch, bar), t0, 0.12)
    elif STYLE == "warm":
        if not intro:
            if b % 2 == 0:
                place(drums, kick(0.4, 0.3), t0, 0.6)
            else:
                x = np.arange(int(0.25 * SR)) / SR
                place(drums, bandpass(noise(0.25), 2000, 8000) * np.exp(-x * 12) * 0.5, t0, 0.25)
            if b % 4 == 0:
                place(low, bass(KEY - 12 + root, bar * 0.5), t0, 0.4)
        arp = ch + [ch[0] + 12]
        for s in range(4):
            if s % 2 == 0 or b % 2:
                m = arp[(b * 2 + s) % len(arp)] + (12 if s == 3 else 0)
                place(keys, pluck(m, 1.4, 0.35), at_step(b, s), 0.22, ((b + s) % 3 - 1) * 0.4)
    elif STYLE == "synth":
        if b % 4 == 0:
            place(keys, pad(voicing(root, qual, -1), bar), t0, 0.22)
        arp = voicing(root, qual, 1)
        for s in range(4):
            x = np.arange(int(beat / 4 * SR)) / SR
            tone = lowpass(saw(midi(arp[(b * 4 + s) % 3] + (12 if s == 3 else 0)), x), 3000) * np.exp(-x * 14)
            place(keys, tone, at_step(b, s), 0.08 if intro else 0.12, 0.3 if s % 2 else -0.3)
        if not intro:
            place(drums, kick(0.4, 0.8), t0, 0.8)
            if b % 2:
                place(drums, reverb(np.stack([snare(0.35)] * 2, 1), 0.4, 5000, 1.2), t0, 0.35)
            place(drums, hat(), at_step(b, 2), 0.15)
            for s in (1, 2, 3):
                place(low, bass(KEY - 24 + root, beat / 4 * 0.9, "saw"), at_step(b, s), 0.45)

# the landing: the tonic chord held under the logo and ringing out
land = np.zeros((n, 2))
tonic = voicing(0, "maj7" if STYLE == "lofi" else "maj")
tail = dur - END
if STYLE in ("synth", "corporate"):
    place(land, pad(tonic + [tonic[0] + 12], tail, 2200), END, 0.22)
for k, m in enumerate(tonic + [tonic[0] + 12]):
    inst = {"lofi": epiano, "corporate": piano, "tropical": marimba}.get(STYLE)
    sig = inst(m + (12 if STYLE != "lofi" else 0), tail) if inst else pluck(m + 12, tail, 0.5)
    place(land, sig, END + k * 0.03, 0.2, (k - 1.5) * 0.3)
place(land, kick(0.6, 1.0), END, 0.8)
place(land, bass(KEY - 12, 1.2), END, 0.5)
if STYLE == "lofi":
    crackle = np.zeros(n)
    idx = rng.integers(0, n, int(dur * 60))
    crackle[idx] = rng.uniform(-1, 1, len(idx))
    crackle = highpass(crackle, 2500) + 0.02 * lowpass(noise(dur)[:n], 800)
    place(mus, crackle * 0.25, 0)

mus += reverb(keys, 1.8, 6000, 0.35) + drums + low + reverb(land, 2.4, 6000, 0.35)
fade_in = np.minimum(1, np.arange(n) / (0.4 * SR))
mus *= fade_in[:, None]


# ---------- sound effects ----------
def whoosh(length=0.5, lo=300, hi=3000):
    x = np.arange(int(length * SR)) / SR
    e = np.sin(np.pi * x / length) ** 2
    w = bandpass(noise(length), lo, hi) * e
    return w / np.abs(w).max()


def pop_sfx():
    x = np.arange(int(0.12 * SR)) / SR
    f = 500 + 900 * np.exp(-x * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 35)


def click_sfx():
    x = np.arange(int(0.03 * SR)) / SR
    return bandpass(noise(0.03), 2000, 9000) * np.exp(-x * 400)


def type_sfx():
    x = np.arange(int(0.05 * SR)) / SR
    c = bandpass(noise(0.05), 1500 + rng.uniform(0, 1500), 7000) * np.exp(-x * 250) + 0.4 * np.sin(2 * np.pi * rng.uniform(250, 350) * x) * np.exp(-x * 120)
    return c / np.abs(c).max()


def add(*sigs):
    """Sum signals of different lengths, padding the short ones with silence."""
    out = np.zeros(max(len(x) for x in sigs))
    for x in sigs:
        out[: len(x)] += x
    return out


def tone(f, length, decay, attack=0.003):
    x, e = env_ad(length, attack, decay)
    return np.sin(2 * np.pi * f * x) * e


def stamp_sfx():
    x = np.arange(int(0.35 * SR)) / SR
    thump = np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-x * 40)) / SR) * np.exp(-x * 18)
    slap = bandpass(noise(0.35), 300, 3000) * np.exp(-x * 60)
    return np.tanh(1.5 * (thump + 0.7 * slap / np.abs(slap).max()))


def print_sfx(length=1.2):
    x = np.arange(int(length * SR)) / SR
    motor = np.sign(np.sin(2 * np.pi * 95 * x)) * 0.2 + np.sin(2 * np.pi * 190 * x) * 0.3
    steps = bandpass(noise(length), 800, 5000) * (np.sin(2 * np.pi * 24 * x) > 0.6)
    s = lowpass(motor, 1500) + 0.35 * steps
    return s * np.minimum(1, x / 0.05) * np.minimum(1, (length - x) / 0.08)


def tear_sfx(length=0.45):
    x = np.arange(int(length * SR)) / SR
    grit = bandpass(noise(length), 1500, 9000) * (rng.uniform(0, 1, len(x)) ** 6) * 3
    body = bandpass(noise(length), 400, 3000) * 0.4
    return (grit + body) * np.sin(np.pi * x / length) ** 0.5


def flip_sfx():
    x = np.arange(int(0.18 * SR)) / SR
    f = bandpass(noise(0.18), 600, 6000) * np.sin(np.pi * x / 0.18) ** 2
    return f / np.abs(f).max()


def pin_sfx():
    """A falling whistle of air, then a soft landing with a bright tick."""
    s = whoosh(0.25, 800, 5000) * 0.4
    return np.concatenate([s, add(stamp_sfx()[: int(0.2 * SR)] * 0.7, tone(880, 0.2, 0.08))])


def buzz_sfx(length=0.6):
    x = np.arange(int(length * SR)) / SR
    hum = np.tanh(4 * np.sin(2 * np.pi * 120 * x)) * 0.5 + 0.3 * np.sin(2 * np.pi * 240 * x)
    flicker = (rng.uniform(0, 1, int(length * 60) + 1) > 0.35).repeat(SR // 60 + 1)[: len(x)]
    zap = highpass(noise(length), 3000) * 0.15
    return (lowpass(hum, 2000) + zap) * flicker * np.minimum(1, (length - x) / 0.1)


def shutter_sfx():
    x = np.arange(int(0.2 * SR)) / SR
    c1 = bandpass(noise(0.2), 1000, 8000) * np.exp(-x * 120)
    c2 = np.roll(c1, int(0.07 * SR)) * 0.7
    return c1 + c2


def riser(length=1.0):
    x = np.arange(int(length * SR)) / SR
    w = noise(length)
    out = np.zeros_like(w)
    for k in range(8):  # band climbs in eight steps
        a, b = k * len(x) // 8, (k + 1) * len(x) // 8
        out[a:b] = bandpass(w, 400 * 1.6 ** k, 900 * 1.6 ** k)[a:b]
    return out / np.abs(out).max() * (x / length) ** 2


SFX = {
    "whoosh": lambda: whoosh(0.5),
    "swoosh": lambda: whoosh(0.3, 1500, 7000),
    "pop": pop_sfx,
    "click": click_sfx,
    "type": type_sfx,
    "send": lambda: add(whoosh(0.22, 1200, 6000) * 0.6, tone(1320, 0.15, 0.05)),
    "receive": lambda: np.concatenate([tone(988, 0.12, 0.08), tone(1319, 0.5, 0.15)]),
    "stamp": stamp_sfx,
    "print": print_sfx,
    "tear": tear_sfx,
    "flip": flip_sfx,
    "pin": pin_sfx,
    "buzz": buzz_sfx,
    "shutter": shutter_sfx,
    "ding": lambda: add(tone(1568, 1.0, 0.35), 0.3 * tone(3136, 0.6, 0.15)),
    "riser": riser,
    "impact": lambda: kick(0.8, 1.2) + 0.4 * lowpass(noise(0.8), 300) * np.exp(-np.arange(int(0.8 * SR)) / SR * 6),
    "tick": lambda: add(tone(2400, 0.04, 0.01) * 0.6, click_sfx()),
    "thud": lambda: kick(0.3, 0.2),
}
for c in cfg.get("cues", []):
    t, name = c[0], c[1]
    gain = c[2] if len(c) > 2 else 1.0
    pan = c[3] if len(c) > 3 else rng.uniform(-0.25, 0.25)
    place(fx, SFX[name](), t, 0.5 * gain, pan)
fx = reverb(fx, 1.2, 7000, 0.15)

# ---------- mix ----------
out = 0.55 * mus + fx
tail = np.minimum(1, (dur - np.arange(n) / SR) / 0.6)
out *= tail[:, None]
out = np.tanh(out * 1.3) / np.tanh(1.3)
out *= 0.89 / (np.abs(out).max() + 1e-9)
with wave.open(sys.argv[2], "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
