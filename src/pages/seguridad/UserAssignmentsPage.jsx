import { useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import KeyOutlined from '@ant-design/icons/KeyOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import UserAddOutlined from '@ant-design/icons/UserAddOutlined';
import UserDeleteOutlined from '@ant-design/icons/UserDeleteOutlined';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

import MainCard from 'components/MainCard';
import {
  deleteSecurityCatalog,
  getRolePermissions,
  getUserAssignments,
  getUserRoles,
  insertSecurityCatalog,
  listSecurityCatalog
} from 'api/seguridadCatalogosApi';
import RolePermissionsDialog from './RolePermissionsDialog';
import UserSystemAssignmentsDialog from './UserSystemAssignmentsDialog';

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const roleProgramKey = (row) => [row.SistCod, row.Modcod, row.ProgCod].join('|');

// En GX el rol se arma por programas; sistemas y módulos son el resumen de esa selección.
const buildRoleSummary = (permissions) => {
  if (!permissions) return null;

  const selectedPrograms = new Set((permissions.selected?.programs || []).map(roleProgramKey));
  const selectedRows = (permissions.programs || []).filter((program) => selectedPrograms.has(roleProgramKey(program)));
  const selectedModuleKeys = new Set(selectedRows.map((program) => [program.SistCod, program.Modcod].join('|')));

  const systems = (permissions.systems || []).map((system) => {
    const systemModules = (permissions.modules || []).filter((module) => String(module.SistCod) === String(system.SistCod));
    const systemPrograms = (permissions.programs || []).filter((program) => String(program.SistCod) === String(system.SistCod));
    const assignedPrograms = systemPrograms.filter((program) => selectedPrograms.has(roleProgramKey(program))).length;
    const assignedModules = systemModules.filter((module) => selectedModuleKeys.has([module.SistCod, module.Modcod].join('|'))).length;

    return {
      ...system,
      assigned: assignedPrograms > 0,
      assignedModules,
      assignedPrograms,
      totalModules: systemModules.length,
      totalPrograms: systemPrograms.length
    };
  });

  return {
    role: permissions.role,
    assignedUsers: Number(permissions.assignedUsers || 0),
    systems,
    totals: {
      systems: systems.filter((system) => system.assigned).length,
      modules: selectedModuleKeys.size,
      programs: selectedRows.length
    }
  };
};

const normalizeRole = (role) => ({
  ...role,
  ROLCod: String(role.ROLCod || '').trim(),
  ROLNombre: String(role.ROLNombre || '').trim()
});

export default function UserAssignmentsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const login = String(searchParams.get('usuario') || '')
    .trim()
    .toUpperCase();
  const requestedRoleCode = String(searchParams.get('rol') || '')
    .trim()
    .toUpperCase();
  const [systemSearch, setSystemSearch] = useState('');
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [roleToAdd, setRoleToAdd] = useState(null);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const usersQuery = useQuery({
    queryKey: ['gx-seguridad', 'usuarios', 'assignment-options'],
    queryFn: () => listSecurityCatalog('usuarios', { limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  const users = usersQuery.data?.data || [];
  const selectedUser = users.find((user) => String(user.UsuLogin).trim().toUpperCase() === login) || null;

  const userRolesQuery = useQuery({
    queryKey: ['gx-seguridad', 'user-roles', login],
    queryFn: () => getUserRoles(login),
    enabled: Boolean(login),
    refetchOnMount: 'always'
  });
  const userRoles = userRolesQuery.data?.data;
  const assignedRoles = useMemo(
    () => (userRoles?.roles || []).filter((role) => Boolean(role.assigned)).map(normalizeRole),
    [userRoles?.roles]
  );
  const availableRoles = useMemo(() => (userRoles?.roles || []).filter((role) => !role.assigned).map(normalizeRole), [userRoles?.roles]);
  const activeRole = assignedRoles.find((role) => role.ROLCod.toUpperCase() === requestedRoleCode) || null;
  const activeRoleCode = activeRole?.ROLCod || '';
  const isRoleView = Boolean(activeRoleCode);
  const activeUser = selectedUser || userRoles?.user || null;

  const assignmentsQuery = useQuery({
    queryKey: ['gx-seguridad', 'user-assignments', login],
    queryFn: () => getUserAssignments(login),
    enabled: Boolean(login) && !isRoleView
  });
  const rolePermissionsQuery = useQuery({
    queryKey: ['gx-seguridad', 'role-permissions', activeRoleCode],
    queryFn: () => getRolePermissions(activeRoleCode),
    enabled: isRoleView
  });

  const userAssignments = assignmentsQuery.data?.data;
  const roleSummary = useMemo(() => buildRoleSummary(rolePermissionsQuery.data?.data), [rolePermissionsQuery.data?.data]);
  const activeAssignments = isRoleView ? roleSummary : userAssignments;
  const activeQuery = isRoleView ? rolePermissionsQuery : assignmentsQuery;
  const roleTotals = userRoles?.totals || {};

  const rows = useMemo(() => {
    const term = systemSearch.trim().toLowerCase();
    return (activeAssignments?.systems || []).filter(
      (system) => !term || (String(system.SistCod) + ' ' + String(system.SistNombre || '')).toLowerCase().includes(term)
    );
  }, [activeAssignments?.systems, systemSearch]);

  const columns = useMemo(
    () => [
      { field: 'SistCod', headerName: 'Código', width: 90 },
      { field: 'SistNombre', headerName: 'Sistema', flex: 1, minWidth: 210 },
      {
        field: 'assigned',
        headerName: 'Estado',
        width: 125,
        renderCell: (params) => (
          <Chip
            size="small"
            color={params.value ? 'success' : 'default'}
            label={params.value ? (isRoleView ? 'Configurado' : 'Asignado') : 'Sin asignar'}
          />
        )
      },
      {
        field: 'assignedModules',
        headerName: 'Módulos',
        width: 130,
        renderCell: (params) => (
          <Button size="small" variant="text" onClick={() => setSelectedSystem(params.row)}>
            {Number(params.value || 0) + ' de ' + Number(params.row.totalModules || 0)}
          </Button>
        )
      },
      {
        field: 'assignedPrograms',
        headerName: 'Programas',
        width: 140,
        renderCell: (params) => (
          <Button size="small" variant="text" onClick={() => setSelectedSystem(params.row)}>
            {Number(params.value || 0) + ' de ' + Number(params.row.totalPrograms || 0)}
          </Button>
        )
      },
      {
        field: 'actions',
        headerName: 'Acciones',
        width: 145,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Button size="small" startIcon={<SafetyCertificateOutlined />} onClick={() => setSelectedSystem(params.row)}>
            Administrar
          </Button>
        )
      }
    ],
    [isRoleView]
  );

  const refreshRoleAssignments = async () => {
    await queryClient.invalidateQueries({ queryKey: ['gx-seguridad', 'user-roles'] });
    await queryClient.invalidateQueries({ queryKey: ['gx-seguridad', 'rolesUsuarios'] });
    await queryClient.invalidateQueries({ queryKey: ['gx-seguridad', 'roles'] });
  };

  const assignRoleMutation = useMutation({
    mutationFn: (role) => insertSecurityCatalog('rolesUsuarios', { UsuLogin: login, ROLCod: role.ROLCod }),
    onSuccess: async (data, role) => {
      setRoleToAdd(null);
      await refreshRoleAssignments();
      setSearchParams({ usuario: login, rol: role.ROLCod });
      setSnackbar({ open: true, message: data?.message || 'Rol asignado correctamente', severity: 'success' });
    },
    onError: (error) => setSnackbar({ open: true, message: getErrorMessage(error, 'No fue posible asignar el rol'), severity: 'error' })
  });

  const removeRoleMutation = useMutation({
    mutationFn: (role) => deleteSecurityCatalog('rolesUsuarios', { UsuLogin: login, ROLCod: role.ROLCod }),
    onSuccess: async (data) => {
      setRoleToRemove(null);
      setSelectedSystem(null);
      setSystemSearch('');
      setSearchParams({ usuario: login });
      await refreshRoleAssignments();
      setSnackbar({ open: true, message: data?.message || 'Rol quitado correctamente', severity: 'success' });
    },
    onError: (error) => {
      setRoleToRemove(null);
      setSnackbar({ open: true, message: getErrorMessage(error, 'No fue posible quitar el rol'), severity: 'error' });
    }
  });

  const selectUser = (user) => {
    setSelectedSystem(null);
    setRoleToAdd(null);
    setRoleToRemove(null);
    setSystemSearch('');
    setSearchParams(user ? { usuario: String(user.UsuLogin).trim() } : {});
  };

  const selectView = (event, value) => {
    setSelectedSystem(null);
    setSystemSearch('');
    setSearchParams(value === 'directos' ? { usuario: login } : { usuario: login, rol: value });
  };

  const busyRoleChange = assignRoleMutation.isPending || removeRoleMutation.isPending;
  const activeTitle = isRoleView
    ? activeRole.ROLCod + ' - ' + activeRole.ROLNombre
    : activeUser
      ? String(activeUser.UsuLogin).trim() + ' - Permisos directos'
      : '';

  return (
    <MainCard title="Asignación de accesos">
      <Stack spacing={1.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }}>
          <Autocomplete
            fullWidth
            size="small"
            options={users}
            value={selectedUser}
            loading={usersQuery.isLoading}
            getOptionLabel={(option) => String(option.UsuLogin || '').trim() + ' - ' + String(option.Usunom || '').trim()}
            isOptionEqualToValue={(option, value) => String(option.UsuLogin).trim() === String(value.UsuLogin).trim()}
            onChange={(event, value) => selectUser(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Usuario"
                placeholder="Buscar por usuario o nombre"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {usersQuery.isLoading ? <CircularProgress color="inherit" size={18} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }
                }}
              />
            )}
          />
          {login && (
            <Button
              component={RouterLink}
              to="/seguridad/asignaciones/acciones"
              variant="outlined"
              startIcon={<KeyOutlined />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Acciones
            </Button>
          )}
        </Stack>

        {!login && <Alert severity="info">Seleccione un usuario para consultar sus permisos directos y roles.</Alert>}

        {userRolesQuery.isError && (
          <Alert severity="error">{getErrorMessage(userRolesQuery.error, 'No fue posible consultar los roles del usuario')}</Alert>
        )}

        {login && userRolesQuery.isLoading && (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={28} />
          </Stack>
        )}

        {login && userRoles && (
          <>
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1} alignItems={{ lg: 'center' }}>
              <Tabs
                value={isRoleView ? activeRoleCode : 'directos'}
                onChange={selectView}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Permisos directos y roles del usuario"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  minHeight: 38,
                  '& .MuiTab-root': { minHeight: 38, py: 0.5, px: 1.5 }
                }}
              >
                <Tab value="directos" icon={<KeyOutlined />} iconPosition="start" label="Directos" />
                {assignedRoles.map((role) => (
                  <Tab
                    key={role.ROLCod}
                    value={role.ROLCod}
                    label={
                      <Tooltip title={role.ROLNombre || role.ROLCod}>
                        <span>{role.ROLCod}</span>
                      </Tooltip>
                    }
                  />
                ))}
              </Tabs>

              <Stack direction="row" spacing={0.75} alignItems="center">
                <Autocomplete
                  size="small"
                  options={availableRoles}
                  value={roleToAdd}
                  disabled={busyRoleChange || availableRoles.length === 0}
                  getOptionLabel={(option) => option.ROLCod + ' - ' + option.ROLNombre}
                  isOptionEqualToValue={(option, value) => option.ROLCod === value.ROLCod}
                  onChange={(event, value) => setRoleToAdd(value)}
                  renderInput={(params) => <TextField {...params} label="Agregar rol" />}
                  sx={{ width: { xs: 220, sm: 280 } }}
                />
                <Tooltip title="Asignar rol">
                  <span>
                    <IconButton
                      color="primary"
                      disabled={!roleToAdd || busyRoleChange}
                      onClick={() => assignRoleMutation.mutate(roleToAdd)}
                      aria-label="Asignar rol seleccionado"
                    >
                      <UserAddOutlined />
                    </IconButton>
                  </span>
                </Tooltip>
                {isRoleView && (
                  <Tooltip title="Quitar este rol del usuario">
                    <span>
                      <IconButton
                        color="error"
                        disabled={busyRoleChange}
                        onClick={() => setRoleToRemove(activeRole)}
                        aria-label={'Quitar rol ' + activeRole.ROLCod}
                      >
                        <UserDeleteOutlined />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip size="small" color="primary" variant="outlined" label={assignedRoles.length + ' roles asignados'} />
              <Chip size="small" variant="outlined" label={Number(roleTotals.directSystems || 0) + ' sistemas directos'} />
              <Chip size="small" variant="outlined" label={Number(roleTotals.directPrograms || 0) + ' programas directos'} />
            </Stack>
          </>
        )}

        {activeQuery.isLoading && login && (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={30} />
          </Stack>
        )}

        {activeQuery.isError && (
          <Alert severity="error">
            {getErrorMessage(
              activeQuery.error,
              isRoleView ? 'No fue posible cargar la plantilla del rol' : 'No fue posible cargar las asignaciones del usuario'
            )}
          </Alert>
        )}

        {activeAssignments && (
          <Stack spacing={1.25}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} alignItems={{ md: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="h5">{activeTitle}</Typography>
                <Chip size="small" color="primary" label={Number(activeAssignments.totals.systems || 0) + ' sistemas'} />
                <Chip size="small" variant="outlined" label={Number(activeAssignments.totals.modules || 0) + ' módulos'} />
                <Chip size="small" variant="outlined" label={Number(activeAssignments.totals.programs || 0) + ' programas'} />
                {isRoleView && (
                  <Chip
                    size="small"
                    color="secondary"
                    variant="outlined"
                    label={Number(activeAssignments.assignedUsers || 0) + ' usuarios'}
                  />
                )}
              </Stack>
              <TextField
                size="small"
                label="Buscar sistema"
                value={systemSearch}
                onChange={(event) => setSystemSearch(event.target.value)}
                slotProps={{ input: { startAdornment: <SearchOutlined style={{ marginRight: 8 }} /> } }}
                sx={{ minWidth: { md: 260 } }}
              />
            </Stack>

            {isRoleView && Number(activeAssignments.totals.programs || 0) === 0 && (
              <Alert severity="info">
                Este rol aún no tiene una plantilla homologada en CONEX. Los permisos actuales del usuario permanecen disponibles en la
                pestaña Directos.
              </Alert>
            )}
            {isRoleView && Number(activeAssignments.totals.programs || 0) > 0 && (
              <Alert severity="warning">
                Los cambios en esta plantilla afectan a todos los usuarios asociados al rol. Sus permisos directos se conservarán.
              </Alert>
            )}

            <Box sx={{ height: 430, width: '100%' }}>
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => row.SistCod}
                onRowDoubleClick={(params) => setSelectedSystem(params.row)}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
                rowHeight={44}
                columnHeaderHeight={42}
                disableRowSelectionOnClick
              />
            </Box>
          </Stack>
        )}
      </Stack>

      <UserSystemAssignmentsDialog
        open={!isRoleView && Boolean(selectedSystem)}
        login={login}
        system={selectedSystem}
        onClose={() => setSelectedSystem(null)}
        onSaved={() => assignmentsQuery.refetch()}
        onNotify={(message, severity) => setSnackbar({ open: true, message, severity })}
      />

      <RolePermissionsDialog
        open={isRoleView && Boolean(selectedSystem)}
        role={activeRole}
        initialSystemCode={selectedSystem?.SistCod}
        onClose={() => setSelectedSystem(null)}
        onNotify={(message, severity) => setSnackbar({ open: true, message, severity })}
      />

      <Dialog open={Boolean(roleToRemove)} onClose={busyRoleChange ? undefined : () => setRoleToRemove(null)} fullWidth maxWidth="xs">
        <DialogTitle>Quitar rol del usuario</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2">
            Se quitará el rol <strong>{roleToRemove?.ROLCod}</strong> de <strong>{login}</strong>. Los permisos directos del usuario no
            serán modificados.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" disabled={busyRoleChange} onClick={() => setRoleToRemove(null)}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" disabled={busyRoleChange} onClick={() => removeRoleMutation.mutate(roleToRemove)}>
            Quitar rol
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
}
