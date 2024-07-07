let tabData = {};

// List of error codes we're interested in
const errorCodesOfInterest = [
  'net::ERR_NAME_NOT_RESOLVED',
  'net::ERR_NAME_RESOLUTION_FAILED',
  'net::ERR_CONNECTION_REFUSED',
  'net::ERR_CONNECTION_RESET',
  'net::ERR_CONNECTION_FAILED',
  'net::ERR_CONNECTION_TIMED_OUT',
  'net::ERR_ADDRESS_UNREACHABLE',
  'net::ERR_DNS_TIMED_OUT'
];

async function getTabUrlById(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.url) {
      return tab.url;
    } else {
      throw new Error("Tab not found or does not have a URL.");
    }
  } catch (error) {
    console.error("Error getting tab URL:", error);
    return null; // Or handle the error differently
  }
}

// Listen for web requests
//chrome.webRequest.onBeforeRequest.addListener(
chrome.webRequest.onBeforeSendHeaders.addListener(
  async function(details) {
    if (details.tabId === -1) return; // Ignore non-tab requests

    if (!tabData[details.tabId]) {
      tabData[details.tabId] = { resources: new Set(), errors: [] };
    }

    const url = new URL(details.url);
    const documentUrl = new URL(await getTabUrlById(details.tabId));

    if (url.hostname !== documentUrl.hostname) {
      tabData[details.tabId].resources.add(details.url);
      updateBadge(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

// Listen for errors
chrome.webRequest.onErrorOccurred.addListener(
  details => {
    if (details.tabId === -1) return; // Ignore non-tab errors

    if (errorCodesOfInterest.includes(details.error)) {
      if (!tabData[details.tabId]) {
        tabData[details.tabId] = { resources: new Set(), errors: {} };
      }
      tabData[details.tabId].errors[details.url] = details.error;
      updateBadge(details.tabId);
    }
  },
  { urls: ["<all_urls>"] }
);

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabData[tabId];
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // Reset data for this tab
    tabData[tabId] = { resources: new Set(), errors: {} };
    updateBadge(tabId);
  }
});

// Update badge
function updateBadge(tabId) {
  if (!tabData[tabId]) return;

  const resourceCount = tabData[tabId].resources.size;
  const errorCount = Object.keys(tabData[tabId].errors).length;

  chrome.action.setBadgeText({ 
    text: resourceCount.toString(), 
    tabId: tabId 
  });

  chrome.action.setBadgeBackgroundColor({
    color: errorCount > 0 ? '#FF0000' : '#4CAF50',
    tabId: tabId
  });
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getResourceData') {
    const tabId = sender.tab ? sender.tab.id : request.tabId;
    if (tabData[tabId]) {
      sendResponse({
        resources: Array.from(tabData[tabId].resources),
        errors: tabData[tabId].errors
      });
    } else {
      sendResponse({ resources: [], errors: {} });
    }
  }
  return true; // Keeps the message channel open for asynchronous responses
});
