"""Motor de timelapse/grabación por cámara: captura periódica de fotogramas,
grabación continua a mp4, armado del video final, detección de movimiento
simple (diff de luma entre fotogramas, sin OpenCV) y control de enfoque
manual para cámaras USB (ver usb_camera_service.get_focus_control/set_focus).

Regla clave para cámaras USB: un nodo /dev/videoN normalmente solo admite un
lector activo a la vez (mismo comentario que usb_camera_service.py). Este
módulo nunca abre su propio proceso ffmpeg contra /dev/videoN -- siempre pasa
por usb_camera_service.subscribe()/unsubscribe(), el mismo canal compartido
que ya usa la vista en vivo, para no pelearse por el dispositivo con quien
esté mirando el stream. Para cámaras RTSP/MJPEG por URL, que sí toleran
múltiples lectores, se captura directo con un proceso ffmpeg puntual.
"""

import asyncio
import logging
import os
import shutil
import time
import zipfile
from typing import Any, Dict, List, Optional

from PIL import Image
import io

from . import camera_service, usb_camera_service

logger = logging.getLogger(__name__)

FFMPEG_BIN = "ffmpeg"
# Diferencia promedio de luma (0-255) entre dos fotogramas consecutivos,
# reducidos a 32x32 en escala de grises, para considerar que "hubo
# movimiento". Valor conservador elegido a ojo -- sin poder probarlo contra
# cámaras reales en este entorno, puede necesitar ajuste en la práctica.
MOTION_THRESHOLD = 18.0
MOTION_SAMPLE_SIZE = (32, 32)

_timelapse_tasks: Dict[str, asyncio.Task] = {}
_recording_state: Dict[str, Dict[str, Any]] = {}
_recent_motion_events: Dict[str, List[Dict[str, Any]]] = {}
_MOTION_EVENTS_MAXLEN = 20


def _require_ffmpeg() -> None:
    if shutil.which(FFMPEG_BIN) is None:
        raise RuntimeError("ffmpeg no está instalado en este equipo (instalalo con: sudo apt install ffmpeg)")


def _frames_dir(camera_id: str) -> str:
    path = os.path.join(camera_service.CAPTURES_DIR, camera_id, "frames")
    os.makedirs(path, exist_ok=True)
    return path


def _recordings_dir(camera_id: str) -> str:
    path = os.path.join(camera_service.CAPTURES_DIR, camera_id, "recordings")
    os.makedirs(path, exist_ok=True)
    return path


def _assembled_dir(camera_id: str) -> str:
    """Carpeta propia para los .mp4/.gif armados a partir de capturas -- antes
    vivían sueltos en camera_dir (la raíz de la cámara), mezclados con
    _concat_list.txt y sin ningún list/get/delete que los expusiera."""
    path = os.path.join(camera_service.CAPTURES_DIR, camera_id, "timelapse")
    os.makedirs(path, exist_ok=True)
    return path


def _dir_size_bytes(path: str) -> int:
    total = 0
    for root, _dirs, files in os.walk(path):
        for name in files:
            filepath = os.path.join(root, name)
            if os.path.isfile(filepath):
                total += os.path.getsize(filepath)
    return total


# ── Captura de un fotograma ──

async def _run_ffmpeg_capture(input_args: List[str]) -> bytes:
    _require_ffmpeg()
    args = [FFMPEG_BIN, "-y", *input_args, "-vframes", "1", "-f", "image2", "pipe:1"]
    process = await asyncio.create_subprocess_exec(
        *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=15.0)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        raise RuntimeError("La cámara no respondió a tiempo")
    if not stdout:
        raise RuntimeError(f"No se pudo capturar la cámara: {stderr.decode('utf-8', errors='ignore')[-300:].strip()}")
    return stdout


async def _capture_usb_frame(camera_id: str, device_path: str) -> bytes:
    """Un fotograma del canal compartido de la webcam USB (arranca el
    stream si nadie lo está mirando todavía) -- nunca abre el dispositivo
    por su cuenta, ver docstring del módulo."""
    queue = await usb_camera_service.subscribe(camera_id, device_path)
    try:
        return await asyncio.wait_for(queue.get(), timeout=10.0)
    except asyncio.TimeoutError:
        raise RuntimeError("La cámara no entregó ningún fotograma a tiempo")
    finally:
        await usb_camera_service.unsubscribe(camera_id, queue)


def _overlay_filter_expr(camera_name: str) -> str:
    text = camera_name.replace("'", "").replace(":", "").replace("%", "")
    return (
        f"drawtext=text='{text} %{{localtime}}':font=Sans:fontsize=16:fontcolor=white"
        ":box=1:boxcolor=black@0.5:x=10:y=h-th-10"
    )


async def _apply_overlay(frame_bytes: bytes, camera_name: str) -> bytes:
    """Incrusta timestamp+nombre en un fotograma ya capturado -- si el
    filtro falla (ej. ffmpeg sin fontconfig compilado) se guarda el
    fotograma tal cual en vez de perder la captura completa."""
    if shutil.which(FFMPEG_BIN) is None:
        return frame_bytes
    process = await asyncio.create_subprocess_exec(
        FFMPEG_BIN, "-y", "-f", "image2pipe", "-i", "pipe:0",
        "-vf", _overlay_filter_expr(camera_name), "-vframes", "1", "-f", "image2", "pipe:1",
        stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL,
    )
    try:
        stdout, _stderr = await asyncio.wait_for(process.communicate(frame_bytes), timeout=10.0)
    except asyncio.TimeoutError:
        process.kill()
        await process.wait()
        return frame_bytes
    return stdout or frame_bytes


async def capture_frame_bytes(camera: Dict[str, Any], overlay: bool = False) -> bytes:
    device_path = camera.get("device_path")
    if device_path:
        frame = await _capture_usb_frame(camera["id"], device_path)
    else:
        source = camera.get("stream_url") or camera.get("source_url")
        if not source:
            raise RuntimeError("La cámara no tiene una fuente de video configurada")
        frame = await _run_ffmpeg_capture(["-i", source])
    if overlay:
        frame = await _apply_overlay(frame, camera.get("name") or "Cámara")
    return frame


async def capture_and_save(camera_id: str, request_host: Optional[str] = None) -> str:
    """Captura manual ("Capturar") o disparada por el bucle de intervalo --
    ambas pasan por acá. Lee el fotograma anterior ANTES de escribir el
    nuevo para poder comparar (detección de movimiento) sin depender del
    orden de listado del directorio."""
    camera = camera_service.get_camera_by_id(camera_id, request_host=request_host)
    if camera is None:
        raise RuntimeError("Cámara no encontrada")
    config = camera_service.get_timelapse_config(camera_id) or dict(camera_service.DEFAULT_TIMELAPSE_CONFIG)

    frames_dir = _frames_dir(camera_id)
    prev_frame: Optional[bytes] = None
    if config.get("motion_detection"):
        existing = sorted(f for f in os.listdir(frames_dir) if f.endswith(".jpg"))
        if existing:
            try:
                with open(os.path.join(frames_dir, existing[-1]), "rb") as handle:
                    prev_frame = handle.read()
            except OSError:
                prev_frame = None

    frame = await capture_frame_bytes(camera, overlay=bool(config.get("overlay")))
    filename = f"{int(time.time() * 1000)}.jpg"
    path = os.path.join(frames_dir, filename)
    with open(path, "wb") as handle:
        handle.write(frame)

    if prev_frame is not None:
        score = _motion_score(prev_frame, frame)
        if score >= MOTION_THRESHOLD:
            _record_motion_event(camera_id, camera.get("name") or "Cámara", score)

    return path


# ── Detección de movimiento (diff de luma, sin OpenCV) ──

def _motion_score(prev_bytes: bytes, curr_bytes: bytes) -> float:
    try:
        prev_img = Image.open(io.BytesIO(prev_bytes)).convert("L").resize(MOTION_SAMPLE_SIZE)
        curr_img = Image.open(io.BytesIO(curr_bytes)).convert("L").resize(MOTION_SAMPLE_SIZE)
    except Exception as e:
        logger.debug(f"No se pudo decodificar fotograma para detección de movimiento: {e}")
        return 0.0
    prev_px = prev_img.tobytes()
    curr_px = curr_img.tobytes()
    if len(prev_px) != len(curr_px) or not prev_px:
        return 0.0
    total = sum(abs(a - b) for a, b in zip(prev_px, curr_px))
    return total / len(prev_px)


def _record_motion_event(camera_id: str, camera_name: str, score: float) -> None:
    events = _recent_motion_events.setdefault(camera_id, [])
    events.append({
        "camera_id": camera_id,
        "camera_name": camera_name,
        "timestamp": time.time(),
        "score": round(score, 1),
    })
    del events[:-_MOTION_EVENTS_MAXLEN]


def get_recent_motion_events(since: float = 0.0) -> List[Dict[str, Any]]:
    """En memoria, no persistido -- es una señal efímera para la campanita
    de notificaciones (ver notification_service.py de NOPAL core), no un
    registro histórico."""
    result: List[Dict[str, Any]] = []
    for events in _recent_motion_events.values():
        result.extend(e for e in events if e["timestamp"] >= since)
    return sorted(result, key=lambda e: e["timestamp"], reverse=True)


# ── Bucle de intervalo (timelapse) ──

async def _timelapse_loop(camera_id: str) -> None:
    while True:
        config = camera_service.get_timelapse_config(camera_id)
        if not config or not config.get("enabled"):
            break
        if not config.get("paused"):
            try:
                await capture_and_save(camera_id)
            except Exception as e:
                logger.warning(f"[{camera_id}] Captura de timelapse falló: {e}")
        interval = max(1, int(config.get("interval_s") or camera_service.DEFAULT_TIMELAPSE_CONFIG["interval_s"]))
        await asyncio.sleep(interval)


def is_timelapse_running(camera_id: str) -> bool:
    task = _timelapse_tasks.get(camera_id)
    return task is not None and not task.done()


def start_timelapse(camera_id: str) -> None:
    if is_timelapse_running(camera_id):
        return
    _timelapse_tasks[camera_id] = asyncio.create_task(_timelapse_loop(camera_id))


def stop_timelapse(camera_id: str) -> None:
    task = _timelapse_tasks.pop(camera_id, None)
    if task is not None and not task.done():
        task.cancel()


def set_timelapse_config(camera_id: str, **overrides: Any) -> Optional[Dict[str, Any]]:
    config = camera_service.update_timelapse_config(camera_id, **overrides)
    if config is None:
        return None
    if config.get("enabled"):
        start_timelapse(camera_id)
    else:
        stop_timelapse(camera_id)
    return config


def pause_timelapse(camera_id: str) -> Optional[Dict[str, Any]]:
    return camera_service.update_timelapse_config(camera_id, paused=True)


def resume_timelapse(camera_id: str) -> Optional[Dict[str, Any]]:
    return camera_service.update_timelapse_config(camera_id, paused=False)


# ── Grabación continua ──

async def _pipe_queue_to_process(camera_id: str, queue: "asyncio.Queue[bytes]", process: "asyncio.subprocess.Process") -> None:
    try:
        while True:
            frame = await queue.get()
            if process.stdin is None or process.stdin.is_closing():
                break
            process.stdin.write(frame)
            await process.stdin.drain()
    except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
        pass
    except Exception as e:
        logger.warning(f"[{camera_id}] Grabación interrumpida: {e}")


async def start_recording(camera_id: str, request_host: Optional[str] = None) -> str:
    if camera_id in _recording_state:
        raise RuntimeError("Ya hay una grabación en curso para esta cámara")
    _require_ffmpeg()
    camera = camera_service.get_camera_by_id(camera_id, request_host=request_host)
    if camera is None:
        raise RuntimeError("Cámara no encontrada")
    path = os.path.join(_recordings_dir(camera_id), f"{int(time.time() * 1000)}.mp4")
    device_path = camera.get("device_path")
    if device_path:
        queue = await usb_camera_service.subscribe(camera_id, device_path)
        process = await asyncio.create_subprocess_exec(
            FFMPEG_BIN, "-y", "-f", "mjpeg", "-i", "pipe:0",
            "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", path,
            stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        task = asyncio.create_task(_pipe_queue_to_process(camera_id, queue, process))
        _recording_state[camera_id] = {"path": path, "process": process, "task": task, "queue": queue}
    else:
        source = camera.get("stream_url") or camera.get("source_url")
        if not source:
            raise RuntimeError("La cámara no tiene una fuente de video configurada")
        process = await asyncio.create_subprocess_exec(
            FFMPEG_BIN, "-y", "-i", source,
            "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", path,
            stdin=asyncio.subprocess.DEVNULL, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
        )
        _recording_state[camera_id] = {"path": path, "process": process, "task": None, "queue": None}
    return path


async def stop_recording(camera_id: str) -> Optional[str]:
    state = _recording_state.pop(camera_id, None)
    if state is None:
        return None
    if state["task"] is not None:
        state["task"].cancel()
    if state["queue"] is not None:
        await usb_camera_service.unsubscribe(camera_id, state["queue"])
    process = state["process"]
    if process.stdin is not None:
        try:
            process.stdin.close()
        except Exception:
            pass
    if process.returncode is None:
        try:
            await asyncio.wait_for(process.wait(), timeout=5.0)
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
    return state["path"]


def is_recording(camera_id: str) -> bool:
    return camera_id in _recording_state


# ── Estadísticas, galería y armado de video ──

def get_timelapse_stats(camera_id: str) -> Dict[str, Any]:
    config = camera_service.get_timelapse_config(camera_id) or dict(camera_service.DEFAULT_TIMELAPSE_CONFIG)
    frames_dir = _frames_dir(camera_id)
    frame_files = [f for f in os.listdir(frames_dir) if f.endswith(".jpg")]
    frame_count = len(frame_files)
    total_bytes = sum(os.path.getsize(os.path.join(frames_dir, f)) for f in frame_files)
    avg_frame_bytes = (total_bytes / frame_count) if frame_count else 0
    interval_s = config.get("interval_s") or camera_service.DEFAULT_TIMELAPSE_CONFIG["interval_s"]

    camera_dir = os.path.join(camera_service.CAPTURES_DIR, camera_id)
    os.makedirs(camera_service.CAPTURES_DIR, exist_ok=True)
    usage = shutil.disk_usage(camera_service.CAPTURES_DIR)

    return {
        "enabled": bool(config.get("enabled")),
        "paused": bool(config.get("paused")),
        "recording": is_recording(camera_id),
        "interval_s": interval_s,
        "fps": config.get("fps") or camera_service.DEFAULT_TIMELAPSE_CONFIG["fps"],
        "overlay": bool(config.get("overlay")),
        "motion_detection": bool(config.get("motion_detection")),
        "frame_count": frame_count,
        "duration_s": frame_count * interval_s,
        "estimated_output_bytes": round(avg_frame_bytes * frame_count),
        "storage_used_bytes": _dir_size_bytes(camera_dir),
        "storage_total_bytes": usage.total,
        # Cuántos .mp4/.gif ya armados hay -- el inspector lo usa como
        # estadística "Timelapses" (distinta de "Capturas"/frame_count).
        "assembled_count": len(list_assembled_videos(camera_id)),
    }


def list_captures(camera_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    frames_dir = _frames_dir(camera_id)
    files = sorted((f for f in os.listdir(frames_dir) if f.endswith(".jpg")), reverse=True)
    if limit:
        files = files[:limit]
    result = []
    for filename in files:
        path = os.path.join(frames_dir, filename)
        try:
            stat = os.stat(path)
        except OSError:
            continue
        result.append({"filename": filename, "timestamp": stat.st_mtime, "size_bytes": stat.st_size})
    return result


def get_capture_file_path(camera_id: str, filename: str) -> Optional[str]:
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        return None
    path = os.path.join(_frames_dir(camera_id), filename)
    return path if os.path.isfile(path) else None


def _selected_frame_files(camera_id: str, frames_dir: str, filenames: Optional[List[str]]) -> List[str]:
    """Fotogramas a usar para armar un video/gif: todos los capturados en
    orden cronológico (comportamiento de "Armar timelapse" de siempre) si no
    se pasa `filenames`, o exactamente los que se pasen, EN ESE ORDEN
    (comportamiento de "Juntar": selección manual + orden elegido por el
    usuario) -- mismo mecanismo de concat list para ambos flujos, sin
    duplicar la lógica de ffmpeg."""
    if filenames:
        return [f for f in filenames if get_capture_file_path(camera_id, f) is not None]
    return sorted(f for f in os.listdir(frames_dir) if f.endswith(".jpg"))


def _write_concat_list(concat_list_path: str, frames_dir: str, frame_files: List[str], frame_duration: float) -> None:
    # Rutas ABSOLUTAS en el concat list -- el demuxer `-f concat` de ffmpeg
    # resuelve cualquier ruta relativa que aparezca dentro del .txt contra
    # el directorio que contiene al propio .txt, no contra el cwd del
    # proceso ni contra CAPTURES_DIR -- con ruta absoluta, ffmpeg la usa tal
    # cual y no hay forma de que la duplique (bug ya visto y arreglado).
    with open(concat_list_path, "w", encoding="utf-8") as handle:
        for filename in frame_files:
            frame_path = os.path.abspath(os.path.join(frames_dir, filename)).replace("'", "'\\''")
            handle.write(f"file '{frame_path}'\n")
            handle.write(f"duration {frame_duration}\n")
        # El demuxer concat ignora la duración del último item salvo que se
        # repita la entrada -- sin esto el último fotograma queda con
        # duración 0 en el video final.
        last_path = os.path.abspath(os.path.join(frames_dir, frame_files[-1])).replace("'", "'\\''")
        handle.write(f"file '{last_path}'\n")


async def assemble_timelapse_video(camera_id: str, filenames: Optional[List[str]] = None) -> str:
    """Arma el video final a partir de los fotogramas capturados, al FPS
    configurado. Usa el demuxer `concat` (lista explícita de archivos) en
    vez de `-pattern_type glob`: glob depende de que el binario de ffmpeg
    se haya compilado con soporte de glob, no todos los paquetes lo traen,
    mientras que concat siempre funciona.

    `filenames`: si se pasa, arma el video solo con esos fotogramas y en ese
    orden (flujo "Juntar" desde una selección manual); si no, con todos los
    capturados en orden cronológico (flujo "Armar timelapse" de siempre)."""
    _require_ffmpeg()
    frames_dir = _frames_dir(camera_id)
    frame_files = _selected_frame_files(camera_id, frames_dir, filenames)
    if len(frame_files) < 2:
        raise RuntimeError("No hay suficientes fotogramas seleccionados todavía")

    config = camera_service.get_timelapse_config(camera_id) or {}
    fps = config.get("fps") or camera_service.DEFAULT_TIMELAPSE_CONFIG["fps"]

    camera_dir = os.path.join(camera_service.CAPTURES_DIR, camera_id)
    output_dir = _assembled_dir(camera_id)
    output_path = os.path.join(output_dir, f"timelapse_{int(time.time())}.mp4")
    concat_list_path = os.path.join(camera_dir, "_concat_list.txt")

    frame_duration = 1.0 / fps
    _write_concat_list(concat_list_path, frames_dir, frame_files, frame_duration)

    process = await asyncio.create_subprocess_exec(
        # Sin -vsync/-fps_mode: pedir "vfr" ahí y forzar -r al mismo tiempo
        # es contradictorio para ffmpeg (falla al abrir el output) -- el -r
        # de salida ya alcanza para resamplear al FPS configurado a partir
        # de las duraciones por fotograma que puso el demuxer concat.
        FFMPEG_BIN, "-y", "-f", "concat", "-safe", "0", "-i", concat_list_path,
        "-pix_fmt", "yuv420p", "-r", str(fps), output_path,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
    )
    _stdout, stderr = await process.communicate()
    try:
        os.remove(concat_list_path)
    except OSError:
        pass
    if process.returncode != 0:
        raise RuntimeError(f"No se pudo armar el video: {stderr.decode('utf-8', errors='ignore')[-300:].strip()}")
    return output_path


async def assemble_timelapse_gif(camera_id: str, filenames: Optional[List[str]] = None) -> str:
    """Igual que assemble_timelapse_video pero exporta .gif -- mismo
    concat list (compartido vía _write_concat_list), mismo ffmpeg ya
    validado. Dos pasos (palettegen/paletteuse) para que el GIF no salga
    con bandas de color feas, que es lo que pasa si se pide .gif directo
    sin paleta."""
    _require_ffmpeg()
    frames_dir = _frames_dir(camera_id)
    frame_files = _selected_frame_files(camera_id, frames_dir, filenames)
    if len(frame_files) < 2:
        raise RuntimeError("No hay suficientes fotogramas seleccionados todavía")

    config = camera_service.get_timelapse_config(camera_id) or {}
    fps = config.get("fps") or camera_service.DEFAULT_TIMELAPSE_CONFIG["fps"]

    camera_dir = os.path.join(camera_service.CAPTURES_DIR, camera_id)
    output_dir = _assembled_dir(camera_id)
    output_path = os.path.join(output_dir, f"timelapse_{int(time.time())}.gif")
    concat_list_path = os.path.join(camera_dir, "_concat_list_gif.txt")

    frame_duration = 1.0 / fps
    _write_concat_list(concat_list_path, frames_dir, frame_files, frame_duration)

    process = await asyncio.create_subprocess_exec(
        FFMPEG_BIN, "-y", "-f", "concat", "-safe", "0", "-i", concat_list_path,
        "-vf", f"fps={fps},scale=480:-1:flags=lanczos,split[a][b];[a]palettegen[p];[b][p]paletteuse",
        output_path,
        stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.PIPE,
    )
    _stdout, stderr = await process.communicate()
    try:
        os.remove(concat_list_path)
    except OSError:
        pass
    if process.returncode != 0:
        raise RuntimeError(f"No se pudo armar el GIF: {stderr.decode('utf-8', errors='ignore')[-300:].strip()}")
    return output_path


# ── Grabaciones y borrado ──
# Las grabaciones ya se guardaban (ver _recordings_dir) pero no había forma
# de listarlas ni de reproducirlas: quedaban en el disco sin que nadie las
# viera. Y no existía ningún borrado, así que el material solo crecía.

def list_recordings(camera_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Grabaciones de una cámara, la más reciente primero."""
    carpeta = _recordings_dir(camera_id)
    try:
        archivos = sorted((f for f in os.listdir(carpeta) if f.endswith(".mp4")), reverse=True)
    except OSError:
        return []
    if limit:
        archivos = archivos[:limit]
    resultado = []
    for nombre in archivos:
        ruta = os.path.join(carpeta, nombre)
        try:
            stat = os.stat(ruta)
        except OSError:
            continue
        resultado.append({"filename": nombre, "timestamp": stat.st_mtime, "size_bytes": stat.st_size})
    return resultado


def _ruta_segura(camera_id: str, filename: str, carpeta: str) -> Optional[str]:
    """Ruta de un archivo dentro de la carpeta de esa cámara, o None.

    Se rechaza cualquier nombre con separadores o con '..': sin esto, un
    nombre como '../../auth_users.json' saldría de la carpeta de capturas y
    borraría lo que no debe.
    """
    if not filename or "/" in filename or "\\" in filename or filename in (".", ".."):
        return None
    ruta = os.path.abspath(os.path.join(carpeta, filename))
    if not ruta.startswith(os.path.abspath(carpeta) + os.sep):
        return None
    return ruta if os.path.isfile(ruta) else None


def get_recording_file_path(camera_id: str, filename: str) -> Optional[str]:
    return _ruta_segura(camera_id, filename, _recordings_dir(camera_id))


def delete_capture(camera_id: str, filename: str) -> bool:
    ruta = _ruta_segura(camera_id, filename, _frames_dir(camera_id))
    if ruta is None:
        return False
    try:
        os.remove(ruta)
        return True
    except OSError as exc:
        logger.warning(f"No se pudo borrar la captura {filename}: {exc}")
        return False


def delete_recording(camera_id: str, filename: str) -> bool:
    ruta = _ruta_segura(camera_id, filename, _recordings_dir(camera_id))
    if ruta is None:
        return False
    try:
        os.remove(ruta)
        return True
    except OSError as exc:
        logger.warning(f"No se pudo borrar la grabación {filename}: {exc}")
        return False


# ── Videos/GIFs armados ──
# assemble_timelapse_video/assemble_timelapse_gif guardaban el resultado en
# camera_dir (la raíz de la cámara, mezclado con _concat_list.txt) y no
# había ninguna forma de listarlos, reproducirlos ni borrarlos -- el archivo
# quedaba huérfano en el disco con solo un toast como rastro. Mismo patrón
# que list_recordings/get_recording_file_path/delete_recording de arriba.

def list_assembled_videos(camera_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
    """Videos/GIFs ya armados de una cámara, el más reciente primero."""
    carpeta = _assembled_dir(camera_id)
    try:
        archivos = sorted(
            (f for f in os.listdir(carpeta) if f.endswith((".mp4", ".gif"))),
            reverse=True,
        )
    except OSError:
        return []
    if limit:
        archivos = archivos[:limit]
    resultado = []
    for nombre in archivos:
        ruta = os.path.join(carpeta, nombre)
        try:
            stat = os.stat(ruta)
        except OSError:
            continue
        resultado.append({
            "filename": nombre,
            "timestamp": stat.st_mtime,
            "size_bytes": stat.st_size,
            "kind": "gif" if nombre.endswith(".gif") else "video",
        })
    return resultado


def get_assembled_video_file_path(camera_id: str, filename: str) -> Optional[str]:
    return _ruta_segura(camera_id, filename, _assembled_dir(camera_id))


def delete_assembled_video(camera_id: str, filename: str) -> bool:
    ruta = _ruta_segura(camera_id, filename, _assembled_dir(camera_id))
    if ruta is None:
        return False
    try:
        os.remove(ruta)
        return True
    except OSError as exc:
        logger.warning(f"No se pudo borrar el video armado {filename}: {exc}")
        return False


# ── Edición liviana de una captura (rotar/recortar) ──
# Pillow ya está importado arriba del archivo (se usa para motion
# detection) -- no hace falta ninguna dependencia nueva. Sin filtros ni
# retoque: solo lo que se puede hacer de verdad sin fabricar nada.

_VALID_ROTATIONS = (0, 90, 180, 270)


def edit_capture(
    camera_id: str,
    filename: str,
    rotate: int = 0,
    crop: Optional[Dict[str, int]] = None,
    save_as_copy: bool = False,
) -> Optional[str]:
    """Aplica rotación (múltiplo de 90°) y/o recorte a una captura ya
    guardada. Devuelve el filename final (el mismo si se sobrescribe, uno
    nuevo si save_as_copy=True) o None si la captura no existe."""
    ruta = _ruta_segura(camera_id, filename, _frames_dir(camera_id))
    if ruta is None:
        return None
    if rotate not in _VALID_ROTATIONS:
        raise ValueError(f"Rotación inválida: {rotate} (debe ser 0/90/180/270)")

    image = Image.open(ruta)
    image.load()
    if rotate:
        # PIL rota counter-clockwise -- se invierte el signo para que
        # "rotar 90°" en la UI (sentido horario, lo intuitivo) coincida.
        image = image.rotate(-rotate, expand=True)
    if crop:
        left, top = int(crop.get("left", 0)), int(crop.get("top", 0))
        right, bottom = int(crop.get("right", image.width)), int(crop.get("bottom", image.height))
        left, top = max(0, left), max(0, top)
        right, bottom = min(image.width, right), min(image.height, bottom)
        if right <= left or bottom <= top:
            raise ValueError("Área de recorte inválida")
        image = image.crop((left, top, right, bottom))

    if save_as_copy:
        base, _ext = os.path.splitext(filename)
        out_filename = f"{base}_edit_{int(time.time())}.jpg"
        out_path = os.path.join(_frames_dir(camera_id), out_filename)
    else:
        out_filename = filename
        out_path = ruta

    image.convert("RGB").save(out_path, format="JPEG", quality=92)
    return out_filename


# ── ZIP de capturas seleccionadas ──
# No existía ningún exportador en lote en todo NOPAL -- se arma en memoria
# con zipfile (stdlib), sin dependencias nuevas.

def build_captures_zip(camera_id: str, filenames: List[str]) -> bytes:
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for filename in filenames:
            path = get_capture_file_path(camera_id, filename)
            if path is None:
                continue
            archive.write(path, arcname=filename)
    return buffer.getvalue()
