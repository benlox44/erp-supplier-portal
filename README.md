# Portal de Proveedores ERP

## Inicio

```bash
docker-compose up
```

**Frontend**: http://localhost:5174  
**Backend**: http://localhost:3000

## Credenciales

Resivar .env del backend

## 📊 Flujo de trabajo

1. **Creación de OC**: Cuando una orden de compra en `Compras.compras_oc` cambia su estado a `APROBADA`, el trigger automáticamente crea un registro en `public.oc_proveedores` con un campo de `PENDIENTE_PROVEEDOR`.

2. **Login del proveedor**: El proveedor ingresa con su ID y contraseña.

3. **Visualización**: El proveedor ve todas sus órdenes de compra.

4. **Acción**: El proveedor puede:
   - Aceptar la orden (estado: `ACEPTADA_PROVEEDOR`)
   - Rechazar la orden (estado: `RECHAZADA_PROVEEDOR`)
