# 🦊 ViBoot-Enhanced for Firefox

This document explains how to run ViBoot-Enhanced in Firefox using the Firefox-focused extension build in this repository.

## Current status

- Firefox-focused manifest and background configuration are in place.
- Core VTOP enhancement features are available.
- **Google Calendar sign-in/sync is disabled in Firefox** for compatibility.

## Requirements

- Firefox (latest stable recommended for broad compatibility)
- Access to one of:
  - `vtop.vit.ac.in`
  - `vtopcc.vit.ac.in/vtop`
  - `vtop.vitbhopal.ac.in/vtop`

## Install in Firefox (temporary, for local testing)

1. Open Firefox.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on**.
4. Select this project's `manifest.json`.
5. Open VTOP and use the extension popup/icon as usual.

> Note: Temporary add-ons are removed when Firefox restarts.

## Feature availability in Firefox

### Works

- Page enhancements (navigation and UI helpers)
- File download helpers for course/assignment resources
- Attendance, marks, exam schedule, and timetable page augmentations

### Disabled

- Google sign-in in popup
- Google Calendar token-based sync workflows

The popup explicitly shows that sign-in is disabled in Firefox.

## Troubleshooting

- If scripts do not run, verify the page URL matches one of the VTOP domains above.
- If downloads are not renamed/foldered as expected, confirm Firefox download settings allow extension handling.
- If you previously signed in on another browser build, clear extension storage and reload.

## Development notes

- This Firefox build uses a Firefox-specific manifest path and gecko ID.
- Keep any new API usage within Firefox WebExtensions compatibility scope.
