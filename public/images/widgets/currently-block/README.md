# Currently Block — видео для employer hover

Ассеты для **currently-block**: плавающий виджет с видео при наведении на имя работодателя в хедере (`alfa-bank`).

## Файлы

| Файл | Назначение |
|------|------------|
| `fantech.mp4` | Основной ролик (без звука, loop при hover) |
| `.gitkeep` | Сохраняет папку в git, если видео ещё не добавлено |

## Конфигурация

Путь к ролику задаётся в **`src/config/site.config.ts`** → `employer.video`:

```ts
employer: {
  label: "alfa-bank",
  url: "https://alfabank.ru/",
  video: "/images/widgets/currently-block/fantech.mp4",
},
```

Компонент `EmployerName.astro` пробрасывает путь в `data-employer-video`; клиент `employerName.client.ts` создаёт `<video>` при инициализации портала.

## Требования к ролику

- **Формат:** MP4 (H.264), предпочтительно без звуковой дорожки
- **Поведение:** `muted`, `loop`, `playsInline` — выставляются в JS
- **Размер кадра:** ориентир 297×152 px (внутренняя область `--currently-block-inner-width/height`); `object-fit: cover` обрежет лишнее
- **Вес:** держать файл компактным — грузится при первом hover (`preload="metadata"`)

Если `employer.video` пустой или файл отсутствует, блок показывает placeholder-фон (`--color-bg-elevated`) без `<video>`.

## Связанные файлы

| Путь | Роль |
|------|------|
| `src/components/ui/EmployerName.astro` | Разметка ссылки на работодателя |
| `src/components/ui/employerName.client.ts` | Портал, физика, видео |
| `src/components/ui/employer-name.css` | Стили overlay, float, currently-block |
| `src/styles/tokens.css` | Размеры блока, blur, spring-токены, z-index |
| `src/features/home/HomeOrchestrator.client.ts` | `initEmployerName()` / `resetEmployerName()` |

Подробнее о поведении и слоях — [`src/components/ui/README.md`](../../../src/components/ui/README.md) (секция Employer hover).

## Замена ролика

1. Положить новый файл в эту папку (`public/images/widgets/currently-block/`).
2. Обновить `employer.video` в `site.config.ts`.
3. Удалить старый файл из репозитория, если он больше не нужен.
4. Обновить эту таблицу «Файлы», если меняется имя основного ролика.
