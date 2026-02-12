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
        if (result.token && result.chat_id) {
            updateChatPreview(result.token, result.chat_id);
        }
        if (result.token) {
            updateBotPreview(result.token);
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

    // User/chat preview when chat_id or token change
    let chatPreviewTimeout;
    elements.chatIdInput.addEventListener("input", onChatIdOrTokenChange);
    elements.tokenInput.addEventListener("input", onChatIdOrTokenChange);

    function onChatIdOrTokenChange() {
        clearTimeout(chatPreviewTimeout);
        chatPreviewTimeout = setTimeout(() => {
            const token = elements.tokenInput.value.trim();
            const chat_id = elements.chatIdInput.value.trim();
            if (token && chat_id) {
                updateChatPreview(token, chat_id);
            } else {
                renderChatPreview({ state: "empty" });
            }
        }, 500);
    }

    function renderChatPreview({ state, name = "", photoUrl = "" }) {
        if (state === "loading") {
            elements.chatIdPreview.textContent = chrome.i18n.getMessage("loadingPreview");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
        } else if (state === "success") {
            elements.chatIdPreview.textContent = `${chrome.i18n.getMessage("previewLabel")} ${name}`;
            if (photoUrl) {
                elements.chatIdPhoto.src = photoUrl;
                elements.chatIdPhoto.style.display = "inline-block";
            } else {
                elements.chatIdPhoto.style.display = "none";
                elements.chatIdPhoto.src = "";
            }
        } else if (state === "error") {
            elements.chatIdPreview.textContent = chrome.i18n.getMessage("invalidChatId");
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
        } else {
            elements.chatIdPreview.textContent = "";
            elements.chatIdPhoto.style.display = "none";
            elements.chatIdPhoto.src = "";
        }
    }

    async function updateChatPreview(token, chat_id) {
        renderChatPreview({ state: "loading" });
        try {
            const chatRes = await fetch(`https://api.telegram.org/bot${token}/getChat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id })
            });
            const chatData = await chatRes.json();
            if (!chatData.ok) throw new Error();
            const chat = chatData.result;
            let name = chat.title || chat.username || chat.first_name || chat.id;
            if (chat.last_name) name += ` ${chat.last_name}`;
            let photoUrl = "";
            if (chat.photo && chat.photo.small_file_id) {
                const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ file_id: chat.photo.small_file_id })
                });
                const fileData = await fileRes.json();
                if (fileData.ok && fileData.result && fileData.result.file_path) {
                    photoUrl = `https://api.telegram.org/file/bot${token}/${fileData.result.file_path}`;
                }
            }
            renderChatPreview({ state: "success", name, photoUrl });
        } catch {
            renderChatPreview({ state: "error" });
        }
    }

    // Bot preview when the token changes
    let botPreviewTimeout;
    elements.tokenInput.addEventListener("input", onBotTokenChange);

    function onBotTokenChange() {
        clearTimeout(botPreviewTimeout);
        botPreviewTimeout = setTimeout(() => {
            const token = elements.tokenInput.value.trim();
            if (token) {
                updateBotPreview(token);
            } else {
                renderBotPreview({ state: "empty" });
            }
        }, 500);
    }

    function renderBotPreview({ state, name = "" }) {
        if (state === "loading") {
            elements.botPreview.textContent = chrome.i18n.getMessage("loadingPreview");
        } else if (state === "success") {
            elements.botPreview.textContent = `${chrome.i18n.getMessage("previewLabel")} ${name}`;
        } else if (state === "error") {
            elements.botPreview.textContent = chrome.i18n.getMessage("invalidBotToken");
        } else {
            elements.botPreview.textContent = "";
        }
    }

    async function updateBotPreview(token) {
        renderBotPreview({ state: "loading" });
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
            const data = await res.json();
            if (!data.ok) throw new Error();
            const bot = data.result;
            const name = bot.first_name + (bot.username ? ` (@${bot.username})` : "");
            renderBotPreview({ state: "success", name });
        } catch {
            renderBotPreview({ state: "error" });
        }
    }
});
