# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground, градиент при hover кейса
- `case-hover/` — CaseHoverController, CasePreviewPanel
- `header/` — SiteHeader (employer, location/time)
- `dock/` — ActionDock (email, social, theme)
- `HomeOrchestrator.client.ts` — инициализация hover-оркестрации

## Поток hover кейса

1. `CaseCard` ставит `data-case-card` и `data-hover-*` атрибуты
2. `CaseHoverController` слушает mouseenter/leave
3. Градиент → CSS var `--page-gradient` на `:root`
4. Blur неактивных карточек через класс `is-case-active`
5. `CasePreviewPanel` показывает preview

## Mobile

Hover-blur отключён; tap — overlay preview.
