#!/usr/bin/env sh
# Única fuente del entorno de CI: lo usan el workflow de GitHub y el hook pre-push,
# para que una verificación local con el .env del desarrollador no oculte fallas de CI.
set -eu

export NEXTAUTH_SECRET=placeholder
export TURSO_DATABASE_URL=file:./temp-ci.db
export TURSO_AUTH_TOKEN=placeholder
export R2_ACCOUNT_ID=placeholder
export R2_ACCESS_KEY_ID=placeholder
export R2_SECRET_ACCESS_KEY=placeholder
export R2_BUCKET=placeholder

pnpm verify:ci
