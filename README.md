# ردیاب عادت — Habit tracker

Next.js 16 · shadcn/ui (base-nova, RTL) · Better Auth · Prisma + Postgres · Tailwind 4

Daily goals ("8 glasses") and weekly goals ("3 days a week"), one-tap logging with
undo, streaks, a week strip, and a 26-week heatmap. Persian UI, Jalali dates, light and dark themes.

## Setup

    npm install
    cp .env.example .env          # then fill in DATABASE_URL and BETTER_AUTH_SECRET
    npx prisma migrate dev --name add_auth
    npm run dev

Generate the secret with `openssl rand -base64 32`.
`npx prisma migrate dev` adds the four Better Auth tables (`user`, `session`, `account`,
`verification`) next to your existing habit tables. It does not touch habit data.

## Existing habits from before sign-in existed

Older rows have `userId = 'demo-user'`. After you register, give them to your account:

    UPDATE "Habit" SET "userId" = '<your user id>' WHERE "userId" = 'demo-user';

Your id is in the `user` table.

## Layout

- `src/lib/auth.ts`: Better Auth config (email + password, Prisma adapter, `nextCookies` last)
- `src/lib/auth-client.ts`: browser client used by the login/register forms
- `src/app/api/auth/[...all]/route.ts`: Better Auth HTTP handler
- `src/proxy.ts`: Next 16 proxy (formerly middleware). Redirect only; **not** a security check
- `src/lib/session.ts`: `getSession()` / `getUserId()`, the real check, used by the page and every action
- `src/lib/habit-logic.ts`: pure rules (done, streaks, heatmap, week completion), tested
- `src/app/actions.ts`: server actions with zod validation and per-user scoping
- `src/components/`: dashboard, habit card, dialogs, auth screens. `ui/` holds the shadcn primitives

## Scripts

`npm run dev` · `npm run build` · `npm test` · `npm run typecheck`

## Grok Build skills

`.grok/skills/` holds project skills. Grok Build loads them at session start.
