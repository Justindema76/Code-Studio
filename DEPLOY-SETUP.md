# Code Studio — one-time WordPress deployment setup

The WordPress plugin source lives in `justinnovate-code-studio/`.

Your saved banners, Builder Elements, presets and settings remain in the WordPress database. Deploying the plugin files from GitHub replaces code files only; it does not delete those saved records.

## One-time GitHub secrets

In GitHub open **Code-Studio → Settings → Secrets and variables → Actions → New repository secret** and add:

- `FTP_SERVER` — your HostPapa FTP/FTPS host.
- `FTP_USERNAME` — the FTP username that can access the WordPress files.
- `FTP_PASSWORD` — that FTP account password.
- `FTP_PLUGIN_DIR` — the remote directory of the installed plugin, ending in `/`. Example only: `/public_html/wp-content/plugins/justinnovate-code-studio/`.

The exact remote path depends on the FTP account's root. If FileZilla/cPanel already opens inside `public_html`, the value may instead be `/wp-content/plugins/justinnovate-code-studio/`.

## Normal workflow after setup

1. Change Code Studio files in this repository.
2. Push/commit to `main`.
3. GitHub Actions automatically uploads only the plugin files to the existing WordPress plugin directory.
4. Refresh `/code-studio/`.

You no longer need to create and reinstall a ZIP for normal code updates.

## Safety

The workflow deliberately uses `dangerous-clean-slate: false`, so deployment does not wipe the remote plugin folder before uploading.
