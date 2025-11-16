This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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

## Deployment

This Next.js application can be deployed to various platforms. Here are the most popular options:

### Deploy on Vercel (Recommended)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

**Steps:**
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository on [Vercel](https://vercel.com/new)
3. Vercel will automatically detect Next.js and configure the build settings
4. Click "Deploy" and your app will be live in minutes

**Environment Variables:**
- Copy `.env.example` to `.env.local` for local development
- Add environment variables in the Vercel dashboard under Project Settings > Environment Variables

### Deploy on Netlify

1. Push your code to a Git repository
2. Go to [Netlify](https://app.netlify.com/start) and import your repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Click "Deploy site"

### Deploy on Railway

1. Push your code to a Git repository
2. Go to [Railway](https://railway.app/) and create a new project
3. Connect your repository
4. Railway will auto-detect Next.js and deploy

### Deploy with Docker

Build and run with Docker:

```bash
# Build the image
docker build -t nextjs-app .

# Run the container
docker run -p 3000:3000 nextjs-app
```

### Self-Hosting

Build and start the production server:

```bash
npm run build
npm start
```

The application will be available at `http://localhost:3000`.

For more deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
