# allora-career-bridge

Accessible Onboarding System — Partner (Vendor) Dashboard, shared Form Engine
and the API behind them.

## Layout

| Path | What it is |
| --- | --- |
| `packages/contracts` | Field catalogue, accommodation catalogues, form templates and the Zod schemas. Shared by the dashboard, the engine and the API. |
| `packages/form-engine` | Headless engine (`src`) plus its React bindings (`react`). The dashboard preview and the embedded widget render with the same code. |
| `widget` | The embeddable `<onboarding-form>` element: one script, `widget/dist/onboarding-widget.js`, served by the API. |
| `Frontend` | The partner dashboard (React + Vite). |
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
the finished answers and files are handed to that website's own code.

**This system does not store learners' answers or files.** When a learner
presses *Send my answers*, the form fires an `onboarding-submit` event on
the page, and the partner's code decides where the answers go: their own
database, a CRM, an email. The only thing the widget itself sends to this
API is a referral the learner has confirmed, so the SMS can go out.

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
   so a copied tag does not work elsewhere. Then **handle submissions** in
   your page:

   ```html
   <script>
     document.addEventListener('onboarding-submit', async (event) => {
       const { formId, version, type, answers, files } = event.detail;
       // answers: { name: "…", phone: "…", … }   files: { cvFile: File, … }
       const body = new FormData();
       body.append('answers', JSON.stringify(answers));
       for (const [key, file] of Object.entries(files)) body.append(key, file);
       await fetch('/your-own-endpoint', { method: 'POST', body });
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
   `onboarding-submit` handler should receive the answers.
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

**Already in place:** the API, database, file handling (in the browser),
widget and dashboard. **Still needed before real use:** a host for the API
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
