import { Request, Response } from 'express';
import { authenticate, getProveedorId } from '../auth/auth';

export const login = async (req: Request, res: Response) => {
  try {
    const { proveedorId, password } = req.body;

    if (!proveedorId || !password) {
      return res.status(400).json({ 
        error: 'ID de proveedor y contraseña son requeridos' 
      });
    }

    const authProveedorId = getProveedorId(proveedorId, password);

    if (!authProveedorId) {
      return res.status(401).json({ 
        error: 'Credenciales inválidas' 
      });
    }

    // En un sistema sin JWT, simplemente devolvemos el ID del proveedor
    res.json({ 
      success: true,
      proveedorId: authProveedorId,
      message: 'Login exitoso'
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
