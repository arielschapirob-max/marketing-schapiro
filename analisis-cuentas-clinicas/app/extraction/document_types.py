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
