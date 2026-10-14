"""Synthesize the promo soundtrack from natural sounds only (no instruments):
night breeze for the intro, monsoon rain and a river for Asia, dry wind through grass for Africa,
desert wind and drifting sand for the Middle East, and ocean waves for the finale. A gust of wind
carries each plane flyby, and the departures board adds its split-flap clicks.

Usage: python3 make_audio.py cues.json out.wav   (cues.json is written by render_promo.mjs)
"""
import json
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(11)
cues = json.load(open(sys.argv[1]))
fps, dur, cuts = cues["fps"], cues["seconds"], cues["cuts"]
n = int(SR * dur)
t = np.arange(n) / SR
L = np.zeros(n)
R = np.zeros(n)


def colored(length, lo, hi, slope=1.0):
    """Noise band-limited to lo..hi Hz with a 1/f**slope tilt, shaped in the frequency domain."""
    spec = np.fft.rfft(rng.normal(0, 1, length))
    f = np.fft.rfftfreq(length, 1 / SR)
    f[0] = 1
    shape = f ** (-slope / 2) * (1 / (1 + (lo / f) ** 4)) * (1 / (1 + (f / hi) ** 4))
    out = np.fft.irfft(spec * shape, length)
    return out / (np.abs(out).max() + 1e-9)


def drift(length, rate, depth=1.0, floor=0.0):
    """A slow random curve between floor and 1, varying about `rate` times per second."""
    out = np.zeros(length)
    x = np.arange(length) / SR
    for k in range(4):
        out += np.sin(2 * np.pi * rate * (0.5 + rng.random()) * (k + 1) * 0.6 * x + rng.random() * 6.28) / (k + 1)
    out = (out - out.min()) / (np.ptp(out) + 1e-9)
    return floor + (1 - floor) * out**depth


def window(a, b, fade=0.4):
    """Envelope for a section running from a to b seconds, crossfading in and out."""
    return np.clip((t - a + fade / 2) / fade, 0, 1) * np.clip((b + fade / 2 - t) / fade, 0, 1)


def stereo(fn, gain, width=0.6):
    """Run a mono generator twice and blend, for a wide but centred image."""
    a, b = fn(), fn()
    return gain * (a * (1 + width) / 2 + b * (1 - width) / 2), gain * (b * (1 + width) / 2 + a * (1 - width) / 2)


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    L[i : i + len(sig)] += sig * np.cos((pan + 1) * np.pi / 4)
    R[i : i + len(sig)] += sig * np.sin((pan + 1) * np.pi / 4)


c0, c1, c2, c3 = cuts

# --- wind: a low body and an airy whistle band, each swelling on its own
def wind(rate=0.5, airy=0.4):
    body = colored(n, 60, 500, 1.4) * drift(n, rate, 1.5, 0.15)
    air = colored(n, 500, 2200, 1.0) * drift(n, rate * 1.3, 2.0, 0.05)
    return body + airy * air

l, r = stereo(lambda: wind(0.4, 0.25), 0.35)
env = window(-1, c0 + 0.1)
L += l * env; R += r * env

# --- Asia: monsoon rain (hiss + scattered drops) and a running river with bubbles
env = window(c0, c1)
l, r = stereo(lambda: colored(n, 900, 9000, 0.8), 0.16)
L += l * env; R += r * env
for _ in range(int((c1 - c0 + 0.6) * 260)):
    s = c0 - 0.2 + rng.random() * (c1 - c0 + 0.4)
    ln = int(SR * (0.002 + rng.random() * 0.006))
    drop = colored(ln + 64, 1500, 10000, 0.3)[:ln] * np.exp(-np.arange(ln) / ln * 6)
    add(drop * window(c0, c1)[min(n - 1, int(s * SR))], s, pan=rng.uniform(-0.9, 0.9), gain=rng.uniform(0.05, 0.22))
river = colored(n, 250, 2600, 0.9) * drift(n, 14, 1.0, 0.35)
add(river * env, 0, pan=-0.3, gain=0.2)
for _ in range(int((c1 - c0) * 45)):
    s = c0 + rng.random() * (c1 - c0)
    ln = int(SR * 0.035)
    x = np.arange(ln) / SR
    f0 = rng.uniform(500, 1400)
    bubble = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * x / x[-1])) / SR) * np.exp(-x * 90)
    add(bubble * window(c0, c1)[min(n - 1, int(s * SR))], s, pan=rng.uniform(-0.7, 0.1), gain=rng.uniform(0.03, 0.08))

# --- Africa: warm dry wind and grass rustling in it
env = window(c1, c2)
l, r = stereo(lambda: wind(0.7, 0.5), 0.4)
L += l * env; R += r * env
def rustle():
    crackle = np.abs(colored(n, 8, 60, 0.5)) ** 3
    return colored(n, 2500, 11000, 0.6) * (crackle / crackle.max()) * drift(n, 1.2, 1.0, 0.2)
l, r = stereo(rustle, 0.35, width=0.9)
L += l * env; R += r * env

# --- Middle East: desert wind with a hollow whistle and drifting sand
env = window(c2, c3)
l, r = stereo(lambda: wind(0.6, 0.9), 0.42)
L += l * env; R += r * env
l, r = stereo(lambda: colored(n, 4000, 12000, 0.4) * drift(n, 0.9, 2.5, 0.05), 0.18, width=0.9)
L += l * env; R += r * env

# --- finale: an ocean wave rolls in as the logo lands, then washes back
for start, peak, gain in ((c3 - 0.2, 1.5, 0.75), (c3 + 1.9, 1.4, 0.45)):
    ln = int(SR * (dur - start + 0.5))
    x = np.arange(ln) / SR
    swell = np.clip(x / peak, 0, 1) ** 2 * np.exp(-np.clip(x - peak, 0, None) * 1.1)
    wash = np.clip(x - peak, 0, None) * np.exp(-np.clip(x - peak, 0, None) * 2.2) * 2.4
    for pan in (-0.5, 0.5):
        body = colored(ln, 70, 1800, 1.2) * swell
        foam = colored(ln, 1800, 10000, 0.7) * (swell * 0.5 + wash)
        add(body * 0.9 + foam * 0.6, start, pan=pan, gain=gain * 0.6)

# --- a gust of wind carries each plane flyby across, left to right
for c in cuts:
    ln = int(1.1 * SR)
    x = np.arange(ln) / ln
    g = colored(ln, 150, 3000, 1.0) * np.sin(np.pi * x) ** 2
    pan = -0.9 + 1.8 * x
    i = int((c - 0.6) * SR)
    end = min(n, i + ln)
    L[i:end] += (0.45 * g * np.cos((pan + 1) * np.pi / 4))[: end - i]
    R[i:end] += (0.45 * g * np.sin((pan + 1) * np.pi / 4))[: end - i]

# --- split-flap clicks from the board: one per flapping cell per frame
for fi, count in enumerate(cues["flaps"]):
    for _ in range(min(count, 12)):
        ln = int(0.004 * SR)
        click = np.diff(rng.normal(0, 1, ln + 1)) * np.exp(-np.arange(ln) / ln * 5)
        add(click, fi / fps + rng.uniform(0, 1 / fps), pan=rng.uniform(-0.6, 0.6), gain=0.05)

mixdown = np.stack([L, R], axis=1)
mixdown *= (np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.4))[:, None]
mixdown = np.tanh(mixdown * 1.3)
mixdown *= 0.89 / np.abs(mixdown).max()

with wave.open(sys.argv[2], "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes((mixdown * 32767).astype("<i2").tobytes())
