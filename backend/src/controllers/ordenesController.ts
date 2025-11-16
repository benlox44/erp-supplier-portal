import { Request, Response } from 'express';
import pool from '../db/connection';

export const getOrdenesCompra = async (req: Request, res: Response) => {
  try {
    const { proveedorId } = req.query;

    if (!proveedorId) {
      return res.status(400).json({ 
        error: 'ID de proveedor es requerido' 
      });
    }

    const query = `
      SELECT 
        oc.id_oc_proveedor,
        oc.id_orden_compra,
        oc.id_proveedor,
        oc.id_empleado,
        oc.fecha,
        oc.subtotal,
        oc.iva,
        oc.total,
        oc.estado_proveedor,
        oc.fecha_respuesta_proveedor,
        oc.created_at
      FROM public.oc_proveedores oc
      WHERE oc.id_proveedor = $1
      ORDER BY oc.fecha DESC
    `;

    const result = await pool.query(query, [proveedorId]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error obteniendo órdenes de compra:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarEstadoOrden = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, proveedorId } = req.body;

    if (!estado || !proveedorId) {
      return res.status(400).json({ 
        error: 'Estado y ID de proveedor son requeridos' 
      });
    }

    // Validar que el estado sea válido
    const estadosValidos = ['ACEPTADA', 'RECHAZADA'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser ACEPTADA o RECHAZADA' 
      });
    }

    // Verificar que la orden pertenece al proveedor
    const verificarQuery = `
      SELECT id_oc_proveedor 
      FROM public.oc_proveedores 
      WHERE id_oc_proveedor = $1 AND id_proveedor = $2
    `;
    const verificarResult = await pool.query(verificarQuery, [id, proveedorId]);

    if (verificarResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Orden de compra no encontrada o no pertenece al proveedor' 
      });
    }

    // Actualizar el estado
    const updateQuery = `
      UPDATE public.oc_proveedores 
      SET estado_proveedor = $1, fecha_respuesta_proveedor = NOW()
      WHERE id_oc_proveedor = $2 AND id_proveedor = $3
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [estado, id, proveedorId]);

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estado de orden:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
