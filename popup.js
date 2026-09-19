/**
 * Smart Div Printer - Popup Script
 * Manages the popup UI and mode selection
 */

let currentHostname = '';

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentSite();
    await loadHiddenElements();
    await loadSkipPrintWarningSetting();
    await loadPreserveParentStylesSettings();
    attachEventListeners();
});

// Load the skip-print-warning preference
async function loadSkipPrintWarningSetting() {
    try {
        const result = await chrome.storage.local.get('skipPrintWarning');
        document.getElementById('skipPrintWarningCheckbox').checked =
            !!result.skipPrintWarning;
    } catch (error) {
        console.error('Error loading print warning preference:', error);
    }
}

// Load the preserve-parent-styles preferences (preserve is on by default)
async function loadPreserveParentStylesSettings() {
    try {
        const result = await chrome.storage.local.get([
            'preserveParentStyles',
            'removeParentAlignment',
        ]);
        const preserveParentStyles = result.preserveParentStyles !== false;
        document.getElementById('preserveParentStylesCheckbox').checked =
            preserveParentStyles;
        document.getElementById('removeParentAlignmentCheckbox').checked =
            !!result.removeParentAlignment;
        updateRemoveParentAlignmentRowState(preserveParentStyles);
    } catch (error) {
        console.error(
            'Error loading preserve parent styles preference:',
            error,
        );
    }
}

// The alignment sub-setting only makes sense while parent preservation is on
function updateRemoveParentAlignmentRowState(preserveParentStyles) {
    const row = document.getElementById('removeParentAlignmentRow');
    row.classList.toggle('settings-row-disabled', !preserveParentStyles);
}

// Collapsed by default; toggles the hidden-elements list visibility
function toggleHiddenSection() {
    const toggle = document.getElementById('hiddenSectionToggle');
    const body = document.getElementById('hiddenSectionBody');
    const expanded = toggle.getAttribute('aria-expanded') === 'true';

    toggle.setAttribute('aria-expanded', String(!expanded));
    body.hidden = expanded;
}

// Load current site information
async function loadCurrentSite() {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (tab?.url) {
            const url = new URL(tab.url);
            currentHostname = url.hostname;
            document.getElementById('currentSite').textContent =
                currentHostname;
        }
    } catch (error) {
        console.error('Error loading current site:', error);
        document.getElementById('currentSite').textContent =
            'Error loading site';
    }
}

// Load hidden elements for current site
async function loadHiddenElements() {
    try {
        const result = await chrome.storage.local.get('hiddenElements');
        const allHidden = result.hiddenElements || {};
        const siteHidden = allHidden[currentHostname] || [];

        const hiddenCount = siteHidden.length;
        const activeCount = siteHidden.filter(
            (el) => el.enabled !== false,
        ).length;

        // Update count
        document.getElementById('hiddenCount').textContent = hiddenCount;

        // Update stats
        if (hiddenCount > 0) {
            document.getElementById('statsText').textContent =
                `${activeCount} active, ${hiddenCount - activeCount} disabled`;
        } else {
            document.getElementById('statsText').textContent = 'Ready to print';
        }

        // Show/hide clear all button
        document.getElementById('clearAllBtn').style.display =
            hiddenCount > 0 ? 'block' : 'none';

        // Render list
        if (hiddenCount === 0) {
            document.getElementById('emptyState').style.display = 'flex';
            document.getElementById('hiddenList').style.display = 'none';
        } else {
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('hiddenList').style.display = 'block';
            renderHiddenList(siteHidden);
        }
    } catch (error) {
        console.error('Error loading hidden elements:', error);
    }
}

// Render hidden elements list
function renderHiddenList(elements) {
    const list = document.getElementById('hiddenList');
    list.innerHTML = '';

    elements.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className =
            'hidden-item' + (item.enabled === false ? ' disabled' : '');

        const date = new Date(item.addedAt);
        const dateStr =
            date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        itemEl.innerHTML = `
            <div class="hidden-item-header">
                <label class="checkbox-label">
                    <input type="checkbox" class="hidden-item-checkbox" data-index="${index}" ${item.enabled !== false ? 'checked' : ''}>
                    <span class="checkbox-custom"></span>
                </label>
                <div class="hidden-item-info">
                    <div class="hidden-item-description">${escapeHtml(item.description)}</div>
                    <div class="hidden-item-selector">${escapeHtml(item.selector)}</div>
                    <div class="hidden-item-date">Added ${dateStr}</div>
                </div>
            </div>
            <button class="btn-delete" data-index="${index}" title="Delete permanently">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        `;

        list.appendChild(itemEl);
    });

    // Attach checkbox event listeners
    list.querySelectorAll('.hidden-item-checkbox').forEach((checkbox) => {
        checkbox.addEventListener('change', handleToggle);
    });

    // Attach delete button event listeners
    list.querySelectorAll('.btn-delete').forEach((button) => {
        button.addEventListener('click', handleDelete);
    });
}

// Attach event listeners
function attachEventListeners() {
    document
        .getElementById('selectPrintBtn')
        .addEventListener('click', () => startSelection('print'));
    document
        .getElementById('selectHideBtn')
        .addEventListener('click', () => startSelection('hide'));
    document.getElementById('clearAllBtn').addEventListener('click', clearAll);
    document
        .getElementById('hiddenSectionToggle')
        .addEventListener('click', toggleHiddenSection);
    document
        .getElementById('skipPrintWarningCheckbox')
        .addEventListener('change', async (event) => {
            try {
                await chrome.storage.local.set({
                    skipPrintWarning: event.target.checked,
                });
            } catch (error) {
                console.error('Error saving print warning preference:', error);
            }
        });
    document
        .getElementById('preserveParentStylesCheckbox')
        .addEventListener('change', async (event) => {
            updateRemoveParentAlignmentRowState(event.target.checked);
            try {
                await chrome.storage.local.set({
                    preserveParentStyles: event.target.checked,
                });
            } catch (error) {
                console.error(
                    'Error saving preserve parent styles preference:',
                    error,
                );
            }
        });
    document
        .getElementById('removeParentAlignmentCheckbox')
        .addEventListener('change', async (event) => {
            try {
                await chrome.storage.local.set({
                    removeParentAlignment: event.target.checked,
                });
            } catch (error) {
                console.error(
                    'Error saving remove parent alignment preference:',
                    error,
                );
            }
        });
}

// Start selection mode
async function startSelection(mode) {
    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });

        // Check if content script is already injected (flag persists after deactivation, only cleared by navigation)
        let isInjected = false;
        try {
            const [result] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => window.__smartDivPrinterInitialized === true,
            });
            isInjected = result?.result;
        } catch (e) {
            // Script not injected yet
        }

        // Only inject if not already present
        if (!isInjected) {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js'],
            });
        }

        // Send message to start selection with specified mode
        await chrome.tabs.sendMessage(tab.id, {
            type: 'startSelection',
            mode: mode,
        });

        // Close popup
        window.close();
    } catch (error) {
        console.error('Error starting selection:', error);
    }
}

// Toggle element enabled state
async function handleToggle(event) {
    const index = parseInt(event.target.dataset.index);
    const enabled = event.target.checked;

    try {
        const result = await chrome.storage.local.get('hiddenElements');
        const allHidden = result.hiddenElements || {};
        const siteHidden = allHidden[currentHostname] || [];

        if (siteHidden[index]) {
            siteHidden[index].enabled = enabled;
            allHidden[currentHostname] = siteHidden;
            await chrome.storage.local.set({ hiddenElements: allHidden });

            // Refresh the list
            await loadHiddenElements();

            // Apply changes to the page
            const [tab] = await chrome.tabs.query({
                active: true,
                currentWindow: true,
            });
            await chrome.tabs.sendMessage(tab.id, {
                type: 'applyHiddenElements',
            });
        }
    } catch (error) {
        console.error('Error toggling element:', error);
    }
}

// Delete element
async function handleDelete(event) {
    const index = parseInt(event.target.closest('.btn-delete').dataset.index);

    if (!confirm('Permanently delete this hidden element?')) {
        return;
    }

    try {
        const result = await chrome.storage.local.get('hiddenElements');
        const allHidden = result.hiddenElements || {};
        const siteHidden = allHidden[currentHostname] || [];

        siteHidden.splice(index, 1);
        allHidden[currentHostname] = siteHidden;
        await chrome.storage.local.set({ hiddenElements: allHidden });

        // Refresh the list
        await loadHiddenElements();

        // Apply changes to the page
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        await chrome.tabs.sendMessage(tab.id, { type: 'applyHiddenElements' });
    } catch (error) {
        console.error('Error deleting element:', error);
    }
}

// Clear all hidden elements for this site
async function clearAll() {
    if (!confirm(`Clear all hidden elements for ${currentHostname}?`)) {
        return;
    }

    try {
        const result = await chrome.storage.local.get('hiddenElements');
        const allHidden = result.hiddenElements || {};

        allHidden[currentHostname] = [];
        await chrome.storage.local.set({ hiddenElements: allHidden });

        // Refresh the list
        await loadHiddenElements();

        // Apply changes to the page
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        await chrome.tabs.sendMessage(tab.id, { type: 'applyHiddenElements' });
    } catch (error) {
        console.error('Error clearing all:', error);
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
