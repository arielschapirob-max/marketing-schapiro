# Roadmap y limitaciones conocidas

## Limitaciones conocidas (honestas, sin ocultar)

1. **5 de las 21 reglas jurídicas (normativa sectorial y constitucional) no están
   verificadas contra el texto oficial vigente.** El proxy de red de este entorno bloquea
   `bcn.cl` y las demás fuentes oficiales; para la Ley 19.628 y la Ley 21.719 el usuario
   resolvió esto adjuntando los PDF oficiales directamente, y esas 12 reglas ya están
   `VALIDADA`. Faltan por verificar `L20584-001` (Ley 20.584), `L21663-001` (Ley 21.663),
   `L21459-001` (Ley 21.459) y `CPR-001` (Constitución). Ver `LEGAL_ENGINE.md`. **Esto
   debe resolverse antes de usar el sistema con un cliente real en esas materias.**
2. **El proveedor de IA real (Anthropic/OpenAI) no fue probado en vivo** — código
   completo, sin validación de red. Ver `AI_ENGINE.md`.
3. **El análisis web no fue probado contra un sitio real** en este entorno — código
   completo con pruebas unitarias de sus detectores. Ver `WEB_ANALYSIS.md`.
4. **OCR y antivirus reales no están implementados**, solo sus adaptadores mock e
   interfaces listas para conectar un proveedor real.
5. **Extracción de `.xlsx`** no implementada (se informa explícitamente en vez de fallar
   silenciosamente).
6. **Sin rate limiting** en Server Actions ni rutas de descarga.
7. **Sin cifrado a nivel de aplicación** de campos especialmente sensibles (más allá del
   hash de contraseñas).
8. **Sin cola de trabajos (Redis/BullMQ)**: el análisis corre en modo síncrono. Aceptable
   para el volumen actual (heurística local, no llamadas lentas a un LLM), pero si se
   activa un proveedor de IA real con latencia alta, o el volumen de diagnósticos
   concurrentes crece, esto debería moverse a una cola.
9. **Sin pipeline de CI** configurado en este repositorio.
10. **El logotipo oficial de PymeLegal no fue provisto.** La aplicación usa un marcador de
    texto discreto ("[LOGO PENDIENTE]") en la portada, el header y los documentos
    exportados, en vez de inventar un logo. Ver la sección correspondiente en `README.md`.

## Trabajo futuro sugerido (por prioridad)

### Corto plazo
- Verificar el motor jurídico contra bcn.cl artículo por artículo con un abogado, y pasar
  cada regla revisada a `validationStatus: 'VALIDADA'`.
- Reemplazar el logotipo placeholder por el activo oficial de marca.
- Probar el proveedor de IA real con una clave de API válida en un entorno con acceso de
  red normal.
- Probar el análisis web contra 2-3 sitios reales representativos de cada sector.
- Configurar CI (GitHub Actions) con los 4 comandos de verificación.

### Mediano plazo
- Generación de preguntas candidatas por IA (con el mismo contrato de trazabilidad que las
  preguntas del banco humano: fuente, justificación, evidencia requerida, estado
  `AI_PROPOSED` hasta aprobación).
- UI de administración de reglas jurídicas y preguntas (hoy se editan en código +
  `npm run db:seed`; el modelo de datos ya soporta edición en caliente vía
  `LegalRule`/`Question`, falta la pantalla de escritura).
- Comparación de versiones de cuestionario y de reglas jurídicas (los modelos
  `QuestionVersion`/`LegalRuleVersion` ya existen).
- Adaptador S3 real para almacenamiento en producción.
- Integración de antivirus real (ClamAV u otro).
- Extracción de `.xlsx` y OCR real.

### Largo plazo
- Rate limiting y protecciones adicionales de abuso antes de exponer el sistema
  públicamente.
- Cifrado a nivel de aplicación de campos sensibles según clasificación de riesgo.
- Cola de trabajos si el volumen o la latencia de IA lo justifican.
- Reordenamiento de preguntas por arrastrar-y-soltar en el editor de cuestionario.
- Internacionalización si el producto se expande fuera de Chile (hoy todo el contenido
  jurídico y de UI está en español de Chile, por diseño).

## Materias explícitamente fuera de alcance de este proyecto

- Cualquier automatización de trámites ante la futura Agencia de Protección de Datos
  Personales (no existe aún como entidad operativa).
- Firma electrónica avanzada de la aprobación (hoy es un hash SHA-256 de trazabilidad
  interna, no una firma electrónica con valor legal).
