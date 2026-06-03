/**
 * Smart Div Printer - Background Service Worker
 * Handles extension activation and script injection
 */

const RESTRICTED_PROTOCOLS = [
    'chrome:',
    'chrome-extension:',
    'edge:',
    'about:',
    'view-source:',
    'data:',
    'file:',
];

const RESTRICTED_HOSTS = [
    'chrome.google.com',
    'chromewebstore.google.com',
    'microsoftedge.microsoft.com',
];

chrome.action.onClicked.addListener(async (tab) => {
    if (!isValidTab(tab)) return;

    if (isRestrictedPage(tab.url)) {
        showBadge(tab.id, '✗', '#d93025', 2500);
        return;
    }

    try {
        // Check if content script is already injected
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => !!window.__smartDivPrinter,
        });

        if (result?.result) {
            // Already active - toggle it off by re-injecting (the script handles this)
            await injectContentScript(tab.id);
        } else {
            // Not active - inject for the first time
            await injectContentScript(tab.id);
            showBadge(tab.id, '✓', '#0d652d', 1500);
        }
    } catch (error) {
        console.error('Smart Div Printer injection failed:', error);
        showBadge(tab.id, '!', '#ea8600', 3000);
    }
});

async function injectContentScript(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
    });
}

function isValidTab(tab) {
    return tab?.id && tab?.url;
}

function isRestrictedPage(url) {
    if (!url) return true;

    const isRestrictedProtocol = RESTRICTED_PROTOCOLS.some((protocol) =>
        url.startsWith(protocol),
    );

    const isRestrictedHost = RESTRICTED_HOSTS.some((host) =>
        url.includes(host),
    );

    return isRestrictedProtocol || isRestrictedHost;
}

function showBadge(tabId, text, color, duration) {
    chrome.action.setBadgeText({ tabId, text });
    chrome.action.setBadgeBackgroundColor({ tabId, color });

    if (duration) {
        setTimeout(() => {
            chrome.action.setBadgeText({ tabId, text: '' });
        }, duration);
    }
}
