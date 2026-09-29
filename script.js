// ====================================================================
// 🔌 CONFIGURACIÓN DE CONEXIÓN
// ====================================================================

const DEFAULT_BACKEND_URL = "https://sena-muro-backend.onrender.com";
let backendUrl = (localStorage.getItem('sena_backend_url') || DEFAULT_BACKEND_URL).replace(/\/+$/, '');

// Si la web corre en HTTPS (Vercel) y localStorage tenía localhost, auto-migrar al backend en producción
if (window.location.protocol === 'https:' && backendUrl.startsWith('http://localhost')) {
  backendUrl = DEFAULT_BACKEND_URL;
  localStorage.setItem('sena_backend_url', backendUrl);
}

// Elementos de la barra superior
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const btnAbrirPersonalizar = document.getElementById('btn-abrir-personalizar');
const btnAbrirQr = document.getElementById('btn-abrir-qr');

// Elementos del encabezado personalizable
const pageTitle = document.getElementById('page-title');
const muroEmojiDisplay = document.getElementById('muro-emoji-display');
const muroNombreDisplay = document.getElementById('muro-nombre-display');
const muroDescDisplay = document.getElementById('muro-desc-display');

// Elementos del formulario de mensajes
const form = document.getElementById('form-mensaje');
const inputAutor = document.getElementById('autor');
const inputMensaje = document.getElementById('mensaje');
const inputImagenUrl = document.getElementById('imagen-url');
const inputArchivoImagen = document.getElementById('input-archivo-imagen');
const previewContainer = document.getElementById('preview-container');
const imgPreview = document.getElementById('img-preview');
const btnRemoverImg = document.getElementById('btn-remover-img');

const charCounter = document.getElementById('char-counter');
const btnEnviar = document.getElementById('btn-enviar');
const btnText = btnEnviar.querySelector('.btn-text');
const btnSpinner = btnEnviar.querySelector('.btn-spinner');

// Elementos del tablero de mensajes
const contenedorMensajes = document.getElementById('contenedor-mensajes');
const contadorPill = document.getElementById('contador-mensajes');
const btnRecargar = document.getElementById('btn-recargar');

// Elementos del modal de personalización
const modal = document.getElementById('modal-personalizar');
const btnCerrarModal = document.getElementById('btn-cerrar-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const formPersonalizar = document.getElementById('form-personalizar');
const inputNombreMuro = document.getElementById('input-nombre-muro');
const inputDescMuro = document.getElementById('input-desc-muro');
const emojiButtons = document.querySelectorAll('.emoji-btn');
const themeCards = document.querySelectorAll('.theme-card');

// Elementos del modal de Código QR
const modalQr = document.getElementById('modal-qr');
const btnCerrarQr = document.getElementById('btn-cerrar-qr');
const btnCerrarQrBottom = document.getElementById('btn-cerrar-qr-bottom');
const qrImg = document.getElementById('qr-img');
const qrUrlText = document.getElementById('qr-url-text');
const btnCopiarLink = document.getElementById('btn-copiar-link');

let emojiSeleccionado = '💬';
let temaSeleccionado = 'ocean';
let imagenSeleccionadaBase64 = null;



// Colores para avatares
const AVATAR_COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', 
  '#059669', '#0891b2', '#4f46e5', '#ca8a04'
];

function obtenerColorAvatar(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatearFecha(fechaStr) {
  try {
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'Reciente';

    const diffSeg = Math.floor((new Date() - fecha) / 1000);
    if (diffSeg < 60) return 'Hace un momento';
    if (diffSeg < 3600) return `Hace ${Math.floor(diffSeg / 60)} min`;
    if (diffSeg < 86400) return `Hoy a las ${fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    return fecha.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Reciente';
  }
}

// ====================================================================
// VERIFICAR CONEXIÓN CON EL SERVIDOR
// ====================================================================
async function verificarConexion() {
  statusDot.className = 'status-dot';
  statusText.textContent = 'Verificando...';

  try {
    const start = performance.now();
    const res = await fetch(`${backendUrl}/`, { method: 'GET' });
    const elapsed = Math.round(performance.now() - start);

    if (res.ok) {
      const data = await res.json();
      statusDot.className = 'status-dot online';
      statusText.textContent = `En línea (${elapsed}ms)`;
      return true;
    } else {
      throw new Error('Respuesta no válida');
    }
  } catch (error) {
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Desconectado';
    return false;
  }
}

// ====================================================================
// MANEJO DE IMÁGENES Y STICKERS
// ====================================================================

function mostrarPreviewImagen(url) {
  imgPreview.src = url;
  previewContainer.classList.remove('hidden');
}

function limpiarImagen() {
  inputImagenUrl.value = '';
  imagenSeleccionadaBase64 = null;
  imgPreview.src = '';
  previewContainer.classList.add('hidden');
  inputArchivoImagen.value = '';
}

btnRemoverImg.addEventListener('click', limpiarImagen);

// Al escribir una URL manualmente
inputImagenUrl.addEventListener('input', () => {
  const url = inputImagenUrl.value.trim();
  if (url) {
    imagenSeleccionadaBase64 = null;
    mostrarPreviewImagen(url);
  } else {
    limpiarImagen();
  }
});

// Subida de archivo y compresión a Base64 liviano con Canvas
inputArchivoImagen.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      // Redimensionar para no sobrecargar la base de datos (máx 600px)
      const canvas = document.createElement('canvas');
      const maxDim = 600;
      let width = img.width;
      let height = img.height;

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
      imagenSeleccionadaBase64 = compressedDataUrl;
      inputImagenUrl.value = '';
      mostrarPreviewImagen(compressedDataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// ====================================================================
// GESTIÓN DE PERSONALIZACIÓN (GET y POST /config)
// ====================================================================

function aplicarConfiguracionEnPantalla(config) {
  const nombre = config.nombreMuro || 'Muro Digital del Salón';
  const emoji = config.emoji || '💬';
  const tema = config.tema || 'ocean';
  const desc = config.descripcion || 'Envía un mensaje para poner a prueba la conexión en tiempo real.';

  document.body.setAttribute('data-theme', tema);
  muroNombreDisplay.textContent = nombre;
  muroEmojiDisplay.textContent = emoji;
  muroDescDisplay.textContent = desc;
  pageTitle.textContent = `${emoji} ${nombre} - SENA`;

  const faviconLink = document.querySelector("link[rel*='icon']");
  if (faviconLink) {
    faviconLink.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${encodeURIComponent(emoji)}</text></svg>`;
  }

  inputNombreMuro.value = nombre;
  inputDescMuro.value = desc;
  emojiSeleccionado = emoji;
  temaSeleccionado = tema;

  emojiButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-emoji') === emoji);
  });
  themeCards.forEach(card => {
    card.classList.toggle('active', card.getAttribute('data-theme') === tema);
  });
}

async function cargarConfiguracion() {
  // 1. Carga inmediata desde almacenamiento local para evitar cualquier reinicio visual
  const configLocal = localStorage.getItem('sena_muro_config');
  if (configLocal) {
    try {
      aplicarConfiguracionEnPantalla(JSON.parse(configLocal));
    } catch (e) {}
  }

  // 2. Sincronizar con el servidor y la base de datos
  try {
    const res = await fetch(`${backendUrl}/config`);
    if (res.ok) {
      const config = await res.json();
      aplicarConfiguracionEnPantalla(config);
      localStorage.setItem('sena_muro_config', JSON.stringify(config));
    }
  } catch (err) {
    console.log('Servidor en espera de configuración o usando valores locales');
  }
}

formPersonalizar.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nuevaConfig = {
    nombreMuro: inputNombreMuro.value.trim() || 'Mi Muro Personal',
    emoji: emojiSeleccionado,
    tema: temaSeleccionado,
    descripcion: inputDescMuro.value.trim() || '¡Bienvenidos a mi muro!'
  };

  // Guardar inmediatamente en localStorage
  localStorage.setItem('sena_muro_config', JSON.stringify(nuevaConfig));
  aplicarConfiguracionEnPantalla(nuevaConfig);
  cerrarModalPersonalizar();

  try {
    const res = await fetch(`${backendUrl}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaConfig)
    });

    if (res.ok) {
      const configGuardada = await res.json();
      aplicarConfiguracionEnPantalla(configGuardada);
      localStorage.setItem('sena_muro_config', JSON.stringify(configGuardada));
    } else {
      console.warn('No se pudo guardar la personalización en el servidor');
    }
  } catch (error) {
    console.warn('Error de red al guardar configuración en servidor, preservada en local');
  }
});

emojiButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    emojiButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    emojiSeleccionado = btn.getAttribute('data-emoji');
  });
});

themeCards.forEach(card => {
  card.addEventListener('click', () => {
    themeCards.forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    temaSeleccionado = card.getAttribute('data-theme');
    document.body.setAttribute('data-theme', temaSeleccionado);
  });
});

function abrirModalPersonalizar() { modal.classList.remove('hidden'); }
function cerrarModalPersonalizar() { modal.classList.add('hidden'); }

btnAbrirPersonalizar.addEventListener('click', abrirModalPersonalizar);
btnCerrarModal.addEventListener('click', cerrarModalPersonalizar);
btnCancelarModal.addEventListener('click', cerrarModalPersonalizar);
modal.addEventListener('click', (e) => {
  if (e.target === modal) cerrarModalPersonalizar();
});

// ====================================================================
// MODAL DE CÓDIGO QR (Abrir en Celular)
// ====================================================================
function abrirModalQr() {
  const currentUrl = window.location.href;
  qrUrlText.textContent = currentUrl;
  
  // Generar QR a través del API gratuita de códigos QR
  qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(currentUrl)}`;
  modalQr.classList.remove('hidden');
}

function cerrarModalQr() {
  modalQr.classList.add('hidden');
}

btnAbrirQr.addEventListener('click', abrirModalQr);
btnCerrarQr.addEventListener('click', cerrarModalQr);
btnCerrarQrBottom.addEventListener('click', cerrarModalQr);
modalQr.addEventListener('click', (e) => {
  if (e.target === modalQr) cerrarModalQr();
});

btnCopiarLink.addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href).then(() => {
    btnCopiarLink.textContent = '✅ ¡Copiado!';
    setTimeout(() => {
      btnCopiarLink.textContent = '📋 Copiar enlace';
    }, 2000);
  });
});

// ====================================================================
// MODAL DE VISOR DE IMAGEN (Lightbox)
// ====================================================================
let mensajesActuales = [];
const modalVisor = document.getElementById('modal-visor-imagen');
const visorImgFull = document.getElementById('visor-img-full');
const visorTitulo = document.getElementById('visor-titulo');
const btnCerrarVisor = document.getElementById('btn-cerrar-visor');
const btnCerrarVisorBottom = document.getElementById('btn-cerrar-visor-bottom');
const btnAbrirNuevaPestana = document.getElementById('btn-abrir-nueva-pestana');

window.abrirVisorImagen = function(id) {
  const m = mensajesActuales.find(msg => msg.id === id);
  if (!m || !m.imagen_url) return;

  visorImgFull.src = m.imagen_url;
  visorTitulo.textContent = m.autor ? `🖼️ Foto de ${m.autor}` : '🖼️ Foto adjunta';
  btnAbrirNuevaPestana.href = m.imagen_url;

  // Si la imagen es Base64 (subida local), evitar bloqueo de seguridad de Chromium al abrir en nueva pestaña
  btnAbrirNuevaPestana.onclick = (e) => {
    if (m.imagen_url.startsWith('data:')) {
      e.preventDefault();
      const popup = window.open('');
      if (popup) {
        popup.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Imagen en tamaño original - SENA</title>
              <style>
                body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; box-sizing: border-box; }
                img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
              </style>
            </head>
            <body>
              <img src="${m.imagen_url}" alt="Imagen en tamaño original">
            </body>
          </html>
        `);
        popup.document.close();
      }
    }
  };

  modalVisor.classList.remove('hidden');
};

function cerrarVisorImagen() {
  modalVisor.classList.add('hidden');
  visorImgFull.src = '';
}

btnCerrarVisor.addEventListener('click', cerrarVisorImagen);
btnCerrarVisorBottom.addEventListener('click', cerrarVisorImagen);
modalVisor.addEventListener('click', (e) => {
  if (e.target === modalVisor) cerrarVisorImagen();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalVisor && !modalVisor.classList.contains('hidden')) cerrarVisorImagen();
    if (modalQr && !modalQr.classList.contains('hidden')) cerrarModalQr();
    if (modal && !modal.classList.contains('hidden')) cerrarModalPersonalizar();
  }
});

// ====================================================================
// CARGAR MENSAJES (GET /mensajes)
// ====================================================================
async function cargarMensajes() {
  try {
    const res = await fetch(`${backendUrl}/mensajes`);
    if (!res.ok) throw new Error('Error en la petición');
    
    const mensajes = await res.json();
    renderizarMensajes(mensajes);
    verificarConexion();
  } catch (error) {
    console.error('Error cargando mensajes:', error);
    statusDot.className = 'status-dot offline';
    statusText.textContent = 'Sin conexión';
    contenedorMensajes.innerHTML = `
      <div class="error-state">
        <p style="font-weight:700; color:#ef4444; margin-bottom: 0.5rem;">⚠️ No se pudo conectar con el servidor</p>
        <p style="font-size:0.9rem;">Verifica que tu backend esté corriendo en <code>${backendUrl}</code></p>
      </div>
    `;
    contadorPill.textContent = '0 mensajes';
  }
}

function renderizarMensajes(mensajes) {
  mensajesActuales = mensajes;
  contadorPill.textContent = `${mensajes.length} ${mensajes.length === 1 ? 'mensaje' : 'mensajes'}`;

  if (mensajes.length === 0) {
    contenedorMensajes.innerHTML = `
      <div class="empty-state">
        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">📪</p>
        <p style="font-weight:600;">Aún no hay mensajes en el muro.</p>
        <p style="font-size:0.85rem; color: #94a3b8;">¡Sé el primero en dejar un saludo!</p>
      </div>
    `;
    return;
  }

  // Lista de mensajes a los que el usuario ya dio like localmente
  const likedList = JSON.parse(localStorage.getItem('sena_liked_ids') || '[]');

  contenedorMensajes.innerHTML = mensajes.map(m => {
    const inicial = m.autor ? m.autor.trim().charAt(0).toUpperCase() : '?';
    const color = obtenerColorAvatar(m.autor || 'Anon');
    const fecha = formatearFecha(m.fecha);
    const likes = m.likes || 0;
    const isLiked = likedList.includes(m.id);

    const imagenHTML = m.imagen_url ? `
      <div class="mensaje-img-wrapper" title="🔍 Clic para ver en tamaño completo" onclick="abrirVisorImagen(${m.id})">
        <img src="${m.imagen_url}" alt="Imagen de ${escaparHTML(m.autor)}" class="mensaje-img" loading="lazy">
        <div class="img-zoom-badge">🔍 Ver completa</div>
      </div>
    ` : '';

    return `
      <article class="mensaje-card" data-id="${m.id}">
        <div class="avatar-badge" style="background-color: ${color}">
          ${inicial}
        </div>
        <div class="mensaje-content">
          <div class="mensaje-top">
            <span class="mensaje-autor">${escaparHTML(m.autor)}</span>
            <time class="mensaje-fecha">${fecha}</time>
          </div>
          <p class="mensaje-body">${escaparHTML(m.mensaje)}</p>
          ${imagenHTML}
          <div class="mensaje-card-footer">
            <button type="button" class="btn-delete" title="Eliminar mensaje" onclick="eliminarMensajeCard(${m.id})">
              🗑️ Eliminar
            </button>
            <button type="button" class="btn-like ${isLiked ? 'liked' : ''}" onclick="darLikeMensaje(${m.id})">
              <span class="heart-icon">${isLiked ? '❤️' : '🤍'}</span>
              <span class="likes-count" id="like-count-${m.id}">${likes}</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// Eliminar un mensaje del muro
window.eliminarMensajeCard = async function(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este mensaje del muro?')) return;

  const card = document.querySelector(`.mensaje-card[data-id="${id}"]`);
  if (card) {
    card.style.opacity = '0.4';
    card.style.pointerEvents = 'none';
  }

  try {
    const res = await fetch(`${backendUrl}/mensajes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (card) {
        card.style.transition = 'all 0.25s ease';
        card.style.transform = 'scale(0.95)';
        card.style.opacity = '0';
        setTimeout(() => {
          cargarMensajes();
        }, 250);
      } else {
        cargarMensajes();
      }
    } else {
      alert('No se pudo eliminar el mensaje');
      if (card) {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
      }
    }
  } catch (err) {
    console.error('Error al eliminar mensaje:', err);
    alert('Error al conectar con el servidor.');
    if (card) {
      card.style.opacity = '1';
      card.style.pointerEvents = 'auto';
    }
  }
};

// Dar Like a un mensaje
window.darLikeMensaje = async function(id) {
  const likeBtn = document.querySelector(`.mensaje-card[data-id="${id}"] .btn-like`);
  const countSpan = document.getElementById(`like-count-${id}`);

  // Actualización optimista en pantalla
  let currentLikes = parseInt(countSpan.textContent, 10) || 0;
  countSpan.textContent = currentLikes + 1;
  if (likeBtn) {
    likeBtn.classList.add('liked');
    likeBtn.querySelector('.heart-icon').textContent = '❤️';
  }

  // Guardar en favoritos locales
  const likedList = JSON.parse(localStorage.getItem('sena_liked_ids') || '[]');
  if (!likedList.includes(id)) {
    likedList.push(id);
    localStorage.setItem('sena_liked_ids', JSON.stringify(likedList));
  }

  try {
    const res = await fetch(`${backendUrl}/mensajes/${id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      countSpan.textContent = data.likes;
    }
  } catch (err) {
    console.error('Error al registrar like:', err);
  }
};

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

// ====================================================================
// ENVIAR NUEVO MENSAJE (POST /mensajes)
// ====================================================================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const autor = inputAutor.value.trim();
  const mensaje = inputMensaje.value.trim();
  const imagenUrl = imagenSeleccionadaBase64 || inputImagenUrl.value.trim() || null;

  if (!autor || !mensaje) {
    alert('Por favor completa tu nombre y el mensaje.');
    return;
  }

  btnEnviar.disabled = true;
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');

  try {
    const res = await fetch(`${backendUrl}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autor, mensaje, imagenUrl })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'No se pudo guardar el mensaje');
    }

    inputMensaje.value = '';
    charCounter.textContent = '0 / 280';
    limpiarImagen();
    localStorage.setItem('sena_autor_nombre', autor);

    await cargarMensajes();
  } catch (error) {
    console.error('Error al enviar:', error);
    alert(`❌ Error al publicar: ${error.message}`);
  } finally {
    btnEnviar.disabled = false;
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
  }
});

// Contador de caracteres
inputMensaje.addEventListener('input', () => {
  charCounter.textContent = `${inputMensaje.value.length} / 280`;
});

const autorGuardado = localStorage.getItem('sena_autor_nombre');
if (autorGuardado) {
  inputAutor.value = autorGuardado;
}



btnRecargar.addEventListener('click', () => {
  cargarMensajes();
});

setInterval(() => {
  cargarMensajes();
}, 10000);

// Inicio
verificarConexion();
cargarConfiguracion();
cargarMensajes();
