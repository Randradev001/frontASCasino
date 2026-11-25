import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import { hasProgram } from './PermissionRoute';

export default function HomeRoute() {
  const { session, permissions } = useAuth();
  if (session?.security?.canManage) return <Navigate to="/dashboard/default" replace />;
  if (hasProgram(permissions, 55, 1, 10)) return <Navigate to="/dashboard/casino" replace />;
  if (hasProgram(permissions, 55, 1, 1)) return <Navigate to="/dashboard/mis-pedidos" replace />;
  return <Navigate to="/personas" replace />;
}
