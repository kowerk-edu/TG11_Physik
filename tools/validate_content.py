#!/usr/bin/env python3
"""Prüft die leicht editierbaren JSON-Dateien und gibt verständliche Fehler aus."""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        raise ValueError(f"Datei fehlt: {path}") from None
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Ungültiges JSON in {path}: Zeile {exc.lineno}, Spalte {exc.colno}: {exc.msg}"
        ) from None


def valid_http_url(value: str) -> bool:
    if not value:
        return True
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def validate_announcements(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        entries = load_json(path)
    except ValueError as exc:
        return [str(exc)]

    if not isinstance(entries, list):
        return [f"{path}: Der Inhalt muss eine JSON-Liste sein."]

    for index, entry in enumerate(entries, start=1):
        prefix = f"{path}, Eintrag {index}"
        if not isinstance(entry, dict):
            errors.append(f"{prefix}: Der Eintrag muss ein Objekt sein.")
            continue
        if not isinstance(entry.get("title"), str) or not entry.get("title", "").strip():
            errors.append(f"{prefix}: 'title' fehlt oder ist leer.")
        if "active" in entry and not isinstance(entry["active"], bool):
            errors.append(f"{prefix}: 'active' muss true oder false sein.")
        if "important" in entry and not isinstance(entry["important"], bool):
            errors.append(f"{prefix}: 'important' muss true oder false sein.")

        value = str(entry.get("date", "")).strip()
        if value:
            try:
                date.fromisoformat(value)
            except ValueError:
                errors.append(f"{prefix}: 'date' muss das Format JJJJ-MM-TT haben.")

        link = str(entry.get("link", "")).strip()
        if not valid_http_url(link):
            errors.append(f"{prefix}: 'link' muss leer sein oder mit http:// bzw. https:// beginnen.")

    return errors


def validate_course(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        config = load_json(path)
    except ValueError as exc:
        return [str(exc)]

    if not isinstance(config, dict):
        return [f"{path}: Der Inhalt muss ein JSON-Objekt sein."]
    if not isinstance(config.get("course"), dict):
        errors.append(f"{path}: Der Bereich 'course' fehlt.")
    if not isinstance(config.get("sections"), list):
        errors.append(f"{path}: Der Bereich 'sections' muss eine Liste sein.")
    else:
        numbers: set[int] = set()
        for index, section in enumerate(config["sections"], start=1):
            prefix = f"{path}, Bereich {index}"
            if not isinstance(section, dict):
                errors.append(f"{prefix}: Der Bereich muss ein Objekt sein.")
                continue
            if not str(section.get("title", "")).strip():
                errors.append(f"{prefix}: 'title' fehlt oder ist leer.")
            try:
                number = int(section.get("number"))
            except (TypeError, ValueError):
                errors.append(f"{prefix}: 'number' muss eine ganze Zahl sein.")
                continue
            if number in numbers:
                errors.append(f"{prefix}: Die Nummer {number} ist doppelt vergeben.")
            numbers.add(number)

            featured_position = section.get("featuredPosition")
            if featured_position is not None and featured_position not in {"top", "bottom"}:
                errors.append(
                    f"{prefix}: 'featuredPosition' muss 'top' oder 'bottom' sein."
                )
    return errors


def validate_link_files(root: Path) -> list[str]:
    errors: list[str] = []
    for path in sorted((root / "materialien").rglob("links.json")):
        try:
            entries = load_json(path)
        except ValueError as exc:
            errors.append(str(exc))
            continue
        if not isinstance(entries, list):
            errors.append(f"{path}: Der Inhalt muss eine JSON-Liste sein.")
            continue
        for index, entry in enumerate(entries, start=1):
            prefix = f"{path}, Eintrag {index}"
            if not isinstance(entry, dict):
                errors.append(f"{prefix}: Der Eintrag muss ein Objekt sein.")
                continue
            if not str(entry.get("title", "")).strip():
                errors.append(f"{prefix}: 'title' fehlt oder ist leer.")
            if not valid_http_url(str(entry.get("url", "")).strip()):
                errors.append(f"{prefix}: 'url' muss mit http:// oder https:// beginnen.")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser(description="Kursinhalte vor der Veröffentlichung prüfen.")
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()

    errors = []
    errors.extend(validate_course(root / "verwaltung" / "kurs.json"))
    errors.extend(validate_announcements(root / "verwaltung" / "ankuendigungen.json"))
    errors.extend(validate_link_files(root))

    if errors:
        print("Fehler in den editierbaren Kursdateien:")
        for error in errors:
            print(f"- {error}")
        raise SystemExit(1)

    print("Kursdaten, Ankündigungen und externe Links sind gültig.")


if __name__ == "__main__":
    main()
