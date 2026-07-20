# Profile Menu

Fixed-панель профиля на главной (desktop): зеркало ThemeWidget слева. Shell с аватаром разворачивается в карточку me-widget; bento прилетает снизу. Кейсы всегда по центру viewport.

## Файлы

| Файл | Роль |
|------|------|
| `ProfileMenu.astro` | Разметка: shell (avatar + identity + bio + ContactButton) + bento (`data-contact-layout`) |
| `profile-menu.css` | Fixed позиция, expand/collapse, каскад open/close, центрирование cases |
| `profile-menu.client.ts` | Toggle, Escape, settle-таймеры, `ensureProfileMenuOpenForContact()` |
| `profile-menu.storage.ts` | sessionStorage `profile-menu-open` |

Монтируется в `HomePage` в slot `widgets`. На case page по-прежнему `HomeWidgets` + `MeWidget`.

## Состояния

| Атрибут | Где | Значение |
|---------|-----|----------|
| `data-profile-open` | `[data-home-page]` | `"true"` / `"false"` |
| `data-open` | `[data-profile-menu]` | наличие присутствует, когда открыт |
| `data-profile-animating` | `[data-home-page]` | `"opening"` / `"closing"` на время каскада |
| `data-profile-settled` | `[data-home-page]` | после завершения анимации |

FOUC: inline-скрипт в `ProfileMenu.astro` читает `profile-menu-open` и `contact-panel-open` до paint. Если контакты открыты — профиль тоже открывается.

## Open / close (desktop)

Каскад открытия (`data-profile-animating="opening"`):

1. Shell расширяется (64 → 300)
2. Имя / роль
3. Bio
4. ContactButton (say hi)
5. Git → book / photo+youtube / bento-links снизу

Закрытие быстрее (`CLOSE_SETTLE_MS`): shell и bento сжимаются сразу; bento уходит через opacity контейнера (без transform на детях — не конфликтует с contact-panel).

`prefers-reduced-motion` — мгновенно, без keyframes.

## Bento layout (desktop)

Правая колонка виджетов в профиле:

| Колонка | Сверху | Снизу |
|---------|--------|-------|
| Слева | Book | `BentoWidget section="links"` (mychannel + ies) |
| Справа | Photo | `BentoWidget section="youtube"` (wide) |

Тултипы всех трёх плиток — `placement: "bottom"`. Детали — [`src/widgets/bento/README.md`](../../../widgets/bento/README.md).

## Contact panel

- Перед swipe `ContactPanelController` вызывает `ensureProfileMenuOpenForContact()` — профиль гарантированно открыт.
- При стабильном `data-contact-open="true"` default-bento скрыт (`visibility: hidden`), чтобы не мелькал под contact-slot при повторном раскрытии профиля.
- Во время `data-contact-animating` скрытие не применяется — работает обычный swipe.

Детали contact: [`../README.md`](../README.md) § Contact panel.

## Layout

- Fixed: `top/left: --space-md` (16px), `z-index: --z-dock`
- `grid__widgets` в потоке 0×0, overflow visible (fixed-потомок рисуется)
- Cases: `max-width: --layout-case-reading-width`, `margin-inline: auto`
- Copyright на home: fixed `left/bottom: --space-md` (viewport, не контент-бокс)

## Mobile

ProfileMenu в потоке сетки; shell всегда «открыт» как me-widget; bio/кнопка скрыты; contact — `home__contact-mobile`. Trigger не кликабелен.

## i18n

Ключи `profileMenu.*` в `en.json` / `ru.json` (aria open/close).
