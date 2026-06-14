#!/usr/bin/env node
/**
 * Семантическая проверка UI-изменений через Cursor SDK (локальный агент).
 * Дополняет scripts/verify-app.js: тот ловит отсутствие символов и битые ссылки,
 * этот — соответствие ТЗ premium pastry / pearl gold и запреты из rule-файла.
 *
 * Требует: CURSOR_API_KEY (https://cursor.com/dashboard/cloud-agents)
 * Запуск: npm run review:ui
 */
import { spawnSync } from "node:child_process";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, CursorAgentError } from "@cursor/sdk";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPORT_DIR = join(ROOT, "scripts", "reports");
const REPORT_PATH = join(REPORT_DIR, "ui-review-latest.md");

function runMechanicalVerify() {
  console.log("→ Механическая проверка (verify-app.js)…");
  const r = spawnSync(process.execPath, [join(__dirname, "verify-app.js")], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    console.error("\n✗ verify-app.js не прошёл — исправьте ошибки перед UI-review.");
    process.exit(r.status ?? 1);
  }
  console.log("✓ Механическая проверка пройдена.\n");
}

function gitChangedUiFiles() {
  try {
    const out = execSync("git diff --name-only HEAD", {
      cwd: ROOT,
      encoding: "utf8",
    });
    const staged = execSync("git diff --name-only --cached", {
      cwd: ROOT,
      encoding: "utf8",
    });
    const files = [...new Set([...out.split("\n"), ...staged.split("\n")])]
      .map((f) => f.trim())
      .filter(Boolean)
      .filter((f) => /\.(html|css|js)$/.test(f) || f.includes("assets/ui/"));
    return files.length ? files : ["index.html", "assets/ui/pastry-controls-unified.css"];
  } catch {
    return ["index.html", "assets/ui/pastry-controls-unified.css"];
  }
}

function buildPrompt(changedFiles) {
  const fileList = changedFiles.map((f) => `- ${f}`).join("\n");
  return `Ты — ревьюер UI для приложения «Кулинарная книга-калькулятор» (один index.html + assets/ui/).

Прочитай ТЗ: TZ_buttons_culinary_book_cursor.mdc
Изменённые файлы (git diff):
${fileList}

Задача — только визуальный слой кнопок/контролов (pastry / pearl / gold). НЕ трогай расчётную логику.

Проверь по diff и текущему коду:
1. Сохранены ли id, class, onclick и обработчики существующих кнопок?
2. Текстура перламутра — PNG-путь (assets/ui/buttons/textures/pearl-mother-of-pearl.png), не base64 в --real-pearl-texture?
3. Нет ли нарушений «Главного запрета» из ТЗ (переписывание логики, CDN, картинки вместо кнопок)?
4. Единая система pastry-controls-unified.css + блок V81 подключены согласованно?
5. Конкретные регрессии: сломанные hover/active, контраст текста, мобильная вёрстка joystick/slider.

Формат ответа (markdown на русском):
## Вердикт
PASS | FAIL | WARN — одна строка с причиной

## Критичные проблемы
- … (или «нет»)

## Замечания
- …

## Что сделано хорошо
- …

Будь конкретен: указывай файлы и селекторы. Не предлагай рефакторинг бизнес-логики.`;
}

async function main() {
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  const skipVerify = process.argv.includes("--skip-verify");

  if (!apiKey) {
    console.error(
      "CURSOR_API_KEY не задан.\n" +
        "Получите ключ: https://cursor.com/dashboard/cloud-agents\n" +
        "Затем: $env:CURSOR_API_KEY=\"cursor_...\"; npm run review:ui"
    );
    process.exit(1);
  }

  if (!skipVerify) {
    runMechanicalVerify();
  } else {
    console.log("→ Пропуск verify-app.js (--skip-verify)\n");
  }

  const changedFiles = gitChangedUiFiles();
  console.log("→ Cursor SDK: локальный агент проверяет UI по ТЗ…");
  console.log("  Файлы:", changedFiles.join(", "));

  const prompt = buildPrompt(changedFiles);

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2" },
      local: { cwd: ROOT, settingSources: [] },
    });

    const body =
      typeof result.result === "string"
        ? result.result
        : JSON.stringify(result.result, null, 2);

    mkdirSync(REPORT_DIR, { recursive: true });
    const report = [
      `# UI review — ${new Date().toISOString()}`,
      "",
      `Статус агента: **${result.status}**`,
      `Файлы: ${changedFiles.join(", ")}`,
      "",
      body,
      "",
    ].join("\n");
    writeFileSync(REPORT_PATH, report, "utf8");

    console.log("\n" + body);
    console.log(`\n→ Отчёт сохранён: ${REPORT_PATH}`);

    if (result.status === "error") {
      console.error("✗ Агент завершился с ошибкой.");
      process.exit(2);
    }
    if (/^## Вердикт\s*\nFAIL/m.test(body)) {
      console.error("✗ UI-review: FAIL по ТЗ.");
      process.exit(2);
    }
    if (/^## Вердикт\s*\nWARN/m.test(body)) {
      console.warn("⚠ UI-review: WARN — см. отчёт.");
      process.exit(0);
    }
    console.log("✓ UI-review: PASS");
  } catch (err) {
    if (err instanceof CursorAgentError) {
      console.error(
        `✗ Запуск агента не удался: ${err.message} (retryable=${err.isRetryable})`
      );
      process.exit(err.isRetryable ? 75 : 1);
    }
    throw err;
  }
}

main();
