#!/bin/bash
# Script de deploy PRODUCCIÓN para HighCourt RAG con Nginx + SSL
# Uso: ./scripts/deploy-prod.sh <dominio.com> <email@para-ssl>
# Ejemplo: ./scripts/deploy-prod.sh jurisprudencia.micorte.gov admin@micorte.gov

set -e

if [ $# -lt 1 ]; then
    echo "Uso: $0 <dominio.com> [email]"
    echo "Ejemplo: $0 jurisprudencia.micorte.gov admin@micorte.gov"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}
COMPOSE_FILE="docker-compose.prod.yml"
PROJECT_NAME="highcourt-rag"

echo "=========================================="
echo "  HighCourt RAG - Deploy Producción"
echo "  Dominio: $DOMAIN"
echo "  Email:   $EMAIL"
echo "=========================================="
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado."
    echo "   Instálalo: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado."
    exit 1
fi

# Verificar .env
if [ ! -f .env ]; then
    echo "❌ Archivo .env no encontrado."
    echo "   Cópialo: cp .env.example .env"
    echo "   Luego edítalo con SECRET_KEY segura"
    exit 1
fi

# Verificar SECRET_KEY
if grep -q "change-me" .env 2>/dev/null; then
    echo "❌ SECRET_KEY no ha sido cambiada en .env"
    echo "   Edita .env y pon una clave segura"
    exit 1
fi

# Crear volúmenes persistentes
mkdir -p data

# Configurar SSL con Let's Encrypt
echo "🔐 Configurando SSL para $DOMAIN..."
if ! docker volume inspect hcourt-nginx_ssl &>/dev/null; then
    docker volume create hcourt-nginx_ssl
fi

# Obtener certificado SSL
docker run --rm \
    -v hcourt-nginx_ssl:/etc/nginx/ssl \
    -p 80:80 \
    certbot/certbot \
    certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" || echo "⚠️  Certbot falló. Asegúrate de que el dominio apunte a este servidor."

# Construir y levantar
echo "🏗️  Construyendo imágenes..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

echo "⬆️  Levantando servicios..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

echo ""
echo "=========================================="
echo "  ✅ Deploy completado!"
echo ""
echo "  🌐 https://$DOMAIN"
echo ""
echo "  🔐 Credenciales:"
echo "     Usuario: admin"
echo "     Password: admin123"
echo ""
echo "  ⚠️  CAMBIA LA CONTRASEÑA después del primer ingreso"
echo "=========================================="
echo ""
echo "📖 Comandos útiles:"
echo "   Logs:       docker compose -p $PROJECT_NAME logs -f"
echo "   Reiniciar:  docker compose -p $PROJECT_NAME restart"
echo "   Detener:    docker compose -p $PROJECT_NAME down"
echo "   Actualizar: git pull && $0 $DOMAIN $EMAIL"
