"""Orquesta extracción + estructuración de campos para un documento cargado."""

from app.extraction import field_extraction as fe
from app.extraction.dispatcher import extraer_documento
from app.extraction.document_types import TIPOS_CON_ITEMS
from app.schemas.item import ItemExtraido

CAMPOS_GLOBALES_VACIOS = {"campos": {}, "confianza": {}}

METODOS_POR_PAGINA = {"pdf_texto", "pdf_ocr", "imagen_ocr"}


def _validar_items(items_crudos: list[dict]) -> list[dict]:
    items_validados = []
    for item_dict in items_crudos:
        confianza = item_dict.pop("confianza", {})
        try:
            validado = ItemExtraido(**item_dict, confianza=confianza)
        except Exception:
            continue
        data = validado.model_dump(exclude={"confianza"})
        data["confianza"] = validado.confianza
        items_validados.append(data)
    return items_validados


def procesar_documento(ruta: str, tipo_documento: str = "cuenta_clinica") -> dict:
    """Extrae texto/tablas y, si ``tipo_documento`` corresponde a un documento
    con ítems (cuenta clínica o liquidación de isapre), estructura los ítems.

    Para otros tipos de documento (carta de rechazo, plan de salud,
    antecedentes médicos, otro) solo se extrae texto y campos globales de
    referencia: no tiene sentido aplicar la heurística de ítems —que espera
    líneas con montos cobrado/bonificado/copago— sobre un documento que no es
    una cuenta, y hacerlo arriesga generar ítems espurios.
    """
    extraido = extraer_documento(ruta)
    items_crudos: list[dict] = []
    campos_globales = dict(CAMPOS_GLOBALES_VACIOS)
    extrae_items = tipo_documento in TIPOS_CON_ITEMS

    if extraido["metodo"] == "xlsx":
        if extrae_items:
            for _nombre_hoja, df in extraido["hojas"].items():
                items_crudos.extend(fe.extraer_items_desde_dataframe(df))
    elif extraido["metodo"] == "docx":
        if extrae_items:
            for tabla in extraido["tablas"]:
                items_crudos.extend(fe.extraer_items_desde_tabla(tabla))
        campos_globales = fe.extraer_campos_globales(extraido["texto"])
    else:
        campos_globales = fe.extraer_campos_globales(extraido["texto"])
        if extrae_items:
            if extraido["metodo"] in METODOS_POR_PAGINA and extraido["paginas"]:
                for num_pagina, texto_pagina in enumerate(extraido["paginas"], start=1):
                    items_pagina = fe.extraer_items_columnar_por_prestador(texto_pagina, num_pagina)
                    if not items_pagina:
                        items_pagina = fe.extraer_items_desde_texto(texto_pagina, extraido["metodo"], num_pagina)
                    items_crudos.extend(items_pagina)
            else:
                items_texto = fe.extraer_items_columnar_por_prestador(extraido["texto"])
                if not items_texto:
                    items_texto = fe.extraer_items_desde_texto(extraido["texto"], extraido["metodo"])
                items_crudos.extend(items_texto)

    if extrae_items and not items_crudos and any(campos_globales.get("campos", {}).values()):
        items_crudos = [{"confianza": {}}]

    return {
        "texto_extraido": extraido.get("texto", ""),
        "metodo_extraccion": extraido["metodo"],
        "campos_globales": campos_globales,
        "items": _validar_items(items_crudos),
    }
