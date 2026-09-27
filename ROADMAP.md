# Roadmap y limitaciones conocidas

## Limitaciones conocidas (honestas, sin ocultar)

1. **Las 21 reglas jurídicas del sistema están `validationStatus: 'VALIDADA'`** contra el
   texto oficial de la Biblioteca del Congreso Nacional: las 6 de la Ley 19.628 y las 11
   de la Ley 21.719 contra el PDF oficial aportado por el usuario, y las 4 de normativa
   sectorial/constitucional (`L20584-001`, `L21663-001`, `L21459-001`, `CPR-001`) contra el
   texto XML oficial obtenido en vivo de `bcn.cl` una vez habilitado ese dominio en el
   entorno. Ver `LEGAL_ENGINE.md`. **Esto no exime de reconfirmación periódica**: una ley
   validada en una fecha puede modificarse después (ver, p. ej., la alerta de seguimiento
   del boletín 18.623-07 sobre la vigencia de la Ley 21.719 en `vigencia.ts`), y antes de
   usar el sistema con un cliente real un abogado debe confirmar que el texto de origen de
   cada regla sigue vigente al momento de uso.
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
- Reconfirmar periódicamente (p. ej. semestralmente, o antes de cada uso relevante) las 21
  reglas ya `VALIDADA` contra bcn.cl, dado que una ley puede modificarse después de la
  fecha de esta revisión — con especial atención al boletín 18.623-07 sobre la vigencia de
  la Ley 21.719.
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
