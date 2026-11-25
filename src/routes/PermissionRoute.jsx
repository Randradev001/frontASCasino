import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

export const hasProgram = (permissions, system, module, program) =>
  (permissions?.programas || []).some(
    (item) => Number(item.SistCod) === system && Number(item.Modcod) === module && Number(item.ProgCod) === program
  );

export default function PermissionRoute({ children, system, module, program, admin = false }) {
  const { session, permissions } = useAuth();
  const allowed = admin ? session?.security?.canManage : hasProgram(permissions, system, module, program);
  return allowed ? children : <Navigate to="/" replace />;
}

PermissionRoute.propTypes = {
  children: PropTypes.node.isRequired,
  system: PropTypes.number,
  module: PropTypes.number,
  program: PropTypes.number,
  admin: PropTypes.bool
};
