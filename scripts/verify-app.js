#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'index.html');
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
  'function openCreamFillingRecipe',
  'function renderUsageBadges',
  'function calcCreamOutputWeight',
  'function addCreamRecipeIngredient',
  'cream_filling',
  'usageFlags',
  'baseOutputWeight',
  'defaultYieldMap',
  'function getYieldRate',
  'function getIngredientReadyAmount',
  'function getIngredientRawAmount',
  'function calcRecipeReadyWeight',
  'function calcRecipeRawWeight',
  'function applyCoverageToRecipe',
  'function buildCakeCoveragePanel',
  'coverageSelections',
  'coveragePortionRate',
  'DEFAULT_COVERAGE_PORTION_RATE',
  'isTieredCake',
  'function recalcTieredCake',
  'function collectAllCalcIngredients',
  'function buildCakeTiersPanel',
  'TIER_ROUND_FORM_RATE',
  'TIER_SQUARE_FORM_RATE',
  'mold_baking',
  'moldCount',
  'moldYieldCategory',
  'MOLD_BAKING_YIELD_CATEGORIES',
  'function openMoldBakingRecipe',
  'function recalcMoldBaking',
  'function calcMoldRecipeReadyWeight',
  'function calcMoldRecipeRawWeight',
  'function calcMoldRawPerForm',
  'function calcMoldReadyPerUnit',
  'function addMoldBakingIngredient',
  'mold-baking-panel',
  'zefirHalfCount',
  'zefirPackSize',
  'zefirYieldCategory',
  'ZEFIR_CANDY_YIELD_CATEGORIES',
  'function openZefirCandyRecipe',
  'function recalcZefirCandy',
  'function calcZefirRecipeReadyWeight',
  'function calcZefirFinishedCount',
  'function calcZefirUnitCost',
  'function calcZefirPackCost',
  'function addZefirCandyIngredient',
  'zefir-candy-panel',
  'function importTemplateExcel',
  'function parseCakeSheetRows',
  'function isCreamLayerForImport',
  'function proportionsSimilar',
  'function findCreamDuplicateMatches',
  'creamImportCompareModal',
  'layerCreamLinks',
  'IMPORT_SHEET_TABS',
];
for (const r of required) {
  if (h.includes(r)) ok('есть ' + r);
  else fail('нет ' + r);
}

if (h.includes('culinary_book_v7_24_84_compact_category_icons.css')) {
  fail('ссылка на несуществующий внешний CSS');
} else ok('нет битой ссылки на внешний CSS');

const pastryCss = path.join(ROOT, 'assets', 'ui', 'pastry-controls-unified.css');
const pearlTexture = path.join(ROOT, 'assets', 'ui', 'buttons', 'textures', 'pearl-mother-of-pearl.png');
const hasPastryLink = h.includes('assets/ui/pastry-controls-unified.css');
const hasPastryInline = h.includes('V80_PASTry_UNIFIED_CONTROLS') || h.includes('V81_PASTry_UNIFIED_OVERRIDE');
if (fs.existsSync(pastryCss) && (hasPastryLink || hasPastryInline)) ok('подключена единая система pastry-controls');
else fail('нет pastry-controls-unified.css или блока V80/V81 pastry-controls');
if (h.includes('pearl-mother-of-pearl.png') && !h.includes('--real-pearl-texture: url("data:image')) {
  ok('текстура кнопок — PNG, не base64');
} else if (h.includes('--real-pearl-texture: url("data:image')) {
  fail('в index.html всё ещё base64-текстура перламутра');
}
if (fs.existsSync(pearlTexture)) ok('есть текстура pearl-mother-of-pearl.png');
else fail('нет assets/ui/buttons/textures/pearl-mother-of-pearl.png');

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

try {
  const ym = h.match(/const defaultYieldMap=\{([\s\S]*?)\};/);
  if (!ym) throw new Error('defaultYieldMap не найден');
  const map = eval('({' + ym[1] + '})');
  const requiredYield = {
    'Бисквит': 0.9,
    'Безе': 0.65,
    'Крем': 1,
    'Меренга': 1,
    'Упаковка': 0,
    'Доставка': 0,
    'Зефир': 0.9,
    'Пастила': 0.75,
    'Мармелад': 0.85,
    'Суфле': 0.95,
  };
  for (const [k, v] of Object.entries(requiredYield)) {
    if (map[k] !== v) fail('defaultYieldMap[' + k + ']=' + map[k] + ', ожидалось ' + v);
  }
  if (errors === 0 || !Object.keys(requiredYield).some((k) => map[k] !== requiredYield[k])) {
    ok('defaultYieldMap: ключевые коэффициенты выхода');
  }
  if (h.includes('yieldSettings') || h.includes('editYield') || h.includes('yieldRateInput')) {
    fail('найден UI редактирования yield — не должно быть');
  } else ok('нет UI редактирования коэффициентов выхода');
  const costFn = h.match(/function calculateCost\(r\)\{[\s\S]*?\n    \}/);
  if (!costFn) fail('calculateCost не найден');
  else if (costFn[0].includes('getIngredientReadyAmount')) fail('calculateCost использует readyAmount');
  else ok('себестоимость считается по сырому весу');
  if (h.includes('function autoGanash')) fail('autoGanash не удалён');
  else ok('autoGanash удалён');
  if (!h.includes("source:'coverage'")) fail('нет служебных строк source coverage');
  else ok('есть служебные строки покрытия');
  const shopFn = h.match(/function printShoppingList\(id\)\{[\s\S]*?\n    \}/);
  if (!shopFn) fail('printShoppingList не найден');
  else if (!shopFn[0].includes('collectAllCalcIngredients')) fail('printShoppingList не использует collectAllCalcIngredients');
  else ok('закупка суммирует ярусы через collectAllCalcIngredients');
  if (!h.includes('coveragePortionRate:null')) fail('нет задела coveragePortionRate на ярусе');
  else ok('задел индивидуального покрытия по ярусам в данных');
} catch (e) {
  fail(e.message);
}

if (errors) process.exit(1);
console.log('\nПроверка пройдена.');
