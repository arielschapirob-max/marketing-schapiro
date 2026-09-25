"""Motor de hallazgos: genera antecedentes preliminares que ameritan evaluación profesional.

Regla central de todo este módulo: NUNCA se afirma que la isapre cometió una
arbitrariedad, un incumplimiento o una ilegalidad. Todo el lenguaje usa
fórmulas como "hallazgo potencialmente discutible", "inconsistencia que
requiere validación", "causal que requiere contraste documental" o
"antecedentes preliminares que ameritan evaluación". La decisión jurídica
definitiva corresponde siempre al abogado responsable del caso.
"""

from app.analysis import arithmetic, devices
from app.analysis import duplicates as dup_mod

GLOSAS_GENERICAS = {
    "no corresponde",
    "no bonificable",
    "excluido",
    "sin cobertura",
    "revisar",
    "otros",
    "",
}


def _crear_hallazgo(tipo, item, monto, prioridad, explicacion, documentos_faltantes, recomendacion):
    return {
        "tipo": tipo,
        "item_id": item.id if item else None,
        "monto_discutible": monto or 0.0,
        "prioridad": prioridad,
        "explicacion_interna": explicacion,
        "documentos_faltantes": documentos_faltantes,
        "recomendacion_interna": recomendacion,
        "estado": "pendiente",
    }


def analizar_items(items) -> list[dict]:
    hallazgos: list[dict] = []

    for item in items:
        # Ítems 100% no cubiertos
        if (
            item.valor_cobrado
            and item.valor_bonificado in (0, None)
            and (item.copago in (0, None) or item.copago == item.valor_cobrado)
        ):
            hallazgos.append(
                _crear_hallazgo(
                    "item_no_cubierto",
                    item,
                    item.valor_cobrado,
                    "alta",
                    "El ítem registra bonificación nula o no informada sobre un valor cobrado positivo. "
                    "Constituye una inconsistencia que requiere validación respecto de la causal aplicada.",
                    "Cartola de bonificaciones, tabla de prestaciones del plan, respaldo de la causal de rechazo.",
                    "Cotejar con el plan de salud y la ficha clínica para evaluar si corresponde revisión "
                    "jurídica y técnica.",
                )
            )
        # Cobertura parcial
        elif item.valor_cobrado and item.valor_bonificado and 0 < item.valor_bonificado < item.valor_cobrado:
            hallazgos.append(
                _crear_hallazgo(
                    "cobertura_parcial",
                    item,
                    item.valor_cobrado - item.valor_bonificado,
                    "media",
                    "El ítem presenta cobertura parcial. Son antecedentes preliminares que ameritan evaluación "
                    "sobre si el porcentaje aplicado se ajusta al plan y tabla de beneficios vigente.",
                    "Plan de salud vigente, tabla de prestaciones, cartola de bonificaciones.",
                    "Contrastar el porcentaje bonificado con la cobertura contratada.",
                )
            )

        # Glosas genéricas, incompletas o sin causal identificable
        glosa_normalizada = (item.glosa or "").strip().lower()
        if not item.glosa or glosa_normalizada in GLOSAS_GENERICAS:
            hallazgos.append(
                _crear_hallazgo(
                    "glosa_generica",
                    item,
                    0.0,
                    "media",
                    "La glosa asociada al ítem es genérica, incompleta o no identifica una causal específica; "
                    "constituye una causal que requiere contraste documental.",
                    "Detalle de glosa o causal específica emitida por la isapre.",
                    "Solicitar a la isapre el detalle completo de la causal aplicada.",
                )
            )

        # Ítems sin código o con código ambiguo
        if not item.codigo_prestacion:
            hallazgos.append(
                _crear_hallazgo(
                    "sin_codigo",
                    item,
                    0.0,
                    "baja",
                    "El ítem no cuenta con código de prestación identificable, o el código es ambiguo, lo que "
                    "dificulta su contraste arancelario.",
                    "Nomenclador o arancel de referencia del prestador/isapre.",
                    "Solicitar el detalle arancelario del ítem para su identificación.",
                )
            )

        # Inconsistencias aritméticas
        if not arithmetic.verificar_consistencia_item(item):
            hallazgos.append(
                _crear_hallazgo(
                    "inconsistencia_aritmetica",
                    item,
                    0.0,
                    "alta",
                    "La suma de bonificación, copago y monto no cubierto no coincide con el valor cobrado dentro "
                    "de la tolerancia definida. Es una inconsistencia que requiere validación aritmética.",
                    "Detalle de cálculo de bonificación emitido por la isapre.",
                    "Recalcular manualmente con los antecedentes originales antes de continuar.",
                )
            )

        # Deducibles que requieren verificación
        if item.deducible:
            hallazgos.append(
                _crear_hallazgo(
                    "deducible_requiere_verificacion",
                    item,
                    0.0,
                    "baja",
                    "El ítem registra un deducible aplicado, cuya procedencia y monto requieren verificación "
                    "contra el plan de salud y el estado del deducible anual del afiliado.",
                    "Certificado de estado de deducible emitido por la isapre.",
                    "Verificar saldo y aplicación correcta del deducible.",
                )
            )

        # Dispositivos médicos relevantes (regla especial: no asumir que un stent no es una prótesis)
        categoria_dispositivo = devices.identificar_dispositivo(item.descripcion or "")
        if categoria_dispositivo:
            hallazgos.append(
                _crear_hallazgo(
                    "dispositivo_medico",
                    item,
                    item.valor_cobrado or 0.0,
                    "alta",
                    f"El ítem corresponde a un dispositivo médico relevante (categoría: {categoria_dispositivo}). "
                    "Existen antecedentes preliminares que ameritan evaluación sobre si la categoría, tope, "
                    "código, bonificación o causal aplicada se condicen con la descripción del dispositivo, el "
                    "procedimiento asociado, la necesidad clínica, la categoría arancelaria, el plan y tabla de "
                    "beneficios, y GES/CAEC cuando corresponda. No se asume que el dispositivo carezca de "
                    "naturaleza protésica.",
                    "Protocolo operatorio, ficha técnica del dispositivo, plan de salud, "
                    "cobertura GES/CAEC si aplica.",
                    "Revisión jurídica y técnica recomendada antes de cualquier gestión con la isapre.",
                )
            )

    # Posibles duplicidades
    for grupo in dup_mod.detectar_duplicados(items):
        for item_repetido in grupo[1:]:
            hallazgos.append(
                _crear_hallazgo(
                    "posible_duplicidad",
                    item_repetido,
                    item_repetido.valor_cobrado or 0.0,
                    "media",
                    "Se detectaron ítems con código, fecha, descripción y valor coincidentes, lo que constituye "
                    "una posible duplicidad que requiere contraste documental.",
                    "Detalle de prestaciones efectivamente realizadas, ficha clínica.",
                    "Verificar con el prestador si corresponde a una prestación única o a repeticiones efectivas.",
                )
            )

    return hallazgos


def calcular_monto_total_discutible(hallazgos) -> float:
    """Suma el monto potencialmente discutible sin duplicar ítems.

    Cuando varios hallazgos afectan al mismo ítem, se toma el monto máximo
    entre ellos (no la suma), evitando contar dos veces el mismo dinero.
    Los hallazgos en estado "descartado" no se consideran.
    """
    montos_por_item: dict = {}
    monto_sin_item = 0.0

    for h in hallazgos:
        item_id = h.get("item_id") if isinstance(h, dict) else h.item_id
        monto = h.get("monto_discutible") if isinstance(h, dict) else h.monto_discutible
        estado = h.get("estado") if isinstance(h, dict) else h.estado

        if estado == "descartado":
            continue
        monto = monto or 0.0
        if item_id is None:
            monto_sin_item += monto
            continue
        montos_por_item[item_id] = max(montos_por_item.get(item_id, 0.0), monto)

    return sum(montos_por_item.values()) + monto_sin_item
