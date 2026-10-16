import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';
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

import {
  approveCasinoRequest,
  deliverCasinoRequest,
  getCasinoRequestDetail,
  getCasinoRequests,
  getRequesterCasinoHistory,
  rejectCasinoRequest
} from 'api/casinoSolicitudesApi';

const BLUE = '#00549F';
const ORANGE = '#FF740C';
const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFormat = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC'
});

const formatDate = (value, withTime = false) => (value ? (withTime ? dateTimeFormat : dateFormat).format(new Date(value)) : 'Sin fecha');
const statusColor = (status) => ({ 1: 'info', 2: 'warning', 3: 'success', 5: 'error' })[status] || 'default';
const inputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');
const inputTime = (value) => (value ? new Date(value).toISOString().slice(11, 16) : '');
const timingAt = (scheduledAt, actualAt) => {
  const difference = Math.floor((new Date(actualAt).getTime() - new Date(scheduledAt).getTime()) / 60000);
  if (difference < 0) return { code: 'ANTICIPADO', label: 'Anticipado', minutes: Math.abs(difference), color: 'info' };
  if (difference > 0) return { code: 'ATRASADO', label: 'Tarde', minutes: difference, color: 'error' };
  return { code: 'ATIEMPO', label: 'A tiempo', minutes: 0, color: 'success' };
};
const durationLabel = (minutes) => {
  if (!minutes) return 'en el minuto comprometido';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const remainingMinutes = minutes % 60;
  return [days ? `${days} d` : '', hours ? `${hours} h` : '', remainingMinutes ? `${remainingMinutes} min` : ''].filter(Boolean).join(' ');
};

const DetailBody = ({ detail }) => (
  <Stack spacing={2}>
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
          Destino / motivo
        </Typography>
        <Typography variant="subtitle2">{detail.destination}</Typography>
        <Typography variant="caption">{detail.motive}</Typography>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Typography variant="caption" color="text.secondary">
          Entrega
        </Typography>
        <Typography variant="subtitle2">{formatDate(detail.deliveryTime, true)}</Typography>
      </Grid>
    </Grid>
    {detail.description && (
      <Alert severity="info">
        <strong>Indicaciones:</strong> {detail.description}
      </Alert>
    )}
    {detail.decisionComment && (
      <Alert severity="error">
        <strong>Motivo del rechazo:</strong> {detail.decisionComment}
      </Alert>
    )}
    {detail.delivery && (
      <Alert severity={detail.delivery.code === 'ATRASADO' ? 'error' : detail.delivery.code === 'ANTICIPADO' ? 'info' : 'success'}>
        <strong>Entrega {detail.delivery.label.toLowerCase()}:</strong>{' '}
        {detail.delivery.minutes ? durationLabel(detail.delivery.minutes) : 'en el minuto comprometido'}. Registrada el{' '}
        {formatDate(detail.delivery.actualAt, true)}.
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
          Costo total
        </Typography>
        <Typography variant="h3" color={BLUE}>
          {money.format(detail.amount)}
        </Typography>
      </Box>
    </Stack>
  </Stack>
);

export default function CasinoRequestsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailNumber, setDetailNumber] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [decision, setDecision] = useState(null);
  const [deliveryOrder, setDeliveryOrder] = useState(null);
  const [currentMoment, setCurrentMoment] = useState(new Date());
  const [decisionForm, setDecisionForm] = useState({ deliveryDate: '', deliveryTime: '', comment: '' });
  const [saving, setSaving] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await getCasinoRequests({ status, search: appliedSearch, page, pageSize: 10 }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No fue posible cargar las solicitudes del Casino.');
    } finally {
      setLoading(false);
    }
  }, [status, appliedSearch, page]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!deliveryOrder) return undefined;
    setCurrentMoment(new Date(data?.serverNow || Date.now()));
    const timer = window.setInterval(() => setCurrentMoment((moment) => new Date(moment.getTime() + 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [deliveryOrder, data?.serverNow]);

  const openDetail = async (number) => {
    setDetailNumber(number);
    setDetail(null);
    setDialogError('');
    setDialogLoading(true);
    try {
      setDetail(await getCasinoRequestDetail(number));
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'No fue posible cargar el detalle.');
    } finally {
      setDialogLoading(false);
    }
  };

  const openHistory = async (order) => {
    setHistoryOpen(true);
    setHistory(null);
    setDialogError('');
    setDialogLoading(true);
    try {
      const response = await getRequesterCasinoHistory(order.requesterRut);
      setHistory({ ...response, orders: response.orders.filter((item) => item.number !== order.number) });
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'No fue posible cargar el historial de la persona.');
    } finally {
      setDialogLoading(false);
    }
  };

  const openDecision = (type, order) => {
    setDecision({ type, order });
    setDecisionForm({ deliveryDate: inputDate(order.deliveryAt), deliveryTime: inputTime(order.deliveryTime), comment: '' });
    setDialogError('');
  };

  const submitDecision = async () => {
    setSaving(true);
    setDialogError('');
    try {
      if (decision.type === 'approve') {
        await approveCasinoRequest(decision.order.number, {
          deliveryDate: decisionForm.deliveryDate,
          deliveryTime: decisionForm.deliveryTime
        });
        setNotice(`Solicitud #${decision.order.number} aprobada y pasada a preparación.`);
      } else {
        await rejectCasinoRequest(decision.order.number, { comment: decisionForm.comment });
        setNotice(`Solicitud #${decision.order.number} rechazada.`);
      }
      setDecision(null);
      await loadRequests();
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'No fue posible registrar la decisión.');
    } finally {
      setSaving(false);
    }
  };

  const submitDelivery = async () => {
    setSaving(true);
    setDialogError('');
    try {
      const result = await deliverCasinoRequest(deliveryOrder.number);
      setNotice(
        `Pedido #${deliveryOrder.number} entregado ${result.label.toLowerCase()}${result.minutes ? ` (${durationLabel(result.minutes)})` : ''}.`
      );
      setDeliveryOrder(null);
      await loadRequests();
    } catch (requestError) {
      setDialogError(requestError.response?.data?.message || 'No fue posible confirmar la entrega.');
    } finally {
      setSaving(false);
    }
  };

  const currentTiming = deliveryOrder ? timingAt(deliveryOrder.deliveryTime, currentMoment) : null;

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          color: 'white',
          background: `linear-gradient(115deg, ${BLUE} 0%, #073D72 72%, #082F55 100%)`,
          p: { xs: 2.5, md: 3.5 },
          position: 'relative'
        }}
      >
        <Box
          sx={{ position: 'absolute', width: 240, height: 240, borderRadius: '50%', bgcolor: ORANGE, opacity: 0.14, right: -65, top: -125 }}
        />
        <Grid container spacing={2} alignItems="center" sx={{ position: 'relative' }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Button
              color="inherit"
              startIcon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/default')}
              sx={{ mb: 1, opacity: 0.82 }}
            >
              Panel ejecutivo
            </Button>
            <Chip label="OPERACIONAL" size="small" sx={{ ml: 1, bgcolor: ORANGE, color: 'white', fontWeight: 800 }} />
            <Typography variant="h2" color="inherit">
              Ver solicitudes
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.76)', maxWidth: 760 }}>
              Revisa los pedidos enviados a {data?.casino.name || 'tu Casino'}, consulta su detalle e historial y registra la decisión
              operacional.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                ml: { md: 'auto' },
                maxWidth: 260,
                bgcolor: 'rgba(255,255,255,.12)',
                color: 'white',
                border: '1px solid rgba(255,255,255,.18)',
                borderRadius: 3
              }}
            >
              <Typography variant="overline" color="inherit">
                Solicitudes visibles
              </Typography>
              <Typography variant="h2" color="inherit">
                {integer.format(data?.summary.total || 0)}
              </Typography>
              <Typography variant="caption" color="inherit">
                {data?.summary.pending || 0} pendientes de decisión
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {notice && (
        <Alert severity="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      <Paper
        elevation={0}
        component="form"
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search);
          setPage(1);
        }}
        sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar pedido, RUT, persona o destino"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="active">Acciones pendientes</MenuItem>
              <MenuItem value="all">Todos</MenuItem>
              {(
                data?.statuses || [
                  { id: 1, name: 'Enviado al casino' },
                  { id: 2, name: 'En preparación' },
                  { id: 3, name: 'Entregado' },
                  { id: 5, name: 'Anulado' }
                ]
              ).map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button type="submit" variant="contained" sx={{ bgcolor: BLUE }}>
                Buscar
              </Button>
              <Button variant="outlined" startIcon={<ReloadOutlined />} onClick={loadRequests}>
                Actualizar
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={loadRequests}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}
      {loading && !data && (
        <Box sx={{ py: 8, display: 'grid', placeItems: 'center' }}>
          <CircularProgress sx={{ color: BLUE }} />
        </Box>
      )}
      {data && (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Solicitud</TableCell>
                  <TableCell>Solicitante</TableCell>
                  <TableCell>Destino / motivo</TableCell>
                  <TableCell>Entrega</TableCell>
                  <TableCell align="right">Costo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={order.number} hover>
                    <TableCell>
                      <Typography variant="subtitle2" color={BLUE}>
                        #{order.number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Creada {formatDate(order.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.requesterName || order.requestedBy}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        RUT {integer.format(order.requesterRut)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{order.destination}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.motive}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(order.deliveryTime, true)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{money.format(order.amount)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.products} prod. · {integer.format(order.quantity)} un.
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color={statusColor(order.status)} label={order.statusLabel} />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center" flexWrap="wrap" useFlexGap>
                        <Button size="small" startIcon={<EyeOutlined />} onClick={() => openDetail(order.number)}>
                          Ver
                        </Button>
                        <Button size="small" startIcon={<HistoryOutlined />} onClick={() => openHistory(order)}>
                          Historial
                        </Button>
                        {order.canDecide && (
                          <Button size="small" color="success" startIcon={<CheckOutlined />} onClick={() => openDecision('approve', order)}>
                            Aprobar
                          </Button>
                        )}
                        {order.canDeliver && (
                          <Button
                            size="small"
                            color="success"
                            startIcon={<CheckCircleOutlined />}
                            onClick={() => {
                              setDialogError('');
                              setDeliveryOrder(order);
                            }}
                          >
                            Entregar pedido
                          </Button>
                        )}
                        {order.canDecide && (
                          <Button size="small" color="error" startIcon={<CloseOutlined />} onClick={() => openDecision('reject', order)}>
                            Rechazar
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                {!data.orders.length && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Alert severity="info">No hay solicitudes para los filtros seleccionados.</Alert>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {data.pagination.pages > 1 && (
            <Stack direction="row" justifyContent="center" sx={{ p: 2 }}>
              <Pagination color="primary" page={page} count={data.pagination.pages} onChange={(_, value) => setPage(value)} />
            </Stack>
          )}
        </Paper>
      )}

      <Dialog open={Boolean(detailNumber)} onClose={() => setDetailNumber(null)} fullWidth maxWidth="md">
        <DialogTitle>Detalle de la solicitud #{detailNumber}</DialogTitle>
        <DialogContent dividers>
          {dialogLoading && (
            <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          {detail && <DetailBody detail={detail} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailNumber(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Historial de {history?.requesterName || 'la persona'}</DialogTitle>
        <DialogContent dividers>
          {dialogLoading && (
            <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          )}
          {dialogError && <Alert severity="error">{dialogError}</Alert>}
          {history && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Pedido</TableCell>
                    <TableCell>Entrega</TableCell>
                    <TableCell>Destino / motivo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Costo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.orders.map((order) => (
                    <TableRow
                      key={order.number}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => {
                        setHistoryOpen(false);
                        openDetail(order.number);
                      }}
                    >
                      <TableCell>#{order.number}</TableCell>
                      <TableCell>{formatDate(order.deliveryTime, true)}</TableCell>
                      <TableCell>
                        {order.destination}
                        <Typography display="block" variant="caption" color="text.secondary">
                          {order.motive}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" color={statusColor(order.status)} label={order.statusLabel} />
                      </TableCell>
                      <TableCell align="right">{money.format(order.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {!history.orders.length && (
                    <TableRow>
                      <TableCell colSpan={5}>No existen pedidos anteriores para esta persona en el Casino.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deliveryOrder)} onClose={() => !saving && setDeliveryOrder(null)} fullWidth maxWidth="sm">
        <DialogTitle>Entregar pedido #{deliveryOrder?.number}</DialogTitle>
        <DialogContent dividers>
          {deliveryOrder && currentTiming && (
            <Stack spacing={2}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Entrega comprometida
                  </Typography>
                  <Typography variant="h4">{formatDate(deliveryOrder.deliveryTime, true)}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Fecha y hora actual del servidor
                  </Typography>
                  <Typography variant="h4">{formatDate(currentMoment, true)}</Typography>
                </Grid>
              </Grid>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: `${currentTiming.color}.main` }}>
                <Chip color={currentTiming.color} label={currentTiming.label.toUpperCase()} sx={{ fontWeight: 800 }} />
                <Typography variant="h3" sx={{ mt: 1 }}>
                  {durationLabel(currentTiming.minutes)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentTiming.code === 'ANTICIPADO'
                    ? 'El pedido se entrega antes de la hora comprometida.'
                    : currentTiming.code === 'ATRASADO'
                      ? 'El pedido se entrega después de la hora comprometida.'
                      : 'El pedido se entrega en el minuto comprometido.'}
                </Typography>
              </Paper>
              <Alert severity="info">Al confirmar, el servidor volverá a calcular la diferencia y registrará la hora efectiva.</Alert>
              {dialogError && <Alert severity="error">{dialogError}</Alert>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeliveryOrder(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" color="success" startIcon={<CheckCircleOutlined />} onClick={submitDelivery} disabled={saving}>
            {saving ? 'Registrando…' : 'Confirmar entrega'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(decision)} onClose={() => !saving && setDecision(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {decision?.type === 'approve' ? `Aprobar solicitud #${decision.order.number}` : `Rechazar solicitud #${decision?.order.number}`}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {decision?.type === 'approve' ? (
              <>
                <Alert severity="info">Confirma la fecha y hora comprometidas antes de pasar el pedido a preparación.</Alert>
                <TextField
                  type="date"
                  label="Fecha de entrega"
                  value={decisionForm.deliveryDate}
                  onChange={(event) => setDecisionForm((current) => ({ ...current, deliveryDate: event.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
                <TextField
                  type="time"
                  label="Hora de entrega"
                  value={decisionForm.deliveryTime}
                  onChange={(event) => setDecisionForm((current) => ({ ...current, deliveryTime: event.target.value }))}
                  slotProps={{ inputLabel: { shrink: true } }}
                  required
                />
              </>
            ) : (
              <>
                <Alert severity="warning">El comentario quedará registrado como motivo del rechazo.</Alert>
                <TextField
                  multiline
                  minRows={4}
                  label="Comentario obligatorio"
                  value={decisionForm.comment}
                  onChange={(event) => setDecisionForm((current) => ({ ...current, comment: event.target.value }))}
                  inputProps={{ maxLength: 500 }}
                  required
                  helperText={`${decisionForm.comment.length}/500`}
                />
              </>
            )}
            {dialogError && <Alert severity="error">{dialogError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecision(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color={decision?.type === 'approve' ? 'success' : 'error'}
            onClick={submitDecision}
            disabled={
              saving ||
              (decision?.type === 'reject'
                ? decisionForm.comment.trim().length < 3
                : !decisionForm.deliveryDate || !decisionForm.deliveryTime)
            }
          >
            {saving ? 'Guardando…' : decision?.type === 'approve' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
