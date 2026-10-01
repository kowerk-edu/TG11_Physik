# Kurs verwalten

Am einfachsten geht es über die [Verwaltungsseite](https://kowerk-edu.github.io/TG11_Physik/verwaltung/).
Dort gibt es drei Aufgaben: **PDF hochladen**, **Ordner anlegen** und **Kurs umbenennen**.

- `kursname.txt`: Der einzige Ort für den Kursnamen. Ein Wort, zum Beispiel TGE.
- `kurs.json`: Begrüßung, Termine und Bilder. `{{KURS}}` setzt den aktuellen Namen ein.
- `ankuendigungen.json`: Aktuelle Meldungen.

Neue Ordner und PDFs brauchen keine Einträge in JSON-Dateien.
Die vollständige Anleitung steht in [README.md](../README.md).

## Ankündigung eintragen

In `ankuendigungen.json` einen vorhandenen Block kopieren, ein Komma zwischen die
Blöcke setzen und die Angaben ändern:

```json
{
  "active": true,
  "title": "Neue Hausaufgabe für {{KURS}}",
  "date": "2026-10-05",
  "text": "Bitte Aufgabe 3 bis Freitag bearbeiten.",
  "important": false,
  "link": "",
  "linkText": "Mehr erfahren"
}
```

`active: false` blendet eine Meldung aus. `important: true` hebt sie hervor.
Das Datum hat immer das Format JJJJ-MM-TT. Die neuesten Meldungen stehen oben.
