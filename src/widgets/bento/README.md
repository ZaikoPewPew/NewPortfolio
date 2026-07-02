# Bento Widget

Статус: **mock**

## Назначение

Компактная сетка 142×142 из трёх плиток-ссылок: Telegram-канал, IES, YouTube.

## Данные

- mock: `data/bento.mock.ts` — labels/tooltips из `getMessages().bento`
- api: `data/bento.api.ts` (planned)
- Переключатель: `PUBLIC_BENTO_MODE=mock|api`
- i18n-ключи: `bento.ariaLabel`, `bento.tiles.*` — см. [`src/i18n/README.md`](../../i18n/README.md)

## UX

- Hover: зелёный inset-shadow и иконки `#80FA4F`
- Tap feedback через `FeedbackBus`
- Тултипы на плитках: balloon-on-string (`Tooltip` + `initDragTooltips`) — см. [`src/components/ui/README.md`](../../components/ui/README.md)
