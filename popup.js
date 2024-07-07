document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    chrome.tabs.sendMessage(tabs[0].id, {action: "getExternalResourceCount"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }

      if (response) {

        document.getElementById('count').textContent = response.externalResourceCount;
        document.getElementById('failedCount').textContent = response.failedResourceCount;
        
        const resourceList = document.getElementById('resourceList');
        response.externalResourceUrls.forEach(url => {
          const li = document.createElement('li');
          li.textContent = url.url;
          if (response.failedResourceUrls.includes(url.url)) {
            li.style.color = 'red';
            li.textContent += ' (error)';
          }
          resourceList.appendChild(li);
        });
      }      
      
    });
  });

});
