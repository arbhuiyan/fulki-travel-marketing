# Fulki Travel

The website of **Fulki Travel**, a travel agency in Arzignano (VI), Italy.

We book flights to destinations worldwide and support our clients in person, by phone and on WhatsApp. We also work with agencies and businesses as B2B partners.

**Visit the site:** https://fulkitravels.com/

## Editing the site

`index.html` holds every language. After changing it, regenerate the per-language pages
(`/it/`, `/en/`, `/fr/`, `/es/`, `/de/`, `/bn/`) and `sitemap.xml`:

```sh
python3 tools/build_lang_pages.py
```

The link-preview image `assets/og-image.png` is drawn from `tools/og-image.html`; re-render it with
`node tools/build_og_image.mjs` (needs Playwright).

## Promo videos

20-second vertical (1080×1920) promos in `assets/video`, drawn from `tools/promo-video/promo.html` plus one
content file per promo in `tools/promo-video/promos/`:

- **Regions** (`promos/regions.js`): Asia (with Dhaka's Shaheed Minar), Africa and the Middle East —
  `fulki-promo-en.mp4`, `fulki-promo-it.mp4`.
- **Bangladesh** (`promos/bangladesh.js`): Dhaka, Sylhet and Cox's Bazar, with departures from Italian airports —
  `fulki-promo-bangladesh-en.mp4`, `-it.mp4`, `-bn.mp4`.
- **Senegal** (`promos/senegal.js`): Dakar, Touba and Saint-Louis, with departures from Italian airports to Dakar —
  `fulki-promo-senegal-en.mp4`, `-it.mp4`, `-fr.mp4`.
- **Ghana** (`promos/ghana.js`): Accra, Kakum and Cape Coast, with departures from Italian airports to Accra —
  `fulki-promo-ghana-en.mp4`, `-it.mp4`.

Render with `node tools/promo-video/render_promo.mjs [--promo regions|bangladesh|senegal|ghana]` (needs Playwright, ffmpeg and
Python with numpy). The soundtrack, synthesized by `make_audio.py`, is an airport terminal in the background with a
melody hummed quietly beneath it, a low natural soundscape for each scene, and on top split-flap clacks, a low swipe
on each scene change and a phone call-to-action at the end. Each promo picks its own hum and soundscapes; other
soundtracks are listed in `make_audio.py` and chosen with `--sound`. A new country is a new file in `promos/`.

## Reels

Ten short vertical (1080×1920) reels in `assets/video/reels`, each in its own visual style and on its own topic, in
English and Italian (`fulki-<name>-en.mp4`, `fulki-<name>-it.mp4`). Each is drawn by one file in `tools/reels/reels/`
on top of `tools/reels/reel.html` and `lib.js`:

| Reel | Topic | Look | Music |
| --- | --- | --- | --- |
| `hello` | We speak your language (5 greetings) | kinetic poster type, flat colour wipes | pop |
| `chat` | Book on WhatsApp, a real person replies | a phone chat with typing and bubbles | lo-fi |
| `ticket` | How it works: three steps, no surprises | a boarding pass that prints, gets stamped and torn | corporate |
| `passport` | Any route: one-way, return, multi-city | a passport filling with ink stamps | pop |
| `wintersun` | Winter sun getaways | retro risograph travel poster | tropical |
| `calendar` | Book early for Christmas, Eid and summer | tear-off wall calendar, sticky notes | pop |
| `visit` | Come and see us in Arzignano | flat illustrated town map, pin drop, shopfront | acoustic |
| `b2b` | Become a B2B partner | dark blueprint, self-drawing line icons | corporate |
| `family` | Families & groups on one booking | kraft-paper scrapbook with polaroids | acoustic |
| `neon` | Changes & support, even after ticketing | neon signs at night | synthwave |

Render with `node tools/reels/render_reel.mjs <name|all> [en|it]` (needs Playwright, ffmpeg and Python with numpy);
`--stills <lang> <seconds...>` writes PNG frames to check. The soundtrack is synthesized by `tools/reels/make_audio.py`:
a music bed in the reel's style and sound effects on the cues each reel lists (typing, stamps, paper tearing, neon
buzz…). Fonts and their licences are listed in `tools/reels/fonts/README.md`.

## Contact

- **Address:** Via 4 Martiri, 44, 36071 Arzignano (VI), Italy
- **Phone / WhatsApp:** +39 0444 022494
- **Email:** info@fulkitravels.com

© Fulki Travel. All rights reserved.
