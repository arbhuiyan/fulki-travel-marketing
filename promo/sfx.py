"""Soundtrack for the "Window Seat" promo, synthesised from scratch with numpy:
a gentle original music bed (warm pad + kalimba-like plucks) and sound design
(cabin air, window shade, cloud passes, chat pops, landing whoosh, sign-off bell).

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
music = np.zeros((N, 2))
fx = np.zeros((N, 2))


def add(buf, sig, t, pan=0.0, gain=1.0):
    i = int(t * SR)
    if i >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.stack([sig * np.cos(a), sig * np.sin(a)], axis=1)
    if i < 0:
        sig, i = sig[-i:], 0
    n = min(len(sig), N - i)
    buf[i:i + n] += sig[:n] * gain


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- music ----------------
# D  A  Bm  G, four seconds a chord; (bass, [chord tones])
D, A, Bm, G = (50, [62, 66, 69, 74]), (45, [61, 64, 69, 73]), (47, [62, 66, 71, 74]), (43, [62, 67, 71, 74])
CHORDS = [D, A, Bm, G, D, A, Bm, G, D, A, Bm, G, A, D, D]


def pad_note(m, dur, gain):
    n = int(SR * (dur + 2.0))
    t = np.arange(n) / SR
    f = hz(m)
    s = sum(np.sin(2 * np.pi * f * d * t + ph) for d, ph in [(1.0, 0), (1.004, 1.3), (0.996, 2.1)]) / 3
    s += 0.25 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    env = np.minimum(t / 1.2, 1) * np.minimum(np.maximum((dur + 2.0 - t) / 2.0, 0), 1)
    return s * env * gain


def pluck(m, gain):
    n = int(SR * 1.6)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.38) + 0.28 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.16) \
        + 0.1 * np.sin(2 * np.pi * 4.07 * f * t) * np.exp(-t / 0.05)
    return s * np.minimum(t / 0.003, 1) * gain


def intensity(t):
    """(pluck density, pluck gain, pad gain) across the film's sections."""
    if t < 2.4: return 0.0, 0.0, 0.5
    if t < 10: return 0.75, 0.8, 0.7
    if t < 22: return 1.0, 1.0, 0.8
    if t < 27: return 0.4, 0.6, 0.7      # "but the best view isn't a place"
    if t < 34: return 1.0, 1.0, 1.0      # reunion
    if t < 52: return 0.6, 0.7, 0.7      # chat + contact
    if t < 56: return 1.0, 0.9, 0.9
    return 0.0, 0.0, 0.8


def build_music():
    for i, (bass, tones) in enumerate(CHORDS):
        t0 = i * 4.0
        _, _, pg = intensity(t0 + 0.1)
        add(music, pad_note(bass, 4.0, 0.16 * pg), t0)
        add(music, pad_note(bass + 12, 4.0, 0.09 * pg), t0)
        for m in tones[:3]:
            add(music, pad_note(m, 4.0, 0.055 * pg), t0, pan=rng.uniform(-0.5, 0.5))
        pattern = [0, 2, 1, 2, 3, 2, 1, 2]
        for k in range(8):
            t = t0 + k * 0.5
            dens, g, _ = intensity(t)
            if dens == 0 or (k % 2 == 1 and rng.random() > dens) or (k not in (0, 4) and rng.random() > dens + 0.25):
                continue
            m = tones[pattern[k]] + (12 if dens >= 1.0 and k in (3, 7) and rng.random() < 0.5 else 0)
            vel = (1.0 if k == 0 else 0.8 if k == 4 else 0.6) * g
            add(music, pluck(m, 0.2 * vel), t + rng.uniform(-0.006, 0.006), pan=0.45 * (1 if k % 2 else -1))
    # closing figure: a rising D arpeggio that rings out over the logo
    for k, m in enumerate([62, 66, 69, 74, 78, 81]):
        add(music, pluck(m, 0.2), 56.0 + k * 0.22, pan=-0.4 + k * 0.16)


def reverb(x, wet=0.28, decay=1.1, length=2.8):
    n = int(SR * length)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / decay)
        ir = bandpass(ir, 200, 7000)
        ir /= np.sqrt((ir ** 2).sum())
        out[:, ch] = np.fft.irfft(np.fft.rfft(x[:, ch], size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x + wet * out


# ---------------- sound design ----------------
def swell(dur, lo, hi, p0, p1, shape=1.0, peak=0.5):
    n = int(SR * dur)
    t = np.linspace(0, 1, n)
    s = bandpass(rng.standard_normal(n), lo, hi)
    s /= np.abs(s).max() + 1e-9
    env = np.exp(-((t - peak) / (0.22 * shape)) ** 2) * np.sin(np.pi * t)
    pan = p0 + (p1 - p0) * t
    a = (pan + 1) * np.pi / 4
    return np.stack([s * env * np.cos(a), s * env * np.sin(a)], axis=1)


def blip(f0, f1, dur=0.11, harm=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * (t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + harm * np.sin(2 * ph)) * np.minimum(t / 0.004, 1) * np.exp(-t / (dur * 0.45))


def bell(freq, dur=2.6, decay=1.3):
    n = int(SR * dur)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t / (decay / m ** 0.5)) for m, a in [(1, 1.0), (2.0, 0.3), (3.0, 0.1), (4.2, 0.04)])
    return s * np.minimum(t / 0.004, 1)


def build_fx(events):
    # cabin air for the flight, fading as we arrive
    air = bandpass(rng.standard_normal(N), 60, 500)
    air /= np.abs(air).max()
    t = np.arange(N) / SR
    env = np.minimum(t / 1.5, 1) * np.clip((29.5 - t) / 3.0, 0, 1)
    fx[:, 0] += air * env * 0.05
    fx[:, 1] += np.roll(air, 1201) * env * 0.05
    for kind, t in events:
        if kind == 'ding':
            add(fx, bell(987.8, 1.8, 0.9), t, 0, 0.12)
        elif kind == 'shade':                                  # shade slides up, light floods in
            add(fx, swell(2.2, 300, 2600, -0.2, 0.2, 1.3, 0.45), t - 0.1, gain=0.22)
            add(fx, blip(180, 120, 0.08, 0.5), t + 2.0, 0, 0.25)
        elif kind == 'cloud':                                  # flying through cloud
            add(fx, swell(1.8, 250, 3500, 0.7, -0.7, 1.0), t - 0.9, gain=0.2)
        elif kind == 'zoom':                                   # diving into the lit window
            add(fx, swell(2.8, 150, 5000, 0, 0, 0.9, 0.8), t - 0.2, gain=0.26)
        elif kind == 'morph':
            add(fx, swell(1.0, 400, 3000, -0.3, 0.3), t, gain=0.12)
        elif kind == 'send':
            add(fx, blip(520, 880, 0.12), t, 0.35, 0.3)
        elif kind == 'recv':
            add(fx, blip(880, 660, 0.09), t, -0.35, 0.28)
            add(fx, blip(660, 990, 0.12), t + 0.09, -0.35, 0.28)
        elif kind == 'typing':
            for k in range(5):
                add(fx, blip(1500 + rng.uniform(-200, 200), 1300, 0.03, 0), t + 0.12 + k * 0.16 + rng.uniform(0, 0.03), -0.35, 0.05)
        elif kind == 'pop':
            add(fx, blip(420, 700, 0.1), t, -0.2, 0.26)
        elif kind == 'land':                                   # plane draws the logo
            add(fx, swell(2.4, 120, 4200, -0.9, 0.5, 1.1, 0.55), t - 0.3, gain=0.3)
        elif kind == 'bell':
            add(fx, bell(587.33), t, 0, 0.16)
            add(fx, bell(880.0), t + 0.02, 0, 0.07)


def main(events_path, wav_path):
    events = json.load(open(events_path))
    build_music()
    build_fx(events)
    m = reverb(music, 0.3)
    f = reverb(fx, 0.12, 0.6, 1.5)
    y = m * 1.0 + f * 1.0
    y = np.tanh(y * 1.6) / np.tanh(1.6)
    y = y / np.abs(y).max() * 0.89
    n_in, n_out = int(SR * 0.8), int(SR * 2.2)
    y[:n_in] *= np.linspace(0, 1, n_in)[:, None]
    y[-n_out:] *= (np.linspace(1, 0, n_out) ** 1.5)[:, None]
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((y * 32767).astype('<i2').tobytes())
    print(f'{wav_path}: {len(events)} events')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
