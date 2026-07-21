# Home Features

Сквозная логика главной страницы.

## Модули

- `background/` — PageBackground (сплошной фон страницы); монтируется в `BaseLayout`
- `case-hover/` — hover списка кейсов: currently-block + wash на блок компании — см. [`case-hover/README.md`](case-hover/README.md)
- `profile-menu/` — fixed аватар слева → expand в me-widget + bento — см. [`profile-menu/README.md`](profile-menu/README.md)
- `dock/` — ActionDock (email, social, theme)
- `contact/` — say hi / vibe check, sessionStorage, slide-анимации
- `page-enter/` — каскадное появление блоков при первой загрузке / reload
- `HomeOrchestrator.client.ts` — инициализация hover-оркестрации

ThemeWidget (`theme-widget--fixed`) монтируется в `HomePage` / `CasePage` через slot `header` BaseLayout — не в `Header.astro`. Виджеты — `ProfileMenu` в slot `widgets` на home и case. Employer hover (`EmployerName`) и contact button hover живут в `src/components/ui/`; contact и profile инициализируются оркестратором — см. [`src/components/ui/README.md`](../components/ui/README.md).

## Поток hover кейса

1. `CaseCompany` / `CaseRow` ставят `data-case-card` и `data-hover-*` на interactive-элементы
2. `CaseHoverController` — hit-test `elementFromPoint` на `pointermove` / `pointerover` в `.home__cases`
3. Wash (tint `case`) + currently-block; группа получает `.is-focused`
4. Детали — [`case-hover/README.md`](case-hover/README.md)

## Layout главной (desktop)

Реализация: `home.layout.css` + `profile-menu/`. Хедер на home не рендерится.

| Зона | Поведение |
|------|-----------|
| ThemeWidget | `fixed` top-right (`theme-widget--fixed`), 16px от краёв |
| ProfileMenu | `fixed` top-left 16px; shell разворачивается в карточку me-widget; bento прилетает снизу |
| `.home` / `.grid` | `padding-top: --space-md` (16px от верха viewport) |
| `grid__widgets` | в потоке схлопнут (0×0); контент — fixed ProfileMenu |
| `grid__cases` | всегда `max-width: --layout-case-reading-width` по центру |
| `grid__cases` скролл | обычный поток; скролл страницы прокручивает список |

Состояние профиля: `data-profile-open` на `[data-home-page]` / `[data-case-page]` + `data-open` на `[data-profile-menu]`, sessionStorage `profile-menu-open`. По умолчанию закрыт. Mobile (home) — shell как me-widget, contact mobile, без collapse. Подробности анимации и стыка с contact — [`profile-menu/README.md`](profile-menu/README.md).

Copyright на home: fixed `left/bottom: --space-md` от краёв viewport (не от контент-бокса 1248px).

На странице кейса (`data-case-page`, desktop): без choreography — мгновенный переход; `ProfileMenu` fixed как на home; cover / текст / media — `--layout-case-reading-width` (900px) по центру. Mobile без изменений (колонка виджетов скрыта).

## Поток employer hover

`Header.astro` / `EmployerName` на home сейчас не монтируются. Логика employer hover остаётся в `components/ui/` на случай возврата хедера; на кейсе не используется.

Слои z-index (если хедер вернётся): backdrop (240) → float-текст (250) → currently-block (255). См. [`components/ui/README.md`](../components/ui/README.md).

## Mobile

Hover-эффект кейсов (currently-block) отключён.

Employer hover и currently-block — **только desktop** (`max-width: 639px` и `prefers-reduced-motion` отключают портал).

## Contact panel (say hi / vibe check)

1. Кнопка в ProfileMenu (desktop) / MeWidget (case, mobile) переключает `data-contact-open` на `[data-contact-layout]`
2. Перед swipe на home: `ensureProfileMenuOpenForContact()` — профиль открыт до анимации контактов
3. Состояние пишется в `sessionStorage` (`contact-panel.storage.ts`, ключ `contact-panel-open`); **по умолчанию открыты контакты (say hi)** — при первом раскрытии профиля виден say hi, переключение на vibe check по кнопке
4. **Reload / home:** inline-скрипт в `ProfileMenu.astro` восстанавливает `data-contact-open` и `data-profile-open` до paint — без FOUC; состояния независимы (открытость профиля не форсится контактами)
5. `ContactPanelController.client.ts` синхронизирует кнопку и `aria-hidden` слота после `astro:page-load`
6. При View Transitions между `/` и `/cases/*` — `beginWidgetsNavigationLock()` фиксирует transform без анимации
7. При стабильном `data-contact-open="true"` default-bento скрыт (`visibility`), чтобы не мелькал под contact-slot при повторном раскрытии профиля

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

**Home:** chrome (avatar `profile-menu__shell` + `theme-widget` + подпись `profile-menu__say-hi`, `--page-enter-delay-chrome`) → me / git → book+bento-links (пара) / photo+youtube → cases (парами: `floor(i/2)`) → concepts (парами) → copyright. Кейсы стартуют с overlap относительно левой колонки. Total ~1.8s. `say-hi` подавляется, если профиль открыт (в этом состоянии подсказка скрыта).

**Case (reload / прямой заход):** header → hero (cover+title) → meta → MDX body (`> *` парами, max 5 волн) → copyright. Виджеты скрыты; total — `--motion-page-enter-total-case` (~1.5s). Без `data-page-enter` на body — CSS по селекторам, без FOUC.

**Новый блок справа под кейсами (home):** `data-page-enter` + `--page-enter-delay` от конца предыдущего сегмента (сейчас `concepts-base` / `concepts-step`); обновить `--page-enter-delay-copyright` и не трогать total вручную — он считается от copyright.

**Контакты открыты при reload:** виджеты vibe check подавляются на время page-enter (`page-enter.animations.css`), contact-slot входит в каскад с `--page-enter-delay-contact-desktop` (как git). Иначе `pageEnterReveal` перебивает `transform` слайда и bento мелькает под контактами.
