"""Generador de la propuesta comercial (PDF, máx. 2 páginas) para el potencial cliente.

Misma advertencia de diseño que ``commercial_proposal_docx.py``: debe
respetar siempre ``app.reports.texts.REGLAS_PROPUESTA_EXTERNA``.
"""

import datetime as dt

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate

from app.reports import texts


def _lista(items, estilo):
    return ListFlowable([ListItem(Paragraph(texto, estilo)) for texto in items], bulletType="bullet")


def generar_propuesta_pdf(caso, honorarios: dict, ruta_salida: str, vigencia_dias: int = 15) -> str:
    doc = SimpleDocTemplate(
        ruta_salida,
        pagesize=LETTER,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
    )
    estilos = getSampleStyleSheet()
    normal = estilos["Normal"]
    titulo = estilos["Heading1"]
    subtitulo = estilos["Heading2"]

    elementos = [
        Paragraph(texts.TITULO_PROPUESTA, titulo),
        Paragraph(f"Cliente: {caso.nombre_cliente}", normal),
        Paragraph(f"Caso: {texts.DESCRIPCION_CASO}", normal),
        Paragraph(f"Fecha: {dt.date.today().strftime('%d-%m-%Y')}", normal),
        Paragraph(texts.FRASE_PROPUESTA_COMERCIAL, normal),
    ]

    elementos.append(Paragraph("Alcance del encargo", subtitulo))
    elementos.append(_lista(texts.SERVICIOS_PROPUESTA, normal))

    honorarios_texto = [f"Honorario fijo: {honorarios.get('honorario_fijo_texto', 'A definir')} más IVA."]
    if honorarios.get("honorario_exito"):
        honorarios_texto.append(
            f"Honorario de éxito: {honorarios.get('honorario_exito_texto', 'A definir')}, si se pacta."
        )
    honorarios_texto.append(texts.GASTOS_EXTERNOS)
    elementos.append(Paragraph("Honorarios", subtitulo))
    elementos.append(_lista(honorarios_texto, normal))
    if honorarios.get("honorario_exito"):
        elementos.append(Paragraph(texts.DEFINICION_EXITO, normal))

    condiciones_texto = [
        texts.AUSENCIA_GARANTIA,
        texts.CONDICION_ANTECEDENTES,
        f"La presente propuesta tiene vigencia de {vigencia_dias} días corridos.",
        honorarios.get("exclusiones_texto") or texts.EXCLUSIONES_POR_DEFECTO,
    ]
    elementos.append(Paragraph("Condiciones", subtitulo))
    elementos.append(_lista(condiciones_texto, normal))

    elementos.append(Paragraph("Aceptación", subtitulo))
    elementos.append(Paragraph("Nombre: ______________________________", normal))
    elementos.append(Paragraph("RUT: ______________________________", normal))
    elementos.append(Paragraph("Firma: ______________________________", normal))
    elementos.append(Paragraph("Fecha: ______________________________", normal))

    doc.build(elementos)
    return ruta_salida
