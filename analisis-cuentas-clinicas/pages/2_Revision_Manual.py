import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pandas as pd
import streamlit as st

from app.config import settings
from app.db.database import get_session, init_db
from app.db.models import Caso, ItemCuenta
from app.security.audit import registrar_acceso, registrar_cambio

st.set_page_config(page_title="Revisión Manual", layout="wide")
init_db()
st.title("Revisión manual de ítems extraídos")
st.caption(
    "Edite y apruebe los datos extraídos antes de continuar con el análisis de hallazgos. Los campos con "
    "nivel de confianza bajo o medio requieren especial atención: esta extracción es asistida y no reemplaza "
    "el criterio del abogado."
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
if not items:
    st.info("Este caso aún no tiene ítems extraídos. Cargue documentos primero.")
    st.stop()

CAMPOS_EDITABLES = [
    "codigo_prestacion",
    "descripcion",
    "cantidad",
    "valor_cobrado",
    "valor_bonificado",
    "copago",
    "monto_no_cubierto",
    "glosa",
    "deducible",
    "total",
    "aprobado",
]

filas = []
for item in items:
    confianza = item.get_confianza()
    if confianza:
        niveles = list(confianza.values())
        if "bajo" in niveles:
            confianza_resumen = "bajo"
        elif "medio" in niveles:
            confianza_resumen = "medio"
        else:
            confianza_resumen = "alto"
    else:
        confianza_resumen = "N/D"
    filas.append(
        {
            "id": item.id,
            "codigo_prestacion": item.codigo_prestacion,
            "descripcion": item.descripcion,
            "cantidad": item.cantidad,
            "valor_cobrado": item.valor_cobrado,
            "valor_bonificado": item.valor_bonificado,
            "copago": item.copago,
            "monto_no_cubierto": item.monto_no_cubierto,
            "glosa": item.glosa,
            "deducible": item.deducible,
            "total": item.total,
            "confianza": confianza_resumen,
            "aprobado": item.aprobado,
        }
    )

df = pd.DataFrame(filas)
st.write("Columna `confianza`: nivel mínimo entre los campos extraídos para ese ítem (alto/medio/bajo).")
df_editado = st.data_editor(
    df,
    key="editor_items",
    num_rows="fixed",
    disabled=["id", "confianza"],
    use_container_width=True,
)

if st.button("Guardar cambios"):
    items_por_id = {item.id: item for item in items}
    cambios_totales = 0
    for _, fila in df_editado.iterrows():
        item = items_por_id[fila["id"]]
        for campo in CAMPOS_EDITABLES:
            valor_nuevo = fila[campo]
            valor_actual = getattr(item, campo)
            es_nan = isinstance(valor_nuevo, float) and pd.isna(valor_nuevo)
            valor_nuevo_normalizado = None if es_nan else valor_nuevo
            if valor_nuevo_normalizado != valor_actual:
                registrar_cambio(
                    session,
                    caso.id,
                    "ItemCuenta",
                    item.id,
                    campo,
                    valor_actual,
                    valor_nuevo_normalizado,
                    settings.usuario_actual,
                )
                setattr(item, campo, valor_nuevo_normalizado)
                item.editado_manualmente = True
                cambios_totales += 1
    session.commit()
    registrar_acceso(
        session,
        caso.id,
        settings.usuario_actual,
        "revision_manual",
        detalle=f"{cambios_totales} cambio(s)",
    )
    st.success(f"Cambios guardados ({cambios_totales}).")
    st.rerun()

st.divider()
if st.button("Aprobar revisión del abogado para este caso"):
    caso.aprobado_por_abogado = True
    caso.fecha_aprobacion = datetime.utcnow()
    session.commit()
    registrar_acceso(session, caso.id, settings.usuario_actual, "aprobacion_abogado")
    st.success("Revisión aprobada por el abogado responsable.")

session.close()
