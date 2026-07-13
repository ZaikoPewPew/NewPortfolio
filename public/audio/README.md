# UI Sounds

- `tap_new.mp3` — нажатие кнопок и ссылок (`data-feedback="tap"`)
- `hover_new.mp3` — hover (debounced, `data-feedback="tap hover"`)
- `8bit_hover_new.mp3` — hover на employer name (currently at)
- `paper_new.mp3` — hover на book widget (currently reading)
- `buble_hover_new.mp3` — hover на contact button (say hi / vibe check)
- `swipe_new.mp3` — переключение say hi / vibe check (contact panel)
- `flip.mp3` — переворот MeWidget (profile card)

Пути заданы в `src/experience/feedback/sounds.config.ts`.

Если файлов нет, `AudioEngine` молча пропускает воспроизведение.
