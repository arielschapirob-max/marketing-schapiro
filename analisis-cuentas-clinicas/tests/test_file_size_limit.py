from app.utils.file_storage import excede_tamano_maximo


def test_archivo_dentro_del_limite_no_excede():
    assert excede_tamano_maximo(10 * 1024 * 1024, limite_mb=25) is False


def test_archivo_en_el_limite_exacto_no_excede():
    assert excede_tamano_maximo(25 * 1024 * 1024, limite_mb=25) is False


def test_archivo_que_supera_el_limite_excede():
    assert excede_tamano_maximo(30 * 1024 * 1024, limite_mb=25) is True
