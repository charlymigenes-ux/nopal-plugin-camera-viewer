---
title: Cámaras: solución de problemas
status: draft
verified_against: "nopal-plugin-camera-viewer@b9634d7 (1.4.0) · nopal@4346f72"
---


# Solución de problemas

| Problema | Qué hacer |
|---|---|
| No se detecta una webcam USB | El proceso de NOPAL necesita permiso de lectura sobre `/dev/video*`: `sudo usermod -aG video <usuario>` y reinicia NOPAL |
| La webcam USB no muestra imagen | Instala `ffmpeg` en el equipo donde corre NOPAL |
| Una cámara ONVIF no resuelve su URL | El plugin incluye un cliente ONVIF **mínimo**; si tu cámara no responde, usa la URL directa del stream MJPEG |
| Las fichas de Klipper, láser, CNC y Marlin no muestran cámara | El plugin debe estar instalado y NOPAL reiniciado. El core monta el widget con `window.NopalCameraCard?.mount` y, si no existe, no hace nada |
