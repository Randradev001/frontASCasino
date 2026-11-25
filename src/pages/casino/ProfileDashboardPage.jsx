import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { getCasinoDashboard, getMyOrdersDashboard } from 'api/casinoBiApi';

const BLUE = '#00549F';
const ORANGE = '#FF740C';
const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL');
const date = new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });

const Kpi = ({ label, value, accent = BLUE }) => (
  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderTop: `4px solid ${accent}`, borderRadius: 3 }}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography variant="h2" sx={{ mt: 0.5 }}>
      {value}
    </Typography>
  </Paper>
);
Kpi.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired, accent: PropTypes.string };

export default function ProfileDashboardPage({ profile }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    (profile === 'casino' ? getCasinoDashboard() : getMyOrdersDashboard())
      .then(setData)
      .catch((e) => setError(e.response?.data?.message || 'No fue posible cargar el dashboard.'));
  }, [profile]);
  const pie = useMemo(
    () =>
      (data?.products || []).slice(0, 8).map((item, index) => ({
        id: item.id,
        value: item.orders,
        label: item.name,
        color: [BLUE, ORANGE, '#2D7FC1', '#00897B', '#5C6BC0', '#F5A623'][index % 6]
      })),
    [data]
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data)
    return (
      <Box sx={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  const casino = profile === 'casino';
  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3, color: 'white', background: `linear-gradient(120deg, ${BLUE}, #073B6B)` }}
      >
        <Typography variant="overline">DASHBOARD · {casino ? 'CASINO' : 'PERSONAL'}</Typography>
        <Typography variant="h2" color="inherit">
          {casino ? 'Control de pedidos del casino' : 'Mis pedidos al casino'}
        </Typography>
        <Typography sx={{ opacity: 0.76, mt: 1 }}>
          {casino ? 'Indicadores del casino asociado a tu sesión.' : 'Consumo y pedidos de la persona autenticada.'}
        </Typography>
      </Paper>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi label="Cantidad total de pedidos" value={integer.format(data.kpis.orders)} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi label="Valor total en productos" value={money.format(data.kpis.amount)} accent={ORANGE} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Kpi label="Unidades solicitadas" value={integer.format(data.kpis.quantity)} accent="#2D7FC1" />
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h4">{casino ? 'Pedidos por tipo de producto' : 'Pedidos por mes'}</Typography>
            <BarChart
              height={300}
              xAxis={[{ scaleType: 'band', data: (casino ? data.types : data.trend).map((x) => (casino ? x.name : x.period)) }]}
              series={[{ data: (casino ? data.types : data.trend).map((x) => x.orders), color: BLUE, label: 'Pedidos' }]}
            />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h4">Pedidos por producto</Typography>
            <PieChart height={300} series={[{ data: pie, innerRadius: 55 }]} />
          </Paper>
        </Grid>
        {!casino && (
          <>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="h4">Valor por tipo de producto</Typography>
                <BarChart
                  height={300}
                  layout="horizontal"
                  yAxis={[{ scaleType: 'band', data: data.types.map((x) => x.name) }]}
                  series={[{ data: data.types.map((x) => x.amount), color: ORANGE }]}
                />
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Typography variant="h4">Valor por producto</Typography>
                <BarChart
                  height={300}
                  layout="horizontal"
                  yAxis={[{ scaleType: 'band', data: data.products.slice(0, 8).map((x) => x.name) }]}
                  series={[{ data: data.products.slice(0, 8).map((x) => x.amount), color: BLUE }]}
                />
              </Paper>
            </Grid>
          </>
        )}
        {casino && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Paper sx={{ p: 2.5, borderRadius: 3 }}>
              <Typography variant="h4">Pedidos por valoración</Typography>
              <BarChart
                height={300}
                xAxis={[
                  { scaleType: 'band', data: data.ratings.map((x) => ['Sin evaluación', 'Malo', 'Regular', 'Bueno'][x.rating] || x.rating) }
                ]}
                series={[{ data: data.ratings.map((x) => x.orders), color: ORANGE }]}
              />
            </Paper>
          </Grid>
        )}
        <Grid size={{ xs: 12, lg: casino ? 6 : 12 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h4">{casino ? 'Cantidad de pedidos por usuario' : 'Últimos pedidos'}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {casino ? (
                      <>
                        <TableCell>Usuario</TableCell>
                        <TableCell align="right">Pedidos</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>Pedido</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell align="right">Valor</TableCell>
                        <TableCell />
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(casino ? data.users : data.recentOrders).map((row) => (
                    <TableRow key={casino ? row.rut : row.number}>
                      {casino ? (
                        <>
                          <TableCell>{row.name}</TableCell>
                          <TableCell align="right">{integer.format(row.orders)}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>#{row.number}</TableCell>
                          <TableCell>{date.format(new Date(row.createdAt))}</TableCell>
                          <TableCell>{row.statusLabel}</TableCell>
                          <TableCell align="right">{money.format(row.amount)}</TableCell>
                          <TableCell align="right">
                            {row.status === 0 && (
                              <Button size="small" onClick={() => navigate(`/casino/pedidos/nuevo?borrador=${row.number}`)}>
                                Retomar
                              </Button>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
ProfileDashboardPage.propTypes = { profile: PropTypes.oneOf(['person', 'casino']).isRequired };
