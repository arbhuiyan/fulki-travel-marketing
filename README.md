# Fulki Travel — marketing site

A static, promotional landing page for Fulki Travel (Arzignano, VI): customer services, how it works,
B2B partner information, location and contacts. It's plain HTML/CSS/JS with no build step and no backend.

- `index.html` holds the content, in Italian and English (`data-l="it"` / `data-l="en"`)
- `styles.css` holds the styles. The brand tokens match the booking app (orange-600, Outfit + Manrope)
- `main.js` adds the language switch, the scroll reveal and the header shadow. The page works without it.

## Run locally

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8080
```

## Deploy

Upload the folder as-is to any static host (GitHub Pages, Netlify, Cloudflare Pages, etc.).

## Editing

- **Socials:** in `index.html`, search for `Social links` and replace the `href="#"` values with the real
  Instagram and Facebook profile URLs. A link left as `#` stays hidden.
- **Contacts:** the phone/WhatsApp number (`+39 0444 022494`, `wa.me/390444022494`), the email and the
  address appear in the header, hero, B2B, contact and footer sections, and in the JSON-LD block in `<head>`.
- The page intentionally shows no prices or offers, so it never needs updating for promotions.
