"""Verificación de consistencia aritmética entre cobrado, bonificado, copago y no cubierto."""

TOLERANCIA_CLP = 1.0


def verificar_consistencia_item(item) -> bool:
    """Retorna True si la suma de bonificado + copago + no_cubierto se ajusta al cobrado.

    Si faltan datos suficientes para verificar (valores no informados), se
    considera consistente para no generar falsos positivos por ausencia de
    información.
    """
    cobrado = item.valor_cobrado
    bonificado = item.valor_bonificado
    copago = item.copago
    no_cubierto = item.monto_no_cubierto

    if cobrado is None or bonificado is None:
        return True
    if copago is None and no_cubierto is None:
        return True

    suma_conocida = (bonificado or 0) + (copago or 0) + (no_cubierto or 0)
    return abs(cobrado - suma_conocida) <= TOLERANCIA_CLP
