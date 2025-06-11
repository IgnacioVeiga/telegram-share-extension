# 🌐 Guía de Internacionalización (i18n)

Esta extensión es compatible con múltiples idiomas gracias al sistema de internacionalización nativo de Chrome Extensions.

---

## 📦 Folder structure

```
_locales
├── en
│   └── messages.json
├── es
│   └── messages.json
└── fr
    └── messages.json (example)
```

---

## 📜 Formato de messages.json

Cada archivo `messages.json` debe seguir esta estructura:

```json
{
  "nombreClave": {
    "message": "Texto traducido"
  }
}
```

Podés agregar un campo "description" para contexto si querés:

```json
{
  "saveButton": {
    "message": "Guardar",
    "description": "Texto del botón para guardar la configuración"
  }
}
```

---

## 📌 Agregar un nuevo idioma

1. Crear una carpeta dentro de `_locales` con el código de idioma.
2. Copiar el archivo `messages.json` de otro idioma y traducir los textos.
3. ¡Listo! Chrome lo va a cargar automáticamente si el idioma del navegador coincide.

---

## 📖 Carga dinámica de textos
Usá `chrome.i18n.getMessage("clave")` para acceder a los textos traducidos.

Ejemplo:

```javascript
document.getElementById("settingsTitle").innerText = chrome.i18n.getMessage("settingsTitle");
element.setAttribute("title", chrome.i18n.getMessage("tooltipText"));
```

---

## 📋 Elementos que deben traducirse
- Textos visibles (`innerText`, `textContent`, `value`)
- Atributos (`title`, `placeholder`, `alt`)
- Ítems del menú contextual en `background.js`

---

# 📃 Notificaciones y errores
También se deben traducir con `i18n`:

```javascript
chrome.notifications.create({
  type: "basic",
  iconUrl: "icons/icon128.png",
  title: chrome.i18n.getMessage("errorTitle"),
  message: chrome.i18n.getMessage("errorMessage")
});
```

---

## 📌 Limitaciones
- No se puede traducir HTML estático sin JavaScript.
- No se puede cambiar el idioma del navegador desde la extensión.

---

## 📚 Documentación oficial
[Chrome i18n API](https://developer.chrome.com/docs/extensions/reference/i18n/)

---

## ✅ Idiomas disponibles
- Español (es)
- Inglés (en)
- [Agregá más creando una carpeta en `_locales/`]

---

💡 ¿Querés contribuir con otro idioma? Copiá un `messages.json`, traducilo y ponelo en una carpeta `_locales/<idioma>`.

