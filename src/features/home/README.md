# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground, градиент при hover кейса
- `case-hover/` — CaseHoverController, CasePreviewPanel
- `header/` — SiteHeader (employer, location/time)
- `dock/` — ActionDock (email, social, theme)
- `contact/` — say hi / vibe check, sessionStorage, slide-анимации
- `page-enter/` — каскадное появление блоков при первой загрузке / reload
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

## Contact panel (say hi / vibe check)

1. Кнопка в `MeWidget` переключает `data-contact-open` на `[data-contact-layout]`
2. Состояние пишется в `sessionStorage` (`contact-panel.storage.ts`, ключ `contact-panel-open`)
3. **Reload / case-страница:** inline-скрипт в `HomeWidgets.astro` восстанавливает `data-contact-open` до парсинга bento/git — без FOUC
4. `ContactPanelController.client.ts` синхронизирует кнопку и `aria-hidden` слота после `astro:page-load`
5. При View Transitions между `/` и `/cases/*` — `beginWidgetsNavigationLock()` фиксирует transform без анимации

Slide-анимации: `contact-panel.animations.css`. Только desktop (`min-width: 640px`).

## Page enter

1. `BaseLayout` ставит `html[data-home-enter]` на `home` и `case` до гидрации (если нет `prefers-reduced-motion`)
2. `PageEnterController` включает `data-home-entering` и снимает флаги по таймеру `--motion-page-enter-total`
3. Задержки — токены `--page-enter-delay-*` в `tokens.css`

**Контакты открыты при reload:** виджеты vibe check подавляются на время page-enter (`page-enter.animations.css`), contact-slot входит в каскад с `--page-enter-delay-contact-desktop` (как git). Иначе `pageEnterReveal` перебивает `transform` слайда и bento мелькает под контактами.
