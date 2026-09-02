## 0.3.17
- Fixes corrupted title text such as `IDEASn&` from older imports.
- Preserves real line breaks entered in Heading/Sub-heading fields.
- Does not insert a line break unless one exists in the field.

# Justinnovate Code Studio — Version 0.2.1 (Banner element)

## Install
1. Zip this folder (or upload the folder directly via SFTP/cPanel) into `wp-content/plugins/justinnovate-code-studio/`.
2. Activate it under **Plugins** in wp-admin.
3. A new **Builder Elements** menu appears in the sidebar — that's where your banners live (it's a hidden/non-public post type used only for storage).
4. Click **Add New Banner**, then use the **Edit with Builder** row action to open the full-screen canvas editor.
5. Design the banner, click **Save** (top right, or Ctrl/Cmd+S).
6. In any page/post, add the **Banner** block (search "Banner" in the block inserter) and pick the banner you built.

## What's actually working right now
- Full-screen custom canvas editor (own URL, no wp-admin chrome), ported from your Justinnovate Code Studio tool — same drag-to-position image, gradient stop editor, content background/shadows, button hover, desktop/mobile split, multi-slide management with delete, color swatches.
- Data is saved via REST (`jcs/v1/element/{id}`) as JSON on a `jcs_element` post — not copy-pasted.
- A real **PHP renderer** (`includes/class-jcs-render.php`) outputs the frontend markup server-side, so the banner shows up correctly with JavaScript disabled and doesn't depend on the editor's JS to exist on the live page.
- Shared frontend CSS/JS (`assets/frontend.*`) is enqueued once regardless of how many banners are on a page — supports multiple banners per page without ID collisions.
- **Load code / project** imports raw project JSON, newly exported Justinnovate code, Wheels Banner Studio code with embedded project data, and older Wheels/JCS slider markup. Imported work can then be saved normally in WordPress.
- **Copy project JSON** creates a compact editable backup. Newly exported embed code also contains its project data in a comment so it can round-trip back into the studio.
- Full standalone-builder workflow is available inside WordPress: Live preview, New blank, Load code/project, Copy project JSON, copyable self-contained embed code, per-banner duplicate/add/remove, desktop/mobile typography copying, complete overlay blend modes, and normal WordPress saving.
- Fixed the PHP 8 fatal error on REST saves by replacing the one-argument `is_numeric` callback with a WordPress-compatible three-argument validator.
- A dynamic Gutenberg block (`jcs/banner`) is the only way to insert a banner into content; it's intentionally a thin picker, not a design surface.

## Known gaps / next steps (in rough priority order)
1. **JS/PHP render parity isn't automatically tested.** They're hand-kept-in-sync right now. If you add a new visual control to `editor/js/editor.js`, you must add the matching output to `includes/class-jcs-render.php` or it'll show correctly in the editor but wrong on the live page. Worth writing a small parity check (render both, diff) before this grows past one block type.
2. **No image picker.** Image fields are raw URL inputs — wiring up the WP Media Library (`wp.media` frame) is a fairly small addition and the highest-value next step before anyone but you uses this.
3. **No autosave / revision history.** Elementor-style builders lean on this heavily; right now a browser crash before you hit Save loses your work (there is a "leave without saving" browser warning at least).
4. **The block editor picker (`block/index.js`) is unbuilt/unminified vanilla JS** using `window.wp` globals directly — fine for now, but if this grows you'll want a proper `@wordpress/scripts` build step.
5. **No licensing/update mechanism** — needed before this is actually sellable/distributable, not before that.
6. **Second element type** is the real test of the architecture — don't add it until you've used the banner block on a couple of real pages and are confident the schema/registry split (CPT storage + REST + PHP renderer) is holding up.

## Architecture in one paragraph
Each banner is a `jcs_element` post whose only real content is a JSON blob in post meta (`_jcs_data`) — the same slide-array shape your original tool used. The custom editor (`editor/js/editor.js`) loads that JSON, lets you edit it, and saves it back via REST. The Gutenberg block is just a reference to a banner ID; on the front end, `JCS_Render::render()` reads the same JSON and outputs plain HTML/CSS — no JS required to see the banner, only to make the slider interactive.



## 0.3.7
- Desktop and Mobile height fields now update the working canvas immediately as you type.
- The canvas uses the exact saved pixel height; 700 means 700px in the generated output and the editor preserves that exact aspect ratio.
- Live Preview refreshes immediately from the same height values.
- Expanded editable height range to 200–1600px for both desktop and mobile.

## 0.3.6
- Fixed the editor canvas to use the banner's actual saved Desktop height and Mobile height instead of hard-coded 490/620 preview heights.
- Live Preview device frame now matches the exact generated output dimensions (for example 390 x 400), removing the misleading extra white preview area.

## Exact-output editor canvas fix
- The Desktop and Mobile editor canvases now render the same generated HTML/CSS used by **Copy embed code**.
- There is no separate approximation renderer for the working canvas.
- Mobile editing uses a real 390px viewport and the saved Mobile height; Desktop uses the selected browser width and saved Desktop height.
- The rendered output is only scaled as a whole to fit the editor workspace; its internal layout, text wrapping, image positioning, spacing, and responsive CSS are unchanged.
- The separate Live Preview button was removed because the working canvas itself is now the output preview.


## 0.3.8
- Renamed the WordPress admin menu to Code Studio with clearer Banner labels.
- Added an admin-managed font library in Studio Settings.
- Added separate font selectors for Heading, Sub-heading, Eyebrow and Button content.
- Added a larger starter font library and automatic Google Fonts loading.



## 0.3.16
- Expanded text block width control to 1900px.
- Added exact text block width number input.
- Increased usable content width to 98% desktop / 96% mobile so long headings and sub-headings do not get forced into narrow columns.

## 0.3.11
- Expanded typography controls for converting complex image banners into editable banners.
- Added independent eyebrow, heading, sub-heading, and button font sizes.
- Added independent letter spacing controls.
- Added separate text alignment from block position.
- Added per-element horizontal and vertical fine-position controls for desktop and mobile.
- Added optional fixed button width and expanded content width to 1400px.
- Increased heading/sub-heading size ranges for oversized promotional typography.

## 0.3.9
- Expanded horizontal content shift to -1000px / +1000px with exact numeric entry.
- Added independent 300-900 font weight controls for heading, sub-heading, eyebrow, and button.


## 0.3.16
- Added one-click 480 / 800 / 1200 / MAX text-block width presets.
- Corrected PHP frontend renderer width cap from 90% to 98% to match the editor/export renderer.

## 0.3.16
- Added button open-in-new-tab option.
- Added separate desktop/mobile background links and new-tab options.
- Added independent desktop/mobile content visibility for image-only banners.
- Background artwork now exports as true CSS background images and is locked in the editor.
- Restored actual-output Live Preview (mobile/tablet/desktop).
- Reorganized editor tabs and widened/cleaned the control panel.


## 0.3.16
- Live Preview now opens a real resizable browser preview window and updates while you edit.
- Embedded preview is forced to the exact configured banner height with no fake white area.
- Slider root now has an explicit desktop/mobile height and hidden slides cannot reserve extra vertical space.
- Background layer is hardened to fill the banner height.


## 0.3.16
- Added 100% width/custom desktop background sizing so designed banner artwork keeps the same composition across desktop widths.
- Live Preview now opens at the current browser width and is clipped to the actual banner instead of showing a fake white page below it.
