---
title: Cámaras: configuración
status: draft
verified_against: "nopal-plugin-camera-viewer@b9634d7 (1.4.0) · nopal@4346f72"
---


# Configuración

Las cámaras se añaden desde la sección **Cámaras** del panel.

## Archivos

| Archivo | Contenido |
|---|---|
| `camera_registry.json` | Cámaras registradas (en la raíz de la instalación de NOPAL) |

El plugin declara dos permisos informativos: *guardar direcciones de cámaras* y *detectar webcams USB*.

## Estructura del backend

| Módulo | Función |
|---|---|
| `camera_service.py` | Registro de cámaras y persistencia |
| `usb_camera_service.py` | Detección V4L2 y *streaming* con `ffmpeg` |
| `onvif_service.py` | Cliente ONVIF mínimo (resolución de la URL RTSP) |
| `timelapse_service.py` | Timelapse |
