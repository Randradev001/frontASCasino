import { lazy } from 'react';

import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from './ProtectedRoute';
import SecurityAdminRoute from './SecurityAdminRoute';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const SecurityCatalogPage = Loadable(lazy(() => import('pages/seguridad/SecurityCatalogPage')));
const SecurityCompositePage = Loadable(lazy(() => import('pages/seguridad/SecurityCompositePage')));
const UserAssignmentsPage = Loadable(lazy(() => import('pages/seguridad/UserAssignmentsPage')));
const UserAssignmentActionsPage = Loadable(lazy(() => import('pages/seguridad/UserAssignmentActionsPage')));
const PersonasPage = Loadable(lazy(() => import('pages/personas/PersonasPage')));
const PersonaDetailPage = Loadable(lazy(() => import('pages/personas/PersonaDetailPage')));
const NewOrderPage = Loadable(lazy(() => import('pages/casino/NewOrderPage')));
const OrderHistoryPage = Loadable(lazy(() => import('pages/casino/OrderHistoryPage')));

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { path: '/', element: <DashboardDefault /> },
    { path: 'dashboard', children: [{ path: 'default', element: <DashboardDefault /> }] },
    { path: 'personas', element: <PersonasPage /> },
    { path: 'personas/:rut', element: <PersonaDetailPage /> },
    { path: 'casino/pedidos/nuevo', element: <NewOrderPage /> },
    { path: 'casino/pedidos/historial', element: <OrderHistoryPage /> },
    {
      path: 'seguridad/usuarios',
      element: (
        <SecurityAdminRoute>
          <SecurityCatalogPage catalogName="usuarios" />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/roles',
      element: (
        <SecurityAdminRoute>
          <SecurityCompositePage
            catalogs={[
              { name: 'roles', label: 'Roles' },
              { name: 'rolesUsuarios', label: 'Roles por usuario' }
            ]}
          />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/sistemas',
      element: (
        <SecurityAdminRoute>
          <SecurityCatalogPage catalogName="sistemas" />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/modulos',
      element: (
        <SecurityAdminRoute>
          <SecurityCatalogPage catalogName="modulos" />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/programas',
      element: (
        <SecurityAdminRoute>
          <SecurityCompositePage
            catalogs={[
              { name: 'programas', label: 'Programas' },
              { name: 'programaAcciones', label: 'Acciones' }
            ]}
          />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/asignaciones',
      element: (
        <SecurityAdminRoute>
          <UserAssignmentsPage />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/asignaciones/acciones',
      element: (
        <SecurityAdminRoute>
          <UserAssignmentActionsPage />
        </SecurityAdminRoute>
      )
    },
    {
      path: 'seguridad/niveles',
      element: (
        <SecurityAdminRoute>
          <SecurityCatalogPage catalogName="niveles" />
        </SecurityAdminRoute>
      )
    }
  ]
};

export default MainRoutes;
