# Materialien

Die Ordnerstruktur erzeugt automatisch die Navigation der Webseite.

```text
materialien/
└── 08 Quantenphysik/       ← neues Thema
    └── 01 Grundlagen/      ← neues Unterthema
        ├── Arbeitsblatt.pdf
        └── Simulation/
            ├── index.html
            ├── app.js
            └── styles.css
```

Die Nummern am Anfang bestimmen die Reihenfolge und werden auf der Webseite
nicht angezeigt. Ein Ordner darf weitere Unterordner enthalten.

Leere Ordner werden von Git nicht gespeichert. Deshalb in einen zunächst leeren
Ordner eine Datei namens `.gitkeep` legen.

Nicht hier eintragen:

- Ankündigungen: `verwaltung/ankuendigungen.json`
- Kurstitel, Termine und Themenbilder: `verwaltung/kurs.json`
