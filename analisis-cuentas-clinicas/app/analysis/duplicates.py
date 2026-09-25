"""Detección de posibles ítems duplicados dentro de un mismo caso."""

from collections import defaultdict


def detectar_duplicados(items) -> list[list]:
    """Agrupa ítems por (código, fecha, valor cobrado, descripción) y retorna los grupos con más de un elemento."""
    grupos = defaultdict(list)
    for item in items:
        if not item.codigo_prestacion and not item.descripcion:
            continue
        clave = (item.codigo_prestacion, item.fecha, item.valor_cobrado, item.descripcion)
        grupos[clave].append(item)
    return [grupo for grupo in grupos.values() if len(grupo) > 1]
