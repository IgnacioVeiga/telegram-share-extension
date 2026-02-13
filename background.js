const SETTINGS_KEYS = ["token", "chat_id", "telegram_username", "default_send_method"];
const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
const SEND_METHOD_DESKTOP = "desktop";
const SEND_METHOD_BOT = "bot";
const MENU_ID_DEFAULT = "sendToTelegramDefault";
const MENU_ID_DESKTOP = "sendToTelegramDesktop";
const MENU_ID_BOT_ROOT = "sendToTelegramBot";
const CONTENT_CONTEXTS = ["page", "link", "selection", "image", "video", "audio"];

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

function normalizeDefaultMethod(value) {
    return value === SEND_METHOD_BOT ? SEND_METHOD_BOT : SEND_METHOD_DESKTOP;
}

function createContextMenus() {
    chrome.contextMenus.create({
        id: MENU_ID_DEFAULT,
        title: chrome.i18n.getMessage("sendDefault"),
        contexts: CONTENT_CONTEXTS
    });
    chrome.contextMenus.create({
        id: MENU_ID_DESKTOP,
        title: chrome.i18n.getMessage("sendDesktop"),
        contexts: CONTENT_CONTEXTS
    });
    chrome.contextMenus.create({
        id: MENU_ID_BOT_ROOT,
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
            parentId: MENU_ID_BOT_ROOT,
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

function getContentFromContext(info) {
    return info.selectionText || info.linkUrl || info.srcUrl || info.pageUrl;
}

function buildTelegramPayloadByMenu(menuItemId, info, chat_id) {
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

function buildTelegramPayloadByContext(info, chat_id) {
    let endpoint = "sendMessage";
    let payload = { chat_id };

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
        return null;
    }

    return { endpoint, payload };
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

function validateHasContent(info) {
    return Boolean(getContentFromContext(info));
}

function ensureDesktopReady(info, telegram_username) {
    if (!validateHasContent(info)) {
        showError(chrome.i18n.getMessage("noContentError"));
        return false;
    }
    if (!telegram_username) {
        showError(chrome.i18n.getMessage("noAliasError"));
        return false;
    }
    return true;
}

function ensureBotReady(info, token, chat_id) {
    if (!validateHasContent(info)) {
        showError(chrome.i18n.getMessage("noContentError"));
        return false;
    }
    if (!token || !chat_id) {
        showError(chrome.i18n.getMessage("noTokenError"));
        return false;
    }
    return true;
}

function sendViaDesktop(info, telegram_username) {
    const content = getContentFromContext(info);
    const desktopUrl = `tg://resolve?domain=${telegram_username}&text=${encodeURIComponent(content)}`;
    chrome.tabs.create({ url: desktopUrl });
    showSuccess(chrome.i18n.getMessage("desktopSendStarted"));
}

async function sendViaBot(info, token, chat_id, menuItemId) {
    const built = menuItemId === MENU_ID_DEFAULT
        ? buildTelegramPayloadByContext(info, chat_id)
        : buildTelegramPayloadByMenu(menuItemId, info, chat_id);

    if (!built) {
        showError(chrome.i18n.getMessage("noContentError"));
        return;
    }

    await sendToTelegramApi(token, built.endpoint, built.payload);
    showSuccess(chrome.i18n.getMessage("botSendSuccess"));
}

chrome.runtime.onInstalled.addListener(() => {
    safeAsync(resetContextMenus);
});

chrome.runtime.onStartup.addListener(() => {
    safeAsync(resetContextMenus);
});

chrome.contextMenus.onClicked.addListener((info) => {
    safeAsync(async () => {
        if (info.menuItemId === MENU_ID_BOT_ROOT) {
            return;
        }

        const settings = await getStoredSettings();
        const token = settings.token;
        const chat_id = settings.chat_id;
        const telegram_username = settings.telegram_username;
        const defaultMethod = normalizeDefaultMethod(settings.default_send_method);

        if (info.menuItemId === MENU_ID_DEFAULT) {
            if (defaultMethod === SEND_METHOD_BOT) {
                if (!ensureBotReady(info, token, chat_id)) {
                    return;
                }
                await sendViaBot(info, token, chat_id, MENU_ID_DEFAULT);
            } else {
                if (!ensureDesktopReady(info, telegram_username)) {
                    return;
                }
                sendViaDesktop(info, telegram_username);
            }
            return;
        }

        if (info.menuItemId === MENU_ID_DESKTOP) {
            if (!ensureDesktopReady(info, telegram_username)) {
                return;
            }
            sendViaDesktop(info, telegram_username);
            return;
        }

        if (!info.menuItemId.startsWith("sendToTelegramBot")) {
            return;
        }

        if (!ensureBotReady(info, token, chat_id)) {
            return;
        }
        await sendViaBot(info, token, chat_id, info.menuItemId);
    });
});
