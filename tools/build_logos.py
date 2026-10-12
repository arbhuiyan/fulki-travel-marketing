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


def _bar(x, y, w, h, fill, r=0.12):
    return f'<rect x="{x:.2f}" y="{y:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{h * r:.2f}" fill="{fill}"/>'


def f_mark(style, ink, accent, size=512):
    """Icon only, no background: a bold F and a plane, in one of four arrangements."""
    s = size * 0.62
    st = s * 0.24
    x = (size - s) / 2
    y = (size - s) / 2
    stem = _bar(x, y, st, s, ink)
    if style == "arm":  # middle arm is the plane on its contrail
        return monogram_glyph(x, y, s, ink, accent)
    if style == "top":  # top arm is the plane on its contrail, middle arm stays solid
        y += s * 0.06
        stem = _bar(x, y, st, s - s * 0.06, ink)
        ps = s * 0.0072
        cy = y + 5.6 * ps
        px = x + s * 1.02 - 50 * ps
        arm = _bar(x, cy - 5.6 * ps, px - x, 11.2 * ps, accent, r=0)
        return stem + _bar(x, y + s * 0.44, s * 0.7, st * 0.85, ink) + arm + plane(px, cy, ps, accent)
    raise ValueError(style)


def _ribbon(pts, widths):
    """Filled outline of a polyline whose width varies point by point."""
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        x0, y0 = pts[max(i - 1, 0)]
        x1, y1 = pts[min(i + 1, len(pts) - 1)]
        dx, dy = x1 - x0, y1 - y0
        n = math.hypot(dx, dy) or 1
        nx, ny = -dy / n, dx / n
        h = widths[i] / 2
        left.append((x + nx * h, y + ny * h))
        right.append((x - nx * h, y - ny * h))
    ring = left + right[::-1]
    return "M" + "L".join(f"{px:.2f} {py:.2f}" for px, py in ring) + "Z"


def _f_path(x, y, s, corner, steps=60):
    """Centre line of the F's stem and top arm: bottom of the stem, up, round the corner, right."""
    r = s * corner
    pts = [(x, y + s - (s - r) * i / steps) for i in range(steps)]
    if r:
        pts += [(x + r - r * math.cos(math.pi / 2 * i / 24), y + r - r * math.sin(math.pi / 2 * i / 24)) for i in range(25)]
    pts += [(x + r + (s * 0.62 - r) * i / steps, y) for i in range(1, steps + 1)]
    return pts


def f_trace(style, ink, accent, size=512, uid="a"):
    """Icon only: the F drawn as the contrail of a plane that took off at the bottom of the stem.

    The trail is oldest, widest and faintest at the bottom, and narrows into the fuselage at the top."""
    s = size * 0.6
    ps = s * 0.0066
    w_end = 11.2 * ps
    w_start = w_end * (1.75 if style != "line" else 1.0)
    x = (size - s * 0.62 - 96 * ps) / 2 + w_start / 2
    y = (size - s) / 2 + 2 * ps
    pts = _f_path(x, y, s, 0.0 if style == "sharp" else 0.16)
    n = len(pts)
    widths = [w_start + (w_end - w_start) * (i / (n - 1)) ** 0.8 for i in range(n)]
    shapes = [f'<path d="{_ribbon(pts, widths)}"/>',
              f'<circle cx="{pts[0][0]:.2f}" cy="{pts[0][1]:.2f}" r="{widths[0] / 2:.2f}"/>']
    # middle arm: a second wisp drifting off the stem
    my = y + s * 0.5
    mw = w_start + (w_end - w_start) * 0.5
    mid = [(x + i * s * 0.4 / 30, my) for i in range(31)]
    mws = [mw * (1 - 0.3 * i / 30) for i in range(31)]
    shapes += [f'<path d="{_ribbon(mid, mws)}"/>', f'<circle cx="{mid[-1][0]:.2f}" cy="{my:.2f}" r="{mws[-1] / 2:.2f}"/>']
    # Shapes are drawn solid and faded with one mask, so overlaps never double up.
    defs, mask = "", []
    if style != "line":
        defs += (f'<linearGradient id="g{uid}" x1="0" y1="{y + s + w_start:.2f}" x2="0" y2="{y:.2f}" gradientUnits="userSpaceOnUse">'
                 f'<stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.92"/>'
                 f'<stop offset="1" stop-color="#fff"/></linearGradient>')
        mask.append(f'<rect width="{size}" height="{size}" fill="url(#g{uid})"/>')
    if style == "dash":
        mask += [f'<rect x="0" y="{y + s - k * s * 0.09:.2f}" width="{size}" height="{s * 0.035:.2f}" fill="#000"/>'
                 for k in range(1, 5)]
    g = f'<g fill="{ink}">{"".join(shapes)}</g>'
    if mask:
        defs += f'<mask id="m{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="{size}" height="{size}">{"".join(mask)}</mask>'
        g = f'<g fill="{ink}" mask="url(#m{uid})">{"".join(shapes)}</g>'
    body = g
    end = pts[-1]
    body += plane(end[0] + 44 * ps, end[1], ps, accent)
    out = svg(size, size, body, TITLE)
    return out.replace("<title>", f"<defs>{defs}</defs><title>", 1) if defs else out


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

# Icon only, transparent background: black F + plane, four arrangements x three colourways.
F_STYLES = ["arm", "top"]
F_COLOURS = {"black": (INK, INK), "black-orange": (INK, ORANGE), "white": (WHITE, WHITE)}
for _st in F_STYLES:
    for _cn, (_ink, _acc) in F_COLOURS.items():
        VARIANTS[f"f-mark/fulki-f-{_st}-{_cn}.svg"] = (lambda st=_st, i=_ink, a=_acc: f_icon(st, i, a))

# Icon only, transparent background: the F is the contrail the plane leaves behind it.
for _st in ["trace", "sharp", "line", "dash"]:
    for _cn, (_ink, _acc) in F_COLOURS.items():
        VARIANTS[f"f-trace/fulki-f-trace-{_st}-{_cn}.svg"] = (
            lambda st=_st, i=_ink, a=_acc, u=f"{_st}{_cn}": f_trace(st, i, a, uid=u.replace("-", "")))

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, make in VARIANTS.items():
        (OUT / name).parent.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_text(make())
        print("wrote", OUT / name)
