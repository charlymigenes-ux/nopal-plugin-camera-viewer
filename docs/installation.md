---
title: Cámaras: instalación
status: draft
verified_against: "nopal-plugin-camera-viewer@b9634d7 (1.4.0) · nopal@4346f72"
---


# Instalación

1. **Configuración → Galería de plugins → Cámaras → Instalar.** NOPAL clona el repositorio en `plugins/camera-viewer/`.
2. **Reinicia NOPAL** para cargar el backend.

## Requisitos para webcams USB

| Requisito | Detalle |
|---|---|
| Permiso de lectura sobre `/dev/video*` | El usuario que ejecuta NOPAL normalmente debe pertenecer al grupo `video` |
| **`ffmpeg`** instalado | El *streaming* de webcams USB y el timelapse dependen de él |

Las cámaras MJPEG y ONVIF no necesitan ninguno de los dos.
