import struct
import unittest

from api.fractal import FAMILIES, PALETTES, ParameterError, generate_png, parse_parameters


class FractalFunctionTests(unittest.TestCase):
    def test_mandelbrot_defaults_generate_png(self):
        parameters = parse_parameters("/api/fractal?width=64&height=64&iterations=20")
        image = generate_png(parameters)

        self.assertEqual(image[:8], b"\x89PNG\r\n\x1a\n")
        self.assertEqual(struct.unpack(">II", image[16:24]), (64, 64))

    def test_julia_parameters_are_parsed(self):
        parameters = parse_parameters(
            "/api/fractal?family=julia&c_real=0.2841&c_imag=0.01&power=3&palette=ember"
        )

        self.assertEqual(parameters.family, "julia")
        self.assertEqual(parameters.c_real, 0.2841)
        self.assertEqual(parameters.c_imag, 0.01)
        self.assertEqual(parameters.power, 3)
        self.assertEqual(parameters.center_x, 0.0)

    def test_every_family_generates_a_distinct_png(self):
        images = []

        for family in FAMILIES:
            with self.subTest(family=family):
                parameters = parse_parameters(
                    f"/api/fractal?family={family}&width=64&height=64&iterations=20"
                )
                image = generate_png(parameters)
                self.assertEqual(image[:8], b"\x89PNG\r\n\x1a\n")
                images.append(image)

        self.assertEqual(len(set(images)), len(FAMILIES))

    def test_burning_ship_uses_its_standard_default_center(self):
        parameters = parse_parameters("/api/fractal?family=burning_ship")

        self.assertEqual(parameters.center_x, -0.5)
        self.assertEqual(parameters.center_y, -0.5)

    def test_rejects_excessive_work(self):
        with self.assertRaisesRegex(ParameterError, "200,000,000"):
            parse_parameters("/api/fractal?width=1200&height=1200&iterations=1000")

    def test_accepts_work_above_fast_preview_budget(self):
        parameters = parse_parameters(
            "/api/fractal?width=720&height=440&iterations=160"
        )

        self.assertEqual(parameters.iterations, 160)

    def test_enforces_hard_work_budget_boundary(self):
        accepted = parse_parameters(
            "/api/fractal?width=1200&height=1200&iterations=138"
        )
        self.assertEqual(accepted.iterations, 138)

        with self.assertRaises(ParameterError):
            parse_parameters(
                "/api/fractal?width=1200&height=1200&iterations=139"
            )

    def test_rejects_unknown_family(self):
        with self.assertRaisesRegex(ParameterError, "family must be"):
            parse_parameters("/api/fractal?family=unknown")

    def test_every_palette_is_accepted(self):
        for palette in PALETTES:
            with self.subTest(palette=palette):
                parameters = parse_parameters(f"/api/fractal?palette={palette}")
                self.assertEqual(parameters.palette, palette)

    def test_custom_colors_are_parsed(self):
        parameters = parse_parameters(
            "/api/fractal?colors=%23000022,%23004d4d,%2333ffff,%23e0f8e0"
        )

        self.assertEqual(
            parameters.colors,
            ((0, 0, 34), (0, 77, 77), (51, 255, 255), (224, 248, 224)),
        )

    def test_rejects_invalid_custom_color(self):
        with self.assertRaisesRegex(ParameterError, "#RRGGBB"):
            parse_parameters("/api/fractal?colors=navy,%23ffffff")


if __name__ == "__main__":
    unittest.main()
