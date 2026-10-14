# Session notes — Oct 13–14, 2026 (pick up tomorrow)

## Rules (from Justin)
- **Live code** (anything pasted into the website, the live site itself): never change without explicit approval. Name the file first.
- **Previews**: just do them (build, push, open).
- A question = answer only. Describing how you want it = go.
- Don't test every little thing unless asked.

---

## 1. Code Studio standalone redesign — IN PROGRESS (main focus)
- Repo `Justindema76/Code-Studio`, folder `standalone/`, branch **`standalone-redesign`** (pushed, NOT published).
- Run it locally: `cd ~/Desktop/apps/Code-Studio/standalone && npm run dev` → http://127.0.0.1:5179 (the vite port may differ; it prints the URL).
- Published version (GitHub Pages, justindema76.github.io/Code-Studio) is still the old **blank** one. Merging the branch into `main` publishes the new one — only when Justin says.
- Purpose: Justin's own product, standalone so he can **show people**. Wheels uses it.

**Done on the branch**
- No login; projects saved in the browser; sample "Homepage slider" project (comes back when the list is empty).
- New editor: click a piece to edit it; all old controls kept, grouped by piece (Red label, Heading, Small text, Button, Text box, Background) + Slider settings.
- Show Desktop | Phone | Both (remembered). Desktop Hero 893 / Full width 1290; Phone 345.
- Drag moves only the **whole text box**, stays inside the banner, snaps to centre/margins with crosshairs (pink when snapped). Per-piece moving removed; "Line it all up" button clears old nudges.
- Picture: click background → drag to move, corner handles / mouse wheel to resize, crosshairs + edge snapping; desktop and phone separate.
- Desktop/Phone values side by side with 🔗 link.
- Phone shortcut "Under the picture" = text to bottom, centred, clears phone nudges (does NOT change picture/gradient).
- Translate EN → FR button back (free MyMemory service), on the FR tab.
- Embed code identical to the WordPress plugin's (engine copied unchanged).

**Open / to decide**
- Justin said STOP when I offered to change how pictures are placed (CSS background vs real `<img>`). **Nothing changed. Don't bring it up again unless he does.**
- Adobe Commerce extension: only after the prototype is final. Install needs a developer (Composer + deploy; Wheels = Adobe Commerce Cloud → Hafiz deploys). WordPress plugin is the easier market.
- WordPress plugin (`justinnovate-code-studio/`, auto-deploys live on push to main) — untouched; redesign goes there after the standalone is approved.

## 2. Nav bar redesign — handed off
- Previews: `Homepage-Redesign/10 NAV BAR/` (NAV-0 … NAV-5; **NAV-5-rona-side-menu-CURRENT** is the one).
- Code branch **`feature/nav-redesign`** in `Justindema76/Wheels-Staging-Justin` (built from Hafiz's `feature/phase2-composer-cleanup`). Step-by-step README: `docs/README.md`.
- Repo is private → add **hafizmuzamal422** as collaborator (Read) so he can open it. Ask Hafiz which branch to merge into.
- Desktop only; phones unchanged. CMS blocks to create: `header-quick-links`, `side-menu-popular`, `account-links-group-<ID>` (Rafih).

## 3. Homepage (Wheels) — small leftovers
- Popular Products CSS restored (PART 1 + PART 2) + scroll bar code added in `3 POPULAR PRODUCTS/POPULAR-PRODUCTS-CSS.html` — Justin pastes it live himself.
- Section title red underline code was given in chat (Site Styles element, row 5) — not saved to the repo file (Justin stopped it).
- Motorcycle banner typo on live site: "Motorcylcyle" → "Motorcycle".
- Phone: slider arrows sit on top of the text.
- Site Styles width still 1320 in the repo (Justin wanted 1400).

## 4. Other
- Harjas's mobile question: the live site is fine on phones; she was looking at the old Code Studio editor's canvas.
- Early designs recovered: `Homepage-Redesign/EARLY DESIGNS/`.
- Code Studio redesign previews: `Code-Studio-Redesign/` (preview 1 simple, preview 2 all controls).
- Deleted old `Plate-Cover-Designer/` folder (still in git history).

## Update (end of day)
- Standalone is now **published** at https://justindema76.github.io/Code-Studio/ from branch `standalone-redesign` (GitHub Pages Source = GitHub Actions; every push to that branch updates the site). `main` / WordPress plugin untouched.
- Existing banners move over one at a time: old Code Studio → Copy project JSON (or embed code) → standalone → More → Load code / project → Save (repeat on FR / USA tabs).
- **Tomorrow: talk about the Adobe Commerce extension** (getting the name out there).
