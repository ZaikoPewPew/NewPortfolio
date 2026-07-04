# Project Config

Единый источник метаданных сайта, dock и режимов виджетов.

## Файлы

| Файл | Содержимое |
|------|------------|
| `site.config.ts` | Имя, employer, location, social links |
| `dock.config.ts` | Элементы ActionDock (email, social, theme, music) |
| `env.config.ts` | Режимы mock/api виджетов (`PUBLIC_*_MODE`: `book`, `github`, `photo`, `bento`, `me`) |
| `cases.config.ts` | `homeLimit`, `cardLogoPlaceholder` — кейсы на главной |

### `cases.config.ts`

| Поле | Описание |
|------|----------|
| `homeLimit` | Сколько кейсов показывать на `/` (по `order`; `undefined` — все) |
| `cardLogoPlaceholder` | URL лого на карточке, пока нет `card.logo` в frontmatter |

## `site.config.ts`

### `employer`

| Поле | Тип | Описание |
|------|-----|----------|
| `label` | string | Имя работодателя в хедере (не переводится — proper noun) |
| `url` | string | Ссылка при клике на employer |
| `video` | string | Публичный путь к ролику для hover-блока (`currently-block`) |

Видео лежит в `public/images/widgets/currently-block/`. Текущий ролик: `fantech.mp4`. Ассеты и требования — [`public/images/widgets/currently-block/README.md`](../../public/images/widgets/currently-block/README.md).

### `location`

Город и IANA timezone для `LiveClock` в хедере.

### `social`

URL профилей и контактов. Email и social не дублировать в `dock.config.ts` — импортировать из `site.config` где возможно.

## Правила

- Site metadata и social — только здесь, не хардкодить в компонентах
- Dock items — только в `dock.config.ts`
- Переключение mock/api — через `env.config.ts` + `widgets/*/data/*.source.ts`
- Employer label, бренды, URL — **не** в i18n (см. `i18n.mdc`)
