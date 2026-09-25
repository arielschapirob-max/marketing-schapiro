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

FRASE_PROPUESTA_COMERCIAL = (
    "Del examen preliminar de los antecedentes recibidos, se observa la conveniencia de efectuar una revisión "
    "profesional y, de resultar procedente, gestionar las acciones que correspondan."
)

SERVICIOS_PROPUESTA = [
    "Revisión profesional de los antecedentes entregados.",
    "Definición de estrategia de abordaje del caso.",
    "Gestión ante la entidad correspondiente, si procede.",
    "Seguimiento y comunicación periódica de los avances del caso.",
]

DEFINICION_EXITO = (
    "Para efectos de esta propuesta, se entenderá por resultado exitoso la obtención de un monto adicional "
    "bonificado, una devolución de dinero o una reducción efectiva del saldo adeudado, según corresponda al caso."
)

AUSENCIA_GARANTIA = (
    "El presente servicio corresponde a una obligación de medios y no de resultado. No se garantiza un "
    "resultado determinado, el cual dependerá de los antecedentes del caso y de la evaluación de la entidad "
    "correspondiente."
)

EXCLUSIONES_POR_DEFECTO = (
    "Se excluyen gestiones distintas a las descritas en esta propuesta y trámites ante entidades no "
    "mencionadas en ella."
)
