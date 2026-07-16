# Git Widget

GitHub: username, contribution heatmap.

## Данные

- mock: `data/git.mock.ts` — статичная heatmap из Figma
- api: contributions API (`data/git.api.ts`) → аккаунт из `site.config.ts` → `social.github`
- Окна:
  - heatmap — последние **108** дней (сетка 18×6)
  - счётчик — **последний год** (`?y=last`, ~365 дней)
- SSG отдаёт снимок на билде; `git.client.ts` сразу после загрузки подтягивает live API (CORS `*`)
- Переключатель: `PUBLIC_GITHUB_MODE=mock|api` (default: `api`)
- При ошибке API — fallback на mock (билд) / оставляем SSG-снимок (клиент)
- Статус: **live**

## UX

- Активные дни heatmap всегда зелёные (уровни l1–l4)
- Hover ячейки: тултип с датой (`Tooltip` + `formatContributionDate`), кроме последнего ряда
- Клик по всей карточке → GitHub profile (`data-git-profile-url` + `initWholeWidgetLink`); `header` и `heatmap` остаются нативными `<a>`
- `cursor: pointer` на `.git-widget` — кликабельная зона без «мёртвых» пикселей между header и heatmap
- Hover блока: `@username` → кол-во коммитов за год (slide целиком)
