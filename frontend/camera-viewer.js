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
        cardScript.src = '/plugins-static/camera-viewer/frontend/camera-card.js?v=1.4.0';
        document.body.appendChild(cardScript);
    }

    const state = {
        cameras: [],   // /api/cameras
        loading: false,
        gridLayout: localStorage.getItem('cv-grid-layout') || '2x2',
    };

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
    const ICON_GRID_1 = '<rect x="4" y="4" width="16" height="16" rx="2"/>';
    const ICON_GRID_2 = '<rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/>';
    const ICON_GRID_3 = '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="9.5" y="3" width="5" height="18" rx="1"/><rect x="16" y="3" width="5" height="18" rx="1"/>';
    const ICON_REFRESH = '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>';

    const esc = value => typeof window.escapeHtml === 'function' ? window.escapeHtml(value) : String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    const toast = (message, tone = 'success') => typeof window.showToast === 'function' ? window.showToast(message, tone) : console.log(message);
    const confirmDialog = (message, title = '') => typeof window.appConfirm === 'function' ? window.appConfirm(message, title) : Promise.resolve(window.confirm(message));

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
        } catch (error) {
            toast(error.message, 'error');
        }
        state.loading = false;
        render();
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
        try {
            await api('/api/cameras/remove', { method: 'POST', body: new URLSearchParams({ id: camera.id }) });
            await refreshAll();
        } catch (error) {
            toast(error.message, 'error');
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
            <label><span>${tr('nameLabel')}</span><input type="text" id="cv-usb-name-input" maxlength="60" value="${esc(device.name)}"></label>
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

    function renderEditPanel() {
        const nameInput = root.querySelector('#cv-edit-name-input');
        if (nameInput && document.activeElement !== nameInput) nameInput.value = editState.name;
        const purposeSection = root.querySelector('#cv-edit-purpose-section');
        if (purposeSection) purposeSection.innerHTML = renderEditPurposeHtml();
        if (editState.purpose === 'timelapse' && !editState.boundOptions.length && !editState.loadingBoundOptions) {
            loadBoundDeviceOptions(editState, renderEditPanel);
        }
    }

    function openEditPanel(camera) {
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
        editState.boundOptions = [];
        editState.loadingBoundOptions = false;
        root.querySelector('#cv-edit-panel').hidden = false;
        renderEditPanel();
    }

    function closeEditPanel() {
        root.querySelector('#cv-edit-panel').hidden = true;
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
                    body: new URLSearchParams({ interval_s: editState.intervalS, fps: editState.fps }),
                });
            }
            closeEditPanel();
            toast(tr('cameraUpdated', { name }));
            await refreshAll();
        } catch (error) {
            toast(error.message, 'error');
        } finally {
            submitBtn.disabled = false;
        }
    }

    // ── Render ───────────────────────────────────────────────────────────

    function watchStream(img) {
        const baseSrc = img.src;
        const scheduleRetry = () => {
            if (!document.body.contains(img)) return;
            setTimeout(() => {
                if (!document.body.contains(img)) return;
                const separator = baseSrc.includes('?') ? '&' : '?';
                img.src = `${baseSrc}${separator}_retry=${Date.now()}`;
            }, 5000);
        };
        img.addEventListener('error', () => {
            img.closest('.cv-card')?.classList.add('is-offline');
            scheduleRetry();
        });
        img.addEventListener('load', () => {
            img.closest('.cv-card')?.classList.remove('is-offline');
        });
    }

    // Cada cámara de la galería propia del plugin muestra la tarjeta
    // completa (timelapse/grabación/enfoque/detección de movimiento/galería
    // de capturas -- ver camera-card.js), no solo la vista en vivo chica que
    // se usa cuando esta misma tarjeta se embebe en el panel de una máquina.
    // Eliminar la cámara vive en el popup "Configurar cámara" (junto a
    // Cancelar/Guardar), no como ícono suelto sobre la tarjeta -- y el
    // engranaje de dentro de la tarjeta completa abre ese mismo popup en vez
    // de "navegar" a esta sección (ya estamos acá).
    function renderGrid() {
        const grid = root.querySelector('#cv-grid');
        if (!state.cameras.length) {
            grid.innerHTML = `<p class="cv-empty">${state.loading ? tr('loadingEllipsis') : tr('noCamerasYet')}</p>`;
            return;
        }
        grid.innerHTML = state.cameras.map(camera => `
            <div class="cv-card cv-card-full" data-cv-camera="${camera.id}">
                <div class="cv-camera-full-mount" id="cv-full-mount-${camera.id}"></div>
            </div>`).join('');
        if (!window.NopalCameraCard) return;
        state.cameras.forEach(camera => {
            const mountEl = grid.querySelector(`#cv-full-mount-${camera.id}`);
            if (mountEl) window.NopalCameraCard.mount(mountEl, { cameraId: camera.id, compact: false, onSettingsClick: () => openEditPanel(camera) });
        });
    }

    function render() {
        renderGrid();
    }

    function setLayout(mode) {
        state.gridLayout = mode;
        localStorage.setItem('cv-grid-layout', mode);
        const grid = root.querySelector('#cv-grid');
        if (grid) grid.className = `cv-grid cv-grid-${mode}`;
        root.querySelectorAll('[data-cv-layout]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cvLayout === mode);
        });
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
    }
    function closeAddPanel() {
        root.querySelector('#cv-add-panel').hidden = true;
        root.querySelector('#cv-add-form-url').reset();
        root.querySelector('#cv-add-form-onvif').reset();
        resetUsbState();
        renderUsbTab();
        switchAddTab('url');
    }

    function openLightbox(camera) {
        root.querySelector('#cv-lightbox-title').textContent = camera.name;
        root.querySelector('#cv-lightbox-img').src = camera.stream_url;
        root.querySelector('#cv-lightbox').hidden = false;
    }
    function closeLightbox() {
        root.querySelector('#cv-lightbox').hidden = true;
        // Corta la conexión del stream grande al cerrar -- un MJPEG queda
        // abierto indefinidamente si no se le vacía el src.
        root.querySelector('#cv-lightbox-img').src = '';
    }

    function moduleHtml() {
        return `
            <section id="camera-viewer-section" class="view-section cv-section" style="display:none">
                <div class="cv-scroll">
                    <header class="cv-header">
                        <div class="cv-header-icon">${icon(ICON_CAMERA, 30)}</div>
                        <div class="cv-header-copy">
                            <h1>${tr('pageTitle')}</h1>
                            <span class="cv-header-sub">NOPAL Labs · v${PLUGIN_VERSION}</span>
                        </div>
                        <div class="cv-layout-switch">
                            <button type="button" class="cv-icon-btn${state.gridLayout === '1x1' ? ' active' : ''}" data-cv-layout="1x1" title="${tr('layout1PerRow')}">${icon(ICON_GRID_1, 15)}</button>
                            <button type="button" class="cv-icon-btn${state.gridLayout === '2x2' ? ' active' : ''}" data-cv-layout="2x2" title="${tr('layout2PerRow')}">${icon(ICON_GRID_2, 15)}</button>
                            <button type="button" class="cv-icon-btn${state.gridLayout === '3x3' ? ' active' : ''}" data-cv-layout="3x3" title="${tr('layout3PerRow')}">${icon(ICON_GRID_3, 15)}</button>
                        </div>
                        <button type="button" class="cv-btn cv-btn-accent" id="cv-add-btn">${icon(ICON_PLUS, 16)}<span>${tr('addCameraBtn')}</span></button>
                    </header>

                    <div class="cv-grid cv-grid-${state.gridLayout}" id="cv-grid"></div>
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

                <div class="cv-panel-overlay" id="cv-edit-panel" hidden>
                    <div class="cv-panel-backdrop" data-cv-close-edit></div>
                    <div class="cv-panel-dialog cv-edit-dialog">
                        <div class="cv-edit-header">
                            <div class="cv-edit-header-icon">${icon(ICON_CAMERA, 24)}</div>
                            <div class="cv-edit-header-copy">
                                <strong>${tr('configureCameraTitle')}</strong>
                                <span>${tr('configureCameraSubtitle')}</span>
                            </div>
                            <button type="button" class="cv-icon-btn cv-edit-close-btn" data-cv-close-edit>${icon(ICON_CLOSE, 16)}</button>
                        </div>
                        <form class="cv-add-form cv-edit-form-body" id="cv-edit-form">
                            <div class="cv-field-group">
                                <span class="cv-field-label">${icon(ICON_TAG, 14)} ${tr('cameraNameUpper')}</span>
                                <div class="cv-input-icon">
                                    ${icon(ICON_CAMERA, 16)}
                                    <input type="text" id="cv-edit-name-input" maxlength="60" required>
                                </div>
                                <p class="cv-field-hint">${tr('nameHelpsIdentify')}</p>
                            </div>
                            <hr class="cv-edit-divider">
                            <div id="cv-edit-purpose-section"></div>
                            <div class="cv-edit-footer">
                                <button type="button" class="cv-btn cv-btn-danger" id="cv-edit-delete-btn">${icon(ICON_TRASH, 15)}<span>${tr('deleteCameraLabel')}</span></button>
                                <div class="cv-edit-footer-actions">
                                    <button type="button" class="cv-btn" data-cv-close-edit>${icon(ICON_CLOSE, 15)}<span>${tr('cancelBtn')}</span></button>
                                    <button type="submit" class="cv-btn cv-btn-accent" id="cv-edit-submit-btn">${icon(ICON_SAVE, 15)}<span>${tr('saveBtn')}</span></button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="cv-panel-overlay" id="cv-lightbox" hidden>
                    <div class="cv-panel-backdrop" data-cv-close-lightbox></div>
                    <div class="cv-lightbox-dialog">
                        <div class="cv-lightbox-header">
                            <strong id="cv-lightbox-title"></strong>
                            <button type="button" data-cv-close-lightbox>${icon(ICON_CLOSE, 18)}</button>
                        </div>
                        <img id="cv-lightbox-img" class="cv-lightbox-img" alt="">
                    </div>
                </div>
            </section>`;
    }

    function bindEvents() {
        root.querySelectorAll('[data-cv-layout]').forEach(btn => btn.addEventListener('click', () => setLayout(btn.dataset.cvLayout)));
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
        root.querySelectorAll('[data-cv-close-lightbox]').forEach(el => el.addEventListener('click', closeLightbox));
        root.querySelectorAll('[data-cv-close-edit]').forEach(el => el.addEventListener('click', closeEditPanel));
        root.querySelector('#cv-edit-form').addEventListener('submit', submitCameraEdit);
        root.querySelector('#cv-edit-purpose-section').addEventListener('change', event => {
            if (event.target.name === 'cv-edit-purpose') {
                editState.purpose = event.target.value;
                renderEditPanel();
                return;
            }
            if (event.target.id === 'cv-edit-bound-select') {
                const [type, id] = (event.target.value || '').split('::');
                editState.boundType = type || '';
                editState.boundId = id || '';
                return;
            }
            if (event.target.id === 'cv-edit-interval-input') {
                editState.intervalS = Number(event.target.value) || editState.intervalS;
                return;
            }
            if (event.target.id === 'cv-edit-fps-input') {
                editState.fps = Number(event.target.value) || editState.fps;
            }
        });
        root.querySelector('#cv-edit-purpose-section').addEventListener('click', event => {
            const stepBtn = event.target.closest('[data-cv-step]');
            if (!stepBtn) return;
            const dir = Number(stepBtn.dataset.cvStepDir);
            const field = stepBtn.dataset.cvStep === 'interval' ? 'intervalS' : 'fps';
            const inputId = stepBtn.dataset.cvStep === 'interval' ? 'cv-edit-interval-input' : 'cv-edit-fps-input';
            editState[field] = Math.max(1, (editState[field] || 0) + dir);
            const input = root.querySelector(`#${inputId}`);
            if (input) input.value = editState[field];
        });
        root.querySelector('#cv-grid').addEventListener('click', event => {
            // La tarjeta completa (ver camera-card.js) maneja sus propios
            // clics -- botones, toggles, el slider de enfoque -- así que un
            // clic ahí adentro nunca debe además abrir el lightbox de acá.
            if (event.target.closest('.cam-card')) return;
            const card = event.target.closest('.cv-card');
            if (!card) return;
            const camera = state.cameras.find(item => item.id === card.dataset.cvCamera);
            if (camera) openLightbox(camera);
        });
        root.querySelector('#cv-edit-delete-btn').addEventListener('click', async () => {
            const camera = state.cameras.find(item => item.id === editState.cameraId);
            if (!camera) return;
            await removeCamera(camera);
            // removeCamera ya confirma con el usuario -- si canceló, la
            // cámara sigue en state.cameras y closeEditPanel() de más no
            // hace daño; si la borró, el popup ya no tiene nada que mostrar.
            closeEditPanel();
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
        window.applySidebarOrder?.();
    }

    function unmount() {
        document.querySelector(`[data-plugin-nav="${PLUGIN_ID}"]`)?.remove();
        document.getElementById('camera-viewer-section')?.remove();
        root = null;
    }

    window.NopalPluginRegistry = window.NopalPluginRegistry || {};
    window.NopalPluginRegistry[PLUGIN_ID] = { mount, unmount, version: PLUGIN_VERSION };
    mount();
})();
