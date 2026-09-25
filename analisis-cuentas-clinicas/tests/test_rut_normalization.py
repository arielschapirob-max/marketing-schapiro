from app.extraction.normalization import enmascarar_rut, formatear_rut, normalizar_rut, validar_rut


def test_normaliza_rut_con_puntos_y_guion():
    assert normalizar_rut("12.345.678-5") == "12345678-5"


def test_normaliza_rut_sin_formato():
    assert normalizar_rut("123456785") == "12345678-5"


def test_normaliza_rut_minuscula_k():
    assert normalizar_rut("11.111.111-k") == "11111111-K"


def test_rut_invalido_retorna_none():
    assert normalizar_rut("") is None
    assert normalizar_rut("abc") is None


def test_validar_rut_dv_correcto():
    assert validar_rut("11.111.111-1") is True


def test_validar_rut_dv_incorrecto():
    assert validar_rut("11.111.111-2") is False


def test_enmascarar_rut():
    resultado = enmascarar_rut("12.345.678-5")
    assert resultado.endswith("-5")
    assert "345678" not in resultado
    assert resultado.startswith("12")


def test_formatear_rut():
    assert formatear_rut("123456785") == "12.345.678-5"
