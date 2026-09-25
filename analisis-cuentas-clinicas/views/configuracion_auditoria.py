import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.config import settings
from app.db.database import get_session
from app.db.models import Caso, RegistroAcceso

st.title("Configuración y auditoría")

st.subheader("Configuración de entorno")
st.write(f"Nombre de la aplicación: `{settings.app_name}`")
st.write(f"Entorno: `{settings.app_env}`")
st.write(f"Base de datos: `{settings.database_url}`")
st.write(f"Carpeta de salida (documentos e informes por caso): `{settings.output_dir}`")
st.write(f"Idioma de OCR (Tesseract): `{settings.tesseract_lang}`")
st.write(f"Tamaño máximo por archivo cargado: {settings.max_file_size_mb} MB")
st.write(f"Uso de IA externa habilitado: **{'Sí' if settings.enable_external_ai else 'No'}**")
if settings.enable_external_ai:
    st.warning(
        "El uso de servicios de IA externos está habilitado por configuración (ENABLE_EXTERNAL_AI=true). "
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
