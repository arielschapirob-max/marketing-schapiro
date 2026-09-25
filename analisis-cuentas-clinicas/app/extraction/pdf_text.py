"""Extracción de texto desde PDF con capa de texto, usando PyMuPDF."""

import fitz


def extraer_texto_pdf(ruta: str) -> tuple[str, bool]:
    """Retorna (texto_completo, tiene_texto). ``tiene_texto`` es False si el PDF parece escaneado."""
    documento = fitz.open(ruta)
    fragmentos = []
    tiene_texto = False
    try:
        for pagina in documento:
            texto = pagina.get_text()
            if texto.strip():
                tiene_texto = True
            fragmentos.append(texto)
    finally:
        documento.close()
    return "\n".join(fragmentos), tiene_texto
