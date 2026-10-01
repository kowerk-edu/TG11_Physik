/** Der Kursname wird ausschließlich in verwaltung/kursname.txt geändert. */
export async function loadCourseName() {
  const response = await fetch(new URL('../../verwaltung/kursname.txt', import.meta.url), { cache: 'no-store' });
  if (!response.ok) throw new Error('Der Kursname konnte nicht geladen werden.');
  const name = (await response.text()).trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]{0,39}$/u.test(name)) {
    throw new Error('kursname.txt: Bitte einen Namen mit 1–40 Buchstaben, Zahlen, Leerzeichen oder Bindestrichen eintragen.');
  }
  return name;
}

export function courseText(value, name) {
  return String(value || '')
    .replace(/\{\{KURS\}\}/g, () => name)
    .replace(/(^|[^a-z0-9])TGM(?:11)?(?=$|[^a-z0-9]|PH\b)/gi, (_, prefix) => prefix + name);
}

// Nur Anzeigetexte ersetzen. Dateipfade und Links bleiben gültig.
export function brandCourse(data, name) {
  const textFields = new Set(['title', 'shortname', 'category', 'eyebrow', 'summary', 'intro', 'description', 'text', 'linkText']);
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === 'string' && textFields.has(key)) value[key] = courseText(child, name);
      else if (child && typeof child === 'object') visit(child);
    }
  }
  visit(data);
  data.course.name = name;
  return data;
}

export function applyCourseName(name) {
  document.querySelectorAll('[data-course-name]').forEach(element => { element.textContent = name; });
  const title = document.documentElement.dataset.titleTemplate;
  if (title) document.title = courseText(title, name);
}
