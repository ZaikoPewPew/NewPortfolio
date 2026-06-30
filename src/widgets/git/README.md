# Git Widget

GitHub: username, contribution heatmap.

## Данные

- mock: `data/git.mock.ts` — статичная heatmap из Figma
- api: GitHub public API via `data/git.api.ts`
- Переключатель: `PUBLIC_GITHUB_MODE=mock|api`
- Статус: **mock**

## UX

- Default: серая heatmap, иконка GitHub + `@zaikoopewpew`
- Hover: зелёная heatmap + inset glow
- Click: переход на GitHub profile
