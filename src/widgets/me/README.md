# Me Widget

Профиль: аватар, имя, роль, bio, contact me. Клик по карточке — горизонтальный flip на оборотную сторону. На обороте — локальное время (`LiveClock`).

## UX-сценарии

- Click по карточке: flip можно спамить — каждый клик крутит в другую сторону (±180°); say hi на обеих сторонах
- Click say hi / vibe check: не триггерит flip — открывает contact panel (и во время flip)
- Во время flip: кнопка кликабельна; hover/bubble подавлены (`data-me-flipping` + `data-feedback-hover="off"`), после flip hover восстанавливается один раз если курсор на кнопке
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
| `MeWidget.astro` | Front/back faces (ContactButton на каждой) |
| `me.client.ts` | Накопление `rotateY`, чередование направления, `data-me-flipping`, `inert`, feedback |
| `me.styles.css` | `perspective` + `rotateY`, reduced motion |

Токены: `--motion-me-flip`, `--ease-me-flip`, `--perspective-me-flip`.

### Контракт во время анимации

1. `data-me-flipping` на корне → `data-feedback-hover="off"` (без bubble thrash) + z-index виджетов в `home.layout.css`
2. Обе стороны без `inert` mid-flip (`backface-visibility` решает hit-test); `inert` / `aria-hidden` — только после `transitionend` / fallback-таймера
3. Click по `[data-contact-button]` не крутит карточку; панель открывается и во время flip
4. Hover fill: `resetContactButton` на старте, enter/leave игнор при `[data-me-flipping]`, `resumeContactButtonHover` после flip
