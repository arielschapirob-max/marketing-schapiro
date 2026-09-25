"""Genera documentos ficticios de prueba para analisis-cuentas-clinicas.

Los datos aquí contenidos son inventados y no corresponden a personas,
cuentas ni isapres reales. Uso exclusivo para pruebas locales de la
aplicación (extracción, revisión manual, hallazgos e informes).

Ejecutar desde la raíz del proyecto:
    python scripts/generar_datos_muestra.py
"""

from pathlib import Path

import docx
import openpyxl
import pymupdf
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

DESTINO = Path(__file__).resolve().parent.parent / "samples"
DESTINO.mkdir(parents=True, exist_ok=True)

ENCABEZADO_MUESTRA = [
    "Fecha de emisión: 15-03-2026",
    "Afiliado: Paciente de Prueba Ficticio Dos",
    "RUT: 22.222.222-2",
    "Isapre: Isapre Consalud",
    "Prestador: Hospital Clínico Ejemplo",
    "Número de cuenta: CTA-2026-0099",
    "Diagnóstico: Síndrome coronario agudo, diagnóstico ficticio de prueba",
]
ITEMS_MUESTRA = [
    "220305 Stent coronario liberador de fármaco $3.200.000 $1.800.000 $1.400.000",
    "340210 Insumo clínico no bonificable, valor cobrado $850.000, sin cobertura",
    "110101 Consulta médica especialidad $45.000 $45.000",
]


def generar_xlsx_muestra() -> Path:
    wb = openpyxl.Workbook()
    hoja = wb.active
    hoja.title = "Liquidacion"
    hoja.append(
        [
            "Código",
            "Descripción",
            "Cantidad",
            "Valor cobrado",
            "Valor bonificado",
            "Copago",
            "Glosa",
        ]
    )
    hoja.append(
        [
            "110101",
            "Consulta médica especialidad",
            1,
            45000,
            30000,
            15000,
            "Bonificación según plan",
        ]
    )
    hoja.append(["220305", "Stent coronario liberador de fármaco", 1, 3200000, 0, 3200000, "No corresponde"])
    hoja.append(["330501", "Día cama UCI adulto", 3, 1800000, 1200000, 600000, "Bonificación parcial"])
    hoja.append(["440102", "Examen de laboratorio general", 2, 25000, 25000, 0, "Bonificación 100%"])
    hoja.append(["440102", "Examen de laboratorio general", 2, 25000, 25000, 0, "Bonificación 100%"])
    ruta = DESTINO / "liquidacion_isapre_ficticia.xlsx"
    wb.save(ruta)
    return ruta


def generar_docx_muestra() -> Path:
    documento = docx.Document()
    documento.add_heading("Cuenta Clínica (documento ficticio de prueba)", level=1)
    documento.add_paragraph("Afiliado: Paciente de Prueba Ficticio")
    documento.add_paragraph("RUT: 11.111.111-1")
    documento.add_paragraph("Isapre: Isapre Ejemplo")
    documento.add_paragraph("Prestador: Clínica Ejemplo S.A.")
    documento.add_paragraph("Número de cuenta: CTA-2026-0001")
    documento.add_paragraph("Diagnóstico: Diagnóstico ficticio de prueba")

    tabla = documento.add_table(rows=1, cols=5)
    encabezados = ["Código", "Descripción", "Valor cobrado", "Valor bonificado", "Copago"]
    for celda, texto in zip(tabla.rows[0].cells, encabezados):
        celda.text = texto
    filas_muestra = [
        ["220305", "Stent coronario liberador de fármaco", "3.200.000", "0", "3.200.000"],
        ["330501", "Día cama UCI adulto", "1.800.000", "1.200.000", "600.000"],
    ]
    for fila_datos in filas_muestra:
        fila = tabla.add_row().cells
        for celda, valor in zip(fila, fila_datos):
            celda.text = valor

    ruta = DESTINO / "cuenta_clinica_ficticia.docx"
    documento.save(ruta)
    return ruta


def generar_pdf_muestra() -> Path:
    """Genera una cuenta clínica ficticia en PDF con texto real (no escaneado).

    Incluye un ítem con cobertura parcial (stent coronario, para ejercitar la
    regla de dispositivos médicos), un ítem 100% no cubierto y un ítem con
    cobertura total, para probar de punta a punta la extracción desde texto
    libre (``app.extraction.field_extraction.extraer_items_desde_texto``).
    """
    ruta = DESTINO / "cuenta_clinica_ficticia.pdf"
    doc = SimpleDocTemplate(
        str(ruta), pagesize=LETTER, topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm
    )
    estilos = getSampleStyleSheet()
    normal = estilos["Normal"]
    titulo = estilos["Heading1"]

    elementos = [Paragraph("Cuenta Clínica (documento ficticio de prueba)", titulo)]
    for linea in ENCABEZADO_MUESTRA:
        elementos.append(Paragraph(linea, normal))
    elementos.append(Spacer(1, 0.4 * cm))
    for linea in ITEMS_MUESTRA:
        elementos.append(Paragraph(linea, normal))

    doc.build(elementos)
    return ruta


def _renderizar_imagen_cuenta() -> Image.Image:
    """Dibuja la misma cuenta clínica ficticia como imagen, para probar el
    camino de OCR (pytesseract) en vez de extracción de texto nativo.
    """
    ancho, alto = 1700, 2200  # aprox. carta a 200 DPI
    imagen = Image.new("RGB", (ancho, alto), "white")
    dibujo = ImageDraw.Draw(imagen)

    fuente_titulo = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
    fuente_texto = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)

    y = 80
    dibujo.text((80, y), "Cuenta Clínica (documento ficticio de prueba)", font=fuente_titulo, fill="black")
    y += 70
    for linea in ENCABEZADO_MUESTRA:
        dibujo.text((80, y), linea, font=fuente_texto, fill="black")
        y += 48
    y += 30
    for linea in ITEMS_MUESTRA:
        dibujo.text((80, y), linea, font=fuente_texto, fill="black")
        y += 48

    return imagen


def generar_imagen_muestra() -> Path:
    """Genera la cuenta clínica ficticia como imagen PNG (mismo contenido que
    el PDF con texto), para probar la extracción vía OCR con pytesseract.
    """
    ruta = DESTINO / "cuenta_clinica_ficticia.png"
    _renderizar_imagen_cuenta().save(ruta)
    return ruta


def generar_pdf_escaneado_muestra() -> Path:
    """Genera un PDF 'escaneado' (imagen incrustada, sin capa de texto),
    para probar la rama de OCR del extractor de PDF (a diferencia de
    generar_pdf_muestra, que produce un PDF con texto real).
    """
    ruta_imagen_temporal = DESTINO / "_temp_escaneo.png"
    _renderizar_imagen_cuenta().save(ruta_imagen_temporal)

    ruta = DESTINO / "cuenta_clinica_escaneada_ficticia.pdf"
    documento = pymupdf.open()
    pagina = documento.new_page(width=612, height=792)  # tamaño carta en puntos
    pagina.insert_image(pagina.rect, filename=str(ruta_imagen_temporal))
    documento.save(str(ruta))
    documento.close()
    ruta_imagen_temporal.unlink()
    return ruta


if __name__ == "__main__":
    rutas = [
        generar_xlsx_muestra(),
        generar_docx_muestra(),
        generar_pdf_muestra(),
        generar_imagen_muestra(),
        generar_pdf_escaneado_muestra(),
    ]
    for ruta in rutas:
        print(f"Generado: {ruta}")
    print("\nRecuerde: estos son datos ficticios de prueba. Nunca cargue datos reales en el repositorio.")
