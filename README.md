# Tropical Butterfly Exports — sitio demostrativo

Sitio web con **panel de clientes** (pedidos, envíos y tracking) y **dashboard de impacto
social** (en qué se convierte cada mariposa vendida).

Stack: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 y Supabase.
Tipografías: Spectral para titulares, IBM Plex Sans para interfaz, IBM Plex Mono para
datos duros (guías, códigos, precios).

---

## Lo que YA funciona ahora mismo

```bash
cd ~/mariposas
npm run dev
```

Abrilo en **http://localhost:3003**. El puerto está fijado en el script `dev` del
`package.json` para no chocar con Foorkie (3000). Para usar otro: `npm run dev -- --port 3005`.

Arranca en **modo demostración**: usa datos de ejemplo en memoria, sin tocar Supabase. Podés
mostrarlo a un cliente tal cual está. La cinta naranja de arriba avisa que es modo demo y
desaparece sola cuando conectás Supabase.

### Páginas

| Ruta | Qué es |
|---|---|
| `/` | Landing: venta + la regla "cada mariposa se convierte en…" |
| `/especies` | Catálogo con precios por pupa |
| `/impacto` | Dashboard público: lo ejecutado vs. la meta anual + bitácora de evidencia |
| `/entrar` | Login y registro de clientes |
| `/creditos` | Autoría y licencia de cada fotografía |
| `/admin` | **Panel administrativo**: resumen de ventas y envíos |
| `/admin/pedidos` | Crear pedidos y ver el estado de todos |
| `/admin/pedidos/[id]` | Editar un pedido: líneas, envío y movimientos del tracking |
| `/admin/clientes` | Clientes, lo que lleva comprado cada uno, dar acceso de admin |
| `/admin/especies` | Alta, edición y baja de especies del catálogo |
| `/admin/impacto` | Proyectos, reglas de conversión y bitácora ejecutada |
| `/admin/ajustes` | Titular, cifras del encabezado, contacto y condiciones de envío |
| `/panel` | Resumen del cliente: mariposas, pedidos, envíos en curso, su impacto |
| `/panel/pedidos` | Historial con el detalle por especie |
| `/panel/envios` | Envíos en curso y entregados |
| `/panel/envios/[id]` | Tracking paso a paso, guía, cadena de frío |
| `/panel/impacto` | Su impacto personal, calculado con las reglas |

---

## Lo que tenés que hacer vos (para conectar tu Supabase)

### Paso 1 — Pegar las credenciales

En Supabase: **Project Settings → API**. Copiá `Project URL` y la llave `anon public`.
Pegalas en el archivo `.env.local` (ya está creado, con los campos vacíos):

```
NEXT_PUBLIC_SUPABASE_URL=https://tuproyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
```

Guardá y reiniciá `npm run dev`.

### Paso 2 — Crear las tablas

En Supabase: **SQL Editor → New query**. Abrí los archivos de `supabase/migraciones/`,
copiá y pegá el contenido, y corré **en este orden**:

1. `001_esquema.sql` — tablas, vistas, RLS y permisos.
2. `002_datos_demo.sql` — catálogo de especies, proyectos sociales, reglas e impacto ejecutado.
3. `004_admin.sql` — el rol de administrador. **Antes de correrlo, cambiá el correo** de la
   línea del `update` por el tuyo: eso es lo que te da acceso a `/admin`.
4. `005_ajustes.sql` — los textos y cifras del sitio, editables desde `/admin/ajustes`.

Todos se pueden volver a correr sin romper nada.

(El `003_pedidos_demo.sql` es opcional: carga pedidos de ejemplo. Si vas a cargar pedidos
reales desde `/admin`, saltátelo.)

### Paso 3 — Permitir el registro sin confirmar correo

Solo para el demo, así te podés registrar y entrar de una:
**Authentication → Sign In / Providers → Email** y apagá *Confirm email*.

(Si preferís dejarlo prendido, al registrarte te llega un correo de confirmación y entrás después
de hacer clic.)

### Paso 4 — Crear tu cuenta

Andá a `/entrar`, pestaña **Crear cuenta**, con tu correo y una contraseña de 6+ caracteres.
Ya deberías entrar al panel, pero todavía sin pedidos.

### Paso 5 — Cargar los pedidos de ejemplo

Abrí `supabase/migraciones/003_pedidos_demo.sql`, **cambiá el correo** de la línea marcada por el
que acabás de registrar, y corré el archivo en el SQL Editor.

```sql
v_correo text := 'tucorreo@gmail.com';   -- <<<<<< TU CORREO AQUÍ
```

Recargá `/panel` y vas a ver 4 pedidos con sus envíos y tracking completo.

---

## El panel administrativo

En `/admin` se carga todo lo que después ven los clientes. **Nada se escribe desde el
navegador del cliente**: las políticas RLS no tienen reglas de escritura, así que todos los
cambios pasan por acciones de servidor que usan la llave `service_role` y verifican antes que
quien llama tenga `rol = admin`.

Para entrar necesitás dos cosas:

1. Estar registrado en el sitio (`/entrar`).
2. Que tu perfil tenga `rol = admin`, que es lo que hace `004_admin.sql`.

Si entrás sin el rol, `/admin` te muestra el SQL exacto que tenés que correr.

### Qué se puede editar

| Sección | Qué cambia en el sitio del cliente |
|---|---|
| Pedidos | El historial, el estado y el total que ve cada cliente |
| Envíos | Transportista, guía, ruta, temperatura y fechas |
| Movimientos | El tracking paso a paso. Al agregar uno, el estado del envío se actualiza solo |
| Catálogo | Las especies del sitio público y las opciones al armar un pedido |
| Trabajo social | La regla "cada N mariposas = X unidades" y la bitácora ejecutada |
| Textos del sitio | Titular, párrafo, las tres cifras del encabezado, contacto y condiciones de envío |

Cambiar la regla de un proyecto recalcula el impacto de **todos** los clientes al instante, sin
tocar código.

### La llave de servicio

`/admin` no funciona sin `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`. Está en Supabase →
Project Settings → API, abajo del todo. **Nunca la pongas en una variable que empiece con
`NEXT_PUBLIC_`** ni la subas a git: salta todas las reglas de seguridad.

## Las fotografías

Las fotos vienen de **Wikimedia Commons**, bajo licencias Creative Commons y libres.
Las baja este script, que también guarda autor y licencia de cada una:

```bash
node scripts/bajar-fotos.mjs
```

Escribe `public/fotos/*.jpg` y `lib/fotos.ts`. Para cambiar cuál foto usa cada especie,
editá el arreglo `OBJETIVOS` del script: cada entrada acepta una `busqueda` o, si el
buscador de Commons no devuelve algo usable, un `archivo` con el nombre exacto del archivo
en Commons.

**Importante sobre la licencia:** CC BY y CC BY-SA **obligan a atribuir al autor**. Por eso
existe la página `/creditos`, enlazada desde el pie. CC BY-SA además es "viral" para obras
derivadas. Si la empresa consigue fotos propias, reemplazá los archivos de `public/fotos/`
y el problema desaparece. **Antes de usar esto comercialmente, revisá licencia por licencia**
en `/creditos`.

La relación entre especie y foto está en `lib/especies-foto.ts`, y usa el nombre científico
como llave porque es lo único que no cambia de país a país.

## Cómo cambiar cosas

**Las reglas de impacto** (el corazón del dashboard) viven en la tabla `reglas_impacto`:
"cada N mariposas vendidas = X unidades". Cambiás un número ahí y todo el sitio se recalcula
solo, sin tocar código. Por ejemplo, para que cada mariposa valga 5 semillas en vez de 3:

```sql
update reglas_impacto set unidades_por_bloque = 5
where proyecto_id = (select id from proyectos_sociales where slug = 'semillas-manzano');
```

**Los proyectos sociales** (nombre, emoji, unidad, meta anual) están en `proyectos_sociales`.

**El impacto ya ejecutado** que sale en `/impacto` está en `impacto_registros`. Cada fila es una
entrega documentada, con fecha y detalle.

**El nombre y los datos de contacto** de la empresa están en `lib/config.ts`, en el objeto `marca`.

**Los colores y las tipografías** están en `app/globals.css`, en el bloque `@theme`.

---

## Estructura

```
app/
  page.tsx              landing
  especies/             catálogo público
  impacto/              dashboard público de impacto
  entrar/               login + registro (server actions en acciones.ts)
  panel/                panel del cliente (protegido)
components/             UI compartida (Foto, SiteHeader, SiteFooter, ui)
lib/
  config.ts             credenciales, modo demo, datos de la marca
  datos.ts              todas las consultas a Supabase (con fallback a demo)
  impacto.ts            el cálculo mariposas -> unidades de impacto
  demo.ts               datos de ejemplo
  tipos.ts              tipos de TypeScript
  formato.ts            moneda, fechas, etiquetas y colores de estados
proxy.ts                refresca la sesión y protege /panel
  fotos.ts              generado: autor y licencia de cada foto
  especies-foto.ts      qué foto le toca a cada especie
public/fotos/           las fotos descargadas
scripts/bajar-fotos.mjs descarga las fotos desde Wikimedia Commons
supabase/migraciones/   los 3 archivos SQL
```

---

## Seguridad

RLS está activo en todas las tablas:

- **Público:** especies, proyectos sociales, reglas e impacto ejecutado.
- **Privado:** cada cliente ve **solo sus** pedidos, items, envíos y eventos.
- **Escritura:** ninguna política de `insert`/`update` para clientes. Los pedidos se crean desde
  el panel de Supabase o con la `service_role` key desde el servidor. Para un demo esto es lo
  más seguro: nadie puede inventarse un pedido desde el navegador.

Nunca pongas `SUPABASE_SERVICE_ROLE_KEY` en una variable que empiece con `NEXT_PUBLIC_`.

---

## Lo que este demo NO trae

Para que no haya sorpresas, esto quedó fuera a propósito (es un demo, no la tienda completa):

- **No hay carrito ni checkout.** No se pueden crear pedidos desde el sitio; se cargan por SQL.
- **No hay panel de administración.** Para cambiar estados de pedidos o agregar eventos de
  tracking se usa el editor de tablas de Supabase.
- **No hay pasarela de pago** ni facturación.
- **Las fotos no son propias.** Son de Wikimedia Commons con atribución obligatoria (ver
  `/creditos`). Para uso comercial conviene reemplazarlas por fotos propias.

Cualquiera de esos cuatro se puede agregar después sobre esta misma base.

---

## Subirlo a internet (Vercel)

```bash
cd ~/mariposas
git init && git add -A && git commit -m "Sitio de mariposas"
```

Subí el repo a GitHub, importalo en Vercel y en **Settings → Environment Variables** pegá
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Vercel detecta Next.js solo.
