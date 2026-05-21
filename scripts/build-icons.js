#!/usr/bin/env node
/**
 * Утилита для папки icons/ — не меняет HTML, CSS, логику приложения.
 *
 * extract  — извлечь PNG из categoryIconMap (HTML) → icons/categories/<Категория>.png
 * report   — icons-map.json + ICONS.md (таблица категория ↔ файл)
 * archive  — перенести старые ChatGPT-имена в icons/_archive_chatgpt_names/
 * sync     — подставить PNG из icons/categories/ в categoryIconMap (только картинки, без CSS/логики)
 * all      — extract + report + archive
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
/** Рабочее приложение (единственный источник и приёмник иконок) */
const APP_WORK = path.join(ROOT, 'culinary_book_v7_24_84_compact_category_icons.html');
const ICONS_RAW = path.join(ROOT, 'icons');
const ICONS_CAT = path.join(ROOT, 'icons', 'categories');
const ARCHIVE = path.join(ROOT, 'icons', '_archive_chatgpt_names');
const MAP_JSON = path.join(ROOT, 'icons', 'icons-map.json');
const MAP_MD = path.join(ROOT, 'icons', 'ICONS.md');

function sanitizeFilename(category) {
  return category
    .replace(/\s*\/\s*/g, ' - ')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() + '.png';
}

function readCategoryIconMap(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  const m = html.match(/const categoryIconMap = (\{[\s\S]*?\});/);
  if (!m) throw new Error('categoryIconMap not found in ' + htmlPath);
  return eval('(' + m[1] + ')');
}

function extractFromHtml(htmlPath) {
  const map = readCategoryIconMap(htmlPath);
  fs.mkdirSync(ICONS_CAT, { recursive: true });
  const categories = [];
  for (const [cat, data] of Object.entries(map)) {
    if (cat === 'default' || !data || !String(data).startsWith('data:image')) continue;
    const b64 = String(data).split(',')[1];
    const buf = Buffer.from(b64, 'base64');
    const file = sanitizeFilename(cat);
    fs.writeFileSync(path.join(ICONS_CAT, file), buf);
    categories.push({
      category: cat,
      file,
      relativePath: 'icons/categories/' + file,
      bytes: buf.length,
      md5: crypto.createHash('md5').update(buf).digest('hex'),
    });
  }
  return categories;
}

function scanRawIcons() {
  const unused = [];
  const matched = [];
  if (!fs.existsSync(ICONS_RAW)) return { matched, unused };
  for (const name of fs.readdirSync(ICONS_RAW)) {
    if (!name.endsWith('.png')) continue;
    const full = path.join(ICONS_RAW, name);
    try {
      if (!fs.statSync(full).isFile()) continue;
    } catch {
      continue;
    }
    const buf = fs.readFileSync(full);
    unused.push({
      rawFile: name,
      md5: crypto.createHash('md5').update(buf).digest('hex'),
      bytes: buf.length,
    });
  }
  return { matched, unused };
}

function writeReport(data) {
  const cats = data.categories || [];
  const lines = [
    '# Иконки категорий (справочник)',
    '',
    'Файлы в `icons/categories/` — копии иконок из **рабочего** `culinary_book_v7_24_84_compact_category_icons.html`.',
    'Папку приложение не читает; размеры и логика в HTML не менялись.',
    '',
    `Обновлено: ${data.generatedAt || new Date().toISOString()}`,
    '',
    '| Категория | Файл | Размер |',
    '|-----------|------|--------|',
  ];
  for (const c of [...cats].sort((a, b) => a.category.localeCompare(b.category, 'ru'))) {
    lines.push(`| ${c.category} | \`${c.file}\` | ${(c.bytes / 1024).toFixed(1)} KB |`);
  }
  if (data.unusedRawFiles?.length) {
    lines.push('', '## Исходные PNG (не совпадают с иконками в приложении)', '');
    lines.push('| Файл в архиве | Размер |', '|----------------|--------|');
    for (const u of data.unusedRawFiles) {
      lines.push(`| \`${u.rawFile}\` | ${(u.bytes / 1024).toFixed(1)} KB |`);
    }
  }
  fs.writeFileSync(MAP_MD, lines.join('\n'), 'utf8');
}

function archiveRaw() {
  fs.mkdirSync(ARCHIVE, { recursive: true });
  let n = 0;
  for (const name of fs.readdirSync(ICONS_RAW)) {
    if (!name.endsWith('.png')) continue;
    const src = path.join(ICONS_RAW, name);
    if (!fs.statSync(src).isFile()) continue;
    const dest = path.join(ARCHIVE, name);
    if (!fs.existsSync(dest)) {
      fs.renameSync(src, dest);
      n++;
    }
  }
  return n;
}

function buildMapFromCategories(existingMap) {
  const data = fs.existsSync(MAP_JSON)
    ? JSON.parse(fs.readFileSync(MAP_JSON, 'utf8'))
    : { categories: [] };
  const list = data.categories?.length ? data.categories : [];
  if (!list.length && fs.existsSync(ICONS_CAT)) {
    throw new Error('Сначала: node scripts/build-icons.js extract');
  }
  const next = { default: existingMap?.default || '' };
  for (const c of list) {
    const p = path.join(ICONS_CAT, c.file);
    if (!fs.existsSync(p)) {
      console.warn('Нет файла:', c.file);
      continue;
    }
    const buf = fs.readFileSync(p);
    next[c.category] = 'data:image/png;base64,' + buf.toString('base64');
  }
  if (!next.default && next['Декор']) next.default = next['Декор'];
  return next;
}

function patchCategoryIconMap(htmlPath, map) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const lines = ['    const categoryIconMap = {'];
  for (const [k, v] of Object.entries(map)) {
    lines.push('      ' + JSON.stringify(k) + ': ' + JSON.stringify(v) + ',');
  }
  lines.push('    };');
  const replacement = lines.join('\n');
  const re = /const categoryIconMap = \{[\s\S]*?\};/;
  if (!re.test(html)) throw new Error('categoryIconMap не найден: ' + htmlPath);
  html = html.replace(re, replacement);
  fs.writeFileSync(htmlPath, html, 'utf8');
}

function workAppPath() {
  if (!fs.existsSync(APP_WORK)) throw new Error('Нет рабочего файла: ' + path.basename(APP_WORK));
  return APP_WORK;
}

function cmdSync() {
  const app = workAppPath();
  const existing = readCategoryIconMap(app);
  const map = buildMapFromCategories(existing);
  patchCategoryIconMap(app, map);
  console.log('Рабочее приложение:', path.basename(app));
  console.log('Категорий:', Object.keys(map).filter((k) => k !== 'default').length);
  console.log('CSS, расчёты, печать, управление — не трогались');
}

function cmdExtract() {
  const source = workAppPath();
  console.log('Рабочее приложение (источник):', path.basename(source));
  const categories = extractFromHtml(source);
  const raw = scanRawIcons();
  const byMd5 = new Map(categories.map((c) => [c.md5, c]));
  const matched = [];
  const unused = [];
  for (const r of raw.unused) {
    const c = byMd5.get(r.md5);
    if (c) matched.push({ rawFile: r.rawFile, category: c.category, file: c.file });
    else unused.push(r);
  }
  const data = {
    version: '7.24.84',
    generatedAt: new Date().toISOString(),
    sourceApp: 'culinary_book_v7_24_84_compact_category_icons.html',
    note: 'Справочник для рабочего приложения. base64 в categoryIconMap.',
    categories,
    rawMatchedByHash: matched,
    unusedRawFiles: unused,
  };
  fs.writeFileSync(MAP_JSON, JSON.stringify(data, null, 2), 'utf8');
  writeReport(data);
  console.log('Извлечено:', categories.length, '→ icons/categories/');
  console.log('Совпало с сырыми PNG по MD5:', matched.length);
  console.log('Сырых без совпадения:', unused.length);
  return data;
}

const cmd = process.argv[2] || 'all';
try {
  if (cmd === 'extract') cmdExtract();
  else if (cmd === 'report') {
    if (!fs.existsSync(MAP_JSON)) cmdExtract();
    else writeReport(JSON.parse(fs.readFileSync(MAP_JSON, 'utf8')));
    console.log('Wrote', MAP_MD);
  } else if (cmd === 'archive') {
    const n = archiveRaw();
    console.log('В архив:', n, 'файлов →', ARCHIVE);
  } else if (cmd === 'sync') cmdSync();
  else if (cmd === 'all') {
    cmdExtract();
    const n = archiveRaw();
    console.log('В архив:', n, 'файлов');
    console.log('Готово. Загрузка PNG в приложение: node scripts/build-icons.js sync');
  } else {
    console.log('Usage: node scripts/build-icons.js [extract|report|archive|sync|all]');
    process.exit(1);
  }
} catch (e) {
  console.error(e);
  process.exit(1);
}
