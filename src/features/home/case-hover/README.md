# Case Hover — currently-block + фон кейса

Интерактив при наведении на карточку кейса на главной: рядом с курсором летит **currently-block** с видео и кастомный курсор «open»; на фоне страницы появляется градиент кейса и шум. Никаких оверлеев (blur / wash / затемнение), preview-панели или подъёма карточки. Контроллер физики блока — общий с employer hover (`src/components/ui/currentlyBlock.client.ts`).

## Файлы

| Файл | Назначение |
|------|------------|
| `CaseHoverController.client.ts` | Слушатели pointer-событий, состояние hover, классы `is-case-active` / `is-active`, `--page-gradient` |
| `caseFocus.client.ts` | Интеграция с `currentlyBlock`: активация с `restart: true`, движение за курсором, сброс |
| `caseCursor.client.ts` | Кастомный курсор «open» за указателем (`cases.hoverCursor` в i18n) |
| `case-cursor.css` | Стили курсора, `cursor: none` при `is-case-active` |
| `case-focus.css` | Увеличенный размер `currently-block` для кейсов (класс `is-case-active`) |
| `../background/PageBackground.astro` | Слой `.page-background` в `BaseLayout` |
| `../background/background.css` | Градиент (`::before`) + noise (`::after`); импорт в `global.css` |

Инициализация — `initCaseHover()` из `HomeOrchestrator.client.ts` (только `body[data-page="home"]`). Сброс при View Transitions — `resetCaseHover()`.

## Поток hover

1. `pointerover` в зоне `.home__cases` → `resolveCard()` находит `[data-case-card]`
2. `activate(card, x, y)`:
   - `html` + `[data-home-page]` получают класс `is-case-active` (градиент/noise, размер блока, курсор)
   - карточка → `.is-active` (показывает теги)
   - `--page-gradient` из `data-hover-from/to/angle` (frontmatter `hover.gradient*`)
   - `activateCaseFocus()` — currently-block с видео **с начала** (`restart: true`) + курсор «open» + звук `hoverCard`
3. `onDocumentPointerMove` — как только курсор выходит **за bounding-box активной карточки**, вызывается `deactivateCaseHover()` (см. «Логика выхода»)
4. Переход на другую карточку — `pointerover` деактивирует текущую и активирует новую (видео новой карточки тоже с `currentTime = 0`)

## Логика выхода

- **Источник правды** — модульная `activeHoverCard` (в контроллере). Локальных дублей нет: `deactivateCaseHover()` экспортируется и вызывается из pointer-move, поэтому состояние всегда согласовано.
- `onDocumentPointerMove` считает hover активным, только пока курсор **внутри прямоугольника карточки**. Ушёл на бенто/хедер/промежуток между карточками → мгновенная деактивация.
- Возврат на ту же карточку: после деактивации `activeHoverCard = null`, следующий `pointerover` снова активирует блок — видео стартует **с нуля**.
- `pointerleave` на `[data-home-page]` — страховка на быстрый увод курсора за окно.

## Фон (градиент + noise)

- Градиент: `linear-gradient(angle, from, to)` в `--page-gradient` на `html`; слой `.page-background::before` fade-in при `html.is-case-active`
- Noise: SVG fractalNoise в `--page-background-noise`; слой `.page-background::after` с `mix-blend-mode: overlay`
- Цвета и угол — только из MDX frontmatter (`hover.gradientFrom/To/Angle`), не из CSS компонентов
- Токены: `--page-background-noise-opacity`, `--page-background-noise-size`, `--page-background-noise`
- Разметка: `PageBackground.astro` **обязателен** в `BaseLayout` (первым ребёнком `body`). Без него `--page-gradient` пишется, но рисовать нечему
- Fade-out: при `deactivateCaseHover()` класс `is-case-active` снимается, а `--page-gradient` **не** очищается сразу — иначе обрывается transition opacity; сброс переменной — в `resetCaseHover()` / следующем `setPageGradient`
- Stacking: `.page-background` — `z-index: var(--z-background)` (0), контент поверх. Не ставить `--z-background: -1`: слой уйдёт под непрозрачный `background` у `body` и градиент снова «пропадёт»
- Сила шума (dark / light): `--page-background-noise-opacity` в `tokens.css` / `themes/light.css`

## currently-block для кейсов

- Видео: `data-hover-video` карточки (frontmatter `hover.previewVideo`, fallback — `siteConfig.employer.video`), проставляется в `CaseCard.astro`
- При каждой активации (вход на плитку, повторный hover) — `CurrentlyBlockActivateOptions.restart: true` → `currentTime = 0` + `play()`
- Employer hover **без** `restart` — ролик продолжает с места паузы
- Размер блока **×1.5** относительно employer: класс `html.is-case-active` переопределяет `--currently-block-inner-*`, `--padding`, `--radius` на `--currently-block-case-*`. Масштаб — токен `--currently-block-case-scale`

Контроллер физики блока — общий `getCurrentlyBlock()` из `src/components/ui/currentlyBlock.client.ts`.

## Data-атрибуты и классы

| Атрибут / класс | Где | Роль |
|-----------------|-----|------|
| `data-case-card` | `<a>` карточки | Хост hover |
| `data-hover-from` / `to` / `angle` | Карточка | Градиент фона страницы |
| `data-hover-video` | Карточка | Видео currently-block |
| `is-case-active` | `html`, `[data-home-page]` | Градиент/noise + увеличенный currently-block + скрытие системного курсора |
| `is-active` | Карточка | Показ тегов |

## Ограничения

- Только desktop: `max-width: 639px` и `prefers-reduced-motion` отключают currently-block, кастомный курсор и градиент (`isDisabled()` в JS)
