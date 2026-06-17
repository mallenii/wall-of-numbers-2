# Service Operations Command Center

Vercel-ready React/Vite dashboard with a serverless `/api/dashboard` route.

## Deploy on Vercel

1. Push this folder to GitHub.
2. Import the repo in Vercel.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Deploy.

The app now calls `/api/dashboard`, not `localhost`, so it works online.

## First deploy

By default, the dashboard uses mock data:

```env
USE_MOCK_DATA=true
```

This lets you confirm the page loads before adding BigQuery credentials.

## Connect BigQuery

In Vercel, go to **Project Settings > Environment Variables** and add:

```env
USE_MOCK_DATA=false
BIGQUERY_PROJECT_ID=ford-735d6478b8ce5e44e47bc620
BIGQUERY_LOCATION=US
BIGQUERY_SERVICE_ACCOUNT_JSON={full service account json here}
```

Important: never commit the real service account JSON to GitHub.

## Local development

If you ever have Node available:

```bash
npm install
npm run dev
```

But Node is not required on your laptop if you are using Vercel.
