# Experience Layer

Emotional UX: звуки, виброотклик, хоткеи, motion preferences.

## Использование

```ts
import { feedback } from "./feedback/FeedbackBus";

feedback.emit({ sound: "tap", haptic: "light", source: "dock.email" });
```

## Модули

- `feedback/` — FeedbackBus, конфиги звуков и вибро
- `audio/` — AudioEngine
- `hotkeys/` — HotkeysManager, hotkeys.config
- `motion/` — reduced motion helpers (`prefersReducedMotion`; используется, например, в `components/ui/tooltip.client.ts`)
- `wash/` — canvas gradient wash + grain ([`wash/README.md`](wash/README.md))
- `preferences/` — UserPreferences (localStorage), смена темы (`themeTransition.ts`, `theme-transition.css`)

## Смена темы

Точка входа — `toggleThemeWithTransition()` в `preferences/themeTransition.ts`.

| Триггер | Origin | Анимация |
|---------|--------|----------|
| `ThemeToggle` (виджет / dock) | центр кнопки | circle reveal |
| Хоткей `t` | — | мгновенно |
| `prefers-reduced-motion` | — | мгновенно |

### Circle reveal (View Transitions)

1. `document.startViewTransition()` — снимок old/new DOM, тема переключается в callback.
2. `document.documentElement.animate({ clipPath: circle(...) })` на `::view-transition-new(root)` — круг **новой** темы раскрывается от точки клика.
3. Easing: `cubic-bezier(0.22, 1, 0.36, 1)`, duration 480ms.

CSS (`theme-transition.css`): `animation: none` на `::view-transition-old/new(root)` — дефолтный cross-fade не конфликтует с clip-path.

### Fallback (без `startViewTransition`, напр. старый Safari)

Veil `.theme-switch-veil` с `data-theme={nextTheme}` + `veil.animate({ clipPath })` через Web Animations API. Цвета — селекторы `.theme-switch-veil[data-theme="…"]` в `src/styles/themes/*.css`.

## Правила

- Не вызывать `new Audio()` или `navigator.vibrate()` напрямую в виджетах
- Хоткеи регистрируются только в `hotkeys.config.ts`
- Подписи хоткеев в help — `messageKey` → [`src/i18n/locales/*.json`](../i18n/locales/en.json) (`hotkeys.*`)
- Уважать `prefers-reduced-motion` и UserPreferences

## Звуки (`sounds.config.ts`)

| Id | Файл | Когда |
|----|------|-------|
| `tap` | `tap_new.mp3` | Клик (`data-feedback="tap"`) |
| `hover` | `hover_new.mp3` | Hover (`data-feedback="tap hover"`) |
| `hoverEmployer` | `8bit_hover_new.mp3` | Hover employer name (`employerName.client.ts`) |
| `paper` | `paper_new.mp3` | Hover book widget (`data-feedback="paper"`) |
| `bubble` | `buble_hover_new.mp3` | Hover contact button (`data-feedback="bubble"`) |
| `swipe` | `swipe_new.mp3` | Открытие/закрытие contact panel (`ContactPanelController`) |
| `flip` | `flip.mp3` | Переворот MeWidget (`me.client.ts`) |

### `data-feedback` на главной

Декларативный hover/tap через `HomeOrchestrator.client.ts`:

| Значение | Tap | Hover-звук |
|----------|-----|------------|
| `tap` | ✓ | — |
| `tap hover` | ✓ | `hover` |
| `paper` | — | `paper` |
| `bubble` | — | `bubble` |

`paper` и `bubble` — hover-only: tap по умолчанию не проигрывается. Спец-звуки employer — напрямую из `employerName.client.ts`.
