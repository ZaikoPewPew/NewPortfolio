# Navigation widget

Статус: **live** · место: страница кейса (не в bento `registry`).

Плавающее меню навигации по кейсу: назад (на главную) и скролл наверх.

## Файлы

| Файл | Назначение |
|------|------------|
| `NavigationWidget.astro` | Разметка |
| `navigation.styles.css` | Фикс снизу слева, кнопки |
| `navigation.client.ts` | Scroll to top |

## Поведение

- Слева — кнопка «назад» (стрелка влево) — ссылка на главную (locale-aware), доступна всегда
- Справа — плавный скролл к началу страницы (`prefers-reduced-motion` → instant)
- Fixed, `bottom: 16px`, `left: 16px`
- Сам виджет всегда виден, auto-hide нет
- Кнопка «наверх» свёрнута у верха кейса; появляется (расширение виджета) после ~120px скролла вниз и не скрывается, пока читатель не вернётся к верху (`data-scrolled` на `nav`)
- Прогресс чтения: обводка 2px (`--color-accent`) вокруг кнопки «наверх», 0% — верх кейса, 100% — низ; старт с верхней середины, по часовой (`--nav-scroll-progress`); на 0% полностью скрыта (без точки от round linecap)
- Скролл-состояние (`--nav-scroll-progress`, `data-scrolled`) ставит `caseChrome.client.ts`; поведение не зависит от открытости ThemeWidget
- Подложка — glass как у хедера (blur + saturate, полупрозрачный surface)
- Feedback: `tap` / `hover` через `FeedbackBus`

## Где используется

- [`src/features/cases/CasePage.astro`](../../features/cases/CasePage.astro)
