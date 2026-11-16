# Parche local de deepmerge

Base: `deepmerge@4.3.1`, `dist/cjs.js` del paquete npm oficial.
SHA-256 del archivo original: `2e5160f84a1141bd927264afe4d15766f1e6cf07daef182b37ff53fea121de7d`.
Licencia MIT conservada en LICENSE.

CVE-2026-93753 / GHSA-gcqx-w48m-w2h4 no tiene una versión oficial corregida
al 2026-11-16. Este fork privado filtra `__proto__`, `constructor` y `prototype`
antes de leer/copiar claves de cualquiera de los operandos, incluidas fusiones
recursivas. Conserva las demás opciones y la API CommonJS original.

Solo sustituye la dependencia de `@rollup/plugin-node-resolve`, usada por
Workbox durante la compilación PWA. No sustituye deepmerge 2 de Formik.
No es una nueva versión oficial del proveedor. npm audit no evalúa este paquete
local: la evidencia de corrección son las pruebas de regresión y el diff.

Verificación: `npm run security:test` desde el frontend.
Retirar el fork cuando el proveedor publique una corrección equivalente y se
vuelvan a ejecutar las pruebas y el build.

Referencia: https://github.com/advisories/GHSA-gcqx-w48m-w2h4
