import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import { DataGrid } from '@mui/x-data-grid';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import OperationalListShell from 'components/OperationalListShell';
import OperationalListHero from 'components/OperationalListHero';
import { createCasinoRequester, deleteCasinoRequester, listCasinoRequesters, updateCasinoRequester } from 'api/casinoSolicitantesApi';

const empty = {
  externalCode: '',
  rut: '',
  names: '',
  paternalSurname: '',
  maternalSurname: '',
  email: '',
  divisionCode: '',
  divisionName: '',
  subdivisionCode: '',
  subdivisionName: '',
  costCenterCode: '',
  costCenterName: '',
  active: true
};
const errorMessage = (error) => error.response?.data?.message || 'No fue posible completar la operación.';

export default function CasinoRequestersPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });
  const [form, setForm] = useState({ open: false, row: null, values: empty });
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery({
    queryKey: ['casino-requesters', q, pagination],
    queryFn: () => listCasinoRequesters({ q, page: pagination.page + 1, pageSize: pagination.pageSize })
  });
  const invalidate = () => client.invalidateQueries({ queryKey: ['casino-requesters'] });
  const save = useMutation({
    mutationFn: () => (form.row ? updateCasinoRequester(form.row.id, form.values) : createCasinoRequester(form.values)),
    onSuccess: () => {
      invalidate();
      setForm({ open: false, row: null, values: empty });
      setNotice({ severity: 'success', text: 'Solicitante guardado.' });
    },
    onError: (error) => setNotice({ severity: 'error', text: errorMessage(error) })
  });
  const remove = useMutation({
    mutationFn: deleteCasinoRequester,
    onSuccess: () => {
      invalidate();
      setNotice({ severity: 'success', text: 'Solicitante eliminado.' });
    },
    onError: (error) => setNotice({ severity: 'error', text: errorMessage(error) })
  });
  const setValue = (name, value) => setForm((current) => ({ ...current, values: { ...current.values, [name]: value } }));
  const columns = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 105,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => setForm({ open: true, row, values: { ...empty, ...row } })}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => remove.mutate(row.id)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
    { field: 'id', headerName: 'ID interno', width: 100 },
    { field: 'externalCode', headerName: 'Código externo', width: 135 },
    { field: 'rut', headerName: 'RUT', width: 130, valueFormatter: (value, row) => `${value}-${row.dv}` },
    { field: 'names', headerName: 'Nombres', minWidth: 170, flex: 1 },
    { field: 'paternalSurname', headerName: 'Apellido', minWidth: 140 },
    { field: 'email', headerName: 'Correo', minWidth: 230, flex: 1 },
    { field: 'divisionName', headerName: 'División', minWidth: 150 },
    { field: 'costCenterName', headerName: 'Centro de costo', minWidth: 190 },
    { field: 'active', headerName: 'Estado', width: 100, valueFormatter: (value) => (value ? 'Activo' : 'Inactivo') }
  ];
  return (
    <OperationalListShell>
      <OperationalListHero
        title="Solicitantes Casino"
        subtitle="Personas y usuarios habilitados para solicitar pedidos"
        actions={
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setForm({ open: true, row: null, values: empty })}>
            Nuevo
          </Button>
        }
      />
      <Stack spacing={1.5}>
        {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
        <TextField size="small" label="Buscar" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ maxWidth: 360 }} />
        <DataGrid
          autoHeight
          rows={query.data?.data || []}
          columns={columns}
          loading={query.isLoading}
          paginationMode="server"
          rowCount={query.data?.pagination?.total || 0}
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </Stack>
      <Dialog open={form.open} onClose={() => setForm({ open: false, row: null, values: empty })} maxWidth="md" fullWidth>
        <DialogTitle>{form.row ? 'Editar solicitante' : 'Nuevo solicitante'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={1.5} sx={{ mt: 0.25 }}>
            {[
              ['externalCode', 'Código externo'],
              ['rut', 'RUT sin puntos ni DV'],
              ['names', 'Nombres'],
              ['paternalSurname', 'Apellido paterno'],
              ['maternalSurname', 'Apellido materno'],
              ['email', 'Correo'],
              ['divisionCode', 'Código división'],
              ['divisionName', 'División'],
              ['subdivisionCode', 'Código subdivisión'],
              ['subdivisionName', 'Subdivisión'],
              ['costCenterCode', 'Código centro costo'],
              ['costCenterName', 'Centro de costo']
            ].map(([name, label]) => (
              <Grid key={name} size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label={label} value={form.values[name]} onChange={(event) => setValue(name, event.target.value)} />
              </Grid>
            ))}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={form.values.active ? 1 : 0}
                onChange={(event) => setValue('active', Number(event.target.value) === 1)}
              >
                <MenuItem value={1}>Activo</MenuItem>
                <MenuItem value={0}>Inactivo</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm({ open: false, row: null, values: empty })}>Cancelar</Button>
          <Button variant="contained" disabled={save.isPending} onClick={() => save.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </OperationalListShell>
  );
}
