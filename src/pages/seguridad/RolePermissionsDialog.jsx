import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getRolePermissions, reapplyRolePermissions, saveRolePermissions } from 'api/seguridadCatalogosApi';

const moduleKey = (row) => `${row.SistCod}|${row.Modcod}`;
const programKey = (row) => `${row.SistCod}|${row.Modcod}|${row.ProgCod}`;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

export default function RolePermissionsDialog({ open, role, initialSystemCode, onClose, onNotify }) {
  const queryClient = useQueryClient();
  const roleCode = String(role?.ROLCod || '').trim();
  const [systemCode, setSystemCode] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [search, setSearch] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [confirmReapply, setConfirmReapply] = useState(false);

  const permissionsQuery = useQuery({
    queryKey: ['gx-seguridad', 'role-permissions', roleCode],
    queryFn: () => getRolePermissions(roleCode),
    enabled: open && Boolean(roleCode)
  });
  const permissions = permissionsQuery.data?.data;

  useEffect(() => {
    if (!open || !permissions) return;
    const requestedSystem = permissions.systems.find((item) => String(item.SistCod) === String(initialSystemCode));
    const firstSelected = requestedSystem
      ? permissions.selected.programs.find((item) => String(item.SistCod) === String(requestedSystem.SistCod))
      : permissions.selected.programs[0];
    const initialSystem = requestedSystem?.SistCod ?? firstSelected?.SistCod ?? permissions.systems[0]?.SistCod;
    const modules = permissions.modules.filter((item) => String(item.SistCod) === String(initialSystem));
    const initialModule = firstSelected?.Modcod ?? modules[0]?.Modcod;

    setSystemCode(initialSystem === undefined ? '' : String(initialSystem));
    setModuleCode(initialModule === undefined ? '' : String(initialModule));
    setSelectedPrograms(new Set(permissions.selected.programs.map(programKey)));
    setSearch('');
    setDirty(false);
  }, [initialSystemCode, open, permissions]);

  const systemModules = useMemo(
    () => (permissions?.modules || []).filter((item) => String(item.SistCod) === systemCode),
    [permissions?.modules, systemCode]
  );
  const activeModule = systemModules.find((item) => String(item.Modcod) === moduleCode);
  const visiblePrograms = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (permissions?.programs || []).filter((program) => {
      if (String(program.SistCod) !== systemCode || String(program.Modcod) !== moduleCode) return false;
      return !term || `${program.ProgCod} ${program.ProgDes || ''}`.toLowerCase().includes(term);
    });
  }, [moduleCode, permissions?.programs, search, systemCode]);

  const selectedByModule = useMemo(() => {
    const totals = new Map();
    for (const program of permissions?.programs || []) {
      if (!selectedPrograms.has(programKey(program))) continue;
      const key = moduleKey(program);
      totals.set(key, (totals.get(key) || 0) + 1);
    }
    return totals;
  }, [permissions?.programs, selectedPrograms]);

  const allVisibleSelected = visiblePrograms.length > 0 && visiblePrograms.every((program) => selectedPrograms.has(programKey(program)));

  const toggleProgram = (program, checked) => {
    setSelectedPrograms((current) => {
      const next = new Set(current);
      if (checked) next.add(programKey(program));
      else next.delete(programKey(program));
      return next;
    });
    setDirty(true);
  };

  const toggleVisiblePrograms = () => {
    setSelectedPrograms((current) => {
      const next = new Set(current);
      for (const program of visiblePrograms) {
        if (allVisibleSelected) next.delete(programKey(program));
        else next.add(programKey(program));
      }
      return next;
    });
    setDirty(true);
  };

  const buildPayload = () => ({
    programs: (permissions?.programs || []).filter((item) => selectedPrograms.has(programKey(item)))
  });

  const saveMutation = useMutation({
    mutationFn: () => saveRolePermissions(roleCode, buildPayload()),
    onSuccess: async (data) => {
      setDirty(false);
      await queryClient.invalidateQueries({ queryKey: ['gx-seguridad', 'role-permissions', roleCode] });
      onNotify?.(data?.message || 'Programas del rol guardados correctamente', 'success');
    },
    onError: (error) => onNotify?.(getErrorMessage(error, 'No fue posible guardar los programas del rol'), 'error')
  });

  const reapplyMutation = useMutation({
    mutationFn: () => reapplyRolePermissions(roleCode),
    onSuccess: async (data) => {
      setConfirmReapply(false);
      await queryClient.invalidateQueries({ queryKey: ['gx-seguridad'] });
      onNotify?.(data?.message || 'Asignaciones verificadas correctamente', 'success');
    },
    onError: (error) => onNotify?.(getErrorMessage(error, 'No fue posible verificar las asignaciones'), 'error')
  });

  const busy = saveMutation.isPending || reapplyMutation.isPending;
  const assignedUsers = Number(permissions?.assignedUsers || 0);

  return (
    <>
      <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="lg">
        <DialogTitle>Programas del rol</DialogTitle>
        <Divider />

        <DialogContent sx={{ p: 3 }}>
          {permissionsQuery.isLoading && (
            <Stack alignItems="center" sx={{ py: 8 }}>
              <CircularProgress size={32} />
            </Stack>
          )}

          {permissionsQuery.isError && (
            <Alert severity="error">{getErrorMessage(permissionsQuery.error, 'No fue posible cargar los programas del rol')}</Alert>
          )}

          {permissions && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                <Typography variant="h5">
                  {permissions.role.ROLCod} - {permissions.role.ROLNombre}
                </Typography>
                <Chip size="small" color="primary" label={`${selectedPrograms.size} programas`} />
                <Chip size="small" variant="outlined" label={`${assignedUsers} usuarios`} />
              </Stack>

              {dirty && <Alert severity="info">Hay cambios sin guardar.</Alert>}

              {selectedPrograms.size === 0 && !dirty && (
                <Alert severity="info">Este rol aún no tiene programas configurados en la plantilla CONEX.</Alert>
              )}

              <TextField
                select
                fullWidth
                label="Sistema"
                value={systemCode}
                onChange={(event) => {
                  const value = event.target.value;
                  const modules = permissions.modules.filter((item) => String(item.SistCod) === String(value));
                  setSystemCode(String(value));
                  setModuleCode(modules[0] ? String(modules[0].Modcod) : '');
                  setSearch('');
                }}
              >
                {permissions.systems.map((system) => (
                  <MenuItem key={system.SistCod} value={String(system.SistCod)}>
                    {system.SistCod} - {system.SistNombre}
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '320px minmax(0, 1fr)' }, gap: 2, minHeight: 430 }}>
                <Box sx={{ border: 1, borderColor: 'divider', overflow: 'auto', maxHeight: 520 }}>
                  <Typography variant="subtitle2" sx={{ px: 2, py: 1.5 }}>
                    Módulos
                  </Typography>
                  <Divider />
                  {systemModules.map((module) => {
                    const selectedCount = selectedByModule.get(moduleKey(module)) || 0;
                    return (
                      <ListItemButton
                        key={moduleKey(module)}
                        selected={String(module.Modcod) === moduleCode}
                        onClick={() => {
                          setModuleCode(String(module.Modcod));
                          setSearch('');
                        }}
                      >
                        <ListItemText
                          primary={`${module.Modcod} - ${module.ModDes}`}
                          secondary={selectedCount ? `${selectedCount} seleccionados` : undefined}
                        />
                      </ListItemButton>
                    );
                  })}
                  {!systemModules.length && (
                    <Typography color="text.secondary" sx={{ p: 2 }}>
                      El sistema no tiene módulos.
                    </Typography>
                  )}
                </Box>

                <Box sx={{ border: 1, borderColor: 'divider', minWidth: 0 }}>
                  <Stack spacing={1.5} sx={{ p: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                      <Typography variant="subtitle2">Programas{activeModule ? ` de ${activeModule.ModDes}` : ''}</Typography>
                      <Button size="small" disabled={!visiblePrograms.length} onClick={toggleVisiblePrograms}>
                        {allVisibleSelected ? 'Quitar todos' : 'Marcar todos'}
                      </Button>
                    </Stack>
                    <TextField
                      size="small"
                      fullWidth
                      label="Buscar programa"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </Stack>
                  <Divider />

                  <Box sx={{ maxHeight: 430, overflow: 'auto' }}>
                    {visiblePrograms.map((program) => {
                      const key = programKey(program);
                      const checked = selectedPrograms.has(key);
                      return (
                        <ListItemButton key={key} divider selected={checked} onClick={() => toggleProgram(program, !checked)}>
                          <Checkbox
                            edge="start"
                            checked={checked}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => toggleProgram(program, event.target.checked)}
                          />
                          <ListItemText primary={`${program.ProgCod} - ${program.ProgDes}`} />
                        </ListItemButton>
                      );
                    })}
                    {!visiblePrograms.length && (
                      <Typography color="text.secondary" sx={{ p: 2 }}>
                        No hay programas para mostrar.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="secondary" disabled={busy} onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<ReloadOutlined />}
            disabled={busy || dirty || assignedUsers === 0}
            onClick={() => setConfirmReapply(true)}
          >
            Actualizar rol
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveOutlined />}
            disabled={busy || !permissions || !dirty}
            onClick={() => saveMutation.mutate()}
          >
            Guardar programas
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmReapply}
        onClose={reapplyMutation.isPending ? undefined : () => setConfirmReapply(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Actualizar rol</DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info">Los programas guardados se aplican a {assignedUsers} usuarios asignados al rol.</Alert>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" disabled={reapplyMutation.isPending} onClick={() => setConfirmReapply(false)}>
            Cancelar
          </Button>
          <Button color="warning" variant="contained" disabled={reapplyMutation.isPending} onClick={() => reapplyMutation.mutate()}>
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

RolePermissionsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  role: PropTypes.object,
  initialSystemCode: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClose: PropTypes.func.isRequired,
  onNotify: PropTypes.func
};
