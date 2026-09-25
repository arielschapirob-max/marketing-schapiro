import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Settings:
    app_name: str = os.getenv("APP_NAME", "Análisis de Cuentas Clínicas")
    app_env: str = os.getenv("APP_ENV", "development")
    database_url: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'storage' / 'casos.db'}")
    output_dir: Path = Path(os.getenv("OUTPUT_DIRECTORY", str(BASE_DIR / "output")))
    tesseract_cmd: str = os.getenv("TESSERACT_CMD", "")
    tesseract_lang: str = os.getenv("TESSERACT_LANG", "spa")
    poppler_path: str = os.getenv("POPPLER_PATH", "")
    max_file_size_mb: int = int(os.getenv("MAX_FILE_SIZE_MB", "25"))
    enable_external_ai: bool = os.getenv("ENABLE_EXTERNAL_AI", "false").lower() == "true"
    current_user: str = os.getenv("CURRENT_USER", "abogado")

    @property
    def is_development(self) -> bool:
        return self.app_env.strip().lower() == "development"


settings = Settings()
settings.output_dir.mkdir(parents=True, exist_ok=True)
(BASE_DIR / "storage").mkdir(parents=True, exist_ok=True)
