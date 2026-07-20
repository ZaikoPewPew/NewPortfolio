# Bento Widget

Статус: **live** (метрики на билде; fallback — mock)

## Назначение

Три плитки-ссылки: Telegram-канал, IES, YouTube.

### `section` prop (`BentoWidget.astro`)

| Значение | Что рендерит | Где на home |
|----------|--------------|-------------|
| `links` | mychannel + ies | под Book |
| `youtube` | wide YouTube | под Photo |
| `all` (default) | все три в сетке | registry / standalone |

`ProfileMenu` / `HomeWidgets` монтируют два инстанса: `section="links"` и `section="youtube"`.

## Данные

- mock: `data/bento.mock.ts` — labels/tooltips из `getMessages().bento`
- api: `data/bento.api.ts` — compact-метрики на build-time, по плитке fallback на mock
- Источники метрик (`METRIC_SOURCES`):
  - mychannel → `t.me/dsgn_thinking`
  - ies → `t.me/ies_app` (ссылка плитки остаётся на бота)
  - youtube → `youtube.com/@DesignLeadd`
- Парсеры: `telegramSubscribers.ts`, `youtubeSubscribers.ts`, `formatCompactCount.ts` (`1122` → `1.1k`)
- Переключатель: `PUBLIC_BENTO_MODE=mock|api` (в CI Pages — `api`)
- i18n: `tooltipTitle` + `tooltipMetric` (`{count}`) + `tooltipMetricFallback`

## UX

- Hover: иконки и текст YouTube → `--color-link-hover` (без text-shadow)
- Tap feedback через `FeedbackBus` (`data-feedback="tap hover"`)
- Тултипы на плитках: balloon-on-string (`Tooltip` + `initDragTooltips`); все три — `tooltipPlacement: "bottom"` — см. [`src/components/ui/README.md`](../../components/ui/README.md)

## Ассеты

Исходники иконок плиток: [`public/images/widgets/bento-button/`](../../../public/images/widgets/bento-button/) (`bento-mychannel.svg`, `bento-ies.svg`, `bento-youtube.svg`). В разметке виджета SVG сейчас inline.
