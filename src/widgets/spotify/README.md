# Spotify Widget

Статус: **mock**

## Назначение

Компактный виджет «сейчас играет» — обложка трека, название, исполнитель и контролы prev/play/next.

## Данные

- mock: `data/spotify.mock.ts`
- api: Spotify Web API via `data/spotify.api.ts`
- Переключатель: `PUBLIC_SPOTIFY_MODE=mock|api`

## UX

- Hover: зелёный inset-shadow и логотип Spotify `#1ED760`
- Кнопки управления — tap feedback через `FeedbackBus`
