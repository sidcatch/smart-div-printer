# Privacy Policy — Smart Div Printer

_Last updated: 2026-09-19_

> **Before submitting:** host this file somewhere publicly accessible (e.g. GitHub Pages, or the raw GitHub URL such as `https://raw.githubusercontent.com/<you>/<repo>/main/store-listing/PRIVACY_POLICY.md`, or a rendered GitHub Pages link) and paste that URL into the "Privacy policy URL" field in the Chrome Web Store Developer Dashboard. A plain link to a file inside a private repo does **not** satisfy the requirement — the page must be reachable without authentication.

## Overview

Smart Div Printer ("the extension") is a browser extension that lets users visually select part of a webpage to print in a clean layout, or mark it to be hidden from all future prints of that site. This policy explains what data the extension accesses, how it is used, and how it is stored.

## What data the extension accesses

While active, the extension can read and modify the content (DOM) of the webpage currently open in your browser tab. This access is used only to:

- Highlight and identify the element you are hovering over or have selected.
- Build a cleaned-up copy of your selection for printing (removing hidden elements, inlining necessary styles, expanding scrollable content, and converting canvases to images).
- Apply visual markers to elements you have previously chosen to hide from print.

## What data is stored, and where

The extension stores the following information using `chrome.storage.local`, which keeps data **only on your device**:

- **Hidden element list** — for each website (identified by hostname), the CSS selector, a short description, and the enabled/disabled state of every element you've chosen to hide from print.
- **User preferences** — toggle settings such as whether to skip the unsaved-changes print warning, and whether to preserve parent element styling when printing.

None of this data is transmitted anywhere. The extension does not have a backend server, does not make network requests, and does not use analytics or crash-reporting SDKs.

## What data is NOT collected

The extension does not collect, transmit, sell, or share:

- Browsing history
- Personally identifiable information (name, address, email, etc.)
- Financial or payment information
- Health information
- Authentication credentials or passwords
- Web page content, beyond the transient, local, in-browser processing described above

## Data sharing

The extension does not share any data with third parties, because it does not transmit any data off of your device in the first place.

## Data retention and deletion

- Hidden-element lists and preferences persist in `chrome.storage.local` until you remove them yourself (via the "Clear All" / per-item delete controls in the popup) or uninstall the extension.
- Uninstalling the extension removes all data stored by it, per Chrome's standard extension storage behavior.

## Permissions

See [PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md) for a detailed explanation of why each manifest permission (`activeTab`, `scripting`, `storage`, and the `<all_urls>` host permission) is required.

## Changes to this policy

If this policy changes, the updated version will be published at the same URL with a revised "Last updated" date.

## Contact

For privacy questions or concerns, contact: `flymangun@gmail.com`.
