"""Verifica la verificación asistida por IA del deducible CAEC:

- Nunca llama a la API si ENABLE_EXTERNAL_AI está apagado o falta la key.
- Cuando se llama, usa los datos YA CALCULADOS (no le pide al modelo que
  calcule la UF ni la fórmula del deducible) y devuelve el texto de la
  respuesta.
"""

import types
from unittest.mock import MagicMock

import pytest

from app.analysis import ai_verification
from app.analysis.caec_deducible import calcular_deducible_caec


def _settings_falsas(**overrides):
    base = {"enable_external_ai": True, "anthropic_api_key": "sk-test-123"}
    base.update(overrides)
    return types.SimpleNamespace(**base)


def _items_de_prueba():
    return [
        {
            "codigo_prestacion": "23.01.016",
            "descripcion": "PROTESIS ARTERIALES, O VASCULARES, STENT",
            "valor_cobrado": 14700000.0,
            "valor_bonificado": 209408.0,
            "monto_no_cubierto": 14490592.0,
        }
    ]


def test_lanza_excepcion_si_ia_externa_esta_deshabilitada(monkeypatch):
    monkeypatch.setattr(ai_verification, "settings", _settings_falsas(enable_external_ai=False))
    calculo = calcular_deducible_caec(206000, 40790)

    with pytest.raises(ai_verification.VerificacionIANoDisponible):
        ai_verification.verificar_deducible_caec(
            items_relevantes=_items_de_prueba(),
            calculo_deducible=calculo,
            cotizacion_pactada_pesos=206000,
            fecha_hospitalizacion="19-06-2026",
            uso_multiple=False,
        )


def test_lanza_excepcion_si_falta_api_key(monkeypatch):
    monkeypatch.setattr(ai_verification, "settings", _settings_falsas(anthropic_api_key=""))
    calculo = calcular_deducible_caec(206000, 40790)

    with pytest.raises(ai_verification.VerificacionIANoDisponible):
        ai_verification.verificar_deducible_caec(
            items_relevantes=_items_de_prueba(),
            calculo_deducible=calculo,
            cotizacion_pactada_pesos=206000,
            fecha_hospitalizacion="19-06-2026",
            uso_multiple=False,
        )


def test_devuelve_el_texto_de_la_respuesta_del_modelo(monkeypatch):
    monkeypatch.setattr(ai_verification, "settings", _settings_falsas())
    calculo = calcular_deducible_caec(206000, 40790)

    bloque_texto = types.SimpleNamespace(type="text", text="El deducible parece correctamente aplicado.")
    respuesta_falsa = types.SimpleNamespace(content=[bloque_texto])
    cliente_falso = MagicMock()
    cliente_falso.messages.create.return_value = respuesta_falsa

    texto = ai_verification.verificar_deducible_caec(
        items_relevantes=_items_de_prueba(),
        calculo_deducible=calculo,
        cotizacion_pactada_pesos=206000,
        fecha_hospitalizacion="19-06-2026",
        uso_multiple=False,
        cliente_anthropic=cliente_falso,
    )

    assert texto == "El deducible parece correctamente aplicado."
    # El cálculo del deducible (ya resuelto) se envía al modelo como dato,
    # no se le pide que lo recalcule.
    kwargs_llamada = cliente_falso.messages.create.call_args.kwargs
    assert "14.490.592" in kwargs_llamada["messages"][0]["content"] or (
        "14490592" in kwargs_llamada["messages"][0]["content"]
    )
    assert "jurisprudencia" in kwargs_llamada["system"].lower()
