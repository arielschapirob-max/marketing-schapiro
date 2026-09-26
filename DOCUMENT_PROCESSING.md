# Procesamiento documental

## Pipeline (`src/modules/document-processing/pipeline.ts`)

```
validar (extensión + MIME + firma binaria + tamaño)
  → checksum SHA-256 → detectar duplicado (mismo diagnóstico)
  → antivirus → si no está limpio: CUARENTENA (registro sin almacenar el binario)
  → almacenar (privado) → extraer texto → OCR si corresponde
  → clasificar documento → persistir ExtractedDocument
```

Cada paso queda registrado: el `File` termina en `PROCESSED`, `QUARANTINED` o `ERROR`,
nunca silenciosamente perdido.

## Validación de archivos (`validation.ts`)

- Extensiones permitidas: `.pdf .docx .txt .csv .xlsx .png .jpg .jpeg`.
- Verifica que el MIME declarado corresponda a la extensión.
- Verifica la **firma binaria** (magic bytes) contra la extensión declarada — así se
  detecta un archivo `.pdf` que en realidad es texto plano o un ejecutable renombrado.
- Tamaño máximo: 25 MB (`MAX_FILE_SIZE_BYTES`).
- Rechaza archivos vacíos.

Cubierto por `tests/document-processing/validation.test.ts` (incluye un caso de archivo
"disfrazado": extensión `.pdf` con contenido de texto plano).

## Antivirus (`antivirus.ts`)

**MODO MOCK** por defecto (sin `ANTIVIRUS_ENDPOINT` configurado): reconoce la firma de
prueba estándar EICAR y, por lo demás, confía en la validación de extensión/MIME/firma ya
realizada. Si se configura `ANTIVIRUS_ENDPOINT`, hoy lanza un error explícito
(**PENDIENTE DE IMPLEMENTACIÓN** la integración real, p. ej. contra un servicio ClamAV vía
HTTP) en vez de fingir que escaneó el archivo — nunca se aprueba silenciosamente un
archivo sin escanear cuando el operador cree que configuró un antivirus real.

## Almacenamiento (`storage.ts`)

- `STORAGE_DRIVER=local` (por defecto): guarda en `storage/uploads/`, fuera del árbol
  servido por Next.js. El acceso solo ocurre a través de
  `src/app/api/files/[id]/route.ts`, que exige sesión y pertenencia a la organización.
- `STORAGE_DRIVER=s3`: **PENDIENTE DE IMPLEMENTACIÓN** (la interfaz `saveFile/readFile/deleteFile`
  ya está definida para poder sustituir el adaptador local por un cliente S3 real sin
  tocar el resto del pipeline).

## Extracción de texto (`extract.ts`)

| Tipo | Método |
|---|---|
| `.txt` / `.csv` | Lectura directa como UTF-8 |
| `.pdf` | `pdf-parse` |
| `.docx` | `mammoth` (extracción de texto plano) |
| `.xlsx` | **PENDIENTE DE IMPLEMENTACIÓN** (se informa explícitamente en el texto extraído en vez de fallar silenciosamente) |
| `.png` / `.jpg` / `.jpeg` | OCR — **MODO MOCK** por defecto (ver abajo) |

## OCR (`OCR_PROVIDER`)

**MODO MOCK** por defecto: no ejecuta reconocimiento óptico real; deja constancia
explícita de que no se extrajo texto real de la imagen y de qué variables configurar para
habilitarlo. La interfaz está lista para conectar un proveedor real (Tesseract local o un
servicio externo) sin cambiar el resto del pipeline.

## Clasificación documental (`classifyDocument`)

Heurística léxica que detecta el tipo de documento (contrato, política, anexo,
formulario) y señales relevantes para protección de datos: cláusulas de protección de
datos, mención a encargado de tratamiento, transferencias internacionales, conservación,
seguridad, derechos ARCO, incidentes.

## Minimización de datos

Se separan explícitamente tres capas: el binario original (`storage/uploads`), el texto
extraído (`ExtractedDocument.text`) y los hallazgos estructurados (`Finding`). Un archivo
eliminado (`deleteFileSecurely`) borra el binario del almacenamiento y marca el registro
como `DELETED` con fecha, sin eliminar los hallazgos ya derivados (que son necesarios para
la trazabilidad del diagnóstico) — coherente con el principio de minimización sin perder
la trazabilidad exigida por el encargo.
