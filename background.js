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
        contexts: ["page", "link", "selection", "image", "video", "audio"]
    });
    // Menú padre para Bot API
    chrome.contextMenus.create({
        id: "sendToTelegramBot",
        title: chrome.i18n.getMessage("sendBot"),
        contexts: ["all"]
    });
    // Submenús según el contexto
    chrome.contextMenus.create({
        id: "sendToTelegramBot_image",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("image"),
        contexts: ["image"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot_video",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("video"),
        contexts: ["video"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot_audio",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("audio"),
        contexts: ["audio"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot_selection",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("selection"),
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot_link",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("link"),
        contexts: ["link"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot_page",
        parentId: "sendToTelegramBot",
        title: chrome.i18n.getMessage("page"),
        contexts: ["page"]
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

        // Submenús Bot API
        if (info.menuItemId.startsWith("sendToTelegramBot")) {
            if (!token || !chat_id) {
                showError(chrome.i18n.getMessage("noTokenError"));
                return;
            }
            let endpoint = "sendMessage";
            let payload = { chat_id };
            let fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            };
            if (info.menuItemId === "sendToTelegramBot_image" && info.srcUrl) {
                endpoint = "sendPhoto";
                payload.photo = info.srcUrl;
            } else if (info.menuItemId === "sendToTelegramBot_audio" && info.srcUrl) {
                endpoint = "sendAudio";
                payload.audio = info.srcUrl;
            } else if (info.menuItemId === "sendToTelegramBot_video" && info.srcUrl) {
                endpoint = "sendVideo";
                payload.video = info.srcUrl;
            } else if (info.menuItemId === "sendToTelegramBot_selection" && info.selectionText) {
                payload.text = info.selectionText;
            } else if (info.menuItemId === "sendToTelegramBot_link" && info.linkUrl) {
                payload.text = info.linkUrl;
            } else if (info.menuItemId === "sendToTelegramBot_page" && info.pageUrl) {
                payload.text = info.pageUrl;
            } else {
                showError(chrome.i18n.getMessage("noContentError"));
                return;
            }
            fetchOptions.body = JSON.stringify(payload);
            fetch(`https://api.telegram.org/bot${token}/${endpoint}`, fetchOptions)
                .then(res => {
                    if (!res.ok) throw new Error(chrome.i18n.getMessage("botApiError"));
                })
                .catch(err => {
                    showError(err.message);
                });
        }
    });
});
