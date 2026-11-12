# "Your Next Departure" — 60-second promo

| File | Format | Use |
| --- | --- | --- |
| `out/fulki-promo-16x9.mp4` | 1920×1080, 60 s | YouTube, website, Facebook feed |
| `out/fulki-promo-9x16.mp4` | 1080×1920, 60 s | Instagram Reels / Stories, TikTok, WhatsApp Status |

Motion graphics built on the split-flap "F" from the logo set. Sound effects only (flap clicks, jet
whooshes, airport chime); no music, so a licensed track can be laid underneath.

| Time | Flip |
| --- | --- |
| 0–5 s | Blank flap flips to the orange F; a plane leaves it, drawing a contrail |
| 5–12 s | Departures board spins to **TAKE A JOURNEY WITH US**, BOARDING blinks |
| 12–22 s | PARIS → DUBAI → NEW YORK → TOKYO with line-art skylines, **See the world.** |
| 22–34 s | Board flips to ARRIVALS / DHAKA, flight arc Italy → Dhaka, reunion at sunrise, **Meet your loved ones.** |
| 34–44 s | We compare airlines · We book the right flight · We stay with you, **A real person by your side.** |
| 44–52 s | In the office · By phone · On WhatsApp, **B2B PARTNERS WELCOME** |
| 52–60 s | Plane lands into the FULKI Travel & Tours logo, contact details |

## Editing and re-rendering

Everything is drawn by `promo.js` as a function of time; texts, timings and layouts are in `initLayouts()`.
Preview in a browser by serving the repo root and opening `/promo/index.html?play=1` (add `&w=1080&h=1920` for vertical).

```sh
S=/tmp/promo; mkdir -p $S
for f in "1920 1080 16x9" "1080 1920 9x16"; do set -- $f
  node promo/render.cjs clicks $1 $2 $S/clicks_$3.json        # flap timings for the audio
  python3 promo/sfx.py $S/clicks_$3.json $S/audio_$3.wav      # needs numpy
  node promo/render.cjs video $1 $2 promo/out/fulki-promo-$3.mp4 $S/audio_$3.wav   # needs Playwright + ffmpeg
done
```
