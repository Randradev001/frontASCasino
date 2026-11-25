import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import BranchesOutlined from '@ant-design/icons/BranchesOutlined';
import FileOutlined from '@ant-design/icons/FileOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import UnorderedListOutlined from '@ant-design/icons/UnorderedListOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import EnvironmentOutlined from '@ant-design/icons/EnvironmentOutlined';
import TagsOutlined from '@ant-design/icons/TagsOutlined';
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import PieChartOutlined from '@ant-design/icons/PieChartOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import FileSearchOutlined from '@ant-design/icons/FileSearchOutlined';
import ProfileOutlined from '@ant-design/icons/ProfileOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import AuditOutlined from '@ant-design/icons/AuditOutlined';

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
  'react.casinomaster.solicitantes': '/casino/maestros/solicitantes',
  'react.casinoload.center': '/casino/cargas',
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

const programIcons = {
  '/casino/pedidos/nuevo': ShoppingCartOutlined,
  '/casino/pedidos/historial': BarChartOutlined,
  '/casino/solicitudes': UnorderedListOutlined,
  '/casino/maestros/casinos': ShopOutlined,
  '/casino/maestros/destinos': EnvironmentOutlined,
  '/casino/maestros/motivos': TagsOutlined,
  '/casino/maestros/tipos-producto': AppstoreOutlined,
  '/casino/maestros/productos': DatabaseOutlined,
  '/casino/maestros/solicitantes': TeamOutlined,
  '/casino/cargas': DatabaseOutlined,
  '/casino/consultas/tipo-producto': PieChartOutlined,
  '/casino/consultas/centro-costo': EnvironmentOutlined,
  '/casino/consultas/persona': UserOutlined,
  '/casino/consultas/motivo': TagsOutlined,
  '/casino/consultas/descarga-general': FileSearchOutlined,
  '/casino/correos': FileSearchOutlined,
  '/personas': TeamOutlined,
  '/seguridad/usuarios': UserOutlined,
  '/seguridad/roles': TeamOutlined,
  '/seguridad/sistemas': AppstoreOutlined,
  '/seguridad/modulos': BranchesOutlined,
  '/seguridad/programas': FileOutlined
};

const deduplicatePrograms = (programs) =>
  programs.filter((program, index) => programs.findIndex((candidate) => candidate.url === program.url) === index);

const normalizeTitle = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const moduleIcon = (module, programs) => {
  const title = normalizeTitle(module.nombre);
  const urls = programs.map((program) => program.url);
  if (title.includes('consulta') || urls.some((url) => url.includes('/consultas/') || url.includes('/historial'))) return BarChartOutlined;
  if (title.includes('maestro') || urls.some((url) => url.includes('/maestros/') || url.includes('/cargas'))) return DatabaseOutlined;
  if (title.includes('persona') || urls.every((url) => url.startsWith('/personas'))) return ProfileOutlined;
  if (title.includes('seguridad') || urls.some((url) => url.startsWith('/seguridad/'))) return SafetyCertificateOutlined;
  if (title.includes('operacion') || urls.some((url) => url.includes('/pedidos/') || url === '/casino/solicitudes')) return AuditOutlined;
  if (title.includes('admin')) return SettingOutlined;
  return BranchesOutlined;
};

const systemIcon = (system, modules) => {
  const title = normalizeTitle(system.nombre);
  const urls = modules.flatMap((module) => module.children.map((program) => program.url));
  if (title.includes('persona') || urls.every((url) => url.startsWith('/personas'))) return ProfileOutlined;
  if (title.includes('seguridad') || urls.some((url) => url.startsWith('/seguridad/'))) return SafetyCertificateOutlined;
  if (title.includes('casino') || urls.some((url) => url.startsWith('/casino/'))) return ShopOutlined;
  return AppstoreOutlined;
};

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
                target: false,
                icon: programIcons[program.url] || FileOutlined
              }))
          );
          if (!programs.length) return null;
          return {
            id: `module-${system.sistCod}-${module.modCod}`,
            title: module.nombre,
            type: 'collapse',
            icon: moduleIcon(module, programs),
            children: programs
          };
        })
        .filter(Boolean);

      if (!modules.length) return null;
      return {
        id: `system-${system.sistCod}`,
        title: system.nombre,
        type: 'collapse',
        icon: systemIcon(system, modules),
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
