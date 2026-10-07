from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()

# Columnas agregadas después de la creación inicial de cada tabla. Como
# ``Base.metadata.create_all`` solo crea tablas nuevas y nunca altera las
# existentes, una base de datos SQLite de un caso ya en uso (como la de un
# abogado trabajando un caso real) se queda sin las columnas nuevas si no se
# agregan explícitamente — ver ``_migrar_columnas_faltantes``.
COLUMNAS_NUEVAS_POR_TABLA = {
    "hallazgos": [
        ("verificacion_ia_texto", "TEXT"),
        ("verificacion_ia_fecha", "DATETIME"),
    ],
}


def _migrar_columnas_faltantes() -> None:
    if not settings.database_url.startswith("sqlite"):
        return
    inspector = inspect(engine)
    nombres_tablas = set(inspector.get_table_names())
    with engine.begin() as conexion:
        for tabla, columnas in COLUMNAS_NUEVAS_POR_TABLA.items():
            if tabla not in nombres_tablas:
                continue
            columnas_existentes = {c["name"] for c in inspector.get_columns(tabla)}
            for nombre_columna, tipo_sql in columnas:
                if nombre_columna not in columnas_existentes:
                    conexion.execute(text(f"ALTER TABLE {tabla} ADD COLUMN {nombre_columna} {tipo_sql}"))


def init_db() -> None:
    from app.db import models  # noqa: F401 - registra los modelos en Base.metadata

    Base.metadata.create_all(bind=engine)
    _migrar_columnas_faltantes()


def get_session():
    return SessionLocal()
