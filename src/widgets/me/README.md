# Me Widget

Профиль: аватар, имя, роль, bio, contact me, переключатель темы.

## UX-сценарии

- Hover: лёгкий scale аватара
- Click theme toggle: смена темы + feedback tap
- Click contact me: mailto + feedback tap
- Hotkey `c`: открыть contact (desktop)

## Данные

- mock: `data/me.mock.ts` — role, bio из `getMessages().me`
- api: (planned) CMS или static JSON
- Статус: **mock**
- i18n-ключи: `me.*`, `contact.*` — см. [`src/i18n/README.md`](../../i18n/README.md)

## Адаптив

- Desktop: 300×179px, полный контент
- Mobile: на всю ширину, скрыты bio и кнопка contact me

## Hotkeys

- `c` — contact me (home)
