from app.analysis.findings_engine import analizar_items
from app.db.models import ItemCuenta


def _item(**kwargs):
    base = dict(
        codigo_prestacion="123456",
        descripcion="Prestación de prueba",
        glosa="Causal específica de prueba",
        valor_cobrado=100000.0,
        valor_bonificado=100000.0,
        copago=0.0,
        monto_no_cubierto=0.0,
        deducible=None,
        fecha="01-01-2026",
    )
    base.update(kwargs)
    return ItemCuenta(**base)


def test_detecta_cobertura_parcial():
    item = _item(valor_bonificado=60000.0, copago=40000.0)
    hallazgos = analizar_items([item])
    tipos = [h["tipo"] for h in hallazgos]
    assert "cobertura_parcial" in tipos


def test_no_marca_cobertura_parcial_si_totalmente_bonificado():
    item = _item(valor_bonificado=100000.0, copago=0.0)
    hallazgos = analizar_items([item])
    tipos = [h["tipo"] for h in hallazgos]
    assert "cobertura_parcial" not in tipos


def test_detecta_item_no_cubierto():
    item = _item(valor_bonificado=0.0, copago=0.0)
    hallazgos = analizar_items([item])
    tipos = [h["tipo"] for h in hallazgos]
    assert "item_no_cubierto" in tipos


def test_lenguaje_no_afirma_ilegalidad_ni_arbitrariedad():
    item = _item(valor_bonificado=0.0, copago=0.0)
    hallazgos = analizar_items([item])
    texto = " ".join(h["explicacion_interna"] for h in hallazgos).lower()
    for termino_prohibido in ["ilegal", "arbitrari", "incumplimiento", "infracción"]:
        assert termino_prohibido not in texto


def test_dispositivo_medico_stent_no_se_descarta_como_protesis():
    item = _item(descripcion="Stent coronario liberador de fármaco", valor_bonificado=0.0, copago=0.0)
    hallazgos = analizar_items([item])
    tipos = [h["tipo"] for h in hallazgos]
    assert "dispositivo_medico" in tipos
