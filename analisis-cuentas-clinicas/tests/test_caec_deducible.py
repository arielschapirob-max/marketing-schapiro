"""Verifica el cálculo determinístico del deducible CAEC contra el caso
real que motivó esta función: Cruz Blanca, cotización pactada $206.000,
UF del 19/06/2026 ≈ $40.790 — el deducible calculado (30x) supera el tope
máximo de 126 UF, por lo que el deducible aplicable queda limitado a ese
tope.
"""

from app.analysis.caec_deducible import calcular_deducible_caec


def test_deducible_limitado_por_tope_maximo():
    resultado = calcular_deducible_caec(cotizacion_pactada_pesos=206000, valor_uf=40790)

    assert resultado["deducible_calculado_pesos"] == 6180000.0
    assert resultado["tope_maximo_pesos"] == 126 * 40790
    assert resultado["deducible_aplicable_pesos"] == resultado["tope_maximo_pesos"]
    assert resultado["limitado_por_tope_maximo"] is True
    assert resultado["limitado_por_tope_minimo"] is False


def test_deducible_sin_topes_cuando_queda_en_rango():
    # 30 * 100.000 = 3.000.000; con UF a 40.790, eso cae entre el tope
    # mínimo (60 UF ~ 2.447.400) y el máximo (126 UF ~ 5.139.540).
    resultado = calcular_deducible_caec(cotizacion_pactada_pesos=100000, valor_uf=40790)

    assert resultado["deducible_aplicable_pesos"] == resultado["deducible_calculado_pesos"]
    assert resultado["limitado_por_tope_maximo"] is False
    assert resultado["limitado_por_tope_minimo"] is False


def test_deducible_limitado_por_tope_minimo():
    # Una cotización muy baja hace que 30x quede bajo el tope mínimo de 60 UF.
    resultado = calcular_deducible_caec(cotizacion_pactada_pesos=10000, valor_uf=40790)

    assert resultado["deducible_calculado_pesos"] < resultado["tope_minimo_pesos"]
    assert resultado["deducible_aplicable_pesos"] == resultado["tope_minimo_pesos"]
    assert resultado["limitado_por_tope_minimo"] is True


def test_uso_multiple_usa_multiplicador_y_tope_mayores():
    resultado = calcular_deducible_caec(cotizacion_pactada_pesos=206000, valor_uf=40790, uso_multiple=True)

    assert resultado["multiplicador_uf"] == 43
    assert resultado["tope_maximo_uf"] == 181
    assert resultado["deducible_aplicable_pesos"] == 181 * 40790
