# Deploying Allora: backend on Render, dashboard and Savanna on Vercel

There are three deployments, all from the same GitHub repo (`main` branch):

| What | Where | Folder in the repo |
|------|-------|--------------------|
| Backend (API + the form widget) | Render, already live at `https://allora-career-bridge.onrender.com` | `API/` (+ `widget/`) |
| Allora dashboard | Vercel, project 1 | `Frontend/` |
| ALX Savanna site | Vercel, project 2 | `savanna-site/` |

Follow the steps in order. Each step ends with a check. Don't move on until the check passes.

> **Before you start:** make sure the latest code (with `Frontend/vercel.json`,
> `savanna-site/vercel.json` and `API/demo/alx-snapshot.json`) is pushed to `main`.

---

## Step 1: Create the two Vercel projects (to get their addresses)

The backend needs to know the two Vercel addresses, so create the projects first.

### 1a. Dashboard

1. On vercel.com, click **Add New… → Project**, then **Import** the `allora-career-bridge` repo.
2. **Project Name:** `allora-dashboard` (or any free name).
3. **Root Directory:** click **Edit**, choose **`Frontend`**, then click **Continue**.
4. **Framework Preset:** Vite. Leave **Build and Output Settings** alone; `Frontend/vercel.json` sets them.
5. Open **Environment Variables** and paste this whole block into the first field (Vercel splits it into two variables):

   ```
   VITE_API_URL=https://allora-career-bridge.onrender.com/api/v1
   VITE_PUBLIC_API_ORIGIN=https://allora-career-bridge.onrender.com
   ```
6. Click **Deploy**.
7. When it finishes, copy the address under **Domains**, e.g. `https://allora-dashboard.vercel.app`. This is your **DASHBOARD URL**.

### 1b. Savanna

1. **Add New… → Project**, then import the **same** repo again.
2. **Project Name:** `alx-savanna` (or any free name).
3. **Root Directory:** **Edit**, then choose **`savanna-site`**.
4. **Framework Preset:** **Other**. Leave build settings empty. No environment variables.
5. Click **Deploy**.
6. Copy the address under **Domains**, e.g. `https://alx-savanna.vercel.app`. This is your **SAVANNA URL**.

✅ **Check:** both deploys show **Ready**. Pages may not show forms yet; Step 2 fixes that.

---

## Step 2: Update the backend on Render

On dashboard.render.com, open the `allora-career-bridge` service.

### 2a. Settings → Build & Deploy

| Field | Value |
|-------|-------|
| Root Directory | *(empty)* |
| Build Command | `npm ci && npm run build -w widget` |
| Start Command | `npm start -w api` |
| Health Check Path (Settings → Health Checks) | `/api/v1/health` |

The build command also builds the form widget. Without it, the Savanna forms can't load.

### 2b. Environment → Environment Variables

1. Click **Add from .env**, paste the block below, then edit the four lines marked ✏️.
2. Click **Save, rebuild, and deploy**.

```
NODE_VERSION=22
NODE_ENV=production
JWT_SECRET=PASTE_A_LONG_RANDOM_STRING_HERE
DATABASE_URL=./data/onboarding.db
TOKEN_LIFETIME=2h
CORS_ORIGINS=https://allora-dashboard.vercel.app
PUBLIC_APP_URL=https://allora-dashboard.vercel.app
REFERRAL_LIFETIME_DAYS=14
DEMO_SNAPSHOT=demo/alx-snapshot.json
DEMO_OWNER_EMAIL=alx-demo@example.com
DEMO_OWNER_PASSWORD=PASTE_A_PASSWORD_HERE
DEMO_ALLOWED_ORIGINS=https://alx-savanna.vercel.app
```

✏️ What to change:

- `JWT_SECRET`: a long random string. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`, or use Render's **Generate** button.
- `CORS_ORIGINS` and `PUBLIC_APP_URL`: your **DASHBOARD URL** from Step 1a (no `/` at the end).
- `DEMO_ALLOWED_ORIGINS`: your **SAVANNA URL** from Step 1b (no `/` at the end).
- `DEMO_OWNER_EMAIL` / `DEMO_OWNER_PASSWORD`: the sign-in you want for the dashboard. Pick a real password and keep it private.

Optional, only if you have an AfroMessage account for referral SMS. Add these too:

```
SMS_PROVIDER=afromessage
AFROMESSAGE_API_KEY=PASTE_YOUR_AFROMESSAGE_TOKEN
IDENTIFIER_KEY=PASTE_YOUR_IDENTIFIER_OR_DELETE_THIS_LINE
```

✅ **Check:** after the deploy finishes (a few minutes):

- The **Logs** show `demo snapshot restored: ALX Ethiopia, 5 forms` (or `already in place`) and `listening`.
- https://allora-career-bridge.onrender.com/widget/v1/onboarding-widget.js shows JavaScript, not an error.

---

## Step 3: Try it

1. Open your **DASHBOARD URL** and go to `/signin`. Sign in with `DEMO_OWNER_EMAIL` and `DEMO_OWNER_PASSWORD`. You should see ALX Ethiopia's forms.
2. Open your **SAVANNA URL**. Check that each of these shows its form:
   - the sign-in page;
   - `/pages/register.html`;
   - `/pages/job-application.html`;
   - `/guide/` (the sign-up pop-up).
3. On a Savanna form, type something and press **Read my answer**. You should hear it read back.

✅ Done.

---

## Good to know

**Why the dashboard env vars:** the dashboard calls the backend at `VITE_API_URL`. `VITE_PUBLIC_API_ORIGIN` is the address put in the embed tags it gives partners. These are not secrets; they end up in the browser.

**Free Render plan:**

- **It sleeps.** After 15 minutes with no visitors, the first page load takes about 50 seconds. Open https://allora-career-bridge.onrender.com/api/v1/health a minute before a demo.
- **It forgets.** Every restart, redeploy or wake-up starts from an empty database. The backend then restores ALX's forms from `API/demo/alx-snapshot.json`, with the same IDs, so Savanna keeps working.
  - Anything changed in the deployed dashboard is lost at the next restart: form edits, new accounts, websites added.
  - To keep changes, change the forms locally, re-export the snapshot and push:

    ```
    npm run db:export-snapshot -w api -- pk_live_649f880df0dc14c902fce4a2
    ```
  - Or move to a paid Render instance with a **persistent disk** mounted at `/data`. Then set `DATABASE_URL=/data/onboarding.db` and delete the `DEMO_SNAPSHOT` line.

## If something goes wrong

| What you see | Fix |
|--------------|-----|
| Vercel build fails at install | Make sure the Root Directory is `Frontend` (dashboard) or `savanna-site` (Savanna), and that `main` has the latest code. |
| Dashboard: "could not reach the server", or the sign-in does nothing | The backend is waking up: wait 1 minute and retry. Otherwise `CORS_ORIGINS` on Render must be exactly the DASHBOARD URL (`https://…`, no `/` at the end). |
| Reloading a dashboard page shows a Vercel 404 | `Frontend/vercel.json` is missing from `main`. |
| Savanna shows "form unavailable" | Open the widget link from Step 2. If it errors, the Render build command is missing `npm run build -w widget`. |
| Savanna form says the website is not allowed | `DEMO_ALLOWED_ORIGINS` on Render must be exactly the SAVANNA URL. Only the production address works, not Vercel preview links. |
| Sign-in says wrong password | Check `DEMO_OWNER_EMAIL` and `DEMO_OWNER_PASSWORD` on Render, then **Manual Deploy → Restart**. |
| Changed an env var on Vercel, but nothing changed | Vercel env vars only apply to new builds: **Deployments → … → Redeploy**. |
| Render build fails on `better-sqlite3` | `NODE_VERSION=22` must be set in the Render env vars. |
