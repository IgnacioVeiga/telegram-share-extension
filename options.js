document.addEventListener("DOMContentLoaded", () => {
    const elements = {
        settingsTitle: document.getElementById("settingsTitle"),
        telegramDesktopLegend: document.getElementById("telegramDesktopLegend"),
        telegramAliasLabel: document.getElementById("telegramAliasLabel"),
        telegramUsernameInput: document.getElementById("telegram_username"),
        botApiLegend: document.getElementById("botApiLegend"),
        botTokenLabel: document.getElementById("botTokenLabel"),
        tokenInput: document.getElementById("token"),
        chatIdLabel: document.getElementById("chatIdLabel"),
        chatIdInput: document.getElementById("chat_id"),
        saveButton: document.getElementById("saveButton")
    };

    // Set texts
    elements.settingsTitle.innerText = chrome.i18n.getMessage("settingsTitle");
    elements.telegramDesktopLegend.innerText = chrome.i18n.getMessage("telegramDesktopLegend");
    elements.telegramAliasLabel.innerText = chrome.i18n.getMessage("telegramAliasLabel");
    elements.telegramUsernameInput.title = chrome.i18n.getMessage("telegramAliasTitle");

    elements.botApiLegend.innerText = chrome.i18n.getMessage("botApiLegend");
    elements.botTokenLabel.innerText = chrome.i18n.getMessage("botTokenLabel");
    elements.chatIdLabel.innerText = chrome.i18n.getMessage("chatIdLabel");
    elements.chatIdInput.title = chrome.i18n.getMessage("chatIdTitle");

    elements.saveButton.innerText = chrome.i18n.getMessage("saveButton");
    elements.saveButton.title = chrome.i18n.getMessage("saveButton");

    // Load stored values
    chrome.storage.local.get(["token", "chat_id", "telegram_username"], (result) => {
        elements.tokenInput.value = result.token || "";
        elements.chatIdInput.value = result.chat_id || "";
        elements.telegramUsernameInput.value = result.telegram_username || "";
    });

    elements.saveButton.addEventListener("click", () => {
        const token = elements.tokenInput.value;
        const chat_id = elements.chatIdInput.value;
        const telegram_username = elements.telegramUsernameInput.value;

        if (telegram_username.includes("@")) {
            alert(chrome.i18n.getMessage("usernameError"));
            return;
        }

        chrome.storage.local.set({ token, chat_id, telegram_username }, () => {
            alert(chrome.i18n.getMessage("savedMessage"));
        });
    });
});
