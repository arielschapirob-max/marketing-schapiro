"""Consulta el valor de la UF para una fecha específica.

Fuente: mindicador.cl, agregador público de indicadores económicos
chilenos (Banco Central / SII). Deliberadamente NO se inventa ni se
aproxima un valor de UF cuando la consulta falla: mejor devolver ``None``
y pedir verificación manual que afirmar un número no verificado en un
cálculo que puede terminar en una gestión legal.
"""

import requests

TIMEOUT_SEGUNDOS = 8
URL_BASE = "https://mindicador.cl/api/uf"


def obtener_valor_uf(fecha_ddmmaaaa: str) -> float | None:
    """Valor de la UF en pesos para ``fecha_ddmmaaaa`` (formato "dd-mm-aaaa").

    Devuelve ``None`` si la consulta falla o la respuesta no trae el
    formato esperado — nunca un valor adivinado.
    """
    try:
        respuesta = requests.get(f"{URL_BASE}/{fecha_ddmmaaaa}", timeout=TIMEOUT_SEGUNDOS)
        respuesta.raise_for_status()
        datos = respuesta.json()
    except Exception:
        return None

    serie = datos.get("serie") or []
    if not serie:
        return None
    valor = serie[0].get("valor")
    if valor is None:
        return None
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None
