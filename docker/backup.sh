#!/usr/bin/env bash
# Backup de producción (docs/04 §Seguridad): dump de la BD + tar del
# volumen de uploads, con rotación. Pensado para cron en el host OVH
# (sin TTY). Uso: bash docker/backup.sh
set -euo pipefail

log() { echo "[backup] $*"; }
fail() {
	echo "[backup] ERROR: $*" >&2
	exit 1
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$(dirname "$SCRIPT_DIR")"

ENV_FILE="docker/.env"
[ -f "$ENV_FILE" ] || fail "no existe $ENV_FILE (copia docker/.env.example)"
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${BACKUP_DIR:?BACKUP_DIR no definido en docker/.env}"
: "${POSTGRES_USER:?}"
: "${POSTGRES_DB:?}"

COMPOSE="docker compose -f docker/docker-compose.yml --env-file $ENV_FILE"
UPLOADS_VOLUME="cubiletica-prod_uploads_data"
RETENTION_DAYS=14
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

DB_FILE="$BACKUP_DIR/db-$STAMP.sql.gz"
log "BD → $DB_FILE"
$COMPOSE exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" |
	gzip >"$DB_FILE"
[ -s "$DB_FILE" ] || fail "el dump de la BD quedó vacío"

UPLOADS_FILE="$BACKUP_DIR/uploads-$STAMP.tar.gz"
log "uploads ($UPLOADS_VOLUME) → $UPLOADS_FILE"
# Contenedor efímero: lee el volumen y escribe el tar en BACKUP_DIR sin
# depender de rutas internas del host.
docker run --rm \
	-v "$UPLOADS_VOLUME":/data/uploads:ro \
	-v "$BACKUP_DIR":/backup \
	alpine tar czf "/backup/uploads-$STAMP.tar.gz" -C /data uploads
[ -s "$UPLOADS_FILE" ] || fail "el tar de uploads quedó vacío"

log "rotación: eliminando backups con más de $RETENTION_DAYS días"
find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.sql.gz' -mtime +"$RETENTION_DAYS" -print -delete |
	while read -r removed; do log "rotado: $removed"; done
find "$BACKUP_DIR" -maxdepth 1 -name 'uploads-*.tar.gz' -mtime +"$RETENTION_DAYS" -print -delete |
	while read -r removed; do log "rotado: $removed"; done

log "OK · $DB_FILE · $UPLOADS_FILE"
