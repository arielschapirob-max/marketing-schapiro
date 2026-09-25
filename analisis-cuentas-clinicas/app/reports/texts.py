"""Textos estándar reutilizados por los generadores de informes.

IMPORTANTE: los textos de esta constante ``ADVERTENCIA_VALIDACION_PROFESIONAL``
y demás contenido "interno" NUNCA deben usarse en la propuesta comercial.
Los generadores de propuesta comercial (``commercial_proposal_docx.py`` y
``commercial_proposal_pdf.py``) solo deben importar las constantes de la
sección "Propuesta comercial" de este archivo.
"""

# --- Informe interno ---------------------------------------------------

ADVERTENCIA_VALIDACION_PROFESIONAL = (
    "Este informe contiene un análisis preliminar generado con apoyo de herramientas de extracción y "
    "estructuración documental. Todos los hallazgos identificados constituyen antecedentes preliminares que "
    "ameritan evaluación profesional y no representan, por sí mismos, una afirmación de arbitrariedad, "
    "incumplimiento o ilegalidad por parte de la isapre. La decisión jurídica definitiva corresponde siempre "
    "al abogado responsable del caso, previa validación profesional obligatoria de cada hallazgo."
)

# --- Propuesta comercial ------------------------------------------------

REGLAS_PROPUESTA_EXTERNA = [
    "No mencionar códigos, aranceles, GES, CAEC, glosas ni fundamentos jurídicos.",
    "No incluir ítems específicos, montos por ítem ni hipótesis de error.",
    "No explicar cómo reclamar ni ante qué entidad debe presentarse la gestión.",
    "No reproducir la matriz de hallazgos ni el análisis interno.",
    "No indicar que existe una vulneración o arbitrariedad confirmada.",
    "Usar lenguaje comercial, prudente y general.",
    "Mantener el documento dentro de dos páginas.",
]

TITULO_PROPUESTA = "PROPUESTA DE SERVICIOS PROFESIONALES"

DESCRIPCION_CASO = "Revisión de cuenta clínica y liquidación de cobertura"

FRASE_PROPUESTA_COMERCIAL = (
    "Del examen preliminar de los antecedentes recibidos, se observa la conveniencia de efectuar una revisión "
    "profesional y, de resultar procedente, gestionar las acciones que correspondan para resguardar los "
    "intereses del cliente."
)

SERVICIOS_PROPUESTA = [
    "Revisión profesional de los antecedentes disponibles.",
    "Definición de alternativa de gestión aplicable al caso.",
    "Preparación y gestión de presentaciones que resulten procedentes.",
    "Seguimiento del encargo y comunicación de avances relevantes.",
]

GASTOS_EXTERNOS = "Gastos externos: serán de cargo del cliente, previa información, cuando correspondan."

DEFINICION_EXITO = (
    "El beneficio económico se entenderá como la bonificación adicional, devolución, pago o reducción "
    "efectiva del saldo que resulte directamente de la gestión profesional."
)

AUSENCIA_GARANTIA = "Esta propuesta no asegura un resultado determinado."

CONDICION_ANTECEDENTES = "El encargo se ejecutará con base en los antecedentes que proporcione el cliente."

EXCLUSIONES_POR_DEFECTO = (
    "Quedan excluidas las actuaciones no especificadas expresamente y los informes o peritajes externos."
)
