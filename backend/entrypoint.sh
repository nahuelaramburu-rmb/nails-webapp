#!/bin/sh
set -e

echo "Sincronizando schema con la base de datos..."
npx prisma db push --accept-data-loss

echo "Iniciando backend..."
exec node dist/main
