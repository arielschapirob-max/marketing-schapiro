"""Heurísticas de estructuración de campos e ítems a partir de texto y tablas.

Estas heurísticas son deliberadamente conservadoras: cuando no hay certeza,
se asigna confianza "bajo" o "medio" en vez de "alto". La pantalla de
revisión manual es obligatoria antes de cualquier análisis de hallazgos,
precisamente porque esta extracción es asistida y no reemplaza el criterio
del abogado.
"""

import re

from app.extraction.normalization import normalizar_rut, parsear_monto

PATRON_RUT = re.compile(r"\b\d{1,2}\.?\d{3}\.?\d{3}[-‐]?[\dkK]\b")
PATRON_MONTO = re.compile(r"\$?\s?-?\(?\d{1,3}(?:\.\d{3})+(?:,\d+)?\)?")
PATRON_FECHA = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")

# Algunas liquidaciones reales (ej. Banmédica) extraen con PyMuPDF con cada
# columna de la tabla en su propia línea, en vez de una prestación completa
# por línea (que es lo que asume ``extraer_items_desde_texto``). Cada fila
# empieza con el RUT del prestador en formato "92,051,000-0" o "92.051.000-0"
# (coma o punto como separador de miles), lo que sirve como marcador de
# inicio de fila para reagrupar las columnas.
PATRON_RUT_PRESTADOR_LINEA = re.compile(r"^\d{1,3}(?:[.,]\d{3}){1,3}-[\dkK]$", re.IGNORECASE)
PATRON_ENTERO_CORTO = re.compile(r"^\d{1,3}$")
PATRON_CODIGO_SOLO = re.compile(r"^\d{4,8}$")
PATRON_MONTO_SOLO = re.compile(r"^-?\d{1,3}(?:\.\d{3})*$")
FLAGS_IGNORADOS = {"n", "s", "ac"}
ENCABEZADOS_DE_SECCION = ("total", "resumen", "detalle", "reembolsos", "bonos", "financiamiento")

ISAPRES_CONOCIDAS = [
    "banmédica",
    "banmedica",
    "colmena",
    "consalud",
    "cruz blanca",
    "cruzblanca",
    "vida tres",
    "nueva masvida",
    "fonasa",
]

CAMPOS_GLOBALES_PATRONES = {
    "numero_cuenta": re.compile(
        r"(?:n[uú]mero\s+de\s+cuenta|n[°º]\s*cuenta|folio)\s*[:#]?\s*([^\n]+)", re.IGNORECASE
    ),
    "afiliado": re.compile(r"(?:afiliado|paciente|beneficiario)\s*[:#]?\s*([^\n]+)", re.IGNORECASE),
    "prestador": re.compile(
        r"(?:prestador|cl[ií]nica|hospital|centro m[eé]dico)\s*[:#]?\s*([^\n]+)",
        re.IGNORECASE,
    ),
    "diagnostico": re.compile(r"(?:diagn[oó]stico)\s*[:#]?\s*([^\n]+)", re.IGNORECASE),
}

# Líneas de encabezado (RUT, número de cuenta, fecha, etc.) deben excluirse de la
# extracción de ítems por texto libre: sus valores (ej. un RUT con puntos, o un
# número de cuenta) pueden calzar accidentalmente con el patrón de montos y
# generar "ítems fantasma" con cifras que no corresponden a ninguna prestación.
PATRON_LINEA_ENCABEZADO = re.compile(
    r"^\s*(?:n[uú]mero\s+de\s+cuenta|n[°º]\s*cuenta|folio|afiliado|paciente|beneficiario|"
    r"prestador|cl[ií]nica|hospital|centro m[eé]dico|diagn[oó]stico|rut|isapre|"
    r"fecha(?:\s+de\s+emisi[oó]n)?)\s*[:#]",
    re.IGNORECASE,
)

SINONIMOS_COLUMNAS = {
    "codigo_prestacion": ["codigo", "código", "cod prestacion", "cod. prestación", "arancel"],
    "descripcion": [
        "descripcion",
        "descripción",
        "prestacion",
        "prestación",
        "detalle",
        "glosa prestacion",
    ],
    "cantidad": ["cantidad", "cant", "n° veces", "nro veces"],
    "valor_cobrado": [
        "valor cobrado",
        "monto cobrado",
        "valor prestacion",
        "precio",
        "valor total prestacion",
    ],
    "valor_bonificado": ["valor bonificado", "bonificacion", "bonificación", "monto bonificado"],
    "copago": ["copago", "co-pago"],
    "monto_no_cubierto": ["no cubierto", "no bonificado", "excedente", "monto no cubierto"],
    "deducible": ["deducible"],
    "total": ["total"],
    "glosa": ["glosa", "observacion", "observación", "causal"],
}

CAMPOS_MONTO = {
    "valor_cobrado",
    "valor_bonificado",
    "copago",
    "monto_no_cubierto",
    "deducible",
    "total",
}


def extraer_rut_global(texto: str) -> tuple[str | None, str]:
    for coincidencia in PATRON_RUT.findall(texto):
        normalizado = normalizar_rut(coincidencia)
        if normalizado:
            return normalizado, "medio"
    return None, "bajo"


def extraer_isapre(texto: str) -> tuple[str | None, str]:
    texto_lower = texto.lower()
    for nombre in ISAPRES_CONOCIDAS:
        if nombre in texto_lower:
            return nombre.title(), "alto"
    return None, "bajo"


def extraer_campos_globales(texto: str) -> dict:
    campos: dict = {}
    confianza: dict = {}

    for campo, patron in CAMPOS_GLOBALES_PATRONES.items():
        coincidencia = patron.search(texto)
        if coincidencia:
            campos[campo] = coincidencia.group(1).strip()
            confianza[campo] = "medio"
        else:
            campos[campo] = None
            confianza[campo] = "bajo"

    rut, conf_rut = extraer_rut_global(texto)
    campos["rut"] = rut
    confianza["rut"] = conf_rut

    isapre, conf_isapre = extraer_isapre(texto)
    campos["isapre"] = isapre
    confianza["isapre"] = conf_isapre

    fecha_match = PATRON_FECHA.search(texto)
    campos["fecha"] = fecha_match.group(0) if fecha_match else None
    confianza["fecha"] = "medio" if fecha_match else "bajo"

    return {"campos": campos, "confianza": confianza}


def extraer_items_desde_texto(texto: str, metodo: str, pagina: int | None = None) -> list[dict]:
    """Extrae ítems línea por línea desde texto libre (PDF con texto u OCR).

    Heurística: una línea con al menos un monto en formato chileno y contenido
    textual previo se interpreta como una fila de prestación. Los montos
    encontrados se ordenan de mayor a menor y se asignan posicionalmente a
    cobrado / bonificado / copago, que es el orden más habitual en cuentas
    e isapres chilenas. Requiere validación manual.

    ``pagina``, si se indica, se guarda en cada ítem como ``pagina_origen``
    para trazabilidad en la pantalla de revisión manual y el informe interno.
    """
    confianza_base = "bajo" if "ocr" in metodo else "medio"
    items = []

    for linea in texto.splitlines():
        linea = linea.strip()
        if len(linea) < 8:
            continue
        if PATRON_LINEA_ENCABEZADO.match(linea):
            continue

        montos_texto = PATRON_MONTO.findall(linea)
        if not montos_texto:
            continue

        montos_valores = [v for v in (parsear_monto(m) for m in montos_texto) if v is not None]
        if not montos_valores:
            continue

        codigo_match = re.match(r"^\s*(\d{4,8})\b", linea)
        codigo = codigo_match.group(1) if codigo_match else None

        primer_monto_idx = linea.find(montos_texto[0])
        descripcion = linea[:primer_monto_idx].strip()
        if codigo:
            descripcion = descripcion[len(codigo) :].strip(" -:")
        if not descripcion:
            continue

        montos_ordenados = sorted(montos_valores, reverse=True)
        valor_cobrado = montos_ordenados[0] if len(montos_ordenados) >= 1 else None
        valor_bonificado = montos_ordenados[1] if len(montos_ordenados) >= 2 else None
        copago = montos_ordenados[2] if len(montos_ordenados) >= 3 else None

        items.append(
            {
                "codigo_prestacion": codigo,
                "descripcion": descripcion,
                "valor_cobrado": valor_cobrado,
                "valor_bonificado": valor_bonificado,
                "copago": copago,
                "pagina_origen": pagina,
                "confianza": {
                    "codigo_prestacion": "medio" if codigo else "bajo",
                    "descripcion": confianza_base,
                    "valor_cobrado": confianza_base,
                    "valor_bonificado": confianza_base if valor_bonificado is not None else "bajo",
                    "copago": confianza_base if copago is not None else "bajo",
                },
            }
        )

    return items


def _interpretar_grupo_columnar(lineas_grupo: list[str], pagina: int | None) -> dict | None:
    """Interpreta las líneas de una fila reagrupada por RUT de prestador.

    Clasifica cada línea por su forma (no por posición fija), porque las
    celdas vacías del PDF de origen no dejan línea alguna: la cantidad de
    columnas presentes varía de una sección a otra de la misma liquidación
    (ej. "DETALLE INSUMOS" solo trae un monto, "DETALLE HOSPITALIZACIÓN"
    trae tres).
    """
    descripcion = None
    cantidad = None
    codigo = None
    montos: list[float] = []
    glosa = None

    for linea in lineas_grupo:
        if not linea:
            continue
        minuscula = linea.lower()
        if minuscula in FLAGS_IGNORADOS:
            continue
        if codigo is None and cantidad is None and PATRON_ENTERO_CORTO.match(linea):
            cantidad = float(linea)
            continue
        if codigo is None and PATRON_CODIGO_SOLO.match(linea):
            codigo = linea
            continue
        if PATRON_MONTO_SOLO.match(linea):
            valor = parsear_monto(linea)
            if valor is not None:
                montos.append(valor)
            continue
        if descripcion is None:
            descripcion = linea
        else:
            # Texto no numérico adicional (ej. "PRESTACION SIN CODIGO EN
            # ARANCEL...") corresponde a la causal/motivo, no a la descripción.
            glosa = linea if glosa is None else f"{glosa} {linea}"

    if not descripcion:
        return None

    valor_cobrado = montos[0] if len(montos) >= 1 else None
    valor_bonificado = montos[1] if len(montos) >= 2 else None
    copago = montos[2] if len(montos) >= 3 else None

    return {
        "codigo_prestacion": codigo,
        "descripcion": descripcion,
        "cantidad": cantidad,
        "valor_cobrado": valor_cobrado,
        "valor_bonificado": valor_bonificado,
        "copago": copago,
        "glosa": glosa,
        "pagina_origen": pagina,
        "confianza": {
            "codigo_prestacion": "medio" if codigo else "bajo",
            "descripcion": "medio",
            "valor_cobrado": "medio" if valor_cobrado is not None else "bajo",
            "valor_bonificado": "medio" if valor_bonificado is not None else "bajo",
            "copago": "medio" if copago is not None else "bajo",
        },
    }


def extraer_items_columnar_por_prestador(texto: str, pagina: int | None = None) -> list[dict]:
    """Extrae ítems de liquidaciones donde cada columna quedó en su propia línea.

    Reagrupa las líneas usando el RUT del prestador (formato "92,051,000-0")
    como marcador de inicio de cada fila de prestación, hasta el siguiente RUT
    de prestador o hasta un encabezado de sección (TOTAL, RESUMEN, DETALLE,
    REEMBOLSOS, BONOS, FINANCIAMIENTO). Si el texto no tiene este patrón (ej.
    los documentos ficticios de muestra, donde cada prestación ya viene en una
    sola línea), devuelve una lista vacía y el llamador debe recurrir a
    ``extraer_items_desde_texto``.
    """
    lineas = [linea.strip() for linea in texto.splitlines()]
    items: list[dict] = []
    i = 0
    n = len(lineas)
    while i < n:
        if PATRON_RUT_PRESTADOR_LINEA.match(lineas[i]):
            grupo = []
            j = i + 1
            while j < n:
                candidata = lineas[j]
                if not candidata:
                    j += 1
                    continue
                if PATRON_RUT_PRESTADOR_LINEA.match(candidata):
                    break
                if candidata.lower().startswith(ENCABEZADOS_DE_SECCION):
                    break
                grupo.append(candidata)
                j += 1
            item = _interpretar_grupo_columnar(grupo, pagina)
            if item:
                items.append(item)
            i = j
        else:
            i += 1
    return items


PATRON_CODIGO_PUNTEADO = re.compile(r"^\d{2}\.\d{2}\.\d{3}$")
PALABRAS_MOTIVO_SIN_ARANCEL = {"NO", "ARANCELADO", "USO", "PERSONAL"}


def _monto_con_coma_completo(valor: str) -> bool:
    partes = valor.split(",")
    return len(partes) == 1 or len(partes[-1]) == 3


def _parsear_monto_con_coma(valor: str) -> float:
    return float(valor.replace(",", ""))


def _leer_monto_con_cola(principal: list[str], idx: int, cola: list[str]) -> tuple[str | None, int]:
    """Lee un valor "$ N,NNN,NNN" que puede venir cortado por un salto de línea.

    Cuando el fragmento que completa el monto no aparece inmediatamente
    después del '$' en ``principal`` (porque el PDF lo imprimió en otra
    línea), se toma de ``cola`` — los tokens que quedaron después del cierre
    natural de la fila (ver ``_dividir_principal_cola``), en el mismo orden
    en que aparecieron en el documento.
    """
    if idx >= len(principal) or principal[idx] != "$":
        return None, idx
    idx += 1
    if idx < len(principal) and re.match(r"^[\d,]+$", principal[idx]):
        valor = principal[idx]
        idx += 1
    elif cola:
        valor = cola.pop(0)
    else:
        return None, idx
    while not _monto_con_coma_completo(valor):
        if idx < len(principal) and re.match(r"^\d+$", principal[idx]):
            valor += principal[idx]
            idx += 1
        elif cola and re.match(r"^\d+$", cola[0]):
            valor += cola.pop(0)
        else:
            break
    return valor, idx


def _dividir_principal_cola(fila: list[str]) -> tuple[list[str], list[str]]:
    """Separa una fila en su contenido principal y la "cola" de fragmentos.

    El literal ``'Bono'`` + número de bono + bandera (NO/SI) marca el cierre
    natural de una fila codificada; cualquier token que haya quedado después
    de eso al fusionar quiebres de línea (ver
    ``pdf_text._filas_pagina_por_coordenadas``) es un fragmento de un monto o
    porcentaje que no alcanzó a completarse antes del cierre.
    """
    try:
        i_bono = fila.index("Bono")
    except ValueError:
        return fila, []
    fin = i_bono + 3
    if fin > len(fila):
        return fila, []
    return fila[:fin], fila[fin:]


def _parsear_fila_codificada(fila: list[str], pagina: int | None) -> dict | None:
    principal, cola = _dividir_principal_cola(fila)
    idx = 0
    if len(principal) < 5:
        return None
    cantidad = principal[idx]
    idx += 1
    codigo = principal[idx]
    idx += 1
    idx += 1  # código/grupo auxiliar, no se usa
    descripcion_tokens = []
    while idx < len(principal) and not re.match(r"^\d+$", principal[idx]):
        descripcion_tokens.append(principal[idx])
        idx += 1
    if idx >= len(principal) or not descripcion_tokens:
        return None
    descripcion = " ".join(descripcion_tokens)
    idx += 1  # segundo auxiliar (grupo/edad), no se usa

    valor_prestacion, idx = _leer_monto_con_cola(principal, idx, cola)
    _duplicado, idx = _leer_monto_con_cola(principal, idx, cola)
    bonificado, idx = _leer_monto_con_cola(principal, idx, cola)
    if valor_prestacion is None or bonificado is None:
        return None

    cobrado = _parsear_monto_con_coma(valor_prestacion)
    valor_bonificado = _parsear_monto_con_coma(bonificado)
    return {
        "codigo_prestacion": codigo,
        "descripcion": descripcion,
        "cantidad": float(cantidad) if cantidad.isdigit() else None,
        "valor_cobrado": cobrado,
        "valor_bonificado": valor_bonificado,
        "monto_no_cubierto": round(cobrado - valor_bonificado, 2),
        "pagina_origen": pagina,
        "confianza": {
            "codigo_prestacion": "alto",
            "descripcion": "medio",
            "valor_cobrado": "medio",
            "valor_bonificado": "medio",
        },
    }


def _parsear_fila_sin_arancel(fila: list[str], pagina: int | None) -> dict | None:
    idx = 0
    if len(fila) < 3:
        return None
    cantidad = fila[idx]
    idx += 1
    descripcion_tokens = []
    while idx < len(fila) and fila[idx] != "$":
        descripcion_tokens.append(fila[idx])
        idx += 1
    if idx >= len(fila) or not descripcion_tokens:
        return None
    descripcion = " ".join(descripcion_tokens)
    valor, idx = _leer_monto_con_cola(fila, idx, [])
    if valor is None:
        return None
    motivo = [t for t in fila[idx:] if t.upper() in PALABRAS_MOTIVO_SIN_ARANCEL]
    cobrado = _parsear_monto_con_coma(valor)
    return {
        "codigo_prestacion": None,
        "descripcion": descripcion,
        "cantidad": float(cantidad) if cantidad.isdigit() else None,
        "valor_cobrado": cobrado,
        "valor_bonificado": 0.0,
        "monto_no_cubierto": cobrado,
        "glosa": " ".join(motivo) or None,
        "pagina_origen": pagina,
        "confianza": {
            "codigo_prestacion": "bajo",
            "descripcion": "medio",
            "valor_cobrado": "medio",
        },
    }


def extraer_items_filas_coordenadas(filas: list[list[str]], pagina: int | None = None) -> list[dict]:
    """Extrae ítems de filas ya reconstruidas por coordenada (ver ``pdf_text``).

    Reconoce dos formas de fila en liquidaciones reales con código de
    prestación puntuado (ej. Cruz Blanca, "17.03.006"):

    - Codificada: cantidad, código, descripción, y una serie de montos
      (valor prestación, bonificación, deducible/copago...). Solo se extraen
      con confianza los tres primeros montos (valor cobrado y bonificado);
      el resto de las columnas (deducible aplicado, copago, reembolso) no se
      informan porque su atribución exacta cuando el ítem tiene bonificación
      parcial no se pudo determinar de forma confiable — mejor omitir un
      dato que informar un monto de copago o deducible potencialmente
      equivocado en un documento de uso legal.
    - Sin arancel: cantidad, descripción, un único monto, y la causal ("NO
      ARANCELADO", "USO PERSONAL"). No tienen código de prestación.

    Si ninguna fila calza con estos patrones (ej. liquidaciones con el
    formato simple de una prestación por línea, como las de muestra), se
    devuelve una lista vacía y el llamador recurre a otra heurística.
    """
    items = []
    for fila in filas:
        if len(fila) < 2:
            continue
        if re.match(r"^\d{1,3}$", fila[0]) and PATRON_CODIGO_PUNTEADO.match(fila[1]):
            item = _parsear_fila_codificada(fila, pagina)
        elif (
            re.match(r"^\d{1,3}$", fila[0])
            and "$" in fila
            and not re.match(r"^[\d.,%$-]+$", fila[1])
        ):
            item = _parsear_fila_sin_arancel(fila, pagina)
        else:
            item = None
        if item:
            items.append(item)
    return items


def mapear_encabezados(encabezados: list[str]) -> dict[int, str]:
    mapeo = {}
    for idx, encabezado in enumerate(encabezados):
        normalizado = (encabezado or "").strip().lower()
        for campo, sinonimos in SINONIMOS_COLUMNAS.items():
            if normalizado in sinonimos or any(sinonimo in normalizado for sinonimo in sinonimos):
                mapeo[idx] = campo
                break
    return mapeo


def extraer_items_desde_tabla(filas: list[list[str]]) -> list[dict]:
    """Extrae ítems desde una tabla (DOCX o fila de encabezado + filas de datos)."""
    if not filas or len(filas) < 2:
        return []

    mapeo = mapear_encabezados(filas[0])
    if not mapeo:
        return []

    items = []
    for fila in filas[1:]:
        item: dict = {"confianza": {}}
        tiene_datos = False
        for idx, valor_celda in enumerate(fila):
            campo = mapeo.get(idx)
            if not campo:
                continue
            valor_celda = (valor_celda or "").strip()
            if not valor_celda:
                continue
            tiene_datos = True
            if campo in CAMPOS_MONTO:
                item[campo] = parsear_monto(valor_celda)
            elif campo == "cantidad":
                try:
                    item[campo] = float(valor_celda.replace(",", "."))
                except ValueError:
                    item[campo] = None
            else:
                item[campo] = valor_celda
            item["confianza"][campo] = "alto"
        if tiene_datos:
            items.append(item)

    return items


def extraer_items_desde_dataframe(df) -> list[dict]:
    filas = [[str(c) for c in df.columns]]
    for _, fila in df.iterrows():
        filas.append(["" if v is None or (isinstance(v, float) and v != v) else str(v) for v in fila.tolist()])
    return extraer_items_desde_tabla(filas)
