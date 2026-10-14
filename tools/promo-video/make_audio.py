"""Synthesize the promo soundtrack: a hummed melody (voices only, no instruments) in the
background, a low natural soundscape for each scene beneath it (chosen by the promo: monsoon rain and
river, savanna wind, desert wind and sand, tea-garden breeze, waves on the beach or a river at dusk), and sound effects on
top: dry mechanical clacks for every card that flips, a low swipe on every scene change, and a
phone call-to-action when the WhatsApp number appears.

A lead voice hums a maqam melody (with vibrato, slides and grace notes), a group of voices joins
it scene by scene, a low hummed drone holds the tonic, and a soft hummed "dum" pulse gives the
middle scenes their drive. The voices climb as FULKI flips in, land on the tonic with the plane,
and fade out under the contact details.

Usage: python3 make_audio.py cues.json out.wav [variant]
  Open voice, simple and low in the mix:
  mawwal        Middle Eastern: one open voice on "aa"/"ey" in maqam Hijaz, over a soft low "oo"
  callresponse  African: a lead calls "e-o-e" and a small group answers in harmony, on a pentatonic scale
  sahel         West African hum: the same call and response, hummed, on a minor pentatonic scale
  raga          South Asian: a raga alaap in Raag Yaman on open "aa", gliding between notes over a soft Sa-Pa
  Other backgrounds:
  airport       no voice: an airport terminal instead (hall hum, crowd murmur, footsteps, suitcases
                rolling past, the announcement chime, a jet taking off as the logo lands)
  airport+NAME  the airport with any melody below hummed quietly beneath it (an octave up, so it carries), e.g.
                airport+hijaz (default) or airport+alaap
  none          no background at all: only the regional soundscapes and the sound effects
  Hummed or more ornate:
  alaap   South Asian free-voice humming, like a raga alaap or a Bengali bhatiyali: one voice in free
          rhythm on a pentatonic scale (Sa Re Ga Pa Dha), gliding slowly between notes over a hummed
          Sa-Pa drone
  uzunhava  Turkish free voice, like an Anatolian uzun hava: one open voice on "aa", "ey", "of", in
          makam Hüseyni with its comma-flat second, wide fast vibrato and gırtlak throat ornaments,
          over a soft low "oo" from a few voices
  hijaz   nasheed in maqam Hijaz on D: lead, group, drone and a soft "dum" pulse
  bayati  nasheed in maqam Bayati on D, with its quarter-tone second: softer and more devotional
cues.json is written by render_promo.mjs: frame rate, length, scene cuts, logo landing time,
how many board cells flap in each frame, and when each FULKI card flips.
"""
import json
import sys
import wave

import numpy as np

SR = 44100
CR = 1000  # control rate for pitch and loudness curves
cues = json.load(open(sys.argv[1]))
VARIANT = sys.argv[3] if len(sys.argv) > 3 else "airport+hijaz"
# "airport+hijaz" etc.: the airport background with a melody hummed very quietly beneath it
BACKGROUND, _, HUM = VARIANT.partition("+")
if HUM:
    VARIANT = HUM
rng = np.random.default_rng(31)
fps, dur, cuts, land = cues["fps"], cues["seconds"], cues["cuts"], cues["land"]
n, nc = int(SR * dur), int(CR * dur)
t = np.arange(n) / SR
tc = np.arange(nc) / CR
dry = np.zeros((n, 2))  # voices
send = np.zeros((n, 2))
fx_dry = np.zeros((n, 2))  # sound effects
fx_send = np.zeros((n, 2))

# scale degrees (+ octaves) in semitones above the tonic D
SCALE = {"hijaz": [0, 1, 4, 5, 7, 8, 10], "bayati": [0, 1.5, 3, 5, 7, 8, 10], "alaap": [0, 2, 4, 7, 9],
         # makam Hüseyni in Turkish (53-comma) tuning: the second sits 8 commas up, between E-flat and E
         "uzunhava": [0, 1.81, 2.94, 4.98, 7.02, 9.06, 9.96],
         "airport": [0, 2, 4, 5, 7, 9, 11], "none": [0, 2, 4, 5, 7, 9, 11],
         "mawwal": [0, 1, 4, 5, 7, 8, 10], "callresponse": [0, 2, 4, 7, 9], "sahel": [0, 3, 5, 7, 10], "raga": [0, 2, 4, 6, 7, 9, 11]}[VARIANT]
TONIC = 50  # D3
# under the airport the hum goes up an octave and a little brighter, so it carries on phone speakers
UNDER_AIRPORT = bool(HUM) and BACKGROUND == "airport"
if UNDER_AIRPORT:
    TONIC = 62


def semis(deg):
    o, d = divmod(deg, len(SCALE))
    return 12 * o + SCALE[int(d)]


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


# the alaap: free rhythm, in seconds from each section's start; "gamak" marks a slow shake on the note
ALAAP = {
    "intro": [(0, 0.8), (-1, 0.3), (0, 0.8)],
    "asia": [(0, 0.3), (1, 0.45), (2, 1.3, "gamak"), (1, 0.45), (0, 0.7), (None, 0.2)],
    "africa": [(2, 0.35), (3, 1.2), (4, 0.35), (3, 0.55), (2, 0.75), (None, 0.2)],
    "me": [(3, 0.35), (4, 0.4), (5, 1.4, "gamak"), (4, 0.4), (3, 0.65), (None, 0.2)],
    "climb": [(3, 0.5), (4, 0.5)],  # then Sa above holds until the plane lands
    "finale": [(6, 0.4), (5, 1.0), (4, 0.35), (3, 0.6), (2, 0.35, "gamak"), (1, 0.35)],  # then home to Sa
}


# the uzun hava: free rhythm, starting high and falling, on open vowels; seconds from each section's start
UZUN_HAVA = {
    "intro": [(4, 1.15, "a", "girtlak"), (5, 0.25), (4, 0.6, "e")],
    "asia": [(5, 0.35, "a"), (4, 0.3), (3, 1.1, "girtlak"), (2, 0.35), (1, 0.4), (2, 0.7, "e"), (None, 0.2)],
    "africa": [(3, 0.3, "a"), (4, 0.4), (5, 1.2, "girtlak"), (4, 0.35), (3, 0.35), (4, 0.6, "o"), (None, 0.2)],
    "me": [(6, 0.3, "a"), (7, 1.3, "girtlak"), (6, 0.35), (5, 0.35), (4, 0.4), (5, 0.5, "e"), (None, 0.2)],
    "climb": [(5, 0.45, "a"), (6, 0.45, "a")],  # then the octave holds, open, until the plane lands
    "finale": [(8, 0.35, "a"), (7, 0.9, "a", "girtlak"), (6, 0.3), (5, 0.3), (4, 0.6), (3, 0.3), (2, 0.3), (1, 0.45, "o")],
}


# Middle Eastern mawwal (maqam Hijaz): plain, unhurried phrases on "aa" closing on "ey"
MAWWAL = {
    "intro": [(4, 1.1, "a"), (3, 0.35), (2, 0.55, "e")],
    "asia": [(2, 0.4, "a"), (3, 0.4), (4, 1.2), (3, 0.4), (2, 0.8, "e"), (None, 0.2)],
    "africa": [(4, 0.4, "a"), (5, 0.5), (4, 1.0), (3, 0.4), (2, 0.4), (1, 0.5, "e"), (None, 0.2)],
    "me": [(5, 0.4, "a"), (6, 0.4), (7, 1.2), (6, 0.4), (5, 0.4), (4, 0.4, "e"), (None, 0.2)],
    "climb": [(4, 0.5, "a"), (5, 0.5, "a")],
    "finale": [(6, 0.4, "a"), (5, 0.4), (4, 0.8), (3, 0.4), (2, 0.4), (1, 0.5, "e")],
}
# South Asian alaap in Raag Yaman (Sa Re Ga Ma# Pa Dha Ni) on open "aa"
RAGA = {
    "intro": [(0, 0.9, "a"), (-1, 0.35), (0, 0.75)],
    "asia": [(0, 0.3, "a"), (1, 0.4), (2, 1.2), (1, 0.4), (0, 0.9), (None, 0.2)],
    "africa": [(2, 0.35, "a"), (3, 0.4), (4, 1.2), (3, 0.35), (2, 0.9, "e"), (None, 0.2)],
    "me": [(4, 0.4, "a"), (5, 0.4), (7, 1.3, "gamak"), (6, 0.4), (4, 0.7), (None, 0.2)],
    "climb": [(4, 0.5, "a"), (6, 0.5, "a")],
    "finale": [(6, 0.4, "a"), (4, 0.9), (3, 0.35), (2, 0.6), (1, 0.4)],
}
# African call and response (major pentatonic): per section a call of 4 eighths, then the group's answer
CALLS = {
    "intro": ([(0, 1, "e"), (2, 1, "o"), (3, 2, "e")], None),
    "asia": ([(2, 1, "e"), (3, 1, "o"), (4, 2, "e")], [(3, 1, "a"), (2, 1, "o"), (0, 2, "e")]),
    "africa": ([(4, 1, "e"), (3, 1, "o"), (4, 2, "a")], [(3, 1, "e"), (2, 1, "o"), (1, 2, "a")]),
    "me": ([(5, 1, "e"), (4, 1, "o"), (5, 2, "a")], [(4, 1, "a"), (3, 1, "o"), (2, 2, "e")]),
    "climb": ([(3, 1, "e"), (4, 1, "o")], None),  # then the call holds its top note until the plane lands
    "finale": [(4, 1, "a"), (3, 1, "o"), (2, 1, "e"), (1, 1, "o")],  # everyone together, then home
}


def free_timeline(line, top, top_mark=()):
    """Lay a free-rhythm line over the sections; `top` is the note held until the plane lands."""
    out = []

    def run(start, notes):
        s = start
        for d, ln, *orn in notes:
            out.append((s, s + ln, d, *orn)); s += ln
        return s

    run(0.3, line["intro"])
    for a, key in zip((c0, c1, c2), ("asia", "africa", "me")):
        run(a, line[key])
    out.append((run(c3, line["climb"]), land, top, *top_mark))
    out.append((run(land, line["finale"]), dur - 0.2, 0, *top_mark))
    return out


def alaap_timeline():
    out = []

    def run(start, notes):
        s = start
        for d, ln, *orn in notes:
            out.append((s, s + ln, d, *orn)); s += ln
        return s

    run(0.3, ALAAP["intro"])
    for a, key in zip((c0, c1, c2), ("asia", "africa", "me")):
        run(a, ALAAP[key])
    out.append((run(c3, ALAAP["climb"]), land, 5))
    out.append((run(land, ALAAP["finale"]), dur - 0.2, 0))
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


# open vowels for singing (adult male): formant frequencies and bandwidths in Hz
VOWELS = {
    "a": ((730, 1090, 2440, 3300), (90, 110, 160, 250)),
    "e": ((530, 1840, 2480, 3300), (70, 100, 160, 250)),
    "o": ((570, 840, 2410, 3300), (80, 90, 160, 250)),
    "u": ((320, 870, 2240, 3300), (70, 90, 150, 250)),
}
VOWEL_PEAK = max(np.prod([resonance(f, fc, bw) for fc, bw in zip(*VOWELS["a"])], 0) for f in np.arange(100, 4000, 5.0))


def sing(notes, a, b, shift=0.0, size=1.0, vib=1.0, late=0.0, breath=0.02, glide=40, pan=0.0, gain=1.0, verb=0.5,
         vowel=None, vib_rate=5.2):
    """Render one voice over a..b seconds following notes [(start, end, degree, *marks)].
    With vowel=None the voice hums; otherwise it sings open vowels ("a", "e", "o", "u"), and a note can
    name its own vowel among its marks. Other marks: "gamak" (a slow wide shake) and "girtlak"
    (Turkish throat ornament: quick catches and flips to the note above, partway through the note)."""
    if UNDER_AIRPORT and vowel is None:
        size *= 1.35
    pitch = np.full(nc, np.nan)
    gate = np.zeros(nc)
    onset = np.zeros(nc)  # seconds since the current note began
    length = np.zeros(nc)
    changes = np.zeros(nc)
    gamak = np.zeros(nc)
    flips = np.zeros(nc)
    catch = np.ones(nc)
    vowel_at = np.full(nc, vowel or "a", dtype="<U1")
    prev = None
    for s, e, d, *orn in notes:
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
        if "gamak" in orn:  # a slow, wide shake that grows through the note
            x = tc[j0:j1] - s
            gamak[j0:j1] = 0.4 * np.sin(2 * np.pi * 3.0 * x) * np.clip((x - 0.15) / 0.4, 0, 1)
        if "girtlak" in orn:  # four quick flips up and back, each with a little catch in the throat
            up = semis(d + 1) - semis(d)
            for k in range(4):
                f0_ = j0 + int((0.28 + k * 0.11) * CR)
                if f0_ + int(0.11 * CR) < j1:
                    flips[f0_ : f0_ + int(0.055 * CR)] = up
                    catch[f0_ : f0_ + int(0.02 * CR)] = 0.6
        for v in orn:
            if v in VOWELS:
                vowel_at[j0:j1] = v
        prev = d
    # hold the last pitch through breaths, so slides start where the voice left off
    idx = np.where(~np.isnan(pitch), np.arange(nc), 0)
    np.maximum.accumulate(idx, out=idx)
    pitch = pitch[idx]
    pitch[np.isnan(pitch)] = TONIC + shift
    pitch = smooth(pitch, glide / 2) + smooth(flips, 12)
    # vibrato grows in on held notes; a slow drift keeps the intonation human
    depth = 0.28 * vib * np.clip((onset - 0.2) / 0.35, 0, 1) * (length > 0.4)
    rate = vib_rate + 0.3 * wobble(400)
    pitch += depth * np.sin(2 * np.pi * np.cumsum(rate) / CR + rng.random() * 6) + 0.04 * wobble(80) + gamak
    # loudness: soft onsets, a slight dip at each new note, a gentle swell through the note, shimmer
    dip = smooth(changes, 25)
    loud = smooth(gate, 35) * (1 - 0.12 * dip / (dip.max() + 1e-9))
    loud *= 0.9 + 0.1 * np.sin(np.pi * np.clip(onset / np.maximum(length, 0.1), 0, 1))
    loud *= (1 + 0.04 * wobble(50)) * smooth(catch, 8)
    # additive synthesis at audio rate, over the active span only
    s0, s1 = int(a * SR), min(n, int(b * SR))
    ta = t[s0:s1]
    f0 = 440 * 2 ** ((np.interp(ta, tc, pitch) - 69) / 12)
    amp = np.clip(np.interp(ta, tc, loud), 0, None)
    phase = 2 * np.pi * np.cumsum(f0) / SR
    out = np.zeros(len(ta))
    if vowel:
        # formants glide between vowels; the voice gets brighter as it gets louder
        tracks = [smooth(np.array([VOWELS[v][part][i] for v in vowel_at], float), 60) for part in (0, 1) for i in range(4)]
        fm = [np.interp(ta, tc, tr) * size for tr in tracks[:4]]
        bw = [np.interp(ta, tc, tr) for tr in tracks[4:]]
        tilt = 1.3 - 0.4 * np.clip(amp, 0, 1)
    for k in range(1, 80):
        fk = k * f0
        if fk.min() > 5500:
            break
        if vowel:
            env = np.prod([resonance(fk, fc, b_) for fc, b_ in zip(fm, bw)], 0) / VOWEL_PEAK
            out += env * k ** -tilt * np.sin(k * phase + k * 0.7) * (fk < 6000)
        else:
            out += hum_spectrum(fk, size) * k**-1.1 * np.sin(k * phase + k * 0.7) * (fk < 6000)
    # breath: through the nose when humming, through the open mouth when singing
    spec = np.fft.rfft(rng.normal(0, 1, len(ta)))
    centre, spread = (1400, 1500) if vowel else (600, 900)
    br = np.fft.irfft(spec * np.exp(-((np.fft.rfftfreq(len(ta), 1 / SR) - centre) / spread) ** 2), len(ta))
    out = out / 3 + breath * br / (np.abs(br).max() + 1e-9)
    put(out * amp, a, pan, gain, verb)


def put(sig, start, pan=0.0, gain=1.0, verb=0.3, fx=False):
    """Place a mono sound at `start` seconds, panned -1..1 (or a stereo pair of curves), on the voice or effects bus."""
    i = int(round(start * SR))
    sig = sig[: max(0, n - i)] * gain
    pan = np.asarray(pan)[: len(sig)] if np.ndim(pan) else pan
    lr = np.stack([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)], -1) * np.ones((len(sig), 2))
    d, r = (fx_dry, fx_send) if fx else (dry, send)
    d[i : i + len(sig)] += sig[:, None] * lr
    r[i : i + len(sig)] += sig[:, None] * lr * verb


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
def alaap():
    """One free voice over a hummed Sa-Pa drone; a lower voice answers it from the Middle East on."""
    lead = alaap_timeline()
    sing(lead, 0, dur, vib=0.3, glide=170, breath=0.03, gain=1.0, verb=0.6)
    sing(lead, 0, dur, shift=0.05, size=0.96, vib=0.2, glide=170, late=0.02, breath=0.03, pan=0.15, gain=0.22, verb=0.7)
    for at in (0.3, c0, c1, c2, c3):
        inhale(at)
    for sh, size, pan, g in ((-12, 1.1, -0.35, 0.32), (-11.93, 1.05, 0.35, 0.28)):  # Sa below
        sing([(0.0, dur - 0.1, 0)], 0, dur, shift=sh, size=size, vib=0.1, breath=0.04, pan=pan, gain=g, verb=0.6)
    sing([(c0, dur - 0.1, -2)], c0, dur, size=1.08, vib=0.1, breath=0.04, gain=0.2, verb=0.6)  # Pa below
    answer = [(s + 0.35, e + 0.35, d - 5 if d is not None else None, *o) for s, e, d, *o in lead if c2 - 0.01 <= s < land]
    sing(answer, c2, land + 0.6, vib=0.2, glide=170, size=1.08, breath=0.04, pan=-0.4, gain=0.25, verb=0.8)
    for k, deg in enumerate((-5, 0, 3)):  # at the landing the drone opens to Sa, Sa and Pa
        sing([(land, dur - 0.2, deg)], land - 0.02, dur, shift=0.05 * (-1) ** k, size=1.0 + 0.04 * k,
             vib=0.3, late=0.02 * k, breath=0.05, pan=-0.5 + 0.5 * k, gain=0.24, verb=0.85)


def uzun_hava():
    """One open, free voice in the Anatolian uzun hava style, over a soft low "oo" from a few voices."""
    lead = free_timeline(UZUN_HAVA, 7, ("a",))
    lead[-1] = lead[-1][:3] + ("o",)  # the last long tonic closes on "o"
    sing(lead, 0, dur, vowel="a", vib=1.8, vib_rate=6.2, glide=35, breath=0.035, gain=1.0, verb=0.6)
    for at in (0.3, c0, c1, c2, c3):
        inhale(at, 0.05)
    for sh, size, pan, g in ((-12, 1.08, -0.35, 0.22), (-11.93, 1.03, 0.35, 0.2)):  # tonic below, on "oo"
        sing([(0.0, dur - 0.1, 0)], 0, dur, shift=sh, size=size, vib=0.15, breath=0.03, pan=pan, gain=g, verb=0.7, vowel="u")
    sing([(c0, dur - 0.1, -3)], c0, dur, size=1.05, vib=0.15, breath=0.03, gain=0.14, verb=0.7, vowel="u")  # the fifth below
    for k, deg in enumerate((-7, 0, 4)):  # at the landing the low voices open to the tonic chord, still on "oo"
        sing([(land, dur - 0.2, deg)], land - 0.02, dur, shift=0.05 * (-1) ** k, size=1.0 + 0.04 * k,
             vib=0.4, late=0.02 * k, breath=0.04, pan=-0.5 + 0.5 * k, gain=0.18, verb=0.85, vowel="u")


def open_solo(line, top, drone, glide, vib, vib_rate, end_vowel):
    """One open voice, kept simple: no doubles or answers, over a very soft low drone on "oo"."""
    lead = free_timeline(line, top, ("a",))
    lead[-1] = lead[-1][:3] + (end_vowel,)
    sing(lead, 0, dur, vowel="a", vib=vib, vib_rate=vib_rate, glide=glide, breath=0.03, gain=1.0, verb=0.6)
    for at in (0.3, c0, c1, c2, c3):
        inhale(at, 0.04)
    for k, (deg, sh) in enumerate(drone):
        sing([(0.0 if k == 0 else c0, dur - 0.1, deg)], 0 if k == 0 else c0, dur, shift=sh + 0.07 * k, size=1.08,
             vib=0.1, breath=0.03, pan=(-0.35, 0.35, 0)[k % 3], gain=0.2 if k == 0 else 0.13, verb=0.7, vowel="u")


def call_and_response(hum=False):
    """A lead calls, a small group answers in harmony (a third/fourth below and an octave below)."""
    def lay(start, notes, unit=U, gap=0.05):
        out, s_ = [], start
        for d, ln, *v in notes:
            out.append((s_, s_ + ln * unit - gap, d, *v)); s_ += ln * unit
        return out, s_

    calls, answers = [], []
    c, end = lay(0.4, CALLS["intro"][0]); calls += c
    for a, key in zip((c0, c1, c2), ("asia", "africa", "me")):
        c, mid = lay(a, CALLS[key][0]); calls += c
        r, _ = lay(mid, CALLS[key][1]); answers += r
    c, mid = lay(c3, CALLS["climb"][0]); calls += c
    calls.append((mid, land - 0.03, 5, "e"))
    together, s_ = lay(land, CALLS["finale"])
    together.append((s_, dur - 0.2, 0, "a"))
    sing(calls + together, 0, dur, vowel=None if hum else "e", vib=0.6, vib_rate=5.6, glide=30, breath=0.03, gain=1.0, verb=0.5)
    for at in (0.4, c0, c1, c2, c3):
        inhale(at, 0.04)
    group = answers + together
    for k, (off, size, pan, g) in enumerate(((0, 1.03, -0.5, 0.45), (-2, 1.08, 0.5, 0.4), (-5, 1.12, 0.0, 0.3))):
        notes = [(s0 + 0.01 * k, e0 + 0.01 * k, d + off, *v) for s0, e0, d, *v in group]
        sing(notes, c0, dur, vowel=None if hum else "o", size=size, vib=0.4, vib_rate=5.3, glide=30, breath=0.04, pan=pan, gain=g, verb=0.6)


if VARIANT == "alaap":
    alaap()
elif VARIANT == "mawwal":
    open_solo(MAWWAL, 7, [(0, -12), (4, -12)], glide=60, vib=1.0, vib_rate=5.5, end_vowel="a")
elif VARIANT == "raga":
    open_solo(RAGA, 7, [(0, -12), (4, -12)], glide=150, vib=0.35, vib_rate=5.0, end_vowel="a")
elif VARIANT == "sahel":
    call_and_response(hum=True)
elif VARIANT == "callresponse":
    call_and_response()
elif VARIANT == "uzunhava":
    uzun_hava()
full = VARIANT == "hijaz"

if VARIANT in ("hijaz", "bayati"):
    lead = timeline()
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

# ---------- sound effects ----------
def band_noise(length, lo, hi, slope=1.0):
    """Noise band-limited to lo..hi Hz with a 1/f**slope tilt (no pitch, just texture)."""
    length = max(int(length), 2)
    f = np.maximum(np.fft.rfftfreq(length, 1 / SR), 1)
    spec = np.fft.rfft(rng.normal(0, 1, length)) * f ** (-slope / 2) / (1 + (lo / f) ** 4) / (1 + (f / hi) ** 4)
    out = np.fft.irfft(spec, length)
    return out / (np.abs(out).max() + 1e-9)


def clack(size=1.0):
    """One flap falling over, made only of noise so nothing in it is pitched: a dry plastic snap,
    a short rattle as the card hits its stop, and (for the big cards) a soft knock from the frame."""
    x = np.arange(int(0.05 * SR)) / SR
    snap = band_noise(len(x), 1500 / size, 9000 / size, 0.3) * np.exp(-x * 1200)
    rattle = band_noise(len(x), 500 / size, 4000 / size, 0.8) * np.exp(-x * 260) * 0.45
    knock = band_noise(len(x), 60, 380, 1.2) * np.exp(-x * 110) * 0.6 * max(0, size - 0.8)
    one = snap + rattle + knock
    out = np.zeros(len(x) + int(0.02 * SR))
    out[: len(one)] += one
    lag = int(rng.uniform(0.007, 0.013) * SR)  # the card settles with a lighter second tap
    out[lag : lag + len(one)] += 0.35 * one
    return out


def swept_noise(length, f_start, f_end, width=0.55):
    """Noise through a band-pass whose centre glides from f_start to f_end (log scale), via STFT."""
    win, hop = 2048, 256
    total = int(length * SR)
    noise = rng.normal(0, 1, total + win)
    out = np.zeros(total + win)
    f = np.maximum(np.fft.rfftfreq(win, 1 / SR), 1)
    w = np.hanning(win)
    for i in range(0, total, hop):
        fc = f_start * (f_end / f_start) ** (i / total)
        band = np.exp(-0.5 * (np.log2(f / fc) / width) ** 2)
        out[i : i + win] += np.fft.irfft(np.fft.rfft(noise[i : i + win] * w) * band, win) * w
    out = out[:total]
    return out / (np.abs(out).max() + 1e-9)


def swipe(length=1.0, peak=0.6):
    """A low swipe: air rushing past, falling from mid to low, with a soft low push of air."""
    x = np.arange(int(length * SR)) / SR
    env = np.where(x < peak, (x / peak) ** 2.2, np.exp(-(x - peak) * 7))
    air = swept_noise(length, 900, 110) * env
    push = band_noise(len(x), 30, 160, 1.5) * np.exp(-np.abs(x - peak) * 8) * (x > peak - 0.2)
    return air + 0.6 * push


def ding(f):
    """A soft notification tone: a pure note with a faint bell partial."""
    x = np.arange(int(1.2 * SR)) / SR
    tone = np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * 2 * f * x) * np.exp(-x * 6) + 0.1 * np.sin(2 * np.pi * 2.76 * f * x) * np.exp(-x * 10)
    return tone * np.exp(-x * 4.5) * np.minimum(1, x / 0.003)


def buzz(length=0.22):
    """A phone vibrating on a table."""
    x = np.arange(int(length * SR)) / SR
    motor = np.tanh(3 * np.sin(2 * np.pi * 165 * x)) * (0.7 + 0.3 * np.sin(2 * np.pi * 30 * x))
    rattle = rng.normal(0, 1, len(x)) * (np.sin(2 * np.pi * 165 * x) > 0.8) * 0.25
    return (motor + rattle) * np.minimum(1, x / 0.02) * np.minimum(1, (length - x) / 0.03)


# the departures board: every cycling cell flips once per frame, a busy mechanical rattle
for fi, count in enumerate(cues["flaps"]):
    if fi / fps >= c3 - 0.1:
        break
    for _ in range(min(count, 7)):
        put(clack(0.9), fi / fps + rng.uniform(0, 1 / fps), rng.uniform(-0.6, 0.6), 0.32 * rng.uniform(0.6, 1), 0.08, fx=True)
# the big FULKI cards: heavier, deeper clacks exactly on each flip; the plane lands with the loudest
for at in sorted(cues.get("logoFlips", [])):
    put(clack(1.5), at, rng.uniform(-0.4, 0.4), 0.9, 0.12, fx=True)
put(clack(1.7), land - 0.09, 0.2, 1.1, 0.2, fx=True)

# ---------- a low natural soundscape for each region, under the nasheed ----------
amb = np.zeros((n, 2))


def scene_env(a, b, fade=0.7):
    return np.clip((t - a + fade / 2) / fade, 0, 1) * np.clip((b + fade / 2 - t) / fade, 0, 1)


def gusts(rate, floor):
    """Slow random swells between floor and 1."""
    x = sum(np.sin(2 * np.pi * rate * (0.6 + rng.random()) * k * t + rng.random() * 6) / k for k in (1, 2, 3))
    return floor + (1 - floor) * (x - x.min()) / np.ptp(x)


def soundscape(make, a, b, gain):
    env = scene_env(a, b)
    for ch in range(2):
        amb[:, ch] += make() * env * gain


def monsoon(a, b, gain=1.0):
    """Monsoon rain on leaves and a river running low beside it (South Asia, Dhaka)."""
    soundscape(lambda: band_noise(n, 250, 2200, 1.2) * 0.6 + band_noise(n, 80, 600, 1.5) * gusts(7, 0.5), a, b, gain)
    for _ in range(int((b - a) * 70)):  # heavier drops landing nearby, softened
        s0 = rng.uniform(a, b)
        d = band_noise(int(0.03 * SR), 300, 1800, 1.0) * np.exp(-np.arange(int(0.03 * SR)) / SR * 140)
        i = int(s0 * SR)
        seg = d[: n - i] * rng.uniform(0.2, 0.6) * scene_env(a, b)[i] * gain
        amb[i : i + len(seg), int(rng.random() < 0.5)] += seg


def savanna(a, b, gain=1.6):
    """Warm wind across the savanna, dry grass stirring in it."""
    soundscape(lambda: band_noise(n, 50, 650, 1.6) * gusts(0.5, 0.25) + band_noise(n, 700, 2400, 0.8) * gusts(1.3, 0.1) ** 2 * 0.5, a, b, gain)


def desert(a, b, gain=2.0):
    """Desert wind with a hollow low moan and fine sand drifting."""
    soundscape(lambda: band_noise(n, 40, 500, 1.6) * gusts(0.4, 0.3) + band_noise(n, 280, 520, 0.5) * gusts(0.7, 0.0) ** 3 * 0.6
               + band_noise(n, 1200, 3000, 0.6) * gusts(0.9, 0.1) ** 2 * 0.25, a, b, gain)


def tea_garden(a, b, gain=1.6):
    """A morning breeze through tea bushes and shade trees on the hills, a stream running below (Sylhet)."""
    soundscape(lambda: band_noise(n, 500, 2200, 0.9) * gusts(0.8, 0.2) ** 1.5 * 0.6 + band_noise(n, 50, 400, 1.6) * gusts(0.4, 0.3) * 0.5
               + band_noise(n, 180, 1300, 1.1) * gusts(9, 0.45) * 0.45, a, b, gain)


def sea(a, b, gain=1.4):
    """Waves rolling onto a long beach, one about every two seconds, under a steady sea breeze (Cox's Bazar)."""
    soundscape(lambda: band_noise(n, 40, 450, 1.6) * gusts(0.3, 0.4) * 0.5, a, b, gain)
    for k, at in enumerate(np.arange(a - 0.8, b, 2.1)):
        ln = int(3.0 * SR)
        x = np.arange(ln) / SR
        swell = np.clip(x / 0.9, 0, 1) ** 2 * np.exp(-np.clip(x - 0.9, 0, None) * 1.3)
        wash = np.clip(x - 0.9, 0, None) * np.exp(-np.clip(x - 0.9, 0, None) * 2.2) * 2.4
        wave_ = band_noise(ln, 60, 900, 1.4) * swell + band_noise(ln, 700, 2400, 0.9) * (0.3 * swell + wash) * 0.6
        i = int(max(0, at) * SR)
        seg = wave_[: n - i] * scene_env(a, b)[i : i + len(wave_[: n - i])] * gain * 0.8
        amb[i : i + len(seg), 0] += seg * (0.8 if k % 2 else 1.0)
        amb[i : i + len(seg), 1] += seg * (1.0 if k % 2 else 0.8)


def river(a, b, gain=1.5):
    """A wide river at dusk: water lapping at the bank and boats, a light breeze over it (Saint-Louis)."""
    soundscape(lambda: band_noise(n, 150, 1100, 1.1) * gusts(4, 0.3) ** 1.5 * 0.7 + band_noise(n, 40, 400, 1.6) * gusts(0.35, 0.4) * 0.4, a, b, gain)
    for _ in range(int((b - a) * 6)):  # small slaps of water against hulls
        s0 = rng.uniform(a, b)
        ln = int(0.12 * SR)
        slap = band_noise(ln, 200, 1400, 1.0) * np.exp(-np.arange(ln) / SR * 35)
        i = int(s0 * SR)
        seg = slap[: n - i] * rng.uniform(0.3, 0.7) * scene_env(a, b)[i] * gain
        amb[i : i + len(seg), int(rng.random() < 0.5)] += seg


SOUNDSCAPES = {"monsoon": monsoon, "savanna": savanna, "desert": desert, "tea": tea_garden, "sea": sea, "river": river}
for (a, b), name in zip(((c0, c1), (c1, c2), (c2, c3)), cues.get("sounds") or ["monsoon", "savanna", "desert"]):
    SOUNDSCAPES[name](a, b)

# a low swipe on every scene change, moving left to right with the plane
for c in cuts:
    sw = swipe(1.0, 0.6)
    put(sw, c - 0.6, np.linspace(-0.8, 0.8, len(sw)), 0.75, 0.15, fx=True)

# call to action: the phone buzzes twice and chimes as the WhatsApp number appears
cta = land + 1.35
for k in (0, 1):
    put(buzz(), cta + k * 0.32, -0.1, 0.22, 0.05, fx=True)
put(ding(midi_hz := 440 * 2 ** ((86 - 69) / 12)), cta + 0.08, 0.15, 0.32, 0.35, fx=True)
put(ding(midi_hz * 1.5), cta + 0.22, 0.15, 0.28, 0.35, fx=True)

# ---------- an airport terminal, as the background instead of a voice ----------
def airport():
    # the hall itself: air handling and the low roar of a big room
    for ch in range(2):
        hall = band_noise(n, 30, 220, 1.8) * 0.7 + band_noise(n, 200, 1200, 1.4) * 0.15
        dry[:, ch] += hall * 0.5
        send[:, ch] += hall * 0.1
    # crowd murmur: many overlapping speech-shaped streams, each with its own syllable rhythm and pauses
    for k in range(14):
        syll = np.abs(band_noise(n, 3, 7, 0.0)) ** 1.5
        talk = np.clip(band_noise(n, 0.15, 0.6, 0.0) * 2 + 0.3, 0, 1)
        stream = band_noise(n, 220, 2600, 1.1) * syll * talk
        put(stream, 0, rng.uniform(-0.8, 0.8), 0.18, 0.9)
    # a few distant voices with speech-like intonation, deep in the hall's echo
    for _ in range(26):
        s0 = rng.uniform(0, dur - 1.5)
        base = rng.uniform(-14, 2)  # semitones from D3: low and high speaking voices
        notes, x = [], s0
        for j in range(int(rng.integers(3, 7))):
            ln = rng.uniform(0.09, 0.2)
            notes.append((x, x + ln * 0.85, 0, rng.choice(list("aeou"))))
            x += ln
        drift_ = np.linspace(1.5, -2.0, len(notes)) + rng.normal(0, 1.2, len(notes))  # falling, like a sentence
        for (a_, b_, d_, v_), sh in zip(notes, drift_):
            sing([(a_, b_, d_, v_)], a_, b_ + 0.15, shift=base + sh, vowel=v_, size=rng.uniform(0.95, 1.2), vib=0,
                 glide=25, breath=0.08, pan=rng.uniform(-0.9, 0.9), gain=rng.uniform(0.04, 0.09), verb=1.0)
    # footsteps crossing the hall
    for start in (0.6, 7.2, 13.4):
        pan0 = rng.choice([-1, 1]) * 0.8
        for j in range(9):
            step = band_noise(int(0.04 * SR), 300, 5000, 0.8) * np.exp(-np.arange(int(0.04 * SR)) / SR * 140)
            put(step, start + j * 0.52 + rng.uniform(-0.02, 0.02), pan0 * (1 - j / 4.5), 0.09 * (1 - abs(j - 4) / 6), 0.5)
    # suitcases rolling past: wheel rumble plus a tick at every tile seam
    for start, length, rate in ((1.2, 3.2, 7.5), (8.6, 2.8, 9.0), (15.8, 3.0, 8.0)):
        ln = int(length * SR)
        x = np.arange(ln) / SR
        pass_env = np.sin(np.pi * x / length) ** 2
        roll = band_noise(ln, 80, 900, 1.3) * 0.5
        ticks = np.zeros(ln)
        for tk in np.arange(0, length, 1 / rate):
            i = int(tk * SR)
            tick = band_noise(int(0.006 * SR), 400, 3500, 0.6) * np.exp(-np.arange(int(0.006 * SR)) / SR * 700)
            ticks[i : i + len(tick)] += tick[: ln - i]
        put((roll + ticks) * pass_env, start, np.linspace(-0.8, 0.8, ln) * rng.choice([-1, 1]), 0.35, 0.4)
    # the announcement chime as the video opens: three soft falling tones, ringing in the hall
    for k, semi in enumerate((7, 4, 0)):
        put(ding(440 * 2 ** ((74 + semi - 69) / 12)), 0.15 + k * 0.42, 0.0, 0.35, 1.0)
    # a jet taking off outside, building as FULKI flips in and peaking as the plane lands
    ln = int((dur - c3 + 0.5) * SR)
    x = np.arange(ln) / SR
    swell = np.clip(x / (land - c3 + 0.5), 0, 1) ** 2 * np.exp(-np.clip(x - (land - c3 + 0.5), 0, None) * 0.7)
    for ch, pan in ((0, -0.4), (1, 0.4)):
        jet = band_noise(ln, 50, 2200, 1.7) + 0.2 * band_noise(ln, 2500, 6000, 0.5)
        put(jet * swell, c3 - 0.5, pan, 0.35, 0.3)


if HUM:  # keep the quiet melody on its own layer, then lay the airport down as the background
    hum_dry, hum_send = dry.copy(), send.copy()
    dry[:] = 0
    send[:] = 0
if VARIANT == "airport" or BACKGROUND == "airport":
    airport()

# ---------- master ----------
fade = (np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 1.2))[:, None]
# dBFS RMS of the background layer: the open voices sit lower still, the airport between the two
VOICE_LEVEL = -25 if BACKGROUND == "airport" else {"mawwal": -27, "callresponse": -27, "raga": -27}.get(VARIANT, -23)
voices = dry + reverb(send, length=3.5 if BACKGROUND == "airport" else 2.8) * 0.8
if VARIANT != "none":
    voices *= 10 ** (VOICE_LEVEL / 20) / np.sqrt((voices**2).mean())  # the background sits low
if HUM:  # the hummed melody, a few dB under the airport
    hum = hum_dry + reverb(hum_send) * 0.8
    voices += hum * 10 ** ((VOICE_LEVEL - 5) / 20) / np.sqrt((hum**2).mean())
amb_active = scene_env(c0, c3) > 0.5
amb *= 10 ** ((VOICE_LEVEL - 5) / 20) / np.sqrt((amb[amb_active] ** 2).mean())  # the soundscapes sit below the voices
effects = fx_dry + reverb(fx_send, length=1.4) * 0.6
mix = (voices + amb + effects) * fade
mix *= 10 ** (-16 / 20) / np.sqrt((mix**2).mean())  # overall loudness, about -16 dBFS RMS before the limiter
knee = 0.7
mag = np.abs(mix)
mix = np.where(mag < knee, mix, np.sign(mix) * (knee + (0.98 - knee) * np.tanh((mag - knee) / (0.98 - knee))))
mix *= 0.75  # headroom for the AAC encoder (the flap transients overshoot)

with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mix * 32767).astype("<i2").tobytes())
