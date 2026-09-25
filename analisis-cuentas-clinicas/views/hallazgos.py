import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.analysis.findings_engine import analizar_items, calcular_monto_total_discutible
from app.config import settings
from app.db.database import get_session
from app.db.models import Caso, Hallazgo, ItemCuenta
from app.security.audit import registrar_acceso, registrar_cambio

st.title("Hallazgos potencialmente discutibles")
st.caption(
    "Los hallazgos identificados constituyen antecedentes preliminares que ameritan evaluación profesional. "
    "No implican, por sí mismos, una afirmación de arbitrariedad, incumplimiento o ilegalidad por parte de la "
    "isapre. La decisión jurídica definitiva corresponde siempre al abogado responsable."
)

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

if not caso.aprobado_por_abogado:
    st.warning(
        "Este caso aún no ha sido aprobado por el abogado en la Revisión Manual. Se recomienda completar esa "
        "aprobación antes de generar hallazgos definitivos."
    )

if st.button("Analizar y generar hallazgos"):
    existentes = session.query(Hallazgo).filter(Hallazgo.caso_id == caso.id).all()
    for h in existentes:
        session.delete(h)
    session.commit()

    nuevos = analizar_items(items)
    for data in nuevos:
        session.add(Hallazgo(caso_id=caso.id, **data))
    session.commit()
    registrar_acceso(
        session,
        caso.id,
        settings.usuario_actual,
        "analisis_hallazgos",
        detalle=f"{len(nuevos)} hallazgo(s)",
    )
    st.success(f"Se generaron {len(nuevos)} hallazgo(s) preliminares.")
    st.rerun()

hallazgos = session.query(Hallazgo).filter(Hallazgo.caso_id == caso.id).all()

if hallazgos:
    st.metric(
        "Monto potencialmente discutible (sin duplicar ítems)",
        f"${calcular_monto_total_discutible(hallazgos):,.0f}".replace(",", "."),
    )

ESTADOS = ["pendiente", "aprobado", "descartado", "requiere_antecedentes"]

for h in hallazgos:
    with st.container(border=True):
        st.markdown(f"**{h.tipo}** — prioridad {h.prioridad} — ítem {h.item_id or 'general'}")
        st.write(h.explicacion_interna)
        st.caption(f"Documentos faltantes: {h.documentos_faltantes or 'N/A'}")
        st.caption(f"Recomendación interna: {h.recomendacion_interna or 'N/A'}")
        nuevo_estado = st.selectbox("Estado", ESTADOS, index=ESTADOS.index(h.estado), key=f"estado_{h.id}")
        if nuevo_estado != h.estado:
            registrar_cambio(
                session,
                caso.id,
                "Hallazgo",
                h.id,
                "estado",
                h.estado,
                nuevo_estado,
                settings.usuario_actual,
            )
            h.estado = nuevo_estado
            session.commit()
            st.rerun()

if not hallazgos:
    st.info("No hay hallazgos generados todavía para este caso.")

session.close()
