import { Router } from 'express';
import { getOrdenesCompra, actualizarEstadoOrden } from '../controllers/ordenesController';

const router = Router();

router.get('/', getOrdenesCompra);
router.put('/:id/estado', actualizarEstadoOrden);

export default router;
