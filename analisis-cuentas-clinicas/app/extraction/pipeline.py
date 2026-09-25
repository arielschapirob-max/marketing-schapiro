"""Orquesta extracción + estructuración de campos para un documento cargado."""

from app.extraction import field_extraction as fe
from app.extraction.dispatcher import extraer_documento
from app.schemas.item import ItemExtraido

CAMPOS_GLOBALES_VACIOS = {"campos": {}, "confianza": {}}


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


def procesar_documento(ruta: str) -> dict:
    extraido = extraer_documento(ruta)
    items_crudos: list[dict] = []
    campos_globales = dict(CAMPOS_GLOBALES_VACIOS)

    if extraido["metodo"] == "xlsx":
        for _nombre_hoja, df in extraido["hojas"].items():
            items_crudos.extend(fe.extraer_items_desde_dataframe(df))
    elif extraido["metodo"] == "docx":
        for tabla in extraido["tablas"]:
            items_crudos.extend(fe.extraer_items_desde_tabla(tabla))
        campos_globales = fe.extraer_campos_globales(extraido["texto"])
    else:
        campos_globales = fe.extraer_campos_globales(extraido["texto"])
        items_crudos.extend(fe.extraer_items_desde_texto(extraido["texto"], extraido["metodo"]))

    if not items_crudos and any(campos_globales.get("campos", {}).values()):
        items_crudos = [{"confianza": {}}]

    return {
        "texto_extraido": extraido.get("texto", ""),
        "metodo_extraccion": extraido["metodo"],
        "campos_globales": campos_globales,
        "items": _validar_items(items_crudos),
    }
