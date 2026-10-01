/**
 * Lädt die leicht editierbaren Dateien aus verwaltung/ und baut daraus
 * zusammen mit dem Ordner materialien/ die Kursstruktur auf.
 */

import {
  directoryName,
  fileKind,
  fileTitle,
  inferredMime,
  normalizePath,
  normalizeTitle,
  parseFolderLabel,
  slug
} from "./utils.js";
import { loadCourseName, brandCourse } from "./branding.js";

const ROOT_URL = new URL('../../', import.meta.url);
const CONFIG_URL = "verwaltung/kurs.json";
const ANNOUNCEMENTS_URL = "verwaltung/ankuendigungen.json";
// GitHub Pages erzeugt die erste Liste bei jedem Upload selbst. Die weiteren
// Listen sind für lokale Vorschauen ohne Jekyll vorgesehen.
const MANIFEST_URLS = ["data/materialien.json", "data/material-files-auto.json", "data/material-files.json"];
const IGNORED_FILES = new Set([".gitkeep", "ordner.txt", "thumbs.db", "desktop.ini", "readme.md", "anleitung.md"]);

async function loadJson(url) {
  const response = await fetch(new URL(url, ROOT_URL), { cache: "no-store" });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

async function loadFirstAvailableJson(urls, fallback = []) {
  for (const url of urls) {
    try {
      const value = await loadJson(url);
      if (Array.isArray(value)) return value;
    } catch (error) {
      // Ein einfacher lokaler Webserver verarbeitet die Jekyll-Vorlage nicht.
      if (url !== MANIFEST_URLS[0]) console.info(`${url} konnte nicht geladen werden.`, error);
    }
  }
  return fallback;
}

function prepareSections(config) {
  return (config.sections || []).map(section => ({
    id: section.id || slug(section.title),
    number: Number(section.number) || 0,
    title: String(section.title || "Thema"),
    summary: String(section.summary || ""),
    image: String(section.image || ""),
    // Hervorgehobene Kacheln nehmen die ganze Breite ein.
    // Standardmäßig stehen sie oben; mit featuredPosition: "bottom" ganz unten.
    featured: section.featured === true || Number(section.number) === 0,
    featuredPosition: section.featuredPosition === "bottom" ? "bottom" : "top",
    items: [],
    announcements: []
  }));
}

function manifestFile(entry) {
  const path = normalizePath(entry.path);
  const filename = String(entry.filename || path.split("/").pop() || "Datei");
  const mime = String(entry.mime || inferredMime(filename));
  return {
    type: "file",
    filename,
    path,
    mime,
    size: Number(entry.size) || 0,
    kind: fileKind(filename, mime)
  };
}

function parseManifest(manifest) {
  const entries = manifest
    .map(entry => {
      if (!entry || typeof entry.path !== "string") return null;
      if (entry.type === "directory") {
        return { type: "directory", path: normalizePath(entry.path) };
      }
      return manifestFile(entry);
    })
    .filter(Boolean)
    .filter(entry => entry.path.startsWith("materialien/") && !entry.path.split('/').includes('..'));
  // Die Pages-Liste enthält Dateien. Auch aus ordner.txt entstehen die
  // übergeordneten Ordner; die Platzhalterdatei selbst wird nicht angezeigt.
  const directories = new Set(entries.filter(entry => entry.type === 'directory').map(entry => entry.path));
  entries.filter(entry => entry.type === 'file').forEach(entry => {
    const parts = entry.path.split('/');
    for (let i = 2; i < parts.length; i += 1) directories.add(parts.slice(0, i).join('/'));
  });
  return [...entries.filter(entry => entry.type === 'file'), ...[...directories].map(path => ({ type: 'directory', path }))]
    .sort((a, b) => a.path.localeCompare(b.path, "de", { numeric: true }));
}

export function materialDirectories(manifest) {
  const entries = parseManifest(manifest);
  const packages = entries.filter(entry => entry.type === 'file' && /^index\.html?$/i.test(entry.filename))
    .map(entry => directoryName(entry.path)).filter(path => path.split('/').length >= 4);
  return entries.filter(entry => entry.type === 'directory' && !packages.some(root => entry.path === root || entry.path.startsWith(root + '/')))
    .map(entry => entry.path);
}

export function loadMaterialManifest() {
  return loadFirstAvailableJson(MANIFEST_URLS, []);
}

function ensureSection(data, segment) {
  const parsed = parseFolderLabel(segment);
  let section = null;

  if (parsed.order !== null) {
    section = data.sections.find(entry => Number(entry.number) === parsed.order);
  }
  if (!section) {
    section = data.sections.find(entry => normalizeTitle(entry.title) === normalizeTitle(parsed.title));
  }
  if (section) return section;

  const nextNumber = parsed.order ?? (Math.max(0, ...data.sections.map(entry => Number(entry.number) || 0)) + 1);
  section = {
    id: `auto-${slug(parsed.title)}`,
    number: nextNumber,
    title: parsed.title,
    summary: "",
    image: "",
    featured: false,
    featuredPosition: "top",
    items: [],
    announcements: [],
    autoCreated: true
  };
  data.sections.push(section);
  return section;
}

function ensureSubsection(section, segment) {
  const parsed = parseFolderLabel(segment);
  section.items ||= [];
  let subsection = section.items.find(item =>
    item.type === "subsection" && (
      (parsed.order !== null && Number(item.order) === parsed.order) ||
      normalizeTitle(item.title) === normalizeTitle(parsed.title)
    )
  );

  if (!subsection) {
    subsection = {
      type: "subsection",
      title: parsed.title,
      order: parsed.order,
      summary: "",
      items: [],
      autoCreated: true
    };
    section.items.push(subsection);
  }
  return subsection;
}

function ensureFolder(items, segment) {
  const parsed = parseFolderLabel(segment);
  let folder = items.find(item =>
    item.type === "folder" && (
      (parsed.order !== null && Number(item.order) === parsed.order) ||
      normalizeTitle(item.title) === normalizeTitle(parsed.title)
    )
  );

  if (!folder) {
    folder = { type: "folder", title: parsed.title, order: parsed.order, items: [] };
    items.push(folder);
  }
  return folder;
}

function placementForDirectories(data, directories) {
  if (!directories.length) return null;
  const section = ensureSection(data, directories[0]);
  if (directories.length === 1) return section.items;

  const subsection = ensureSubsection(section, directories[1]);
  let items = subsection.items;
  for (const segment of directories.slice(2)) {
    items = ensureFolder(items, segment).items;
  }
  return items;
}

function ensureDirectory(data, path) {
  const directories = normalizePath(path).split("/").slice(1).filter(Boolean);
  placementForDirectories(data, directories);
}

function addResource(items, file, title = fileTitle(file.filename)) {
  if (!items) return;
  items.push({
    type: "resource",
    title,
    intro: "",
    resource: file,
    autoDiscovered: true
  });
}

function shouldIgnoreFile(file) {
  const lower = file.filename.toLowerCase();
  return file.filename.startsWith(".") || IGNORED_FILES.has(lower);
}

async function addLinksFromFile(data, file) {
  try {
    const links = await loadJson(file.path);
    if (!Array.isArray(links)) return;

    const directories = directoryName(file.path).split("/").slice(1).filter(Boolean);
    const target = placementForDirectories(data, directories);
    if (!target) return;

    for (const link of links) {
      if (!link || typeof link.url !== "string" || !/^https?:\/\//i.test(link.url)) continue;
      target.push({
        type: "link",
        title: String(link.title || link.url),
        description: String(link.description || ""),
        url: link.url
      });
    }
  } catch (error) {
    console.warn(`Linkdatei ${file.path} konnte nicht gelesen werden.`, error);
  }
}

function sortItems(items) {
  items.sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.title || "").localeCompare(String(b.title || ""), "de", { numeric: true });
  });
  for (const item of items) {
    if (["subsection", "folder"].includes(item.type)) sortItems(item.items || []);
  }
}

export async function buildCourse(config, announcementEntries, rawManifest) {
  const data = {
    course: config.course || {},
    hero: config.hero || {},
    sections: prepareSections(config)
  };

  const manifest = parseManifest(rawManifest);
  const files = manifest.filter(entry => entry.type === "file" && !shouldIgnoreFile(entry));
  const packageRoots = files
    .filter(file => ["index.html", "index.htm"].includes(file.filename.toLowerCase()))
    .filter(file => directoryName(file.path).split("/").length >= 4)
    .map(file => directoryName(file.path))
    .sort((a, b) => b.length - a.length);

  // Verzeichnisse zuerst anlegen. Ordner innerhalb einer kompletten HTML-
  // Simulation werden ausgelassen, weil die Simulation als ein Eintrag erscheint.
  manifest
    .filter(entry => entry.type === "directory")
    .filter(entry => !packageRoots.some(root => entry.path === root || entry.path.startsWith(`${root}/`)))
    .forEach(entry => ensureDirectory(data, entry.path));

  const linkFiles = [];
  for (const file of files) {
    const packageRoot = packageRoots.find(root =>
      file.path === `${root}/index.html` ||
      file.path === `${root}/index.htm` ||
      file.path.startsWith(`${root}/`)
    );

    if (packageRoot) {
      if (!["index.html", "index.htm"].includes(file.filename.toLowerCase())) continue;
      const directories = packageRoot.split("/").slice(1).filter(Boolean);
      const packageTitle = parseFolderLabel(directories.at(-1)).title;
      const target = placementForDirectories(data, directories.slice(0, -1));
      addResource(target, file, packageTitle);
      continue;
    }

    if (file.filename.toLowerCase() === "links.json") {
      linkFiles.push(file);
      continue;
    }

    const directories = directoryName(file.path).split("/").slice(1).filter(Boolean);
    const target = placementForDirectories(data, directories);
    addResource(target, file);
  }

  await Promise.all(linkFiles.map(file => addLinksFromFile(data, file)));

  const announcements = Array.isArray(announcementEntries)
    ? announcementEntries
        .filter(entry => entry && entry.active !== false && entry.title)
        .map(entry => ({
          title: String(entry.title),
          date: String(entry.date || ""),
          text: String(entry.text || ""),
          important: Boolean(entry.important),
          link: String(entry.link || ""),
          linkText: String(entry.linkText || "Mehr erfahren")
        }))
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    : [];

  const currentSection = data.sections.find(section => Number(section.number) === 0)
    || data.sections.find(section => normalizeTitle(section.title) === "aktuelles");
  if (currentSection) currentSection.announcements = announcements;

  data.sections.sort((a, b) => Number(a.number) - Number(b.number));
  data.sections.forEach(section => sortItems(section.items || []));
  return data;
}

export async function loadCourseData() {
  const [config, announcements, manifest, name] = await Promise.all([
    loadJson(CONFIG_URL),
    loadJson(ANNOUNCEMENTS_URL).catch(error => {
      console.warn("Ankündigungen konnten nicht geladen werden.", error);
      return [];
    }),
    loadMaterialManifest(),
    loadCourseName()
  ]);

  return brandCourse(await buildCourse(config, announcements, manifest), name);
}
