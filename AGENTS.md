# AGENTS.md

Инструкции для AI-агентов (Cursor и др.). Детали модулей — в README рядом с кодом, ограничения — в `.cursor/rules/`.

## Принципы

- Отвечать на **русском**
- Не добавлять зависимости без необходимости
- Один факт — одно место: не дублировать rules в коде или README

## Ограничения (источник истины)

Глобальные правила в [`.cursor/rules/`](.cursor/rules/):

| Rule | Когда |
|------|-------|
| `project-overview.mdc` | всегда |
| `design-tokens.mdc` | всегда |
| `emotional-design.mdc` | всегда |
| `widget-modules.mdc` | `src/widgets/**` |
| `component-structure.mdc` | `src/components/**` |
| `home-interactions.mdc` | `src/features/home/**` |
| `content-cases.mdc` | `src/content/**` |
| `layouts-pages.mdc` | `src/layouts/**`, `src/pages/**` |
| `layout-grid.mdc` | `src/components/layout/**`, `tokens.css`, главная |
| `project-config.mdc` | `src/config/**` |
| `i18n.mdc` | всегда (тексты, локали, переводы) |

## Куда идти по задаче

| Задача | Файл / папка |
|--------|---------------|
| Новый виджет | `src/widgets/<id>/`, регистрация в `registry.ts` |
| Hover кейсов | `src/features/home/case-hover/` |
| Звук / вибро | `src/experience/feedback/FeedbackBus.ts` |
| Хоткеи | `src/experience/hotkeys/hotkeys.config.ts` |
| Новый кейс | `src/content/cases/*.mdx`, схема в `content.config.ts` |
| Токены / темы | `src/styles/tokens.css`, `src/styles/themes/` |
| Site metadata | `src/config/site.config.ts` |
| Dock actions | `src/config/dock.config.ts` |
| Mock / API режим | `src/config/env.config.ts`, `widgets/*/data/*.source.ts` |
| Layout / маршруты | `src/layouts/`, `src/pages/` |
| Страница 404 | `src/pages/404.astro`, `src/features/not-found/` |
| Сетка главной | `.cursor/rules/layout-grid.mdc`, `components/layout/Grid.astro` |
| Тултип (balloon) | `src/components/ui/Tooltip.astro`, `tooltip.client.ts` — см. `components/ui/README.md` |
| Employer hover / currently-block | `src/components/ui/EmployerName.astro`, `employerName.client.ts` — см. `components/ui/README.md` |
| Contact button hover | `src/components/ui/ContactButton.astro`, `contactButton.client.ts` — см. `components/ui/README.md` |
| Конфиг сайта | `src/config/` — см. `config/README.md` |
| UI-тексты / переводы | `src/i18n/locales/*.json`, `locale.config.ts` — см. `i18n.mdc` |

## Модульная документация

- [`src/i18n/README.md`](src/i18n/README.md)
- [`src/components/ui/README.md`](src/components/ui/README.md)
- [`src/widgets/README.md`](src/widgets/README.md)
- [`src/experience/README.md`](src/experience/README.md)
- [`src/features/home/README.md`](src/features/home/README.md)
- [`src/features/not-found/README.md`](src/features/not-found/README.md)
- [`src/config/README.md`](src/config/README.md)
