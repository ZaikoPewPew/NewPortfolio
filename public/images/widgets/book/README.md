# Ассеты book widget

Две части билета — отдельные SVG (как в [Figma](https://www.figma.com/design/vZkzNf4apQLFKJRf8s0NCp/%D0%9F%D0%BE%D1%80%D1%82%D1%84%D0%BE%D0%BB%D0%B8%D0%BE?node-id=959-2590)):

| Файл | Тема | Размер | Назначение |
|------|------|--------|------------|
| `Card-2.svg` | dark (default) | 142×99 | верхний билет |
| `Card-1.svg` | dark (default) | 142×43 | нижний билет |
| `Card-2-surface.svg` / `Card-1-surface.svg` | light | 142×99 / 142×43 | фоны для светлой темы |
| `barcode.png` | — | 76×26 | штрихкод для нижней карточки |

## Токены

В `themes/dark.css` и `themes/light.css`:

- `--book-ticket-bg-top` — фон верхней карточки
- `--book-ticket-bg-bottom` — фон нижней
- `--color-book-ticket-text` — цвет подписи
- `--color-book-barcode` — цвет штрихкода

Размеры и motion — `--widget-book-size`, `--book-card-*-height`, `--book-tear-*` в `tokens.css`.
