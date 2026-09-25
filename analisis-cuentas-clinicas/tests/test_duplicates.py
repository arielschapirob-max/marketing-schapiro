from app.analysis.duplicates import detectar_duplicados
from app.db.models import ItemCuenta


def _item(**kwargs):
    base = dict(
        codigo_prestacion="1001",
        descripcion="Examen de sangre",
        fecha="01-01-2026",
        valor_cobrado=15000.0,
    )
    base.update(kwargs)
    return ItemCuenta(**base)


def test_detecta_duplicado_exacto():
    items = [_item(), _item()]
    grupos = detectar_duplicados(items)
    assert len(grupos) == 1
    assert len(grupos[0]) == 2


def test_no_detecta_duplicado_si_difiere_valor():
    items = [_item(), _item(valor_cobrado=20000.0)]
    grupos = detectar_duplicados(items)
    assert grupos == []


def test_no_detecta_duplicado_item_unico():
    items = [_item(codigo_prestacion="2002", descripcion="Otro examen")]
    grupos = detectar_duplicados(items)
    assert grupos == []
