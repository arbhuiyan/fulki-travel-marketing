"""Synthesise the soundtrack for the videos: split-flap clacks, plus a cabin chime, whooshes and pops for the routes promo,
a sparkle and a rubber-stamp thump for the paper-plane promo, and paper folds, a paper flutter and natural ambience
(room, birds, wind, sea) for the journey promo.

Run: python3 tools/logo-video/flip_sound.py events.json out.wav   (needs numpy)
events.json is the EVENTS list from the page (each may set "gain" and "pan"), plus "duration".
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


def chime():
    """Two-tone cabin chime, high then low."""
    n = int(RATE * 1.6)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for start, f in ((0.0, 1318.5), (0.42, 1046.5)):
        i = int(start * RATE)
        u = t[: n - i]
        tone = (np.sin(2 * np.pi * f * u) + 0.3 * np.sin(2 * np.pi * 2 * f * u) + 0.12 * np.sin(2 * np.pi * 3 * f * u))
        out[i:] += tone * decay(n - i, 0.42) * np.minimum(1, u / 0.004)
    return 0.32 * out


def whoosh(dur):
    """A plane passing: filtered noise swelling and fading."""
    n = int(RATE * dur)
    env = np.sin(np.linspace(0, np.pi, n)) ** 2
    out = bandpass(rng.standard_normal(n), 120, 1600) * env
    return 0.22 * out / np.abs(out).max()


def pop():
    n = int(RATE * 0.18)
    t = np.arange(n) / RATE
    f = 520 + 380 * np.exp(-t / 0.02)
    return 0.3 * np.sin(2 * np.pi * np.cumsum(f) / RATE) * decay(n, 0.045) * np.minimum(1, t / 0.002)


def sparkle():
    """The paper turning into a plane: a quick run of high, glassy pings."""
    n = int(RATE * 1.4)
    t = np.arange(n) / RATE
    out = np.zeros(n)
    for k, f in enumerate((1568, 1976, 2349, 2637, 3136, 3951, 4699)):
        i = int(k * 0.11 * RATE)
        u = t[: n - i]
        out[i:] += np.sin(2 * np.pi * f * u) * decay(n - i, 0.22) * np.minimum(1, u / 0.002) * (0.9 - 0.08 * k)
    return 0.16 * out


def stamp():
    """A rubber stamp hitting the card: a deep thud under a short slap of paper."""
    n = int(RATE * 0.5)
    t = np.arange(n) / RATE
    thud = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.03)) / RATE) * decay(n, 0.12)
    slap = bandpass(rng.standard_normal(n), 300, 4000) * decay(n, 0.018)
    out = 0.9 * thud + 0.5 * slap / np.abs(slap).max()
    out[: int(RATE * 0.001)] *= np.linspace(0, 1, int(RATE * 0.001))
    return out


def fold():
    """A paper crease: a crackly burst of high noise over a soft knock."""
    n = int(RATE * 0.2)
    t = np.arange(n) / RATE
    crackle = (rng.random(n) < 0.08) * rng.standard_normal(n)
    out = bandpass(rng.standard_normal(n) * 0.4 + crackle, 1500, 9000) * decay(n, 0.05)
    out = 0.5 * out / np.abs(out).max() + 0.25 * np.sin(2 * np.pi * 180 * t) * decay(n, 0.03)
    out[: int(RATE * 0.004)] *= np.linspace(0, 1, int(RATE * 0.004))
    return out


def flutter():
    """A paper plane catching the air: fast flapping of paper over a soft gust."""
    n = int(RATE * 0.9)
    t = np.arange(n) / RATE
    flap = 0.5 + 0.5 * np.sin(2 * np.pi * (28 - 10 * t) * t)
    out = bandpass(rng.standard_normal(n), 900, 6000) * flap ** 3 * np.sin(np.pi * t / t[-1]) ** 0.7
    return 0.35 * out / np.abs(out).max() + 0.6 * whoosh(0.9)


def ambience(e, n):
    """Natural sound under the whole film, each layer fading in and out over [start, end] spans: "room" (a quiet
    room), "birds" (birdsong outside a window), "wind" (air rushing past, with gusts) and "waves" (a distant sea)."""
    r = np.random.default_rng(5)
    t = np.arange(n) / RATE
    out = np.zeros((n, 2))

    def spans(name, fade=0.8):
        env = np.zeros(n)
        for a, b in e.get(name, []):
            env = np.maximum(env, np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1))
        return env

    def coloured(lo, hi, tilt):
        """Stereo noise between lo and hi Hz, rolled off by 1/f**tilt."""
        f = np.fft.rfftfreq(n, 1 / RATE)
        shape = np.where((f >= lo) & (f <= hi), 1 / np.maximum(f, 1) ** tilt, 0)
        ch = [np.fft.irfft(np.fft.rfft(r.standard_normal(n)) * shape, n) for _ in range(2)]
        return np.stack([c / np.abs(c).max() for c in ch], axis=1)

    # a quiet room
    out += 0.025 * coloured(40, 2500, 1.0) * spans("room")[:, None]

    # wind: low air with slow swells and gusts
    swell = 0.55 + 0.25 * np.sin(2 * np.pi * 0.11 * t + 1) + 0.2 * np.sin(2 * np.pi * 0.37 * t) ** 2
    wind = coloured(60, 1800, 0.9) * swell[:, None]
    hiss = coloured(1500, 6000, 0.5) * (0.4 + 0.6 * np.sin(2 * np.pi * 0.23 * t) ** 2)[:, None]
    gust = np.zeros(n)
    for a, b in e.get("gusts", []):
        gust += np.clip((t - a) / (b - a), 0, 1) ** 2 * np.exp(-np.clip(t - b, 0, None) / 0.5) * (t < b + 2)
    out += (0.16 * wind + 0.03 * hiss) * (spans("wind", 1.2) + 1.6 * gust)[:, None]

    # a distant sea: noise swelling and drawing back every few seconds
    period = 5.5
    phase = (t % period) / period
    surge = np.where(phase < 0.35, (phase / 0.35) ** 2, np.exp(-(phase - 0.35) / 0.2))
    out += 0.07 * coloured(150, 3500, 0.7) * (surge * spans("waves", 1.5))[:, None]

    # birds: short phrases of quick chirps, near and far, left and right
    birds = spans("birds", 1.0)
    for a, b in e.get("birds", []):
        at = a + r.uniform(0.1, 0.5)
        while at < b:
            near = r.random() < 0.6
            base = r.uniform(2600, 4800) if near else r.uniform(3200, 5800)
            pan = r.uniform(-0.8, 0.8)
            kind = r.integers(3)
            for k in range(int(r.integers(2, 7))):
                d = r.uniform(0.05, 0.11) if kind else r.uniform(0.12, 0.2)
                m = int(RATE * d)
                u = np.arange(m) / m
                # a rising or falling sweep, a little vibrato
                sweep = base * (1 + (0.35 if kind == 1 else -0.3 if kind == 2 else 0.12 * np.sin(6 * np.pi * u)) * u)
                sig = np.sin(2 * np.pi * np.cumsum(sweep * (1 + 0.02 * np.sin(2 * np.pi * 60 * u * d))) / RATE)
                sig *= np.sin(np.pi * u) ** 2
                i = int((at + k * (d + r.uniform(0.02, 0.06))) * RATE)
                if i + m >= n:
                    break
                g = (0.085 if near else 0.03) * birds[i]
                out[i:i + m, 0] += g * sig * np.sqrt((1 - pan) / 2)
                out[i:i + m, 1] += g * sig * np.sqrt((1 + pan) / 2)
            at += r.uniform(0.5, 1.6)
    return out


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
        if e["kind"] == "ambience":
            continue
        if e["kind"] in ("chime", "whoosh", "pop", "sparkle", "stamp", "fold", "flutter"):
            sig = {"chime": chime, "pop": pop, "sparkle": sparkle, "stamp": stamp, "fold": fold, "flutter": flutter}.get(e["kind"], lambda: whoosh(e["dur"]))()
            add(e.get("gain", 1.0) * sig, e["t"], e.get("pan", 0.0))
            continue
        gain, pan = e.get("gain", 1.0), e.get("pan", 0.0)
        add(gain * clack(e["kind"] == "big"), e["t"], pan)
        # the flap letting go, just before it lands
        add(gain * 0.25 * clack(), e["t"] - (0.3 if e["kind"] == "big" else 0.06), pan)

    # a little room
    ir_n = int(RATE * 0.5)
    ir = rng.standard_normal(ir_n) * decay(ir_n, 0.09)
    ir /= np.sqrt((ir ** 2).sum())
    for c in range(2):
        wet = np.fft.irfft(np.fft.rfft(mix[:, c], 2 * n) * np.fft.rfft(ir, 2 * n), 2 * n)[:n]
        mix[:, c] += 0.18 * wet
    if any(e["kind"] == "ambience" for e in data["events"]):
        mix += ambience(next(e for e in data["events"] if e["kind"] == "ambience"), n)
        # a soft limiter, so the stamp's thud doesn't leave everything else quiet
        mix = np.tanh(mix * 0.62 / np.percentile(np.abs(mix), 99.9))

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
