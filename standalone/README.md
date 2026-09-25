# Standalone Code Studio

This is the standalone version of the existing WordPress Code Studio banner editor.
It uses the same editor controls and slide JSON, but stores projects in Supabase.
The WordPress plugin remains in `../justinnovate-code-studio/` and is not changed.

## What works

- Email/password sign in through Supabase Auth.
- Owner-only banner projects with English, French, and USA variants.
- Existing canvas controls, slide management, preview, embedded HTML export, and project JSON import.
- PNG/JPEG/WebP/GIF uploads to Supabase Storage; URL fields also accept existing remote images.
- Download an account-wide JSON backup and import that backup or a legacy slide-array JSON export.

The old WordPress data does **not** automatically appear. Import an exported project JSON
or a backup extracted from WordPress after regaining access. Existing image URLs must
remain reachable; upload images into this app for independence from the old host.
French auto-translation is hidden until a separate translation service is connected.

## Configure

1. The app uses the existing **JustConsignIN** Supabase project inside the
   **JustInnovate** organization. Its Code Studio table and image bucket are
   separate from consignment data. The migration in
   `supabase/migrations/20260925140000_code_studio.sql` has been applied.
2. Enable Email authentication and create/invite your user in that project's Auth
   settings. The app does not expose public sign-up.
3. For local development copy `.env.example` to `.env` and set the same
   project URL and publishable key. The committed `.env.production` includes
   only the browser-safe publishable key; never use a secret/service role key.
4. Run `npm ci && npm run dev`. GitHub Actions builds the app for
   `/Code-Studio/` and deploys it to GitHub Pages.

The standalone app uses hash routes such as `#/edit/{id}/en`, so a static host
does not need server-side route rewrites. Keep the WordPress instance untouched
until its saved project JSON has been backed up and imported.
