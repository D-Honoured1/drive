# Drive App — Express + Prisma + Supabase Storage

This is a simplified file storage app (like a personal Google Drive) built with Express, Prisma (Postgres), Passport session-based auth, and Supabase Storage for file blobs.

## Features
- Session-based auth (Passport + local strategy)
- Password hashing with bcrypt
- Prisma ORM models (User, Folder, File, ShareLink, Session)
- File upload via multer → stored in Supabase Storage (server-side upload with service key)
- Signed download URLs and share links with expiry
- EJS views: register/login, dashboard, folder view, share view
- Prisma-backed session store (persistent sessions)

## Quick start (development)
1. `cp .env.example .env` and fill values (see below).
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate dev --name init`
5. `node prisma/seed.js` (creates a demo user if configured)
6. `npm run dev`
7. Open `http://localhost:3000`

## Supabase
- Create a Supabase project.
- Enable Storage -> create bucket named in `SUPABASE_BUCKET` (default `uploads`).
- Get `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and **Service Role Key** (store in `SUPABASE_SERVICE_KEY`).
- Copy your Postgres connection string to `DATABASE_URL`.

More detailed steps are included in the Step-by-Step Guide in the repository.

## Security & production notes
- Use HTTPS and set session cookie `secure: true` in production.
- Rotate Supabase service role key regularly.
- Use private storage buckets and signed URLs for downloads (recommended).

