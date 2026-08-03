import PropTypes from 'prop-types';

// project imports
import DrawerHeaderStyled from './DrawerHeaderStyled';
import Logo from 'components/logo';

// ==============================|| DRAWER HEADER ||============================== //

export default function DrawerHeader({ open }) {
  return (
    <DrawerHeaderStyled
      open={open}
      sx={{
        minHeight: '60px',
        width: 'initial',
        bgcolor: 'primary.main',
        borderBottom: '3px solid',
        borderBottomColor: 'secondary.main',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingLeft: open ? '16px' : 0
      }}
    >
      <Logo reverse isIcon={!open} sx={{ width: open ? 'auto' : 40, height: 40 }} />
    </DrawerHeaderStyled>
  );
}

DrawerHeader.propTypes = { open: PropTypes.bool };
