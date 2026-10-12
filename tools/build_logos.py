"""Generate the Fulki Travel & Tours logo set (SVG) from the site's Outfit font.

Text is converted to outlines, so the SVGs render the same everywhere without the font.
Run: python3 tools/build_logos.py   (needs: pip install fonttools brotli uharfbuzz)
"""
import io
import math
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / "assets/fonts/outfit.woff2"
OUT = ROOT / "assets/logo"

ORANGE = "#EA580C"
INK = "#171717"
NIGHT = "#0C0A09"
WHITE = "#FFFFFF"

_fonts = {}


def font(weight):
    if weight not in _fonts:
        tt = instancer.instantiateVariableFont(TTFont(FONT), {"wght": weight})
        tt.flavor = None
        buf = io.BytesIO()
        tt.save(buf)
        _fonts[weight] = (tt, hb.Font(hb.Face(buf.getvalue())))
    return _fonts[weight]


def text_path(s, weight, size, tracking=0.0):
    """Return (svg path d, width, cap height) for s, baseline at y=0, starting at x=0."""
    tt, hbf = font(weight)
    upm = tt["head"].unitsPerEm
    buf = hb.Buffer()
    buf.add_str(s)
    buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": False})
    gs = tt.getGlyphSet()
    order = tt.getGlyphOrder()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
    k = size / upm
    x = 0.0
    n = len(buf.glyph_infos)
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        gs[name].draw(TransformPen(pen, (k, 0, 0, -k, x + pos.x_offset * k, 0)))
        x += pos.x_advance * k
        if i < n - 1:
            x += tracking * size
    cap = tt["OS/2"].sCapHeight * k
    return pen.getCommands(), x, cap


def fit_tracking(s, weight, size, width):
    """Tracking (in em) that makes s exactly `width` wide."""
    _, w0, _ = text_path(s, weight, size)
    return (width - w0) / ((len(s) - 1) * size)


# Plane seen from above, nose pointing right, centred on (0, 0), ~100 units nose to tail.
PLANE = (
    "M50 0C50 -3.6 46.5 -5.6 41 -5.6H15L-4 -40.5C-5 -42.3 -6.6 -43 -8.6 -43H-13.4"
    "C-15 -43 -15.9 -41.8 -15.4 -40.3L-6.4 -5.6H-31L-39.6 -17.4C-40.4 -18.5 -41.4 -19 -42.8 -19"
    "H-46.4C-47.7 -19 -48.4 -18 -48 -16.8L-44.2 -4.2C-44.6 -2.8 -44.6 2.8 -44.2 4.2L-48 16.8"
    "C-48.4 18 -47.7 19 -46.4 19H-42.8C-41.4 19 -40.4 18.5 -39.6 17.4L-31 5.6H-6.4L-15.4 40.3"
    "C-15.9 41.8 -15 43 -13.4 43H-8.6C-6.6 43 -5 42.3 -4 40.5L15 5.6H41C46.5 5.6 50 3.6 50 0Z"
)


def plane(cx, cy, scale, fill, rotate=0):
    return (f'<path transform="translate({cx:.2f} {cy:.2f}) rotate({rotate}) scale({scale:.4f})" '
            f'fill="{fill}" d="{PLANE}"/>')


def trail(x0, x1, cy, thick, fill):
    """Tapered contrail: a hairline at x0 swelling to `thick` with a round end at x1."""
    r = thick / 2
    return (f'<path fill="{fill}" d="M{x0:.2f} {cy:.2f}L{x1 - r:.2f} {cy - r:.2f}'
            f'A{r:.2f} {r:.2f} 0 0 1 {x1 - r:.2f} {cy + r:.2f}Z"/>')


def gradient(gid, x0, x1, color, start_opacity=0.0):
    return (f'<linearGradient id="{gid}" x1="{x0:.2f}" x2="{x1:.2f}" y1="0" y2="0" gradientUnits="userSpaceOnUse">'
            f'<stop offset="0" stop-color="{color}" stop-opacity="{start_opacity}"/>'
            f'<stop offset="0.55" stop-color="{color}" stop-opacity="0.75"/>'
            f'<stop offset="1" stop-color="{color}"/></linearGradient>')


def svg(w, h, body, title, defs="", bg=None, rx=0):
    bgr = f'<rect width="{w}" height="{h}" rx="{rx}" fill="{bg}"/>' if bg else ""
    d = f"<defs>{defs}</defs>" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" width="{w:.0f}" height="{h:.0f}" '
            f'role="img" aria-label="{title}"><title>{title}</title>{d}{bgr}{body}</svg>\n')


TITLE = "Fulki Travel &amp; Tours"


def stacked(ink, accent, tagline_ink, bg=None, mono=False, gid="t"):
    """Primary lockup: FULKI / contrail + plane / TRAVEL & TOURS."""
    pad = 80
    d1, w1, cap1 = text_path("FULKI", 800, 240, tracking=0.06)
    tag_size = 62
    tr = fit_tracking("TRAVEL & TOURS", 500, tag_size, w1)
    d2, w2, cap2 = text_path("TRAVEL & TOURS", 500, tag_size, tracking=tr)
    y1 = pad + cap1
    line_y = y1 + 108
    y2 = line_y + 96 + cap2
    W, H = w1 + 2 * pad, y2 + pad
    ps = 1.0
    px = pad + w1 - 50 * ps
    tx1 = px - 40 * ps  # the contrail runs into the tail of the fuselage
    defs = "" if mono else gradient(gid, pad, tx1, accent)
    tfill = accent if mono else f"url(#{gid})"
    body = (f'<path fill="{ink}" transform="translate({pad} {y1:.2f})" d="{d1}"/>'
            + trail(pad, tx1, line_y, 11.2 * ps, tfill)
            + plane(px, line_y, ps, accent)
            + f'<path fill="{tagline_ink}" transform="translate({pad} {y2:.2f})" d="{d2}"/>')
    return svg(W, H, body, TITLE, defs, bg)


def monogram_glyph(x, y, s, ink, accent):
    """Bold geometric F whose middle arm is a contrail ending in a plane. Box: s wide, s tall at (x, y)."""
    st = s * 0.24  # stroke weight
    top = f'<rect x="{x:.2f}" y="{y:.2f}" width="{s * 0.92:.2f}" height="{st:.2f}" rx="{st * 0.12:.2f}" fill="{ink}"/>'
    stem = f'<rect x="{x:.2f}" y="{y:.2f}" width="{st:.2f}" height="{s:.2f}" rx="{st * 0.12:.2f}" fill="{ink}"/>'
    cy = y + s * 0.6
    ps = s * 0.0068
    px = x + s * 1.02 - 50 * ps
    arm = f'<rect x="{x + st * 0.5:.2f}" y="{cy - 5.6 * ps:.2f}" width="{px - x - st * 0.5:.2f}" height="{11.2 * ps:.2f}" fill="{accent}"/>'
    return top + stem + arm + plane(px, cy, ps, accent)


def f_flight(style, ink, accent, size=512):
    """Icon only: a monoline F drawn by a plane. It climbed the stem from the bottom, banked right
    along the top arm, and is still flying at its tip: the top arm is the plane's fuselage."""
    w = size * 0.078  # stroke weight
    k = 0.74  # plane size relative to the stroke
    x0 = (size - 7.6 * w) / 2 + w / 2
    yt = (size - 8.2 * w) / 2 + 0.5 * w
    yb = yt + 8.2 * w
    xn = x0 + 7.6 * w  # nose
    ym = yt + 3.9 * w
    r = 1.5 * w
    line = 'fill="none" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round"'

    def stroke(d, colour, sw=w):
        return f'<path d="{d}" stroke="{colour}" {line.format(sw=sw)}/>'

    def poly(pts, colour):
        d = "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"
        return f'<path d="{d}" fill="{colour}" stroke="{colour}" stroke-width="{w * 0.3:.2f}" stroke-linejoin="round"/>'

    def wings(cy, colour, scale=k):
        out = ""
        for sgn in (-1, 1):
            u = scale * w
            out += poly([(xn - 1.2 * u, cy), (xn - 2.7 * u, cy + sgn * 2.2 * u),
                         (xn - 3.4 * u, cy + sgn * 2.2 * u), (xn - 2.9 * u, cy)], colour)
            out += poly([(xn - 4.4 * u, cy), (xn - 5.0 * u, cy + sgn * 0.95 * u),
                         (xn - 5.5 * u, cy + sgn * 0.95 * u), (xn - 5.3 * u, cy)], colour)
        return out

    corner = f"M{x0:.2f} {yt + r:.2f}Q{x0:.2f} {yt:.2f} {x0 + r:.2f} {yt:.2f}"
    tail_x = xn - 5.2 * k * w
    gap = 0.55 * w
    if style == "twin":  # two engine contrails form the F and converge into the plane
        t, o = w * 0.4, w * 0.38
        body = ""
        for k2 in (-1, 1):
            xo, yo = x0 + k2 * o, yt + k2 * o
            body += stroke(f"M{xo:.2f} {yb:.2f}V{yt + r:.2f}Q{xo:.2f} {yo:.2f} {x0 + r:.2f} {yo:.2f}H{tail_x + 0.3 * w:.2f}", ink, t)
            body += stroke(f"M{x0 + o + gap:.2f} {ym + k2 * o:.2f}H{x0 + 4.0 * w:.2f}", ink, t)
        fus = stroke(f"M{tail_x:.2f} {yt:.2f}H{xn:.2f}", accent, w * 0.9)
        return body + wings(yt, accent) + fus
    if style == "dots":  # the trail starts as dots at the bottom
        cut = yt + 5.4 * w
        body = stroke(f"M{x0:.2f} {cut:.2f}V{yt + r:.2f}", ink)
        for dy, rad in [(1.25, 0.5), (2.2, 0.36), (2.95, 0.24)]:
            body += f'<circle cx="{x0:.2f}" cy="{cut + dy * w:.2f}" r="{rad * w:.2f}" fill="{ink}"/>'
    elif style == "gap":  # cut into segments, like a trail breaking up behind the plane
        body = stroke(f"M{x0:.2f} {yb:.2f}V{yb - 0.6 * w:.2f}", ink)
        body += stroke(f"M{x0:.2f} {yb - 0.6 * w - gap * 2.6:.2f}V{yt + r:.2f}", ink)
    else:
        body = stroke(f"M{x0:.2f} {yb:.2f}V{yt + r:.2f}", ink)
    body += stroke(f"{corner}H{tail_x:.2f}", ink)
    mid_x0 = x0 + (w + gap if style in ("gap", "dots") else 0)
    body += stroke(f"M{mid_x0:.2f} {ym:.2f}H{x0 + 4.0 * w:.2f}", ink)
    return body + stroke(f"M{tail_x:.2f} {yt:.2f}H{xn:.2f}", accent) + wings(yt, accent)


SKIES = {
    "day": [("0", "#3B97DD"), ("0.6", "#7EC4F0"), ("1", "#B9E2F8")],
    "sunset": [("0", "#EA580C"), ("0.55", "#F98A3C"), ("1", "#FDBA74")],
    "dusk": [("0", "#1E3A8A"), ("0.55", "#6D5BBA"), ("1", "#F6A57A")],
}


def plane_modern(xn, cy, u, colour):
    """Flat modern plane, nose at (xn, cy) pointing right; u is the size unit."""
    def poly(pts):
        d = "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in pts) + "Z"
        return f'<path d="{d}" fill="{colour}" stroke="{colour}" stroke-width="{u * 0.4:.2f}" stroke-linejoin="round"/>'
    out = (f'<path d="M{xn - 5.2 * u:.2f} {cy:.2f}H{xn - 0.7 * u:.2f}" stroke="{colour}" '
           f'stroke-width="{1.35 * u:.2f}" stroke-linecap="round"/>')
    for sgn in (-1, 1):
        out += poly([(xn - 1.2 * u, cy), (xn - 2.7 * u, cy + sgn * 2.2 * u), (xn - 3.4 * u, cy + sgn * 2.2 * u), (xn - 2.9 * u, cy)])
        out += poly([(xn - 4.4 * u, cy), (xn - 5.0 * u, cy + sgn * 0.95 * u), (xn - 5.5 * u, cy + sgn * 0.95 * u), (xn - 5.3 * u, cy)])
    return out


def f_sky(sky, plane_colour=WHITE, shape="square", clouds=False, size=512, uid="s"):
    """Icon tile: a plane in a light sky whose contrail traces the F.

    Near the plane the contrail is two crisp engine trails; further back they spread into one soft trail."""
    w = size * 0.068
    u = w * 0.78
    x0 = (size - 7.6 * w) / 2 + w * 0.45
    yt = (size - 8.2 * w) / 2 + 0.7 * w
    yb = yt + 8.2 * w + w  # runs off the bottom edge
    xn = x0 + 7.6 * w
    ym = yt + 3.9 * w
    r = 1.6 * w
    tail = xn - 5.2 * u
    main = f"M{x0:.2f} {yb:.2f}V{yt + r:.2f}Q{x0:.2f} {yt:.2f} {x0 + r:.2f} {yt:.2f}H{tail:.2f}"
    mid = f"M{x0:.2f} {ym:.2f}H{x0 + 4.0 * w:.2f}"
    rx = size * 0.22 if shape == "square" else size / 2
    stops = "".join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in SKIES[sky])
    defs = (f'<linearGradient id="sky{uid}" x1="0" y1="0" x2="0.35" y2="1">{stops}</linearGradient>'
            f'<clipPath id="clip{uid}"><rect width="{size}" height="{size}" rx="{rx:.2f}"/></clipPath>'
            f'<filter id="soft{uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{w * 0.22:.2f}"/></filter>'
            f'<filter id="haze{uid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="{w * 0.9:.2f}"/></filter>'
            f'<filter id="shadow{uid}" x="-30%" y="-30%" width="160%" height="160%">'
            f'<feDropShadow dx="0" dy="{w * 0.12:.2f}" stdDeviation="{w * 0.12:.2f}" flood-color="#0C4A6E" flood-opacity="0.25"/></filter>'
            # crisp trails fade out going back in time (downwards / left); the soft trail fades in
            f'<linearGradient id="young{uid}" gradientUnits="userSpaceOnUse" x1="{xn:.2f}" y1="{yt:.2f}" x2="{x0:.2f}" y2="{yt + 5.5 * w:.2f}">'
            f'<stop offset="0" stop-color="#fff"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<linearGradient id="old{uid}" gradientUnits="userSpaceOnUse" x1="{xn:.2f}" y1="{yt:.2f}" x2="{x0:.2f}" y2="{yt + 6 * w:.2f}">'
            f'<stop offset="0.05" stop-color="#fff" stop-opacity="0.15"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.95"/><stop offset="1" stop-color="#fff"/></linearGradient>'
            f'<mask id="my{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="{size}" height="{size}"><rect width="{size}" height="{size}" fill="url(#young{uid})"/></mask>'
            f'<mask id="mo{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="{size}" height="{size}"><rect width="{size}" height="{size}" fill="url(#old{uid})"/></mask>')
    body = f'<rect width="{size}" height="{size}" fill="url(#sky{uid})"/>'
    if clouds:  # soft cumulus: overlapping puffs, lightly blurred
        banks = [(0.16, 0.97, 1.0), (0.5, 1.0, 1.25), (0.86, 0.96, 1.0), (0.84, 0.6, 0.42)]
        puffs = ""
        for cx, cy, sc in banks:
            for dx, dy, rr in [(-0.09, 0.02, 0.06), (-0.03, -0.03, 0.08), (0.05, -0.01, 0.07), (0.11, 0.03, 0.05), (0.0, 0.04, 0.09)]:
                puffs += f'<circle cx="{(cx + dx * sc) * size:.1f}" cy="{(cy + dy * sc) * size:.1f}" r="{rr * sc * size:.1f}"/>'
        body += f'<g fill="#fff" opacity="0.85" filter="url(#cloud{uid})">{puffs}</g>'
        defs += f'<filter id="cloud{uid}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="{size * 0.006:.2f}"/></filter>'
    soft = (f'<g mask="url(#mo{uid})" filter="url(#soft{uid})" fill="none" stroke="#fff" stroke-linecap="round">'
            f'<path d="{main}" stroke-width="{w * 1.15:.2f}"/><path d="{mid}" stroke-width="{w * 1.05:.2f}"/></g>')
    o, t = w * 0.24, w * 0.26
    twin = ""
    for k in (-1, 1):
        xo, yo = x0 + k * o, yt + k * o
        twin += (f'<path d="M{xo:.2f} {yb:.2f}V{yt + r:.2f}Q{xo:.2f} {yo:.2f} {x0 + r:.2f} {yo:.2f}H{tail + u:.2f}" stroke-width="{t:.2f}"/>'
                 f'<path d="M{x0:.2f} {ym + k * o:.2f}H{x0 + 4.0 * w:.2f}" stroke-width="{t:.2f}"/>')
    crisp = f'<g mask="url(#my{uid})" fill="none" stroke="#fff" stroke-linecap="round">{twin}</g>'
    pl = f'<g filter="url(#shadow{uid})">{plane_modern(xn, yt, u, plane_colour)}</g>'
    return svg(size, size, f'<g clip-path="url(#clip{uid})">{body}{soft}{crisp}{pl}</g>', TITLE).replace(
        "<title>", f"<defs>{defs}</defs><title>", 1)


def f_flight_icon(style, ink, accent):
    return svg(512, 512, f_flight(style, ink, accent), TITLE)


def f_icon(style, ink, accent, size=512):
    out = f_mark(style, ink, accent, size)
    defs, body = out if isinstance(out, tuple) else ("", out)
    if defs:
        return svg(size, size, body, TITLE).replace('<title>', f'<defs>{defs}</defs><title>', 1)
    return svg(size, size, body, TITLE)


def icon(bg, ink, accent, size=512, shape="square"):
    s = size * 0.5
    x = (size - s * 1.0) / 2 - size * 0.01
    y = (size - s) / 2
    rx = size * 0.22 if shape == "square" else size / 2
    body = monogram_glyph(x, y, s, ink, accent)
    return svg(size, size, body, TITLE, bg=bg, rx=rx)


def plane_badge(bg, fg, size=512):
    """Icon-only: the plane on a circle, climbing out of a curved contrail."""
    a, ctl, end = (size * 0.12, size * 0.74), (size * 0.33, size * 0.74), (size * 0.44, size * 0.64)
    dx, dy = end[0] - ctl[0], end[1] - ctl[1]
    n = math.hypot(dx, dy)
    ux, uy = dx / n, dy / n
    ps = size * 0.004
    cx, cy = end[0] + ux * 44 * ps, end[1] + uy * 44 * ps  # tail sits on the end of the contrail
    arc = (f'<path d="M{a[0]:.2f} {a[1]:.2f}Q{ctl[0]:.2f} {ctl[1]:.2f} {end[0]:.2f} {end[1]:.2f}" fill="none" '
           f'stroke="{fg}" stroke-width="{11.2 * ps:.2f}" stroke-linecap="round" opacity="0.6"/>')
    body = arc + plane(cx, cy, ps, fg, rotate=math.degrees(math.atan2(dy, dx)))
    return svg(size, size, body, TITLE, bg=bg, rx=size / 2)


def horizontal(ink, accent, tagline_ink, bg=None):
    """Header lockup: monogram + FULKI over TRAVEL & TOURS."""
    pad = 48
    m = 180
    d1, w1, cap1 = text_path("FULKI", 800, 150, tracking=0.05)
    tag = 38
    tr = fit_tracking("TRAVEL & TOURS", 500, tag, w1)
    d2, _, cap2 = text_path("TRAVEL & TOURS", 500, tag, tracking=tr)
    gap = 56
    tx = pad + m + gap
    block = cap1 + 40 + cap2
    H = max(m, block) + 2 * pad
    ty = (H - block) / 2 + cap1
    W = tx + w1 + pad
    body = (monogram_glyph(pad, (H - m) / 2, m, ink, accent)
            + f'<path fill="{ink}" transform="translate({tx:.2f} {ty:.2f})" d="{d1}"/>'
            + f'<path fill="{tagline_ink}" transform="translate({tx:.2f} {ty + 40 + cap2:.2f})" d="{d2}"/>')
    return svg(W, H, body, TITLE, bg=bg)


VARIANTS = {
    # Full lockups
    "fulki-travel-tours-primary.svg": lambda: stacked(INK, ORANGE, INK),
    "fulki-travel-tours-reversed.svg": lambda: stacked(WHITE, ORANGE, "#D6D3D1", bg=NIGHT, gid="tr"),
    "fulki-travel-tours-on-orange.svg": lambda: stacked(WHITE, WHITE, WHITE, bg=ORANGE, gid="to"),
    "fulki-travel-tours-mono-black.svg": lambda: stacked(INK, INK, INK, mono=True),
    "fulki-travel-tours-horizontal.svg": lambda: horizontal(INK, ORANGE, "#57534E"),
    "fulki-travel-tours-horizontal-reversed.svg": lambda: horizontal(WHITE, ORANGE, "#D6D3D1", bg=NIGHT),
    # Icon only
    "fulki-icon-orange.svg": lambda: icon(ORANGE, WHITE, NIGHT),
    "fulki-icon-dark.svg": lambda: icon(NIGHT, WHITE, ORANGE),
    "fulki-icon-light.svg": lambda: icon("#FFF7ED", INK, ORANGE),
    "fulki-icon-round.svg": lambda: icon(ORANGE, WHITE, NIGHT, shape="round"),
    "fulki-icon-plane.svg": lambda: plane_badge(ORANGE, WHITE),
}

F_COLOURS = {"black": (INK, INK), "black-orange": (INK, ORANGE), "white": (WHITE, WHITE)}
# Icon only, transparent background: a modern monoline F drawn by the plane that flew it.
for _st in ["solid", "gap", "dots", "twin"]:
    for _cn, (_ink, _acc) in F_COLOURS.items():
        VARIANTS[f"f-flight/fulki-f-flight-{_st}-{_cn}.svg"] = (
            lambda st=_st, i=_ink, a=_acc: f_flight_icon(st, i, a))

# Icon tiles: a plane in a light sky whose contrail traces the F.
SKY_ICONS = {
    "day": dict(sky="day"),
    "day-orange-plane": dict(sky="day", plane_colour=ORANGE),
    "day-clouds": dict(sky="day", clouds=True),
    "sunset": dict(sky="sunset"),
    "dusk": dict(sky="dusk"),
}
for _n, _kw in SKY_ICONS.items():
    for _shape in ("square", "round"):
        VARIANTS[f"f-sky/fulki-f-sky-{_n}-{_shape}.svg"] = (
            lambda kw=_kw, sh=_shape, u=f"{_n}{_shape}".replace("-", ""): f_sky(shape=sh, uid=u, **kw))

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, make in VARIANTS.items():
        (OUT / name).parent.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_text(make())
        print("wrote", OUT / name)
