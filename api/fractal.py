"""Vercel serverless function for rendering escape-time fractals as PNGs.

The form in app/fractals/fractal-studio.tsx calls GET /api/fractal.
`npm run dev` does not run this file. Use `npm run dev:apis`.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import re
import struct
import zlib
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse


MAX_WIDTH = 1_200
MAX_HEIGHT = 1_200
MAX_ITERATIONS = 400
MAX_WORK = 200_000_000
FAMILIES = ("mandelbrot", "julia", "burning_ship", "tricorn", "newton")


PALETTES = {
    "ocean_reef": ((0, 0, 34), (0, 77, 77), (51, 255, 255), (224, 248, 224)),
    "deep_sea_coral": ((15, 32, 39), (44, 95, 93), (255, 126, 103), (255, 160, 122)),
    "forest_ember": ((13, 27, 13), (26, 93, 26), (255, 107, 53), (255, 210, 63)),
    "cosmic_dust": ((11, 11, 31), (75, 0, 130), (199, 21, 133), (255, 182, 193)),
    "sunset": ((32, 0, 0), (255, 69, 0), (255, 215, 0)),
    "volcano_glow": ((17, 17, 17), (153, 0, 0), (255, 69, 0), (255, 215, 0)),
    "indigo_magenta_gold": ((11, 0, 51), (48, 64, 255), (255, 64, 191), (255, 216, 0)),
    "forest": ((0, 0, 0), (0, 77, 0), (102, 255, 102)),
    "forest4": ((0, 0, 0), (0, 77, 0), (153, 204, 51), (255, 215, 0)),
    "ocean": ((0, 0, 0), (0, 102, 102), (102, 255, 255)),
    "arctic": ((255, 255, 255), (160, 216, 241), (0, 31, 63)),
    "gold_white_charcoal": ((255, 255, 255), (255, 215, 0), (51, 51, 51)),
    "dark_mist": ((17, 17, 17), (42, 77, 105), (176, 196, 222), (255, 215, 0)),
    "inferno": ((0, 0, 4), (87, 16, 110), (188, 55, 84), (249, 142, 9), (252, 255, 164)),
    "cividis": ((0, 34, 78), (73, 90, 109), (151, 137, 94), (254, 232, 56)),
    "cubehelix": ((0, 0, 0), (22, 62, 90), (150, 86, 145), (214, 196, 154), (255, 255, 255)),
    "gist_ncar": ((0, 0, 128), (0, 220, 255), (60, 255, 0), (255, 230, 0), (220, 0, 0)),
    "ember": ((17, 17, 17), (153, 0, 0), (255, 69, 0), (255, 215, 0)),
    "monochrome": ((7, 12, 22), (70, 88, 110), (190, 204, 216), (255, 255, 255)),
}


@dataclass(frozen=True)
class FractalParameters:
    family: str = "mandelbrot"
    width: int = 480
    height: int = 320
    iterations: int = 120
    center_x: float = -0.5
    center_y: float = 0.0
    scale: float = 3.2
    c_real: float = -0.8
    c_imag: float = 0.156
    power: int = 2
    escape_radius: float = 2.0
    gamma: float = 1.0
    relax: float = 1.0
    palette: str = "ocean_reef"
    colors: tuple[tuple[int, int, int], ...] = PALETTES["ocean_reef"]


class ParameterError(ValueError):
    pass


def _single(query: dict[str, list[str]], name: str, default: object) -> str:
    return query.get(name, [str(default)])[-1]


def _integer(query: dict[str, list[str]], name: str, default: int, low: int, high: int) -> int:
    try:
        value = int(_single(query, name, default))
    except ValueError as error:
        raise ParameterError(f"{name} must be an integer") from error
    if not low <= value <= high:
        raise ParameterError(f"{name} must be between {low} and {high}")
    return value


def _number(query: dict[str, list[str]], name: str, default: float, low: float, high: float) -> float:
    try:
        value = float(_single(query, name, default))
    except ValueError as error:
        raise ParameterError(f"{name} must be a number") from error
    if not math.isfinite(value) or not low <= value <= high:
        raise ParameterError(f"{name} must be between {low:g} and {high:g}")
    return value


def _colors(query: dict[str, list[str]], palette: str) -> tuple[tuple[int, int, int], ...]:
    raw_colors = _single(query, "colors", "")
    if not raw_colors:
        return PALETTES[palette]

    values = raw_colors.split(",")
    if not 2 <= len(values) <= 8:
        raise ParameterError("colors must contain between 2 and 8 hex colors")

    colors = []
    for value in values:
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ParameterError("each color must use the #RRGGBB format")
        colors.append(tuple(int(value[index : index + 2], 16) for index in (1, 3, 5)))
    return tuple(colors)


def parse_parameters(path: str) -> FractalParameters:
    query = parse_qs(urlparse(path).query)
    family = _single(query, "family", _single(query, "type", "mandelbrot")).lower()
    if family not in FAMILIES:
        raise ParameterError(f"family must be one of: {', '.join(FAMILIES)}")

    width = _integer(query, "width", 480, 64, MAX_WIDTH)
    height = _integer(query, "height", 320, 64, MAX_HEIGHT)
    iterations = _integer(query, "iterations", 120, 20, MAX_ITERATIONS)
    if width * height * iterations > MAX_WORK:
        raise ParameterError(
            f"width × height × iterations must not exceed {MAX_WORK:,}"
        )

    default_center_x = -0.5 if family in {"mandelbrot", "burning_ship"} else 0.0
    default_center_y = -0.5 if family == "burning_ship" else 0.0
    palette = _single(query, "palette", "ocean_reef").lower()
    if palette not in PALETTES:
        raise ParameterError(f"palette must be one of: {', '.join(PALETTES)}")
    colors = _colors(query, palette)

    return FractalParameters(
        family=family,
        width=width,
        height=height,
        iterations=iterations,
        center_x=_number(query, "center_x", default_center_x, -10.0, 10.0),
        center_y=_number(query, "center_y", default_center_y, -10.0, 10.0),
        scale=_number(query, "scale", 3.2, 0.000001, 20.0),
        c_real=_number(query, "c_real", -0.8, -2.0, 2.0),
        c_imag=_number(query, "c_imag", 0.156, -2.0, 2.0),
        power=_integer(query, "power", 2, 2, 8),
        escape_radius=_number(query, "escape_radius", 2.0, 2.0, 10.0),
        gamma=_number(query, "gamma", 1.0, 0.5, 2.2),
        relax=_number(query, "relax", 1.0, 0.2, 2.0),
        palette=palette,
        colors=colors,
    )


def _interpolate_palette(value: float, palette: tuple[tuple[int, int, int], ...]) -> tuple[int, int, int]:
    position = max(0.0, min(1.0, value)) * (len(palette) - 1)
    index = min(int(position), len(palette) - 2)
    amount = position - index
    start, end = palette[index], palette[index + 1]
    return tuple(round(a + (b - a) * amount) for a, b in zip(start, end))


def _escape_value(z: complex, c: complex, parameters: FractalParameters) -> float | None:
    radius_squared = parameters.escape_radius * parameters.escape_radius
    for iteration in range(parameters.iterations):
        if parameters.family == "burning_ship":
            z = complex(abs(z.real), abs(z.imag)) ** parameters.power + c
        elif parameters.family == "tricorn":
            z = z.conjugate() ** parameters.power + c
        else:
            z = z**parameters.power + c
        magnitude_squared = z.real * z.real + z.imag * z.imag
        if magnitude_squared > radius_squared:
            magnitude = math.sqrt(magnitude_squared)
            smooth = iteration + 1 - math.log(math.log(magnitude)) / math.log(parameters.power)
            return max(0.0, smooth / parameters.iterations)
    return None


def _newton_color(
    z: complex,
    parameters: FractalParameters,
    palette: tuple[tuple[int, int, int], ...],
) -> tuple[int, int, int]:
    tolerance = 1e-6
    power = parameters.power

    for iteration in range(parameters.iterations):
        polynomial = z**power - 1
        if abs(polynomial) < tolerance:
            angle = math.atan2(z.imag, z.real) % math.tau
            root_index = round(angle * power / math.tau) % power
            root_position = root_index / max(1, power - 1)
            base_color = _interpolate_palette(root_position, palette)
            convergence = 1 - iteration / parameters.iterations
            brightness = 0.2 + 0.8 * convergence**parameters.gamma
            return tuple(round(channel * brightness) for channel in base_color)

        derivative = power * z ** (power - 1)
        if abs(derivative) < 1e-12:
            break
        z -= parameters.relax * polynomial / derivative

    return (4, 8, 20)


def render_rgb(parameters: FractalParameters) -> bytes:
    palette = parameters.colors
    view_height = parameters.scale * parameters.height / parameters.width
    x_step = parameters.scale / max(1, parameters.width - 1)
    y_step = view_height / max(1, parameters.height - 1)
    x_min = parameters.center_x - parameters.scale / 2
    y_max = parameters.center_y + view_height / 2
    fixed_c = complex(parameters.c_real, parameters.c_imag)
    pixels = bytearray()

    for pixel_y in range(parameters.height):
        imaginary = y_max - pixel_y * y_step
        for pixel_x in range(parameters.width):
            point = complex(x_min + pixel_x * x_step, imaginary)
            if parameters.family == "newton":
                pixels.extend(_newton_color(point, parameters, palette))
                continue
            if parameters.family in {"mandelbrot", "burning_ship", "tricorn"}:
                value = _escape_value(0j, point, parameters)
            else:
                value = _escape_value(point, fixed_c, parameters)

            if value is None:
                pixels.extend((4, 8, 20))
            else:
                pixels.extend(_interpolate_palette(value**parameters.gamma, palette))
    return bytes(pixels)


def _png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def encode_png(width: int, height: int, rgb: bytes) -> bytes:
    stride = width * 3
    scanlines = b"".join(b"\x00" + rgb[offset : offset + stride] for offset in range(0, len(rgb), stride))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + _png_chunk(b"IHDR", header) + _png_chunk(
        b"IDAT", zlib.compress(scanlines, level=6)
    ) + _png_chunk(b"IEND", b"")


def generate_png(parameters: FractalParameters) -> bytes:
    return encode_png(parameters.width, parameters.height, render_rgb(parameters))


def gallery_proof_secret() -> str | None:
    return os.environ.get("GALLERY_RATE_LIMIT_SECRET") or os.environ.get("AWS_SECRET_ACCESS_KEY")


def image_proof(image: bytes, secret: str) -> str:
    """Bind a gallery upload to this exact PNG from the generator."""
    return hmac.new(secret.encode("utf-8"), hashlib.sha256(image).digest(), hashlib.sha256).hexdigest()


class handler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        try:
            parameters = parse_parameters(self.path)
            image = generate_png(parameters)
        except ParameterError as error:
            self._send_json(400, {"error": str(error)})
            return

        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(image)))
        self.send_header("Cache-Control", "public, max-age=3600, s-maxage=86400")
        self.send_header("X-Fractal-Family", parameters.family)
        secret = gallery_proof_secret()
        if secret:
            self.send_header("X-Fractal-Proof", image_proof(image, secret))
        self.end_headers()
        self.wfile.write(image)

    def _send_json(self, status: int, payload: dict[str, str]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
