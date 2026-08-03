import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

export default function SecurityAdminRoute({ children }) {
  const { session } = useAuth();
  if (!session?.security?.canManage) return <Navigate to="/dashboard/default" replace />;
  return children;
}

SecurityAdminRoute.propTypes = { children: PropTypes.node.isRequired };
