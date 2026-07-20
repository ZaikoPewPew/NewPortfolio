# Theme menu widget

Статус: **live** · место: fixed top-right на home и странице кейса (не в bento `registry`).

Меню настроек: язык, звук, тема. Закрыто — кнопка-якорь; открыто — подложка растягивается вниз, чипы вылетают из якоря (FLIP).

## Файлы

| Файл | Назначение |
|------|------------|
| `ThemeWidget.astro` | Разметка (якорь сверху, tray снизу) |
| `theme.styles.css` | Колонка, `grid-template-rows` expand, якорь |
| `theme.client.ts` | Open/close, FLIP-вылет, sound |

## Поведение

- Якорь сверху не смещается (☰ ↔ ✕)
- Shell / tray растут сверху вниз (`grid-template-rows: 0fr → 1fr`)
- Чипы стартуют из центра якоря (`playOpenFromAnchor`) и с лёгким bounce встают в слоты; ближайший к якорю ведёт анимацию
- Тултипы — `placement="left"` (язык, звук, тема через `ThemeToggle` + `tooltipPlacement`)
- Смена темы — circle reveal через `themeTransition.ts`, см. [`experience/README.md`](../../experience/README.md)
- Close — повторный клик / Escape / outside
- Класс `theme-widget--fixed` — `position: fixed; top/right: --space-md` (стили в `home.layout.css`)

## Где используется

- [`src/features/home/HomePage.astro`](../../features/home/HomePage.astro) — `class="theme-widget--fixed"`
- [`src/features/cases/CasePage.astro`](../../features/cases/CasePage.astro) — то же
