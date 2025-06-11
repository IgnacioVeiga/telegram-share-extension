chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "sendToTelegramDesktop",
        title: "Enviar por Telegram Desktop",
        contexts: ["page", "link", "image"]
    });
    chrome.contextMenus.create({
        id: "sendToTelegramBot",
        title: "Enviar por Bot API",
        contexts: ["page", "link", "image"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    const content = info.linkUrl || info.srcUrl || info.pageUrl;

    chrome.storage.local.get(["token", "chat_id", "telegram_username"], (result) => {
        const { token, chat_id, telegram_username } = result;

        if (!content) {
            showError("No hay contenido para enviar.");
            return;
        }

        if (info.menuItemId === "sendToTelegramDesktop") {
            if (!telegram_username) {
                showError("Alias de Telegram no configurado.");
                return;
            }

            const desktopUrl = `tg://resolve?domain=${telegram_username}&text=${encodeURIComponent(content)}`;
            chrome.tabs.create({ url: desktopUrl });
        }

        if (info.menuItemId === "sendToTelegramBot") {
            if (!token || !chat_id) {
                showError("Token o Chat ID no configurado.");
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
                    if (!res.ok) throw new Error("Error enviando con Bot API.");
                })
                .catch(err => {
                    showError(err.message);
                });
        }
    });
});

function showError(message) {
    if (chrome.notifications) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "Telegram Share Error",
            message: message
        });
    } else {
        console.error("Error: " + message);
        alert("Error: " + message);
    }
}

