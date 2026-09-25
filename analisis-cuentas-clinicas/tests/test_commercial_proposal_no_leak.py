"""Verifica que la propuesta comercial NUNCA filtre metodología, códigos,
fundamentos jurídicos específicos, jurisprudencia ni estrategia de
reclamación, conforme a la separación estricta exigida entre el informe
interno y la propuesta comercial.
"""

import types

import pymupdf
from docx import Document as DocxDocument

from app.reports.commercial_proposal_docx import generar_propuesta_docx
from app.reports.commercial_proposal_pdf import generar_propuesta_pdf

TERMINOS_PROHIBIDOS = [
    "codigo_prestacion",
    "código de prestación",
    "artículo",
    "ley n",
    "corte suprema",
    "superintendencia de salud",
    "glosa genérica",
    "demanda arbitral",
    "recurso de reposición",
    "hallazgo potencialmente discutible",
    "stent coronario",
]


def _caso_falso():
    return types.SimpleNamespace(id=1, nombre_cliente="Cliente de Prueba", numero_cuenta="ABC-123")


def _honorarios(**overrides):
    base = {
        "honorario_fijo_texto": "UF 15",
        "honorario_exito": True,
        "honorario_exito_texto": "15% del monto recuperado",
        "gastos_texto": "",
        "exclusiones_texto": "",
    }
    base.update(overrides)
    return base


def test_propuesta_docx_no_filtra_metodologia(tmp_path):
    ruta = tmp_path / "propuesta.docx"
    generar_propuesta_docx(_caso_falso(), _honorarios(), str(ruta))

    documento = DocxDocument(str(ruta))
    texto = "\n".join(p.text for p in documento.paragraphs).lower()

    for termino in TERMINOS_PROHIBIDOS:
        assert termino.lower() not in texto


def test_propuesta_pdf_no_filtra_metodologia_y_respeta_dos_paginas(tmp_path):
    ruta = tmp_path / "propuesta.pdf"
    generar_propuesta_pdf(_caso_falso(), _honorarios(honorario_exito=False, honorario_exito_texto=""), str(ruta))

    documento_pdf = pymupdf.open(str(ruta))
    texto = "\n".join(pagina.get_text() for pagina in documento_pdf).lower()
    n_paginas = documento_pdf.page_count
    documento_pdf.close()

    for termino in TERMINOS_PROHIBIDOS:
        assert termino.lower() not in texto
    assert n_paginas <= 2


def test_propuesta_incluye_frase_obligatoria_y_ausencia_de_garantia(tmp_path):
    ruta = tmp_path / "propuesta.docx"
    generar_propuesta_docx(_caso_falso(), _honorarios(), str(ruta))

    documento = DocxDocument(str(ruta))
    texto = "\n".join(p.text for p in documento.paragraphs)

    assert "Del examen preliminar de los antecedentes recibidos" in texto
    assert "obligación de medios y no de resultado" in texto
