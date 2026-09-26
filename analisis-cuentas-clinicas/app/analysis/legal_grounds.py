"""Fundamentos normativos generales asociados a cada tipo de hallazgo.

IMPORTANTE — separación con la propuesta comercial: este módulo SOLO debe ser
importado por los generadores del informe interno (``internal_report_docx.py``
e ``internal_report_xlsx.py``). La propuesta comercial tiene prohibido
mencionar fundamentos jurídicos (ver ``REGLAS_PROPUESTA_EXTERNA`` en
``app/reports/texts.py``); jamás importar este módulo desde
``commercial_proposal_docx.py`` ni ``commercial_proposal_pdf.py``.

Alcance y límites de estos fundamentos:

- Identifican la normativa GENERAL aplicable a cada categoría de hallazgo
  (nombre de la ley/DFL/compendio y qué materia regula), a partir de fuentes
  oficiales (Biblioteca del Congreso Nacional y Superintendencia de Salud).
- NO citan jurisprudencia (fallos de Corte Suprema, Cortes de Apelaciones ni
  dictámenes resolviendo casos concretos de la Superintendencia). Citar
  jurisprudencia no verificada está prohibido; la jurisprudencia aplicable a
  cada caso debe incorporarla el abogado responsable a partir de su propio
  repositorio de fallos verificados.
- NO reemplazan la lectura del texto vigente. Las leyes y compendios de la
  Superintendencia se modifican con frecuencia (los compendios, incluso varias
  veces al año) — el número de artículo o capítulo exacto puede cambiar. Cada
  fundamento indica la fuente para que el abogado la contraste antes de
  citarla en una gestión formal.
"""

FUNDAMENTOS_NORMATIVOS: dict[str, str] = {
    "item_no_cubierto": (
        "DFL N°1, de 2005, del Ministerio de Salud (Libro III, Ley de Isapres) y Compendio de Beneficios de la "
        "Superintendencia de Salud: regulan la obligación de la isapre de bonificar las prestaciones conforme al "
        "plan de salud y la tabla de prestaciones pactada. Contrastar la bonificación nula contra el plan vigente "
        "y verificar la redacción actual del compendio antes de invocarlo formalmente."
    ),
    "cobertura_parcial": (
        "DFL N°1, de 2005, del Ministerio de Salud (Libro III, Ley de Isapres) y Compendio de Beneficios de la "
        "Superintendencia de Salud: fijan el porcentaje de cobertura pactado por prestación en el plan de salud y "
        "su tabla de prestaciones. Verificar el porcentaje contratado y la versión vigente del compendio antes de "
        "invocarlo."
    ),
    "glosa_generica": (
        "Compendio de Normas Administrativas en materia de Procedimientos de la Superintendencia de Salud: exige "
        "que el rechazo o la causal aplicada por la isapre esté fundada — la sola reiteración de antecedentes sin "
        "análisis no se tiene por fundamentación suficiente. Verificar el título y numeral vigente del compendio "
        "(se actualiza con frecuencia) antes de citarlo formalmente."
    ),
    "sin_codigo": (
        "Compendio de Beneficios de la Superintendencia de Salud: la tabla de prestaciones de todo plan de salud "
        "identifica cada prestación por código, glosa y valor. Un ítem cobrado sin código de prestación "
        "identificable dificulta su contraste contra dicha tabla. Verificar la versión vigente del compendio antes "
        "de invocarlo."
    ),
    "inconsistencia_aritmetica": (
        "Ley N°20.584, sobre derechos y deberes de las personas en relación con acciones vinculadas a su atención "
        "de salud: sustenta el derecho del afiliado a recibir información clara, veraz y comprensible sobre las "
        "prestaciones y montos involucrados. Una liquidación cuyos componentes no cuadran aritméticamente es, en "
        "primer término, un problema de exactitud del registro que debe recalcularse contra los antecedentes "
        "originales antes de calificarlo jurídicamente."
    ),
    "deducible_requiere_verificacion": (
        "Normativa de la Cobertura Adicional para Enfermedades Catastróficas (CAEC) de la Superintendencia de "
        "Salud: el deducible CAEC equivale a 30 veces la cotización pactada por beneficiario (mínimo 60 UF, "
        "máximo 126 UF) por enfermedad catastrófica o diagnóstico, y sube a 43 cotizaciones (máximo 181 UF) cuando "
        "la CAEC es usada por más de un beneficiario o para más de una enfermedad catastrófica del mismo "
        "beneficiario. Verificar el cálculo aplicado contra esta fórmula y la orientación vigente de la "
        "Superintendencia antes de invocarla."
    ),
    "dispositivo_medico": (
        "Compendio de Beneficios de la Superintendencia de Salud (catálogo de prótesis, órtesis e insumos) y "
        "normativa de Garantías Explícitas en Salud (GES) y CAEC cuando resulten aplicables al diagnóstico: "
        "regulan la categoría arancelaria, tope y cobertura de dispositivos médicos. Verificar la clasificación "
        "del dispositivo en el compendio vigente y, si el diagnóstico está en el listado GES, sus garantías "
        "específicas, antes de invocarlos formalmente."
    ),
    "posible_duplicidad": (
        "Ley N°20.584, sobre derechos y deberes de las personas en relación con acciones vinculadas a su atención "
        "de salud: la ficha clínica y los registros de prestaciones efectivamente realizadas son la fuente para "
        "contrastar si un cobro repetido corresponde a una prestación única o a una repetición efectiva. Solicitar "
        "dicho registro antes de calificar la duplicidad."
    ),
}

FUNDAMENTO_NO_ESTANDAR = (
    "Sin fundamento normativo estándar asociado a este tipo de hallazgo; requiere análisis jurídico específico "
    "del abogado responsable."
)


def fundamento_normativo_de(tipo: str) -> str:
    """Fundamento normativo general asociado a ``tipo`` de hallazgo.

    Devuelve un texto de respaldo cuando el tipo no tiene fundamento estándar
    catalogado, en vez de dejar la celda vacía o lanzar un error — un tipo de
    hallazgo nuevo que todavía no tiene fundamento cargado no debe impedir la
    generación del informe.
    """
    return FUNDAMENTOS_NORMATIVOS.get(tipo, FUNDAMENTO_NO_ESTANDAR)
