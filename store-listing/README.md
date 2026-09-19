# Chrome Web Store Submission Kit

Everything needed to publish **Smart Div Printer** to the Chrome Web Store lives in this folder.

## Contents

| File                                                           | Purpose                                                                                                                           |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [STORE_LISTING.md](./STORE_LISTING.md)                         | Copy-paste text for the listing form: title, summary, full description, category, language.                                       |
| [PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md) | Answers for the "Permissions" tab — single purpose statement + a justification per manifest permission.                           |
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md)                       | Hosted privacy policy text. Chrome requires a **public URL** to this before it will let you request `storage`/`host_permissions`. |
| [DATA_SAFETY.md](./DATA_SAFETY.md)                             | Answers for the "Privacy practices" data-disclosure questionnaire in the Developer Dashboard.                                     |
| [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md)           | Step-by-step: build, package, upload, fill forms, submit, update.                                                                 |
| [screenshots/](./screenshots/)                                 | Drop your 1280x800 (or 640x400) listing screenshots here.                                                                         |
| [promo-images/](./promo-images/)                               | Drop your promo tile images here (small tile is required for a public listing).                                                   |

## Quick start

1. Read [SUBMISSION_CHECKLIST.md](./SUBMISSION_CHECKLIST.md) top to bottom.
2. Add your screenshots and promo images to the two placeholder folders (see the `PLACEHOLDER.md` in each for exact size/format requirements).
3. Host [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) somewhere public (e.g. a GitHub Pages page or the raw GitHub URL) and copy that URL into the Dashboard's "Privacy policy" field.
4. Run `npm run build`, zip the `dist/` folder contents, and upload via the [Developer Dashboard](https://chrome.google.com/webstore/devconsole).
5. Paste in the copy from `STORE_LISTING.md`, `PERMISSIONS_JUSTIFICATION.md`, and `DATA_SAFETY.md` where prompted.
