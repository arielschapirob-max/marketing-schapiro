"""Extracción de texto desde PDF con capa de texto, usando PyMuPDF."""

import pymupdf


def extraer_texto_pdf(ruta: str) -> tuple[str, bool, list[str]]:
    """Retorna (texto_completo, tiene_texto, texto_por_pagina).

    ``tiene_texto`` es False si el PDF parece escaneado. ``texto_por_pagina``
    permite rastrear en qué página del documento se originó cada ítem
    extraído.
    """
    documento = pymupdf.open(ruta)
    paginas = []
    tiene_texto = False
    try:
        for pagina in documento:
            texto = pagina.get_text()
            if texto.strip():
                tiene_texto = True
            paginas.append(texto)
    finally:
        documento.close()
    return "\n".join(paginas), tiene_texto, paginas
