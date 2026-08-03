# ADP Casino — frontend

Interfaz corporativa para solicitudes de Casino, análisis de pedidos, ficha de Personas
y administración de Seguridad. Este proyecto nació sobre Mantis/MUI, pero el producto
actual es ADP Casino y no debe tratarse como el template original.

## Aplicación

- Panel ejecutivo para Rosario, San Vicente y Lo Miranda.
- Creación de solicitudes mediante catálogo visual y carrito.
- Historial filtrable con contadores por tipo y producto, gráfica, conclusión y detalle.
- Consulta de Personas.
- Usuarios, roles, programas y asignaciones para administradores de Seguridad.

## Requisitos

- Node.js compatible con Vite 7.
- Dependencias instaladas con el gestor definido en `packageManager` (`yarn@4.12.0`).
- Backend ADP disponible; en desarrollo se usa el host actual y puerto 3000 salvo que se
  configure `VITE_API_URL`.

## Desarrollo

```powershell
yarn install
yarn start
```

Comprobaciones:

```powershell
yarn lint
yarn build
```

## Rutas de producto

| Ruta | Pantalla |
| --- | --- |
| `/dashboard/default` | Panel ejecutivo principal |
| `/casino/pedidos/nuevo` | Nueva solicitud Casino |
| `/casino/pedidos/historial` | Historial e indicadores de pedidos |
| `/personas` | Personas |
| `/seguridad/*` | Administración de Seguridad |

## Seguridad

La sesión vive en una cookie `HttpOnly` administrada por el backend. `AuthContext`
recupera usuario, empresa, permisos y menú. La interfaz puede ocultar opciones, pero la
autorización real siempre se vuelve a comprobar en Node.

El menú estático conserva `Inicio > Panel ejecutivo`. El menú de negocio se construye
desde `SISTEMAS`, `MODULOS`, `PROGRAM` y permisos efectivos; la traducción de llamados
GeneXus a rutas React está en `src/menu-items/authorizedMenu.jsx`.

## Identidad visual

- Azul `#00549F`.
- Naranjo `#FF740C`.
- Blanco `#FFFFFF`.
- Logotipo y recursos corporativos en `src/assets/images/brand/`.
- Imágenes referenciales de familias de producto en `src/assets/images/products/`.

## Documentación para continuidad

Leer [AGENTS.md](AGENTS.md) antes de modificar el proyecto. El contexto completo,
contratos y procedimiento para asistentes está en el repositorio hermano:

- [Índice documental](../backendAS/docs/README.md).
- [Estado actual](../backendAS/docs/ai/CURRENT-STATE.md).
- [API y permisos](../backendAS/docs/ai/API-AND-PERMISSIONS.md).
- [Manual de continuidad](../backendAS/docs/ai/ASSISTANT-RUNBOOK.md).
