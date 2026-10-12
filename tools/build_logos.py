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


def signature(cx, baseline, width, fill):
    """Small FULKI + plane, centred on cx, for the space under the F."""
    size = width * 0.24
    d, tw, cap = text_path("FULKI", 700, size, tracking=0.06)
    ps = cap * 0.0105  # plane about as tall as the caps
    gap = cap * 0.35
    pw = 100 * ps
    x0 = cx - (tw + gap + pw) / 2
    return (f'<path fill="{fill}" transform="translate({x0:.2f} {baseline:.2f})" d="{d}"/>'
            + plane(x0 + tw + gap + pw / 2, baseline - cap / 2, ps, fill))


def flap_f(x, y, fw, fh, card_top, card_bot, glyph, glyph_bot, uid, hinge="#000", sig=True):
    """A split-flap card at (x, y) showing F, with the split line running through the middle."""
    rx = fw * 0.09
    split = fh * 0.012
    mid = y + fh / 2
    clip = f"fc{uid}"
    defs = (f'<clipPath id="{clip}t"><rect x="{x:.2f}" y="{y:.2f}" width="{fw:.2f}" height="{fh / 2 - split:.2f}"/></clipPath>'
            f'<clipPath id="{clip}b"><rect x="{x:.2f}" y="{mid + split:.2f}" width="{fw:.2f}" height="{fh / 2 - split:.2f}"/></clipPath>'
            f'<linearGradient id="{clip}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.35"/>'
            f'<stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>')
    # F: bold, slightly condensed, square ends, like a departure-board face
    if sig:  # F sits higher to leave room for FULKI + plane under it
        gw, gh = fw * 0.4, fh * 0.48
        gx, gy = x + (fw - gw) / 2 + fw * 0.02, y + fh * 0.12
    else:
        gw, gh = fw * 0.5, fh * 0.64
        gx, gy = x + (fw - gw) / 2 + fw * 0.02, y + (fh - gh) / 2
    t = gw * 0.34
    f_shape = (f'<rect x="{gx:.2f}" y="{gy:.2f}" width="{t:.2f}" height="{gh:.2f}"/>'
               f'<rect x="{gx:.2f}" y="{gy:.2f}" width="{gw:.2f}" height="{t * 0.88:.2f}"/>'
               f'<rect x="{gx:.2f}" y="{gy + gh * 0.37:.2f}" width="{gw * 0.82:.2f}" height="{t * 0.8:.2f}"/>')
    card = f'<rect x="{x:.2f}" y="{y:.2f}" width="{fw:.2f}" height="{fh:.2f}" rx="{rx:.2f}"'
    body = (f'<g clip-path="url(#{clip}t)">{card} fill="{card_top}"/><g fill="{glyph}">{f_shape}</g></g>'
            f'<g clip-path="url(#{clip}b)">{card} fill="{card_bot}"/><g fill="{glyph_bot}">{f_shape}</g>'
            f'<rect x="{x:.2f}" y="{mid + split:.2f}" width="{fw:.2f}" height="{fh * 0.07:.2f}" fill="url(#{clip}s)"/>'
            + (signature(x + fw / 2, y + fh * 0.86, fw * 0.8, glyph_bot) if sig else "") + '</g>'
            f'<rect x="{x:.2f}" y="{mid - split:.2f}" width="{fw:.2f}" height="{split * 2:.2f}" fill="{hinge}"/>')
    # hinge pins either side of the split
    pw, ph = fw * 0.035, fh * 0.07
    for px in (x - pw * 0.4, x + fw - pw * 0.6):
        body += f'<rect x="{px:.2f}" y="{mid - ph / 2:.2f}" width="{pw:.2f}" height="{ph:.2f}" rx="{pw * 0.3:.2f}" fill="{card_top}" opacity="0.9"/>'
    return defs, body


# 9 x 7 board; the F card covers the middle of rows 1-5, so those rows show a departure time split around it.
# The bottom row spells the name in the card's colours ("^" is the plane).
BOARD_ROWS = [" DEPARTS ", "09     45", "10     30", "12     05", "14     20", "16     40", " FULKI ^ "]


def board_cells(size, cols, rows, cell_fill, char_fill, skip, split_opacity=0.55, pad=0.06, brand=None):
    """Background of small split-flap cells spelling out departures. `skip(c, r)` leaves a cell empty."""
    pad = size * pad
    cw = (size - 2 * pad) / cols
    ch = cw * 1.32
    top = (size - rows * ch) / 2
    out = ""
    for r in range(rows):
        row = BOARD_ROWS[r % len(BOARD_ROWS)]
        for c in range(cols):
            if skip(c, r) or (c in (0, cols - 1) and r in (0, rows - 1)):  # keep the tile's rounded corners clear
                continue
            cx, cy = pad + c * cw + cw * 0.06, top + r * ch + ch * 0.06
            w, h = cw * 0.88, ch * 0.88
            chr_ = row[c] if c < len(row) else " "
            cf, tf = (brand if brand and r == rows - 1 and chr_.strip() else (cell_fill, char_fill))
            out += f'<rect x="{cx:.2f}" y="{cy:.2f}" width="{w:.2f}" height="{h:.2f}" rx="{w * 0.12:.2f}" fill="{cf}"/>'
            if chr_ == "^":
                out += plane(cx + w / 2, cy + h / 2, w * 0.0088, tf)
            elif chr_.strip():
                d, gw, cap = text_path(chr_, 700 if cf != cell_fill else 600, h * 0.62)
                out += (f'<path fill="{tf}" transform="translate({cx + (w - gw) / 2:.2f} {cy + (h + cap) / 2:.2f})" d="{d}"/>')
            out += f'<rect x="{cx:.2f}" y="{cy + h / 2 - h * 0.025:.2f}" width="{w:.2f}" height="{h * 0.05:.2f}" fill="#000" opacity="{split_opacity}"/>'
    return out


FLAP_THEMES = {
    # name: tile, card top, card bottom, glyph, glyph bottom
    "black": ("#0C0A09", "#2A2725", "#232120", "#F5F5F4", "#E7E5E4"),
    "black-orange": ("#0C0A09", "#2A2725", "#232120", "#F97316", "#EA580C"),
    "black-amber": ("#0C0A09", "#2A2725", "#232120", "#FBBF24", "#F59E0B"),
    "orange": ("#EA580C", "#1C1917", "#171412", "#FFFFFF", "#F5F5F4"),
    "light": ("#F5F5F4", "#FFFFFF", "#F3F2F1", "#171717", "#262626"),
}


def flap_icon(theme, board=False, shape="square", size=512, uid="f"):
    tile, top, bot, g, gb = FLAP_THEMES[theme]
    rx = size * 0.22 if shape == "square" else size / 2
    hinge = "#000" if theme != "light" else "#D6D3D1"
    defs = f'<clipPath id="tile{uid}"><rect width="{size}" height="{size}" rx="{rx:.2f}"/></clipPath>'
    body = f'<rect width="{size}" height="{size}" fill="{tile}"/>'
    if board:
        fw, fh = size * 0.44, size * 0.56
    else:
        fw, fh = size * 0.62, size * 0.76
    x, y = (size - fw) / 2, (size - fh) / 2
    if board:
        light = theme == "light"
        cell = "#E7E5E4" if light else ("#292524" if theme != "orange" else "#C2410C")
        char = "#A8A29E" if light else ("#57534E" if theme != "orange" else "#FDBA74")
        cols, rows = 9, 7
        pad = size * 0.075
        cw = (size - 2 * pad) / cols
        ch = cw * 1.32
        tp = (size - rows * ch) / 2

        def skip(c, r):
            cx0, cy0 = pad + c * cw, tp + r * ch
            return cx0 + cw > x - cw * 0.15 and cx0 < x + fw + cw * 0.15 and cy0 + ch > y - ch * 0.1 and cy0 < y + fh + ch * 0.1
        body += board_cells(size, cols, rows, cell, char, skip, 0.12 if light else 0.55, 0.075, brand=(top, g))
    d, b = flap_f(x, y, fw, fh, top, bot, g, gb, uid, hinge, sig=not board)
    shadow = (f'<filter id="sh{uid}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="{size * 0.012:.2f}" '
              f'stdDeviation="{size * 0.018:.2f}" flood-color="#000" flood-opacity="{0.15 if theme == "light" else 0.5}"/></filter>')
    body += f'<g filter="url(#sh{uid})">{b}</g>'
    return svg(size, size, f'<g clip-path="url(#tile{uid})">{body}</g>', TITLE).replace(
        "<title>", f"<defs>{defs}{d}{shadow}</defs><title>", 1)


# 5 x 7 dot-matrix F, as on LED departure displays
DOT_F = ["11111", "10000", "10000", "11110", "10000", "10000", "10000"]


def led_icon(on, off, tile, shape="square", size=512, uid="l"):
    rx = size * 0.22 if shape == "square" else size / 2
    cols, rows = 7, 9  # F sits in the middle with one blank ring of dots around it
    pitch = size * 0.07
    r = pitch * 0.38
    ox = (size - (cols - 1) * pitch) / 2
    oy = (size - (rows - 1) * pitch) / 2 - size * 0.085
    dots = ""
    for rr in range(rows):
        for cc in range(cols):
            lit = 1 <= rr <= 7 and 1 <= cc <= 5 and DOT_F[rr - 1][cc - 1] == "1"
            dots += f'<circle cx="{ox + cc * pitch:.2f}" cy="{oy + rr * pitch:.2f}" r="{r:.2f}" fill="{on if lit else off}"' + (
                f' filter="url(#glow{uid})"/>' if lit else "/>")
    defs = (f'<filter id="glow{uid}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="{r * 0.35:.2f}" result="b"/>'
            f'<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>')
    dots += signature(size / 2, oy + (rows - 1) * pitch + size * 0.16, size * 0.56, on)
    return svg(size, size, f'<rect width="{size}" height="{size}" rx="{rx:.2f}" fill="{tile}"/>{dots}', TITLE).replace(
        "<title>", f"<defs>{defs}</defs><title>", 1)


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

# Icon only: departure-board F.
for _t in FLAP_THEMES:
    VARIANTS[f"f-board/fulki-f-flap-{_t}.svg"] = (lambda t=_t: flap_icon(t, uid=f"a{t.replace('-', '')}"))
    VARIANTS[f"f-board/fulki-f-board-{_t}.svg"] = (lambda t=_t: flap_icon(t, board=True, uid=f"b{t.replace('-', '')}"))
VARIANTS["f-board/fulki-f-flap-black-orange-round.svg"] = lambda: flap_icon("black-orange", shape="round", uid="r1")
VARIANTS["f-board/fulki-f-led-amber.svg"] = lambda: led_icon("#FBBF24", "#292524", "#0C0A09", uid="l1")
VARIANTS["f-board/fulki-f-led-orange.svg"] = lambda: led_icon("#F97316", "#292524", "#0C0A09", uid="l2")

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, make in VARIANTS.items():
        (OUT / name).parent.mkdir(parents=True, exist_ok=True)
        (OUT / name).write_text(make())
        print("wrote", OUT / name)
