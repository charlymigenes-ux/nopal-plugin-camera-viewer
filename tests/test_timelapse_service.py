"""Tests de timelapse_service.py -- ver también test_usb_camera_service.py
para el control de enfoque (agregado ahí porque vive en ese módulo).

Nada de estos tests dispara ffmpeg de verdad: se mockea
asyncio.create_subprocess_exec con fakes deterministas (mismo criterio que
TestSharedStream en test_usb_camera_service.py), así que corren igual con o
sin ffmpeg instalado en la máquina de CI. La verificación manual de que los
comandos de ffmpeg en sí son correctos (captura, overlay, concat, pipe de
grabación) se hizo aparte, a mano, contra un ffmpeg real.
"""

import asyncio
import io
import time

import pytest
from PIL import Image

import backend.services.camera_service as camera_service
import backend.services.timelapse_service as timelapse_service


def _jpeg_bytes(color) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (64, 64), color).save(buf, format="JPEG")
    return buf.getvalue()


FRAME_BLACK = _jpeg_bytes((0, 0, 0))
FRAME_WHITE = _jpeg_bytes((255, 255, 255))


async def _fake_create_subprocess_exec(*args, **kwargs):
    return _FakeCaptureProcess(stdout=FRAME_BLACK)


class _FakeCaptureProcess:
    def __init__(self, stdout=b"", stderr=b"", returncode=0):
        self._stdout = stdout
        self._stderr = stderr
        self.returncode = returncode
        self.stdin = None
        self.killed = False

    async def communicate(self, input=None):
        return self._stdout, self._stderr

    def kill(self):
        self.killed = True
        self.returncode = -9

    async def wait(self):
        return self.returncode


def _register_camera(name="Cam", source_url="http://fake-camera/stream.mjpeg", device_path=None):
    return camera_service.register_camera(name, source_url, device_path=device_path)


class TestTimelapseConfigDefaults:
    def test_unconfigured_camera_returns_defaults(self):
        cam = _register_camera()
        config = camera_service.get_timelapse_config(cam["id"])
        assert config["enabled"] is False
        assert config["interval_s"] == camera_service.DEFAULT_TIMELAPSE_CONFIG["interval_s"]

    def test_unknown_camera_returns_none(self):
        assert camera_service.get_timelapse_config("does-not-exist") is None

    def test_update_only_overrides_given_keys(self):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], enabled=True, interval_s=10)
        config = camera_service.update_timelapse_config(cam["id"], fps=30)
        assert config["enabled"] is True
        assert config["interval_s"] == 10
        assert config["fps"] == 30

    def test_update_unknown_camera_returns_none(self):
        assert camera_service.update_timelapse_config("nope", enabled=True) is None


class TestCameraBoundTo:
    def test_matches_when_purpose_is_timelapse(self):
        cam = _register_camera(device_path="/dev/video0")
        camera_service.update_camera(cam["id"], name="Cam", purpose="timelapse", bound_device={"type": "klipper", "id": "NOPAL"})
        found = camera_service.get_camera_bound_to("klipper", "NOPAL")
        assert found is not None
        assert found["id"] == cam["id"]

    def test_no_match_for_different_device(self):
        cam = _register_camera(device_path="/dev/video0")
        camera_service.update_camera(cam["id"], name="Cam", purpose="timelapse", bound_device={"type": "klipper", "id": "NOPAL"})
        assert camera_service.get_camera_bound_to("klipper", "OTHER") is None

    def test_no_match_when_purpose_is_not_timelapse(self):
        # update_camera solo persiste bound_device bajo purpose="timelapse"
        # (ver camera_service.update_camera) -- monitoring/other lo limpian.
        cam = _register_camera(device_path="/dev/video0")
        camera_service.update_camera(cam["id"], name="Cam", purpose="monitoring", bound_device={"type": "klipper", "id": "NOPAL"})
        assert camera_service.get_camera_bound_to("klipper", "NOPAL") is None


class TestMotionScore:
    def test_identical_frames_score_near_zero(self):
        assert timelapse_service._motion_score(FRAME_BLACK, FRAME_BLACK) < 1.0

    def test_black_vs_white_scores_high(self):
        assert timelapse_service._motion_score(FRAME_BLACK, FRAME_WHITE) > 200.0

    def test_garbage_bytes_score_zero_instead_of_raising(self):
        assert timelapse_service._motion_score(b"not-a-jpeg", b"also-not-a-jpeg") == 0.0


class TestCaptureAndSave:
    async def test_saves_frame_to_disk(self, monkeypatch):
        cam = _register_camera()

        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeCaptureProcess(stdout=FRAME_BLACK)

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        path = await timelapse_service.capture_and_save(cam["id"])
        assert path.endswith(".jpg")
        with open(path, "rb") as handle:
            assert handle.read() == FRAME_BLACK

    async def test_unknown_camera_raises(self):
        with pytest.raises(RuntimeError, match="no encontrada"):
            await timelapse_service.capture_and_save("does-not-exist")

    async def test_motion_detection_records_event_on_change(self, monkeypatch):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], motion_detection=True)

        frames = [FRAME_BLACK, FRAME_WHITE]

        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeCaptureProcess(stdout=frames.pop(0))

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        await timelapse_service.capture_and_save(cam["id"])
        assert timelapse_service.get_recent_motion_events() == []  # todavía no hay "anterior" para comparar

        await timelapse_service.capture_and_save(cam["id"])
        events = timelapse_service.get_recent_motion_events()
        assert len(events) == 1
        assert events[0]["camera_id"] == cam["id"]

    async def test_get_recent_motion_events_filters_by_since(self, monkeypatch):
        cam = _register_camera()
        timelapse_service._record_motion_event(cam["id"], "Cam", 99.0)
        future_cutoff = time.time() + 3600
        assert timelapse_service.get_recent_motion_events(since=future_cutoff) == []
        assert len(timelapse_service.get_recent_motion_events(since=0)) == 1


class TestTimelapseStats:
    def test_counts_frames_and_estimates_storage(self, monkeypatch):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], interval_s=5, fps=25)
        frames_dir = timelapse_service._frames_dir(cam["id"])
        for i in range(3):
            with open(f"{frames_dir}/{1000 + i}.jpg", "wb") as handle:
                handle.write(b"x" * 100)

        stats = timelapse_service.get_timelapse_stats(cam["id"])
        assert stats["frame_count"] == 3
        assert stats["duration_s"] == 15  # 3 fotogramas * 5s de intervalo
        assert stats["estimated_output_bytes"] == 300
        assert stats["storage_used_bytes"] >= 300
        assert stats["storage_total_bytes"] > 0

    def test_zero_frames_does_not_divide_by_zero(self):
        cam = _register_camera()
        stats = timelapse_service.get_timelapse_stats(cam["id"])
        assert stats["frame_count"] == 0
        assert stats["estimated_output_bytes"] == 0


class TestListCapturesAndFilePath:
    def test_lists_most_recent_first_with_limit(self):
        cam = _register_camera()
        frames_dir = timelapse_service._frames_dir(cam["id"])
        for name in ("1000.jpg", "2000.jpg", "3000.jpg"):
            with open(f"{frames_dir}/{name}", "wb") as handle:
                handle.write(b"x")

        all_captures = timelapse_service.list_captures(cam["id"])
        assert [c["filename"] for c in all_captures] == ["3000.jpg", "2000.jpg", "1000.jpg"]

        limited = timelapse_service.list_captures(cam["id"], limit=2)
        assert len(limited) == 2

    def test_get_capture_file_path_rejects_traversal(self):
        cam = _register_camera()
        frames_dir = timelapse_service._frames_dir(cam["id"])
        with open(f"{frames_dir}/real.jpg", "wb") as handle:
            handle.write(b"x")

        assert timelapse_service.get_capture_file_path(cam["id"], "real.jpg") is not None
        assert timelapse_service.get_capture_file_path(cam["id"], "../real.jpg") is None
        assert timelapse_service.get_capture_file_path(cam["id"], "../../etc/passwd") is None
        assert timelapse_service.get_capture_file_path(cam["id"], "sub/real.jpg") is None
        assert timelapse_service.get_capture_file_path(cam["id"], "missing.jpg") is None


class TestTimelapseTaskLifecycle:
    async def test_start_stop_running_state(self, monkeypatch):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], enabled=True, interval_s=3600)

        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeCaptureProcess(stdout=FRAME_BLACK)

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        assert timelapse_service.is_timelapse_running(cam["id"]) is False
        timelapse_service.start_timelapse(cam["id"])
        assert timelapse_service.is_timelapse_running(cam["id"]) is True
        timelapse_service.stop_timelapse(cam["id"])
        await asyncio.sleep(0)  # deja correr la cancelación
        assert timelapse_service.is_timelapse_running(cam["id"]) is False

    async def test_starting_twice_reuses_same_task(self, monkeypatch):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], enabled=True, interval_s=3600)
        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", _fake_create_subprocess_exec)

        timelapse_service.start_timelapse(cam["id"])
        first_task = timelapse_service._timelapse_tasks[cam["id"]]
        timelapse_service.start_timelapse(cam["id"])
        assert timelapse_service._timelapse_tasks[cam["id"]] is first_task
        timelapse_service.stop_timelapse(cam["id"])

    async def test_set_timelapse_config_starts_and_stops_task(self, monkeypatch):
        cam = _register_camera()
        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", _fake_create_subprocess_exec)

        timelapse_service.set_timelapse_config(cam["id"], enabled=True, interval_s=3600)
        assert timelapse_service.is_timelapse_running(cam["id"]) is True

        timelapse_service.set_timelapse_config(cam["id"], enabled=False)
        assert timelapse_service.is_timelapse_running(cam["id"]) is False

    def test_pause_resume_only_touch_paused_flag(self):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], enabled=True, interval_s=7)
        config = timelapse_service.pause_timelapse(cam["id"])
        assert config["paused"] is True
        assert config["enabled"] is True
        assert config["interval_s"] == 7
        config = timelapse_service.resume_timelapse(cam["id"])
        assert config["paused"] is False


class TestRecording:
    async def test_non_usb_camera_records_via_direct_process(self, monkeypatch):
        cam = _register_camera(source_url="http://fake-camera/stream.mjpeg")
        process = _FakeCaptureProcess()

        async def fake_create_subprocess_exec(*args, **kwargs):
            return process

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        assert timelapse_service.is_recording(cam["id"]) is False
        path = await timelapse_service.start_recording(cam["id"])
        assert path.endswith(".mp4")
        assert timelapse_service.is_recording(cam["id"]) is True

        stopped_path = await timelapse_service.stop_recording(cam["id"])
        assert stopped_path == path
        assert timelapse_service.is_recording(cam["id"]) is False

    async def test_cannot_start_recording_twice(self, monkeypatch):
        cam = _register_camera()
        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", _fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        await timelapse_service.start_recording(cam["id"])
        with pytest.raises(RuntimeError, match="curso"):
            await timelapse_service.start_recording(cam["id"])
        await timelapse_service.stop_recording(cam["id"])

    async def test_stopping_when_nothing_recording_returns_none(self):
        assert await timelapse_service.stop_recording("nobody-recording") is None

    async def test_usb_camera_pipes_shared_queue_frames_into_process(self, monkeypatch):
        cam = _register_camera(device_path="/dev/video0")
        process = _FakeCaptureProcess()
        process.stdin = _FakeStdin()

        async def fake_create_subprocess_exec(*args, **kwargs):
            return process

        queue = asyncio.Queue()

        async def fake_subscribe(camera_id, device_path):
            return queue

        unsubscribed = []

        async def fake_unsubscribe(camera_id, q):
            unsubscribed.append(camera_id)

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")
        monkeypatch.setattr(timelapse_service.usb_camera_service, "subscribe", fake_subscribe)
        monkeypatch.setattr(timelapse_service.usb_camera_service, "unsubscribe", fake_unsubscribe)

        await timelapse_service.start_recording(cam["id"])
        await queue.put(FRAME_BLACK)
        await asyncio.sleep(0.05)
        assert FRAME_BLACK in process.stdin.written

        await timelapse_service.stop_recording(cam["id"])
        assert unsubscribed == [cam["id"]]


class _FakeStdin:
    def __init__(self):
        self.written = []
        self._closing = False

    def write(self, data):
        self.written.append(data)

    async def drain(self):
        return None

    def is_closing(self):
        return self._closing

    def close(self):
        self._closing = True


class TestAssembleTimelapseVideo:
    async def test_requires_at_least_two_frames(self):
        cam = _register_camera()
        with pytest.raises(RuntimeError, match="suficientes"):
            await timelapse_service.assemble_timelapse_video(cam["id"])

    async def test_builds_concat_list_and_calls_ffmpeg(self, monkeypatch):
        cam = _register_camera()
        camera_service.update_timelapse_config(cam["id"], fps=10)
        frames_dir = timelapse_service._frames_dir(cam["id"])
        for name in ("1000.jpg", "2000.jpg"):
            with open(f"{frames_dir}/{name}", "wb") as handle:
                handle.write(FRAME_BLACK)

        captured_args = []

        async def fake_create_subprocess_exec(*args, **kwargs):
            captured_args.append(args)
            return _FakeCaptureProcess(returncode=0)

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        output_path = await timelapse_service.assemble_timelapse_video(cam["id"])
        assert output_path.endswith(".mp4")
        assert "-r" in captured_args[0]
        assert captured_args[0][captured_args[0].index("-r") + 1] == "10"

    async def test_nonzero_returncode_raises_with_stderr(self, monkeypatch):
        cam = _register_camera()
        frames_dir = timelapse_service._frames_dir(cam["id"])
        for name in ("1000.jpg", "2000.jpg"):
            with open(f"{frames_dir}/{name}", "wb") as handle:
                handle.write(FRAME_BLACK)

        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeCaptureProcess(stderr=b"boom", returncode=1)

        monkeypatch.setattr(timelapse_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        with pytest.raises(RuntimeError, match="boom"):
            await timelapse_service.assemble_timelapse_video(cam["id"])


class TestFfmpegMissing:
    async def test_capture_raises_actionable_error_without_ffmpeg(self, monkeypatch):
        cam = _register_camera()
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: None)
        with pytest.raises(RuntimeError, match="ffmpeg"):
            await timelapse_service.capture_and_save(cam["id"])

    async def test_start_recording_raises_actionable_error_without_ffmpeg(self, monkeypatch):
        cam = _register_camera()
        monkeypatch.setattr(timelapse_service.shutil, "which", lambda name: None)
        with pytest.raises(RuntimeError, match="ffmpeg"):
            await timelapse_service.start_recording(cam["id"])


class TestGrabacionesYBorrado:
    """Las grabaciones se escribían a disco desde el primer día pero no se
    podían listar ni borrar: el material solo crecía y nadie lo veía."""

    def test_lista_las_grabaciones_mas_nuevas_primero(self, tmp_path, monkeypatch):
        
        import os, time
        monkeypatch.setattr(timelapse_service.camera_service, "CAPTURES_DIR", str(tmp_path))
        carpeta = timelapse_service._recordings_dir("cam1")
        for i, nombre in enumerate(["100.mp4", "200.mp4", "300.mp4"]):
            ruta = os.path.join(carpeta, nombre)
            open(ruta, "wb").write(b"x" * (i + 1))
        nombres = [g["filename"] for g in timelapse_service.list_recordings("cam1")]
        assert nombres == ["300.mp4", "200.mp4", "100.mp4"]

    def test_borra_una_grabacion(self, tmp_path, monkeypatch):
        
        import os
        monkeypatch.setattr(timelapse_service.camera_service, "CAPTURES_DIR", str(tmp_path))
        ruta = os.path.join(timelapse_service._recordings_dir("cam1"), "a.mp4")
        open(ruta, "wb").write(b"x")
        assert timelapse_service.delete_recording("cam1", "a.mp4") is True
        assert not os.path.exists(ruta)
        assert timelapse_service.delete_recording("cam1", "a.mp4") is False

    def test_no_se_puede_salir_de_la_carpeta_de_la_camara(self, tmp_path, monkeypatch):
        """Sin esta comprobación, un nombre como '../../auth_users.json'
        borraría archivos fuera de las capturas."""
        
        import os
        monkeypatch.setattr(timelapse_service.camera_service, "CAPTURES_DIR", str(tmp_path))
        timelapse_service._recordings_dir("cam1")
        victima = tmp_path / "no-tocar.json"
        victima.write_text("{}", encoding="utf-8")
        for maligno in ["../no-tocar.json", "..", ".", "a/b.mp4", "..\\no-tocar.json"]:
            assert timelapse_service.delete_recording("cam1", maligno) is False, maligno
            assert timelapse_service.delete_capture("cam1", maligno) is False, maligno
        assert victima.exists(), "se borró un archivo fuera de la carpeta de la cámara"
