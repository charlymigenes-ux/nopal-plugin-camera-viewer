---
title: Cámaras: visión general
status: draft
verified_against: "nopal-plugin-camera-viewer@b9634d7 (1.4.0) · nopal@4346f72"
---


# Cámaras

Añade cámaras a NOPAL de tres formas y permite verlas en directo desde el panel:

| Tipo | Cómo se añade |
|---|---|
| **MJPEG** | Con la URL directa del stream |
| **ONVIF** | NOPAL resuelve la URL RTSP mediante un cliente ONVIF mínimo |
| **Webcam USB** | Detección y *streaming* propio de webcams conectadas al servidor, con V4L2 y `ffmpeg` |

También incluye **timelapse**.

## Integración con el core

Además de su sección, el plugin publica el widget `window.NopalCameraCard`, que **el propio core** monta en las fichas de dispositivo de Klipper, láser, CNC y Marlin. Si el plugin no está instalado, esas fichas simplemente no muestran cámara.

## Alcance

No hay soporte de resina/MQTT: está fuera del alcance de este plugin.

[Instalación](installation.md) · [Configuración](configuration.md) · [Hardware](hardware.md) · [API](api.md) · [Solución de problemas](troubleshooting.md)
