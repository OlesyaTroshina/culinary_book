# ТЗ: шрифт интерфейса

Образец: `2026-05-09_19-51-41.jpg` (высококонтрастная антиква, кириллица).

## Рабочее приложение

`culinary_book_v7_24_84_compact_category_icons.html`

## Шрифт на экране

| Параметр | Значение |
|----------|----------|
| Семейство | **Playfair Display** (Google Fonts), запасные: Times New Roman, Times, serif |
| CSS-переменная | `--font-ui` |
| Где | Весь UI: body, поля, подписи, подсказки, заголовки, кнопки `.u-btn`, джойстик, таблицы |
| Размеры и `font-weight` | **Не менять** — только `font-family` |
| Позиционирование | **Не менять** |

## Исключения (как печать)

Остаётся **Times New Roman**:

- превью листа / логотипа (`.print-logo-preview-sheet`);
- превью водяного знака (`.watermark-text-preview`);
- мини-превью рецепта/PDF (`.recipe-template-preview`);
- CSS в JS для `window.print()` и pdfmake — **не трогать**.

## База ингредиентов (читаемость)

Только `color` и `text-shadow` у текста в `#ingredientBaseSection`.  
Фон полей, `box-shadow` кнопок и «таблеток» — **не менять**.

## Темы (фон блока базы)

`#ingredientBaseSection` наследует фон/рамку/тени панели как у `.panel` (`--shell-panel-light` / `--shell-panel-dark` / `--card` для custom). Жёсткий `background:rgba(255,255,255,.86)` у развёрнутого блока снят.

## Не менять

- логику, расчёты, архитектуру;
- печатные формы и их стили в коде генерации печати.
- фоны и тени блоков/окон в базе ингредиентов.

## Обновление

При смене PNG иконок: `node scripts/build-icons.js sync`  
Проверка: `node scripts/verify-app.js`
