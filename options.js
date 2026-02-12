const STORAGE_KEYS = ["token", "chat_id", "telegram_username"];
const TELEGRAM_API_BASE_URL = "https://api.telegram.org";

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
        chatIdPreview: document.getElementById("chatIdPreview"),
        chatIdPhoto: document.getElementById("chatIdPhoto"),
        saveButton: document.getElementById("saveButton"),
        botPreview: document.getElementById("botPreview")
    };

    let chatPreviewTimeout;
    let botPreviewTimeout;
    let chatPreviewRequestId = 0;
    let botPreviewRequestId = 0;

    function applyI18nTexts() {
        document.title = chrome.i18n.getMessage("extensionName");

        elements.settingsTitle.innerText = chrome.i18n.getMessage("settingsTitle");
        elements.telegramDesktopLegend.innerText = chrome.i18n.getMessage("telegramDesktopLegend");
        elements.telegramAliasLabel.innerText = chrome.i18n.getMessage("telegramAliasLabel");
        elements.telegramUsernameInput.title = chrome.i18n.getMessage("telegramAliasTitle");
        elements.telegramUsernameInput.placeholder = chrome.i18n.getMessage("telegramAliasPlaceholder");
        elements.botApiLegend.innerText = chrome.i18n.getMessage("botApiLegend");
        elements.botTokenLabel.innerText = chrome.i18n.getMessage("botTokenLabel");
        elements.tokenInput.placeholder = chrome.i18n.getMessage("botTokenPlaceholder");
        elements.chatIdLabel.innerText = chrome.i18n.getMessage("chatIdLabel");
        elements.chatIdInput.title = chrome.i18n.getMessage("chatIdTitle");
        elements.chatIdInput.placeholder = chrome.i18n.getMessage("chatIdPlaceholder");
        elements.chatIdPhoto.alt = chrome.i18n.getMessage("chatPhotoAlt");
        elements.saveButton.innerText = chrome.i18n.getMessage("saveButton");
        elements.saveButton.title = chrome.i18n.getMessage("saveButton");
    }

    async function callTelegramApi(token, endpoint, payload = null) {
        const requestOptions = payload
            ? {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
            : { method: "GET" };

        const res = await fetch(`${TELEGRAM_API_BASE_URL}/bot${token}/${endpoint}`, requestOptions);

        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }

        if (!res.ok || !data || !data.ok) {
            throw new Error();
        }

        return data.result;
    }

    applyI18nTexts();

    chrome.storage.local.get(STORAGE_KEYS, (result) => {
        elements.tokenInput.value = result.token || "";
        elements.chatIdInput.value = result.chat_id || "";
        elements.telegramUsernameInput.value = result.telegram_username || "";

        if (result.token && result.chat_id) {
            updateChatPreview(result.token.trim(), result.chat_id.trim());
        }
        if (result.token) {
            updateBotPreview(result.token.trim());
        }
    });

    elements.saveButton.addEventListener("click", () => {
        const token = elements.tokenInput.value.trim();
        const chat_id = elements.chatIdInput.value.trim();
        const telegram_username = elements.telegramUsernameInput.value.trim();

        if (telegram_username.includes("@")) {
            alert(chrome.i18n.getMessage("usernameError"));
            return;
        }

        chrome.storage.local.set({ token, chat_id, telegram_username }, () => {
            alert(chrome.i18n.getMessage("savedMessage"));
        });
    });

    elements.chatIdInput.addEventListener("input", onChatIdOrTokenChange);
    elements.tokenInput.addEventListener("input", onChatIdOrTokenChange);
    elements.tokenInput.addEventListener("input", onBotTokenChange);

    function onChatIdOrTokenChange() {
        clearTimeout(chatPreviewTimeout);
        chatPreviewTimeout = setTimeout(() => {
            const token = elements.tokenInput.value.trim();
            const chat_id = elements.chatIdInput.value.trim();

            if (token && chat_id) {
                updateChatPreview(token, chat_id);
                return;
            }

            chatPreviewRequestId += 1;
            renderChatPreview({ state: "empty" });
        }, 500);
    }

    function onBotTokenChange() {
        clearTimeout(botPreviewTimeout);
        botPreviewTimeout = setTimeout(() => {
            const token = elements.tokenInput.value.trim();

            if (token) {
                updateBotPreview(token);
                return;
            }

            botPreviewRequestId += 1;
            renderBotPreview({ state: "empty" });
        }, 500);
    }

    function renderChatPreview({ state, name = "", photoUrl = "" }) {
        if (state === "loading") {
            elements.chatIdPreview.textContent = chrome.i18n.getMessage("loadingPreview");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
            return;
        }

        if (state === "success") {
            elements.chatIdPreview.textContent = `${chrome.i18n.getMessage("previewLabel")} ${name}`;
            if (photoUrl) {
                elements.chatIdPhoto.src = photoUrl;
                elements.chatIdPhoto.style.display = "inline-block";
            } else {
                elements.chatIdPhoto.style.display = "none";
                elements.chatIdPhoto.src = "";
            }
            return;
        }

        if (state === "error") {
            elements.chatIdPreview.textContent = chrome.i18n.getMessage("invalidChatId");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
            return;
        }

        elements.chatIdPreview.textContent = "";
        elements.chatIdPhoto.style.display = "none";
        elements.chatIdPhoto.src = "";
    }

    async function updateChatPreview(token, chat_id) {
        const requestId = ++chatPreviewRequestId;
        renderChatPreview({ state: "loading" });

        try {
            const chat = await callTelegramApi(token, "getChat", { chat_id });
            if (requestId !== chatPreviewRequestId) {
                return;
            }

            let name = chat.title || chat.username || chat.first_name || chat.id;
            if (chat.last_name) {
                name += ` ${chat.last_name}`;
            }

            let photoUrl = "";
            if (chat.photo && chat.photo.small_file_id) {
                const fileResult = await callTelegramApi(token, "getFile", {
                    file_id: chat.photo.small_file_id
                });
                if (requestId !== chatPreviewRequestId) {
                    return;
                }
                if (fileResult && fileResult.file_path) {
                    photoUrl = `${TELEGRAM_API_BASE_URL}/file/bot${token}/${fileResult.file_path}`;
                }
            }

            renderChatPreview({ state: "success", name, photoUrl });
        } catch {
            if (requestId !== chatPreviewRequestId) {
                return;
            }
            renderChatPreview({ state: "error" });
        }
    }

    function renderBotPreview({ state, name = "" }) {
        if (state === "loading") {
            elements.botPreview.textContent = chrome.i18n.getMessage("loadingPreview");
            return;
        }

        if (state === "success") {
            elements.botPreview.textContent = `${chrome.i18n.getMessage("previewLabel")} ${name}`;
            return;
        }

        if (state === "error") {
            elements.botPreview.textContent = chrome.i18n.getMessage("invalidBotToken");
            return;
        }

        elements.botPreview.textContent = "";
    }

    async function updateBotPreview(token) {
        const requestId = ++botPreviewRequestId;
        renderBotPreview({ state: "loading" });

        try {
            const bot = await callTelegramApi(token, "getMe");
            if (requestId !== botPreviewRequestId) {
                return;
            }

            const name = bot.first_name + (bot.username ? ` (@${bot.username})` : "");
            renderBotPreview({ state: "success", name });
        } catch {
            if (requestId !== botPreviewRequestId) {
                return;
            }
            renderBotPreview({ state: "error" });
        }
    }
});
