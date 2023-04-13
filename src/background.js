/*
Open current tab in available Containers.
*/
async function openCurrentTabInAvailableContainers(
    currentTabUrl,
    currentCookieStoreId
) {
    const containers = await browser.contextualIdentities.query({});
    containers.forEach(function (container) {
        if (container.cookieStoreId !== currentCookieStoreId) {
            browser.tabs.create({
                cookieStoreId: container.cookieStoreId,
                url: currentTabUrl,
            });
        }
    });
}

/*
Create the context menu item for browser tab - 'Open in available Containers'.
*/
browser.menus.create({
    id: "linky",
    title: browser.i18n.getMessage("extensionContextMenuLink"),
    contexts: ["tab"],
});

/*
The click event listener, where we perform the appropriate action
when extension menu item ('Open in available Containers') was clicked.
*/
browser.menus.onClicked.addListener((info, tab) => {
    openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId);
});

/*
The click event listener, where we perform the appropriate action
when extension icon was clicked.
*/
browser.browserAction.onClicked.addListener((tab, OnClickData) => {
    openCurrentTabInAvailableContainers(tab.url, tab.cookieStoreId);
});
