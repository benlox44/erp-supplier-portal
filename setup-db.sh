#!/bin/bash

# ============================================================================
# SETUP DE BASE DE DATOS - Portal de Proveedores ERP
# ============================================================================
# 
# PROPÓSITO:
#   Este script configura la base de datos PostgreSQL para el portal de 
#   proveedores, creando la tabla y trigger necesarios para el sistema.
#
# QUÉ HACE:
#   1. Crea la tabla 'public.oc_proveedores' para almacenar órdenes de compra
#   2. Crea un trigger que automáticamente copia OCs cuando son APROBADAS
#   3. Crea la función PostgreSQL que ejecuta el trigger
#
# CUÁNDO EJECUTAR:
#   - Solo UNA vez, antes del primer 'docker-compose up'
#   - Si ya fue ejecutado, no es necesario volver a ejecutarlo
#
# CÓMO EJECUTAR:
#   chmod +x setup-db.sh
#   ./setup-db.sh
#
# REQUISITOS:
#   - PostgreSQL client (psql) instalado
#   - Conexión a internet (base de datos en Neon)
#
# DESPUÉS DE EJECUTAR:
#   Puedes borrar este archivo si quieres, el trigger queda permanente en la BD
#
# ============================================================================

echo "============================================================================"
echo "🗄️  CONFIGURACIÓN DE BASE DE DATOS - Portal de Proveedores"
echo "============================================================================"
echo ""

# Verificar si psql está instalado
if ! command -v psql &> /dev/null
then
    echo "❌ Error: PostgreSQL client (psql) no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  • Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  • macOS: brew install postgresql"
    echo "  • Windows: Descarga desde https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

# Variables de conexión a la base de datos
DB_HOST="ep-royal-glade-ac55fitc-pooler.sa-east-1.aws.neon.tech"
DB_NAME="neondb"
DB_USER="neondb_owner"
DB_PASSWORD="npg_V58gYFmBOPda"
DB_PORT="5432"

echo "📋 Configuración:"
echo "   Host: $DB_HOST"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"
echo ""
echo "Ejecutando configuración..."
echo ""

# SQL embebido en el script (no necesita archivos externos)
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -p "$DB_PORT" <<'EOF'

-- ============================================================================
-- ELIMINAR TABLA ANTERIOR (si existe)
-- ============================================================================
DROP TABLE IF EXISTS public.oc_proveedores CASCADE;

-- ============================================================================
-- TABLA: oc_proveedores
-- ============================================================================
-- Almacena las órdenes de compra que los proveedores pueden aceptar/rechazar

CREATE TABLE public.oc_proveedores (
    id_oc_proveedor SERIAL PRIMARY KEY,
    id_orden_compra INTEGER NOT NULL,
    id_proveedor INTEGER NOT NULL,
    id_empleado INTEGER NOT NULL,
    fecha TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    iva NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    estado_proveedor VARCHAR(50) DEFAULT 'PENDIENTE',
    fecha_respuesta_proveedor TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_orden_compra)
);

-- ============================================================================
-- FUNCIÓN: crear_oc_para_proveedor()
-- ============================================================================
-- Se ejecuta automáticamente cuando el trigger se activa

CREATE OR REPLACE FUNCTION crear_oc_para_proveedor()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actuar si el estado cambia a 'APROBADA'
    IF NEW.estado = 'APROBADA' AND (OLD.estado IS NULL OR OLD.estado != 'APROBADA') THEN
        -- Insertar en oc_proveedores si no existe ya
        INSERT INTO public.oc_proveedores (
            id_orden_compra,
            id_proveedor,
            id_empleado,
            fecha,
            subtotal,
            iva,
            total,
            estado_proveedor
        )
        VALUES (
            NEW.id_orden_compra,
            NEW.id_proveedor,
            NEW.id_empleado,
            NEW.fecha,
            NEW.subtotal,
            NEW.iva,
            NEW.total,
            'PENDIENTE'
        )
        ON CONFLICT (id_orden_compra) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: trigger_crear_oc_proveedor
-- ============================================================================
-- Se activa cuando una OC cambia a estado APROBADA

DROP TRIGGER IF EXISTS trigger_crear_oc_proveedor ON "Compras".compras_oc;

CREATE TRIGGER trigger_crear_oc_proveedor
    AFTER INSERT OR UPDATE ON "Compras".compras_oc
    FOR EACH ROW
    EXECUTE FUNCTION crear_oc_para_proveedor();

-- ============================================================================
-- ÍNDICES (para mejorar rendimiento)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_oc_proveedores_proveedor ON public.oc_proveedores(id_proveedor);
CREATE INDEX IF NOT EXISTS idx_oc_proveedores_estado ON public.oc_proveedores(estado_proveedor);

EOF

# Verificar resultado
if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================================"
    echo "✅ ¡CONFIGURACIÓN EXITOSA!"
    echo "============================================================================"
    echo ""
    echo "Se creó correctamente:"
    echo "  ✓ Tabla: public.oc_proveedores"
    echo "  ✓ Función: crear_oc_para_proveedor()"
    echo "  ✓ Trigger: trigger_crear_oc_proveedor"
    echo "  ✓ Índices de rendimiento"
    echo ""
    echo "📌 El trigger ahora está activo y funcionará automáticamente cuando"
    echo "   una orden de compra cambie a estado 'APROBADA'"
    echo ""
    echo "🚀 Siguiente paso: docker-compose up"
    echo ""
    echo "💡 Opcional: Puedes borrar este script ahora (rm setup-db.sh)"
    echo "   El trigger queda permanente en la base de datos"
    echo ""
    echo "============================================================================"
else
    echo ""
    echo "============================================================================"
    echo "❌ ERROR EN LA CONFIGURACIÓN"
    echo "============================================================================"
    echo ""
    echo "Posibles causas:"
    echo "  • No hay conexión a internet"
    echo "  • Credenciales de base de datos incorrectas"
    echo "  • Firewall bloqueando la conexión"
    echo ""
    echo "Contacta al administrador de la base de datos si el problema persiste"
    echo ""
    echo "============================================================================"
    exit 1
fi
