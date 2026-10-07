"""Extracción de texto desde PDF con capa de texto, usando PyMuPDF."""

import re

import pymupdf

# Algunas liquidaciones reales (ej. Cruz Blanca) parten los montos grandes en
# 2-3 líneas de texto al extraer con get_text() plano, y el orden de lectura
# del texto no siempre respeta el orden visual de columnas. Para esos casos
# reconstruimos las filas por coordenada (x0, y0) de cada palabra: se agrupan
# palabras cuya y0 cae dentro de ``TOL_FILA`` (tolerancia por variación de
# línea base entre glifos de una misma fila) y, si una fila queda compuesta
# solo por fragmentos numéricos/porcentuales cortos (quiebre de línea de un
# monto), se fusiona con la fila anterior en vez de tratarla como una fila
# nueva.
TOL_FILA = 3.0
MAX_TOKENS_FRAGMENTO = 4
PATRON_FRAGMENTO = re.compile(r"^[\d.,%$-]+$")


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


def _filas_pagina_por_coordenadas(pagina) -> list[list[str]]:
    palabras = pagina.get_text("words")  # (x0, y0, x1, y1, texto, bloque, linea, nro_palabra)
    puntos = sorted([(w[1], w[0], w[4]) for w in palabras], key=lambda t: (t[0], t[1]))

    clusters: list[list[str]] = []
    actual: list[tuple[float, str]] = []
    y_ref = None
    for y0, x0, texto in puntos:
        if y_ref is None or abs(y0 - y_ref) <= TOL_FILA:
            actual.append((x0, texto))
        else:
            actual.sort(key=lambda t: t[0])
            clusters.append([t for _, t in actual])
            actual = [(x0, texto)]
        y_ref = y0
    if actual:
        actual.sort(key=lambda t: t[0])
        clusters.append([t for _, t in actual])

    filas: list[list[str]] = []
    for toks in clusters:
        es_fragmento = len(toks) <= MAX_TOKENS_FRAGMENTO and all(PATRON_FRAGMENTO.match(t) for t in toks)
        if es_fragmento and filas:
            filas[-1] = filas[-1] + toks
        else:
            filas.append(toks)
    return filas


def extraer_filas_pdf_por_coordenadas(ruta: str) -> list[list[list[str]]]:
    """Retorna, por página, las filas de texto reconstruidas por coordenada.

    Cada fila es una lista de tokens (palabras) en orden de lectura
    izquierda-a-derecha real, con los quiebres de línea de montos grandes ya
    fusionados. Pensado para liquidaciones tabulares reales cuyo texto plano
    no preserva el orden de columnas de forma confiable (ver
    ``app/extraction/field_extraction.extraer_items_filas_coordenadas``).
    """
    documento = pymupdf.open(ruta)
    try:
        return [_filas_pagina_por_coordenadas(pagina) for pagina in documento]
    finally:
        documento.close()
