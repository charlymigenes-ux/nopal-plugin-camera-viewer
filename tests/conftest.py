"""Fixtures para los tests de este plugin.

Este plugin corre EN PROCESO con NOPAL (no está sandboxeado -- ver el
docstring de backend/router.py) y su router usa `backend.auth_deps` de
NOPAL core en tiempo de ejecución (import absoluto e intencional, ver
backend/router.py). Para correr estos tests hace falta un checkout de
NOPAL core accesible:

- Por convención, este repo se clona dentro de plugins/camera-viewer/ de
  ese checkout (ver plugin_installer_service.py de NOPAL core), en cuyo
  caso NOPAL core está 2 niveles arriba de esta carpeta de tests/.
- Si se corre desde otro lado, seteá la variable de entorno
  NOPAL_CORE_ROOT apuntando al checkout de NOPAL.

Carga backend/router.py de este mismo plugin con la misma técnica que usa
backend/services/plugin_loader_service.py de NOPAL core (duplicada acá,
self-contained, para no depender de su layout interno) -- así los tests
ejercitan el router exactamente como se carga en producción, no un import
distinto que podría comportarse diferente.

IMPORTANTE sobre el orden: esta carga pasa a nivel de MÓDULO (no dentro de
un fixture) porque pytest importa los archivos de test (con sus `import
backend.api.cameras as cameras_api` de nivel de módulo) durante la
recolección, antes de correr ningún fixture -- si el alias de sys.modules
se armara recién dentro de un fixture, llegaría tarde.
"""

import importlib.util
import os
import sys
import types
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

PLUGIN_ROOT = Path(__file__).resolve().parents[1]
NOPAL_CORE_ROOT = Path(os.environ.get("NOPAL_CORE_ROOT") or PLUGIN_ROOT.parents[1])
if str(NOPAL_CORE_ROOT) not in sys.path:
    sys.path.insert(0, str(NOPAL_CORE_ROOT))

try:
    from backend.auth_deps import require_auth
except ImportError as e:
    raise RuntimeError(
        "No se pudo importar backend.auth_deps de NOPAL core. Este plugin no es "
        "standalone (corre en proceso con NOPAL) -- corré estos tests desde un "
        "checkout de NOPAL con este repo en plugins/camera-viewer/, o seteá "
        "NOPAL_CORE_ROOT apuntando a uno."
    ) from e

ADMIN_USER = {"id": "test-admin", "username": "test-admin", "role": "admin"}
OPERATOR_USER = {"id": "test-operator", "username": "test-operator", "role": "operator"}

_TEST_NAMESPACE = "nopal_plugin_test_camera_viewer"


def _install_alias(dotted_name: str, module: types.ModuleType) -> None:
    """Registra `module` en sys.modules bajo `dotted_name` Y lo cuelga como
    atributo de su paquete padre -- ambas cosas hacen falta para que
    `import backend.api.cameras as x` funcione (Python resuelve el nombre
    completo por atributos sobre el padre ya importado, no solo por
    sys.modules[nombre_completo]). Crea paquetes padre sintéticos vacíos
    (namespace) los niveles intermedios que no existan todavía (ej.
    "backend.api", que en NOPAL core está vacío salvo por los routers que
    ya no viven ahí) -- nunca reemplaza "backend" en sí, que sigue siendo
    el paquete real de NOPAL core (necesario para backend.auth_deps)."""
    sys.modules[dotted_name] = module
    parent_name, _, child_name = dotted_name.rpartition(".")
    if not parent_name:
        return
    parent_module = sys.modules.get(parent_name)
    if parent_module is None:
        parent_module = types.ModuleType(parent_name)
        parent_module.__path__ = []
        _install_alias(parent_name, parent_module)
    setattr(parent_module, child_name, module)


def _load_router():
    if _TEST_NAMESPACE not in sys.modules:
        ns_module = types.ModuleType(_TEST_NAMESPACE)
        ns_module.__path__ = []
        sys.modules[_TEST_NAMESPACE] = ns_module

    backend_dir = PLUGIN_ROOT / "backend"
    pkg_name = f"{_TEST_NAMESPACE}.pkg"
    pkg_spec = importlib.util.spec_from_file_location(
        pkg_name, backend_dir / "__init__.py", submodule_search_locations=[str(backend_dir)],
    )
    pkg_module = importlib.util.module_from_spec(pkg_spec)
    sys.modules[pkg_name] = pkg_module
    pkg_spec.loader.exec_module(pkg_module)

    module_name = f"{pkg_name}.router"
    module_spec = importlib.util.spec_from_file_location(module_name, backend_dir / "router.py")
    module = importlib.util.module_from_spec(module_spec)
    module.__package__ = pkg_name
    sys.modules[module_name] = module
    module_spec.loader.exec_module(module)

    # Alias bajo los nombres "backend.api.cameras" / "backend.services.*" --
    # los archivos de test de este plugin se escribieron cuando este código
    # vivía físicamente ahí, dentro de NOPAL core. En vez de reescribir cada
    # test, se registran estos alias en sys.modules para que los `import
    # backend.api.cameras` de esos archivos encuentren el módulo de este
    # plugin ya cargado, en vez de buscarlo en el checkout de NOPAL core
    # (donde ya no existe, se migró acá). `backend.auth_deps` NO se alias --
    # ese sigue siendo el real de NOPAL core, es la única dependencia real
    # que este plugin tiene sobre su proceso anfitrión.
    _install_alias("backend.api.cameras", module)
    _install_alias("backend.services.camera_service", sys.modules[f"{pkg_name}.services.camera_service"])
    _install_alias("backend.services.usb_camera_service", sys.modules[f"{pkg_name}.services.usb_camera_service"])
    _install_alias("backend.services.onvif_service", sys.modules[f"{pkg_name}.services.onvif_service"])
    return module


_ROUTER_MODULE = _load_router()


@pytest.fixture(scope="session")
def app():
    fastapi_app = FastAPI()
    fastapi_app.include_router(_ROUTER_MODULE.router)
    return fastapi_app


@pytest.fixture(scope="session")
def client(app):
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def as_admin(app):
    """Mismo mecanismo que el conftest.py de NOPAL core: reemplaza
    `require_auth` (el mismo objeto que importó backend/router.py, Python
    cachea módulos) en vez de pasar por una sesión real."""
    app.dependency_overrides[require_auth] = lambda: ADMIN_USER
    yield ADMIN_USER
    app.dependency_overrides.pop(require_auth, None)


@pytest.fixture
def as_operator(app):
    app.dependency_overrides[require_auth] = lambda: OPERATOR_USER
    yield OPERATOR_USER
    app.dependency_overrides.pop(require_auth, None)


@pytest.fixture(autouse=True)
def isolated_registries(tmp_path, monkeypatch):
    """Aísla los registros de este plugin (cámaras) a un directorio
    temporal por test -- mismo criterio que NOPAL core: nunca tocar los
    archivos reales del checkout donde se corran los tests."""
    camera_service = sys.modules["backend.services.camera_service"]
    monkeypatch.setattr(camera_service, "REGISTRY_PATH", str(tmp_path / "camera_registry.json"))
    yield tmp_path


@pytest.fixture
def isolated_printer_registries(isolated_registries):
    """Alias de compatibilidad: test_cameras_api.py se escribió cuando este
    código convivía en NOPAL core junto a los registros de impresoras
    (bambu/elegoo/flashforge) bajo ese nombre de fixture. Acá solo hay
    cámaras, así que es equivalente a isolated_registries."""
    yield isolated_registries
