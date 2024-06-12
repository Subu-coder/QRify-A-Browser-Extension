// popup.js

chrome.tabs.query({ active: true, currentWindow: true }, getActiveTab);

let tabs = [];
const ignoredUrls = [
    "brave://",
    "chrome://",
    "edge://",
    "about:",
    "file://",
    "localhost",
    "127.0.0.1"
];

function getActiveTab(activeTabs) {
    const activeTab = activeTabs[0];
    const tabSelect = document.getElementById('tab-select');
    const qrCodeContainer = document.getElementById('qr-code');
    const darkVal = "#000000";
    const lightVal = "#FFFFFF";

    chrome.tabs.query({ currentWindow: true }, getTabs);

    function getTabs(tabsArray) {
        tabs = tabsArray;
        populateTabSelect(tabs, tabSelect);
        generateQRCode(activeTab.url, qrCodeContainer, darkVal, lightVal);

        tabSelect.addEventListener('change', function () {
            const selectedIndex = tabSelect.value;
            const selectedTabId = tabs[selectedIndex].id;

            chrome.tabs.get(selectedTabId, function (tab) {
                console.log("Tab URL:", tab.url);
                if (!tab.title) {
                    let retries = 0;
                    function retryGetTitle() {
                        chrome.tabs.get(selectedTabId, function (tab) {
                            if (tab.title) {
                                const url = tab.url;
                                generateQRCode(url, qrCodeContainer, darkVal, lightVal);
                            } else if (retries < 3) {
                                retries++;
                                setTimeout(retryGetTitle, 500);
                            }
                        });
                    }
                    retryGetTitle();
                } else {
                    const url = tab.url;
                    generateQRCode(url, qrCodeContainer, darkVal, lightVal);
                }
            });
        });
    }
}

function populateTabSelect(tabs, tabSelect) {
    tabSelect.innerHTML = ''; // Clear the select element
    tabs.forEach((tab, index) => {
        if (isValidUrl(tab.url) && !ignoredUrls.some(ignoredUrl => tab.url.startsWith(ignoredUrl))) { 
            const option = document.createElement('option');
            option.text = tab.title || 'Loading...'; // Show "Loading..." if title is not available
            option.value = index;
            tabSelect.add(option);

            if (tab.active) {
                tabSelect.value = index;
            }
        }
    });
}

function generateQRCode(url, qrCodeContainer, darkVal, lightVal) {
    if (!url || ignoredUrls.some(ignoredUrl => url.startsWith(ignoredUrl))) {
        qrCodeContainer.innerHTML = ''; // Remove any existing QR code
        const invalidMessage = document.createElement('h2');
        invalidMessage.textContent = 'Invalid URL';
        invalidMessage.style.color = 'red';
        qrCodeContainer.appendChild(invalidMessage);
        console.error("Invalid URL:", url);
        console.log("URL is empty or invalid. Check the tab URL property.");
        return;
    }

    // Remove the old QR code
    while (qrCodeContainer.firstChild) {
        qrCodeContainer.removeChild(qrCodeContainer.firstChild);
    }

    // Generate the new QR code
    new QRCode(qrCodeContainer, {
        text: url,
        width: 200,
        height: 200,
        colorDark: darkVal,
        colorLight: lightVal,
        correctLevel: QRCode.CorrectLevel.H,
        renderer: {
            container: 'div',
            cssClass: 'qr-code'
        }
    });
}

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}