let bkg = browser.extension.getBackgroundPage();
const LINKY_ADD_ON_CONFIG_STORAGE_KEY = bkg.LINKY_ADD_ON_CONFIG_STORAGE_KEY;
const DEFAULT_CONFIG = bkg.DEFAULT_CONFIG;

const sidebarMenuTabs = document.querySelectorAll('input[name="tab-group-1"]');
const optionsTitle = document.getElementById('options-title');
const shortcutClearBtnArray = document.querySelectorAll('.clear-button');
const shortcutResetBtnArray = document.querySelectorAll('.reset-button');
const inputsShortcutsArr = document.querySelectorAll('.shortcuts-input');
const inputsDelaySettingsArr = document.querySelectorAll('.delay-settings-input');
const numberContainersInGroupInput = document.getElementById('numberOfContainersInGroup');
const intervalBetweenContainersInput = document.getElementById('containersInGroupOpeningInterval');
const intervalBetweenGroupsInput = document.getElementById('groupsOpeningInterval');

let linkyConfig = bkg.linkyConfig;

// Setting configuration values on options page
numberContainersInGroupInput.value = linkyConfig.settings.containerTabsOpeningControl.numberOfContainersInGroup;
intervalBetweenContainersInput.value = linkyConfig.settings.containerTabsOpeningControl.containersInGroupOpeningInterval;
intervalBetweenGroupsInput.value = linkyConfig.settings.containerTabsOpeningControl.groupsOpeningInterval;

if (linkyConfig.settings.shortcuts.length) {
  inputsShortcutsArr.forEach((item) => {
    const getShortcutElement = linkyConfig.settings.shortcuts.find((el) => el.id === item.id);
    item.value = getShortcutElement.shortcut;
    browser.commands.update({
      name: item.id,
      shortcut: getShortcutElement.shortcut,
    });
  });
}

function saveSettings(configJson) {
  browser.storage.local.set({ [LINKY_ADD_ON_CONFIG_STORAGE_KEY]: JSON.stringify(linkyConfig) }).then(
    () => {
      linkyConfig = configJson;
      browser.runtime.sendMessage({ name: 'linkyConfig', data: linkyConfig }).then((response) => {
        console.log(response.status);
      }, (error) => {
        console.error(error);
      });
    },
    (error) => {
      console.error(error);
    },
  );
}

document.querySelectorAll('[data-locale]').forEach((elem) => {
  const i18nElement = elem;
  i18nElement.innerText = browser.i18n.getMessage(i18nElement.dataset.locale);
});

function updateBrowserCommands(event, value) {
  browser.commands.update({ name: event, shortcut: value });
}

sidebarMenuTabs.forEach((item) => {
  item.addEventListener('click', (e) => {
    if (e.target.checked) {
      optionsTitle.innerText = e.target.value;
    }
  });
});

function updateShortcut(targetId, shortcutValue) {
  let elem = linkyConfig.settings.shortcuts.find((el) => el.id === targetId.replace('_clear_btn', '').replace('_reset_btn', ''));
  if (elem) {
    elem.shortcut = shortcutValue;
  }
}

// Clear button handler
shortcutClearBtnArray.forEach((item) => {
  const currentId = item.id.replace('_clear_btn', '');
  const currentInput = document.getElementById(currentId);
  const currentError = document.getElementById(`${currentId}_error`);
  item.addEventListener('click', (e) => {
    currentInput.value = '';
    currentError.innerText = '';
    updateBrowserCommands(currentId, '');
    updateShortcut(e.target.id, '');
    saveSettings(linkyConfig);
  });
});

// Reset button handler
shortcutResetBtnArray.forEach((item) => {
  const currentId = item.id.replace('_reset_btn', '');
  const currentInput = document.getElementById(currentId);
  const currentError = document.getElementById(`${currentId}_error`);
  const getDefaultShortCutsById = DEFAULT_CONFIG.settings.shortcuts.find((el) => el.id === currentId);
  item.addEventListener('click', (e) => {
    currentInput.value = getDefaultShortCutsById.shortcut;
    currentError.innerText = '';
    updateBrowserCommands(currentId, currentInput.value);
    updateShortcut(e.target.id, getDefaultShortCutsById.shortcut);
    saveSettings(linkyConfig);
  });
});

function getOS() {
  const { userAgent } = window.navigator;
  const platform = window.navigator?.userAgentData?.platform || window.navigator.platform;
  const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iosPlatforms = ['iPhone', 'iPad', 'iPod'];

  if (macosPlatforms.indexOf(platform) !== -1) {
    return 'Mac OS';
  } if (iosPlatforms.indexOf(platform) !== -1) {
    return 'iOS';
  } if (windowsPlatforms.indexOf(platform) !== -1) {
    return 'Windows';
  } if (/Android/.test(userAgent)) {
    return 'Android';
  } if (/Linux/.test(platform)) {
    return 'Linux';
  }

  return null;
}
const isMac = getOS() === 'Mac OS';

const normalizeKey = (key, keyCode) => {
  const alphabet = /^([a-z]|[A-Z])$/;
  const digit = /^[0-9]$/;
  const func = /^F([0-9]|1[0-2])$/;
  if (alphabet.test(key) || digit.test(key) || func.test(key)) return key.toUpperCase();

  const homes = /^(Home|End|PageUp|PageDown|Insert|Delete)$/;
  if (homes.test(key)) return key;

  const space = /^\s$/;
  if (space.test(key)) return 'Space';

  const arrows = /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/;
  if (arrows.test(key)) return key.split('Arrow')[1];

  const medias = /^(MediaPlayPause|MediaStop)$/;
  if (medias.test(key)) return key;
  if (key === 'MediaTrackNext') return 'MediaNextTrack';
  if (key === 'MediaTrackPrevious') return 'MediaPrevTrack';

  const keyCode0 = 48;
  if (keyCode0 <= keyCode && keyCode <= keyCode0 + 9) return keyCode - keyCode0;

  if (keyCode === 188) return 'Comma';
  if (keyCode === 190) return 'Period';

  return '';
};

function showErrorMessage(e) {
  const normalizedKey = normalizeKey(e.key, e.keyCode);
  const errorElement = document.getElementById(`${e.target.id}_error`);
  errorElement.innerText = '';
  const mediaKeys = /^(MediaPlayPause|MediaStop|MediaNextTrack|MediaPrevTrack)$/;
  const funcKeys = /^F([0-9]|1[0-2])$/;
  const modifierKeys = /^(Control|Alt|Shift|Meta)$/;

  if (mediaKeys.test(normalizedKey) || funcKeys.test(normalizedKey)) errorElement.innerText = '';
  else if (modifierKeys.test(e.key)) errorElement.innerText = browser.i18n.getMessage('typeLetterMessage');
  else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
    errorElement.innerText = isMac
      ? errorElement.innerText = browser.i18n.getMessage('includeMacModifierKeysMessage')
      : errorElement.innerText = browser.i18n.getMessage('includeModifierKeysMessage');
  } else if (normalizedKey === '') errorElement.innerText = browser.i18n.getMessage('invalidLetterMessage');
}

function displayingInputValue(e) {
  const normalizedKey = normalizeKey(e.key, e.keyCode);
  const ctrlKeyMac = isMac ? 'MacCtrl+' : 'Ctrl+';
  const ctrlKey = e.ctrlKey ? ctrlKeyMac : '';
  const metaKey = e.metaKey && isMac ? 'Command+' : '';
  const altKey = e.altKey ? 'Alt+' : '';
  const shiftKey = e.shiftKey ? 'Shift+' : '';
  const value = `${ctrlKey}${metaKey}${altKey}${shiftKey}${normalizedKey}`;
  return value;
}

function checkAlreadyReservedCombination(value) {
  const reservedArray = ['Ctrl+Q', 'Ctrl+Z', 'Ctrl+X', 'Ctrl+D', 'Ctrl+C', 'Ctrl+V'];
  const reservedEl = reservedArray.find((element) => (element === value));
  if (reservedEl && reservedEl.length) {
    return true;
  }
  return false;
}

function handleKeyDown(e) {
  if (e.repeat) return;
  if (e.key === 'Tab') {
    window.document.activeElement.blur();
    return;
  }

  showErrorMessage(e);

  const value = displayingInputValue(e);
  const errorElement = document.getElementById(`${e.target.id}_error`);

  if (checkAlreadyReservedCombination(value)) {
    errorElement.innerText = browser.i18n.getMessage('invalidAlreadyReserved');
  }

  e.target.value = value || '';

  const isValidShortcut = errorElement.innerText === '';
  if (isValidShortcut) {
    updateBrowserCommands(e.target.id, value);
    updateShortcut(e.target.id, e.target.value);
    saveSettings(linkyConfig);
  }
}

// shortcuts setup
inputsShortcutsArr.forEach((item) => {
  item.addEventListener('keydown', (e) => {
    handleKeyDown(e);
  });
});

function handleChangesDelaysOptions(e) {
  const itemId = e.target.id;
  const warningElement = document.getElementById(`${itemId}_warning`);

  if (e.target.value === '') {
    warningElement.classList.add('show');
    e.target.value = e.target.getAttribute('data-previous-value');
    setTimeout(() => { warningElement.classList.remove('show'); }, 3000);
  } else {
    linkyConfig.settings.containerTabsOpeningControl[itemId] = Number(e.target.value);
    saveSettings(linkyConfig);
  }
}

// Add event listeners to each item using the same functions
inputsDelaySettingsArr.forEach((item) => {
  item.addEventListener('blur', handleChangesDelaysOptions);
  item.addEventListener('change', (el) => {
    el.target.focus();
  });
  item.addEventListener('focus', (el) => {
    el.target.setAttribute('data-previous-value', el.target.value);
  });
});
