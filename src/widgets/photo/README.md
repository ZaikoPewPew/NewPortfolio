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
- Видео: играет целиком (`muted` / `playsinline`), прогресс и переход — от `currentTime` / `duration`
- Drag мышью / свайп для переключения
- `prefers-reduced-motion` отключает автоплей и автопрокрутку
- Пауза вне вкладки / viewport; при возврате — restart активного слайда
- Media sync после slide-transform (650 ms), чтобы индикатор не замирал на переходе
- Неактивные видео только `pause()`, без `currentTime = 0` (seek + transform ломает декодер)
- Клоны infinite-loop — `preload="none"`, без `src`
- На треке нет постоянного `will-change` (только на drag)
- Видео — собственный композитный слой (`translateZ(0)`), иначе Chrome замирает на кадре 0 внутри `translateX` трека
- При повторном показе видео сбрасывается `currentTime` (иначе ended-слайд сразу скипается)
- Слушатели снимаются при повторной инициализации (View Transitions)
