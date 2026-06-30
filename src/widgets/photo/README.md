# Photo Widget

Статус: **mock**

## Назначение

Компактная фотогалерея 142×142 — слайды на фоне, индикатор прогресса внизу.

## Данные

- mock: `data/photo.mock.ts` (5 SVG-заготовок в `public/images/widgets/`)
- api: `data/photo.api.ts` (planned)
- Переключатель: `PUBLIC_PHOTO_MODE=mock|api`

## UX

- Автопрокрутка слайдов (~5 с) и анимация прогресс-бара
- Drag мышью / свайп для переключения
- `prefers-reduced-motion` отключает автоплей
