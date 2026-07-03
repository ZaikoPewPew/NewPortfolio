# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground, градиент при hover кейса
- `case-hover/` — CaseHoverController, CasePreviewPanel
- `header/` — SiteHeader (employer, location/time)
- `dock/` — ActionDock (email, social, theme)
- `HomeOrchestrator.client.ts` — инициализация hover-оркестрации

Employer hover (`EmployerName`, currently-block) живёт в `src/components/ui/`, но инициализируется оркестратором — см. [`src/components/ui/README.md`](../components/ui/README.md).

## Поток hover кейса

1. `CaseCard` ставит `data-case-card` и `data-hover-*` атрибуты
2. `CaseHoverController` слушает mouseenter/leave
3. Градиент → CSS var `--page-gradient` на `:root`
4. Blur неактивных карточек через класс `is-case-active`
5. `CasePreviewPanel` показывает preview

## Поток employer hover

1. `Header.astro` рендерит `EmployerName` с label из `site.config.employer`
2. `HomeOrchestrator` вызывает `initEmployerName()` на `astro:page-load`
3. При `mouseenter` / `focusin` — blur-оверлей, float-копия текста, видео-блок следует за курсором
4. Видео из `employer.video` (`fantech.mp4`) — loop без звука
5. При навигации View Transitions — `resetEmployerName()` снимает классы и паузит видео

Слои z-index: backdrop (240) → float-текст (250) → currently-block (255).

## Mobile

Hover-blur кейсов отключён; tap — overlay preview.

Employer hover и currently-block — **только desktop** (`max-width: 639px` и `prefers-reduced-motion` отключают портал).
