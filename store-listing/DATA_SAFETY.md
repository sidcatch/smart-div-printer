# Data Safety / Privacy Practices Questionnaire

The Developer Dashboard's "Privacy practices" tab asks you to disclose what data your extension handles. Use these answers.

## Does your extension collect or use user data?

```
No — the extension does not collect, transmit, sell, or share any user data. All data it stores stays on-device in chrome.storage.local.
```

## Data types (if the form requires you to pick categories, mark all as "Not collected", with these notes)

| Category                               | Collected?          | Notes                                                                                                                                                                           |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Personally identifiable information    | No                  | Not accessed or stored.                                                                                                                                                         |
| Health information                     | No                  | —                                                                                                                                                                               |
| Financial and payment information      | No                  | —                                                                                                                                                                               |
| Authentication information             | No                  | —                                                                                                                                                                               |
| Personal communications                | No                  | —                                                                                                                                                                               |
| Location                               | No                  | —                                                                                                                                                                               |
| Web history                            | No                  | The extension does not log or transmit browsing history.                                                                                                                        |
| User activity (clicks, mouse position) | No (transient only) | Mouse position is read in-memory to drive the hover-highlight UI while the selection tool is active. It is never stored or transmitted.                                         |
| Website content                        | No (transient only) | DOM content of the current tab is read/cloned in-memory to build the print preview and is never transmitted or persisted beyond the CSS selector text saved for "hide" entries. |

## Certifications typically required by the form

- **"I do not sell or transfer user data to third parties, outside of the approved use cases."** → Yes, certify.
- **"I do not use or transfer user data for purposes unrelated to the item's single purpose."** → Yes, certify.
- **"I do not use or transfer user data to determine creditworthiness or for lending purposes."** → Yes, certify.

## Remote code

```
No remote code is executed. All code ships inside the packaged extension.
```
