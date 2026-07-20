# Me Widget

Профиль: аватар, имя, роль, bio, contact me. Карточка статичная (без flip).

На **home / case desktop** тот же контент живёт в [`ProfileMenu`](../../features/home/profile-menu/README.md) (shell expand). `MeWidget` остаётся для legacy `HomeWidgets` и как reference-компонент; mobile-поток — через ProfileMenu.

## UX-сценарии

- Click say hi / vibe check: открывает contact panel
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
