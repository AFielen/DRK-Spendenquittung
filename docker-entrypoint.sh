#!/bin/sh

echo "Running database migrations..."
if npx prisma migrate deploy; then
  echo "Migrations complete."
else
  echo "WARNING: Migration failed (exit code $?). Server starts anyway."
  echo "Check database state manually if needed."
fi

echo "Starting server..."
exec node server.js
