# Photo Widget

Статус: **mock**

## Назначение

Компактная медиа-галерея 142×142 — слайды с фото/короткими видео и индикатор прогресса внизу.

## Данные

- mock: `data/photo.mock.ts` (файлы из `public/images/widgets/photo-gallery`, поддержка image + video)
- api: `data/photo.api.ts` (planned)
- Переключатель: `PUBLIC_PHOTO_MODE=mock|api`

## UX

- Фото: автопрокрутка (~5 с) и прогресс-бар
- Видео: играет целиком (`muted` / `playsinline`), прогресс от `currentTime/duration`, переход по `ended`
- Drag мышью / свайп для переключения
- `prefers-reduced-motion` отключает автоплей
- После возврата на вкладку видео возобновляется; скачки rAF не перелистывают галерею
