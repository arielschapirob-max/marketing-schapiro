"""Verificación asistida por IA del hallazgo "deducible_requiere_verificacion".

Solo se activa cuando ``settings.enable_external_ai`` está en True (variable
de entorno ``ENABLE_EXTERNAL_AI``) y hay una ``ANTHROPIC_API_KEY``
configurada — ver la advertencia en pantalla de Configuración y Auditoría.
Enviar datos del caso a la API de Anthropic es una excepción explícita al
procesamiento 100% local que la app promete por defecto.

Principio de diseño: al modelo NUNCA se le pide que "sepa" un dato
verificable (el valor de la UF de una fecha, la fórmula del deducible
CAEC) — esos se calculan antes, de forma determinística
(``app.analysis.uf_lookup`` y ``app.analysis.caec_deducible``), y se le
entregan ya resueltos. Su trabajo es redactar una explicación clara a
partir de esos números, no inventarlos. El prompt además prohíbe
explícitamente citar jurisprudencia o normativa adicional no entregada,
en línea con la regla de nunca citar jurisprudencia no verificada.
"""

import anthropic

from app.config import settings

MODELO_POR_DEFECTO = "claude-sonnet-5-5"

SYSTEM_PROMPT = (
    "Eres un asistente técnico que ayuda a un abogado chileno a verificar un cálculo de "
    "deducible CAEC (Cobertura Adicional para Enfermedades Catastróficas) en una cuenta clínica. "
    "Se te entregan datos YA CALCULADOS de forma determinística (no los recalcules ni los "
    "cuestiones salvo que detectes un error aritmético evidente en lo que se te entrega). "
    "Tu tarea es, en español, comparar el deducible aplicable calculado contra los montos no "
    "cubiertos de los ítems del caso, y escribir una explicación breve y clara (3-6 oraciones) "
    "que indique si el deducible parece correctamente aplicado o si hay una discrepancia que "
    "amerita seguir investigando. Reglas estrictas: "
    "1) NUNCA cites jurisprudencia (fallos, dictámenes de casos concretos) — no la conoces de forma "
    "verificada y citarla sin verificar está prohibido. "
    "2) NUNCA inventes normativa adicional a la que se te entrega. "
    "3) NUNCA afirmes que hay arbitrariedad, incumplimiento o ilegalidad de la isapre — a lo sumo, "
    "señala que algo requiere evaluación o contraste documental adicional. "
    "4) La decisión final de aprobar, descartar o requerir más antecedentes para el hallazgo la toma "
    "siempre el abogado responsable; vos solo aportás el análisis, nunca la decidís ni la des por tomada. "
    "5) Si los datos entregados son insuficientes para una conclusión clara, decilo explícitamente en "
    "vez de completar con una suposición."
)


class VerificacionIANoDisponible(Exception):
    """La verificación por IA no está habilitada o no se pudo completar."""


def verificar_deducible_caec(
    *,
    items_relevantes: list[dict],
    calculo_deducible: dict,
    cotizacion_pactada_pesos: float,
    fecha_hospitalizacion: str,
    uso_multiple: bool,
    cliente_anthropic: anthropic.Anthropic | None = None,
) -> str:
    """Devuelve el texto de verificación generado por el modelo.

    ``items_relevantes`` es una lista de dicts con al menos
    ``codigo_prestacion``, ``descripcion``, ``valor_cobrado``,
    ``valor_bonificado`` y ``monto_no_cubierto`` de los ítems del caso
    afectados por CAEC. ``calculo_deducible`` es el resultado de
    ``app.analysis.caec_deducible.calcular_deducible_caec``.

    Lanza ``VerificacionIANoDisponible`` si ``ENABLE_EXTERNAL_AI`` está
    apagado, si falta la API key, o si la llamada a la API falla — nunca
    devuelve un texto inventado como si fuera la respuesta del modelo.
    """
    if not settings.enable_external_ai:
        raise VerificacionIANoDisponible(
            "El análisis con IA externa está deshabilitado (ENABLE_EXTERNAL_AI=false)."
        )
    if not settings.anthropic_api_key:
        raise VerificacionIANoDisponible("Falta configurar ANTHROPIC_API_KEY.")

    cliente = cliente_anthropic or anthropic.Anthropic(api_key=settings.anthropic_api_key)

    suma_no_cubierto = sum(i.get("monto_no_cubierto") or 0.0 for i in items_relevantes)

    detalle_items = "\n".join(
        f"- {i.get('codigo_prestacion') or 'sin código'}: {i.get('descripcion') or 'sin descripción'} — "
        f"cobrado ${i.get('valor_cobrado', 0):,.0f} · bonificado ${i.get('valor_bonificado', 0):,.0f} · "
        f"no cubierto ${i.get('monto_no_cubierto', 0):,.0f}".replace(",", ".")
        for i in items_relevantes
    )

    mensaje_usuario = f"""Datos del caso (ya calculados, no recalcular):

Cotización pactada mensual: ${cotizacion_pactada_pesos:,.0f}
Fecha de inicio de hospitalización: {fecha_hospitalizacion}
¿CAEC usada por más de un beneficiario o más de un diagnóstico catastrófico?: {"Sí" if uso_multiple else "No"}

Cálculo del deducible CAEC aplicable:
- Multiplicador usado: {calculo_deducible["multiplicador_uf"]} cotizaciones pactadas
- Deducible calculado (sin tope): ${calculo_deducible["deducible_calculado_pesos"]:,.0f}
- Tope mínimo: {calculo_deducible["tope_minimo_uf"]} UF = ${calculo_deducible["tope_minimo_pesos"]:,.0f}
- Tope máximo: {calculo_deducible["tope_maximo_uf"]} UF = ${calculo_deducible["tope_maximo_pesos"]:,.0f}
- Valor UF usado: ${calculo_deducible["valor_uf_usado"]:,.2f}
- Deducible aplicable (ya con tope aplicado): ${calculo_deducible["deducible_aplicable_pesos"]:,.0f}

Ítems del caso potencialmente afectados por CAEC:
{detalle_items}

Suma de "monto no cubierto" de estos ítems: ${suma_no_cubierto:,.0f}

Compará la suma de "monto no cubierto" contra el deducible aplicable y escribí la explicación según las
reglas del system prompt.""".replace(",", ".")

    try:
        respuesta = cliente.messages.create(
            model=MODELO_POR_DEFECTO,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            thinking={"type": "adaptive"},
            output_config={"effort": "medium"},
            messages=[{"role": "user", "content": mensaje_usuario}],
        )
    except anthropic.APIError as exc:
        raise VerificacionIANoDisponible(f"Error al llamar a la API de Anthropic: {exc}") from exc

    texto = "\n".join(bloque.text for bloque in respuesta.content if bloque.type == "text")
    if not texto.strip():
        raise VerificacionIANoDisponible("La API respondió sin texto utilizable.")
    return texto.strip()
