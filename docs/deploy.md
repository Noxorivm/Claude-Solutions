# Despliegue de Claude Solutions (VPS OVH, Docker + Caddy)

Runbook del stack de producción: `docker/docker-compose.yml` levanta
**app** (Next.js standalone; al arrancar corre migrate → seed →
content:apply), **postgres** (sin
puerto publicado) y **caddy** (TLS automático). Las subidas viven en el
volumen `uploads_data`; los datos de Postgres en `postgres_data`.

## Requisitos

- VPS con Linux (probado el patrón en Debian/Ubuntu) y acceso SSH.
- Docker Engine + el plugin de compose (`docker compose version` ≥ v2).
- DNS: un registro A del dominio apuntando a la IP del VPS.
- Puertos 80 y 443 libres en el host (Caddy los necesita).

## Primer despliegue

1. **Clonar el repo** en el VPS:

   ```bash
   git clone https://github.com/Noxorivm/Claude-Solutions.git
   cd Claude-Solutions
   ```

2. **Configurar el entorno**:

   ```bash
   cp docker/.env.example docker/.env
   openssl rand -hex 32   # → pégalo en BETTER_AUTH_SECRET
   nano docker/.env
   ```

   Rellena: `POSTGRES_PASSWORD` (y la misma en `DATABASE_URL`),
   `BETTER_AUTH_SECRET`, `DOMAIN` (p. ej. `claude-solutions.example.com`),
   `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL` (`https://<DOMAIN>`), y las
   credenciales `SEED_ADMIN_*` del primer admin.

3. **Construir y levantar**:

   ```bash
   docker compose -f docker/docker-compose.yml --env-file docker/.env build
   docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
   ```

4. **Verificar las migraciones** (se aplican solas al arrancar la app):

   ```bash
   docker compose -f docker/docker-compose.yml --env-file docker/.env logs app | grep migrate
   # [migrate] applying pending migrations from ./drizzle …
   # [migrate] migrations up to date
   ```

5. **Seed y contenido (automáticos al arrancar)** — tras migrate, la app
   ejecuta `seed` (currículo, técnicas, logros y el admin de
   `SEED_ADMIN_*`) y después `content:apply` (cuerpos de lección). Ambos
   son idempotentes; no hace falta ejecutarlos a mano. Comprobar en logs:

   ```bash
   docker compose -f docker/docker-compose.yml --env-file docker/.env logs app \
     | grep -E "Admin|\[content\]"
   # Admin creado y promovido: <SEED_ADMIN_EMAIL>   (solo la 1ª vez)
   # [content] resumen: N aplicadas · … saltadas · 0 sin-match
   ```

   Para forzar el re-volcado de cuerpos tras editar en el admin:
   `… --env-file docker/.env exec app node apply-content.mjs --force`.

6. **TLS**: con el DNS ya propagado, Caddy emite el certificado solo en
   el primer acceso a `https://<DOMAIN>`. No hay que hacer nada más.

7. **Humo**: entra en `https://<DOMAIN>/login` con el admin del seed y
   comprueba que `/app/ruta` carga.

## Despliegues siguientes

```bash
cd Claude-Solutions
git pull
docker compose -f docker/docker-compose.yml --env-file docker/.env build
docker compose -f docker/docker-compose.yml --env-file docker/.env up -d
```

Las migraciones nuevas se aplican automáticamente al arrancar el
contenedor de la app (si fallan, la app no arranca: revisa los logs).

## Comprobaciones

```bash
# Los tres servicios "healthy" (caddy depende de app healthy):
docker compose -f docker/docker-compose.yml --env-file docker/.env ps

# Health de la app (responde la propia app, BD incluida):
curl -s https://<DOMAIN>/api/health   # → {"status":"ok"}
```

## Troubleshooting

- **Logs por servicio**:
  `docker compose -f docker/docker-compose.yml --env-file docker/.env logs -f app`
  (igual con `postgres` o `caddy`).
- **La app no arranca / reinicia en bucle**: casi siempre es migración o
  `DATABASE_URL`. Mira `logs app`; `[migrate] FAILED: …` indica la causa
  (credenciales, BD inaccesible…).
- **Puerto 80/443 ocupado**: `sudo ss -ltnp | grep -E ':80|:443'` y para
  el servicio en conflicto (Apache/nginx del sistema) antes de `up -d`.
- **Certificado no emitido**: comprueba que el DNS apunta al VPS
  (`dig +short <DOMAIN>`), que 80/443 están abiertos en el firewall y
  revisa `logs caddy` (errores ACME). Caddy reintenta solo.
- **/api/health devuelve 503**: la app corre pero no llega a la BD;
  revisa el estado de `postgres` en `ps` y sus logs.
- **Restaurar desde cero (¡destruye datos!)**: `down -v` borra también
  los volúmenes (BD y subidas). Para parar sin perder datos usa `down`
  a secas.

## Backups y restauración

`docker/backup.sh` genera **dos artefactos** en `BACKUP_DIR` (definido en
`docker/.env`): `db-YYYYmmdd-HHMMSS.sql.gz` (un `pg_dump` completo de la
BD) y `uploads-YYYYmmdd-HHMMSS.tar.gz` (el volumen de subidas, vía
contenedor efímero). Al final **rota**: borra ambos tipos con más de 14
días. Es apto para cron (sin TTY, logs `[backup]`, exit ≠ 0 si algo
falla).

### Cron diario (4:30)

```bash
sudo mkdir -p /var/backups/claude-solutions   # el BACKUP_DIR de docker/.env
crontab -e
# añade (ajusta la ruta del repo):
30 4 * * * cd /opt/claude-solutions && bash docker/backup.sh >> /var/log/claude-solutions-backup.log 2>&1
```

Idealmente sincroniza `BACKUP_DIR` a un almacenamiento externo (rsync,
object storage de OVH…): un backup en el mismo disco no cubre la pérdida
del VPS.

### Restauración (procedimiento probado)

`docker/restore.sh` restaura **el par más reciente** de `BACKUP_DIR` (o
los archivos que le pases). Para la app, recrea la BD desde el dump,
vacía el volumen de uploads y extrae el tar, y vuelve a arrancar la app
(el migrate-on-start deja la BD al día si el backup era de una versión
anterior del esquema).

```bash
cd /opt/claude-solutions
bash docker/restore.sh            # pide confirmación (y/N)
# o, sin prompt (scripts/cron):
bash docker/restore.sh --yes
# o con archivos concretos:
bash docker/restore.sh --yes /var/backups/claude-solutions/db-20260612-043000.sql.gz \
                             /var/backups/claude-solutions/uploads-20260612-043000.tar.gz
```

Tras restaurar: `docker compose … ps` debe mostrar la app healthy de
nuevo, el login funciona con los usuarios del backup y las imágenes
subidas vuelven a servirse desde `/uploads/...`. Este ciclo completo
(backup → `down -v` → `up` → restore) está verificado de extremo a
extremo en F6-T2.
