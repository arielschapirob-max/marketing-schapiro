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

```bash
brew install python@3.12 tesseract tesseract-lang poppler
cd analisis-cuentas-clinicas
chmod +x install.sh
./install.sh
```

### Linux (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y python3.12 python3.12-venv tesseract-ocr tesseract-ocr-spa poppler-utils
cd analisis-cuentas-clinicas
chmod +x install.sh
./install.sh
```

### Windows

Instale Python 3.12 desde [python.org](https://www.python.org/downloads/) (marcando "Add python.exe to PATH"), Tesseract OCR (por ejemplo, desde [UB Mannheim builds](https://github.com/UB-Mannheim/tesseract/wiki)) y Poppler para Windows (desde [poppler para Windows](https://github.com/oschwartz10612/poppler-windows/releases)), agregando las carpetas de Tesseract y de Poppler (`Library\bin`) al PATH del sistema. Luego, en PowerShell:

```powershell
mkdir analisis-cuentas-clinicas
cd analisis-cuentas-clinicas

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

## Ejecución

```bash
# activar entorno virtual si no está activo
source .venv/bin/activate        # macOS/Linux
# .\.venv\Scripts\Activate.ps1   # Windows

streamlit run app.py
```

Abra el navegador en `http://localhost:8501`.

## Flujo de uso

1. **Inicio**: crear un caso (nombre del potencial cliente, RUT opcional, isapre, número de cuenta) aceptando el aviso de datos sensibles y consentimiento.
2. **Cargar Caso**: subir uno o más archivos PDF, JPG, PNG, DOCX o XLSX. La aplicación extrae texto/tablas localmente (PyMuPDF, OCR con pytesseract/Poppler, python-docx, pandas/openpyxl) y estructura ítems preliminares.
3. **Revisión Manual**: editar y aprobar los ítems extraídos. Obligatoria antes de generar hallazgos definitivos.
4. **Hallazgos**: ejecutar el motor de análisis (cobertura, glosas, aritmética, duplicados, dispositivos médicos relevantes) y gestionar el estado de cada hallazgo (pendiente / aprobado / descartado / requiere antecedentes).
5. **Informes**:
   - **Informe interno** (DOCX + XLSX): resumen de la cuenta, matriz de ítems, matriz de hallazgos, monto potencialmente discutible (sin duplicar ítems), antecedentes faltantes, advertencia de validación profesional obligatoria e historial de cambios/aprobación.
   - **Propuesta comercial** (DOCX + PDF): configure honorario fijo, honorario de éxito (opcional), gastos, exclusiones y vigencia; se genera un documento breve y genérico, sin detalle de hallazgos.
6. **Configuración y auditoría**: estado de la configuración de entorno (incluida la confirmación de que no se usa IA externa por defecto) y registro de accesos por caso.

Desde la página de **Inicio** también puede **eliminar por completo un caso**, lo que borra sus registros en base de datos y todos sus archivos y documentos generados.

## Datos de prueba (ficticios)

Nunca cargue datos reales en el repositorio. Para generar documentos ficticios de prueba (una liquidación XLSX y una cuenta clínica DOCX con datos inventados, incluyendo un ítem de stent coronario para probar la regla de dispositivos médicos):

```bash
python scripts/generar_datos_muestra.py
```

Los archivos se guardan en `data/muestras/` (excluida de git).

## Seguridad y datos personales

- Procesamiento **100% local**: no se envían documentos a servicios externos por defecto.
- El uso de APIs de IA externas requiere activar explícitamente `PERMITIR_IA_EXTERNA=true` en `.env`; aun así, la aplicación no incorpora integraciones automáticas hacia terceros — esa variable solo documenta la intención de uso y debe respaldarse con autorización expresa caso a caso.
- Aviso de datos sensibles y consentimiento explícito antes de crear cada caso.
- El RUT del afiliado se **enmascara** en las vistas de listado (ej. `Inicio`); el dato completo permanece disponible para el trabajo jurídico del abogado en la base de datos local y en el informe interno.
- Registro de acceso (`RegistroAcceso`) y de cambios (`RegistroCambio`) por caso, visibles en la página de Configuración y auditoría.
- Botón para eliminar completamente un caso y todos sus archivos asociados.
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
