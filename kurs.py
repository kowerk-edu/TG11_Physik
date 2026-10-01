#!/usr/bin/env python3
"""Einfache Kurspflege ohne zusätzliche Programme oder Python-Pakete."""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from tools.update_material_manifest import build_manifest
from tools.validate_content import valid_course_name

ROOT = Path(__file__).resolve().parent


def material_folder(value: str) -> Path:
    value = value.replace('\\', '/').strip().removeprefix('materialien/').rstrip('/')
    parts = value.split('/')
    if not value or any(not part.strip() or part.startswith('.') or any(char in part for char in ':*?"<>|') for part in parts):
        raise ValueError('Bitte einen Ordnernamen wie "03 Kinematik/05 Freier Fall" eingeben.')
    root = (ROOT / 'materialien').resolve()
    folder = (root / value).resolve()
    if not folder.is_relative_to(root) or folder == root:
        raise ValueError('Der Ordner muss unter materialien/ liegen.')
    for ancestor in [folder, *folder.parents]:
        if ancestor == root:
            break
        if (ancestor / 'index.html').exists() or (ancestor / 'index.htm').exists():
            raise ValueError('Dieser Ordner gehört zu einer HTML-Simulation. Bitte einen anderen Ordner wählen.')
    return folder


def refresh_manifest() -> None:
    content = json.dumps(build_manifest(ROOT), ensure_ascii=False, indent=2) + '\n'
    (ROOT / 'data').mkdir(exist_ok=True)
    for filename in ['material-files-auto.json', 'material-files.json']:
        (ROOT / 'data' / filename).write_text(content, encoding='utf-8')


def rename_course(name: str) -> None:
    name = name.strip()
    if not valid_course_name(name):
        raise ValueError('Bitte 1–40 Buchstaben oder Zahlen verwenden. Leerzeichen, _ und - sind ebenfalls erlaubt.')
    (ROOT / 'verwaltung' / 'kursname.txt').write_text(name + '\n', encoding='utf-8')
    print(f'Der Kurs heißt jetzt {name}. Alle Kursbeschriftungen verwenden diesen Namen.')


def add_folder(value: str) -> None:
    folder = material_folder(value)
    folder.mkdir(parents=True, exist_ok=True)
    marker = folder / 'ordner.txt'
    if not marker.exists():
        marker.write_text('Dieser Ordner ist bereit für Unterrichtsmaterialien.\n', encoding='utf-8')
    refresh_manifest()
    print(f'Ordner bereit: {folder.relative_to(ROOT)}')


def add_pdf(source_value: str, folder_value: str) -> None:
    source = Path(source_value).expanduser()
    if not source.is_file() or source.suffix.lower() != '.pdf':
        raise ValueError('Die PDF wurde nicht gefunden. Bitte den Dateipfad prüfen.')
    with source.open('rb') as file:
        if b'%PDF-' not in file.read(1024):
            raise ValueError('Die ausgewählte Datei ist kein lesbares PDF-Dokument.')
    folder = material_folder(folder_value)
    target = folder / source.name
    if target.exists():
        raise ValueError(f'{source.name} gibt es dort schon. Bitte die neue PDF zuerst anders benennen.')
    folder.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    refresh_manifest()
    print(f'PDF hinzugefügt: {target.relative_to(ROOT)}')


def main() -> None:
    parser = argparse.ArgumentParser(description='Kursname ändern, Ordner anlegen und PDFs hinzufügen.')
    commands = parser.add_subparsers(dest='command')
    name_parser = commands.add_parser('name', help='Kurs überall umbenennen')
    name_parser.add_argument('name')
    folder_parser = commands.add_parser('ordner', help='Ober- oder Unterordner anlegen')
    folder_parser.add_argument('folder')
    pdf_parser = commands.add_parser('pdf', help='Eine PDF in einen Materialordner kopieren')
    pdf_parser.add_argument('source')
    pdf_parser.add_argument('folder')
    commands.add_parser('liste', help='Die lokale Materialliste aktualisieren')
    args = parser.parse_args()
    try:
        if args.command is None:
            print('Was möchtest du tun?\n1 = Kursname ändern\n2 = Ordner anlegen\n3 = PDF hinzufügen')
            choice = input('Zahl eingeben: ').strip()
            if choice == '1':
                rename_course(input('Neuer Name, zum Beispiel TGE: '))
            elif choice == '2':
                add_folder(input('Ordner, zum Beispiel 03 Kinematik/05 Freier Fall: '))
            elif choice == '3':
                source = input('Pfad zur PDF-Datei: ')
                add_pdf(source, input('Zielordner, zum Beispiel 03 Kinematik/05 Freier Fall: '))
            else:
                raise ValueError('Bitte mit 1, 2 oder 3 neu starten.')
        elif args.command == 'name':
            rename_course(args.name)
        elif args.command == 'ordner':
            add_folder(args.folder)
        elif args.command == 'pdf':
            add_pdf(args.source, args.folder)
        elif args.command == 'liste':
            refresh_manifest()
            print('Die lokale Materialliste ist aktuell.')
    except (ValueError, OSError) as error:
        parser.exit(1, f'Noch nicht gespeichert: {error}\n')
    except (KeyboardInterrupt, EOFError):
        parser.exit(1, '\nAbgebrochen.\n')
    print('Lokal gespeichert. Für die Website die Änderungen mit GitHub Desktop oder git commit und git push veröffentlichen.')


if __name__ == '__main__':
    main()
