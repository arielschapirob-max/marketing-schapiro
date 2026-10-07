import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import streamlit as st

from app.analysis import ai_verification, caec_deducible, uf_lookup
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
        "Este caso aún no ha sido aprobado por el abogado en la Revisión Manual. El análisis está bloqueado "
        "hasta que apruebe la revisión de los datos extraídos."
    )

if not items:
    st.info("Este caso aún no tiene ítems cargados. Cargue documentos y complete la revisión manual primero.")

if st.button("Analizar y generar hallazgos", disabled=not caso.aprobado_por_abogado or not items):
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
        settings.current_user,
        "analisis_hallazgos",
        detalle=f"{len(nuevos)} hallazgo(s)",
    )
    st.success(f"Se generaron {len(nuevos)} hallazgo(s) preliminares.")
    st.rerun()

hallazgos = session.query(Hallazgo).filter(Hallazgo.caso_id == caso.id).all()

hallazgos_deducible = [h for h in hallazgos if h.tipo == "deducible_requiere_verificacion"]
if hallazgos_deducible:
    with st.expander("Verificación del deducible CAEC con IA", expanded=False):
        if not settings.enable_external_ai:
            st.info(
                "El análisis con IA externa está deshabilitado (ENABLE_EXTERNAL_AI=false en la "
                "configuración). Esta herramienta de verificación envía datos del caso a la API de "
                "Anthropic — está desactivada por defecto. Actívela en el archivo .env si quiere usarla."
            )
        else:
            st.caption(
                "Calcula el deducible CAEC (30 veces la cotización pactada, tope 60-126 UF; 43 veces, "
                "tope 181 UF si la CAEC se usó por más de un beneficiario o diagnóstico) con el valor "
                "real de la UF de la fecha de hospitalización, y le pide a la IA que compare ese "
                "cálculo contra los montos no cubiertos de los ítems de este caso. El abogado decide "
                "si eso descarta o confirma cada hallazgo — la IA no cambia el estado por sí sola."
            )
            col1, col2 = st.columns(2)
            cotizacion_pactada = col1.number_input(
                "Cotización pactada mensual ($)", min_value=0, step=1000, key="cotizacion_pactada_caec"
            )
            fecha_hospitalizacion = col2.date_input(
                "Fecha de inicio de hospitalización", key="fecha_hosp_caec"
            )
            uso_multiple = st.checkbox(
                "CAEC usada por más de un beneficiario del contrato, o más de un diagnóstico "
                "catastrófico del mismo beneficiario",
                key="uso_multiple_caec",
            )
            if st.button("Verificar con IA", disabled=not cotizacion_pactada):
                fecha_str = fecha_hospitalizacion.strftime("%d-%m-%Y")
                with st.spinner(f"Consultando valor de la UF para el {fecha_str}..."):
                    valor_uf = uf_lookup.obtener_valor_uf(fecha_str)
                if valor_uf is None:
                    st.error(
                        f"No se pudo obtener el valor de la UF para el {fecha_str} (falló la consulta "
                        "a mindicador.cl). No se continúa con la verificación — verifique manualmente."
                    )
                else:
                    calculo = caec_deducible.calcular_deducible_caec(cotizacion_pactada, valor_uf, uso_multiple)
                    items_relevantes = [
                        {
                            "codigo_prestacion": h.item.codigo_prestacion if h.item else None,
                            "descripcion": h.item.descripcion if h.item else None,
                            "valor_cobrado": h.item.valor_cobrado if h.item else 0,
                            "valor_bonificado": h.item.valor_bonificado if h.item else 0,
                            "monto_no_cubierto": h.item.monto_no_cubierto if h.item else 0,
                        }
                        for h in hallazgos_deducible
                        if h.item
                    ]
                    try:
                        with st.spinner("Consultando a la API de Anthropic..."):
                            texto = ai_verification.verificar_deducible_caec(
                                items_relevantes=items_relevantes,
                                calculo_deducible=calculo,
                                cotizacion_pactada_pesos=cotizacion_pactada,
                                fecha_hospitalizacion=fecha_str,
                                uso_multiple=uso_multiple,
                            )
                    except ai_verification.VerificacionIANoDisponible as exc:
                        st.error(f"No se pudo completar la verificación: {exc}")
                    else:
                        for h in hallazgos_deducible:
                            h.verificacion_ia_texto = texto
                            h.verificacion_ia_fecha = dt.datetime.utcnow()
                        session.commit()
                        registrar_acceso(
                            session, caso.id, settings.current_user, "verificacion_ia_deducible_caec"
                        )
                        st.success("Verificación completada — se muestra en cada hallazgo de deducible.")
                        st.rerun()

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
        if h.verificacion_ia_texto:
            with st.container(border=True):
                st.caption(
                    f"Verificación con IA ({h.verificacion_ia_fecha.strftime('%d-%m-%Y %H:%M')}):"
                )
                st.write(h.verificacion_ia_texto)
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
                settings.current_user,
            )
            h.estado = nuevo_estado
            session.commit()
            st.rerun()

if not hallazgos:
    st.info("No hay hallazgos generados todavía para este caso.")

session.close()
