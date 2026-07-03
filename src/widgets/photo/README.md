# Photo Widget

Статус: **mock**

## Назначение

Компактная медиа-галерея 142×142 — слайды с фото/короткими видео и индикатор прогресса внизу.

## Данные

- mock: `data/photo.mock.ts` (файлы из `public/images/widgets/photo-gallery`, поддержка image + video)
- api: `data/photo.api.ts` (planned)
- Переключатель: `PUBLIC_PHOTO_MODE=mock|api`

## UX

- Автопрокрутка слайдов (~5 с) и анимация прогресс-бара
- Drag мышью / свайп для переключения
- `prefers-reduced-motion` отключает автоплей
- Видео в слайдах всегда `muted` и с `volume=0`
