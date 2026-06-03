# Smart Div Printer

A modern Chrome extension that lets you visually select any section of a webpage and print it in a clean, print-optimized format. Perfect for saving articles, documentation, tables, and content to PDF.

## ✨ Features

- **Visual Selection** - Hover over page elements to see intelligent section highlighting
- **Smart & Direct Modes** - Toggle between smart container detection and direct element selection
    - **Smart Mode** (default) - Automatically finds the best printable container
    - **Direct Mode** - Select the exact element you hover over (any tag: span, p, h1, img, etc.)
- **Smart Detection** - Automatically identifies the most useful content containers in Smart mode
- **Refine Selection** - Click to select, then expand/narrow using arrow keys or buttons to find the perfect container
- **Parent/Child Navigation** - Step up to parent elements or back down to children before printing
- **In-Page Printing** - No popups! Transforms the current page for printing
- **Scroll Lock** - Temporarily disables scrolling during selection to prevent accidental clicks on scrollable containers
- **Clean Print Layout** - Removes clutter and optimizes for printing/PDF export
- **Scrollable Content Expansion** - Automatically expands hidden overflow content in the print output
- **Canvas Preservation** - Converts canvas elements to images when possible
- **Form State Capture** - Preserves input values, selections, and checkbox states
- **Print-Optimized CSS** - Prevents page breaks in images, tables, code blocks, and headings
- **Keyboard Shortcuts** - Full keyboard navigation support (↑/↓ arrows, Enter, Esc)
- **One-Click Operation** - Click extension icon → select section → refine → print
- **Auto-Restore** - Page reloads after printing to restore full functionality

## 🚀 Installation

### From Source (Development)

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **Load unpacked**
5. Select the `smart-div-printer` folder
6. The extension is now ready to use

#### Optional: Add Custom Icons

The extension works without icons, but you can add them for a better appearance:

1. Open `generate-icons.html` in your browser
2. Click each "Download" button to save the icon files
3. Place the downloaded PNG files (`icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`) in the extension folder
4. Uncomment the icon references in `manifest.json` (see ICON.md for details)
5. Reload the extension in Chrome

## 📖 How to Use

1. **Activate**: Click the Smart Div Printer extension icon in your browser toolbar
2. **Choose Mode** (Optional):
    - Click the **"Mode"** button in the tooltip to toggle between:
        - **Smart** - Automatically finds the best container (default)
        - **Direct** - Selects exactly what you hover over
3. **Hover**: Move your mouse over the page to see section highlights
4. **Click**: Click on a section to select it - a control panel appears at the bottom
5. **Refine** (Optional):
    - Click **"Expand (↑)"** or press **↑** arrow to select the parent element
    - Click **"Narrow (↓)"** or press **↓** arrow to step back to a child element
    - The element info shows what's currently selected (e.g., `<div.content>`)
6. **Print**: Click **"Print This"** or press **Enter** to open the print dialog
7. **Cancel**: Click **"Cancel"** or press **Esc** to:
    - Return to hovering mode (if in selection mode)
    - Exit completely (if in hover mode)

### Selection Modes

- **Smart Mode** (default): Intelligently finds the best printable container by traversing up the DOM tree. Best for articles, blog posts, and content sections.
- **Direct Mode**: Selects exactly what you hover over - any element (span, p, h1, img, button, etc.). Use this when you want precise control or need to select small elements.
- **↑ Arrow** - Expand selection to parent element
- **↓ Arrow** - Narrow selection to child element
- **Enter** - Confirm and print selected element
- **Esc** - Cancel selection / Exit tool

## 💡 Tips

- **No Popup Blockers**: Works entirely in the current tab - no popups required!
- **Scroll Locked**: During selection mode, scrolling is temporarily disabled to prevent accidental scrolling when clicking scrollable elements
- **Smart vs Direct**: Use Smart mode for content sections, Direct mode for specific elements (like images, headings, or small text)
- **Mode Toggle**: Click the mode button anytime during hovering to switch between Smart and Direct selection
- **Refine Before Printing**: Use the expand/narrow controls to find the perfect container - sometimes the parent element captures more complete content
- **Visual Feedback**: The blue highlight shows exactly what will be printed
- **Element Inspector**: The control panel shows the tag, ID, and classes of the selected element
- **Cancel Anytime**: Press `Esc` once to return to hovering, press again to exit completely
- **Best Results**: Works best on article pages, documentation, blog posts, and content-heavy sections
- **Multiple Attempts**: You can click the extension icon again to reselect a different section
- **Restricted Pages**: The extension cannot run on Chrome internal pages (`chrome://`, `edge://`, Chrome Web Store, etc.) due to browser security restrictions
- **Page Reload**: After printing or canceling, the page reloads to restore all functionality

## 🛠️ Technical Details

### What It Does

- Intelligently traverses the DOM to find meaningful content containers
- Scores elements based on size, semantic HTML tags, and class/ID hints
- Clones the selected element and all its children
- Inlines computed CSS styles to preserve visual appearance
- Expands scrollable containers by setting `overflow: visible` and `height: auto`
- Converts canvas elements to static images (same-origin only)
- Replaces the current page content with a clean, print-optimized version
- Triggers the browser's print dialog
- Automatically reloads the page after printing to restore original functionality

### Architecture

**background.js**

- Service worker that handles extension icon clicks
- Validates tab and URL permissions
- Detects restricted pages (browser internal pages, Chrome Web Store, etc.)
- Shows visual feedback via extension badge (✓ = success, ✗ = restricted, ! = error)

**content.js**

- Modular design with clear separation of concerns:
    - **State Management**: Tracks selection state and UI elements
    - **UI Components**: Creates overlay, tooltip, and notification elements
    - **Element Selection**: Intelligent scoring algorithm to find best printable sections
    - **Event Handlers**: Mouse, keyboard, and click event management
    - **Print Generation**: Clones, styles, and exports content to print window
    - **Lifecycle Management**: Clean activation and deactivation

**manifest.json**

- Manifest V3 compliant
- Minimal permissions (`activeTab`, `scripting`)
- Modern service worker architecture

## ⚠️ Known Limitations

- **Restricted Pages**: Cannot run on `chrome://`, `chrome-extension://`, `edge://`, `about:`, or Chrome Web Store pages
- **Page Reload Required**: After printing, the page reloads to restore original functionality (unsaved form data may be lost)
- **Virtualized Lists**: May not print rows/items that aren't rendered in the DOM (e.g., infinite scroll tables)
- **Cross-Origin Iframes**: Cannot access or print content from iframes hosted on different domains
- **Shadow DOM**: Some web components using Shadow DOM may require special handling
- **Canvas Security**: Canvas elements with cross-origin images cannot be exported due to CORS taint
- **Complex Dashboards**: Highly interactive dashboards with dynamic rendering may need manual selection

## 🔧 Development

### File Structure

```
smart-div-printer/
├── background.js         # Service worker (extension lifecycle)
├── content.js            # Content script (page interaction & printing)
├── manifest.json         # Extension configuration
├── icon.svg              # Source icon design
├── generate-icons.html   # Icon generator tool
├── icon16.png            # Extension icon (16x16)
├── icon32.png            # Extension icon (32x32)
├── icon48.png            # Extension icon (48x48)
├── icon128.png           # Extension icon (128x128)
└── README.md             # Documentation
```

### Testing

1. Make changes to the code
2. Go to `chrome://extensions`
3. Click the refresh icon on the Smart Div Printer card
4. Test on a regular webpage (not chrome:// pages)

### Debugging

- **Background Script**: Click "service worker" link on `chrome://extensions` to view console
- **Content Script**: Open DevTools on the page where you're using the extension
- **Print Window**: Open DevTools in the generated print preview window

## 📝 License

MIT License - Feel free to modify and distribute

## 🤝 Contributing

Contributions welcome! Areas for improvement:

- Shadow DOM support
- Options page for customization
- Additional keyboard shortcuts
- Selection history
- Dark mode support in print view
- Better handling of complex layouts (masonry, grid)
- Custom icon themes
