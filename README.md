# Smart Div Printer

A modern Chrome extension that lets you visually select sections of a webpage to either print in clean format or hide from all future prints. Perfect for saving articles, documentation, and content to PDF while excluding unwanted elements like ads, sidebars, and navigation.

## ✨ Features

### Dual Mode Operation

- **Print Mode** (blue) - Select and print sections immediately in clean format
- **Hide Mode** (red) - Mark elements to exclude from all future prints on the site

### Visual Selection

- **Hover Highlighting** - See real-time highlighting as you move your mouse
- **Smart & Direct Modes** - Toggle between intelligent container detection and exact element selection
    - **Direct Mode** (default) - Select the exact element you hover over (any tag: span, p, h1, img, etc.)
    - **Smart Mode** - Automatically finds the best printable container
- **Refine Selection** - Click to select, then expand/narrow using arrow keys or buttons
- **Parent/Child Navigation** - Step up to parent elements or back down to children

### Hide from Print

- **Persistent Markers** - Hidden elements show red dashed borders with "🚫 Hidden from print" labels
- **Per-Site Memory** - Remembers hidden elements for each website across sessions
- **Auto-Removal** - Hidden elements automatically excluded when printing
- **Manage Hidden** - Enable/disable or delete hidden elements from the popup
- **Visual Indicators** - Red markers visible on page and during selection modes

### Print Features

- **Clean Print Layout** - Removes clutter and optimizes for printing/PDF export
- **Scrollable Content Expansion** - Automatically expands hidden overflow content
- **Canvas Preservation** - Converts canvas elements to images when possible
- **Form State Capture** - Preserves input values, selections, and checkbox states
- **Print-Optimized CSS** - Prevents page breaks in images, tables, code blocks, and headings
- **Auto-Restore** - Page reloads after printing to restore full functionality

### User Experience

- **Keyboard Shortcuts** - Full keyboard navigation support (↑/↓ arrows, Enter, Esc)
- **Popup Interface** - Choose between print and hide modes before selection
- **Hidden Element List** - View and manage all hidden elements for the current site

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

### Printing a Section

1. **Open Popup**: Click the Smart Div Printer extension icon in your browser toolbar
2. **Select Print Mode**: Click **"Select for PDF"** (blue button)
3. **Hover**: Move your mouse over the page to see section highlights (blue)
4. **Toggle Mode** (Optional):
    - Click the **"Mode"** button in the tooltip to switch between:
        - **Direct** - Selects exactly what you hover over (default)
        - **Smart** - Automatically finds the best container
5. **Click**: Click on a section to select it - a control panel appears at the bottom
6. **Refine** (Optional):
    - Click **"Expand (↑)"** or press **↑** arrow to select the parent element
    - Click **"Narrow (↓)"** or press **↓** arrow to step back to a child element
    - The element info shows what's currently selected (e.g., `<div.content>`)
7. **Print**: Click **"Print This"** or press **Enter** to open the print dialog
8. **Cancel**: Click **"Cancel"** or press **Esc** to exit

### Hiding Elements from Print

1. **Open Popup**: Click the Smart Div Printer extension icon
2. **Select Hide Mode**: Click **"Select to Hide from Print"** (red button)
3. **Hover**: Move your mouse over the page to see section highlights (red)
4. **Click**: Click on an element to select it (ads, sidebars, navigation, etc.)
5. **Refine** (Optional): Use expand/narrow controls to adjust selection
6. **Hide**: Click **"Hide This"** or press **Enter** to mark as hidden
7. **Result**: Element gets a red dashed border and "🚫 Hidden from print" label
8. **Persistence**: Hidden elements are remembered and excluded from all future prints

### Managing Hidden Elements

1. **Open Popup**: Click the extension icon
2. **View List**: See all hidden elements for the current site
3. **Toggle**: Uncheck to temporarily disable (keep in list but don't hide)
4. **Delete**: Click the trash icon to permanently remove from hidden list
5. **Clear All**: Click "Clear All" to remove all hidden elements for the site

### Selection Modes

- **Direct Mode** (default): Selects exactly what you hover over - any element (span, p, h1, img, button, etc.). Use this for precise control.
- **Smart Mode**: Intelligently finds the best printable container by traversing up the DOM tree. Best for articles, blog posts, and content sections.

### Keyboard Shortcuts

- **↑ Arrow** - Expand selection to parent element
- **↓ Arrow** - Narrow selection to child element
- **Enter** - Confirm action (print or hide)
- **Esc** - Cancel selection / Exit tool

## 💡 Tips

### General

- **Popup First**: Click the extension icon to choose between Print or Hide mode
- **Color Coding**: Blue = Print mode, Red = Hide mode
- **Persistent Hiding**: Hidden elements are saved per website and remembered across sessions
- **Multiple Attempts**: After completing an action, click the icon again to start a new selection
- **Restricted Pages**: Cannot run on Chrome internal pages (`chrome://`, `edge://`, Chrome Web Store) due to browser security

### Selection

- **Direct vs Smart**: Direct mode (default) gives precise control; Smart mode finds content containers
- **Mode Toggle**: Click the mode button anytime during hovering to switch between Direct and Smart
- **Refine Before Acting**: Use expand/narrow controls to find the perfect element - parent elements often capture more complete content
- **Visual Feedback**: Colored highlights show exactly what will be printed or hidden
- **Element Inspector**: Control panel shows the tag, ID, and classes of the selected element
- **Cancel Anytime**: Press `Esc` to exit selection mode

### Hiding Elements

- **Hide Common Clutter**: Use for ads, sidebars, navigation, comments, related articles, etc.
- **Red Markers**: Hidden elements show red dashed borders with labels on the page
- **Always Visible**: Hidden elements remain visible on the page, only removed when printing
- **Manage in Popup**: View, toggle, or delete hidden elements from the extension popup
- **Per-Site Storage**: Each website has its own list of hidden elements

### Printing

- **Clean Output**: Hidden elements automatically excluded from print
- **Best Results**: Works best on article pages, documentation, blog posts, and content-heavy sections
- **Page Reload**: After printing, the page reloads to restore full functionality

## 🛠️ Technical Details

### What It Does

**Print Mode:**

- Intelligently traverses the DOM to find meaningful content containers (Smart mode)
- Scores elements based on size, semantic HTML tags, and class/ID hints
- Clones the selected element and all its children
- Removes all elements marked as hidden from the clone
- Inlines computed CSS styles to preserve visual appearance
- Expands scrollable containers by setting `overflow: visible` and `height: auto`
- Converts canvas elements to static images (same-origin only)
- Replaces the current page content with a clean, print-optimized version
- Triggers the browser's print dialog
- Automatically reloads the page after printing to restore original functionality

**Hide Mode:**

- Generates unique CSS selectors for selected elements
- Stores hidden element data in chrome.storage.local (per hostname)
- Marks hidden elements with red dashed borders and visible labels
- Automatically applies markers on page load
- Provides management UI in the extension popup

### Architecture

**popup.html / popup.js / popup.css**

- Mode selection interface (Print or Hide)
- Displays list of hidden elements for current site
- Manages hidden element storage (enable/disable/delete)
- Injects content script and sends mode selection message

**background.js**

- Minimal service worker for message handling
- No direct user interaction (popup handles everything)

**content.js**

- Modular design with clear separation of concerns:
    - **Initialization**: Applies hidden element markers on page load
    - **State Management**: Tracks selection state, mode (print/hide), and UI elements
    - **UI Components**: Creates overlays, tooltips, and control panels (color-coded by mode)
    - **Element Selection**: Intelligent scoring algorithm to find best printable sections
    - **Event Handlers**: Mouse, keyboard, and click event management
    - **Hide Functionality**: Generates selectors, saves to storage, applies visual markers
    - **Print Generation**: Clones content, removes hidden elements, optimizes for print
    - **Lifecycle Management**: Clean activation and deactivation with guard against multiple injections

**manifest.json**

- Manifest V3 compliant
- Permissions: `activeTab`, `scripting`, `storage`
- Popup interface for mode selection
- Modern service worker architecture

## ⚠️ Known Limitations

- **Restricted Pages**: Cannot run on `chrome://`, `chrome-extension://`, `edge://`, `about:`, or Chrome Web Store pages
- **Page Reload Required**: After printing, the page reloads to restore original functionality (unsaved form data may be lost)
- **Selector Stability**: Hidden element selectors may break if website HTML structure changes significantly
- **Dynamic Content**: Elements loaded after hiding via AJAX/dynamic rendering won't be automatically hidden
- **Virtualized Lists**: May not print rows/items that aren't rendered in the DOM (e.g., infinite scroll tables)
- **Cross-Origin Iframes**: Cannot access or print content from iframes hosted on different domains
- **Shadow DOM**: Some web components using Shadow DOM may require special handling
- **Canvas Security**: Canvas elements with cross-origin images cannot be exported due to CORS taint
- **Complex Dashboards**: Highly interactive dashboards with dynamic rendering may need manual selection

## 🔧 Development

### File Structure

```
smart-div-printer/
├── background.js         # Service worker (message handling)
├── content.js            # Content script (selection, hiding, printing)
├── popup.html            # Popup interface structure
├── popup.css             # Popup styling
├── popup.js              # Popup logic (mode selection, hidden list)
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
- Options page for customization (default mode, colors, etc.)
- Export/import hidden element lists
- Sync hidden elements across devices
- Selection history
- Dark mode support in print view
- Better handling of complex layouts (masonry, grid)
- Bulk hide operations (select multiple elements)
- Custom icon themes
- Preview mode before printing
