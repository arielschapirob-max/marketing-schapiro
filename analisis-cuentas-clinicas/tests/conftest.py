"""Aísla la base de datos y la carpeta de salida usadas durante `pytest` en un
directorio temporal, para que ningún test (incluidos los basados en
streamlit.testing.v1.AppTest, que ejecutan páginas reales con
app.db.database.get_session()) toque storage/casos.db ni output/ del
proyecto real. Debe ejecutarse antes de que cualquier test importe
app.config, por eso vive en conftest.py y usa os.environ.setdefault.
"""

import os
import tempfile

_directorio_temporal = tempfile.mkdtemp(prefix="analisis_cuentas_pytest_")
os.environ.setdefault("DATABASE_URL", f"sqlite:///{_directorio_temporal}/test.db")
os.environ.setdefault("OUTPUT_DIRECTORY", f"{_directorio_temporal}/output")
