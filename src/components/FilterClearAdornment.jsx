import PropTypes from 'prop-types';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

export default function FilterClearAdornment({ visible, onClear, label = 'Limpiar filtro' }) {
  if (!visible) return null;
  return (
    <InputAdornment position="end">
      <IconButton size="small" aria-label={label} onClick={onClear} edge="end">
        <CloseOutlined />
      </IconButton>
    </InputAdornment>
  );
}

FilterClearAdornment.propTypes = { visible: PropTypes.bool, onClear: PropTypes.func.isRequired, label: PropTypes.string };
