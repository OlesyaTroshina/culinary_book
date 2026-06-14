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
  'function recipeListThumbHtml',
  'recipe-thumb-icon',
  'usageFlagIconCategories',
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
  'ISOLATION_PORTION_RATE',
  'CAKE_COVERAGE_PORTION_RATE',
  'function getCoveragePortionRate',
  'function syncCoverageFromLayerCreamLinks',
  'function updateLayerCreamLink',
  'function buildLayerCreamSelector',
  'LAYER_CREAM_ADD_FROM_RECIPE',
  'function openAddCreamFromCakeLayer',
  'function compressPrintLogoFile',
  'function getPrintPageSpec',
  'function clampCenteredOffset',
  'PRINT_LOGO_MAX_SIDE',
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
  'function sortCakeRecipeCategories',
  'function normalizeCakeIngredientOrder',
  'function getCakeCategoryStage',
  'CAKE_RECIPE_STAGE_ORDER',
  'rel="icon"',
  'assets/favicon.png',
];
for (const r of required) {
  if (h.includes(r)) ok('есть ' + r);
  else fail('нет ' + r);
}

if (fs.existsSync(path.join(ROOT, 'assets', 'favicon.png'))) ok('favicon.png на месте');
else fail('нет assets/favicon.png');

if (h.includes('culinary_book_v7_24_84_compact_category_icons.css')) {
  fail('ссылка на несуществующий внешний CSS');
} else ok('нет битой ссылки на внешний CSS');

const pastryCss = path.join(ROOT, 'assets', 'ui', 'pastry-controls-unified.css');
const pearlTexture = path.join(ROOT, 'assets', 'ui', 'buttons', 'textures', 'pearl-mother-of-pearl.png');
const hasPastryLink = h.includes('assets/ui/pastry-controls-unified.css');
const hasPastryInline = h.includes('V80_PASTry_UNIFIED_CONTROLS') || h.includes('V81_PASTry_UNIFIED_OVERRIDE') || h.includes('V82');
if (fs.existsSync(pastryCss) && (hasPastryLink || hasPastryInline)) ok('подключена единая система pastry-controls');
else fail('нет pastry-controls-unified.css или блока V80/V81/V82 pastry-controls');
if (h.includes('pastry-controls-unified.css?v=')) ok('pastry-controls с cache-bust');
else fail('нет версии ?v= у pastry-controls-unified.css');
if (h.includes('--real-pearl-texture: url("assets/ui/buttons/textures/pearl-mother-of-pearl.png")')) {
  fail('на кнопках всё ещё PNG-текстура перламутра (Design #4 — только градиент)');
} else if (h.includes('--real-pearl-texture: url("data:image')) {
  fail('в index.html всё ещё base64-текстура перламутра');
} else ok('кнопки без PNG/base64 текстуры перламутра (Design #4)');
if (fs.existsSync(pearlTexture)) ok('legacy-текстура pearl-mother-of-pearl.png на месте (не используется на кнопках)');

if (fs.existsSync(pastryCss)) {
  const pc = fs.readFileSync(pastryCss, 'utf8');
  const joyChecks = [
    ['--joy-size:', 'CSS-переменная --joy-size'],
    ['grid-template-areas', 'grid-layout джойстика'],
    ['.joy-dir {', 'стили секторов joy-dir'],
    ['.joy-center {', 'центральный круг joy-center'],
    ['.joy-cut.cut-v', 'разделители joy-cut'],
  ];
  for (const [needle, label] of joyChecks) {
    if (pc.includes(needle)) ok('joystick: ' + label);
    else fail('joystick: нет ' + label + ' в pastry-controls-unified.css');
  }
  const sliderChecks = [
    ['--slider-thumb-size:', 'CSS-переменная --slider-thumb-size'],
    ['--slider-thumb-bg:', 'градиент бляшки бегунка'],
    ['--slider-thumb-shadow:', 'объёмная тень бегунка'],
    ['::-webkit-slider-runnable-track', 'стили дорожки webkit'],
    ['::-moz-range-track', 'стили дорожки firefox'],
    ['::-webkit-slider-thumb', 'стили бегунка webkit'],
    ['::-moz-range-thumb', 'стили бегунка firefox'],
    ['#customThemeOverlay::-webkit-slider-thumb', 'бегунок темы оформления'],
    ['.recipe-theme-opacity-slider .pearl-slider::-webkit-slider-thumb', 'бегунок прозрачности рецепта'],
  ];
  for (const [needle, label] of sliderChecks) {
    if (pc.includes(needle)) ok('slider: ' + label);
    else fail('slider: нет ' + label + ' в pastry-controls-unified.css');
  }
} else fail('нет pastry-controls-unified.css для проверки джойстика');

const joyHtml = [
  'class="pearl-joystick"',
  'class="joy-dir joy-up"',
  'onclick="nudgeLogo(',
  'onclick="nudgeWatermark(',
  'onclick="nudgeCropPhoto(',
];
for (const j of joyHtml) {
  if (h.includes(j)) ok('joystick HTML: ' + j);
  else fail('joystick HTML: нет ' + j);
}

const sliderHtml = [
  'class="pearl-slider" type="range" id="customThemeOverlay"',
  'id="printLogoOpacity"',
  'id="printWatermarkOpacity"',
  'recipe-theme-opacity-slider',
];
for (const s of sliderHtml) {
  if (h.includes(s)) ok('slider HTML: ' + s);
  else fail('slider HTML: нет ' + s);
}
if (/::-webkit-slider-thumb[\s\S]{0,120}width:24px/.test(h)) {
  fail('index.html переопределяет бегунок слайдера (конфликт с pastry-controls)');
} else ok('index.html не переопределяет бегунки слайдеров');

if (!h.includes('openCreamFillingRecipe(id,r){')) fail('openCreamFillingRecipe отсутствует');
else if (h.includes('coverageRateBlock')) fail('coverageRateBlock не должен отображаться в редакторе крема');
else ok('редактор крема без coverageRateBlock');
if (h.match(/openCreamFillingRecipe[\s\S]*?Финансовая информация/)) fail('дублирующий блок финансов в редакторе крема');
else ok('редактор крема без дублирующей финансовой секции');

if (!h.match(/renderRecipeList[\s\S]*?recipeListThumbHtml\(r\)/)) fail('renderRecipeList не использует recipeListThumbHtml');
else ok('список рецептов: миниатюра через categoryIconMap');

try {
  const m = h.match(/const\s+categoryIconMap\s*=\s*(\{[\s\S]*?\n\s*\});/);
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

try {
  if (h.includes('inset:0 0 0 auto') && h.includes('.settings-panel')) {
    fail('settings-panel: найдена боковая шторка inset:0 0 0 auto');
  } else ok('settings-panel: нет боковой шторки inset:0 0 0 auto');
  if (/print-template-layout[\s\S]{0,200}minmax\(360px/.test(h)) {
    fail('print-template-layout: устаревший minmax(360px) ломает сетку');
  } else ok('print-template-layout: нет minmax(360px)');
  if (!h.includes('V84') || !h.includes('container-name:settings-body')) {
    fail('нет блока V84 / container query для настроек');
  } else ok('блок V84 и container query настроек');
  if (!/function openSettings\(\)\{[^}]*document\.documentElement\.classList\.add\('settings-open'\)/.test(h)) {
    fail('openSettings не ставит settings-open на html');
  } else ok('openSettings блокирует прокрутку через html.settings-open');
  if (!/width:100vw !important/.test(h) || !h.includes('.settings-panel.open')) {
    fail('settings-panel.open: нет жёсткой ширины 100vw');
  } else ok('settings-panel.open: полноэкранная ширина 100vw');
} catch (e) {
  fail(e.message);
}

if (errors) process.exit(1);
console.log('\nПроверка пройдена.');
