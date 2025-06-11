# 🌐 Internationalization (i18n) Guide

This extension supports multiple languages through the native Chrome Extensions internationalization system.

---

## 📦 Folder structure

```
_locales
├── en
│   └── messages.json
├── es
│   └── messages.json
└── fr
    └── messages.json (example)
```

---

## 📜 messages.json format

Each `messages.json` must follow this structure:

```json
{
  "keyName": {
    "message": "Translated text"
  }
}
```

You can optionally add a "description" field for context:

```json
{
  "saveButton": {
    "message": "Save",
    "description": "Text for the Save configuration button"
  }
}
```

---

## 📌 Adding a new language

1. Create a folder inside `_locales` named with the language code.
2. Copy a `messages.json` template and translate the texts.
3. Done! Chrome will load it automatically if the browser language matches.

---

## 📖 Dynamic text loading
Use `chrome.i18n.getMessage("keyName")` to retrieve translated strings.

Example:

```javascript
document.getElementById("settingsTitle").innerText = chrome.i18n.getMessage("settingsTitle");
element.setAttribute("title", chrome.i18n.getMessage("tooltipText"));
```

---

## 📋 Elements to translate
- Visible texts (`innerText`, `textContent`, `value`)
- Attributes (`title`, `placeholder`, `alt`)
- Context menu items in `background.js`

---

# 📃 Notifications & errors
Use `i18n` for notification titles and messages:

```javascript
chrome.notifications.create({
  type: "basic",
  iconUrl: "icons/icon128.png",
  title: chrome.i18n.getMessage("errorTitle"),
  message: chrome.i18n.getMessage("errorMessage")
});
```

---

## 📌 Limitations
- You can't translate static HTML without JavaScript.
- You can't change the browser’s language from the extension.

---

## 📚 Official documentation
[Chrome i18n API](https://developer.chrome.com/docs/extensions/reference/i18n/)

---

## ✅ Available languages
- English (en)
- Spanish (es)
- [Add more by creating a folder in `_locales/`]

---

💡 Want to contribute a translation? Just copy any existing `messages.json`, translate it, and place it inside a new `_locales/<lang>` folder.

