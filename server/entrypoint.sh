#!/bin/sh
set -e

# Wait for the database to be reachable (optional but handled by docker-compose depends_on healthcheck)
echo "Running Prisma DB Push..."
npx prisma db push

if [ "$RUN_SEED" = "true" ]; then
  echo "Running Prisma Database Seed..."
  npm run seed
fi

echo "Starting server..."
exec npm run start
