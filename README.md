# Портфолио — Vladislav Kurguzov

Персональный сайт продуктового дизайнера. Dark-first, с акцентом на **emotional UX**: звук, вибро, motion, hover-интеракции. Референс по hover-кейсам — [lamanoujaim.com](https://lamanoujaim.com).

Локали UI: `en` (default) и `ru`. Кейсы сейчас на русском в MDX.

---

## Содержание

- [Быстрый старт](#быстрый-старт)
- [Стек](#стек)
- [Архитектура](#архитектура)
- [Страницы и маршруты](#страницы-и-маршруты)
- [Главная страница](#главная-страница)
- [Сетка и адаптив](#сетка-и-адаптив)
- [Виджеты](#виджеты)
- [Кейсы (контент)](#кейсы-контент)
- [i18n](#i18n)
- [Конфигурация](#конфигурация)
- [Дизайн-система](#дизайн-система)
- [Experience layer](#experience-layer)
- [Навигация и переходы](#навигация-и-переходы)
- [Переменные окружения](#переменные-окружения)
- [Структура репозитория](#структура-репозитория)
- [Типовые задачи](#типовые-задачи)
- [Документация модулей](#документация-модулей)
- [Правила для агентов](#правила-для-агентов)
- [Принципы разработки](#принципы-разработки)

---

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # production-сборка в dist/
npm run preview  # предпросмотр сборки
```

**Требования:** Node.js 18+, npm.

Алиас `@/` → `src/` (настроен в `astro.config.mjs`).

---

## Стек

| Слой | Технология |
|------|------------|
| Framework | [Astro 5](https://astro.build) |
| Контент | MDX + Content Collections (Zod-схема) |
| Стили | CSS custom properties, без UI-фреймворков |
| Интерактив | Vanilla TypeScript islands (`.client.ts`) |
| Навигация | View Transitions API (`astro:transitions`) |
| Типизация | TypeScript, Zod для content schema |

**Зависимости минимальны** — новые пакеты добавлять только при явной необходимости.

---

## Архитектура

Проект разделён на слои с чёткой ответственностью:

```
┌─────────────────────────────────────────────────────────────┐
│  pages/ + layouts/          маршруты, HTML-оболочка           │
├─────────────────────────────────────────────────────────────┤
│  features/home/             сквозная логика главной         │
│  (hover, contact panel, orchestrator, transitions)          │
├─────────────────────────────────────────────────────────────┤
│  widgets/                   бенто-модули (me, git, book…) │
│  components/                dumb UI (layout, cases, atoms)    │
├─────────────────────────────────────────────────────────────┤
│  experience/                звук, вибро, хоткеи, preferences │
├─────────────────────────────────────────────────────────────┤
│  config/ + i18n/ + content/ данные, тексты, кейсы           │
├─────────────────────────────────────────────────────────────┤
│  styles/                    tokens, themes, global, reset     │
└─────────────────────────────────────────────────────────────┘
```

**Оркестратор** — `src/features/home/HomeOrchestrator.client.ts`. Подключается в `BaseLayout`, инициализирует на каждой странице:

- FeedbackBus (звук/вибро по `data-feedback`)
- HotkeysManager
- Contact panel (на layout с `data-contact-layout`)
- Case transitions (морфинг карточки → страница кейса)
- Employer hover (видео при наведении на employer)

Событие `astro:page-load` — точка переинициализации после View Transitions.

---

## Страницы и маршруты

| URL | Файл | Описание |
|-----|------|----------|
| `/` | `src/pages/index.astro` | Главная: виджеты + список кейсов |
| `/cases/[slug]` | `src/pages/cases/[slug].astro` | Детальная страница кейса (MDX) |
| *(404)* | `src/pages/404.astro` | Страница «не найдено» → `404.html` при сборке |

Главная и кейсы используют `BaseLayout` + `Header` + `Grid`. На странице кейса слева остаются те же виджеты (`HomeWidgets` с `transition:persist`), справа — контент кейса.

404 — отдельный минимальный layout: текст и кнопка на главную (`src/features/not-found/`).

`data-page` на `<body>`: `home` | `case` | `not-found` | `default` — влияет на scope хоткеев.

---

## Главная страница

### Header

- **Employer** — «currently at» + ссылка на работодателя (`site.config.ts`), hover с видео-блоком **currently-block** (`EmployerName.astro`). Ролик: `public/images/widgets/currently-block/fantech.mp4`. Подробнее — [`src/components/ui/README.md`](src/components/ui/README.md)
- **LiveClock** — время в часовом поясе из `site.config.location.timezone` (Almaty)

### Левая колонка — виджеты (300px на desktop)

Компоновка в `HomeWidgets.astro` (не через `registry.ts` на главной — registry используется в `WidgetGrid` для альтернативных раскладок):

| Виджет | Размер | Назначение |
|--------|--------|------------|
| **me** | wide | Профиль: аватар, имя, роль, bio, contact |
| **git** | wide | GitHub heatmap |
| **book** | 142×142 | Локальное время — билет с tear-hover |
| **photo** | 142×142 | Фотогалерея со слайдами |
| **bento** | 142× tall | Плитки-ссылки (канал, IES, YouTube) + тултипы |

**Contact panel** — по клику «contact» / «about» виджеты сдвигаются, на их месте появляется `ContactWidget` (LinkedIn, Telegram, email, CV). Состояние сохраняется при навигации на кейс и обратно (`ContactPanelController`).

На mobile (< 640px): только `MeWidget` + `ContactWidget`, остальные виджеты скрыты.

### Правая колонка — кейсы

Список кейсов `CaseList` → группы по `company` (`CaseCompany` / `CaseRow`). Колонки: компания / название / год.

**Строка на home:**

- Компания — ссылка `companyUrl`, wash на hover (`companyWash`)
- Название — по `interaction`: `plain` (текст) / `hover` (currently + wash) / `link` (currently + wash + `/cases/[slug]`)
- Год справа
- Медиа currently-block: `hover.previewVideo` → `hover.previewImage` → employer video

При hover (desktop):

1. Компания — только blur/wash на группу
2. Interactive-кейс — wash + currently-block у курсора (видео с начала при каждом входе)
3. Звук `hoverCard` на кейсе

На mobile и при `prefers-reduced-motion` hover/wash отключены.

**Скролл (desktop):** header и левая колонка виджетов — `sticky`; кейсы прокручиваются вместе со страницей (без внутреннего scroll-контейнера).

Количество кейсов на главной — `casesConfig.homeLimit` (сейчас `6`).

### Dock (планируется)

`ActionDock.astro` + `dock.config.ts` — нижняя панель (email, social, theme, music). Компонент готов, подключение к страницам — по мере вёрстки.

---

## Сетка и адаптив

Спецификация: `.cursor/rules/layout-grid.mdc`, реализация: `components/layout/Grid.astro`.

### Breakpoints

| Зона | Viewport |
|------|----------|
| Mobile | < 640px |
| Tablet | 640px – 1023px (как desktop-сетка) |
| Desktop | ≥ 1024px |

### Desktop

Контент **1248px** по центру:

```
300px (виджеты) + 16px (gap) + 932px (кейсы) = 1248px
```

При сужении viewport виджеты остаются **300px**, кейсы сжимаются (`minmax(0, 1fr)`).

### Mobile

Вертикальный стек, gutter **8px**.

Все размеры — через токены в `src/styles/tokens.css` (`--layout-content-width`, `--layout-widgets-width`, и т.д.). Сырые px в компонентах запрещены.

---

## Виджеты

Модульная система: **1 виджет = 1 папка** в `src/widgets/<id>/`.

### Структура виджета

```
widgets/<id>/
├── README.md
├── config.ts              # grid span, layout, status
├── <Id>Widget.astro
├── <id>.styles.css
├── <id>.animations.css
├── <id>.client.ts         # опционально
└── data/
    ├── <id>.types.ts
    ├── <id>.mock.ts
    ├── <id>.api.ts
    └── <id>.source.ts     # переключатель mock | api
```

### Реестр

`src/widgets/registry.ts` — список виджетов для `WidgetGrid.astro`. Новый виджет регистрируется **только** здесь.

### Статусы виджетов

| ID | Статус | Данные |
|----|--------|--------|
| `me` | mock | `PUBLIC_ME_MODE` |
| `git` | mock | `PUBLIC_GITHUB_MODE` |
| `book` | mock | `PUBLIC_BOOK_MODE` |
| `photo` | mock | `PUBLIC_PHOTO_MODE` |
| `bento` | mock | `PUBLIC_BENTO_MODE` |

Переключение mock/api — `createDataSource()` в `widgets/_shared/createDataSource.ts` + `env.config.ts`.

### Правила виджетов

- Не управляют фоном страницы, кейсами, dock
- Звук/вибро — только через `FeedbackBus.emit()`
- Пользовательский copy — в i18n, mock читает `getMessages()`
- Общая оболочка — `WidgetShell.astro`

---

## Кейсы (контент)

Кейсы — MDX в `src/content/cases/`. Схема — `src/content.config.ts` (Zod).

### Обязательные поля frontmatter

```yaml
title: "Название"
cover: "/images/cases/cover.svg"
order: 1
summary: "Краткое описание"
year: 2025
tags: ["mobile", "fintech"]
company: "alfa-bank"
companyUrl: "https://alfabank.ru/"
companyWash: "#EF3124"          # optional; wash при hover названия компании
interaction: link               # plain | hover | link
hover:
  gradientFrom: "#1a0a2e"
  gradientTo: "#e94560"
  washTint: "#e94560"           # optional; fallback gradientTo
  gradientAngle: 160
  previewImage: "/images/widgets/currently-block/qr_code.jpg"  # optional
  previewVideo: "/images/widgets/currently-block/terminal.mp4"  # optional; приоритет над previewImage
card:
  layout: horizontal   # legacy; на home не используется
  subtitle: "Подзаголовок"                   # optional
  logo: "/images/cases/logo.svg"               # optional
```

Градиенты / wash hex — **только** в frontmatter (исключение из правила design-tokens). Медиа резолвится в `resolveCaseHoverMedia` → `data-hover-*` на списке.

Тело кейса — обычный MDX (заголовки, параграфы, списки).

### Переводы кейсов

Стратегия мультиязычности для MDX **ещё не зафиксирована**. Варианты описаны в `.cursor/rules/i18n.mdc`. Пока — один файл на slug, тексты на русском.

---

## i18n

UI-тексты — в `src/i18n/locales/en.json` и `ru.json`.

```ts
import { getMessages, interpolate } from "./i18n";

const m = getMessages();
interpolate(m.header.employerAriaLabel, { employer: "alfa-bank" });
```

| Секция JSON | Где используется |
|-------------|------------------|
| `meta` | title, description в layout |
| `header` | employer prefix, aria |
| `me`, `contact` | профиль, contact panel |
| `theme` | переключатель темы |
| `bento` | плитки и тултипы |
| `hotkeys` | подписи в help |

Активная локаль — `defaultLocale` в `locale.config.ts` (сейчас `en`). Роутинг `/en/` / `/ru/` — отдельная задача.

**Не переводить:** имена, бренды, employer label, URL — `site.config.ts`.

Подробнее: [`src/i18n/README.md`](src/i18n/README.md).

---

## Конфигурация

| Файл | Содержимое |
|------|------------|
| `src/config/site.config.ts` | Имя, employer (label, url, video), location, social links — см. [`src/config/README.md`](src/config/README.md) |
| `src/config/dock.config.ts` | Элементы ActionDock |
| `src/config/env.config.ts` | Режимы mock/api виджетов (`PUBLIC_*_MODE`) |
| `src/config/cases.config.ts` | `homeLimit`, `cardLogoPlaceholder` — кейсы на главной |

**Один факт — одно место:** email и social URL не дублировать в dock и site — импортировать из `site.config` где возможно.

---

## Дизайн-система

### Токены

Все цвета, spacing, radius, typography, motion, z-index — **только** в `src/styles/tokens.css`.

В компонентах: `var(--token-name)`. Hex/rgb/hsl в `.astro` / `.css` / `.mdx` запрещены (кроме `tokens.css` и градиентов кейсов в frontmatter).

### Темы

Цикл переключения (`THEME_SEQUENCE` в `UserPreferences.ts`):
`chocolate` → `violet` → `clay` → `amber` → `merlot` → `sage` → `graphite` → `soft`.

- `src/styles/themes/graphite.css` — default (`data-theme="graphite"` на `<html>`)
- `src/styles/themes/soft.css` — светлая (Soft Blush)
- Остальные — в `src/styles/themes/*.css` (`light` есть в CSS, но вне цикла toggle)

Меню настроек — `ThemeWidget` в header / на странице кейса: раскрывается **вниз**, тултипы **слева**. Переключение темы — `ThemeToggle` / хоткей `t`. Анимация — `themeTransition.ts`: View Transitions API + `clip-path: circle()` от точки клика; fallback — WAAPI на `.theme-switch-veil`. Без origin или при `prefers-reduced-motion` — мгновенно.

### Z-index (semantic)

| Токен | Слой |
|-------|------|
| `--z-background` | фон страницы |
| `--z-content` | контент |
| `--z-dock` | dock |
| `--z-preview` | preview кейса |
| `--z-employer-backdrop` | blur-оверлей employer hover |
| `--z-employer-focus` | float-текст employer над overlay |
| `--z-employer-block` | видео-блок currently-block (над текстом) |
| `--z-tooltip` | тултипы |

### Шрифты

Comforter — акцентный (preload в `BaseLayout`). Основной — system stack через `--font-family`.

---

## Experience layer

Emotional UX: звук, вибро, хоткеи, motion preferences.

### FeedbackBus

```ts
import { feedback } from "./experience/feedback/FeedbackBus";

feedback.emit({ sound: "tap", haptic: "light", source: "dock.email" });
```

- Звуки: `public/audio/` + `sounds.config.ts` (`tap`, `hoverSoft`, `pageTransition`)
- Вибро: `haptics.config.ts`
- **Запрещено** вызывать `new Audio()` / `navigator.vibrate()` напрямую в виджетах
- Autoplay — только после первого user gesture (`feedback.unlock()`)
- Hover-звук debounced (300ms)

Элементы с `data-feedback="tap"` получают feedback автоматически через оркестратор.

### Хоткеи

Регистрация — `src/experience/hotkeys/hotkeys.config.ts`. Слушатель — один `HotkeysManager`.

| Клавиша | Действие | Scope |
|---------|----------|-------|
| `m` | вкл/выкл звук | global |
| `t` | сменить тему | global |
| `?` | показать shortcuts | global |
| `k` | фокус на кейсы | home |
| `c` | contact | home |
| `a` | about | home |
| `b` | на главную | home |

Тексты — в `i18n` (`hotkeys.*`), в config только `messageKey`.

### UserPreferences

`localStorage`: sound on/off, haptics on/off, theme. Уважает `prefers-reduced-motion`.

Подробнее: [`src/experience/README.md`](src/experience/README.md).

---

## Навигация и переходы

- **View Transitions** — `astro:transitions` в `BaseLayout`, стили в `features/transitions/view-transitions.css`
- **Case transition** — морфинг обложки карточки в hero кейса (`CaseTransitionController`)
- **Persist widgets** — `transition:persist={`home-widgets-${locale}`}` на `HomeWidgets` — виджеты не перерисовываются при переходе home ↔ case в рамках одной локали; смена языка подставляет другой persist-ключ и обновляет тексты
- **Contact state** — сохраняется при навигации между home и case

При входе на страницу кейса — звук `pageTransition`.

---

## Переменные окружения

Все с префиксом `PUBLIC_` (доступны на клиенте):

| Переменная | Значения | Виджет |
|------------|----------|--------|
| `PUBLIC_ME_MODE` | `mock` \| `api` | me |
| `PUBLIC_GITHUB_MODE` | `mock` \| `api` | git |
| `PUBLIC_BOOK_MODE` | `mock` \| `api` | book |
| `PUBLIC_PHOTO_MODE` | `mock` \| `api` | photo |
| `PUBLIC_BENTO_MODE` | `mock` \| `api` | bento |
| `PUBLIC_CASES_SHOW_LIVE` | `true` \| `false` | кейсы с `visibility: live` (default: скрыты) |

По умолчанию виджеты — `mock`, live-кейсы выключены. Задать в `.env` в корне (файл не коммитится).

Пример:

```env
PUBLIC_GITHUB_MODE=api
PUBLIC_CASES_SHOW_LIVE=true
```

---

## Структура репозитория

```
kurguzov/
├── .cursor/rules/          # правила для AI-агентов (mdc)
├── public/
│   ├── audio/              # UI-звуки (tap, hover, transition)
│   ├── fonts/
│   └── images/             # обложки, виджеты, кейсы
├── src/
│   ├── components/
│   │   ├── layout/         # Grid, Header, PageShell, WidgetGrid
│   │   ├── cases/          # CaseList, CaseCompany, CaseRow, CaseHero
│   │   └── ui/             # атомы: Tooltip, ThemeToggle, LiveClock…
│   ├── config/             # site, dock, env, cases
│   ├── content/cases/      # MDX-кейсы
│   ├── experience/         # feedback, audio, hotkeys, motion, preferences
│   ├── features/
│   │   ├── home/           # hover, contact, dock, orchestrator, background
│   │   └── transitions/    # view transition styles
│   ├── i18n/               # en/ru каталоги, getMessages()
│   ├── layouts/            # BaseLayout
│   ├── pages/              # index, cases/[slug]
│   ├── styles/             # tokens, themes, global, reset, typography
│   └── widgets/            # me, git, book, photo, bento + registry
├── AGENTS.md               # краткий индекс для AI
├── astro.config.mjs
├── content.config.ts       # Zod-схема кейсов
└── package.json
```

---

## Типовые задачи

| Задача | Куда идти |
|--------|-----------|
| Новый виджет | `src/widgets/<id>/` → `registry.ts` |
| Новый кейс | `src/content/cases/<slug>.mdx` |
| UI-текст | `src/i18n/locales/en.json` + `ru.json` |
| Токен / тема | `src/styles/tokens.css`, `themes/` |
| Site metadata | `src/config/site.config.ts` |
| Hover кейса | frontmatter `hover.*` + `features/home/case-hover/` |
| Звук / вибро | `experience/feedback/FeedbackBus.ts` |
| Хоткей | `hotkeys.config.ts` + i18n `hotkeys.*` |
| Mock → API | `widgets/<id>/data/*.api.ts` + `PUBLIC_*_MODE` |
| Сетка главной | `Grid.astro` + `layout-grid.mdc` |

---

## Документация модулей

| Модуль | README |
|--------|--------|
| i18n | [`src/i18n/README.md`](src/i18n/README.md) |
| UI (Tooltip и др.) | [`src/components/ui/README.md`](src/components/ui/README.md) |
| Виджеты | [`src/widgets/README.md`](src/widgets/README.md) |
| Experience layer | [`src/experience/README.md`](src/experience/README.md) |
| Главная (hover, dock) | [`src/features/home/README.md`](src/features/home/README.md) |
| Виджеты по отдельности | `src/widgets/{me,git,book,photo,bento}/README.md` |

---

## Правила для агентов

[`AGENTS.md`](AGENTS.md) — индекс задач и ссылок.

Детальные ограничения — [`.cursor/rules/`](.cursor/rules/):

| Rule | Область |
|------|---------|
| `project-overview.mdc` | всегда |
| `design-tokens.mdc` | цвета, spacing, motion |
| `emotional-design.mdc` | FeedbackBus, хоткеи, motion |
| `i18n.mdc` | тексты и переводы |
| `layout-grid.mdc` | сетка главной |
| `widget-modules.mdc` | `src/widgets/**` |
| `component-structure.mdc` | `src/components/**` |
| `home-interactions.mdc` | `src/features/home/**` |
| `content-cases.mdc` | `src/content/**` |
| `layouts-pages.mdc` | layouts, pages |
| `project-config.mdc` | config |

---

## Принципы разработки

1. **Минимум зависимостей** — vanilla TS/CSS там, где достаточно
2. **Один факт — одно место** — не дублировать rules, URL, тексты
3. **Dumb UI** — компоненты без fetch и side effects; логика в features/experience
4. **Токены, не hex** — дизайн через `tokens.css`
5. **Emotional UX** — feedback только через FeedbackBus
6. **Уважать accessibility** — `prefers-reduced-motion`, aria-labels из i18n, keyboard для тултипов
7. **Модульность виджетов** — mock/api через source, регистрация в registry

---

## Лицензия и контакты

© krgzv.com 2026 · Vladislav Kurguzov

Контакты — в `site.config.ts` (email, LinkedIn, Telegram, X).
