// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    chrome.tabs.sendMessage(tabId, { action: "getExternalResourceCount" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      if (response && response.externalResourceCount !== undefined) {
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

// Function to update the badge
function updateBadge(tabId, count) {
  chrome.action.setBadgeText({ text: count.toString(), tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#4688F1", tabId: tabId });
}

