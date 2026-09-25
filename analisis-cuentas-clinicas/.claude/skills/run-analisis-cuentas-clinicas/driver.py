"""Driver Playwright para levantar, recorrer y capturar la app real
(analisis-cuentas-clinicas) de punta a punta con datos 100% ficticios.

Requiere el servidor Streamlit ya corriendo en http://localhost:8501
(ver SKILL.md, sección "Run (agent path)").

Uso:
    python .claude/skills/run-analisis-cuentas-clinicas/driver.py

Capturas numeradas en SHOT_DIR (por defecto /tmp/acc_shots/).
No usa chromium-cli: este entorno no lo tiene instalado, así que se
maneja Playwright directo contra el Chromium preinstalado del
contenedor.
"""

import os
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

PROYECTO = Path(__file__).resolve().parent.parent.parent.parent
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE_URL = "http://localhost:8501"
SHOT_DIR = Path(os.environ.get("ACC_SHOT_DIR", "/tmp/acc_shots"))
SHOT_DIR.mkdir(parents=True, exist_ok=True)


def asegurar_datos_muestra():
    cuenta = PROYECTO / "samples" / "cuenta_clinica_ficticia.pdf"
    liquidacion = PROYECTO / "samples" / "liquidacion_isapre_ficticia.xlsx"
    if cuenta.exists() and liquidacion.exists():
        return
    print("Generando datos ficticios de muestra (samples/)...")
    subprocess.run(
        [sys.executable, str(PROYECTO / "scripts" / "generar_datos_muestra.py")],
        check=True,
        cwd=str(PROYECTO),
    )


def shot(page, nombre):
    ruta = SHOT_DIR / f"{nombre}.png"
    page.screenshot(path=str(ruta), full_page=True)
    print(f"  captura: {ruta}")


def click_selectbox_opcion(page, selectbox_locator, texto_opcion):
    selectbox_locator.scroll_into_view_if_needed()
    selectbox_locator.click()
    page.get_by_role("option", name=texto_opcion, exact=True).click()
    page.wait_for_load_state("networkidle", timeout=15000)


def main():
    asegurar_datos_muestra()

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1400, "height": 1000})

        print("1) Inicio")
        page.goto(BASE_URL, wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)
        shot(page, "01_inicio")

        print("2) Crear caso")
        inputs = page.locator('input[type="text"]')
        inputs.nth(0).fill("Vista Previa Demo (driver)")
        page.locator('input[type="checkbox"]').first.check(force=True)
        page.get_by_role("button", name="Crear caso").click()
        page.wait_for_timeout(2000)
        shot(page, "02_caso_creado")

        print("3) Cargar Caso: subir documentos")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(1).click()
        page.wait_for_timeout(1500)

        archivos = [
            str(PROYECTO / "samples" / "cuenta_clinica_ficticia.pdf"),
            str(PROYECTO / "samples" / "liquidacion_isapre_ficticia.xlsx"),
        ]
        page.locator('input[type="file"]').set_input_files(archivos)
        page.wait_for_timeout(1500)
        shot(page, "03_archivos_seleccionados")

        selects = page.locator('[data-testid="stSelectbox"]')
        n_selects = selects.count()
        print(f"  selectboxes de tipo de documento encontrados: {n_selects}")
        if n_selects >= 2:
            click_selectbox_opcion(page, selects.nth(1), "Cuenta clínica")
            page.wait_for_timeout(300)
            selects = page.locator('[data-testid="stSelectbox"]')
            click_selectbox_opcion(page, selects.nth(2), "Liquidación de isapre")
            page.wait_for_timeout(300)

        shot(page, "04_tipos_asignados")
        page.get_by_role("button", name="Procesar documentos").click()
        page.wait_for_timeout(4000)
        shot(page, "05_documentos_procesados")

        print("4) Revisión Manual")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(2).click()
        page.wait_for_timeout(2000)
        shot(page, "06_revision_manual")

        page.get_by_role("button", name="Aprobar revisión del abogado para este caso").click()
        page.wait_for_timeout(1500)
        shot(page, "07_revision_aprobada")

        print("5) Hallazgos")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(3).click()
        page.wait_for_timeout(1500)
        shot(page, "08_hallazgos_antes_de_analizar")

        boton_analizar = page.get_by_role("button", name="Analizar y generar hallazgos")
        print(f"  boton 'Analizar' deshabilitado?: {boton_analizar.is_disabled()}")
        boton_analizar.click()
        page.wait_for_timeout(2500)
        shot(page, "09_hallazgos_generados")

        print("6) Informes: informe interno")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(4).click()
        page.wait_for_timeout(1500)
        shot(page, "10_informes_tab_interno")
        page.get_by_role("button", name="Generar informe interno (DOCX + XLSX)").click()
        page.wait_for_timeout(2500)
        shot(page, "11_informe_interno_generado")

        print("7) Propuesta comercial ANTES de triar (debe estar bloqueada)")
        page.get_by_role("tab", name="Propuesta comercial").click()
        page.wait_for_timeout(1000)
        shot(page, "12_propuesta_bloqueada")
        boton_propuesta = page.get_by_role("button", name="Generar propuesta comercial (DOCX + PDF)")
        print(f"  boton 'Generar propuesta comercial' deshabilitado?: {boton_propuesta.is_disabled()}")

        print("8) Triar todos los hallazgos (aprobacion manual, uno por uno)")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(3).click()
        page.wait_for_timeout(1500)
        estado_selects = page.locator('[data-testid="stSelectbox"]')
        n_estados = estado_selects.count()
        print(f"  selectboxes de estado de hallazgo: {n_estados}")
        for i in range(1, n_estados):  # indice 0 = selector de caso, no de estado
            selects = page.locator('[data-testid="stSelectbox"]')
            click_selectbox_opcion(page, selects.nth(i), "aprobado")
            page.wait_for_timeout(600)
        shot(page, "13_hallazgos_triados")

        print("9) Propuesta comercial DESPUES de triar (debe estar habilitada)")
        links = page.locator('[data-testid="stSidebarNav"] a')
        links.nth(4).click()
        page.wait_for_timeout(1500)
        page.get_by_role("tab", name="Propuesta comercial").click()
        page.wait_for_timeout(1000)
        boton_propuesta = page.get_by_role("button", name="Generar propuesta comercial (DOCX + PDF)")
        print(f"  boton 'Generar propuesta comercial' deshabilitado tras triar?: {boton_propuesta.is_disabled()}")
        shot(page, "14_propuesta_desbloqueada")

        text_inputs = page.locator('[data-testid="stTextInput"] input')
        text_inputs.nth(0).fill("UF 15")
        checkbox_exito = page.locator('[data-testid="stCheckbox"] input').first
        checkbox_exito.check(force=True)
        page.wait_for_timeout(300)
        text_inputs = page.locator('[data-testid="stTextInput"] input')
        text_inputs.nth(1).fill("15% del beneficio económico obtenido")

        page.get_by_role("button", name="Generar propuesta comercial (DOCX + PDF)").click()
        page.wait_for_timeout(2500)
        shot(page, "15_propuesta_generada")

        browser.close()
        print(f"\nListo. {len(list(SHOT_DIR.glob('*.png')))} capturas en {SHOT_DIR}")


if __name__ == "__main__":
    main()
