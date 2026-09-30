# TGM11-Physikkurs auf GitHub Pages

Die Webseite ist in drei klar getrennte Bereiche aufgeteilt:

```text
verwaltung/   regelmäßig editierbare Kursdaten und Ankündigungen
materialien/  PDFs, Übungen, Simulationen, Videos und weitere Dateien
assets/js/    Programmcode der Webseite
```

Im normalen Unterrichtsbetrieb müssen nur `verwaltung/` und `materialien/`
bearbeitet werden.

## Ankündigung eintragen

1. `verwaltung/ankuendigungen.json` auf GitHub öffnen.
2. Auf das Stiftsymbol klicken.
3. Den vorhandenen Beispielblock kopieren.
4. `active` auf `true` setzen und Titel, Datum und Text ändern.
5. **Commit changes** drücken.

Beispiel:

```json
{
  "active": true,
  "title": "Neue Hausaufgabe",
  "date": "2026-09-14",
  "text": "Bitte Aufgabe 3 bis Freitag bearbeiten.",
  "important": false,
  "link": "",
  "linkText": "Mehr erfahren"
}
```

Die neuesten Meldungen stehen automatisch oben. Ein Eintrag mit
`"active": false` bleibt gespeichert, wird aber nicht angezeigt.
Eine ausführliche Hilfe steht in `verwaltung/README.md`.

## Material hochladen

1. Den Ordner `materialien/` öffnen.
2. Thema und Unterthema auswählen.
3. **Add file → Upload files** wählen.
4. Datei hochladen und committen.

PDFs, Bilder, Videos und einzelne HTML-Übungen können direkt in den
Unterthemenordner gelegt werden.

## Neues Thema oder Unterthema anlegen

Ein neuer Ordner genügt. Die führende Nummer bestimmt die Reihenfolge und wird
auf der Website ausgeblendet:

```text
materialien/08 Quantenphysik/
materialien/08 Quantenphysik/01 Grundlagen/
```

Damit ein zunächst leerer Ordner von Git gespeichert wird, darin eine leere
Datei namens `.gitkeep` anlegen. Sobald eine echte Datei hochgeladen wird, kann
die `.gitkeep`-Datei bleiben oder gelöscht werden.

Der GitHub-Pages-Workflow erzeugt bei jedem Commit automatisch eine neue
Materialliste. Deshalb muss kein Programmcode angepasst werden.

## Simulation mit mehreren Dateien

Für eine Simulation einen eigenen Unterordner anlegen und die Startdatei
`index.html` nennen:

```text
materialien/03 Kinematik/01 Ort-Zeit-Diagramm/Simulation Bewegung/
├── index.html
├── app.js
├── styles.css
└── bilder/
    └── auto.png
```

Auf der Kursseite erscheint nur ein Eintrag für die Simulation. Die zugehörigen
Hilfsdateien werden nicht einzeln angezeigt. Eine Vorlage liegt unter
`vorlagen/simulation/`.

## Externe Links

Eine Datei `links.json` in den gewünschten Materialordner legen. Vorlage:
`vorlagen/links.json`.

```json
[
  {
    "title": "PhET-Simulation",
    "url": "https://example.org/",
    "description": "Kurze Beschreibung"
  }
]
```

Zum Entfernen eines Links den vollständigen Eintrag aus `links.json` löschen.
Ungültige Einträge ohne `http://` oder `https://` werden nicht angezeigt.

## Material entfernen

Die betreffende Datei oder den vollständigen Simulationsordner löschen und
committen. Nach der automatischen Veröffentlichung verschwindet der Eintrag von
der Kursseite. Es bleiben keine alten Dateiverweise zurück.

## Kurstitel, Begrüßung, Termine oder Themenbilder ändern

Diese festen Angaben stehen übersichtlich in `verwaltung/kurs.json`.
Neue Themen müssen dort nicht ergänzt werden; neue Ordner unter `materialien/`
werden automatisch erkannt.

Mit `"featured": true` wird eine feste Kachel über die gesamte Breite
angezeigt. Standardmäßig steht sie oben. Mit
`"featuredPosition": "bottom"` wird sie unter dem normalen Zwei-Spalten-Raster
angeordnet. **Aktuelles** steht breit oben, **Klassenarbeiten** breit unten.

## GitHub Pages einmalig aktivieren

1. Repository **Settings → Pages** öffnen.
2. Unter **Build and deployment** als Quelle **GitHub Actions** auswählen.
3. Einen Commit auf `main` ausführen oder unter **Actions** den Workflow
   **Kursseite veröffentlichen** starten.

Danach wird die Seite bei jeder Änderung automatisch neu veröffentlicht.

## Lokal testen

```bash
python3 tools/validate_content.py .
python3 tools/update_material_manifest.py .
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Interne Verweise lassen sich zusätzlich
prüfen:

```bash
python3 tools/check_internal_links.py .
```

## Datenschutz und Rechte

Alles im öffentlichen Repository und auf der GitHub-Pages-Seite ist öffentlich
abrufbar. Vor dem Hochladen personenbezogene Daten und Materialien ohne
Veröffentlichungsrecht entfernen. 

### Suche

Die Suche durchsucht nicht nur die großen Themenkacheln, sondern auch Unterordner, PDF-Dateinamen, HTML-Übungen, Simulationen, Links und Ankündigungen. Passende Themen und Ordner werden während der Suche automatisch geöffnet; nicht passende Einträge werden ausgeblendet. Nach dem Löschen des Suchbegriffs wird der vorherige Aufklappzustand wiederhergestellt.
