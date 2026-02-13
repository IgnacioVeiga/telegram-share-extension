# Telegram Share Extension

Una extensión de Chrome que permite compartir enlaces, imágenes y texto a Telegram directamente desde el navegador.  
Podés elegir entre usar **Telegram Desktop** o la **Telegram Bot API** para enviar el contenido.

## Funcionalidades

- Compartir enlaces, imágenes y texto desde el menú contextual.
- Elegir el método de envío directamente desde el menú contextual: **Telegram Desktop** o **Bot API**.
- Opción de envío rápido que usa el método por defecto configurado (**Desktop** o **Bot API**).
- Configurar alias de Telegram, token del Bot API y chat ID desde la página de opciones.
- Configurar el método por defecto para el envío rápido desde la página de opciones.
- Vista previa en vivo para validar token del bot y chat ID desde la configuración.
- Envío de mensaje de prueba en la interfaz para validar la configuración del Bot API.
- Notificaciones en caso de éxito o error.
- Interfaz moderna y limpia para la configuración.
- Almacenamiento de configuraciones de forma local (sin servidores externos).

## Política de Privacidad

Esta extensión **no** recolecta, almacena ni comparte datos personales de forma externa.  
Toda la configuración se guarda de manera local en tu navegador.  
Cuando usás las vistas previas de validación en configuración, la extensión envía solicitudes a las APIs de Telegram (`getMe`, `getChat`, `getFile`) para mostrar datos de bot/chat.

Consultá la [Política de Privacidad](privacy_policy.es.md) para más detalles.

## Disclaimer

Esta extensión es una herramienta no oficial y no está afiliada, asociada, autorizada, patrocinada ni conectada de ninguna manera con **Telegram Messenger LLP**.

## Licencia

Este proyecto está licenciado bajo los términos de la Licencia MIT.  
Consultá el archivo [LICENSE](LICENSE) para más detalles.

---

## Idiomas

La extensión incluye actualmente traducciones de interfaz para:
- Español (`es`)
- Inglés (`en`)

Podés agregar más idiomas usando la estructura i18n descrita en [GUÍA_INTERNACIONALIZACIÓN.md](GUÍA_INTERNACIONALIZACIÓN.md).

---

## Instalación

Por ahora, se puede cargar manualmente:

1. Descargá el código fuente.
2. Accedé a `chrome://extensions/` en tu navegador.
3. Activá el **modo de desarrollador**.
4. Hacé clic en **Cargar descomprimida** y seleccioná la carpeta de la extensión.

Está previsto publicar la extensión en Chrome Web Store.

---

## Guía para Contribuir

Consultá las [Pautas de Contribución](CONTRIBUTING.es.md) para más detalles.

---

## Contacto

Para reportar errores o sugerencias, podés abrir un issue o contactar al desarrollador.

---

## Documentación en otros idiomas

Este README está disponible también en otros idiomas:

- [English version](README.md)
