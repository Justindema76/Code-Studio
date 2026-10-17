# Code Studio

**A visual banner designer for Adobe Commerce (Magento), WordPress and any website.** Design a responsive hero slider or promo banner in a canvas editor, then copy one self-contained embed code and paste it anywhere: a Magento Page Builder HTML Code element, a WordPress block, or plain HTML.

I built it because Magento Page Builder's banners are hard to control on desktop and phone. **Wheels Automotive ([wheelsauto.com](https://wheelsauto.com)) uses it in production** for its homepage hero and promo banners across 3 store views (English Canada, French Canada, USA).

| Version | Where | Link |
|---|---|---|
| WordPress plugin (production) | `justinnovate-code-studio/` | https://wp.justindematteis.com/code-studio/ (sign-in required) |
| Standalone web app | `standalone/` | https://justindema76.github.io/Code-Studio/ |

---

## What it does

- **Click-to-edit canvas.** Click any piece of the banner (red label, heading, small text, button, text box, background) to edit it. Every control is grouped by piece.
- **Desktop and phone side by side.** Show Desktop, Phone or Both, at real sizes (Hero 893px, full width 1290px, phone 345px). Phone values can be linked to follow desktop.
- **Drag and snap.** Drag the text box (it stays inside the banner and snaps to the centre and margins with crosshairs). Drag its edges to change its width, or its corners to scale all the text. Drag the picture to move it; use the corner handles or the mouse wheel to resize it.
- **Multi-slide sliders** with arrows and autoplay. One-slide banners drop the controls automatically.
- **English / French / USA versions** of each banner, with a Translate EN → FR button.
- **Backgrounds:** images (separate desktop and phone images), gradient overlays with a stop editor, and blend modes.
- **Self-contained embed code.** The HTML, CSS and JS are scoped per banner, so several banners on one page never clash, and the code doesn't depend on the host theme. The project data is stored inside the embed code as a comment, so any pasted banner can be loaded back into the editor.
- **Import / backup.** Load an embed code or project JSON; copy the project JSON as a backup.

## Repository layout

```text
Code-Studio/
├── justinnovate-code-studio/     WordPress plugin (production)
│   ├── justinnovate-code-studio.php   Plugin bootstrap (version)
│   ├── editor/js/editor.js            Full-screen canvas editor + embed-code export (generateCode)
│   ├── editor/css/editor.css
│   ├── includes/
│   │   ├── class-jcs-cpt.php          Banners stored as a private "jcs_element" post type (JSON in post meta)
│   │   ├── class-jcs-rest.php         REST API: jcs/v1/element/{id}
│   │   ├── class-jcs-editor.php       Editor page at /code-studio/ (no wp-admin chrome)
│   │   ├── class-jcs-render.php       Server-side PHP renderer (works without JavaScript)
│   │   ├── class-jcs-block.php        Gutenberg "Banner" block (picker only)
│   │   ├── class-jcs-access.php       Who can open the editor
│   │   ├── class-jcs-settings.php     Plugin settings
│   │   └── class-jcs-frontend.php     Front-end CSS/JS, loaded once per page
│   ├── assets/frontend.{css,js}       Shared slider runtime
│   ├── block/index.js                 Block editor picker
│   └── README.md                      Changelog + architecture notes
│
├── standalone/                   Standalone web app (Vite)
│   ├── src/main.js, public/editor.js  Same editor engine as the plugin
│   ├── supabase/migrations/           Optional cloud storage (Supabase) schema
│   └── README.md
│
├── tools/fix-mobile-rendering.py  Editor canvas patch applied during deploy
├── DEPLOY-SETUP.md                One-time FTPS deploy set-up
└── .github/workflows/
    ├── deploy-wordpress-plugin.yml    Push to main → upload the plugin to WordPress over FTPS
    ├── package-plugin.yml             Push to main → build an installable plugin ZIP
    └── deploy-standalone.yml          Build the standalone app → GitHub Pages
```

## How the WordPress plugin works

Each banner is a `jcs_element` post whose content is a JSON blob in post meta (`_jcs_data`). The editor loads that JSON, edits it, and saves it back through the REST API. On the front end, the Gutenberg block is just a reference to a banner ID; `JCS_Render::render()` reads the same JSON and outputs plain HTML/CSS, and the shared `frontend.js` adds the slider behaviour. For Magento, "Copy embed code" outputs a self-contained version of the same banner.

## Deployment

- **Pushing to `main` deploys the plugin live** to wp.justindematteis.com over FTPS (GitHub Actions, only when files in `justinnovate-code-studio/` change). The deploy uploads code only. Saved banners stay in the WordPress database, and the remote folder is never wiped. See [`DEPLOY-SETUP.md`](DEPLOY-SETUP.md).
- New editor work is built on its own branch (for example `wp-redesign`), tested, and merged through a pull request.
- The standalone app is built with Vite and published to GitHub Pages.

## Run the standalone app locally

```bash
cd standalone
npm ci
npm run dev
```

## Version history

The plugin is at **v0.3.53**. Highlights:

- **0.3.49:** new editor: click/drag pieces, desktop and phone side by side, picture move/resize, crosshair snapping.
- **0.3.50:** drag the text box edges for width, corners to scale the text.
- **0.3.40:** Magento export fixes: duplicate-copy fix, corner radius, mobile breakpoint setting, arrows no longer above site menus.

The full changelog is in [`justinnovate-code-studio/README.md`](justinnovate-code-studio/README.md).

## Roadmap

- WordPress Media Library image picker
- Autosave and revision history
- Second element type beyond banners
- A public WordPress plugin, and an Adobe Commerce extension (an early Magento module prototype exists)

---

**Developer:** Justin DeMatteis ([justindematteis.com](https://www.justindematteis.com))
