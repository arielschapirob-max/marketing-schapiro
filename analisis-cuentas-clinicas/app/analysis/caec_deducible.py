"""Cálculo determinístico del deducible CAEC (Cobertura Adicional para
Enfermedades Catastróficas).

Fórmula pública de la Superintendencia de Salud: el deducible equivale a
30 veces la cotización pactada en el contrato de salud por cada
beneficiario que use la CAEC (mínimo 60 UF, máximo 126 UF) por cada
enfermedad catastrófica o diagnóstico. Cuando la CAEC es usada por más de
un beneficiario del contrato, o para más de una enfermedad catastrófica
del mismo beneficiario, el multiplicador sube a 43 cotizaciones pactadas
(máximo 181 UF).

Esto es aritmética pura, no jurisprudencia ni interpretación — por eso se
calcula en código en vez de pedírselo a un modelo de IA (que no tiene
forma de "saber" con certeza el valor de la UF de una fecha específica ni
de garantizar que no se equivoca en una multiplicación).
"""

MULTIPLICADOR_UF = 30
MULTIPLICADOR_UF_MULTIPLE = 43
TOPE_MINIMO_UF = 60
TOPE_MAXIMO_UF = 126
TOPE_MAXIMO_UF_MULTIPLE = 181


def calcular_deducible_caec(cotizacion_pactada_pesos: float, valor_uf: float, uso_multiple: bool = False) -> dict:
    """Calcula el deducible CAEC aplicable, en pesos, para una cotización y UF dadas.

    ``uso_multiple`` es True cuando la CAEC se usó por más de un
    beneficiario del contrato de salud, o para más de una enfermedad
    catastrófica del mismo beneficiario.
    """
    multiplicador = MULTIPLICADOR_UF_MULTIPLE if uso_multiple else MULTIPLICADOR_UF
    tope_maximo_uf = TOPE_MAXIMO_UF_MULTIPLE if uso_multiple else TOPE_MAXIMO_UF

    deducible_calculado_pesos = multiplicador * cotizacion_pactada_pesos
    tope_minimo_pesos = TOPE_MINIMO_UF * valor_uf
    tope_maximo_pesos = tope_maximo_uf * valor_uf

    deducible_aplicable_pesos = min(max(deducible_calculado_pesos, tope_minimo_pesos), tope_maximo_pesos)

    return {
        "multiplicador_uf": multiplicador,
        "tope_minimo_uf": TOPE_MINIMO_UF,
        "tope_maximo_uf": tope_maximo_uf,
        "valor_uf_usado": valor_uf,
        "deducible_calculado_pesos": round(deducible_calculado_pesos, 2),
        "tope_minimo_pesos": round(tope_minimo_pesos, 2),
        "tope_maximo_pesos": round(tope_maximo_pesos, 2),
        "deducible_aplicable_pesos": round(deducible_aplicable_pesos, 2),
        "limitado_por_tope_maximo": deducible_calculado_pesos > tope_maximo_pesos,
        "limitado_por_tope_minimo": deducible_calculado_pesos < tope_minimo_pesos,
    }
