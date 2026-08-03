import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between', p: '24px 16px 0px', mt: 'auto' }}
    >
      <Typography variant="caption">&copy; 2026 Agrosuper · ADP</Typography>
      <Typography variant="caption" color="text.secondary">
        Plataforma corporativa de uso interno
      </Typography>
    </Stack>
  );
}
