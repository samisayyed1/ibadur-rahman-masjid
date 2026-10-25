# Project Ibadur Rahman — Dayr Jamal

Donation landing page for rebuilding the Ibadur Rahman Masjid in Dayr Jamal, Northern Syria ($124,000 USD goal, before Ramadan).

Live: https://samisayyed1.github.io/ibadur-rahman-masjid/

## Update the donation total (progress bars)

Edit `data/progress.json`. Every progress bar on the page (hero, giving section, mobile bar) updates from it, and open pages refresh it every 60 seconds:

```json
{ "raised": 31000, "donors": 214 }
```

`donors` is optional; the donor count only shows when it is above 0.

**Moving to WordPress or another platform later:** copy the page as-is. The bars read their numbers in this order, so pick whichever fits:
1. A script tag printed by the platform before `js/main.js`: `<script>window.IBADUR_PROGRESS = { raised: 31000, donors: 214 };</script>`
2. Any URL that returns `{"raised": N, "donors": N}`: set `progressUrl` in `js/main.js` to it (for example a donation platform's API or a WordPress REST endpoint).
3. The fallback number `raised` in `js/main.js`.

## Swap the hero film (Waleed's video)

In `js/main.js`, change `CONFIG.heroVideo`:

```js
heroVideo: {
  src: "https://youtu.be/XXXXXXXXXXX",   // or a Vimeo link, or "assets/video/your-film.mp4"
  poster: "assets/img/your-thumbnail.webp",
  label: "Watch the film",
  length: "2:15",
},
```

YouTube, YouTube Shorts and Vimeo links are detected and embedded automatically. MP4 files play in the same pop-up player, and vertical videos are shown at their own shape.

## Other settings

All in `CONFIG` at the top of `js/main.js`:

| Key | What it does |
| --- | --- |
| `donateUrl` | Your checkout link. While empty, every Donate button scrolls to the giving section. |
| `amountParam` | Query parameter used to pre-fill the chosen amount on the checkout link. |
| `goal` | Fundraising goal in USD ($124,000, including fundraising costs). |
| `ramadan` | First night of Ramadan (est. 7 Feb 2027, 18:00 Syria time). The countdown is computed live from this. |

After editing CSS or JS, bump the `?v=` number on the CSS/JS links in `index.html` so browsers fetch the new files.

## Structure

- `index.html` — page and copy (approved copy, do not edit wording)
- `css/styles.css` — design system and layout
- `js/main.js` — countdown, giving widget, gallery lightbox, animations
- `data/progress.json` — amount raised and donor count
- `assets/img` — WebP photos (two sizes each), `assets/video` — drone footage
