#!/usr/bin/env python3
"""Emit a 32x32 PNG (RGBA) for Safari tab favicon — stdlib only."""
import struct
import zlib
import sys

W, H = 32, 32

# Palette-ish: bg #140f0d, cup #d97706, rim #b45309, steam #eaddca
BG = (0x14, 0x0F, 0x0D, 0xFF)
CUP = (0xD9, 0x77, 0x06, 0xFF)
RIM = (0xB4, 0x53, 0x09, 0xFF)
STM = (0xEA, 0xDD, 0xCA, 0xDD)


def pixel(buf, x, y, c):
    if 0 <= x < W and 0 <= y < H:
        i = (y * W + x) * 4
        buf[i : i + 4] = c


def line(buf, x0, y0, x1, y1, c, w=1):
    """Simple Bresenham-ish fat line for steam."""
    from math import hypot

    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for t in range(n + 1):
        u = t / max(n, 1)
        x = int(x0 + (x1 - x0) * u)
        y = int(y0 + (y1 - y0) * u)
        for dx in range(-w, w + 1):
            for dy in range(-w, w + 1):
                if dx * dx + dy * dy <= w * w + 1:
                    pixel(buf, x + dx, y + dy, c)


def main():
    buf = bytearray(W * H * 4)
    for i in range(0, len(buf), 4):
        buf[i : i + 4] = BG

    # Cup body (filled rect approx)
    for y in range(12, 27):
        for x in range(7, 20):
            pixel(buf, x, y, CUP)
    # Taper bottom
    for y in range(27, 29):
        for x in range(8, 19):
            pixel(buf, x, y, CUP)
    # Rim
    for x in range(7, 20):
        pixel(buf, x, 12, RIM)
        pixel(buf, x, 13, RIM)
        pixel(buf, x, 14, RIM)

    # Handle
    for y in range(15, 23):
        pixel(buf, 20, y, CUP)
        pixel(buf, 21, y, CUP)
    for x in range(22, 26):
        pixel(buf, x, 18, CUP)
        pixel(buf, x, 19, CUP)

    # Steam curves (thick strokes)
    line(buf, 10, 10, 10, 5, STM, 0)
    line(buf, 15, 9, 16, 4, STM, 0)
    line(buf, 20, 10, 21, 5, STM, 0)
    for sx, sy in [(10, 6), (10, 7), (16, 5), (16, 6), (21, 6), (21, 7)]:
        pixel(buf, sx, sy, STM)

    # Raw scanlines: filter 0, then RGBA
    raw = bytearray()
    for y in range(H):
        raw.append(0)  # filter type None
        row = buf[y * W * 4 : (y + 1) * W * 4]
        raw.extend(row)

    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = bytearray()
    png.extend(b"\x89PNG\r\n\x1a\n")
    png.extend(chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)))
    png.extend(chunk(b"IDAT", compressed))
    png.extend(chunk(b"IEND", b""))

    out = sys.argv[1] if len(sys.argv) > 1 else "favicon-32.png"
    with open(out, "wb") as f:
        f.write(png)
    print(out, len(png), "bytes")


if __name__ == "__main__":
    main()
