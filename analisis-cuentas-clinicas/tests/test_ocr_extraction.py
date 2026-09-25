"""Prueba de regresión del camino de OCR (pytesseract) de extremo a extremo:
genera una imagen en memoria y verifica que el pipeline real (no solo el
regex en aislado) extraiga el ítem correctamente y descarte la línea de
encabezado (RUT) como ítem fantasma.

Se salta automáticamente si Tesseract no está instalado en el sistema,
para no romper `pytest` en máquinas sin esa dependencia opcional del SO.
"""

import shutil

import pytest
from PIL import Image, ImageDraw

from app.extraction.field_extraction import extraer_items_desde_texto
from app.extraction.pdf_ocr import extraer_texto_imagen
from app.extraction.pipeline import _validar_items

pytestmark = pytest.mark.skipif(shutil.which("tesseract") is None, reason="Tesseract OCR no está instalado")


def _imagen_de_prueba() -> Image.Image:
    imagen = Image.new("RGB", (900, 200), "white")
    dibujo = ImageDraw.Draw(imagen)
    dibujo.text((20, 20), "RUT: 22.222.222-2", fill="black")
    dibujo.text((20, 60), "220305 Stent coronario $3.200.000 $1.800.000 $1.400.000", fill="black")
    return imagen


def test_ocr_extrae_item_y_descarta_linea_de_encabezado(tmp_path):
    ruta = tmp_path / "prueba_ocr.png"
    _imagen_de_prueba().save(ruta)

    texto = extraer_texto_imagen(str(ruta))
    items = extraer_items_desde_texto(texto, metodo="imagen_ocr")
    items = _validar_items(items)

    assert len(items) == 1
    assert items[0]["codigo_prestacion"] == "220305"
    assert items[0]["valor_cobrado"] == 3200000.0
    assert all(item.get("valor_cobrado") != 22222222.0 for item in items)
