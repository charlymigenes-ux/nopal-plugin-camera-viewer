import asyncio
import glob
import struct

import pytest

import backend.services.usb_camera_service as usb_camera_service
from backend.services.usb_camera_service import (
    V4L2_CAP_DEVICE_CAPS,
    V4L2_CAP_VIDEO_CAPTURE,
    _is_capture_device,
    _V4L2_CAP_STRUCT_FMT,
    ensure_stream,
    list_usb_video_devices,
    stop_stream,
    subscribe,
    unsubscribe,
)

HAS_REAL_V4L2_DEVICE = bool(glob.glob("/dev/video*"))


def _fake_querycap_bytes(driver="uvcvideo", card="Fake Cam", capabilities=0, device_caps=0):
    return struct.pack(
        _V4L2_CAP_STRUCT_FMT,
        driver.encode()[:16], card.encode()[:32], b"usb-fake",
        5, capabilities, device_caps, b"\x00" * 12,
    )


class TestIsCaptureDevice:
    def test_capture_bit_set_via_device_caps(self):
        caps = {"capabilities": V4L2_CAP_DEVICE_CAPS | V4L2_CAP_VIDEO_CAPTURE, "device_caps": V4L2_CAP_VIDEO_CAPTURE}
        assert _is_capture_device(caps) is True

    def test_metadata_only_node_is_excluded(self):
        # Mismo caso real que /dev/video1 de una GENERAL WEBCAM: capabilities
        # agregado incluye video capture, pero ESTE nodo puntual no.
        caps = {"capabilities": V4L2_CAP_DEVICE_CAPS | V4L2_CAP_VIDEO_CAPTURE, "device_caps": 0x04a00000}
        assert _is_capture_device(caps) is False

    def test_falls_back_to_capabilities_without_device_caps_flag(self):
        caps = {"capabilities": V4L2_CAP_VIDEO_CAPTURE, "device_caps": 0}
        assert _is_capture_device(caps) is True


class TestListUsbVideoDevices:
    def test_filters_out_non_capture_and_unreadable_nodes(self, monkeypatch):
        monkeypatch.setattr(usb_camera_service.glob, "glob", lambda pattern: ["/dev/video0", "/dev/video1", "/dev/video2"])

        def fake_query(path):
            if path == "/dev/video0":
                return {"driver": "uvcvideo", "card": "GENERAL WEBCAM", "capabilities": V4L2_CAP_DEVICE_CAPS | V4L2_CAP_VIDEO_CAPTURE, "device_caps": V4L2_CAP_VIDEO_CAPTURE}
            if path == "/dev/video1":
                return {"driver": "uvcvideo", "card": "GENERAL WEBCAM", "capabilities": V4L2_CAP_DEVICE_CAPS | V4L2_CAP_VIDEO_CAPTURE, "device_caps": 0x04a00000}
            return None  # /dev/video2: no se pudo abrir/consultar

        monkeypatch.setattr(usb_camera_service, "_query_v4l2_capability", fake_query)
        monkeypatch.setattr(usb_camera_service, "_resolve_usb_identity", lambda path: {"usb_location": "1-2", "vendor_id": "1b3f", "product_id": "2247", "product_name": "GENERAL WEBCAM"})

        devices = list_usb_video_devices()
        assert [d["device_path"] for d in devices] == ["/dev/video0"]
        assert devices[0]["name"] == "GENERAL WEBCAM"
        assert devices[0]["usb_location"] == "1-2"

    def test_empty_when_nothing_connected(self, monkeypatch):
        monkeypatch.setattr(usb_camera_service.glob, "glob", lambda pattern: [])
        assert list_usb_video_devices() == []

    @pytest.mark.skipif(not HAS_REAL_V4L2_DEVICE, reason="No hay /dev/video* en este entorno")
    def test_against_real_hardware_if_present(self):
        # Corre de verdad contra el hardware si lo hay (no mockeado) -- si
        # nada responde a VIDIOC_QUERYCAP como dispositivo de captura, la
        # lista puede quedar vacía sin que eso sea un fallo del test.
        devices = list_usb_video_devices()
        for device in devices:
            assert device["device_path"].startswith("/dev/video")
            assert device["name"]


class TestQueryV4l2Capability:
    def test_parses_real_ioctl_response_shape(self, monkeypatch, tmp_path):
        # Simula lo que fcntl.ioctl escribiría en el buffer, sin abrir un
        # dispositivo real -- valida el parseo de struct, no el syscall.
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")
        response = _fake_querycap_bytes(capabilities=V4L2_CAP_DEVICE_CAPS | V4L2_CAP_VIDEO_CAPTURE, device_caps=V4L2_CAP_VIDEO_CAPTURE)

        def fake_ioctl(fd, request, buf):
            buf[:] = response
            return 0

        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", fake_ioctl)
        result = usb_camera_service._query_v4l2_capability(str(fake_path))
        assert result["driver"] == "uvcvideo"
        assert result["card"] == "Fake Cam"
        assert result["device_caps"] & V4L2_CAP_VIDEO_CAPTURE

    def test_unreadable_device_returns_none(self):
        assert usb_camera_service._query_v4l2_capability("/dev/does-not-exist-nopal-test") is None


class _FakeProcess:
    def __init__(self, frames):
        self._frames = list(frames)
        self._last = self._frames[-1] if self._frames else b""
        self.stdout = self
        self.returncode = None
        self.killed = False
        self.pid = 12345

    async def read(self, n):
        if self._frames:
            return self._frames.pop(0)
        # Una cámara real no deja de entregar cuadros: repite el último con
        # una pausa mínima. El doble original se quedaba mudo tras los
        # primeros, y con eso un segundo suscriptor que llegaba después no
        # recibía nada nunca -- algo que en una cámara de verdad no pasa,
        # porque el siguiente cuadro llega en 100 ms.
        if self._last:
            await asyncio.sleep(0.01)
            return self._last
        # Sin cuadros: "todavía nada" sin cerrar el pipe. Cerrarlo
        # significaría que ffmpeg murió, que es un caso distinto.
        await asyncio.sleep(3600)
        return b""

    def kill(self):
        self.killed = True
        self.returncode = -9

    async def wait(self):
        # Un proceso vivo NO devuelve de wait(). El doble original devolvía
        # de inmediato, que es justo lo contrario de lo que hace un proceso
        # real, y hacía ver como muerto a un ffmpeg sano.
        while self.returncode is None:
            await asyncio.sleep(0.01)
        return self.returncode


class TestSharedStream:
    async def test_single_ffmpeg_process_shared_by_two_subscribers(self, monkeypatch):
        frame = b"\xff\xd8" + b"x" * 20 + b"\xff\xd9"
        create_calls = []

        async def fake_create_subprocess_exec(*args, **kwargs):
            create_calls.append(args)
            return _FakeProcess([frame, frame])

        monkeypatch.setattr(usb_camera_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(usb_camera_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        try:
            queue_a = await subscribe("cam-shared", "/dev/video0")
            queue_b = await subscribe("cam-shared", "/dev/video0")

            frame_a = await asyncio.wait_for(queue_a.get(), timeout=2)
            frame_b = await asyncio.wait_for(queue_b.get(), timeout=2)
            assert frame_a == frame
            assert frame_b == frame
            # Un solo proceso lanzado para 2 suscriptores -- ese es el punto
            # central del diseño (V4L2 no admite 2 lectores simultáneos).
            assert len(create_calls) == 1
        finally:
            await unsubscribe("cam-shared", queue_a)
            await unsubscribe("cam-shared", queue_b)
            await stop_stream("cam-shared")

    async def test_ffmpeg_not_installed_raises_actionable_error(self, monkeypatch):
        monkeypatch.setattr(usb_camera_service.shutil, "which", lambda name: None)
        with pytest.raises(RuntimeError, match="ffmpeg"):
            await ensure_stream("cam-no-ffmpeg", "/dev/video0")

    async def test_stop_stream_kills_process_and_clears_state(self, monkeypatch):
        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeProcess([])

        monkeypatch.setattr(usb_camera_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(usb_camera_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")

        stream = await ensure_stream("cam-stop", "/dev/video0")
        assert "cam-stop" in usb_camera_service._streams
        await stop_stream("cam-stop")
        assert "cam-stop" not in usb_camera_service._streams
        assert stream.process.killed is True

    async def test_idle_stop_after_last_subscriber_leaves(self, monkeypatch):
        async def fake_create_subprocess_exec(*args, **kwargs):
            return _FakeProcess([])

        monkeypatch.setattr(usb_camera_service.asyncio, "create_subprocess_exec", fake_create_subprocess_exec)
        monkeypatch.setattr(usb_camera_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")
        monkeypatch.setattr(usb_camera_service, "IDLE_STOP_DELAY", 0.05)
        monkeypatch.setattr(usb_camera_service, "STARTUP_GRACE_SECONDS", 0.05)

        queue = await subscribe("cam-idle", "/dev/video0")
        await unsubscribe("cam-idle", queue)
        assert "cam-idle" in usb_camera_service._streams  # todavía no, hay margen
        await asyncio.sleep(0.15)
        assert "cam-idle" not in usb_camera_service._streams


class TestFocusControl:
    def _fake_queryctrl_bytes(self, minimum=0, maximum=255, step=1, default_value=128, flags=0):
        return struct.pack(
            usb_camera_service._V4L2_QUERYCTRL_STRUCT_FMT,
            usb_camera_service.V4L2_CID_FOCUS_ABSOLUTE, 1, b"Focus".ljust(32, b"\x00"),
            minimum, maximum, step, default_value, flags, 0, 0,
        )

    def _fake_control_bytes(self, value=128):
        return struct.pack(usb_camera_service._V4L2_CONTROL_STRUCT_FMT, usb_camera_service.V4L2_CID_FOCUS_ABSOLUTE, value)

    def test_returns_range_and_current_value(self, monkeypatch, tmp_path):
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")

        def fake_ioctl(fd, request, buf):
            if request == usb_camera_service.VIDIOC_QUERYCTRL:
                buf[:] = self._fake_queryctrl_bytes(minimum=0, maximum=255, step=5, default_value=100)
            elif request == usb_camera_service.VIDIOC_G_CTRL:
                buf[:] = self._fake_control_bytes(value=150)
            return 0

        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", fake_ioctl)
        result = usb_camera_service.get_focus_control(str(fake_path))
        assert result == {"minimum": 0, "maximum": 255, "step": 5, "default": 100, "current": 150}

    def test_disabled_control_returns_none(self, monkeypatch, tmp_path):
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")

        def fake_ioctl(fd, request, buf):
            buf[:] = self._fake_queryctrl_bytes(flags=usb_camera_service.V4L2_CTRL_FLAG_DISABLED)
            return 0

        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", fake_ioctl)
        assert usb_camera_service.get_focus_control(str(fake_path)) is None

    def test_unsupported_control_returns_none(self, monkeypatch, tmp_path):
        # La mayoría de las webcams UVC de foco fijo ni siquiera tienen este
        # control -- VIDIOC_QUERYCTRL devuelve EINVAL, no un valor con flags.
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")

        def fake_ioctl(fd, request, buf):
            raise OSError("Invalid argument")

        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", fake_ioctl)
        assert usb_camera_service.get_focus_control(str(fake_path)) is None

    def test_unreadable_device_returns_none(self):
        assert usb_camera_service.get_focus_control("/dev/does-not-exist-nopal-test") is None

    def test_set_focus_success(self, monkeypatch, tmp_path):
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")
        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", lambda fd, request, buf: 0)
        assert usb_camera_service.set_focus(str(fake_path), 200) is True

    def test_set_focus_failure_returns_false(self, monkeypatch, tmp_path):
        fake_path = tmp_path / "fake-video-device"
        fake_path.write_bytes(b"")

        def fake_ioctl(fd, request, buf):
            raise OSError("Invalid argument")

        monkeypatch.setattr(usb_camera_service.fcntl, "ioctl", fake_ioctl)
        assert usb_camera_service.set_focus(str(fake_path), 200) is False

    def test_set_focus_unreadable_device_returns_false(self):
        assert usb_camera_service.set_focus("/dev/does-not-exist-nopal-test", 100) is False


def test_is_device_present_reflects_real_filesystem(tmp_path):
    missing = tmp_path / "video99"
    assert usb_camera_service.is_device_present(str(missing)) is False
    assert usb_camera_service.is_device_present(None) is False
    present = tmp_path / "video0"
    present.write_bytes(b"")
    assert usb_camera_service.is_device_present(str(present)) is True


class TestInputArgs:
    """De dónde lee ffmpeg: un nodo /dev/videoN o una URL.

    El caso que motivó esto: crowsnest sirve la webcam de Klipper por MJPEG
    pero escucha solo en 127.0.0.1, así que el navegador -- que corre en
    otra máquina -- nunca la alcanza, y el /dev/video0 tampoco se puede
    abrir dos veces porque crowsnest ya lo tiene. NOPAL la lee y la
    retransmite bajo su propia sesión.
    """

    def test_un_dispositivo_lleva_el_demuxer_v4l2(self):
        assert usb_camera_service._input_args("/dev/video0") == ["-f", "v4l2", "-i", "/dev/video0"]

    def test_una_url_no_lleva_v4l2(self):
        """Forzarle ese demuxer haría que ffmpeg intentara abrir la
        dirección como si fuera un nodo de dispositivo."""
        args = usb_camera_service._input_args("http://127.0.0.1:8080/?action=stream")
        assert "-f" not in args or "v4l2" not in args
        assert args[-2:] == ["-i", "http://127.0.0.1:8080/?action=stream"]

    def test_una_url_se_reconecta_sola(self):
        """El proveedor puede reiniciarse; un corte de un segundo no debe
        dejar la cámara muerta hasta que alguien recargue el panel."""
        assert "-reconnect" in usb_camera_service._input_args("http://host/stream")

    def test_mayusculas_y_rtsp_tambien_cuentan_como_url(self):
        for fuente in ("HTTP://host/x", "https://host/x", "rtsp://host/x"):
            assert "v4l2" not in usb_camera_service._input_args(fuente), fuente


class TestFalloConMotivo:
    """Una cámara que no arranca tiene que decir POR QUÉ.

    Antes, si ffmpeg moría al abrir el dispositivo, el endpoint ya había
    respondido 200 con un stream vacío que nunca daba un cuadro: el
    navegador se quedaba con un recuadro negro y el motivo existía solo en
    el log del servidor.
    """

    async def _proceso_que_muere(self, monkeypatch, stderr):
        class _Tubo:
            """stdout y stderr son tuberías DISTINTAS. Compartir una sola
            hacía que el motivo se leyera como si fuera video y se perdiera."""

            def __init__(self, contenido=b""):
                self._contenido = contenido

            async def read(self, n=-1):
                datos, self._contenido = self._contenido, b""
                return datos

        class _Muerto:
            def __init__(self):
                self.stdout = _Tubo()          # cierra de inmediato: no hay video
                self.stderr = _Tubo(stderr)    # y acá está el porqué
                self.returncode = 1            # ya murió
                self.pid = 1

            def kill(self):
                self.returncode = -9

            async def wait(self):
                return self.returncode

        async def fake_exec(*args, **kwargs):
            return _Muerto()

        monkeypatch.setattr(usb_camera_service.asyncio, "create_subprocess_exec", fake_exec)
        monkeypatch.setattr(usb_camera_service.shutil, "which", lambda name: "/usr/bin/ffmpeg")
        monkeypatch.setattr(usb_camera_service, "STARTUP_GRACE_SECONDS", 0.5)

    async def test_dispositivo_ocupado_explica_que_otro_lo_tiene(self, monkeypatch):
        await self._proceso_que_muere(
            monkeypatch, b"Error opening input files: Device or resource busy")
        with pytest.raises(RuntimeError, match="ya está usando esta cámara"):
            await subscribe("cam-ocupada", "/dev/video0")

    async def test_sin_ancho_de_banda_no_dice_que_falta_disco(self, monkeypatch):
        """'No space left on device' en V4L2 NO habla del disco. Repetirle
        eso al usuario lo manda a revisar el lugar equivocado."""
        await self._proceso_que_muere(
            monkeypatch, b"Error opening input files: No space left on device")
        with pytest.raises(RuntimeError) as exc:
            await subscribe("cam-sin-banda", "/dev/video2")
        assert "ancho de banda USB" in str(exc.value)
        assert "disco" not in str(exc.value).replace("No es el disco", "")

    async def test_el_stream_muerto_no_queda_registrado(self, monkeypatch):
        """Si quedara, el siguiente intento reusaría un proceso difunto."""
        await self._proceso_que_muere(monkeypatch, b"Device or resource busy")
        with pytest.raises(RuntimeError):
            await subscribe("cam-fantasma", "/dev/video0")
        assert "cam-fantasma" not in usb_camera_service._streams
