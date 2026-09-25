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

1. Use the **dedicated JustInnovate Supabase project**. Do not apply the migration in
   FantasyIntel or JustConsignIN.
2. Run `supabase/migrations/20260925140000_code_studio.sql` against that project.
   The migration creates owner-restricted rows and an image bucket.
3. Enable Email authentication and create/invite your user in that project's Auth
   settings. The app does not expose public sign-up.
4. Copy `.env.example` to `.env` and enter the project's URL and **publishable**
   key. Never use a secret or service role key in this frontend.
5. Run `npm ci && npm run dev`. For a production build, run `npm run build`;
   deploy the `dist/` directory to a static host with the same two build-time
   environment values. This can be GitHub Pages (build with `--base /Code-Studio/`
   for the repository subpath) with an Actions build, or another
   static host. Set the Auth site's allowed redirect URL to the chosen domain.

The standalone app uses hash routes such as `#/edit/{id}/en`, so a static host
does not need server-side route rewrites. Keep the WordPress instance untouched
until its saved project JSON has been backed up and imported.
