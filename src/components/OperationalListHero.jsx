import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function OperationalListHero({ title, subtitle, actions }) {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 2.5 },
        py: { xs: 1.75, md: 2 },
        color: 'common.white',
        background: 'linear-gradient(115deg,#003b73 0%,#00549F 58%,#0875c1 100%)'
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'stretch', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 1.5 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
          <Typography variant="h4" color="inherit">
            {title}
          </Typography>
          <Box sx={{ display: { xs: 'none', sm: 'block' }, height: 24, borderLeft: '1px solid rgba(255,255,255,.45)' }} />
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.82)' }}>
            {subtitle}
          </Typography>
        </Stack>
        <Box
          sx={{
            '& .MuiButton-root': { color: 'white', borderColor: 'rgba(255,255,255,.6)' },
            '& .MuiButton-contained': { color: '#00549F', bgcolor: 'white' }
          }}
        >
          {actions}
        </Box>
      </Stack>
    </Box>
  );
}

OperationalListHero.propTypes = { title: PropTypes.string.isRequired, subtitle: PropTypes.string.isRequired, actions: PropTypes.node };
