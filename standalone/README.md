# Standalone Code Studio

The standalone version of the Code Studio banner editor, for showing people.
It opens straight in (no login) and keeps projects in the browser you use it in
(localStorage). Use **Download backup** / **Import project JSON** to move projects.

## Editor (redesign)

- Click any piece of the banner (Red label, Heading, Small text, Button, Text box,
  Background) in the Desktop or Phone preview to edit it; drag it to move it.
- Desktop (hero 893 or full width 1290) and Phone (345, the real phone width on
  wheelsauto.com) previews are always both on screen, rendered from the exact embed code.
- Every size/position control shows Desktop and Phone side by side, with a link so
  Phone can follow Desktop.
- Text box → "Under the picture" puts phone text below the photo in one click.
- Apply to all slides, Slider settings, slide reorder/duplicate/delete, gradient editor,
  overlay, links, Live preview, Load code / project, Copy project JSON, Copy embed code.

The banner engine (data model, embed code, import) in `public/editor.js` is copied unchanged
from `../justinnovate-code-studio/editor/js/editor.js`, so exported embed code is identical to
the WordPress plugin's. Keep those parts in sync.

## Run

`npm ci && npm run dev`. GitHub Actions builds for `/Code-Studio/` and deploys to GitHub Pages
when `standalone/**` changes on `main` or `standalone-supabase`.
