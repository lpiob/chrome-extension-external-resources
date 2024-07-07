let failedResources = [];

chrome.webRequest.onErrorOccurred.addListener(
  function(details){
    if (details.error && details.error !== 'net::ERR_ABORTED' && details.error !== 'net::ERR_BLOCKED_BY_ORB' && details.error !== 'net::ERR_FAILED' && details.error !== 'net::ERR_CACHE_MISS') {
      console.error(JSON.stringify(details));
      if (!failedResources[details.tabId]) {
        failedResources[details.tabId] = new Set();
      }
      failedResources[details.tabId].add(details.url);
      updateBadge(details.tabId);
    }
  },
  {urls: ["<all_urls>"]}
);

chrome.tabs.onRemoved.addListener((tabId) => {
  delete failedResources[tabId];
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { action: "getExternalResourceCount" }, (response) => {
      if (!chrome.runtime.lastError && response && response.externalResourceCount !== undefined) {
        updateBadge(tabId, response.externalResourceCount);
      }
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateBadge") {
    updateBadge(sender.tab.id, request.count);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getFailedResources") {
    sendResponse({ failedResources: Array.from(failedResources[sender.tab.id] || []) });
  }
});


// update badge
function updateBadge(tabId, count) {
  const failedCount = failedResources[tabId] ? failedResources[tabId].size : 0;
  const badgeText = failedCount > 0 ? `${failedCount}!` : count.toString();
  const badgeColor = failedCount > 0 ? "#FF0000" : "#4688F1"; 
  chrome.action.setBadgeText({ text: badgeText, tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: badgeColor, tabId: tabId });
}

