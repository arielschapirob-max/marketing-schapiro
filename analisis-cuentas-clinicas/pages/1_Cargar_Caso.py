import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.config import settings
from app.db.database import get_session, init_db
from app.db.models import Caso, Documento, ItemCuenta
from app.extraction.pipeline import procesar_documento
from app.security.audit import registrar_acceso
from app.utils.file_storage import guardar_archivo_caso

st.set_page_config(page_title="Cargar Caso", layout="wide")
init_db()
st.title("Cargar documentos del caso")

session = get_session()
casos = session.query(Caso).order_by(Caso.fecha_creacion.desc()).all()
if not casos:
    st.warning("Primero debe crear un caso en la página de inicio.")
    st.stop()

opciones = {f"{c.nombre_cliente} (ID {c.id})": c.id for c in casos}
seleccion = st.selectbox("Seleccione el caso", list(opciones.keys()))
caso_id = opciones[seleccion]
caso = session.get(Caso, caso_id)

if not caso.consentimiento_aceptado:
    st.error("Este caso no tiene consentimiento registrado. Vuelva a la página de inicio.")
    st.stop()

archivos = st.file_uploader(
    "Cargue uno o más documentos (PDF, JPG, PNG, DOCX, XLSX)",
    type=["pdf", "jpg", "jpeg", "png", "docx", "xlsx"],
    accept_multiple_files=True,
)

if st.button("Procesar documentos", disabled=not archivos):
    barra = st.progress(0.0)
    total_items_creados = 0
    for idx, archivo in enumerate(archivos):
        ruta = guardar_archivo_caso(caso.id, archivo)
        with st.spinner(f"Extrayendo información de {archivo.name}..."):
            try:
                resultado = procesar_documento(str(ruta))
            except Exception as exc:
                st.error(f"No fue posible procesar {archivo.name}: {exc}")
                continue

        documento = Documento(
            caso_id=caso.id,
            nombre_archivo=archivo.name,
            tipo_archivo=ruta.suffix.lower(),
            ruta_archivo=str(ruta),
            texto_extraido=resultado["texto_extraido"],
            metodo_extraccion=resultado["metodo_extraccion"],
        )
        session.add(documento)
        session.commit()

        campos_globales = resultado["campos_globales"].get("campos", {})
        confianza_globales = resultado["campos_globales"].get("confianza", {})
        items = resultado["items"]

        for item_data in items:
            confianza = item_data.get("confianza", {})
            item = ItemCuenta(
                caso_id=caso.id,
                documento_id=documento.id,
                numero_cuenta=caso.numero_cuenta or campos_globales.get("numero_cuenta"),
                afiliado=item_data.get("afiliado") or campos_globales.get("afiliado"),
                rut=item_data.get("rut") or campos_globales.get("rut") or caso.rut_cliente,
                prestador=item_data.get("prestador") or campos_globales.get("prestador") or caso.prestador,
                isapre=item_data.get("isapre") or campos_globales.get("isapre") or caso.isapre,
                fecha=item_data.get("fecha") or campos_globales.get("fecha"),
                diagnostico=item_data.get("diagnostico") or campos_globales.get("diagnostico"),
                codigo_prestacion=item_data.get("codigo_prestacion"),
                descripcion=item_data.get("descripcion"),
                cantidad=item_data.get("cantidad"),
                valor_cobrado=item_data.get("valor_cobrado"),
                valor_bonificado=item_data.get("valor_bonificado"),
                copago=item_data.get("copago"),
                monto_no_cubierto=item_data.get("monto_no_cubierto"),
                glosa=item_data.get("glosa"),
                deducible=item_data.get("deducible"),
                total=item_data.get("total"),
            )
            item.set_confianza({**confianza_globales, **confianza})
            session.add(item)
            total_items_creados += 1
        session.commit()
        barra.progress((idx + 1) / len(archivos))

    registrar_acceso(
        session,
        caso.id,
        settings.usuario_actual,
        "carga_documentos",
        detalle=f"{len(archivos)} archivo(s), {total_items_creados} ítem(es) extraídos",
    )
    st.success(
        f"Procesamiento completado. Se extrajeron {total_items_creados} ítem(es) preliminares. "
        "Continúe a la página de Revisión Manual para validar la información antes de continuar."
    )

st.divider()
st.subheader("Documentos cargados en este caso")
documentos = session.query(Documento).filter(Documento.caso_id == caso.id).all()
if not documentos:
    st.caption("Aún no hay documentos cargados.")
for doc in documentos:
    st.write(f"📄 {doc.nombre_archivo} — método de extracción: {doc.metodo_extraccion}")

session.close()
