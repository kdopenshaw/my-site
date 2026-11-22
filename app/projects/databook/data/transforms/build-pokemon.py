"""Project the original Pokémon CSV to one row per National Dex number."""

import csv
import json
import sys
from pathlib import Path

columns = [
    ("name", "categorical", "Name"),
    ("type", "categorical", "Primary type"),
    ("total", "quantitative", "Base stat total"),
    ("speed", "quantitative", "Base Speed"),
    ("legendary", "boolean", "Legendary (source flag)"),
    ("hp", "quantitative", "HP"),
    ("atk", "quantitative", "Attack"),
    ("def", "quantitative", "Defense"),
    ("spa", "quantitative", "Special Attack"),
    ("spd", "quantitative", "Special Defense"),
]
pokemon = {}
with Path(sys.argv[1]).open(encoding="utf-8-sig", newline="") as source:
    for row in csv.DictReader(source):
        dex = int(row["#"])
        if dex in pokemon:
            continue
        pokemon[dex] = {
            "name": row["Name"],
            "type": row["Type 1"],
            "total": int(row["Total"]),
            "speed": int(row["Speed"]),
            "legendary": {"True": True, "False": False}[row["Legendary"]],
            "hp": int(row["HP"]),
            "atk": int(row["Attack"]),
            "def": int(row["Defense"]),
            "spa": int(row["Sp. Atk"]),
            "spd": int(row["Sp. Def"]),
        }

if sorted(pokemon) != list(range(1, 722)):
    raise ValueError("Expected one retained row per National Dex number 1–721")

table = {
    "grain": "First source row for each National Dex number (1–721)",
    "schema": [
        {"name": key, "type": kind, "label": label} for key, kind, label in columns
    ],
    "rows": [pokemon[dex] for dex in sorted(pokemon)],
}
Path(__file__).resolve().parents[1].joinpath("canonical.json").write_text(
    json.dumps(table, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
)
