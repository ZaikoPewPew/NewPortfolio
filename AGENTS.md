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
| `project-config.mdc` | `src/config/**` |

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

## Модульная документация

- [`src/widgets/README.md`](src/widgets/README.md)
- [`src/experience/README.md`](src/experience/README.md)
- [`src/features/home/README.md`](src/features/home/README.md)
