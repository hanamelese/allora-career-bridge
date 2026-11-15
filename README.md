# allora-career-bridge

Accessible Onboarding System — Allora Accessibility Bridge (the partner dashboard), shared Form Engine
and the API behind them.

## Layout

| Path | What it is |
| --- | --- |
| `packages/contracts` | Field catalogue, accommodation catalogues, form templates and the Zod schemas. Shared by the dashboard, the engine and the API. |
| `packages/form-engine` | Headless engine (`src`) plus its React bindings (`react`). The dashboard preview and the embedded widget render with the same code. |
| `widget` | The embeddable `<onboarding-form>` element: one script, `widget/dist/onboarding-widget.js`, served by the API. |
| `Frontend` | Allora Accessibility Bridge, the partner dashboard (React + Vite). |
| `API` | Express + SQLite + Drizzle. Dashboard API and the public form API. |

## Running it

```bash
npm install

# One-off: the API needs a signing secret and a seeded partner.
cp API/.env.example API/.env     # then set JWT_SECRET
npm run db:seed -w api           # prints the sign-in details and the keys once

npm run build:widget             # once, and after engine changes: the embed script
npm run api                      # http://localhost:3001
npm run dev                      # http://localhost:5173
```

The dashboard calls `/api/v1` on its own origin; Vite proxies that to the API,
so no API address is baked into the bundle.

`npm test` runs the contracts, engine and API suites.

## Running it in Docker

The same app in two containers: **api** (Node 22: the API, its migrations
and the built widget) and **web** (nginx: the built dashboard, forwarding
`/api` and `/widget` to the API so the dashboard calls its own address). The
SQLite database lives in the named volume `bridge-data`. Your local
`npm run dev` / `npm run api` workflow is unchanged and separate.

```bash
cp .env.docker.example .env          # then set JWT_SECRET (required)
docker compose up --build -d          # build and start; waits for the API's health check
docker compose exec api node src/db/seed.js   # optional: a demo partner (prints its keys once)
```

- Dashboard: `http://localhost:8090` (`WEB_PORT`). API and widget:
  `http://localhost:3001` (`API_PORT`) - published because partners'
  websites load the widget from it. If you also run `npm run api`, pick
  another `API_PORT`, and set `PUBLIC_API_ORIGIN` to match (it is built into
  the dashboard's embed tags, so rebuild after changing it).
- Settings come from `.env` (git-ignored); see `.env.docker.example`.
  Nothing secret is built into an image, and the API refuses to start
  without `JWT_SECRET`.
- Migrations run each time the API starts; data stays in the volume across
  restarts and rebuilds.

| Task | Command |
| --- | --- |
| Status and health | `docker compose ps` |
| Logs | `docker compose logs -f api` (or `web`) |
| A shell in the API | `docker compose exec api sh` |
| Stop (keeps data) | `docker compose down` |
| Rebuild after code changes | `docker compose up --build -d` |
| Back up the database | `docker compose cp api:/data/onboarding.db ./backup.db` (stop first, or copy the `-wal` file too) |
| Start from an empty database | `docker compose down -v` (**deletes the volume and all its data**) |

The containers start with a fresh database, so forms published locally (and
the Savanna demo's embed tags) are not in it. To use a copy of your local
database instead, with the stack and `npm run api` both stopped (so the file
is complete):
`docker compose run --rm -v "$PWD/API/data:/import:ro" api sh -c 'cp /import/onboarding.db /data/'`.

Behind the nginx container every dashboard request comes from one address,
so the API's per-address limits (sign-up attempts) count all dashboard users
together; a real deployment would set up proxy headers and trust them.

## Notes

- The secret key is shown once by the seed and stored only as a hash. It never
  reaches the browser; the dashboard only ever holds the `pk_` public key.
- Published form versions are immutable — enforced in the publish route and by
  triggers on `form_versions`.
- `API/.env` and `API/data/` are git-ignored.
- On start, the API upgrades stored drafts (published versions are never
  touched):
  - Learner Registration drafts become the merged Learner Registration &
    Profile form.
  - The learner's own "Your permission" question is removed from the learner
    and job application forms. **Those forms no longer collect an explicit
    agreement to share answers**, so the partner's own site must cover consent
    (for example in its terms, or before the form is shown). The employer
    form's contact permission and the optional staff "Permission to register
    on their behalf" question are unchanged.
  - "Refer me through a partner" and "I have no document" are merged into one
    option, **"I have no document, refer me"**, which leads to the referral
    step. Versions published before the change still show the old options.

## Referral SMS

A learner who chooses "I have no document, refer me" can ask, at the end of the learner
form, for a link to be sent by SMS to the organisation's referral partners
(managed under **Organisation → Referral partners**). The link opens
`/referrals/:token`, where the partner sees the learner's name and phone and
can accept the referral.

**No SMS provider is wired up yet.** With `SMS_PROVIDER` unset, every send
fails with `sms_not_configured` and nothing is reported as sent. To enable
it, add a provider in `API/src/sms/index.js` and put its credentials in
`API/.env` (never in the frontend). Set `PUBLIC_APP_URL` to where the
dashboard is served so links in messages point to it.

## Partner accounts and the Sign up / Sign in form

- **Partner sign-up.** `/` is the public landing page. `/signup` creates a partner organisation (`POST /api/v1/auth/signup`) with its own key pair and one draft of every form, and signs it in. The seed script still creates the demo partner.
- **Sign up / Sign in form** (`account` type, listed first). It is a component for a partner's own site and does no authentication itself:
  - Email and password are passed to the host's `onSubmit`.
  - Each social button (Google, LinkedIn, Facebook, Microsoft, Apple) is a link to an `https` address the partner configures, normally the start of their own OAuth flow.
  - No OAuth secrets are stored here.
- **Existing databases** are brought forward at API start:
  - partners created earlier get the new form;
  - learner drafts get the identity questions moved to the end, beside the referral step.
- **Landing image.** `Frontend/src/assets/landing-hero.jpg` is the watermarked Adobe Stock preview (#563796331). License it, or replace the file, before going public.

## Embedding a form on your website

What works today, end to end: a published form loads on a partner's own
website, learners fill it in (voice, keyboard, screen reader, contrast and
text size, Amharic, uploads, saved progress in the tab, referral SMS), and
the finished answers are handed, as JSON with any files, to that website's
own code - and, if the organisation sets one up, posted straight to its own
server too. This service never receives or keeps them.

**Where the answers go - this service keeps none of them.** When a learner
presses *Send my answers*, the form hands **every answer to the page** in the
`onboarding-submit` event: `event.detail.answers` is plain JSON, and
`event.detail.files` holds any uploads as `File` objects. The page processes
them as it needs - typically by saving them on the organisation's own server.
The page can call `event.detail.waitUntil(promise)` with that save; the form
then waits, says "sent" only once it worked, and if it fails the learner keeps
every answer and can press Send again. (A page that does not call it lets the
form say "sent" as soon as the page has the answers.) Once the form says
"sent", it fires `onboarding-sent`: the moment to show the page's own
"what next" content.

**Optional: straight to a server as well.** If the organisation also sets a
server address (**Your organisation → Where submitted forms go**), the
learner's browser first posts the answers an organisation can act on there,
with a short-lived signed token; see
[Delivering submitted forms](#delivering-submitted-forms). That delivery
leaves out, in the browser:

- private answers: support needs, accommodations, the referral choice, and
  the identity document file;
- ID numbers;
- the contents of any file. An uploaded CV is described by its name, size and
  type only.

Those still reach the page in the event, for the organisation's own use. The
event also says `delivered: true` and gives the server's `receiptId` when a
delivery happened. The Sign up / Sign in form is never delivered (it holds a
password): the page does the signing in, and can resolve `waitUntil` with
`{ errors: { email: '…' } }` or `{ message: '…' }` to show a problem in the
form. `mode="signUp"` or `mode="signIn"` on the tag chooses how it opens; its
own link switches between them (`onboarding-mode` event).

### For a partner organisation

1. **Configure.** In the dashboard, open a form (sidebar) → **Configure**.
   Switch questions on or off, reword them, set upload limits, add your own
   questions. Check it in **Preview**.
2. **Save.** **Save draft** (top bar). Drafts are never shown to learners.
3. **Publish.** **Publish** → confirm. This freezes the draft as version *N*.
4. **Find the tag.** Open the form's **Embed tag** tab (the fourth item). It
   always shows the latest *published* version; if your draft has changed
   since, it says so.
5. **Copy it.** **Copy the tag**. If the browser blocks copying, the tag is
   selected for you: press Ctrl+C (Cmd+C on a Mac).
6. **Paste it** into your page's HTML where the form should appear:

   ```html
   <script src="https://YOUR-API/widget/v1/onboarding-widget.js" async></script>

   <onboarding-form form-id="frm_…" public-key="pk_live_…" form-version="1" lang="en">
   </onboarding-form>
   ```

7. **Allow your website.** In **Your organisation → Websites**, add your
   site's address (`https://www.example.org`). Any other site is refused,
   so a copied tag does not work elsewhere. Then **collect the answers** in
   your page (the dashboard's **Embed tag** page shows the same example):

   ```html
   <script>
     document.addEventListener('onboarding-submit', async (event) => {
       const { formId, version, type, answers, files } = event.detail;
       // answers: { name: "…", phone: "…", … }   files: { cvFile: File, … }
       const body = new FormData();
       body.append('answers', JSON.stringify(answers));
       for (const [key, file] of Object.entries(files)) body.append(key, file);
       // The form waits for this, and says "sent" only if it worked.
       event.detail.waitUntil(
         fetch('/your-own-endpoint', { method: 'POST', body }).then((r) => {
           if (!r.ok) throw new Error('Not saved');
         }),
       );
     });
     document.addEventListener('onboarding-error', (event) => console.warn(event.detail));
   </script>
   ```

   For the Sign up / Sign in form, `event.detail.mode` is `signUp` or
   `signIn`; check the email and password with your own sign-in system.
   Private answers (support needs, accommodations) arrive with the rest:
   keep them away from employers, as the form promised the learner.
8. **Check it works.** Open your page. The form should show its first
   question; `onboarding-ready` fires on the page. If it says your site is
   not on the list, repeat step 7 (the address must match exactly,
   including `https://` and any `www.`). Fill it in and send: your
   `onboarding-submit` handler receives every answer (and your server
   address, if you set one, the ones an organisation can act on).
9. **Update it.** Change the form, **Publish** again (version *N+1*), copy
   the new tag from **Embed tag** and replace the old one. Until you do,
   your site keeps showing version *N*: a published version never changes.

### For whoever runs this system

- `npm run build` builds the widget and the dashboard. The API serves the
  widget from `widget/dist` at `/widget/v1/onboarding-widget.js`, so it must
  be built on the server that runs the API.
- Environment:
  - API (`API/.env`): `JWT_SECRET`; `DATABASE_URL` (the SQLite file, which must be
    on a **persistent** disk); `CORS_ORIGINS` (the dashboard's address);
    `PUBLIC_APP_URL` (the dashboard's address, used in referral SMS links);
    `SMS_PROVIDER` and its credentials, once a provider is added.
  - Dashboard build: `VITE_API_URL` (e.g. `https://api.example.org/api/v1`)
    when the API is on another address, and `VITE_PUBLIC_API_ORIGIN`
    (e.g. `https://api.example.org`) so the embed tag points at the API.
- The public form config is sent with `Cache-Control: no-cache`, so a
  website removed from a partner's list stops working at once.

**Already in place:** the API, database (form settings, accounts and keys -
no learners' answers), file
handling (in the browser), widget and dashboard. **Still needed before real use:** a host for the API
with a persistent disk, a host for the dashboard, a domain or two, and an
SMS provider. Nothing here has been deployed.

### Free hosting options (checked November 2026; terms change, check again)

| Need | Free option | Limits to know |
| --- | --- | --- |
| API + SQLite | Oracle Cloud *Always Free* VM (Ampere A1 or AMD micro) running Node | A real VM with a persistent boot volume (Always Free block storage is 200 GB per account, 50 GB minimum boot volume). Sign-up asks for a card for identity checks. A July 2026 report says free-only accounts' A1 limits were cut to 2 OCPUs / 12 GB RAM, which is still ample for this API. You patch and secure the server yourself. |
| API (not recommended) | Render free web service | Sleeps after 15 minutes idle (about a minute to wake), and its disk is wiped on every restart or redeploy, so the SQLite database would be lost. A persistent disk is paid. Only for demos. |
| Dashboard | Any free static host: Cloudflare Pages, Netlify, GitHub Pages | Serve `Frontend/dist`. Rewrite every path to `index.html`, because the dashboard is a single-page app. |
| SMS | Africa's Talking sandbox | Free, but messages appear only in the sandbox simulator, never on real phones. Real sending is paid per message. Until a provider is added (`API/src/sms/index.js`), sends fail honestly with "not configured". |

Sources: Render, [Deploy for Free](https://render.com/docs/free); Oracle,
[Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm);
InfoQ, [Oracle Cloud free tier limits](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/);
Africa's Talking, [sandbox help](https://help.africastalking.com/en/articles/1170660-how-do-i-get-started-on-the-africa-s-talking-sandbox).

## Delivering submitted forms

Optional. Every answer always reaches the website's page (above); this adds
a server the organisation runs, which the learner's browser posts to
directly. This service never receives a learner's answers and keeps none.

```
learner's browser ──(1) POST /api/v1/public/forms/:id/delivery {version}──▶ this API
                  ◀── { deliveryUrl, token, expiresAt } ─────────────────────
learner's browser ──(2) POST deliveryUrl { token, formId, version, type,
                         language, submittedAt, answers } ──────────────────▶ organisation's server
                  ◀── 2xx { receiptId? } ─────────────────────────────────────
```

**What the organisation sets up**

1. In **Your organisation → Where submitted forms go**, an `https://`
   address (plain `http://` only for `localhost`, for testing). Saving it
   creates a **signing secret**, shown only there; keep it on the server.
2. A server at that address that:
   - answers the browser's CORS check for the websites that show the forms
     (allowing `Content-Type`), and accepts a JSON `POST`;
   - checks the token: `v1.<payload>.<signature>`, where `signature` is
     `HMAC-SHA256(secret, payload)` in base64url, and `payload` (base64url
     JSON) holds `{ formId, version, publicKey, iat, exp, nonce }`. Refuse it
     if the signature differs, `exp` has passed, `formId`/`version` differ
     from the body's, or the `nonce` was already used;
   - keeps the answers under the organisation's own data policy, and replies
     `2xx`, optionally `{ "receiptId": "…" }`. Anything else tells the
     learner it was not sent.

```js
import { createHmac, timingSafeEqual } from 'node:crypto';
function verify(token, secret) {
  const [v, payload, sig] = String(token).split('.');
  const good = Buffer.from(createHmac('sha256', secret).update(payload ?? '').digest('base64url'));
  if (v !== 'v1' || !sig || good.length !== sig.length || !timingSafeEqual(good, Buffer.from(sig))) return null;
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return claims.exp * 1000 > Date.now() ? claims : null;
}
```

`tools/delivery-receiver/receiver.mjs` is a complete example with no
dependencies (`npm run delivery:receiver`); it appends to a JSON-lines file
under `tools/delivery-receiver/received/`, which git ignores.

**What the token proves, and what it does not.** Anyone who can load a
published form can ask for a token, so a valid token shows a delivery came
through that form recently - not that a real learner filled it in. Treat
deliveries like any public form post (rate limits, checks). Tokens last ten
minutes, and asking for them is rate-limited per key and address.

**What this service still holds.** Form settings and versions, partner
accounts, keys, allowed websites, referral partners, and each referral's
status (who it went to, when, and whether it was accepted). A referral's SMS
carries the learner's name and phone, which are not stored. The old
`submissions` table is no longer written or read; rows stored before this
change were exported to `API/data/submissions-export-2026-11-15.json` and
remain in the table until their deletion is approved.

## ALX Savanna demo

ALX's Savanna learner pages (the separate `Savanna-static-pages` repository)
show three forms, each placed with the tag the dashboard generated: the
Sign up / Sign in form on the site's sign-in page (`/`), and the two learner
forms on portal pages of their own. A demo guide is at `/guide/`. The two repositories stay separate: Savanna holds
only the pasted tags and a little page CSS and JS around them.

| Savanna page | Form | Version |
| --- | --- | --- |
| `index.html` (`/`) | Sign up / Sign in, in sign-in mode | 1 |
| `pages/register.html` | Learner Registration & Profile | 5 |
| `pages/job-application.html` | Job Application | 1 |

The sign-in page is a demo: the static site has no accounts, so it removes
the password in the browser at once, sends nothing, and opens the guide.

The tags name the **ALX Ethiopia** partner's form IDs and public key in your
local database (`API/data/onboarding.db`). On another machine or a fresh
database, publish the forms there and paste the new tags (see step 6).

### Starting it

```bash
# Form Engine (this repository)
npm run build:widget        # the embed script the API serves
npm run api                 # http://localhost:3001
npm run dev                 # http://localhost:5173 (dashboard)

# Savanna (no install)
cd ../../Savanna-static-pages     # wherever it is checked out
python3 -m http.server 8080 --bind 127.0.0.1

# Optional - the organisation's own server, as an example receiver
DELIVERY_SECRET=dsec_… ALLOWED_ORIGINS=http://localhost:8080 npm run delivery:receiver
```

The demo pages receive the answers themselves and show what they received.
To try the optional server as well, set **Your organisation → Where submitted
forms go** to `http://localhost:4000/submissions` and use the signing secret
shown there.

Open `http://localhost:8080/` (exactly that: `127.0.0.1:8080` is a different
website, so it is refused). `Frontend/.env.development` makes the dashboard's
tag point straight at the API on `:3001`, as it would when deployed.

### Walking through it

1. **Signing in.** Open `http://localhost:8080/`: the sign-in page, with the
   published Sign in form (email, then password). Sign in with anything: it
   opens the demo guide (`/guide/`), which links every page. Open the
   self-paced homepage. The sidebar has a new **Get hired** group,
   and a **Ready for work?** card sits under the dashboard's cards.
2. **Registering.** Choose **Register**. The form appears inside the portal's
   own card. Try it with the keyboard only (Tab, Enter), with
   **Answer by speaking**, and with **Read aloud**. Open **Settings** for text
   size, contrast, simple words and Amharic. Reload halfway through: the form
   comes back where you left it, without the private answers. Send it: the
   form confirms, and the page shows **What next?**
3. **Applying for a job.** Choose **Apply for a job**. It asks one question at
   a time, with a CV upload (try a `.txt` or a file over 10 MB) and *What would
   help you at this job?* in its own private section. It ends with *How can we
   identify you?*: a document with its number and upload, or
   **I have no document, refer me**, which offers the referral SMS.
4. **How it is embedded.** View the page source of `pages/register.html`: one
   `<script>` and one `<onboarding-form>` element. That is all a partner
   pastes.
5. **What arrived.** After sending, the page shows **What this page
   received**: the answers as JSON, exactly as `onboarding-submit` gave
   them (files by name). This service kept nothing. With the optional
   receiver running, it also saved the answers an organisation can act on to
   `tools/delivery-receiver/received/`.
6. **Configuring and publishing.** In the dashboard: **Configure** (switch a
   question on or off, change upload limits), **Preview**, **Save draft**,
   **Publish** (version *N+1*), then **Embed tag** → **Copy the tag**. Paste
   it over the tag in the Savanna page and reload: the page now shows the new
   version. Until the tag is replaced, the page keeps the version it names.
   The Savanna website is allowed under **Your organisation → Websites**
   (`http://localhost:8080`).

### What the demo does not do

- **Text messages:** no SMS provider is configured, so a referral says
  "Nothing was sent" and nothing is recorded as sent. See *Referral SMS* and
  the free-hosting table above.
- **Uploaded files are not stored:** the files reach the page only in the
  `onboarding-submit` event. The demo page does nothing more with them.
- **The Savanna portal pages are a static copy:** apart from the new links,
  their own links still go nowhere (`#`), as ALX supplied them.
- **Not deployed:** everything runs on `localhost`.
