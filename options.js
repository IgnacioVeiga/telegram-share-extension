const STORAGE_KEYS = ["token", "chat_id", "telegram_username", "default_send_method"];
const TELEGRAM_API_BASE_URL = "https://api.telegram.org";
const INPUT_DEBOUNCE_MS = 500;
const TOAST_VISIBLE_MS = 3500;
const TOAST_ANIMATION_MS = 180;
const SEND_METHOD_DESKTOP = "desktop";
const SEND_METHOD_BOT = "bot";

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
        chatStatusBadge: document.getElementById("chatStatusBadge"),
        saveButton: document.getElementById("saveButton"),
        botPreview: document.getElementById("botPreview"),
        botStatusBadge: document.getElementById("botStatusBadge"),
        defaultMethodLabel: document.getElementById("defaultMethodLabel"),
        defaultMethodDesktop: document.getElementById("defaultMethodDesktop"),
        defaultMethodDesktopLabel: document.getElementById("defaultMethodDesktopLabel"),
        defaultMethodBot: document.getElementById("defaultMethodBot"),
        defaultMethodBotLabel: document.getElementById("defaultMethodBotLabel"),
        defaultMethodHint: document.getElementById("defaultMethodHint"),
        testMessageLabel: document.getElementById("testMessageLabel"),
        testMessageInput: document.getElementById("test_message"),
        sendTestButton: document.getElementById("sendTestButton"),
        toastRegion: document.getElementById("toastRegion")
    };

    let chatPreviewTimeout;
    let botPreviewTimeout;
    let chatPreviewRequestId = 0;
    let botPreviewRequestId = 0;

    function t(key) {
        return chrome.i18n.getMessage(key) || key;
    }

    function normalizeDefaultMethod(value) {
        return value === SEND_METHOD_BOT ? SEND_METHOD_BOT : SEND_METHOD_DESKTOP;
    }

    function getSelectedDefaultMethod() {
        if (elements.defaultMethodBot.checked) {
            return SEND_METHOD_BOT;
        }
        return SEND_METHOD_DESKTOP;
    }

    function applySelectedDefaultMethod(value) {
        const normalized = normalizeDefaultMethod(value);
        elements.defaultMethodDesktop.checked = normalized === SEND_METHOD_DESKTOP;
        elements.defaultMethodBot.checked = normalized === SEND_METHOD_BOT;
    }

    function applyI18nTexts() {
        document.title = t("extensionName");

        elements.settingsTitle.innerText = t("settingsTitle");
        elements.telegramDesktopLegend.innerText = t("telegramDesktopLegend");
        elements.telegramAliasLabel.innerText = t("telegramAliasLabel");
        elements.telegramUsernameInput.title = t("telegramAliasTitle");
        elements.telegramUsernameInput.placeholder = t("telegramAliasPlaceholder");
        elements.botApiLegend.innerText = t("botApiLegend");
        elements.botTokenLabel.innerText = t("botTokenLabel");
        elements.tokenInput.placeholder = t("botTokenPlaceholder");
        elements.chatIdLabel.innerText = t("chatIdLabel");
        elements.chatIdInput.title = t("chatIdTitle");
        elements.chatIdInput.placeholder = t("chatIdPlaceholder");
        elements.chatIdPhoto.alt = t("chatPhotoAlt");
        elements.defaultMethodLabel.innerText = t("defaultMethodLabel");
        elements.defaultMethodDesktopLabel.innerText = t("defaultMethodDesktop");
        elements.defaultMethodBotLabel.innerText = t("defaultMethodBot");
        elements.defaultMethodHint.innerText = t("defaultMethodHint");
        elements.testMessageLabel.innerText = t("testMessageLabel");
        elements.testMessageInput.placeholder = t("testMessagePlaceholder");
        elements.saveButton.innerText = t("saveButton");
        elements.saveButton.title = t("saveButton");
        elements.sendTestButton.innerText = t("sendTestButton");
        elements.sendTestButton.title = t("sendTestButton");
    }

    function showToast(message, variant = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${variant}`;
        toast.textContent = message;
        toast.setAttribute("role", "status");
        elements.toastRegion.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add("is-visible");
        });

        setTimeout(() => {
            toast.classList.remove("is-visible");
            setTimeout(() => {
                toast.remove();
            }, TOAST_ANIMATION_MS);
        }, TOAST_VISIBLE_MS);
    }

    function setStatusBadge(element, state, label) {
        element.classList.remove("is-loading", "is-success", "is-error");

        if (state === "loading") {
            element.classList.add("is-loading");
        } else if (state === "success") {
            element.classList.add("is-success");
        } else if (state === "error") {
            element.classList.add("is-error");
        }

        element.textContent = label;
    }

    function setTestButtonLoading(isLoading) {
        elements.sendTestButton.disabled = isLoading;
        elements.sendTestButton.innerText = isLoading ? t("sendTestButtonSending") : t("sendTestButton");
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
            const detail = data && data.description ? data.description : "";
            throw new Error(detail || t("unknownError"));
        }

        return data.result;
    }

    function renderChatPreview({ state, name = "", photoUrl = "" }) {
        if (state === "loading") {
            elements.chatIdPreview.textContent = t("loadingPreview");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
            setStatusBadge(elements.chatStatusBadge, "loading", t("statusChecking"));
            return;
        }

        if (state === "success") {
            elements.chatIdPreview.textContent = `${t("previewLabel")} ${name}`;
            if (photoUrl) {
                elements.chatIdPhoto.src = photoUrl;
                elements.chatIdPhoto.style.display = "inline-block";
            } else {
                elements.chatIdPhoto.style.display = "none";
                elements.chatIdPhoto.src = "";
            }
            setStatusBadge(elements.chatStatusBadge, "success", t("statusReady"));
            return;
        }

        if (state === "error") {
            elements.chatIdPreview.textContent = t("invalidChatId");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
            setStatusBadge(elements.chatStatusBadge, "error", t("statusError"));
            return;
        }

        elements.chatIdPreview.textContent = "";
        elements.chatIdPhoto.style.display = "none";
        elements.chatIdPhoto.src = "";
        setStatusBadge(elements.chatStatusBadge, "idle", t("statusIdle"));
    }

    function renderBotPreview({ state, name = "" }) {
        if (state === "loading") {
            elements.botPreview.textContent = t("loadingPreview");
            setStatusBadge(elements.botStatusBadge, "loading", t("statusChecking"));
            return;
        }

        if (state === "success") {
            elements.botPreview.textContent = `${t("previewLabel")} ${name}`;
            setStatusBadge(elements.botStatusBadge, "success", t("statusReady"));
            return;
        }

        if (state === "error") {
            elements.botPreview.textContent = t("invalidBotToken");
            setStatusBadge(elements.botStatusBadge, "error", t("statusError"));
            return;
        }

        elements.botPreview.textContent = "";
        setStatusBadge(elements.botStatusBadge, "idle", t("statusIdle"));
    }

    async function updateChatPreview(token, chat_id) {
        // Request id avoids stale responses overriding newer preview state.
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
        }, INPUT_DEBOUNCE_MS);
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
        }, INPUT_DEBOUNCE_MS);
    }

    async function onSendTestClick() {
        const token = elements.tokenInput.value.trim();
        const chat_id = elements.chatIdInput.value.trim();
        let testText = elements.testMessageInput.value.trim();

        if (!token || !chat_id) {
            showToast(t("noTokenError"), "error");
            return;
        }

        if (!testText) {
            testText = t("defaultTestMessage");
        }

        setTestButtonLoading(true);
        try {
            await callTelegramApi(token, "sendMessage", {
                chat_id,
                text: testText
            });
            showToast(t("testMessageSent"), "success");
        } catch (err) {
            const detail = err && err.message && err.message !== t("unknownError")
                ? ` ${err.message}`
                : "";
            showToast(`${t("testMessageFailed")}${detail}`, "error");
        } finally {
            setTestButtonLoading(false);
        }
    }

    function onSaveClick() {
        const token = elements.tokenInput.value.trim();
        const chat_id = elements.chatIdInput.value.trim();
        const telegram_username = elements.telegramUsernameInput.value.trim();
        const default_send_method = normalizeDefaultMethod(getSelectedDefaultMethod());

        if (telegram_username.includes("@")) {
            showToast(t("usernameError"), "error");
            return;
        }

        chrome.storage.local.set({ token, chat_id, telegram_username, default_send_method }, () => {
            showToast(t("savedMessage"), "success");
        });
    }

    applyI18nTexts();
    applySelectedDefaultMethod(SEND_METHOD_DESKTOP);

    if (!elements.testMessageInput.value.trim()) {
        elements.testMessageInput.value = t("defaultTestMessage");
    }

    renderBotPreview({ state: "empty" });
    renderChatPreview({ state: "empty" });

    chrome.storage.local.get(STORAGE_KEYS, (result) => {
        elements.tokenInput.value = result.token || "";
        elements.chatIdInput.value = result.chat_id || "";
        elements.telegramUsernameInput.value = result.telegram_username || "";
        applySelectedDefaultMethod(result.default_send_method);

        if (result.token) {
            updateBotPreview(result.token.trim());
        }
        if (result.token && result.chat_id) {
            updateChatPreview(result.token.trim(), result.chat_id.trim());
        }
    });

    elements.saveButton.addEventListener("click", onSaveClick);
    elements.sendTestButton.addEventListener("click", onSendTestClick);
    elements.tokenInput.addEventListener("input", onChatIdOrTokenChange);
    elements.chatIdInput.addEventListener("input", onChatIdOrTokenChange);
    elements.tokenInput.addEventListener("input", onBotTokenChange);
    elements.testMessageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            onSendTestClick();
        }
    });
});
