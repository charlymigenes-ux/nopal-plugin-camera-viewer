(() => {
    const PLUGIN_ID = 'camera-viewer';
    const PLUGIN_VERSION = '1.4.0';
    if (window.NopalPluginRegistry?.[PLUGIN_ID]) return;

    const I18N = {
        es: {
            operationCouldNotComplete: 'La operación no se pudo completar.',
            cameraAdded: '{name}: cámara agregada.',
            connectingLabel: 'Conectando…', searchingPortLabel: 'Buscando puerto…',
            onvifNeedHostOrUrl: 'Indicá la IP de la cámara o la URL completa del servicio ONVIF.',
            confirmRemoveCamera: '¿Eliminar "{name}"? Solo se quita del registro de NOPAL, la cámara y su stream no se ven afectados.',
            removeCameraTitle: 'Eliminar cámara',
            brandBambu: 'Bambu Lab', brandElegoo: 'Elegoo', brandFlashforge: 'FlashForge', brandMarlin: 'Marlin',
            brandKlipper: 'Klipper', brandLaserCnc: 'Láser/CNC', brandCnc: 'CNC', brandLaser: 'Láser',
            searchingWebcams: 'Buscando webcams conectadas…',
            noWebcamDetected: 'No se detectó ninguna webcam USB. Conectala y tocá "Buscar de nuevo".',
            alreadyRegisteredBadge: 'Ya registrada',
            whatDeviceToFilm: '¿Qué dispositivo vas a filmar?',
            loadingDevicesOption: 'Cargando dispositivos…', chooseDeviceOption: 'Elegí un dispositivo',
            timelapseNotImplementedHint: 'La captura automática de frames durante la impresión y el armado del video todavía no están implementados -- por ahora esto solo guarda la asociación para cuando esa función esté lista.',
            whatWillYouUseItFor: '¿Para qué la vas a usar?', exampleWatchWorkshop: 'Ej. vigilar el taller',
            nameLabel: 'Nombre',
            purposeMonitoring: 'Monitoreo general', purposeMonitoringDesc: 'Supervisión en tiempo real',
            purposeTimelapse: 'Timelapse de un dispositivo', purposeTimelapseDesc: 'Captura en intervalos',
            purposeOther: 'Otra función', purposeOtherDesc: 'Uso personalizado',
            whatForUpper: '¿PARA QUÉ LA VAS A USAR?', whatDeviceUpper: '¿QUÉ DISPOSITIVO VAS A FILMAR?',
            intervalSecondsUpper: 'INTERVALO (SEGUNDOS)', timeBetweenCaptures: 'Tiempo entre cada captura.',
            fpsFinalVideoUpper: 'FPS DEL VIDEO FINAL', framesPerSecondHint: 'Cuadros por segundo del video generado.',
            infoUpper: 'INFORMACIÓN',
            timelapseInfoText: 'El timelapse capturará imágenes a intervalos definidos y generará un video con la velocidad seleccionada.',
            cameraUpdated: '{name}: cámara actualizada.',
            loadingEllipsis: 'Cargando…', noCamerasYet: 'Todavía no agregaste ninguna cámara.',
            pageTitle: 'Cámaras', layout1PerRow: '1 por fila', layout2PerRow: '2 por fila', layout3PerRow: '3 por fila',
            addCameraBtn: 'Agregar cámara', addCameraTitle: 'Agregar cámara',
            addCameraHint: 'Un stream MJPEG directo, o resolvela sola por ONVIF (recomendado si tu cámara lo soporta: no hace falta saber el formato de URL RTSP).',
            tabUrlDirect: 'URL directa', tabOnvif: 'ONVIF', tabUsb: 'USB',
            streamUrlLabel: 'URL del stream',
            streamUrlPlaceholder: 'http://192.168.1.50:8080/stream  o  rtsp://usuario:clave@192.168.1.50:554/...',
            exampleCameraBed: 'Ej. Cámara cama',
            cancelBtn: 'Cancelar', addBtn: 'Agregar',
            cameraIpLabel: 'IP de la cámara', onvifPortLabel: 'Puerto ONVIF',
            onvifPortHint: '(opcional: si no lo sabés, lo buscamos solos)',
            autoDetectPlaceholder: 'Dejalo vacío para autodetectar',
            onvifOrDivider: '— o, si tu cámara no usa el path estándar —',
            onvifFullUrlLabel: 'URL completa del servicio ONVIF', onvifFullUrlHint: '(reemplaza IP + puerto)',
            usernameLabel: 'Usuario', passwordLabel: 'Contraseña', connectBtn: 'Conectar',
            webcamsDetected: 'Webcams detectadas', searchAgainTitle: 'Buscar de nuevo',
            configureCameraTitle: 'Configurar cámara', configureCameraSubtitle: 'Define el propósito y la captura de tu cámara.',
            cameraNameUpper: 'NOMBRE DE LA CÁMARA', nameHelpsIdentify: 'Este nombre te ayudará a identificarla fácilmente.',
            deleteCameraLabel: 'Eliminar cámara', saveBtn: 'Guardar',
            searchCameraPlaceholder: 'Buscar cámara...',
            statusAllOption: 'Estado: Todas', statusOnlineOption: 'En línea', statusOfflineOption: 'Desconectadas', statusDisabledOption: 'Deshabilitadas',
            sourceAllOption: 'Tipo: Todas', sourceUsbOption: 'USB', sourceRtspOption: 'RTSP', sourceHttpOption: 'HTTP',
            camerasCountLabel: '{count} cámaras', cameraCountLabel: '1 cámara',
            noCamerasRegistered: 'No hay cámaras registradas', addFirstCameraBtn: 'Agregar primera cámara',
            selectCameraHint: 'Seleccioná una cámara de la lista para administrarla.',
            viewBtn: 'Ver', editBtn: 'Editar', duplicateBtn: 'Duplicar', deleteBtn: 'Eliminar', downloadBtn: 'Descargar',
            tabGeneral: 'General', tabTimelapse: 'Timelapse', backToListLabel: 'Volver a la lista',
            typeFieldLabel: 'Tipo / Fuente',
            statusFieldLabel: 'Estado',
            statsTitle: 'Estadísticas', capturesStatLabel: 'Capturas', timelapsesStatLabel: 'Timelapses', storageStatLabel: 'Almacenamiento',
            savedTimelapsesTitle: 'Timelapses guardados', noVideosYetShort: 'Sin timelapses guardados todavía.',
            confirmDeleteVideo: '¿Borrar "{name}"? Esta acción no se puede deshacer.',
            cameraActiveTitle: 'Cámara activa', cameraActiveHint: 'Permite capturar y grabar desde esta cámara.',
            timelapseActiveTitle: 'Timelapse activo', timelapseActiveHint: 'Empieza a capturar fotogramas con el intervalo configurado abajo.',
            timelapseStateActive: 'Capturando', timelapseStatePaused: 'Pausado', timelapseStateOff: 'Inactivo',
            pauseTimelapseBtn: 'Pausar', resumeTimelapseBtn: 'Reanudar',
            timelapseOffHint: 'El timelapse de esta cámara está apagado.', goToGeneralBtn: 'Activarlo en General',
            testConnectionBtn: 'Probar conexión', testingConnectionLabel: 'Probando…',
            testConnectionOnline: 'Conectada correctamente.', testConnectionOffline: 'No se pudo conectar con la fuente.',
            saveChangesBtn: 'Guardar cambios', unsavedChangesConfirm: 'Hay cambios sin guardar en esta cámara. ¿Descartarlos y continuar?',
            duplicateNamePrompt: 'Nombre para la copia:', duplicateSuffix: ' (copia)',
            deleteCameraConfirmTitle: 'Eliminar {name}',
            deleteCameraConfirmBody: 'Esta cámara tiene {captures} capturas, {timelapses} timelapses y {storage} de almacenamiento.',
            deleteCameraOnlyBtn: 'Eliminar cámara', deleteCameraWithFilesBtn: 'Eliminar cámara y sus archivos',
            cameraDeleted: '{name}: cámara eliminada.',
            unboundLabel: 'Sin vincular', removeBindingBtn: 'Quitar vínculo',
            usbTypeLabel: 'USB', rtspTypeLabel: 'RTSP', httpTypeLabel: 'HTTP',
        },
        en: {
            operationCouldNotComplete: 'The operation could not be completed.',
            cameraAdded: '{name}: camera added.',
            connectingLabel: 'Connecting…', searchingPortLabel: 'Searching for port…',
            onvifNeedHostOrUrl: 'Enter the camera IP or the full ONVIF service URL.',
            confirmRemoveCamera: 'Delete "{name}"? This only removes it from the NOPAL registry, the camera and its stream are not affected.',
            removeCameraTitle: 'Delete camera',
            brandBambu: 'Bambu Lab', brandElegoo: 'Elegoo', brandFlashforge: 'FlashForge', brandMarlin: 'Marlin',
            brandKlipper: 'Klipper', brandLaserCnc: 'Laser/CNC', brandCnc: 'CNC', brandLaser: 'Laser',
            searchingWebcams: 'Searching for connected webcams…',
            noWebcamDetected: 'No USB webcam was detected. Connect it and tap "Search again".',
            alreadyRegisteredBadge: 'Already registered',
            whatDeviceToFilm: 'Which device are you going to film?',
            loadingDevicesOption: 'Loading devices…', chooseDeviceOption: 'Choose a device',
            timelapseNotImplementedHint: 'Automatic frame capture during printing and video assembly are not implemented yet -- for now this only saves the association for when that feature is ready.',
            whatWillYouUseItFor: 'What will you use it for?', exampleWatchWorkshop: 'E.g. watch the workshop',
            nameLabel: 'Name',
            purposeMonitoring: 'General monitoring', purposeMonitoringDesc: 'Real-time monitoring',
            purposeTimelapse: 'Timelapse of a device', purposeTimelapseDesc: 'Interval capture',
            purposeOther: 'Other purpose', purposeOtherDesc: 'Custom use',
            whatForUpper: 'WHAT WILL YOU USE IT FOR?', whatDeviceUpper: 'WHICH DEVICE ARE YOU GOING TO FILM?',
            intervalSecondsUpper: 'INTERVAL (SECONDS)', timeBetweenCaptures: 'Time between each capture.',
            fpsFinalVideoUpper: 'FINAL VIDEO FPS', framesPerSecondHint: 'Frames per second of the generated video.',
            infoUpper: 'INFORMATION',
            timelapseInfoText: 'The timelapse will capture images at set intervals and generate a video at the selected speed.',
            cameraUpdated: '{name}: camera updated.',
            loadingEllipsis: 'Loading…', noCamerasYet: "You haven't added any camera yet.",
            pageTitle: 'Cameras', layout1PerRow: '1 per row', layout2PerRow: '2 per row', layout3PerRow: '3 per row',
            addCameraBtn: 'Add camera', addCameraTitle: 'Add camera',
            addCameraHint: 'A direct MJPEG stream, or resolve it automatically via ONVIF (recommended if your camera supports it: no need to know the RTSP URL format).',
            tabUrlDirect: 'Direct URL', tabOnvif: 'ONVIF', tabUsb: 'USB',
            streamUrlLabel: 'Stream URL',
            streamUrlPlaceholder: 'http://192.168.1.50:8080/stream  or  rtsp://user:password@192.168.1.50:554/...',
            exampleCameraBed: 'E.g. Bed camera',
            cancelBtn: 'Cancel', addBtn: 'Add',
            cameraIpLabel: 'Camera IP', onvifPortLabel: 'ONVIF port',
            onvifPortHint: "(optional: if you don't know it, we'll look for it)",
            autoDetectPlaceholder: 'Leave empty to auto-detect',
            onvifOrDivider: '— or, if your camera does not use the standard path —',
            onvifFullUrlLabel: 'Full ONVIF service URL', onvifFullUrlHint: '(replaces IP + port)',
            usernameLabel: 'Username', passwordLabel: 'Password', connectBtn: 'Connect',
            webcamsDetected: 'Webcams detected', searchAgainTitle: 'Search again',
            configureCameraTitle: 'Configure camera', configureCameraSubtitle: 'Define the purpose and capture settings of your camera.',
            cameraNameUpper: 'CAMERA NAME', nameHelpsIdentify: 'This name will help you identify it easily.',
            deleteCameraLabel: 'Delete camera', saveBtn: 'Save',
            searchCameraPlaceholder: 'Search camera...',
            statusAllOption: 'Status: All', statusOnlineOption: 'Online', statusOfflineOption: 'Offline', statusDisabledOption: 'Disabled',
            sourceAllOption: 'Type: All', sourceUsbOption: 'USB', sourceRtspOption: 'RTSP', sourceHttpOption: 'HTTP',
            camerasCountLabel: '{count} cameras', cameraCountLabel: '1 camera',
            noCamerasRegistered: 'No cameras registered', addFirstCameraBtn: 'Add first camera',
            selectCameraHint: 'Select a camera from the list to manage it.',
            viewBtn: 'View', editBtn: 'Edit', duplicateBtn: 'Duplicate', deleteBtn: 'Delete', downloadBtn: 'Download',
            tabGeneral: 'General', tabTimelapse: 'Timelapse', backToListLabel: 'Back to list',
            typeFieldLabel: 'Type / Source',
            statusFieldLabel: 'Status',
            statsTitle: 'Statistics', capturesStatLabel: 'Captures', timelapsesStatLabel: 'Timelapses', storageStatLabel: 'Storage',
            savedTimelapsesTitle: 'Saved timelapses', noVideosYetShort: 'No timelapses saved yet.',
            confirmDeleteVideo: 'Delete "{name}"? This cannot be undone.',
            cameraActiveTitle: 'Camera active', cameraActiveHint: 'Allows capturing and recording from this camera.',
            timelapseActiveTitle: 'Timelapse active', timelapseActiveHint: 'Starts capturing frames at the interval configured below.',
            timelapseStateActive: 'Capturing', timelapseStatePaused: 'Paused', timelapseStateOff: 'Off',
            pauseTimelapseBtn: 'Pause', resumeTimelapseBtn: 'Resume',
            timelapseOffHint: 'This camera\'s timelapse is off.', goToGeneralBtn: 'Turn it on in General',
            testConnectionBtn: 'Test connection', testingConnectionLabel: 'Testing…',
            testConnectionOnline: 'Connected successfully.', testConnectionOffline: 'Could not connect to the source.',
            saveChangesBtn: 'Save changes', unsavedChangesConfirm: 'There are unsaved changes for this camera. Discard them and continue?',
            duplicateNamePrompt: 'Name for the copy:', duplicateSuffix: ' (copy)',
            deleteCameraConfirmTitle: 'Delete {name}',
            deleteCameraConfirmBody: 'This camera has {captures} captures, {timelapses} timelapses and {storage} of storage.',
            deleteCameraOnlyBtn: 'Delete camera', deleteCameraWithFilesBtn: 'Delete camera and its files',
            cameraDeleted: '{name}: camera deleted.',
            unboundLabel: 'Not bound', removeBindingBtn: 'Remove binding',
            usbTypeLabel: 'USB', rtspTypeLabel: 'RTSP', httpTypeLabel: 'HTTP',
        },
        de: {
            operationCouldNotComplete: 'Der Vorgang konnte nicht abgeschlossen werden.',
            cameraAdded: '{name}: Kamera hinzugefügt.',
            connectingLabel: 'Verbinden…', searchingPortLabel: 'Port wird gesucht…',
            onvifNeedHostOrUrl: 'Gib die Kamera-IP oder die vollständige ONVIF-Dienst-URL ein.',
            confirmRemoveCamera: '"{name}" löschen? Sie wird nur aus der NOPAL-Registrierung entfernt, die Kamera und ihr Stream sind nicht betroffen.',
            removeCameraTitle: 'Kamera löschen',
            brandBambu: 'Bambu Lab', brandElegoo: 'Elegoo', brandFlashforge: 'FlashForge', brandMarlin: 'Marlin',
            brandKlipper: 'Klipper', brandLaserCnc: 'Laser/CNC', brandCnc: 'CNC', brandLaser: 'Laser',
            searchingWebcams: 'Verbundene Webcams werden gesucht…',
            noWebcamDetected: 'Keine USB-Webcam erkannt. Schließe sie an und tippe auf "Erneut suchen".',
            alreadyRegisteredBadge: 'Bereits registriert',
            whatDeviceToFilm: 'Welches Gerät möchtest du filmen?',
            loadingDevicesOption: 'Geräte werden geladen…', chooseDeviceOption: 'Gerät auswählen',
            timelapseNotImplementedHint: 'Die automatische Bilderfassung während des Drucks und die Videoerstellung sind noch nicht implementiert -- vorerst wird nur die Zuordnung gespeichert, bis diese Funktion bereit ist.',
            whatWillYouUseItFor: 'Wofür wirst du sie verwenden?', exampleWatchWorkshop: 'z. B. Werkstatt überwachen',
            nameLabel: 'Name',
            purposeMonitoring: 'Allgemeine Überwachung', purposeMonitoringDesc: 'Überwachung in Echtzeit',
            purposeTimelapse: 'Zeitraffer eines Geräts', purposeTimelapseDesc: 'Aufnahme in Intervallen',
            purposeOther: 'Andere Funktion', purposeOtherDesc: 'Benutzerdefinierte Verwendung',
            whatForUpper: 'WOFÜR WIRST DU SIE VERWENDEN?', whatDeviceUpper: 'WELCHES GERÄT MÖCHTEST DU FILMEN?',
            intervalSecondsUpper: 'INTERVALL (SEKUNDEN)', timeBetweenCaptures: 'Zeit zwischen den Aufnahmen.',
            fpsFinalVideoUpper: 'FPS DES ENDVIDEOS', framesPerSecondHint: 'Bilder pro Sekunde des erzeugten Videos.',
            infoUpper: 'INFORMATION',
            timelapseInfoText: 'Der Zeitraffer erfasst Bilder in festgelegten Intervallen und erzeugt ein Video mit der gewählten Geschwindigkeit.',
            cameraUpdated: '{name}: Kamera aktualisiert.',
            loadingEllipsis: 'Wird geladen…', noCamerasYet: 'Du hast noch keine Kamera hinzugefügt.',
            pageTitle: 'Kameras', layout1PerRow: '1 pro Zeile', layout2PerRow: '2 pro Zeile', layout3PerRow: '3 pro Zeile',
            addCameraBtn: 'Kamera hinzufügen', addCameraTitle: 'Kamera hinzufügen',
            addCameraHint: 'Ein direkter MJPEG-Stream, oder automatisch per ONVIF auflösen (empfohlen, falls deine Kamera das unterstützt: das RTSP-URL-Format muss dann nicht bekannt sein).',
            tabUrlDirect: 'Direkte URL', tabOnvif: 'ONVIF', tabUsb: 'USB',
            streamUrlLabel: 'Stream-URL',
            streamUrlPlaceholder: 'http://192.168.1.50:8080/stream  oder  rtsp://benutzer:passwort@192.168.1.50:554/...',
            exampleCameraBed: 'z. B. Bett-Kamera',
            cancelBtn: 'Abbrechen', addBtn: 'Hinzufügen',
            cameraIpLabel: 'Kamera-IP', onvifPortLabel: 'ONVIF-Port',
            onvifPortHint: '(optional: falls unbekannt, suchen wir ihn automatisch)',
            autoDetectPlaceholder: 'Leer lassen für automatische Erkennung',
            onvifOrDivider: '— oder, falls deine Kamera nicht den Standardpfad verwendet —',
            onvifFullUrlLabel: 'Vollständige ONVIF-Dienst-URL', onvifFullUrlHint: '(ersetzt IP + Port)',
            usernameLabel: 'Benutzername', passwordLabel: 'Passwort', connectBtn: 'Verbinden',
            webcamsDetected: 'Erkannte Webcams', searchAgainTitle: 'Erneut suchen',
            configureCameraTitle: 'Kamera konfigurieren', configureCameraSubtitle: 'Lege den Zweck und die Aufnahmeeinstellungen deiner Kamera fest.',
            cameraNameUpper: 'KAMERANAME', nameHelpsIdentify: 'Dieser Name hilft dir, sie leicht zu identifizieren.',
            deleteCameraLabel: 'Kamera löschen', saveBtn: 'Speichern',
        },
        fr: {
            operationCouldNotComplete: "L'opération n'a pas pu être terminée.",
            cameraAdded: '{name} : caméra ajoutée.',
            connectingLabel: 'Connexion…', searchingPortLabel: 'Recherche du port…',
            onvifNeedHostOrUrl: "Indiquez l'IP de la caméra ou l'URL complète du service ONVIF.",
            confirmRemoveCamera: 'Supprimer "{name}" ? Cela ne fait que la retirer du registre NOPAL, la caméra et son flux ne sont pas affectés.',
            removeCameraTitle: 'Supprimer la caméra',
            brandBambu: 'Bambu Lab', brandElegoo: 'Elegoo', brandFlashforge: 'FlashForge', brandMarlin: 'Marlin',
            brandKlipper: 'Klipper', brandLaserCnc: 'Laser/CNC', brandCnc: 'CNC', brandLaser: 'Laser',
            searchingWebcams: 'Recherche des webcams connectées…',
            noWebcamDetected: 'Aucune webcam USB détectée. Connectez-la et appuyez sur "Rechercher à nouveau".',
            alreadyRegisteredBadge: 'Déjà enregistrée',
            whatDeviceToFilm: 'Quel appareil allez-vous filmer ?',
            loadingDevicesOption: 'Chargement des appareils…', chooseDeviceOption: 'Choisissez un appareil',
            timelapseNotImplementedHint: "La capture automatique d'images pendant l'impression et l'assemblage vidéo ne sont pas encore implémentés -- pour l'instant, cela enregistre uniquement l'association en attendant que cette fonction soit prête.",
            whatWillYouUseItFor: 'À quoi allez-vous l\'utiliser ?', exampleWatchWorkshop: 'Ex. surveiller l\'atelier',
            nameLabel: 'Nom',
            purposeMonitoring: 'Surveillance générale', purposeMonitoringDesc: 'Supervision en temps réel',
            purposeTimelapse: "Timelapse d'un appareil", purposeTimelapseDesc: 'Capture par intervalles',
            purposeOther: 'Autre fonction', purposeOtherDesc: 'Usage personnalisé',
            whatForUpper: "À QUOI ALLEZ-VOUS L'UTILISER ?", whatDeviceUpper: 'QUEL APPAREIL ALLEZ-VOUS FILMER ?',
            intervalSecondsUpper: 'INTERVALLE (SECONDES)', timeBetweenCaptures: 'Temps entre chaque capture.',
            fpsFinalVideoUpper: 'FPS DE LA VIDÉO FINALE', framesPerSecondHint: 'Images par seconde de la vidéo générée.',
            infoUpper: 'INFORMATION',
            timelapseInfoText: 'Le timelapse capturera des images à intervalles définis et générera une vidéo à la vitesse sélectionnée.',
            cameraUpdated: '{name} : caméra mise à jour.',
            loadingEllipsis: 'Chargement…', noCamerasYet: "Vous n'avez encore ajouté aucune caméra.",
            pageTitle: 'Caméras', layout1PerRow: '1 par ligne', layout2PerRow: '2 par ligne', layout3PerRow: '3 par ligne',
            addCameraBtn: 'Ajouter une caméra', addCameraTitle: 'Ajouter une caméra',
            addCameraHint: "Un flux MJPEG direct, ou résolvez-le automatiquement via ONVIF (recommandé si votre caméra le prend en charge : pas besoin de connaître le format d'URL RTSP).",
            tabUrlDirect: 'URL directe', tabOnvif: 'ONVIF', tabUsb: 'USB',
            streamUrlLabel: 'URL du flux',
            streamUrlPlaceholder: 'http://192.168.1.50:8080/stream  ou  rtsp://utilisateur:motdepasse@192.168.1.50:554/...',
            exampleCameraBed: 'Ex. Caméra du lit',
            cancelBtn: 'Annuler', addBtn: 'Ajouter',
            cameraIpLabel: 'IP de la caméra', onvifPortLabel: 'Port ONVIF',
            onvifPortHint: '(facultatif : si vous ne le connaissez pas, nous le chercherons)',
            autoDetectPlaceholder: 'Laissez vide pour la détection automatique',
            onvifOrDivider: "— ou, si votre caméra n'utilise pas le chemin standard —",
            onvifFullUrlLabel: 'URL complète du service ONVIF', onvifFullUrlHint: '(remplace IP + port)',
            usernameLabel: 'Utilisateur', passwordLabel: 'Mot de passe', connectBtn: 'Connecter',
            webcamsDetected: 'Webcams détectées', searchAgainTitle: 'Rechercher à nouveau',
            configureCameraTitle: 'Configurer la caméra', configureCameraSubtitle: 'Définissez la finalité et la capture de votre caméra.',
            cameraNameUpper: 'NOM DE LA CAMÉRA', nameHelpsIdentify: "Ce nom vous aidera à l'identifier facilement.",
            deleteCameraLabel: 'Supprimer la caméra', saveBtn: 'Enregistrer',
        },
        'pt-BR': {
            operationCouldNotComplete: 'Não foi possível concluir a operação.',
            cameraAdded: '{name}: câmera adicionada.',
            connectingLabel: 'Conectando…', searchingPortLabel: 'Procurando porta…',
            onvifNeedHostOrUrl: 'Informe o IP da câmera ou a URL completa do serviço ONVIF.',
            confirmRemoveCamera: 'Excluir "{name}"? Isso apenas a remove do registro do NOPAL, a câmera e seu stream não são afetados.',
            removeCameraTitle: 'Excluir câmera',
            brandBambu: 'Bambu Lab', brandElegoo: 'Elegoo', brandFlashforge: 'FlashForge', brandMarlin: 'Marlin',
            brandKlipper: 'Klipper', brandLaserCnc: 'Laser/CNC', brandCnc: 'CNC', brandLaser: 'Laser',
            searchingWebcams: 'Procurando webcams conectadas…',
            noWebcamDetected: 'Nenhuma webcam USB detectada. Conecte-a e toque em "Buscar novamente".',
            alreadyRegisteredBadge: 'Já registrada',
            whatDeviceToFilm: 'Qual dispositivo você vai filmar?',
            loadingDevicesOption: 'Carregando dispositivos…', chooseDeviceOption: 'Escolha um dispositivo',
            timelapseNotImplementedHint: 'A captura automática de quadros durante a impressão e a montagem do vídeo ainda não foram implementadas -- por enquanto isso só salva a associação para quando esse recurso estiver pronto.',
            whatWillYouUseItFor: 'Para que você vai usá-la?', exampleWatchWorkshop: 'Ex. monitorar a oficina',
            nameLabel: 'Nome',
            purposeMonitoring: 'Monitoramento geral', purposeMonitoringDesc: 'Supervisão em tempo real',
            purposeTimelapse: 'Timelapse de um dispositivo', purposeTimelapseDesc: 'Captura em intervalos',
            purposeOther: 'Outra função', purposeOtherDesc: 'Uso personalizado',
            whatForUpper: 'PARA QUE VOCÊ VAI USÁ-LA?', whatDeviceUpper: 'QUAL DISPOSITIVO VOCÊ VAI FILMAR?',
            intervalSecondsUpper: 'INTERVALO (SEGUNDOS)', timeBetweenCaptures: 'Tempo entre cada captura.',
            fpsFinalVideoUpper: 'FPS DO VÍDEO FINAL', framesPerSecondHint: 'Quadros por segundo do vídeo gerado.',
            infoUpper: 'INFORMAÇÃO',
            timelapseInfoText: 'O timelapse capturará imagens em intervalos definidos e gerará um vídeo na velocidade selecionada.',
            cameraUpdated: '{name}: câmera atualizada.',
            loadingEllipsis: 'Carregando…', noCamerasYet: 'Você ainda não adicionou nenhuma câmera.',
            pageTitle: 'Câmeras', layout1PerRow: '1 por linha', layout2PerRow: '2 por linha', layout3PerRow: '3 por linha',
            addCameraBtn: 'Adicionar câmera', addCameraTitle: 'Adicionar câmera',
            addCameraHint: 'Um stream MJPEG direto, ou resolva automaticamente via ONVIF (recomendado se sua câmera suportar: não é preciso saber o formato da URL RTSP).',
            tabUrlDirect: 'URL direta', tabOnvif: 'ONVIF', tabUsb: 'USB',
            streamUrlLabel: 'URL do stream',
            streamUrlPlaceholder: 'http://192.168.1.50:8080/stream  ou  rtsp://usuario:senha@192.168.1.50:554/...',
            exampleCameraBed: 'Ex. Câmera da mesa',
            cancelBtn: 'Cancelar', addBtn: 'Adicionar',
            cameraIpLabel: 'IP da câmera', onvifPortLabel: 'Porta ONVIF',
            onvifPortHint: '(opcional: se não souber, nós procuramos automaticamente)',
            autoDetectPlaceholder: 'Deixe em branco para detectar automaticamente',
            onvifOrDivider: '— ou, se sua câmera não usar o caminho padrão —',
            onvifFullUrlLabel: 'URL completa do serviço ONVIF', onvifFullUrlHint: '(substitui IP + porta)',
            usernameLabel: 'Usuário', passwordLabel: 'Senha', connectBtn: 'Conectar',
            webcamsDetected: 'Webcams detectadas', searchAgainTitle: 'Buscar novamente',
            configureCameraTitle: 'Configurar câmera', configureCameraSubtitle: 'Defina o propósito e a captura da sua câmera.',
            cameraNameUpper: 'NOME DA CÂMERA', nameHelpsIdentify: 'Esse nome vai te ajudar a identificá-la facilmente.',
            deleteCameraLabel: 'Excluir câmera', saveBtn: 'Salvar',
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

    // camera-card.js es un componente aparte (la tarjeta de cámara que se
    // monta en el panel de CUALQUIER máquina, no solo en esta sección, y
    // también acá mismo para mostrar la tarjeta completa de cada cámara) --
    // el manifiesto del plugin solo declara un script (ver
    // nopal-plugin.json), así que se inyecta acá con el mismo mecanismo que
    // usa loadPluginAsset() de NOPAL core para el script principal.
    if (!window.NopalCameraCard && !document.getElementById('camera-card-script')) {
        const cardScript = document.createElement('script');
        cardScript.id = 'camera-card-script';
        // Cache-busting a mano (?v=) -- este script no pasa por
        // versionedPluginAssetUrl() de NOPAL core (eso solo versiona el
        // script/style que declara nopal-plugin.json, no algo que un plugin
        // inyecta por su cuenta), así que hay que bumpear este número cada
        // vez que cambie camera-card.js o el navegador sigue sirviendo una
        // copia vieja cacheada indefinidamente.
        cardScript.src = '/plugins-static/camera-viewer/frontend/camera-card.js?v=1.8.0';
        document.body.appendChild(cardScript);
    }

    const state = {
        cameras: [],   // /api/cameras
        loading: false,
        // Cámara del inspector -- SIEMPRE un id explícito, nunca una
        // variable "activa" ambigua. Toda función que actúe sobre "la
        // cámara del inspector" la recibe por parámetro o la lee de acá en
        // el momento del evento, nunca la asume.
        selectedCameraId: null,
        search: '',
        statusFilter: 'all', // all | online | offline | disabled
        sourceFilter: 'all', // all | usb | rtsp | http
        inspectorTab: 'general', // general | timelapse
        configDirty: false,
        healthById: {}, // camera_id -> {online, disabled} (GET /health, poll centralizado)
        timelapseStatsById: {}, // camera_id -> GET /timelapse/stats (cacheado, se refresca al seleccionar/guardar)
        assembledVideosByCameraId: {}, // camera_id -> GET /timelapse/videos (solo de la cámara seleccionada, ver loadAssembledVideos)
    };
    let healthPollTimer = null;
    let cardInstance = null; // instancia de NopalCameraCard montada para la cámara seleccionada (ver renderGeneralTab)
    let timelapseEmbedHandle = null; // { close } del gestor embebido en el tab Timelapse (ver renderTimelapseTab)

    // Estado de la pestaña USB -- separado de `state` porque es efímero (se
    // resetea al cerrar el panel de alta, nunca se persiste), a diferencia
    // de `state.cameras` que refleja lo ya registrado.
    const usbState = {
        devices: [],        // /api/cameras/usb/discover
        loadingDevices: false,
        selectedDevice: null,
        purpose: 'monitoring',
        boundType: '',
        boundId: '',
        boundOptions: [],   // impresoras/láser/CNC ya registrados, para "Timelapse de un dispositivo"
        loadingBoundOptions: false,
        prefillName: '',    // sugerido al duplicar una cámara USB (ver duplicateCamera) -- vacío en un alta normal
    };

    // Estado del popup "Editar cámara" -- mismas piezas que usbState
    // (propósito/dispositivo filmado) pero separado de ese objeto: son dos
    // flujos independientes (alta vs. edición) que pueden coexistir en el
    // DOM aunque no a la vez, y mezclarlos en un solo estado los acoplaría
    // sin necesidad.
    const editState = {
        cameraId: null,
        name: '',
        purpose: 'monitoring',
        boundType: '',
        boundId: '',
        note: '',
        intervalS: 5,
        fps: 25,
        timelapseEnabled: false,
        boundOptions: [],
        loadingBoundOptions: false,
    };

    let root = null;

    const icon = (body, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
    const ICON_CAMERA = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>';
    const ICON_PLUS = '<path d="M12 5v14M5 12h14"/>';
    const ICON_TRASH = '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6"/>';
    const ICON_CLOSE = '<path d="M18 6 6 18M6 6l12 12"/>';
    const ICON_USB = '<path d="M12 2v9"/><path d="m8 6 4-4 4 4"/><circle cx="12" cy="17" r="3"/><path d="M12 14v-3"/><path d="m9 9-2 2"/><path d="m15 9 2 2"/>';
    const ICON_TAG = '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>';
    const ICON_TARGET = '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>';
    const ICON_MONITOR = '<rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>';
    const ICON_CLOCK = '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/>';
    const ICON_GRID_APPS = '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>';
    const ICON_VIDEO_CAM = '<path d="M23 7 16 12l7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/>';
    const ICON_FILM = '<rect x="2" y="3" width="20" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><line x1="2" y1="9" x2="7" y2="9"/><line x1="2" y1="15" x2="7" y2="15"/><line x1="17" y1="9" x2="22" y2="9"/><line x1="17" y1="15" x2="22" y2="15"/>';
    const ICON_INFO = '<circle cx="12" cy="12" r="9"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>';
    const ICON_SAVE = '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>';
    const ICON_MINUS = '<line x1="5" y1="12" x2="19" y2="12"/>';
    const ICON_REFRESH = '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>';
    const ICON_EYE = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
    const ICON_EDIT = '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>';
    const ICON_COPY = '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h10"/>';
    const ICON_SEARCH = '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.7" y2="16.7"/>';
    const ICON_MORE = '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>';
    const ICON_ARROW_LEFT = '<polyline points="15 18 9 12 15 6"/>';
    // Mismos trazos que camera-card.js (ICON_PLAY/ICON_DOWNLOAD) -- misma
    // identidad visual para las acciones de video en los dos lugares donde
    // aparecen.
    const ICON_PLAY = '<polygon points="5 3 19 12 5 21 5 3"/>';
    const ICON_DOWNLOAD = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
    const ICON_PAUSE = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

    const esc = value => typeof window.escapeHtml === 'function' ? window.escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const toast = (message, tone = 'success') => typeof window.showToast === 'function' ? window.showToast(message, tone) : console.log(message);
    const confirmDialog = (message, title = '') => typeof window.appConfirm === 'function' ? window.appConfirm(message, title) : Promise.resolve(window.confirm(message));

    function formatBytes(bytes) {
        const value = bytes || 0;
        const mb = value / (1024 * 1024);
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
    }
    function formatClock(epochSeconds) {
        if (!epochSeconds) return '--';
        return new Date(epochSeconds * 1000).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    async function api(url, options = {}) {
        const response = await fetch(url, options);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || tr('operationCouldNotComplete'));
        return data;
    }

    // ── Acciones contra la API ──────────────────────────────────────────

    async function refreshAll() {
        state.loading = true;
        render();
        try {
            const result = await api('/api/cameras');
            state.cameras = result.cameras || [];
            // Si la cámara seleccionada ya no existe (se eliminó desde otra
            // pestaña, por ejemplo), se cae la selección en vez de dejar el
            // inspector mostrando un id fantasma.
            if (state.selectedCameraId && !state.cameras.some(c => c.id === state.selectedCameraId)) {
                state.selectedCameraId = null;
            }
        } catch (error) {
            toast(error.message, 'error');
        }
        state.loading = false;
        render();
        pollHealthOnce();
    }

    // ── Tipo/fuente derivado (mismo criterio en todo el archivo: nunca se
    // persiste un campo "type", se infiere de device_path/source_url) ──
    function deriveCameraType(camera) {
        if (camera.device_path) return 'usb';
        if ((camera.source_url || '').toLowerCase().startsWith('rtsp')) return 'rtsp';
        return 'http';
    }
    function cameraTypeLabel(camera) {
        const type = deriveCameraType(camera);
        return type === 'usb' ? tr('usbTypeLabel') : type === 'rtsp' ? tr('rtspTypeLabel') : tr('httpTypeLabel');
    }

    // ── Estado real por cámara (online/offline/disabled) -- UN solo poll
    // centralizado para toda la lista visible, no un setInterval por fila
    // (ver sección de rendimiento del pedido). Reusa GET /health, que ya
    // hace la misma prueba real que el backend usaba solo para el conteo
    // agregado del dashboard. ──
    async function pollHealthOnce() {
        await Promise.all(state.cameras.map(async camera => {
            try {
                state.healthById[camera.id] = await api(`/api/cameras/${camera.id}/health`);
            } catch (error) {
                // Una cámara puntual fallando la prueba no debe tumbar el
                // resto de la lista -- sin datos, se trata como desconocida.
            }
        }));
        renderCameraList();
        // Los timelapses guardados de la cámara seleccionada se refrescan en
        // este mismo ciclo (sin poller propio): es la única forma de
        // enterarse de que el gestor embebido en la pestaña Timelapse armó o
        // borró un video, porque ese widget vive aparte y no avisa al padre.
        if (state.selectedCameraId) {
            await loadAssembledVideos(state.selectedCameraId, { quiet: true });
            renderSavedTimelapsesList();
        }
    }
    function ensureHealthPolling() {
        if (healthPollTimer) return;
        healthPollTimer = setInterval(pollHealthOnce, 15000);
    }

    async function loadTimelapseStats(cameraId, { quiet = false } = {}) {
        try {
            state.timelapseStatsById[cameraId] = await api(`/api/cameras/${cameraId}/timelapse/stats`);
        } catch (error) {
            if (!quiet) toast(error.message, 'error');
        }
    }

    async function loadAssembledVideos(cameraId, { quiet = false } = {}) {
        try {
            const result = await api(`/api/cameras/${cameraId}/timelapse/videos`);
            state.assembledVideosByCameraId[cameraId] = result.videos || [];
        } catch (error) {
            if (!quiet) toast(error.message, 'error');
        }
    }

    function selectedCamera() {
        return state.cameras.find(c => c.id === state.selectedCameraId) || null;
    }

    async function selectCamera(cameraId, { force = false } = {}) {
        if (state.selectedCameraId === cameraId && !force) return;
        if (state.configDirty && !(await confirmDialog(tr('unsavedChangesConfirm')))) return;
        state.selectedCameraId = cameraId;
        state.inspectorTab = 'general';
        state.configDirty = false;
        renderCameraList();
        renderInspector();
        renderSavedTimelapsesList();
        if (cameraId) {
            await Promise.all([
                loadTimelapseStats(cameraId, { quiet: true }),
                loadAssembledVideos(cameraId, { quiet: true }),
            ]);
        }
        renderInspector();
        renderSavedTimelapsesList();
    }

    async function addCamera(event) {
        event.preventDefault();
        const form = event.target;
        const name = form.name.value.trim();
        const streamUrl = form.stream_url.value.trim();
        if (!name || !streamUrl) return;
        try {
            await api('/api/cameras', { method: 'POST', body: new URLSearchParams({ name, stream_url: streamUrl }) });
            closeAddPanel();
            toast(tr('cameraAdded', { name }));
            await refreshAll();
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    async function addCameraOnvif(event) {
        event.preventDefault();
        const form = event.target;
        const name = form.name.value.trim();
        const host = form.host.value.trim();
        const port = form.port.value.trim();
        const onvifUrl = form.onvif_url.value.trim();
        const username = form.username.value.trim();
        const password = form.password.value;
        if (!name || !username || (!host && !onvifUrl)) {
            toast(tr('onvifNeedHostOrUrl'), 'error');
            return;
        }
        const submitBtn = root.querySelector('#cv-add-onvif-submit-btn');
        const originalLabel = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = onvifUrl ? tr('connectingLabel') : (port ? tr('connectingLabel') : tr('searchingPortLabel'));
        try {
            // GetCapabilities + GetProfiles + GetStreamUri contra el dispositivo real
            // -- tarda unos segundos, más todavía si hay que escanear el puerto.
            const params = { name, username, password };
            if (onvifUrl) {
                // URL completa a mano -- salta el autoscan de puerto/path,
                // para cámaras que no publican ONVIF en /onvif/device_service.
                params.onvif_url = onvifUrl;
            } else {
                params.host = host;
                if (port) params.port = port;
            }
            await api('/api/cameras/onvif', { method: 'POST', body: new URLSearchParams(params) });
            closeAddPanel();
            toast(tr('cameraAdded', { name }));
            await refreshAll();
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalLabel;
        }
    }

    async function removeCamera(camera) {
        if (!(await confirmDialog(tr('confirmRemoveCamera', { name: camera.name }), tr('removeCameraTitle')))) return;
        await performDelete(camera.id, false);
    }

    // ── Eliminar (con o sin archivos) -- diálogo propio, no confirmDialog
    // simple: acá hay DOS acciones destructivas distintas ("Eliminar
    // cámara" vs. "...y sus archivos"), nunca fusionadas en una sola. ──
    async function deleteCameraFlow(camera) {
        if (!state.timelapseStatsById[camera.id]) await loadTimelapseStats(camera.id, { quiet: true });
        const stats = state.timelapseStatsById[camera.id];
        const panel = root.querySelector('#cv-delete-panel');
        root.querySelector('#cv-delete-panel-title').textContent = tr('deleteCameraConfirmTitle', { name: camera.name });
        const bodyEl = root.querySelector('#cv-delete-panel-body');
        bodyEl.textContent = stats && (stats.frame_count || stats.assembled_count)
            ? tr('deleteCameraConfirmBody', { captures: stats.frame_count, timelapses: stats.assembled_count, storage: formatBytes(stats.storage_used_bytes) })
            : '';
        panel.dataset.cvDeleteCamera = camera.id;
        panel.hidden = false;
    }

    async function performDelete(cameraId, deleteFiles) {
        const camera = state.cameras.find(c => c.id === cameraId);
        try {
            await api('/api/cameras/remove', { method: 'POST', body: new URLSearchParams({ id: cameraId, delete_files: String(!!deleteFiles) }) });
            toast(tr('cameraDeleted', { name: camera?.name || '' }));
            const deletePanel = root.querySelector('#cv-delete-panel');
            if (deletePanel) deletePanel.hidden = true;
            const wasSelected = state.selectedCameraId === cameraId;
            await refreshAll();
            if (wasSelected) {
                const next = state.cameras[0];
                await selectCamera(next ? next.id : null, { force: true });
            }
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    // ── Duplicar -- RTSP/HTTP/ONVIF se copian directo (mismo source_url no
    // choca con nada); USB nunca reusa el device_path del original en
    // silencio, se abre el alta en la pestaña USB para que el usuario elija
    // un dispositivo físico distinto antes de poder guardar. ──
    async function duplicateCamera(camera) {
        if (camera.device_path) {
            openAddPanel();
            switchAddTab('usb');
            usbState.purpose = camera.purpose || 'monitoring';
            usbState.boundType = camera.bound_device?.type || '';
            usbState.boundId = camera.bound_device?.id || '';
            usbState.prefillName = `${camera.name}${tr('duplicateSuffix')}`;
            renderUsbTab();
            return;
        }
        const suggested = `${camera.name}${tr('duplicateSuffix')}`;
        const name = window.prompt(tr('duplicateNamePrompt'), suggested);
        if (!name || !name.trim()) return;
        try {
            const created = await api(`/api/cameras/${camera.id}/duplicate`, { method: 'POST', body: new URLSearchParams({ name: name.trim() }) });
            toast(tr('cameraAdded', { name: created.name }));
            await refreshAll();
            await selectCamera(created.id, { force: true });
        } catch (error) {
            toast(error.message, 'error');
        }
    }

    // ── "Cámara activa" -- distinto del enabled del timelapse. Optimista en
    // UI, revertido si el request falla; siempre reenvía purpose/vínculo
    // actuales porque update_camera los reescribe enteros (ver
    // camera_service.py -- solo `enabled`/`name` son merge parcial). ──
    async function toggleCameraEnabled(camera, enabled) {
        const previous = camera.enabled !== false;
        camera.enabled = enabled;
        renderInspector();
        const params = new URLSearchParams({ name: camera.name, enabled: String(enabled) });
        if (camera.purpose) params.set('purpose', camera.purpose);
        if (camera.purpose === 'other' && camera.purpose_note) params.set('purpose_note', camera.purpose_note);
        if (camera.purpose === 'timelapse' && camera.bound_device) {
            params.set('bound_device_type', camera.bound_device.type);
            params.set('bound_device_id', camera.bound_device.id);
        }
        try {
            await api(`/api/cameras/${camera.id}/update`, { method: 'POST', body: params });
            await refreshAll();
        } catch (error) {
            camera.enabled = previous;
            toast(error.message, 'error');
            renderInspector();
        }
    }

    async function testConnection(camera) {
        const btn = root.querySelector('#cv-config-test-btn');
        if (btn) { btn.disabled = true; btn.textContent = tr('testingConnectionLabel'); }
        try {
            const health = await api(`/api/cameras/${camera.id}/health`);
            state.healthById[camera.id] = health;
            toast(health.online ? tr('testConnectionOnline') : tr('testConnectionOffline'), health.online ? 'success' : 'error');
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            renderCameraList();
            if (state.inspectorTab === 'general') renderInspector();
        }
    }

    // ── Pestaña USB (detectar → elegir propósito → confirmar) ──────────────
    // Mini-flujo guiado dentro del mismo panel de alta -- no un modal de
    // varios pasos como el asistente de impresoras, la superficie acá es
    // mucho más chica (un solo dispositivo típico, sin credenciales que
    // pedir). El registro real lo sirve el propio NOPAL vía ffmpeg (ver
    // usb_camera_service.py) -- una vez agregada, la cámara USB se comporta
    // igual que cualquier otra en el grid.

    const BOUND_DEVICE_SOURCES = [
        { type: 'bambu', get label() { return tr('brandBambu'); }, url: '/api/bambu/printers', listKey: 'printers' },
        { type: 'elegoo', get label() { return tr('brandElegoo'); }, url: '/api/elegoo/printers', listKey: 'printers' },
        { type: 'flashforge', get label() { return tr('brandFlashforge'); }, url: '/api/flashforge/printers', listKey: 'printers' },
        { type: 'marlin', get label() { return tr('brandMarlin'); }, url: '/api/marlin-printers/registry/status', listKey: 'printers' },
        { type: 'klipper', get label() { return tr('brandKlipper'); }, url: '/api/printers/status', listKey: 'printers' },
        { type: 'laser', get label() { return tr('brandLaserCnc'); }, url: '/api/laser/registry/status', listKey: 'lasers' },
    ];

    async function loadUsbDevices() {
        usbState.loadingDevices = true;
        renderUsbTab();
        try {
            const result = await api('/api/cameras/usb/discover');
            usbState.devices = result.devices || [];
        } catch (error) {
            toast(error.message, 'error');
            usbState.devices = [];
        }
        usbState.loadingDevices = false;
        renderUsbTab();
    }

    // `targetState` es usbState (alta) o editState (edición) -- misma lista
    // de dispositivos filmables para ambos flujos, sin duplicar el fetch.
    async function loadBoundDeviceOptions(targetState, onUpdate) {
        targetState.loadingBoundOptions = true;
        onUpdate();
        const options = [];
        await Promise.all(BOUND_DEVICE_SOURCES.map(async source => {
            try {
                const data = await api(source.url);
                const list = data[source.listKey] || [];
                list.forEach(entry => {
                    const id = entry.id ?? entry.device ?? entry.host ?? entry.name;
                    if (id == null) return;
                    if (source.type === 'laser') {
                        // /api/laser/registry/status junta láser y CNC -- se
                        // distinguen acá para no ofrecer un CNC como si fuera láser.
                        options.push({ type: entry.kind === 'cnc' ? 'cnc' : 'laser', id: String(id), name: entry.name || id, brandLabel: entry.kind === 'cnc' ? tr('brandCnc') : tr('brandLaser') });
                        return;
                    }
                    options.push({ type: source.type, id: String(id), name: entry.name || id, brandLabel: source.label });
                });
            } catch (error) {
                // Una marca sin nada registrado (o con error puntual) no debe
                // tumbar el resto de la lista -- se omite en silencio.
            }
        }));
        targetState.boundOptions = options;
        targetState.loadingBoundOptions = false;
        onUpdate();
    }

    function selectUsbDevice(device) {
        usbState.selectedDevice = device;
        usbState.purpose = 'monitoring';
        usbState.boundType = '';
        usbState.boundId = '';
        renderUsbTab();
    }

    function renderUsbDeviceListHtml() {
        if (usbState.loadingDevices) return `<p class="cv-empty">${tr('searchingWebcams')}</p>`;
        if (!usbState.devices.length) {
            return `<p class="cv-empty">${tr('noWebcamDetected')}</p>`;
        }
        const registeredPaths = new Set(state.cameras.map(camera => camera.device_path).filter(Boolean));
        return usbState.devices.map(device => {
            const already = registeredPaths.has(device.device_path);
            const selected = usbState.selectedDevice && usbState.selectedDevice.device_path === device.device_path;
            return `
                <button type="button" class="cv-usb-device-item${selected ? ' selected' : ''}${already ? ' registered' : ''}" data-cv-usb-device="${esc(device.device_path)}" ${already ? 'disabled' : ''}>
                    ${icon(ICON_USB, 16)}
                    <span class="cv-usb-device-item-text">
                        <strong>${esc(device.name)}</strong>
                        <small>${esc(device.device_path)}${device.vendor_id ? ` · ${esc(device.vendor_id)}:${esc(device.product_id)}` : ''}</small>
                    </span>
                    ${already ? `<span class="cv-usb-badge">${tr('alreadyRegisteredBadge')}</span>` : ''}
                </button>`;
        }).join('');
    }

    function renderUsbDetailHtml() {
        const device = usbState.selectedDevice;
        if (!device) return '';
        const boundSection = usbState.purpose === 'timelapse' ? `
            <label>
                <span>${tr('whatDeviceToFilm')}</span>
                <select id="cv-usb-bound-select" ${usbState.loadingBoundOptions ? 'disabled' : ''}>
                    <option value="">${usbState.loadingBoundOptions ? tr('loadingDevicesOption') : tr('chooseDeviceOption')}</option>
                    ${usbState.boundOptions.map(opt => `<option value="${esc(opt.type)}::${esc(opt.id)}" ${usbState.boundType === opt.type && usbState.boundId === opt.id ? 'selected' : ''}>${esc(opt.brandLabel)} — ${esc(opt.name)}</option>`).join('')}
                </select>
                <p class="cv-usb-hint">${tr('timelapseNotImplementedHint')}</p>
            </label>` : '';
        const noteSection = usbState.purpose === 'other' ? `
            <label><span>${tr('whatWillYouUseItFor')}</span><input type="text" id="cv-usb-note-input" maxlength="140" placeholder="${tr('exampleWatchWorkshop')}"></label>` : '';
        return `
            <label><span>${tr('nameLabel')}</span><input type="text" id="cv-usb-name-input" maxlength="60" value="${esc(usbState.prefillName || device.name)}"></label>
            <div class="cv-usb-purpose">
                <span>${tr('whatWillYouUseItFor')}</span>
                <label class="cv-usb-radio"><input type="radio" name="cv-usb-purpose" value="monitoring" ${usbState.purpose === 'monitoring' ? 'checked' : ''}><span>${tr('purposeMonitoring')}</span></label>
                <label class="cv-usb-radio"><input type="radio" name="cv-usb-purpose" value="timelapse" ${usbState.purpose === 'timelapse' ? 'checked' : ''}><span>${tr('purposeTimelapse')}</span></label>
                <label class="cv-usb-radio"><input type="radio" name="cv-usb-purpose" value="other" ${usbState.purpose === 'other' ? 'checked' : ''}><span>${tr('purposeOther')}</span></label>
            </div>
            ${boundSection}
            ${noteSection}`;
    }

    function updateUsbSubmitEnabled() {
        const btn = root.querySelector('#cv-add-usb-submit-btn');
        if (!btn) return;
        const nameOk = !!usbState.selectedDevice;
        const boundOk = usbState.purpose !== 'timelapse' || (usbState.boundType && usbState.boundId);
        btn.disabled = !(nameOk && boundOk);
    }

    function renderUsbTab() {
        const listEl = root.querySelector('#cv-usb-device-list');
        const detailEl = root.querySelector('#cv-usb-detail');
        if (!listEl || !detailEl) return;
        listEl.innerHTML = renderUsbDeviceListHtml();
        detailEl.hidden = !usbState.selectedDevice;
        detailEl.innerHTML = renderUsbDetailHtml();
        if (usbState.purpose === 'timelapse' && !usbState.boundOptions.length && !usbState.loadingBoundOptions) {
            loadBoundDeviceOptions(usbState, renderUsbTab);
        }
        updateUsbSubmitEnabled();
    }

    async function submitUsbRegistration() {
        const device = usbState.selectedDevice;
        if (!device) return;
        const nameInput = root.querySelector('#cv-usb-name-input');
        const name = (nameInput?.value || device.name).trim();
        const noteInput = root.querySelector('#cv-usb-note-input');
        const params = { name: name || device.name, device_path: device.device_path, purpose: usbState.purpose };
        if (usbState.purpose === 'timelapse') {
            params.bound_device_type = usbState.boundType;
            params.bound_device_id = usbState.boundId;
        }
        if (usbState.purpose === 'other' && noteInput?.value.trim()) {
            params.purpose_note = noteInput.value.trim();
        }
        const submitBtn = root.querySelector('#cv-add-usb-submit-btn');
        submitBtn.disabled = true;
        try {
            await api('/api/cameras/usb/register', { method: 'POST', body: new URLSearchParams(params) });
            closeAddPanel();
            toast(tr('cameraAdded', { name: params.name }));
            await refreshAll();
        } catch (error) {
            toast(error.message, 'error');
            submitBtn.disabled = false;
        }
    }

    // ── Popup "Editar cámara" (nombre + propósito, nunca la fuente del
    // video: cambiar de dónde sale el stream es dar de alta una cámara
    // nueva, no editar la existente) ────────────────────────────────────

    function renderEditPurposeHtml() {
        const purposeCards = `
            <div class="cv-field-group">
                <span class="cv-field-label">${icon(ICON_TARGET, 14)} ${tr('whatForUpper')}</span>
                <div class="cv-purpose-cards">
                    <label class="cv-purpose-card">
                        <input type="radio" name="cv-edit-purpose" value="monitoring" ${editState.purpose === 'monitoring' ? 'checked' : ''}>
                        <span class="cv-purpose-card-radio"></span>
                        <span class="cv-purpose-card-icon">${icon(ICON_MONITOR, 22)}</span>
                        <strong>${tr('purposeMonitoring')}</strong>
                        <small>${tr('purposeMonitoringDesc')}</small>
                    </label>
                    <label class="cv-purpose-card">
                        <input type="radio" name="cv-edit-purpose" value="timelapse" ${editState.purpose === 'timelapse' ? 'checked' : ''}>
                        <span class="cv-purpose-card-radio"></span>
                        <span class="cv-purpose-card-icon">${icon(ICON_CLOCK, 22)}</span>
                        <strong>${tr('purposeTimelapse')}</strong>
                        <small>${tr('purposeTimelapseDesc')}</small>
                    </label>
                    <label class="cv-purpose-card">
                        <input type="radio" name="cv-edit-purpose" value="other" ${editState.purpose === 'other' ? 'checked' : ''}>
                        <span class="cv-purpose-card-radio"></span>
                        <span class="cv-purpose-card-icon">${icon(ICON_GRID_APPS, 22)}</span>
                        <strong>${tr('purposeOther')}</strong>
                        <small>${tr('purposeOtherDesc')}</small>
                    </label>
                </div>
            </div>`;

        const timelapseDetails = editState.purpose === 'timelapse' ? `
            <div class="cv-field-group">
                <span class="cv-field-label">${icon(ICON_VIDEO_CAM, 14)} ${tr('whatDeviceUpper')}</span>
                <div class="cv-select-icon">
                    ${icon(ICON_TARGET, 16)}
                    <select id="cv-edit-bound-select" ${editState.loadingBoundOptions ? 'disabled' : ''}>
                        <option value="">${editState.loadingBoundOptions ? tr('loadingDevicesOption') : tr('chooseDeviceOption')}</option>
                        ${editState.boundOptions.map(opt => `<option value="${esc(opt.type)}::${esc(opt.id)}" ${editState.boundType === opt.type && editState.boundId === opt.id ? 'selected' : ''}>${esc(opt.brandLabel)} — ${esc(opt.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="cv-inspector-section cv-active-toggle">
                <div><strong>${tr('timelapseActiveTitle')}</strong><small>${tr('timelapseActiveHint')}</small></div>
                <label class="cv-switch"><input type="checkbox" id="cv-edit-timelapse-enabled-input" ${editState.timelapseEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="cv-timelapse-params-row">
                <div class="cv-timelapse-params-col">
                    <div class="cv-field-group">
                        <span class="cv-field-label">${icon(ICON_CLOCK, 14)} ${tr('intervalSecondsUpper')}</span>
                        <div class="cv-stepper-row">
                            <div class="cv-stepper">
                                <button type="button" class="cv-stepper-btn" data-cv-step="interval" data-cv-step-dir="-1">${icon(ICON_MINUS, 14)}</button>
                                <input type="number" id="cv-edit-interval-input" min="1" step="1" value="${editState.intervalS}">
                                <button type="button" class="cv-stepper-btn" data-cv-step="interval" data-cv-step-dir="1">${icon(ICON_PLUS, 14)}</button>
                            </div>
                            <span class="cv-stepper-hint">${tr('timeBetweenCaptures')}</span>
                        </div>
                    </div>
                    <div class="cv-field-group">
                        <span class="cv-field-label">${icon(ICON_FILM, 14)} ${tr('fpsFinalVideoUpper')}</span>
                        <div class="cv-stepper-row">
                            <div class="cv-stepper">
                                <button type="button" class="cv-stepper-btn" data-cv-step="fps" data-cv-step-dir="-1">${icon(ICON_MINUS, 14)}</button>
                                <input type="number" id="cv-edit-fps-input" min="1" step="1" value="${editState.fps}">
                                <button type="button" class="cv-stepper-btn" data-cv-step="fps" data-cv-step-dir="1">${icon(ICON_PLUS, 14)}</button>
                            </div>
                            <span class="cv-stepper-hint">${tr('framesPerSecondHint')}</span>
                        </div>
                    </div>
                </div>
                <div class="cv-info-panel">
                    <div class="cv-info-panel-header">${icon(ICON_INFO, 16)}<span>${tr('infoUpper')}</span></div>
                    <div class="cv-info-panel-illustration">${icon(ICON_VIDEO_CAM, 26)}<span class="cv-info-panel-dashes"></span>${icon(ICON_GRID_APPS, 22)}</div>
                    <p>${tr('timelapseInfoText')}</p>
                </div>
            </div>` : '';

        const noteSection = editState.purpose === 'other' ? `
            <div class="cv-field-group">
                <span class="cv-field-label">${tr('whatWillYouUseItFor')}</span>
                <input type="text" id="cv-edit-note-input" maxlength="140" value="${esc(editState.note)}" placeholder="${tr('exampleWatchWorkshop')}">
            </div>` : '';

        return purposeCards + timelapseDetails + noteSection;
    }

    // El formulario de "Configuración" vive INLINE en el tab del inspector
    // (ver renderGeneralTab) -- ya no es un overlay/modal aparte. Se pide
    // explícitamente en el pedido de rediseño: "editar la cámara
    // directamente desde el panel lateral sin abrir modales adicionales".
    function renderEditPanel() {
        const nameInput = root.querySelector('#cv-edit-name-input');
        if (nameInput && document.activeElement !== nameInput) nameInput.value = editState.name;
        const purposeSection = root.querySelector('#cv-edit-purpose-section');
        if (purposeSection) purposeSection.innerHTML = renderEditPurposeHtml();
        if (editState.purpose === 'timelapse' && !editState.boundOptions.length && !editState.loadingBoundOptions) {
            loadBoundDeviceOptions(editState, renderEditPanel);
        }
    }

    function loadEditState(camera) {
        editState.cameraId = camera.id;
        editState.name = camera.name;
        editState.purpose = camera.purpose || 'monitoring';
        editState.boundType = camera.bound_device?.type || '';
        editState.boundId = camera.bound_device?.id || '';
        editState.note = camera.purpose_note || '';
        // /api/cameras ya trae timelapse_config completo (get_cameras()
        // spreadea la entrada entera del registro) -- no hace falta un
        // fetch aparte para precargar estos valores.
        editState.intervalS = camera.timelapse_config?.interval_s ?? 5;
        editState.fps = camera.timelapse_config?.fps ?? 25;
        editState.timelapseEnabled = camera.timelapse_config?.enabled ?? false;
        editState.boundOptions = [];
        editState.loadingBoundOptions = false;
    }

    async function submitCameraEdit(event) {
        event.preventDefault();
        const name = root.querySelector('#cv-edit-name-input').value.trim();
        if (!name) return;
        const params = { name, purpose: editState.purpose };
        if (editState.purpose === 'timelapse') {
            params.bound_device_type = editState.boundType;
            params.bound_device_id = editState.boundId;
        }
        if (editState.purpose === 'other') {
            const noteInput = root.querySelector('#cv-edit-note-input');
            params.purpose_note = (noteInput?.value || '').trim();
        }
        const submitBtn = root.querySelector('#cv-edit-submit-btn');
        submitBtn.disabled = true;
        try {
            await api(`/api/cameras/${editState.cameraId}/update`, { method: 'POST', body: new URLSearchParams(params) });
            if (editState.purpose === 'timelapse') {
                // Intervalo/FPS son del motor de timelapse (endpoint aparte,
                // ver timelapse_service.py), no del registro de propósito/
                // vínculo -- por eso es una segunda llamada, no un campo más
                // del POST de arriba.
                await api(`/api/cameras/${editState.cameraId}/timelapse`, {
                    method: 'POST',
                    body: new URLSearchParams({ interval_s: editState.intervalS, fps: editState.fps, enabled: editState.timelapseEnabled }),
                });
            }
            toast(tr('cameraUpdated', { name }));
            state.configDirty = false;
            const savedId = editState.cameraId;
            await refreshAll();
            // Guardar mantiene la MISMA cámara seleccionada -- nunca se
            // pierde el contexto ni se cae de vuelta a la lista.
            if (state.cameras.some(c => c.id === savedId)) await selectCamera(savedId, { force: true });
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    // ── Render ───────────────────────────────────────────────────────────

    // ── Lista compacta + inspector ──────────────────────────────────────
    // A diferencia del grid viejo, NINGUNA fila monta camera-card.js (eso
    // multiplicaba un stream+watcher por cámara aunque no se estuviera
    // viendo ninguna -- justo lo que pide evitar la sección de rendimiento
    // del pedido). El stream en vivo pesado vive UNA sola vez, en el
    // inspector de la cámara seleccionada (ver renderGeneralTab/cardInstance).

    function boundMachineCacheKey(camera) {
        return camera.bound_device ? `${camera.bound_device.type}::${camera.bound_device.id}` : null;
    }
    // Mismo join en cliente que ya usa camera-card.js (resolveBoundDeviceName)
    // -- backend no guarda el nombre legible, solo type+id crudos.
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

    const boundMachineNameCache = {};
    async function resolveBoundNameCached(camera) {
        const key = boundMachineCacheKey(camera);
        if (!key) return null;
        if (key in boundMachineNameCache) return boundMachineNameCache[key];
        const name = await resolveBoundDeviceName(camera.bound_device);
        boundMachineNameCache[key] = name;
        return name;
    }

    function filteredCameras() {
        const query = state.search.trim().toLowerCase();
        return state.cameras.filter(camera => {
            const health = state.healthById[camera.id];
            const disabled = camera.enabled === false;
            const online = !disabled && !!health?.online;
            if (state.statusFilter === 'online' && !online) return false;
            if (state.statusFilter === 'offline' && (disabled || online)) return false;
            if (state.statusFilter === 'disabled' && !disabled) return false;
            if (state.sourceFilter !== 'all' && deriveCameraType(camera) !== state.sourceFilter) return false;
            if (!query) return true;
            const boundName = camera.bound_device ? (boundMachineNameCache[boundMachineCacheKey(camera)] || '') : '';
            const haystack = [camera.name, camera.id, cameraTypeLabel(camera), boundName].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }

    function statusPillHtml(camera) {
        const health = state.healthById[camera.id];
        const disabled = camera.enabled === false;
        if (disabled) return `<span class="cv-status-pill is-disabled"><span class="cv-status-dot"></span>${tr('statusDisabledOption')}</span>`;
        if (!health) return `<span class="cv-status-pill is-unknown"><span class="cv-status-dot"></span>…</span>`;
        return health.online
            ? `<span class="cv-status-pill is-online"><span class="cv-status-dot"></span>${tr('statusOnlineOption')}</span>`
            : `<span class="cv-status-pill is-offline"><span class="cv-status-dot"></span>${tr('statusOfflineOption')}</span>`;
    }

    // Ícono de tipo (USB/RTSP/HTTP), no una foto en vivo: la tarjeta anterior
    // usaba <img src="camera.stream_url"> -- eso es un MJPEG en vivo, exactamente
    // el "poller por fila" que el pedido original prohibió. El mosaico
    // muestra estado real (state.healthById, poll centralizado) sin abrir
    // una conexión de stream por tarjeta.
    function cameraTypeIconBody(camera) {
        const type = deriveCameraType(camera);
        if (type === 'usb') return ICON_USB;
        if (type === 'rtsp') return ICON_VIDEO_CAM;
        return ICON_MONITOR;
    }

    function cameraMosaicCardHtml(camera) {
        const isSelected = camera.id === state.selectedCameraId;
        const boundKey = boundMachineCacheKey(camera);
        const boundName = boundKey ? boundMachineNameCache[boundKey] : null;
        if (boundKey && boundName === undefined) resolveBoundNameCached(camera).then(() => renderCameraList());
        return `
            <div class="cv-mosaic-card${isSelected ? ' selected' : ''}" data-cv-camera="${camera.id}">
                <div class="cv-mosaic-card-icon">${icon(cameraTypeIconBody(camera), 26)}</div>
                <div class="cv-mosaic-card-title" title="${esc(camera.name)}">${esc(camera.name)}</div>
                ${statusPillHtml(camera)}
                <div class="cv-mosaic-card-meta">
                    <span class="cv-row-type">${cameraTypeLabel(camera)}</span>
                    ${boundName ? `<span title="${esc(boundName)}">${icon(ICON_TARGET, 11)}${esc(boundName)}</span>` : ''}
                </div>
                <div class="cv-mosaic-card-actions">
                    <button type="button" class="cv-row-btn" data-cv-row-action="view" title="${tr('viewBtn')}">${icon(ICON_EYE, 14)}</button>
                    <button type="button" class="cv-row-btn" data-cv-row-action="edit" title="${tr('editBtn')}">${icon(ICON_EDIT, 14)}</button>
                    <button type="button" class="cv-row-btn" data-cv-row-action="duplicate" title="${tr('duplicateBtn')}">${icon(ICON_COPY, 14)}</button>
                    <button type="button" class="cv-row-btn cv-row-btn-danger" data-cv-row-action="delete" title="${tr('deleteBtn')}">${icon(ICON_TRASH, 14)}</button>
                </div>
            </div>`;
    }

    function renderCameraList() {
        const listEl = root.querySelector('#cv-list-rows');
        const countEl = root.querySelector('#cv-list-count');
        if (!listEl) return;
        if (countEl) countEl.textContent = state.cameras.length === 1 ? tr('cameraCountLabel') : tr('camerasCountLabel', { count: state.cameras.length });
        if (!state.cameras.length) {
            listEl.innerHTML = state.loading
                ? `<p class="cv-empty">${tr('loadingEllipsis')}</p>`
                : `<div class="cv-empty-state">${icon(ICON_CAMERA, 34)}<p>${tr('noCamerasRegistered')}</p><button type="button" class="cv-btn cv-btn-accent" id="cv-empty-add-btn">${icon(ICON_PLUS, 15)}<span>${tr('addFirstCameraBtn')}</span></button></div>`;
            return;
        }
        const rows = filteredCameras();
        listEl.innerHTML = rows.map(cameraMosaicCardHtml).join('') || `<p class="cv-empty">${tr('noCamerasYet')}</p>`;
    }

    // ── Timelapses guardados (mitad inferior del panel izquierdo, siempre de
    // la cámara seleccionada -- ver loadAssembledVideos/pollHealthOnce) ──
    function savedTimelapseRowHtml(camera, video) {
        return `
            <div class="cv-saved-tl-row" data-cv-video="${esc(video.filename)}">
                <div class="cv-saved-tl-main">
                    <strong>${esc(formatClock(video.timestamp))}</strong>
                    <span>${video.kind === 'gif' ? 'GIF' : 'MP4'} · ${formatBytes(video.size_bytes)}</span>
                </div>
                <div class="cv-saved-tl-actions">
                    <button type="button" class="cv-row-btn" data-cv-tl-action="view" title="${tr('viewBtn')}">${icon(ICON_PLAY, 13)}</button>
                    <a class="cv-row-btn" href="/api/cameras/${encodeURIComponent(camera.id)}/timelapse/videos/${encodeURIComponent(video.filename)}" download title="${tr('downloadBtn')}">${icon(ICON_DOWNLOAD, 13)}</a>
                    <button type="button" class="cv-row-btn cv-row-btn-danger" data-cv-tl-action="delete" title="${tr('deleteBtn')}">${icon(ICON_TRASH, 13)}</button>
                </div>
            </div>`;
    }

    function renderSavedTimelapsesList() {
        const listEl = root.querySelector('#cv-saved-timelapses');
        if (!listEl) return;
        const camera = selectedCamera();
        if (!camera) {
            listEl.innerHTML = `<p class="cv-empty">${tr('selectCameraHint')}</p>`;
            return;
        }
        const videos = state.assembledVideosByCameraId[camera.id];
        if (videos === undefined) {
            listEl.innerHTML = `<p class="cv-empty">${tr('loadingEllipsis')}</p>`;
            return;
        }
        listEl.innerHTML = videos.length
            ? videos.map(v => savedTimelapseRowHtml(camera, v)).join('')
            : `<p class="cv-empty">${tr('noVideosYetShort')}</p>`;
    }

    // ── Inspector ────────────────────────────────────────────────────────

    // Sin header propio arriba de las pestañas -- el nombre de la cámara ya
    // se ve en el formulario de la pestaña General y en el header interno
    // del gestor embebido en Timelapse; repetirlo acá era el título
    // duplicado que se comía alto sin aportar nada.
    function renderInspectorTabs() {
        const tabsEl = root.querySelector('#cv-inspector-tabs');
        if (!tabsEl) return;
        const tabs = [
            ['general', tr('tabGeneral'), ICON_INFO],
            ['timelapse', tr('tabTimelapse'), ICON_CLOCK],
        ];
        tabsEl.innerHTML = `
            <button type="button" class="cv-inspector-back" id="cv-inspector-back-btn" title="${esc(tr('backToListLabel'))}">${icon(ICON_ARROW_LEFT, 16)}</button>
            ${tabs.map(([id, label, iconBody]) => `<button type="button" class="cv-inspector-tab${state.inspectorTab === id ? ' active' : ''}" data-cv-inspector-tab="${id}">${icon(iconBody, 15)}<span>${esc(label)}</span></button>`).join('')}`;
    }

    // El mount de NopalCameraCard para el preview en vivo (renderGeneralTab)
    // sigue vivo (polling/stream) aunque su contenedor se destruya al
    // repintar el body del inspector con innerHTML -- sin este stop()
    // explícito antes de CADA repintado (cambio de cámara, de tab, o
    // volver a Información), quedaban instancias huérfanas corriendo para
    // siempre en segundo plano.
    function stopCardInstance() {
        if (cardInstance) { cardInstance.stop(); cardInstance = null; }
    }

    // El gestor de capturas/timelapse embebido en el tab Timelapse (ver
    // renderTimelapseTab) tiene su propio temporizador de reproducción --
    // mismo motivo que stopCardInstance(): innerHTML lo destruye del DOM
    // pero no detiene su JS por sí solo.
    function stopTimelapseEmbed() {
        if (timelapseEmbedHandle) { timelapseEmbedHandle.close(); timelapseEmbedHandle = null; }
    }

    // Antes "Información" y "Configuración" eran dos pestañas separadas que
    // repetían nombre/tipo/fuente/vínculo a máquina (una de solo lectura, la
    // otra editable) -- ahora es una sola pestaña de 2 columnas: izquierda
    // solo lectura (preview en vivo, estadísticas, ID/estado, activa/inactiva),
    // derecha el formulario editable. Nada se repite entre ambas.
    function renderGeneralTab(camera) {
        stopCardInstance();
        stopTimelapseEmbed();
        const body = root.querySelector('#cv-inspector-body');
        const stats = state.timelapseStatsById[camera.id];
        loadEditState(camera);
        body.innerHTML = `
            <div class="cv-general-columns">
                <div class="cv-general-col-view">
                    <div class="cv-info-preview" id="cv-info-preview-mount"></div>
                    <div class="cv-inspector-section">
                        <h3>${tr('statsTitle')}</h3>
                        <div class="cv-stats-row">
                            <div class="cv-stat-tile"><strong>${stats ? stats.frame_count.toLocaleString() : '—'}</strong><span>${tr('capturesStatLabel')}</span></div>
                            <div class="cv-stat-tile"><strong>${stats ? stats.assembled_count.toLocaleString() : '—'}</strong><span>${tr('timelapsesStatLabel')}</span></div>
                            <div class="cv-stat-tile"><strong>${stats ? formatBytes(stats.storage_used_bytes) : '—'}</strong><span>${tr('storageStatLabel')}</span></div>
                        </div>
                    </div>
                    <div class="cv-inspector-section">
                        <dl class="cv-dl">
                            <div><dt>ID</dt><dd class="cv-dl-mono">${esc(camera.id)}</dd></div>
                            <div><dt>${tr('statusFieldLabel')}</dt><dd>${statusPillHtml(camera)}</dd></div>
                        </dl>
                    </div>
                    <div class="cv-inspector-section cv-active-toggle">
                        <div><strong>${tr('cameraActiveTitle')}</strong><small>${tr('cameraActiveHint')}</small></div>
                        <label class="cv-switch"><input type="checkbox" id="cv-active-toggle-input" ${camera.enabled !== false ? 'checked' : ''}><span></span></label>
                    </div>
                </div>
                <div class="cv-general-col-edit">
                    <form class="cv-add-form cv-edit-form-body" id="cv-edit-form">
                        <div class="cv-field-group">
                            <span class="cv-field-label">${icon(ICON_TAG, 14)} ${tr('cameraNameUpper')}</span>
                            <div class="cv-input-icon">${icon(ICON_CAMERA, 16)}<input type="text" id="cv-edit-name-input" maxlength="60" required></div>
                            <p class="cv-field-hint">${tr('nameHelpsIdentify')}</p>
                        </div>
                        <div class="cv-field-group">
                            <span class="cv-field-label">${tr('typeFieldLabel')}</span>
                            <p class="cv-field-hint">${cameraTypeLabel(camera)} · ${esc(camera.device_path || camera.source_url || '—')}</p>
                        </div>
                        <hr class="cv-edit-divider">
                        <div id="cv-edit-purpose-section"></div>
                        <div class="cv-config-test-row">
                            <button type="button" class="cv-btn" id="cv-config-test-btn">${icon(ICON_REFRESH, 14)}<span>${tr('testConnectionBtn')}</span></button>
                        </div>
                        <div class="cv-edit-footer">
                            <button type="button" class="cv-btn" id="cv-config-cancel-btn">${icon(ICON_CLOSE, 15)}<span>${tr('cancelBtn')}</span></button>
                            <button type="submit" class="cv-btn cv-btn-accent" id="cv-edit-submit-btn">${icon(ICON_SAVE, 15)}<span>${tr('saveChangesBtn')}</span></button>
                        </div>
                    </form>
                </div>
            </div>`;
        renderEditPanel();

        const mountEl = body.querySelector('#cv-info-preview-mount');
        if (mountEl && window.NopalCameraCard) {
            cardInstance = window.NopalCameraCard.mount(mountEl, { cameraId: camera.id, compact: true });
        }
    }

    // El tab Timelapse no muestra un resumen con botón "Administrar": el
    // gestor completo (visor, editar, juntar, videos armados) se embebe
    // directo aquí vía window.NopalCameraCard.openCaptures(id, container) --
    // mismo gestor que antes vivía en un modal, ahora inline en el inspector.
    // Barra de estado + pausar/reanudar -- controles reales del timelapse
    // DENTRO del plugin (antes solo existían, a medias, en la ficha
    // compacta del dashboard). "Activar" el timelapse (el interruptor que
    // de verdad arranca la captura) vive en General -- acá solo pausa/
    // reanuda uno que ya está activo, por eso el botón queda deshabilitado
    // con un atajo a General cuando no lo está.
    function timelapseStatusBarHtml(camera) {
        const stats = state.timelapseStatsById[camera.id];
        if (!stats) return `<div class="cv-timelapse-status-bar"><span>${tr('loadingEllipsis')}</span></div>`;
        if (!stats.enabled) {
            return `
                <div class="cv-timelapse-status-bar">
                    <span class="cv-status-pill is-disabled"><span class="cv-status-dot"></span>${tr('timelapseStateOff')}</span>
                    <span class="cv-timelapse-status-hint">${tr('timelapseOffHint')}</span>
                    <button type="button" class="cv-btn cv-btn-accent" id="cv-goto-general-btn">${tr('goToGeneralBtn')}</button>
                </div>`;
        }
        const paused = !!stats.paused;
        return `
            <div class="cv-timelapse-status-bar">
                <span class="cv-status-pill ${paused ? 'is-disabled' : 'is-online'}"><span class="cv-status-dot"></span>${paused ? tr('timelapseStatePaused') : tr('timelapseStateActive')}</span>
                <span class="cv-timelapse-status-hint">${tr('capturesStatLabel')}: ${stats.frame_count.toLocaleString()}</span>
                <button type="button" class="cv-btn" id="cv-timelapse-pause-btn" data-cv-paused="${paused ? 'true' : 'false'}">${icon(paused ? ICON_PLAY : ICON_PAUSE, 14)}<span>${paused ? tr('resumeTimelapseBtn') : tr('pauseTimelapseBtn')}</span></button>
            </div>`;
    }

    async function renderTimelapseTab(camera) {
        stopCardInstance();
        stopTimelapseEmbed();
        const body = root.querySelector('#cv-inspector-body');
        body.innerHTML = `
            <div id="cv-timelapse-status-mount">${timelapseStatusBarHtml(camera)}</div>
            <div class="cv-timelapse-embed-mount" id="cv-timelapse-embed-mount"></div>`;
        const mountEl = body.querySelector('#cv-timelapse-embed-mount');
        const handle = await window.NopalCameraCard.openCaptures(camera.id, mountEl);
        if (state.selectedCameraId !== camera.id || state.inspectorTab !== 'timelapse') {
            handle?.close();
            return;
        }
        timelapseEmbedHandle = handle || null;
    }

    function renderInspector() {
        const panel = root.querySelector('#cv-inspector-panel');
        const camera = selectedCamera();
        renderInspectorTabs();
        panel.classList.toggle('is-empty', !camera);
        if (!camera) {
            stopCardInstance();
            stopTimelapseEmbed();
            root.querySelector('#cv-inspector-body').innerHTML = `<div class="cv-empty-state">${icon(ICON_CAMERA, 34)}<p>${tr('selectCameraHint')}</p></div>`;
            return;
        }
        if (state.inspectorTab === 'general') renderGeneralTab(camera);
        else if (state.inspectorTab === 'timelapse') renderTimelapseTab(camera);
    }

    function render() {
        renderCameraList();
        renderInspector();
        renderSavedTimelapsesList();
    }

    function switchAddTab(tab) {
        root.querySelectorAll('[data-cv-add-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.cvAddTab === tab));
        root.querySelector('#cv-add-form-url').hidden = tab !== 'url';
        root.querySelector('#cv-add-form-onvif').hidden = tab !== 'onvif';
        root.querySelector('#cv-add-form-usb').hidden = tab !== 'usb';
        if (tab === 'usb') loadUsbDevices();
    }

    function openAddPanel() {
        root.querySelector('#cv-add-panel').hidden = false;
    }
    function resetUsbState() {
        usbState.devices = [];
        usbState.loadingDevices = false;
        usbState.selectedDevice = null;
        usbState.purpose = 'monitoring';
        usbState.boundType = '';
        usbState.boundId = '';
        usbState.boundOptions = [];
        usbState.loadingBoundOptions = false;
        usbState.prefillName = '';
    }
    function closeAddPanel() {
        root.querySelector('#cv-add-panel').hidden = true;
        root.querySelector('#cv-add-form-url').reset();
        root.querySelector('#cv-add-form-onvif').reset();
        resetUsbState();
        renderUsbTab();
        switchAddTab('url');
    }

    function moduleHtml() {
        return `
            <section id="camera-viewer-section" class="view-section cv-section" style="display:none">
                <header class="cv-header">
                    <div class="cv-header-icon">${icon(ICON_CAMERA, 30)}</div>
                    <div class="cv-header-copy">
                        <h1>${tr('pageTitle')}</h1>
                        <span class="cv-header-sub">NOPAL Labs · v${PLUGIN_VERSION}</span>
                    </div>
                    <button type="button" class="cv-btn cv-btn-accent" id="cv-add-btn">${icon(ICON_PLUS, 16)}<span>${tr('addCameraBtn')}</span></button>
                </header>

                <div class="cv-layout">
                    <div class="cv-list-panel">
                        <div class="cv-list-panel-top">
                            <div class="cv-list-panel-title"><strong>${tr('pageTitle')}</strong><span class="cv-status-pill" id="cv-list-count"></span></div>
                            <label class="cv-search"><span>${icon(ICON_SEARCH, 14)}</span><input type="search" id="cv-search-input" placeholder="${esc(tr('searchCameraPlaceholder'))}"></label>
                            <div class="cv-filters-row">
                                <select id="cv-status-filter">
                                    <option value="all">${tr('statusAllOption')}</option>
                                    <option value="online">${tr('statusOnlineOption')}</option>
                                    <option value="offline">${tr('statusOfflineOption')}</option>
                                    <option value="disabled">${tr('statusDisabledOption')}</option>
                                </select>
                                <select id="cv-source-filter">
                                    <option value="all">${tr('sourceAllOption')}</option>
                                    <option value="usb">${tr('sourceUsbOption')}</option>
                                    <option value="rtsp">${tr('sourceRtspOption')}</option>
                                    <option value="http">${tr('sourceHttpOption')}</option>
                                </select>
                                <button type="button" class="cv-icon-btn" id="cv-refresh-btn" title="${tr('searchAgainTitle')}">${icon(ICON_REFRESH, 14)}</button>
                            </div>
                            <div class="cv-mosaic-grid" id="cv-list-rows"></div>
                        </div>
                        <div class="cv-list-panel-bottom">
                            <div class="cv-list-panel-title"><strong>${tr('savedTimelapsesTitle')}</strong></div>
                            <div class="cv-saved-timelapses" id="cv-saved-timelapses"></div>
                        </div>
                    </div>
                    <div class="cv-inspector-panel" id="cv-inspector-panel">
                        <nav class="cv-inspector-tabs" id="cv-inspector-tabs"></nav>
                        <div class="cv-inspector-body" id="cv-inspector-body"></div>
                    </div>
                </div>

                <div class="cv-panel-overlay" id="cv-add-panel" hidden>
                    <div class="cv-panel-backdrop" data-cv-close-add></div>
                    <div class="cv-panel-dialog">
                        <div class="cv-panel-header"><span><strong>${tr('addCameraTitle')}</strong><small>${tr('addCameraHint')}</small></span><button type="button" data-cv-close-add>${icon(ICON_CLOSE, 16)}</button></div>
                        <div class="cv-add-tabs">
                            <button type="button" class="cv-add-tab active" data-cv-add-tab="url">${tr('tabUrlDirect')}</button>
                            <button type="button" class="cv-add-tab" data-cv-add-tab="onvif">${tr('tabOnvif')}</button>
                            <button type="button" class="cv-add-tab" data-cv-add-tab="usb">${icon(ICON_USB, 14)}<span>${tr('tabUsb')}</span></button>
                        </div>
                        <form class="cv-add-form" id="cv-add-form-url">
                            <label><span>${tr('nameLabel')}</span><input type="text" name="name" maxlength="60" placeholder="${tr('exampleCameraBed')}" required></label>
                            <label><span>${tr('streamUrlLabel')}</span><input type="text" name="stream_url" placeholder="${tr('streamUrlPlaceholder')}" required></label>
                            <div class="cv-panel-actions"><button type="button" data-cv-close-add>${tr('cancelBtn')}</button><button type="submit" class="cv-btn-accent">${tr('addBtn')}</button></div>
                        </form>
                        <form class="cv-add-form" id="cv-add-form-onvif" hidden>
                            <label><span>${tr('nameLabel')}</span><input type="text" name="name" maxlength="60" placeholder="${tr('exampleCameraBed')}" required></label>
                            <label><span>${tr('cameraIpLabel')}</span><input type="text" name="host" placeholder="192.168.1.50"></label>
                            <label><span>${tr('onvifPortLabel')} <small>${tr('onvifPortHint')}</small></span><input type="number" name="port" min="1" max="65535" placeholder="${tr('autoDetectPlaceholder')}"></label>
                            <p class="cv-onvif-or">${tr('onvifOrDivider')}</p>
                            <label><span>${tr('onvifFullUrlLabel')} <small>${tr('onvifFullUrlHint')}</small></span><input type="text" name="onvif_url" placeholder="http://192.168.1.50:8899/onvif/device_service"></label>
                            <label><span>${tr('usernameLabel')}</span><input type="text" name="username" placeholder="admin" required></label>
                            <label><span>${tr('passwordLabel')}</span><input type="password" name="password" required></label>
                            <div class="cv-panel-actions"><button type="button" data-cv-close-add>${tr('cancelBtn')}</button><button type="submit" class="cv-btn-accent" id="cv-add-onvif-submit-btn">${tr('connectBtn')}</button></div>
                        </form>
                        <div class="cv-add-form" id="cv-add-form-usb" hidden>
                            <div class="cv-usb-list-header">
                                <span>${tr('webcamsDetected')}</span>
                                <button type="button" class="cv-icon-btn" id="cv-usb-rescan-btn" title="${tr('searchAgainTitle')}">${icon(ICON_REFRESH, 14)}</button>
                            </div>
                            <div id="cv-usb-device-list" class="cv-usb-device-list"></div>
                            <div id="cv-usb-detail" hidden></div>
                            <div class="cv-panel-actions"><button type="button" data-cv-close-add>${tr('cancelBtn')}</button><button type="button" class="cv-btn-accent" id="cv-add-usb-submit-btn" disabled>${tr('addBtn')}</button></div>
                        </div>
                    </div>
                </div>

                <div class="cv-panel-overlay" id="cv-delete-panel" hidden>
                    <div class="cv-panel-backdrop" data-cv-close-delete></div>
                    <div class="cv-panel-dialog cv-delete-dialog">
                        <div class="cv-panel-header"><span><strong id="cv-delete-panel-title"></strong></span><button type="button" data-cv-close-delete>${icon(ICON_CLOSE, 16)}</button></div>
                        <p id="cv-delete-panel-body" class="cv-field-hint"></p>
                        <div class="cv-panel-actions cv-delete-actions">
                            <button type="button" data-cv-close-delete>${tr('cancelBtn')}</button>
                            <button type="button" class="cv-btn" id="cv-delete-only-btn">${tr('deleteCameraOnlyBtn')}</button>
                            <button type="button" class="cv-btn cv-btn-danger" id="cv-delete-with-files-btn">${icon(ICON_TRASH, 14)}<span>${tr('deleteCameraWithFilesBtn')}</span></button>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    function bindEvents() {
        root.querySelector('#cv-add-btn').addEventListener('click', openAddPanel);
        root.querySelectorAll('[data-cv-close-add]').forEach(el => el.addEventListener('click', closeAddPanel));
        root.querySelectorAll('[data-cv-add-tab]').forEach(btn => btn.addEventListener('click', () => switchAddTab(btn.dataset.cvAddTab)));
        root.querySelector('#cv-add-form-url').addEventListener('submit', addCamera);
        root.querySelector('#cv-add-form-onvif').addEventListener('submit', addCameraOnvif);

        const usbForm = root.querySelector('#cv-add-form-usb');
        usbForm.querySelector('#cv-usb-device-list').addEventListener('click', event => {
            const btn = event.target.closest('[data-cv-usb-device]:not([disabled])');
            if (!btn) return;
            const device = usbState.devices.find(d => d.device_path === btn.dataset.cvUsbDevice);
            if (device) selectUsbDevice(device);
        });
        usbForm.addEventListener('change', event => {
            if (event.target.name === 'cv-usb-purpose') {
                usbState.purpose = event.target.value;
                renderUsbTab();
                return;
            }
            if (event.target.id === 'cv-usb-bound-select') {
                const [type, id] = (event.target.value || '').split('::');
                usbState.boundType = type || '';
                usbState.boundId = id || '';
                updateUsbSubmitEnabled();
            }
        });
        usbForm.querySelector('#cv-add-usb-submit-btn').addEventListener('click', submitUsbRegistration);
        usbForm.querySelector('#cv-usb-rescan-btn').addEventListener('click', loadUsbDevices);

        // ── Lista: búsqueda/filtros/refrescar ──
        root.querySelector('#cv-search-input').addEventListener('input', event => { state.search = event.target.value; renderCameraList(); });
        root.querySelector('#cv-status-filter').addEventListener('change', event => { state.statusFilter = event.target.value; renderCameraList(); });
        root.querySelector('#cv-source-filter').addEventListener('change', event => { state.sourceFilter = event.target.value; renderCameraList(); });
        root.querySelector('#cv-refresh-btn').addEventListener('click', refreshAll);

        // ── Fila de la lista: seleccionar / acciones rápidas ──
        root.querySelector('#cv-list-rows').addEventListener('click', async event => {
            if (event.target.closest('#cv-empty-add-btn')) { openAddPanel(); return; }
            const rowAction = event.target.closest('[data-cv-row-action]');
            const row = event.target.closest('[data-cv-camera]');
            if (!row) return;
            const camera = state.cameras.find(c => c.id === row.dataset.cvCamera);
            if (!camera) return;
            if (!rowAction) { await selectCamera(camera.id); return; }
            const action = rowAction.dataset.cvRowAction;
            if (action === 'view' || action === 'edit') { await selectCamera(camera.id); state.inspectorTab = 'general'; renderInspector(); }
            else if (action === 'duplicate') { await duplicateCamera(camera); }
            else if (action === 'delete') { await selectCamera(camera.id); await deleteCameraFlow(camera); }
        });

        // ── Timelapses guardados (mitad inferior del panel izquierdo) ──
        root.querySelector('#cv-saved-timelapses').addEventListener('click', async event => {
            const actionBtn = event.target.closest('[data-cv-tl-action]');
            if (!actionBtn) return;
            const rowEl = event.target.closest('[data-cv-video]');
            const camera = selectedCamera();
            if (!rowEl || !camera) return;
            const filename = rowEl.dataset.cvVideo;
            const action = actionBtn.dataset.cvTlAction;
            if (action === 'view') {
                state.inspectorTab = 'timelapse';
                renderInspector();
            } else if (action === 'delete') {
                if (!(await confirmDialog(tr('confirmDeleteVideo', { name: filename })))) return;
                try {
                    await api(`/api/cameras/${camera.id}/timelapse/videos/${encodeURIComponent(filename)}`, { method: 'DELETE' });
                    await Promise.all([
                        loadAssembledVideos(camera.id, { quiet: true }),
                        loadTimelapseStats(camera.id, { quiet: true }),
                    ]);
                    renderSavedTimelapsesList();
                } catch (error) {
                    toast(error.message, 'error');
                }
            }
        });

        // ── Inspector: volver a la lista (drawer móvil) ──
        root.querySelector('#cv-inspector-tabs').addEventListener('click', async event => {
            if (event.target.closest('#cv-inspector-back-btn')) {
                if (state.configDirty && !(await confirmDialog(tr('unsavedChangesConfirm')))) return;
                state.configDirty = false;
                state.selectedCameraId = null;
                render();
                return;
            }
            const tabBtn = event.target.closest('[data-cv-inspector-tab]');
            if (!tabBtn) return;
            const nextTab = tabBtn.dataset.cvInspectorTab;
            if (state.inspectorTab === 'general' && nextTab !== 'general' && state.configDirty) {
                if (!(await confirmDialog(tr('unsavedChangesConfirm')))) return;
                state.configDirty = false;
            }
            state.inspectorTab = nextTab;
            renderInspector();
        });

        // ── Inspector: tab Información (cámara activa) ──
        root.querySelector('#cv-inspector-body').addEventListener('change', event => {
            if (event.target.id === 'cv-active-toggle-input') {
                const camera = selectedCamera();
                if (camera) toggleCameraEnabled(camera, event.target.checked);
                return;
            }
            if (event.target.name === 'cv-edit-purpose') {
                editState.purpose = event.target.value;
                state.configDirty = true;
                renderEditPanel();
                return;
            }
            if (event.target.id === 'cv-edit-timelapse-enabled-input') {
                editState.timelapseEnabled = event.target.checked;
                state.configDirty = true;
                return;
            }
            if (event.target.id === 'cv-edit-bound-select') {
                const [type, id] = (event.target.value || '').split('::');
                editState.boundType = type || '';
                editState.boundId = id || '';
                state.configDirty = true;
                return;
            }
            if (event.target.id === 'cv-edit-interval-input') {
                editState.intervalS = Number(event.target.value) || editState.intervalS;
                state.configDirty = true;
                return;
            }
            if (event.target.id === 'cv-edit-fps-input') {
                editState.fps = Number(event.target.value) || editState.fps;
                state.configDirty = true;
                return;
            }
            if (event.target.id === 'cv-edit-name-input' || event.target.id === 'cv-edit-note-input') {
                state.configDirty = true;
            }
        });
        root.querySelector('#cv-inspector-body').addEventListener('input', event => {
            if (event.target.id === 'cv-edit-name-input') state.configDirty = true;
        });

        // ── Inspector: tab Configuración (pasos de intervalo/fps, probar
        // conexión, guardar/cancelar) ──
        root.querySelector('#cv-inspector-body').addEventListener('click', async event => {
            const stepBtn = event.target.closest('[data-cv-step]');
            if (stepBtn) {
                const dir = Number(stepBtn.dataset.cvStepDir);
                const field = stepBtn.dataset.cvStep === 'interval' ? 'intervalS' : 'fps';
                const inputId = stepBtn.dataset.cvStep === 'interval' ? 'cv-edit-interval-input' : 'cv-edit-fps-input';
                editState[field] = Math.max(1, (editState[field] || 0) + dir);
                state.configDirty = true;
                const input = root.querySelector(`#${inputId}`);
                if (input) input.value = editState[field];
                return;
            }
            if (event.target.closest('#cv-config-test-btn')) {
                const camera = selectedCamera();
                if (camera) await testConnection(camera);
                return;
            }
            if (event.target.closest('#cv-config-cancel-btn')) {
                state.configDirty = false;
                renderInspector();
                return;
            }
            if (event.target.closest('#cv-goto-general-btn')) {
                state.inspectorTab = 'general';
                renderInspector();
                return;
            }
            const pauseBtn = event.target.closest('#cv-timelapse-pause-btn');
            if (pauseBtn) {
                const camera = selectedCamera();
                if (!camera) return;
                const endpoint = pauseBtn.dataset.cvPaused === 'true' ? 'resume' : 'pause';
                pauseBtn.disabled = true;
                try {
                    await api(`/api/cameras/${camera.id}/timelapse/${endpoint}`, { method: 'POST' });
                    await loadTimelapseStats(camera.id, { quiet: true });
                    const statusMount = root.querySelector('#cv-timelapse-status-mount');
                    if (statusMount) statusMount.innerHTML = timelapseStatusBarHtml(camera);
                } catch (error) {
                    toast(error.message, 'error');
                    pauseBtn.disabled = false;
                }
                return;
            }
        });
        root.querySelector('#cv-inspector-body').addEventListener('submit', event => {
            if (event.target.id === 'cv-edit-form') submitCameraEdit(event);
        });

        // ── Eliminar (con o sin archivos) ──
        root.querySelectorAll('[data-cv-close-delete]').forEach(el => el.addEventListener('click', () => { root.querySelector('#cv-delete-panel').hidden = true; }));
        root.querySelector('#cv-delete-only-btn').addEventListener('click', () => {
            const id = root.querySelector('#cv-delete-panel').dataset.cvDeleteCamera;
            if (id) performDelete(id, false);
        });
        root.querySelector('#cv-delete-with-files-btn').addEventListener('click', () => {
            const id = root.querySelector('#cv-delete-panel').dataset.cvDeleteCamera;
            if (id) performDelete(id, true);
        });
    }

    function mount() {
        if (document.getElementById('camera-viewer-section')) return;
        const pluginsContainer = document.querySelector('.nav-category[data-group="plugins"] .nav-category-items');
        const navButton = document.createElement('button');
        navButton.type = 'button';
        navButton.className = 'nav-item';
        navButton.dataset.section = 'camera-viewer';
        navButton.dataset.pluginNav = PLUGIN_ID;
        navButton.title = tr('pageTitle');
        navButton.innerHTML = `${icon(ICON_CAMERA, 20)}<span>${esc(tr('pageTitle'))}</span>`;
        navButton.addEventListener('click', () => window.switchSection?.('camera-viewer'));
        pluginsContainer?.appendChild(navButton);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = moduleHtml();
        root = wrapper.firstElementChild;
        const content = document.querySelector('.content');
        content?.insertBefore(root, document.getElementById('gcode-editor-section'));

        bindEvents();
        refreshAll();
        ensureHealthPolling();
        window.applySidebarOrder?.();
    }

    function unmount() {
        document.querySelector(`[data-plugin-nav="${PLUGIN_ID}"]`)?.remove();
        document.getElementById('camera-viewer-section')?.remove();
        if (healthPollTimer) { clearInterval(healthPollTimer); healthPollTimer = null; }
        stopCardInstance();
        stopTimelapseEmbed();
        root = null;
    }

    // NOPAL core dispara este evento al cambiar de idioma (ver setLanguage()
    // en translations.js) -- sin esto, la ficha ya montada se quedaba en el
    // idioma con el que abrió hasta navegar a otra sección y volver (issue
    // #50). render() (renderGrid) asume `root` montado, por eso el guard
    // acá en vez de adentro.
    window.addEventListener('nopal:language-changed', () => { if (root) render(); });

    window.NopalPluginRegistry = window.NopalPluginRegistry || {};
    window.NopalPluginRegistry[PLUGIN_ID] = { mount, unmount, version: PLUGIN_VERSION };
    mount();
})();
