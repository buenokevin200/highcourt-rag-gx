#!/bin/bash
# Script de deploy para HighCourt RAG
# Uso: ./scripts/deploy.sh [dominio.com]
# Ejemplo: ./scripts/deploy.sh jurisprudencia.micorte.gov

set -e

DOMAIN=${1:-localhost}
COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="highcourt-rag"

echo "🚀 Iniciando deploy de HighCourt RAG"
echo "   Dominio: $DOMAIN"
echo ""

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Copiar .env si no existe
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Archivo .env creado desde .env.example"
    echo "⚠️  Ajusta SECRET_KEY y otras variables en .env antes de continuar"
fi

# Crear directorios necesarios
mkdir -p data

# Construir y levantar servicios
echo "🏗️  Construyendo imágenes Docker..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" build

echo "⬆️  Levantando servicios..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d

echo ""
echo "✅ Deploy completado!"
echo ""
echo "📋 Servicios:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   ChromaDB:  http://localhost:8001"
echo ""
echo "🔐 Credenciales por defecto:"
echo "   Usuario: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  Cambia la contraseña de admin después del primer ingreso."
echo ""
echo "📖 Logs: docker compose -p $PROJECT_NAME logs -f"
