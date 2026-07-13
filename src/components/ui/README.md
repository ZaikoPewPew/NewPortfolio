# UI Components

Атомарные компоненты: `Button`, `Tag`, `Link`, `Tooltip` и др.

## Tooltip — шарик на нитке

Интерактивный тултип с физикой «гелиевый шарик на нитке»: позиция следует за курсором с задержкой, наклон — от скорости движения мыши, с покачиванием и выравниванием в вертикаль.

### Файлы

| Файл | Назначение |
|------|------------|
| `Tooltip.astro` | Разметка |
| `tooltip.styles.css` | Позиции (`top`/`bottom`/`left`/`right`), caret, enter |
| `tooltip.client.ts` | rAF spring: позиция, наклон, инициализация хостов |

Токены — `src/styles/tokens.css` (секция tooltip). Z-index слоя — `global.css` (`[data-tooltip-layer-active]`).

### Подключение

1. Обернуть триггер в хост с `data-tooltip-host` (`position: relative`).
2. Положить `<Tooltip lines={["строка 1", "строка 2"]} />` рядом с триггером (внутри хоста).
3. Вызвать `initDragTooltips()` из client script страницы/виджета.
4. Если тултип может перекрывать соседние виджеты — обернуть блок в `data-tooltip-layer` (см. `index.astro`, contact panel).

```astro
<div class="my-host" data-tooltip-host>
  <a href="..." aria-label="Канал">...</a>
  <Tooltip lines={["telegram", "1.1k subs"]} placement="left" />
</div>

<script>
  import { initDragTooltips } from "../../components/ui/tooltip.client";
  initDragTooltips();
</script>
```

`placement`: `top` (default) | `bottom` | `left` | `right`.

Повторный вызов `initDragTooltips()` безопасен: хосты помечаются `data-tooltip-bound`.

### Data-атрибуты

| Атрибут | Где | Роль |
|---------|-----|------|
| `data-tooltip-host` | Обёртка триггера | Слушает pointer/focus, показывает тултип |
| `data-tooltip-placement` | Корень `.tooltip` | `top` / `bottom` / `left` / `right` — сторона attachment |
| `data-tooltip-visible` | Хост (ставит JS) | Видимость тултипа |
| `data-tooltip-layer` | Предок (опционально) | Поднимает z-index при активном тултипе внутри |
| `data-tooltip-layer-active` | Слой (ставит JS) | `position: relative; z-index: var(--z-tooltip)` |
| `data-tooltip-bound` | Хост (ставит JS) | Защита от двойной инициализации |

### Поведение

**Позиция** — сдвиг вдоль оси, перпендикулярной placement: `--tooltip-shift-x` для `top`/`bottom`, `--tooltip-shift-y` для `left`/`right`. Inertial spring (`force 0.14`, `damping 0.78`), clamp ±`--tooltip-follow-clamp` от размера хоста по этой оси.

**Наклон** — `--tooltip-tilt` на `.tooltip__balloon`. Целевой угол зеркален скорости мыши по оси follow (инерция шарика). Диапазон ±`--tooltip-tilt-max` (30°).

**Spring угла** — `force 0.09`, `damping 0.82`: при остановке 1–2 колебания вокруг 0°, затем строго к attachment.

**Точка вращения** — у носика / «нитки»: `bottom center` (`top`), `top center` (`bottom`), `right center` (`left`), `left center` (`right`).

**Enter** — opacity + лёгкий scale/translate к хосту на `.tooltip__balloon` через CSS (`--motion-tooltip-enter`, `--ease-spring-soft`). `rotate` и сдвиг позиции — только через rAF, без CSS-transition.

**Keyboard** — `focus-within` на хосте показывает тултип по центру, без follow и наклона.

**Reduced motion** — `prefersReducedMotion()`: мгновенная позиция, без наклона и spring; enter — только fade.

### Токены (тюнинг)

| Токен | По умолчанию | Смысл |
|-------|--------------|-------|
| `--tooltip-offset` | `var(--space-sm)` | Отступ от триггера |
| `--motion-tooltip-enter` | `var(--motion-base)` | Длительность появления |
| `--tooltip-enter-scale-from` | `0.96` | Scale при enter |
| `--tooltip-follow-clamp` | `0.4` | Макс. сдвиг как доля ширины хоста |
| `--tooltip-tilt-max` | `30` | Макс. угол, градусы |
| `--tooltip-balloon-force` | `0.09` | Сила spring угла |
| `--tooltip-balloon-damping` | `0.82` | Затухание spring угла |
| `--tooltip-velocity-to-angle` | `0.065` | Скорость мыши → градусы |

Цвета и тень: `--color-tooltip-bg`, `--color-tooltip-text`, `--shadow-tooltip` (`box-shadow` на `.tooltip__content`).

### Где используется

- [`src/widgets/bento/`](../widgets/bento/) — тултипы на плитках (`tooltip?: string[]`, `tooltipPlacement?: left|right|…` в mock)

### Правила

- Не дублировать spring-логику в виджетах — только `initDragTooltips()`.
- Не добавлять framer-motion: vanilla rAF, без лишних зависимостей.
- Новые токены — в `tokens.css`, не сырые значения в `.astro`.

---

## Currently-block

Плавающий виджет с видео или изображением: следует за курсором с инерцией и наклоном. Один shared-инстанс на `body`; при активации другого хоста подставляется его медиа.

### Файлы

| Файл | Назначение |
|------|------------|
| `currentlyBlock.client.ts` | DOM, физика, видео + изображение, `bindCurrentlyBlockHost`, `initCurrentlyBlock`, опция `restart` |
| `currently-block.css` | Liquid-glass рамка, `.currently-block__video` / `__image` |
| `CurrentlyBlockTrigger.astro` | Обёртка-хост с data-атрибутами |

Инициализация — `initCurrentlyBlock()` (вызывается из `initEmployerName()` на главной) или напрямую из оркестратора. Сброс — `resetCurrentlyBlock()`.

`CurrentlyBlockActivateOptions`:

| Поле | Роль |
|------|------|
| `videoSrc` | URL ролика; приоритет над `imageSrc` |
| `imageSrc` | URL статичного изображения (если видео нет) |
| `restart` | При `activate()` — `currentTime = 0` и `play()` (только для видео) |

Карточки кейсов (`caseFocus.client.ts`) — `restart: true`; employer / `bindCurrentlyBlockHost` — без restart (продолжение с паузы).

### Подключение

**Astro-обёртка:**

```astro
---
import CurrentlyBlockTrigger from "./CurrentlyBlockTrigger.astro";
---
<CurrentlyBlockTrigger video="/images/widgets/currently-block/fantech.mp4" sound="hover">
  <button type="button">Смотреть</button>
</CurrentlyBlockTrigger>
```

**Data-атрибуты напрямую:**

```html
<span
  data-currently-block-host
  data-currently-block-video="/images/widgets/currently-block/fantech.mp4"
>
  Hover me
</span>
```

| Атрибут | Роль |
|---------|------|
| `data-currently-block-host` | Хост hover/focus |
| `data-currently-block-video` | URL ролика (обязателен) |
| `data-currently-block-offset-x` / `-y` | Смещение от курсора, px (default 24) |
| `data-currently-block-sound` | `hover` или `hoverEmployer` — звук через FeedbackBus |
| `data-currently-block-sound-source` | `source` для feedback (default `currently-block`) |
| `data-currently-block-focus` | Элемент для позиции при keyboard focus (default — хост) |

Видимость блока — класс `.currently-block.is-active` на элементе (не зависит от employer overlay).

Employer hover использует тот же контроллер через `getCurrentlyBlock()`; overlay/wash/float остаются в `employerName.client.ts`.

---

## Employer hover — currently-block

Интерактив при наведении на имя работодателя в хедере: blur-оверлей, «всплывший» текст и плавающий виджет с видео, следующий за курсором с инерцией и наклоном.

### Файлы

| Файл | Назначение |
|------|------------|
| `EmployerName.astro` | Ссылка на работодателя, `data-employer-video` из `site.config`, `data-wash-tint="employer"` |
| `employerName.client.ts` | Портал overlay на `body`, float-label, wash; блок — через `currentlyBlock.client.ts` |
| `employer-name.css` | Overlay (backdrop + wash + grain), float; импорт `currently-block.css` |
| `experience/wash/wash.client.ts` | Canvas wash, `readWashTint()` |
| `experience/wash/wash.css` | `.wash__canvas`, `.wash__grain` |

Спека wash: [`src/experience/wash/`](../experience/wash/). Цвета — `--wash-tint-*` в `src/styles/themes/dark.css` / `light.css`. Видео-ассет — `public/images/widgets/currently-block/` (см. README в папке). Инициализация — `initEmployerName()` из `HomeOrchestrator.client.ts`; сброс при навигации — `resetEmployerName()`.

### Подключение

```astro
<EmployerName label={siteConfig.employer.label} />
```

Путь к видео берётся из `siteConfig.employer.video` внутри компонента. Отдельно передавать не нужно.

### DOM и порталы

`position: sticky` у header создаёт stacking context — z-index внутри хедера не поднимает hover выше остальной страницы. Поэтому три слоя рендерятся **прямыми потомками `body`**:

| Слой | Элемент | z-index |
|------|---------|---------|
| Blur | `.employer-name__backdrop` — fullscreen, без маски | `--z-employer-backdrop` (240) |
| Wash + grain | `.employer-name__overlay` → canvas (radial mask) | поверх blur |
| Текст employer | `.employer-name__label-float` (`data-employer-float`) | `--z-employer-focus` (250) |
| Префикс «currently at» | `.employer-prefix__float` (`data-employer-prefix-float`) | `--z-employer-focus` (250) |
| Видео-блок | `.currently-block` (`data-currently-block`) | `--z-employer-block` (255) |

`currently-block` — отдельный sibling на `body`, не внутри `employer-focus-root`, чтобы блок летал **над** текстом, а не под ним.

При активации оригинальный `.employer-name__label` скрывается (`visibility: hidden`), float копирует типографику и позицию через `getBoundingClientRect` + device-pixel snap.

### Data-атрибуты

| Атрибут | Где | Роль |
|---------|-----|------|
| `data-employer-name-host` | `.employer-name` | Хост hover/focus |
| `data-employer-video` | Хост | URL ролика |
| `data-employer-bound` | Хост (JS) | Защита от двойной инициализации |
| `data-employer-active` | Хост (JS) | Активное состояние |
| `data-employer-focus-root` | Портал overlay | Корень blur-слоя |
| `data-employer-overlay` | Overlay | Wash + grain (fade) |
| `data-wash-canvas` | Canvas | Animated gradient wash |
| `data-wash-tint` | Хост | Id токена `--wash-tint-{id}` |
| `data-employer-float` | Float label | Копия текста над overlay |
| `data-employer-prefix` | Префикс в header | Исходный «currently at» |
| `data-employer-prefix-float` | Float prefix | Копия префикса над overlay |
| `data-currently-block` | Видео-блок | Плавающий виджет |

Глобальный класс `html.is-employer-active` включает видимость overlay. Блок — `.currently-block.is-active`.

### Поведение

**Wash** — WebGL mesh-gradient в `experience/wash/`. rAF-цикл независим от курсора; grain в шейдере (`--wash-grain-mixer`, `--wash-grain-overlay`). Hover: fade overlay + `setTint(--wash-tint-{id})` с плавным HSL-mix.

**Позиция блока** — `translate: var(--currently-block-x/y)` от `position: fixed; top/left: 0`. Цель — курсор + offset (`POINTER_OFFSET_X/Y` = 24px). Inertial spring: `--employer-follow-force`, `--employer-follow-damping`.

**Наклон** — `rotate: var(--currently-block-tilt)`. Зеркален скорости мыши по X (как у tooltip). Токены: `--employer-tilt-max`, `--employer-velocity-to-angle`, `--employer-balloon-force`, `--employer-balloon-damping`.

**Видео** — `play()` при `mouseenter` / `focusin`, `pause()` при уходе. Без звука.

**Scroll** — пока hover активен, float пересчитывает позицию по `scroll` (passive listener).

**Keyboard** — `focusin` на ссылке активирует эффект по центру label.

### Ограничения

- **Desktop only** — `isMobileViewport()`: на mobile портал скрыт (`display: none` в CSS).
- **Reduced motion** — `prefersReducedMotion()`: эффект отключён.
- **Visibility** — при `document.visibilitychange` → hidden сбрасывает hover.

### Токены (тюнинг)

| Токен | Смысл |
|-------|-------|
| `--currently-block-inner-width` / `--height` | Размер области видео (297×152) |
| `--currently-block-radius` / `--inner-radius` | Скругления рамки и медиа |
| `--currently-block-padding` | Padding рамки |
| `--employer-blur-amount` | Сила backdrop-blur под wash |
| `--wash-blur` / `--wash-saturate` | Blur/saturate canvas wash |
| `--wash-grain-opacity` / `--wash-grain-size` / `--wash-grain-cycle` | Grain поверх wash |
| `--wash-bg` | Фон wash (тема) |
| `--wash-tint-employer` / `--wash-tint-email` / … | Tint по id ссылки (тема) |
| `--employer-follow-force` / `--employer-follow-damping` | Spring позиции |
| `--employer-tilt-max` | Макс. угол наклона, ° |
| `--employer-balloon-force` / `--employer-balloon-damping` | Spring угла |
| `--employer-velocity-to-angle` | Скорость мыши → градусы |
| `--z-employer-backdrop` / `--z-employer-focus` / `--z-employer-block` | Порядок слоёв |

### Где используется

- [`src/components/layout/Header.astro`](../layout/Header.astro)
- [`src/features/home/HomeOrchestrator.client.ts`](../features/home/HomeOrchestrator.client.ts)

### Правила

- Не дублировать портал/float-логику — только `initEmployerName()`.
- Путь к видео — только `site.config.ts` → `employer.video`.
- Новые z-index слои employer — в `tokens.css`, не магические числа в CSS.

---

## Contact button — hover fill

Кнопка say hi / vibe check в `MeWidget`: заливка `--color-link-hover` через `clip-path: circle()`, origin — точка входа/выхода курсора.

### Файлы

| Файл | Назначение |
|------|------------|
| `ContactButton.astro` | Разметка, слой `.contact-button__fill`, цвета hover |
| `contactButton.client.ts` | fill on enter/leave; `resetContactButton` / `resumeContactButtonHover` |

Инициализация — `initContactButton()` из `HomeOrchestrator.client.ts`; сброс — `resetContactButton()` при навигации, bfcache и `document.visibilitychange` → hidden (Cmd+Tab / уход в другое окно — `mouseleave` часто не срабатывает). Во время me-flip enter/leave игнорируются (`[data-me-flipping]`); после flip — `resumeContactButtonHover()`.

### Feedback

| Событие | Звук | Источник |
|---------|------|----------|
| Hover | `bubble` | `data-feedback="bubble"` → `HomeOrchestrator` |
| Click / hotkey | `swipe` | `ContactPanelController.client.ts` |

Tap на кнопке **не** проигрывается (`bubble` — hover-only).

### Data-атрибуты

| Атрибут | Где | Роль |
|---------|-----|------|
| `data-contact-button` | `<button>` | Триггер panel + hover fill |
| `data-contact-hover` | Кнопка (JS) | Активный hover/focus — цвет текста и keycap |
| `data-contact-button-bound` | Кнопка (JS) | Защита от двойной инициализации |
| `data-contact-button-label` | Label | Текст say hi / vibe check (обновляет panel controller) |
| `data-contact-button-keycap` | Keycap | Hint `h` / `c` |

### Поведение

**Fill in** — `circle(0% at x% y%)` → `circle(150% at x% y%)` на следующем кадре; `x/y` — позиция курсора относительно кнопки.

**Fill out** — схлопывание в `circle(0% at x% y%)` из точки выхода.

**Focus** — origin `50% 50%`. При `:focus-visible` mouseleave не гасит заливку; при `:hover` focusout не сбрасывает.

**Reduced motion** — fill скрыт, мгновенная смена `background` через `data-contact-hover`.

**Visibility** — при `document.visibilitychange` → hidden сбрасывает hover fill (как у employer), иначе заливка залипает после Cmd+Tab.

### Токены

| Токен | Смысл |
|-------|-------|
| `--color-contact-button-hover-bg` | Фон заливки (`--color-link-hover`) |
| `--color-contact-button-hover-text` | Текст и keycap на hover |
| `--motion-contact-button-fill` | Длительность clip-path (160ms) |
| `--motion-contact-button-text` | Длительность цвета (140ms) |
| `--ease-contact-button-fill` | Easing заливки |
| `--contact-button-fill-radius-hover` | Радиус circle при hover (150%) |

### Где используется

- [`src/widgets/me/MeWidget.astro`](../widgets/me/MeWidget.astro)
- [`src/features/home/contact/ContactPanelController.client.ts`](../features/home/contact/ContactPanelController.client.ts)

---

## ThemeWidget

Пилюля настроек в хедере: локация/время, язык, звук, тема.

### Файлы

| Файл | Назначение |
|------|------------|
| `ThemeWidget.astro` | Разметка 4 контролов |
| `themeWidget.client.ts` | Live time + sound toggle |
| `ThemeToggle.astro` | Кнопка темы внутри виджета |

### Поведение

- Location — display-only (`ala \ 12:30 pm`), время из `site.config.location`
- Language — ссылка на другую локаль (`/` ↔ `/ru/…`)
- Sound — `userPreferences.toggleSound()` + FeedbackBus
- Theme — существующий `ThemeToggle` (circle reveal)

### Где используется

- [`src/components/layout/Header.astro`](../layout/Header.astro)
