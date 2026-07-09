# Currently Block — медиа-ассеты

Ассеты для **currently-block**: плавающий виджет с видео или изображением при hover (employer в хедере и карточки кейсов на главной).

## Файлы

| Файл | Назначение |
|------|------------|
| `fantech.mp4` | Employer hover (`siteConfig.employer.video`) |
| `terminal.mp4` | Кейс project-beta — `hover.previewVideo` |
| `lk_portal_s3.mp4` | Кейс project-gamma — `hover.previewVideo` |
| `qr_code.jpg` | Кейс project-delta — `hover.previewImage` (без видео) |
| `.gitkeep` | Сохраняет папку в git, если ассеты ещё не добавлены |

## Конфигурация

**Employer** — путь в `src/config/site.config.ts` → `employer.video`:

```ts
employer: {
  label: "alfa-bank",
  url: "https://alfabank.ru/",
  video: "/images/widgets/currently-block/fantech.mp4",
},
```

`EmployerName.astro` → `data-employer-video` → `employerName.client.ts` / общий `CurrentlyBlockController`.

**Кейсы** — в frontmatter MDX (`hover.previewVideo` и/или `hover.previewImage`). На карточке: `data-hover-video`, `data-hover-image` (`CaseCard.astro`). При каждом входе курсора на плитку видео стартует с нуля (`restart: true` в `caseFocus.client.ts`).

### Приоритет медиа на карточке

1. **`previewVideo`** — ролик в currently-block (если задан, `previewImage` игнорируется)
2. **`previewImage`** — статичное изображение (только если видео нет; путь обычно в этой папке)
3. **Fallback** — `siteConfig.employer.video` (если нет ни видео, ни картинки)

Примеры:

```yaml
# Видео (project-beta, project-gamma)
hover:
  previewVideo: "/images/widgets/currently-block/terminal.mp4"

# Статичное изображение (project-delta)
hover:
  previewImage: "/images/widgets/currently-block/qr_code.jpg"
```

## Требования к ассетам

### Видео (MP4)

- **Формат:** MP4 (H.264), предпочтительно без звуковой дорожки
- **Поведение:** `muted`, `loop`, `playsInline` — выставляются в JS
- **Размер кадра:** ориентир по `--currently-block-inner-width/height`; для кейсов блок крупнее (`--currently-block-case-*`); `object-fit: cover`
- **Вес:** держать компактным — `preload="metadata"`

### Изображения (JPG / PNG / WebP)

- **Размер кадра:** тот же ориентир, что у видео; `object-fit: cover`
- **Вес:** сжимать под web; для hover достаточно ~500–800 KB

Если URL пустой или файл отсутствует, блок показывает placeholder-фон (`--color-bg-elevated`).

## Связанные файлы

| Путь | Роль |
|------|------|
| `src/components/ui/currentlyBlock.client.ts` | Shared DOM, физика, видео + изображение, `restart` |
| `src/components/ui/currently-block.css` | Liquid-glass рамка, `.currently-block__video` / `__image` |
| `src/components/ui/EmployerName.astro` | Хост employer |
| `src/features/home/case-hover/` | Hover карточек кейсов |
| `src/styles/tokens.css` | Размеры блока, case-scale, z-index |

Подробнее: [`src/components/ui/README.md`](../../../src/components/ui/README.md), [`src/features/home/case-hover/README.md`](../../../src/features/home/case-hover/README.md).

## Замена ассета

1. Положить файл в эту папку.
2. Employer: обновить `employer.video` в `site.config.ts`. Кейс: `hover.previewVideo` или `hover.previewImage` в MDX.
3. Удалить старый файл, если он больше не нужен.
4. Обновить таблицу «Файлы» выше.
