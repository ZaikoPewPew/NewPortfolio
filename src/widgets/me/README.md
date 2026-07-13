# Me Widget

Профиль: аватар, имя, роль, bio, contact me. Клик по карточке (или кнопке swap) — горизонтальный flip на оборотную сторону. Контент оборота — TBD.

## UX-сценарии

- Click по карточке: flip `rotateY` (лево↔право); say hi и swap на обеих сторонах и крутятся вместе с карточкой
- Click say hi / vibe check: не триггерит flip — открывает contact panel
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

## Flip

| Файл | Назначение |
|------|------------|
| `MeWidget.astro` | Front/back faces (swap + ContactButton на каждой) |
| `me.client.ts` | Toggle `data-me-flipped`, `inert` на скрытой стороне, feedback |
| `me.styles.css` | `perspective` + `rotateY`, reduced motion |

Токены: `--motion-me-flip`, `--ease-me-flip`, `--perspective-me-flip`.
