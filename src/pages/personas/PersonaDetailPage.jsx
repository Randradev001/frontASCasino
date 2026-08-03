import PropTypes from 'prop-types';

import ArrowLeftOutlined from '@ant-design/icons/ArrowLeftOutlined';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';

import { getPersona, getPersonaPhotoUrl } from 'api/personasApi';
import MainCard from 'components/MainCard';

const display = (value) => (value === null || value === undefined || value === '' ? '—' : value);
const formatDate = (value) => (value ? new Intl.DateTimeFormat('es-CL').format(new Date(value)) : '—');
const getErrorMessage = (error) => error?.response?.data?.message || error?.message || 'No fue posible cargar la ficha.';

function Field({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{display(value)}</Typography>
    </Stack>
  );
}

Field.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) };

function Section({ title, children }) {
  return (
    <MainCard title={title} contentSX={{ pt: 1.5 }}>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </MainCard>
  );
}

Section.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

const Cell = ({ label, value, size = { xs: 12, sm: 6, lg: 4 } }) => (
  <Grid size={size}>
    <Field label={label} value={value} />
  </Grid>
);

Cell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  size: PropTypes.object
};

export default function PersonaDetailPage() {
  const { rut } = useParams();
  const navigate = useNavigate();
  const query = useQuery({ queryKey: ['persona', rut], queryFn: () => getPersona(rut), enabled: Boolean(rut) });

  if (query.isLoading) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (query.isError) {
    return (
      <Stack spacing={2}>
        <Button startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/personas')} sx={{ alignSelf: 'flex-start' }}>
          Volver
        </Button>
        <Alert severity="error">{getErrorMessage(query.error)}</Alert>
      </Stack>
    );
  }

  const person = query.data;
  const contract = person.contrato;
  const initials = person.nombreCompleto
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
  const seniority = contract.antiguedad ? `${contract.antiguedad.years} año(s) y ${contract.antiguedad.months} mes(es)` : '—';

  return (
    <Stack spacing={2.5}>
      <Button startIcon={<ArrowLeftOutlined />} onClick={() => navigate('/personas')} sx={{ alignSelf: 'flex-start' }}>
        Volver a Personas
      </Button>

      <MainCard>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
          <Avatar
            src={person.tieneFoto ? getPersonaPhotoUrl(person.rut) : undefined}
            alt={person.nombreCompleto}
            sx={{ width: 112, height: 112, fontSize: 32 }}
          >
            {initials}
          </Avatar>
          <Stack spacing={0.75}>
            <Typography variant="h3">{person.nombreCompleto}</Typography>
            <Typography color="text.secondary">RUT {person.rutCompleto}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip color={contract.estado === 1 ? 'success' : 'default'} label={contract.estadoNombre} />
              {contract.funcion && <Chip variant="outlined" label={contract.funcion} />}
              {contract.centroCosto && <Chip variant="outlined" label={contract.centroCosto} />}
            </Stack>
          </Stack>
        </Stack>
      </MainCard>

      <Section title="Datos personales">
        <Cell label="Fecha de nacimiento" value={formatDate(person.fechaNacimiento)} />
        <Cell label="Edad" value={person.edad === null ? '—' : `${person.edad} años`} />
        <Cell label="Sexo" value={person.sexo} />
        <Cell label="Nacionalidad" value={person.nacionalidad} />
        <Cell label="Estado civil" value={person.estadoCivil} />
        <Cell label="Hijos" value={person.hijos} />
      </Section>

      <Section title="Contacto">
        <Cell label="Direccion" value={person.contacto.direccion} size={{ xs: 12, md: 6 }} />
        <Cell label="Comuna" value={person.contacto.comuna} />
        <Cell label="Provincia" value={person.contacto.provincia} />
        <Cell label="Region" value={person.contacto.region} />
        <Cell label="Pais" value={person.contacto.pais} />
        <Cell label="Telefono" value={person.contacto.telefono} />
        <Cell label="Anexo" value={person.contacto.anexo} />
        <Cell label="Correo" value={person.contacto.email} size={{ xs: 12, md: 6 }} />
      </Section>

      <Section title="Contrato y organizacion">
        <Cell label="Organizacion" value={contract.organizacion} />
        <Cell label="Area" value={contract.area} />
        <Cell label="Division" value={contract.division} />
        <Cell label="Subdivision" value={contract.subdivision} />
        <Cell label="Centro de costo" value={contract.centroCosto} />
        <Cell label="Ultimo centro de costo" value={contract.ultimoCentroCosto} />
        <Cell label="Funcion" value={contract.funcion} />
        <Cell label="Posicion" value={contract.posicion} />
        <Cell label="Jefe directo" value={contract.jefe} />
        <Cell label="Inicio" value={formatDate(contract.fechaDesde)} />
        <Cell label="Termino" value={formatDate(contract.fechaHasta)} />
        <Cell label="Antiguedad" value={seniority} />
        <Cell label="Turno" value={contract.turno} />
        <Cell label="Sindicato" value={contract.sindicato} />
      </Section>

      <Section title="Indicadores y previsional">
        <Cell label="Dias de licencia" value={person.indicadores.licencias} />
        <Cell label="Fallas" value={person.indicadores.fallas} />
        <Cell label="Cartas" value={person.indicadores.cartas} />
        <Cell label="Ausentismo" value={`${person.indicadores.ausentismo}%`} />
        <Cell label="Convenio" value={person.previsional.convenio} />
        <Cell label="AFP" value={person.previsional.afp} />
        <Cell label="ISAPRE" value={person.previsional.isapre} />
        <Cell label="Fondo solidario" value={person.previsional.fondoSolidario} />
      </Section>
    </Stack>
  );
}
