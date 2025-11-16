import './style.css';
import { api, OrdenCompra } from './api';

// Estado de la aplicación
let currentProveedorId: number | null = null;

// Elementos del DOM
const loginPage = document.getElementById('login-page')!;
const dashboardPage = document.getElementById('dashboard-page')!;
const loginForm = document.getElementById('login-form') as HTMLFormElement;
const loginError = document.getElementById('login-error')!;
const logoutBtn = document.getElementById('logout-btn')!;
const proveedorInfo = document.getElementById('proveedor-info')!;
const loading = document.getElementById('loading')!;
const errorMessage = document.getElementById('error-message')!;
const ordenesContainer = document.getElementById('ordenes-container')!;
const ordenesTbody = document.getElementById('ordenes-tbody')!;

// Funciones auxiliares
function showError(element: HTMLElement, message: string) {
  element.textContent = message;
  element.classList.add('show');
  setTimeout(() => {
    element.classList.remove('show');
  }, 5000);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('es-AR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getEstadoBadgeClass(estado: string): string {
  if (estado === 'PENDIENTE') return 'estado-pendiente';
  if (estado === 'ACEPTADA') return 'estado-aceptada';
  if (estado === 'RECHAZADA') return 'estado-rechazada';
  return '';
}

function getEstadoText(estado: string): string {
  if (estado === 'PENDIENTE') return 'Pendiente';
  if (estado === 'ACEPTADA') return 'Aceptada';
  if (estado === 'RECHAZADA') return 'Rechazada';
  return estado;
}

// Renderizar órdenes de compra
function renderOrdenes(ordenes: OrdenCompra[]) {
  ordenesTbody.innerHTML = '';

  if (ordenes.length === 0) {
    ordenesTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem;">
          No hay órdenes de compra disponibles
        </td>
      </tr>
    `;
    return;
  }

  ordenes.forEach((orden) => {
    const row = document.createElement('tr');
    const isPendiente = orden.estado_proveedor === 'PENDIENTE';

    row.innerHTML = `
      <td>${orden.id_orden_compra}</td>
      <td>${formatDate(orden.fecha)}</td>
      <td>${formatCurrency(Number(orden.subtotal))}</td>
      <td>${formatCurrency(Number(orden.iva))}</td>
      <td>${formatCurrency(Number(orden.total))}</td>
      <td>
        <span class="estado-badge ${getEstadoBadgeClass(orden.estado_proveedor)}">
          ${getEstadoText(orden.estado_proveedor)}
        </span>
      </td>
      <td>
        <div class="actions">
          ${
            isPendiente
              ? `
            <button class="btn btn-success" data-id="${orden.id_oc_proveedor}" data-action="aceptar">
              Aceptar
            </button>
            <button class="btn btn-danger" data-id="${orden.id_oc_proveedor}" data-action="rechazar">
              Rechazar
            </button>
          `
              : `<span style="color: #999;">-</span>`
          }
        </div>
      </td>
    `;

    ordenesTbody.appendChild(row);
  });

  // Agregar event listeners a los botones
  document.querySelectorAll('.btn-success, .btn-danger').forEach((btn) => {
    btn.addEventListener('click', handleEstadoChange);
  });
}

// Manejar cambio de estado
async function handleEstadoChange(event: Event) {
  const button = event.target as HTMLButtonElement;
  const id = parseInt(button.dataset.id!);
  const action = button.dataset.action!;
  const estado = action === 'aceptar' ? 'ACEPTADA' : 'RECHAZADA';

  if (!currentProveedorId) return;

  try {
    button.disabled = true;
    await api.actualizarEstado(id, estado, currentProveedorId);
    await loadOrdenes();
  } catch (error) {
    showError(errorMessage, (error as Error).message);
  } finally {
    button.disabled = false;
  }
}

// Cargar órdenes de compra
async function loadOrdenes() {
  if (!currentProveedorId) return;

  try {
    loading.style.display = 'block';
    ordenesContainer.style.display = 'none';
    errorMessage.classList.remove('show');

    const response = await api.getOrdenesCompra(currentProveedorId);
    renderOrdenes(response.data);

    loading.style.display = 'none';
    ordenesContainer.style.display = 'block';
  } catch (error) {
    loading.style.display = 'none';
    showError(errorMessage, (error as Error).message);
  }
}

// Manejar login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(loginForm);
  const proveedorId = formData.get('proveedorId') as string;
  const password = formData.get('password') as string;

  try {
    const response = await api.login(proveedorId, password);
    currentProveedorId = response.proveedorId;

    // Cambiar a dashboard
    loginPage.style.display = 'none';
    dashboardPage.style.display = 'block';
    proveedorInfo.textContent = `Proveedor ID: ${currentProveedorId}`;

    // Cargar órdenes
    await loadOrdenes();
  } catch (error) {
    showError(loginError, (error as Error).message);
  }
});

// Manejar logout
logoutBtn.addEventListener('click', () => {
  currentProveedorId = null;
  loginForm.reset();
  loginPage.style.display = 'block';
  dashboardPage.style.display = 'none';
  ordenesTbody.innerHTML = '';
});
