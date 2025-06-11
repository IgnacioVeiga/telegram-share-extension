document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["token", "chat_id", "telegram_username"], (result) => {
        document.getElementById("token").value = result.token || "";
        document.getElementById("chat_id").value = result.chat_id || "";
        document.getElementById("telegram_username").value = result.telegram_username || "";
    });
});

document.getElementById("save").addEventListener("click", () => {
    const token = document.getElementById("token").value;
    const chat_id = document.getElementById("chat_id").value;
    const telegram_username = document.getElementById("telegram_username").value;

    if (telegram_username.includes("@")) {
        alert("No incluyas el '@' en el alias de Telegram.");
        return;
    }

    chrome.storage.local.set({ token, chat_id, telegram_username }, () => {
        alert("Configuración guardada!");
    });
});
