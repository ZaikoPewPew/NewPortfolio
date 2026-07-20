# Case Hover — currently-block + wash на списке кейсов

Интерактив на главной: **blur/wash** на блок компании; **currently-block** только у interactive-кейсов (`hover` / `link`). Системный курсор не меняется (кроме кликабельных ссылок).

## Файлы

| Файл | Назначение |
|------|------------|
| `CaseHoverController.client.ts` | Слушатели pointer, focus компании, wash, currently |
| `caseFocus.client.ts` | currently-block: активация с `restart: true` |
| `case-focus.css` | Импорт employer/wash стилей (размер блока — в `currently-block.css`) |

Инициализация — `initCaseHover()` из `HomeOrchestrator.client.ts`. Сброс — `resetCaseHover()`.

Hit-test на каждом `pointermove` (`elementFromPoint`): после выхода из bbox в gap между строками currently снова включается, как только курсор над следующим `[data-case-card]` — даже если `pointerover` не пришёл.

## Поток hover

### Компания (`[data-case-company-link]`)

1. Wash tint из `data-wash-color` (`companyWash` в frontmatter) или fallback `case`
2. currently-block при наличии медиа (`companyVideo` / `companyImage` / fallback `employer.video` для `alfa-bank`)
3. Звук `hoverEmployer`; видео без restart (как employer)
4. Выход — за bounding-box ссылки компании

### Кейс (`[data-case-card]`, interaction `hover` \| `link`)

1. Wash из `data-wash-color` (`hover.washTint` → иначе `hover.gradientTo` → иначе `case`)
2. currently-block с медиа с начала + звук `hoverCard`
3. `html.is-case-active` — флаг hover кейса (размер блока всегда case-scale, см. `currently-block.css`)
4. Выход — за bounding-box заголовка кейса

## Стейты строки (`interaction`)

| Значение | UI | currently + wash | Навигация |
|----------|-----|------------------|-----------|
| `plain` | текст | нет | нет |
| `hover` | dashed псевдоссылка | да | нет |
| `link` | dashed псевдоссылка | да | `/cases/[slug]` |

Компания: wash + currently-block при наличии медиа (см. ниже).

## currently-block медиа (компания)

| Frontmatter | `data-*` | Поведение |
|-------------|---------|-----------|
| `companyVideo` | `data-hover-video` | Ролик без restart |
| `companyImage` (без видео) | `data-hover-image` | Статика |
| `company === siteConfig.employer.label` | `data-hover-video` | `employer.video` (fantech) |

## currently-block медиа (кейсы)

| Frontmatter | `data-*` | Поведение |
|-------------|---------|-----------|
| `hover.previewVideo` | `data-hover-video` | Ролик с `restart: true` |
| `hover.previewImage` (без видео) | `data-hover-image` | Статика |
| ничего | employer.video | Fallback |

## Data-атрибуты / классы

| Атрибут / класс | Где | Роль |
|-----------------|-----|------|
| `data-case-company` | секция группы | Контейнер focus |
| `data-case-company-link` | ссылка компании | Хост wash + currently |
| `data-case-card` | заголовок кейса | Хост currently |
| `data-hover-video` / `data-hover-image` | компания / кейс | Медиа |
| `is-focused` | компания | Выше blur |
| `is-case-active` | `html`, home | Флаг hover кейса |
| `is-focus-wash-active` | `html` | Backdrop + wash |

## Ограничения

- Desktop only: mobile и `prefers-reduced-motion` отключают wash и currently
