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
    chrome.contextMenus.create({
        id: "sendToTelegramBot",
        title: chrome.i18n.getMessage("sendBot"),
        contexts: ["page", "link", "selection", "image", "video", "audio"]
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

            // Determinar el tipo de contenido y el endpoint de Telegram
            let endpoint = "sendMessage";
            let payload = { chat_id };
            let fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            };

            if (info.mediaType === "image" && info.srcUrl) {
                endpoint = "sendPhoto";
                payload.photo = info.srcUrl;
            } else if (info.mediaType === "audio" && info.srcUrl) {
                endpoint = "sendAudio";
                payload.audio = info.srcUrl;
            } else if (info.mediaType === "video" && info.srcUrl) {
                endpoint = "sendVideo";
                payload.video = info.srcUrl;
            } else if (info.selectionText) {
                payload.text = info.selectionText;
            } else if (info.linkUrl) {
                payload.text = info.linkUrl;
            } else if (info.pageUrl) {
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
