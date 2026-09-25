"""Generador de la propuesta comercial (DOCX) para el potencial cliente.

ADVERTENCIA DE DISEÑO: este módulo debe respetar siempre
``app.reports.texts.REGLAS_PROPUESTA_EXTERNA``. Solo debe recibir textos
genéricos de honorarios configurados por el abogado. Ver
``tests/test_commercial_proposal_no_leak.py``.
"""

import datetime as dt

import docx

from app.reports import texts


def generar_propuesta_docx(caso, honorarios: dict, ruta_salida: str, vigencia_dias: int = 15) -> str:
    documento = docx.Document()

    documento.add_heading(texts.TITULO_PROPUESTA, level=1)
    documento.add_paragraph(f"Cliente: {caso.nombre_cliente}")
    documento.add_paragraph(f"Caso: {texts.DESCRIPCION_CASO}")
    documento.add_paragraph(f"Fecha: {dt.date.today().strftime('%d-%m-%Y')}")

    documento.add_paragraph(texts.FRASE_PROPUESTA_COMERCIAL)

    documento.add_heading("Alcance del encargo", level=2)
    for servicio in texts.SERVICIOS_PROPUESTA:
        documento.add_paragraph(servicio, style="List Bullet")

    documento.add_heading("Honorarios", level=2)
    documento.add_paragraph(
        f"Honorario fijo: {honorarios.get('honorario_fijo_texto', 'A definir')} más IVA.", style="List Bullet"
    )
    if honorarios.get("honorario_exito"):
        documento.add_paragraph(
            f"Honorario de éxito: {honorarios.get('honorario_exito_texto', 'A definir')}, si se pacta.",
            style="List Bullet",
        )
    documento.add_paragraph(texts.GASTOS_EXTERNOS, style="List Bullet")
    if honorarios.get("honorario_exito"):
        documento.add_paragraph(texts.DEFINICION_EXITO)

    documento.add_heading("Condiciones", level=2)
    documento.add_paragraph(texts.AUSENCIA_GARANTIA, style="List Bullet")
    documento.add_paragraph(texts.CONDICION_ANTECEDENTES, style="List Bullet")
    documento.add_paragraph(
        f"La presente propuesta tiene vigencia de {vigencia_dias} días corridos.", style="List Bullet"
    )
    documento.add_paragraph(
        honorarios.get("exclusiones_texto") or texts.EXCLUSIONES_POR_DEFECTO, style="List Bullet"
    )

    documento.add_heading("Aceptación", level=2)
    documento.add_paragraph("Nombre: ______________________________")
    documento.add_paragraph("RUT: ______________________________")
    documento.add_paragraph("Firma: ______________________________")
    documento.add_paragraph("Fecha: ______________________________")

    documento.save(ruta_salida)
    return ruta_salida
