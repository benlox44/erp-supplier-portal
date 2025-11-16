import dotenv from 'dotenv';

dotenv.config();

interface LoginCredentials {
  [key: string]: string;
}

// Cargar credenciales desde .env
const loadCredentials = (): LoginCredentials => {
  const credentials: LoginCredentials = {};
  
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('LOGIN_PROVEEDOR_')) {
      const value = process.env[key];
      if (value) {
        const [proveedorId, password] = value.split(':');
        credentials[proveedorId] = password;
      }
    }
  });
  
  return credentials;
};

const credentials = loadCredentials();

export const authenticate = (proveedorId: string, password: string): boolean => {
  return credentials[proveedorId] === password;
};

export const getProveedorId = (proveedorId: string, password: string): number | null => {
  if (authenticate(proveedorId, password)) {
    return parseInt(proveedorId);
  }
  return null;
};
