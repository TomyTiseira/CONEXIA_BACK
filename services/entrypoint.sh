#!/bin/sh
set -e

# Iniciar la aplicación en background para que TypeORM cree las tablas
echo "Iniciando aplicación para crear tablas..."
npm run start:dev &
APP_PID=$!

# Esperar un poco para que TypeORM sincronice las tablas
echo "Esperando que TypeORM cree las tablas..."
sleep 15

# Ejecutar migraciones
echo "Ejecutando migraciones de base de datos..."
npx ts-node src/scripts/migrate-delivery-payment-fields.ts
npx ts-node src/scripts/migrate-requoting-fields.ts
npx ts-node src/scripts/migrate-claim-assigned-moderator-fields.ts
npx ts-node src/scripts/migrate-claim-statuses-requires-response-and-cancelled.ts
npx ts-node src/scripts/migrate-add-finished-by-moderation-statuses.ts
npx ts-node src/scripts/migrate-claim-clarification-evidence-urls.ts
npx ts-node src/scripts/migrate-add-compliance-types.ts
npx ts-node src/scripts/migrate-rename-peer-objection.ts
npx ts-node src/scripts/migrate-create-compliance-submissions.ts
npx ts-node src/scripts/migrate-add-compliance-tracking.ts

# Ejecutar seeds
echo "Ejecutando seeds..."
npx ts-node src/scripts/seed-service-categories.ts
npx ts-node src/scripts/seed-service-hiring-statuses.ts

# Esperar a que la aplicación termine
wait $APP_PID