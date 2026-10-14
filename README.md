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

## Promo video

`assets/video/fulki-promo-en.mp4` and `fulki-promo-it.mp4` are 20-second vertical (1080×1920) promos for
Asia (with Dhaka's Shaheed Minar), Africa and the Middle East, drawn from `tools/promo-video/promo.html`.
The soundtrack, synthesized by `make_audio.py`, is an airport terminal in the background (hall hum, crowd
murmur, footsteps, rolling suitcases, the announcement chime, a jet taking off as the logo lands), a low natural
soundscape for each region beneath it, and on top split-flap clacks, a low swipe on each scene change and a
phone call-to-action at the end. A Hijaz nasheed is hummed quietly under the airport. Other backgrounds
(hummed or sung melodies, or none) are listed in `make_audio.py`; pick one with `--sound` (default `airport+hijaz`).

## Contact

- **Address:** Via 4 Martiri, 44, 36071 Arzignano (VI), Italy
- **Phone / WhatsApp:** +39 0444 022494
- **Email:** info@fulkitravels.com

© Fulki Travel. All rights reserved.
