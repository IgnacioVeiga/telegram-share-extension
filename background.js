// Notification and error utilities
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

// Promise error handling
async function safeAsync(fn) {
    try {
        await fn();
    } catch (err) {
        showError(err && err.message ? err.message : chrome.i18n.getMessage("unknownError"));
    }
}

// Context menu utilities
function createContextMenus() {
    chrome.contextMenus.create({
        id: "sendToTelegramDesktop",
        title: chrome.i18n.getMessage("sendDesktop"),
        contexts: ["page", "link", "selection", "image", "video", "audio"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot",
        title: chrome.i18n.getMessage("sendBot"),
        contexts: ["all"]
    });
    [
        { id: "image", context: "image" },
        { id: "video", context: "video" },
        { id: "audio", context: "audio" },
        { id: "selection", context: "selection" },
        { id: "link", context: "link" },
        { id: "page", context: "page" }
    ].forEach(({ id, context }) => {
        chrome.contextMenus.create({
            id: `sendToTelegramBot_${id}`,
            parentId: "sendToTelegramBot",
            title: chrome.i18n.getMessage(id),
            contexts: [context]
        });
    });
}

// Utilities to build Telegram payloads
function buildTelegramPayload(menuItemId, info, chat_id) {
    let endpoint = "sendMessage";
    let payload = { chat_id };
    if (menuItemId === "sendToTelegramBot_image" && info.srcUrl) {
        endpoint = "sendPhoto";
        payload.photo = info.srcUrl;
    } else if (menuItemId === "sendToTelegramBot_audio" && info.srcUrl) {
        endpoint = "sendAudio";
        payload.audio = info.srcUrl;
    } else if (menuItemId === "sendToTelegramBot_video" && info.srcUrl) {
        endpoint = "sendVideo";
        payload.video = info.srcUrl;
    } else if (menuItemId === "sendToTelegramBot_selection" && info.selectionText) {
        payload.text = info.selectionText;
    } else if (menuItemId === "sendToTelegramBot_link" && info.linkUrl) {
        payload.text = info.linkUrl;
    } else if (menuItemId === "sendToTelegramBot_page" && info.pageUrl) {
        payload.text = info.pageUrl;
    } else {
        return null;
    }
    return { endpoint, payload };
}

function getContentFromContext(info) {
    return info.selectionText || info.linkUrl || info.srcUrl || info.pageUrl;
}

// Register context menus on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll(() => {
        createContextMenus();
    });
});

// Context menu click handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
    safeAsync(async () => {
        const content = getContentFromContext(info);
        const result = await new Promise(resolve => chrome.storage.local.get(["token", "chat_id", "telegram_username"], resolve));
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
            return;
        }

        if (info.menuItemId.startsWith("sendToTelegramBot")) {
            if (!token || !chat_id) {
                showError(chrome.i18n.getMessage("noTokenError"));
                return;
            }
            const built = buildTelegramPayload(info.menuItemId, info, chat_id);
            if (!built) {
                showError(chrome.i18n.getMessage("noContentError"));
                return;
            }
            const { endpoint, payload } = built;
            const fetchOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            };
            const res = await fetch(`https://api.telegram.org/bot${token}/${endpoint}`, fetchOptions);
            if (!res.ok) throw new Error(chrome.i18n.getMessage("botApiError"));
        }
    });
});
