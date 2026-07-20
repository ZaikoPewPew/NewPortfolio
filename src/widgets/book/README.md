# Book Widget

**Status:** mock

Виджет локального времени в виде двухслойного билета 142×142. Референс — [Figma bookWidget](https://www.figma.com/design/vZkzNf4apQLFKJRf8s0NCp/%D0%9F%D0%BE%D1%80%D1%82%D1%84%D0%BE%D0%BB%D0%B8%D0%BE?node-id=959-2590).

## Структура

| Слой | Размер | Содержимое |
|------|--------|------------|
| `Card-2` (верх) | 142×99 | фон + время (`07:08:04 AM`) + страна |
| `Card-1` (низ) | 142×43 | фон + штрихкод |

Итого **142×142**, без overlap. Hover: верхний слой «отрывается» (tear).

## Данные

- Время: `LiveClock` (`data-live-clock`) в timezone из `site.config.location`
- Страна: `siteConfig.location.country` (lowercase)
- mock книг: `data/books.json` → `data/book.mock.ts` (пока не выводятся в UI)
- api: `data/book.api.ts` (planned)
- Переключатель: `PUBLIC_BOOK_MODE=mock|api` (default: `mock`)

## UX

- Hover: верхняя карточка сдвигается вверх и слегка поворачивается (`--book-tear-*` токены)
- Hover-звук: `paper` (`data-feedback="paper"`, hover-only, без tap)
- Штрихкод — PNG (`barcode.png`)
- Фоны карточек — theme-aware SVG через `--book-ticket-bg-top` / `--book-ticket-bg-bottom`
- Текстура «помятой бумаги» — статичный CSS-оверлей из `linear-gradient` линий сгибов (`::before` на обеих карточках, без ассетов). Тон/сила — `--book-crease-shadow` / `--book-crease-highlight` / `--book-crease-opacity`
- `prefers-reduced-motion` отключает tear-анимацию

## i18n

Ключи в `book.*`: `ariaLabel` (`Local time in {city}`). Country — proper noun из `site.config`, не переводится.

## Ассеты

См. [`public/images/widgets/book/README.md`](../../../public/images/widgets/book/README.md).
