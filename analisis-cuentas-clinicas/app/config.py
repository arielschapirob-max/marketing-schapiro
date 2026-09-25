import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'data' / 'app.db'}")
    storage_dir: Path = Path(os.getenv("STORAGE_DIR", str(BASE_DIR / "data" / "casos")))
    tesseract_cmd: str = os.getenv("TESSERACT_CMD", "")
    poppler_path: str = os.getenv("POPPLER_PATH", "")
    permitir_ia_externa: bool = os.getenv("PERMITIR_IA_EXTERNA", "false").lower() == "true"
    usuario_actual: str = os.getenv("USUARIO_ACTUAL", "abogado")
    idioma: str = os.getenv("IDIOMA", "es")


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)
