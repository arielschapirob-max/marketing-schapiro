# Imagen única de PymeLegal para uso local (un solo usuario, un solo PC).
#
# Se instalan también las devDependencies (tsx, prisma CLI, typescript) a
# propósito: el contenedor las necesita en tiempo de ejecución para aplicar
# migraciones (`prisma migrate deploy`) y sembrar los datos base
# (`npm run db:seed`, que ejecuta `prisma/seed.ts` con `tsx`) cada vez que
# arranca. No es la imagen mínima posible, pero es la más simple de mantener
# correcta para este caso de uso (ver docker/entrypoint.sh).
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

# Next.js intenta, de forma inofensiva, consultar la base de datos al generar
# algunas páginas durante `next build` (queda igualmente como ruta dinámica,
# sin base de datos real en ese momento). Se le da un DATABASE_URL/AUTH_SECRET
# de relleno solo para esta etapa, para que no imprima un error confuso; el
# AUTH_SECRET real se genera en tiempo de ejecución (ver docker/entrypoint.sh)
# y el DATABASE_URL real lo entrega docker-compose.yml.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="solo-para-el-build-no-se-usa-en-produccion-000000"
RUN npm run build
ENV AUTH_SECRET=""

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
