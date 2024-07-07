function getHostname(url) {
  const a = document.createElement('a');
  a.href = url;

  return a.hostname;
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
  
  return externalResources.map(resource => resource.name);
}

function countExternalResources() {
  const externalResources = getExternalResources();
  const count = externalResources.length;
  
  chrome.runtime.sendMessage({ action: "updateBadge", count: count });
  return count;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getExternalResourceCount") {
    const externalResources = getExternalResources();
    sendResponse({ 
      externalResourceCount: externalResources.length,
      externalResourceUrls: externalResources
    });
  }
  return true;
});

// Set up a MutationObserver to detect changes in the DOM
const observer = new MutationObserver(() => {
  countExternalResources();
});

observer.observe(document.body, { childList: true, subtree: true });
