import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRouteError } from 'react-router-dom';

const isModuleLoadError = (error) => /dynamically imported module|failed to fetch/i.test(String(error?.message || error || ''));

export default function RouteErrorPage() {
  const error = useRouteError();
  const moduleLoadError = isModuleLoadError(error);

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: '#F4F7FA', p: 2 }}>
      <Paper
        elevation={0}
        sx={{ width: '100%', maxWidth: 560, p: { xs: 3, md: 4 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Stack spacing={2.5} alignItems="flex-start">
          <Typography variant="overline" sx={{ color: '#FF740C', fontWeight: 800 }}>
            ADP · Recuperación de pantalla
          </Typography>
          <Typography variant="h2">No fue posible cargar esta pantalla</Typography>
          <Alert severity={moduleLoadError ? 'warning' : 'error'} sx={{ width: '100%' }}>
            {moduleLoadError
              ? 'La aplicación fue actualizada mientras estaba abierta. Recárguela para obtener la versión más reciente.'
              : 'Ocurrió un error inesperado. Intente recargar la aplicación.'}
          </Alert>
          <Button
            variant="contained"
            startIcon={<ReloadOutlined />}
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#00549F', '&:hover': { bgcolor: '#073D72' } }}
          >
            Recargar aplicación
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
