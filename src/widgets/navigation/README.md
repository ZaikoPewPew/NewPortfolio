# Navigation widget

Статус: **live** · место: страница кейса (не в bento `registry`).

Плавающее меню навигации по кейсу: домой и скролл наверх.

## Файлы

| Файл | Назначение |
|------|------------|
| `NavigationWidget.astro` | Разметка |
| `navigation.styles.css` | Фикс снизу по центру, кнопки |
| `navigation.client.ts` | Scroll to top |

## Поведение

- Слева — ссылка на главную (locale-aware)
- Справа — плавный скролл к началу страницы (`prefers-reduced-motion` → instant)
- Fixed, `bottom: 16px`, по центру viewport
- Прогресс чтения: обводка 2px (`--color-accent`) вокруг кнопки «наверх», 0% — верх кейса, 100% — низ; старт с верхней середины, по часовой (`--nav-scroll-progress`); на 0% полностью скрыта (без точки от round linecap)
- Auto-hide (асимметричный, как тулбары article-сайтов): скрытие после ~72px накопленного скролла вниз, показ мгновенно при скролле вверх; всегда видна в зонах < 120px от верха и < 160px от низа
- Подложка — glass как у хедера (blur + saturate, полупрозрачный surface)
- Feedback: `tap` / `hover` через `FeedbackBus`

## Где используется

- [`src/features/cases/CasePage.astro`](../../features/cases/CasePage.astro)
