"""Generador de la propuesta comercial (PDF, máx. 2 páginas) para el potencial cliente.

Misma advertencia de diseño que ``commercial_proposal_docx.py``: contenido
genérico únicamente, sin metodología, códigos, fundamentos jurídicos
específicos, jurisprudencia ni estrategia.
"""

import datetime as dt

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer

from app.reports import texts


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
        Paragraph("Propuesta de Servicios Profesionales", titulo),
        Paragraph(f"Fecha: {dt.date.today().strftime('%d-%m-%Y')}", normal),
        Paragraph(f"Cliente: {caso.nombre_cliente}", normal),
    ]
    if caso.numero_cuenta:
        elementos.append(Paragraph(f"Caso relacionado: Cuenta clínica N° {caso.numero_cuenta}", normal))
    elementos.append(Spacer(1, 0.3 * cm))

    elementos.append(Paragraph("Antecedentes", subtitulo))
    elementos.append(Paragraph(texts.FRASE_PROPUESTA_COMERCIAL, normal))

    elementos.append(Paragraph("Servicios incluidos", subtitulo))
    elementos.append(
        ListFlowable(
            [ListItem(Paragraph(s, normal)) for s in texts.SERVICIOS_PROPUESTA],
            bulletType="bullet",
        )
    )

    elementos.append(Paragraph("Honorarios", subtitulo))
    elementos.append(
        Paragraph(
            f"Honorario fijo: {honorarios.get('honorario_fijo_texto', 'A definir')} (neto, más IVA).",
            normal,
        )
    )
    if honorarios.get("honorario_exito"):
        elementos.append(
            Paragraph(
                f"Honorario de éxito: {honorarios.get('honorario_exito_texto', 'A definir')}",
                normal,
            )
        )
        elementos.append(Paragraph(texts.DEFINICION_EXITO, normal))
    if honorarios.get("gastos_texto"):
        elementos.append(Paragraph(f"Gastos: {honorarios.get('gastos_texto')}", normal))

    elementos.append(Paragraph("Exclusiones", subtitulo))
    elementos.append(Paragraph(honorarios.get("exclusiones_texto") or texts.EXCLUSIONES_POR_DEFECTO, normal))

    elementos.append(Paragraph("Condiciones", subtitulo))
    elementos.append(Paragraph(texts.AUSENCIA_GARANTIA, normal))
    elementos.append(
        Paragraph(
            f"Esta propuesta tiene una vigencia de {vigencia_dias} días corridos desde su fecha de emisión.",
            normal,
        )
    )

    elementos.append(Paragraph("Aceptación", subtitulo))
    elementos.append(Paragraph("Nombre: ______________________________", normal))
    elementos.append(Paragraph("RUT: ______________________________", normal))
    elementos.append(Paragraph("Firma: ______________________________", normal))
    elementos.append(Paragraph("Fecha: ______________________________", normal))

    doc.build(elementos)
    return ruta_salida
