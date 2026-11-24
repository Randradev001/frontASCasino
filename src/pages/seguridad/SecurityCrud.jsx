import { useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { DataGrid } from '@mui/x-data-grid';

import ClearOutlined from '@ant-design/icons/ClearOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SaveOutlined from '@ant-design/icons/SaveOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import UserAddOutlined from '@ant-design/icons/UserAddOutlined';
import KeyOutlined from '@ant-design/icons/KeyOutlined';

import { Formik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import ListExportButtons from 'components/ListExportButtons';
import MainCard from 'components/MainCard';
import ChileDatePicker from 'components/ChileDatePicker';
import { deleteSecurityCatalog, insertSecurityCatalog, listSecurityCatalog, updateSecurityCatalog } from 'api/seguridadCatalogosApi';
import { useAuth } from 'contexts/AuthContext';
import { gxSecurityConfig } from './gxSecurityConfig';
import RoleAssignmentDialog from './RoleAssignmentDialog';
import RolePermissionsDialog from './RolePermissionsDialog';

const isFilled = (value) => value !== undefined && value !== null && value !== '';

const getDisplayLabel = (label = '') => label.replace(/\s*\([^)]*\)/g, '').trim();

const getFieldDisplayLabel = (config, fieldName) => {
  const field = config.fields.find((item) => item.name === fieldName);
  return getDisplayLabel(field?.label || fieldName);
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.message || fallback;

const buildInitialFilters = (config) =>
  (config.filters || [])
    .filter((filter) => !filter.hidden)
    .reduce((filters, filter) => {
      filters[filter.name] = '';
      return filters;
    }, {});

const getVisibleFilters = (config) => (config.filters || []).filter((filter) => !filter.hidden);

const toFormValue = (field, value) => {
  if (!isFilled(value)) return '';

  if (field.type === 'date') {
    const dateValue = moment(value);
    return dateValue.isValid() ? dateValue.format('YYYY-MM-DD') : String(value);
  }

  return String(value);
};

const toPayloadValue = (field, value) => {
  if (!isFilled(value)) return null;

  if (field.type === 'number' || field.type === 'decimal') return Number(String(value).replace(',', '.'));

  return String(value).trim();
};

const formatCellValue = (field, value) => {
  if (!isFilled(value)) return '';

  if (field.type === 'date') {
    const dateValue = moment(value);
    return dateValue.isValid() ? dateValue.locale('es').format('DD/MM/YYYY') : String(value);
  }

  if (field.type === 'decimal') {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) return value;
    return numberValue.toLocaleString('es-CL', { maximumFractionDigits: 4 });
  }

  return value;
};

const getRowKey = (config, row) => config.primaryKey.map((fieldName) => row[fieldName]).join('|');

const getFixedValues = (config, filters) =>
  getVisibleFilters(config).reduce(
    (values, filter) => {
      if (isFilled(filters[filter.name])) values[filter.name] = filters[filter.name];

      return values;
    },
    { ...(config.contextParams || {}) }
  );

const buildInitialValues = (config, initialData, fixedValues) =>
  config.fields.reduce((values, field) => {
    const fixedValue = fixedValues[field.name];
    const defaultValue = initialData ? undefined : field.defaultValue;
    const sourceValue = isFilled(fixedValue) ? fixedValue : (initialData?.[field.name] ?? defaultValue);

    values[field.name] = toFormValue(field, sourceValue);
    return values;
  }, {});

const buildValidationSchema = (config) => {
  const shape = {};

  for (const field of config.fields) {
    let validator;
    const label = getDisplayLabel(field.label);

    if (field.type === 'number' || field.type === 'decimal') {
      validator = Yup.number()
        .transform((value, originalValue) => (originalValue === '' ? null : value))
        .typeError(`${label} debe ser numerico`)
        .nullable();

      if (field.type === 'number') {
        validator = validator.integer(`${label} debe ser entero`);
      }

      if (field.min !== undefined) {
        validator = validator.min(field.min, `${label} debe ser mayor o igual a ${field.min}`);
      }

      if (field.exclusiveMin !== undefined) {
        validator = validator.moreThan(field.exclusiveMin, `${label} debe ser mayor a ${field.exclusiveMin}`);
      }
    } else {
      validator = Yup.string().trim().nullable();
    }

    if (field.type === 'text' && field.maxLength) {
      validator = validator.max(field.maxLength, `${label} maximo ${field.maxLength} caracteres`);
    }

    if (field.required || config.primaryKey.includes(field.name)) {
      validator = validator.required(`${label} es requerido`);
    }

    shape[field.name] = validator;
  }

  return Yup.object().shape(shape);
};

const buildPayload = (config, values) =>
  config.fields.reduce((payload, field) => {
    payload[field.name] = toPayloadValue(field, values[field.name]);

    return payload;
  }, {});

const getOptionSettings = (descriptor) => descriptor.optionSource || descriptor;

const getOptions = (optionSets, descriptor) => {
  if (descriptor.options) return descriptor.options;

  const settings = getOptionSettings(descriptor);
  return optionSets[settings.source] || [];
};

const getOptionValue = (option, descriptor) => {
  const settings = getOptionSettings(descriptor);

  if (settings.valueField) return option[settings.valueField];
  return option.value;
};

const getOptionLabel = (option, descriptor) => {
  const settings = getOptionSettings(descriptor);
  const value = getOptionValue(option, descriptor);
  const label = settings.labelField ? option[settings.labelField] : option.label;

  return label ? `${value} - ${label}` : String(value);
};

const findSelectedOption = (options, descriptor, selectedValue) =>
  options.find((option) => toFormValue(descriptor, getOptionValue(option, descriptor)) === selectedValue);

const getLookupDisplayValue = (options, descriptor, selectedValue) => {
  if (!isFilled(selectedValue)) return '';

  const selectedOption = findSelectedOption(options, descriptor, selectedValue);
  if (!selectedOption) return selectedValue;

  return getOptionLabel(selectedOption, descriptor);
};

const getLookupRows = (options, descriptor, searchText) => {
  const settings = getOptionSettings(descriptor);
  const normalizedSearch = searchText.trim().toLowerCase();

  return options
    .map((option, index) => {
      const rawValue = getOptionValue(option, descriptor);
      const value = toFormValue(descriptor, rawValue);
      const label = settings.labelField ? option[settings.labelField] : option.label;
      const display = getOptionLabel(option, descriptor);

      return {
        id: `${value || 'row'}-${index}`,
        value,
        label: label || '',
        display,
        option
      };
    })
    .filter((row) => {
      if (!normalizedSearch) return true;
      return row.display.toLowerCase().includes(normalizedSearch);
    });
};

const getFilterExportValue = (filter, value, optionSets) => {
  const options = getOptions(optionSets, filter);
  const selectedOption = options.find((option) => String(getOptionValue(option, filter)) === String(value));

  return selectedOption ? getOptionLabel(selectedOption, filter) : value;
};

const usesOptionSource = (config, source) =>
  [...(config.filters || []), ...(config.fields || [])].some((descriptor) => {
    const settings = getOptionSettings(descriptor);
    return settings.source === source;
  });

const MaestroForm = ({ config, mode, initialData, fixedValues, optionSets, isSubmitting, onCancel, onSubmit }) => {
  const [lookupState, setLookupState] = useState({ field: null, searchText: '' });
  const validationSchema = useMemo(() => buildValidationSchema(config), [config]);
  const initialValues = useMemo(() => buildInitialValues(config, initialData, fixedValues), [config, initialData, fixedValues]);

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      enableReinitialize
      onSubmit={(values) => {
        onSubmit(buildPayload(config, values));
      }}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, resetForm, setFieldValue, setFieldTouched }) => {
        const lookupField = lookupState.field;
        const lookupOptions = lookupField ? getOptions(optionSets, lookupField) : [];
        const lookupRows = lookupField ? getLookupRows(lookupOptions, lookupField, lookupState.searchText) : [];
        const closeLookup = () => setLookupState({ field: null, searchText: '' });
        const selectLookupRow = (row) => {
          setFieldValue(lookupField.name, row.value);
          setFieldTouched(lookupField.name, true, false);
          closeLookup();
        };

        return (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {config.fields
                .filter((field) => !field.hidden && !field.formHidden)
                .map((field) => {
                  const isKey = config.primaryKey.includes(field.name);
                  const displayLabel = getDisplayLabel(field.label);
                  const isFixed = isFilled(fixedValues[field.name]);
                  const isRequired = field.required || isKey;
                  const hasSelectOptions = Boolean(field.options || field.optionSource);
                  const options = hasSelectOptions ? getOptions(optionSets, field) : [];
                  const disabled = field.readOnly || (mode === 'edit' && isKey) || isFixed || (field.contextOnly && !field.optionSource);
                  const usesLookup = Boolean(field.optionSource?.lookup);
                  const selectedValue = values[field.name];
                  const selectedValueHasOption =
                    hasSelectOptions && options.some((option) => toFormValue(field, getOptionValue(option, field)) === selectedValue);

                  return (
                    <Grid key={field.name} size={field.formSize || { xs: 12, md: 6 }}>
                      {usesLookup ? (
                        <TextField
                          fullWidth
                          id={`${field.name}-lookup`}
                          name={field.name}
                          label={displayLabel}
                          value={getLookupDisplayValue(options, field, values[field.name])}
                          onBlur={handleBlur}
                          disabled={disabled}
                          required={isRequired}
                          error={Boolean(touched[field.name] && errors[field.name])}
                          helperText={touched[field.name] && errors[field.name] ? errors[field.name] : ''}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">
                                {!isRequired && isFilled(values[field.name]) && (
                                  <IconButton
                                    edge="end"
                                    disabled={disabled}
                                    onClick={() => {
                                      setFieldValue(field.name, '');
                                      setFieldTouched(field.name, true, false);
                                    }}
                                    aria-label={`Limpiar ${displayLabel}`}
                                  >
                                    <ClearOutlined />
                                  </IconButton>
                                )}
                                <IconButton
                                  edge="end"
                                  disabled={disabled}
                                  onClick={() => setLookupState({ field, searchText: '' })}
                                  aria-label={`Buscar ${displayLabel}`}
                                >
                                  <SearchOutlined />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />
                      ) : field.type === 'date' ? (
                        <ChileDatePicker
                          fullWidth
                          label={displayLabel}
                          value={values[field.name]}
                          onChange={(value) => {
                            setFieldValue(field.name, value);
                            setFieldTouched(field.name, true, false);
                          }}
                          disabled={disabled}
                          required={isRequired}
                          clearable={!isRequired}
                          slotProps={{
                            textField: {
                              id: field.name,
                              name: field.name,
                              onBlur: handleBlur,
                              error: Boolean(touched[field.name] && errors[field.name]),
                              helperText: touched[field.name] && errors[field.name] ? errors[field.name] : ''
                            }
                          }}
                        />
                      ) : (
                        <TextField
                          fullWidth
                          select={hasSelectOptions}
                          id={field.name}
                          name={field.name}
                          label={displayLabel}
                          type={
                            !hasSelectOptions ? (field.type === 'number' || field.type === 'decimal' ? 'number' : field.type) : undefined
                          }
                          value={values[field.name]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          disabled={disabled}
                          required={isRequired}
                          error={Boolean(touched[field.name] && errors[field.name])}
                          helperText={touched[field.name] && errors[field.name] ? errors[field.name] : ''}
                          inputProps={{
                            ...(field.maxLength ? { maxLength: field.maxLength } : {}),
                            ...(field.type === 'decimal' ? { step: '0.0001' } : {}),
                            ...(field.min !== undefined ? { min: field.min } : {}),
                            ...(field.exclusiveMin !== undefined ? { min: Number(field.exclusiveMin) + 0.0001 } : {})
                          }}
                        >
                          {hasSelectOptions && !isRequired && (
                            <MenuItem value="">
                              <em>Sin valor</em>
                            </MenuItem>
                          )}

                          {hasSelectOptions && isFilled(selectedValue) && !selectedValueHasOption && (
                            <MenuItem value={selectedValue}>{selectedValue}</MenuItem>
                          )}

                          {hasSelectOptions &&
                            options.map((option) => {
                              const optionValue = toFormValue(field, getOptionValue(option, field));

                              return (
                                <MenuItem key={`${field.name}-${optionValue}`} value={optionValue}>
                                  {getOptionLabel(option, field)}
                                </MenuItem>
                              );
                            })}
                        </TextField>
                      )}
                    </Grid>
                  );
                })}

              <Grid size={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<ClearOutlined />}
                    onClick={() => {
                      resetForm();
                      onCancel();
                    }}
                  >
                    Cancelar
                  </Button>

                  <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Guardar'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            <Dialog open={Boolean(lookupField)} onClose={closeLookup} fullWidth maxWidth="sm">
              <DialogTitle>{lookupField ? `Seleccionar ${getDisplayLabel(lookupField.label)}` : 'Seleccionar'}</DialogTitle>

              <Divider />

              <DialogContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    autoFocus
                    label="Buscar"
                    value={lookupState.searchText}
                    onChange={(event) => setLookupState((prev) => ({ ...prev, searchText: event.target.value }))}
                  />

                  <Box sx={{ height: 420, width: '100%' }}>
                    <DataGrid
                      rows={lookupRows}
                      columns={[
                        { field: 'value', headerName: 'Codigo', width: 140 },
                        { field: 'label', headerName: 'Descripcion', flex: 1, minWidth: 220 },
                        {
                          field: 'select',
                          headerName: '',
                          width: 130,
                          sortable: false,
                          filterable: false,
                          disableColumnMenu: true,
                          renderCell: (params) => (
                            <Button size="small" variant="text" onClick={() => selectLookupRow(params.row)}>
                              Seleccionar
                            </Button>
                          )
                        }
                      ]}
                      onRowDoubleClick={(params) => selectLookupRow(params.row)}
                      pageSizeOptions={[5, 10, 25]}
                      initialState={{
                        pagination: {
                          paginationModel: {
                            page: 0,
                            pageSize: 10
                          }
                        }
                      }}
                      disableRowSelectionOnClick
                    />
                  </Box>
                </Stack>
              </DialogContent>

              <DialogActions>
                <Button color="secondary" onClick={closeLookup}>
                  Cancelar
                </Button>
              </DialogActions>
            </Dialog>
          </form>
        );
      }}
    </Formik>
  );
};

const SecurityCrud = ({ catalogName }) => {
  const baseConfig = gxSecurityConfig[catalogName];
  const { company } = useAuth();
  const config = useMemo(() => {
    if (!baseConfig?.sessionCompanyField) return baseConfig;
    return {
      ...baseConfig,
      contextParams: {
        ...(baseConfig.contextParams || {}),
        [baseConfig.sessionCompanyField]: company?.empCod
      }
    };
  }, [baseConfig, company?.empCod]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [filters, setFilters] = useState(() => buildInitialFilters(config));
  const [searchText, setSearchText] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [formState, setFormState] = useState({ open: false, mode: 'create', row: null });
  const [deleteRow, setDeleteRow] = useState(null);
  const [roleAssignmentUser, setRoleAssignmentUser] = useState(null);
  const [rolePermissionsRole, setRolePermissionsRole] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const visibleFilters = useMemo(() => getVisibleFilters(config), [config]);
  const needsUsuariosOptions = useMemo(() => usesOptionSource(config, 'usuarios') || config.roleAssignmentManager, [config]);
  const needsSistemasOptions = useMemo(() => usesOptionSource(config, 'sistemas'), [config]);
  const needsModulosOptions = useMemo(() => usesOptionSource(config, 'modulos'), [config]);
  const needsProgramasOptions = useMemo(() => usesOptionSource(config, 'programas'), [config]);
  const needsAccionesOptions = useMemo(() => usesOptionSource(config, 'programaAcciones'), [config]);
  const needsRolesOptions = useMemo(() => usesOptionSource(config, 'roles'), [config]);

  const requiredFiltersReady = useMemo(
    () => visibleFilters.every((filter) => !filter.required || isFilled(filters[filter.name])),
    [visibleFilters, filters]
  );

  const listParams = useMemo(
    () => ({
      limit: 500,
      ...(config.contextParams || {}),
      q: activeSearch,
      ...filters
    }),
    [activeSearch, config.contextParams, filters]
  );

  const usuariosQuery = useQuery({
    queryKey: ['gx-seguridad', 'usuarios', 'options'],
    queryFn: () => listSecurityCatalog('usuarios', { limit: 1000 }),
    enabled: needsUsuariosOptions,
    staleTime: 5 * 60 * 1000
  });

  const sistemasQuery = useQuery({
    queryKey: ['gx-seguridad', 'sistemas', 'options'],
    queryFn: () => listSecurityCatalog('sistemas', { limit: 1000 }),
    enabled: needsSistemasOptions,
    staleTime: 5 * 60 * 1000
  });

  const modulosQuery = useQuery({
    queryKey: ['gx-seguridad', 'modulos', 'options'],
    queryFn: () => listSecurityCatalog('modulos', { limit: 1000 }),
    enabled: needsModulosOptions,
    staleTime: 5 * 60 * 1000
  });

  const programasQuery = useQuery({
    queryKey: ['gx-seguridad', 'programas', 'options'],
    queryFn: () => listSecurityCatalog('programas', { limit: 1000 }),
    enabled: needsProgramasOptions,
    staleTime: 5 * 60 * 1000
  });

  const accionesQuery = useQuery({
    queryKey: ['gx-seguridad', 'programaAcciones', 'options'],
    queryFn: () => listSecurityCatalog('programaAcciones', { limit: 1000 }),
    enabled: needsAccionesOptions,
    staleTime: 5 * 60 * 1000
  });

  const rolesQuery = useQuery({
    queryKey: ['gx-seguridad', 'roles', 'options'],
    queryFn: () => listSecurityCatalog('roles', { limit: 1000 }),
    enabled: needsRolesOptions,
    staleTime: 5 * 60 * 1000
  });

  const optionSets = useMemo(
    () => ({
      usuarios: usuariosQuery.data?.data || [],
      sistemas: sistemasQuery.data?.data || [],
      modulos: modulosQuery.data?.data || [],
      programas: programasQuery.data?.data || [],
      programaAcciones: accionesQuery.data?.data || [],
      roles: rolesQuery.data?.data || []
    }),
    [usuariosQuery.data, sistemasQuery.data, modulosQuery.data, programasQuery.data, accionesQuery.data, rolesQuery.data]
  );

  const rowsQuery = useQuery({
    queryKey: ['gx-seguridad', catalogName, 'rows', listParams],
    queryFn: () => listSecurityCatalog(config.apiName, listParams),
    enabled: requiredFiltersReady
  });

  const rows = rowsQuery.data?.data || [];
  const canExport = requiredFiltersReady && rows.length > 0 && !rowsQuery.isFetching;
  const fixedValues = useMemo(() => getFixedValues(config, filters), [config, filters]);

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const invalidateCurrentCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['gx-seguridad', catalogName] });
    queryClient.invalidateQueries({ queryKey: ['gx-seguridad'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => insertSecurityCatalog(config.apiName, payload),
    onSuccess: (data) => {
      invalidateCurrentCatalog();
      setFormState({ open: false, mode: 'create', row: null });
      setSnackbar({
        open: true,
        message: data?.message || 'Registro creado',
        severity: 'success'
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Error creando registro'),
        severity: 'error'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateSecurityCatalog(config.apiName, payload),
    onSuccess: (data) => {
      invalidateCurrentCatalog();
      setFormState({ open: false, mode: 'create', row: null });
      setSnackbar({
        open: true,
        message: data?.message || 'Registro actualizado',
        severity: 'success'
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Error actualizando registro'),
        severity: 'error'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (row) => {
      const payload = config.primaryKey.reduce((values, fieldName) => {
        values[fieldName] = row[fieldName];
        return values;
      }, {});

      return deleteSecurityCatalog(config.apiName, payload);
    },
    onSuccess: (data) => {
      invalidateCurrentCatalog();
      setDeleteRow(null);
      setSnackbar({
        open: true,
        message: data?.message || 'Registro eliminado',
        severity: 'success'
      });
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Error eliminando registro'),
        severity: 'error'
      });
    }
  });

  const columns = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Acciones',
        width: config.userAssignmentsManager ? 210 : config.roleAssignmentManager || config.rolePermissionsManager ? 168 : 120,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            {!config.disableEdit && (
              <Tooltip title="Editar">
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => setFormState({ open: true, mode: 'edit', row: params.row })}
                  sx={{ minWidth: 36 }}
                  aria-label="Editar registro"
                >
                  <EditOutlined />
                </Button>
              </Tooltip>
            )}

            {config.rolePermissionsFromAssignment && (
              <Tooltip title="Configurar plantilla del rol">
                <Button
                  size="small"
                  variant="text"
                  color="secondary"
                  onClick={() => setRolePermissionsRole(params.row)}
                  sx={{ minWidth: 36 }}
                  aria-label={'Configurar permisos del rol ' + params.row.ROLCod}
                >
                  <SafetyCertificateOutlined />
                </Button>
              </Tooltip>
            )}

            {config.rolePermissionsManager && (
              <Tooltip title="Configurar permisos del rol">
                <Button
                  size="small"
                  variant="text"
                  color="secondary"
                  onClick={() => setRolePermissionsRole(params.row)}
                  sx={{ minWidth: 36 }}
                  aria-label={'Configurar permisos del rol ' + params.row.ROLCod}
                >
                  <SafetyCertificateOutlined />
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Eliminar">
              <Button
                size="small"
                variant="text"
                color="error"
                onClick={() => setDeleteRow(params.row)}
                sx={{ minWidth: 36 }}
                aria-label="Eliminar registro"
              >
                <DeleteOutlined />
              </Button>
            </Tooltip>

            {config.roleAssignmentManager && (
              <Tooltip title="Administrar roles">
                <Button
                  size="small"
                  variant="text"
                  color="secondary"
                  onClick={() => setRoleAssignmentUser(params.row)}
                  sx={{ minWidth: 36 }}
                  aria-label={'Administrar roles de ' + params.row.UsuLogin}
                >
                  <UserAddOutlined />
                </Button>
              </Tooltip>
            )}

            {config.userAssignmentsManager && (
              <Tooltip title="Administrar sistemas, módulos y programas">
                <Button
                  size="small"
                  variant="text"
                  color="primary"
                  onClick={() => navigate(`/seguridad/asignaciones?usuario=${encodeURIComponent(params.row.UsuLogin)}`)}
                  sx={{ minWidth: 36 }}
                  aria-label={'Administrar accesos de ' + params.row.UsuLogin}
                >
                  <KeyOutlined />
                </Button>
              </Tooltip>
            )}
          </Stack>
        )
      },
      ...config.fields
        .filter((field) => !field.hidden && !field.listHidden)
        .map((field) => ({
          field: field.name,
          headerName: getDisplayLabel(field.label),
          width: field.width,
          minWidth: field.minWidth,
          flex: field.flex,
          valueFormatter: (value) => formatCellValue(field, value)
        }))
    ],
    [
      config.disableEdit,
      config.fields,
      config.roleAssignmentManager,
      config.rolePermissionsFromAssignment,
      config.rolePermissionsManager,
      config.userAssignmentsManager,
      navigate
    ]
  );

  const exportColumns = useMemo(
    () =>
      config.fields
        .filter((field) => !field.hidden && !field.listHidden)
        .map((field) => ({
          field: field.name,
          headerName: getDisplayLabel(field.label),
          exportValue: (row) => formatCellValue(field, row[field.name])
        })),
    [config.fields]
  );

  const exportFilters = useMemo(() => {
    const activeFilters = visibleFilters
      .filter((filter) => isFilled(filters[filter.name]))
      .map((filter) => `${getDisplayLabel(filter.label)}: ${getFilterExportValue(filter, filters[filter.name], optionSets)}`);

    if (isFilled(activeSearch)) activeFilters.push(`Buscar: ${activeSearch}`);

    return activeFilters;
  }, [activeSearch, filters, optionSets, visibleFilters]);

  const missingFilter = visibleFilters.find((filter) => filter.required && !isFilled(filters[filter.name]));

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => {
      const next = {
        ...prev,
        [filterName]: value
      };

      for (const filter of visibleFilters) {
        if (filter.dependsOn === filterName) next[filter.name] = '';
      }

      return next;
    });
  };

  const handleClearFilters = () => {
    setFilters(buildInitialFilters(config));
    setSearchText('');
    setActiveSearch('');
  };

  const handleSubmit = (payload) => {
    if (formState.mode === 'edit') {
      updateMutation.mutate(payload);
      return;
    }

    createMutation.mutate(payload);
  };

  const handleOpenCreate = () => {
    setFormState({ open: true, mode: 'create', row: null });
  };

  const handleExportNotify = ({ message, severity = 'info' }) => {
    setSnackbar({ open: true, message, severity });
  };

  if (!config) {
    return (
      <MainCard title="Maestro">
        <Alert severity="error">Catalogo no configurado</Alert>
      </MainCard>
    );
  }

  return (
    <MainCard title={config.title}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', lg: 'center' }}
          spacing={2}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ flex: 1 }}>
            {visibleFilters.map((filter) => {
              const options = getOptions(optionSets, filter);
              const disabled = filter.dependsOn && !isFilled(filters[filter.dependsOn]);

              return (
                <TextField
                  key={filter.name}
                  select
                  fullWidth
                  label={getDisplayLabel(filter.label)}
                  value={filters[filter.name] || ''}
                  onChange={(event) => handleFilterChange(filter.name, event.target.value)}
                  disabled={disabled}
                >
                  <MenuItem value="">
                    <em>Todos</em>
                  </MenuItem>

                  {options.map((option) => (
                    <MenuItem key={option[filter.valueField]} value={option[filter.valueField]}>
                      {getOptionLabel(option, filter)}
                    </MenuItem>
                  ))}
                </TextField>
              );
            })}

            <TextField
              fullWidth
              label="Buscar"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') setActiveSearch(searchText);
              }}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<SearchOutlined />}
              disabled={!requiredFiltersReady}
              onClick={() => setActiveSearch(searchText)}
            >
              Buscar
            </Button>

            <Button variant="outlined" color="secondary" startIcon={<ClearOutlined />} onClick={handleClearFilters}>
              Limpiar
            </Button>

            <ListExportButtons
              title={config.title}
              rows={rows}
              columns={exportColumns}
              filters={exportFilters}
              disabled={!canExport}
              onNotify={handleExportNotify}
            />

            <Button variant="contained" startIcon={<PlusOutlined />} onClick={handleOpenCreate}>
              {config.createLabel || 'Nuevo'}
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip label={`Nivel GX ${config.level}`} size="small" variant="outlined" />
          {config.parentTable && <Chip label={`Padre ${config.parentTable}`} size="small" variant="outlined" color="primary" />}
        </Stack>

        {!requiredFiltersReady && missingFilter && (
          <Alert severity="info">
            Seleccione {getDisplayLabel(missingFilter.label)} para listar {config.title}
          </Alert>
        )}

        {rowsQuery.isError && <Alert severity="error">{getErrorMessage(rowsQuery.error, `Error cargando ${config.title}`)}</Alert>}

        <Box sx={{ height: 560, width: '100%' }}>
          <DataGrid
            rows={requiredFiltersReady ? rows : []}
            columns={columns}
            loading={rowsQuery.isLoading || rowsQuery.isFetching}
            getRowId={(row) => getRowKey(config, row)}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: 10
                }
              }
            }}
            disableRowSelectionOnClick
          />
        </Box>
      </Stack>

      <Dialog open={formState.open} onClose={() => setFormState({ open: false, mode: 'create', row: null })} fullWidth maxWidth="md">
        <DialogTitle>{formState.mode === 'edit' ? 'Editar' : 'Nuevo'} registro</DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <MaestroForm
            config={config}
            mode={formState.mode}
            initialData={formState.row}
            fixedValues={fixedValues}
            optionSets={optionSets}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            onCancel={() => setFormState({ open: false, mode: 'create', row: null })}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteRow)} onClose={() => setDeleteRow(null)} fullWidth maxWidth="xs">
        <DialogTitle>Eliminar registro</DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2">
            {config.primaryKey.map((fieldName) => `${getFieldDisplayLabel(config, fieldName)}: ${deleteRow?.[fieldName]}`).join(' / ')}
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button color="secondary" onClick={() => setDeleteRow(null)}>
            Cancelar
          </Button>

          <Button color="error" variant="contained" disabled={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteRow)}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {config.roleAssignmentManager && (
        <RoleAssignmentDialog
          open={Boolean(roleAssignmentUser)}
          user={roleAssignmentUser}
          companyCode={company?.empCod}
          onClose={() => setRoleAssignmentUser(null)}
          onChanged={invalidateCurrentCatalog}
          onConfigureRole={(role) => setRolePermissionsRole(role)}
          onNotify={(message, severity) => setSnackbar({ open: true, message, severity })}
        />
      )}

      <RolePermissionsDialog
        open={Boolean(rolePermissionsRole)}
        role={rolePermissionsRole}
        onClose={() => setRolePermissionsRole(null)}
        onNotify={(message, severity) => setSnackbar({ open: true, message, severity })}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainCard>
  );
};

export default SecurityCrud;
