from app.extraction.normalization import parsear_monto


def test_parsea_monto_formato_chileno():
    assert parsear_monto("$1.234.567") == 1234567.0


def test_parsea_monto_sin_simbolo():
    assert parsear_monto("45.000") == 45000.0


def test_parsea_monto_decimal():
    assert parsear_monto("1.234,50") == 1234.5


def test_parsea_monto_negativo_parentesis():
    assert parsear_monto("(10.000)") == -10000.0


def test_parsea_monto_vacio_retorna_none():
    assert parsear_monto("") is None
    assert parsear_monto(None) is None


def test_parsea_monto_numero_directo():
    assert parsear_monto(1500) == 1500.0


def test_parsea_monto_invalido_retorna_none():
    assert parsear_monto("no es un monto") is None
