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
 * Expone window.NopalCameraCard = { mount(container, opts), unmount(container),
 * openCaptures(cameraId, embedContainer?) }. openCaptures abre el gestor de
 * capturas/timelapse de forma independiente, sin necesitar ninguna instancia
 * ya montada; sin embedContainer se abre como modal, con uno se inserta
 * inline dentro de ese elemento. Devuelve `{ close }` para poder limpiarlo
 * (temporizadores de reproducción, etc.) cuando el llamador lo desmonte.
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
            timelapseNotEnabledHint: 'El timelapse de esta cámara no está activado -- actívalo desde Cámaras > Configuración.',
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
            capturesWord: 'Capturas', assembleVideoBtn: 'Armar timelapse', assemblingLabel: 'Armando…',
            videoAssembled: 'Video armado: {filename}',
            searchCapturesPlaceholder: 'Buscar capturas...',
            viewBtn: 'Ver', saveBtn: 'Guardar', editBtn: 'Editar', mergeBtn: 'Juntar',
            noVideosYet: 'Todavía no has armado ningún video.',
            rotateBtn: 'Rotar', cropBtn: 'Recortar', saveCopyBtn: 'Guardar copia', generateBtn: 'Generar',
            firstFrameBtn: 'Primer fotograma', prevFrameBtn: 'Fotograma anterior', playBtn: 'Reproducir',
            nextFrameBtn: 'Siguiente fotograma', lastFrameBtn: 'Último fotograma',
            speedLabel: 'Velocidad', loopLabel: 'Bucle', zoomOutBtn: 'Alejar', zoomInBtn: 'Acercar',
            approxWord: 'aprox.', estimatedDurationLabel: 'Duración estimada',
            captureDetailsTitle: 'Detalles de la captura seleccionada',
            cameraFieldLabel: 'Cámara', resolutionFieldLabel: 'Resolución', dateFieldLabel: 'Fecha / Hora',
            timelapseWord: 'Timelapse', selectedFramesLabel: 'Fotogramas seleccionados', ofWord: 'de',
            estimatedSizeLabel: 'Tamaño estimado',
            exportSectionTitle: 'Exportar / Descargar', exportSectionHint: 'Elige el formato de salida.',
            videoRecommendedLabel: 'Video (recomendado)', loopAnimationLabel: 'Animación en bucle', allCapturesLabel: 'Todas las capturas',
            previewAndExportBtn: 'Previsualizar y exportar',
            selectAllLabel: 'Seleccionar todo', deselectLabel: 'Deseleccionar',
            sortLabel: 'Ordenar', sortNewestLabel: 'Más recientes', sortOldestLabel: 'Más antiguas', sortNameLabel: 'Nombre',
            groupByDayLabel: 'Agrupar por día',
            selectedCountLabel: '{count} de {total} seleccionadas', totalCapturesLabel: '{count} capturas en total',
            assembledVideosTitle: 'Timelapses armados',
            deleteSelectedConfirm: '¿Borrar {count} capturas seleccionadas?',
            editSaved: 'Cambios guardados.',
            mergeHint: 'Ordena las capturas seleccionadas y genera un video con ese orden.',
        },
        en: {
            deleteLabel: 'Delete',
            deleteConfirmShort: 'Delete this?',
            cancelLabel: 'Cancel',
            closeLabel: 'Close',
            noMediaYet: 'No captures or recordings yet.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Expand',
            timelapsePauseLabel: 'Pause timelapse',
            timelapseNotEnabledHint: 'This camera\'s timelapse is not enabled -- turn it on from Cameras > Configuration.',
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
            capturesWord: 'Captures', assembleVideoBtn: 'Assemble timelapse', assemblingLabel: 'Assembling…',
            videoAssembled: 'Video assembled: {filename}',
            searchCapturesPlaceholder: 'Search captures...',
            viewBtn: 'View', saveBtn: 'Save', editBtn: 'Edit', mergeBtn: 'Merge',
            noVideosYet: 'No video assembled yet.',
            rotateBtn: 'Rotate', cropBtn: 'Crop', saveCopyBtn: 'Save copy', generateBtn: 'Generate',
            firstFrameBtn: 'First frame', prevFrameBtn: 'Previous frame', playBtn: 'Play',
            nextFrameBtn: 'Next frame', lastFrameBtn: 'Last frame',
            speedLabel: 'Speed', loopLabel: 'Loop', zoomOutBtn: 'Zoom out', zoomInBtn: 'Zoom in',
            approxWord: 'approx.', estimatedDurationLabel: 'Estimated duration',
            captureDetailsTitle: 'Selected capture details',
            cameraFieldLabel: 'Camera', resolutionFieldLabel: 'Resolution', dateFieldLabel: 'Date / Time',
            timelapseWord: 'Timelapse', selectedFramesLabel: 'Selected frames', ofWord: 'of',
            estimatedSizeLabel: 'Estimated size',
            exportSectionTitle: 'Export / Download', exportSectionHint: 'Choose the output format.',
            videoRecommendedLabel: 'Video (recommended)', loopAnimationLabel: 'Looping animation', allCapturesLabel: 'All captures',
            previewAndExportBtn: 'Preview and export',
            selectAllLabel: 'Select all', deselectLabel: 'Deselect',
            sortLabel: 'Sort', sortNewestLabel: 'Newest', sortOldestLabel: 'Oldest', sortNameLabel: 'Name',
            groupByDayLabel: 'Group by day',
            selectedCountLabel: '{count} of {total} selected', totalCapturesLabel: '{count} captures total',
            assembledVideosTitle: 'Assembled timelapses',
            deleteSelectedConfirm: 'Delete {count} selected captures?',
            editSaved: 'Changes saved.',
            mergeHint: 'Order the selected captures and generate a video in that order.',
        },
        de: {
            deleteLabel: 'Löschen',
            deleteConfirmShort: 'Das löschen?',
            cancelLabel: 'Abbrechen',
            closeLabel: 'Schließen',
            noMediaYet: 'Noch keine Aufnahmen.',
            timelapseShortLabel: 'Zeitraffer', fullscreenShortLabel: 'Vergrößern',
            timelapsePauseLabel: 'Zeitraffer pausieren',
            timelapseNotEnabledHint: 'Der Zeitraffer dieser Kamera ist nicht aktiviert -- aktiviere ihn unter Kameras > Konfiguration.',
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
            searchCapturesPlaceholder: 'Aufnahmen suchen...', viewBtn: 'Ansehen', saveBtn: 'Speichern', editBtn: 'Bearbeiten',
            mergeBtn: 'Zusammenfügen', noVideosYet: 'Du hast noch kein Video erstellt.', rotateBtn: 'Drehen', cropBtn: 'Zuschneiden',
            saveCopyBtn: 'Kopie speichern', generateBtn: 'Erzeugen', firstFrameBtn: 'Erstes Bild', prevFrameBtn: 'Vorheriges Bild',
            playBtn: 'Abspielen', nextFrameBtn: 'Nächstes Bild', lastFrameBtn: 'Letztes Bild', speedLabel: 'Geschwindigkeit', loopLabel: 'Schleife',
            zoomOutBtn: 'Verkleinern', zoomInBtn: 'Vergrößern', approxWord: 'ca.', estimatedDurationLabel: 'Geschätzte Dauer',
            captureDetailsTitle: 'Details der ausgewählten Aufnahme', cameraFieldLabel: 'Kamera', resolutionFieldLabel: 'Auflösung',
            dateFieldLabel: 'Datum / Uhrzeit', timelapseWord: 'Zeitraffer', selectedFramesLabel: 'Ausgewählte Bilder', ofWord: 'von',
            estimatedSizeLabel: 'Geschätzte Größe', exportSectionTitle: 'Exportieren / Herunterladen', exportSectionHint: 'Wähle das Ausgabeformat.',
            videoRecommendedLabel: 'Video (empfohlen)', loopAnimationLabel: 'Endlosanimation', allCapturesLabel: 'Alle Aufnahmen',
            previewAndExportBtn: 'Vorschau und Export', selectAllLabel: 'Alle auswählen', deselectLabel: 'Auswahl aufheben', sortLabel: 'Sortieren',
            sortNewestLabel: 'Neueste zuerst', sortOldestLabel: 'Älteste zuerst', sortNameLabel: 'Name', groupByDayLabel: 'Nach Tag gruppieren',
            selectedCountLabel: '{count} von {total} ausgewählt', totalCapturesLabel: '{count} Aufnahmen insgesamt',
            assembledVideosTitle: 'Erstellte Zeitraffer', deleteSelectedConfirm: '{count} ausgewählte Aufnahmen löschen?',
            editSaved: 'Änderungen gespeichert.', mergeHint: 'Ordne die ausgewählten Aufnahmen und erzeuge ein Video in dieser Reihenfolge.',
        },
        fr: {
            deleteLabel: 'Supprimer',
            deleteConfirmShort: 'Supprimer ceci ?',
            cancelLabel: 'Annuler',
            closeLabel: 'Fermer',
            noMediaYet: 'Aucune capture ni enregistrement.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Agrandir',
            timelapsePauseLabel: 'Mettre en pause le timelapse',
            timelapseNotEnabledHint: "Le timelapse de cette caméra n'est pas activé -- activez-le depuis Caméras > Configuration.",
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
            searchCapturesPlaceholder: 'Rechercher des captures...', viewBtn: 'Voir', saveBtn: 'Enregistrer', editBtn: 'Modifier',
            mergeBtn: 'Fusionner', noVideosYet: 'Aucune vidéo assemblée pour le moment.', rotateBtn: 'Pivoter', cropBtn: 'Recadrer',
            saveCopyBtn: 'Enregistrer une copie', generateBtn: 'Générer', firstFrameBtn: 'Première image', prevFrameBtn: 'Image précédente',
            playBtn: 'Lire', nextFrameBtn: 'Image suivante', lastFrameBtn: 'Dernière image', speedLabel: 'Vitesse', loopLabel: 'Boucle',
            zoomOutBtn: 'Dézoomer', zoomInBtn: 'Zoomer', approxWord: 'env.', estimatedDurationLabel: 'Durée estimée',
            captureDetailsTitle: 'Détails de la capture sélectionnée', cameraFieldLabel: 'Caméra', resolutionFieldLabel: 'Résolution',
            dateFieldLabel: 'Date / Heure', timelapseWord: 'Timelapse', selectedFramesLabel: 'Images sélectionnées', ofWord: 'sur',
            estimatedSizeLabel: 'Taille estimée', exportSectionTitle: 'Exporter / Télécharger', exportSectionHint: 'Choisissez le format de sortie.',
            videoRecommendedLabel: 'Vidéo (recommandé)', loopAnimationLabel: 'Animation en boucle', allCapturesLabel: 'Toutes les captures',
            previewAndExportBtn: 'Prévisualiser et exporter', selectAllLabel: 'Tout sélectionner', deselectLabel: 'Désélectionner',
            sortLabel: 'Trier', sortNewestLabel: 'Plus récentes', sortOldestLabel: 'Plus anciennes', sortNameLabel: 'Nom',
            groupByDayLabel: 'Grouper par jour', selectedCountLabel: '{count} sur {total} sélectionnées',
            totalCapturesLabel: '{count} captures au total', assembledVideosTitle: 'Timelapses assemblés',
            deleteSelectedConfirm: 'Supprimer les {count} captures sélectionnées ?', editSaved: 'Modifications enregistrées.',
            mergeHint: 'Ordonnez les captures sélectionnées et générez une vidéo dans cet ordre.',
        },
        'pt-BR': {
            deleteLabel: 'Excluir',
            deleteConfirmShort: 'Excluir isto?',
            cancelLabel: 'Cancelar',
            closeLabel: 'Fechar',
            noMediaYet: 'Ainda não há capturas ou gravações.',
            timelapseShortLabel: 'Timelapse', fullscreenShortLabel: 'Ampliar',
            timelapsePauseLabel: 'Pausar timelapse',
            timelapseNotEnabledHint: 'O timelapse desta câmera não está ativado -- ative em Câmeras > Configuração.',
            cameraOfflineHint: 'A câmera não está enviando vídeo.',
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
            searchCapturesPlaceholder: 'Pesquisar capturas...', viewBtn: 'Ver', saveBtn: 'Salvar', editBtn: 'Editar', mergeBtn: 'Juntar',
            noVideosYet: 'Você ainda não montou nenhum vídeo.', rotateBtn: 'Girar', cropBtn: 'Cortar', saveCopyBtn: 'Salvar cópia',
            generateBtn: 'Gerar', firstFrameBtn: 'Primeiro quadro', prevFrameBtn: 'Quadro anterior', playBtn: 'Reproduzir',
            nextFrameBtn: 'Próximo quadro', lastFrameBtn: 'Último quadro', speedLabel: 'Velocidade', loopLabel: 'Loop', zoomOutBtn: 'Reduzir',
            zoomInBtn: 'Ampliar', approxWord: 'aprox.', estimatedDurationLabel: 'Duração estimada',
            captureDetailsTitle: 'Detalhes da captura selecionada', cameraFieldLabel: 'Câmera', resolutionFieldLabel: 'Resolução',
            dateFieldLabel: 'Data / Hora', timelapseWord: 'Timelapse', selectedFramesLabel: 'Quadros selecionados', ofWord: 'de',
            estimatedSizeLabel: 'Tamanho estimado', exportSectionTitle: 'Exportar / Baixar', exportSectionHint: 'Escolha o formato de saída.',
            videoRecommendedLabel: 'Vídeo (recomendado)', loopAnimationLabel: 'Animação em loop', allCapturesLabel: 'Todas as capturas',
            previewAndExportBtn: 'Pré-visualizar e exportar', selectAllLabel: 'Selecionar tudo', deselectLabel: 'Desmarcar', sortLabel: 'Ordenar',
            sortNewestLabel: 'Mais recentes', sortOldestLabel: 'Mais antigas', sortNameLabel: 'Nome', groupByDayLabel: 'Agrupar por dia',
            selectedCountLabel: '{count} de {total} selecionadas', totalCapturesLabel: '{count} capturas no total',
            assembledVideosTitle: 'Timelapses montados', deleteSelectedConfirm: 'Excluir as {count} capturas selecionadas?',
            editSaved: 'Alterações salvas.', mergeHint: 'Ordene as capturas selecionadas e gere um vídeo nessa ordem.',
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
    // ── Iconos del gestor de capturas/timelapse (rediseño del modal) ──
    const ICON_SEARCH = icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>', 15);
    const ICON_EYE = icon('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>', 14);
    const ICON_EDIT = icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>', 14);
    const ICON_MERGE = icon('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>', 14);
    const ICON_PLUS = icon('<path d="M12 5v14M5 12h14"/>', 14);
    const ICON_SPINNER = icon('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>', 14);
    const ICON_DOWNLOAD = icon('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>', 14);
    const ICON_ROTATE_LEFT = icon('<path d="M2.5 2v6h6"/><path d="M2.66 15.57a10 10 0 1 0 .57-8.38L2.5 8"/>', 14);
    const ICON_ROTATE_RIGHT = icon('<path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38L21.5 8"/>', 14);
    const ICON_CROP = icon('<path d="M6.13 1 6 16a2 2 0 0 0 2 2h15"/><path d="M1 6.13 16 6a2 2 0 0 1 2 2v15"/>', 14);
    const ICON_UP = icon('<polyline points="18 15 12 9 6 15"/>', 13);
    const ICON_DOWN = icon('<polyline points="6 9 12 15 18 9"/>', 13);
    const ICON_SKIP_START = icon('<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>', 14);
    const ICON_SKIP_END = icon('<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>', 14);
    const ICON_STEP_BACK = icon('<path d="M15 18l-6-6 6-6"/>', 14);
    const ICON_STEP_FORWARD = icon('<path d="M9 18l6-6-6-6"/>', 14);
    const ICON_ZOOM_IN = icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>', 14);
    const ICON_ZOOM_OUT = icon('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/><line x1="8" y1="11" x2="14" y2="11"/>', 14);
    const ICON_CHECK = icon('<polyline points="20 6 9 17 4 12"/>', 12);
    const ICON_FILM_SMALL = icon('<rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="2" y1="9" x2="7" y2="9"/><line x1="2" y1="15" x2="7" y2="15"/><line x1="17" y1="9" x2="22" y2="9"/><line x1="17" y1="15" x2="22" y2="15"/>', 11);

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
                    <div class="cam-badges-topleft">
                        <span class="cam-rec-badge" data-cam-field="rec-badge" hidden>${ICON_RECORD}REC</span>
                        <span class="cam-frames-badge" data-cam-field="frames-badge" hidden>${ICON_FILM_SMALL}<strong data-cam-field="frame-count">0</strong></span>
                    </div>
                    <div class="cam-overlay-bar">
                        <button type="button" class="cam-overlay-btn" data-cam-action="capture" title="${tr('captureLabel')}">${ICON_CAPTURE}<span>${tr('captureLabel')}</span></button>
                        <button type="button" class="cam-overlay-btn cam-overlay-btn-rec" data-cam-action="record" data-cam-recording="false" title="${tr('recordLabel')}">${ICON_RECORD}<span data-cam-field="record-label">${tr('recordLabel')}</span></button>
                        <button type="button" class="cam-overlay-btn" data-cam-action="pause" data-cam-paused="false" title="${tr('timelapsePauseLabel')}">${ICON_PAUSE}<span data-cam-field="pause-label">${tr('timelapseShortLabel')}</span></button>
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
    // Galería completa -- lightbox propio (no reutiliza el de
    // camera-viewer.js: ese vive dentro de su propia sección, este
    // widget puede montarse dentro de un modal de impresora que ya
    // tiene su propio z-index/backdrop).
    //
    // Gestor real de capturas/timelapse: visor grande + transporte,
    // panel de detalles/exportación, tira de miniaturas con selección
    // múltiple, editar (rotar/recortar), juntar (armar video desde una
    // selección manual y un orden elegido) y videos ya armados
    // (reproducir/descargar/borrar) -- todo sobre `galleryCamera`, la
    // MISMA cámara con la que se abrió el modal, nunca una "cámara
    // activa" global (ver comentario de resolveCamera()/cameraId más
    // arriba: camera.id siempre viene de una resolución real).
    // Sin argumento usa la cámara YA resuelta de esta instancia (botón
    // "Ver todas" de la tarjeta completa); con un cameraId explícito se
    // auto-resuelve, sin depender de que ESTA instancia particular haya
    // terminado de cargar esa cámara -- así el inspector de
    // camera-viewer.js puede llamar openCaptures(id) sobre una instancia
    // compacta que ya tiene montada (ver window.NopalCameraCard) sin
    // tener que crear una instancia nueva por cada apertura.
    async function openGallery(explicitCameraId, fallbackCamera, embedContainer) {
        let galleryCamera = fallbackCamera;
        if (explicitCameraId && fallbackCamera?.id !== explicitCameraId) {
            try {
                const result = await api('/api/cameras');
                galleryCamera = (result.cameras || []).find(c => c.id === explicitCameraId) || null;
            } catch (error) {
                toast(error.message, 'error');
                return;
            }
        }
        if (!galleryCamera) return;

        const state = {
            captures: [],
            videos: [],
            timelapseStats: {},
            activeKind: 'capture', // 'capture' | 'video'
            activeIndex: 0,
            activeVideoFilename: null,
            selection: new Set(),
            search: '',
            sortMode: 'date-desc', // 'date-desc' | 'date-asc' | 'name'
            groupByDay: false,
            mode: 'view', // 'view' | 'edit' | 'merge'
            editRotate: 0,
            editCrop: null, // {left,top,right,bottom} en px naturales de la imagen
            mergeOrder: [], // filenames, en el orden elegido
            exportFormat: 'mp4', // 'mp4' | 'gif' | 'zip'
            busy: false,
            playing: false,
            playTimer: null,
            zoom: 1,
        };

        // Embebido (embedContainer presente) -- se inserta directo en el
        // contenedor dado (ej. el tab Timelapse del inspector de
        // camera-viewer.js), sin backdrop ni botón de cerrar: ahí "cerrar"
        // es cambiar de pestaña/cámara, que ya llama a close() vía el
        // handle devuelto (ver stopTimelapseEmbed en camera-viewer.js).
        const embedded = !!embedContainer;
        const overlay = document.createElement('div');
        overlay.className = embedded ? 'cam-gallery-embed' : 'cam-gallery-overlay';
        overlay.innerHTML = `
            ${embedded ? '' : '<div class="cam-gallery-backdrop"></div>'}
            <div class="cam-gallery-dialog">
                <div class="cam-gallery-header">
                    <div class="cam-gallery-header-title">
                        ${ICON_CAMERA}
                        <strong>${esc(galleryCamera.name)} · ${esc(tr('capturesWord'))}</strong>
                    </div>
                    <label class="cam-gallery-search">${ICON_SEARCH}<input type="search" placeholder="${esc(tr('searchCapturesPlaceholder'))}" data-cam-gallery-search></label>
                    ${embedded ? '' : `<button type="button" class="cam-icon-btn" data-cam-gallery-close title="${esc(tr('closeLabel'))}">${ICON_CLOSE}</button>`}
                </div>
                <div class="cam-gallery-toolbar" data-cam-gallery-toolbar></div>
                <div class="cam-gallery-body">
                    <div class="cam-gallery-main">
                        <div class="cam-gallery-viewer" data-cam-gallery-viewer></div>
                        <div class="cam-gallery-transport" data-cam-gallery-transport></div>
                    </div>
                    <aside class="cam-gallery-sidebar" data-cam-gallery-sidebar></aside>
                </div>
                <div class="cam-gallery-filmbar" data-cam-gallery-filmbar></div>
                <div class="cam-gallery-filmstrip" data-cam-gallery-filmstrip></div>
            </div>`;
        if (embedded) {
            embedContainer.innerHTML = '';
            embedContainer.appendChild(overlay);
        } else {
            document.body.appendChild(overlay);
        }

        const stopPlayback = () => {
            if (state.playTimer) clearInterval(state.playTimer);
            state.playTimer = null;
            state.playing = false;
        };
        const close = () => { stopPlayback(); overlay.remove(); };
        if (!embedded) {
            overlay.querySelector('.cam-gallery-backdrop').addEventListener('click', close);
            overlay.querySelector('[data-cam-gallery-close]').addEventListener('click', close);
        }

        // ── Helpers de datos ──
        function visibleCaptures() {
            const query = state.search.trim().toLowerCase();
            let list = state.captures.filter(c => !query || c.filename.toLowerCase().includes(query) || formatClock(c.timestamp).toLowerCase().includes(query));
            list = [...list].sort((a, b) => {
                if (state.sortMode === 'name') return a.filename.localeCompare(b.filename);
                return state.sortMode === 'date-asc' ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
            });
            return list;
        }
        function activeCapture() {
            const list = visibleCaptures();
            return list[state.activeIndex] || null;
        }
        function activeVideo() {
            return state.videos.find(v => v.filename === state.activeVideoFilename) || null;
        }
        function captureUrl(filename) {
            return `/api/cameras/${encodeURIComponent(galleryCamera.id)}/captures/${encodeURIComponent(filename)}`;
        }
        function videoUrl(filename) {
            return `/api/cameras/${encodeURIComponent(galleryCamera.id)}/timelapse/videos/${encodeURIComponent(filename)}`;
        }
        function selectCapture(filename) {
            const list = visibleCaptures();
            const idx = list.findIndex(c => c.filename === filename);
            if (idx === -1) return;
            state.activeKind = 'capture';
            state.activeIndex = idx;
            state.mode = 'view';
            renderAll();
        }

        async function loadAll({ quiet = false } = {}) {
            try {
                const [capturesResult, videosResult, stats] = await Promise.all([
                    api(`/api/cameras/${galleryCamera.id}/captures`),
                    api(`/api/cameras/${galleryCamera.id}/timelapse/videos`),
                    // Stats trae el config YA fusionado con los defaults del
                    // backend (get_timelapse_stats/DEFAULT_TIMELAPSE_CONFIG)
                    // -- el objeto `camera` de /api/cameras trae
                    // timelapse_config crudo (a veces null/parcial), así que
                    // leer interval_s/fps de ahí directamente podía mostrar
                    // "--" aunque hubiera un intervalo real por default.
                    api(`/api/cameras/${galleryCamera.id}/timelapse/stats`),
                ]);
                state.captures = capturesResult.captures || [];
                state.videos = videosResult.videos || [];
                state.timelapseStats = stats || {};
                if (state.activeIndex >= visibleCaptures().length) state.activeIndex = Math.max(0, visibleCaptures().length - 1);
                for (const filename of [...state.selection]) {
                    if (!state.captures.some(c => c.filename === filename)) state.selection.delete(filename);
                }
            } catch (error) {
                if (!quiet) toast(error.message, 'error');
            }
            renderAll();
        }

        // ── Toolbar ──
        function renderToolbar() {
            const el = overlay.querySelector('[data-cam-gallery-toolbar]');
            const selCount = state.selection.size;
            const hasActive = state.activeKind === 'capture' && !!activeCapture();
            const canView = selCount <= 1 && hasActive;
            const canEdit = selCount <= 1 && (selCount === 1 ? true : hasActive) && !state.busy;
            const canSave = (hasActive || selCount > 0) && !state.busy;
            const canDelete = (hasActive || selCount > 0) && !state.busy;
            const canMerge = selCount >= 2 && !state.busy;
            const canAssemble = state.captures.length >= 2 && !state.busy;
            el.innerHTML = `
                <button type="button" class="cam-btn" data-cam-gallery-view ${canView ? '' : 'disabled'}>${ICON_EYE}<span>${esc(tr('viewBtn'))}</span></button>
                <button type="button" class="cam-btn" data-cam-gallery-save ${canSave ? '' : 'disabled'}>${ICON_DOWNLOAD}<span>${esc(tr('saveBtn'))}</span></button>
                <button type="button" class="cam-btn" data-cam-gallery-edit ${canEdit ? '' : 'disabled'}>${ICON_EDIT}<span>${esc(tr('editBtn'))}</span></button>
                <button type="button" class="cam-btn cam-btn-danger" data-cam-gallery-delete ${canDelete ? '' : 'disabled'}>${ICON_TRASH}<span>${esc(tr('deleteLabel'))}</span></button>
                <button type="button" class="cam-btn" data-cam-gallery-merge ${canMerge ? '' : 'disabled'}>${ICON_MERGE}<span>${esc(tr('mergeBtn'))}</span></button>
                <button type="button" class="cam-btn cam-btn-accent" data-cam-gallery-assemble ${canAssemble ? '' : 'disabled'}>${state.busy ? ICON_SPINNER : ICON_PLUS}<span>${state.busy ? esc(tr('assemblingLabel')) : esc(tr('assembleVideoBtn'))}</span></button>
            `;
        }

        // ── Visor + transporte ──
        function renderViewer() {
            const el = overlay.querySelector('[data-cam-gallery-viewer]');
            if (state.mode === 'merge') { renderMergePanel(el); return; }
            if (state.activeKind === 'video') {
                const video = activeVideo();
                if (!video) { el.innerHTML = `<p class="cam-empty">${esc(tr('noVideosYet'))}</p>`; return; }
                const isGif = video.kind === 'gif';
                el.innerHTML = `
                    <div class="cam-gallery-viewer-stage">
                        ${isGif
                            ? `<img class="cam-gallery-viewer-media" src="${esc(videoUrl(video.filename))}" alt="">`
                            : `<video class="cam-gallery-viewer-media" src="${esc(videoUrl(video.filename))}" controls autoplay></video>`}
                    </div>
                    <div class="cam-gallery-viewer-overlays">
                        <span class="cam-gallery-viewer-chip">${esc(video.filename)}</span>
                        <span class="cam-gallery-viewer-chip">${esc(formatBytes(video.size_bytes))}</span>
                    </div>`;
                return;
            }
            const capture = activeCapture();
            if (state.mode === 'edit' && capture) { renderEditPanel(el, capture); return; }
            if (!capture) {
                el.innerHTML = `<p class="cam-empty">${esc(tr('noCapturesYet'))}</p>`;
                return;
            }
            const list = visibleCaptures();
            el.innerHTML = `
                <div class="cam-gallery-viewer-stage">
                    <img class="cam-gallery-viewer-media" style="transform:scale(${state.zoom})" src="${esc(captureUrl(capture.filename))}" alt="" data-cam-gallery-active-img>
                </div>
                <div class="cam-gallery-viewer-overlays">
                    <span class="cam-gallery-viewer-chip" data-cam-gallery-res>--</span>
                    <span class="cam-gallery-viewer-chip">${esc(formatClock(capture.timestamp))}</span>
                    <span class="cam-gallery-viewer-chip cam-gallery-viewer-count">${state.activeIndex + 1} / ${list.length}</span>
                </div>`;
            const img = el.querySelector('[data-cam-gallery-active-img]');
            const resChip = el.querySelector('[data-cam-gallery-res]');
            img.addEventListener('load', () => { resChip.textContent = `${img.naturalWidth}×${img.naturalHeight}`; }, { once: true });
        }

        function renderEditPanel(el, capture) {
            el.innerHTML = `
                <div class="cam-gallery-edit-toolbar">
                    <button type="button" class="cam-mini-btn" data-cam-edit-rotate="-90">${ICON_ROTATE_LEFT}<span>${esc(tr('rotateBtn'))}</span></button>
                    <button type="button" class="cam-mini-btn" data-cam-edit-rotate="90">${ICON_ROTATE_RIGHT}<span>${esc(tr('rotateBtn'))}</span></button>
                    <button type="button" class="cam-mini-btn${state.editCrop ? ' active' : ''}" data-cam-edit-crop-toggle>${ICON_CROP}<span>${esc(tr('cropBtn'))}</span></button>
                </div>
                <div class="cam-gallery-viewer-stage cam-gallery-edit-stage">
                    <img class="cam-gallery-viewer-media" style="transform:rotate(${state.editRotate}deg)" src="${esc(captureUrl(capture.filename))}" alt="" data-cam-edit-img>
                    <div class="cam-gallery-crop-box" data-cam-edit-crop-box ${state.editCrop ? '' : 'hidden'}></div>
                </div>
                <div class="cam-gallery-edit-actions">
                    <button type="button" class="cam-btn" data-cam-edit-cancel>${esc(tr('cancelLabel'))}</button>
                    <button type="button" class="cam-btn cam-btn-accent" data-cam-edit-save-copy>${esc(tr('saveCopyBtn'))}</button>
                    <button type="button" class="cam-btn cam-btn-accent" data-cam-edit-save>${esc(tr('saveBtn'))}</button>
                </div>`;
            if (state.editCrop) setupCropBox(el, capture);
        }

        function setupCropBox(el, capture) {
            const img = el.querySelector('[data-cam-edit-img]');
            const box = el.querySelector('[data-cam-edit-crop-box]');
            const stage = el.querySelector('.cam-gallery-edit-stage');
            const applyBoxFromCrop = () => {
                if (!state.editCrop || !img.naturalWidth) return;
                const scaleX = img.clientWidth / img.naturalWidth;
                const scaleY = img.clientHeight / img.naturalHeight;
                box.style.left = `${state.editCrop.left * scaleX}px`;
                box.style.top = `${state.editCrop.top * scaleY}px`;
                box.style.width = `${(state.editCrop.right - state.editCrop.left) * scaleX}px`;
                box.style.height = `${(state.editCrop.bottom - state.editCrop.top) * scaleY}px`;
            };
            img.addEventListener('load', applyBoxFromCrop, { once: true });
            if (img.complete) applyBoxFromCrop();

            let dragStart = null;
            stage.addEventListener('pointerdown', event => {
                if (event.target !== img && event.target !== stage) return;
                const rect = img.getBoundingClientRect();
                dragStart = { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
                box.hidden = false;
            });
            stage.addEventListener('pointermove', event => {
                if (!dragStart) return;
                const x = Math.min(Math.max(0, event.clientX - dragStart.rect.left), dragStart.rect.width);
                const y = Math.min(Math.max(0, event.clientY - dragStart.rect.top), dragStart.rect.height);
                const left = Math.min(x, dragStart.x);
                const top = Math.min(y, dragStart.y);
                box.style.left = `${left}px`;
                box.style.top = `${top}px`;
                box.style.width = `${Math.abs(x - dragStart.x)}px`;
                box.style.height = `${Math.abs(y - dragStart.y)}px`;
            });
            const finishDrag = () => {
                if (!dragStart || !img.naturalWidth) { dragStart = null; return; }
                const scaleX = img.naturalWidth / img.clientWidth;
                const scaleY = img.naturalHeight / img.clientHeight;
                const left = parseFloat(box.style.left) || 0;
                const top = parseFloat(box.style.top) || 0;
                const width = parseFloat(box.style.width) || 0;
                const height = parseFloat(box.style.height) || 0;
                if (width > 4 && height > 4) {
                    state.editCrop = {
                        left: Math.round(left * scaleX), top: Math.round(top * scaleY),
                        right: Math.round((left + width) * scaleX), bottom: Math.round((top + height) * scaleY),
                    };
                }
                dragStart = null;
            };
            stage.addEventListener('pointerup', finishDrag);
            stage.addEventListener('pointerleave', finishDrag);
        }

        function renderMergePanel(el) {
            el.innerHTML = `
                <div class="cam-gallery-merge-panel">
                    <p class="cam-gallery-merge-hint">${esc(tr('mergeHint'))}</p>
                    <div class="cam-gallery-merge-list">
                        ${state.mergeOrder.map((filename, idx) => `
                            <div class="cam-gallery-merge-row">
                                <img src="${esc(captureUrl(filename))}" alt="" loading="lazy">
                                <span>${esc(filename)}</span>
                                <div class="cam-gallery-merge-row-actions">
                                    <button type="button" class="cam-icon-btn" data-cam-merge-up="${idx}" ${idx === 0 ? 'disabled' : ''}>${ICON_UP}</button>
                                    <button type="button" class="cam-icon-btn" data-cam-merge-down="${idx}" ${idx === state.mergeOrder.length - 1 ? 'disabled' : ''}>${ICON_DOWN}</button>
                                    <button type="button" class="cam-icon-btn" data-cam-merge-remove="${idx}">${ICON_CLOSE}</button>
                                </div>
                            </div>`).join('')}
                    </div>
                    <div class="cam-gallery-edit-actions">
                        <button type="button" class="cam-btn" data-cam-merge-cancel>${esc(tr('cancelLabel'))}</button>
                        <button type="button" class="cam-btn cam-btn-accent" data-cam-merge-generate ${state.mergeOrder.length >= 2 && !state.busy ? '' : 'disabled'}>${state.busy ? esc(tr('assemblingLabel')) : esc(tr('generateBtn'))}</button>
                    </div>
                </div>`;
        }

        function renderTransport() {
            const el = overlay.querySelector('[data-cam-gallery-transport]');
            if (state.mode !== 'view') { el.innerHTML = ''; return; }
            if (state.activeKind === 'video') { el.innerHTML = ''; return; }
            const list = visibleCaptures();
            const config = state.timelapseStats || {};
            el.innerHTML = `
                <div class="cam-gallery-transport-buttons">
                    <button type="button" class="cam-icon-btn" data-cam-transport="first" title="${esc(tr('firstFrameBtn'))}">${ICON_SKIP_START}</button>
                    <button type="button" class="cam-icon-btn" data-cam-transport="prev" title="${esc(tr('prevFrameBtn'))}">${ICON_STEP_BACK}</button>
                    <button type="button" class="cam-icon-btn cam-icon-btn-accent" data-cam-transport="playpause" title="${esc(tr('playBtn'))}">${state.playing ? ICON_PAUSE : ICON_PLAY}</button>
                    <button type="button" class="cam-icon-btn" data-cam-transport="next" title="${esc(tr('nextFrameBtn'))}">${ICON_STEP_FORWARD}</button>
                    <button type="button" class="cam-icon-btn" data-cam-transport="last" title="${esc(tr('lastFrameBtn'))}">${ICON_SKIP_END}</button>
                    <label class="cam-gallery-speed"><span>${esc(tr('speedLabel'))}</span>
                        <select data-cam-transport-speed>
                            <option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option><option value="4">4×</option>
                        </select>
                    </label>
                    <label class="cam-gallery-loop"><input type="checkbox" data-cam-transport-loop><span>${esc(tr('loopLabel'))}</span></label>
                    <button type="button" class="cam-icon-btn" data-cam-transport="zoom-out" title="${esc(tr('zoomOutBtn'))}">${ICON_ZOOM_OUT}</button>
                    <button type="button" class="cam-icon-btn" data-cam-transport="zoom-in" title="${esc(tr('zoomInBtn'))}">${ICON_ZOOM_IN}</button>
                    <button type="button" class="cam-icon-btn" data-cam-transport="fullscreen" title="${esc(tr('fullscreenLabel'))}">${ICON_FULLSCREEN}</button>
                </div>
                <div class="cam-gallery-timeline">
                    <input type="range" min="0" max="${Math.max(0, list.length - 1)}" value="${state.activeIndex}" data-cam-transport-scrub>
                    <span>${esc(tr('intervalLabel'))}: ${config.interval_s || '--'}s · ${esc(tr('fpsLabel'))} (${esc(tr('approxWord'))}): ${config.fps || '--'} · ${esc(tr('estimatedDurationLabel'))}: ${esc(formatDuration((config.interval_s || 0) * list.length))}</span>
                </div>`;
        }

        // ── Panel lateral ──
        function renderSidebar() {
            const el = overlay.querySelector('[data-cam-gallery-sidebar]');
            const capture = state.activeKind === 'capture' ? activeCapture() : null;
            const selCount = state.selection.size;
            const totalFrames = selCount > 0 ? selCount : state.captures.length;
            const config = state.timelapseStats || {};
            const avgBytes = state.captures.length
                ? state.captures.reduce((sum, c) => sum + (c.size_bytes || 0), 0) / state.captures.length
                : 0;
            el.innerHTML = `
                <div class="cam-gallery-sidebar-section">
                    <h3>${esc(tr('captureDetailsTitle'))}</h3>
                    <dl>
                        <div><dt>${esc(tr('cameraFieldLabel'))}</dt><dd>${esc(galleryCamera.name)}</dd></div>
                        <div><dt>${esc(tr('sourceLabelText')).replace(':', '')}</dt><dd>${esc(sourceLabel(galleryCamera))}</dd></div>
                        <div><dt>${esc(tr('resolutionFieldLabel'))}</dt><dd data-cam-gallery-sidebar-res>--</dd></div>
                        <div><dt>${esc(tr('dateFieldLabel'))}</dt><dd>${capture ? esc(formatClock(capture.timestamp)) : '--'}</dd></div>
                    </dl>
                </div>
                <div class="cam-gallery-sidebar-section">
                    <h3>${esc(tr('timelapseWord'))}</h3>
                    <dl>
                        <div><dt>${esc(tr('intervalLabel'))}</dt><dd>${config.interval_s ? `${config.interval_s}s` : '--'}</dd></div>
                        <div><dt>${esc(tr('selectedFramesLabel'))}</dt><dd>${totalFrames} ${esc(tr('ofWord'))} ${state.captures.length}</dd></div>
                        <div><dt>${esc(tr('estimatedDurationLabel'))}</dt><dd>${esc(formatDuration((config.interval_s || 0) * totalFrames))}</dd></div>
                        <div><dt>${esc(tr('estimatedSizeLabel'))}</dt><dd>${esc(formatBytes(avgBytes * totalFrames))}</dd></div>
                    </dl>
                </div>
                <div class="cam-gallery-sidebar-section">
                    <h3>${esc(tr('exportSectionTitle'))}</h3>
                    <p class="cam-gallery-sidebar-hint">${esc(tr('exportSectionHint'))}</p>
                    <div class="cam-gallery-export-options">
                        <label class="cam-gallery-export-option${state.exportFormat === 'mp4' ? ' active' : ''}"><input type="radio" name="cam-export-format" value="mp4" ${state.exportFormat === 'mp4' ? 'checked' : ''} data-cam-export-format><strong>MP4</strong><small>${esc(tr('videoRecommendedLabel'))}</small></label>
                        <label class="cam-gallery-export-option${state.exportFormat === 'gif' ? ' active' : ''}"><input type="radio" name="cam-export-format" value="gif" ${state.exportFormat === 'gif' ? 'checked' : ''} data-cam-export-format><strong>GIF</strong><small>${esc(tr('loopAnimationLabel'))}</small></label>
                        <label class="cam-gallery-export-option${state.exportFormat === 'zip' ? ' active' : ''}"><input type="radio" name="cam-export-format" value="zip" ${state.exportFormat === 'zip' ? 'checked' : ''} data-cam-export-format><strong>ZIP</strong><small>${esc(tr('allCapturesLabel'))}</small></label>
                    </div>
                    <button type="button" class="cam-btn cam-btn-accent cam-btn-block" data-cam-gallery-export ${state.busy ? 'disabled' : ''}>${ICON_PLAY}<span>${state.busy ? esc(tr('assemblingLabel')) : esc(tr('previewAndExportBtn'))}</span></button>
                </div>`;
            if (capture) {
                const img = new Image();
                img.onload = () => {
                    const target = el.querySelector('[data-cam-gallery-sidebar-res]');
                    if (target) target.textContent = `${img.naturalWidth}×${img.naturalHeight}`;
                };
                img.src = captureUrl(capture.filename);
            }
        }

        // ── Barra de selección de la tira ──
        function renderFilmbar() {
            const el = overlay.querySelector('[data-cam-gallery-filmbar]');
            const list = visibleCaptures();
            el.innerHTML = `
                <div class="cam-gallery-filmbar-left">
                    <button type="button" class="cam-link-btn" data-cam-gallery-select-all>${esc(tr('selectAllLabel'))} (${list.length})</button>
                    <button type="button" class="cam-link-btn" data-cam-gallery-deselect ${state.selection.size ? '' : 'disabled'}>${esc(tr('deselectLabel'))}</button>
                    <label class="cam-gallery-mini-select"><span>${esc(tr('sortLabel'))}</span>
                        <select data-cam-gallery-sort>
                            <option value="date-desc" ${state.sortMode === 'date-desc' ? 'selected' : ''}>${esc(tr('sortNewestLabel'))}</option>
                            <option value="date-asc" ${state.sortMode === 'date-asc' ? 'selected' : ''}>${esc(tr('sortOldestLabel'))}</option>
                            <option value="name" ${state.sortMode === 'name' ? 'selected' : ''}>${esc(tr('sortNameLabel'))}</option>
                        </select>
                    </label>
                    <label class="cam-gallery-mini-select"><input type="checkbox" data-cam-gallery-group ${state.groupByDay ? 'checked' : ''}><span>${esc(tr('groupByDayLabel'))}</span></label>
                </div>
                <div class="cam-gallery-filmbar-right">
                    <span>${state.selection.size ? esc(tr('selectedCountLabel', { count: state.selection.size, total: state.captures.length })) : esc(tr('totalCapturesLabel', { count: state.captures.length }))}</span>
                </div>`;
        }

        function renderFilmstrip() {
            const el = overlay.querySelector('[data-cam-gallery-filmstrip]');
            const list = visibleCaptures();
            let lastDay = null;
            const captureItems = list.map((c, idx) => {
                let dayMarker = '';
                if (state.groupByDay) {
                    const day = new Date(c.timestamp * 1000).toLocaleDateString();
                    if (day !== lastDay) { dayMarker = `<div class="cam-gallery-day-marker">${esc(day)}</div>`; lastDay = day; }
                }
                const isActive = state.activeKind === 'capture' && idx === state.activeIndex && state.mode !== 'merge';
                const isSelected = state.selection.has(c.filename);
                return `${dayMarker}<div class="cam-gallery-thumb${isActive ? ' active' : ''}${isSelected ? ' selected' : ''}" data-cam-gallery-thumb="${esc(c.filename)}">
                    <label class="cam-gallery-thumb-check" data-cam-gallery-thumb-check-wrap><input type="checkbox" ${isSelected ? 'checked' : ''} data-cam-gallery-thumb-check="${esc(c.filename)}"></label>
                    <img src="${esc(captureUrl(c.filename))}" alt="" loading="lazy">
                    <span>${esc(formatClock(c.timestamp))}</span>
                    ${isActive ? `<span class="cam-gallery-thumb-current">${ICON_CHECK}</span>` : ''}
                </div>`;
            }).join('') || `<p class="cam-empty">${esc(tr('noCapturesYet'))}</p>`;

            const videoItems = state.videos.length ? `
                <div class="cam-gallery-videos-row">
                    <span class="cam-gallery-videos-label">${esc(tr('assembledVideosTitle'))}</span>
                    ${state.videos.map(v => `
                        <div class="cam-gallery-video-chip${state.activeKind === 'video' && state.activeVideoFilename === v.filename ? ' active' : ''}" data-cam-gallery-video="${esc(v.filename)}">
                            <span>${ICON_PLAY}</span>
                            <span>${esc(v.filename)}</span>
                            <span class="cam-gallery-video-chip-actions">
                                <a href="${esc(videoUrl(v.filename))}" download title="${esc(tr('saveBtn'))}" data-cam-gallery-stop-propagation>${ICON_DOWNLOAD}</a>
                                <button type="button" data-cam-gallery-video-delete="${esc(v.filename)}" title="${esc(tr('deleteLabel'))}">${ICON_TRASH}</button>
                            </span>
                        </div>`).join('')}
                </div>` : '';

            el.innerHTML = `<div class="cam-gallery-filmstrip-row">${captureItems}</div>${videoItems}`;
        }

        function renderAll() {
            renderToolbar();
            renderViewer();
            renderTransport();
            renderSidebar();
            renderFilmbar();
            renderFilmstrip();
        }

        // ── Acciones ──
        async function doDelete() {
            const targets = state.selection.size ? [...state.selection] : (activeCapture() ? [activeCapture().filename] : []);
            if (!targets.length) return;
            const confirmMsg = targets.length > 1 ? tr('deleteSelectedConfirm', { count: targets.length }) : tr('deleteConfirmShort');
            if (!window.confirm(confirmMsg)) return;
            try {
                await Promise.all(targets.map(filename => api(`/api/cameras/${galleryCamera.id}/captures/${encodeURIComponent(filename)}`, { method: 'DELETE' })));
                state.selection.clear();
                await loadAll({ quiet: true });
            } catch (error) {
                toast(error.message, 'error');
            }
        }

        async function doSave() {
            if (state.selection.size > 0) {
                const names = [...state.selection];
                const url = `/api/cameras/${galleryCamera.id}/captures/zip`;
                const response = await fetch(url, { method: 'POST', body: new URLSearchParams({ filenames: names.join(',') }) });
                if (!response.ok) { toast(tr('operationCouldNotComplete'), 'error'); return; }
                const blob = await response.blob();
                triggerDownload(blob, `capturas_${galleryCamera.id}.zip`);
                return;
            }
            if (state.activeKind === 'video') {
                const video = activeVideo();
                if (video) window.open(videoUrl(video.filename), '_blank');
                return;
            }
            const capture = activeCapture();
            if (!capture) return;
            window.open(captureUrl(capture.filename), '_blank');
        }

        function triggerDownload(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
        }

        async function doAssemble(filenames) {
            state.busy = true; renderAll();
            try {
                const endpoint = state.exportFormat === 'gif' ? 'assemble-gif' : 'assemble';
                const body = filenames && filenames.length ? new URLSearchParams({ filenames: filenames.join(',') }) : undefined;
                const result = await api(`/api/cameras/${galleryCamera.id}/timelapse/${endpoint}`, { method: 'POST', body });
                toast(tr('videoAssembled', { filename: result.filename }));
                state.mode = 'view';
                state.selection.clear();
                await loadAll({ quiet: true });
                state.activeKind = 'video';
                state.activeVideoFilename = result.filename;
            } catch (error) {
                toast(error.message, 'error');
            } finally {
                state.busy = false;
                renderAll();
            }
        }

        async function doExport() {
            if (state.exportFormat === 'zip') {
                // Sin selección = ZIP de TODAS las capturas (rótulo del
                // panel: "ZIP: Todas las capturas") -- con selección, solo
                // esas, mismo criterio que el botón "Guardar".
                const names = state.selection.size ? [...state.selection] : state.captures.map(c => c.filename);
                if (!names.length) return;
                try {
                    const response = await fetch(`/api/cameras/${galleryCamera.id}/captures/zip`, {
                        method: 'POST', body: new URLSearchParams({ filenames: names.join(',') }),
                    });
                    if (!response.ok) { toast(tr('operationCouldNotComplete'), 'error'); return; }
                    triggerDownload(await response.blob(), `capturas_${galleryCamera.id}.zip`);
                } catch (error) {
                    toast(error.message, 'error');
                }
                return;
            }
            const filenames = state.selection.size ? [...state.selection] : null;
            await doAssemble(filenames);
        }

        async function doEditSave(saveAsCopy) {
            const capture = activeCapture();
            if (!capture) return;
            const rotate = ((state.editRotate % 360) + 360) % 360;
            const form = new URLSearchParams({ rotate: String(rotate), save_as_copy: String(!!saveAsCopy) });
            if (state.editCrop) {
                form.set('crop_left', String(state.editCrop.left));
                form.set('crop_top', String(state.editCrop.top));
                form.set('crop_right', String(state.editCrop.right));
                form.set('crop_bottom', String(state.editCrop.bottom));
            }
            try {
                const result = await api(`/api/cameras/${galleryCamera.id}/captures/${encodeURIComponent(capture.filename)}/edit`, { method: 'POST', body: form });
                state.mode = 'view';
                state.editRotate = 0;
                state.editCrop = null;
                await loadAll({ quiet: true });
                selectCapture(result.filename);
                toast(tr('editSaved'));
            } catch (error) {
                toast(error.message, 'error');
            }
        }

        // ── Delegación de eventos (un solo listener, todo el estado se
        // re-deriva en cada render en vez de mutar el DOM a mano) ──
        overlay.addEventListener('click', async event => {
            if (event.target.closest('[data-cam-gallery-stop-propagation]')) return;

            if (event.target.closest('[data-cam-gallery-view]')) { state.mode = 'view'; renderAll(); return; }
            if (event.target.closest('[data-cam-gallery-save]')) { await doSave(); return; }
            if (event.target.closest('[data-cam-gallery-edit]')) {
                if (state.selection.size === 1) selectCapture([...state.selection][0]);
                state.mode = 'edit'; state.editRotate = 0; state.editCrop = null; renderAll(); return;
            }
            if (event.target.closest('[data-cam-gallery-delete]')) { await doDelete(); return; }
            if (event.target.closest('[data-cam-gallery-merge]')) {
                state.mergeOrder = state.captures
                    .filter(c => state.selection.has(c.filename))
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map(c => c.filename);
                state.mode = 'merge'; renderAll(); return;
            }
            if (event.target.closest('[data-cam-gallery-assemble]')) { await doAssemble(state.selection.size ? [...state.selection] : null); return; }
            if (event.target.closest('[data-cam-gallery-export]')) { await doExport(); return; }

            const thumb = event.target.closest('[data-cam-gallery-thumb]');
            if (thumb && !event.target.closest('[data-cam-gallery-thumb-check-wrap]')) {
                if (event.ctrlKey || event.metaKey) {
                    const filename = thumb.dataset.camGalleryThumb;
                    state.selection.has(filename) ? state.selection.delete(filename) : state.selection.add(filename);
                    renderAll();
                } else {
                    stopPlayback();
                    selectCapture(thumb.dataset.camGalleryThumb);
                }
                return;
            }
            const videoChip = event.target.closest('[data-cam-gallery-video]');
            if (videoChip) { state.activeKind = 'video'; state.activeVideoFilename = videoChip.dataset.camGalleryVideo; state.mode = 'view'; renderAll(); return; }
            const videoDelete = event.target.closest('[data-cam-gallery-video-delete]');
            if (videoDelete) {
                const filename = videoDelete.dataset.camGalleryVideoDelete;
                if (window.confirm(tr('deleteConfirmShort'))) {
                    try {
                        await api(`/api/cameras/${galleryCamera.id}/timelapse/videos/${encodeURIComponent(filename)}`, { method: 'DELETE' });
                        if (state.activeVideoFilename === filename) { state.activeKind = 'capture'; state.activeVideoFilename = null; }
                        await loadAll({ quiet: true });
                    } catch (error) { toast(error.message, 'error'); }
                }
                return;
            }

            if (event.target.closest('[data-cam-gallery-select-all]')) { visibleCaptures().forEach(c => state.selection.add(c.filename)); renderAll(); return; }
            if (event.target.closest('[data-cam-gallery-deselect]')) { state.selection.clear(); renderAll(); return; }

            // Transporte
            const transportBtn = event.target.closest('[data-cam-transport]');
            if (transportBtn) {
                const list = visibleCaptures();
                const action = transportBtn.dataset.camTransport;
                if (action === 'first') { state.activeIndex = 0; renderAll(); }
                else if (action === 'last') { state.activeIndex = Math.max(0, list.length - 1); renderAll(); }
                else if (action === 'prev') { state.activeIndex = Math.max(0, state.activeIndex - 1); renderAll(); }
                else if (action === 'next') { state.activeIndex = Math.min(list.length - 1, state.activeIndex + 1); renderAll(); }
                else if (action === 'zoom-in') { state.zoom = Math.min(3, state.zoom + 0.25); renderViewer(); }
                else if (action === 'zoom-out') { state.zoom = Math.max(0.5, state.zoom - 0.25); renderViewer(); }
                else if (action === 'fullscreen') {
                    try { await (overlay.querySelector('.cam-gallery-dialog').requestFullscreen?.()); }
                    catch (error) { toast(tr('fullscreenNotAllowed'), 'error'); }
                } else if (action === 'playpause') {
                    if (state.playing) { stopPlayback(); renderTransport(); }
                    else {
                        state.playing = true;
                        const speedSel = overlay.querySelector('[data-cam-transport-speed]');
                        const loopChk = overlay.querySelector('[data-cam-transport-loop]');
                        const speed = Number(speedSel?.value || 1);
                        const config = state.timelapseStats || {};
                        const fps = Math.max(1, config.fps || 8);
                        state.playTimer = setInterval(() => {
                            const items = visibleCaptures();
                            if (state.activeIndex >= items.length - 1) {
                                if (loopChk?.checked) state.activeIndex = 0;
                                else { stopPlayback(); renderAll(); return; }
                            } else state.activeIndex += 1;
                            renderAll();
                        }, 1000 / (fps * speed));
                        renderTransport();
                    }
                }
                return;
            }

            // Editar
            const rotateBtn = event.target.closest('[data-cam-edit-rotate]');
            if (rotateBtn) { state.editRotate += Number(rotateBtn.dataset.camEditRotate); renderViewer(); return; }
            if (event.target.closest('[data-cam-edit-crop-toggle]')) {
                if (state.editCrop) state.editCrop = null;
                else state.editCrop = { left: 0, top: 0, right: 100, bottom: 100 };
                renderViewer(); return;
            }
            if (event.target.closest('[data-cam-edit-cancel]')) { state.mode = 'view'; state.editRotate = 0; state.editCrop = null; renderAll(); return; }
            if (event.target.closest('[data-cam-edit-save]')) { await doEditSave(false); return; }
            if (event.target.closest('[data-cam-edit-save-copy]')) { await doEditSave(true); return; }

            // Juntar
            const mergeUp = event.target.closest('[data-cam-merge-up]');
            if (mergeUp) {
                const idx = Number(mergeUp.dataset.camMergeUp);
                if (idx > 0) [state.mergeOrder[idx - 1], state.mergeOrder[idx]] = [state.mergeOrder[idx], state.mergeOrder[idx - 1]];
                renderViewer(); return;
            }
            const mergeDown = event.target.closest('[data-cam-merge-down]');
            if (mergeDown) {
                const idx = Number(mergeDown.dataset.camMergeDown);
                if (idx < state.mergeOrder.length - 1) [state.mergeOrder[idx + 1], state.mergeOrder[idx]] = [state.mergeOrder[idx], state.mergeOrder[idx + 1]];
                renderViewer(); return;
            }
            const mergeRemove = event.target.closest('[data-cam-merge-remove]');
            if (mergeRemove) { state.mergeOrder.splice(Number(mergeRemove.dataset.camMergeRemove), 1); renderViewer(); return; }
            if (event.target.closest('[data-cam-merge-cancel]')) { state.mode = 'view'; renderAll(); return; }
            if (event.target.closest('[data-cam-merge-generate]')) { await doAssemble(state.mergeOrder); return; }
        });

        overlay.addEventListener('change', event => {
            if (event.target.matches('[data-cam-gallery-thumb-check]')) {
                const filename = event.target.dataset.camGalleryThumbCheck;
                event.target.checked ? state.selection.add(filename) : state.selection.delete(filename);
                renderAll();
                return;
            }
            if (event.target.matches('[data-cam-gallery-sort]')) { state.sortMode = event.target.value; renderAll(); return; }
            if (event.target.matches('[data-cam-gallery-group]')) { state.groupByDay = event.target.checked; renderFilmstrip(); return; }
            if (event.target.matches('[data-cam-export-format]')) { state.exportFormat = event.target.value; renderSidebar(); return; }
            if (event.target.matches('[data-cam-transport-scrub]')) { state.activeIndex = Number(event.target.value); renderAll(); return; }
        });

        overlay.querySelector('[data-cam-gallery-search]').addEventListener('input', event => {
            state.search = event.target.value;
            state.activeIndex = 0;
            renderFilmbar(); renderFilmstrip(); renderViewer(); renderTransport();
        });

        renderAll();
        await loadAll();
        return { close };
    }


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
                    // Sin esto el botón deshabilitado seguía diciendo
                    // "Pausar timelapse" -- nada le explicaba a quien lo ve
                    // por qué no reacciona (el timelapse de esta cámara ni
                    // siquiera está activado, eso se hace desde Cámaras >
                    // Configuración, no acá).
                    pauseBtn.dataset.camPaused = stats.paused ? 'true' : 'false';
                    const pauseLabel = stats.paused ? tr('resumeLabel') : tr('pauseLabel');
                    pauseBtn.title = stats.enabled ? pauseLabel : tr('timelapseNotEnabledHint');
                    pauseBtn.innerHTML = stats.paused ? `${ICON_PLAY}<span data-cam-field="pause-label">${pauseLabel}</span>` : `${ICON_PAUSE}<span data-cam-field="pause-label">${pauseLabel}</span>`;
                }
                const recordBtn = cardEl.querySelector('[data-cam-action="record"]');
                if (recordBtn) {
                    recordBtn.dataset.camRecording = stats.recording ? 'true' : 'false';
                    recordBtn.innerHTML = stats.recording ? `${ICON_STOP}<span data-cam-field="record-label">${tr('stopLabel')}</span>` : `${ICON_RECORD}<span data-cam-field="record-label">${tr('recordLabel')}</span>`;
                }
                // Insignias visibles siempre (no solo en el botón): "grabando
                // ahora" y el conteo de fotogramas del timelapse, para que se
                // note sin tener que leer el estado de un botón chico.
                const recBadge = field('rec-badge');
                if (recBadge) recBadge.hidden = !stats.recording;
                const framesBadge = field('frames-badge');
                if (framesBadge) framesBadge.hidden = !stats.enabled;
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
                        openGallery(null, camera);
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
            if (cardEl) {
                bindEvents(cardEl);
                // Antes esto (y el refreshStats() de más abajo, y el del
                // poll en start()) solo corrían `if (!compact)` -- la
                // tarjeta compacta (la que se monta en TODAS las fichas del
                // dashboard) nunca actualizaba su botón de pausa/reanudar ni
                // mostraba fotogramas: quedaba congelada en el estado inicial
                // ("Pausar timelapse" fijo) hasta que alguien lo tocara, sin
                // forma de saber si en verdad estaba grabando.
                await refreshStats();
                if (!compact) {
                    await loadFocusSupport(cardEl);
                    if (camera.bound_device) {
                        const name = await resolveBoundDeviceName(camera.bound_device);
                        const field = cardEl.querySelector('[data-cam-field="bound-device"]');
                        if (field) field.textContent = name || camera.bound_device.id;
                    }
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
                } else {
                    await refreshStats();
                }
            }, POLL_INTERVAL_MS);
        }

        function stop() {
            destroyed = true;
            if (pollTimer) clearInterval(pollTimer);
            pollTimer = null;
        }

        return { start, stop, render, openCaptures: (id) => openGallery(id, camera) };
    }

    const instancesByContainer = new WeakMap();
    // Este componente se monta varias veces a la vez (una por cada ficha de
    // máquina con cámara vinculada) -- un WeakMap no se puede recorrer, así
    // que se necesita este Set aparte solo para poder avisarles a todas las
    // instancias vivas cuando cambia el idioma (ver el listener abajo).
    const activeInstances = new Set();

    function mount(container, opts) {
        if (!container) return null;
        unmount(container);
        const instance = createInstance(container, opts);
        instancesByContainer.set(container, instance);
        activeInstances.add(instance);
        instance.start();
        return instance;
    }

    function unmount(container) {
        if (!container) return;
        const existing = instancesByContainer.get(container);
        if (existing) {
            existing.stop();
            instancesByContainer.delete(container);
            activeInstances.delete(existing);
        }
    }

    // NOPAL core dispara este evento al cambiar de idioma (ver setLanguage()
    // en translations.js) -- sin esto, cada cámara ya montada dentro de una
    // ficha se quedaba en el idioma con el que se montó hasta que esa ficha
    // se volvía a dibujar por otro motivo (issue #50).
    window.addEventListener('nopal:language-changed', () => {
        activeInstances.forEach(instance => instance.render());
    });

    // Standalone -- no depende de que haya una instancia montada (el
    // inspector de camera-viewer.js la llama desde cualquier pestaña,
    // incluidas Capturas/Timelapse donde no hay preview en vivo montado).
    window.NopalCameraCard = { mount, unmount, openCaptures: (cameraId, embedContainer) => openGallery(cameraId, null, embedContainer) };
})();
