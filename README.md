# Cámaras (plugin de NOPAL)

Agrega cámaras a [NOPAL](https://github.com/charlymigenes-ux/nopal) por URL
de stream MJPEG directa, resolución automática por ONVIF, o detección +
streaming propio de webcams USB conectadas localmente (vía V4L2 + `ffmpeg`).

## Instalación

Desde NOPAL → Configuración → Galería de plugins → Cámaras → Instalar. NOPAL
clona este repo a `plugins/camera-viewer/` y carga su backend/frontend
automáticamente — no requiere pasos manuales.

## Desarrollo

Este plugin corre **en proceso con NOPAL** (no está sandboxeado): su backend
importa `backend.auth_deps` de NOPAL core para la autenticación, y depende
de que NOPAL lo cargue vía `backend/services/plugin_loader_service.py`
(imports relativos dentro de `backend/` para que `router.py` pueda usar
`from .services.camera_service import ...`).

Estructura:
```
nopal-plugin.json      # manifest (versión, entry points de frontend/backend)
frontend/               # camera-viewer.js + .css, mismo patrón NopalPluginRegistry
backend/
  router.py             # FastAPI APIRouter (entry point declarado en el manifest)
  services/
    camera_service.py       # registro de cámaras (persistencia, go2rtc)
    usb_camera_service.py   # detección V4L2 + streaming ffmpeg de webcams USB
    onvif_service.py        # cliente ONVIF mínimo (resolución de URL RTSP)
tests/
```

### Correr los tests

Los tests necesitan un checkout de [NOPAL core](https://github.com/charlymigenes-ux/nopal)
accesible (con sus dependencias de `requirements-dev.txt` instaladas) porque
este plugin depende de `backend.auth_deps` en tiempo de ejecución:

```bash
# Si este repo está clonado en plugins/camera-viewer/ de un checkout de NOPAL:
cd plugins/camera-viewer
pytest

# Si está en otro lado:
NOPAL_CORE_ROOT=/ruta/al/checkout/de/nopal pytest
```

## Limitaciones conocidas

- No hay soporte de resina/MQTT (fuera de alcance de este plugin).
- La detección USB requiere que el proceso de NOPAL tenga permiso de lectura
  sobre `/dev/video*` (típicamente, pertenecer al grupo `video` del sistema).
- El streaming de webcam USB depende de tener `ffmpeg` instalado en el
  equipo donde corre NOPAL.
