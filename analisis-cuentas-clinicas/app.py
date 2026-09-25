import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import streamlit as st

from app.config import settings
from app.db.database import init_db

st.set_page_config(page_title=settings.app_name, layout="wide")
init_db()

if settings.is_development:
    st.sidebar.caption("🛠️ Modo desarrollo")

pagina_inicio = st.Page("views/inicio.py", title="Inicio", icon=":material/home:", default=True)
pagina_cargar_caso = st.Page("views/cargar_caso.py", title="Cargar Caso", icon=":material/upload_file:")
pagina_revision_manual = st.Page("views/revision_manual.py", title="Revisión Manual", icon=":material/fact_check:")
pagina_hallazgos = st.Page("views/hallazgos.py", title="Hallazgos", icon=":material/search:")
pagina_informes = st.Page("views/informes.py", title="Informes", icon=":material/description:")
pagina_configuracion = st.Page(
    "views/configuracion_auditoria.py", title="Configuración y Auditoría", icon=":material/settings:"
)

navegacion = st.navigation(
    [
        pagina_inicio,
        pagina_cargar_caso,
        pagina_revision_manual,
        pagina_hallazgos,
        pagina_informes,
        pagina_configuracion,
    ]
)
navegacion.run()
