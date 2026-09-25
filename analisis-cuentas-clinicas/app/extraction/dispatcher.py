"""Enruta un archivo cargado hacia el extractor adecuado según su extensión."""

from pathlib import Path

from app.extraction import docx_extractor, pdf_ocr, pdf_text, xlsx_extractor

EXTENSIONES_IMAGEN = {".jpg", ".jpeg", ".png"}
EXTENSIONES_SOPORTADAS = {".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"}

# Un PDF con texto real debe superar este umbral de caracteres; de lo contrario
# se asume escaneado y se procesa con OCR.
UMBRAL_TEXTO_PDF = 30


def extraer_documento(ruta: str) -> dict:
    ext = Path(ruta).suffix.lower()
    if ext not in EXTENSIONES_SOPORTADAS:
        raise ValueError(f"Extensión no soportada: {ext}")

    resultado = {"texto": "", "tablas": [], "hojas": {}, "metodo": "", "extension": ext}

    if ext == ".pdf":
        texto, tiene_texto = pdf_text.extraer_texto_pdf(ruta)
        if tiene_texto and len(texto.strip()) > UMBRAL_TEXTO_PDF:
            resultado["texto"] = texto
            resultado["metodo"] = "pdf_texto"
        else:
            resultado["texto"] = pdf_ocr.extraer_texto_pdf_ocr(ruta)
            resultado["metodo"] = "pdf_ocr"
    elif ext in EXTENSIONES_IMAGEN:
        resultado["texto"] = pdf_ocr.extraer_texto_imagen(ruta)
        resultado["metodo"] = "imagen_ocr"
    elif ext == ".docx":
        texto, tablas = docx_extractor.extraer_texto_docx(ruta)
        resultado["texto"] = texto
        resultado["tablas"] = tablas
        resultado["metodo"] = "docx"
    elif ext == ".xlsx":
        resultado["hojas"] = xlsx_extractor.extraer_tablas_xlsx(ruta)
        resultado["metodo"] = "xlsx"

    return resultado
