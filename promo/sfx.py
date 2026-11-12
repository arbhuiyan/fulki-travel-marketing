"""Soundtrack for the "Window Seat" promo: no music, no instruments.
Only real-world sound, synthesised with numpy: cabin air and engine hum, the window shade,
wind through cloud, desert wind, distant city, birds and water over the delta, a door,
a rolling suitcase, shoes on the mat, tea steam, chat notifications, and the logo whoosh.

    python3 promo/sfx.py events.json out.wav

events.json comes from `node promo/render.cjs events ...` and holds [type, time] pairs taken
from the animation's own timeline, so sound and picture stay in step."""
import json
import sys
import wave

import numpy as np

SR = 48000
DUR = 60.0
N = int(SR * DUR)
rng = np.random.default_rng(11)
out = np.zeros((N, 2))
T = np.arange(N) / SR


def add(sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    if i < 0:
        sig, i = sig[-i:], 0
    n = min(len(sig), N - i)
    out[i:i + n] += sig[:n] * gain


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def noise(n, lo, hi):
    s = bandpass(rng.standard_normal(n), lo, hi)
    return s / (np.abs(s).max() + 1e-9)


def window(t0, t1, fade=1.0):
    """0..1 envelope that is on between t0 and t1 with soft edges."""
    return np.clip((T - t0) / fade, 0, 1) * np.clip((t1 - T) / fade, 0, 1)


def bed(lo, hi, gain, env, stereo_shift=1777):
    s = noise(N, lo, hi)
    out[:, 0] += s * env * gain
    out[:, 1] += np.roll(s, stereo_shift) * env * gain


def swell(dur, lo, hi, p0, p1, shape=1.0, peak=0.5):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    s = noise(n, lo, hi)
    env = np.exp(-((t - peak) / (0.22 * shape)) ** 2) * np.sin(np.pi * t)
    a = (p0 + (p1 - p0) * t + 1) * np.pi / 4
    return np.stack([s * env * np.cos(a), s * env * np.sin(a)], axis=1)


def blip(f0, f1, dur=0.11, harm=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * (t / dur)) / SR
    return (np.sin(ph) + harm * np.sin(2 * ph)) * np.minimum(t / 0.004, 1) * np.exp(-t / (dur * 0.45))


def knock(f=140, dur=0.12, bright=0.3):
    n = int(SR * dur)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * np.exp(-t / (dur * 0.25)) + bright * noise(n, 800, 5000) * np.exp(-t / 0.008)


def chirp(f0, f1, dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    ph = 2 * np.pi * np.cumsum(f0 + (f1 - f0) * np.sin(np.pi * t / dur * 0.5)) / SR
    return np.sin(ph) * np.sin(np.pi * t / dur) ** 2


def birds(t0, t1, gain):
    t = t0 + rng.uniform(0, 0.5)
    while t < t1:
        base, pan = rng.uniform(2600, 4600), rng.uniform(-0.8, 0.8)
        for k in range(rng.integers(2, 6)):
            d = rng.uniform(0.04, 0.09)
            add(chirp(base, base * rng.uniform(1.15, 1.5), d), t + k * rng.uniform(0.08, 0.13), pan, gain * rng.uniform(0.5, 1))
        t += rng.uniform(0.6, 1.6)


def heartbeat(t0, t1, bpm0, bpm1, gain):
    """Soft lub-dub that quickens as we get closer to home."""
    t = t0
    while t < t1:
        u = (t - t0) / (t1 - t0)
        fade = min(1, (t - t0) / 0.8) * min(1, (t1 - t) / 0.6)
        add(knock(58, 0.16, 0.02), t, 0, gain * fade)
        add(knock(48, 0.14, 0.02), t + 0.24, 0, gain * 0.6 * fade)
        t += 60 / (bpm0 + (bpm1 - bpm0) * u)


def murmur(t0, t1, gain):
    """Distant terminal crowd: band-limited noise with speech-like movement, no words."""
    env = window(t0, t1, 0.8)
    for k in range(4):
        rate = rng.uniform(2.5, 5.0)
        am = np.clip(np.sin(2 * np.pi * rate * T + rng.uniform(0, 6)) * np.sin(2 * np.pi * 0.4 * T + k), 0, 1)
        bed(250 + 80 * k, 1800 - 150 * k, gain, env * (0.3 + 0.7 * am), 911 + 1300 * k)


def pour(t, dur, gain, pan):
    n = int(SR * dur)
    tt = np.arange(n) / SR
    blocks = np.repeat(rng.uniform(0.3, 1.0, n // 1200 + 1), 1200)[:n]
    blocks = np.convolve(blocks, np.ones(400) / 400, 'same')
    s = noise(n, 500, 2800) * blocks * np.minimum(tt / 0.1, 1) * np.clip((dur - tt) / 0.25, 0, 1)
    add(s, t, pan, gain)


def touchdown(t, gain):
    for k, dt in enumerate([0.0, 0.18]):
        n = int(SR * 0.16); tt = np.arange(n) / SR
        add(noise(n, 1400, 4200) * np.exp(-tt / 0.05), t + dt, -0.2 + 0.4 * k, gain * (1 - 0.3 * k))
    n = int(SR * 2.2); tt = np.arange(n) / SR
    add(noise(n, 40, 300) * np.exp(-tt / 0.9) * np.minimum(tt / 0.05, 1), t, 0, gain * 0.9)


def build(events):
    ev = dict()
    for k, t in events:
        ev.setdefault(k, []).append(t)
    zoom = ev['zoom'][0]
    # cabin: engine hum + air, until we dive into the house
    cabin = window(0.0, zoom + 1.2, 1.5)
    bed(40, 260, 0.11, cabin)
    bed(300, 1800, 0.035, cabin)
    hum = (np.sin(2 * np.pi * 96 * T) * 0.5 + np.sin(2 * np.pi * 192.5 * T) * 0.2) * (1 + 0.15 * np.sin(2 * np.pi * 0.3 * T))
    out[:, 0] += hum * cabin * 0.02
    out[:, 1] += hum * cabin * 0.02
    murmur(0.0, 3.2, 0.03)
    add(knock(240, 0.1, 0.7), 0.35, 0.6, 0.18)                                  # overhead bin closes
    spool = np.clip((T - 1.5) / 4.0, 0, 1) * window(0, 9.0, 2.0)
    out[:, 0] += noise(N, 600, 3000) * spool * 0.025
    out[:, 1] += np.roll(noise(N, 600, 3000), 333) * spool * 0.025
    v = ev['cloud']
    howl = 0.5 + 0.5 * np.sin(2 * np.pi * 0.22 * T) ** 2
    bed(200, 1200, 0.05, window(v[0] + 0.3, v[1] - 0.3, 0.8))                  # high mountain wind
    bed(500, 900, 0.05, window(v[0] + 0.3, v[1] - 0.3, 0.8) * howl)
    gust = 0.6 + 0.4 * np.sin(2 * np.pi * 0.35 * T)
    bed(150, 900, 0.07, window(v[1] + 0.3, v[2] - 0.3, 0.8) * gust)             # desert wind
    bed(50, 400, 0.05, window(v[2] + 0.3, v[3] - 0.3, 0.8))                     # distant city at night
    delta = window(v[3] + 0.2, zoom + 0.8, 1.0)
    ripple = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 1.7 * T) * np.sin(2 * np.pi * 0.63 * T))
    bed(500, 2500, 0.05, delta * ripple)                                         # river water
    birds(v[3] + 0.4, zoom + 0.5, 0.05)
    birds(v[3] + 0.9, zoom + 0.2, 0.035)
    heartbeat(zoom - 0.6, zoom + 2.9, 62, 96, 0.55)
    door = ev['door'][0]
    kettle = window(door - 0.2, door + 2.6, 0.7) * np.clip((T - door + 0.2) / 2.0, 0.3, 1)
    bed(2500, 7000, 0.025, kettle)                                               # kettle simmering
    bed(80, 400, 0.03, kettle * (0.6 + 0.4 * (np.sin(2 * np.pi * 7 * T) > 0.3)))  # bubbling
    pour(door + 2.0, 1.1, 0.12, 0.45)                                            # tea poured
    pour(door + 3.2, 0.8, 0.09, 0.55)
    room = window(zoom + 0.6, ev['morph'][0] + 0.6, 0.6)
    bed(80, 600, 0.04, room)                                                     # warm room tone
    birds(zoom + 1.0, ev['morph'][0], 0.03)                                      # birds outside the open door
    bed(90, 1400, 0.035, window(ev['morph'][0] - 0.4, DUR + 1, 1.0))           # soft room air under chat and sign-off

    for kind, ts in ev.items():
        for t in ts:
            if kind == 'ding':                                                   # seat-belt sign
                n = int(SR * 1.0); tt = np.arange(n) / SR
                add(np.sin(2 * np.pi * 1318 * tt) * np.exp(-tt / 0.35) * np.minimum(tt / 0.003, 1), t, 0, 0.09)
            elif kind == 'shade':                                                # shade slides up
                add(swell(2.0, 900, 5000, -0.1, 0.1, 1.6, 0.5), t, gain=0.11)
                add(knock(220, 0.08, 0.6), t + 2.0, 0, 0.25)
            elif kind == 'cloud':
                add(swell(1.8, 200, 3500, 0.7, -0.7, 1.0), t - 0.9, gain=0.22)
            elif kind == 'zoom':
                add(swell(2.8, 150, 5000, 0, 0, 0.9, 0.8), t - 0.2, gain=0.26)
            elif kind == 'door':
                add(knock(900, 0.04, 1.0), t, -0.5, 0.18)                       # latch
                add(swell(0.9, 200, 1500, -0.6, -0.3, 1.0, 0.4), t + 0.05, gain=0.12)
            elif kind == 'roll':                                                 # suitcase wheels on the floor
                n = int(SR * 1.1); tt = np.arange(n) / SR
                bumps = 0.5 + 0.5 * (np.sin(2 * np.pi * 11 * tt) > 0.6)
                s = noise(n, 120, 900) * bumps * np.minimum(tt / 0.08, 1) * np.clip((1.1 - tt) / 0.3, 0, 1)
                pan = -0.6 + 0.6 * tt / 1.1
                a = (pan + 1) * np.pi / 4
                add(np.stack([s * np.cos(a), s * np.sin(a)], axis=1), t, gain=0.16)
            elif kind == 'stop':
                add(knock(110, 0.15, 0.2), t, -0.1, 0.3)
            elif kind == 'handle':
                add(knock(600, 0.05, 0.8), t, -0.1, 0.15)
                add(knock(450, 0.05, 0.8), t + 0.22, -0.1, 0.15)
            elif kind == 'shoes':
                add(knock(180, 0.07, 0.5), t + 0.45, 0.2, 0.22)
                add(knock(160, 0.07, 0.5), t + 0.6, 0.3, 0.2)
            elif kind == 'card':                                                 # paper card swings
                add(swell(0.5, 1500, 7000, 0.2, 0.3, 1.0, 0.3), t, gain=0.08)
            elif kind == 'heart':                                                # tea steam
                n = int(SR * 1.8); tt = np.linspace(0, 1, n)
                add(noise(n, 3500, 9000) * np.sin(np.pi * tt) ** 2, t - 0.8, 0.4, 0.035)
            elif kind == 'morph':
                add(swell(1.0, 400, 3000, -0.3, 0.3), t, gain=0.12)
            elif kind == 'send':
                add(blip(520, 880, 0.12), t, 0.35, 0.3)
            elif kind == 'recv':
                add(blip(880, 660, 0.09), t, -0.35, 0.28)
                add(blip(660, 990, 0.12), t + 0.09, -0.35, 0.28)
            elif kind == 'typing':
                for k in range(5):
                    add(knock(rng.uniform(1600, 2200), 0.025, 1.0), t + 0.12 + k * 0.16 + rng.uniform(0, 0.03), -0.35, 0.05)
            elif kind == 'pop':
                add(blip(420, 700, 0.1), t, -0.2, 0.26)
            elif kind == 'land':                                                 # plane draws the logo
                add(swell(2.4, 120, 4200, -0.9, 0.5, 1.1, 0.55), t - 0.3, gain=0.32)
                bed(40, 260, 0.06, window(t - 0.4, t + 2.4, 0.8))
            elif kind == 'logo':
                touchdown(t - 0.1, 0.35)


def main(events_path, wav_path):
    build(json.load(open(events_path)))
    rms = np.sqrt((out ** 2).mean())
    y = np.tanh(out * (10 ** (-17 / 20) / rms))                                  # loudness to about -17 dB, soft-limited
    y = y / max(np.abs(y).max(), 1e-9) * 0.89
    n_in, n_out = int(SR * 0.6), int(SR * 2.0)
    y[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    y[-n_out:] *= (np.linspace(1, 0, n_out) ** 1.5)[:, None]
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
    print(f'{wav_path}: written')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
