import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.config import settings
from app.db.database import get_session, init_db
from app.db.models import Caso, RegistroAcceso

st.set_page_config(page_title="Configuración y auditoría", layout="wide")
init_db()
st.title("Configuración y auditoría")

st.subheader("Configuración de entorno")
st.write(f"Base de datos: `{settings.database_url}`")
st.write(f"Carpeta de almacenamiento: `{settings.storage_dir}`")
st.write(f"Uso de IA externa habilitado: **{'Sí' if settings.permitir_ia_externa else 'No'}**")
if settings.permitir_ia_externa:
    st.warning(
        "El uso de servicios de IA externos está habilitado por configuración (PERMITIR_IA_EXTERNA=true). "
        "Verifique que exista autorización expresa antes de enviar cualquier documento a un servicio de terceros. "
        "La aplicación, por diseño, no envía documentos a servicios externos de forma automática."
    )
else:
    st.success(
        "El procesamiento se realiza exclusivamente en forma local. No se envían documentos a servicios externos."
    )

st.divider()
st.subheader("Registro de acceso")
session = get_session()
casos = session.query(Caso).order_by(Caso.fecha_creacion.desc()).all()
opciones = {f"{c.nombre_cliente} (ID {c.id})": c.id for c in casos}
if opciones:
    seleccion = st.selectbox("Filtrar por caso", ["Todos"] + list(opciones.keys()))
    query = session.query(RegistroAcceso)
    if seleccion != "Todos":
        query = query.filter(RegistroAcceso.caso_id == opciones[seleccion])
    registros = query.order_by(RegistroAcceso.fecha.desc()).limit(200).all()
    if not registros:
        st.caption("Sin registros de acceso todavía.")
    for r in registros:
        detalle = f" · {r.detalle}" if r.detalle else ""
        st.text(f"[{r.fecha.strftime('%d-%m-%Y %H:%M')}] Caso {r.caso_id} · {r.usuario} · {r.accion}{detalle}")
else:
    st.info("No hay casos registrados.")
session.close()
