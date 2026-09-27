# Cómo instalar PymeLegal en tu PC (Windows, uso personal)

Esta guía es para que Ariel pueda usar PymeLegal **solo desde su propio computador
Windows**, sin depender de este entorno de desarrollo en la nube y sin necesidad de saber
programación. Todo corre localmente: nada de lo que cargues (transcripciones, documentos,
diagnósticos) sale de tu PC.

## 1. Instala Docker Desktop (una sola vez)

Docker es el programa que hace que PymeLegal (la aplicación) y su base de datos funcionen
juntas en tu PC con un solo clic, sin que tengas que instalar Node.js, PostgreSQL ni nada
de eso por separado.

1. Ve a <https://www.docker.com/products/docker-desktop/> y descarga "Docker Desktop for
   Windows".
2. Instálalo con las opciones por defecto (puede pedir reiniciar el PC — acepta).
3. Ábrelo. La primera vez puede pedir activar "WSL2"; si aparece un aviso al respecto,
   sigue el enlace que Docker mismo ofrece para instalarlo y reinicia cuando lo pida.
4. Espera a que en la esquina inferior aparezca el ícono de la ballena de Docker y, al
   pasar el mouse por encima, diga que está "running" (funcionando). Esto puede demorar
   uno o dos minutos la primera vez que abres Docker Desktop.

No necesitas crear cuenta en Docker ni configurar nada más.

## 2. Descarga PymeLegal a tu PC

Por ahora el código vive en una rama de revisión (`claude/gracious-keller-swwafd`) que
todavía no se ha fusionado a la rama principal del repositorio. Para descargarla sin
necesidad de instalar Git:

1. Abre este enlace en tu navegador:
   <https://github.com/arielschapirob-max/marketing-schapiro/archive/refs/heads/claude/gracious-keller-swwafd.zip>
2. Se descargará un archivo `.zip`. Extráelo (clic derecho → "Extraer todo...") en una
   carpeta que puedas encontrar fácilmente, por ejemplo `Documentos\PymeLegal`.

Cuando el PR se fusione a la rama principal, avísame y te paso el enlace definitivo (será
más corto y no dependerá de esta rama).

## 3. Primer inicio

1. Entra a la carpeta donde extrajiste PymeLegal.
2. Haz doble clic en **`Iniciar PymeLegal.bat`**.
3. Se abrirá una ventana negra (símbolo del sistema) mostrando el avance. **La primera vez
   puede demorar varios minutos** (está preparando la aplicación y la base de datos
   completas); las siguientes veces será mucho más rápido (segundos). Es normal que durante
   esta primera preparación aparezcan líneas en rojo mencionando "Prisma" — es un aviso
   interno sin consecuencia, mientras la ventana siga avanzando no hay nada que hacer.
4. Cuando esté listo, se abrirá automáticamente tu navegador en `http://localhost:3000`
   con la pantalla de inicio de sesión de PymeLegal.

Si Windows muestra una advertencia de "Firewall de Windows" preguntando si permitir el
acceso, acepta — es solo para que tu propio navegador pueda conectarse a la aplicación
dentro de tu mismo PC; no se abre nada hacia internet.

### Iniciar sesión

Usa una de estas cuentas creadas automáticamente (puedes cambiar la contraseña luego
desde `/admin/usuarios` dentro de la aplicación):

| Correo | Contraseña |
|---|---|
| `ariel@pymelegal.cl` | `PymeLegal#2026` |
| `admin@pymelegal.cl` | `PymeLegal#2026` (súper administrador) |

## 4. Uso diario

- **Para abrir PymeLegal**: doble clic en `Iniciar PymeLegal.bat`. Las veces siguientes es
  casi instantáneo.
- **Para cerrarla**: doble clic en `Detener PymeLegal.bat`. Tus organizaciones,
  diagnósticos y documentos cargados **quedan guardados** — no se pierden al apagar el PC
  ni al detener la aplicación.
- Mientras esté "iniciada", puedes volver a abrir `http://localhost:3000` en el navegador
  cuando quieras, sin tener que hacer doble clic en el `.bat` de nuevo.

## 5. Privacidad y alcance

- Todo funciona **dentro de tu propio PC**: la aplicación, la base de datos y los archivos
  que subas. Nada se envía a internet ni a Anthropic/OpenAI ni a ningún tercero — el motor
  de IA está en **MODO MOCK** (heurística local), igual que el antivirus, el OCR y el
  almacenamiento.
- Solo tú puedes acceder a `http://localhost:3000` desde tu propio computador; no queda
  expuesto a la red local ni a internet.
- Sigue siendo una **herramienta de apoyo**: todo diagnóstico, cuestionario o exportación
  debe revisarse antes de usarse con un cliente real, tal como se explica en el propio
  sistema y en `README.md`/`LEGAL_ENGINE.md`.

## 6. Si algo no funciona

- Verifica que Docker Desktop esté abierto y diga "running" antes de usar
  `Iniciar PymeLegal.bat`.
- Si la ventana negra muestra un error y se cierra sola, ábrela de nuevo así el mensaje se
  puede leer con calma; compártemelo y lo reviso.
- Para ver qué está pasando "por dentro" en cualquier momento (con Docker Desktop abierto),
  abre el símbolo del sistema en la carpeta de PymeLegal y escribe:
  ```
  docker compose logs -f
  ```
  (Ctrl+C para salir de esa vista).
- Si quieres empezar de cero (borra todos los datos cargados), con Docker Desktop abierto
  ejecuta en esa misma carpeta:
  ```
  docker compose down -v
  ```
  y luego vuelve a usar `Iniciar PymeLegal.bat`.
