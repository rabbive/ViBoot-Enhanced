# AGENTS.md

## Cursor Cloud specific instructions

### Overview

ViBoot Enhanced is a Chrome/Firefox browser extension (Manifest V3) that enhances the VTOP university portal. It is plain vanilla JavaScript with no build step, no bundler, and no framework.

### Testing

Run the test suite with:

```
node tests/run_tests.js
```

The tests require `jsdom` (installed via `npm install` in the workspace root). They validate JS syntax, manifest compliance, Firefox compatibility, URL patterns, cross-browser API usage, MV3 compatibility, security regressions, and DOM helper functions.

### Loading the extension in Chrome

1. Open `chrome://extensions`, enable Developer mode.
2. Click "Load unpacked" and select the `/workspace` directory.
3. The popup UI is accessible via the extension icon in the toolbar.

### Key caveats

- There is no `package.json` checked into the repo (it is gitignored). The update script creates one and installs `jsdom` on every run.
- There is no lint tool configured in the project. The test suite covers syntax validation and security pattern checks which serve a similar purpose.
- There is no build step. The extension loads raw JS files directly.
- Full end-to-end testing of content scripts requires access to a VTOP portal (`vtop.vit.ac.in`, `vtopcc.vit.ac.in`, or `vtop.vitbhopal.ac.in`) with university credentials, which is not available in the cloud environment.
