const SETTINGS_KEYS = ["token", "chat_id", "telegram_username"];
const TELEGRAM_API_BASE_URL = "https://api.telegram.org";

function showNotification(title, message) {
    if (!chrome.notifications) {
        console.log(`${title}: ${message}`);
        return;
    }

    chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title,
        message
    });
}

function showError(message) {
    showNotification(chrome.i18n.getMessage("errorTitle"), message);
    console.error("Error: " + message);
}

function showSuccess(message) {
    showNotification(chrome.i18n.getMessage("successTitle"), message);
}

async function safeAsync(fn) {
    try {
        await fn();
    } catch (err) {
        showError(err && err.message ? err.message : chrome.i18n.getMessage("unknownError"));
    }
}

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

function resetContextMenus() {
    return new Promise((resolve) => {
        chrome.contextMenus.removeAll(() => {
            createContextMenus();
            resolve();
        });
    });
}

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

function getStoredSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(SETTINGS_KEYS, resolve);
    });
}

async function sendToTelegramApi(token, endpoint, payload) {
    const res = await fetch(`${TELEGRAM_API_BASE_URL}/bot${token}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok || !data || !data.ok) {
        const detail = data && data.description ? ` ${data.description}` : "";
        throw new Error(`${chrome.i18n.getMessage("botApiError")}${detail}`);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    safeAsync(resetContextMenus);
});

chrome.runtime.onStartup.addListener(() => {
    safeAsync(resetContextMenus);
});

chrome.contextMenus.onClicked.addListener((info) => {
    safeAsync(async () => {
        if (info.menuItemId === "sendToTelegramBot") {
            return;
        }

        const content = getContentFromContext(info);
        if (!content) {
            showError(chrome.i18n.getMessage("noContentError"));
            return;
        }

        const { token, chat_id, telegram_username } = await getStoredSettings();

        if (info.menuItemId === "sendToTelegramDesktop") {
            if (!telegram_username) {
                showError(chrome.i18n.getMessage("noAliasError"));
                return;
            }

            const desktopUrl = `tg://resolve?domain=${telegram_username}&text=${encodeURIComponent(content)}`;
            chrome.tabs.create({ url: desktopUrl });
            showSuccess(chrome.i18n.getMessage("desktopSendStarted"));
            return;
        }

        if (!info.menuItemId.startsWith("sendToTelegramBot")) {
            return;
        }

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
        await sendToTelegramApi(token, endpoint, payload);
        showSuccess(chrome.i18n.getMessage("botSendSuccess"));
    });
});
