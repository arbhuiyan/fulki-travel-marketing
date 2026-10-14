"""Synthesize the promo soundtrack from natural sounds only: no instruments, just water, stone,
wood, sand, wind, rain, thunder and waves, arranged in time with the picture.

Usage: python3 make_audio.py cues.json out.wav [variant]
  rhythm   "Earth rhythm": a driving groove of stone thumps, water splashes, sand and wood knocks,
           with a water-drop melody; wind rises into every scene change (default)
  monsoon  "Monsoon": rain building scene by scene, thunder on every cut and on the logo
  water    "Water melody": a stream and tuned water drops playing a gentle melody
  ocean    "Ocean breeze": waves cresting on every scene change under a soft breeze
cues.json is written by render_promo.mjs: frame rate, length, scene cuts, logo landing time,
and how many board cells flap in each frame (those become the split-flap clicks).
"""
import json
import sys
import wave

import numpy as np

SR = 44100
cues = json.load(open(sys.argv[1]))
VARIANT = sys.argv[3] if len(sys.argv) > 3 else "rhythm"
rng = np.random.default_rng(23)
fps, dur, cuts, land = cues["fps"], cues["seconds"], cues["cuts"], cues["land"]
n = int(SR * dur)
t = np.arange(n) / SR
dry = np.zeros((n, 2))
send = np.zeros((n, 2))  # reverb send


# ---------- building blocks ----------
def colored(length, lo, hi, slope=1.0):
    """Noise band-limited to lo..hi Hz with a 1/f**slope tilt."""
    length = max(length, 2)
    spec = np.fft.rfft(rng.normal(0, 1, length))
    f = np.fft.rfftfreq(length, 1 / SR)
    f[0] = 1
    shape = f ** (-slope / 2) / (1 + (lo / f) ** 4) / (1 + (f / hi) ** 4)
    out = np.fft.irfft(spec * shape, length)
    return out / (np.abs(out).max() + 1e-9)


def drift(length, rate, floor=0.0, power=1.0):
    """A slow random curve between floor and 1, moving about `rate` times a second."""
    x = np.arange(length) / SR
    out = sum(np.sin(2 * np.pi * rate * (0.6 + rng.random()) * k * x + rng.random() * 6.28) / k for k in (1, 2, 3))
    out = (out - out.min()) / (np.ptp(out) + 1e-9)
    return floor + (1 - floor) * out**power


def secs(x):
    return np.arange(int(SR * x)) / SR


def add(sig, start, pan=0.0, gain=1.0, verb=0.25):
    """Place a mono sound at `start` seconds, panned -1..1, with some of it sent to the reverb."""
    i = int(round(start * SR))
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: max(0, n - i)] * gain
    if not len(sig):
        return
    lr = np.array([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)])
    dry[i : i + len(sig)] += sig[:, None] * lr
    send[i : i + len(sig)] += sig[:, None] * lr * verb


def bed(sig_fn, a, b, gain, fade=0.5, verb=0.1, width=0.7):
    """A continuous texture from a to b seconds, wide in stereo, crossfading at both ends."""
    env = np.clip((t - a + fade / 2) / fade, 0, 1) * np.clip((b + fade / 2 - t) / fade, 0, 1)
    if not env.any():
        return
    l, r = sig_fn(), sig_fn()
    stereo = np.stack([l * (1 + width) / 2 + r * (1 - width) / 2, r * (1 + width) / 2 + l * (1 - width) / 2], 1)
    dry[:] += stereo * (env * gain)[:, None]
    send[:] += stereo * (env * gain * verb)[:, None]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# natural "voices"
def drop(f, decay=22, glide=1.18):
    """A water drop: a pure tone that glides up as the bubble rises, ringing out."""
    x = secs(min(1.2, 7 / decay))
    freq = f * (1 + (glide - 1) * np.minimum(1, x / 0.045))
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * decay) * np.minimum(1, x / 0.0015)


def bubble(f=None):
    f = f or rng.uniform(500, 1600)
    return drop(f, decay=rng.uniform(60, 110), glide=rng.uniform(1.6, 2.6))


def thump(depth=1.0):
    """A heavy stone landing on packed earth."""
    x = secs(0.45)
    freq = 46 + 95 * depth * np.exp(-x * 28)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 8)
    dust = colored(len(x), 200, 3000, 1.0) * np.exp(-x * 60) * 0.25
    return body + dust


def splash():
    """A handful of water thrown on stone: a soft burst with bubbles in it."""
    x = secs(0.35)
    s = colored(len(x), 600, 9000, 0.9) * np.exp(-x * 16) * np.minimum(1, x / 0.004)
    for _ in range(5):
        b = bubble(rng.uniform(700, 1800))
        i = int(rng.uniform(0.005, 0.08) * SR)
        s[i : i + len(b)] += b[: len(s) - i] * 0.35
    return s


def sand(length=0.09, bright=1.0):
    """Sand or dry seeds shaken once."""
    x = secs(length)
    env = np.minimum(1, x / 0.012) * np.exp(-np.maximum(0, x - 0.012) * 55)
    return colored(len(x), 3500 * bright, 13000, 0.4) * env


def knock(f=520):
    """A dry branch knocked against a hollow log."""
    x = secs(0.18)
    return sum(a * np.sin(2 * np.pi * f * r * x) * np.exp(-x * d) for r, a, d in ((1, 1, 38), (2.71, 0.45, 70), (5.2, 0.15, 120))) * np.minimum(1, x / 0.001)


def thunder(length=3.2, crack=True):
    x = secs(length)
    rumble = colored(len(x), 25, 420, 1.6) * (0.55 + 0.45 * drift(len(x), 5)) * np.minimum(1, x / 0.12) * np.exp(-x * 1.25)
    if crack:
        c = colored(int(0.06 * SR), 400, 9000, 0.5) * np.exp(-secs(0.06) * 50)
        rumble[: len(c)] += c * 0.8
    return rumble


def wind_riser(length):
    """Wind gathering: a band of air sweeping upward and swelling, cut off at the end."""
    x = secs(length)
    out = np.zeros(len(x))
    for k, (lo, hi) in enumerate(((150, 600), (300, 1200), (600, 2400), (1200, 5000), (2500, 9000))):
        centre = (k + 0.5) / 5
        out += colored(len(x), lo, hi, 1.0) * np.exp(-((x / length - centre) / 0.22) ** 2)
    return out * (x / length) ** 1.5


def ocean_wave(length, peak):
    """An ocean wave: the swell builds, breaks at `peak` seconds, then foam washes back."""
    x = secs(length)
    swell = np.clip(x / peak, 0, 1) ** 2.2 * np.exp(-np.clip(x - peak, 0, None) * 1.0)
    wash = np.clip(x - peak, 0, None) * np.exp(-np.clip(x - peak, 0, None) * 2.0) * 2.6
    body = colored(len(x), 60, 1100, 1.4) * swell
    foam = colored(len(x), 1200, 7000, 0.9) * (0.35 * swell + wash)
    return body + 0.55 * foam


def wind():
    return colored(n, 60, 700, 1.6) * drift(n, 0.45, 0.2, 1.5) + 0.25 * colored(n, 600, 1600, 1.0) * drift(n, 0.6, 0, 2.5)


def rain(heavy=0.5):
    return colored(n, 700, 5500 + 3000 * heavy, 1.1)


def stream():
    return colored(n, 200, 1800, 1.0) * drift(n, 9, 0.4)


def drops_scatter(a, b, rate, lo, hi, gain, verb=0.3):
    for _ in range(int((b - a) * rate)):
        add(drop(rng.uniform(lo, hi), decay=rng.uniform(35, 70), glide=rng.uniform(1.2, 1.9)),
            rng.uniform(a, b), pan=rng.uniform(-0.8, 0.8), gain=gain * rng.uniform(0.4, 1), verb=verb)


def reverb(x, length=2.2, damp=4500):
    """Convolution with a decaying, darkened noise tail: a sense of open space around everything."""
    ir_len = int(length * SR)
    xs = secs(length)
    out = np.zeros_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + ir_len)))
    for ch in range(2):
        ir = colored(ir_len, 150, damp, 0.6) * np.exp(-xs * 6.9 / length)
        ir[: int(0.012 * SR)] = 0  # pre-delay
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir / np.sqrt((ir**2).sum()), size), size)[: len(x)]
    return out


# ---------- arrangement ----------
c0, c1, c2, c3 = cuts
beat = (c1 - c0) / 8  # each region scene is exactly 8 beats
step = beat / 4  # 16th notes
D_PENT = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86]  # D major pentatonic
D_MIN = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84, 86]  # D minor pentatonic


def earth_rhythm():
    bed(wind, 0, dur, 0.18)
    # into each scene: wind gathers, then lands on a stone thump with a splash
    add(wind_riser(c0), 0, gain=0.5, verb=0.3)
    for c in (c1, c2, c3):
        add(wind_riser(1.3), c - 1.3, gain=0.55, verb=0.3)
    for c in cuts:
        add(thump(1.2), c, gain=1.0, verb=0.5)
        add(splash(), c, gain=0.5, verb=0.6)
    # groove: layers join scene by scene
    for k, (a, b) in enumerate(((c0, c1), (c1, c2), (c2, c3))):
        for i in range(32):
            s = a + i * step
            if s > b - beat:  # last beat of each scene is a break for the riser
                break
            pos = i % 16
            if pos in (0, 6, 10) or (k == 2 and pos == 13):
                add(thump(0.9), s, gain=0.85, verb=0.15)
            if k >= 1 and pos in (4, 12):
                add(splash(), s, gain=0.55, verb=0.35)
            if pos % 2 == 0:
                add(sand(bright=1.0 if pos % 4 else 0.8), s, pan=0.35, gain=0.32 if pos % 4 else 0.18)
            elif k == 2:
                add(sand(0.05), s, pan=-0.35, gain=0.14)
            if k >= 1 and pos in (3, 11, 14):
                add(knock(470 if pos != 14 else 630), s, pan=-0.4, gain=0.3, verb=0.3)
        # the water-drop melody: one motif, shifted up for each region
        motif = [0, 2, 4, 3, 5, 4, 2, 3, 4, 6, 5, 4, 7, 6, 5, 4]
        for i, m in enumerate(motif[: 14]):
            s = a + i * beat / 2
            if s < b - beat:
                add(drop(midi(D_MIN[min(len(D_MIN) - 1, m + k)]), decay=16), s, pan=0.25 * (-1) ** i, gain=0.32, verb=0.6)
    # outro: sand rolls faster as the flaps turn, a big landing, then the drops resolve
    roll = c3 + beat
    while roll < land - 0.02:
        frac = (roll - c3) / (land - c3)
        add(sand(0.05), roll, pan=rng.uniform(-0.4, 0.4), gain=0.12 + 0.25 * frac)
        roll += step * (2 if frac < 0.5 else 1)
    add(wind_riser(land - c3 - 0.2), c3 + 0.2, gain=0.6, verb=0.3)
    add(thump(1.4), land, gain=1.15, verb=0.6)
    add(thunder(2.6, crack=False), land, gain=0.55, verb=0.4)
    add(ocean_wave(dur - land + 0.5, 0.5), land - 0.3, gain=0.45, verb=0.2)
    for i, m in enumerate((5, 7, 9, 10)):
        add(drop(midi(D_PENT[m]), decay=6), land + 0.15 + i * 0.16, pan=0.3 - 0.2 * i, gain=0.3, verb=0.8)


def monsoon():
    bed(wind, 0, dur, 0.3)
    # rain gathers scene by scene, heaviest over the Middle East cut, easing at the end
    heaviness = np.interp(t, [0, c0, c1, c2, c3, land, dur], [0.0, 0.25, 0.45, 0.65, 0.85, 0.7, 0.15])
    l, r = rain(0.8), rain(0.8)
    dry[:, 0] += l * heaviness * 0.45
    dry[:, 1] += r * heaviness * 0.45
    send[:, 0] += l * heaviness * 0.06
    send[:, 1] += r * heaviness * 0.06
    for a, b, rate in ((0.3, c0, 30), (c0, c1, 80), (c1, c2, 130), (c2, c3, 180), (c3, land, 200), (land, dur, 25)):
        drops_scatter(a, b, rate, 1800, 4200, 0.18, verb=0.15)
    # heavy drops off the roof's edge, on the beat
    for s in np.arange(c0, land, beat):
        add(drop(rng.choice([380, 430, 520]), decay=30, glide=1.3), s, pan=-0.5, gain=0.35, verb=0.4)
    for c in cuts:
        add(thunder(3.0), c - 0.05, gain=0.9, verb=0.35)
        add(wind_riser(0.9), c - 0.9, gain=0.35, verb=0.2)
    add(thunder(4.0), land - 0.05, gain=1.2, verb=0.5)
    add(thump(1.3), land, gain=0.7, verb=0.6)
    for i, s in enumerate(np.arange(land + 0.6, dur - 0.2, 0.33)):  # the last drips after the storm
        add(drop(midi(D_PENT[(i * 3) % 6 + 3]), decay=10), s, pan=(-1) ** i * 0.4, gain=0.18, verb=0.8)


def water_melody():
    bed(stream, 0, dur, 0.2, verb=0.15)
    bed(lambda: colored(n, 60, 500, 1.6) * drift(n, 0.3, 0.3), 0, dur, 0.15)
    tune = [[0, 2, 4, 5, 4, 2, 3, 1], [1, 3, 5, 6, 5, 3, 4, 2], [2, 4, 6, 7, 6, 4, 5, 3]]
    for s in np.arange(0.1, c0, step * 2):  # drops gathering at the start
        add(drop(midi(D_PENT[int(rng.integers(3, 8))]), decay=30), s, pan=rng.uniform(-.6, .6), gain=0.12, verb=0.6)
    for k, (a, b) in enumerate(((c0, c1), (c1, c2), (c2, c3))):
        for i in range(16):  # melody in 8ths, an octave-up echo on the off-beats
            s = a + i * beat / 2
            m = tune[k][i % 8] + (2 if i >= 8 else 0)
            add(drop(midi(D_PENT[m]), decay=9), s, pan=0.3 * (-1) ** i, gain=0.36 if i % 2 == 0 else 0.22, verb=0.65)
            if i % 4 == 0:
                add(drop(midi(D_PENT[m] - 12), decay=7, glide=1.08), s, gain=0.3, verb=0.5)
        for _ in range(10):
            add(bubble(), rng.uniform(a, b), pan=rng.uniform(-0.7, 0.7), gain=0.1, verb=0.3)
        add(wind_riser(0.8), b - 0.8, gain=0.25, verb=0.4)
        for j in range(8):  # a rush of rising bubbles carries each cut
            add(bubble(500 + j * 160), b - 0.25 + j * 0.03, pan=-0.8 + j * 0.2, gain=0.22, verb=0.4)
    for i, m in enumerate([0, 2, 3, 5, 7]):  # flaps turning: drops climbing to the landing
        add(drop(midi(D_PENT[m + 2]), decay=12), c3 + 0.3 + i * (land - c3 - 0.3) / 5, gain=0.25, verb=0.6)
    for i, m in enumerate([5, 7, 9, 10]):
        add(drop(midi(D_PENT[m]), decay=4), land + i * 0.11, pan=-0.3 + 0.2 * i, gain=0.32, verb=0.9)
        add(drop(midi(D_PENT[m] - 24), decay=4, glide=1.05), land, gain=0.12, verb=0.6)
    add(ocean_wave(dur - land + 0.6, 1.0), land - 0.4, gain=0.35, verb=0.2)


def ocean_breeze():
    bed(wind, 0, dur, 0.22, verb=0.15)
    # one wave per scene, breaking exactly on each cut; the biggest breaks on the logo
    for c, g in ((c0, 0.55), (c1, 0.6), (c2, 0.65), (c3, 0.6)):
        add(ocean_wave(3.6, 1.6), c - 1.6, pan=rng.uniform(-0.3, 0.3), gain=g, verb=0.2)
    add(ocean_wave(dur - land + 1.8, 1.6), land - 1.6, gain=0.85, verb=0.3)
    # pebbles rolled by the backwash, softly on the beat
    for s in np.arange(c0, c3, beat / 2):
        add(sand(0.07, bright=0.6), s + 0.03, pan=rng.uniform(-0.5, 0.5), gain=0.16, verb=0.3)
    for s in np.arange(c0, c3, beat * 2):
        add(thump(0.5), s, gain=0.35, verb=0.4)
    drops_scatter(c0, dur, 6, 1500, 3200, 0.12, verb=0.7)
    for i, m in enumerate([5, 7, 9]):
        add(drop(midi(D_PENT[m]), decay=5), land + 0.1 + i * 0.14, gain=0.22, verb=0.9)


{"rhythm": earth_rhythm, "monsoon": monsoon, "water": water_melody, "ocean": ocean_breeze}[VARIANT]()

# split-flap clicks from the departures board and the logo
for fi, count in enumerate(cues["flaps"]):
    for _ in range(min(count, 10)):
        x = secs(0.012)
        click = colored(len(x), 1500, 9000, 0.3) * np.exp(-x * 600) + 0.3 * np.sin(2 * np.pi * 2400 * x) * np.exp(-x * 400)
        add(click, fi / fps + rng.uniform(0, 1 / fps), pan=rng.uniform(-0.5, 0.5), gain=0.06, verb=0.05)

# ---------- master ----------
mix = dry + reverb(send) * 0.9
mix *= (np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.6))[:, None]
mix *= 10 ** (-15 / 20) / np.sqrt((mix**2).mean())  # loudness to about -15 dBFS RMS
knee = 0.75
mag = np.abs(mix)
mix = np.where(mag < knee, mix, np.sign(mix) * (knee + (0.98 - knee) * np.tanh((mag - knee) / (0.98 - knee))))
mix *= 0.93

with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mix * 32767).astype("<i2").tobytes())
