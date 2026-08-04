#!/usr/bin/env python3
"""Prüft lokale href- und src-Verweise in allen HTML-Dateien."""

from __future__ import annotations

import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class ReferenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.references: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for key, value in attrs:
            if key.lower() in {"href", "src"} and value:
                self.references.append(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Prüft lokale Links in HTML-Dateien.")
    parser.add_argument("root", nargs="?", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    root = args.root.resolve()
    missing: list[tuple[Path, str]] = []

    for html_file in sorted(root.rglob("*.html")):
        ref_parser = ReferenceParser()
        ref_parser.feed(html_file.read_text(encoding="utf-8", errors="ignore"))
        for reference in ref_parser.references:
            if reference.startswith(("#", "mailto:", "tel:", "data:", "javascript:")):
                continue
            parsed = urlsplit(reference)
            if parsed.scheme in {"http", "https"} or parsed.netloc:
                continue
            target = (html_file.parent / unquote(parsed.path)).resolve()
            try:
                target.relative_to(root)
            except ValueError:
                continue
            if not target.exists():
                missing.append((html_file.relative_to(root), reference))

    if missing:
        print("Fehlende lokale Verweise:")
        for html_file, reference in missing:
            print(f"- {html_file}: {reference}")
        raise SystemExit(1)

    print("Keine fehlenden lokalen HTML-Verweise gefunden.")


if __name__ == "__main__":
    main()
