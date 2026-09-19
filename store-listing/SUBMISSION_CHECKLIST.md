# Chrome Web Store Submission Checklist

## 1. One-time setup

- [ ] Create/sign in to a Google account for publishing.
- [ ] Register as a Chrome Web Store developer at the [Developer Dashboard](https://chrome.google.com/webstore/devconsole) (one-time $5 USD registration fee).

## 2. Assets to prepare

- [ ] Add screenshots to [screenshots/](./screenshots/) — see [screenshots/PLACEHOLDER.md](./screenshots/PLACEHOLDER.md) for exact size requirements.
- [ ] Add a small promo tile (**required** for a public listing) to [promo-images/](./promo-images/) — see [promo-images/PLACEHOLDER.md](./promo-images/PLACEHOLDER.md).
- [ ] Confirm `icon16.png`, `icon32.png`, `icon48.png`, `icon128.png` exist in the repo root and are referenced in [manifest.json](../manifest.json) (they already are).
- [ ] Host [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) at a public URL (GitHub Pages, raw GitHub link, or your own site).

## 3. Bump version and build

- [ ] Update `"version"` in [manifest.json](../manifest.json) (semantic versioning, e.g. `2.0.0` → `2.0.1`).
- [ ] Run the build:
    ```powershell
    npm run build
    ```
- [ ] Sanity-check the output in `dist/` by loading it as an unpacked extension in `chrome://extensions` (Developer mode → Load unpacked → select `dist/`).

## 4. Package

- [ ] Zip the **contents** of `dist/` (not the `dist` folder itself):
    ```powershell
    Compress-Archive -Path dist\* -DestinationPath smart-div-printer.zip -Force
    ```
- [ ] Confirm the zip is under the 2 GB store limit (it will be a few KB — not a concern here) and that `manifest.json` sits at the root of the zip.

## 5. Create/update the listing in the Dashboard

- [ ] Click **New Item** (first submission) or select the existing item (updates), then upload `smart-div-printer.zip`.
- [ ] **Store listing tab** — paste content from [STORE_LISTING.md](./STORE_LISTING.md):
    - [ ] Title, summary, detailed description
    - [ ] Category: Productivity
    - [ ] Language
    - [ ] Upload screenshots
    - [ ] Upload promo tile(s)
    - [ ] Support/homepage URL
- [ ] **Privacy practices tab** — paste content from [PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md) and [DATA_SAFETY.md](./DATA_SAFETY.md):
    - [ ] Single purpose description
    - [ ] Justification for `activeTab`
    - [ ] Justification for `scripting`
    - [ ] Justification for `storage`
    - [ ] Justification for host permissions (`<all_urls>`)
    - [ ] Privacy policy URL
    - [ ] Data usage disclosures / certifications
    - [ ] Test instructions (paste from [PERMISSIONS_JUSTIFICATION.md](./PERMISSIONS_JUSTIFICATION.md), if the dashboard shows this field)
- [ ] **Distribution tab** — choose visibility: Public, Unlisted, or Private (trusted testers), and select countries/regions if restricting availability.

## 6. Submit

- [ ] Click **Submit for review**.
- [ ] Expect review to take anywhere from a few hours to a few days (broad host permissions like `<all_urls>` can extend review time).
- [ ] Watch the developer email/dashboard for rejection reasons (most common: unclear permission justification, missing privacy policy, or misleading screenshots) and resubmit if needed.

## 7. After approval

- [ ] Verify the live listing looks correct and install it fresh to confirm it works end-to-end.
- [ ] For future updates: bump the version, rebuild, re-zip, and upload the new package to the **same** item — do not create a new listing.
