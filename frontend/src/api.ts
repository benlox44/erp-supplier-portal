const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface LoginResponse {
  success: boolean;
  proveedorId: number;
  message: string;
}

export interface OrdenCompra {
  id_oc_proveedor: number;
  id_orden_compra: number;
  id_proveedor: number;
  id_empleado: number;
  fecha: string;
  subtotal: number;
  iva: number;
  total: number;
  estado_proveedor: string;
  fecha_respuesta_proveedor: string | null;
  created_at: string;
}

export interface OrdenesResponse {
  success: boolean;
  data: OrdenCompra[];
}

export interface ActualizarEstadoResponse {
  success: boolean;
  message: string;
  data: OrdenCompra;
}

export const api = {
  async login(proveedorId: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ proveedorId, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en login');
    }

    return response.json();
  },

  async getOrdenesCompra(proveedorId: number): Promise<OrdenesResponse> {
    const response = await fetch(`${API_URL}/ordenes-compra?proveedorId=${proveedorId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error obteniendo órdenes');
    }

    return response.json();
  },

  async actualizarEstado(
    id: number,
    estado: string,
    proveedorId: number
  ): Promise<ActualizarEstadoResponse> {
    const response = await fetch(`${API_URL}/ordenes-compra/${id}/estado`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado, proveedorId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error actualizando estado');
    }

    return response.json();
  },
};
