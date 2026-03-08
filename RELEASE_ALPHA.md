# ViBoot Enhanced - Alpha Release

This page provides downloadable alpha builds for Chrome and Firefox.

## Downloads

- Chrome alpha zip: [`releases/alpha/ViBoot-Enhanced-chrome-alpha.zip`](./releases/alpha/ViBoot-Enhanced-chrome-alpha.zip)
- Firefox alpha zip: [`releases/alpha/ViBoot-Enhanced-firefox-alpha.zip`](./releases/alpha/ViBoot-Enhanced-firefox-alpha.zip)

## Browser notes

- Both builds are intended for alpha testing.
- Google sign-in / Google Calendar sync is disabled in this compatibility branch.
- Core VTOP enhancement and download helper features remain enabled.

## Install - Chrome

1. Download and unzip `ViBoot-Enhanced-chrome-alpha.zip`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the unzipped folder.

## Install - Firefox

1. Download and unzip `ViBoot-Enhanced-firefox-alpha.zip`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select `manifest.json` from the unzipped folder.

## Build command used

```bash
./scripts/build_alpha_packages.sh
```
