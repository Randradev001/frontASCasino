import PropTypes from 'prop-types';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';

export default function OperationalListShell({ children }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden', borderRadius: 2 }}>
      {items[0]}
      <Box sx={{ p: { xs: 1.5, md: 2.25 } }}>{items.slice(1)}</Box>
    </Paper>
  );
}

OperationalListShell.propTypes = { children: PropTypes.node.isRequired };
