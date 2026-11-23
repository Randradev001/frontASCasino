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
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';
import FilterClearAdornment from 'components/FilterClearAdornment';
import ListExportButtons from 'components/ListExportButtons';
import OperationalListHero from 'components/OperationalListHero';
import OperationalListShell from 'components/OperationalListShell';
import { getCasinoMailDetail, getCasinoMailStatus, processCasinoMail, retryCasinoMail } from 'api/casinoCorreoApi';

const integer = new Intl.NumberFormat('es-CL');
const dateTime = new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' });
const initialDates = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const format = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: format(from), to: format(to) };
};
const STATUS = { PENDIENTE: 'Pendiente', PROCESANDO: 'Procesando', ENVIADO: 'Enviado', ERROR: 'Error', CANCELADO: 'Cancelado' };
const EVENT = {
  ORDER_SENT: 'Pedido enviado',
  ORDER_APPROVED: 'Pedido aprobado',
  ORDER_REJECTED: 'Pedido rechazado',
  ORDER_DELIVERED: 'Pedido entregado',
  PAYMENT_BLOCKED: 'Pago bloqueado',
  PAYMENT_RELEASED: 'Pago liberado'
};
const statusColor = (value) =>
  ({ PENDIENTE: 'warning', PROCESANDO: 'info', ENVIADO: 'success', ERROR: 'error', CANCELADO: 'default' })[value] || 'default';

function Toolbar({ value, onChange, total }) {
  return (
    <GridToolbarContainer sx={{ px: 1, py: 0.75, gap: 1 }}>
      <TextField
        size="small"
        placeholder="Pedido, destinatario o asunto"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{ minWidth: 310 }}
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

export default function CasinoMailStatusPage() {
  const client = useQueryClient();
  const [filters, setFilters] = useState({ ...initialDates(), status: '', eventType: '' });
  const [pagination, setPagination] = useState({ page: 0, pageSize: 25 });
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [cardStatus, setCardStatus] = useState(null);
  const [notice, setNotice] = useState({ open: false, severity: 'info', message: '' });
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPagination((p) => ({ ...p, page: 0 }));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);
  const params = useMemo(() => ({ ...filters, q, page: pagination.page + 1, pageSize: pagination.pageSize }), [filters, q, pagination]);
  const query = useQuery({
    queryKey: ['casino-mail-status', params],
    queryFn: () => getCasinoMailStatus(params),
    refetchInterval: 15000,
    placeholderData: (previous) => previous
  });
  const exportQuery = useQuery({
    queryKey: ['casino-mail-export', filters, q],
    queryFn: () => getCasinoMailStatus({ ...filters, q, page: 1, pageSize: 25, export: 1 })
  });
  const detail = useQuery({
    queryKey: ['casino-mail-detail', selectedId],
    queryFn: () => getCasinoMailDetail(selectedId),
    enabled: Boolean(selectedId)
  });
  const mutate = useMutation({
    mutationFn: ({ type, id }) => (type === 'retry' ? retryCasinoMail(id) : processCasinoMail()),
    onSuccess: (result, variables) => {
      setNotice({
        open: true,
        severity: 'success',
        message:
          variables.type === 'retry'
            ? 'Correo devuelto a la cola.'
            : result.skipped
              ? 'Proveedor deshabilitado; no se procesaron correos.'
              : `Procesados ${result.processed}: ${result.sent} enviados.`
      });
      client.invalidateQueries({ queryKey: ['casino-mail-status'] });
    },
    onError: (error) =>
      setNotice({ open: true, severity: 'error', message: error.response?.data?.message || 'No fue posible ejecutar la acción.' })
  });
  const setFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPagination((p) => ({ ...p, page: 0 }));
  };
  const rows = query.data?.rows || [];
  const filteredCardRows = cardStatus ? (exportQuery.data?.rows || []).filter((row) => row.status === cardStatus) : [];
  const columns = [
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 105,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row">
          <Tooltip title="Ver detalle">
            <IconButton size="small" onClick={() => setSelectedId(row.id)}>
              <EyeOutlined />
            </IconButton>
          </Tooltip>
          {['ERROR', 'CANCELADO'].includes(row.status) && (
            <Tooltip title="Reintentar">
              <IconButton size="small" color="primary" onClick={() => mutate.mutate({ type: 'retry', id: row.id })}>
                <ReloadOutlined />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      )
    },
    { field: 'createdAt', headerName: 'Creado', width: 150, valueFormatter: (value) => dateTime.format(new Date(value)) },
    {
      field: 'status',
      headerName: 'Estado',
      width: 125,
      renderCell: ({ value }) => <Chip size="small" color={statusColor(value)} label={STATUS[value]} />
    },
    { field: 'eventType', headerName: 'Evento', width: 165, valueFormatter: (value) => EVENT[value] || value },
    { field: 'orderNumber', headerName: 'Pedido', width: 100, valueFormatter: (value) => (value ? `#${value}` : '—') },
    { field: 'recipient', headerName: 'Destinatario', minWidth: 230, flex: 1 },
    { field: 'subject', headerName: 'Asunto', minWidth: 250, flex: 1 },
    { field: 'attempts', headerName: 'Intentos', width: 90, type: 'number' },
    { field: 'sentAt', headerName: 'Enviado', width: 150, valueFormatter: (value) => (value ? dateTime.format(new Date(value)) : '—') }
  ];
  const exportColumns = columns
    .filter((c) => c.field !== 'actions')
    .map((c) => ({
      field: c.field,
      headerName: c.headerName,
      exportValue: (row) => (c.field === 'status' ? STATUS[row.status] : c.field === 'eventType' ? EVENT[row.eventType] : row[c.field])
    }));
  const summary = query.data?.summary || {};
  const cards = [
    ['Todos', summary.total, null],
    ['Pendientes', summary.pending, 'PENDIENTE'],
    ['Enviados', summary.sent, 'ENVIADO'],
    ['Con error', summary.failed, 'ERROR']
  ];
  const clear = (name) => <FilterClearAdornment visible={Boolean(filters[name])} onClear={() => setFilter(name, '')} />;
  return (
    <OperationalListShell>
      <OperationalListHero
        title="Estado de correos Casino"
        subtitle="Cola, entregas y reintentos de notificaciones"
        actions={
          <Stack direction="row" spacing={1}>
            <ListExportButtons
              title="Estado de correos Casino"
              rows={exportQuery.data?.rows || []}
              columns={exportColumns}
              filters={[`Desde: ${filters.from || 'abierto'}`, `Hasta: ${filters.to || 'abierto'}`]}
              onNotify={(value) => setNotice({ open: true, ...value })}
            />
            <Button
              variant="contained"
              color="inherit"
              startIcon={<SendOutlined />}
              onClick={() => mutate.mutate({ type: 'process' })}
              disabled={mutate.isPending}
              sx={{ color: 'primary.main' }}
            >
              Procesar cola
            </Button>
          </Stack>
        }
      />
      <Stack spacing={1.5}>
        {!query.data?.provider?.configured && (
          <Alert severity="warning">
            El proveedor de correos está deshabilitado o incompleto. La cola seguirá recibiendo eventos sin perderlos.
          </Alert>
        )}
        <Grid container spacing={1.25}>
          {cards.map(([label, value, status]) => (
            <Grid key={label} size={{ xs: 6, md: 3 }}>
              <Card variant="outlined" sx={operationalCardStyle(status === 'ERROR' ? 'red' : status === 'PENDIENTE' ? 'amber' : 'blue')}>
                <CardActionArea onClick={() => setCardStatus(status || 'ALL')}>
                  <CardContent sx={{ py: 1.25 }}>
                    <Typography variant="caption">{label}</Typography>
                    <Typography variant="h4">{integer.format(value || 0)}</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
          <TextField
            size="small"
            type="date"
            label="Desde"
            value={filters.from}
            onChange={(e) => setFilter('from', e.target.value)}
            sx={{ width: 165 }}
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: clear('from') } }}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            value={filters.to}
            onChange={(e) => setFilter('to', e.target.value)}
            sx={{ width: 165 }}
            slotProps={{ inputLabel: { shrink: true }, input: { endAdornment: clear('to') } }}
          />
          <TextField
            select
            size="small"
            label="Estado"
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            sx={{ minWidth: 170 }}
            slotProps={{ input: { endAdornment: clear('status') } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(STATUS).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Evento"
            value={filters.eventType}
            onChange={(e) => setFilter('eventType', e.target.value)}
            sx={{ minWidth: 210 }}
            slotProps={{ input: { endAdornment: clear('eventType') } }}
          >
            <MenuItem value="">Todos</MenuItem>
            {Object.entries(EVENT).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        {query.isError && <Alert severity="error">{query.error?.response?.data?.message || 'No fue posible cargar el estado.'}</Alert>}
        <DataGrid
          rows={rows}
          columns={columns}
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
      <Dialog open={Boolean(selectedId)} onClose={() => setSelectedId(null)} fullWidth maxWidth="md">
        <DialogTitle>Detalle del correo #{selectedId}</DialogTitle>
        <DialogContent dividers>
          {detail.isLoading && <Typography>Cargando…</Typography>}
          {detail.isError && <Alert severity="error">No fue posible cargar el detalle.</Alert>}
          {detail.data && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption">Destinatario</Typography>
                  <Typography>{detail.data.recipient}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption">Estado</Typography>
                  <Box>
                    <Chip size="small" color={statusColor(detail.data.status)} label={STATUS[detail.data.status]} />
                  </Box>
                </Grid>
              </Grid>
              <Typography>
                <strong>Asunto:</strong> {detail.data.subject}
              </Typography>
              {detail.data.lastError && <Alert severity="error">{detail.data.lastError}</Alert>}
              <Typography variant="h5">Historial de intentos</Typography>
              {detail.data.history.length ? (
                detail.data.history.map((item) => (
                  <Alert key={item.at} severity={item.success ? 'success' : 'error'}>
                    Intento {item.attempt} · {dateTime.format(new Date(item.at))}
                    {item.error ? ` · ${item.error}` : ''}
                  </Alert>
                ))
              ) : (
                <Alert severity="info">Todavía no hay intentos.</Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {['ERROR', 'CANCELADO'].includes(detail.data?.status) && (
            <Button startIcon={<ReloadOutlined />} onClick={() => mutate.mutate({ type: 'retry', id: selectedId })}>
              Reintentar
            </Button>
          )}
          <Button onClick={() => setSelectedId(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(cardStatus)} onClose={() => setCardStatus(null)} fullWidth maxWidth="md">
        <DialogTitle>{cardStatus === 'ALL' ? 'Todos los correos' : STATUS[cardStatus]}</DialogTitle>
        <DialogContent dividers>
          {(cardStatus === 'ALL' ? exportQuery.data?.rows || [] : filteredCardRows).slice(0, 100).map((row) => (
            <Typography key={row.id} sx={{ py: 0.5 }}>
              #{row.orderNumber || '—'} · {row.recipient} · {EVENT[row.eventType] || row.eventType}
            </Typography>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCardStatus(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={notice.open} autoHideDuration={4000} onClose={() => setNotice((n) => ({ ...n, open: false }))}>
        <Alert severity={notice.severity}>{notice.message}</Alert>
      </Snackbar>
    </OperationalListShell>
  );
}
