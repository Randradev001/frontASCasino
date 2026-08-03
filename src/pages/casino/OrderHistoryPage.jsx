import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import FilterOutlined from '@ant-design/icons/FilterOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { PieChart } from '@mui/x-charts/PieChart';

import { getOrderHistoryDetail, getOrdersHistory } from 'api/casinoBiApi';

const BLUE = '#00549F';
const ORANGE = '#FF740C';
const LIGHT_BLUE = '#2D7FC1';
const initialFilters = {
  search: '',
  from: '',
  to: '',
  status: 'all',
  casinoId: 'all',
  destinationId: 'all',
  motiveId: 'all',
  categoryId: 'all',
  productId: 'all'
};

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortDateTime = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
});

const formatDate = (value, withTime = false) => (value ? (withTime ? shortDateTime : shortDate).format(new Date(value)) : 'Sin fecha');
const statusColor = (status) => ({ 0: 'default', 1: 'info', 2: 'warning', 3: 'success', 5: 'error' })[status] || 'default';

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailNumber, setDetailNumber] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setHistory(await getOrdersHistory({ ...filters, page, pageSize }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No fue posible cargar el historial de pedidos.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const openDetail = useCallback(async (number) => {
    setDetailNumber(number);
    setDetail(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      setDetail(await getOrderHistoryDetail(number));
    } catch (requestError) {
      setDetailError(requestError.response?.data?.message || 'No fue posible cargar el detalle del pedido.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const requestedNumber = Number(searchParams.get('pedido'));
    if (!Number.isInteger(requestedNumber) || requestedNumber <= 0) return;
    openDetail(requestedNumber);
    setSearchParams({}, { replace: true });
  }, [openDetail, searchParams, setSearchParams]);

  const productsForCategory = useMemo(() => {
    const products = history?.catalogs.products || [];
    if (draftFilters.categoryId === 'all') return products;
    return products.filter((product) => product.categoryId === Number(draftFilters.categoryId));
  }, [history, draftFilters.categoryId]);

  const chartData = useMemo(
    () =>
      (history?.typeCounters || []).map((item, index) => ({
        id: item.id,
        value: item.quantity,
        label: item.name,
        color: [BLUE, ORANGE, LIGHT_BLUE, '#5C6BC0', '#00897B', '#F5A623', '#7A869A'][index % 7]
      })),
    [history]
  );

  const resetFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(1);
  };

  const closeDetail = () => {
    setDetailNumber(null);
    setDetail(null);
    setDetailError('');
  };

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          color: 'white',
          background: `linear-gradient(115deg, ${BLUE} 0%, #073D72 72%, #082F55 100%)`,
          position: 'relative',
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box
          sx={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', bgcolor: ORANGE, opacity: 0.14, right: -65, top: -125 }}
        />
        <Grid container spacing={2.5} alignItems="center" sx={{ position: 'relative' }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Button
              color="inherit"
              startIcon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/default')}
              sx={{ mb: 1, opacity: 0.82 }}
            >
              Panel ejecutivo
            </Button>
            <Chip label="CONSULTAS · HISTORIAL" size="small" sx={{ ml: 1, bgcolor: ORANGE, color: 'white', fontWeight: 800 }} />
            <Typography variant="h2" color="inherit">
              Historial inteligente de pedidos
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.76)', maxWidth: 720 }}>
              Investiga el consumo por tipo y producto, filtra cada pedido y abre su detalle completo sin salir del panel.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} alignItems={{ md: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={() => navigate('/casino/pedidos/nuevo')}
                sx={{ bgcolor: ORANGE, '&:hover': { bgcolor: '#DF6100' } }}
              >
                Nueva solicitud
              </Button>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.65)' }}>
                {history ? `${integer.format(history.pagination.total)} pedidos encontrados` : 'Preparando datos…'}
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper
        component="form"
        elevation={0}
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ ...draftFilters });
        }}
        sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <FilterOutlined style={{ color: BLUE }} />
          <Typography variant="h5">Filtros del historial</Typography>
        </Stack>
        <Grid container spacing={1.4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar pedido, RUT o solicitante"
              value={draftFilters.search}
              onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              value={draftFilters.from}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              value={draftFilters.to}
              slotProps={{ inputLabel: { shrink: true } }}
              onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={draftFilters.status}
              onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {(history?.catalogs.statuses || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Casino"
              value={draftFilters.casinoId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, casinoId: event.target.value }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {(history?.catalogs.casinos || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Destino"
              value={draftFilters.destinationId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, destinationId: event.target.value }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {(history?.catalogs.destinations || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Motivo"
              value={draftFilters.motiveId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, motiveId: event.target.value }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {(history?.catalogs.motives || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Tipo de producto"
              value={draftFilters.categoryId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, categoryId: event.target.value, productId: 'all' }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {(history?.catalogs.categories || []).map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Producto"
              value={draftFilters.productId}
              onChange={(event) => setDraftFilters((current) => ({ ...current, productId: event.target.value }))}
            >
              <MenuItem value="all">Todos</MenuItem>
              {productsForCategory.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button variant="outlined" startIcon={<ReloadOutlined />} onClick={resetFilters}>
                Limpiar
              </Button>
              <Button type="submit" variant="contained" startIcon={<FilterOutlined />} sx={{ bgcolor: BLUE }}>
                Aplicar filtros
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={loadHistory}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {loading && !history && (
        <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress sx={{ color: BLUE }} />
        </Box>
      )}

      {history && (
        <>
          <Grid container spacing={2} alignItems="flex-start">
            <Grid size={{ xs: 12, lg: 8 }}>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ sm: 'center' }}
                  spacing={1}
                  sx={{ p: 2 }}
                >
                  <Box>
                    <Typography variant="h4">Listado histórico</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Selecciona un pedido para revisar todos sus productos y datos de entrega.
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Filas</Typography>
                    <TextField
                      select
                      size="small"
                      value={pageSize}
                      onChange={(event) => {
                        setPageSize(Number(event.target.value));
                        setPage(1);
                      }}
                    >
                      {[10, 25, 50].map((size) => (
                        <MenuItem key={size} value={size}>
                          {size}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>
                </Stack>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pedido</TableCell>
                        <TableCell>Solicitante</TableCell>
                        <TableCell>Casino / destino</TableCell>
                        <TableCell>Entrega</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Resumen</TableCell>
                        <TableCell align="center">Detalle</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history.orders.map((order) => (
                        <TableRow key={order.number} hover sx={{ cursor: 'pointer' }} onClick={() => openDetail(order.number)}>
                          <TableCell>
                            <Typography variant="subtitle2" color={BLUE}>
                              #{order.number}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(order.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{order.requesterName || order.requestedBy}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              RUT {integer.format(order.requesterRut)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{order.casino}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.destination} · {order.motive}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(order.deliveryTime, true)}</TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" color={statusColor(order.status)} label={order.statusLabel} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">{money.format(order.amount)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.products} prod. · {integer.format(order.quantity)} un.
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<EyeOutlined />}
                              onClick={(event) => {
                                event.stopPropagation();
                                openDetail(order.number);
                              }}
                            >
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!history.orders.length && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Alert severity="info">No hay pedidos para los filtros seleccionados.</Alert>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                {history.pagination.pages > 1 && (
                  <Stack direction="row" justifyContent="center" sx={{ p: 2 }}>
                    <Pagination color="primary" page={page} count={history.pagination.pages} onChange={(_, value) => setPage(value)} />
                  </Stack>
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <Stack spacing={2} sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
                <Paper elevation={0} sx={{ p: 2.25, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                  <Typography variant="h4">Composición por tipo</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Participación sobre las unidades filtradas
                  </Typography>
                  {chartData.length ? (
                    <PieChart
                      height={310}
                      series={[{ data: chartData, innerRadius: 58, outerRadius: 108, paddingAngle: 2, cornerRadius: 4 }]}
                      slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' } } }}
                    />
                  ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Sin información para graficar.
                    </Alert>
                  )}
                </Paper>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.25,
                    borderRadius: 3,
                    color: 'white',
                    background: `linear-gradient(145deg, ${BLUE}, #073D72)`,
                    borderLeft: `5px solid ${ORANGE}`
                  }}
                >
                  <Chip size="small" label="CONCLUSIÓN RÁPIDA" sx={{ bgcolor: ORANGE, color: 'white', fontWeight: 800 }} />
                  <Typography variant="h4" color="inherit" sx={{ mt: 1.5 }}>
                    Lectura del período
                  </Typography>
                  <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.78)', lineHeight: 1.65 }}>{history.insight}</Typography>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </>
      )}

      <Dialog open={Boolean(detailNumber)} onClose={closeDetail} fullWidth maxWidth="md">
        <DialogTitle>Detalle del pedido #{detailNumber}</DialogTitle>
        <DialogContent dividers>
          {detailLoading && (
            <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
              <CircularProgress sx={{ color: BLUE }} />
            </Box>
          )}
          {detailError && <Alert severity="error">{detailError}</Alert>}
          {detail && (
            <Stack spacing={2.25}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip size="small" color={statusColor(detail.status)} label={detail.statusLabel} />
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Solicitante
                  </Typography>
                  <Typography variant="subtitle2">{detail.requesterName || detail.requestedBy}</Typography>
                  <Typography variant="caption">RUT {integer.format(detail.requesterRut)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Casino / destino
                  </Typography>
                  <Typography variant="subtitle2">{detail.casino}</Typography>
                  <Typography variant="caption">{detail.destination}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Entrega
                  </Typography>
                  <Typography variant="subtitle2">{formatDate(detail.deliveryTime, true)}</Typography>
                  <Typography variant="caption">{detail.motive}</Typography>
                </Grid>
              </Grid>
              {detail.description && (
                <Alert severity="info">
                  <strong>Indicaciones:</strong> {detail.description}
                </Alert>
              )}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Ubicación</TableCell>
                      <TableCell align="right">Precio</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.lines.map((line) => (
                      <TableRow key={line.productId}>
                        <TableCell>
                          <Typography variant="subtitle2">{line.productName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.typeName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{line.location.division}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.location.subdivision} · {line.location.costCenter}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{money.format(line.price)}</TableCell>
                        <TableCell align="right">{integer.format(line.quantity)}</TableCell>
                        <TableCell align="right">{money.format(line.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Stack direction="row" justifyContent="flex-end" spacing={3}>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Unidades
                  </Typography>
                  <Typography variant="h4">{integer.format(detail.quantity)}</Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary">
                    Monto total
                  </Typography>
                  <Typography variant="h3" color={BLUE}>
                    {money.format(detail.amount)}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
