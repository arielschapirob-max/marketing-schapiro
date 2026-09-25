"""Extracción de tablas desde planillas XLSX, usando pandas/openpyxl."""

import pandas as pd


def extraer_tablas_xlsx(ruta: str) -> dict:
    """Retorna un diccionario {nombre_hoja: DataFrame} con todas las hojas del libro."""
    return pd.read_excel(ruta, sheet_name=None, dtype=str, engine="openpyxl")
