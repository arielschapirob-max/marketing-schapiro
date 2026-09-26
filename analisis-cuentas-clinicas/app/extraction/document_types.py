"""Catálogo de tipos de documento que puede cargar el abogado por caso.

Solo los tipos en ``TIPOS_CON_ITEMS`` (cuenta clínica y liquidación de isapre)
pasan por la extracción de ítems (códigos, montos). Los demás —carta de
rechazo, plan de salud, antecedentes médicos— son documentos de contexto:
se guarda su texto para referencia y para calcular "documentos disponibles y
faltantes" en el informe interno, pero no se les aplica la heurística de
extracción de ítems (que espera líneas con valores cobrado/bonificado/copago
y generaría filas espurias sobre un documento que no es una cuenta).
"""

TIPOS_DOCUMENTO = {
    "cuenta_clinica": "Cuenta clínica",
    "liquidacion_isapre": "Liquidación de isapre",
    "carta_rechazo": "Carta de rechazo",
    "plan_salud": "Plan de salud",
    "antecedentes_medicos": "Antecedentes médicos",
    "otro": "Otro",
}

TIPOS_CON_ITEMS = {"cuenta_clinica", "liquidacion_isapre"}

# Tipos que el informe interno reporta como "disponible" o "faltante" para el caso.
TIPOS_RELEVANTES_PARA_CASO = ["cuenta_clinica", "liquidacion_isapre", "carta_rechazo", "plan_salud"]

# Palabras clave del nombre de archivo usadas para sugerir el tipo de documento
# al cargarlo (el abogado siempre puede corregirlo antes de procesar). El orden
# importa: se evalúa de arriba hacia abajo y se toma la primera que coincida,
# porque un nombre de archivo puede contener más de una palabra clave (ej. un
# plan de salud de una isapre suele incluir el nombre de la isapre en el
# archivo, lo que no debe hacerlo pasar por "liquidación").
_PALABRAS_CLAVE_POR_TIPO = [
    ("plan_salud", ("plan de salud", "plan_salud", "plan-salud", "plan ")),
    ("carta_rechazo", ("rechazo", "carta rechazo", "carta_rechazo")),
    ("liquidacion_isapre", ("liquidacion", "liquidación", "liquidacion_isapre")),
    ("antecedentes_medicos", ("antecedentes", "ficha clinica", "ficha_clinica", "ficha médica", "epicrisis")),
    ("cuenta_clinica", ("cuenta", "cta ", "cta_", "factura", "boleta")),
]


def sugerir_tipo_documento(nombre_archivo: str) -> str:
    """Sugiere un tipo de documento a partir del nombre del archivo.

    Es solo un valor por defecto para el selector de la pantalla de carga —
    el abogado revisa y puede cambiarlo antes de procesar. Cuando ninguna
    palabra clave coincide, sugiere "cuenta_clinica" (el tipo más frecuente
    en esta herramienta) en vez de dejar el selector en un estado ambiguo.
    """
    nombre_normalizado = f" {(nombre_archivo or '').strip().lower()} "
    for tipo, palabras_clave in _PALABRAS_CLAVE_POR_TIPO:
        if any(palabra in nombre_normalizado for palabra in palabras_clave):
            return tipo
    return "cuenta_clinica"
