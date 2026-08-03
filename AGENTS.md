# ADP Casino frontend — instrucciones para asistentes

## Contexto

Este repositorio React/Vite es la interfaz de ADP Casino. El backend asociado está en
`C:\Proyectos2025\AS\backendAS` y su documentación canónica comienza en
`C:\Proyectos2025\AS\backendAS\docs\README.md`.

Antes de cambiar una pantalla de Casino, Personas, menú o Seguridad, leer también:

- `backendAS\docs\ai\CURRENT-STATE.md`.
- `backendAS\docs\ai\API-AND-PERMISSIONS.md`.
- `backendAS\docs\ai\ASSISTANT-RUNBOOK.md`.

## Tecnología y arquitectura

- React 19 con componentes funcionales.
- Vite 7.
- Material UI 7 y MUI X Charts.
- React Router.
- Context API para sesión y configuración.
- Axios centralizado en `src/api/api.js`.
- Ant Design Icons.

Ubicaciones principales:

- `src/pages/`: páginas por dominio.
- `src/api/`: contratos HTTP.
- `src/routes/`: rutas y protecciones.
- `src/menu-items/`: menú estático y traducción de programas GeneXus.
- `src/contexts/AuthContext.jsx`: sesión, empresa, permisos y menú autorizado.
- `src/themes/`: tema corporativo.
- `src/assets/images/brand/` y `src/assets/images/products/`: recursos visuales.

## Reglas no negociables

- Nunca enviar `EmpCod` o `GECODEMP` para cambiar la empresa autenticada.
- No implementar reglas de precios, correlativos, ubicación, estados o permisos en
  React. El backend decide y React presenta.
- No confiar en ocultar un menú como seguridad; cada endpoint debe estar protegido.
- No inventar datos cuando falla una API. Mostrar error y permitir reintento.
- No duplicar clientes Axios; agregar funciones en `src/api/`.
- Preservar rutas y cambios ajenos en un worktree sucio.
- No desplegar ni publicar sin solicitud explícita.

## Menú vigente

El menú combina dos fuentes:

1. `Inicio > Panel ejecutivo`, entrada estática a `/dashboard/default`.
2. Menú dinámico del backend, filtrado por `ASIGPROG` y roles.

Traducciones críticas en `authorizedMenu.jsx`:

- `ssp.maeSSP06OPPedidosPlanta.aspx` -> `/casino/pedidos/nuevo`.
- `react.casinoHistory` -> `/casino/pedidos/historial`.
- Llamados de Personas -> `/personas`.
- Llamados de Seguridad -> `/seguridad/*`.

No mapear dos programas funcionalmente distintos a una misma ruta para hacerlos
“aparecer”. Crear una segunda ruta y un registro `PROGRAM` cuando sean experiencias
separadas.

## Rutas principales

- `/dashboard/default`: dashboard ejecutivo principal.
- `/casino/pedidos/nuevo`: creación visual de solicitudes.
- `/casino/pedidos/historial`: indicadores, filtros, listado y detalle histórico.
- `/personas` y `/personas/:rut`: ficha de Personas.
- `/seguridad/*`: administración protegida por `SecurityAdminRoute` y backend.

## Diseño corporativo

- Azul principal: `#00549F`.
- Naranjo principal: `#FF740C`.
- Blanco: `#FFFFFF`.
- Usar superficies claras, tipografía legible, jerarquía de información y estados con
  color semántico.
- Reutilizar MUI y componentes existentes; no introducir otra librería de UI.
- Todas las acciones deben ser utilizables con teclado y tener etiquetas accesibles.
- Diseñar primero para información real y estados vacío, carga y error.
- Las imágenes de producto son referenciales por familia y están optimizadas en WebP.

## Protocolo de cambio

1. Revisar `git status --short` y leer los archivos relacionados completos.
2. Confirmar endpoint, payload y permiso en la documentación del backend.
3. Modificar API, ruta, pantalla y menú solo en las capas necesarias.
4. Si cambia el contrato, coordinar el servicio backend en el mismo trabajo.
5. Actualizar documentación canónica cuando cambie ruta, menú o comportamiento.
6. Formatear y validar únicamente los archivos relevantes.

## Verificación

```powershell
node node_modules\prettier\bin\prettier.cjs --write <archivos-cambiados>
node node_modules\eslint\bin\eslint.js <archivos-cambiados>
node node_modules\vite\bin\vite.js build --logLevel warn
```

La compilación puede necesitar acceso a la carpeta temporal del usuario. Si el cambio
afecta datos o permisos, ejecutar también `node --test` en el backend.

## Definición de terminado

La pantalla debe cubrir carga, vacío, error y éxito; respetar sesión y permisos;
compilar; y tener el contrato backend documentado. No declarar una experiencia validada
por negocio si solo se realizó revisión técnica.
