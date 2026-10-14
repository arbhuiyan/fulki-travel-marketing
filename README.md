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

Render with `node tools/promo-video/render_promo.mjs [--promo regions|bangladesh]` (needs Playwright, ffmpeg and
Python with numpy). The soundtrack, synthesized by `make_audio.py`, is an airport terminal in the background with a
melody hummed quietly beneath it, a low natural soundscape for each scene, and on top split-flap clacks, a low swipe
on each scene change and a phone call-to-action at the end. Each promo picks its own hum and soundscapes; other
soundtracks are listed in `make_audio.py` and chosen with `--sound`. A new country is a new file in `promos/`.

## Contact

- **Address:** Via 4 Martiri, 44, 36071 Arzignano (VI), Italy
- **Phone / WhatsApp:** +39 0444 022494
- **Email:** info@fulkitravels.com

© Fulki Travel. All rights reserved.
