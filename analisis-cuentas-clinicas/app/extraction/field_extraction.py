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
