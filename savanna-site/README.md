# Savanna static pages

Three Savanna learner pages, frozen from the **local dev app** into plain HTML + CSS so they can be
opened offline and used as a reference for front-end and accessibility work.

Open any file in `pages/` directly with `file://` — double-clicking works, no server needed. The
sign-in page (`index.html`) and the embedded forms need the pages served over http (see below).

## What is here

| Page | Learner / course | What it shows |
|------|------------------|----------------|
| `pages/homepage-v1-paced.html` | Björn Sibanda — **WR 100: Fundamentals of Effective Communication**, cohort F26-SEM-16W (31 Aug – 20 Dec 2026), week 10 of 15 | Courses dropdown (3 courses), week strip with **every week preloaded**, "continue where you left off", immediate deliverables, period progress, overall score (59.56%, "slightly behind"), upcoming events |
| `pages/homepage-v1-self-paced.html` | Amara Nwosu — **VA-1: VA Foundations & Professional Identity** | Course-progression gauge (16% against the 70% graduation threshold), 1 of 3 modules complete, **working module switcher**, **preloaded programme modal**, pacing boost (11 days left), upcoming events |
| `pages/concept-with-navigation.html` | Amara Nwosu — concept *"The Future of the VA Industry"* | Curriculum navigation panel (read / current / unread states) beside a full authored concept: callouts, numbered card grid, two-column comparison, icon lists, "Mark as complete". The "Need a Fast Track?" block and the Padlet reflection block are removed on request. |


## Layout

```
savanna_static_pages/
├── index.html                 the sign-in page (the site's root, /)
├── guide/index.html           the demo guide (/guide/)
├── pages/*.html               the frozen pages (relative links into ../assets)
├── assets/
   ├── css/                   the application's own stylesheets, unminified — application_alx.css 
   │                          (sprockets, themed), app.css (esbuild), Google Fonts, Typekit —
   │                          plus static-page.css, the only one written for these pages
   ├── fonts/                 76 font files, all referenced by the stylesheets above
   ├── img/                   51 images: logos, icons, concept artwork, substituted embeds
   └── js/                    popper.js + bootstrap.bundle.js (the exact files the live app
                              serves through sprockets) + static-page.js
```

Everything is shared: the three pages point at the same `assets/` tree, nothing is duplicated and
nothing is minified or gzipped. Captures are additive, so each run ends by dropping assets no
published page references any more — otherwise the Rive stills from retired week panels would
pile up run after run.

## What still works

These are live in the frozen pages, driven by `assets/js/static-page.js` against content that was
pre-rendered during the capture and parked in `<template>` elements (so nothing is duplicated in
the accessibility tree and no id appears twice):

| Control | Page | Behaviour |
|---|---|---|
| **Hamburger** | all | Collapses the sidebar to its 70px icon rail and back, remembered in `localStorage` under `sidebar-collapsed`. It moves the same three things the app does: `body.sidebar-collapsed`, `expanded` on `#sidebar`, and the labels (React wrote `display` inline on each, so `assets/css/static-page.css` overrides them from the body class). |
| **Week strip** | paced homepage | Every week of the course was rendered server-side at capture time; clicking one swaps the panel below it and moves the `active` state. The chevrons and the scroll-into-view of the selected week are reimplemented from the component's own sidecar JS. |
| **Score details modal** | paced homepage | Server-rendered per week, so it opens on its own — including the one that arrives with a week you switch to. |
| **My activities** | self-paced homepage | Each module's activity list was rendered at capture time; clicking a module swaps the panel beside it, as `HomepageSelfPacedActivities.tsx` does. |
| **Programme modal** | self-paced homepage | "Program details" normally fetches `/dashboards/program_structure.json` on first open — the capture opens it once so the fetched tree is baked in. Its course and module accordions expand and collapse: React renders only the body of an *open* section, so the capture opens each one to materialise its content, pairs every toggle with the element it controls (`data-static-collapse-toggle` / `data-static-collapse-body`) and closes again the ones the app had closed. |
| **Courses dropdown** | all | Server-rendered markup, so Bootstrap's dropdown opens it with no help: three courses across a programme group and "Other courses". |
| **Curriculum bar** | all | The bar fixed under the header pads the content by its own height and slides away on scroll down, as `CurrentCurriculumScrollBehavior.tsx` does. |
| Dropdowns, modals, accordions, collapse, tooltips | all | Bootstrap's own bundle. |

Everything else is inert.



## Accessible onboarding demo

Pages added for the demo, each showing a form built and published in **Allora Accessibility Bridge** (the
`allora-career-bridge` repository):

| Address | Page | What it shows |
|---------|------|---------------|
| `/` | `index.html` | **Sign in / Create account**: ALX's published Sign up / Sign in form in a sign-in page styled after ALX's other sign-in pages. The form's own **New here? Create an account** link switches to creating an account; `/#create-account` opens there. |
| `/guide/` | `guide/index.html` | **The demo guide**: what the demo is, where to begin, and the steps through it. Its **Create an account** buttons open the same sign-up form in a pop-up. |
| `/pages/register.html` | `pages/register.html` | **Learner Registration & Profile**, in the portal layout |
| `/pages/job-application.html` | `pages/job-application.html` | **Job Application**, in the portal layout |

Each form is placed with the embed tag the Bridge generates (a `<script>` and an `<onboarding-form>`
element), pasted unchanged into the page. Nothing of the form lives in this repository: the script and the
questions come from the Bridge's API, and sent answers are handed to the page as JSON (the demo pages show
what they received; the Bridge keeps none). The two portal forms also link from the sidebar of every page ("Get hired")
and from a "Ready for work?" card on the self-paced homepage.

**Full view.** Every embedded form has a **Full view** button above it that opens the form as a large pop-up
over a blurred page (`assets/js/full-view.js`, `assets/css/full-view.css`). The form is not moved or restarted,
so answers and the current question stay; Escape, **Close full view** or a click outside closes it.

**Sign in and sign up are a demo.** This static site has no accounts. The form hands what was typed to the
page; the page (`assets/js/login.js`) removes the password at once, sends and keeps nothing, and opens the
guide; the guide's sign-up pop-up (`assets/js/guide.js`) does the same. The sign-in cover photo is ALX's own, loaded from ehub.alxafrica.com; without a connection the panel
shows its gradient.

Also added: `assets/css/login.css` and `assets/js/login.js` (the sign-in page), `assets/css/guide.css` (the
guide), `assets/css/onboarding-demo.css` (spacing around the portal forms) and `assets/js/onboarding-demo.js`
(a message if the form's script cannot load, and the page's own "What next?" links once the form is sent).

### Running it

The forms need the Form Engine (the `allora-career-bridge` repository) running, and these pages served over
http on the address the partner allowed, `http://localhost:8080`. Pages opened with `file://` show
everything else, but the form is refused there.

```bash
cd Savanna-static-pages
python3 -m http.server 8080 --bind 127.0.0.1
# open http://localhost:8080/          (the sign-in page; the guide is /guide/)
```

`/guide/` is a folder with an `index.html`, so it works on this server and on any static host without
rewrite rules.

The full walk-through, with the Form Engine's commands, is in the `allora-career-bridge` README under
"ALX Savanna demo".

### Updating a form

Change the form in Allora Accessibility Bridge, publish it, open **Embed tag**, **Copy the tag**, and replace the
tag in the page (between the comment that says so and the "could not be loaded" message). Until then the
page keeps showing the version it names in `form-version`.
