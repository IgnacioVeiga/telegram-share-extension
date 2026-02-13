# Telegram Share Extension

A Chrome extension that allows you to share links, images, and text to Telegram directly from your browser.  
You can choose between using **Telegram Desktop** or the **Telegram Bot API** to send content.

## Features

- Share links, images, and text from the context menu.
- Choose the sending method directly from the context menu: **Telegram Desktop** or **Bot API**.
- Quick send item that uses your configured default method (**Desktop** or **Bot API**).
- Configure Telegram alias, Bot API token, and chat ID from the options page.
- Configure a default method for quick-send behavior from the options page.
- Live preview for bot token and chat ID validation from the options page.
- Inline test message sender to validate Bot API setup.
- Notifications on successful or failed actions.
- Modern, clean UI for settings.
- Local storage of settings (no external server involved).

## Privacy Policy

This extension does **not** collect, store, or share any personal data externally.  
All configuration data is stored locally in your browser.  
When you use validation previews in settings, the extension sends requests to Telegram APIs (`getMe`, `getChat`, `getFile`) to display bot/chat info.

See the [Privacy Policy](privacy_policy.md) for more details.

## Disclaimer

This extension is an unofficial tool and is not affiliated, associated, authorized, endorsed by, or in any way officially connected with **Telegram Messenger LLP**.

## License

This project is licensed under the MIT License.  
See the [LICENSE](LICENSE) file for full details.

---

## Languages

The extension currently includes interface translations for:
- English (`en`)
- Spanish (`es`)

Additional languages can be added using the i18n structure described in [INTERNATIONALIZATION_GUIDE.md](INTERNATIONALIZATION_GUIDE.md).

---

## Install

For now, you can load the extension manually:

1. Download the source code.
2. Go to `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the extension folder.

A Chrome Web Store release is planned.

---

## Contribution Guide

See the [Contributing Guidelines](CONTRIBUTING.md) for details.

---

## Contact

For issues or suggestions, feel free to open an issue or contact the developer.

---

## Documentation in other languages

This README is also available in other languages:

- [Versión Español](README.es.md)
