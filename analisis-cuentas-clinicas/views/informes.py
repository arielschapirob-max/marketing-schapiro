import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.config import settings
from app.db.database import get_session
from app.db.models import Caso, Hallazgo, ItemCuenta, RegistroCambio
from app.reports.commercial_proposal_docx import generar_propuesta_docx
from app.reports.commercial_proposal_pdf import generar_propuesta_pdf
from app.reports.internal_report_docx import generar_informe_interno_docx
from app.reports.internal_report_xlsx import generar_informe_interno_xlsx
from app.reports.texts import REGLAS_PROPUESTA_EXTERNA
from app.security.audit import registrar_acceso

st.title("Generación de informes")

session = get_session()
casos = session.query(Caso).order_by(Caso.fecha_creacion.desc()).all()
if not casos:
    st.warning("No hay casos disponibles.")
    st.stop()

opciones = {f"{c.nombre_cliente} (ID {c.id})": c.id for c in casos}
seleccion = st.selectbox("Seleccione el caso", list(opciones.keys()))
caso_id = opciones[seleccion]
caso = session.get(Caso, caso_id)

items = session.query(ItemCuenta).filter(ItemCuenta.caso_id == caso.id).all()
hallazgos = session.query(Hallazgo).filter(Hallazgo.caso_id == caso.id).all()
historial = (
    session.query(RegistroCambio).filter(RegistroCambio.caso_id == caso.id).order_by(RegistroCambio.fecha).all()
)

carpeta_salida = settings.output_dir / str(caso.id) / "informes"
carpeta_salida.mkdir(parents=True, exist_ok=True)

tab_interno, tab_comercial = st.tabs(["Informe interno (confidencial)", "Propuesta comercial"])

with tab_interno:
    st.warning(
        "Este informe es de uso exclusivo del abogado responsable y contiene metodología, fundamentos y "
        "detalle completo de hallazgos. No debe compartirse con el potencial cliente."
    )
    if not caso.aprobado_por_abogado:
        st.error(
            "El caso aún no ha sido aprobado por el abogado en la revisión manual. Se recomienda completar "
            "dicha aprobación antes de emitir el informe interno."
        )
    if st.button("Generar informe interno (DOCX + XLSX)"):
        ruta_docx = carpeta_salida / f"informe_interno_{caso.id}.docx"
        ruta_xlsx = carpeta_salida / f"informe_interno_{caso.id}.xlsx"
        generar_informe_interno_docx(caso, items, hallazgos, historial, str(ruta_docx))
        generar_informe_interno_xlsx(caso, items, hallazgos, historial, str(ruta_xlsx))
        registrar_acceso(session, caso.id, settings.current_user, "generacion_informe_interno")
        st.success("Informe interno generado.")
        st.session_state["ruta_informe_docx"] = str(ruta_docx)
        st.session_state["ruta_informe_xlsx"] = str(ruta_xlsx)

    if st.session_state.get("ruta_informe_docx"):
        with open(st.session_state["ruta_informe_docx"], "rb") as f:
            st.download_button(
                "Descargar informe interno (DOCX)",
                f,
                file_name=Path(st.session_state["ruta_informe_docx"]).name,
            )
    if st.session_state.get("ruta_informe_xlsx"):
        with open(st.session_state["ruta_informe_xlsx"], "rb") as f:
            st.download_button(
                "Descargar informe interno (XLSX)",
                f,
                file_name=Path(st.session_state["ruta_informe_xlsx"]).name,
            )

with tab_comercial:
    st.info(
        "Esta propuesta es breve (máx. dos páginas) y no revela metodología, códigos, fundamentos jurídicos "
        "específicos, jurisprudencia ni estrategia de reclamación."
    )
    with st.expander("Reglas de la propuesta comercial"):
        for regla in REGLAS_PROPUESTA_EXTERNA:
            st.caption(f"• {regla}")
    with st.form("form_honorarios"):
        honorario_fijo_texto = st.text_input("Honorario fijo (texto, ej: 'UF 15')", value="")
        incluir_exito = st.checkbox("Incluir honorario de éxito")
        honorario_exito_texto = st.text_input(
            "Honorario de éxito (texto, ej: '15% del monto recuperado')", value=""
        )
        gastos_texto = st.text_input("Gastos (texto, opcional)", value="")
        exclusiones_texto = st.text_area(
            "Exclusiones (opcional; si se deja vacío se usa el texto por defecto)", value=""
        )
        vigencia_dias = st.number_input("Vigencia de la propuesta (días)", min_value=1, max_value=90, value=15)
        generar = st.form_submit_button("Generar propuesta comercial (DOCX + PDF)")

    if generar:
        honorarios = {
            "honorario_fijo_texto": honorario_fijo_texto or "A definir en reunión",
            "honorario_exito": incluir_exito,
            "honorario_exito_texto": honorario_exito_texto,
            "gastos_texto": gastos_texto,
            "exclusiones_texto": exclusiones_texto,
        }
        ruta_docx = carpeta_salida / f"propuesta_comercial_{caso.id}.docx"
        ruta_pdf = carpeta_salida / f"propuesta_comercial_{caso.id}.pdf"
        generar_propuesta_docx(caso, honorarios, str(ruta_docx), vigencia_dias)
        generar_propuesta_pdf(caso, honorarios, str(ruta_pdf), vigencia_dias)
        registrar_acceso(session, caso.id, settings.current_user, "generacion_propuesta_comercial")
        st.success("Propuesta comercial generada.")
        st.session_state["ruta_propuesta_docx"] = str(ruta_docx)
        st.session_state["ruta_propuesta_pdf"] = str(ruta_pdf)

    if st.session_state.get("ruta_propuesta_docx"):
        with open(st.session_state["ruta_propuesta_docx"], "rb") as f:
            st.download_button(
                "Descargar propuesta (DOCX)",
                f,
                file_name=Path(st.session_state["ruta_propuesta_docx"]).name,
            )
    if st.session_state.get("ruta_propuesta_pdf"):
        with open(st.session_state["ruta_propuesta_pdf"], "rb") as f:
            st.download_button(
                "Descargar propuesta (PDF)",
                f,
                file_name=Path(st.session_state["ruta_propuesta_pdf"]).name,
            )

session.close()
