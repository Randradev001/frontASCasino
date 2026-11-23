import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import BranchesOutlined from '@ant-design/icons/BranchesOutlined';
import FileOutlined from '@ant-design/icons/FileOutlined';

const reactRoutesByGxCall = {
  'maefppersonas.aspx': '/personas',
  'maefppersonaladm.aspx': '/personas',
  'fichadepersona.aspx': '/personas',
  'maessp06oppedidosplanta.aspx': '/casino/pedidos/nuevo',
  'solicitapedidocasino.aspx': '/casino/pedidos/nuevo',
  'solicitapedido02.aspx': '/casino/pedidos/nuevo',
  'react.casinodashboard': '/casino/pedidos/historial',
  'react.casinohistory': '/casino/pedidos/historial',
  'pedidoscasinostatus.aspx': '/casino/solicitudes',
  'react.casinorequests': '/casino/solicitudes',
  'maessp06macasinosplanta.aspx': '/casino/maestros/casinos',
  'react.casinomaster.casinos': '/casino/maestros/casinos',
  'maessp06madestinosplanta.aspx': '/casino/maestros/destinos',
  'react.casinomaster.destinos': '/casino/maestros/destinos',
  'maessp06mamotivopedidos.aspx': '/casino/maestros/motivos',
  'maessp06mamotivospedidos.aspx': '/casino/maestros/motivos',
  'react.casinomaster.motivos': '/casino/maestros/motivos',
  'maessp06matpproducto.aspx': '/casino/maestros/tipos-producto',
  'react.casinomaster.tiposproducto': '/casino/maestros/tipos-producto',
  'maessp06maproducto.aspx': '/casino/maestros/productos',
  'react.casinomaster.productos': '/casino/maestros/productos',
  'ssp06consultaanualtipoproducto.aspx': '/casino/consultas/tipo-producto',
  'react.casinoreport.tipoproducto': '/casino/consultas/tipo-producto',
  'ssp06consultaanualubicacion.aspx': '/casino/consultas/centro-costo',
  'react.casinoreport.centrocosto': '/casino/consultas/centro-costo',
  'ssp06consultaanualusuario.aspx': '/casino/consultas/persona',
  'react.casinoreport.persona': '/casino/consultas/persona',
  'cpedpormotivo.aspx': '/casino/consultas/motivo',
  'react.casinoreport.motivo': '/casino/consultas/motivo',
  'ssp06consultageneral.aspx': '/casino/consultas/descarga-general',
  'react.casinoreport.descargageneral': '/casino/consultas/descarga-general',
  'react.casinomail.status': '/casino/correos',
  'tsistemasww.aspx': '/seguridad/sistemas',
  'tmodulosww.aspx': '/seguridad/modulos',
  'tprogramww.aspx': '/seguridad/programas',
  'usuariosww.aspx': '/seguridad/usuarios',
  'urolesww.aspx': '/seguridad/roles',
  wmodulos: '/seguridad/modulos',
  wprogram: '/seguridad/programas',
  wusuarios: '/seguridad/usuarios',
  wnivseg: '/seguridad/niveles',
  wasigprog: '/seguridad/asignaciones',
  tsistemas: '/seguridad/sistemas'
};

const normalizeCall = (value) =>
  String(value || '')
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    .toLowerCase();

export const resolveProgramRoute = (gxCall) => reactRoutesByGxCall[normalizeCall(gxCall)] || null;

const deduplicatePrograms = (programs) =>
  programs.filter((program, index) => programs.findIndex((candidate) => candidate.url === program.url) === index);

export const buildAuthorizedMenu = (systems = [], canManageSecurity = false) => {
  const authorizedSystems = systems
    .map((system) => {
      const modules = (system.modulos || [])
        .map((module) => {
          const programs = deduplicatePrograms(
            (module.programas || [])
              .map((program) => ({ ...program, url: resolveProgramRoute(program.llamadoGX) }))
              .filter((program) => program.url && (canManageSecurity || !program.url.startsWith('/seguridad/')))
              .map((program) => ({
                id: `program-${system.sistCod}-${module.modCod}-${program.progCod}`,
                title: program.nombre,
                type: 'item',
                url: program.url,
                target: Boolean(program.target),
                icon: FileOutlined
              }))
          );
          if (!programs.length) return null;
          return {
            id: `module-${system.sistCod}-${module.modCod}`,
            title: module.nombre,
            type: 'collapse',
            icon: BranchesOutlined,
            children: programs
          };
        })
        .filter(Boolean);

      if (!modules.length) return null;
      return {
        id: `system-${system.sistCod}`,
        title: system.nombre,
        type: 'collapse',
        icon: AppstoreOutlined,
        children: modules
      };
    })
    .filter(Boolean);

  if (!authorizedSystems.length) return null;
  return {
    id: 'authorized-systems',
    title: 'ADP - Casino',
    type: 'group',
    children: authorizedSystems
  };
};
