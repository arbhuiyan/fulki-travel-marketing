"""Synthesise the soundtrack for the videos: split-flap clacks, plus a cabin chime, whooshes and pops for the routes promo,
a sparkle and a rubber-stamp thump for the paper-plane promo, and paper folds and a music bed for the journey promo.

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


def note(m):
    return 440 * 2 ** ((m - 69) / 12)


# D major, a bar each: D, A, Bm, G (bass note first)
CHORDS = [[38, 57, 62, 66, 69], [33, 57, 61, 64, 69], [35, 59, 62, 66, 71], [31, 59, 62, 67, 71]]


def music(e, n):
    """A warm, hopeful bed in D major: pad and plucks to begin, a soft beat and bass for the flight, plucks and pad
    while the card flips, then one big chord when the stamp comes down. e: bpm, intro/groove/break/outro [start, end],
    risers [[start, end], ...] and hit (seconds)."""
    beat = 60 / e["bpm"]
    bar = 4 * beat
    out = np.zeros((n, 2))
    T = np.arange(n) / RATE
    hit = e["hit"]

    def put(sig, t, pan=0.0, g=1.0):
        i = int(t * RATE)
        if i >= n:
            return
        sig = sig[: n - i] * g
        out[i:i + len(sig), 0] += sig * np.sqrt((1 - pan) / 2)
        out[i:i + len(sig), 1] += sig * np.sqrt((1 + pan) / 2)

    def section(t):
        for name in ("intro", "groove", "break", "outro"):
            a, b = e[name]
            if a <= t < b:
                return name
        return None

    def pad(notes, dur, level):
        m = int(RATE * (dur + 1.2))
        t = np.arange(m) / RATE
        sig = np.zeros(m)
        for k in notes:
            for det in (-0.004, 0.004):
                f = note(k) * (1 + det)
                for h in range(1, 7):
                    sig += np.sin(2 * np.pi * f * h * t + h * det * 400) / h ** 1.7
        env = np.minimum(1, t / 0.45) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.35))
        return level * 0.05 * sig * env * (1 + 0.08 * np.sin(2 * np.pi * 0.35 * t))

    def pluck(k):
        m = int(RATE * 0.9)
        t = np.arange(m) / RATE
        f = note(k)
        sig = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * decay(m, 0.08) + 0.15 * np.sin(6 * np.pi * f * t) * decay(m, 0.04)
        return sig * decay(m, 0.28) * np.minimum(1, t / 0.003)

    def bass(k, dur):
        m = int(RATE * dur)
        t = np.arange(m) / RATE
        f = note(k)
        sig = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
        return sig * np.minimum(1, t / 0.01) * decay(m, 0.6) * np.minimum(1, (dur - t) / 0.05)

    def kick():
        m = int(RATE * 0.35)
        t = np.arange(m) / RATE
        return np.sin(2 * np.pi * np.cumsum(45 + 85 * np.exp(-t / 0.035)) / RATE) * decay(m, 0.13)

    def snap():
        m = int(RATE * 0.18)
        return bandpass(rng.standard_normal(m), 1200, 6000) * decay(m, 0.04)

    def hat():
        m = int(RATE * 0.05)
        return bandpass(rng.standard_normal(m), 7000, 14000) * decay(m, 0.012)

    # pad and harmony, bar by bar (the bar the hit falls in is cut short; the hit brings in the last chord)
    nbars = int(np.ceil(n / RATE / bar))
    for b in range(nbars):
        t0 = b * bar
        sec = section(t0) or "outro"
        if t0 >= hit:
            break
        chord = CHORDS[b % 4]
        level = {"intro": 0.7, "groove": 1.0, "break": 0.8}.get(sec, 1.0)
        put(pad(chord[1:], min(bar, hit - t0), level), t0)
        # plucked arpeggio in eighths, one octave up; sparser in the intro and the break
        arp = [chord[2] + 12, chord[3] + 12, chord[4] + 12, chord[3] + 12, chord[2] + 24, chord[4] + 12, chord[3] + 12, chord[1] + 12]
        for i, k in enumerate(arp):
            t = t0 + i * beat / 2
            s2 = section(t)
            if t >= hit or s2 is None or (s2 == "intro" and t < 1.2) or (s2 in ("intro", "break") and i % 2):
                continue
            put(pluck(k), t, pan=0.35 if i % 2 else -0.35, g={"intro": 0.05, "groove": 0.06, "break": 0.05}[s2])
        if sec == "groove":
            for i in range(4):
                t = t0 + i * beat
                if not (e["groove"][0] <= t < e["groove"][1]):
                    continue
                if i in (0, 2):
                    put(kick(), t, g=0.32)
                else:
                    put(snap(), t, g=0.05)
                put(hat(), t + beat / 2, pan=0.3, g=0.05)
                put(bass(chord[0], beat * (0.9 if i in (0, 2) else 0.45)), t if i in (0, 2) else t + beat / 2, g=0.16 if i in (0, 2) else 0.1)

    # risers into the flight and into the stamp
    for a, b in e["risers"]:
        m = int(RATE * (b - a))
        t = np.arange(m) / RATE
        sig = rng.standard_normal(m)
        f = np.fft.rfft(sig)
        freqs = np.fft.rfftfreq(m, 1 / RATE)
        f[(freqs < 300) | (freqs > 9000)] = 0
        sig = np.fft.irfft(f, m) * (t / (b - a)) ** 2.5
        put(0.12 * sig / np.abs(sig).max(), a)

    # the hit: a deep boom, a bright shimmer and the home chord held to the end
    tail = n / RATE - hit
    put(pad([50, 57, 62, 66, 69, 74], tail - 0.6, 1.4), hit)
    m = int(RATE * 2.5)
    t = np.arange(m) / RATE
    put(0.3 * np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t / 0.05)) / RATE) * decay(m, 0.7), hit)
    put(0.05 * bandpass(rng.standard_normal(m), 5000, 15000) * decay(m, 0.9), hit)
    for i, k in enumerate((74, 78, 81, 86)):
        put(pluck(k), hit + 0.12 * i, pan=-0.3 + 0.2 * i, g=0.06)

    # a long, soft hall on the music only
    ir_n = int(RATE * 2.0)
    for c in range(2):
        ir = rng.standard_normal(ir_n) * decay(ir_n, 0.45)
        ir /= np.sqrt((ir ** 2).sum())
        wet = np.fft.irfft(np.fft.rfft(out[:, c], 2 * n) * np.fft.rfft(ir, 2 * n), 2 * n)[:n]
        out[:, c] += 0.35 * wet
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
        if e["kind"] == "music":
            continue
        if e["kind"] in ("chime", "whoosh", "pop", "sparkle", "stamp", "fold"):
            sig = {"chime": chime, "pop": pop, "sparkle": sparkle, "stamp": stamp, "fold": fold}.get(e["kind"], lambda: whoosh(e["dur"]))()
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
    if any(e["kind"] == "music" for e in data["events"]):
        mix += music(next(e for e in data["events"] if e["kind"] == "music"), n)
        # a soft limiter, so the stamp's hit doesn't leave everything else quiet
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
