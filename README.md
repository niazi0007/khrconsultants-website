# KHR Corporate & Tax Consultants — Website

A single-page marketing site for KHR Corporate & Tax Consultants: plain static
**HTML / CSS / JS**, with the page text, contact details and images kept in
editable content files so a non-technical editor can update them through an
admin panel.

## Editing content (admin panel)

Content is edited with [Pages CMS](https://app.pagescms.org), configured in
`.pages.yml`. An editor signs in, picks a section (Services, About us, …),
changes text or uploads a picture, and clicks **Save**. Pages CMS commits the
change to this repo and Vercel rebuilds and republishes the site automatically.

- Page text, lists, contact details and links → `content/*.json`
- Pictures (logo, icon, uploads) → `assets/`

Editors without a GitHub account can be invited by email from the Pages CMS
project settings (Collaborators).

## How it is built

| File | Purpose |
|------|---------|
| `index.html` | Page layout. Elements are tagged with markers (`data-c`, `data-list`, `data-f`, …) that say which content field they show. It still opens fine on its own with the default text. |
| `content/*.json` | All editable content, one file per section. |
| `build.mjs` | Fills `index.html` with the content and writes the finished site to `dist/`. Explains the markers at the top of the file. |
| `styles.css` | Base tokens, fonts, responsive rules, hover/focus states. |
| `script.js` | Mobile-menu toggle and contact-form validation + delivery. |
| `assets/` | Logo, favicon and uploaded images. |
| `vercel.json` | Tells Vercel to run the build and publish `dist/`. |
| `.pages.yml` | Admin panel menus and field labels. |

To change **layout or design**, edit `index.html` / `styles.css` as before.
When adding a new piece of editable text, give the element a marker such as
`<span data-c="hero.newfield">Default text</span>`, add the field to the matching
`content/*.json` file, and add it to `.pages.yml` so it appears in the admin panel.

## Preview / run locally

```bash
npm install
npm run build
python3 -m http.server 8000 --directory dist
# then open http://localhost:8000
```

## Sections

Sticky top bar + nav → hero (with consultation card) → trust strip → service
cards → about / mission / people → why-us → industries we serve → testimonials
+ case study → insights → contact (form + map + WhatsApp/phone/email) → CTA
band → footer → floating WhatsApp button. Responsive at 1000px and 720px breakpoints.

## Contact form delivery

The "Request a callback" form validates name + email client-side, then delivers
the enquiry. **By default it hands off to WhatsApp** (the main phone number set
in the admin panel) so messages reach the business immediately with no backend.

To receive submissions silently **by email** instead, open `script.js` and set a
form endpoint (e.g. a free [Formspree](https://formspree.io) form):

```js
var FORM_ENDPOINT = "https://formspree.io/f/your-id";
```

Once set, the form POSTs there and only falls back to WhatsApp if the request fails.

## Placeholders to replace before launch

Carried over from the design as realistic samples (all editable in the admin panel):

- **Testimonials** (Ahmed Raza, Sana Khan) and the **case-study numbers** (30% / <3 wk).
- **Stats** in the hero (12+ years, 500+ clients, 100%).
- **Insights** articles link to `#contact` — point them at real blog posts when written.
- **Office address** and **map location** (currently Blue Area, Islamabad).
