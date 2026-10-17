"""Synthesise the soundtrack for the logo video: a split-flap clack for every flip, a whoosh for the zoom.

Run: python3 tools/logo-video/flip_sound.py events.json out.wav   (needs numpy)
events.json is the EVENTS list from logo-flip.html, plus "duration".
"""
import json
import sys
import wave

import numpy as np

RATE = 48000
rng = np.random.default_rng(11)


def bandpass(x, lo, hi):
    f = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / RATE)
    f[(freqs < lo) | (freqs > hi)] = 0
    return np.fft.irfft(f, len(x))


def decay(n, tau):
    return np.exp(-np.arange(n) / (tau * RATE))


def clack(heavy=False):
    """One flap landing: a bright plastic click on top of a short, low knock."""
    n = int(RATE * (0.25 if heavy else 0.08))
    t = np.arange(n) / RATE
    pitch = rng.uniform(0.9, 1.12)
    noise = bandpass(rng.standard_normal(n), 1200 * pitch, 7000) * decay(n, 0.012 if heavy else 0.004)
    click = np.sin(2 * np.pi * 2400 * pitch * t) * decay(n, 0.003)
    knock = np.sin(2 * np.pi * (95 if heavy else 260 * pitch) * t) * decay(n, 0.045 if heavy else 0.012)
    out = 0.6 * noise / (np.abs(noise).max() + 1e-9) + 0.25 * click + (0.9 if heavy else 0.35) * knock
    out[: int(RATE * 0.0008)] *= np.linspace(0, 1, int(RATE * 0.0008))
    return out * (1.0 if heavy else rng.uniform(0.55, 0.8))


def whoosh(dur):
    n = int(RATE * dur)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    out = bandpass(rng.standard_normal(n), 150, 1800) * env
    return 0.18 * out / np.abs(out).max()


def main(src, dst):
    data = json.load(open(src))
    n = int(RATE * data["duration"])
    mix = np.zeros((n, 2))

    def add(sig, t, pan=0.0):
        i = int(t * RATE)
        sig = sig[: max(0, n - i)]
        mix[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2)
        mix[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2)

    for e in data["events"]:
        if e["kind"] == "whoosh":
            add(whoosh(e["dur"]), e["t"])
        else:
            pan = 0.0 if e["kind"] == "big" else (e["cell"] - 2.5) / 2.5 * 0.45
            add(clack(e["kind"] == "big"), e["t"], pan)
            # the flap letting go, just before it lands
            add(0.25 * clack(), e["t"] - (0.3 if e["kind"] == "big" else 0.05), pan)

    # a little room
    ir_n = int(RATE * 0.5)
    ir = rng.standard_normal(ir_n) * decay(ir_n, 0.09)
    ir /= np.sqrt((ir ** 2).sum())
    for c in range(2):
        wet = np.fft.irfft(np.fft.rfft(mix[:, c], 2 * n) * np.fft.rfft(ir, 2 * n), 2 * n)[:n]
        mix[:, c] += 0.18 * wet

    fade = int(RATE * 0.6)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix *= 0.89 / np.abs(mix).max()
    with wave.open(dst, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes((mix * 32767).astype("<i2").tobytes())


if __name__ == "__main__":
    main(*sys.argv[1:3])
