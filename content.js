/**
 * Smart Div Printer - Content Script
 * Provides visual element selection and print extraction
 */

(() => {
    'use strict';

    // Toggle off if already active
    if (window.__smartDivPrinter?.active) {
        window.__smartDivPrinter.cleanup();
        return;
    }

    // ===========================
    // State Management
    // ===========================

    const state = {
        active: true,
        mode: 'hovering', // 'hovering' or 'selecting'
        selectionMode: 'smart', // 'smart' (find best container) or 'direct' (select exact element)
        hoveredElement: null,
        selectedElement: null,
        selectionHistory: [], // Track parent chain for stepping back down
        ui: {
            overlay: null,
            tooltip: null,
            controlPanel: null,
        },
    };

    window.__smartDivPrinter = {
        active: true,
        cleanup: deactivate,
    };

    // ===========================
    // UI Components
    // ===========================

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.setAttribute('data-smart-printer-overlay', 'true');
        Object.assign(overlay.style, {
            position: 'fixed',
            zIndex: '2147483646',
            pointerEvents: 'none',
            border: '2px solid #1a73e8',
            background: 'rgba(26, 115, 232, 0.1)',
            boxShadow:
                '0 0 0 1px rgba(26, 115, 232, 0.2), 0 2px 8px rgba(0,0,0,0.15)',
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'none',
            transition: 'all 0.1s ease-out',
        });
        return overlay;
    }

    function createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.setAttribute('data-smart-printer-tooltip', 'true');
        tooltip.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <span><strong>Click</strong> to select • <strong>Esc</strong> to cancel</span>
        </div>
        <button id="smart-printer-toggle-mode" style="padding: 4px 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: #fff; font: 11px system-ui, sans-serif; cursor: pointer; transition: all 0.2s; pointer-events: auto;">
          Mode: <strong id="smart-printer-mode-label">Smart</strong> (Click to toggle)
        </button>
      </div>
    `;
        Object.assign(tooltip.style, {
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2147483647',
            padding: '10px 16px',
            borderRadius: '8px',
            background: '#202124',
            color: '#fff',
            font: '13px system-ui, -apple-system, "Segoe UI", sans-serif',
            boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            userSelect: 'none',
        });

        // Add toggle button event listener
        const toggleBtn = tooltip.querySelector('#smart-printer-toggle-mode');
        toggleBtn.addEventListener('click', toggleSelectionMode);
        toggleBtn.addEventListener('mouseenter', function () {
            this.style.background = 'rgba(255,255,255,0.2)';
        });
        toggleBtn.addEventListener('mouseleave', function () {
            this.style.background = 'rgba(255,255,255,0.1)';
        });

        return tooltip;
    }

    function updateTooltipMode() {
        if (!state.ui.tooltip) return;
        const label = state.ui.tooltip.querySelector(
            '#smart-printer-mode-label',
        );
        if (label) {
            label.textContent =
                state.selectionMode === 'smart' ? 'Smart' : 'Direct';
        }
    }

    function toggleSelectionMode() {
        state.selectionMode =
            state.selectionMode === 'smart' ? 'direct' : 'smart';
        updateTooltipMode();

        // Show feedback
        const label = state.ui.tooltip?.querySelector(
            '#smart-printer-mode-label',
        );
        if (label) {
            const originalText = label.textContent;
            label.textContent =
                state.selectionMode === 'smart' ? '✓ Smart' : '✓ Direct';
            setTimeout(() => {
                label.textContent = originalText;
            }, 500);
        }

        // Re-evaluate current hover if there is one
        if (state.hoveredElement) {
            const event = new MouseEvent('mousemove', { bubbles: true });
            document.dispatchEvent(event);
        }
    }

    function createControlPanel() {
        const panel = document.createElement('div');
        panel.setAttribute('data-smart-printer-panel', 'true');
        panel.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="smart-printer-step-up" style="flex: 1; padding: 8px 12px; border: 1px solid #5f6368; border-radius: 4px; background: #fff; color: #202124; font: 13px system-ui, sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
            Expand (↑)
          </button>
          <button id="smart-printer-step-down" style="flex: 1; padding: 8px 12px; border: 1px solid #5f6368; border-radius: 4px; background: #fff; color: #202124; font: 13px system-ui, sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            Narrow (↓)
          </button>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="smart-printer-print" style="flex: 1; padding: 10px 16px; border: none; border-radius: 4px; background: #1a73e8; color: #fff; font: 14px system-ui, sans-serif; font-weight: 600; cursor: pointer;">
            Print This
          </button>
          <button id="smart-printer-cancel" style="padding: 10px 16px; border: 1px solid #5f6368; border-radius: 4px; background: #fff; color: #202124; font: 13px system-ui, sans-serif; cursor: pointer;">
            Cancel
          </button>
        </div>
        <div style="font-size: 11px; color: #5f6368; text-align: center; padding: 4px;">
          <span id="smart-printer-element-info"></span>
        </div>
      </div>
    `;
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: '2147483647',
            padding: '16px',
            borderRadius: '8px',
            background: '#fff',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            minWidth: '320px',
            display: 'none',
            pointerEvents: 'auto',
        });

        // Add event listeners
        panel
            .querySelector('#smart-printer-step-up')
            .addEventListener('click', stepUp);
        panel
            .querySelector('#smart-printer-step-down')
            .addEventListener('click', stepDown);
        panel
            .querySelector('#smart-printer-print')
            .addEventListener('click', confirmPrint);
        panel
            .querySelector('#smart-printer-cancel')
            .addEventListener('click', cancelSelection);

        return panel;
    }

    function updateControlPanel() {
        if (!state.ui.controlPanel) return;

        const element = state.selectedElement;
        if (!element) return;

        // Update element info
        const infoSpan = state.ui.controlPanel.querySelector(
            '#smart-printer-element-info',
        );
        const tag = element.tagName.toLowerCase();
        const className = element.className
            ? `.${element.className.split(' ').join('.')}`
            : '';
        const id = element.id ? `#${element.id}` : '';
        infoSpan.textContent = `<${tag}${id}${className}>`;

        // Enable/disable buttons
        const stepUpBtn = state.ui.controlPanel.querySelector(
            '#smart-printer-step-up',
        );
        const stepDownBtn = state.ui.controlPanel.querySelector(
            '#smart-printer-step-down',
        );

        const hasParent =
            element.parentElement &&
            element.parentElement !== document.body &&
            element.parentElement !== document.documentElement;

        stepUpBtn.disabled = !hasParent;
        stepUpBtn.style.opacity = hasParent ? '1' : '0.5';
        stepUpBtn.style.cursor = hasParent ? 'pointer' : 'not-allowed';

        const canStepDown = state.selectionHistory.length > 0;
        stepDownBtn.disabled = !canStepDown;
        stepDownBtn.style.opacity = canStepDown ? '1' : '0.5';
        stepDownBtn.style.cursor = canStepDown ? 'pointer' : 'not-allowed';
    }

    // ===========================
    // Element Selection Logic
    // ===========================

    function findBestPrintableElement(target) {
        if (!target || !(target instanceof Element)) return null;

        // Don't select our own UI elements
        if (
            target.hasAttribute('data-smart-printer-overlay') ||
            target.hasAttribute('data-smart-printer-tooltip') ||
            target.hasAttribute('data-smart-printer-panel') ||
            target.hasAttribute('data-smart-printer-banner')
        ) {
            return null;
        }

        // Direct mode: return the exact element
        if (state.selectionMode === 'direct') {
            return target;
        }

        // Smart mode: find the best container
        let current = target;
        let best = target;
        let bestScore = scoreElement(target);

        // Traverse up the DOM to find the most useful container
        while (
            current &&
            current !== document.body &&
            current !== document.documentElement
        ) {
            const score = scoreElement(current);

            if (score > bestScore) {
                best = current;
                bestScore = score;
            }

            // Stop if we hit a major landmark
            const tag = current.tagName?.toLowerCase();
            if (['article', 'main', 'section'].includes(tag) && score > 5) {
                break;
            }

            current = current.parentElement;
        }

        return best;
    }

    function scoreElement(el) {
        if (!el || !(el instanceof Element)) return 0;

        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const tag = el.tagName?.toLowerCase();

        // Base score from size
        let score = 0;
        if (area < 5000) score = 1;
        else if (area < 20000) score = 3;
        else if (area < 100000) score = 5;
        else if (area < 500000) score = 7;
        else score = 9;

        // Bonus for semantic tags
        const semanticTags = {
            article: 3,
            main: 3,
            section: 2,
            aside: 1,
            nav: -2,
            header: -1,
            footer: -1,
            div: 1,
            table: 2,
            form: 1,
            pre: 2,
            ul: 1,
            ol: 1,
        };

        if (semanticTags[tag] !== undefined) {
            score += semanticTags[tag];
        }

        // Bonus for content-rich classes/ids
        const className = el.className?.toString() || '';
        const id = el.id || '';
        const contentKeywords = [
            'content',
            'article',
            'main',
            'post',
            'body',
            'container',
        ];
        const hasContentHint = contentKeywords.some(
            (keyword) => className.includes(keyword) || id.includes(keyword),
        );

        if (hasContentHint) score += 2;

        // Penalty for UI chrome
        const uiKeywords = [
            'nav',
            'menu',
            'header',
            'footer',
            'sidebar',
            'ad',
            'banner',
        ];
        const isUIElement = uiKeywords.some(
            (keyword) => className.includes(keyword) || id.includes(keyword),
        );

        if (isUIElement) score -= 3;

        // Ensure minimum visible area
        if (rect.width < 100 || rect.height < 50) return 0;

        return Math.max(0, score);
    }

    // ===========================
    // Event Handlers
    // ===========================

    function isUIElement(element) {
        if (!element) return false;

        // Check if element is our UI or inside it (tooltip or control panel)
        while (element) {
            if (element.hasAttribute) {
                if (
                    element.hasAttribute('data-smart-printer-panel') ||
                    element.hasAttribute('data-smart-printer-tooltip')
                ) {
                    return true;
                }
                // Also check for specific button IDs
                if (element.id === 'smart-printer-toggle-mode') {
                    return true;
                }
            }
            element = element.parentElement;
        }
        return false;
    }

    function onMouseMove(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        event.preventDefault();
        event.stopPropagation();

        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const bestElement = findBestPrintableElement(target);
        if (bestElement && bestElement !== state.hoveredElement) {
            state.hoveredElement = bestElement;
            updateOverlay(bestElement);
        }
    }

    function onMouseDown(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        // Prevent any mouse down actions including starting drag/scroll
        event.preventDefault();
        event.stopPropagation();
    }

    function onClick(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (state.mode === 'hovering') {
            // Enter selection mode
            const elementToSelect =
                state.hoveredElement ||
                (event.target instanceof Element ? event.target : null);

            if (elementToSelect) {
                enterSelectionMode(elementToSelect);
            }
        }
        // If in 'selecting' mode, clicks are handled by control panel buttons
    }

    function onKeyDown(event) {
        if (event.key === 'Escape') {
            if (state.mode === 'selecting') {
                cancelSelection();
            } else {
                deactivate();
            }
        } else if (state.mode === 'selecting') {
            // Keyboard shortcuts during selection
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                stepUp();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                stepDown();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                confirmPrint();
            }
        }
    }

    // ===========================
    // Selection Mode Functions
    // ===========================

    function enterSelectionMode(element) {
        state.mode = 'selecting';
        state.selectedElement = element;
        state.selectionHistory = [];

        // Hide tooltip, show control panel
        if (state.ui.tooltip) state.ui.tooltip.style.display = 'none';
        if (state.ui.controlPanel) {
            state.ui.controlPanel.style.display = 'block';
            updateControlPanel();
        }

        // Update overlay to show selected element
        updateOverlay(element);

        // Change overlay style to indicate selection
        if (state.ui.overlay) {
            state.ui.overlay.style.border = '3px solid #1a73e8';
            state.ui.overlay.style.background = 'rgba(26, 115, 232, 0.15)';
        }

        // Stop listening to mouse move
        document.removeEventListener('mousemove', onMouseMove, true);
    }

    function stepUp() {
        if (!state.selectedElement) return;

        const parent = state.selectedElement.parentElement;
        if (
            !parent ||
            parent === document.body ||
            parent === document.documentElement
        ) {
            return;
        }

        // Save current element to history
        state.selectionHistory.push(state.selectedElement);

        // Move to parent
        state.selectedElement = parent;
        updateOverlay(parent);
        updateControlPanel();
    }

    function stepDown() {
        if (state.selectionHistory.length === 0) return;

        // Pop from history and move back down
        state.selectedElement = state.selectionHistory.pop();
        updateOverlay(state.selectedElement);
        updateControlPanel();
    }

    function confirmPrint() {
        if (!state.selectedElement) return;

        const elementToPrint = state.selectedElement;
        deactivate();
        printElement(elementToPrint);
    }

    function cancelSelection() {
        if (state.mode === 'selecting') {
            // Return to hovering mode
            state.mode = 'hovering';
            state.selectedElement = null;
            state.selectionHistory = [];

            // Show tooltip, hide control panel
            if (state.ui.tooltip) state.ui.tooltip.style.display = 'block';
            if (state.ui.controlPanel)
                state.ui.controlPanel.style.display = 'none';

            // Restore overlay style
            if (state.ui.overlay) {
                state.ui.overlay.style.border = '2px solid #1a73e8';
                state.ui.overlay.style.background = 'rgba(26, 115, 232, 0.1)';
                state.ui.overlay.style.display = 'none';
            }

            // Resume listening to mouse move
            document.addEventListener('mousemove', onMouseMove, true);
        }
    }

    function onWheel(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        // Prevent scrolling during selection
        event.preventDefault();
        event.stopPropagation();
    }

    function onScroll(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        // Prevent scrolling during selection
        event.preventDefault();
        event.stopPropagation();
    }

    function onTouchMove(event) {
        // Allow UI interactions
        if (isUIElement(event.target)) return;

        // Prevent touch scrolling during selection
        event.preventDefault();
    }

    function updateOverlay(element) {
        if (!element || !state.ui.overlay) return;

        const rect = element.getBoundingClientRect();
        Object.assign(state.ui.overlay.style, {
            display: 'block',
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
        });
    }

    // ===========================
    // Print Window Generation
    // ===========================

    function printElement(sourceElement) {
        const clone = createPrintableClone(sourceElement);
        const pageTitle = document.title || 'Untitled';
        const printTitle = pageTitle;

        // Save original content
        const originalBody = document.body.cloneNode(true);
        const originalTitle = document.title;
        const originalHead = document.head.innerHTML;

        // Replace page content with print-ready version
        document.title = printTitle;
        document.body.innerHTML = '';
        document.body.style.cssText = '';

        // Add print styles
        const printStyles = createPrintStyles();
        document.head.appendChild(printStyles);

        // Create toolbar
        const toolbar = createPrintToolbar();
        document.body.appendChild(toolbar);

        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'print-content';
        contentContainer.appendChild(clone);
        document.body.appendChild(contentContainer);

        // Handle print dialog
        const handleAfterPrint = () => {
            // Restore original page
            document.title = originalTitle;
            document.head.innerHTML = originalHead;
            document.body.replaceWith(originalBody);

            // Re-parse scripts to make page functional again
            window.location.reload();
        };

        // Print and restore after
        setTimeout(() => {
            window.print();

            // Listen for print dialog close
            if (window.matchMedia) {
                const mediaQueryList = window.matchMedia('print');
                const handlePrintChange = (mql) => {
                    if (!mql.matches) {
                        handleAfterPrint();
                    }
                };

                // Modern browsers
                if (mediaQueryList.addEventListener) {
                    mediaQueryList.addEventListener(
                        'change',
                        handlePrintChange,
                    );
                } else {
                    // Fallback
                    mediaQueryList.addListener(handlePrintChange);
                }
            } else {
                // Fallback: reload after a delay
                window.addEventListener('afterprint', handleAfterPrint);
            }
        }, 100);
    }

    function createPrintStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .print-toolbar {
                position: sticky;
                top: 0;
                z-index: 1000;
                display: flex;
                gap: 12px;
                align-items: center;
                padding: 12px 16px;
                background: #fff;
                border-bottom: 1px solid #dadce0;
                font-size: 14px;
            }
            
            .print-toolbar button {
                padding: 8px 16px;
                border: 1px solid #dadce0;
                border-radius: 4px;
                background: #fff;
                color: #202124;
                font: 13px system-ui, sans-serif;
                cursor: pointer;
            }
            
            .print-toolbar button.primary {
                background: #1a73e8;
                color: #fff;
                border-color: #1a73e8;
            }
            
            @media print {
                .print-toolbar {
                    display: none !important;
                }
            }
        `;
        return style;
    }

    function createPrintToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'print-toolbar';
        toolbar.innerHTML = `
            <button class="primary" onclick="window.print()">Print / Save as PDF</button>
            <button onclick="window.location.reload()">Cancel</button>
            <span style="color: #5f6368;">Clean print preview</span>
        `;
        return toolbar;
    }

    function createPrintableClone(source) {
        // Pre-process dynamic content
        prepareDynamicContent(source);

        // Clone the element
        const clone = source.cloneNode(true);

        // Apply computed styles inline
        inlineStyles(source, clone);

        // Clean up for printing
        cleanForPrint(clone);

        return clone;
    }

    function prepareDynamicContent(root) {
        // Convert canvas elements to images
        root.querySelectorAll('canvas').forEach((canvas) => {
            if (canvas.dataset.smartPrinterProcessed) return;

            try {
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.alt = canvas.getAttribute('aria-label') || 'Canvas content';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
                canvas.dataset.smartPrinterProcessed = 'true';
                canvas.after(img);
            } catch (error) {
                console.warn('Failed to convert canvas:', error);
            }
        });
    }

    function inlineStyles(sourceRoot, cloneRoot) {
        const sourceElements = [
            sourceRoot,
            ...sourceRoot.querySelectorAll('*'),
        ];
        const cloneElements = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

        sourceElements.forEach((src, i) => {
            const clone = cloneElements[i];
            if (!clone || !(clone instanceof Element)) return;

            const computed = getComputedStyle(src);

            // Handle scrollable containers - expand them to show full content
            const isScrollable =
                src.scrollHeight > src.clientHeight + 2 ||
                src.scrollWidth > src.clientWidth + 2;

            if (isScrollable) {
                clone.style.setProperty('overflow', 'visible', 'important');
                clone.style.setProperty('height', 'auto', 'important');
                clone.style.setProperty('max-height', 'none', 'important');
            }

            // Fix fixed/sticky positioning for print
            if (['fixed', 'sticky'].includes(computed.position)) {
                clone.style.setProperty('position', 'static', 'important');
            }

            // Preserve form values
            copyFormValues(src, clone);
        });
    }

    function copyFormValues(src, clone) {
        const tag = src.tagName?.toLowerCase();

        if (tag === 'textarea') {
            clone.textContent = src.value;
        } else if (tag === 'input') {
            clone.setAttribute('value', src.value || '');
            if (src.checked) clone.setAttribute('checked', 'checked');
        } else if (tag === 'select' && src.options && clone.options) {
            Array.from(src.options).forEach((opt, i) => {
                if (clone.options[i]) {
                    clone.options[i].selected = opt.selected;
                }
            });
        }
    }

    function cleanForPrint(root) {
        // Remove scripts, styles, and hidden elements
        root.querySelectorAll(
            'script, style, link[rel="stylesheet"], noscript',
        ).forEach((el) => el.remove());
        root.querySelectorAll('[hidden], [aria-hidden="true"]').forEach((el) =>
            el.remove(),
        );

        // Clean up canvas placeholders
        root.querySelectorAll('canvas[data-smart-printer-processed]').forEach(
            (el) => el.remove(),
        );

        // Remove IDs to avoid conflicts
        root.querySelectorAll('*').forEach((el) => {
            el.removeAttribute('id');

            // Ensure links are absolute
            if (el.tagName?.toLowerCase() === 'a' && el.hasAttribute('href')) {
                try {
                    const absoluteURL = new URL(
                        el.getAttribute('href'),
                        window.location.href,
                    );
                    el.setAttribute('href', absoluteURL.href);
                } catch (e) {
                    // Invalid URL, leave as-is
                }
            }
        });
    }

    // ===========================
    // Lifecycle
    // ===========================

    function activate() {
        // Create UI
        state.ui.overlay = createOverlay();
        state.ui.tooltip = createTooltip();
        state.ui.controlPanel = createControlPanel();

        document.documentElement.appendChild(state.ui.overlay);
        document.documentElement.appendChild(state.ui.tooltip);
        document.documentElement.appendChild(state.ui.controlPanel);

        // Attach event listeners
        document.addEventListener('mousemove', onMouseMove, true);
        document.addEventListener('mousedown', onMouseDown, true);
        document.addEventListener('click', onClick, true);
        document.addEventListener('keydown', onKeyDown, true);

        // Prevent scrolling during selection
        document.addEventListener('wheel', onWheel, {
            passive: false,
            capture: true,
        });
        document.addEventListener('scroll', onScroll, {
            passive: false,
            capture: true,
        });
        document.addEventListener('touchmove', onTouchMove, {
            passive: false,
            capture: true,
        });

        // Lock body scroll
        document.body.style.overflow = 'hidden';

        // Prevent accidental navigation
        document.body.style.cursor = 'crosshair';
    }

    function deactivate() {
        if (!state.active) return;

        state.active = false;

        // Remove event listeners
        document.removeEventListener('mousemove', onMouseMove, true);
        document.removeEventListener('mousedown', onMouseDown, true);
        document.removeEventListener('click', onClick, true);
        document.removeEventListener('keydown', onKeyDown, true);
        document.removeEventListener('wheel', onWheel, true);
        document.removeEventListener('scroll', onScroll, true);
        document.removeEventListener('touchmove', onTouchMove, true);

        // Remove UI
        state.ui.overlay?.remove();
        state.ui.tooltip?.remove();
        state.ui.controlPanel?.remove();

        // Restore body scroll
        document.body.style.overflow = '';

        // Restore cursor
        document.body.style.cursor = '';

        // Clear global reference
        window.__smartDivPrinter = null;
    }

    // ===========================
    // Initialize
    // ===========================

    activate();
})();
