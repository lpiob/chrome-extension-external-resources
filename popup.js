document.addEventListener('DOMContentLoaded', function() {
    // Function to update the popup with data
    function updatePopup(data) {
        const { resources, errors } = data;

        const uniqueDomains = resources.reduce((acc, curr) => {
          const hostname = new URL(curr).hostname;
          acc[hostname] = (acc[hostname] || 0) + 1;
          return acc;
        }, {});
        
        // Update summary
        document.getElementById('resourceCount').textContent = resources.length;
        document.getElementById('errorCount').textContent = Object.keys(errors).length;
        
        // Update resource list
        const resourceList = document.getElementById('resourceList');
        resourceList.innerHTML = '';
        //resources.forEach(url => {
        for (const hostname in uniqueDomains) {
            const li = document.createElement('li');
            li.textContent = hostname + " (" + uniqueDomains[hostname] + ")";
            li.title = hostname;
            resourceList.appendChild(li);
        };
        
        // Update error list
        const errorList = document.getElementById('errorList');
        errorList.innerHTML = '';
        Object.entries(errors).forEach(([url, error]) => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${new URL(url).hostname}</strong>: ${error}`;
            li.title = url;
            errorList.appendChild(li);
        });
        if (Object.keys(errors).length === 0) {
          const li = document.createElement('li');
          li.textContent = "No errors found.";
          errorList.appendChild(li);
        }
    }
    
    // Function to fetch data from the background script
    function fetchData() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const activeTab = tabs[0];
            chrome.runtime.sendMessage({action: "getResourceData", tabId: activeTab.id}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError);
                    return;
                }
                updatePopup(response);
            });
        });
    }
    
    // Fetch data when popup is opened
    fetchData();
    
    // Add refresh button functionality
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh';
    refreshButton.addEventListener('click', fetchData);
    document.body.insertBefore(refreshButton, document.body.firstChild);
    
    // Set up auto-refresh
    setInterval(fetchData, 5000); // Refresh every 5 seconds
});
