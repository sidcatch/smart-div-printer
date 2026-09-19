/**
 * Smart Div Printer - Content Script
 * Provides visual element selection for printing or hiding from print
 */

(() => {
    'use strict';

    // ===========================
    // Initialization
    // ===========================

    let state = null;

    // Initialize on page load
    init();

    async function init() {
        // Prevent multiple initializations
        if (window.__smartDivPrinterInitialized) {
            return;
        }
        window.__smartDivPrinterInitialized = true;

        // Apply hidden elements markers when page loads
        await applyHiddenElements();

        // Listen for messages from popup
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) => {
                if (message.type === 'startSelection') {
                    startSelectionMode(message.mode || 'print');
                    sendResponse({ success: true });
                } else if (message.type === 'applyHiddenElements') {
                    applyHiddenElements().then(() => {
                        sendResponse({ success: true });
                    });
                    return true; // Keep channel open for async response
                }
            },
        );
    }

    // ===========================
    // Apply Hidden Elements Markers
    // ===========================

    async function applyHiddenElements() {
        try {
            const hostname = window.location.hostname;
            const result = await chrome.storage.local.get('hiddenElements');
            const allHidden = result.hiddenElements || {};
            const siteHidden = allHidden[hostname] || [];

            // Remove existing markers
            document
                .querySelectorAll('[data-smart-printer-hidden]')
                .forEach((el) => {
                    el.removeAttribute('data-smart-printer-hidden');
                    el.style.outline = '';
                    el.style.outlineOffset = '';
                    const marker = el.querySelector(
                        '[data-smart-printer-marker]',
                    );
                    if (marker) marker.remove();
                });

            // Apply markers to hidden elements (visible red borders, not actually hidden from page)
            siteHidden.forEach((hiddenItem) => {
                if (hiddenItem.enabled === false) return; // Skip disabled items

                try {
                    const elements = document.querySelectorAll(
                        hiddenItem.selector,
                    );
                    elements.forEach((el) => {
                        el.setAttribute('data-smart-printer-hidden', 'true');
                        addRedMarker(el);
                    });
                } catch (e) {
                    console.warn('Invalid selector:', hiddenItem.selector);
                }
            });
        } catch (error) {
            console.error('Error applying hidden elements:', error);
        }
    }

    function addRedMarker(element) {
        // Check if marker already exists
        if (element.querySelector('[data-smart-printer-marker]')) return;

        const marker = document.createElement('div');
        marker.setAttribute('data-smart-printer-marker', 'true');
        marker.textContent = '🚫 Hidden from print';
        Object.assign(marker.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            zIndex: '999999',
            background: '#ea4335',
            color: '#fff',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            borderRadius: '0 0 4px 0',
            pointerEvents: 'none',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        });

        // Ensure element has position context
        const currentPosition = getComputedStyle(element).position;
        if (currentPosition === 'static') {
            element.style.position = 'relative';
        }

        // Add red dashed border
        element.style.outline = '2px dashed #ea4335';
        element.style.outlineOffset = '-2px';

        element.insertBefore(marker, element.firstChild);
    }

    // ===========================
    // Selection Mode
    // ===========================

    function startSelectionMode(selectionType) {
        // Print preview replaced the page; a new selection here would trap the toolbar's clicks
        if (document.querySelector('[data-smart-printer-toolbar]')) {
            return;
        }

        // Toggle off if already active
        if (window.__smartDivPrinter?.active) {
            window.__smartDivPrinter.cleanup();
            // Small delay to ensure cleanup is complete before starting again
            setTimeout(() => startSelectionMode(selectionType), 50);
            return;
        }

        const isPrint = selectionType === 'print';
        const borderColor = isPrint ? '#1a73e8' : '#ea4335';
        const bgColor = isPrint
            ? 'rgba(26, 115, 232, 0.1)'
            : 'rgba(234, 67, 53, 0.1)';
        const actionText = isPrint ? 'Print' : 'Hide';
        const iconType = selectionType;

        state = {
            active: true,
            selectionType: selectionType, // 'print' or 'hide'
            mode: 'hovering', // 'hovering' or 'selecting'
            selectionMode: 'direct', // 'smart' or 'direct'
            hoveredElement: null,
            selectedElement: null,
            selectionHistory: [],
            colors: { borderColor, bgColor },
            actionText,
            iconType,
            ui: {
                overlay: null,
                tooltip: null,
                controlPanel: null,
            },
            listeners: {},
        };

        window.__smartDivPrinter = {
            active: true,
            cleanup: deactivate,
        };

        activate();
    }

    function activate() {
        // Create UI
        state.ui.overlay = createOverlay();
        state.ui.tooltip = createTooltip();
        state.ui.controlPanel = createControlPanel();

        document.documentElement.appendChild(state.ui.overlay);
        document.documentElement.appendChild(state.ui.tooltip);
        document.documentElement.appendChild(state.ui.controlPanel);

        // Attach event listeners
        state.listeners.mouseMove = (e) => onMouseMove(e);
        state.listeners.mouseDown = (e) => onMouseDown(e);
        state.listeners.click = (e) => onClick(e);
        state.listeners.keyDown = (e) => onKeyDown(e);
        state.listeners.scroll = () => onScroll();

        document.addEventListener('mousemove', state.listeners.mouseMove, true);
        document.addEventListener('mousedown', state.listeners.mouseDown, true);
        document.addEventListener('click', state.listeners.click, true);
        document.addEventListener('keydown', state.listeners.keyDown, true);
        document.addEventListener('scroll', state.listeners.scroll, true);

        // Visual feedback
        document.body.style.cursor = 'crosshair';
    }

    function deactivate() {
        if (!state || !state.active) return;

        state.active = false;

        // Remove event listeners
        if (state.listeners.mouseMove)
            document.removeEventListener(
                'mousemove',
                state.listeners.mouseMove,
                true,
            );
        if (state.listeners.mouseDown)
            document.removeEventListener(
                'mousedown',
                state.listeners.mouseDown,
                true,
            );
        if (state.listeners.click)
            document.removeEventListener('click', state.listeners.click, true);
        if (state.listeners.keyDown)
            document.removeEventListener(
                'keydown',
                state.listeners.keyDown,
                true,
            );
        if (state.listeners.scroll)
            document.removeEventListener(
                'scroll',
                state.listeners.scroll,
                true,
            );

        // Remove UI
        state.ui.overlay?.remove();
        state.ui.tooltip?.remove();
        state.ui.controlPanel?.remove();

        // Restore cursor
        document.body.style.cursor = '';

        // Clear global reference
        window.__smartDivPrinter = null;
        state = null;
    }

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
            border: `2px solid ${state.colors.borderColor}`,
            background: state.colors.bgColor,
            boxShadow: `0 0 0 1px ${state.colors.borderColor}40, 0 2px 8px rgba(0,0,0,0.15)`,
            borderRadius: '4px',
            boxSizing: 'border-box',
            display: 'none',
            transition: 'all 0.1s ease-out',
        });
        return overlay;
    }

    function createTooltip() {
        const icon =
            state.iconType === 'print'
                ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>`
                : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>`;

        const tooltip = document.createElement('div');
        tooltip.setAttribute('data-smart-printer-tooltip', 'true');
        tooltip.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${icon}
          <span><strong>Click</strong> to select • <strong>Esc</strong> to cancel</span>
        </div>
        <button id="smart-printer-toggle-mode" style="padding: 4px 8px; border: 1px solid rgba(255,255,255,0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: #fff; font: 11px system-ui, sans-serif; cursor: pointer; transition: all 0.2s; pointer-events: auto;">
          Mode: <strong id="smart-printer-mode-label">Direct</strong> (Click to toggle)
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

    function createControlPanel() {
        const buttonColor =
            state.selectionType === 'print' ? '#1a73e8' : '#ea4335';
        const buttonHoverColor =
            state.selectionType === 'print' ? '#1557b0' : '#d33426';

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
          <button id="smart-printer-action" style="flex: 1; padding: 10px 16px; border: none; border-radius: 4px; background: ${buttonColor}; color: #fff; font: 14px system-ui, sans-serif; font-weight: 600; cursor: pointer;">
            ${state.actionText} This
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
        const actionBtn = panel.querySelector('#smart-printer-action');
        actionBtn.addEventListener('click', confirmAction);
        actionBtn.addEventListener('mouseenter', function () {
            this.style.background = buttonHoverColor;
        });
        actionBtn.addEventListener('mouseleave', function () {
            this.style.background = buttonColor;
        });

        panel
            .querySelector('#smart-printer-step-up')
            .addEventListener('click', stepUp);
        panel
            .querySelector('#smart-printer-step-down')
            .addEventListener('click', stepDown);
        panel
            .querySelector('#smart-printer-cancel')
            .addEventListener('click', cancelSelection);

        return panel;
    }

    function updateControlPanel() {
        if (!state?.ui.controlPanel) return;

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

        // Don't select our own UI elements or markers
        if (
            target.hasAttribute('data-smart-printer-overlay') ||
            target.hasAttribute('data-smart-printer-tooltip') ||
            target.hasAttribute('data-smart-printer-panel') ||
            target.hasAttribute('data-smart-printer-marker')
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

        // Check if element is our UI or inside it
        while (element) {
            if (element.hasAttribute) {
                if (
                    element.hasAttribute('data-smart-printer-panel') ||
                    element.hasAttribute('data-smart-printer-tooltip') ||
                    element.hasAttribute(
                        'data-smart-printer-warning-overlay',
                    ) ||
                    element.hasAttribute('data-smart-printer-toolbar') ||
                    element.id === 'smart-printer-toggle-mode'
                ) {
                    return true;
                }
            }
            element = element.parentElement;
        }
        return false;
    }

    function onMouseMove(event) {
        if (!state || state.mode !== 'hovering') return;
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
        if (!state) return;
        if (isUIElement(event.target)) return;

        event.preventDefault();
        event.stopPropagation();
    }

    function onClick(event) {
        if (!state) return;
        if (isUIElement(event.target)) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (state.mode === 'hovering') {
            const elementToSelect =
                state.hoveredElement ||
                (event.target instanceof Element ? event.target : null);

            if (elementToSelect) {
                enterSelectionMode(elementToSelect);
            }
        }
    }

    function onKeyDown(event) {
        if (!state) return;

        if (event.key === 'Escape') {
            if (state.mode === 'selecting') {
                cancelSelection();
            } else {
                deactivate();
            }
        } else if (state.mode === 'selecting') {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                stepUp();
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                stepDown();
            } else if (event.key === 'Enter') {
                event.preventDefault();
                confirmAction();
            }
        }
    }

    function onScroll() {
        if (!state) return;
        if (state.mode === 'hovering' && state.hoveredElement) {
            updateOverlay(state.hoveredElement);
        } else if (state.mode === 'selecting' && state.selectedElement) {
            updateOverlay(state.selectedElement);
        }
    }

    function updateOverlay(element) {
        if (!state || !element || !state.ui.overlay) return;

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
    // Selection Mode Functions
    // ===========================

    function toggleSelectionMode() {
        if (!state) return;

        state.selectionMode =
            state.selectionMode === 'smart' ? 'direct' : 'smart';

        const label = state.ui.tooltip?.querySelector(
            '#smart-printer-mode-label',
        );
        if (label) {
            const newText =
                state.selectionMode === 'smart' ? 'Smart' : 'Direct';
            label.textContent = `✓ ${newText}`;
            setTimeout(() => {
                label.textContent = newText;
            }, 500);
        }

        // Re-evaluate current hover
        if (state.hoveredElement) {
            const event = new MouseEvent('mousemove', { bubbles: true });
            document.dispatchEvent(event);
        }
    }

    function enterSelectionMode(element) {
        if (!state) return;

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
            state.ui.overlay.style.border = `3px solid ${state.colors.borderColor}`;
            state.ui.overlay.style.background = state.colors.bgColor.replace(
                '0.1',
                '0.15',
            );
        }
    }

    function stepUp() {
        if (!state || !state.selectedElement) return;

        const parent = state.selectedElement.parentElement;
        if (
            !parent ||
            parent === document.body ||
            parent === document.documentElement
        ) {
            return;
        }

        state.selectionHistory.push(state.selectedElement);
        state.selectedElement = parent;
        updateOverlay(parent);
        updateControlPanel();
    }

    function stepDown() {
        if (!state || state.selectionHistory.length === 0) return;

        state.selectedElement = state.selectionHistory.pop();
        updateOverlay(state.selectedElement);
        updateControlPanel();
    }

    async function confirmAction() {
        if (!state || !state.selectedElement) return;

        const element = state.selectedElement;

        if (state.selectionType === 'print') {
            const proceed = await confirmPrintWarning();
            if (!proceed) return;

            // Print mode: print the selected element
            deactivate();
            await printElement(element);
        } else {
            // Hide mode: save to hidden elements
            const selector = generateSelector(element);
            await saveHiddenElement(element, selector);

            // Add marker to the element
            element.setAttribute('data-smart-printer-hidden', 'true');
            addRedMarker(element);

            // Show feedback
            showFeedback('Element marked as hidden from print!', 'success');

            // Deactivate after short delay
            setTimeout(() => deactivate(), 800);
        }
    }

    async function saveHiddenElement(element, selector) {
        try {
            const hostname = window.location.hostname;
            const result = await chrome.storage.local.get('hiddenElements');
            const allHidden = result.hiddenElements || {};

            if (!allHidden[hostname]) {
                allHidden[hostname] = [];
            }

            // Check if selector already exists
            const exists = allHidden[hostname].some(
                (item) => item.selector === selector,
            );

            if (!exists) {
                allHidden[hostname].push({
                    selector: selector,
                    description: getElementDescription(element),
                    addedAt: Date.now(),
                    enabled: true,
                });

                await chrome.storage.local.set({ hiddenElements: allHidden });
            }
        } catch (error) {
            console.error('Error saving hidden element:', error);
        }
    }

    function cancelSelection() {
        if (!state || state.mode !== 'selecting') return;

        state.mode = 'hovering';
        state.selectedElement = null;
        state.selectionHistory = [];

        if (state.ui.tooltip) state.ui.tooltip.style.display = 'block';
        if (state.ui.controlPanel) state.ui.controlPanel.style.display = 'none';

        if (state.ui.overlay) {
            state.ui.overlay.style.border = `2px solid ${state.colors.borderColor}`;
            state.ui.overlay.style.background = state.colors.bgColor;
            state.ui.overlay.style.display = 'none';
        }
    }

    // ===========================
    // Print Warning Dialog
    // ===========================

    async function confirmPrintWarning() {
        try {
            const result = await chrome.storage.local.get('skipPrintWarning');
            if (result.skipPrintWarning) return true;
        } catch (error) {
            console.error('Error reading print warning preference:', error);
        }

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.setAttribute('data-smart-printer-warning-overlay', 'true');
            Object.assign(overlay.style, {
                position: 'fixed',
                inset: '0',
                zIndex: '2147483647',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
            });

            overlay.innerHTML = `
                <div style="background:#fff; border-radius: 8px; max-width: 380px; width: 90%; padding: 20px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
                    <div style="display:flex; gap:12px; align-items:flex-start;">
                        <span style="font-size:24px; line-height:1;">⚠️</span>
                        <div>
                            <div style="font-size:15px; font-weight:600; color:#202124; margin-bottom:6px;">Unsaved changes may be lost</div>
                            <div style="font-size:13px; color:#5f6368; line-height:1.4;">
                                Preparing the print preview replaces this page's content, so any unsaved form entries or in-progress work will be permanently lost. Closing the preview reloads the page to its original state (not your unsaved changes).
                            </div>
                        </div>
                    </div>
                    <label style="display:flex; align-items:center; gap:8px; margin:14px 0 4px; font-size:13px; color:#202124; cursor:pointer;">
                        <input type="checkbox" id="smart-printer-warning-dont-show" style="cursor:pointer;">
                        Don't show this warning again
                    </label>
                    <div style="font-size:11px; color:#80868b; margin-bottom:4px;">
                        You can re-enable this warning anytime from the extension popup.
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;">
                        <button id="smart-printer-warning-cancel" style="padding:8px 14px; border:1px solid #5f6368; border-radius:4px; background:#fff; color:#202124; font:13px system-ui, sans-serif; cursor:pointer;">Cancel</button>
                        <button id="smart-printer-warning-continue" style="padding:8px 14px; border:none; border-radius:4px; background:#1a73e8; color:#fff; font:13px system-ui, sans-serif; font-weight:600; cursor:pointer;">Continue</button>
                    </div>
                </div>
            `;

            document.documentElement.appendChild(overlay);

            const cleanupDialog = (proceed) => {
                overlay.remove();
                resolve(proceed);
            };

            overlay
                .querySelector('#smart-printer-warning-continue')
                .addEventListener('click', async () => {
                    const dontShow = overlay.querySelector(
                        '#smart-printer-warning-dont-show',
                    ).checked;
                    if (dontShow) {
                        try {
                            await chrome.storage.local.set({
                                skipPrintWarning: true,
                            });
                        } catch (error) {
                            console.error(
                                'Error saving print warning preference:',
                                error,
                            );
                        }
                    }
                    cleanupDialog(true);
                });

            overlay
                .querySelector('#smart-printer-warning-cancel')
                .addEventListener('click', () => cleanupDialog(false));
        });
    }

    // ===========================
    // Helper Functions
    // ===========================

    function generateSelector(element) {
        // Prefer ID if it exists
        if (element.id) {
            return `#${CSS.escape(element.id)}`;
        }

        // Use class names if they exist and are specific
        if (element.className && typeof element.className === 'string') {
            const classes = element.className
                .trim()
                .split(/\s+/)
                .filter((c) => c);
            if (classes.length > 0) {
                const classSelector =
                    '.' + classes.map((c) => CSS.escape(c)).join('.');
                const matchingElements =
                    document.querySelectorAll(classSelector);
                if (matchingElements.length <= 5) {
                    return classSelector;
                }
            }
        }

        // Fallback to nth-child approach
        let path = [];
        let current = element;

        while (current && current !== document.body) {
            let selector = current.tagName.toLowerCase();

            if (current.id) {
                selector = `#${CSS.escape(current.id)}`;
                path.unshift(selector);
                break;
            }

            let sibling = current;
            let nth = 1;
            while (sibling.previousElementSibling) {
                sibling = sibling.previousElementSibling;
                if (sibling.tagName === current.tagName) nth++;
            }

            if (nth > 1) {
                selector += `:nth-of-type(${nth})`;
            }

            path.unshift(selector);
            current = current.parentElement;
        }

        return path.join(' > ');
    }

    function getElementDescription(element) {
        if (element.id) return `#${element.id}`;

        const tag = element.tagName.toLowerCase();
        const classes =
            element.className && typeof element.className === 'string'
                ? element.className.trim().split(/\s+/).slice(0, 2).join('.')
                : '';

        let text = element.textContent?.trim().substring(0, 30) || '';
        if (text.length === 30) text += '...';

        if (classes) return `${tag}.${classes}`;
        if (text) return `${tag}: "${text}"`;
        return tag;
    }

    function showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.textContent = message;
        Object.assign(feedback.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: '2147483647',
            padding: '16px 24px',
            borderRadius: '8px',
            background: type === 'success' ? '#0d652d' : '#d93025',
            color: '#fff',
            font: '14px system-ui, sans-serif',
            fontWeight: '600',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        });

        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
    }

    // ===========================
    // Print Functionality
    // ===========================

    async function printElement(sourceElement) {
        const settings = await getPrintSettings();
        const clone = createPrintableClone(sourceElement, settings);
        const pageTitle = document.title || 'Untitled';

        // Replace page content with print-ready version
        document.title = pageTitle;
        document.body.innerHTML = '';
        document.body.style.cssText = '';

        // Add print styles
        const printStyles = createPrintStyles();
        document.head.appendChild(printStyles);

        // Create toolbar
        const toolbar = createPrintToolbar();
        document.body.appendChild(toolbar);

        // Create content container, optionally wrapped in stripped-down ancestor shells
        const contentContainer = buildPrintContainer(
            clone,
            sourceElement,
            settings,
        );
        document.body.appendChild(contentContainer);

        // The preview stays up after the native dialog closes; Cancel restores the page
        setTimeout(() => {
            window.print();
        }, 100);
    }

    async function getPrintSettings() {
        try {
            const result = await chrome.storage.local.get([
                'preserveParentStyles',
                'removeParentAlignment',
                'expandScrollableContainers',
            ]);
            return {
                preserveParentStyles: result.preserveParentStyles !== false,
                removeParentAlignment: !!result.removeParentAlignment,
                expandScrollableContainers:
                    result.expandScrollableContainers !== false,
            };
        } catch (error) {
            console.error('Error reading print settings:', error);
            return {
                preserveParentStyles: true,
                removeParentAlignment: false,
                expandScrollableContainers: true,
            };
        }
    }

    function buildPrintContainer(clone, sourceElement, settings) {
        const contentContainer = document.createElement('div');
        contentContainer.className = 'print-content';

        if (!settings.preserveParentStyles) {
            contentContainer.appendChild(clone);
            return contentContainer;
        }

        // Recreate the ancestor chain (attributes only, no siblings/content) so
        // class/id-based CSS from the original stylesheets still applies
        const ancestors = [];
        let current = sourceElement.parentElement;
        while (
            current &&
            current !== document.body &&
            current !== document.documentElement
        ) {
            ancestors.unshift(current);
            current = current.parentElement;
        }

        let innermostParent = contentContainer;
        ancestors.forEach((ancestor) => {
            const shell = ancestor.cloneNode(false);
            resetShellBoxModel(shell);
            if (settings.removeParentAlignment) {
                resetShellAlignment(shell);
            }
            innermostParent.appendChild(shell);
            innermostParent = shell;
        });

        innermostParent.appendChild(clone);
        return contentContainer;
    }

    function resetShellBoxModel(shell) {
        const resets = {
            margin: '0',
            padding: '0',
            width: 'auto',
            height: 'auto',
            'min-width': '0',
            'max-width': 'none',
            'min-height': '0',
            'max-height': 'none',
            'flex-basis': 'auto',
        };
        Object.entries(resets).forEach(([prop, value]) => {
            shell.style.setProperty(prop, value, 'important');
        });
    }

    function resetShellAlignment(shell) {
        shell.style.setProperty('display', 'block', 'important');
        [
            'justify-content',
            'align-items',
            'align-content',
            'place-items',
            'place-content',
            'text-align',
        ].forEach((prop) =>
            shell.style.setProperty(prop, 'unset', 'important'),
        );
    }

    function createPrintableClone(source, settings) {
        prepareDynamicContent(source);
        const clone = source.cloneNode(true);
        inlineStyles(source, clone, settings);
        cleanForPrint(clone);
        removeHiddenElements(clone);
        return clone;
    }

    function removeHiddenElements(root) {
        // Remove all elements marked as hidden from print
        root.querySelectorAll('[data-smart-printer-hidden]').forEach((el) =>
            el.remove(),
        );
    }

    function prepareDynamicContent(root) {
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

    function inlineStyles(sourceRoot, cloneRoot, settings) {
        const sourceElements = [
            sourceRoot,
            ...sourceRoot.querySelectorAll('*'),
        ];
        const cloneElements = [cloneRoot, ...cloneRoot.querySelectorAll('*')];

        sourceElements.forEach((src, i) => {
            const clone = cloneElements[i];
            if (!clone || !(clone instanceof Element)) return;

            const computed = getComputedStyle(src);

            // Only expand containers that actually clip overflow (e.g. KaTeX's vlists naturally have
            // scrollHeight > clientHeight but stay visible, so they must be excluded via overflow check)
            const clipsOverflow = ['hidden', 'auto', 'scroll', 'clip'].some(
                (value) =>
                    computed.overflow.includes(value) ||
                    computed.overflowX === value ||
                    computed.overflowY === value,
            );
            const isScrollable =
                settings?.expandScrollableContainers !== false &&
                clipsOverflow &&
                (src.scrollHeight > src.clientHeight + 2 ||
                    src.scrollWidth > src.clientWidth + 2);

            if (isScrollable) {
                clone.style.setProperty('overflow', 'visible', 'important');
                clone.style.setProperty('height', 'auto', 'important');
                clone.style.setProperty('max-height', 'none', 'important');
            }

            // Fix fixed/sticky positioning
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
        root.querySelectorAll(
            'script, style, link[rel="stylesheet"], noscript',
        ).forEach((el) => el.remove());
        // aria-hidden isn't a visibility signal (e.g. KaTeX marks its visible render aria-hidden); real CSS hiding is preserved via the untouched <head> stylesheets
        root.querySelectorAll('[hidden]').forEach((el) => el.remove());

        root.querySelectorAll('canvas[data-smart-printer-processed]').forEach(
            (el) => el.remove(),
        );

        root.querySelectorAll('*').forEach((el) => {
            el.removeAttribute('id');

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
        toolbar.setAttribute('data-smart-printer-toolbar', 'true');

        // Inline onclick handlers run in page context and are blocked by most sites' CSP
        const printBtn = document.createElement('button');
        printBtn.className = 'primary';
        printBtn.textContent = 'Print / Save as PDF';
        printBtn.addEventListener('click', () => window.print());

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Close Preview';
        cancelBtn.addEventListener('click', () => window.location.reload());

        const note = document.createElement('span');
        note.style.color = '#5f6368';
        note.textContent = 'Clean print preview (hidden elements removed)';

        toolbar.append(printBtn, cancelBtn, note);
        return toolbar;
    }
})();
