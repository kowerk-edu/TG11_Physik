# Physikkurs einfach verwalten

**[Kurs öffnen](https://kowerk-edu.github.io/TG11_Physik/) · [Kurs verwalten](https://kowerk-edu.github.io/TG11_Physik/verwaltung/)**

Die Themen stehen untereinander. Ein Klick öffnet ein Thema oder einen Unterordner.
Die Suche findet auch PDFs und Übungen in tiefen Unterordnern.

## 1. Den Namen überall ändern

Öffne auf der Website **Kurs verwalten → Kursname ändern**.
Ersetze das Wort in `verwaltung/kursname.txt` zum Beispiel durch `TGE` oder `TGEI`.
Dann **Commit changes** klicken und bestätigen.

Nur diese eine Datei muss geändert werden. Kopfzeile, Browser-Titel, Navigation,
Begrüßung, Fußzeile, Impressum und die angezeigten Materialtitel übernehmen den Namen.
In eigenen Kurs- und Ankündigungstexten steht dafür der Platzhalter `{{KURS}}`.
Bisherige Bezeichnungen `TGM11` und `TGM` werden in diesen Anzeigetexten ebenfalls ersetzt.

**Ein Befehl im Projektordner:**

```bash
python3 kurs.py name TGE
```

Für TGEI einfach `TGEI` schreiben. Die Befehle speichern lokal. Anschließend mit
GitHub Desktop oder `git commit` und `git push` veröffentlichen.
Die Internetadresse, vorhandene Dateinamen und der Inhalt bestehender PDFs werden nicht umbenannt.

## 2. Ein neues Thema oder einen Unterordner hinzufügen

Öffne **Kurs verwalten → Neuen Ordner anlegen**.

1. **Ganz oben** für ein neues Thema wählen, etwa „Quantenphysik“.
   Für einen Unterordner stattdessen etwa **Kinematik** auswählen.
2. Namen eingeben, zum Beispiel **Freier Fall**.
3. **Ordner auf GitHub anlegen** klicken.
4. Auf GitHub **Commit changes** klicken und bestätigen.

Die Nummer für die Reihenfolge wird automatisch ergänzt. Die vorbereitete Datei
`ordner.txt` hält den Ordner sichtbar, auch wenn noch keine PDF darin liegt.
Sie erscheint selbst nicht als Unterrichtsmaterial. Keine JSON-Datei bearbeiten!

Nach der Veröffentlichung die Verwaltungsseite neu laden; der neue Ordner steht
nun auch bei **PDF hochladen** zur Auswahl.

**Alternativ ein Befehl:**

```bash
python3 kurs.py ordner "03 Kinematik/05 Freier Fall"
python3 kurs.py ordner "08 Quantenphysik/01 Grundlagen"
```

Oder direkt in GitHub **Add file → Create new file** wählen und beispielsweise
`materialien/08 Quantenphysik/01 Grundlagen/ordner.txt` als Dateinamen eingeben.
Als Text reicht „Hier kommen Materialien hin“. Speichern. Fertig.

## 3. Eine PDF bereitstellen

1. **Kurs verwalten → PDF hochladen** öffnen.
2. Den Zielordner auswählen.
3. **PDF auf GitHub hochladen** klicken und die PDF hineinziehen.
4. **Commit changes** klicken.

Nach ein paar Minuten erscheint die PDF automatisch. Es muss kein Link von Hand
angelegt werden. Mehrere Dateien lassen sich gemeinsam hochladen.
Ein verständlicher Dateiname wie `Freier Fall - Aufgaben.pdf` wird zum Materialtitel.
Bilder, Videos und einzelne HTML-Übungen funktionieren genauso.

**Alternativ ein Befehl:**

```bash
python3 kurs.py pdf "Pfad/zum/Arbeitsblatt.pdf" "03 Kinematik/05 Freier Fall"
```

Die Quelldatei bleibt erhalten. Vorhandene gleichnamige PDFs werden nicht überschrieben.

## Alles mit einem kleinen Menü

```bash
python3 kurs.py
```

Das Programm fragt: **1 = Name**, **2 = Ordner**, **3 = PDF**.
Es benötigt Python 3.10 oder neuer, keine zusätzlichen Pakete.

## Ankündigungen, Termine und Themenbilder

- **Ankündigungen:** `verwaltung/ankuendigungen.json` bearbeiten. Einen vorhandenen
  Eintrag kopieren; Titel, Datum und Text ändern; `active` auf `true` setzen.
  Zwischen zwei Einträgen steht ein Komma. Die neuesten Meldungen stehen oben.
- **Termine, Begrüßung und Bilder:** `verwaltung/kurs.json` bearbeiten.
  Den Kursnamen dort mit `{{KURS}}` einsetzen.
- Neue Themen benötigen keinen Eintrag in `kurs.json`. Ihre Ordner reichen aus.
- Material entfernen: Die betreffende Datei in GitHub löschen und speichern.
  Für einen leeren Ordner bleibt `ordner.txt` erhalten; für das Entfernen des
  Ordners auch diese Datei löschen.

## Simulationen und externe Links

Simulationen mit mehreren Dateien erhalten einen eigenen Unterordner mit
`index.html` als Startdatei. Auf der Kursseite erscheint die gesamte Simulation
als ein Eintrag. Beispiel:
`materialien/03 Kinematik/01 Ort-Zeit-Diagramm/Simulation Bewegung/index.html`.
Eine Vorlage liegt unter `vorlagen/simulation/`.

Externe Links werden in einer `links.json` im gewünschten Materialordner erfasst.
Eine Vorlage liegt unter `vorlagen/links.json`.

## Wie die automatische Liste funktioniert

Dieses Repository veröffentlicht bereits mit **GitHub Pages aus dem Branch main**.
Beim normalen Pages-Aufbau erzeugt Jekyll aus `data/materialien.json` die aktuelle
Dateiliste. Deshalb erscheinen neue Uploads und Ordner ohne zusätzlichen Workflow
und gelöschte Dateien verschwinden aus der Kursseite.
`ordner.txt` macht auch leere Ordner auffindbar. Die alte Liste enthielt Verweise auf
nicht mehr vorhandene PDFs; die Listen wurden mit den tatsächlich vorhandenen
Dateien abgeglichen. Fehlende PDFs können erneut hochgeladen werden.

Für eine lokale Vorschau oder einen anderen statischen Webserver:

```bash
python3 kurs.py liste
python3 tools/validate_content.py .
python3 tools/check_internal_links.py .
python3 -m http.server 8000
```

Dann `http://localhost:8000` öffnen. Lokal dienen die Dateien
`data/material-files-auto.json` und `data/material-files.json` als Ersatzliste.
`kurs.py ordner` und `kurs.py pdf` aktualisieren beide Listen selbst.

## Datenschutz und Rechte

Alles im öffentlichen Repository und auf der GitHub-Pages-Seite ist öffentlich
abrufbar. Vor dem Hochladen personenbezogene Daten und Materialien ohne
Veröffentlichungsrecht entfernen.
