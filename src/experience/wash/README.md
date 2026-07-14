# Wash — animated gradient + grain

Canvas-слой с WebGL mesh-gradient и procedural grain. Используется в employer hover и готов к переиспользованию в других эффектах (dock, ссылки).

## Файлы

| Файл | Назначение |
|------|------------|
| `wash.client.ts` | `createWash()`, `readWashTint()`, `readWashPalette()` |
| `wash.css` | `.wash__canvas` — fullscreen canvas внутри overlay |
| `meshGradient.vert.glsl` | Fullscreen quad |
| `meshGradient.frag.glsl` | Mesh gradient, distortion, swirl, grain |

## API

```ts
import { createWash, readWashTint } from "./wash.client";

const wash = createWash(canvas);
wash.setTintId("employer"); // палитра из --wash-palette-employer-*
wash.setTint("#692020");    // динамическая палитра из tint + --wash-bg
wash.destroy();
```

`createWash()` при ошибке WebGL возвращает no-op controller — overlay остаётся без анимации, без падения страницы.

## Подключение

1. Canvas с классом `wash__canvas` и `data-wash-canvas` внутри overlay-контейнера.
2. `createWash(canvas)` после вставки в DOM (нужен `clientWidth`/`clientHeight` родителя).
3. При hover — `setTintId(id)` по `data-wash-tint` хоста.
4. При unmount / навигации — `destroy()`.

Сейчас интегрировано в [`employerName.client.ts`](../../components/ui/employerName.client.ts). Спека UI-слоёв — [`components/ui/README.md`](../../components/ui/README.md) (секция Employer hover).

## Токены

Семантика в `tokens.css`, значения цветов — в `themes/dark.css`, `themes/light.css`, `themes/violet.css` и `themes/clay.css`.

| Токен | Смысл |
|-------|-------|
| `--wash-bg` | Фон палитры (тема) |
| `--wash-blur` / `--wash-saturate` | CSS filter на canvas (если нужен снаружи) |
| `--wash-speed` | Скорость анимации |
| `--wash-distortion` / `--wash-swirl` | Параметры шейдера |
| `--wash-grain-opacity` / `--wash-grain-size` / `--wash-grain-cycle` | Grain (шейдер + CSS fallback) |
| `--wash-grain-mixer` / `--wash-grain-overlay` | Сила grain в шейдере |
| `--wash-tint-{id}` | Accent tint по id (`employer`, `email`, `linkedin`, …) |
| `--wash-palette-{id}-bg` / `-1` / `-2` / `-3` | Кастомная 4-цветная палитра для id |

Если задана полная палитра `--wash-palette-{id}-*`, `setTintId` использует её напрямую. Иначе палитра строится из tint + bg через HSL-mix.

## Поведение

- **rAF-цикл** независим от курсора; ResizeObserver + `window.resize` подстраивают canvas под родителя.
- **DPR cap** — до 2×; **pixel budget** — не более ~1.5M пикселей (downscale на больших экранах).
- **Tint transition** — плавный HSL-mix (`TINT_MIX = 0.06` за кадр) при смене `setTint`.
- **Reduced motion** — wash не создаётся (`prefersReducedMotion()` в employer portal).

## Z-index (employer hover)

Wash рендерится внутри `.employer-name__overlay` (z-index 240, radial mask). Текст employer и префикс «currently at» — float на `body` (250). Видео-блок — 255.

## Правила

- Не дублировать WebGL-логику — только `createWash()`.
- Новые tint id — пара токенов в обеих темах (`--wash-tint-*`, опционально `--wash-palette-*`).
- `destroy()` обязателен при удалении portal из DOM.
