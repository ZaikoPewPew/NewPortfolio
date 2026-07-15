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
- Видео: играет целиком (`muted` / `playsinline`), прогресс и переход — единый tick (50 ms)
- Drag мышью / свайп для переключения
- `prefers-reduced-motion` отключает автоплей и автопрокрутку
- Пауза вне вкладки / viewport; при возврате — restart активного слайда
- `play()` только после окончания slide-transform (650 ms) — иначе Chrome рисует первый кадр
- Неактивные видео только `pause()`, без `currentTime = 0` (seek + transform ломает декодер)
- Клоны infinite-loop — `preload="none"`, без `src`
- На треке нет постоянного `will-change` (только на drag)
