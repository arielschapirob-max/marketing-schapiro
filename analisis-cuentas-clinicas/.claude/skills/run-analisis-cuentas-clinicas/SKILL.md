---
name: run-analisis-cuentas-clinicas
description: Build, run, test, and screenshot the analisis-cuentas-clinicas Streamlit app end-to-end. Use when asked to start the app, run its dev server, open a preview, take a screenshot, run its tests, or do a controlled smoke test with fictitious data.
---

Streamlit app driven by `.claude/skills/run-analisis-cuentas-clinicas/driver.py`
(Playwright directo contra el Chromium preinstalado del contenedor — este
entorno no tiene `chromium-cli`). El driver asume que el servidor ya está
corriendo en `http://localhost:8501`.

Todas las rutas de abajo son relativas a `analisis-cuentas-clinicas/`
(la raíz de este proyecto dentro del repo `marketing-schapiro`).

## Prerrequisitos

```bash
sudo apt-get update
sudo apt-get install -y tesseract-ocr tesseract-ocr-spa poppler-utils
```

(`apt-get update` es necesario primero — sin él el mirror puede dar 404
en este contenedor. `tesseract-ocr-spa` y `poppler-utils` son requeridos
para el flujo OCR de documentos escaneados.)

Python: el proyecto ya trae `.venv/` en desarrollo normal. Si no existe:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Setup / verificación de dependencias

```bash
source .venv/bin/activate
pip check
python -c "import streamlit; print(streamlit.__version__)"   # -> 1.64.0 verificado en este contenedor
```

Variables de entorno (opcionales, `.env` en la raíz del proyecto, leídas
por `app/config.py` vía `python-dotenv`): `DATABASE_URL`, `OUTPUT_DIRECTORY`,
`TESSERACT_CMD`, `TESSERACT_LANG`, `POPPLER_PATH`, `MAX_FILE_SIZE_MB`,
`ENABLE_EXTERNAL_AI`, `CURRENT_USER`. Sin `.env` la app usa defaults
sensatos (SQLite en `storage/casos.db`, salida en `output/`) — no hace
falta crear uno para correr o probar la app.

## Run (agent path)

Levantar el servidor en background y esperar a que responda:

```bash
source .venv/bin/activate
nohup streamlit run app.py --server.headless true --server.port 8501 \
  --browser.gatherUsageStats false > /tmp/streamlit_acc.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:8501/_stcore/health >/dev/null; do sleep 1; done' && echo "SERVER UP"
```

Con el servidor arriba, correr el driver (genera datos ficticios en
`samples/` si no existen, recorre el flujo completo de la app real, y
deja capturas numeradas):

```bash
source .venv/bin/activate
python .claude/skills/run-analisis-cuentas-clinicas/driver.py
```

Capturas -> `/tmp/acc_shots/01_inicio.png` ... `15_propuesta_generada.png`
(override con `ACC_SHOT_DIR=/otra/ruta`). Log del servidor -> `/tmp/streamlit_acc.log`.

El driver recorre: Inicio (crear caso) -> Cargar Caso (sube
`samples/cuenta_clinica_ficticia.pdf` + `samples/liquidacion_isapre_ficticia.xlsx`,
asigna tipo de documento a cada uno, procesa) -> Revisión Manual (aprueba
la revisión del abogado — paso obligatorio) -> Hallazgos (analiza, luego
triá cada hallazgo a "aprobado") -> Informes (genera informe interno,
confirma que la propuesta comercial está bloqueada antes de triar, y
generada/habilitada después). Imprime por consola el estado real
`disabled` de ambos botones de bloqueo en los dos momentos clave.

Detener el servidor:

```bash
lsof -ti:8501 -sTCP:LISTEN | xargs -r kill
```

**Nunca borrar `storage/casos.db` con el servidor corriendo** — el
archivo queda abierto por el proceso y el siguiente intento de escritura
falla con `sqlalchemy.exc.OperationalError: attempt to write a readonly
database`. Si necesitás reiniciar en limpio: matar el proceso primero,
después `rm -rf storage output`, después relanzar.

Este contenedor no expone port-forward al usuario, así que "vista
previa" = las capturas del driver, enviadas al usuario como archivo.

## Run (human path)

```bash
source .venv/bin/activate
streamlit run app.py
```

Abre `http://localhost:8501` en el navegador. `Ctrl+C` para detener.

## Test

```bash
source .venv/bin/activate
python -m pytest -q
```

44 tests, todos deben pasar (`44 passed`). `tests/conftest.py` aísla la
base de datos y el directorio de salida en un `tempfile.mkdtemp()` vía
`os.environ.setdefault(...)` antes de importar `app.config`, así que
correr los tests nunca toca `storage/`/`output/` del proyecto real.

Dos suites son críticas de negocio y deben correr siempre, no solo
"pytest en general":

- **`tests/test_ui_gating.py`** — verifica con `streamlit.testing.v1.AppTest`
  (sin navegador) que el botón "Analizar y generar hallazgos" esté
  `disabled=True` hasta aprobar la revisión manual, y que "Generar
  propuesta comercial" esté `disabled=True` hasta que **todos** los
  hallazgos del caso estén triados (`estado != "pendiente"`).
- **`tests/test_commercial_proposal_no_leak.py`** — genera una propuesta
  comercial (DOCX + PDF) de prueba y verifica que el texto NO contenga
  ninguno de una lista explícita de términos prohibidos: códigos de
  prestación, referencias a artículos de ley, jurisprudencia ("corte
  suprema", "superintendencia de salud"), nombres de glosas/hallazgos
  internos, estrategia procesal ("demanda arbitral", "recurso de
  reposición"), ni montos/ítems específicos. Correr esta suite es el
  chequeo automatizado de que la separación informe interno / propuesta
  externa se mantiene — no basta con correr la app visualmente.

Ejecutar solo esas dos suites rápido:

```bash
python -m pytest -q tests/test_ui_gating.py tests/test_commercial_proposal_no_leak.py
```

## Prueba controlada mínima (datos ficticios)

1. Nunca usar datos reales de clientes para probar — solo los ficticios
   generados por el script:
   ```bash
   python scripts/generar_datos_muestra.py
   ```
   Deja archivos en `samples/` (incluye `cuenta_clinica_ficticia.pdf`,
   `liquidacion_isapre_ficticia.xlsx`, y variantes DOCX/PNG/escaneada
   para probar rutas OCR).
2. Servidor arriba (sección "Run (agent path)").
3. En la UI: Inicio -> nombre de caso + aceptar consentimiento -> Crear caso.
4. Cargar Caso -> subir `cuenta_clinica_ficticia.pdf` y
   `liquidacion_isapre_ficticia.xlsx` -> asignar tipo de documento a cada
   uno ("Cuenta clínica" / "Liquidación de isapre") -> Procesar documentos.
5. Revisión Manual -> revisar campos extraídos (documento/página/confianza)
   -> "Aprobar revisión del abogado para este caso" (obligatorio; sin esto
   el análisis queda bloqueado).
6. Hallazgos -> "Analizar y generar hallazgos" -> triar cada hallazgo
   (aprobado / descartado / requiere_antecedentes).
7. Informes -> "Generar informe interno (DOCX + XLSX)" (siempre
   disponible tras el análisis) -> pestaña "Propuesta comercial":
   bloqueada hasta que el paso 6 esté 100% triado, luego "Generar
   propuesta comercial (DOCX + PDF)".

El driver de este skill automatiza exactamente estos 7 pasos.

## Gotchas

- **`selects.nth(0)` en la página de Hallazgos no es un selectbox de
  estado** — es el selector "Seleccione el caso". El loop de triage debe
  arrancar en índice 1, no 0 (`for i in range(1, n_estados)`).
- **`st.rerun()` tras cada cambio de estado de hallazgo** — `views/hallazgos.py`
  llama `st.rerun()` en cada cambio, así que un `wait_for_timeout` fijo no
  alcanza entre clicks del triage; hace falta
  `page.wait_for_load_state("networkidle", timeout=15000)` después de
  cada selección de opción, o los siguientes clicks fallan por timeout.
- **Borrar `storage/casos.db` con el servidor vivo corrompe la conexión**
  (readonly database) — siempre matar el proceso en el puerto 8501 antes
  de tocar `storage/`.
- **No hay `chromium-cli` en este contenedor** — el driver usa la API
  sync de Playwright directo contra `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`
  con `args=["--no-sandbox"]`.

## Troubleshooting

- **`sqlalchemy.exc.OperationalError: attempt to write a readonly database`**:
  el archivo `storage/casos.db` fue borrado o movido mientras el servidor
  aún lo tenía abierto. Matar el proceso (`lsof -ti:8501 -sTCP:LISTEN | xargs -r kill`),
  esperar, recién ahí `rm -rf storage output`, y relanzar.
- **`TimeoutError` esperando `get_by_role("option", name="aprobado")`
  en el loop de triage**: revisar que el loop arranque en índice 1 (ver
  Gotchas) y que haya `wait_for_load_state("networkidle")` tras cada click.
- **`curl: (7) Failed to connect`** en el poll de salud: el servidor no
  llegó a levantar — revisar `/tmp/streamlit_acc.log` para el traceback
  real (típicamente puerto ya ocupado, o falta una dependencia de
  `requirements.txt`).
