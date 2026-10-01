import { loadCourseName, applyCourseName } from './branding.js';
import { loadMaterialManifest, materialDirectories } from './data.js?v=11';
import { normalizeTitle, parseFolderLabel } from './utils.js';

const $ = selector => document.querySelector(selector);
const pathLabel = path => path.split('/').slice(1).map(part => parseFolderLabel(part).title).join(' › ');
const encodePath = path => path.split('/').map(encodeURIComponent).join('/');

export function nextFolderPath(parent, name, directories) {
  const title = name.trim();
  if (!title || title.length > 80 || /^[._]/.test(title) || /[\\/:*?"<>|\u0000-\u001f]/.test(title) || title.endsWith('.')) {
    throw new Error('Bitte einen Namen ohne Schrägstriche oder Sonderzeichen wie : * ? eingeben.');
  }
  const siblings = directories.filter(path => path.slice(0, path.lastIndexOf('/')) === parent);
  const parsed = parseFolderLabel(title);
  if (siblings.some(path => normalizeTitle(parseFolderLabel(path.split('/').at(-1)).title) === normalizeTitle(parsed.title))) {
    throw new Error('Diesen Ordner gibt es hier schon. Wähle bitte einen anderen Namen.');
  }
  const next = Math.max(0, ...siblings.map(path => parseFolderLabel(path.split('/').at(-1)).order || 0)) + 1;
  return `${parent}/${String(next).padStart(2, '0')} ${parsed.title}`;
}

async function main() {
  const [name, manifest, response] = await Promise.all([
    loadCourseName(), loadMaterialManifest(), fetch(new URL('../../verwaltung/kurs.json', import.meta.url), { cache: 'no-store' })
  ]);
  if (!response.ok) throw new Error('Die Kurseinstellungen konnten nicht geladen werden.');
  const config = await response.json();
  applyCourseName(name);
  const repo = { ...config.repository };
  if (location.hostname.endsWith('.github.io')) {
    repo.owner = location.hostname.replace(/\.github\.io$/, '');
    repo.name = location.pathname.split('/').filter(Boolean)[0];
  }
  if (!repo.owner || !repo.name || !repo.branch) throw new Error('Die GitHub-Adresse fehlt in verwaltung/kurs.json.');
  const base = `https://github.com/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.name)}`;
  const branch = encodeURIComponent(repo.branch);
  const directories = materialDirectories(manifest);
  if (!directories.length) throw new Error('Die Ordnerliste ist noch leer. Bitte die Kursseite neu veröffentlichen und dann neu laden.');
  const option = (text, value) => new Option(text, value);
  $('#parentFolder').append(option('Ganz oben – neue Oberkategorie', 'materialien'));
  for (const path of directories) {
    $('#parentFolder').append(option(pathLabel(path), path));
    $('#uploadFolder').append(option(pathLabel(path), path));
  }
  const updateUpload = () => { $('#uploadLink').href = `${base}/upload/${branch}/${encodePath($('#uploadFolder').value)}`; };
  $('#uploadFolder').addEventListener('change', updateUpload);
  updateUpload();

  function updateFolder() {
    const link = $('#createFolderLink');
    link.removeAttribute('href');
    link.setAttribute('aria-disabled', 'true');
    if (!$('#folderName').value.trim()) { $('#folderPreview').textContent = 'Gib einen Namen ein.'; return; }
    try {
      const path = nextFolderPath($('#parentFolder').value, $('#folderName').value, directories);
      const params = new URLSearchParams({ filename: `${path}/ordner.txt`, value: 'Dieser Ordner ist bereit für Unterrichtsmaterialien.\n' });
      link.href = `${base}/new/${branch}/?${params}`;
      link.removeAttribute('aria-disabled');
      $('#folderPreview').textContent = `Neuer Ordner: ${pathLabel(path)}`;
    } catch (error) {
      $('#folderPreview').textContent = error.message;
    }
  }
  $('#folderName').addEventListener('input', updateFolder);
  $('#parentFolder').addEventListener('change', updateFolder);
  $('#renameLink').href = `${base}/edit/${branch}/verwaltung/kursname.txt`;
  $('#announcementLink').href = `${base}/edit/${branch}/verwaltung/ankuendigungen.json`;
  $('#guideLink').href = `${base}/blob/${branch}/KURZANLEITUNG.txt`;
  $('#manageStatus').textContent = '';
  $('#manageTools').hidden = false;
}

main().catch(error => {
  console.error(error);
  $('#manageStatus').textContent = `${error.message} Bitte lade die Seite erneut.`;
});
