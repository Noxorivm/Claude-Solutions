#!/usr/bin/env bash
# Restauración de un backup (BD + uploads). Por defecto usa el par más
# reciente de BACKUP_DIR; se pueden pasar archivos concretos.
# Uso: bash docker/restore.sh [--yes] [DB.sql.gz UPLOADS.tar.gz]
#   --yes  salta la confirmación interactiva (necesario sin TTY)
set -euo pipefail

log() { echo "[restore] $*"; }
fail() {
	echo "[restore] ERROR: $*" >&2
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

ASSUME_YES=0
POSITIONAL=()
for arg in "$@"; do
	case "$arg" in
	--yes) ASSUME_YES=1 ;;
	*) POSITIONAL+=("$arg") ;;
	esac
done

DB_FILE="${POSITIONAL[0]:-}"
UPLOADS_FILE="${POSITIONAL[1]:-}"
if [ -z "$DB_FILE" ]; then
	DB_FILE="$(ls -1t "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | head -1 || true)"
fi
if [ -z "$UPLOADS_FILE" ]; then
	UPLOADS_FILE="$(ls -1t "$BACKUP_DIR"/uploads-*.tar.gz 2>/dev/null | head -1 || true)"
fi
[ -n "$DB_FILE" ] && [ -f "$DB_FILE" ] || fail "no hay backup de BD que restaurar"
[ -n "$UPLOADS_FILE" ] && [ -f "$UPLOADS_FILE" ] || fail "no hay backup de uploads que restaurar"

log "BD      ← $DB_FILE"
log "uploads ← $UPLOADS_FILE"
if [ "$ASSUME_YES" -ne 1 ]; then
	read -r -p "[restore] Esto SOBRESCRIBE la BD y los uploads actuales. ¿Continuar? [y/N] " answer
	case "$answer" in
	y | Y | yes | YES) ;;
	*) fail "cancelado por el usuario" ;;
	esac
fi

log "parando la app durante la restauración"
$COMPOSE stop app

log "recreando la base de datos $POSTGRES_DB"
$COMPOSE exec -T postgres psql -U "$POSTGRES_USER" -d postgres \
	-v ON_ERROR_STOP=1 \
	-c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\" WITH (FORCE);" \
	-c "CREATE DATABASE \"$POSTGRES_DB\" OWNER \"$POSTGRES_USER\";"

log "restaurando el dump"
gunzip -c "$DB_FILE" |
	$COMPOSE exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
		-v ON_ERROR_STOP=1 -q

log "restaurando uploads en $UPLOADS_VOLUME"
UPLOADS_DIR_HOST="$(cd "$(dirname "$UPLOADS_FILE")" && pwd)"
UPLOADS_BASENAME="$(basename "$UPLOADS_FILE")"
docker run --rm \
	-v "$UPLOADS_VOLUME":/data/uploads \
	-v "$UPLOADS_DIR_HOST":/backup:ro \
	alpine sh -c "find /data/uploads -mindepth 1 -delete && tar xzf '/backup/$UPLOADS_BASENAME' -C /data"

log "arrancando la app (migrate-on-start dejará la BD al día si hace falta)"
$COMPOSE start app

log "OK · restauración completada"
