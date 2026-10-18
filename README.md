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

The videos are drawn from `tools/logo-video/` with the departure-board card (`flap.js`):
`assets/video/fulki-logo-flip.mp4` (`logo-flip.html`: one flap card flips through F U L K I + plane, then onto the
logo and the "Our new look has landed" message) and `assets/video/fulki-promo.mp4` (`promo.html`: a 30-second
vertical promo, a departures board of destinations from Italy and how to book). A third,
`assets/video/fulki-promo-routes.mp4` (`promo-routes.html`), flies from Italy across a dotted world map
(`dotmap.js`, made by `build_dotmap.py` from Natural Earth) and ends on the round logo spinning in over the phone number. Re-render them with
`node tools/logo-video/build.mjs [logo|promo|routes]` (needs Playwright, ffmpeg and numpy; the sounds are synthesised
by `flip_sound.py`).

## Contact

- **Address:** Via 4 Martiri, 44, 36071 Arzignano (VI), Italy
- **Phone / WhatsApp:** +39 0444 022494
- **Email:** info@fulkitravels.com

© Fulki Travel. All rights reserved.
