# Structure for storing Linky add-on settings

Below there is Linky add-on's settings JSON structure and default values.

```json
{
  "version": "0.2-SNAPSHOT",
  "updatedOn": "Tue Jul 11 2023 19:52:49 GMT+0300 (Moscow Standard Time)",
  "settings": {
    "shortcuts": [
      {
        "id": "_execute_browser_action",
        "shortcut": "Ctrl+Alt+L"
      }
    ],
    "containerTabsOpeningControl" : {
      "numberOfContainersInGroup": 3,
      "containersInGroupOpeningInterval": 500,
      "groupsOpeningInterval": 1000
    }
  }
}
```

Settings JSON stored in local data storage under key `LINKY_ADD_ON_CONFIG`.
