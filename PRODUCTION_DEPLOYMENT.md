# Production Deployment Guide: EU Right of Withdrawal App

This guide outlines the steps to deploy and embed the EU Right of Withdrawal app in a production environment.

## 1. Hosting Setup

Deploy your Remix app to a hosting provider (e.g., Heroku, Fly.io, Vercel, or a VPS).

### Environment Variables
Ensure the following environment variables are set in your production environment:

- `SHOPIFY_API_KEY`: Your app's Client ID from the Shopify Partner Dashboard.
- `SHOPIFY_API_SECRET`: Your app's Client Secret.
- `SHOPIFY_APP_URL`: The base URL of your hosted app (e.g., `https://eu-withdrawal-app.herokuapp.com`).
- `SCOPES`: `write_products,write_orders`
- `DATABASE_URL`: Connection string for your production database (PostgreSQL recommended).
- `NODE_ENV`: `production`

## 2. Database Migration

If you are using PostgreSQL in production, update your `prisma/schema.prisma` datasource provider to `postgresql` and run:

```bash
npx prisma migrate deploy
```

## 3. Shopify Partner Dashboard Configuration

Go to your App settings in the [Shopify Partner Dashboard](https://partners.shopify.com/):

### App Setup
- **App URL**: `https://your-app-domain.com`
- **Allowed redirection URL(s)**: `https://your-app-domain.com/auth/callback`, `https://your-app-domain.com/auth/shopify/callback`

### App Proxy (CRITICAL)
For the storefront button to work, you must configure the App Proxy:
1. Scroll down to **App Proxy**.
2. **Subpath prefix**: Select `apps`.
3. **Subpath**: Enter `eu-withdrawal`.
4. **Proxy URL**: Enter `https://your-app-domain.com/api/withdrawal`.

*Note: This makes the endpoint accessible at `your-store.myshopify.com/apps/eu-withdrawal/api/withdrawal`.*

## 4. Deploying the Theme App Extension

Run the following command to deploy your extension to Shopify:

```bash
npm run deploy
```

This will create a version of your extension that can be enabled in the Shopify Theme Editor.

## 5. Enable the App Block

1. Log in to the Shopify Admin of the production store.
2. Go to **Online Store > Themes > Customize**.
3. Navigate to the **Customer Account** or **Order Status** page template.
4. Click **Add block** and select **Withdrawal Button** from the Apps section.
5. Save the changes.

## 6. Verification

- Navigate to an order page in the storefront.
- Click the "Request EU Withdrawal" button.
- Fill out the form and submit.
- Check the App's Admin Dashboard to see if the request is logged.
- Check the Order in Shopify Admin to see if the `EU_WITHDRAWAL_REQUESTED` tag was added.
