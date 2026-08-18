import io
import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse

from backend.auth_deps import require_auth, require_role

from .services import timelapse_service, usb_camera_service
from .services.camera_service import (
    duplicate_camera,
    get_camera_by_id,
    get_camera_health,
    get_cameras,
    register_camera,
    unregister_camera,
    update_camera,
)
from .services.onvif_service import resolve_rtsp_uri_autoscan, resolve_rtsp_uri_from_url

router = APIRouter()


def _require_camera(camera_id: str, request_host: Optional[str] = None) -> dict:
    camera = get_camera_by_id(camera_id, request_host=request_host)
    if camera is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return camera


@router.get("/api/cameras")
async def camera_list_endpoint(request: Request, user: dict = Depends(require_auth)):
    """Cámaras registradas. Las RTSP vienen resueltas a la URL MJPEG que
    expone go2rtc para esa fuente -- el navegador nunca ve la URL RTSP."""
    return {"cameras": get_cameras(request_host=request.url.hostname)}


@router.post("/api/cameras")
async def camera_register_endpoint(
    name: str = Form(...),
    stream_url: str = Form(...),
    user: dict = Depends(require_role("admin")),
):
    if not stream_url.strip():
        raise HTTPException(status_code=400, detail="La URL del stream es obligatoria")
    return register_camera(name.strip() or "Cámara", stream_url.strip())


@router.post("/api/cameras/onvif")
async def camera_register_onvif_endpoint(
    name: str = Form(...),
    host: Optional[str] = Form(None),
    port: Optional[int] = Form(None),
    onvif_url: Optional[str] = Form(None),
    username: str = Form(...),
    password: str = Form(...),
    user: dict = Depends(require_role("admin")),
):
    """Resuelve la URL RTSP real vía ONVIF (GetCapabilities/GetProfiles/
    GetStreamUri) y registra la cámara con esa URL. Dos caminos:
    - Solo con `host` (+ `port` opcional): autoscan sobre el path estándar
      /onvif/device_service, el usuario no tiene que saber ni el puerto ni
      el formato de URL RTSP (ver resolve_rtsp_uri_autoscan).
    - Con `onvif_url`: usa esa URL completa tal cual, sin adivinar puerto ni
      path -- necesario para fabricantes que no publican el device_service
      en el path estándar (confirmado por el usuario probando la URL exacta
      de su cámara)."""
    onvif_url = (onvif_url or "").strip()
    host = (host or "").strip()
    if not onvif_url and not host:
        raise HTTPException(status_code=400, detail="Indicá la IP de la cámara o la URL completa del servicio ONVIF")
    try:
        if onvif_url:
            rtsp_uri = resolve_rtsp_uri_from_url(onvif_url, username.strip(), password)
            resolved_port = None
        else:
            rtsp_uri, resolved_port = resolve_rtsp_uri_autoscan(host, username.strip(), password, port)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    entry = register_camera(name.strip() or "Cámara", rtsp_uri)
    return {**entry, "onvif_port": resolved_port}


@router.post("/api/cameras/{camera_id}/update")
async def camera_update_endpoint(
    camera_id: str,
    name: str = Form(...),
    purpose: Optional[str] = Form(None),
    purpose_note: Optional[str] = Form(None),
    bound_device_type: Optional[str] = Form(None),
    bound_device_id: Optional[str] = Form(None),
    enabled: Optional[bool] = Form(None),
    user: dict = Depends(require_role("admin")),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    bound_device = (
        {"type": bound_device_type, "id": bound_device_id}
        if bound_device_type and bound_device_id
        else None
    )
    entry = update_camera(camera_id, name.strip(), purpose, purpose_note, bound_device, enabled=enabled)
    if entry is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return entry


@router.get("/api/cameras/{camera_id}/health")
async def camera_health_endpoint(camera_id: str, user: dict = Depends(require_auth)):
    """Prueba real de conexión de UNA cámara (botón "Probar conexión" /
    estado de la fila en la lista) -- no persiste nada."""
    health = get_camera_health(camera_id)
    if health is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return health


@router.post("/api/cameras/{camera_id}/duplicate")
async def camera_duplicate_endpoint(camera_id: str, name: str = Form(...), user: dict = Depends(require_role("admin"))):
    if not name.strip():
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    entry = duplicate_camera(camera_id, name.strip())
    if entry is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return entry


@router.post("/api/cameras/remove")
async def camera_remove_endpoint(id: str = Form(...), delete_files: bool = Form(False), user: dict = Depends(require_role("admin"))):
    if not await unregister_camera(id, delete_files=delete_files):
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return {"success": True}


@router.get("/api/cameras/usb/discover")
async def camera_usb_discover_endpoint(user: dict = Depends(require_auth)):
    """Webcams USB conectadas localmente (V4L2) -- ver usb_camera_service.py."""
    return {"devices": usb_camera_service.list_usb_video_devices()}


@router.post("/api/cameras/usb/register")
async def camera_usb_register_endpoint(
    name: str = Form(...),
    device_path: str = Form(...),
    purpose: Optional[str] = Form(None),
    purpose_note: Optional[str] = Form(None),
    bound_device_type: Optional[str] = Form(None),
    bound_device_id: Optional[str] = Form(None),
    user: dict = Depends(require_role("admin")),
):
    """Registra una webcam USB detectada -- a diferencia de URL directa/ONVIF,
    el stream lo sirve el propio NOPAL (ver usb_camera_service.ensure_stream),
    no una URL externa que el usuario tenga que conocer."""
    if not os.path.exists(device_path):
        raise HTTPException(status_code=400, detail="El dispositivo ya no está conectado")
    entry_id = uuid.uuid4().hex[:12]
    bound_device = (
        {"type": bound_device_type, "id": bound_device_id}
        if bound_device_type and bound_device_id
        else None
    )
    entry = register_camera(
        name.strip() or "Cámara USB",
        f"/api/cameras/usb/{entry_id}/stream",
        purpose=purpose,
        purpose_note=purpose_note if purpose == "other" else None,
        bound_device=bound_device,
        device_path=device_path,
        entry_id=entry_id,
    )
    return entry


@router.get("/api/cameras/usb/{camera_id}/stream")
async def camera_usb_stream_endpoint(camera_id: str, user: dict = Depends(require_auth)):
    entry = next((c for c in get_cameras() if c["id"] == camera_id), None)
    if entry is None or not entry.get("device_path"):
        raise HTTPException(status_code=404, detail="Cámara USB no encontrada")
    try:
        queue = await usb_camera_service.subscribe(camera_id, entry["device_path"])
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    async def generator():
        try:
            while True:
                frame = await queue.get()
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n"
                    b"Content-Length: " + str(len(frame)).encode() + b"\r\n\r\n" +
                    frame + b"\r\n"
                )
        finally:
            await usb_camera_service.unsubscribe(camera_id, queue)

    return StreamingResponse(generator(), media_type="multipart/x-mixed-replace; boundary=frame")


# ── Timelapse / grabación / enfoque -- ver timelapse_service.py ──

@router.post("/api/cameras/{camera_id}/timelapse")
async def camera_timelapse_config_endpoint(
    camera_id: str,
    enabled: Optional[bool] = Form(None),
    interval_s: Optional[int] = Form(None),
    fps: Optional[int] = Form(None),
    overlay: Optional[bool] = Form(None),
    motion_detection: Optional[bool] = Form(None),
    user: dict = Depends(require_role("admin")),
):
    _require_camera(camera_id)
    config = timelapse_service.set_timelapse_config(
        camera_id, enabled=enabled, interval_s=interval_s, fps=fps, overlay=overlay, motion_detection=motion_detection,
    )
    if config is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return config


@router.post("/api/cameras/{camera_id}/timelapse/pause")
async def camera_timelapse_pause_endpoint(camera_id: str, user: dict = Depends(require_role("admin"))):
    config = timelapse_service.pause_timelapse(camera_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return config


@router.post("/api/cameras/{camera_id}/timelapse/resume")
async def camera_timelapse_resume_endpoint(camera_id: str, user: dict = Depends(require_role("admin"))):
    config = timelapse_service.resume_timelapse(camera_id)
    if config is None:
        raise HTTPException(status_code=404, detail="Cámara no encontrada")
    return config


def _parse_filenames_form(filenames: Optional[str]) -> Optional[list]:
    """`filenames` llega como string separado por comas (mismo estilo Form
    simple que ya usa el resto de este archivo, sin introducir un modelo
    Pydantic nuevo solo para esto) -- None/vacío = "todas las capturas"
    (comportamiento de siempre de Armar timelapse); con datos = selección
    manual en ese orden (flujo Juntar)."""
    if not filenames:
        return None
    return [f.strip() for f in filenames.split(",") if f.strip()]


@router.post("/api/cameras/{camera_id}/timelapse/assemble")
async def camera_timelapse_assemble_endpoint(
    camera_id: str, filenames: Optional[str] = Form(None), user: dict = Depends(require_role("admin"))
):
    _require_camera(camera_id)
    try:
        path = await timelapse_service.assemble_timelapse_video(camera_id, _parse_filenames_form(filenames))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"filename": os.path.basename(path)}


@router.post("/api/cameras/{camera_id}/timelapse/assemble-gif")
async def camera_timelapse_assemble_gif_endpoint(
    camera_id: str, filenames: Optional[str] = Form(None), user: dict = Depends(require_role("admin"))
):
    _require_camera(camera_id)
    try:
        path = await timelapse_service.assemble_timelapse_gif(camera_id, _parse_filenames_form(filenames))
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"filename": os.path.basename(path)}


@router.get("/api/cameras/{camera_id}/timelapse/videos")
async def camera_timelapse_videos_list_endpoint(camera_id: str, limit: Optional[int] = None, user: dict = Depends(require_auth)):
    """Videos/GIFs ya armados. Antes de esto, assemble solo devolvía un
    filename en la respuesta del POST y el archivo quedaba huérfano en
    disco -- sin esto no había forma de volver a verlo/descargarlo/borrarlo."""
    _require_camera(camera_id)
    return {"videos": timelapse_service.list_assembled_videos(camera_id, limit=limit)}


@router.get("/api/cameras/{camera_id}/timelapse/videos/{filename}")
async def camera_timelapse_video_file_endpoint(camera_id: str, filename: str, user: dict = Depends(require_auth)):
    path = timelapse_service.get_assembled_video_file_path(camera_id, filename)
    if path is None:
        raise HTTPException(status_code=404, detail="Video no encontrado")
    media_type = "image/gif" if filename.endswith(".gif") else "video/mp4"
    return FileResponse(path, media_type=media_type)


@router.delete("/api/cameras/{camera_id}/timelapse/videos/{filename}")
async def camera_timelapse_video_delete_endpoint(camera_id: str, filename: str, user: dict = Depends(require_role("admin"))):
    _require_camera(camera_id)
    if not timelapse_service.delete_assembled_video(camera_id, filename):
        raise HTTPException(status_code=404, detail="Video no encontrado")
    return {"deleted": filename}


@router.get("/api/cameras/{camera_id}/timelapse/stats")
async def camera_timelapse_stats_endpoint(camera_id: str, user: dict = Depends(require_auth)):
    _require_camera(camera_id)
    return timelapse_service.get_timelapse_stats(camera_id)


@router.post("/api/cameras/{camera_id}/capture")
async def camera_capture_endpoint(camera_id: str, request: Request, user: dict = Depends(require_role("admin"))):
    _require_camera(camera_id, request_host=request.url.hostname)
    try:
        path = await timelapse_service.capture_and_save(camera_id, request_host=request.url.hostname)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"filename": os.path.basename(path)}


@router.get("/api/cameras/{camera_id}/captures")
async def camera_captures_list_endpoint(camera_id: str, limit: Optional[int] = None, user: dict = Depends(require_auth)):
    _require_camera(camera_id)
    return {"captures": timelapse_service.list_captures(camera_id, limit=limit)}


@router.get("/api/cameras/{camera_id}/captures/{filename}")
async def camera_capture_file_endpoint(camera_id: str, filename: str, user: dict = Depends(require_auth)):
    path = timelapse_service.get_capture_file_path(camera_id, filename)
    if path is None:
        raise HTTPException(status_code=404, detail="Captura no encontrada")
    return FileResponse(path, media_type="image/jpeg")


@router.delete("/api/cameras/{camera_id}/captures/{filename}")
async def camera_capture_delete_endpoint(camera_id: str, filename: str, user: dict = Depends(require_role("admin"))):
    """Borra una captura. Admin-only: es material que no se recupera."""
    _require_camera(camera_id)
    if not timelapse_service.delete_capture(camera_id, filename):
        raise HTTPException(status_code=404, detail="Captura no encontrada")
    return {"deleted": filename}


@router.post("/api/cameras/{camera_id}/captures/{filename}/edit")
async def camera_capture_edit_endpoint(
    camera_id: str,
    filename: str,
    rotate: int = Form(0),
    crop_left: Optional[int] = Form(None),
    crop_top: Optional[int] = Form(None),
    crop_right: Optional[int] = Form(None),
    crop_bottom: Optional[int] = Form(None),
    save_as_copy: bool = Form(False),
    user: dict = Depends(require_role("admin")),
):
    """Rotar (múltiplo de 90°) y/o recortar una captura ya guardada."""
    _require_camera(camera_id)
    crop = None
    if None not in (crop_left, crop_top, crop_right, crop_bottom):
        crop = {"left": crop_left, "top": crop_top, "right": crop_right, "bottom": crop_bottom}
    try:
        result_filename = timelapse_service.edit_capture(
            camera_id, filename, rotate=rotate, crop=crop, save_as_copy=save_as_copy
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result_filename is None:
        raise HTTPException(status_code=404, detail="Captura no encontrada")
    return {"filename": result_filename}


@router.post("/api/cameras/{camera_id}/captures/zip")
async def camera_captures_zip_endpoint(camera_id: str, filenames: str = Form(...), user: dict = Depends(require_auth)):
    """ZIP de varias capturas ya existentes -- no muta ni genera archivos
    nuevos en disco (arma los bytes al vuelo), por eso alcanza con
    require_auth en vez de admin, igual que ver/descargar una captura
    individual."""
    _require_camera(camera_id)
    names = _parse_filenames_form(filenames) or []
    if not names:
        raise HTTPException(status_code=400, detail="No se indicaron capturas para exportar")
    zip_bytes = timelapse_service.build_captures_zip(camera_id, names)
    headers = {"Content-Disposition": f'attachment; filename="capturas_{camera_id}.zip"'}
    return StreamingResponse(io.BytesIO(zip_bytes), media_type="application/zip", headers=headers)


@router.get("/api/cameras/{camera_id}/recordings")
async def camera_recordings_list_endpoint(camera_id: str, limit: Optional[int] = None, user: dict = Depends(require_auth)):
    """Grabaciones guardadas. Ya se escribían a disco desde el primer día,
    pero no había forma de listarlas: quedaban ahí sin que nadie las viera."""
    _require_camera(camera_id)
    return {"recordings": timelapse_service.list_recordings(camera_id, limit=limit)}


@router.get("/api/cameras/{camera_id}/recordings/{filename}")
async def camera_recording_file_endpoint(camera_id: str, filename: str, user: dict = Depends(require_auth)):
    path = timelapse_service.get_recording_file_path(camera_id, filename)
    if path is None:
        raise HTTPException(status_code=404, detail="Grabación no encontrada")
    return FileResponse(path, media_type="video/mp4")


@router.delete("/api/cameras/{camera_id}/recordings/{filename}")
async def camera_recording_delete_endpoint(camera_id: str, filename: str, user: dict = Depends(require_role("admin"))):
    _require_camera(camera_id)
    if not timelapse_service.delete_recording(camera_id, filename):
        raise HTTPException(status_code=404, detail="Grabación no encontrada")
    return {"deleted": filename}


@router.post("/api/cameras/{camera_id}/record/start")
async def camera_record_start_endpoint(camera_id: str, request: Request, user: dict = Depends(require_role("admin"))):
    try:
        path = await timelapse_service.start_recording(camera_id, request_host=request.url.hostname)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"filename": os.path.basename(path)}


@router.post("/api/cameras/{camera_id}/record/stop")
async def camera_record_stop_endpoint(camera_id: str, user: dict = Depends(require_role("admin"))):
    path = await timelapse_service.stop_recording(camera_id)
    if path is None:
        raise HTTPException(status_code=404, detail="No hay ninguna grabación en curso para esta cámara")
    return {"filename": os.path.basename(path)}


@router.get("/api/cameras/{camera_id}/focus")
async def camera_focus_get_endpoint(camera_id: str, user: dict = Depends(require_auth)):
    camera = _require_camera(camera_id)
    device_path = camera.get("device_path")
    if not device_path:
        return {"supported": False}
    focus = usb_camera_service.get_focus_control(device_path)
    if focus is None:
        return {"supported": False}
    return {"supported": True, **focus}


@router.post("/api/cameras/{camera_id}/focus")
async def camera_focus_set_endpoint(camera_id: str, value: int = Form(...), user: dict = Depends(require_role("admin"))):
    camera = _require_camera(camera_id)
    device_path = camera.get("device_path")
    if not device_path:
        raise HTTPException(status_code=400, detail="Esta cámara no admite control de enfoque manual")
    if not usb_camera_service.set_focus(device_path, value):
        raise HTTPException(status_code=400, detail="No se pudo cambiar el enfoque")
    return {"success": True, "value": value}
