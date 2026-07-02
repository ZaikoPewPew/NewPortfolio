# i18n

Локализация UI: `en` (default) и `ru`. Ограничения для агентов — [`.cursor/rules/i18n.mdc`](../../.cursor/rules/i18n.mdc).

## Файлы

| Файл | Назначение |
|------|------------|
| `locale.config.ts` | `supportedLocales`, `defaultLocale` |
| `locales/en.json` | Каталог строк (источник типов) |
| `locales/ru.json` | Перевод — те же ключи, что в `en.json` |
| `types.ts` | `Messages`, `HotkeyMessageKey` |
| `index.ts` | `getMessages()`, `interpolate()` |

## Использование

```ts
import { getMessages, interpolate } from "../i18n";

const m = getMessages();
m.header.employerPrefix;
interpolate(m.header.employerAriaLabel, { employer: "alfa-bank" });
```

В `.astro` — `const m = getMessages()` в frontmatter, строки в разметке из `m.*`.

## Карта секций JSON

| Секция | Где используется |
|--------|------------------|
| `meta` | `BaseLayout.astro` — title, description |
| `home` | `index.astro` — aria главной |
| `header` | `Header.astro`, `EmployerName.astro` |
| `me` | `MeWidget`, `ContactButton`, contact panel |
| `contact` | `ContactWidget` — aria, подписи ссылок |
| `theme` | `ThemeToggle.astro` |
| `bento` | `bento.mock.ts`, `BentoWidget.astro` |
| `hotkeys` | `HotkeysManager`, `hotkeys.config.ts` (`messageKey`) |

## Правила

1. Новый UI-copy — в `en.json`, зеркально в `ru.json`. Не в `.astro` / client TS.
2. Плейсхолдеры — `{key}` в JSON, подстановка через `interpolate()`.
3. Хоткеи: текст в `hotkeys.*`, в `hotkeys.config.ts` только `messageKey`.
4. Виджеты: строки в i18n, mock читает `getMessages().<section>`.
5. **Не переводить:** имена, бренды, URL, employer label — `site.config.ts`.

## Кейсы

Тексты кейсов — в `src/content/cases/*.mdx` (сейчас на русском). Стратегия мультиязычности для MDX — не зафиксирована; варианты в `i18n.mdc`.

## Смена локали

Сейчас активна одна локаль — `defaultLocale` в `locale.config.ts`. Роутинг `/en/`, cookie или toggle — отдельная задача; каталоги уже готовы.
