"""Generate one page per language (/it/, /en/, /fr/, /es/, /de/, /bn/) and sitemap.xml from index.html.

index.html already holds every language; the CSS shows the one named by <html lang>. Each copy here sets
that attribute and swaps in a translated <title>, description, social tags and canonical URL, so search
engines can index each language at its own address (linked together with hreflang).

index.html is the only file to edit by hand. After changing it, run:  python3 tools/build_lang_pages.py
"""
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://fulkitravels.com"

PAGES = {
    "it": {
        "locale": "it_IT",
        "title": "Fulki Travel · Agenzia viaggi ad Arzignano",
        "description": "Fulki Travel: biglietti aerei per tutto il mondo con assistenza di persona. Agenzia viaggi in Via 4 Martiri, 44, Arzignano (VI). Diventa partner B2B.",
        "og_description": "Voli per tutto il mondo, con una persona vera al tuo fianco. Arzignano (VI).",
        "image_alt": "Fulki Travel, agenzia viaggi ad Arzignano (VI): voli per tutto il mondo, WhatsApp +39 0444 022494",
    },
    "en": {
        "locale": "en_GB",
        "title": "Fulki Travel · Travel agency in Arzignano, Italy",
        "description": "Fulki Travel: flight tickets worldwide with in-person support. Travel agency at Via 4 Martiri, 44, Arzignano (VI), Italy. Become a B2B partner.",
        "og_description": "Flights worldwide, with a real person by your side. Arzignano (VI), Italy.",
        "image_alt": "Fulki Travel, travel agency in Arzignano (VI), Italy: flights worldwide, WhatsApp +39 0444 022494",
    },
    "fr": {
        "locale": "fr_FR",
        "title": "Fulki Travel · Agence de voyages à Arzignano",
        "description": "Fulki Travel : billets d’avion pour le monde entier avec un accompagnement en personne. Agence de voyages Via 4 Martiri, 44, Arzignano (VI), Italie. Devenez partenaire B2B.",
        "og_description": "Des vols dans le monde entier, avec une vraie personne à vos côtés. Arzignano (VI), Italie.",
        "image_alt": "Fulki Travel, agence de voyages à Arzignano (VI), Italie : vols dans le monde entier, WhatsApp +39 0444 022494",
    },
    "es": {
        "locale": "es_ES",
        "title": "Fulki Travel · Agencia de viajes en Arzignano",
        "description": "Fulki Travel: billetes de avión a todo el mundo con atención en persona. Agencia de viajes en Via 4 Martiri, 44, Arzignano (VI), Italia. Hazte socio B2B.",
        "og_description": "Vuelos a todo el mundo, con una persona de verdad a tu lado. Arzignano (VI), Italia.",
        "image_alt": "Fulki Travel, agencia de viajes en Arzignano (VI), Italia: vuelos a todo el mundo, WhatsApp +39 0444 022494",
    },
    "de": {
        "locale": "de_DE",
        "title": "Fulki Travel · Reisebüro in Arzignano",
        "description": "Fulki Travel: Flugtickets weltweit mit persönlicher Betreuung. Reisebüro in der Via 4 Martiri, 44, Arzignano (VI), Italien. Werden Sie B2B-Partner.",
        "og_description": "Flüge weltweit, mit einem echten Menschen an Ihrer Seite. Arzignano (VI), Italien.",
        "image_alt": "Fulki Travel, Reisebüro in Arzignano (VI), Italien: Flüge weltweit, WhatsApp +39 0444 022494",
    },
    "bn": {
        "locale": "bn_BD",
        "title": "Fulki Travel · আরজিনিয়ানোর ট্রাভেল এজেন্সি",
        "description": "Fulki Travel: সারা বিশ্বের বিমান টিকেট, সাথে সরাসরি সহায়তা। ঠিকানা: Via 4 Martiri, 44, Arzignano (VI), ইতালি। B2B পার্টনার হতে যোগাযোগ করুন।",
        "og_description": "দেশে হোক বা বিদেশে, পুরো যাত্রায় আমরা আছি আপনার পাশে। Arzignano (VI), ইতালি।",
        "image_alt": "Fulki Travel, Arzignano (VI), ইতালির ট্রাভেল এজেন্সি: সারা বিশ্বের বিমান টিকেট, WhatsApp +39 0444 022494",
    },
}


def attr(text):
    return text.replace("&", "&amp;").replace('"', "&quot;")


def swap(html, pattern, value):
    """Replace the single match of pattern's group 1 with value."""
    new, n = re.subn(pattern, lambda m: m.group(0).replace(m.group(1), value), html, count=1)
    if n != 1:
        raise SystemExit(f"index.html: no match for {pattern}")
    return new


def page(source, lang, meta):
    url = f"{SITE}/{lang}/"
    html = swap(source, r'<html lang="([^"]+)"', lang)
    html = swap(html, r"<title>([^<]+)</title>", meta["title"].replace("&", "&amp;"))
    html = swap(html, r'<meta name="description" content="([^"]+)"', attr(meta["description"]))
    html = swap(html, r'<meta property="og:title" content="([^"]+)"', attr(meta["title"]))
    html = swap(html, r'<meta property="og:description" content="([^"]+)"', attr(meta["og_description"]))
    html = swap(html, r'<meta property="og:url" content="([^"]+)"', url)
    html = swap(html, r'<meta property="og:locale" content="([^"]+)"', meta["locale"])
    html = swap(html, r'<meta property="og:image:alt" content="([^"]+)"', attr(meta["image_alt"]))
    html = swap(html, r'<link rel="canonical" href="([^"]+)"', url)
    html = swap(html, r'<nav class="nav" aria-label="([^"]+)"', {"it": "Principale", "en": "Main", "fr": "Principal", "es": "Principal", "de": "Hauptmenü", "bn": "প্রধান মেনু"}[lang])
    # The language menu's current choice, before main.js runs.
    html = swap(html, r"<span data-lang-current>([^<]+)</span>", lang.upper())
    html = re.sub(
        r'(data-set-lang="(\w+)" aria-pressed=")(true|false)"',
        lambda m: f'{m.group(1)}{"true" if m.group(2) == lang else "false"}"',
        html,
    )
    return html.replace("<!doctype html>\n", "<!doctype html>\n<!-- Generated from /index.html by tools/build_lang_pages.py. Do not edit by hand. -->\n", 1)


def sitemap():
    today = date.today().isoformat()
    alternates = "\n".join(
        f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{SITE}/{lang}/"/>' for lang in PAGES
    ) + f'\n    <xhtml:link rel="alternate" hreflang="x-default" href="{SITE}/"/>'
    urls = [f"{SITE}/"] + [f"{SITE}/{lang}/" for lang in PAGES]
    entries = "\n".join(
        f"  <url>\n    <loc>{u}</loc>\n    <lastmod>{today}</lastmod>\n{alternates}\n  </url>" for u in urls
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        f"{entries}\n</urlset>\n"
    )


def main():
    source = (ROOT / "index.html").read_text(encoding="utf-8")
    for lang, meta in PAGES.items():
        out = ROOT / lang / "index.html"
        out.parent.mkdir(exist_ok=True)
        out.write_text(page(source, lang, meta), encoding="utf-8")
        print(f"wrote {out.relative_to(ROOT)}")
    (ROOT / "sitemap.xml").write_text(sitemap(), encoding="utf-8")
    print("wrote sitemap.xml")


if __name__ == "__main__":
    main()
