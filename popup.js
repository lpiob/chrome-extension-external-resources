document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: "getExternalResourceCount"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      
      if (response && response.externalResourceCount !== undefined) {
        document.getElementById('count').textContent = response.externalResourceCount;
        
        const resourceList = document.getElementById('resourceList');
        response.externalResourceUrls.forEach(url => {
          const li = document.createElement('li');
          li.textContent = url;
          resourceList.appendChild(li);
        });
      }
    });
  });
});

