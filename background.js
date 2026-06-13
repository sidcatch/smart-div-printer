/**
 * Smart Div Printer - Background Service Worker
 * Handles extension activation and messaging
 */

// No action needed - popup handles all interactions
// Content script is injected by popup.js when user selects a mode

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'elementHidden') {
        // Optional: Could show a notification or badge
        console.log('Element hidden from print');
    }
    sendResponse({ success: true });
});
