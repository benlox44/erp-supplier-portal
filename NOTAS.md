# 📝 NOTAS TÉCNICAS - Para Borrar Después

## 🎯 Qué hace este proyecto

Sistema mínimo para que proveedores acepten/rechacen órdenes de compra del ERP.

## 🏗️ Arquitectura

```
Frontend (Vite + TypeScript) ←→ Backend (Express + TypeScript) ←→ PostgreSQL (Neon)
```

## 🗄️ Base de Datos

### Conexión (en .env)
```
DB_HOST=ep-royal-glade-ac55fitc-pooler.sa-east-1.aws.neon.tech
DB_NAME=neondb
DB_USER=neondb_owner
DB_PASSWORD=npg_V58gYFmBOPda
DB_PORT=5432
DB_SSL=true
```

### Tabla Principal: `public.oc_proveedores`

Creada automáticamente por el trigger cuando una OC es aprobada.

```sql
CREATE TABLE public.oc_proveedores (
    id_oc_proveedor SERIAL PRIMARY KEY,
    id_orden_compra INTEGER UNIQUE,
    id_proveedor INTEGER,
    fecha TIMESTAMP,
    subtotal NUMERIC(10,2),
    iva NUMERIC(10,2),
    total NUMERIC(10,2),
    estado_proveedor VARCHAR(50),  -- PENDIENTE, ACEPTADA, RECHAZADA
    fecha_respuesta_proveedor TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Trigger Automático

Cuando `Compras.compras_oc.estado_estandar` = `'APROBADA'` → Se crea registro en `oc_proveedores`

Ubicación del SQL: `backend/src/db/schema.sql`

## 🔐 Login Simple (sin JWT)

Las credenciales están en `.env`:

```env
LOGIN_PROVEEDOR_1=1:proveedor123
LOGIN_PROVEEDOR_2=2:proveedor456
# etc...
```

Validación en: `backend/src/auth/auth.ts`

## 📡 Endpoints del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/auth/login` | Login |
| GET | `/api/ordenes-compra?proveedorId={id}` | Obtener órdenes |
| PUT | `/api/ordenes-compra/:id/estado` | Actualizar estado |

### Ejemplos de uso:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"proveedorId":"1","password":"proveedor123"}'

# Ver órdenes
curl http://localhost:3000/api/ordenes-compra?proveedorId=1

# Aceptar orden
curl -X PUT http://localhost:3000/api/ordenes-compra/1/estado \
  -H "Content-Type: application/json" \
  -d '{"estado":"ACEPTADA","proveedorId":1}'
```

## 🔄 Flujo Completo

```
1. Jefe de Compras aprueba OC en ERP
   └─→ UPDATE Compras.compras_oc SET estado_estandar = 'APROBADA'

2. Trigger se activa automáticamente
   └─→ INSERT INTO public.oc_proveedores con estado = 'PENDIENTE'

3. Proveedor hace login
   └─→ POST /api/auth/login

4. Proveedor ve sus órdenes
   └─→ GET /api/ordenes-compra?proveedorId=1

5. Proveedor acepta/rechaza
   └─→ PUT /api/ordenes-compra/:id/estado
   └─→ Estado cambia a ACEPTADA o RECHAZADA
```

## 🐳 Docker

### Estructura
```
backend/Dockerfile       → Node.js dev mode (hot-reload)
frontend/Dockerfile      → Vite dev server (hot-reload)
docker-compose.yml       → Orquesta ambos + network
```

### Comandos útiles

```bash
# Iniciar
docker-compose up

# Iniciar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Detener
docker-compose down

# Reconstruir
docker-compose up --build

# Ver estado
docker-compose ps

# Shell en backend
docker-compose exec backend sh

# Shell en frontend
docker-compose exec frontend sh
```

## 📁 Estructura de Archivos Importantes

```
erp-supplier-portal/
├── docker-compose.yml           # Configuración Docker
├── .env                         # Variables de entorno
├── setup-db.sh                  # Script para crear tabla/trigger
├── README.md                    # Documentación para usuarios
├── NOTAS.md                     # Este archivo (BORRAR DESPUÉS)
│
├── backend/
│   ├── Dockerfile               # Imagen Docker
│   ├── .env                     # Variables locales
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Entry point
│       ├── auth/
│       │   └── auth.ts          # Login simple
│       ├── controllers/
│       │   ├── authController.ts
│       │   └── ordenesController.ts
│       ├── routes/
│       │   ├── authRoutes.ts
│       │   └── ordenesRoutes.ts
│       └── db/
│           ├── connection.ts    # Pool PostgreSQL
│           ├── schema.sql       # Tabla + Trigger ⭐
│           └── test-queries.sql # Queries de prueba
│
└── frontend/
    ├── Dockerfile               # Imagen Docker
    ├── .env                     # URL del API
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html               # SPA
    └── src/
        ├── main.ts              # Lógica principal
        ├── api.ts               # Cliente REST
        ├── style.css            # Estilos
        └── vite-env.d.ts        # Types
```

## 🧪 Testing Manual

### 1. Verificar que Docker está corriendo

```bash
docker-compose ps
```

### 2. Health check

```bash
curl http://localhost:3000/health
# Debe retornar: {"status":"OK","message":"Server is running"}
```

### 3. Crear una OC de prueba en la BD

```sql
-- Cambiar una OC existente a APROBADA
UPDATE "Compras".compras_oc 
SET estado_estandar = 'APROBADA' 
WHERE id_orden_compra = 32;  -- Cambiar por un ID real

-- Verificar que se creó en oc_proveedores
SELECT * FROM public.oc_proveedores 
WHERE id_orden_compra = 32;
```

### 4. Usar el frontend

1. Abrir http://localhost:5173
2. Login: ID `1`, Password `proveedor123`
3. Ver órdenes pendientes
4. Aceptar o Rechazar

## 🔧 Solución de Problemas

### Puerto ocupado

```bash
# Ver qué usa el puerto
lsof -i :3000
lsof -i :5173

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Backend
  - "5174:5173"  # Frontend
```

### Error de conexión a BD

1. Verificar credenciales en `.env`
2. Verificar conexión a internet
3. Ejecutar `./setup-db.sh`

### Hot-reload no funciona

```bash
# Reiniciar contenedores
docker-compose restart
```

### Ver logs de errores

```bash
# Backend
docker-compose logs backend | grep -i error

# Frontend
docker-compose logs frontend | grep -i error
```

## 📊 Queries Útiles (test-queries.sql)

```sql
-- Ver todas las órdenes para proveedores
SELECT * FROM public.oc_proveedores 
ORDER BY fecha DESC;

-- Ver órdenes de un proveedor específico
SELECT * FROM public.oc_proveedores 
WHERE id_proveedor = 1;

-- Ver órdenes pendientes
SELECT * FROM public.oc_proveedores 
WHERE estado_proveedor = 'PENDIENTE';

-- Simular aceptación (testing sin frontend)
UPDATE public.oc_proveedores
SET estado_proveedor = 'ACEPTADA',
    fecha_respuesta_proveedor = NOW()
WHERE id_oc_proveedor = 1;
```

## 🎓 Tecnologías Usadas

**Backend:**
- Node.js 20
- Express.js
- TypeScript
- PostgreSQL (pg)
- dotenv
- cors

**Frontend:**
- Vite
- TypeScript
- CSS Vanilla
- Fetch API

**Infraestructura:**
- Docker
- Docker Compose

## ⚠️ Limitaciones (es un proyecto de práctica)

- ❌ Login sin JWT (solo validación con .env)
- ❌ Sin hash de contraseñas
- ❌ Sin manejo de sesiones
- ❌ Sin paginación
- ❌ Sin tests automatizados
- ❌ Sin validación avanzada de datos
- ❌ Sin rate limiting
- ❌ Sin logs estructurados

## ✅ Checklist de Uso

- [ ] Docker instalado
- [ ] Clonar repo
- [ ] Configurar `.env` (ya está con credenciales)
- [ ] Ejecutar `./setup-db.sh` (crear tabla/trigger)
- [ ] Ejecutar `docker-compose up`
- [ ] Abrir http://localhost:5173
- [ ] Login con proveedor 1
- [ ] ¡Listo!

---

**🗑️ RECORDATORIO: Borrar este archivo cuando termines el proyecto**
