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
