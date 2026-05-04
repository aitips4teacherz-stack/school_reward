# Class Card Battles

A production-ready classroom card battle app built with React, Vite, Supabase Auth, Postgres, and Storage.

## No-Install Free Setup

You do not need to install anything on your school computer. Netlify installs dependencies and builds the React app in the cloud, and Supabase hosts the backend on its free tier.

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Open the Supabase SQL Editor and run `supabase/schema.sql`.
3. Copy your Supabase project URL and anon public key from Project Settings > API.
4. Upload this project to a GitHub repository using GitHub's website.
5. Create a free Netlify site from that GitHub repository.
6. In Netlify, set:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Add these Netlify environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Deploy the site.
9. In Supabase Auth settings, add your Netlify URL to allowed redirect URLs.

The SQL creates private Supabase Storage buckets for `drawings`, `cards`, and `avatars`. The app stores object paths in `image_url` and renders private images through signed URLs after RLS-filtered reads.

## Netlify Troubleshooting

If Netlify says it cannot find `/opt/build/repo/package.json`, the GitHub repo Netlify is building from does not have `package.json` at the top level.

Your repository root must contain these files directly:

- `package.json`
- `index.html`
- `vite.config.js`
- `netlify.toml`
- `src/`
- `supabase/`

Fix options:

1. If you uploaded only the `src` folder, upload the whole project folder instead.
2. If the files are inside a nested folder in GitHub, set Netlify's Base directory to that folder.
3. If you used GitHub's web upload, drag in all project files and folders together, not just the visible app code.

## Optional Local Setup

Only use this if you are on a computer where installing Node packages is allowed.

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` before running locally.

## Authentication

The app uses Supabase magic-link email login. New users land on onboarding where they create a profile. Teachers/admins should be promoted by updating `profiles.role` in Supabase or with an admin-only workflow.

## Main Routes

- `/login` magic-link login
- `/onboarding` create profile
- `/student` student dashboard
- `/teacher` teacher dashboard
- `/deck` deck builder
- `/battle` turn-based battle
- `/leaderboard` class leaderboard
