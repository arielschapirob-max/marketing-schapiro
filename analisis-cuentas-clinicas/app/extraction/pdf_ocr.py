"""OCR para PDF escaneados e imágenes, usando pytesseract + pdf2image (Poppler)."""

import pytesseract
from pdf2image import convert_from_path
from PIL import Image

from app.config import settings

if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd


def extraer_texto_pdf_ocr(ruta: str) -> tuple[str, list[str]]:
    """Retorna (texto_completo, texto_por_pagina), igual que ``pdf_text.extraer_texto_pdf``."""
    kwargs = {}
    if settings.poppler_path:
        kwargs["poppler_path"] = settings.poppler_path
    paginas_imagen = convert_from_path(ruta, **kwargs)
    paginas_texto = [
        pytesseract.image_to_string(pagina, lang=settings.tesseract_lang) for pagina in paginas_imagen
    ]
    return "\n".join(paginas_texto), paginas_texto


def extraer_texto_imagen(ruta: str) -> str:
    imagen = Image.open(ruta)
    return pytesseract.image_to_string(imagen, lang=settings.tesseract_lang)
