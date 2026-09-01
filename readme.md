# Bill Splitting App

Open-source web app to **split expenses** with friends, trips, and housemates. Create a group, log who paid what, and see at a glance who owes whom. Invite with a link or QR code.

- Demo: [bill-splitting-app.pericodes.com](https://bill-splitting-app.pericodes.com)
- Repository: [github.com/pericodes/bill-splitting-app](https://github.com/pericodes/bill-splitting-app)

## Deploy your own copy

Step-by-step setup (fork, Neon, Vercel, trusted domains) in both languages:

- **English:** [quickstart_en.md](quickstart_en.md)
- **Español:** [quickstart_es.md](quickstart_es.md)

If you do not code every day, the **Getting started** section in those guides is enough to get the app live. The **Advanced setup** section covers local development, Netlify, Prisma, and extra environment variables.

**Important:** add every domain where the app is hosted to Neon’s trusted domains (**Auth → Domains → Your trusted domains**). That includes `https://your-app.vercel.app` and any custom domain or subdomain. Without it, sign-up and sign-in fail.

## What it does

- Shared accounts with name, icon, and currency (EUR, USD, GBP)
- Expenses with one or more payers, equal or custom splits
- Automatic balances and a minimal set of settlements
- Invite by link or QR; provisional participants you can claim later
- Guest profile or registered email; Spanish and English UI

## Stack

Next.js 15 (App Router), TypeScript, Neon Postgres, Neon Data API, and Neon Auth. In production the app does not open a TCP connection to Postgres.

## Contributing

Fork, branch, and open a pull request to `main`. Details are in the [English](quickstart_en.md#how-to-contribute) and [Spanish](quickstart_es.md#cómo-colaborar) quickstarts.
