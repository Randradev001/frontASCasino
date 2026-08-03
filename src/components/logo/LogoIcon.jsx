import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ==============================|| ADP LOGO ICON ||============================== //

export default function LogoIcon({ reverse = false }) {
  return (
    <Box
      role="img"
      aria-label="ADP Agrosuper"
      sx={{
        position: 'relative',
        display: 'grid',
        width: 40,
        height: 40,
        placeItems: 'center',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: reverse ? 'rgba(255, 255, 255, 0.34)' : 'primary.dark',
        borderRadius: 1.5,
        bgcolor: reverse ? 'primary.dark' : 'primary.main',
        boxShadow: '0 6px 16px rgba(0, 84, 159, 0.15)',
        '&::after': {
          content: '""',
          position: 'absolute',
          right: 0,
          bottom: 0,
          left: 0,
          height: 4,
          bgcolor: 'secondary.main'
        }
      }}
    >
      <Typography sx={{ color: 'common.white', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>ADP</Typography>
    </Box>
  );
}

LogoIcon.propTypes = { reverse: PropTypes.bool };
