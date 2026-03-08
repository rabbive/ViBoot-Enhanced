# 🧭 ViBoot-Enhanced for Safari

This document describes how to run ViBoot-Enhanced on Safari using Apple's Web Extension conversion workflow.

## Current status

- A dedicated Safari manifest is included: `manifest.safari.json`.
- A separate Safari extension package can be generated via `scripts/build_safari_extension.sh`.
- Google sign-in/sync is currently not part of the Safari path in this project.

## Requirements

- macOS
- Xcode (for building/signing Safari extensions)
- Safari
- Command-line tools (`xcrun`)

## Build separate Safari extension package

From the project root, run:

```bash
./scripts/build_safari_extension.sh
```

This creates a Safari-specific extension directory at:

- `dist/safari-extension`

That directory uses `manifest.safari.json` as its `manifest.json`.

## Convert the Safari package to Xcode

From the project root, run:

```bash
xcrun safari-web-extension-converter ./dist/safari-extension --project-location ./safari
```

## Build and run in Safari

1. Open the generated Xcode project in `./safari`.
2. Choose a development team for signing.
3. Build and run the host app once.
4. Open Safari > Settings > Extensions.
5. Enable the generated ViBoot-Enhanced extension.
6. Grant website permissions for VTOP domains.

## Recommended website permissions

- `vtop.vit.ac.in`
- `vtopcc.vit.ac.in`
- `vtop.vitbhopal.ac.in`

Use "Allow on specific websites" or equivalent Safari permission settings.

## Expected compatibility notes

Safari WebExtensions API coverage differs from Chrome/Firefox. The following should be verified during Safari QA:

- Download filename interception/custom foldering behavior
- Certain request-observer behaviors
- Any flow depending on Google extension identity APIs

## Suggested Safari validation checklist

1. Load VTOP home and confirm navbar/page enhancements apply.
2. Open attendance/marks/exam/timetable pages and verify injected UI.
3. Trigger file downloads and verify behavior is acceptable.
4. Confirm no popup/runtime errors in Safari Web Inspector.

## Publishing (optional)

To distribute on Safari, follow Apple's notarization/App Store process for Safari extensions via Xcode.
