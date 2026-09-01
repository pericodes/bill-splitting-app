# Bill Splitting App

Open-source web app to **split expenses** with friends, trips, and housemates. Create a group, log who paid what, and see at a glance who owes whom. Invite with a link or QR code.

- Demo: [bill-splitting-app.pericodes.com](https://bill-splitting-app.pericodes.com)
- Repository: [github.com/pericodes/bill-splitting-app](https://github.com/pericodes/bill-splitting-app)

**Language:** [English](quickstart_en.md) · [Español](quickstart_es.md)

If you do not code every day, follow **only** the [getting started](#getting-started) section. When you finish, you will have your own copy on the internet. [Advanced setup](#advanced-setup) is for local development, Netlify, migrations, and extra settings.

---

## Getting started

Three free accounts and a few clicks. You do not need to install Node or open a terminal.

### What you need

1. A [GitHub](https://github.com/signup) account (to copy the code).
2. A [Neon](https://neon.tech) account (database and user login).
3. A [Vercel](https://vercel.com/signup) account (the server that hosts the app).

Link GitHub to Vercel when it asks: that way Vercel can read your fork.

### 1. Fork the repository

1. Open [github.com/pericodes/bill-splitting-app](https://github.com/pericodes/bill-splitting-app).
2. Click **Fork** (top right) and confirm.
3. Stay on **your** copy: the URL will be `https://github.com/YOUR_USERNAME/bill-splitting-app`.

### 2. Create the Neon project and enable Data API and Auth

1. Go to [console.neon.tech](https://console.neon.tech) and create a Postgres project (pick the region closest to you).
2. In the project menu, open **Data API** and enable it. If it asks for authentication, choose **Managed Better Auth** (or Neon Auth): that turns on Data API and Auth together.
3. If Auth did not turn on by itself, open it in the menu (**Auth**) and enable it.
4. Enable **anonymous tokens** / anonymous access if you see the option: the app uses them so people can continue as a guest.
5. Copy and save these two URLs (you will paste them in Vercel):

| What | Where in Neon | How to recognize it |
| --- | --- | --- |
| Data API | **Data API** page | Ends with `/rest/v1` |
| Auth | **Auth** page | Ends with `/auth` |

Example (your real values will differ):

```
https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1
https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth
```

6. **Create the app tables** (Neon starts empty; without this the site loads but you cannot create groups). In Neon open **SQL Editor** and run, **in this order**, the contents of these files from your fork (on GitHub: open the file → **Raw** → copy everything → paste in the editor → **Run**):

   1. `prisma/migrations/20260826184000_init/migration.sql`
   2. `prisma/migrations/20260831194000_cascade_delete_transaction_entries_account/migration.sql`
   3. `prisma/sql/pg-features.sql`
   4. `prisma/sql/data-api-grants.sql` (Data API must already be enabled; otherwise this step does not grant permissions)

7. Go back to **Data API** and click **Refresh schema cache** (or equivalent) so the API sees the new tables.

If you would rather run a single command on your computer instead of pasting SQL, use [Apply the schema with Prisma](#apply-the-schema-with-prisma).

### 3. Import the repo in Vercel and paste the URLs

1. Go to [vercel.com/new](https://vercel.com/new).
2. Choose **Import Git Repository** and select **your fork** (`YOUR_USERNAME/bill-splitting-app`).
3. Before deploying, open **Environment Variables** and add exactly these two (Production; Preview as well if you want previews to work):

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | The Data API URL (ends with `/rest/v1`) |
| `NEXT_PUBLIC_NEON_AUTH_URL` | The Auth URL (ends with `/auth`) |

4. Click **Deploy**. Wait until it finishes (a couple of minutes).
5. Open the project in Vercel and copy the production URL, something like `https://your-app.vercel.app` (**Domains** tab or the latest deploy link).

If the first deploy ran **before** you saved the variables, deploy again (**Deployments** → ⋮ → **Redeploy**) so it picks them up.

### 4. Add your Vercel domain to Neon’s trusted domains

**Required.** Without this, sign-up and sign-in fail (invalid origin / unauthorized redirect), both on `*.vercel.app` and on your own domain.

1. In Neon: **Auth → Domains → Your trusted domains** (in some consoles: **Auth → Configuration → Domains**).
2. Add the Vercel URL **with `https://` and no trailing slash**:

   ```
   https://your-app.vercel.app
   ```

3. If you later use your own domain or subdomain, **add that too** (next step). `www` and non-`www` are different origins: include every host people will actually use.

[Neon docs: trusted domains](https://neon.com/docs/auth/guides/configure-domains)

### 5. (Optional) Your own domain or subdomain

1. In Vercel: project → **Settings → Domains** → add `expenses.yourdomain.com` (or whichever host you want) and follow the DNS instructions.
2. When the domain is live, in Neon **Auth → Domains → Your trusted domains** add exactly:

   ```
   https://expenses.yourdomain.com
   ```

   Same format: `https://`, no trailing slash. Keep the `*.vercel.app` entry as well if you still use it.

### Check that it works

Open the Vercel URL (or yours). Continue as a guest or with email, create a group and an expense. If login fails, check [step 4](#4-add-your-vercel-domain-to-neons-trusted-domains). If you cannot create groups, check the tables and **Refresh schema cache** in [step 2](#2-create-the-neon-project-and-enable-data-api-and-auth).

---

## Advanced setup

For local development, deploying on Netlify, or understanding the rest of the variables and the schema.

### Environment variables

Copy `.env.example` to `.env` at the repo root.

| Variable | Where is it needed? | What it is for |
| --- | --- | --- |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | Vercel / local | Data API (production and client) |
| `NEXT_PUBLIC_NEON_AUTH_URL` | Vercel / local | Neon Auth |
| `APP_URL` | Optional | Public URL of the deploy (callbacks / links). Not required for the minimal setup. |
| `DEV_DATABASE_URL` | Your machine only | **Direct** Postgres connection string (host **without** `-pooler`) to migrate the schema. **Do not** set it on Vercel. |
| `VITE_NEON_DATA_API_URL` / `VITE_NEON_AUTH_URL` | Optional | Fallback if you copied names from the Neon console; the app prefers the `NEXT_PUBLIC_*` variables. |

In production the app **does not** open a TCP connection to Postgres: it talks to the Data API. Prisma and `DEV_DATABASE_URL` are only for applying the schema from your computer.

### Apply the schema with Prisma

Enable Data API in Neon **first**. In `.env`, `DEV_DATABASE_URL` must be the **direct** connection (Neon Dashboard → Connection string → turn off *Pooled connection*). `NODE_ENV` must not be `production`.

```bash
pnpm install
pnpm db:dev:setup
```

That applies Prisma migrations, generated columns / CHECKs (`prisma/sql/pg-features.sql`), and `GRANT`s for the `anonymous` and `authenticated` roles (`prisma/sql/data-api-grants.sql`). Afterwards, in Neon **Data API → Refresh schema cache**.

Other scripts: `pnpm db:dev:migrate`, `pnpm db:dev:features`, `pnpm db:dev:grants`, `pnpm db:dev:studio`. Do not use `prisma db push`: it can break CHECKs and policies.

If you already pasted the SQL by hand in the Neon editor, do not run `pnpm db:dev:setup` again on that same database unless you know what is already applied: Prisma will try to re-apply migrations.

### Local development

Requirements: [Node.js 20+](https://nodejs.org/) and [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`).

```bash
git clone https://github.com/YOUR_USERNAME/bill-splitting-app.git
cd bill-splitting-app
pnpm install
```

Create `.env` (in PowerShell: `Copy-Item .env.example .env`), fill in the Neon URLs and `DEV_DATABASE_URL`, apply the schema, and start:

```bash
pnpm db:dev:setup
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). `localhost` is already allowed in Neon Auth; you do not need to add it to trusted domains.

### Deploy with the Vercel CLI

With the repo cloned and the same variables as in the basic setup:

```bash
npx vercel login
npx vercel
npx vercel env add NEXT_PUBLIC_NEON_AUTH_URL production
npx vercel env add NEXT_PUBLIC_NEON_DATA_API_URL production
npx vercel --prod
```

Add `https://your-app.vercel.app` under **Auth → Domains → Your trusted domains**.

### Deploy on Netlify

Netlify detects Next.js (App Router). Build: `pnpm build`; do not publish the `.next` folder by hand.

```bash
npx netlify-cli login
npx netlify init
npx netlify env:set NEXT_PUBLIC_NEON_AUTH_URL "https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth"
npx netlify env:set NEXT_PUBLIC_NEON_DATA_API_URL "https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1"
npx netlify deploy --build --prod
```

Add `https://your-site.netlify.app` (and your own domain, if you use one) under **Auth → Domains → Your trusted domains**.

### Vercel previews

Each preview has a different host. You can add a wildcard pattern in trusted domains, for example `https://*.vercel.app`, or one for your project. See [Configure trusted domains](https://neon.com/docs/auth/guides/configure-domains).

### Stack

Next.js 15 (App Router), TypeScript, Neon Postgres, Neon Data API, and Neon Auth. In production there is no custom backend and no direct database connection.

### How to contribute

1. Fork on GitHub.
2. Clone your fork and add the upstream remote:

   ```bash
   git clone https://github.com/YOUR_USERNAME/bill-splitting-app.git
   cd bill-splitting-app
   git remote add upstream https://github.com/pericodes/bill-splitting-app.git
   ```

3. Branch, make changes, and open a pull request to `main`. If the change is large, open an issue first.

```bash
git checkout -b feat/my-change
git push -u origin feat/my-change
```

### Common issues

| Symptom | What to check |
| --- | --- |
| Login / sign-up: invalid origin or unauthorized redirect | The exact domain (with `https://`, no trailing `/`) is in **Auth → Domains → Your trusted domains**. If you use a custom domain, that one too. |
| The site loads but you cannot create groups | Tables applied and **Refresh schema cache** on Data API. `data-api-grants.sql` after enabling Data API. |
| Vercel “does not pick up” variables | Exact `NEXT_PUBLIC_*` names and a **Redeploy** after saving them. |
| Prisma refuses to run | `DEV_DATABASE_URL` is set, **direct** connection (no `-pooler`), and you are not in `NODE_ENV=production`. |

### Resources

- [Neon](https://neon.com/docs)
- [Neon Auth](https://neon.com/docs/neon-auth)
- [Trusted domains](https://neon.com/docs/auth/guides/configure-domains)
- [Neon Data API](https://neon.com/docs/data-api/get-started)
- [Vercel](https://vercel.com/docs)
