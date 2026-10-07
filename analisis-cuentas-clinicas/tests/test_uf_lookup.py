"""Verifica que la consulta de UF nunca invente un valor: si la llamada a
mindicador.cl falla o la respuesta no trae el formato esperado, devuelve
None en vez de un número adivinado.
"""

from unittest.mock import MagicMock, patch

from app.analysis.uf_lookup import obtener_valor_uf


def _respuesta_falsa(json_data, status_ok=True):
    mock = MagicMock()
    mock.json.return_value = json_data
    if not status_ok:
        mock.raise_for_status.side_effect = Exception("HTTP error")
    return mock


def test_obtiene_valor_uf_correctamente():
    datos = {"serie": [{"fecha": "2026-06-19T04:00:00.000Z", "valor": 40790.23}]}
    with patch("app.analysis.uf_lookup.requests.get", return_value=_respuesta_falsa(datos)):
        assert obtener_valor_uf("19-06-2026") == 40790.23


def test_devuelve_none_si_la_serie_viene_vacia():
    with patch("app.analysis.uf_lookup.requests.get", return_value=_respuesta_falsa({"serie": []})):
        assert obtener_valor_uf("19-06-2026") is None


def test_devuelve_none_si_falla_la_conexion():
    with patch("app.analysis.uf_lookup.requests.get", side_effect=ConnectionError("sin red")):
        assert obtener_valor_uf("19-06-2026") is None


def test_devuelve_none_si_la_respuesta_no_tiene_el_formato_esperado():
    with patch("app.analysis.uf_lookup.requests.get", return_value=_respuesta_falsa({"algo": "inesperado"})):
        assert obtener_valor_uf("19-06-2026") is None


def test_devuelve_none_si_el_status_http_falla():
    with patch(
        "app.analysis.uf_lookup.requests.get",
        return_value=_respuesta_falsa({"serie": [{"valor": 1}]}, status_ok=False),
    ):
        assert obtener_valor_uf("19-06-2026") is None
