# Currently Block — видео-ассеты

Ассеты для **currently-block**: плавающий виджет с видео при hover (employer в хедере и карточки кейсов на главной).

## Файлы

| Файл | Назначение |
|------|------------|
| `fantech.mp4` | Employer hover (`siteConfig.employer.video`) |
| `terminal.mp4` | Пример per-case ролика (`hover.previewVideo` в MDX) |
| `.gitkeep` | Сохраняет папку в git, если видео ещё не добавлены |

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

**Кейсы** — optional `hover.previewVideo` в frontmatter MDX; fallback — тот же `employer.video`. На карточке: `data-hover-video` (`CaseCard.astro`). При каждом входе курсора на плитку видео стартует с нуля (`restart: true` в `caseFocus.client.ts`).

## Требования к ролику

- **Формат:** MP4 (H.264), предпочтительно без звуковой дорожки
- **Поведение:** `muted`, `loop`, `playsInline` — выставляются в JS
- **Размер кадра:** ориентир по `--currently-block-inner-width/height`; для кейсов блок крупнее (`--currently-block-case-*`); `object-fit: cover`
- **Вес:** держать компактным — `preload="metadata"`

Если URL пустой или файл отсутствует, блок показывает placeholder-фон (`--color-bg-elevated`) без `<video>`.

## Связанные файлы

| Путь | Роль |
|------|------|
| `src/components/ui/currentlyBlock.client.ts` | Shared DOM, физика, `restart` |
| `src/components/ui/EmployerName.astro` | Хост employer |
| `src/features/home/case-hover/` | Hover карточек кейсов |
| `src/styles/tokens.css` | Размеры блока, case-scale, z-index |

Подробнее: [`src/components/ui/README.md`](../../../src/components/ui/README.md), [`src/features/home/case-hover/README.md`](../../../src/features/home/case-hover/README.md).

## Замена ролика

1. Положить файл в эту папку.
2. Employer: обновить `employer.video` в `site.config.ts`. Кейс: `hover.previewVideo` в MDX.
3. Удалить старый файл, если он больше не нужен.
4. Обновить таблицу «Файлы» выше.
