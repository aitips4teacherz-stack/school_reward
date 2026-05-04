# Class Card Battles

A production-ready classroom card battle app built with React, Vite, Supabase Auth, Postgres, and Storage.

## No-Install Free Setup

You do not need to install anything on your school computer. Netlify installs dependencies and builds the React app in the cloud, and Supabase hosts the backend on its free tier.

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. Open the Supabase SQL Editor and run the numbered files in `supabase/chunks/` in order. They are split into under-100-line parts for copy/paste limits. If your editor allows long files, you can run `supabase/schema.sql` instead.
3. Copy your Supabase project URL and anon public key from Project Settings > API.
4. Upload this project to a GitHub repository using GitHub's website.
5. Create a free Netlify site from that GitHub repository.
6. In Netlify, set:
   - Build command: `npm run build`
   - Publish directory: `dist`
7. Add these Netlify environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
8. Deploy the site.

The SQL creates private Supabase Storage buckets for `drawings`, `cards`, and `avatars`. The app stores object paths in `image_url` and renders private images through signed URLs after RLS-filtered reads.

## Account Setup

This app uses three account types:

- Admins sign in with username and password.
- Teachers sign in with username and a password created by an admin.
- Students sign in with username and a 6 digit password created by their teacher.

The browser app cannot safely create or delete Supabase Auth users by itself. Admin, teacher, and student account actions run through `netlify/functions/admin-users.js`, which uses `SUPABASE_SERVICE_ROLE_KEY` on Netlify's server side only. Supabase still stores hidden internal auth emails, but users only see usernames.

To create the first admin:

1. Deploy the site to Netlify with `SUPABASE_SERVICE_ROLE_KEY` set.
2. Open the login page.
3. Choose Admin.
4. Click `Set up first admin`.
5. Sign in with:

```txt
Username: admin
Password: LDBBadmin1007~
```

The bootstrap button only creates the first admin if no admin profile exists. After that, use the admin dashboard to create teacher accounts, reset teacher passwords, and delete teacher accounts. Teachers can create, edit, delete, lock, and reset passwords for students in their class.

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

The app uses Supabase password authentication behind a username-based classroom login. The app converts usernames to hidden internal auth emails like `username@classcard.app`, so students and staff do not need real email addresses.

## Main Routes

- `/login` role-based username login
- `/onboarding` create profile
- `/student` student dashboard
- `/teacher` teacher dashboard
- `/deck` deck builder
- `/battle` turn-based battle
- `/leaderboard` class leaderboard
