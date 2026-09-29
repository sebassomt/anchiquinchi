# 💬 Muro Digital - Frontend (SENA)

Interfaz web interactiva y responsiva para el taller de despliegue en la nube.

## 🛠️ Características
- 🎨 **Personalización completa sin código:** Selección entre 6 temas visuales, títulos y emojis.
- 📱 **Generador de Código QR:** Para abrir el muro en el celular en 1 segundo.
- 🖼️ **Imágenes y GIFs:** Soporte para subir fotos o pegar enlaces de internet.
- ❤️ **Likes y 🗑️ Eliminación:** Ciclo CRUD completo en tiempo real.
- 📐 **Diseño 100% Responsivo:** Adaptado para móviles, tablets y computadores.

---

## ☁️ Despliegue en Vercel (Paso a Paso)

1. Haz clic en **Fork** (arriba a la derecha) para tener tu propia copia de este repositorio en tu cuenta de GitHub.
2. Abre el archivo `script.js` en tu repositorio de GitHub y edita la **línea 6**:
   ```javascript
   const DEFAULT_BACKEND_URL = "https://PEGA-AQUI-TU-ENLACE-DE-RENDER.onrender.com";
   ```
   *(Pega allí la URL que te dio Render al desplegar tu backend, sin barra `/` al final)*.
3. Guarda los cambios haciendo **Commit changes**.
4. Inicia sesión en [Vercel.com](https://vercel.com).
5. Haz clic en **Add New...** ➔ **Project**.
6. Importa tu repositorio `sena-muro-frontend` y haz clic en **Deploy**.
7. ¡En menos de 30 segundos tu página web estará en vivo con dominio `.vercel.app`!
