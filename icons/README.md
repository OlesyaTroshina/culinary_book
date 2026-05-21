# Иконки категорий

**Рабочее приложение:** `culinary_book_v7_24_84_compact_category_icons.html`  
(открывать в браузере этот файл; всё в одном HTML + компактные иконки в CSS.)

Работа **только с картинками** — без изменения размеров в UI, расчётов, печати и управления.

## Папки

| Папка | Назначение |
|-------|------------|
| `categories/` | PNG по категориям (`Сиропы.png`, `Бисквит.png`, …) |
| `_archive_chatgpt_names/` | Старые исходники (не используются) |

## Заменить иконку

1. Подмените PNG в `categories/` (имя — в `ICONS.md`, для «Сиропы» → `Сиропы.png`).
2. Выполните:

```bash
node scripts/build-icons.js sync
```

Иконки попадут **только** в рабочий `culinary_book_v7_24_84_compact_category_icons.html`.

## Проверка

```bash
node scripts/verify-app.js
```

## Команды

```bash
node scripts/build-icons.js extract   # из рабочего HTML → categories/
node scripts/build-icons.js sync      # categories/ → рабочий HTML
node scripts/build-icons.js all       # extract + report + archive
```

См. также `APPS.md`.
