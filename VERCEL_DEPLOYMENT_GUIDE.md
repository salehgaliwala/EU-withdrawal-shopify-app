# Deploying Shopify Remix App to Vercel

This guide provides step-by-step instructions for deploying your Shopify Remix app to Vercel.

## Prerequisites

- A [Vercel account](https://vercel.com/).
- A [Shopify Partner account](https://partners.shopify.com/) and a development store.
- A hosted PostgreSQL database (e.g., [Neon](https://neon.tech/), [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), or [Railway](https://railway.app/)).

## 1. Database Setup

Vercel uses a serverless environment with an ephemeral filesystem, so the default SQLite database will not persist data. You must switch to a hosted PostgreSQL database.

1. Create a PostgreSQL database on your preferred provider.
2. Get your `DATABASE_URL` (e.g., `postgresql://user:password@host:port/dbname`).
3. Update your `prisma/schema.prisma` file to use the `postgresql` provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. Run the following command to generate the Prisma client for PostgreSQL:
   ```bash
   npx prisma generate
   ```

## 2. Configure Environment Variables

You will need to set the following environment variables in your Vercel project settings:

| Variable | Description |
| :--- | :--- |
| `SHOPIFY_API_KEY` | Your app's Client ID from the Shopify Partner Dashboard. |
| `SHOPIFY_API_SECRET` | Your app's Client Secret from the Shopify Partner Dashboard. |
| `SHOPIFY_APP_URL` | The HTTPS URL of your Vercel deployment (e.g., `https://your-app.vercel.app`). |
| `SCOPES` | The scopes required by your app (e.g., `write_products,write_orders`). |
| `DATABASE_URL` | Your production PostgreSQL connection string. |
| `NODE_ENV` | Set to `production`. |

## 3. Shopify Partner Dashboard Configuration

1. Log in to your [Shopify Partner Dashboard](https://partners.shopify.com/).
2. Select your app.
3. Go to **App Setup**.
4. Update the **App URL** to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
5. Update the **Allowed redirection URL(s)**:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/auth/shopify/callback`
6. (If using App Proxy) Update the **Proxy URL** in the **App Proxy** section to `https://your-app.vercel.app/api/withdrawal`.

## 4. Vercel Project Setup

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket).
2. Import the project into Vercel.
3. In the **Build & Development Settings**, ensure the following:
   - **Framework Preset**: Remix (Vercel will usually detect this).
   - **Build Command**: `npm run build` (or `pnpm run build` / `yarn build`).
   - **Install Command**: `npm install` (or `pnpm install` / `yarn install`).
4. Add the **Environment Variables** identified in Step 2.
5. Click **Deploy**.

## 5. Code Changes (Applied in this PR)

The following changes have already been applied to optimize the app for Vercel:

- **`vite.config.ts`**: Added the `vercelPreset()` to the Remix plugin.
- **`app/shopify.server.ts`**: Switched from the `node` adapter to the `vercel` adapter.
- **Dependency**: Added `@vercel/remix` to `package.json`.
- **Imports**: Updated application imports to `@vercel/remix` where appropriate, while maintaining `@remix-run/node` for server-side utilities like `createReadableStreamFromReadable` to ensure full compatibility.

## 6. Post-Deployment

After your first successful deployment, run the Prisma migration to set up your production database:

```bash
npx prisma migrate deploy
```

You may also need to run `npm run deploy` to update your app's configuration and extensions in Shopify.
