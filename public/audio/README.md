# UI Sounds

- `tap_new.mp3` — нажатие кнопок и ссылок (`data-feedback="tap"`)
- `hover_new.mp3` — hover (debounced, `data-feedback="tap hover"`)
- `swipe_new.mp3` — переключение say hi / vibe check (contact panel)

Пути заданы в `src/experience/feedback/sounds.config.ts`.

Если файлов нет, `AudioEngine` молча пропускает воспроизведение.
