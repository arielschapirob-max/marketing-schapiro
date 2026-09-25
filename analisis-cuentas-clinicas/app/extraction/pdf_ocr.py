"""OCR para PDF escaneados e imágenes, usando pytesseract + pdf2image (Poppler)."""

import pytesseract
from pdf2image import convert_from_path
from PIL import Image

from app.config import settings

if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

IDIOMA_OCR = "spa"


def extraer_texto_pdf_ocr(ruta: str) -> str:
    kwargs = {}
    if settings.poppler_path:
        kwargs["poppler_path"] = settings.poppler_path
    paginas = convert_from_path(ruta, **kwargs)
    textos = [pytesseract.image_to_string(pagina, lang=IDIOMA_OCR) for pagina in paginas]
    return "\n".join(textos)


def extraer_texto_imagen(ruta: str) -> str:
    imagen = Image.open(ruta)
    return pytesseract.image_to_string(imagen, lang=IDIOMA_OCR)
