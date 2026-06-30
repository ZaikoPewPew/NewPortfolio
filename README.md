# Портфолио — Vladislav Kurguzov

Портфолио продуктового дизайнера. Язык контента — русский. Dark-first.

## Стек

- [Astro](https://astro.build) + MDX (Content Collections)
- CSS custom properties (`src/styles/tokens.css`)
- Vanilla TypeScript islands для интерактива
- View Transitions API для навигации

## Команды

```bash
npm run dev      # локальная разработка
npm run build    # production-сборка
npm run preview  # предпросмотр сборки
```

## Маршруты

| URL | Файл |
|-----|------|
| `/` | `src/pages/index.astro` |
| `/cases/[slug]` | `src/pages/cases/[slug].astro` |

## Структура `src/`

```
src/
├── components/       # dumb UI: layout, cases, ui
├── config/           # site, dock, env (mock/api режимы)
├── content/cases/    # кейсы (MDX)
├── experience/       # звук, вибро, хоткеи, motion
├── features/
│   ├── home/         # hover-фон, dock, header, orchestrator
│   └── transitions/  # View Transitions стили
├── layouts/          # BaseLayout, CaseLayout
├── pages/            # маршруты Astro
├── styles/           # tokens, themes, global
└── widgets/          # бенто-виджеты + registry.ts
```

## Главная страница

- **Header:** employer + location/time
- **Слева:** bento-виджеты (`src/widgets/`)
- **Справа:** кейсы с hover-градиентом
- **Dock:** email, social, theme toggle

## Документация по модулям

| Модуль | README |
|--------|--------|
| UI (Tooltip и др.) | [`src/components/ui/README.md`](src/components/ui/README.md) |
| Виджеты | [`src/widgets/README.md`](src/widgets/README.md) |
| Experience layer | [`src/experience/README.md`](src/experience/README.md) |
| Главная (hover, dock) | [`src/features/home/README.md`](src/features/home/README.md) |

Правила для AI-агентов — в [`AGENTS.md`](AGENTS.md) и [`.cursor/rules/`](.cursor/rules/).
