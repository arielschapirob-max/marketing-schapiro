# Análisis de Cuentas Clínicas

Aplicación local (Streamlit + SQLite) para apoyar el análisis jurídico-técnico de cuentas clínicas, liquidaciones de isapre y documentos complementarios. Extrae y estructura ítems, identifica **hallazgos potencialmente discutibles** y genera dos documentos completamente separados:

1. **Informe interno jurídico-técnico** (DOCX + XLSX): detallado, confidencial, para uso exclusivo del abogado.
2. **Propuesta comercial** (DOCX + PDF, máx. 2 páginas): breve, para el potencial cliente, sin revelar metodología, códigos, fundamentos jurídicos específicos, jurisprudencia, estrategia ni montos exactos por ítem.

> **La aplicación no afirma automáticamente que una isapre cometió una arbitrariedad, un incumplimiento o una ilegalidad.** Todo hallazgo se describe como "hallazgo potencialmente discutible", "inconsistencia que requiere validación", "causal que requiere contraste documental" o "antecedentes preliminares que ameritan evaluación". **La decisión jurídica definitiva corresponde siempre al abogado responsable del caso.**

## Limitaciones importantes (léalas antes de usar la herramienta)

- La extracción de campos e ítems se basa en **heurísticas** (expresiones regulares y mapeo de encabezados de tabla). Funciona mejor cuanto más estructurado esté el documento (tablas DOCX/XLSX con encabezados claros); en texto libre u OCR el resultado es más incierto.
- Por eso la pantalla de **Revisión Manual** es obligatoria: cada campo trae un nivel de confianza (alto/medio/bajo) y **debe** ser revisado y aprobado por el abogado antes de generar hallazgos e informes.
- La herramienta **no reemplaza el juicio profesional**. No emite conclusiones jurídicas automáticas.

## Requisitos

- Python 3.12
- Tesseract OCR (para PDF escaneados e imágenes)
- Poppler (usado por `pdf2image` para convertir PDF a imágenes antes del OCR)

La propuesta comercial en PDF se genera con **ReportLab**, que no depende de ningún programa externo y funciona igual en macOS, Windows y Linux. `docx2pdf` está incluido en `requirements.txt` como alternativa opcional si prefiere convertir el DOCX de la propuesta usando Microsoft Word (Windows/macOS) o LibreOffice; no es necesario para el funcionamiento por defecto de la aplicación.

## Instalación

### macOS

Instale Python 3.12 (por ejemplo con Homebrew: `brew install python@3.12`). Luego:

```bash
mkdir analisis-cuentas-clinicas
cd analisis-cuentas-clinicas
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate

brew install tesseract tesseract-lang poppler
pip install --upgrade pip
pip install -r requirements.txt

streamlit run app.py
```

**Alternativa:** ejecute el script de instalación, que además crea `.env` a partir de `.env.example`:

```bash
brew install python@3.12 tesseract tesseract-lang poppler
chmod +x install.sh
./install.sh
```

### Linux (Debian/Ubuntu)

Asegúrese de tener Python 3.12 disponible (`sudo apt install python3.12 python3.12-venv` si su distribución no lo trae por defecto). Luego:

```bash
mkdir analisis-cuentas-clinicas
cd analisis-cuentas-clinicas
cp .env.example .env

python3 -m venv .venv
source .venv/bin/activate

sudo apt update
sudo apt install -y tesseract-ocr tesseract-ocr-spa poppler-utils
pip install --upgrade pip
pip install -r requirements.txt

streamlit run app.py
```

**Alternativa:** ejecute el script de instalación, que además crea `.env` a partir de `.env.example`:

```bash
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv tesseract-ocr tesseract-ocr-spa poppler-utils
chmod +x install.sh
./install.sh
```

### Windows

Instale Python 3.12 desde [python.org](https://www.python.org/downloads/) (marcando "Add python.exe to PATH"), Tesseract OCR (por ejemplo, desde [UB Mannheim builds](https://github.com/UB-Mannheim/tesseract/wiki)) y Poppler para Windows (desde [poppler para Windows](https://github.com/oschwartz10612/poppler-windows/releases)), agregando las carpetas de Tesseract y de Poppler (`Library\bin`) al PATH del sistema. Luego, en PowerShell:

```powershell
mkdir analisis-cuentas-clinicas
cd analisis-cuentas-clinicas
cp .env.example .env

py -m venv .venv
.\.venv\Scripts\Activate.ps1

# Con Tesseract OCR y Poppler ya en el PATH, no hace falta editar .env
pip install --upgrade pip
pip install -r requirements.txt

streamlit run app.py
```

**Alternativa sin tocar el PATH del sistema:** ejecute el script de instalación, que crea `.env` a partir de `.env.example`, y luego complete allí `TESSERACT_CMD` y `POPPLER_PATH` con la ruta del ejecutable de Tesseract y de la carpeta `Library\bin` de Poppler:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install.ps1
```

### Docker (opcional, cualquier sistema operativo)

```bash
cp .env.example .env
docker compose up --build
```

La aplicación queda disponible en `http://localhost:8501`.

## Cómo ejecutar la aplicación

Requiere haber completado la instalación (sección anterior: entorno virtual creado y `pip install -r requirements.txt` ya ejecutado).

```bash
# activar entorno virtual si no está activo
source .venv/bin/activate        # macOS/Linux
# .\.venv\Scripts\Activate.ps1   # Windows

streamlit run app.py
```

Abra el navegador en `http://localhost:8501`. La aplicación queda corriendo en primer plano en esa terminal; para detenerla presione `Ctrl+C`. La próxima vez que quiera usarla, repita solo estos dos pasos (activar el entorno virtual y `streamlit run app.py`) desde la carpeta `analisis-cuentas-clinicas/` — no hace falta reinstalar nada salvo que cambie `requirements.txt`.

**Para verificar rápidamente que todo funciona** sin escribir datos reales: genere el material ficticio (`python scripts/generar_datos_muestra.py`, deja los archivos en `samples/`) y recorra Inicio → Cargar Caso → Revisión Manual → Hallazgos → Informes con esos archivos. El botón "Analizar y generar hallazgos" está deshabilitado hasta aprobar la revisión manual, y "Generar propuesta comercial" está deshabilitado hasta triar (aprobar/descartar/requiere antecedentes) todos los hallazgos — si ambos aparecen bloqueados al principio, es el comportamiento esperado, no un error.

## Flujo de uso

1. **Inicio**: crear un caso (nombre del potencial cliente, RUT opcional, isapre, número de cuenta) aceptando el aviso de datos sensibles y consentimiento.
2. **Cargar Caso**: subir uno o más archivos PDF, JPG, PNG, DOCX o XLSX, indicando el **tipo de cada documento** (cuenta clínica, liquidación de isapre, carta de rechazo, plan de salud, antecedentes médicos, otro). Solo los dos primeros tipos pasan por la extracción automática de ítems; los demás se guardan como antecedentes de referencia (evita generar ítems espurios sobre un documento que no es una cuenta). La aplicación extrae texto/tablas localmente (PyMuPDF, OCR con pytesseract/Poppler, python-docx, pandas/openpyxl).
3. **Revisión Manual**: cada ítem muestra su valor extraído, documento y página de origen, y nivel de confianza. Puede editar cualquier campo, marcarlo como aprobado, o eliminar filas espurias directamente en la tabla. Obligatoria antes de generar hallazgos definitivos.
4. **Hallazgos**: el botón de análisis está **bloqueado** hasta que el abogado apruebe la revisión manual del caso. Ejecuta el motor de análisis (cobertura, glosas, aritmética, duplicados, dispositivos médicos relevantes) y permite gestionar el estado de cada hallazgo (pendiente / aprobado / descartado / requiere antecedentes).
5. **Informes**:
   - **Informe interno** (DOCX + XLSX): resumen de la cuenta, matriz de ítems (con documento/página/confianza de cada uno), matriz de hallazgos, documentos disponibles y faltantes para el caso, monto potencialmente discutible (sin duplicar ítems), advertencia de validación profesional obligatoria e historial de cambios/aprobación. Bloqueado hasta aprobar la revisión manual.
   - **Propuesta comercial** (DOCX + PDF): nunca se genera automáticamente. El botón de generación está **bloqueado hasta que el abogado triara manualmente todos los hallazgos** (ningún hallazgo puede quedar en estado "pendiente"). Configure honorario fijo, honorario de éxito (opcional), exclusiones y vigencia; los gastos externos usan siempre el mismo texto estándar. Se genera un documento breve y genérico, sin detalle de hallazgos.
6. **Configuración y auditoría**: estado de la configuración de entorno (incluida la confirmación de que no se usa IA externa por defecto) y registro de accesos por caso.

Desde la página de **Inicio** también puede **eliminar por completo un caso**, lo que borra sus registros en base de datos y todos sus archivos y documentos generados.

## Datos de prueba (ficticios)

Nunca cargue datos reales en el repositorio. Para generar documentos ficticios de prueba, con datos inventados e incluyendo siempre un ítem de stent coronario con cobertura parcial (para probar la regla de dispositivos médicos) y un ítem 100% no cubierto:

```bash
python scripts/generar_datos_muestra.py
```

Genera una cuenta clínica ficticia en los 5 formatos soportados por la aplicación:

- `liquidacion_isapre_ficticia.xlsx`
- `cuenta_clinica_ficticia.docx`
- `cuenta_clinica_ficticia.pdf` (con texto real, sin OCR)
- `cuenta_clinica_ficticia.png` (imagen, requiere OCR)
- `cuenta_clinica_escaneada_ficticia.pdf` (PDF sin capa de texto, requiere OCR)

Y tres documentos de contexto (tipo carta de rechazo, plan de salud y antecedentes médicos), para probar que la aplicación clasifica correctamente qué documentos pasan por extracción de ítems y cuáles no:

- `carta_rechazo_ficticia.pdf`
- `plan_salud_ficticio.pdf`
- `antecedentes_medicos_ficticio.pdf`

Los archivos se guardan en `samples/` (excluida de git).

## Variables de entorno

Ver `.env.example` para la lista completa con valores por defecto. Las más relevantes:

| Variable | Uso |
|---|---|
| `APP_NAME` | Nombre mostrado en el título de la aplicación y la pestaña del navegador. |
| `APP_ENV` | `development` muestra un indicador "Modo desarrollo" en la barra lateral; cualquier otro valor lo oculta. |
| `DATABASE_URL` | Cadena de conexión de la base de datos (SQLite local por defecto). |
| `OUTPUT_DIRECTORY` | Carpeta donde se guardan los documentos cargados y los informes generados por caso. |
| `TESSERACT_LANG` | Idioma usado por Tesseract para el OCR (`spa` por defecto). |
| `MAX_FILE_SIZE_MB` | Tamaño máximo por archivo cargado; los archivos que lo superan se rechazan antes de procesarse. |
| `ENABLE_EXTERNAL_AI` | Documenta la intención de usar IA externa; la aplicación no incorpora integraciones automáticas hacia terceros aunque esté en `true`. |
| `CURRENT_USER` | Usuario que queda registrado en el historial de accesos y cambios. |
| `TESSERACT_CMD` / `POPPLER_PATH` | Rutas explícitas a los ejecutables, solo si no están en el PATH del sistema. |

## Seguridad y datos personales

- Procesamiento **100% local**: no se envían documentos a servicios externos por defecto.
- El uso de APIs de IA externas requiere activar explícitamente `ENABLE_EXTERNAL_AI=true` en `.env`; aun así, la aplicación no incorpora integraciones automáticas hacia terceros — esa variable solo documenta la intención de uso y debe respaldarse con autorización expresa caso a caso.
- Aviso de datos sensibles y consentimiento explícito antes de crear cada caso.
- El RUT del afiliado se **enmascara** en las vistas de listado (ej. `Inicio`); el dato completo permanece disponible para el trabajo jurídico del abogado en la base de datos local y en el informe interno.
- Registro de acceso (`RegistroAcceso`) y de cambios (`RegistroCambio`) por caso, visibles en la página de Configuración y auditoría.
- Botón para eliminar completamente un caso y todos sus archivos asociados.
- Límite configurable de tamaño por archivo cargado (`MAX_FILE_SIZE_MB`).
- Configuración sensible (rutas de OCR, URL de base de datos, usuario activo) se maneja mediante variables de entorno (`.env`, ver `.env.example`).

## Estructura del proyecto

```
app.py                        Punto de entrada de Streamlit (ejecutar con: streamlit run app.py); define la
                               navegación (st.navigation) y los títulos de cada página en el menú lateral
views/                         Páginas del flujo: Inicio, Cargar Caso, Revisión Manual, Hallazgos, Informes,
                               Configuración y Auditoría
app/
  config.py                   Configuración vía variables de entorno
  db/                         Modelos SQLAlchemy y sesión de base de datos
  schemas/                    Validaciones Pydantic
  extraction/                 Extracción (PDF/OCR/DOCX/XLSX), normalización RUT/montos, estructuración de ítems
  analysis/                   Motor de hallazgos, dispositivos médicos, aritmética, duplicados
  reports/                    Generadores de informe interno y propuesta comercial (DOCX/XLSX/PDF)
  security/                   Enmascarado de RUT y registro de auditoría
  utils/                      Almacenamiento de archivos por caso
scripts/
  generar_datos_muestra.py    Genera documentos ficticios de prueba
tests/                        Pruebas unitarias (pytest)
```

## Pruebas

```bash
pytest
```

Cobertura incluida:

- `test_rut_normalization.py`: normalización, validación de dígito verificador y enmascarado de RUT.
- `test_montos_extraction.py`: parseo de montos en formato chileno (miles con punto, decimales con coma, negativos entre paréntesis).
- `test_partial_coverage_detection.py`: detección de cobertura parcial, ítems no cubiertos, dispositivos médicos (incluida la regla especial de stents) y ausencia de lenguaje que afirme ilegalidad/arbitrariedad.
- `test_duplicates.py`: detección de posibles ítems duplicados.
- `test_commercial_proposal_no_leak.py`: verifica que la propuesta comercial (DOCX y PDF) nunca contenga códigos de prestación, fundamentos legales específicos, jurisprudencia, glosas, ni el término "hallazgo potencialmente discutible" reservado al informe interno; y que el PDF no exceda dos páginas.

## Calidad de código

```bash
ruff check .
black --check .
```

## Licencia y responsabilidad

Herramienta de uso interno. Ningún resultado generado por esta aplicación constituye asesoría jurídica definitiva ni sustituye la revisión y aprobación profesional del abogado responsable de cada caso.
