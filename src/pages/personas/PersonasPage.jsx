import { useCallback, useMemo, useState } from 'react';

import EyeOutlined from '@ant-design/icons/EyeOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { listPersonas } from 'api/personasApi';
import MainCard from 'components/MainCard';

const getErrorMessage = (error) => error?.response?.data?.message || error?.message || 'No fue posible consultar Personas.';

export default function PersonasPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', estado: '' });
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 25 });

  const query = useQuery({
    queryKey: ['personas', filters, paginationModel],
    queryFn: () =>
      listPersonas({
        search: filters.search || undefined,
        estado: filters.estado || undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize
      }),
    placeholderData: (previous) => previous
  });

  const openPerson = useCallback((rut) => navigate(`/personas/${rut}`), [navigate]);
  const columns = useMemo(
    () => [
      { field: 'rutCompleto', headerName: 'RUT', width: 125 },
      { field: 'nombreCompleto', headerName: 'Nombre completo', flex: 1, minWidth: 250 },
      {
        field: 'estadoNombre',
        headerName: 'Estado',
        width: 125,
        renderCell: ({ row }) => <Chip size="small" color={row.estado === 1 ? 'success' : 'default'} label={row.estadoNombre} />
      },
      { field: 'centroCosto', headerName: 'Centro de costo', minWidth: 190, flex: 0.7 },
      { field: 'funcion', headerName: 'Funcion', minWidth: 190, flex: 0.7 },
      { field: 'jefe', headerName: 'Jefe directo', minWidth: 210, flex: 0.8 },
      {
        field: 'actions',
        headerName: '',
        width: 110,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Button size="small" startIcon={<EyeOutlined />} onClick={() => openPerson(row.rut)}>
            Ficha
          </Button>
        )
      }
    ],
    [openPerson]
  );

  const submitSearch = (event) => {
    event.preventDefault();
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setFilters((current) => ({ ...current, search: searchInput.trim() }));
  };

  const changeStatus = (event) => {
    setPaginationModel((current) => ({ ...current, page: 0 }));
    setFilters((current) => ({ ...current, estado: event.target.value }));
  };

  return (
    <MainCard title="Ficha de Personas">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Consulta historica de personal ADP. La empresa se obtiene de la sesion autenticada.
        </Typography>

        <Stack component="form" onSubmit={submitSearch} direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <TextField
            fullWidth
            size="small"
            label="RUT o nombre"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                )
              }
            }}
          />
          <TextField select size="small" label="Estado laboral" value={filters.estado} onChange={changeStatus} sx={{ minWidth: 190 }}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="1">Activo</MenuItem>
            <MenuItem value="2">Finiquitado</MenuItem>
          </TextField>
          <Button type="submit" variant="contained" sx={{ minWidth: 110 }}>
            Buscar
          </Button>
        </Stack>

        {query.isError && <Alert severity="error">{getErrorMessage(query.error)}</Alert>}

        <DataGrid
          autoHeight
          rows={query.data?.data || []}
          columns={columns}
          getRowId={(row) => row.rut}
          loading={query.isLoading || query.isFetching}
          rowCount={query.data?.pagination?.total || 0}
          paginationMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 25, 50, 100]}
          onRowDoubleClick={({ row }) => openPerson(row.rut)}
          disableRowSelectionOnClick
          sx={{ minHeight: 460 }}
        />
      </Stack>
    </MainCard>
  );
}
