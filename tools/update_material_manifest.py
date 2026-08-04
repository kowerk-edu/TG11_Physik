#!/usr/bin/env python3
"""Erzeugt die Dateiliste, aus der die Website ihre Materialstruktur aufbaut."""

from __future__ import annotations

import argparse
import json
import mimetypes
from pathlib import Path

IGNORED_FILE_NAMES = {".gitkeep", "thumbs.db", "desktop.ini"}
IGNORED_DIRECTORY_NAMES = {".git", "__pycache__"}


def build_manifest(root: Path) -> list[dict[str, object]]:
    material_root = root / "materialien"
    if not material_root.is_dir():
        raise SystemExit(f"Ordner nicht gefunden: {material_root}")

    manifest: list[dict[str, object]] = []

    # Verzeichnisse werden ebenfalls gespeichert. So erscheinen neue oder noch
    # leere Themenordner auf der Website, wenn darin eine .gitkeep-Datei liegt.
    for path in sorted(material_root.rglob("*")):
        if any(part in IGNORED_DIRECTORY_NAMES for part in path.parts):
            continue

        relative = path.relative_to(root).as_posix()
        if path.is_dir():
            if path.name.startswith("."):
                continue
            manifest.append({"type": "directory", "path": relative})
            continue

        if not path.is_file():
            continue
        if path.name.lower() in IGNORED_FILE_NAMES or path.name.startswith("."):
            continue

        mime, _ = mimetypes.guess_type(path.name)
        manifest.append({
            "type": "file",
            "path": relative,
            "filename": path.name,
            "size": path.stat().st_size,
            "mime": mime or "application/octet-stream",
        })

    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="Materialliste für die Kursseite erzeugen.")
    parser.add_argument(
        "root",
        nargs="?",
        default=Path(__file__).resolve().parents[1],
        type=Path,
        help="Wurzelordner der Website",
    )
    parser.add_argument(
        "--output",
        default="data/material-files-auto.json",
        help="Zieldatei relativ zur Website-Wurzel",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    target = root / args.output
    target.parent.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest(root)
    target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(manifest)} Einträge erfasst: {target}")


if __name__ == "__main__":
    main()
