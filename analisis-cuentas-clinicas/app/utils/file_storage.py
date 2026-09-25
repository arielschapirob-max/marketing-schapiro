"""Almacenamiento local de archivos cargados por caso (sin servicios externos)."""

import shutil
import uuid
from pathlib import Path

from app.config import settings


def guardar_archivo_caso(caso_id: int, archivo_subido) -> Path:
    carpeta_caso = settings.storage_dir / str(caso_id)
    carpeta_caso.mkdir(parents=True, exist_ok=True)
    extension = Path(archivo_subido.name).suffix
    nombre_unico = f"{uuid.uuid4().hex}{extension}"
    ruta_destino = carpeta_caso / nombre_unico
    with open(ruta_destino, "wb") as f:
        f.write(archivo_subido.getbuffer())
    return ruta_destino


def eliminar_archivos_caso(caso_id: int) -> None:
    carpeta_caso = settings.storage_dir / str(caso_id)
    if carpeta_caso.exists():
        shutil.rmtree(carpeta_caso)
