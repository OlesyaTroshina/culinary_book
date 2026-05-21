#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'culinary_book_v7_24_84_compact_category_icons.html');
const ICONS_CAT = path.join(ROOT, 'icons', 'categories');

function sanitizeFilename(category) {
  return category
    .replace(/\s*\/\s*/g, ' - ')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() + '.png';
}

let errors = 0;
function ok(msg) { console.log('OK:', msg); }
function fail(msg) { console.error('ОШИБКА:', msg); errors++; }

if (!fs.existsSync(APP)) fail('Нет рабочего HTML');
else ok(path.basename(APP));

const h = fs.readFileSync(APP, 'utf8');

const required = [
  'getCategoryIcon',
  'categoryIcon',
  'function openRecipe',
  'function printTechCard',
  'pdfmake',
  'categoryIconMap',
];
for (const r of required) {
  if (h.includes(r)) ok('есть ' + r);
  else fail('нет ' + r);
}

if (h.includes('culinary_book_v7_24_84_compact_category_icons.css')) {
  fail('ссылка на несуществующий внешний CSS');
} else ok('нет битой ссылки на внешний CSS');

try {
  const m = h.match(/const categoryIconMap = (\{[\s\S]*?\});/);
  if (!m) throw new Error('categoryIconMap не распарсился');
  const map = eval('(' + m[1] + ')');
  const keys = Object.keys(map).filter((k) => k !== 'default');
  ok('categoryIconMap: ' + keys.length + ' категорий');
  const pngs = fs.readdirSync(ICONS_CAT).filter((f) => f.endsWith('.png'));
  if (pngs.length !== keys.length) {
    fail('PNG в categories/: ' + pngs.length + ', в map: ' + keys.length);
  } else ok('PNG совпадает с map (' + pngs.length + ')');
  for (const k of keys) {
    const file = sanitizeFilename(k);
    if (!fs.existsSync(path.join(ICONS_CAT, file))) fail('нет файла для «' + k + '»: ' + file);
    const src = map[k];
    if (!src || !String(src).startsWith('data:image/png;base64,')) fail('битая запись map: ' + k);
  }
  if (errors === 0) ok('все категории имеют base64 и PNG');
} catch (e) {
  fail(e.message);
}

if (errors) process.exit(1);
console.log('\nПроверка пройдена.');
