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
- `preferences/` — UserPreferences (localStorage)

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

### `data-feedback` на главной

Декларативный hover/tap через `HomeOrchestrator.client.ts`:

| Значение | Tap | Hover-звук |
|----------|-----|------------|
| `tap` | ✓ | — |
| `tap hover` | ✓ | `hover` |
| `paper` | — | `paper` |
| `bubble` | — | `bubble` |

`paper` и `bubble` — hover-only: tap по умолчанию не проигрывается. Спец-звуки employer — напрямую из `employerName.client.ts`.
