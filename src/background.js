var DEFAULT_CONFIG = {
  "version": "0.2-SNAPSHOT",
  "updatedOn": "Tue Jul 11 2023 19:52:49 GMT+0300 (Moscow Standard Time)",
  "settings": {
    "shortcuts": [
      {
        "id": "_execute_browser_action",
        "shortcut": "Ctrl+Alt+L",
      },
    ],
    "containerTabsOpeningControl": {
      "numberOfContainersInGroup": 3,
      "containersInGroupOpeningInterval": 500,
      "groupsOpeningInterval": 1000,
    },
  },
};
var LINKY_ADD_ON_CONFIG_STORAGE_KEY = 'LINKY_ADD_ON_CONFIG';

var linkyConfig;

// Set config values to storage when open add-on first time
browser.storage.local.get(LINKY_ADD_ON_CONFIG_STORAGE_KEY).then((data) => {
  if (Object.keys(data).length !== 0) {
    linkyConfig = JSON.parse(data[`${LINKY_ADD_ON_CONFIG_STORAGE_KEY}`]);
  } else {
    browser.storage.local.set({ [LINKY_ADD_ON_CONFIG_STORAGE_KEY]: JSON.stringify(DEFAULT_CONFIG) }).then(() => {
      linkyConfig = DEFAULT_CONFIG;
    });
  }
}).catch((error) => console.error(error));

async function openCurrentTabInAvailableContainers(tab) {
  const containers = (await browser.contextualIdentities.query({})).filter((container) => container.cookieStoreId !== tab.cookieStoreId);
  const numberContainersInGroup = linkyConfig.settings.containerTabsOpeningControl.numberOfContainersInGroup;
  let totalDelay = 0;

  containers.forEach((container, index) => {
    setTimeout(() => {
      browser.tabs.create({
        cookieStoreId: container.cookieStoreId,
        url: tab.url,
      });
    }, totalDelay);
    if ((index + 1) % numberContainersInGroup === 0) {
      totalDelay += linkyConfig.settings.containerTabsOpeningControl.groupsOpeningInterval;
    } else {
      totalDelay += linkyConfig.settings.containerTabsOpeningControl.containersInGroupOpeningInterval;
    }
  });
}

/*
Create the context menu item for browser tab - 'Open in available Containers'.
*/
browser.menus.create({
  id: 'linky',
  title: browser.i18n.getMessage('extensionContextMenuLink'),
  contexts: ['tab'],
});

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
  openCurrentTabInAvailableContainers(tab);
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
  openCurrentTabInAvailableContainers(tab);
});

// Listen for messages from option.js
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.name === 'linkyConfig') {
    // Update the value of linkyConfig
    linkyConfig = request.data;
    // Send back a response and confirmation status
    sendResponse({ response: linkyConfig, status: 'OK' });
  }
});
