#!/bin/sh
# Arranque de PymeLegal dentro de Docker (uso local, un solo usuario).
set -e

# Genera un AUTH_SECRET la primera vez y lo persiste en el volumen /data para
# que las sesiones no se invaliden cada vez que se reinicia el contenedor.
# Si el usuario define AUTH_SECRET por variable de entorno, se respeta esa.
if [ -z "$AUTH_SECRET" ]; then
  mkdir -p /data
  SECRET_FILE="/data/.auth_secret"
  if [ ! -f "$SECRET_FILE" ]; then
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > "$SECRET_FILE"
  fi
  export AUTH_SECRET="$(cat "$SECRET_FILE")"
fi

echo "Aplicando migraciones de base de datos..."
until npx prisma migrate deploy; do
  echo "La base de datos todavía no responde, reintentando en 2 segundos..."
  sleep 2
done

echo "Sembrando datos base (fuentes jurídicas, reglas, sectores, preguntas, usuarios)..."
npm run db:seed

echo ""
echo "PymeLegal listo -> http://localhost:3000"
echo ""
exec npm run start
