import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import beveragesImage from 'assets/images/products/beverages.webp';
import cafeteriaImage from 'assets/images/products/cafeteria.webp';
import coldMealsImage from 'assets/images/products/cold-meals.webp';
import lunchImage from 'assets/images/products/lunch.webp';
import pastryImage from 'assets/images/products/pastry.webp';
import sandwichesImage from 'assets/images/products/sandwiches.webp';
import utensilsImage from 'assets/images/products/utensils.webp';
import { createOrderDraft, getOrderContext, sendOrder } from 'api/casinoPedidosApi';
import { listPersonas } from 'api/personasApi';

const BLUE = '#00549F';
const ORANGE = '#FF740C';
const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });
const integer = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const categoryImage = (name) => {
  const normalized = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  if (normalized.includes('COLACION')) return coldMealsImage;
  if (normalized.includes('SANDWICH')) return sandwichesImage;
  if (normalized.includes('CAFETER')) return cafeteriaImage;
  if (normalized.includes('BEBEST') || normalized.includes('BEBIDA')) return beveragesImage;
  if (normalized.includes('PASTEL')) return pastryImage;
  if (normalized.includes('ALMUER')) return lunchImage;
  if (normalized.includes('UTENS')) return utensilsImage;
  return coldMealsImage;
};

const displayLocation = (requester) =>
  [
    requester?.location?.division || requester?.division,
    requester?.location?.subdivision || requester?.subdivision,
    requester?.location?.costCenter || requester?.centroCosto
  ]
    .filter(Boolean)
    .join(' · ');

const getMissingLocationFields = (requester) => {
  if (Array.isArray(requester?.missingLocationFields)) return requester.missingLocationFields;
  const location = requester?.location || {};
  return [
    !(location.divisionId || location.division || requester?.division) ? { key: 'division', label: 'División' } : null,
    !(location.subdivisionId || location.subdivision || requester?.subdivision) ? { key: 'subdivision', label: 'Subdivisión' } : null,
    !(location.costCenterId || location.costCenter || requester?.centroCosto) ? { key: 'costCenter', label: 'Centro de costo' } : null
  ].filter(Boolean);
};

const formatSpanishList = (values) => {
  if (values.length < 2) return values[0] || '';
  return `${values.slice(0, -1).join(', ')} y ${values.at(-1)}`;
};

function QuantityControl({ value, onChange, productName, compact = false }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" onClick={(event) => event.stopPropagation()}>
      <IconButton
        size="small"
        aria-label={`Quitar una unidad de ${productName}`}
        disabled={!value}
        onClick={() => onChange(Math.max(0, value - 1))}
        sx={{ border: '1px solid', borderColor: 'divider' }}
      >
        <MinusOutlined />
      </IconButton>
      <TextField
        value={value || 0}
        type="number"
        size="small"
        aria-label={`Cantidad de ${productName}`}
        onFocus={(event) => event.target.select()}
        onChange={(event) => onChange(event.target.value)}
        slotProps={{ htmlInput: { min: 0, max: 32767, step: 1, style: { textAlign: 'center', padding: compact ? '6px 2px' : '8px 2px' } } }}
        sx={{ width: compact ? 64 : 76 }}
      />
      <IconButton
        size="small"
        aria-label={`Agregar una unidad de ${productName}`}
        onClick={() => onChange(Math.min(32767, value + 1))}
        sx={{ bgcolor: ORANGE, color: 'common.white', '&:hover': { bgcolor: '#DF6100' } }}
      >
        <PlusOutlined />
      </IconButton>
    </Stack>
  );
}

QuantityControl.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  productName: PropTypes.string.isRequired,
  compact: PropTypes.bool
};

function ProductCard({ product, category, quantity, onQuantity }) {
  const image = categoryImage(category?.name);
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        overflow: 'hidden',
        borderRadius: 3,
        border: '1px solid',
        borderColor: quantity ? ORANGE : 'divider',
        transition: 'transform .18s ease, box-shadow .18s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 30px rgba(0,84,159,.10)' }
      }}
    >
      <Box
        component="button"
        type="button"
        onClick={() => onQuantity(quantity + 1)}
        aria-label={`Agregar ${product.name} al pedido`}
        sx={{ display: 'block', position: 'relative', width: '100%', p: 0, border: 0, bgcolor: 'grey.100', cursor: 'pointer' }}
      >
        <Box
          component="img"
          src={image}
          alt={`Imagen referencial de ${product.name}`}
          sx={{ width: '100%', height: 158, objectFit: 'cover', display: 'block' }}
        />
        <Chip
          size="small"
          label={quantity ? `${quantity} en pedido` : 'Presiona para agregar'}
          icon={quantity ? <CheckOutlined /> : <PlusOutlined />}
          sx={{
            position: 'absolute',
            left: 12,
            bottom: 12,
            bgcolor: quantity ? ORANGE : 'rgba(255,255,255,.94)',
            color: quantity ? 'white' : BLUE,
            fontWeight: 700
          }}
        />
      </Box>
      <Stack spacing={1.4} sx={{ p: 1.75 }}>
        <Box sx={{ minHeight: 49 }}>
          <Typography variant="subtitle1" sx={{ lineHeight: 1.25 }}>
            {product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Código {product.id} · Imagen referencial
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="h5" color={BLUE}>
            {money.format(product.price)}
          </Typography>
          <QuantityControl value={quantity} onChange={onQuantity} productName={product.name} compact />
        </Stack>
      </Stack>
    </Paper>
  );
}

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  category: PropTypes.object,
  quantity: PropTypes.number.isRequired,
  onQuantity: PropTypes.func.isRequired
};

export default function NewOrderPage() {
  const navigate = useNavigate();
  const [orderContext, setOrderContext] = useState(null);
  const [form, setForm] = useState({
    requesterRut: '',
    casinoId: '',
    destinationId: '',
    motiveId: '',
    deliveryDate: tomorrow(),
    deliveryTime: '12:00',
    description: ''
  });
  const [selectedRequester, setSelectedRequester] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [categoryId, setCategoryId] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [requesterDialog, setRequesterDialog] = useState(false);
  const [personSearch, setPersonSearch] = useState('');
  const [persons, setPersons] = useState([]);
  const [personsLoading, setPersonsLoading] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    getOrderContext()
      .then((response) => {
        setOrderContext(response);
        setSelectedRequester(response.requester);
        setForm((current) => ({
          ...current,
          requesterRut: response.requester.rut,
          casinoId: response.catalogs.casinos[0]?.id || '',
          destinationId: response.catalogs.destinations[0]?.id || '',
          motiveId: response.catalogs.motives[0]?.id || ''
        }));
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'No fue posible preparar la solicitud.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!requesterDialog || !orderContext?.canManageOthers) return undefined;
    const timeout = window.setTimeout(() => {
      setPersonsLoading(true);
      listPersonas({ search: personSearch, estado: 1, pageSize: 8 })
        .then((response) => setPersons(response.data || []))
        .catch(() => setPersons([]))
        .finally(() => setPersonsLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [personSearch, requesterDialog, orderContext?.canManageOthers]);

  const categoryById = useMemo(
    () => new Map((orderContext?.catalogs.categories || []).map((category) => [category.id, category])),
    [orderContext]
  );
  const availableProducts = useMemo(
    () => (orderContext?.catalogs.products || []).filter((product) => product.casinoId === Number(form.casinoId)),
    [orderContext, form.casinoId]
  );
  const availableCategories = useMemo(() => {
    const ids = new Set(availableProducts.map((product) => product.categoryId));
    return (orderContext?.catalogs.categories || []).filter((category) => ids.has(category.id));
  }, [availableProducts, orderContext]);
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    return availableProducts.filter(
      (product) =>
        (categoryId === 'all' || product.categoryId === Number(categoryId)) &&
        (!term || product.name.toLocaleLowerCase('es').includes(term))
    );
  }, [availableProducts, categoryId, search]);
  const cart = useMemo(
    () =>
      availableProducts
        .filter((product) => Number(quantities[product.id]) > 0)
        .map((product) => ({ ...product, quantity: Number(quantities[product.id]) })),
    [availableProducts, quantities]
  );
  const totalQuantity = cart.reduce((sum, product) => sum + product.quantity, 0);
  const indicativeTotal = cart.reduce((sum, product) => sum + product.quantity * product.price, 0);

  const setQuantity = (productId, rawValue) => {
    const next = Math.min(32767, Math.max(0, Math.trunc(Number(rawValue) || 0)));
    setQuantities((current) => {
      const updated = { ...current };
      if (next) updated[productId] = next;
      else delete updated[productId];
      return updated;
    });
  };

  const changeCasino = (casinoId) => {
    setForm((current) => ({ ...current, casinoId }));
    setQuantities({});
    setCategoryId('all');
  };

  const chooseRequester = (person) => {
    const requester = {
      rut: person.rut,
      fullRut: person.rutCompleto,
      name: person.nombreCompleto,
      active: person.estado === 1,
      location: {
        divisionId: person.divisionId,
        division: person.division,
        subdivisionId: person.subdivisionId,
        subdivision: person.subdivision,
        costCenterId: person.centroCostoId,
        costCenter: person.centroCosto
      }
    };
    requester.missingLocationFields = getMissingLocationFields(requester);
    requester.locationComplete = requester.missingLocationFields.length === 0;
    setSelectedRequester(requester);
    setForm((current) => ({ ...current, requesterRut: person.rut }));
    setRequesterDialog(false);
  };

  const validate = () => {
    if (!form.requesterRut || !form.casinoId || !form.destinationId || !form.motiveId || !form.deliveryDate || !form.deliveryTime) {
      return 'Complete solicitante, casino, destino, motivo, fecha y hora.';
    }
    if (!selectedRequester?.locationComplete) {
      const missing = getMissingLocationFields(selectedRequester).map((field) => field.label.toLowerCase());
      return `No es posible crear el pedido porque faltan estos datos en la ficha del solicitante: ${formatSpanishList(missing)}.`;
    }
    if (!cart.length) return 'Agregue al menos un producto al pedido.';
    return '';
  };

  const requestCreateAndSend = () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setConfirmSendOpen(true);
  };

  const create = async (sendAfterCreate) => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSubmitting(true);
    setError('');
    let draft;
    try {
      draft = await createOrderDraft({
        requesterRut: Number(form.requesterRut),
        casinoId: Number(form.casinoId),
        destinationId: Number(form.destinationId),
        motiveId: Number(form.motiveId),
        deliveryDate: form.deliveryDate,
        deliveryTime: form.deliveryTime,
        description: form.description,
        lines: cart.map((product) => ({ productCode: product.id, quantity: product.quantity }))
      });
      const result = sendAfterCreate ? await sendOrder(draft.number) : draft;
      if (sendAfterCreate) navigate(`/casino/pedidos/historial?pedido=${encodeURIComponent(result.number)}`);
      else setSuccess(result);
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'No fue posible registrar el pedido.';
      setError(draft ? `El borrador #${draft.number} quedó guardado, pero no pudo enviarse: ${message}` : message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendSavedDraft = async () => {
    setSubmitting(true);
    try {
      const result = await sendOrder(success.number);
      navigate(`/casino/pedidos/historial?pedido=${encodeURIComponent(result.number)}`);
    } catch (requestError) {
      setNotice(requestError.response?.data?.message || 'No fue posible enviar el borrador.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 460, display: 'grid', placeItems: 'center' }}>
        <CircularProgress sx={{ color: BLUE }} />
      </Box>
    );
  }

  if (!orderContext) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={() => navigate('/dashboard/default')}>
            Volver
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const missingRequesterFields = getMissingLocationFields(selectedRequester);
  const requesterReady = selectedRequester?.locationComplete && missingRequesterFields.length === 0;

  return (
    <Stack spacing={2.5}>
      <Paper
        elevation={0}
        sx={{
          overflow: 'hidden',
          borderRadius: 3,
          color: 'white',
          background: `linear-gradient(120deg, ${BLUE}, #073B6B 75%)`,
          p: { xs: 2.25, md: 3.25 },
          position: 'relative'
        }}
      >
        <Box
          sx={{ position: 'absolute', width: 230, height: 230, borderRadius: '50%', bgcolor: ORANGE, opacity: 0.15, right: -60, top: -120 }}
        />
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ position: 'relative' }}>
          <Box>
            <Button
              color="inherit"
              startIcon={<ArrowLeftOutlined />}
              onClick={() => navigate('/dashboard/default')}
              sx={{ mb: 1, opacity: 0.85 }}
            >
              Volver al panel
            </Button>
            <Typography variant="h2" color="inherit">
              Crea una solicitud memorablemente simple
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.76)', maxWidth: 680 }}>
              Elige dónde y cuándo, presiona cada producto para sumarlo y confirma todo en un solo lugar.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            {['1 · Datos', '2 · Productos', '3 · Confirmar'].map((step, index) => (
              <Chip
                key={step}
                label={step}
                sx={{ bgcolor: index === 1 ? ORANGE : 'rgba(255,255,255,.12)', color: 'white', fontWeight: 700 }}
              />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: `${BLUE}12`, color: BLUE }}>
                    <UserOutlined />
                  </Avatar>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      SOLICITANTE
                    </Typography>
                    <Typography variant="h5">{selectedRequester?.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRequester?.fullRut} · {displayLocation(selectedRequester) || 'Ubicación organizacional incompleta'}
                    </Typography>
                  </Box>
                </Stack>
                {orderContext.canManageOthers && (
                  <Button variant="outlined" onClick={() => setRequesterDialog(true)}>
                    Cambiar persona
                  </Button>
                )}
              </Stack>
              {!requesterReady && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">La ficha del solicitante no está lista para imputar un pedido.</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Faltan: {formatSpanishList(missingRequesterFields.map((field) => field.label))}. Estos datos deben completarse en
                    Personas; no se reemplazan manualmente en la solicitud.
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.25 }}>
                    {orderContext.canManageOthers && (
                      <Button size="small" variant="contained" onClick={() => setRequesterDialog(true)}>
                        Elegir otro solicitante
                      </Button>
                    )}
                    <Button size="small" variant="outlined" onClick={() => navigate(`/personas/${selectedRequester?.rut}`)}>
                      Revisar ficha de Personas
                    </Button>
                  </Stack>
                </Alert>
              )}
              <Divider sx={{ my: 2.25 }} />
              <Grid container spacing={1.75}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Casino"
                    value={form.casinoId}
                    onChange={(event) => changeCasino(event.target.value)}
                  >
                    {orderContext.catalogs.casinos.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Destino"
                    value={form.destinationId}
                    onChange={(event) => setForm((current) => ({ ...current, destinationId: event.target.value }))}
                  >
                    {orderContext.catalogs.destinations.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    required
                    label="Motivo"
                    value={form.motiveId}
                    onChange={(event) => setForm((current) => ({ ...current, motiveId: event.target.value }))}
                  >
                    {orderContext.catalogs.motives.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 7, sm: 3 }}>
                  <TextField
                    fullWidth
                    required
                    label="Fecha de entrega"
                    type="date"
                    value={form.deliveryDate}
                    slotProps={{ inputLabel: { shrink: true } }}
                    onChange={(event) => setForm((current) => ({ ...current, deliveryDate: event.target.value }))}
                  />
                </Grid>
                <Grid size={{ xs: 5, sm: 3 }}>
                  <TextField
                    fullWidth
                    required
                    label="Hora"
                    type="time"
                    value={form.deliveryTime}
                    slotProps={{ inputLabel: { shrink: true } }}
                    onChange={(event) => setForm((current) => ({ ...current, deliveryTime: event.target.value }))}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Indicaciones para el casino"
                    placeholder="Ej.: entregar en sala de capacitación, dejar con recepción…"
                    value={form.description}
                    slotProps={{ htmlInput: { maxLength: 400 } }}
                    helperText={`${form.description.length}/400 caracteres`}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Box>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ md: 'flex-end' }}
                spacing={1.5}
                sx={{ mb: 1.5 }}
              >
                <Box>
                  <Typography variant="h3">¿Qué necesitas?</Typography>
                  <Typography color="text.secondary">Presiona la imagen para sumar de a uno o digita una cantidad mayor.</Typography>
                </Box>
                <TextField
                  size="small"
                  placeholder="Buscar producto"
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
                  sx={{ minWidth: { md: 280 } }}
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1.25 }}>
                <Chip
                  clickable
                  label={`Todos · ${availableProducts.length}`}
                  color={categoryId === 'all' ? 'primary' : 'default'}
                  onClick={() => setCategoryId('all')}
                />
                {availableCategories.map((category) => {
                  const count = availableProducts.filter((product) => product.categoryId === category.id).length;
                  return (
                    <Chip
                      key={category.id}
                      clickable
                      label={`${category.name} · ${count}`}
                      color={categoryId === category.id ? 'primary' : 'default'}
                      variant={categoryId === category.id ? 'filled' : 'outlined'}
                      onClick={() => setCategoryId(category.id)}
                    />
                  );
                })}
              </Stack>
              {filteredProducts.length ? (
                <Grid container spacing={2}>
                  {filteredProducts.map((product) => (
                    <Grid key={product.id} size={{ xs: 12, sm: 6, xl: 4 }}>
                      <ProductCard
                        product={product}
                        category={categoryById.get(product.categoryId)}
                        quantity={Number(quantities[product.id] || 0)}
                        onQuantity={(value) => setQuantity(product.id, value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">No encontramos productos con esos filtros.</Alert>
              )}
            </Box>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              position: { lg: 'sticky' },
              top: { lg: 88 },
              overflow: 'hidden',
              border: '1px solid',
              borderColor: cart.length ? `${ORANGE}80` : 'divider',
              borderRadius: 3
            }}
          >
            <Box sx={{ p: 2.25, color: 'white', background: `linear-gradient(120deg, ${BLUE}, #073B6B)` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <ShoppingCartOutlined style={{ fontSize: 24 }} />
                  <Box>
                    <Typography variant="h4" color="inherit">
                      Tu solicitud
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.7)' }}>
                      {cart.length} productos distintos
                    </Typography>
                  </Box>
                </Stack>
                <Chip label={`${integer.format(totalQuantity)} un.`} sx={{ bgcolor: ORANGE, color: 'white', fontWeight: 800 }} />
              </Stack>
            </Box>
            <Stack spacing={1.5} sx={{ p: 2.25 }}>
              {!cart.length ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar sx={{ mx: 'auto', mb: 1.5, width: 58, height: 58, bgcolor: `${BLUE}10`, color: BLUE }}>
                    <ShoppingCartOutlined />
                  </Avatar>
                  <Typography variant="h5">Tu carrito está vacío</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Toca una imagen para comenzar.
                  </Typography>
                </Box>
              ) : (
                cart.map((product) => (
                  <Box key={product.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={1.25}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {money.format(product.price)} c/u · {money.format(product.price * product.quantity)}
                        </Typography>
                      </Box>
                      <QuantityControl
                        value={product.quantity}
                        onChange={(value) => setQuantity(product.id, value)}
                        productName={product.name}
                        compact
                      />
                    </Stack>
                    <Divider sx={{ mt: 1.5 }} />
                  </Box>
                ))
              )}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total referencial
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    El servidor confirma precios
                  </Typography>
                </Box>
                <Typography variant="h3" color={BLUE}>
                  {money.format(indicativeTotal)}
                </Typography>
              </Stack>
              <Alert severity="info" icon={<EnvironmentOutlined />}>
                {selectedRequester?.name}
                <br />
                {form.deliveryDate || 'Sin fecha'} · {form.deliveryTime || 'Sin hora'}
              </Alert>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<SendOutlined />}
                disabled={submitting || !cart.length || !requesterReady}
                onClick={requestCreateAndSend}
                sx={{ bgcolor: ORANGE, '&:hover': { bgcolor: '#DF6100' } }}
              >
                {submitting ? 'Procesando…' : 'Crear y enviar'}
              </Button>
              <Tooltip title="Guarda con estado 0 para enviarlo después">
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SaveOutlined />}
                  disabled={submitting || !cart.length || !requesterReady}
                  onClick={() => create(false)}
                >
                  Guardar borrador
                </Button>
              </Tooltip>
              {!orderContext.compatibility.emailNotificationAvailable && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  El envío al casino cambia el estado del pedido. La notificación por correo está pendiente de integración.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={requesterDialog} onClose={() => setRequesterDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Seleccionar solicitante</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            sx={{ mt: 0.5, mb: 1.5 }}
            placeholder="Nombre o RUT"
            value={personSearch}
            onChange={(event) => setPersonSearch(event.target.value)}
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
          {personsLoading ? (
            <Box sx={{ py: 5, display: 'grid', placeItems: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <List disablePadding>
              {persons.map((person) => {
                const missingFields = getMissingLocationFields(person);
                const disabled = missingFields.length > 0;
                return (
                  <ListItemButton key={person.rut} divider disabled={disabled} onClick={() => chooseRequester(person)}>
                    <ListItemText
                      primary={person.nombreCompleto}
                      secondary={
                        disabled
                          ? `${person.rutCompleto} · Ficha incompleta: falta ${formatSpanishList(missingFields.map((field) => field.label.toLowerCase()))}`
                          : `${person.rutCompleto} · ${[person.division, person.subdivision, person.centroCosto].filter(Boolean).join(' · ')}`
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequesterDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmSendOpen} onClose={() => !submitting && setConfirmSendOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Confirmar creación y envío</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Alert severity="warning">El pedido se creará y quedará enviado al casino. Revisa el resumen antes de continuar.</Alert>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Solicitante</Typography>
              <Typography variant="subtitle2" textAlign="right">
                {selectedRequester?.name || 'Sin solicitante'}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Entrega</Typography>
              <Typography variant="subtitle2">
                {form.deliveryDate} · {form.deliveryTime}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Productos</Typography>
              <Typography variant="subtitle2">
                {cart.length} productos · {integer.format(totalQuantity)} unidades
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Monto referencial</Typography>
              <Typography variant="h4" color={BLUE}>
                {money.format(indicativeTotal)}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              El backend volverá a validar empresa, solicitante, productos y precios antes de registrar el pedido.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button disabled={submitting} onClick={() => setConfirmSendOpen(false)}>
            Volver a revisar
          </Button>
          <Button
            variant="contained"
            startIcon={<SendOutlined />}
            disabled={submitting}
            onClick={() => {
              setConfirmSendOpen(false);
              create(true);
            }}
            sx={{ bgcolor: ORANGE, '&:hover': { bgcolor: '#DF6100' } }}
          >
            {submitting ? 'Enviando…' : 'Confirmar y enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(success)} fullWidth maxWidth="xs" onClose={() => navigate('/dashboard/default')}>
        <DialogContent sx={{ textAlign: 'center', pt: 4 }}>
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: success?.status === 1 ? ORANGE : BLUE, width: 64, height: 64 }}>
            <CheckOutlined style={{ fontSize: 30 }} />
          </Avatar>
          <Typography variant="h3">Pedido #{success?.number}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {success?.status === 1 ? 'La solicitud fue enviada al casino.' : 'El borrador quedó guardado correctamente.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button fullWidth variant="outlined" onClick={() => navigate('/dashboard/default')}>
            Volver al panel
          </Button>
          {success?.status === 0 && (
            <Button fullWidth variant="contained" disabled={submitting} onClick={sendSavedDraft} sx={{ bgcolor: ORANGE }}>
              Enviar ahora
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={5000} onClose={() => setNotice('')} message={notice} />
    </Stack>
  );
}
