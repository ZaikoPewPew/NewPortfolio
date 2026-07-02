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
- `preferences/` — UserPreferences (localStorage)

## Правила

- Не вызывать `new Audio()` или `navigator.vibrate()` напрямую в виджетах
- Хоткеи регистрируются только в `hotkeys.config.ts`
- Подписи хоткеев в help — `messageKey` → [`src/i18n/locales/*.json`](../i18n/locales/en.json) (`hotkeys.*`)
- Уважать `prefers-reduced-motion` и UserPreferences
