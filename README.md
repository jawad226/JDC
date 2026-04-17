This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API service layer (Express)

- **Env:** [`.env.example`](./.env.example) → copy to `.env.local` and set `NEXT_PUBLIC_API_URL` (no trailing slash).
- **Axios:** [`src/lib/api/axios.config.ts`](./src/lib/api/axios.config.ts) — `apiClient`, Bearer from **`accessToken`** cookie, headers `X-Client-Platform: web`, `X-Client-Version`.
- **Paths:** [`src/lib/api/api-base-urls.ts`](./src/lib/api/api-base-urls.ts).
- **HTTP:** [`src/lib/api/axios-request-handler.ts`](./src/lib/api/axios-request-handler.ts) — `apiGet` / `apiPost` / `apiPut` / `apiDelete`.
- **Example:** [`src/services/user.service.ts`](./src/services/user.service.ts) — `getCurrentUserProfile()`.

**Auth integration:** Sign-in and register call the Express API ([`src/services/auth.service.ts`](./src/services/auth.service.ts)). Login stores **`accessToken`** + `auth-role` / `auth-user-id` via [`authSession.ts`](./src/views/auth/authSession.ts). Forgot/reset password uses the backend OTP + `resetUserId` cookie (keep requests on the same browser, `withCredentials: true`).

**Demo data:** The seeded user roster and sample tasks were removed from [`src/lib/store.ts`](./src/lib/store.ts). Clock-in, timesheets, tasks, messaging, and similar features still use **local persisted state** until you add matching backend APIs and sync them.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
