"""Verifica la extracción de liquidaciones reales con código de prestación
puntuado (patrón real observado en PDFs de Cruz Blanca), donde el texto
plano de PyMuPDF corta los montos grandes en varias líneas y no respeta el
orden visual de columnas — a diferencia de los documentos ficticios de
muestra (una prestación por línea) y de las liquidaciones tipo Banmédica
(RUT de prestador por fila), este formato necesita reconstruir las filas
por coordenada antes de poder leerlas (ver ``app/extraction/pdf_text.py``).
"""

from app.extraction.field_extraction import extraer_items_filas_coordenadas

# Fila codificada simple, sin quiebre de línea en ningún monto.
FILA_DIA_CAMA = [
    "1", "02.01.001", "0", "DIA", "CAMA", "DE", "HOSPITALIZACION", "47",
    "$", "253,200", "$", "253,200", "$", "253,200", "100", "%",
    "$", "0", "$", "0", "$", "0", "CA", "Bono", "91171853", "NO",
]

# Fila codificada donde el valor de prestación y el porcentaje quedaron
# cortados al final (quiebre de línea reconstruido como "cola"): el primer
# "$" después de la descripción no tiene su número inmediatamente después.
FILA_STENT_CON_QUIEBRE = [
    "1", "23.01.016", "0", "PROTESIS", "ARTERIALES,", "STENT", "33",
    "$", "$", "14,700,000", "$", "209,408", "1.42",
    "$", "$", "0", "$", "0", "CA", "Bono", "91171855", "NO",
    "14,700,000", "%", "14,490,59", "2",
]

# Fila "sin arancel": sin código de prestación, un único monto y causal.
FILA_SIN_ARANCEL = ["3", "SABANA", "ULTRAABSORBENTE", "75X91", "$", "24,291", "NO", "ARANCELADO"]

# Fila que no debe producir ningún ítem (ej. una fila de totales que no
# empieza con cantidad+código ni cantidad+texto+"$").
FILA_TOTALES = ["$", "32,193,217", "$", "10,248,130", "$", "14,761,513"]


def test_fila_codificada_simple():
    items = extraer_items_filas_coordenadas([FILA_DIA_CAMA], pagina=1)
    assert len(items) == 1
    item = items[0]
    assert item["codigo_prestacion"] == "02.01.001"
    assert "DIA CAMA" in item["descripcion"]
    assert item["valor_cobrado"] == 253200.0
    assert item["valor_bonificado"] == 253200.0
    assert item["monto_no_cubierto"] == 0.0
    assert item["pagina_origen"] == 1


def test_fila_codificada_con_monto_cortado_por_salto_de_linea():
    items = extraer_items_filas_coordenadas([FILA_STENT_CON_QUIEBRE], pagina=1)
    assert len(items) == 1
    item = items[0]
    assert item["codigo_prestacion"] == "23.01.016"
    # El valor de prestación se reconstruye uniendo el "$" (en la fila
    # principal) con "14,700,000" (que había quedado al final por el
    # quiebre de línea).
    assert item["valor_cobrado"] == 14700000.0
    assert item["valor_bonificado"] == 209408.0


def test_fila_sin_arancel():
    items = extraer_items_filas_coordenadas([FILA_SIN_ARANCEL], pagina=2)
    assert len(items) == 1
    item = items[0]
    assert item["codigo_prestacion"] is None
    assert item["valor_cobrado"] == 24291.0
    assert item["valor_bonificado"] == 0.0
    assert item["glosa"] == "NO ARANCELADO"


def test_fila_de_totales_no_genera_item_espurio():
    items = extraer_items_filas_coordenadas([FILA_TOTALES], pagina=1)
    assert items == []


def test_texto_ficticio_de_muestra_no_dispara_esta_heuristica():
    # Los documentos ficticios de muestra no tienen el patrón de código
    # puntuado (NN.NN.NNN): esta heurística no debe inventar ítems ahí.
    fila_ficticia = ["220305", "Stent", "coronario", "$", "3,200,000"]
    assert extraer_items_filas_coordenadas([fila_ficticia], pagina=1) == []
