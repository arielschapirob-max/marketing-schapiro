"""Verifica la extracción de liquidaciones reales donde cada columna de la
tabla queda en su propia línea de texto (patrón real observado en PDFs de
Banmédica extraídos con PyMuPDF), en vez de una prestación completa por
línea como asumen los documentos ficticios de muestra.
"""

from app.extraction.field_extraction import extraer_items_columnar_por_prestador

TEXTO_LIQUIDACION_REAL = """DETALLE HOSPITALIZACIÓN
BONOS
RUT PREST
DESCRIPCIÓN
CANTIDAD
CÓDIGO
VAL. PRESTA
BONIFICACIÓN
VALOR A PAGAR
TIPO CARGO
NOVENOS
BONIF %
TOPE COB. MIN LEGAL
92,051,000-0
DÍA CAMA DE HOSPITALIZACIÓN IN
1
201002
281.865
110.359
171.506
N
N
92,051,000-0
PROSTATECTOMÍA RADICAL POR CÁN
1
1902057
1.477.000
257.904
1.219.096
N
N
TOTAL HOSPITALIZACIÓN BONOS
1.758.865
368.263
1.390.602
DETALLE PREST. SIN BONIFICACIÓN
RUT PREST
DESCRIPCIÓN
CANTIDAD
CÓDIGO
VAL. PRESTA
MOTIVO SIN BONIFICACIÓN
92,051,000-0
TERMOMETRO DIGITAL CON LOGO
1
3101306
8.906
PRESTACION SIN CODIGO EN ARANCEL PARA SU
"""


def test_extrae_items_con_columnas_una_por_linea():
    items = extraer_items_columnar_por_prestador(TEXTO_LIQUIDACION_REAL, pagina=1)

    assert len(items) == 3

    dia_cama = items[0]
    assert dia_cama["codigo_prestacion"] == "201002"
    assert dia_cama["cantidad"] == 1.0
    assert dia_cama["valor_cobrado"] == 281865.0
    assert dia_cama["valor_bonificado"] == 110359.0
    assert dia_cama["copago"] == 171506.0
    assert "DÍA CAMA" in dia_cama["descripcion"]

    prostatectomia = items[1]
    assert prostatectomia["codigo_prestacion"] == "1902057"
    assert prostatectomia["valor_cobrado"] == 1477000.0

    sin_bonificacion = items[2]
    assert sin_bonificacion["codigo_prestacion"] == "3101306"
    assert sin_bonificacion["valor_cobrado"] == 8906.0
    assert sin_bonificacion["valor_bonificado"] is None
    assert sin_bonificacion["glosa"] == "PRESTACION SIN CODIGO EN ARANCEL PARA SU"


def test_no_produce_items_espurios_desde_la_fila_de_totales():
    items = extraer_items_columnar_por_prestador(TEXTO_LIQUIDACION_REAL, pagina=1)
    descripciones = [i["descripcion"] for i in items]
    assert not any("TOTAL" in d.upper() for d in descripciones)


def test_texto_sin_patron_de_rut_prestador_devuelve_vacio():
    # Los documentos ficticios de muestra traen cada prestación en una sola
    # línea (sin el patrón de RUT de prestador): esta heurística no debe
    # inventar ítems ahí, para que el llamador recurra a la heurística de
    # texto libre en su lugar.
    texto_ficticio = "220305 Stent coronario liberador de fármaco $3.200.000 $1.800.000 $1.400.000"
    assert extraer_items_columnar_por_prestador(texto_ficticio) == []
