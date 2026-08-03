import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// assets
import agrosuperLogo from 'assets/images/brand/agrosuper-logo.png';

// ==============================|| AGROSUPER + ADP LOGO ||============================== //

export default function LogoMain({ reverse = false }) {
  return (
    <Stack
      direction="row"
      sx={{
        position: 'relative',
        width: 214,
        height: 48,
        px: 1.25,
        alignItems: 'center',
        gap: 1.25,
        overflow: 'hidden',
        borderRadius: reverse ? 0 : 1.5,
        bgcolor: reverse ? 'transparent' : 'primary.main',
        boxShadow: reverse ? 'none' : '0 8px 20px rgba(0, 84, 159, 0.15)',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          height: 3,
          bgcolor: 'secondary.main'
        }
      }}
      role="img"
      aria-label="Agrosuper ADP"
    >
      <Box sx={{ position: 'relative', width: 104, height: 41, flexShrink: 0, overflow: 'hidden' }}>
        <Box
          component="img"
          src={agrosuperLogo}
          alt="Agrosuper"
          sx={{ position: 'absolute', top: -17, left: 0, width: 104, height: 'auto' }}
        />
      </Box>

      <Box sx={{ minWidth: 0, pl: 1.25, borderLeft: '1px solid rgba(255, 255, 255, 0.34)' }}>
        <Typography sx={{ color: 'common.white', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1, letterSpacing: '0.04em' }}>
          ADP
        </Typography>
        <Typography
          sx={{
            mt: 0.45,
            color: 'rgba(255, 255, 255, 0.78)',
            fontSize: '0.46rem',
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: '0.08em'
          }}
        >
          GESTIÓN INTERNA
        </Typography>
      </Box>
    </Stack>
  );
}

LogoMain.propTypes = { reverse: PropTypes.bool };
