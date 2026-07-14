# Theme menu widget

Статус: **live** · место: header (не в bento `registry`).

Меню настроек: локация/время, язык, звук, тема. Закрыто — кнопка-якорь; открыто — подложка растягивается влево, чипы вылетают из якоря (FLIP).

## Файлы

| Файл | Назначение |
|------|------------|
| `ThemeWidget.astro` | Разметка |
| `theme.styles.css` | Оболочка, tray expand, якорь |
| `theme.client.ts` | Open/close, FLIP-вылет, clock, sound |

## Поведение

- Якорь справа не смещается (☰ ↔ ✕)
- Shell / tray растут справа налево
- Чипы стартуют из центра якоря (`playOpenFromAnchor`) и с лёгким bounce встают в слоты
- Тултипы языка и звука — снизу; theme — через `ThemeToggle`
- Close — повторный клик / Escape / outside

## Где используется

- [`src/components/layout/Header.astro`](../../components/layout/Header.astro)
