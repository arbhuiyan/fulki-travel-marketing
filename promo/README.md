# "Window Seat" — 60-second promo

| File | Format | Use |
| --- | --- | --- |
| `out/fulki-window-seat-16x9.mp4` | 1920×1080, 60 s | YouTube, website, Facebook feed |
| `out/fulki-window-seat-9x16.mp4` | 1080×1920, 60 s | Instagram Reels / Stories, TikTok, WhatsApp Status |

The whole film is seen through one airplane window on a warm paper background.
The soundtrack is an original synthesised music bed plus sound design, so there is nothing to license.

| Time | What happens |
| --- | --- |
| 0–2.5 s | Window with the shade down. **Take your seat.** |
| 2.5–10 s | The shade lifts on a sunrise above the clouds. **Take a journey with us.** |
| 10–22 s | Flying through cloud between views: snow peaks, a golden desert city, a skyline after dark. **See the world.** |
| 22–27 s | Descending over a green river delta. **But the best view isn't a place.** |
| 27–34 s | Zoom into one house's lit window; inside, the traveller is hugged at the door. **Meet your loved ones.** |
| 34–46 s | The window becomes a chat with Fulki: compare airlines, book, stay in touch. **A real person by your side.** |
| 46–52 s | In the office · By phone · On WhatsApp · B2B partners welcome. **Talk to us, your way.** |
| 52–60 s | The plane draws the FULKI Travel & Tours logo; address, phone, website, Instagram |

## Editing and re-rendering

Everything is drawn by `promo.js` as a function of time. Timings and chat messages are in `T`, headlines in `HEADS`.
Preview in a browser by serving the repo root and opening `/promo/index.html?play=1` (add `&w=1080&h=1920` for vertical).

```sh
S=/tmp/promo; mkdir -p $S
node promo/render.cjs events 1920 1080 $S/events.json     # timeline for the soundtrack
python3 promo/sfx.py $S/events.json $S/audio.wav           # needs numpy
node promo/render.cjs video 1920 1080 promo/out/fulki-window-seat-16x9.mp4 $S/audio.wav   # needs Playwright + ffmpeg
node promo/render.cjs video 1080 1920 promo/out/fulki-window-seat-9x16.mp4 $S/audio.wav
```
