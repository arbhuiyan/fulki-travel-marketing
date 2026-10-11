# Fulki Travel — marketing site

A static, promotional landing page for Fulki Travel (Arzignano, VI): customer services, how it works,
B2B partner information, location and contacts. It's plain HTML/CSS/JS with no build step and no backend.

- `index.html` holds the content, in Italian and English (`data-l="it"` / `data-l="en"`)
- `styles.css` holds the styles. The brand tokens match the booking app (orange-600, Outfit + Manrope)
- `main.js` adds the language switch, the scroll reveal and the header shadow. The page works without it.

## Run locally

All asset paths use the base URL `/fulki-travel-marketing/`, matching the GitHub Pages address.
To preview, serve the folder that *contains* this repo, then open the page under that path:

```sh
cd ..   # the parent folder of fulki-travel-marketing
python3 -m http.server 8080
# open http://localhost:8080/fulki-travel-marketing/
```

## Deploy

`.github/workflows/pages.yml` runs on every push to the `ccr-3e37aced-4oujyd` branch. It can also be started by hand from the Actions tab.
It copies the site files into `_site` and publishes them to GitHub Pages at
https://arbhuiyan.github.io/fulki-travel-marketing/.

If you move the site to a different path or domain, update the `/fulki-travel-marketing/` paths in
`index.html`. That covers the favicon, `styles.css`, `main.js`, the canonical link and `og:url`.

## Editing

- **Socials:** in `index.html`, search for `Social links` and replace the `href="#"` values with the real
  Instagram and Facebook profile URLs. A link left as `#` stays hidden.
- **Contacts:** the phone/WhatsApp number (`+39 0444 022494`, `wa.me/390444022494`), the email and the
  address appear in the header, hero, B2B, contact and footer sections, and in the JSON-LD block in `<head>`.
- The page intentionally shows no prices or offers, so it never needs updating for promotions.
