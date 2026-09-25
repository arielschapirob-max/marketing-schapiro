import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import streamlit as st

from app.config import settings
from app.db.database import get_session, init_db
from app.db.models import Caso
from app.extraction.normalization import enmascarar_rut
from app.security.audit import registrar_acceso
from app.utils.file_storage import eliminar_archivos_caso

st.set_page_config(page_title="Análisis de Cuentas Clínicas", layout="wide")
init_db()

st.title("Análisis de Cuentas Clínicas e Isapres")
st.caption(
    "Herramienta de uso interno para apoyo al análisis jurídico-técnico de cuentas clínicas y liquidaciones "
    "de isapre. Procesamiento 100% local. La decisión jurídica definitiva corresponde siempre al abogado "
    "responsable del caso."
)

with st.expander("Aviso de datos sensibles y consentimiento", expanded=True):
    st.warning(
        "Esta herramienta procesa datos personales sensibles (datos de salud) de conformidad con la normativa "
        "vigente de protección de datos personales. El procesamiento es local y no se envían documentos a "
        "servicios externos, salvo autorización expresa por caso. Al continuar, usted declara contar con la "
        "autorización correspondiente para el tratamiento de estos antecedentes."
    )

st.divider()
st.subheader("Casos")

session = get_session()
casos = session.query(Caso).order_by(Caso.fecha_creacion.desc()).all()

with st.form("nuevo_caso"):
    st.write("Crear nuevo caso")
    col1, col2 = st.columns(2)
    nombre_cliente = col1.text_input("Nombre del potencial cliente / afiliado")
    rut_cliente = col2.text_input("RUT del afiliado (opcional)")
    isapre = col1.text_input("Isapre (opcional)")
    numero_cuenta = col2.text_input("Número de cuenta (opcional)")
    consentimiento = st.checkbox(
        "Confirmo que cuento con autorización para tratar estos antecedentes y acepto el aviso anterior."
    )
    crear = st.form_submit_button("Crear caso")

    if crear:
        if not nombre_cliente:
            st.error("El nombre del cliente es obligatorio.")
        elif not consentimiento:
            st.error("Debe aceptar el aviso de datos sensibles para continuar.")
        else:
            caso = Caso(
                nombre_cliente=nombre_cliente,
                rut_cliente=rut_cliente or None,
                isapre=isapre or None,
                numero_cuenta=numero_cuenta or None,
                consentimiento_aceptado=True,
                consentimiento_fecha=datetime.utcnow(),
            )
            session.add(caso)
            session.commit()
            registrar_acceso(session, caso.id, settings.usuario_actual, "creacion_caso")
            st.success(f"Caso creado: {caso.nombre_cliente} (ID {caso.id})")
            st.rerun()

st.divider()

for caso in casos:
    with st.container(border=True):
        col1, col2, col3 = st.columns([3, 2, 1])
        col1.markdown(f"**{caso.nombre_cliente}** (ID {caso.id})")
        rut_mostrar = enmascarar_rut(caso.rut_cliente) if caso.rut_cliente else "N/D"
        col1.caption(
            f"RUT: {rut_mostrar} · Isapre: {caso.isapre or 'N/D'} · Cuenta: {caso.numero_cuenta or 'N/D'}"
        )
        col2.caption(f"Creado: {caso.fecha_creacion.strftime('%d-%m-%Y')}")
        col2.caption(f"Aprobado por abogado: {'Sí' if caso.aprobado_por_abogado else 'No'}")
        if col3.button("Eliminar caso", key=f"eliminar_{caso.id}"):
            eliminar_archivos_caso(caso.id)
            session.delete(caso)
            session.commit()
            st.warning(f"Caso {caso.id} eliminado junto con sus archivos.")
            st.rerun()

session.close()

st.divider()
st.info("Use el menú lateral para cargar documentos, revisar ítems, gestionar hallazgos y generar informes.")
