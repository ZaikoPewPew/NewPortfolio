# Case Hover — currently-block карточки кейса

Интерактив при наведении на карточку кейса на главной: рядом с курсором летит **currently-block** с видео или изображением и кастомный курсор «open». Никаких оверлеев (blur / wash / затемнение), смены фона или подъёма карточки — только медиа-блок и курсор. Контроллер физики блока — общий с employer hover (`src/components/ui/currentlyBlock.client.ts`).

## Файлы

| Файл | Назначение |
|------|------------|
| `CaseHoverController.client.ts` | Слушатели pointer-событий, состояние hover, классы `is-case-active` / `is-active` |
| `caseFocus.client.ts` | Интеграция с `currentlyBlock`: активация с `restart: true`, движение за курсором, сброс |
| `caseCursor.client.ts` | Кастомный курсор «open» за указателем (`cases.hoverCursor` в i18n) |
| `case-cursor.css` | Стили курсора, `cursor: none` при `is-case-active` |
| `case-focus.css` | Увеличенный размер `currently-block` для кейсов (класс `is-case-active`) |

Инициализация — `initCaseHover()` из `HomeOrchestrator.client.ts` (только `body[data-page="home"]`). Сброс при View Transitions — `resetCaseHover()`.

## Поток hover

1. `pointerover` в зоне `.home__cases` → `resolveCard()` находит `[data-case-card]`
2. `activate(card, x, y)`:
   - `html` + `[data-home-page]` получают класс `is-case-active` (увеличивает размер блока)
   - карточка → `.is-active` (показывает теги)
   - `activateCaseFocus()` — currently-block с медиа **с начала** (видео: `restart: true`) + курсор «open» + звук `hoverCard`
3. `onDocumentPointerMove` — как только курсор выходит **за bounding-box активной карточки**, вызывается `deactivateCaseHover()` (см. «Логика выхода»)
4. Переход на другую карточку — `pointerover` деактивирует текущую и активирует новую (видео новой карточки тоже с `currentTime = 0`)

## Логика выхода

- **Источник правды** — модульная `activeHoverCard` (в контроллере). Локальных дублей нет: `deactivateCaseHover()` экспортируется и вызывается из pointer-move, поэтому состояние всегда согласовано.
- `onDocumentPointerMove` считает hover активным, только пока курсор **внутри прямоугольника карточки**. Ушёл на бенто/хедер/промежуток между карточками → мгновенная деактивация.
- Возврат на ту же карточку: после деактивации `activeHoverCard = null`, следующий `pointerover` снова активирует блок — видео стартует **с нуля**.
- `pointerleave` на `[data-home-page]` — страховка на быстрый увод курсора за окно.

## currently-block для кейсов

Медиа на карточке — приоритет **видео → изображение → employer fallback**:

| Frontmatter | `data-*` на карточке | Поведение |
|-------------|----------------------|-----------|
| `hover.previewVideo` | `data-hover-video` | Ролик; при каждом входе `currentTime = 0` + `play()` |
| `hover.previewImage` (без видео) | `data-hover-image` | Статичное изображение (`object-fit: cover`) |
| ничего | `data-hover-video` = `employer.video` | Fallback-ролик employer |

`CaseCard.astro` передаёт `data-hover-image` **только** если `previewVideo` не задан — иначе legacy `previewImage` (cover SVG) не перекрывает ролик.

- Employer hover **без** `restart` — ролик продолжает с места паузы
- Размер блока **×1.5** относительно employer: класс `html.is-case-active` переопределяет `--currently-block-inner-*`, `--padding`, `--radius` на `--currently-block-case-*`. Масштаб — токен `--currently-block-case-scale`

Контроллер физики блока — общий `getCurrentlyBlock()` из `src/components/ui/currentlyBlock.client.ts`.

## Data-атрибуты и классы

| Атрибут / класс | Где | Роль |
|-----------------|-----|------|
| `data-case-card` | `<a>` карточки | Хост hover |
| `data-hover-video` | Карточка | Видео currently-block |
| `data-hover-image` | Карточка | Изображение (только без `previewVideo`) |
| `is-case-active` | `html`, `[data-home-page]` | Увеличенный размер currently-block + скрытие системного курсора |
| `is-active` | Карточка | Показ тегов |

## Ограничения

- Только desktop: `max-width: 639px` и `prefers-reduced-motion` отключают currently-block и кастомный курсор (`isDisabled()` в JS)
