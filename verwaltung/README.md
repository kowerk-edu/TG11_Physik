# Kurs verwalten

In diesem Ordner liegen nur die Inhalte, die regelmäßig geändert werden.
Der Programmcode liegt getrennt unter `assets/js/`.

## Ankündigung eintragen

Datei `ankuendigungen.json` öffnen und den Beispielblock kopieren.
Zwischen zwei Blöcken muss ein Komma stehen.

```json
{
  "active": true,
  "title": "Klassenarbeit verschoben",
  "date": "2026-11-03",
  "text": "Die Klassenarbeit findet eine Woche später statt.",
  "important": true,
  "link": "",
  "linkText": "Mehr erfahren"
}
```

- `active`: `true` zeigt die Meldung an, `false` blendet sie aus.
- `date`: immer im Format `JJJJ-MM-TT` eintragen.
- `important`: `true` hebt die Meldung stärker hervor.
- `link`: optionaler Weblink. Ohne Link einfach leer lassen.

Die neuesten Ankündigungen stehen automatisch oben.
Zum Löschen den vollständigen Block aus der Datei entfernen.

## Kurstitel oder Themenbilder ändern

Diese Angaben stehen in `kurs.json`.
Neue Themen müssen dort nicht eingetragen werden: Ein neuer Ordner unter
`materialien/` reicht aus. `kurs.json` wird nur für feste Titel, Begrüßung,
Termine und Themenbilder verwendet.

## Breite übergeordnete Kachel

In `kurs.json` sorgt `"featured": true` dafür, dass eine Kachel die gesamte
Breite einnimmt. Ohne weitere Angabe steht sie ganz oben. Mit
`"featuredPosition": "bottom"` steht sie ganz unten.

Bei **Aktuelles** ist die obere breite Kachel aktiviert. **Klassenarbeiten**
ist als breite Kachel am Seitenende eingerichtet. Beide bleiben auf- und
zuklappbar.
