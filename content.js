const anchorElement = document.createElement('a');

function getHostname(url) {
  anchorElement.href = url;

  return anchorElement.hostname;
}

function getExternalResources() {
  const currentHostname = window.location.hostname.replace(/^www\./, '');
  const resources = performance.getEntriesByType('resource');

  const externalResources = resources.filter(resource => {
    const resourceHostname = getHostname(resource.name);
    return (
      resourceHostname !== '' && 
      resourceHostname !== currentHostname &&
      !resourceHostname.endsWith('.'+currentHostname)
    );
  });
  
  return externalResources.map(resource => ({
    url: resource.name
  }));
}

function countExternalResources() {
  const externalResources = getExternalResources();
  const count = externalResources.length;
  const failedCount = externalResources.filter(r => r.failed).length;
  
  chrome.runtime.sendMessage({ action: "updateBadge", count: count, failedCount: failedCount });
  return count;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExternalResourceCount") {
    const externalResources = getExternalResources();
    chrome.runtime.sendMessage({action: "getFailedResources"}, (response) => {
      sendResponse({ 
        externalResourceCount: externalResources.length,
        failedResourceCount: response.failedResources.length,
        externalResourceUrls: externalResources,
        failedResourceUrls: response.failedResources
      });
    });    
  }
  return true;
});

// Set up a MutationObserver to detect changes in the DOM
const observer = new MutationObserver(() => {
  countExternalResources();
});

observer.observe(document.body, { childList: true, subtree: true });
