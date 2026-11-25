import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
import { hasProgram } from 'routes/PermissionRoute';

export const buildShortcuts = (permissions, isAdmin) => {
  const requester = isAdmin || hasProgram(permissions, 55, 1, 1);
  const history = isAdmin || hasProgram(permissions, 55, 5, 6);
  const casino = hasProgram(permissions, 55, 1, 10);
  const children = [];
  if (isAdmin)
    children.push({
      id: 'admin-dashboard',
      title: 'Dashboard administrativo',
      type: 'item',
      url: '/dashboard/default',
      icon: DashboardOutlined
    });
  if (requester)
    children.push({
      id: 'my-dashboard',
      title: 'Dashboard de mis pedidos',
      type: 'item',
      url: '/dashboard/mis-pedidos',
      icon: DashboardOutlined
    });
  if (casino)
    children.push({
      id: 'casino-dashboard',
      title: 'Dashboard del casino',
      type: 'item',
      url: '/dashboard/casino',
      icon: DashboardOutlined
    });
  if (requester || history)
    children.push({
      id: 'requesting',
      title: 'Pidiendo al casino',
      type: 'collapse',
      icon: ShoppingCartOutlined,
      children: [
        requester
          ? { id: 'shortcut-new-order', title: 'Crear solicitud', type: 'item', url: '/casino/pedidos/nuevo', icon: ShoppingCartOutlined }
          : null,
        history
          ? { id: 'shortcut-history', title: 'Historial de casino', type: 'item', url: '/casino/pedidos/historial', icon: HistoryOutlined }
          : null
      ].filter(Boolean)
    });
  if (casino)
    children.push({
      id: 'receiving',
      title: 'Recepcionando pedidos',
      type: 'collapse',
      icon: UnorderedListOutlined,
      children: [
        { id: 'shortcut-requests', title: 'Aceptar o rechazar', type: 'item', url: '/casino/solicitudes', icon: UnorderedListOutlined }
      ]
    });
  return children.length ? { id: 'navigation-shortcuts', title: 'Navigation', type: 'group', children } : null;
};
