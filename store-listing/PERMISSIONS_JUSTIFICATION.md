# Permissions Justification

Chrome Web Store review requires a **single purpose description** plus a written justification for every permission and host permission declared in [manifest.json](../manifest.json). Paste these into the corresponding fields on the "Privacy practices" tab of the Developer Dashboard.

## Single purpose description

```
Smart Div Printer lets a user visually select a section of the current webpage to either print it in a clean, distraction-free layout, or mark it to be excluded from all future prints of that site. All functionality serves this single purpose: selective, cleaned-up printing of user-chosen page content.
```

## Permission justifications

### `activeTab`

```
Used to run the element-selection overlay only on the tab the user is actively viewing, and only after the user explicitly clicks the extension's toolbar icon. This avoids requesting broader, always-on access to every open tab.
```

### `scripting`

```
Used to inject the content script (content.js) into the current tab on demand, right after the user clicks "Select for PDF" or "Select to Hide from Print" in the popup. This is what draws the hover-highlight overlay, the selection controls, and builds the clean print view.
```

### `storage`

```
Used with chrome.storage.local (device-local, not synced) to remember, per website hostname, which elements the user has chosen to hide from print. This lets hidden markers and print exclusions persist across page reloads and browser restarts without any server round-trip. Also stores the user's own preference toggles (e.g. skip the unsaved-changes warning, preserve parent styling).
```

### `host_permissions: ["<all_urls>"]`

```
The extension's entire purpose is to let the user print or hide content on any website they choose — the set of eligible sites cannot be known in advance. <all_urls> is required so the content script can be injected into whichever page the user is currently on when they invoke the extension. No network requests are made by the extension itself; it only reads/modifies the DOM of the current tab to build the print preview.
```

## Remote code

```
This extension does not execute any remotely hosted code. All JavaScript ships inside the extension package (background.js, content.js, popup.js); nothing is fetched or eval'd from a remote server at runtime.
```

## Data usage summary (also see DATA_SAFETY.md)

```
No user data is collected, transmitted, or shared with any third party. All data (the list of hidden element selectors per site, and user setting toggles) is stored locally on-device via chrome.storage.local and is only accessible to this extension.
```
