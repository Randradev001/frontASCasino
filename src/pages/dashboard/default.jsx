import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import BulbOutlined from '@ant-design/icons/BulbOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import RobotOutlined from '@ant-design/icons/RobotOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
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
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { PieChart } from '@mui/x-charts/PieChart';

import { getOrdersDashboard } from 'api/casinoBiApi';
import MainCard from 'components/MainCard';
import { useAuth } from 'contexts/AuthContext';

const BLUE = '#00549F';
const ORANGE = '#FF740C';
const LIGHT_BLUE = '#2D7FC1';
const initialFilters = { from: '', to: '', plant: 'all' };
const assistantFallbackSuggestions = [
  '¿Cómo está el cumplimiento?',
  '¿Qué faenadora concentra más monto?',
  '¿Cuál es el producto líder?',
  '¿Cómo viene la tendencia?'
];

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const formatPeriod = (period) => {
  if (!period) return '';
  return new Intl.DateTimeFormat('es-CL', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(`${period}-01T00:00:00Z`));
};

const statusColor = (status) => ({ 1: 'info', 2: 'warning', 3: 'success', 5: 'error' })[status] || 'default';

function KpiCard({ label, value, helper, icon, color = BLUE }) {
  return (
    <Paper elevation={0} sx={{ height: '100%', p: 2.25, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h3" sx={{ mt: 0.65, color }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
        <Avatar variant="rounded" sx={{ bgcolor: `${color}14`, color, width: 44, height: 44 }}>
          {icon}
        </Avatar>
      </Stack>
    </Paper>
  );
}

KpiCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  helper: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string
};

export default function DashboardDefault() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [dashboard, setDashboard] = useState(null);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantAskedQuestion, setAssistantAskedQuestion] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await getOrdersDashboard(filters));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No fue posible cargar la inteligencia de pedidos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const chartData = useMemo(
    () => ({
      trendLabels: (dashboard?.trend || []).map((item) => formatPeriod(item.period)),
      trendAmounts: (dashboard?.trend || []).map((item) => item.amount),
      plantLabels: (dashboard?.plants || []).map((item) => item.name.replace('Faenadora ', '')),
      plantAmounts: (dashboard?.plants || []).map((item) => item.amount),
      products: (dashboard?.topProducts || []).slice(0, 6),
      statusPie: (dashboard?.statuses || []).map((item) => ({
        id: item.status,
        value: item.orders,
        label: item.label,
        color: { 1: LIGHT_BLUE, 2: '#F5A623', 3: '#2E7D32', 5: '#D32F2F' }[item.status] || '#7A869A'
      }))
    }),
    [dashboard]
  );

  useEffect(() => {
    setAssistantAnswer(
      dashboard?.assistant?.welcome ||
        (dashboard
          ? 'El backend activo todavía no entrega el análisis conversacional. Actualice la aplicación o reinicie el servicio backend.'
          : '')
    );
    setAssistantQuestion('');
    setAssistantAskedQuestion('');
  }, [dashboard]);

  const askAssistant = (rawQuestion) => {
    const question = String(rawQuestion || assistantQuestion).trim();
    if (!question) return;
    if (!dashboard?.assistant?.answers) {
      setAssistantAskedQuestion(question);
      setAssistantAnswer(
        'No puedo responder porque el backend activo no incluyó el asistente. Recargue ADP después de reiniciar el backend.'
      );
      return;
    }

    const normalized = question
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    let intent = 'fallback';
    if (/cumpl|entreg|pendient|anulad|estado/.test(normalized)) intent = 'fulfillment';
    else if (/faenadora|planta|rosario|vicente|miranda/.test(normalized)) intent = 'plant';
    else if (/producto|articulo|item|comida|bebida|consum/.test(normalized)) intent = 'product';
    else if (/tendencia|mes|variacion|evolucion|sube|baja/.test(normalized)) intent = 'trend';
    else if (/resumen|negocio|general|monto|pedido/.test(normalized)) intent = 'overview';

    setAssistantQuestion(question);
    setAssistantAskedQuestion(question);
    setAssistantAnswer(dashboard.assistant.answers[intent] || dashboard.assistant.answers.fallback);
  };

  const assistantAvailable = Boolean(dashboard?.assistant?.answers);

  if (loading && !dashboard) {
    return (
      <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: BLUE }} />
      </Box>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          color: 'common.white',
          background: `linear-gradient(115deg, ${BLUE} 0%, #073D72 72%, #082F55 100%)`,
          position: 'relative',
          p: { xs: 2.5, md: 3.5 }
        }}
      >
        <Box
          sx={{ position: 'absolute', width: 190, height: 190, borderRadius: '50%', bgcolor: ORANGE, opacity: 0.13, right: -50, top: -95 }}
        />
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative' }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Chip label="BUSINESS INTELLIGENCE · CASINO" size="small" sx={{ bgcolor: ORANGE, color: 'white', fontWeight: 700 }} />
            <Typography variant="h2" sx={{ color: 'common.white', mt: 1.4 }}>
              Panel ejecutivo de pedidos
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.78)', maxWidth: 680 }}>
              Vista consolidada para Rosario, San Vicente y Lo Miranda. Empresa activa:{' '}
              {company?.nombre || `Empresa ${company?.empCod || ''}`}.
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent={{ md: 'flex-end' }}>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.65)' }}>
                  Cobertura de datos
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'white' }}>
                  {dashboard?.metadata?.dataFrom ? shortDate.format(new Date(dashboard.metadata.dataFrom)) : 'Sin datos'} —{' '}
                  {dashboard?.metadata?.dataTo ? shortDate.format(new Date(dashboard.metadata.dataTo)) : 'Sin datos'}
                </Typography>
              </Box>
              <Chip label="Histórico migrado" variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,.45)' }} />
              <Button
                variant="contained"
                startIcon={<PlusOutlined />}
                onClick={() => navigate('/casino/pedidos/nuevo')}
                sx={{ bgcolor: ORANGE, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#DF6100' } }}
              >
                Nueva solicitud
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <MainCard content={false}>
        <Box
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            setFilters({ ...draftFilters });
          }}
          sx={{ p: 2 }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 4, lg: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Faenadora"
                value={draftFilters.plant}
                onChange={(event) => setDraftFilters((current) => ({ ...current, plant: event.target.value }))}
              >
                <MenuItem value="all">Todas las faenadoras</MenuItem>
                <MenuItem value="rosario">Faenadora Rosario</MenuItem>
                <MenuItem value="san-vicente">Faenadora San Vicente</MenuItem>
                <MenuItem value="lo-miranda">Faenadora Lo Miranda</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 6, sm: 3, lg: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Desde"
                type="date"
                value={draftFilters.from}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3, lg: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Hasta"
                type="date"
                value={draftFilters.to}
                slotProps={{ inputLabel: { shrink: true } }}
                onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 2, lg: 5 }}>
              <Stack direction="row" spacing={1} justifyContent={{ lg: 'flex-end' }}>
                <Button type="submit" variant="contained" sx={{ bgcolor: BLUE }}>
                  Aplicar
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReloadOutlined />}
                  onClick={() => {
                    setDraftFilters(initialFilters);
                    setFilters(initialFilters);
                  }}
                >
                  Limpiar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </MainCard>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadDashboard}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {dashboard && (
        <>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <KpiCard
                label="Pedidos"
                value={integer.format(dashboard.kpis.orders)}
                helper={`${dashboard.kpis.pending} en flujo · ${dashboard.kpis.cancelled} anulados`}
                icon={<ShoppingCartOutlined />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <KpiCard
                label="Monto solicitado"
                value={money.format(dashboard.kpis.amount)}
                helper={`Ticket promedio ${money.format(dashboard.kpis.averageTicket)}`}
                icon={<DollarOutlined />}
                color={ORANGE}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <KpiCard
                label="Cumplimiento"
                value={`${dashboard.kpis.fulfillmentRate.toFixed(0)}%`}
                helper={`${dashboard.kpis.delivered} pedidos entregados`}
                icon={<CheckCircleOutlined />}
                color="#2E7D32"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <KpiCard
                label="Unidades"
                value={integer.format(dashboard.kpis.quantity)}
                helper="Cantidad acumulada en líneas"
                icon={<AppstoreOutlined />}
                color={LIGHT_BLUE}
              />
            </Grid>
          </Grid>

          <MainCard title="4 conclusiones rápidas" subheader="Lectura automática del negocio para el filtro aplicado">
            <Grid container spacing={1.5}>
              {(dashboard.conclusions || []).map((conclusion, index) => (
                <Grid key={conclusion.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: '100%',
                      p: 1.75,
                      borderRadius: 2.5,
                      bgcolor: index % 2 ? `${ORANGE}08` : `${BLUE}08`,
                      border: '1px solid',
                      borderColor: index % 2 ? `${ORANGE}24` : `${BLUE}20`
                    }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="flex-start">
                      <Avatar
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: index % 2 ? `${ORANGE}18` : `${BLUE}14`,
                          color: index % 2 ? ORANGE : BLUE
                        }}
                      >
                        <BulbOutlined />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">{conclusion.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45, lineHeight: 1.55 }}>
                          {conclusion.text}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </MainCard>

          <Grid container spacing={2}>
            {dashboard.plants.map((plant) => {
              const share = dashboard.kpis.amount ? (plant.amount / dashboard.kpis.amount) * 100 : 0;
              return (
                <Grid key={plant.id} size={{ xs: 12, md: 4 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.25,
                      height: '100%',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: plant.mapped ? 'divider' : 'warning.light'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box>
                        <Typography variant="overline" color="text.secondary">
                          FAENADORA
                        </Typography>
                        <Typography variant="h5">{plant.name.replace('Faenadora ', '')}</Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={plant.mapped ? `${plant.orders} pedidos` : 'Sin homologar'}
                        color={plant.mapped ? 'primary' : 'warning'}
                        variant="outlined"
                      />
                    </Stack>
                    <Typography variant="h4" sx={{ mt: 2, color: plant.mapped ? BLUE : 'text.disabled' }}>
                      {money.format(plant.amount)}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {integer.format(plant.quantity)} unidades
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {share.toFixed(1)}% del monto
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(share, 100)}
                      sx={{
                        mt: 1.25,
                        height: 7,
                        borderRadius: 5,
                        '& .MuiLinearProgress-bar': { bgcolor: plant.mapped ? ORANGE : 'grey.400' }
                      }}
                    />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          {dashboard.unmappedPlants.length > 0 && (
            <Alert severity="warning">
              La base tambien contiene {dashboard.unmappedPlants.map((item) => `${item.name} (${item.orders} pedido)`).join(', ')}. Se
              mantiene fuera de las tres faenadoras hasta validar su equivalencia organizacional.
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <MainCard title="Evolución mensual del monto" subheader="Valor de las líneas solicitadas por mes">
                {chartData.trendLabels.length ? (
                  <LineChart
                    height={310}
                    xAxis={[{ scaleType: 'point', data: chartData.trendLabels }]}
                    series={[
                      {
                        data: chartData.trendAmounts,
                        label: 'Monto',
                        color: BLUE,
                        area: true,
                        valueFormatter: (value) => money.format(value || 0)
                      }
                    ]}
                    grid={{ horizontal: true }}
                  />
                ) : (
                  <Alert severity="info">No hay datos para el período seleccionado.</Alert>
                )}
              </MainCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <MainCard title="Estado de pedidos" subheader="Distribución del flujo actual">
                {chartData.statusPie.length ? (
                  <PieChart
                    height={310}
                    series={[{ data: chartData.statusPie, innerRadius: 55, outerRadius: 100, paddingAngle: 2, cornerRadius: 4 }]}
                    slotProps={{ legend: { direction: 'horizontal', position: { vertical: 'bottom', horizontal: 'center' } } }}
                  />
                ) : (
                  <Alert severity="info">No hay estados para mostrar.</Alert>
                )}
              </MainCard>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 5 }}>
              <MainCard title="Comparativo por faenadora" subheader="Monto homologado solicitado">
                <BarChart
                  height={320}
                  xAxis={[{ scaleType: 'band', data: chartData.plantLabels }]}
                  series={[
                    { data: chartData.plantAmounts, label: 'Monto', color: ORANGE, valueFormatter: (value) => money.format(value || 0) }
                  ]}
                  grid={{ horizontal: true }}
                />
              </MainCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 7 }}>
              <MainCard title="Productos de mayor valor" subheader="Top 6 por importe acumulado">
                {chartData.products.length ? (
                  <BarChart
                    height={320}
                    layout="horizontal"
                    yAxis={[{ scaleType: 'band', data: chartData.products.map((item) => item.name) }]}
                    xAxis={[{ valueFormatter: (value) => money.format(value || 0) }]}
                    series={[
                      {
                        data: chartData.products.map((item) => item.amount),
                        label: 'Monto',
                        color: BLUE,
                        valueFormatter: (value) => money.format(value || 0)
                      }
                    ]}
                    margin={{ left: 155 }}
                    grid={{ vertical: true }}
                  />
                ) : (
                  <Alert severity="info">No hay productos para mostrar.</Alert>
                )}
              </MainCard>
            </Grid>
          </Grid>

          <Grid container spacing={2} alignItems="stretch">
            <Grid size={{ xs: 12, lg: 7 }}>
              <MainCard title="Pedidos recientes" subheader="Últimos movimientos dentro del filtro aplicado" content={false}>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Pedido</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Casino / destino</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Monto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.recentOrders.map((order) => (
                        <TableRow key={order.number} hover>
                          <TableCell>
                            <Typography variant="subtitle2">#{order.number}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {integer.format(order.quantity)} un.
                            </Typography>
                          </TableCell>
                          <TableCell>{shortDate.format(new Date(order.createdAt))}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{order.casino}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {order.destination}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" variant="outlined" color={statusColor(order.status)} label={order.statusLabel} />
                          </TableCell>
                          <TableCell align="right">{money.format(order.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </MainCard>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <MainCard title="Asistente analítico de negocio" subheader="Consultas rápidas sobre los datos visibles">
                <Stack spacing={1.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ bgcolor: `${BLUE}12`, color: BLUE }}>
                      <RobotOutlined />
                    </Avatar>
                    <Box>
                      <Chip
                        size="small"
                        label="ANÁLISIS LOCAL · SIN API"
                        sx={{ bgcolor: `${ORANGE}16`, color: '#B54E00', fontWeight: 800 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.35 }}>
                        Respuestas fundamentadas en el filtro actual
                      </Typography>
                    </Box>
                  </Stack>
                  <Paper
                    elevation={0}
                    sx={{ p: 1.75, minHeight: 92, borderRadius: 2.5, bgcolor: '#F6F9FC', borderLeft: `4px solid ${BLUE}` }}
                  >
                    {assistantAskedQuestion && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                        Tu pregunta: {assistantAskedQuestion}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                      {assistantAnswer}
                    </Typography>
                  </Paper>
                  <Box
                    component="form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      askAssistant();
                    }}
                  >
                    <Stack direction="row" spacing={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Pregunta acerca del negocio"
                        placeholder="Ej.: ¿Cómo viene la tendencia?"
                        value={assistantQuestion}
                        onChange={(event) => setAssistantQuestion(event.target.value)}
                        disabled={!assistantAvailable}
                        slotProps={{ htmlInput: { maxLength: 180 } }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        aria-label="Preguntar al asistente"
                        disabled={!assistantAvailable || !assistantQuestion.trim()}
                        sx={{ minWidth: 46, bgcolor: BLUE }}
                      >
                        <SendOutlined />
                      </Button>
                    </Stack>
                  </Box>
                  <Stack spacing={0.5} alignItems="flex-start">
                    {(dashboard.assistant?.suggestions || assistantFallbackSuggestions).map((suggestion) => (
                      <Button
                        key={suggestion}
                        size="small"
                        variant="text"
                        disabled={!assistantAvailable}
                        onClick={() => askAssistant(suggestion)}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Esta versión no es ChatGPT: no usa un modelo generativo ni envía datos fuera de ADP. Reconoce preguntas sobre
                    cumplimiento, faenadoras, productos y tendencia.
                  </Typography>
                </Stack>
              </MainCard>
            </Grid>
          </Grid>
        </>
      )}
    </Stack>
  );
}
