import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import OperationalListShell from 'components/OperationalListShell';
import OperationalListHero from 'components/OperationalListHero';
import { importCasinoWorkbook, validateCasinoWorkbook } from 'api/casinoCargaApi';

const labels = {
  categories: 'Tipos de producto',
  requesters: 'Solicitantes',
  products: 'Productos',
  casinos: 'Casinos',
  destinations: 'Destinos',
  motives: 'Motivos'
};
const message = (error) => error.response?.data?.message || 'No fue posible procesar la planilla.';

export default function CasinoLoadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const validate = async () => {
    if (!file) return;
    setBusy(true);
    setNotice(null);
    try {
      setResult(await validateCasinoWorkbook(file));
    } catch (error) {
      setResult(error.response?.data?.details ? { valid: false, errors: error.response.data.details } : null);
      setNotice({ severity: 'error', text: message(error) });
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    setBusy(true);
    setNotice(null);
    try {
      const response = await importCasinoWorkbook(file);
      setNotice({ severity: 'success', text: 'La carga se aplicó correctamente.' });
      setResult({ valid: true, summary: response.summary, errors: [] });
    } catch (error) {
      setNotice({ severity: 'error', text: message(error) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <OperationalListShell>
      <OperationalListHero
        title="Centro de cargas Casino"
        subtitle="Validación y carga transaccional de solicitantes y maestros desde XLSX"
      />
      <Stack spacing={2}>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1.5}>
              <Typography variant="h5">Seleccione la plantilla completa</Typography>
              <Button component="label" variant="outlined" startIcon={<UploadOutlined />} sx={{ alignSelf: 'flex-start' }}>
                {file?.name || 'Elegir archivo XLSX'}
                <input
                  hidden
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null);
                    setResult(null);
                    setNotice(null);
                  }}
                />
              </Button>
              <Typography variant="body2" color="text.secondary">
                Los códigos de la planilla se conservan como códigos externos. Los IDs internos los genera el sistema.
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={!file || busy} onClick={validate}>
                  Validar archivo
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleOutlined />}
                  disabled={!result?.valid || busy}
                  onClick={apply}
                >
                  Aplicar carga
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
        {busy && <LinearProgress />}
        {notice && <Alert severity={notice.severity}>{notice.text}</Alert>}
        {result?.summary && (
          <Grid container spacing={1.5}>
            {Object.entries(result.summary).map(([name, value]) => (
              <Grid key={name} size={{ xs: 6, md: 2 }}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption">{labels[name]}</Typography>
                    <Typography variant="h4">{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {result && (
          <Alert severity={result.valid ? 'success' : 'warning'}>
            {result.valid
              ? 'La planilla está lista para importar.'
              : `Debe corregir ${result.errors?.length || 0} error(es) antes de importar.`}
          </Alert>
        )}
        {!!result?.errors?.length && (
          <Card variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Pestaña</TableCell>
                  <TableCell>Fila</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.errors.map((error, index) => (
                  <TableRow key={`${error.sheet}-${error.row}-${index}`}>
                    <TableCell>{error.sheet}</TableCell>
                    <TableCell>{error.row || '-'}</TableCell>
                    <TableCell>{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </Stack>
    </OperationalListShell>
  );
}
