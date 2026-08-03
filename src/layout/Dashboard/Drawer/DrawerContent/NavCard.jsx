// material-ui
import Button from '@mui/material/Button';
import CardMedia from '@mui/material/CardMedia';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Link as RouterLink } from 'react-router-dom';

// project import
import MainCard from 'components/MainCard';

// assets
import avatar from 'assets/images/users/avatar-group.png';
import AnimateButton from 'components/@extended/AnimateButton';

// ==============================|| DRAWER CONTENT - NAVIGATION CARD ||============================== //

export default function NavCard() {
  return (
    <MainCard
      sx={{
        bgcolor: 'primary.lighter',
        borderColor: 'primary.100',
        borderTop: '3px solid',
        borderTopColor: 'secondary.main',
        m: 3
      }}
    >
      <Stack alignItems="center" spacing={2.5}>
        <CardMedia component="img" image={avatar} sx={{ width: 112 }} />
        <Stack alignItems="center">
          <Typography variant="h5" color="primary.darker">
            ADP Casino
          </Typography>
          <Typography variant="h6" color="secondary.dark">
            Seguridad y permisos
          </Typography>
        </Stack>
        <AnimateButton>
          <Button component={RouterLink} to="/seguridad/asignaciones" variant="contained" color="secondary" size="small">
            Administrar accesos
          </Button>
        </AnimateButton>
      </Stack>
    </MainCard>
  );
}
