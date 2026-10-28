"""Genera las capas pixel art de Nodo (araña saltarina morada, diseño original) como paths SVG."""
import json, math

W, H = 40, 36
CX = 20

PAL = {
    "o": "#1B1140",  # contorno
    "d": "#4B2BB8",  # sombra
    "b": "#6E4BFF",  # cuerpo
    "l": "#9478FF",  # luz
    "h": "#C6B6FF",  # brillo
    "e": "#120A2E",  # ojo
    "w": "#FFFFFF",
    "a": "#FFB224",  # ámbar
    "p": "#FF7AB6",  # rubor
    "r": "#FF4D6D",  # rojo enojo
    "c": "#5EE7FF",  # lágrima
    "g": "#10B981",  # verde
    "y": "#FFC93C",  # amarillo casco
    "Y": "#E89B00",
    "m": "#EC4899",  # magenta
    "n": "#6366F1",  # índigo
    "s": "#3B82F6",  # azul
    "k": "#0EA5E9",  # celeste
    "t": "#1FC7B6",  # turquesa
    "x": "#E9E4FF",  # papel
    "u": "#8B8FA8",  # gris
    "z": "#C9A06A",  # madera
}


def runs_to_path(pixels):
    rows = {}
    for (x, y) in pixels:
        rows.setdefault(y, set()).add(x)
    d = []
    for y in sorted(rows):
        xs = sorted(rows[y])
        start = prev = xs[0]
        for x in xs[1:] + [None]:
            if x is not None and x == prev + 1:
                prev = x
                continue
            n = prev - start + 1
            d.append(f"M{start} {y}h{n}v1h-{n}z")
            if x is not None:
                start = prev = x
    return "".join(d)


def layer(cells):
    """cells: dict (x,y)->color char  ->  svg <path> elements por color."""
    by = {}
    for p, c in cells.items():
        if 0 <= p[0] < W + 12 and -8 <= p[1] < H + 4:
            by.setdefault(c, []).append(p)
    order = "odblhewapc rgyYmnsktxuz".replace(" ", "")
    out = []
    for c in sorted(by, key=lambda k: order.index(k) if k in order else 99):
        out.append(f'<path fill="{PAL[c]}" d="{runs_to_path(by[c])}"/>')
    return "".join(out)


def ellipse(cx, cy, rx, ry):
    pts = set()
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            if ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1:
                pts.add((x, y))
    return pts


def line(a, b):
    (x0, y0), (x1, y1) = a, b
    pts = []
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        pts.append((x0, y0))
        if (x0, y0) == (x1, y1):
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy; x0 += sx
        if e2 <= dx:
            err += dx; y0 += sy
    return pts


def outline(filled):
    out = set()
    for (x, y) in filled:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in filled:
                out.add(q)
    return out


def mirror(p):
    return (W - 1 - p[0], p[1])


# ---------- Cuerpo ----------
ABD = ellipse(CX, 13.5, 11, 7)        # abdomen, detrás
HEAD = ellipse(CX, 21.5, 10.5, 8.5)   # cefalotórax con la cara
body_fill = ABD | HEAD
# mechones de pelo arriba
TUFTS = {(CX - 4, 6), (CX - 1, 5), (CX + 2, 5), (CX + 5, 6), (CX - 7, 8), (CX + 8, 8)}
body_fill |= TUFTS


def legs(frame):
    left = [
        [(11, 18), (6, 13), (3, 18)],
        [(10, 21), (4, 18), (2, 25)],
        [(11, 24), (5, 24), (4, 30)],
        [(13, 27), (9, 29), (9, 33)],
    ]
    pix = {}
    knees = set()
    feet = set()
    for i, (hip, knee, foot) in enumerate(left):
        up = (i % 2 == 0) if frame == "A" else (i % 2 == 1)
        k = (knee[0], knee[1] - (1 if up else 0))
        f = (foot[0], foot[1] - (2 if up else 0))
        for side in (0, 1):
            h2, k2, f2 = (hip, k, f) if side == 0 else (mirror(hip), mirror(k), mirror(f))
            # el lado derecho alterna al revés para que camine
            if side == 1:
                upr = not up
                k2 = (mirror(knee)[0], knee[1] - (1 if upr else 0))
                f2 = (mirror(foot)[0], foot[1] - (2 if upr else 0))
            for p in line(h2, k2) + line(k2, f2):
                pix[p] = "l"
            knees.add(k2); feet.add(f2)
    for k in knees:
        pix[k] = "a"
    for f in feet:
        pix[f] = "h"
    fill = set(pix)
    for p in outline(fill | body_fill):
        if p not in fill and p not in body_fill:
            pix.setdefault(p, "o")
    # el contorno pegado al cuerpo lo dibuja el cuerpo
    return {p: c for p, c in pix.items() if not (c == "o" and p in body_fill)}


def body_layer():
    cells = {}
    for p in outline(body_fill):
        cells[p] = "o"
    for p in ABD:
        cells[p] = "d"
    # chevrones del abdomen
    for i, y in enumerate((9, 12, 15)):
        for dx in range(-5 + i, 6 - i):
            if abs(dx) >= 3 - i:
                cells[(CX + dx, y + (abs(dx) // 3))] = "l"
    for p in TUFTS:
        cells[p] = "d"
    for p in HEAD:
        cells[p] = "b"
    # borde entre abdomen y cabeza
    for p in outline(HEAD):
        if p in ABD:
            cells[p] = "o"
    # luz y sombra de la cabeza
    for (x, y) in HEAD:
        nx, ny = (x + 0.5 - CX) / 10.5, (y + 0.5 - 21.5) / 8.5
        if nx < -0.2 and ny < -0.35 and nx * nx + ny * ny > 0.45:
            cells[(x, y)] = "l"
        if ny > 0.72:
            cells[(x, y)] = "d"
    for p in [(CX - 6, 15), (CX - 5, 15), (CX - 7, 16)]:
        cells[p] = "h"
    # quelíceros (colmillitos)
    for p in [(CX - 2, 28), (CX + 1, 28)]:
        cells[p] = "d"
    return cells


EYES = [(CX - 4, 21), (CX + 4, 21)]  # ojos grandes (centro)
SMALL = [(CX - 9, 18), (CX + 8, 18)]  # ojos chicos (esquina superior izq.)


def disk(c, r):
    cx, cy = c
    R = int(r) + 2
    return {(x, y) for x in range(cx - R, cx + R + 1) for y in range(cy - R, cy + R + 1)
            if (x + 0.5 - cx - 0.5) ** 2 + (y + 0.5 - cy - 0.5) ** 2 <= r * r + 0.6}


def small_eyes(cells):
    for (x, y) in SMALL:
        for p in [(x, y), (x + 1, y), (x, y + 1), (x + 1, y + 1)]:
            cells[p] = "e"
        cells[(x, y)] = "h"


def face(kind):
    c = {}
    small_eyes(c)
    blush = [(CX - 9, 25), (CX - 8, 25), (CX + 7, 25), (CX + 8, 25)]
    if kind in ("neutral", "thinking"):
        for e in EYES:
            for p in disk(e, 2.6):
                c[p] = "e"
            gx, gy = (e[0] - 1, e[1] - 1) if kind == "neutral" else (e[0] + 1, e[1] - 2)
            c[(gx, gy)] = "w"; c[(gx + 1, gy)] = "w"; c[(gx, gy + 1)] = "w"
            c[(e[0] + 1, e[1] + 2)] = "h"
        if kind == "neutral":
            for p in [(CX - 2, 26), (CX - 1, 27), (CX, 27), (CX + 1, 26)]:
                c[p] = "e"
        else:
            for p in [(CX, 26), (CX + 1, 26), (CX + 2, 26)]:
                c[p] = "e"
        for p in blush:
            c[p] = "p"
    elif kind == "closed":
        for (x, y) in EYES:
            for dx in range(-2, 4):
                c[(x + dx, y + 1)] = "e"
            c[(x - 3, y)] = "e"; c[(x + 4, y)] = "e"
        for p in [(CX - 2, 26), (CX - 1, 27), (CX, 27), (CX + 1, 26)]:
            c[p] = "e"
        for p in blush:
            c[p] = "p"
    elif kind == "happy":
        for (x, y) in EYES:
            for p in [(x - 2, y + 2), (x - 1, y + 1), (x, y), (x + 1, y), (x + 2, y + 1), (x + 3, y + 2),
                      (x - 2, y + 1), (x + 3, y + 1), (x, y - 1), (x + 1, y - 1)]:
                c[p] = "e"
        for y in (26, 27, 28):
            span = {26: range(-3, 3), 27: range(-2, 2), 28: range(-1, 1)}[y]
            for dx in span:
                c[(CX + dx, y)] = "e"
        c[(CX - 1, 27)] = "p"; c[(CX, 27)] = "p"
        for p in blush + [(CX - 10, 25), (CX + 9, 25)]:
            c[p] = "p"
    elif kind == "angry":
        for (x, y) in EYES:
            for p in disk((x, y), 2.6):
                if p[1] >= y - 1:
                    c[p] = "e"
            c[(x, y)] = "r"; c[(x + 1, y)] = "r"
        # cejas inclinadas hacia el centro
        for p in line((CX - 8, 16), (CX - 2, 19)) + line((CX + 7, 16), (CX + 1, 19)):
            c[p] = "o"
        for p in line((CX - 7, 16), (CX - 3, 18)) + line((CX + 6, 16), (CX + 2, 18)):
            c[p] = "o"
        for dx in range(-3, 3):
            c[(CX + dx, 27)] = "e"
        for dx in (-2, 0):
            c[(CX + dx, 26)] = "w"; c[(CX + dx + 1, 28)] = "w"
        for p in blush + [(CX - 10, 24), (CX + 9, 24)]:
            c[p] = "r"
    elif kind == "sad":
        for e in EYES:
            for p in disk((e[0], e[1] + 1), 2.3):
                c[p] = "e"
            c[(e[0] - 1, e[1] + 1)] = "w"; c[(e[0], e[1] + 1)] = "w"
        # cejas tristes (extremo interior arriba)
        for p in line((CX - 8, 18), (CX - 3, 16)) + line((CX + 7, 18), (CX + 2, 16)):
            c[p] = "o"
        for p in [(CX - 2, 28), (CX - 1, 27), (CX, 27), (CX + 1, 28)]:
            c[p] = "e"
    elif kind == "surprised":
        for e in EYES:
            for p in disk(e, 3.3):
                c[p] = "w"
            for p in outline(disk(e, 3.3)):
                c[p] = "e"
            for p in [(e[0], e[1]), (e[0] + 1, e[1]), (e[0], e[1] + 1), (e[0] + 1, e[1] + 1)]:
                c[p] = "e"
        for p in outline({(CX - 1, 27), (CX, 27), (CX - 1, 28), (CX, 28)}):
            c[p] = "e"
    return c


def fx(kind):
    c = {}
    if kind == "tear":
        for p in [(CX - 5, 25), (CX - 5, 26), (CX - 6, 26), (CX - 4, 26), (CX - 5, 27)]:
            c[p] = "c"
        c[(CX - 5, 25)] = "w"
    if kind == "steam":
        for (x, y) in [(6, 6), (31, 5)]:
            for p in [(x, y), (x + 1, y), (x - 1, y + 1), (x, y + 1), (x + 1, y + 1), (x + 2, y + 1), (x, y + 2), (x + 1, y + 2)]:
                c[p] = "w"
    if kind == "excl":
        for y in range(-4, 1):
            c[(CX + 12, y)] = "a"; c[(CX + 13, y)] = "a"
        c[(CX + 12, 2)] = "a"; c[(CX + 13, 2)] = "a"
    if kind in ("z1", "z2"):
        x, y = (CX + 10, 3) if kind == "z1" else (CX + 14, -2)
        for p in [(x, y), (x + 1, y), (x + 2, y), (x + 3, y), (x + 2, y + 1), (x + 1, y + 2), (x, y + 3), (x + 1, y + 3), (x + 2, y + 3), (x + 3, y + 3)]:
            c[p] = "h"
    if kind.startswith("dot"):
        i = int(kind[-1])
        x = CX + 9 + i * 3
        for p in [(x, 1), (x + 1, 1), (x, 2), (x + 1, 2)]:
            c[p] = "h"
    if kind == "confetti":
        for (x, y, col) in [(4, 2, "a"), (9, -2, "p"), (15, 0, "t"), (25, -1, "a"), (31, 1, "p"), (35, -2, "t"), (2, 8, "t"), (37, 7, "a")]:
            c[(x, y)] = col; c[(x + 1, y)] = col
    if kind == "heart":
        for p in [(CX + 11, 2), (CX + 12, 1), (CX + 13, 2), (CX + 14, 1), (CX + 15, 2), (CX + 11, 3), (CX + 15, 3),
                  (CX + 12, 3), (CX + 13, 3), (CX + 14, 3), (CX + 12, 4), (CX + 13, 4), (CX + 14, 4), (CX + 13, 5)]:
            c[p] = "p"
    return c


def ascii_sprite(rows, ox, oy):
    c = {}
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != ".":
                c[(ox + i, oy + j)] = ch
    return c


# ---------- Accesorios de categoría (cabeza) ----------
def hat(kind):
    c = {}
    if kind == "headphones":
        top = ellipse(CX, 14, 13.2, 9.5)
        for p in outline(top):
            if p[1] <= 13:
                c[p] = "g"
        for p in outline(outline(top)):
            if p[1] <= 12 and p not in top:
                c.setdefault(p, "o")
        for x0 in (5, 32):
            for y in range(13, 19):
                for x in range(x0, x0 + 3):
                    c[(x, y)] = "g"
            for p in outline({(x, y) for x in range(x0, x0 + 3) for y in range(13, 19)}):
                c[p] = "o"
            c[(x0 + 1, 14)] = "h"
    if kind == "goggles":
        for x in range(9, 31):
            c[(x, 15)] = "a"
        for e in (CX - 4, CX + 4):
            ring = disk((e, 15), 2.6)
            for p in ring:
                c[p] = "t"
            for p in outline(ring):
                c[p] = "o"
            c[(e - 1, 14)] = "w"
    if kind == "antenna":
        for y in range(1, 6):
            c[(CX, y)] = "l"; c[(CX - 1, y)] = "o" if y > 1 else c.get((CX - 1, y), "o")
        for p in [(CX - 1, -2), (CX, -2), (CX - 1, -1), (CX, -1), (CX - 2, -1), (CX + 1, -1), (CX - 1, 0), (CX, 0)]:
            c[p] = "a"
        c[(CX - 1, -2)] = "w"
    if kind == "glasses":
        for e in EYES:
            for p in outline(disk(e, 3.6)):
                c[p] = "a"
        for x in range(CX - 1, CX + 1):
            c[(x, 20)] = "a"
    if kind == "readers":
        for (x, y) in EYES:
            for dx in range(-3, 5):
                c[(x + dx, y + 3)] = "a"
            c[(x - 3, y + 2)] = "a"; c[(x + 4, y + 2)] = "a"
        c[(CX, 23)] = "a"
    if kind == "hardhat":
        rows = [
            "......YYYYYYYY......",
            "....YyyyyYYyyyyyY....",
            "...YyyyyyYYyyyyyyY...",
            "..YyyyyyyYYyyyyyyyY..",
            "..YyyyyyyYYyyyyyyyY..",
            "YYYYYYYYYYYYYYYYYYYYYY",
        ]
        c.update(ascii_sprite(rows, CX - 11, 3))
        for p in outline(set(c)):
            c.setdefault(p, "o")
    if kind == "beret":
        rows = [
            "........mm.........",
            "....mmmmmmmmmm.....",
            "..mmmmmmmmmmmmmmm..",
            ".mmmmmmmmmmmmmmmmmm",
            "..mmmmmmmmmmmmmmm..",
        ]
        c.update(ascii_sprite(rows, CX - 12, 4))
        for p in outline(set(c)):
            c.setdefault(p, "o")
        for x in range(CX - 8, CX - 2):
            c[(x, 6)] = "p"
    if kind == "cap":
        rows = [
            ".....nnnnnnnnnn.....",
            "...nnnnnnnnnnnnnn...",
            "..nnnnnnnhhnnnnnnn..",
            "..nnnnnnnnnnnnnnnnnnnnnn",
        ]
        c.update(ascii_sprite(rows, CX - 10, 5))
        for p in outline(set(c)):
            c.setdefault(p, "o")
    return c


# ---------- Objetos de subcategoría (en la mano) ----------
PROPS = {
    "flask":    ["..oooo..", "..oxxo..", "..oxxo..", ".oxxxxo.", "oxttttxo", "otttttto", ".oooooo."],
    "magnifier": [".oooo...", "ohxxho..", "oxxxxo..", "oxxxxo..", ".oooozo.", "......zo", ".......z"],
    "brush":    ["......mm", ".....mmm", "....zzm.", "...zz...", "..zz....", ".zz.....", "zz......"],
    "paper":    ["oooooo..", "oxxxxoo.", "oxssxxo.", "oxxxxxo.", "oxssssxo", "oxxxxxxo", "oooooooo"],
    "clipboard": ["..ooo...", "ooouooo.", "onxxxxno", "onxtxxno", "onxxxxno", "onxtxxno", "oooooooo"],
    "browser":  ["oooooooo", "orayxxxo", "oooooooo", "oxssxxxo", "oxxxxxxo", "oxsssxxo", "oooooooo"],
    "server":   ["oooooooo", "ouuuutuo", "oooooooo", "ouuuuauo", "oooooooo", "ouuuutuo", "oooooooo"],
    "phone":    ["..oooo..", "..oeeo..", "..osso..", "..osso..", "..osso..", "..oeeo..", "..oooo.."],
    "shield":   ["oooooooo", "orrrrrro", "orrwrrro", "orwwwrro", ".orrwro.", "..orro..", "...oo..."],
    "cloud":    ["...ooo..", "..okkko.", ".okkkkko", "okkkkkko", "okkkkkko", ".oooooo.", "........"],
    "database": [".oooooo.", "ohhhhhho", "otttttto", "ohhhhhho", "otttttto", "ohhhhhho", ".oooooo."],
    "plug":     [".x..x...", ".x..x...", "llllll..", "lhhhhl..", "llllll..", ".llll...", "...aa..."],
    "check":    ["oooooooo", "oxxxxxxo", "oxxxxtxo", "oxtxtxxo", "oxxtxxxo", "oxxxxxxo", "oooooooo"],
    "blocks":   ["..oooo..", "..onno..", "..oooo..", "oooooooo", "oaaootto", "oaaootto", "oooooooo"],
    "branch":   [".aa..tt.", ".aa..tt.", "..x..x..", "..x.x...", "..xx....", "..gg....", "..gg...."],
    "braces":   [".kk..kk.", ".k....k.", ".k....k.", "k......k", ".k....k.", ".k....k.", ".kk..kk."],
    "bug":      [".o....o.", "..oooo..", "oorrrroo", ".orwrro.", "oorrrroo", ".orrrro.", "..oooo.."],
    "play":     ["oooooooo", "ogwggggo", "ogwwgggo", "ogwwwggo", "ogwwgggo", "ogwggggo", "oooooooo"],
    "stopwatch": ["...oo...", "..oooo..", ".oxxxxo.", "oxxexxxo", "oxxeexxo", ".oxxxxo.", "..oooo.."],
    "chat":     ["oooooooo", "oxxxxxxo", "oxlxlxlo", "oxxxxxxo", "oooooooo", ".oo.....", ".o......"],
    "network":  ["...aa...", "...aa...", "..u..u..", ".u....u.", "tt....kk", "tt....kk", "........"],
    "sparkle":  ["...y....", "...y....", "..yyy...", "yyyhyyy.", "..yyy...", "...y..p.", "...y.ppp"],
    "puzzle":   ["...oo...", "..ogo...", "oooggooo", "oggggggo", "ogggggo.", "oggggggo", "oooooooo"],
    "barchart": [".....tt.", ".....tt.", "..ss.tt.", "..ss.tt.", "aass.tt.", "aass.tt.", "xxxxxxxx"],
    "chip":     ["..x..x..", ".oooooo.", "xonnnnox", ".onhhno.", "xonnnnox", ".oooooo.", "..x..x.."],
    "piechart": ["..oooo..", ".ommtto.", "ommmttto", "ommmssso", "ommsssso", ".osssso.", "..oooo.."],
    "gear":     ["...uu...", ".u.uu.u.", "..uuuu..", "uuueeuuu", "..uuuu..", ".u.uu.u.", "...uu..."],
    "pulse":    ["oooooooo", "oeeegeeo", "oeegegeo", "ogeeeego", "oeeeeeeo", "oooooooo", "...oo..."],
    "palette":  ["..oooo..", ".oxxxxo.", "oxrxaxxo", "oxxxxgxo", "oxsxxxo.", ".oxxxo..", "..ooo..."],
    "film":     ["xoxoxoxo", "oxoxoxox", "oooooooo", "ouuuuuuo", "ouuuuuuo", "ouuuuuuo", "oooooooo"],
    "layout":   ["oooooooo", "onnnnnno", "oooooooo", "oxxoxxxo", "oxxoxxxo", "oxxoxxxo", "oooooooo"],
    "megaphone": ["......oo", "....oomo", "oooommmo", "oxxommmo", "oooommmo", ".o..oomo", ".o....oo"],
    "book":     ["ooooooo.", "osssssxo", "oswwssxo", "osssssxo", "oswwwsxo", "osssssxo", "oooooooo"],
    "pencil":   ["......pp", ".....yyp", "....yyy.", "...yyy..", "..yyy...", ".zzy....", "ez......"],
    "bolt":     ["....yy..", "...yy...", "..yy....", ".yyyyyy.", "....yy..", "...yy...", "..y....."],
    "coin":     ["..oooo..", ".oyyyyo.", "oyYYYYyo", "oyYyyYyo", "oyYYYYyo", ".oyyyyo.", "..oooo.."],
    "bulb":     ["..oooo..", ".oywyyo.", ".oyyyyo.", "..oyyo..", "..ouuo..", "..ouuo..", "...oo..."],
}


def prop(name):
    return ascii_sprite(PROPS[name], 31, 27)


OUT = {
    "body": layer(body_layer()),
    "legsA": layer(legs("A")),
    "legsB": layer(legs("B")),
}
for k in ("neutral", "closed", "happy", "angry", "sad", "surprised", "thinking"):
    OUT["face_" + k] = layer(face(k))
for k in ("tear", "steam", "excl", "z1", "z2", "dot0", "dot1", "dot2", "confetti", "heart"):
    OUT["fx_" + k] = layer(fx(k))
for k in ("headphones", "goggles", "antenna", "glasses", "readers", "hardhat", "beret", "cap"):
    OUT["hat_" + k] = layer(hat(k))
for k in PROPS:
    OUT["prop_" + k] = layer(prop(k))

# Uso: python3 scripts/nodo-sprites.py  →  reescribe src/components/nodo/sprites.js
import os
dest = os.path.join(os.path.dirname(__file__), "..", "src", "components", "nodo", "sprites.js")
lines = ["// Generado desde el pixel art de Nodo (rejilla 40×36). Cada capa es un grupo de <path> SVG.",
         "// No editar a mano: las capas se combinan en Nodo.jsx.", "export const LAYERS = {"]
lines += [f"  {json.dumps(k)}: {json.dumps(v)}," for k, v in OUT.items()]
lines.append("}")
with open(dest, "w") as f:
    f.write("\n".join(lines) + "\n")
print(f"{len(OUT)} capas →", os.path.normpath(dest))
