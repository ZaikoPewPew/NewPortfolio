# Widgets

Модульная система бенто-виджетов. Один виджет = одна папка.

## Структура виджета

```
widgets/<id>/
├── README.md           # назначение, UX-сценарии, статус (planned|mock|live)
├── config.ts           # grid span, aria, hotkeys
├── <Id>Widget.astro    # разметка
├── <id>.styles.css     # стили (импорт в astro)
├── <id>.animations.css # анимации
├── <id>.client.ts      # island: интерактив (опционально)
└── data/               # если есть внешние данные
    ├── <id>.types.ts
    ├── <id>.mock.ts
    ├── <id>.api.ts
    └── <id>.source.ts  # переключатель mock/api
```

## Регистрация

Bento-виджет добавляется только в `registry.ts`.

Исключение: [`theme/`](theme/) — header-меню настроек, вне сетки.

## Правила

- Виджет не управляет фоном страницы и кейсами
- Звук/вибро — через `experience/feedback/FeedbackBus`
- Данные — через `data/*.source.ts`, не напрямую mock/api в компоненте
- Пользовательский copy — в [`src/i18n/`](../i18n/), mock через `getMessages()`; см. [`i18n/README.md`](../i18n/README.md)
