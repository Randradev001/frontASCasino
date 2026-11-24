import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import { operationalCardStyle } from 'components/operationalCardStyle';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import OperationalListShell from 'components/OperationalListShell';
import OperationalListHero from 'components/OperationalListHero';
import ListExportButtons from 'components/ListExportButtons';
import {
  createCasinoMaster,
  deleteCasinoMaster,
  getCasinoMasterOptions,
  listCasinoMaster,
  updateCasinoMaster
} from 'api/casinoMaestrosApi';

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('es-CL');

const CONFIG = {
  casinos: { title: 'Casinos', subtitle: 'Responsables y datos de contacto de cada casino', singular: 'casino', filters: [] },
  destinos: { title: 'Destinos de pedidos', subtitle: 'Lugares habilitados para la entrega', singular: 'destino', filters: [] },
  motivos: { title: 'Motivos de pedidos', subtitle: 'Clasificación operacional de las solicitudes', singular: 'motivo', filters: [] },
  'tipos-producto': {
    title: 'Tipos de productos',
    subtitle: 'Orden y acceso al catálogo de Casino',
    singular: 'tipo de producto',
    filters: ['access']
  },
  productos: {
    title: 'Productos de casino',
    subtitle: 'Precios, tipos y casino de venta',
    singular: 'producto',
    filters: ['casinoId', 'categoryId', 'access']
  }
};

const initialForm = (catalog) =>
  catalog === 'casinos'
    ? { externalCode: '', name: '', rut: '', dv: '', email: '', active: true }
    : catalog === 'tipos-producto'
      ? { externalCode: '', name: '', order: 0, access: 0, active: true }
      : catalog === 'productos'
        ? { externalCode: '', name: '', price: 0, casinoId: '', categoryId: '', active: true }
        : { externalCode: '', name: '', active: true };

const errorMessage = (error) => error.response?.data?.message || 'No fue posible completar la operación.';

function ListToolbar({ search, setSearch, total }) {
  return (
    <GridToolbarContainer sx={{ gap: 1, px: 1, py: 0.75 }}>
      <TextField
        size="small"
        placeholder="Buscar en el listado"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ minWidth: { xs: '100%', sm: 310 } }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Borrar búsqueda" onClick={() => setSearch('')}>
                  <CloseOutlined />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        }}
      />
      <GridToolbarColumnsButton />
      <Typography variant="body2" color="text.secondary" sx={{ ml: { sm: 'auto' } }}>
        {number.format(total)} registro{total === 1 ? '' : 's'}
      </Typography>
    </GridToolbarContainer>
  );
}

ListToolbar.propTypes = {
  search: PropTypes.string.isRequired,
  setSearch: PropTypes.func.isRequired,
  total: PropTypes.number.isRequired
};

export default function CasinoMasterPage({ catalog }) {
  const config = CONFIG[catalog];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ access: '', casinoId: '', categoryId: '' });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });
  const [form, setForm] = useState({ open: false, row: null, values: initialForm(catalog) });
  const [deleteRow, setDeleteRow] = useState(null);
  const [summaryKey, setSummaryKey] = useState(null);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagination((value) => ({ ...value, page: 0 }));
      setQ(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSearch('');
    setQ('');
    setFilters({ access: '', casinoId: '', categoryId: '' });
    setPagination({ page: 0, pageSize: 25 });
    setForm({ open: false, row: null, values: initialForm(catalog) });
  }, [catalog]);

  const params = useMemo(() => ({ q, page: pagination.page + 1, pageSize: pagination.pageSize, ...filters }), [q, pagination, filters]);
  const listQuery = useQuery({ queryKey: ['casino-master', catalog, params], queryFn: () => listCasinoMaster(catalog, params) });
  const exportQuery = useQuery({
    queryKey: ['casino-master-export', catalog, q, filters],
    queryFn: () => listCasinoMaster(catalog, { q, page: 1, pageSize: 1000, ...filters })
  });
  const optionsQuery = useQuery({ queryKey: ['casino-master-options'], queryFn: getCasinoMasterOptions, enabled: catalog === 'productos' });
  const rows = listQuery.data?.data || [];
  const exportRows = exportQuery.data?.data || [];

  const notify = (message, severity = 'success') => setNotice({ open: true, message, severity });
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['casino-master'] });
    queryClient.invalidateQueries({ queryKey: ['casino-master-export'] });
    queryClient.invalidateQueries({ queryKey: ['casino-master-options'] });
  };
  const saveMutation = useMutation({
    mutationFn: () => (form.row ? updateCasinoMaster(catalog, form.row.id, form.values) : createCasinoMaster(catalog, form.values)),
    onSuccess: () => {
      invalidate();
      setForm({ open: false, row: null, values: initialForm(catalog) });
      notify(`El ${config.singular} quedó guardado.`);
    },
    onError: (error) => notify(errorMessage(error), 'error')
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteCasinoMaster(catalog, deleteRow.id),
    onSuccess: () => {
      invalidate();
      setDeleteRow(null);
      notify(`El ${config.singular} fue eliminado.`);
    },
    onError: (error) => notify(errorMessage(error), 'error')
  });

  const openCreate = () => setForm({ open: true, row: null, values: initialForm(catalog) });
  const openEdit = (row) => setForm({ open: true, row, values: { ...initialForm(catalog), ...row } });
  const changeFilter = (name, value) => {
    setPagination((current) => ({ ...current, page: 0 }));
    setFilters((current) => ({ ...current, [name]: value }));
  };
  const setValue = (name, value) => setForm((current) => ({ ...current, values: { ...current.values, [name]: value } }));

  const columns = (() => {
    const actions = {
      field: 'actions',
      headerName: 'Acciones',
      width: 105,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <Tooltip title="Editar">
            <IconButton size="small" onClick={() => openEdit(row)}>
              <EditOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar">
            <IconButton size="small" color="error" onClick={() => setDeleteRow(row)}>
              <DeleteOutlined />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    };
    const base = [
      actions,
      { field: 'id', headerName: 'ID interno', width: 100 },
      { field: 'externalCode', headerName: 'Código externo', width: 135 },
      { field: 'name', headerName: 'Nombre', minWidth: 210, flex: 1 },
      { field: 'active', headerName: 'Estado', width: 100, valueFormatter: (value) => (value ? 'Activo' : 'Inactivo') }
    ];
    if (catalog === 'casinos')
      return [
        ...base,
        { field: 'rut', headerName: 'RUT responsable', width: 150, valueFormatter: (value, row) => `${number.format(value)}-${row.dv}` },
        { field: 'email', headerName: 'Correo', minWidth: 220, flex: 1 },
        { field: 'usageCount', headerName: 'Referencias', width: 115 }
      ];
    if (catalog === 'tipos-producto')
      return [
        ...base,
        { field: 'order', headerName: 'Orden', width: 90 },
        {
          field: 'access',
          headerName: 'Acceso',
          width: 130,
          renderCell: ({ value }) => (
            <Chip size="small" color={value === 1 ? 'warning' : 'success'} label={value === 1 ? 'Restringido' : 'Liberado'} />
          )
        },
        { field: 'usageCount', headerName: 'Productos', width: 110 }
      ];
    if (catalog === 'productos')
      return [
        ...base,
        { field: 'casino', headerName: 'Casino', minWidth: 170, flex: 1 },
        { field: 'category', headerName: 'Tipo', minWidth: 170, flex: 1 },
        { field: 'price', headerName: 'Precio', width: 130, valueFormatter: (value) => money.format(value) },
        {
          field: 'access',
          headerName: 'Acceso',
          width: 125,
          renderCell: ({ value }) => (
            <Chip size="small" color={value === 1 ? 'warning' : 'success'} label={value === 1 ? 'Restringido' : 'Liberado'} />
          )
        },
        { field: 'usageCount', headerName: 'Pedidos', width: 100 }
      ];
    return [...base, { field: 'usageCount', headerName: 'Pedidos', width: 110 }];
  })();

  const exportColumns = columns
    .filter((column) => column.field !== 'actions')
    .map((column) => ({
      field: column.field,
      headerName: column.headerName,
      exportValue: (row) =>
        column.field === 'access'
          ? row.access === 1
            ? 'Restringido'
            : 'Liberado'
          : column.field === 'price'
            ? money.format(row.price)
            : row[column.field]
    }));
  const exportFilters = [
    `Búsqueda: ${q || 'Todas'}`,
    ...(filters.access !== '' ? [`Acceso: ${Number(filters.access) === 1 ? 'Restringido' : 'Liberado'}`] : [])
  ];
  const summary = listQuery.data?.summary || { total: 0, inUse: 0, available: 0, restricted: 0 };
  const cards = [
    { key: 'total', label: 'Total', value: summary.total },
    { key: 'inUse', label: 'En uso', value: summary.inUse },
    { key: 'available', label: 'Sin referencias', value: summary.available }
  ];
  if (['tipos-producto', 'productos'].includes(catalog))
    cards.push({ key: 'restricted', label: 'Restringidos', value: summary.restricted });
  const summaryRows = exportRows.filter((row) =>
    summaryKey === 'inUse'
      ? row.usageCount > 0
      : summaryKey === 'available'
        ? row.usageCount === 0
        : summaryKey === 'restricted'
          ? row.access === 1
          : true
  );

  return (
    <OperationalListShell>
      <OperationalListHero
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <ListExportButtons
              title={config.title}
              rows={exportRows}
              columns={exportColumns}
              filters={exportFilters}
              disabled={exportQuery.isFetching}
              onNotify={({ message, severity }) => notify(message, severity)}
            />
            <Button variant="contained" startIcon={<PlusOutlined />} onClick={openCreate}>
              Nuevo
            </Button>
          </Stack>
        }
      />
      <Stack spacing={1.5}>
        <Grid container spacing={1.25}>
          {cards.map((card) => (
            <Grid key={card.key} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={operationalCardStyle(card.key === 'restricted' ? 'amber' : 'blue')}>
                <CardActionArea onClick={() => setSummaryKey(card.key)}>
                  <CardContent sx={{ py: 1.25 }}>
                    <Typography variant="caption">{card.label}</Typography>
                    <Typography variant="h4">{number.format(card.value)}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1}>
          {config.filters.includes('casinoId') && (
            <TextField
              select
              size="small"
              label="Casino"
              value={filters.casinoId}
              onChange={(event) => changeFilter('casinoId', event.target.value)}
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(optionsQuery.data?.casinos || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {config.filters.includes('categoryId') && (
            <TextField
              select
              size="small"
              label="Tipo"
              value={filters.categoryId}
              onChange={(event) => changeFilter('categoryId', event.target.value)}
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(optionsQuery.data?.categories || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {config.filters.includes('access') && (
            <TextField
              select
              size="small"
              label="Acceso"
              value={filters.access}
              onChange={(event) => changeFilter('access', event.target.value)}
              sx={{ minWidth: 175 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="0">Liberado</MenuItem>
              <MenuItem value="1">Restringido</MenuItem>
            </TextField>
          )}
        </Stack>
        {listQuery.isError && <Alert severity="error">{errorMessage(listQuery.error)}</Alert>}
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id}
          loading={listQuery.isLoading || listQuery.isFetching}
          rowCount={listQuery.data?.pagination?.total || 0}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          slots={{ toolbar: ListToolbar }}
          slotProps={{ toolbar: { search, setSearch, total: listQuery.data?.pagination?.total || 0 } }}
          showToolbar
          sx={{ minHeight: 430, '& .MuiDataGrid-columnHeaders': { bgcolor: '#edf5fb' } }}
        />
      </Stack>

      <Dialog
        open={form.open}
        onClose={() => !saveMutation.isPending && setForm({ open: false, row: null, values: initialForm(catalog) })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {form.row ? 'Editar' : 'Nuevo'} {config.singular}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              autoFocus
              label="Código externo"
              value={form.values.externalCode}
              onChange={(event) => setValue('externalCode', event.target.value)}
              required
              inputProps={{ maxLength: 30 }}
            />
            <TextField
              label="Nombre"
              value={form.values.name}
              onChange={(event) => setValue('name', event.target.value)}
              required
              inputProps={{ maxLength: catalog === 'productos' ? 60 : 40 }}
            />
            {catalog === 'casinos' && (
              <>
                <TextField
                  label="RUT responsable"
                  type="number"
                  value={form.values.rut}
                  onChange={(event) => setValue('rut', event.target.value)}
                  required
                />
                <TextField
                  label="Dígito verificador"
                  value={form.values.dv}
                  onChange={(event) => setValue('dv', event.target.value.toUpperCase())}
                  required
                  inputProps={{ maxLength: 1 }}
                />
                <TextField
                  label="Correo"
                  type="email"
                  value={form.values.email}
                  onChange={(event) => setValue('email', event.target.value)}
                  inputProps={{ maxLength: 50 }}
                />
              </>
            )}
            {catalog === 'tipos-producto' && (
              <>
                <TextField
                  label="Orden de visualización"
                  type="number"
                  value={form.values.order}
                  onChange={(event) => setValue('order', event.target.value)}
                  required
                />
                <TextField
                  select
                  label="Acceso"
                  value={form.values.access}
                  onChange={(event) => setValue('access', Number(event.target.value))}
                >
                  <MenuItem value={0}>Liberado</MenuItem>
                  <MenuItem value={1}>Restringido</MenuItem>
                </TextField>
              </>
            )}
            {catalog === 'productos' && (
              <>
                <TextField
                  select
                  label="Casino"
                  value={form.values.casinoId}
                  onChange={(event) => setValue('casinoId', event.target.value)}
                  required
                >
                  {(optionsQuery.data?.casinos || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Tipo de producto"
                  value={form.values.categoryId}
                  onChange={(event) => setValue('categoryId', event.target.value)}
                  required
                >
                  {(optionsQuery.data?.categories || []).map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Precio"
                  type="number"
                  value={form.values.price}
                  onChange={(event) => setValue('price', event.target.value)}
                  required
                />
              </>
            )}
            <TextField
              select
              label="Estado"
              value={form.values.active ? 1 : 0}
              onChange={(event) => setValue('active', Number(event.target.value) === 1)}
            >
              <MenuItem value={1}>Activo</MenuItem>
              <MenuItem value={0}>Inactivo</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm({ open: false, row: null, values: initialForm(catalog) })}>Cancelar</Button>
          <Button variant="contained" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(deleteRow)} onClose={() => !deleteMutation.isPending && setDeleteRow(null)}>
        <DialogTitle>Eliminar {config.singular}</DialogTitle>
        <DialogContent>
          <Typography>¿Confirma que desea eliminar “{deleteRow?.name}”?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRow(null)}>Cancelar</Button>
          <Button color="error" variant="contained" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(summaryKey)} onClose={() => setSummaryKey(null)} fullWidth maxWidth="sm">
        <DialogTitle>{cards.find((card) => card.key === summaryKey)?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            {summaryRows.length ? (
              summaryRows.map((row) => (
                <Box key={row.id} sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography fontWeight={600}>{row.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Código {row.id} · {row.usageCount || 0} referencias
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary">No hay registros para este indicador.</Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryKey(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={notice.open} autoHideDuration={4500} onClose={() => setNotice((current) => ({ ...current, open: false }))}>
        <Alert severity={notice.severity} onClose={() => setNotice((current) => ({ ...current, open: false }))}>
          {notice.message}
        </Alert>
      </Snackbar>
    </OperationalListShell>
  );
}

CasinoMasterPage.propTypes = { catalog: PropTypes.oneOf(Object.keys(CONFIG)).isRequired };
