/**
 * Darstellung und Bedienung der Kursseite.
 * Inhalte werden ausschließlich aus verwaltung/ und materialien/ geladen.
 */

import {
  $,
  $$,
  browserPath,
  collectSearch,
  countMaterials,
  formatBytes,
  isSafeLink,
  stripHtml
} from "./utils.js";
import { applyCourseName } from './branding.js';

function iconFor(kind) {
  return ({
    pdf: "PDF",
    html: "▶",
    image: "▧",
    video: "▶",
    audio: "♫",
    file: "↓",
    page: "≡",
    folder: "▤",
    link: "↗"
  })[kind] || "•";
}

function kindLabel(file) {
  return ({
    pdf: "PDF-Dokument",
    html: "HTML-Übung / Simulation",
    image: "Bild",
    video: "Video",
    audio: "Audio",
    file: "Download"
  })[file.kind] || file.mime || "Datei";
}

function materialCountLabel(count) {
  return count === 1 ? "1 Material" : `${count} Materialien`;
}

function announcementCountLabel(count) {
  return count === 1 ? "1 Ankündigung" : `${count} Ankündigungen`;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

/**
 * Macht die Suche robust gegenüber Groß-/Kleinschreibung und Umlauten.
 * So findet beispielsweise „Ubung“ auch „Übung“.
 */
function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function startCourseApp(data) {
  const grid = $("#courseGrid");
  const nav = $("#sectionNav");
  const modal = $("#viewerModal");
  const viewerBody = $("#viewerBody");
  const viewerTitle = $("#viewerTitle");
  const viewerType = $("#viewerType");
  const openNewTab = $("#openNewTab");
  const downloadFile = $("#downloadFile");
  let lastFocused = null;

  document.title = `${data.course.title} · Kurs`;
  applyCourseName(data.course.name);
  $("#courseTitle").textContent = data.course.title || "Physikkurs";
  $("#courseShortname").textContent = data.course.shortname || "Kurs";
  $("#courseCategory").textContent = data.course.category || "";
  $("#heroEyebrow").textContent = data.hero.eyebrow || `${data.course.name} · Physik`;
  $("#heroTitle").textContent = data.hero.title || "Alle Materialien an einem Ort";
  $("#heroText").textContent = data.hero.text || "Öffne Themen, PDFs und Übungen direkt im Browser.";

  function setExpanded(button, panel, expanded) {
    button.setAttribute("aria-expanded", String(expanded));
    panel.hidden = !expanded;
  }

  function createAnnouncement(announcement) {
    const article = document.createElement("article");
    article.className = `announcement${announcement.important ? " important" : ""}`;
    article.dataset.search = `${announcement.title} ${announcement.text} ${announcement.date}`.toLowerCase();
    article.dataset.searchOwn = article.dataset.search;

    const icon = document.createElement("span");
    icon.className = "announcement-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = announcement.important ? "!" : "i";

    const content = document.createElement("div");
    content.className = "announcement-content";

    const heading = document.createElement("div");
    heading.className = "announcement-heading";
    const title = document.createElement("strong");
    title.textContent = announcement.title;
    heading.append(title);

    if (announcement.date) {
      const time = document.createElement("time");
      time.dateTime = announcement.date;
      time.textContent = formatDate(announcement.date);
      heading.append(time);
    }
    content.append(heading);

    if (announcement.text) {
      const text = document.createElement("p");
      text.textContent = announcement.text;
      content.append(text);
    }

    if (announcement.link && isSafeLink(announcement.link)) {
      const link = document.createElement("a");
      link.href = browserPath(announcement.link).replace(/^https%3A\/\//i, "https://").replace(/^http%3A\/\//i, "http://");
      if (/^https?:\/\//i.test(announcement.link)) {
        link.href = announcement.link;
        link.target = "_blank";
        link.rel = "noopener";
      }
      link.textContent = announcement.linkText || "Mehr erfahren";
      content.append(link);
    }

    article.append(icon, content);
    return article;
  }

  function createMaterial(item) {
    if (item.type === "subsection") return createSubsection(item);

    if (item.type === "folder") {
      const section = document.createElement("section");
      section.className = "material-folder";
      section.dataset.search = `${item.title} ${collectSearch(item.items || [])}`.toLowerCase();
      section.dataset.searchOwn = String(item.title || "").toLowerCase();

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "material folder-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("folder")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span><span class="chevron" aria-hidden="true">⌄</span>`;
      $(".material-title", toggle).textContent = item.title;
      $(".material-meta", toggle).textContent = materialCountLabel(countMaterials(item.items || []));

      const list = document.createElement("div");
      list.className = "folder-list";
      list.hidden = true;
      (item.items || []).forEach(child => list.append(createMaterial(child)));

      toggle.addEventListener("click", () => {
        setExpanded(toggle, list, toggle.getAttribute("aria-expanded") !== "true");
      });

      section.append(toggle, list);
      return section;
    }

    if (item.type === "link") {
      const link = document.createElement("a");
      link.className = "material external-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.dataset.search = `${item.title} ${item.description || ""} ${item.url}`.toLowerCase();
      link.dataset.searchOwn = link.dataset.search;
      link.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("link")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span><span class="material-action">Öffnen ↗</span>`;
      $(".material-title", link).textContent = item.title;
      $(".material-meta", link).textContent = item.description || item.url;
      return link;
    }

    if (item.type === "page") {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "material";
      button.dataset.search = `${item.title} ${stripHtml(item.html)}`.toLowerCase();
      button.dataset.searchOwn = button.dataset.search;
      button.innerHTML = `<span class="item-icon" aria-hidden="true">${iconFor("page")}</span><span class="material-copy"><span class="material-title"></span><span class="material-meta">Kursseite</span></span><span class="material-action">Öffnen</span>`;
      $(".material-title", button).textContent = item.title;
      button.addEventListener("click", () => openPage(item));
      return button;
    }

    if (item.type === "resource") {
      return createFileButton(item.title, item.resource, item.intro);
    }

    const unknown = document.createElement("div");
    unknown.className = "material empty-material";
    unknown.textContent = item.title || "Unbekanntes Material";
    return unknown;
  }

  function createFileButton(title, file, intro = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material";
    button.dataset.search = `${title} ${file.filename || ""} ${stripHtml(intro)}`.toLowerCase();
    button.dataset.searchOwn = button.dataset.search;
    const meta = [kindLabel(file), formatBytes(file.size)].filter(Boolean).join(" · ");
    button.innerHTML = `<span class="item-icon" aria-hidden="true"></span><span class="material-copy"><span class="material-title"></span><span class="material-meta"></span></span><span class="material-action">Öffnen</span>`;
    $(".item-icon", button).textContent = iconFor(file.kind);
    $(".material-title", button).textContent = title;
    $(".material-meta", button).textContent = meta;
    button.addEventListener("click", () => openFile(title, file));
    return button;
  }

  function createSubsection(item) {
    const fragment = $("#subsectionTemplate").content.cloneNode(true);
    const section = $(".subsection", fragment);
    const toggle = $(".subsection-toggle", fragment);
    const body = $(".subsection-body", fragment);
    const title = $(".subsection-title", fragment);
    const meta = $(".subsection-meta", fragment);
    const summary = $(".subsection-summary", fragment);
    const items = $(".subsection-items", fragment);

    title.textContent = item.title;
    const count = countMaterials(item.items || []);
    meta.textContent = count ? materialCountLabel(count) : "Noch ohne Inhalte";
    summary.innerHTML = item.summary || "";
    if (!item.summary) summary.remove();

    (item.items || []).forEach(child => items.append(createMaterial(child)));
    if (!(item.items || []).length) {
      const empty = document.createElement("div");
      empty.className = "material empty-material";
      empty.innerHTML = `<span class="item-icon" aria-hidden="true">·</span><span class="material-copy"><span class="material-title">Noch keine Materialien</span><span class="material-meta">Hier kommen bald neue Unterrichtsmaterialien hinzu.</span></span>`;
      items.append(empty);
    }

    section.dataset.search = `${item.title} ${stripHtml(item.summary)} ${collectSearch(item.items || [])}`.toLowerCase();
    section.dataset.searchOwn = `${item.title} ${stripHtml(item.summary)}`.toLowerCase();
    toggle.addEventListener("click", () => {
      setExpanded(toggle, body, toggle.getAttribute("aria-expanded") !== "true");
    });
    return fragment;
  }

  function sectionSearchText(sectionData) {
    const announcements = (sectionData.announcements || [])
      .map(item => `${item.title} ${item.text} ${item.date}`)
      .join(" ");
    return `${sectionData.title} ${stripHtml(sectionData.summary)} ${announcements} ${collectSearch(sectionData.items || [])}`.toLowerCase();
  }

  function sectionCount(sectionData) {
    const parts = [];
    const announcements = (sectionData.announcements || []).length;
    const materials = countMaterials(sectionData.items || []);
    const folders = (sectionData.items || []).filter(item => ['subsection', 'folder'].includes(item.type)).length;
    if (announcements) parts.push(announcementCountLabel(announcements));
    if (folders) parts.push(folders === 1 ? '1 Unterordner' : `${folders} Unterordner`);
    if (materials) parts.push(materialCountLabel(materials));
    return parts.join(" · ") || (sectionData.summary ? 'Informationen zum Kurs' : 'Noch keine Materialien');
  }

  function renderSection(sectionData) {
    const fragment = $("#sectionTemplate").content.cloneNode(true);
    const article = $(".section-card", fragment);
    const cover = $(".section-cover", fragment);
    const content = $(".section-content", fragment);
    const image = $(".cover-image", fragment);
    const summary = $(".section-summary", fragment);
    const items = $(".section-items", fragment);

    article.id = `section-${sectionData.id}`;
    content.id = `${article.id}-content`;
    cover.setAttribute('aria-controls', content.id);
    article.dataset.search = sectionSearchText(sectionData);
    article.dataset.searchOwn = `${sectionData.title} ${stripHtml(sectionData.summary)}`.toLowerCase();
    article.classList.toggle("featured-section", sectionData.featured === true);
    article.classList.toggle(
      "featured-bottom",
      sectionData.featured === true && sectionData.featuredPosition === "bottom"
    );
    $(".section-number", fragment).textContent = Number(sectionData.number) === 0 ? "Start" : `Thema ${sectionData.number}`;
    $(".section-title", fragment).textContent = sectionData.title;
    $(".section-count", fragment).textContent = sectionCount(sectionData);

    if (sectionData.image) {
      image.style.backgroundImage = `url("${browserPath(sectionData.image)}")`;
    } else {
      image.style.backgroundImage = "radial-gradient(circle at 75% 20%, rgba(255,255,255,.2), transparent 28%), linear-gradient(130deg,#246aa6,#123e65)";
    }

    summary.innerHTML = sectionData.summary || "";
    if (!sectionData.summary) summary.remove();

    if ((sectionData.announcements || []).length) {
      const announcementList = document.createElement("div");
      announcementList.className = "announcement-list";
      sectionData.announcements.forEach(item => announcementList.append(createAnnouncement(item)));
      items.before(announcementList);
    }

    (sectionData.items || []).forEach(item => items.append(createMaterial(item)));
    if (!(sectionData.items || []).length && !(sectionData.announcements || []).length && !sectionData.summary) {
      const empty = document.createElement("div");
      empty.className = "material empty-material";
      empty.innerHTML = `<span class="item-icon" aria-hidden="true">·</span><span class="material-copy"><span class="material-title">Noch keine Materialien</span><span class="material-meta">Hier kommen bald neue Unterrichtsmaterialien hinzu.</span></span>`;
      items.append(empty);
    }

    function setSectionOpen(open, { updateAddress = true } = {}) {
      setExpanded(cover, content, open);
      article.classList.toggle("open", open);

      if (!updateAddress) return;
      if (open) {
        history.replaceState(null, "", `#${article.id}`);
      } else if (location.hash === `#${article.id}`) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    }

    cover.addEventListener("click", () => {
      const open = cover.getAttribute("aria-expanded") !== "true";
      setSectionOpen(open);
    });
    grid.append(fragment);

    const navButton = document.createElement("button");
    navButton.type = "button";
    navButton.className = "nav-link";
    navButton.innerHTML = `<span class="nav-number"></span><span class="nav-title"></span>`;
    $(".nav-number", navButton).textContent = Number(sectionData.number) === 0 ? "S" : sectionData.number;
    $(".nav-title", navButton).textContent = sectionData.title;
    navButton.addEventListener("click", () => {
      const open = cover.getAttribute("aria-expanded") !== "true";
      setSectionOpen(open);

      if (open) {
        article.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      closeSidebar();
    });
    nav.append(navButton);
  }

  function openFile(title, file) {
    lastFocused = document.activeElement;
    viewerTitle.textContent = title;
    viewerType.textContent = kindLabel(file);
    const url = browserPath(file.path);
    openNewTab.href = url;
    openNewTab.hidden = false;
    downloadFile.href = url;
    downloadFile.download = file.filename || "";
    downloadFile.hidden = false;
    viewerBody.replaceChildren();

    if (["pdf", "html", "image"].includes(file.kind)) {
      const frame = document.createElement("iframe");
      frame.className = "viewer-frame";
      frame.title = title;
      frame.src = url;
      frame.allowFullscreen = true;
      if (file.kind === "html") {
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-presentation");
      }
      viewerBody.append(frame);
    } else if (file.kind === "video") {
      const video = document.createElement("video");
      video.className = "viewer-media";
      video.src = url;
      video.controls = true;
      video.playsInline = true;
      viewerBody.append(video);
    } else if (file.kind === "audio") {
      const audio = document.createElement("audio");
      audio.className = "viewer-audio";
      audio.src = url;
      audio.controls = true;
      viewerBody.append(audio);
    } else {
      const page = document.createElement("div");
      page.className = "page-view prose";
      const heading = document.createElement("h2");
      heading.textContent = "Datei herunterladen";
      const text = document.createElement("p");
      text.textContent = "Dieser Dateityp wird nicht direkt im Browser angezeigt.";
      const linkParagraph = document.createElement("p");
      const link = document.createElement("a");
      link.className = "button secondary";
      link.href = url;
      link.download = file.filename || "";
      link.textContent = "Download starten";
      linkParagraph.append(link);
      page.append(heading, text, linkParagraph);
      viewerBody.append(page);
    }

    showModal();
    history.replaceState(null, "", `#material=${encodeURIComponent(file.path)}`);
  }

  function openPage(item) {
    lastFocused = document.activeElement;
    viewerTitle.textContent = item.title;
    viewerType.textContent = "Kursseite";
    openNewTab.hidden = true;
    downloadFile.hidden = true;
    viewerBody.replaceChildren();
    const page = document.createElement("article");
    page.className = "page-view prose";
    page.innerHTML = item.html || "<p>Diese Seite enthält keinen Inhalt.</p>";
    viewerBody.append(page);
    showModal();
  }

  function showModal() {
    modal.hidden = false;
    document.body.classList.add("modal-open");
    $("button[data-close-modal]", modal).focus();
  }

  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true;
    viewerBody.replaceChildren();
    document.body.classList.remove("modal-open");
    if (location.hash.startsWith("#material=")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    lastFocused?.focus();
  }

  $$('[data-close-modal]').forEach(element => element.addEventListener("click", closeModal));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeModal();
      closeSidebar();
    }
  });

  data.sections.forEach(renderSection);

  const searchInput = $("#searchInput");
  let stateBeforeSearch = null;

  function expandedPanel(toggle) {
    if (toggle.classList.contains("section-cover")) {
      return toggle.parentElement.querySelector(":scope > .section-content");
    }
    if (toggle.classList.contains("subsection-toggle")) {
      return toggle.parentElement.querySelector(":scope > .subsection-body");
    }
    if (toggle.classList.contains("folder-toggle")) {
      return toggle.parentElement.querySelector(":scope > .folder-list");
    }
    return null;
  }

  function setSearchExpanded(toggle, expanded) {
    const panel = expandedPanel(toggle);
    if (!panel) return;
    setExpanded(toggle, panel, expanded);
    if (toggle.classList.contains("section-cover")) {
      toggle.parentElement.classList.toggle("open", expanded);
    }
  }

  function rememberOpenState() {
    stateBeforeSearch = new Map();
    $$("button[aria-expanded]", grid).forEach(toggle => {
      stateBeforeSearch.set(toggle, toggle.getAttribute("aria-expanded") === "true");
    });
  }

  function expandAll(expanded) {
    searchInput.value = '';
    resetSearchDisplay();
    $$('button[aria-expanded]', grid).forEach(toggle => setSearchExpanded(toggle, expanded));
  }
  $('#expandAll').addEventListener('click', () => expandAll(true));
  $('#collapseAll').addEventListener('click', () => expandAll(false));

  function restoreOpenState() {
    if (!stateBeforeSearch) return;
    stateBeforeSearch.forEach((expanded, toggle) => setSearchExpanded(toggle, expanded));
    stateBeforeSearch = null;
  }

  function resetSearchDisplay() {
    restoreOpenState();
    $$('[data-search], .section-card, .subsection, .material-folder, .announcement-list', grid).forEach(element => {
      element.hidden = false;
      element.classList.remove("search-match");
    });
    grid.classList.remove("searching");
    $("#searchStatus").textContent = "";
    $("#emptySearch").hidden = true;
  }

  function ownMatches(element, term) {
    return normalizeSearch(element.dataset.searchOwn || element.dataset.search).includes(term);
  }

  function filterLeaf(element, term, showAll) {
    const ownMatch = ownMatches(element, term);
    const visible = showAll || ownMatch;
    element.hidden = !visible;
    element.classList.toggle("search-match", ownMatch);
    return { visible, hits: ownMatch ? 1 : 0 };
  }

  function filterFolder(folder, term, showAll = false) {
    const ownMatch = ownMatches(folder, term);
    const revealChildren = showAll || ownMatch;
    const list = folder.querySelector(":scope > .folder-list");
    let childVisible = false;
    let hits = ownMatch ? 1 : 0;

    Array.from(list?.children || []).forEach(child => {
      const result = filterMaterialNode(child, term, revealChildren);
      childVisible ||= result.visible;
      hits += result.hits;
    });

    const visible = revealChildren || childVisible;
    folder.hidden = !visible;
    folder.classList.toggle("search-match", ownMatch);
    if (visible) setSearchExpanded(folder.querySelector(":scope > .folder-toggle"), true);
    return { visible, hits };
  }

  function filterSubsection(subsection, term, showAll = false) {
    const ownMatch = ownMatches(subsection, term);
    const revealChildren = showAll || ownMatch;
    const itemList = subsection.querySelector(":scope > .subsection-body > .subsection-items");
    let childVisible = false;
    let hits = ownMatch ? 1 : 0;

    Array.from(itemList?.children || []).forEach(child => {
      const result = filterMaterialNode(child, term, revealChildren);
      childVisible ||= result.visible;
      hits += result.hits;
    });

    const visible = revealChildren || childVisible;
    subsection.hidden = !visible;
    subsection.classList.toggle("search-match", ownMatch);
    if (visible) setSearchExpanded(subsection.querySelector(":scope > .subsection-toggle"), true);
    return { visible, hits };
  }

  function filterMaterialNode(element, term, showAll = false) {
    if (element.classList.contains("material-folder")) {
      return filterFolder(element, term, showAll);
    }
    if (element.classList.contains("subsection")) {
      return filterSubsection(element, term, showAll);
    }
    return filterLeaf(element, term, showAll);
  }

  function filterSection(card, term) {
    const ownMatch = ownMatches(card, term);
    const showAll = ownMatch;
    let contentVisible = false;
    let hits = ownMatch ? 1 : 0;

    const announcementList = card.querySelector(":scope > .section-content > .announcement-list");
    let announcementVisible = false;
    announcementList?.querySelectorAll(":scope > .announcement").forEach(announcement => {
      const result = filterLeaf(announcement, term, showAll);
      announcementVisible ||= result.visible;
      contentVisible ||= result.visible;
      hits += result.hits;
    });
    if (announcementList) announcementList.hidden = !announcementVisible;

    const sectionItems = card.querySelector(":scope > .section-content > .section-items");
    Array.from(sectionItems?.children || []).forEach(child => {
      const result = filterMaterialNode(child, term, showAll);
      contentVisible ||= result.visible;
      hits += result.hits;
    });

    const visible = showAll || contentVisible;
    card.hidden = !visible;
    card.classList.toggle("search-match", ownMatch);
    if (visible) setSearchExpanded(card.querySelector(":scope > .section-cover"), true);
    return { visible, hits };
  }

  searchInput.addEventListener("input", () => {
    const term = normalizeSearch(searchInput.value.trim());
    if (!term) {
      resetSearchDisplay();
      return;
    }

    if (!stateBeforeSearch) rememberOpenState();
    grid.classList.add("searching");

    let visibleSections = 0;
    let hits = 0;
    $$(".section-card", grid).forEach(card => {
      const result = filterSection(card, term);
      if (result.visible) visibleSections += 1;
      hits += result.hits;
    });

    const hitLabel = hits === 1 ? "1 Treffer" : `${hits} Treffer`;
    const sectionLabel = visibleSections === 1 ? "1 Bereich" : `${visibleSections} Bereichen`;
    $("#searchStatus").textContent = `${hitLabel} in ${sectionLabel}`;
    $("#emptySearch").hidden = visibleSections !== 0;
  });

  const menuButton = $("#menuButton");
  const sidebar = $("#sidebar");
  menuButton.addEventListener("click", () => {
    const open = !sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    menuButton.setAttribute("aria-expanded", String(open));
  });

  function closeSidebar() {
    sidebar.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }

  const initialHash = location.hash;
  if (initialHash.startsWith("#section-")) {
    const target = document.querySelector(initialHash);
    if (target) {
      const cover = $(".section-cover", target);
      const content = $(".section-content", target);
      setExpanded(cover, content, true);
      target.classList.add("open");
      setTimeout(() => target.scrollIntoView({ block: "start" }), 0);
    }
  }
}
