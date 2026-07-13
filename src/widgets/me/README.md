# Me Widget

Профиль: аватар, имя, роль, bio, contact me. Кнопка справа в шапке — placeholder под будущий функционал (тема переехала в ThemeWidget в хедере).

## UX-сценарии

- Hover: лёгкий scale аватара
- Click contact button (desktop): toggle contact panel + swipe; hover — clip-path fill + bubble
- Hotkey `h` / `c`: toggle contact panel (desktop)

## Данные

- mock: `data/me.mock.ts` — role, bio из `getMessages().me`
- api: (planned) CMS или static JSON
- Статус: **mock**
- i18n-ключи: `me.*`, `contact.*` — см. [`src/i18n/README.md`](../../i18n/README.md)

## Адаптив

- Desktop: 300×179px, полный контент
- Mobile: на всю ширину, скрыты bio и кнопка contact me

## Hotkeys

- `h` — say hi / toggle contact panel (home)
- `c` — vibe check / toggle contact panel (home)

Contact button: см. [`ContactButton`](../../components/ui/ContactButton.astro) и [`components/ui/README.md`](../../components/ui/README.md).
