/**
 * Kleine, gemeinsam verwendete Hilfsfunktionen.
 * In dieser Datei stehen keine Kursinhalte.
 */

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function normalizePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\//, "")
    .replace(/\/{2,}/g, "/");
}

export function directoryName(path) {
  const normalized = normalizePath(path);
  const slash = normalized.lastIndexOf("/");
  return slash === -1 ? "" : normalized.slice(0, slash);
}

export function browserPath(path) {
  return normalizePath(path)
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/");
}

export function parseFolderLabel(segment) {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch (_) {
    // Der Ordnername wird unverändert verwendet.
  }

  const match = decoded.match(/^\s*(\d+)\s*(?:[._-]\s*)?(.+?)\s*$/);
  const order = match ? Number(match[1]) : null;
  const title = (match ? match[2] : decoded).replace(/_/g, " ").trim();
  return { order, title: title || decoded };
}

export function normalizeTitle(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "und")
    .replace(/[^a-z0-9]+/gi, "")
    .toLowerCase();
}

export function slug(value) {
  return normalizeTitle(value) || "bereich";
}

export function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value || "";
  return temp.textContent || "";
}

export function formatBytes(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = Number(bytes);
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function fileTitle(filename) {
  const withoutExtension = String(filename || "").replace(/\.[^.]+$/, "");
  return withoutExtension.replace(/_/g, " ").trim() || filename;
}

export function inferredMime(filename) {
  const extension = String(filename || "").toLowerCase().split(".").pop();
  return ({
    pdf: "application/pdf",
    html: "text/html",
    htm: "text/html",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    mp4: "video/mp4",
    webm: "video/webm",
    ogv: "video/ogg",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    txt: "text/plain",
    csv: "text/csv",
    zip: "application/zip",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  })[extension] || "application/octet-stream";
}

export function fileKind(filename, mime = "") {
  const extension = String(filename || "").toLowerCase().split(".").pop();
  if (mime === "application/pdf" || extension === "pdf") return "pdf";
  if (mime === "text/html" || ["html", "htm"].includes(extension)) return "html";
  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(extension)) return "image";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogv", "mov", "m4v"].includes(extension)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a", "aac"].includes(extension)) return "audio";
  return "file";
}

export function countMaterials(items) {
  return (items || []).reduce((sum, item) => {
    if (["subsection", "folder"].includes(item.type)) {
      return sum + countMaterials(item.items || []);
    }
    return item.type === "resource" || item.type === "link" || item.type === "page" ? sum + 1 : sum;
  }, 0);
}

export function collectSearch(items) {
  return (items || []).map(item => {
    if (["subsection", "folder"].includes(item.type)) {
      return `${item.title} ${collectSearch(item.items || [])}`;
    }
    if (item.type === "resource") {
      return `${item.title} ${item.resource?.filename || ""}`;
    }
    if (item.type === "link") {
      return `${item.title} ${item.description || ""} ${item.url || ""}`;
    }
    return `${item.title || ""} ${stripHtml(item.html || "")}`;
  }).join(" ");
}

export function isSafeLink(value) {
  const link = String(value || "").trim();
  return /^https?:\/\//i.test(link) || /^(?:\.\.?\/|materialien\/|assets\/)/i.test(link);
}
