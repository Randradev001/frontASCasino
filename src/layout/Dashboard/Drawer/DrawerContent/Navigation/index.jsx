import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useAuth } from 'contexts/AuthContext';
import { buildAuthorizedMenu } from 'menu-items/authorizedMenu';
import { buildShortcuts } from 'menu-items/shortcuts';
import seguridad from 'menu-items/seguridad';
import NavGroup from './NavGroup';

export default function Navigation() {
  const { menu, session } = useAuth();
  const menuItems = useMemo(
    () =>
      [
        buildShortcuts(session?.permissions, session?.security?.canManage),
        buildAuthorizedMenu(menu, session?.security?.canManage),
        session?.security?.canManage ? seguridad : null
      ].filter(Boolean),
    [menu, session?.permissions, session?.security?.canManage]
  );

  const navGroups = menuItems.map((item) => {
    if (item.type === 'group') return <NavGroup key={item.id} item={item} />;

    return (
      <Typography key={item.id} variant="h6" color="error" align="center">
        Fix - Navigation Group
      </Typography>
    );
  });

  return <Box sx={{ pt: 2 }}>{navGroups}</Box>;
}
