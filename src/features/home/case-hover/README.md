# Case Hover — фокус карточки кейса

Интерактив при наведении на карточку кейса на главной: страница уходит в **blur + шум (wash)**, наведённая карточка **поднимается в фокус** над затемнением, рядом с курсором летит **currently-block** с видео. Референс поведения — employer hover (`src/components/ui/`), тот же слой порталов и wash.

## Файлы

| Файл | Назначение |
|------|------------|
| `CaseHoverController.client.ts` | Слушатели pointer-событий, состояние hover, градиент фона, preview-панель |
| `caseFocus.client.ts` | Порталы (blur/wash), подъём карточки в fixed-слой, интеграция с `currentlyBlock` |
| `case-focus.css` | Стили backdrop/overlay, elevate-хост, placeholder, scale currently-block |
| `CasePreviewPanel.astro` | Правая панель preview (изображение + заголовок) |

Инициализация — `initCaseHover()` из `HomeOrchestrator.client.ts` (только `body[data-page="home"]`). Сброс при View Transitions — `resetCaseHover()`.

## Поток hover

1. `pointerover` в зоне `.home__cases` → `resolveCard()` находит `[data-case-card]`
2. `activate(card, x, y)`:
   - `html` + `[data-home-page]` получают класс `is-case-active` (включает blur/wash через CSS)
   - карточка → `.is-active` (мгновенно показывает теги)
   - `--page-gradient` на `:root` из `data-hover-*`
   - `showPanel()` — preview-панель
   - `activateCaseFocus()` — подъём карточки + currently-block + звук `hoverCard`
3. `onDocumentPointerMove` — как только курсор выходит **за bounding-box активной карточки**, вызывается `deactivateCaseHover()` (см. «Логика выхода»)
4. Переход на другую карточку — `pointerover` деактивирует текущую и активирует новую

## Подъём карточки (elevate)

Вместо клонирования DOM карточка **физически переносится** в fixed-хост на `body`:

1. `elevateCard()` вставляет `.case-card-placeholder` на место карточки (сохраняет размер в сетке — нет прыжка соседей), запоминает `parent` + `nextSibling`
2. Карточка переносится в `[data-case-card-elevate]` (`position: fixed`, `z-index: --z-employer-focus`), координаты из `getBoundingClientRect`
3. `restoreCard()` возвращает карточку на исходное место по сохранённому якорю, удаляет placeholder

**Почему перенос, а не клон:** клон со скрытием оригинала (`visibility: hidden`) терял pointer-события → карточка «моргала» в цикле activate/deactivate. Один и тот же DOM-элемент сохраняет hover-состояние и не рассинхронивает размеры.

При скролле `onScrollWhileActive` → `syncElevatedPosition()` держит хост над placeholder.

## Логика выхода

- **Источник правды** — модульная `activeHoverCard` (в контроллере). Локальных дублей нет: `deactivateCaseHover()` экспортируется и вызывается из pointer-move, поэтому состояние всегда согласовано.
- `onDocumentPointerMove` считает hover активным, только пока курсор **внутри прямоугольника карточки**. Ушёл на бенто/хедер/промежуток между карточками → мгновенная деактивация.
- Возврат на карточку срабатывает, потому что после деактивации `activeHoverCard = null` и `pointerover` снова проходит проверку `card !== activeHoverCard`.
- `pointerleave` на `[data-home-page]` — страховка на быстрый увод курсора за окно.

## Порталы и слои

Как и employer hover, слои — прямые потомки `body` (sticky-header создаёт stacking context, z-index внутри него не поднять):

| Слой | Элемент | z-index |
|------|---------|---------|
| Blur | `.case-focus__backdrop` — fullscreen backdrop-filter | `--z-employer-backdrop` (240) |
| Wash + grain | `.case-focus__overlay` → canvas (radial mask) | поверх blur |
| Карточка в фокусе | `.case-card-elevate` | `--z-employer-focus` (250) |
| Видео-блок | `.currently-block` | `--z-employer-block` (255) |

Порталы shared и переиспользуются между активациями (`getSharedPortal`, `getElevateHost`); wash кэшируется в `WeakMap` по root. `findPortalInDom` чистит дубли после View Transitions.

## currently-block для кейсов

- Видео: `data-hover-video` карточки (frontmatter `hover.previewVideo`, fallback — `siteConfig.employer.video`), проставляется в `CaseCard.astro`
- Wash tint: `wash.setTintId("case")` → токены `--wash-tint-case` / `--wash-palette-case-*` (обе темы)
- Размер блока **×1.5** относительно employer: класс `html.is-case-active` переопределяет `--currently-block-inner-*`, `--padding`, `--radius` на `--currently-block-case-*` (пропорции сохранены). Масштаб — токен `--currently-block-case-scale`.

Контроллер физики блока — общий `getCurrentlyBlock()` из `src/components/ui/currentlyBlock.client.ts`.

## Data-атрибуты и классы

| Атрибут / класс | Где | Роль |
|-----------------|-----|------|
| `data-case-card` | `<a>` карточки | Хост hover |
| `data-hover-from/to/angle` | Карточка | Градиент фона |
| `data-hover-preview` | Карточка | Изображение preview-панели |
| `data-hover-video` | Карточка | Видео currently-block |
| `data-hover-title` | Карточка | Заголовок preview |
| `is-case-active` | `html`, `[data-home-page]` | Включает blur/wash/scale |
| `is-active` | Карточка | Показ тегов, подсветка |
| `data-case-focus-root` / `-overlay` | Портал | Blur + wash слой |
| `data-case-card-elevate` | Fixed-хост | Слой поднятой карточки |
| `.case-card-placeholder` | В сетке | Держит место карточки |
| `.case-card--elevated` | Карточка | Отключает transition в фокусе |

## Ограничения

- Только desktop: `max-width: 639px` и `prefers-reduced-motion` отключают порталы (`isDisabled()` в JS + `display: none` в CSS)
- Градиент/blur не зависят от employer hover — независимые классы (`is-case-active` vs `is-employer-active`)
