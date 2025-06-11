function showError(message) {
    if (chrome.notifications) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: chrome.i18n.getMessage("errorTitle"),
            message: message
        });
    } else {
        console.error("Error: " + message);
        alert("Error: " + message);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "sendToTelegramDesktop",
        title: chrome.i18n.getMessage("sendDesktop"),
        contexts: ["page", "link", "image"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot",
        title: chrome.i18n.getMessage("sendBot"),
        contexts: ["page", "link", "image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const content = info.linkUrl || info.srcUrl || info.pageUrl;

    chrome.storage.local.get(["token", "chat_id", "telegram_username"], (result) => {
        const { token, chat_id, telegram_username } = result;

        if (!content) {
            showError(chrome.i18n.getMessage("noContentError"));
            return;
        }

        if (info.menuItemId === "sendToTelegramDesktop") {
            if (!telegram_username) {
                showError(chrome.i18n.getMessage("noAliasError"));
                return;
            }
            const desktopUrl = `tg://resolve?domain=${telegram_username}&text=${encodeURIComponent(content)}`;
            chrome.tabs.create({ url: desktopUrl });
        }

        if (info.menuItemId === "sendToTelegramBot") {
            if (!token || !chat_id) {
                showError(chrome.i18n.getMessage("noTokenError"));
                return;
            }
            fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chat_id,
                    text: content
                })
            })
                .then(res => {
                    if (!res.ok) throw new Error(chrome.i18n.getMessage("botApiError"));
                })
                .catch(err => {
                    showError(err.message);
                });
        }
    });
});
