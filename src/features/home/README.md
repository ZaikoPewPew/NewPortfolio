# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground (сплошной фон страницы); монтируется в `BaseLayout`
- `case-hover/` — hover списка кейсов: currently-block + wash на блок компании — см. [`case-hover/README.md`](case-hover/README.md)
- `dock/` — ActionDock (email, social, theme)
- `contact/` — say hi / vibe check, sessionStorage, slide-анимации
- `page-enter/` — каскадное появление блоков при первой загрузке / reload
- `HomeOrchestrator.client.ts` — инициализация hover-оркестрации

ThemeWidget (`theme-widget--fixed`) монтируется в `HomePage` / `CasePage` через slot `header` BaseLayout — не в `Header.astro`. Employer hover (`EmployerName`) и contact button hover живут в `src/components/ui/`; contact инициализируется оркестратором — см. [`src/components/ui/README.md`](../components/ui/README.md).

## Поток hover кейса

1. `CaseCompany` / `CaseRow` ставят `data-case-card` и `data-hover-*` на interactive-элементы
2. `CaseHoverController` слушает `pointerover` в `.home__cases`; выход — за границы активного `[data-case-card]`
3. Wash (tint `case`) + currently-block; группа получает `.is-focused`
4. Детали — [`case-hover/README.md`](case-hover/README.md)

## Layout главной (desktop)

Реализация: `home.layout.css`. Хедер на home не рендерится.

| Зона | Поведение |
|------|-----------|
| ThemeWidget | `fixed` top-right (`theme-widget--fixed`), 16px от краёв |
| `.home` / `.grid` | `padding-top: --space-md` (16px от верха viewport) |
| `grid__widgets` | sticky `top: --space-md` |
| `grid__cases` | `padding-top: --layout-cases-name-align` — первая строка на уровне `me-widget__name` |
| `grid__cases` скролл | обычный поток; скролл страницы прокручивает список |

На странице кейса (`data-case-page`, desktop): без choreography — мгновенный переход; виджеты скрыты (`visibility` + absolute), cases на ширину контентной колонки, cover `--layout-case-cover-height` с отступом 16px от верха viewport, текст `--layout-case-reading-width` (900px) по центру. Mobile без изменений.

## Поток employer hover

`Header.astro` / `EmployerName` на home сейчас не монтируются. Логика employer hover остаётся в `components/ui/` на случай возврата хедера; на кейсе не используется.

Слои z-index (если хедер вернётся): backdrop (240) → float-текст (250) → currently-block (255). См. [`components/ui/README.md`](../components/ui/README.md).

## Mobile

Hover-эффект кейсов (currently-block) отключён.

Employer hover и currently-block — **только desktop** (`max-width: 639px` и `prefers-reduced-motion` отключают портал).

## Contact panel (say hi / vibe check)

1. Кнопка в `MeWidget` переключает `data-contact-open` на `[data-contact-layout]`
2. Состояние пишется в `sessionStorage` (`contact-panel.storage.ts`, ключ `contact-panel-open`)
3. **Reload / case-страница:** inline-скрипт в `HomeWidgets.astro` восстанавливает `data-contact-open` до парсинга bento/git — без FOUC
4. `ContactPanelController.client.ts` синхронизирует кнопку и `aria-hidden` слота после `astro:page-load`
5. При View Transitions между `/` и `/cases/*` — `beginWidgetsNavigationLock()` фиксирует transform без анимации

Slide-анимации: `contact-panel.animations.css`. Только desktop (`min-width: 640px`).

### Contact button (say hi / vibe check)

1. `ContactButton.astro` — разметка, clip-path fill, цвета hover
2. `contactButton.client.ts` — origin заливки от точки входа/выхода курсора; `initContactButton()` из оркестратора
3. Hover: звук `bubble` (`data-feedback="bubble"`), заливка `--color-contact-button-hover-bg`, текст/keycap → `--color-contact-button-hover-text`
4. Click / hotkey `h`: только `swipe` при toggle панели — tap на кнопке отключён
5. `prefers-reduced-motion`: мгновенная смена фона без clip-path

## Page enter

1. `BaseLayout` ставит `html[data-home-enter]` на `home` и `case` до гидрации (если нет `prefers-reduced-motion`)
2. `PageEnterController` включает `data-home-entering` и снимает флаги по таймеру (`--motion-page-enter-total` / `--motion-page-enter-total-case`)
3. Задержки — токены `--page-enter-delay-*` в `tokens.css`

**Home:** header → me / git → book+bento (пара) / photo → cases (парами: `floor(i/2)`) → concepts (парами) → copyright. Кейсы стартуют с overlap относительно левой колонки. Total ~1.8s.

**Case (reload / прямой заход):** header → hero (cover+title) → meta → MDX body (`> *` парами, max 5 волн) → copyright. Виджеты скрыты; total — `--motion-page-enter-total-case` (~1.5s). Без `data-page-enter` на body — CSS по селекторам, без FOUC.

**Новый блок справа под кейсами (home):** `data-page-enter` + `--page-enter-delay` от конца предыдущего сегмента (сейчас `concepts-base` / `concepts-step`); обновить `--page-enter-delay-copyright` и не трогать total вручную — он считается от copyright.

**Контакты открыты при reload:** виджеты vibe check подавляются на время page-enter (`page-enter.animations.css`), contact-slot входит в каскад с `--page-enter-delay-contact-desktop` (как git). Иначе `pageEnterReveal` перебивает `transform` слайда и bento мелькает под контактами.
