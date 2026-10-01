/**
 * Einstiegspunkt der Webseite.
 * Kursdaten laden -> Oberfläche starten.
 */

import { loadCourseData } from "./data.js?v=11";
import { startCourseApp } from "./ui.js?v=11";

async function main() {
  try {
    const data = await loadCourseData();
    startCourseApp(data);
  } catch (error) {
    console.error("Die Kursseite konnte nicht initialisiert werden.", error);
    document.body.innerHTML = `
      <main class="startup-error">
        <h1>Kursseite konnte nicht geladen werden</h1>
        <p>Prüfe die Dateien unter <code>verwaltung/</code> und lade die Seite neu.</p>
      </main>`;
  }
}

main();
