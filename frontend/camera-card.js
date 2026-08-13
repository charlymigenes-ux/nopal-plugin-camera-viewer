/*
 * Tarjeta de cámara reusable: se monta dentro del panel/modal de CUALQUIER
 * máquina (impresora Klipper/Marlin/Bambu/Elegoo/FlashForge, láser, CNC) o
 * en una fila compacta del dashboard, mostrando la cámara vinculada a esa
 * máquina puntual (purpose="timelapse" + bound_device, ver camera_service.py
 * del plugin) con controles de timelapse/grabación/enfoque/detección de
 * movimiento. También se usa (compact:false, cameraId directo) dentro de la
 * galería propia del plugin, mostrando cada cámara registrada sea cual sea
 * su propósito.
 *
 * Deliberadamente un archivo aparte de camera-viewer.js: ese archivo es la
 * galería propia del plugin (alta/baja de cámaras, editor de propósito);
 * este es un componente que NOPAL core (app.js) y camera-viewer.js montan
 * desde otras pantallas, sin que el llamador tenga que conocer nada de cómo
 * se arma el HTML de una cámara -- mismo espíritu que
 * window.NopalPluginRegistry pero para un widget embebible en vez de una
 * sección completa.
 *
 * Expone window.NopalCameraCard = { mount(container, opts), unmount(container) }.
 * `opts`: { deviceType, deviceId, cameraId, compact, onSettingsClick }.
 * - Con `deviceType`+`deviceId`: busca la cámara con purpose="timelapse" y
 *   bound_device coincidente. Si no hay ninguna, el contenedor queda vacío
 *   -- así el llamador puede invocar mount() siempre, sin averiguar antes
 *   si corresponde mostrar algo.
 * - Con `cameraId`: muestra esa cámara puntual sin importar su propósito
 *   (caso de la galería propia del plugin).
 * - `onSettingsClick(camera)`: si se pasa, el engranaje de la tarjeta lo
 *   llama en vez de navegar a la sección del plugin (para cuando quien
 *   monta la tarjeta ya tiene su propio editor, ej. la galería).
 */
(() => {
    if (window.NopalCameraCard) return;

    const POLL_INTERVAL_MS = 10000;

    // I18N propio -- este archivo es un IIFE separado de camera-viewer.js
    // (se monta también fuera de la sección del plugin, ver comentario de
    // BOUND_DEVICE_SOURCES más abajo) y no comparte ámbito con su tr()/lang().
    const I18N = {
        es: {
            deleteLabel: 'Borrar',
            deleteConfirmShort: '¿Borrar esto?',
            cancelLabel: 'Cancelar',
            closeLabel: 'Cerrar',
            noMediaYet: 'Todavía no hay capturas ni grabaciones.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Ampliar',
            timelapsePauseLabel: 'Pausar timelapse',
            cameraOfflineHint: 'La cámara no está entregando video.',
            liveViewLabel: 'Vista en vivo',
            operationCouldNotComplete: 'La operación no se pudo completar.',
            configureTimelapseTitle: 'Configurar timelapse',
            sourceLabelText: 'Fuente:', lastCaptureLabel: 'Última captura:', boundToLabel: 'Vinculada a:',
            timelapseLabel: 'Timelapse', intervalLabel: 'Intervalo', durationLabel: 'Duración', fpsLabel: 'FPS',
            framesLabel: 'Fotogramas', estimatedOutputLabel: 'Est. salida', storageLabel: 'Almacenamiento',
            pauseLabel: 'Pausar', resumeLabel: 'Reanudar', captureLabel: 'Capturar',
            recordLabel: 'Grabar', stopLabel: 'Detener',
            fullscreenLabel: 'Pantalla completa', overlaysLabel: 'Superposiciones',
            focusLabel: 'Enfoque', motionDetectionLabel: 'Det. movimiento',
            manualFocusLabel: 'Enfoque manual',
            recentCapturesLabel: 'Capturas recientes', viewAllBtn: 'Ver todas', noCapturesYet: 'Sin capturas todavía.',
            captureSaved: 'Captura guardada.',
            fullscreenNotAllowed: 'El navegador no permitió pantalla completa.',
            capturesWord: 'Capturas', assembleVideoBtn: 'Armar video', assemblingLabel: 'Armando…',
            videoAssembled: 'Video armado: {filename}',
        },
        en: {
            deleteLabel: 'Delete',
            deleteConfirmShort: 'Delete this?',
            cancelLabel: 'Cancel',
            closeLabel: 'Close',
            noMediaYet: 'No captures or recordings yet.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Expand',
            timelapsePauseLabel: 'Pause timelapse',
            cameraOfflineHint: 'The camera is not delivering video.',
            liveViewLabel: 'Live view',
            operationCouldNotComplete: 'The operation could not be completed.',
            configureTimelapseTitle: 'Configure timelapse',
            sourceLabelText: 'Source:', lastCaptureLabel: 'Last capture:', boundToLabel: 'Bound to:',
            timelapseLabel: 'Timelapse', intervalLabel: 'Interval', durationLabel: 'Duration', fpsLabel: 'FPS',
            framesLabel: 'Frames', estimatedOutputLabel: 'Est. output', storageLabel: 'Storage',
            pauseLabel: 'Pause', resumeLabel: 'Resume', captureLabel: 'Capture',
            recordLabel: 'Record', stopLabel: 'Stop',
            fullscreenLabel: 'Fullscreen', overlaysLabel: 'Overlays',
            focusLabel: 'Focus', motionDetectionLabel: 'Motion det.',
            manualFocusLabel: 'Manual focus',
            recentCapturesLabel: 'Recent captures', viewAllBtn: 'View all', noCapturesYet: 'No captures yet.',
            captureSaved: 'Capture saved.',
            fullscreenNotAllowed: 'The browser did not allow fullscreen.',
            capturesWord: 'Captures', assembleVideoBtn: 'Assemble video', assemblingLabel: 'Assembling…',
            videoAssembled: 'Video assembled: {filename}',
        },
        de: {
            deleteLabel: 'Löschen',
            deleteConfirmShort: 'Das löschen?',
            cancelLabel: 'Abbrechen',
            closeLabel: 'Schließen',
            noMediaYet: 'Noch keine Aufnahmen.',
            timelapseShortLabel: 'Zeitraffer', fullscreenShortLabel: 'Vergrößern',
            timelapsePauseLabel: 'Zeitraffer pausieren',
            cameraOfflineHint: 'Die Kamera liefert kein Video.',
            liveViewLabel: 'Live-Ansicht',
            operationCouldNotComplete: 'Der Vorgang konnte nicht abgeschlossen werden.',
            configureTimelapseTitle: 'Zeitraffer konfigurieren',
            sourceLabelText: 'Quelle:', lastCaptureLabel: 'Letzte Aufnahme:', boundToLabel: 'Verknüpft mit:',
            timelapseLabel: 'Zeitraffer', intervalLabel: 'Intervall', durationLabel: 'Dauer', fpsLabel: 'FPS',
            framesLabel: 'Bilder', estimatedOutputLabel: 'Gesch. Ausgabe', storageLabel: 'Speicher',
            pauseLabel: 'Pause', resumeLabel: 'Fortsetzen', captureLabel: 'Aufnehmen',
            recordLabel: 'Aufzeichnen', stopLabel: 'Stoppen',
            fullscreenLabel: 'Vollbild', overlaysLabel: 'Overlays',
            focusLabel: 'Fokus', motionDetectionLabel: 'Bewegungserk.',
            manualFocusLabel: 'Manueller Fokus',
            recentCapturesLabel: 'Letzte Aufnahmen', viewAllBtn: 'Alle anzeigen', noCapturesYet: 'Noch keine Aufnahmen.',
            captureSaved: 'Aufnahme gespeichert.',
            fullscreenNotAllowed: 'Der Browser hat den Vollbildmodus nicht zugelassen.',
            capturesWord: 'Aufnahmen', assembleVideoBtn: 'Video erstellen', assemblingLabel: 'Wird erstellt…',
            videoAssembled: 'Video erstellt: {filename}',
        },
        fr: {
            deleteLabel: 'Supprimer',
            deleteConfirmShort: 'Supprimer ceci ?',
            cancelLabel: 'Annuler',
            closeLabel: 'Fermer',
            noMediaYet: 'Aucune capture ni enregistrement.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Agrandir',
            timelapsePauseLabel: 'Mettre en pause le timelapse',
            cameraOfflineHint: 'La caméra ne fournit pas de vidéo.',
            liveViewLabel: 'Vue en direct',
            operationCouldNotComplete: "L'opération n'a pas pu être terminée.",
            configureTimelapseTitle: 'Configurer le timelapse',
            sourceLabelText: 'Source :', lastCaptureLabel: 'Dernière capture :', boundToLabel: 'Lié à :',
            timelapseLabel: 'Timelapse', intervalLabel: 'Intervalle', durationLabel: 'Durée', fpsLabel: 'FPS',
            framesLabel: 'Images', estimatedOutputLabel: 'Sortie est.', storageLabel: 'Stockage',
            pauseLabel: 'Pause', resumeLabel: 'Reprendre', captureLabel: 'Capturer',
            recordLabel: 'Enregistrer', stopLabel: 'Arrêter',
            fullscreenLabel: 'Plein écran', overlaysLabel: 'Superpositions',
            focusLabel: 'Mise au point', motionDetectionLabel: 'Détect. mouvement',
            manualFocusLabel: 'Mise au point manuelle',
            recentCapturesLabel: 'Captures récentes', viewAllBtn: 'Voir tout', noCapturesYet: 'Aucune capture pour le moment.',
            captureSaved: 'Capture enregistrée.',
            fullscreenNotAllowed: "Le navigateur n'a pas autorisé le plein écran.",
            capturesWord: 'Captures', assembleVideoBtn: 'Assembler la vidéo', assemblingLabel: 'Assemblage…',
            videoAssembled: 'Vidéo assemblée : {filename}',
        },
        'pt-BR': {
            liveViewLabel: 'Visualização ao vivo',
            operationCouldNotComplete: 'Não foi possível concluir a operação.',
            configureTimelapseTitle: 'Configurar timelapse',
            sourceLabelText: 'Fonte:', lastCaptureLabel: 'Última captura:', boundToLabel: 'Vinculada a:',
            timelapseLabel: 'Timelapse', intervalLabel: 'Intervalo', durationLabel: 'Duração', fpsLabel: 'FPS',
            framesLabel: 'Quadros', estimatedOutputLabel: 'Saída est.', storageLabel: 'Armazenamento',
            pauseLabel: 'Pausar', resumeLabel: 'Retomar', captureLabel: 'Capturar',
            recordLabel: 'Gravar', stopLabel: 'Parar',
            fullscreenLabel: 'Tela cheia', overlaysLabel: 'Sobreposições',
            focusLabel: 'Foco', motionDetectionLabel: 'Det. movimento',
            manualFocusLabel: 'Foco manual',
            recentCapturesLabel: 'Capturas recentes', viewAllBtn: 'Ver todas', noCapturesYet: 'Nenhuma captura ainda.',
            captureSaved: 'Captura salva.',
            fullscreenNotAllowed: 'O navegador não permitiu a tela cheia.',
            capturesWord: 'Capturas', assembleVideoBtn: 'Montar vídeo', assemblingLabel: 'Montando…',
            videoAssembled: 'Vídeo montado: {filename}',
        },
    };

    function lang() {
        let value = document.documentElement.lang || localStorage.getItem('language') || 'es';
        value = String(value).toLowerCase();
        if (value.startsWith('pt')) return 'pt-BR';
        if (I18N[value]) return value;
        return 'en';
    }

    function tr(key, vars) {
        const dict = I18N[lang()] || I18N.en;
        let text = dict[key] ?? I18N.en[key] ?? key;
        if (vars) {
            Object.entries(vars).forEach(([name, value]) => {
                text = text.replace(`{${name}}`, value);
            });
        }
        return text;
    }

    const icon = (body, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    const ICON_CAMERA = icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', 16);
    const ICON_SETTINGS = icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 16);
    const ICON_PAUSE = icon('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>', 14);
    const ICON_PLAY = icon('<polygon points="5 3 19 12 5 21 5 3"/>', 14);
    const ICON_CAPTURE = icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', 14);
    const ICON_RECORD = icon('<circle cx="12" cy="12" r="8"/>', 14);
    const ICON_TRASH = icon('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>', 13);
    const ICON_FULLSCREEN = icon('<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>', 14);
    const ICON_STOP = icon('<rect x="6" y="6" width="12" height="12" rx="1"/>', 14);
    const ICON_EXPAND = icon('<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>', 14);
    const ICON_OVERLAY = icon('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/>', 14);
    const ICON_FOCUS = icon('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>', 14);
    const ICON_MOTION = icon('<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>', 14);
    const ICON_CLOSE = icon('<path d="M18 6 6 18M6 6l12 12"/>', 18);

    const esc = value => typeof window.escapeHtml === 'function' ? window.escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const toast = (message, tone = 'success') => typeof window.showToast === 'function' ? window.showToast(message, tone) : console.log(message);

    async function api(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || tr('operationCouldNotComplete'));
        return data;
    }

    function formatDuration(seconds) {
        const total = Math.max(0, Math.round(seconds || 0));
        const h = Math.floor(total / 3600);
        const m = Math.floor((total % 3600) / 60);
        const s = total % 60;
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    }

    function formatBytes(bytes) {
        const value = bytes || 0;
        const mb = value / (1024 * 1024);
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
    }

    function formatClock(epochSeconds) {
        if (!epochSeconds) return '--';
        return new Date(epochSeconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Mismo patrón que camera-viewer.js (galería propia del plugin): un
    // <img> por cámara, con reintento cada 5s si el stream corta. Cada
    // tarjeta tiene su propio watcher -- no hay un pool compartido acá
    // porque, a diferencia de la galería, estas tarjetas se montan y
    // desmontan constantemente (abrir/cerrar un modal de impresora).
    function watchStream(img) {
        const baseSrc = img.src;
        img.addEventListener('error', () => {
            const card = img.closest('.cam-card');
            card?.classList.add('is-offline');
            // Un <img> roto no deja leer el cuerpo de la respuesta, así que
            // se vuelve a pedir la misma URL para enterarse del motivo. Sin
            // esto la tarjeta solo se pone gris y el usuario nunca sabe si
            // es la cámara, el cable o que otro programa la tiene tomada.
            mostrarMotivo(card, baseSrc);
            setTimeout(() => {
                if (!document.body.contains(img)) return;
                const sep = baseSrc.includes('?') ? '&' : '?';
                img.src = `${baseSrc}${sep}_retry=${Date.now()}`;
            }, 5000);
        });
        img.addEventListener('load', () => {
            const card = img.closest('.cam-card');
            card?.classList.remove('is-offline');
            card?.querySelector('.cam-live-error')?.remove();
        });
    }

    async function mostrarMotivo(card, url) {
        if (!card) return;
        let motivo = '';
        try {
            const respuesta = await fetch(url, { headers: { 'X-Motivo': '1' } });
            if (!respuesta.ok) {
                const cuerpo = await respuesta.json().catch(() => null);
                motivo = cuerpo?.detail || `HTTP ${respuesta.status}`;
            }
        } catch (_) { /* sin red: se queda el aviso genérico */ }
        let aviso = card.querySelector('.cam-live-error');
        if (!aviso) {
            aviso = document.createElement('div');
            aviso.className = 'cam-live-error';
            card.querySelector('.cam-live-wrap')?.appendChild(aviso);
        }
        aviso.textContent = motivo || tr('cameraOfflineHint');
    }

    async function findBoundCamera(deviceType, deviceId) {
        if (!deviceType || !deviceId) return null;
        try {
            const result = await api('/api/cameras');
            const cameras = result.cameras || [];
            return cameras.find(c => c.purpose === 'timelapse' && c.bound_device
                && c.bound_device.type === deviceType && String(c.bound_device.id) === String(deviceId)) || null;
        } catch (error) {
            return null;
        }
    }

    // Mismas fuentes que BOUND_DEVICE_SOURCES en camera-viewer.js (el
    // selector "¿qué dispositivo vas a filmar?" del editor) -- duplicado acá
    // a propósito: este archivo se monta también fuera de la sección del
    // plugin (modal de impresora, dashboard) y no debe depender de que
    // camera-viewer.js esté cargado para resolver el nombre lindo de un
    // bound_device.id que en la mayoría de las marcas es un serial/host, no
    // un nombre.
    const BOUND_DEVICE_SOURCES = [
        { type: 'bambu', url: '/api/bambu/printers', listKey: 'printers' },
        { type: 'elegoo', url: '/api/elegoo/printers', listKey: 'printers' },
        { type: 'flashforge', url: '/api/flashforge/printers', listKey: 'printers' },
        { type: 'marlin', url: '/api/marlin-printers/registry/status', listKey: 'printers' },
        { type: 'klipper', url: '/api/printers/status', listKey: 'printers' },
        { type: 'laser', url: '/api/laser/registry/status', listKey: 'lasers' },
        { type: 'cnc', url: '/api/laser/registry/status', listKey: 'lasers' },
    ];

    async function resolveBoundDeviceName(boundDevice) {
        if (!boundDevice) return null;
        const source = BOUND_DEVICE_SOURCES.find(s => s.type === boundDevice.type);
        if (!source) return boundDevice.id;
        try {
            const data = await api(source.url);
            const list = data[source.listKey] || [];
            const entry = list.find(e => String(e.id ?? e.device ?? e.host ?? e.name) === String(boundDevice.id));
            return entry?.name || boundDevice.id;
        } catch (error) {
            return boundDevice.id;
        }
    }

    function sourceLabel(camera) {
        if (camera.device_path) return 'USB';
        const url = camera.source_url || '';
        if (url.toLowerCase().startsWith('rtsp')) return 'RTSP';
        return 'URL';
    }

    function compactCardHtml(camera) {
        // Los controles van DENTRO del video, sobre un velo que se funde con
        // la imagen -- no en una barra aparte debajo, que le robaba altura a
        // la cámara y partía la ficha en dos bloques.
        //
        // Solo lo que de verdad hace algo: capturar, grabar y pantalla
        // completa tienen endpoint, y la pausa es la del TIMELAPSE, rotulada
        // así y no como "pausar video". No hay botón de audio: el stream es
        // MJPEG y no lleva sonido; un control que nunca podría funcionar no
        // se dibuja ni apagado.
        return `
            <div class="cam-card cam-card-compact" data-cam-id="${esc(camera.id)}">
                <div class="cam-live-wrap">
                    <img class="cam-live-img" src="${esc(camera.stream_url)}" alt="${esc(camera.name)}" loading="lazy">
                    <span class="cam-live-badge">LIVE</span>
                    <div class="cam-overlay-bar">
                        <button type="button" class="cam-overlay-btn" data-cam-action="capture" title="${tr('captureLabel')}">${ICON_CAPTURE}<span>${tr('captureLabel')}</span></button>
                        <button type="button" class="cam-overlay-btn cam-overlay-btn-rec" data-cam-action="record" title="${tr('recordLabel')}">${ICON_RECORD}<span>${tr('recordLabel')}</span></button>
                        <button type="button" class="cam-overlay-btn" data-cam-action="pause" title="${tr('timelapsePauseLabel')}">${ICON_PAUSE}<span>${tr('timelapseShortLabel')}</span></button>
                        <button type="button" class="cam-overlay-btn" data-cam-action="fullscreen" title="${tr('fullscreenLabel')}">${ICON_FULLSCREEN}<span>${tr('fullscreenShortLabel')}</span></button>
                    </div>
                </div>
            </div>`;
    }

    function fullCardHtml(camera) {
        return `
            <div class="cam-card" data-cam-id="${esc(camera.id)}">
                <div class="cam-card-header">
                    <div class="cam-card-title-row">
                        ${ICON_CAMERA}
                        <strong>${esc(camera.name)}</strong>
                        <span class="cam-status-pill"><span class="cam-status-dot"></span><span class="cam-status-text"></span></span>
                    </div>
                    <button type="button" class="cam-icon-btn" data-cam-action="settings" title="${tr('configureTimelapseTitle')}">${ICON_SETTINGS}</button>
                </div>
                <div class="cam-card-meta">
                    <span>${tr('sourceLabelText')} <strong>${esc(sourceLabel(camera))}</strong></span>
                    <span>${tr('lastCaptureLabel')} <strong data-cam-field="last-capture">--</strong></span>
                    ${camera.bound_device ? `<span>${tr('boundToLabel')} <strong data-cam-field="bound-device">--</strong></span>` : ''}
                </div>

                <div class="cam-timelapse-row">
                    <div class="cam-timelapse-header">
                        <span>${tr('timelapseLabel')}</span>
                        <label class="cam-toggle">
                            <input type="checkbox" data-cam-action="toggle-enabled">
                            <span class="cam-toggle-slider"></span>
                        </label>
                    </div>
                    <div class="cam-stat-grid">
                        <div class="cam-stat"><span>${tr('intervalLabel')}</span><strong data-cam-field="interval">-- s</strong></div>
                        <div class="cam-stat"><span>${tr('durationLabel')}</span><strong data-cam-field="duration">--</strong></div>
                        <div class="cam-stat"><span>${tr('fpsLabel')}</span><strong data-cam-field="fps">--</strong></div>
                    </div>
                    <div class="cam-stat-grid">
                        <div class="cam-stat"><span>${tr('framesLabel')}</span><strong data-cam-field="frame-count">--</strong></div>
                        <div class="cam-stat"><span>${tr('estimatedOutputLabel')}</span><strong data-cam-field="estimated-output">--</strong></div>
                        <div class="cam-stat"><span>${tr('storageLabel')}</span><strong data-cam-field="storage">--</strong></div>
                    </div>
                </div>

                <div class="cam-actions-row">
                    <button type="button" class="cam-btn" data-cam-action="pause" data-cam-paused="false" disabled>${ICON_PAUSE}<span data-cam-field="pause-label">${tr('pauseLabel')}</span></button>
                    <button type="button" class="cam-btn" data-cam-action="capture">${ICON_CAPTURE}<span>${tr('captureLabel')}</span></button>
                    <button type="button" class="cam-btn cam-btn-danger" data-cam-action="record" data-cam-recording="false">${ICON_RECORD}<span data-cam-field="record-label">${tr('recordLabel')}</span></button>
                </div>

                <div class="cam-toggles-row">
                    <button type="button" class="cam-mini-btn" data-cam-action="fullscreen">${ICON_EXPAND}<span>${tr('fullscreenLabel')}</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-overlay">${ICON_OVERLAY}<span>${tr('overlaysLabel')}</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-focus" data-cam-focus-btn hidden>${ICON_FOCUS}<span>${tr('focusLabel')}</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-motion">${ICON_MOTION}<span>${tr('motionDetectionLabel')}</span></button>
                </div>

                <div class="cam-focus-popover" data-cam-focus-popover hidden>
                    <span>${tr('manualFocusLabel')}</span>
                    <input type="range" data-cam-field="focus-slider">
                    <span data-cam-field="focus-value">--</span>
                </div>

                <div class="cam-live-section">
                    <span class="cam-live-label">${tr('liveViewLabel')}</span>
                    <div class="cam-live-wrap">
                        <img class="cam-live-img" src="${esc(camera.stream_url)}" alt="${esc(camera.name)}" loading="lazy">
                        <span class="cam-live-badge">LIVE</span>
                    </div>
                </div>

                <div class="cam-captures-section">
                    <div class="cam-captures-header">
                        <span>${tr('recentCapturesLabel')}</span>
                        <button type="button" class="cam-see-all-btn" data-cam-action="view-all">${tr('viewAllBtn')}</button>
                    </div>
                    <div class="cam-captures-grid" data-cam-field="captures-grid"></div>
                </div>
            </div>`;
    }

    // ── Una instancia por mount() -- estado propio, nunca compartido entre
    // tarjetas (puede haber varias montadas a la vez: cada fila de "Trabajos
    // en curso" del dashboard es una tarjeta compacta independiente). ──
    function createInstance(container, { deviceType, deviceId, cameraId, compact = false, onSettingsClick } = {}) {
        let camera = null;
        let pollTimer = null;
        let destroyed = false;

        // Dos formas de resolver qué cámara mostrar: por dispositivo vinculado
        // (deviceType/deviceId, purpose="timelapse" -- caso de los paneles de
        // máquina) o directo por id de cámara (caso de la galería propia del
        // plugin, donde cada cámara registrada se muestra sea cual sea su
        // propósito, vinculada o no).
        async function resolveCamera() {
            if (cameraId) {
                try {
                    const result = await api('/api/cameras');
                    return (result.cameras || []).find(c => c.id === cameraId) || null;
                } catch (error) {
                    return null;
                }
            }
            return findBoundCamera(deviceType, deviceId);
        }

        function fieldEls(root) {
            return name => root.querySelector(`[data-cam-field="${name}"]`);
        }

        async function applyConfig(overrides) {
            if (!camera) return;
            try {
                await api(`/api/cameras/${camera.id}/timelapse`, { method: 'POST', body: new URLSearchParams(overrides) });
                await refreshStats();
            } catch (error) {
                toast(error.message, 'error');
            }
        }

        async function refreshStats() {
            if (!camera || destroyed) return;
            const cardEl = container.querySelector('.cam-card');
            if (!cardEl) return;
            const field = fieldEls(cardEl);
            try {
                const stats = await api(`/api/cameras/${camera.id}/timelapse/stats`);
                if (field('interval')) field('interval').textContent = `${stats.interval_s} s`;
                if (field('duration')) field('duration').textContent = formatDuration(stats.duration_s);
                if (field('fps')) field('fps').textContent = stats.fps;
                if (field('frame-count')) field('frame-count').textContent = stats.frame_count;
                if (field('estimated-output')) field('estimated-output').textContent = formatBytes(stats.estimated_output_bytes);
                if (field('storage')) field('storage').textContent = `${formatBytes(stats.storage_used_bytes)} / ${formatBytes(stats.storage_total_bytes)}`;

                const enabledInput = cardEl.querySelector('[data-cam-action="toggle-enabled"]');
                if (enabledInput) enabledInput.checked = !!stats.enabled;
                const pauseBtn = cardEl.querySelector('[data-cam-action="pause"]');
                if (pauseBtn) {
                    pauseBtn.disabled = !stats.enabled;
                    pauseBtn.dataset.camPaused = stats.paused ? 'true' : 'false';
                    pauseBtn.innerHTML = stats.paused ? `${ICON_PLAY}<span data-cam-field="pause-label">${tr('resumeLabel')}</span>` : `${ICON_PAUSE}<span data-cam-field="pause-label">${tr('pauseLabel')}</span>`;
                }
                const recordBtn = cardEl.querySelector('[data-cam-action="record"]');
                if (recordBtn) {
                    recordBtn.dataset.camRecording = stats.recording ? 'true' : 'false';
                    recordBtn.innerHTML = stats.recording ? `${ICON_STOP}<span data-cam-field="record-label">${tr('stopLabel')}</span>` : `${ICON_RECORD}<span data-cam-field="record-label">${tr('recordLabel')}</span>`;
                }
                cardEl.querySelector('[data-cam-action="toggle-overlay"]')?.classList.toggle('active', !!stats.overlay);
                cardEl.querySelector('[data-cam-action="toggle-motion"]')?.classList.toggle('active', !!stats.motion_detection);
            } catch (error) {
                // Sin stats no se rompe la tarjeta -- el stream en vivo sigue
                // andando aunque el plugin no responda este endpoint puntual.
            }

            try {
                const capturesResult = await api(`/api/cameras/${camera.id}/captures?limit=6`);
                const captures = capturesResult.captures || [];
                const grid = field('captures-grid');
                if (grid) {
                    grid.innerHTML = captures.map(c => `
                        <div class="cam-capture-thumb">
                            <img src="/api/cameras/${esc(camera.id)}/captures/${esc(c.filename)}" alt="" loading="lazy">
                        </div>`).join('') || `<p class="cam-empty">${tr('noCapturesYet')}</p>`;
                }
                if (field('last-capture') && captures.length) field('last-capture').textContent = formatClock(captures[0].timestamp);
            } catch (error) {
                // Igual que arriba -- opcional, no bloquea el resto de la tarjeta.
            }
        }

        async function loadFocusSupport(cardEl) {
            if (!camera?.device_path) return;
            try {
                const focus = await api(`/api/cameras/${camera.id}/focus`);
                if (!focus.supported) return;
                const btn = cardEl.querySelector('[data-cam-focus-btn]');
                if (btn) btn.hidden = false;
                const slider = cardEl.querySelector('[data-cam-field="focus-slider"]');
                if (slider) {
                    slider.min = focus.minimum;
                    slider.max = focus.maximum;
                    slider.step = focus.step || 1;
                    slider.value = focus.current;
                }
                const valueEl = cardEl.querySelector('[data-cam-field="focus-value"]');
                if (valueEl) valueEl.textContent = focus.current;
            } catch (error) {
                // Cámara sin control de enfoque -- el botón se queda oculto.
            }
        }


        // ── Visor ampliado ────────────────────────────────────────────────
        // El botón de ampliar llamaba a la pantalla completa del navegador
        // sobre el <img>: la imagen sola, sin controles ni material. Acá se
        // abre un visor propio con el video grande, sus controles debajo, y
        // la tira de capturas, timelapses y grabaciones.

        function tarjetaMedia(camera, item, tipo) {
            const url = `/api/cameras/${camera.id}/${tipo === 'recording' ? 'recordings' : 'captures'}/${encodeURIComponent(item.filename)}`;
            const fecha = new Date(item.timestamp * 1000).toLocaleString();
            const peso = item.size_bytes > 1048576
                ? `${(item.size_bytes / 1048576).toFixed(1)} MB`
                : `${Math.max(1, Math.round(item.size_bytes / 1024))} KB`;
            const vista = tipo === 'recording'
                ? `<video src="${esc(url)}" preload="metadata" muted></video>`
                : `<img src="${esc(url)}" alt="" loading="lazy">`;
            return `
                <figure class="cam-media" data-media-type="${tipo}" data-media-file="${esc(item.filename)}">
                    ${vista}
                    <button type="button" class="cam-media-del" data-media-del title="${tr('deleteLabel')}">${ICON_TRASH}</button>
                    <figcaption>${esc(fecha)} · ${esc(peso)}</figcaption>
                    <div class="cam-media-confirm" hidden>
                        <span>${tr('deleteConfirmShort')}</span>
                        <div>
                            <button type="button" class="cam-media-yes" data-media-yes>${tr('deleteLabel')}</button>
                            <button type="button" class="cam-media-no" data-media-no>${tr('cancelLabel')}</button>
                        </div>
                    </div>
                </figure>`;
        }

        async function cargarMedia(overlay) {
            const tira = overlay.querySelector('[data-cam-media-strip]');
            if (!tira) return;
            let capturas = [], grabaciones = [];
            try {
                const [c, g] = await Promise.all([
                    api(`/api/cameras/${camera.id}/captures?limit=40`),
                    api(`/api/cameras/${camera.id}/recordings?limit=40`).catch(() => ({ recordings: [] })),
                ]);
                capturas = c.captures || [];
                grabaciones = g.recordings || [];
            } catch (_) { /* sin material: se dice, no se deja el hueco */ }

            const items = [
                ...grabaciones.map(r => ({ ...r, tipo: 'recording' })),
                ...capturas.map(c => ({ ...c, tipo: 'capture' })),
            ].sort((a, b) => b.timestamp - a.timestamp);

            tira.innerHTML = items.length
                ? items.map(i => tarjetaMedia(camera, i, i.tipo)).join('')
                : `<p class="cam-media-empty">${tr('noMediaYet')}</p>`;
        }

        function abrirVisorAmpliado() {
            if (!camera) return;
            const overlay = document.createElement('div');
            overlay.className = 'cam-expand-overlay';
            overlay.innerHTML = `
                <div class="cam-expand-backdrop" data-cam-expand-close></div>
                <div class="cam-expand-dialog" role="dialog" aria-modal="true">
                    <div class="cam-expand-head">
                        <span class="cam-expand-title">${ICON_CAMERA}<strong>${esc(camera.name)}</strong></span>
                        <button type="button" class="cam-expand-close" data-cam-expand-close title="${tr('closeLabel')}">${ICON_CLOSE}</button>
                    </div>
                    <div class="cam-expand-stage">
                        <img class="cam-live-img cam-expand-img" src="${esc(camera.stream_url)}" alt="${esc(camera.name)}">
                        <span class="cam-live-badge">LIVE</span>
                    </div>
                    <div class="cam-expand-controls">
                        <button type="button" class="cam-expand-btn" data-cam-action="capture">${ICON_CAPTURE}<span>${tr('captureLabel')}</span></button>
                        <button type="button" class="cam-expand-btn cam-expand-btn-rec" data-cam-action="record">${ICON_RECORD}<span>${tr('recordLabel')}</span></button>
                        <button type="button" class="cam-expand-btn" data-cam-action="pause">${ICON_PAUSE}<span>${tr('timelapseShortLabel')}</span></button>
                        <button type="button" class="cam-expand-btn" data-cam-action="settings">${ICON_SETTINGS}<span>${tr('configureTimelapseTitle')}</span></button>
                    </div>
                    <div class="cam-expand-media" data-cam-media-strip></div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelectorAll('.cam-live-img').forEach(watchStream);
            bindEvents(overlay.querySelector('.cam-expand-dialog'));

            const cerrar = () => {
                document.removeEventListener('keydown', porTecla);
                overlay.remove();
            };
            // Escape cierra: es lo que la mano espera de algo que ocupa la
            // pantalla, y evita quedar atrapado si el botón queda fuera de
            // vista en una pantalla chica.
            const porTecla = evento => { if (evento.key === 'Escape') cerrar(); };
            document.addEventListener('keydown', porTecla);
            overlay.querySelectorAll('[data-cam-expand-close]').forEach(b => b.addEventListener('click', cerrar));

            // Borrar pide confirmación SOBRE la propia miniatura, no en una
            // ventana aparte: la pregunta se responde donde se hizo, y se ve
            // qué se va a borrar mientras se decide.
            overlay.addEventListener('click', async evento => {
                const figura = evento.target.closest('.cam-media');
                if (!figura) return;
                if (evento.target.closest('[data-media-del]')) {
                    figura.querySelector('.cam-media-confirm').hidden = false;
                    return;
                }
                if (evento.target.closest('[data-media-no]')) {
                    figura.querySelector('.cam-media-confirm').hidden = true;
                    return;
                }
                if (evento.target.closest('[data-media-yes]')) {
                    const tipo = figura.dataset.mediaType === 'recording' ? 'recordings' : 'captures';
                    try {
                        await api(`/api/cameras/${camera.id}/${tipo}/${encodeURIComponent(figura.dataset.mediaFile)}`,
                                  { method: 'DELETE' });
                        figura.remove();
                    } catch (error) {
                        toast(error.message, 'error');
                        figura.querySelector('.cam-media-confirm').hidden = true;
                    }
                }
            });

            cargarMedia(overlay);
        }

        function bindEvents(cardEl) {
            cardEl.addEventListener('click', async event => {
                const btn = event.target.closest('[data-cam-action]');
                if (!btn || !camera) return;
                // Esta tarjeta se monta DENTRO de la ficha de cualquier máquina
                // (dev-card, printer-card...), que a su vez tiene su propio
                // click en toda la tarjeta para abrir el panel/sección completa.
                // Sin esto, ampliar/capturar/grabar/configurar la cámara también
                // disparaba esa navegación por encima -- el botón hacía lo suyo
                // Y ADEMÁS mandaba a otro lado.
                event.stopPropagation();
                const action = btn.dataset.camAction;
                try {
                    if (action === 'capture') {
                        btn.disabled = true;
                        await api(`/api/cameras/${camera.id}/capture`, { method: 'POST' });
                        toast(tr('captureSaved'));
                        await refreshStats();
                    } else if (action === 'pause') {
                        const endpoint = btn.dataset.camPaused === 'true' ? 'resume' : 'pause';
                        await api(`/api/cameras/${camera.id}/timelapse/${endpoint}`, { method: 'POST' });
                        await refreshStats();
                    } else if (action === 'record') {
                        const isStopping = btn.dataset.camRecording === 'true';
                        await api(`/api/cameras/${camera.id}/record/${isStopping ? 'stop' : 'start'}`, { method: 'POST' });
                        await refreshStats();
                    } else if (action === 'toggle-overlay') {
                        await applyConfig({ overlay: (!btn.classList.contains('active')).toString() });
                    } else if (action === 'toggle-motion') {
                        await applyConfig({ motion_detection: (!btn.classList.contains('active')).toString() });
                    } else if (action === 'toggle-focus') {
                        cardEl.querySelector('[data-cam-focus-popover]')?.toggleAttribute('hidden');
                    } else if (action === 'fullscreen') {
                        abrirVisorAmpliado();
                    } else if (action === 'settings') {
                        // Por default manda a la sección del plugin (donde vive
                        // el editor de nombre/propósito/vínculo) -- si el
                        // llamador ya está parado ahí (la galería propia del
                        // plugin), pasa su propio callback para abrir el editor
                        // in-place en vez de "navegar" a la página en la que
                        // ya está.
                        if (onSettingsClick) onSettingsClick(camera);
                        else window.switchSection?.('camera-viewer');
                    } else if (action === 'view-all') {
                        openGallery(cardEl);
                    }
                } catch (error) {
                    toast(error.message, 'error');
                } finally {
                    if (action === 'capture') btn.disabled = false;
                }
            });

            cardEl.querySelector('[data-cam-action="toggle-enabled"]')?.addEventListener('change', async event => {
                await applyConfig({ enabled: event.target.checked.toString() });
            });

            const focusSlider = cardEl.querySelector('[data-cam-field="focus-slider"]');
            focusSlider?.addEventListener('change', async event => {
                if (!camera) return;
                try {
                    await api(`/api/cameras/${camera.id}/focus`, { method: 'POST', body: new URLSearchParams({ value: event.target.value }) });
                    const valueEl = cardEl.querySelector('[data-cam-field="focus-value"]');
                    if (valueEl) valueEl.textContent = event.target.value;
                } catch (error) {
                    toast(error.message, 'error');
                }
            });
        }

        // Galería completa -- lightbox propio (no reutiliza el de
        // camera-viewer.js: ese vive dentro de su propia sección, este
        // widget puede montarse dentro de un modal de impresora que ya
        // tiene su propio z-index/backdrop).
        async function openGallery(cardEl) {
            if (!camera) return;
            const overlay = document.createElement('div');
            overlay.className = 'cam-gallery-overlay';
            overlay.innerHTML = `
                <div class="cam-gallery-backdrop"></div>
                <div class="cam-gallery-dialog">
                    <div class="cam-gallery-header">
                        <strong>${esc(camera.name)} · ${esc(tr('capturesWord'))}</strong>
                        <div class="cam-gallery-header-actions">
                            <button type="button" class="cam-btn cam-btn-accent" data-cam-assemble>${tr('assembleVideoBtn')}</button>
                            <button type="button" class="cam-icon-btn" data-cam-gallery-close>${ICON_CLOSE}</button>
                        </div>
                    </div>
                    <div class="cam-gallery-grid"></div>
                </div>`;
            document.body.appendChild(overlay);
            const close = () => overlay.remove();
            overlay.querySelector('.cam-gallery-backdrop').addEventListener('click', close);
            overlay.querySelector('[data-cam-gallery-close]').addEventListener('click', close);
            overlay.querySelector('[data-cam-assemble]').addEventListener('click', async event => {
                const assembleBtn = event.currentTarget;
                assembleBtn.disabled = true;
                assembleBtn.textContent = tr('assemblingLabel');
                try {
                    const result = await api(`/api/cameras/${camera.id}/timelapse/assemble`, { method: 'POST' });
                    toast(tr('videoAssembled', { filename: result.filename }));
                } catch (error) {
                    toast(error.message, 'error');
                } finally {
                    assembleBtn.disabled = false;
                    assembleBtn.textContent = tr('assembleVideoBtn');
                }
            });
            try {
                const result = await api(`/api/cameras/${camera.id}/captures`);
                const captures = result.captures || [];
                const grid = overlay.querySelector('.cam-gallery-grid');
                grid.innerHTML = captures.map(c => `
                    <a class="cam-gallery-thumb" href="/api/cameras/${esc(camera.id)}/captures/${esc(c.filename)}" target="_blank" rel="noopener">
                        <img src="/api/cameras/${esc(camera.id)}/captures/${esc(c.filename)}" alt="" loading="lazy">
                        <span>${esc(formatClock(c.timestamp))}</span>
                    </a>`).join('') || `<p class="cam-empty">${tr('noCapturesYet')}</p>`;
            } catch (error) {
                toast(error.message, 'error');
            }
        }

        async function render() {
            if (destroyed) return;
            camera = await resolveCamera();
            if (!camera) {
                container.innerHTML = '';
                return;
            }
            container.innerHTML = compact ? compactCardHtml(camera) : fullCardHtml(camera);
            container.querySelectorAll('.cam-live-img').forEach(watchStream);
            const cardEl = container.querySelector('.cam-card');
            if (compact && cardEl) bindEvents(cardEl);
            if (!compact && cardEl) {
                bindEvents(cardEl);
                await loadFocusSupport(cardEl);
                await refreshStats();
                if (camera.bound_device) {
                    const name = await resolveBoundDeviceName(camera.bound_device);
                    const field = cardEl.querySelector('[data-cam-field="bound-device"]');
                    if (field) field.textContent = name || camera.bound_device.id;
                }
            }
        }

        async function start() {
            await render();
            pollTimer = setInterval(async () => {
                if (destroyed || !document.body.contains(container)) {
                    stop();
                    return;
                }
                if (!camera) {
                    await render();
                } else if (!compact) {
                    await refreshStats();
                }
            }, POLL_INTERVAL_MS);
        }

        function stop() {
            destroyed = true;
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = null;
        }

        return { start, stop };
    }

    const instancesByContainer = new WeakMap();

    function mount(container, opts) {
        if (!container) return;
        unmount(container);
        const instance = createInstance(container, opts);
        instancesByContainer.set(container, instance);
        instance.start();
    }

    function unmount(container) {
        if (!container) return;
        const existing = instancesByContainer.get(container);
        if (existing) {
            existing.stop();
            instancesByContainer.delete(container);
        }
    }

    window.NopalCameraCard = { mount, unmount };
})();
