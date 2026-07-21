# Profile Menu

Fixed-панель профиля на главной (desktop): зеркало ThemeWidget слева. Shell с аватаром разворачивается в карточку me-widget; bento прилетает снизу. Кейсы всегда по центру viewport.

## Файлы

| Файл | Роль |
|------|------|
| `ProfileMenu.astro` | Разметка: shell (avatar + identity + bio + ContactButton) + bento (`data-contact-layout`) |
| `profile-menu.css` | Fixed позиция, expand/collapse, каскад open/close, центрирование cases |
| `profile-menu.client.ts` | Toggle, Escape, settle-таймеры, `ensureProfileMenuOpenForContact()` |
| `profile-menu.storage.ts` | sessionStorage `profile-menu-open` |

Монтируется в `HomePage` и `CasePage` в slot `widgets` (один `transition:persist`).

## Состояния

| Атрибут | Где | Значение |
|---------|-----|----------|
| `data-profile-open` | `[data-home-page]` / `[data-case-page]` | `"true"` / `"false"` |
| `data-open` | `[data-profile-menu]` | наличие присутствует, когда открыт |
| `data-profile-animating` | host (`main.home`) | `"opening"` / `"closing"` на время каскада |
| `data-profile-settled` | host (`main.home`) | после завершения анимации |

FOUC: inline-скрипт в `ProfileMenu.astro` читает `profile-menu-open` и `contact-panel-open` до paint. Состояния независимы: открытость профиля определяется только `profile-menu-open`, а `contact-panel-open` — только какое суб-состояние (say hi / vibe check) показать внутри bento.

## Open / close (desktop)

Каскад открытия (`data-profile-animating="opening"`):

1. Shell расширяется (64 → 300)
2. Имя / роль
3. Bio
4. ContactButton (по умолчанию режим «about» → vibe check, т.к. say hi показан)
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

- **Дефолт — контакты (say hi):** `DEFAULT_CONTACT_PANEL_OPEN = true`, markup `data-contact-open="true"`, `ContactButton mode="about"`. При первом раскрытии профиля виден say hi; кнопка переключает на vibe check.
- Перед swipe `ContactPanelController` вызывает `ensureProfileMenuOpenForContact()` — профиль гарантированно открыт.
- При стабильном `data-contact-open="true"` default-bento скрыт (`visibility: hidden`), чтобы не мелькал под contact-slot при повторном раскрытии профиля.
- Во время `data-contact-animating` скрытие не применяется — работает обычный swipe.

Детали contact: [`../README.md`](../README.md) § Contact panel.

## Layout

- Fixed: `top/left: --space-md` (16px), `z-index: --z-dock`
- `grid__widgets` в потоке 0×0, overflow visible (fixed-потомок рисуется)
- Cases (home + case page): `max-width: --layout-case-reading-width`, `margin-inline: auto`
- Copyright на home: fixed `left/bottom: --space-md` (viewport, не контент-бокс)

## Mobile

ProfileMenu в потоке сетки на home; shell всегда «открыт» как me-widget; bio/кнопка скрыты; contact — `home__contact-mobile`. Trigger не кликабелен. На case page колонка виджетов скрыта.

## i18n

Ключи `profileMenu.*` в `en.json` / `ru.json` (aria open/close).
