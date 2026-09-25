"""Verifica que solo los documentos de tipo cuenta clínica / liquidación de
isapre pasen por la extracción de ítems, y que los ítems de un PDF con texto
queden marcados con su página de origen.
"""

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate

from app.extraction.pipeline import procesar_documento


def _generar_pdf_con_item(ruta):
    doc = SimpleDocTemplate(str(ruta), pagesize=LETTER)
    normal = getSampleStyleSheet()["Normal"]
    doc.build([Paragraph("220305 Stent coronario $3.200.000 $1.800.000 $1.400.000", normal)])


def test_carta_de_rechazo_no_extrae_items(tmp_path):
    ruta = tmp_path / "carta.pdf"
    _generar_pdf_con_item(ruta)

    resultado = procesar_documento(str(ruta), tipo_documento="carta_rechazo")

    assert resultado["items"] == []
    assert "Stent coronario" in resultado["texto_extraido"]


def test_cuenta_clinica_si_extrae_items(tmp_path):
    ruta = tmp_path / "cuenta.pdf"
    _generar_pdf_con_item(ruta)

    resultado = procesar_documento(str(ruta), tipo_documento="cuenta_clinica")

    assert len(resultado["items"]) == 1
    assert resultado["items"][0]["codigo_prestacion"] == "220305"


def test_items_de_pdf_quedan_con_pagina_de_origen(tmp_path):
    ruta = tmp_path / "cuenta.pdf"
    _generar_pdf_con_item(ruta)

    resultado = procesar_documento(str(ruta), tipo_documento="liquidacion_isapre")

    assert resultado["items"][0]["pagina_origen"] == 1
