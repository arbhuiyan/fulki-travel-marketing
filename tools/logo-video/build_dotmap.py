"""Build dotmap.js, the dotted world map behind the routes promo, from Natural Earth land (public domain).

Run: python3 tools/logo-video/build_dotmap.py path/to/land-110m.json
(land-110m.json comes from the world-atlas npm package: npm pack world-atlas@2.0.2)
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

RES = 10                      # raster pixels per degree
LON = (-180, 179)             # map area kept for the video
LAT = (-56, 80)
STEP_LON, STEP_LAT = 1.0, 0.85


def rings(topo):
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(idx):
        out = []
        for i in idx:
            pts = arcs[i] if i >= 0 else arcs[~i][::-1]
            out.extend(pts[1:] if out else pts)
        return out

    for geom in topo["objects"]["land"]["geometries"]:
        polys = geom["arcs"] if geom["type"] == "MultiPolygon" else [geom["arcs"]]
        for poly in polys:
            for k, r in enumerate(poly):
                yield k == 0, ring(r)


def main(src):
    topo = json.load(open(src))
    img = Image.new("1", (360 * RES, 180 * RES), 0)
    draw = ImageDraw.Draw(img)
    to_px = lambda p: ((p[0] + 180) * RES, (90 - p[1]) * RES)
    for outer, r in rings(topo):
        draw.polygon([to_px(p) for p in r], fill=1 if outer else 0)
    dots = []
    lat = LAT[0]
    while lat <= LAT[1]:
        lon = LON[0]
        while lon <= LON[1]:
            if img.getpixel(to_px((lon, lat))):
                dots.append(f"{lon:g},{lat:.2f}".rstrip("0").rstrip("."))
            lon += STEP_LON
        lat += STEP_LAT
    out = Path(__file__).with_name("dotmap.js")
    out.write_text("// Dotted world map (lon,lat pairs) from Natural Earth land, made by build_dotmap.py\n"
                   f"const DOTS = \"{' '.join(dots)}\".split(\" \").map(p => p.split(\",\").map(Number));\n")
    print(f"wrote {out.name}: {len(dots)} dots")


if __name__ == "__main__":
    main(sys.argv[1])
