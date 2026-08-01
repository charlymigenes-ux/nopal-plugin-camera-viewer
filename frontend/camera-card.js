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

    const icon = (body, size = 16) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    const ICON_CAMERA = icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', 16);
    const ICON_SETTINGS = icon('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>', 16);
    const ICON_PAUSE = icon('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>', 14);
    const ICON_PLAY = icon('<polygon points="5 3 19 12 5 21 5 3"/>', 14);
    const ICON_CAPTURE = icon('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>', 14);
    const ICON_RECORD = icon('<circle cx="12" cy="12" r="8"/>', 14);
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
        if (!response.ok) throw new Error(data.detail || 'La operación no se pudo completar.');
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
            img.closest('.cam-card')?.classList.add('is-offline');
            setTimeout(() => {
                if (!document.body.contains(img)) return;
                const sep = baseSrc.includes('?') ? '&' : '?';
                img.src = `${baseSrc}${sep}_retry=${Date.now()}`;
            }, 5000);
        });
        img.addEventListener('load', () => {
            img.closest('.cam-card')?.classList.remove('is-offline');
        });
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

    function sourceLabel(camera) {
        if (camera.device_path) return 'USB';
        const url = camera.source_url || '';
        if (url.toLowerCase().startsWith('rtsp')) return 'RTSP';
        return 'URL';
    }

    function compactCardHtml(camera) {
        return `
            <div class="cam-card cam-card-compact" data-cam-id="${esc(camera.id)}">
                <div class="cam-live-wrap">
                    <img class="cam-live-img" src="${esc(camera.stream_url)}" alt="${esc(camera.name)}" loading="lazy">
                    <span class="cam-live-badge">LIVE</span>
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
                        <span class="cam-status-pill"><span class="cam-status-dot"></span><span class="cam-status-text">En línea</span></span>
                    </div>
                    <button type="button" class="cam-icon-btn" data-cam-action="settings" title="Configurar timelapse">${ICON_SETTINGS}</button>
                </div>
                <div class="cam-card-meta">
                    <span>Fuente: <strong>${esc(sourceLabel(camera))}</strong></span>
                    <span>Última captura: <strong data-cam-field="last-capture">--</strong></span>
                </div>

                <div class="cam-timelapse-row">
                    <div class="cam-timelapse-header">
                        <span>Timelapse</span>
                        <label class="cam-toggle">
                            <input type="checkbox" data-cam-action="toggle-enabled">
                            <span class="cam-toggle-slider"></span>
                        </label>
                    </div>
                    <div class="cam-stat-grid">
                        <div class="cam-stat"><span>Intervalo</span><strong data-cam-field="interval">-- s</strong></div>
                        <div class="cam-stat"><span>Duración</span><strong data-cam-field="duration">--</strong></div>
                        <div class="cam-stat"><span>FPS</span><strong data-cam-field="fps">--</strong></div>
                    </div>
                    <div class="cam-stat-grid">
                        <div class="cam-stat"><span>Fotogramas</span><strong data-cam-field="frame-count">--</strong></div>
                        <div class="cam-stat"><span>Est. salida</span><strong data-cam-field="estimated-output">--</strong></div>
                        <div class="cam-stat"><span>Almacenamiento</span><strong data-cam-field="storage">--</strong></div>
                    </div>
                </div>

                <div class="cam-actions-row">
                    <button type="button" class="cam-btn" data-cam-action="pause" disabled>${ICON_PAUSE}<span data-cam-field="pause-label">Pausar</span></button>
                    <button type="button" class="cam-btn" data-cam-action="capture">${ICON_CAPTURE}<span>Capturar</span></button>
                    <button type="button" class="cam-btn cam-btn-danger" data-cam-action="record">${ICON_RECORD}<span data-cam-field="record-label">Grabar</span></button>
                </div>

                <div class="cam-toggles-row">
                    <button type="button" class="cam-mini-btn" data-cam-action="fullscreen">${ICON_EXPAND}<span>Pantalla completa</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-overlay">${ICON_OVERLAY}<span>Superposiciones</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-focus" data-cam-focus-btn hidden>${ICON_FOCUS}<span>Enfoque</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-action="toggle-motion">${ICON_MOTION}<span>Det. movimiento</span></button>
                </div>

                <div class="cam-focus-popover" data-cam-focus-popover hidden>
                    <span>Enfoque manual</span>
                    <input type="range" data-cam-field="focus-slider">
                    <span data-cam-field="focus-value">--</span>
                </div>

                <div class="cam-live-section">
                    <span class="cam-live-label">Vista en vivo</span>
                    <div class="cam-live-wrap">
                        <img class="cam-live-img" src="${esc(camera.stream_url)}" alt="${esc(camera.name)}" loading="lazy">
                        <span class="cam-live-badge">LIVE</span>
                    </div>
                </div>

                <div class="cam-captures-section">
                    <div class="cam-captures-header">
                        <span>Capturas recientes</span>
                        <button type="button" class="cam-see-all-btn" data-cam-action="view-all">Ver todas</button>
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
                    pauseBtn.innerHTML = stats.paused ? `${ICON_PLAY}<span data-cam-field="pause-label">Reanudar</span>` : `${ICON_PAUSE}<span data-cam-field="pause-label">Pausar</span>`;
                }
                const recordBtn = cardEl.querySelector('[data-cam-action="record"]');
                if (recordBtn) recordBtn.innerHTML = stats.recording ? `${ICON_STOP}<span data-cam-field="record-label">Detener</span>` : `${ICON_RECORD}<span data-cam-field="record-label">Grabar</span>`;
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
                        </div>`).join('') || '<p class="cam-empty">Sin capturas todavía.</p>';
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

        function bindEvents(cardEl) {
            cardEl.addEventListener('click', async event => {
                const btn = event.target.closest('[data-cam-action]');
                if (!btn || !camera) return;
                const action = btn.dataset.camAction;
                try {
                    if (action === 'capture') {
                        btn.disabled = true;
                        await api(`/api/cameras/${camera.id}/capture`, { method: 'POST' });
                        toast('Captura guardada.');
                        await refreshStats();
                    } else if (action === 'pause') {
                        const label = btn.querySelector('[data-cam-field="pause-label"]')?.textContent;
                        const endpoint = label === 'Reanudar' ? 'resume' : 'pause';
                        await api(`/api/cameras/${camera.id}/timelapse/${endpoint}`, { method: 'POST' });
                        await refreshStats();
                    } else if (action === 'record') {
                        const isStopping = btn.querySelector('[data-cam-field="record-label"]')?.textContent === 'Detener';
                        await api(`/api/cameras/${camera.id}/record/${isStopping ? 'stop' : 'start'}`, { method: 'POST' });
                        await refreshStats();
                    } else if (action === 'toggle-overlay') {
                        await applyConfig({ overlay: (!btn.classList.contains('active')).toString() });
                    } else if (action === 'toggle-motion') {
                        await applyConfig({ motion_detection: (!btn.classList.contains('active')).toString() });
                    } else if (action === 'toggle-focus') {
                        cardEl.querySelector('[data-cam-focus-popover]')?.toggleAttribute('hidden');
                    } else if (action === 'fullscreen') {
                        const img = cardEl.querySelector('.cam-live-img');
                        img?.requestFullscreen?.().catch(() => toast('El navegador no permitió pantalla completa.', 'error'));
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
                        <strong>${esc(camera.name)} · Capturas</strong>
                        <div class="cam-gallery-header-actions">
                            <button type="button" class="cam-btn cam-btn-accent" data-cam-assemble>Armar video</button>
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
                assembleBtn.textContent = 'Armando…';
                try {
                    const result = await api(`/api/cameras/${camera.id}/timelapse/assemble`, { method: 'POST' });
                    toast(`Video armado: ${result.filename}`);
                } catch (error) {
                    toast(error.message, 'error');
                } finally {
                    assembleBtn.disabled = false;
                    assembleBtn.textContent = 'Armar video';
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
                    </a>`).join('') || '<p class="cam-empty">Sin capturas todavía.</p>';
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
            if (!compact && cardEl) {
                bindEvents(cardEl);
                await loadFocusSupport(cardEl);
                await refreshStats();
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
