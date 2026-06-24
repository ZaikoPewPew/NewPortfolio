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
- `motion/` — reduced motion helpers
- `preferences/` — UserPreferences (localStorage)

## Правила

- Не вызывать `new Audio()` или `navigator.vibrate()` напрямую в виджетах
- Хоткеи регистрируются только в `hotkeys.config.ts`
- Уважать `prefers-reduced-motion` и UserPreferences
