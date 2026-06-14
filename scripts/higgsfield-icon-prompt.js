#!/usr/bin/env node
/**
 * Готовит промпт для Higgsfield (/higgs или generate_image) под стиль иконок проекта.
 * После генерации: сохраните PNG в icons/categories/<Имя>.png → node scripts/build-icons.js sync
 *
 * Пример:
 *   node scripts/higgsfield-icon-prompt.js "Макаронс"
 *   node scripts/higgsfield-icon-prompt.js "Профитроли"
 */
const fs = require('fs');
const path = require('path');

const STYLE = [
  'Ultra-realistic food product photography',
  'single subject centered, studio lighting with soft shadow beneath',
  'pure black background (#000000), no text, no watermark, no plate clutter',
  'warm golden highlights, crisp detail, appetizing pastry/confection look',
  'square 1:1 composition, subject fills ~70% of frame',
  'same visual language as premium patisserie catalog icons',
].join(', ');

function sanitizeFilename(category) {
  return category
    .replace(/\s*\/\s*/g, ' - ')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() + '.png';
}

function subjectHint(category) {
  const c = category.toLowerCase();
  const hints = [
    [/макарон/, 'two pastel French macarons stacked slightly offset, smooth shells and visible ganache filling'],
    [/профитрол/, 'three golden choux profiteroles stacked with glossy dark chocolate glaze drizzle'],
    [/наполеон/, 'triangular slice of Napoleon mille-feuille cake showing crisp layers and cream'],
    [/тирамису/, 'elegant tiramisu slice in a glass cup with cocoa dust and mascarpone layers'],
    [/круассан/, 'one golden flaky croissant, laminated layers visible, glossy baked surface'],
    [/эклер/, 'two chocolate-glazed eclairs with visible choux texture'],
    [/чизкейк/, 'a slice of classic baked cheesecake with graham cracker base'],
    [/бисквит/, 'round sponge cake layer cross-section, airy porous crumb texture'],
    [/ганаш/, 'swirled glossy dark chocolate ganache mound with rich reflection'],
    [/меренг/, 'white meringue kiss with crisp peaks and soft interior glow'],
  ];
  for (const [re, hint] of hints) {
    if (re.test(c)) return hint;
  }
  return `iconic ${category} pastry/confection product, instantly recognizable shape and texture`;
}

function buildPrompt(category) {
  return `Category icon for a Russian pastry recipe app: ${subjectHint(category)}. ${STYLE}.`;
}

const category = process.argv.slice(2).join(' ').trim();
if (!category) {
  console.error('Usage: node scripts/higgsfield-icon-prompt.js "<Категория>"');
  process.exit(1);
}

const filename = sanitizeFilename(category);
const outPath = path.join('icons', 'categories', filename);
const prompt = buildPrompt(category);

console.log('=== Higgsfield: иконка категории ===\n');
console.log('Категория:', category);
console.log('Файл после сохранения:', outPath);
console.log('\n--- Скопируйте в чат Cursor ---\n');
console.log(`/higgs ${prompt}`);
console.log('\n--- Или короткая команда ---\n');
console.log(`/higgs ${prompt.split('. ')[0]}. Square 1:1, photorealistic, black background.`);
console.log('\n--- После генерации ---\n');
console.log(`1. Сохраните изображение как: ${outPath}`);
console.log('2. node scripts/build-icons.js sync');
console.log('3. node scripts/verify-app.js');

const exists = fs.existsSync(path.join(process.cwd(), outPath));
if (exists) {
  console.log('\n⚠ Файл уже существует — генерация заменит иконку после sync.');
}
