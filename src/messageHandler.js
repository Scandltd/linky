const messageHandler = {
  init() {
    // Handles messages from webextension code
    browser.runtime.onMessage.addListener(async (m) => {
      // TBD
    });
  },
};

messageHandler.init();
