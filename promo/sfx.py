"""Synthesises the promo's sound design (no music): split-flap clicks, jet whooshes,
an airport ding-dong, a landing thud and a faint room tone.

    python3 promo/sfx.py clicks.json out.wav

clicks.json comes from `node promo/render.cjs clicks ...` and holds [time, tileHeight, x] per flap landing,
so every click on screen has its sound, panned to where it happens."""
import json
import sys
import wave

import numpy as np

SR = 48000
DUR = 60.0
rng = np.random.default_rng(7)
N = int(SR * DUR)
out = np.zeros((N, 2))


def add(sig, t, pan=0.0, gain=1.0):
    """Mix a mono (n,) or stereo (n,2) signal in at time t; pan -1..1 (equal power)."""
    i = int(t * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    n = min(len(sig), N - i)
    if i < 0:
        sig, n, i = sig[-i:], n + i, 0
    out[i:i + n] += sig[:n] * gain


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(t / attack, 1) * np.exp(-t / decay)


# --- split-flap click templates: small tiles click high and short, big cards lower and heavier
def click(size):
    big = size > 200
    n = int(SR * (0.06 if big else 0.03))
    t = np.arange(n) / SR
    f = rng.uniform(700, 1100) if big else rng.uniform(1900, 3400) * (60 / max(size, 40)) ** 0.25
    noise = rng.standard_normal(n) * env(n, 0.0003, 0.004 if big else 0.0018)
    tone = np.sin(2 * np.pi * f * t) * env(n, 0.0002, 0.012 if big else 0.004)
    thump = np.sin(2 * np.pi * (140 if big else 260) * t) * env(n, 0.001, 0.02 if big else 0.006)
    return 0.55 * noise + 0.4 * tone + (0.7 if big else 0.25) * thump


def whoosh(dur, p0, p1, gain=1.0, bright=1.0):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    base = rng.standard_normal(n)
    lo = bandpass(base, 80, 900)
    hi = bandpass(base, 900, 5000 * bright)
    shape = np.sin(np.pi * np.clip(t, 0, 1)) ** 2
    peak = np.exp(-((t - 0.55) / 0.18) ** 2)       # doppler-ish bright peak as it passes
    sig = (lo * 0.9 + hi * 0.6 * peak) * shape
    rumble = bandpass(rng.standard_normal(n), 30, 160) * shape * 1.4
    sig = sig + rumble
    sig /= np.abs(sig).max() + 1e-9
    pan = p0 + (p1 - p0) * t
    a = (pan + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1) * gain


def bell(freq, dur=2.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t / (1.3 / m ** 0.5))
            for m, a in [(1, 1.0), (2.0, 0.32), (3.0, 0.12), (4.2, 0.05)])
    return s * np.minimum(t / 0.004, 1)


def chime(t, gain=0.22):
    add(bell(659.25), t, 0, gain)          # E5
    add(bell(523.25), t + 0.55, 0, gain)   # C5


def thud(t, gain=0.5):
    n = int(SR * 0.35)
    tt = np.arange(n) / SR
    f = 75 - 35 * tt / 0.35
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.09)
    add(s + 0.15 * bandpass(rng.standard_normal(n), 100, 1200) * np.exp(-tt / 0.03), t, 0, gain)


def main(clicks_path, wav_path):
    clicks = json.load(open(clicks_path))
    # count clicks per 50 ms so dense rattles don't get louder than sparse ones
    bins = np.zeros(int(DUR * 20) + 1)
    for t, _, _ in clicks:
        bins[int(t * 20)] += 1
    for t, size, x in clicks:
        dens = bins[int(t * 20)]
        g = (0.9 if size > 200 else 0.5) / max(1.0, dens ** 0.5) * rng.uniform(0.7, 1.0)
        add(click(size), t + rng.uniform(-0.003, 0.003), pan=(x - 0.5) * 1.4, gain=g)

    add(whoosh(2.6, -0.4, 0.95, 0.55), 1.4)               # plane leaves the F
    chime(7.0)                                            # boarding
    add(whoosh(2.4, -0.6, 0.6, 0.22, bright=0.6), 24.0)   # Italy → Dhaka
    add(whoosh(2.3, -0.95, 0.15, 0.5), 52.2)              # plane lands into the logo
    thud(54.25, 0.35)
    chime(55.3, 0.2)                                      # sign-off

    # soft airy swell under the sunrise / reunion (27-34 s)
    n = int(SR * 7.5)
    tt = np.linspace(0, 1, n)
    air = bandpass(rng.standard_normal((n, 2)).T.reshape(-1), 250, 2200).reshape(2, n).T
    air = air / np.abs(air).max() * (np.sin(np.pi * tt) ** 1.5)[:, None]
    add(air, 26.8, gain=0.12)

    # faint airport room tone
    room = bandpass(rng.standard_normal(N), 40, 400)
    room = room / np.abs(room).max() * 0.045
    fade = np.minimum(np.arange(N) / (SR * 1.0), 1) * np.minimum((N - np.arange(N)) / (SR * 1.5), 1)
    out[:, 0] += room * fade
    out[:, 1] += np.roll(room, 997) * fade

    y = np.tanh(out * 1.4) / np.tanh(1.4)
    y = y / np.abs(y).max() * 0.89
    tail = int(SR * 0.4)
    y[-tail:] *= np.linspace(1, 0, tail)[:, None]
    pcm = (y * 32767).astype('<i2')
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f'{wav_path}: {len(clicks)} clicks')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
