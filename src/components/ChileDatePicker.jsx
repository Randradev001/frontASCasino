import PropTypes from 'prop-types';
import moment from 'moment';
import 'moment/locale/es';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { esES } from '@mui/x-date-pickers/locales';

if (!moment.locales().includes('es-cl')) {
  moment.defineLocale('es-cl', {
    parentLocale: 'es',
    week: { dow: 1, doy: 4 },
    longDateFormat: { L: 'DD/MM/YYYY' }
  });
}
moment.locale('es-cl');

const localeText = esES.components.MuiLocalizationProvider.defaultProps.localeText;

export default function ChileDatePicker({ value, onChange, size = 'small', clearable = true, slotProps = {}, ...props }) {
  const dateValue = value ? moment(value, 'YYYY-MM-DD', true) : null;

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="es-cl" localeText={localeText}>
      <DatePicker
        {...props}
        value={dateValue?.isValid() ? dateValue : null}
        format="DD/MM/YYYY"
        onChange={(nextValue) => {
          if (!nextValue) onChange('');
          else if (nextValue.isValid()) onChange(nextValue.format('YYYY-MM-DD'));
        }}
        slotProps={{
          ...slotProps,
          field: { clearable, ...slotProps.field },
          textField: { size, ...slotProps.textField }
        }}
      />
    </LocalizationProvider>
  );
}

ChileDatePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  size: PropTypes.oneOf(['small', 'medium']),
  clearable: PropTypes.bool,
  slotProps: PropTypes.object
};
