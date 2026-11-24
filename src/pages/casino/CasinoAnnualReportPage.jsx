import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { operationalCardStyle } from 'components/operationalCardStyle';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { DataGrid, GridToolbarColumnsButton, GridToolbarContainer } from '@mui/x-data-grid';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import InputAdornment from '@mui/material/InputAdornment';
import OperationalListShell from 'components/OperationalListShell';
import OperationalListHero from 'components/OperationalListHero';
import ListExportButtons from 'components/ListExportButtons';
import ChileDatePicker from 'components/ChileDatePicker';
import { getCasinoAnnualReport } from 'api/casinoConsultasApi';

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL');
const periodFormatter = new Intl.DateTimeFormat('es-CL', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const initialRange = () => {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from: toInputDate(from), to: toInputDate(to) };
};
const periodLabel = (value) => periodFormatter.format(new Date(`${value}-01T00:00:00Z`)).replace('.', '');
const CONFIG = {
  'tipo-producto': {
    title: 'Pedidos por tipo de producto',
    subtitle: 'Consumo entregado por casino y tipo',
    filters: ['casinoId', 'categoryId'],
    label: 'Casino · Tipo'
  },
  'centro-costo': {
    title: 'Consumos por centro de costo',
    subtitle: 'Consumo entregado agrupado por división',
    filters: ['divisionId'],
    label: 'División'
  },
  persona: { title: 'Pedidos por persona', subtitle: 'Consumo entregado por solicitante', filters: ['personRut'], label: 'Persona' },
  motivo: {
    title: 'Pedidos por motivo',
    subtitle: 'Consumo entregado por casino y motivo',
    filters: ['casinoId', 'motiveId'],
    label: 'Casino · Motivo'
  }
};

function Toolbar({ search, setSearch, total }) {
  return (
    <GridToolbarContainer sx={{ px: 1, py: 0.75, gap: 1 }}>
      <TextField
        size="small"
        placeholder="Buscar en el listado"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ minWidth: 310 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch('')}>
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
Toolbar.propTypes = { search: PropTypes.string.isRequired, setSearch: PropTypes.func.isRequired, total: PropTypes.number.isRequired };

export default function CasinoAnnualReportPage({ report }) {
  const config = CONFIG[report];
  const [filters, setFilters] = useState({
    ...initialRange(),
    casinoId: '',
    categoryId: '',
    motiveId: '',
    divisionId: '',
    personRut: ''
  });
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'info' });
  const params = useMemo(() => ({ ...filters, q: search.trim() }), [filters, search]);
  const query = useQuery({ queryKey: ['casino-annual-report', report, params], queryFn: () => getCasinoAnnualReport(report, params) });
  const rows = query.data?.rows || [];
  const periods = query.data?.periods || [];
  const columns = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 90,
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="Ver meses">
          <IconButton size="small" onClick={() => setDetail(row)}>
            <EyeOutlined />
          </IconButton>
        </Tooltip>
      )
    },
    { field: 'label', headerName: config.label, minWidth: 230, flex: 1 },
    ...periods.map((period) => ({
      field: period.key,
      headerName: periodLabel(period.value),
      width: 125,
      type: 'number',
      valueFormatter: (value) => money.format(value)
    })),
    { field: 'total', headerName: 'Total', width: 135, type: 'number', valueFormatter: (value) => money.format(value) }
  ];
  const exportColumns = columns
    .filter((item) => item.field !== 'actions')
    .map((item) => ({
      field: item.field,
      headerName: item.headerName,
      exportValue: (row) => (item.field === 'label' ? row.label : money.format(row[item.field]))
    }));
  const summary = query.data?.summary || { groups: 0, orders: 0, units: 0, amount: 0 };
  const cards = [
    { label: 'Agrupaciones', value: integer.format(summary.groups) },
    { label: 'Líneas agrupadas', value: integer.format(summary.orders) },
    { label: 'Unidades', value: integer.format(summary.units) },
    { label: 'Consumo total', value: money.format(summary.amount) }
  ];
  const catalogs = query.data?.catalogs || {};
  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  return (
    <OperationalListShell>
      <OperationalListHero
        title={config.title}
        subtitle={config.subtitle}
        actions={
          <ListExportButtons
            title={config.title}
            rows={rows}
            columns={exportColumns}
            filters={[`Desde: ${filters.from || 'Sin límite'}`, `Hasta: ${filters.to || 'Sin límite'}`, 'Estado: Entregado']}
            disabled={query.isFetching}
            onNotify={(value) => setNotice({ open: true, ...value })}
          />
        }
      />
      <Stack spacing={1.5}>
        <Grid container spacing={1.25}>
          {cards.map((card) => (
            <Grid key={card.label} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={operationalCardStyle()}>
                <CardActionArea onClick={() => setDetail({ label: card.label, ...query.data?.totals })}>
                  <CardContent sx={{ py: 1.25 }}>
                    <Typography variant="caption">{card.label}</Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1}>
          <ChileDatePicker label="Desde" value={filters.from} onChange={(value) => setFilter('from', value)} sx={{ width: 175 }} />
          <ChileDatePicker label="Hasta" value={filters.to} onChange={(value) => setFilter('to', value)} sx={{ width: 175 }} />
          {config.filters.includes('casinoId') && (
            <TextField
              select
              size="small"
              label="Casino"
              value={filters.casinoId}
              onChange={(e) => setFilter('casinoId', e.target.value)}
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(catalogs.casinos || []).map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
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
              onChange={(e) => setFilter('categoryId', e.target.value)}
              sx={{ minWidth: 210 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(catalogs.categories || []).map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {config.filters.includes('motiveId') && (
            <TextField
              select
              size="small"
              label="Motivo"
              value={filters.motiveId}
              onChange={(e) => setFilter('motiveId', e.target.value)}
              sx={{ minWidth: 230 }}
            >
              <MenuItem value="">Todos</MenuItem>
              {(catalogs.motives || []).map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {config.filters.includes('divisionId') && (
            <TextField
              select
              size="small"
              label="División"
              value={filters.divisionId}
              onChange={(e) => setFilter('divisionId', e.target.value)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Todas</MenuItem>
              {(catalogs.divisions || []).map((x) => (
                <MenuItem key={x.id} value={x.id}>
                  {x.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          {config.filters.includes('personRut') && (
            <TextField
              size="small"
              label="RUT solicitante"
              value={filters.personRut}
              onChange={(e) => setFilter('personRut', e.target.value)}
              sx={{ minWidth: 180 }}
            />
          )}
        </Stack>
        {query.isError && <Alert severity="error">{query.error.response?.data?.message || 'No fue posible generar la consulta.'}</Alert>}
        <Box sx={{ width: '100%', overflowX: 'auto' }}>
          <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            loading={query.isLoading || query.isFetching}
            disableRowSelectionOnClick
            showToolbar
            slots={{ toolbar: Toolbar }}
            slotProps={{ toolbar: { search, setSearch, total: rows.length } }}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
              pinnedColumns: { left: ['actions', 'label'], right: ['total'] }
            }}
            sx={{ minWidth: Math.max(650, 455 + periods.length * 125), '& .MuiDataGrid-columnHeaders': { bgcolor: '#edf5fb' } }}
          />
        </Box>
      </Stack>
      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth="sm">
        <DialogTitle>{detail?.label}</DialogTitle>
        <DialogContent>
          <Stack spacing={0.5}>
            {periods.map((period) => (
              <Stack key={period.key} direction="row" justifyContent="space-between">
                <Typography>{periodLabel(period.value)}</Typography>
                <Typography fontWeight={700}>{money.format(detail?.[period.key] || 0)}</Typography>
              </Stack>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={notice.open}
        autoHideDuration={4000}
        onClose={() => setNotice((x) => ({ ...x, open: false }))}
        message={notice.message}
      />
    </OperationalListShell>
  );
}
CasinoAnnualReportPage.propTypes = { report: PropTypes.oneOf(Object.keys(CONFIG)).isRequired };
