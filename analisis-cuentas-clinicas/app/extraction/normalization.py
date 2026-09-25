"""Normalización de RUT chileno y de montos en formato local (CLP)."""

import re


def normalizar_rut(rut: str) -> str | None:
    """Normaliza un RUT a formato ``CUERPO-DV`` sin puntos, DV en mayúscula."""
    if not rut:
        return None
    limpio = re.sub(r"[.\s]", "", str(rut)).upper().replace("-", "")
    if len(limpio) < 2:
        return None
    cuerpo, dv = limpio[:-1], limpio[-1]
    if not cuerpo.isdigit() or not (dv.isdigit() or dv == "K"):
        return None
    return f"{cuerpo}-{dv}"


def calcular_dv(cuerpo: str) -> str:
    suma = 0
    multiplicador = 2
    for digito in reversed(cuerpo):
        suma += int(digito) * multiplicador
        multiplicador = multiplicador + 1 if multiplicador < 7 else 2
    resto = 11 - (suma % 11)
    if resto == 11:
        return "0"
    if resto == 10:
        return "K"
    return str(resto)


def validar_rut(rut: str) -> bool:
    normalizado = normalizar_rut(rut)
    if not normalizado:
        return False
    cuerpo, dv = normalizado.split("-")
    return calcular_dv(cuerpo) == dv


def formatear_rut(rut: str) -> str:
    """Devuelve el RUT en formato ``12.345.678-9`` legible para informes."""
    normalizado = normalizar_rut(rut)
    if not normalizado:
        return rut
    cuerpo, dv = normalizado.split("-")
    cuerpo_formateado = f"{int(cuerpo):,}".replace(",", ".")
    return f"{cuerpo_formateado}-{dv}"


def enmascarar_rut(rut: str) -> str:
    """Enmascara el RUT para vistas de listado, dejando visibles solo los primeros dígitos y el DV."""
    normalizado = normalizar_rut(rut)
    if not normalizado:
        return "***"
    cuerpo, dv = normalizado.split("-")
    if len(cuerpo) <= 2:
        return f"**-{dv}"
    visible_inicio = cuerpo[:2]
    return f"{visible_inicio}{'*' * (len(cuerpo) - 2)}-{dv}"


_PATRON_MONTO_CHILENO = re.compile(r"^-?\d{1,3}(\.\d{3})*(,\d+)?$")


def parsear_monto(valor) -> float | None:
    """Convierte un texto de monto en formato chileno (o genérico) a ``float``.

    Soporta: ``$1.234.567``, ``45.000``, ``1.234,50``, ``(10.000)`` (negativo entre paréntesis).
    """
    if valor is None:
        return None
    if isinstance(valor, (int, float)):
        return float(valor)

    texto = str(valor).strip()
    if not texto:
        return None

    texto = texto.replace("$", "").replace("CLP", "").replace("clp", "").strip()
    negativo = texto.startswith("(") and texto.endswith(")")
    texto = texto.strip("()").strip()
    if not texto:
        return None

    if _PATRON_MONTO_CHILENO.match(texto):
        texto = texto.replace(".", "").replace(",", ".")
    else:
        texto = texto.replace(",", "")

    try:
        numero = float(texto)
    except ValueError:
        return None

    return -numero if negativo else numero
