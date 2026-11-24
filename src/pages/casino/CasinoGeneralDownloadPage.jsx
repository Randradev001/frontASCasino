import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import { operationalCardStyle } from 'components/operationalCardStyle';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
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
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import FilterClearAdornment from 'components/FilterClearAdornment';
import ChileDatePicker from 'components/ChileDatePicker';
import ListExportButtons from 'components/ListExportButtons';
import OperationalListHero from 'components/OperationalListHero';
import OperationalListShell from 'components/OperationalListShell';
import { getCasinoGeneralDownload } from 'api/casinoConsultasApi';

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL');
const date = new Intl.DateTimeFormat('es-CL');
const localDate = (value) => {
  const current = new Date(value);
  return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
};
const initialDates = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: localDate(from), to: localDate(to) };
};
const STATUS = { 0: 'Borrador', 1: 'Enviado', 2: 'En preparación', 3: 'Entregado', 5: 'Anulado' };
const PAYMENT = { 0: 'Sin control', 1: 'Liberado', 2: 'Bloqueado' };
const EVALUATION = { 0: 'Sin evaluación', 1: 'Malo', 2: 'Regular', 3: 'Bueno' };

function Toolbar({ value, onChange, total }) {
  return (
    <GridToolbarContainer sx={{ px: 1, py: 0.75, gap: 1 }}>
      <TextField
        size="small"
        placeholder="Pedido, persona, producto…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{ minWidth: 300 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: value ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onChange('')}>
                  <CloseOutlined />
                </IconButton>
              </InputAdornment>
            ) : null
          }
        }}
      />
      <GridToolbarColumnsButton />
      <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
        {integer.format(total)} registros
      </Typography>
    </GridToolbarContainer>
  );
}
Toolbar.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, total: PropTypes.number.isRequired };

const selectOptions = (items = []) =>
  items.map((item) => (
    <MenuItem key={item.id} value={item.id}>
      {item.name}
    </MenuItem>
  ));

export default function CasinoGeneralDownloadPage() {
  const [filters, setFilters] = useState({
    ...initialDates(),
    casinoId: '',
    categoryId: '',
    productId: '',
    motiveId: '',
    divisionId: '',
    subdivisionId: '',
    costCenterId: '',
    status: '',
    paymentControl: '',
    evaluation: ''
  });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'info' });
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);
  const params = useMemo(
    () => ({ ...filters, q: debouncedSearch, page: pagination.page + 1, pageSize: pagination.pageSize }),
    [filters, debouncedSearch, pagination]
  );
  const query = useQuery({
    queryKey: ['casino-general-download', params],
    queryFn: () => getCasinoGeneralDownload(params),
    placeholderData: (previous) => previous
  });
  const exportParams = useMemo(() => ({ ...filters, q: debouncedSearch, page: 1, pageSize: 25, export: 1 }), [filters, debouncedSearch]);
  const exportQuery = useQuery({
    queryKey: ['casino-general-download-export', exportParams],
    queryFn: () => getCasinoGeneralDownload(exportParams)
  });
  const catalogs = query.data?.catalogs || {};
  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPagination((current) => ({ ...current, page: 0 }));
  };
  const products = (catalogs.products || []).filter(
    (item) =>
      (!filters.casinoId || Number(item.casinoId) === Number(filters.casinoId)) &&
      (!filters.categoryId || Number(item.categoryId) === Number(filters.categoryId))
  );
  const subdivisions = (catalogs.subdivisions || []).filter((item) => !filters.divisionId || item.divisionId === filters.divisionId);
  const columns = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 85,
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="Ver detalle">
          <IconButton size="small" onClick={() => setDetail(row)}>
            <EyeOutlined />
          </IconButton>
        </Tooltip>
      )
    },
    { field: 'orderNumber', headerName: 'Pedido', width: 100 },
    { field: 'deliveryDate', headerName: 'Entrega', width: 115, valueFormatter: (value) => date.format(new Date(value)) },
    { field: 'casino', headerName: 'Casino', minWidth: 180 },
    { field: 'person', headerName: 'Solicitante', minWidth: 210 },
    { field: 'category', headerName: 'Tipo', minWidth: 160 },
    { field: 'product', headerName: 'Producto', minWidth: 210, flex: 1 },
    { field: 'quantity', headerName: 'Cant.', width: 85, type: 'number' },
    { field: 'total', headerName: 'Total', width: 125, type: 'number', valueFormatter: (value) => money.format(value) },
    { field: 'motive', headerName: 'Motivo', minWidth: 170 },
    { field: 'costCenter', headerName: 'Centro costo', minWidth: 190 },
    { field: 'status', headerName: 'Estado', width: 125, valueFormatter: (value) => STATUS[value] },
    { field: 'paymentControl', headerName: 'Pago', width: 115, valueFormatter: (value) => PAYMENT[value] },
    { field: 'evaluation', headerName: 'Evaluación', width: 130, valueFormatter: (value) => EVALUATION[value] }
  ];
  const exportColumns = [
    ['orderNumber', 'Pedido'],
    ['casino', 'Casino'],
    ['deliveryDate', 'Fecha entrega'],
    ['description', 'Descripción'],
    ['destination', 'Destino'],
    ['motive', 'Motivo'],
    ['personRut', 'RUT'],
    ['person', 'Solicitante'],
    ['category', 'Tipo producto'],
    ['product', 'Producto'],
    ['quantity', 'Cantidad'],
    ['unitPrice', 'Precio unitario'],
    ['total', 'Total'],
    ['division', 'División'],
    ['subdivision', 'Subdivisión'],
    ['costCenter', 'Centro costo'],
    ['status', 'Estado'],
    ['paymentControl', 'Control pago'],
    ['evaluation', 'Evaluación']
  ].map(([field, headerName]) => ({
    field,
    headerName,
    exportValue: (row) =>
      field === 'status'
        ? STATUS[row[field]]
        : field === 'paymentControl'
          ? PAYMENT[row[field]]
          : field === 'evaluation'
            ? EVALUATION[row[field]]
            : row[field]
  }));
  const summary = query.data?.summary || { orders: 0, lines: 0, units: 0, amount: 0 };
  const cards = [
    ['Pedidos', summary.orders],
    ['Líneas', summary.lines],
    ['Unidades', summary.units],
    ['Total', money.format(summary.amount)]
  ];
  const filterProps = (name) => ({
    value: filters[name],
    onChange: (event) => setFilter(name, event.target.value),
    slotProps: { input: { endAdornment: <FilterClearAdornment visible={Boolean(filters[name])} onClear={() => setFilter(name, '')} /> } }
  });
  return (
    <OperationalListShell>
      <OperationalListHero
        title="Descarga general de pedidos"
        subtitle="Detalle operacional de pedidos y productos"
        actions={
          <ListExportButtons
            title="Descarga general de pedidos"
            rows={exportQuery.data?.rows || []}
            columns={exportColumns}
            filters={[`Desde: ${filters.from || 'abierto'}`, `Hasta: ${filters.to || 'abierto'}`]}
            disabled={exportQuery.isFetching}
            onNotify={(value) => setNotice({ open: true, ...value })}
          />
        }
      />
      <Stack spacing={1.5}>
        <Grid container spacing={1.25}>
          {cards.map(([label, value]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={operationalCardStyle()}>
                <CardActionArea onClick={() => setDetail({ summary: true })}>
                  <CardContent sx={{ py: 1.25 }}>
                    <Typography variant="caption">{label}</Typography>
                    <Typography variant="h4">{typeof value === 'number' ? integer.format(value) : value}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
          <ChileDatePicker label="Desde" sx={{ width: 165 }} value={filters.from} onChange={(value) => setFilter('from', value)} />
          <ChileDatePicker label="Hasta" sx={{ width: 165 }} value={filters.to} onChange={(value) => setFilter('to', value)} />
          <TextField select size="small" label="Casino" sx={{ minWidth: 185 }} {...filterProps('casinoId')}>
            <MenuItem value="">Todos</MenuItem>
            {selectOptions(catalogs.casinos)}
          </TextField>
          <TextField select size="small" label="Tipo" sx={{ minWidth: 180 }} {...filterProps('categoryId')}>
            <MenuItem value="">Todos</MenuItem>
            {selectOptions(catalogs.categories)}
          </TextField>
          <TextField select size="small" label="Producto" sx={{ minWidth: 220 }} {...filterProps('productId')}>
            <MenuItem value="">Todos</MenuItem>
            {selectOptions(products)}
          </TextField>
          <TextField select size="small" label="Motivo" sx={{ minWidth: 190 }} {...filterProps('motiveId')}>
            <MenuItem value="">Todos</MenuItem>
            {selectOptions(catalogs.motives)}
          </TextField>
          <TextField select size="small" label="División" sx={{ minWidth: 190 }} {...filterProps('divisionId')}>
            <MenuItem value="">Todas</MenuItem>
            {selectOptions(catalogs.divisions)}
          </TextField>
          <TextField select size="small" label="Subdivisión" sx={{ minWidth: 190 }} {...filterProps('subdivisionId')}>
            <MenuItem value="">Todas</MenuItem>
            {selectOptions(subdivisions)}
          </TextField>
          <TextField select size="small" label="Centro costo" sx={{ minWidth: 200 }} {...filterProps('costCenterId')}>
            <MenuItem value="">Todos</MenuItem>
            {selectOptions(catalogs.costCenters)}
          </TextField>
          <TextField select size="small" label="Estado" sx={{ minWidth: 150 }} {...filterProps('status')}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Control pago" sx={{ minWidth: 160 }} {...filterProps('paymentControl')}>
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(PAYMENT).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Evaluación" sx={{ minWidth: 165 }} {...filterProps('evaluation')}>
            <MenuItem value="">Todas</MenuItem>
            {Object.entries(EVALUATION).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {query.isError && <Alert severity="error">{query.error?.response?.data?.message || 'No fue posible cargar la descarga.'}</Alert>}
        <DataGrid
          rows={query.data?.rows || []}
          columns={columns}
          getRowId={(row) => `${row.orderNumber}-${row.productId}`}
          rowCount={query.data?.total || 0}
          loading={query.isFetching}
          paginationMode="server"
          paginationModel={pagination}
          onPaginationModelChange={setPagination}
          pageSizeOptions={[10, 25, 50, 100]}
          slots={{ toolbar: Toolbar }}
          slotProps={{ toolbar: { value: search, onChange: setSearch, total: query.data?.total || 0 } }}
          disableRowSelectionOnClick
          sx={{ minHeight: 510 }}
        />
      </Stack>
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>{detail?.summary ? 'Resumen del resultado' : `Pedido ${detail?.orderNumber || ''}`}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            {detail?.summary
              ? cards.map(([label, value]) => (
                  <Typography key={label}>
                    <strong>{label}:</strong> {typeof value === 'number' ? integer.format(value) : value}
                  </Typography>
                ))
              : detail && (
                  <>
                    {[
                      ['Casino', detail.casino],
                      ['Solicitante', `${detail.personRut}-${detail.personDv} · ${detail.person}`],
                      ['Destino', detail.destination],
                      ['Motivo', detail.motive],
                      ['Producto', `${detail.category} · ${detail.product}`],
                      ['Cantidad', detail.quantity],
                      ['Precio', money.format(detail.unitPrice)],
                      ['Total', money.format(detail.total)],
                      ['División', detail.division],
                      ['Subdivisión', detail.subdivision],
                      ['Centro costo', detail.costCenter],
                      ['Estado', STATUS[detail.status]],
                      ['Control pago', PAYMENT[detail.paymentControl]],
                      ['Evaluación', EVALUATION[detail.evaluation]]
                    ].map(([label, value]) => (
                      <Typography key={label}>
                        <strong>{label}:</strong> {value}
                      </Typography>
                    ))}
                  </>
                )}
          </Stack>
        </DialogContent>
      </Dialog>
      <Snackbar open={notice.open} autoHideDuration={3500} onClose={() => setNotice((current) => ({ ...current, open: false }))}>
        <Alert severity={notice.severity}>{notice.message}</Alert>
      </Snackbar>
    </OperationalListShell>
  );
}
