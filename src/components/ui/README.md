# UI Components

Атомарные компоненты: `Button`, `Tag`, `Link`, `Tooltip` и др.

## Tooltip — шарик на нитке

Интерактивный тултип с физикой «гелиевый шарик на нитке»: позиция следует за курсором с задержкой, наклон — от скорости движения мыши, с покачиванием и выравниванием в вертикаль.

### Файлы

| Файл | Назначение |
|------|------------|
| `Tooltip.astro` | Разметка, enter-анимация (fade + scale), стили |
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
  <Tooltip lines={["telegram", "1.1k subs"]} />
</div>

<script>
  import { initDragTooltips } from "../../components/ui/tooltip.client";
  initDragTooltips();
</script>
```

Повторный вызов `initDragTooltips()` безопасен: хосты помечаются `data-tooltip-bound`.

### Data-атрибуты

| Атрибут | Где | Роль |
|---------|-----|------|
| `data-tooltip-host` | Обёртка триггера | Слушает pointer/focus, показывает тултип |
| `data-tooltip-visible` | Хост (ставит JS) | Видимость тултипа |
| `data-tooltip-layer` | Предок (опционально) | Поднимает z-index при активном тултипе внутри |
| `data-tooltip-layer-active` | Слой (ставит JS) | `position: relative; z-index: var(--z-tooltip)` |
| `data-tooltip-bound` | Хост (ставит JS) | Защита от двойной инициализации |

### Поведение

**Позиция** — горизонтальный сдвиг `--tooltip-shift-x` от центра хоста к курсору. Inertial spring (`force 0.14`, `damping 0.78`), clamp ±`--tooltip-follow-clamp` от ширины хоста.

**Наклон** — `--tooltip-tilt` на `.tooltip__balloon`. Целевой угол зеркален скорости мыши по X (инерция шарика): резко вправо → наклон влево. Диапазон ±`--tooltip-tilt-max` (30°).

**Spring угла** — `force 0.09`, `damping 0.82`: при остановке 1–2 колебания вокруг 0°, затем строго вертикально.

**Точка вращения** — `transform-origin: bottom center` (низ у носика / «нитка»).

**Enter** — opacity + лёгкий scale/translateY на `.tooltip__balloon` через CSS (`--motion-tooltip-enter`, `--ease-spring-soft`). `rotate` и сдвиг позиции — только через rAF, без CSS-transition.

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

Цвета: `--color-tooltip-bg`, `--color-tooltip-text`, `--shadow-tooltip`.

### Где используется

- [`src/widgets/bento/`](../widgets/bento/) — тултипы на плитках (`tooltip?: string[]` в mock)

### Правила

- Не дублировать spring-логику в виджетах — только `initDragTooltips()`.
- Не добавлять framer-motion: vanilla rAF, без лишних зависимостей.
- Новые токены — в `tokens.css`, не сырые значения в `.astro`.

---

## Employer hover — currently-block

Интерактив при наведении на имя работодателя в хедере: blur-оверлей, «всплывший» текст и плавающий виджет с видео, следующий за курсором с инерцией и наклоном.

### Файлы

| Файл | Назначение |
|------|------------|
| `EmployerName.astro` | Ссылка на работодателя, `data-employer-video` из `site.config` |
| `employerName.client.ts` | Портал на `body`, физика, float-label, видео |
| `employer-name.css` | Overlay, float, currently-block |

Видео-ассет — `public/images/widgets/currently-block/` (см. README в папке). Инициализация — `initEmployerName()` из `HomeOrchestrator.client.ts`; сброс при навигации — `resetEmployerName()`.

### Подключение

```astro
<EmployerName label={siteConfig.employer.label} />
```

Путь к видео берётся из `siteConfig.employer.video` внутри компонента. Отдельно передавать не нужно.

### DOM и порталы

`position: sticky` у header создаёт stacking context — z-index внутри хедера не поднимает hover выше остальной страницы. Поэтому три слоя рендерятся **прямыми потомками `body`**:

| Слой | Элемент | z-index |
|------|---------|---------|
| Blur + grain | `.employer-focus-root` → `.employer-name__overlay` | `--z-employer-backdrop` (240) |
| Текст employer | `.employer-name__label-float` (`data-employer-float`) | `--z-employer-focus` (250) |
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
| `data-employer-overlay` | Overlay | Blur + grain |
| `data-employer-float` | Float label | Копия текста над overlay |
| `data-currently-block` | Видео-блок | Плавающий виджет |

Глобальный класс `html.is-employer-active` включает видимость overlay и блока.

### Поведение

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
| `--employer-blur-amount` | Сила backdrop-blur оверлея |
| `--employer-grain-opacity` / `--employer-grain-size` | Grain поверх blur |
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
