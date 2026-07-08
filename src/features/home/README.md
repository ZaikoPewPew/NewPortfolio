# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground (сплошной фон страницы); монтируется в `BaseLayout`
- `case-hover/` — hover карточки: currently-block с видео у курсора — см. [`case-hover/README.md`](case-hover/README.md)
- `header/` — SiteHeader (employer, location/time)
- `dock/` — ActionDock (email, social, theme)
- `contact/` — say hi / vibe check, sessionStorage, slide-анимации
- `page-enter/` — каскадное появление блоков при первой загрузке / reload
- `HomeOrchestrator.client.ts` — инициализация hover-оркестрации

Employer hover (`EmployerName`, currently-block) и contact button hover живут в `src/components/ui/`, но инициализируются оркестратором — см. [`src/components/ui/README.md`](../components/ui/README.md).

## Поток hover кейса

1. `CaseCard` ставит `data-case-card` и `data-hover-video`
2. `CaseHoverController` слушает `pointerover` в `.home__cases`; `pointermove` на `document` деактивирует при выходе за границы карточки
3. Класс `is-case-active` (на `html` / `[data-home-page]`) увеличивает размер currently-block и включает курсор «open»; карточка получает `.is-active`
4. Рядом с курсором летит currently-block с видео **с начала** при каждом входе на плитку; других оверлеев (blur/wash/градиент/preview) нет
5. Теги на карточке появляются при `.is-active` / `:focus-visible`

Детали (логика выхода, restart видео, scale блока) — [`case-hover/README.md`](case-hover/README.md).

## Layout главной (desktop)

Реализация: `home.layout.css`.

| Зона | Поведение |
|------|-----------|
| Header | `position: sticky; top: 0` |
| `grid__widgets` | sticky под хедером (`--layout-header-block-height` + gap) |
| `grid__cases` | обычный поток; скролл страницы прокручивает карточки |
| Выравнивание | `grid__cases` — `margin-top: --layout-header-widget-gap-desktop`; у `home__widgets` на home margin-top сброшен |

На странице кейса (`data-case-page`) обе колонки sticky — см. `home.layout.css`.

## Поток employer hover

1. `Header.astro` рендерит `EmployerName` с label из `site.config.employer`
2. `HomeOrchestrator` вызывает `initEmployerName()` на `astro:page-load`
3. При `mouseenter` / `focusin` — blur-оверлей, float-копия текста, видео-блок следует за курсором
4. Видео из `employer.video` (`fantech.mp4`) — loop без звука
5. При навигации View Transitions — `resetEmployerName()` снимает классы и паузит видео

Слои z-index: backdrop (240) → float-текст (250) → currently-block (255).

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
2. `PageEnterController` включает `data-home-entering` и снимает флаги по таймеру `--motion-page-enter-total`
3. Задержки — токены `--page-enter-delay-*` в `tokens.css`

**Контакты открыты при reload:** виджеты vibe check подавляются на время page-enter (`page-enter.animations.css`), contact-slot входит в каскад с `--page-enter-delay-contact-desktop` (как git). Иначе `pageEnterReveal` перебивает `transform` слайда и bento мелькает под контактами.
