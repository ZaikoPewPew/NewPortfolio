# Git Widget

GitHub: username, contribution heatmap.

## Данные

- mock: `data/git.mock.ts` — статичная heatmap из Figma
- api: contributions API (`data/git.api.ts`) → последние 108 дней аккаунта из `site.config.ts` → `social.github`
- Переключатель: `PUBLIC_GITHUB_MODE=mock|api` (default: `api`)
- При ошибке API — fallback на mock
- Статус: **live**

## UX

- Активные дни heatmap всегда зелёные (уровни l1–l4)
- Hover ячейки: тултип с датой (`Tooltip` + `formatContributionDate`), кроме последнего ряда
- Heatmap: `cursor: pointer`, клик → GitHub profile
- Hover блока: `@username` → `Follow` (slide целиком)
