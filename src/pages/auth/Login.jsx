import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthLogin from 'sections/auth/AuthLogin';

export default function Login() {
  return (
    <AuthWrapper>
      <Grid container spacing={3.5}>
        <Grid size={12}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 700 }}>
              Bienvenido a{' '}
              <Typography component="span" variant="inherit" sx={{ color: 'primary.main', whiteSpace: 'nowrap' }}>
                ADP
              </Typography>
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Acceso corporativo a pedidos de Casino, Personas e información de negocio.
            </Typography>
          </Stack>
        </Grid>
        <Grid size={12}>
          <AuthLogin />
        </Grid>
      </Grid>
    </AuthWrapper>
  );
}
