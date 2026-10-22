# Project Ibadur Rahman — Dayr Jamal

Donation landing page for rebuilding the Ibadur Rahman Masjid in Dayr Jamal, Northern Syria ($104,000 USD goal, before Ramadan).

Live: https://samisayyed1.github.io/ibadur-rahman-masjid/

## Edit the live settings

All settings are at the top of `js/main.js` in `CONFIG`:

| Key | What it does |
| --- | --- |
| `donateUrl` | Your checkout link. While empty, every Donate button scrolls to the giving section. |
| `amountParam` | Query parameter used to pre-fill the chosen amount on the checkout link. |
| `raised` | Amount raised so far in USD. `null` hides the progress bar. |
| `ramadan` | First night of Ramadan (est. 7 Feb 2027, 18:00 Syria time). The countdown is computed live from this. |

After editing, bump the `?v=` number on the CSS/JS links in `index.html` so browsers fetch the new files.

## Structure

- `index.html` — page and copy (approved copy, do not edit wording)
- `css/styles.css` — design system and layout
- `js/main.js` — countdown, giving widget, gallery lightbox, animations
- `assets/img` — WebP photos (two sizes each), `assets/video` — drone footage
