# Bill Splitting App

App web de código abierto para **repartir gastos** entre amigos, viajes y pisos compartidos. Crea un grupo, apunta quién pagó qué y ve al instante quién debe a quién. Invitación por enlace o QR.

- Demo: [bill-splitting-app.pericodes.com](https://bill-splitting-app.pericodes.com)
- Repositorio: [github.com/pericodes/bill-splitting-app](https://github.com/pericodes/bill-splitting-app)

**Idioma:** [Español](quickstart_es.md) · [English](quickstart_en.md)

Si no programas a diario, sigue **solo** la [puesta en marcha](#puesta-en-marcha). Al terminar tendrás tu propia copia en internet. La [configuración avanzada](#configuración-avanzada) es para desarrollo local, Netlify, migraciones y ajustes extra.

---

## Puesta en marcha

Tres cuentas gratuitas y unos clics. No hace falta instalar Node ni abrir una terminal.

### Qué necesitas

1. Una cuenta en [GitHub](https://github.com/signup) (para copiar el código).
2. Una cuenta en [Neon](https://neon.tech) (base de datos y login de usuarios).
3. Una cuenta en [Vercel](https://vercel.com/signup) (el servidor donde vive la app).

Enlaza GitHub con Vercel cuando te lo pida: así Vercel puede leer tu fork.

### 1. Haz un fork del repositorio

1. Abre [github.com/pericodes/bill-splitting-app](https://github.com/pericodes/bill-splitting-app).
2. Pulsa **Fork** (arriba a la derecha) y confirma.
3. Quédate en **tu** copia: la URL será `https://github.com/TU_USUARIO/bill-splitting-app`.

### 2. Crea el proyecto en Neon y activa Data API y Auth

1. Entra en [console.neon.tech](https://console.neon.tech) y crea un proyecto de Postgres (elige la región más cercana).
2. En el menú del proyecto, abre **Data API** y actívala. Si te pregunta por autenticación, elige **Managed Better Auth** (o Neon Auth): así se activan Data API y Auth a la vez.
3. Si Auth no se activó solo, ábrela en el menú (**Auth**) y actívala.
4. Activa **tokens anónimos** / acceso anónimo si aparece la opción: la app los usa para que se pueda entrar como invitado.
5. Copia y guarda estas dos URLs (las pegarás en Vercel):

| Qué | Dónde está en Neon | Cómo se reconoce |
| --- | --- | --- |
| Data API | Página **Data API** | Termina en `/rest/v1` |
| Auth | Página **Auth** | Termina en `/auth` |

Ejemplo (los valores reales serán distintos):

```
https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1
https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth
```

6. **Crea las tablas de la app** (Neon nace vacío; sin esto la web carga pero no podrás crear grupos). En Neon abre **SQL Editor** y ejecuta, **en este orden**, el contenido de estos archivos de tu fork (en GitHub: abre el archivo → **Raw** → copia todo → pega en el editor → **Run**):

   1. `prisma/migrations/20260826184000_init/migration.sql`
   2. `prisma/migrations/20260831194000_cascade_delete_transaction_entries_account/migration.sql`
   3. `prisma/sql/pg-features.sql`
   4. `prisma/sql/data-api-grants.sql` (Data API ya tiene que estar activa; si no, este paso no asigna permisos)

7. Vuelve a **Data API** y pulsa **Refresh schema cache** (o equivalente) para que la API vea las tablas nuevas.

Si prefieres una sola orden desde tu ordenador en lugar de pegar SQL, usa [Aplicar el esquema con Prisma](#aplicar-el-esquema-con-prisma).

### 3. Importa el repo en Vercel y pega las URLs

1. Entra en [vercel.com/new](https://vercel.com/new).
2. Elige **Import Git Repository** y selecciona **tu fork** (`TU_USUARIO/bill-splitting-app`).
3. Antes de desplegar, abre **Environment Variables** y añade exactamente estas dos (Production; Preview también si quieres que las previews funcionen):

| Nombre | Valor |
| --- | --- |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | La URL de Data API (termina en `/rest/v1`) |
| `NEXT_PUBLIC_NEON_AUTH_URL` | La URL de Auth (termina en `/auth`) |

4. Pulsa **Deploy**. Espera a que termine (un par de minutos).
5. Abre el proyecto en Vercel y copia la URL de producción, del estilo `https://tu-app.vercel.app` (pestaña **Domains** o el enlace del último deploy).

Si el primer deploy se lanzó **antes** de guardar las variables, vuelve a desplegar (**Deployments** → ⋮ → **Redeploy**) para que las recoja.

### 4. Añade el dominio de Vercel a los dominios de confianza de Neon

**Imprescindible.** Sin esto, registro e inicio de sesión fallan (origen no permitido / redirect no autorizado), tanto en `*.vercel.app` como en un dominio propio.

1. En Neon: **Auth → Domains → Your trusted domains** (en algunas consolas: **Auth → Configuration → Domains**).
2. Añade la URL de Vercel **con `https://` y sin barra al final**:

   ```
   https://tu-app.vercel.app
   ```

3. Si más adelante usas un dominio o subdominio propio, **añádelo también** (paso siguiente). `www` y sin `www` son orígenes distintos: incluye los que vayan a usar las personas.

[Documentación de Neon: trusted domains](https://neon.com/docs/auth/guides/configure-domains)

### 5. (Opcional) Tu propio dominio o subdominio

1. En Vercel: proyecto → **Settings → Domains** → añade `gastos.tudominio.com` (o el que quieras) y sigue las instrucciones de DNS.
2. Cuando el dominio esté activo, en Neon **Auth → Domains → Your trusted domains** añade exactamente:

   ```
   https://gastos.tudominio.com
   ```

   Mismo formato: `https://`, sin barra final. Deja también el `*.vercel.app` si sigues usándolo.

### Comprueba que funciona

Abre la URL de Vercel (o la tuya). Entra como invitado o con email, crea un grupo y un gasto. Si el login falla, revisa el [paso 4](#4-añade-el-dominio-de-vercel-a-los-dominios-de-confianza-de-neon). Si no puedes crear grupos, revisa las tablas y **Refresh schema cache** del [paso 2](#2-crea-el-proyecto-en-neon-y-activa-data-api-y-auth).

---

## Configuración avanzada

Para desarrollar en local, desplegar en Netlify, o entender el resto de variables y el esquema.

### Variables de entorno

Copia `.env.example` a `.env` en la raíz del repo.

| Variable | ¿Dónde hace falta? | Para qué |
| --- | --- | --- |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | Vercel / local | Data API (producción y cliente) |
| `NEXT_PUBLIC_NEON_AUTH_URL` | Vercel / local | Neon Auth |
| `APP_URL` | Opcional | URL pública del despliegue (callbacks / enlaces). No es obligatoria para el setup mínimo. |
| `DEV_DATABASE_URL` | Solo tu máquina | Cadena **directa** de Postgres (host **sin** `-pooler`) para migrar el esquema. **No** la pongas en Vercel. |
| `VITE_NEON_DATA_API_URL` / `VITE_NEON_AUTH_URL` | Opcional | Respaldo si copiaste nombres desde la consola de Neon; la app usa primero las `NEXT_PUBLIC_*`. |

En producción la app **no** abre una conexión TCP a Postgres: habla con la Data API. Prisma y `DEV_DATABASE_URL` solo sirven para aplicar el esquema desde tu ordenador.

### Aplicar el esquema con Prisma

Activa Data API en Neon **antes**. En `.env`, `DEV_DATABASE_URL` debe ser la conexión **directa** (Dashboard de Neon → Connection string → desactiva *Pooled connection*). `NODE_ENV` no debe ser `production`.

```bash
pnpm install
pnpm db:dev:setup
```

Eso aplica migraciones Prisma, columnas generadas / CHECKs (`prisma/sql/pg-features.sql`) y `GRANT` para los roles `anonymous` y `authenticated` (`prisma/sql/data-api-grants.sql`). Después, en Neon **Data API → Refresh schema cache**.

Otros scripts: `pnpm db:dev:migrate`, `pnpm db:dev:features`, `pnpm db:dev:grants`, `pnpm db:dev:studio`. No uses `prisma db push`: puede romper CHECKs y políticas.

Si ya pegaste el SQL a mano en el editor de Neon, no vuelvas a ejecutar `pnpm db:dev:setup` sobre esa misma base sin saber qué hay aplicado: Prisma intentará reaplicar migraciones.

### Desarrollo local

Requisitos: [Node.js 20+](https://nodejs.org/) y [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`).

```bash
git clone https://github.com/TU_USUARIO/bill-splitting-app.git
cd bill-splitting-app
pnpm install
```

Crea `.env` (en PowerShell: `Copy-Item .env.example .env`), rellena las URLs de Neon y `DEV_DATABASE_URL`, aplica el esquema y arranca:

```bash
pnpm db:dev:setup
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000). `localhost` ya está permitido en Neon Auth; no hace falta añadirlo a trusted domains.

### Desplegar con la CLI de Vercel

Con el repo clonado y las mismas variables que en el setup básico:

```bash
npx vercel login
npx vercel
npx vercel env add NEXT_PUBLIC_NEON_AUTH_URL production
npx vercel env add NEXT_PUBLIC_NEON_DATA_API_URL production
npx vercel --prod
```

Añade `https://tu-app.vercel.app` en **Auth → Domains → Your trusted domains**.

### Desplegar en Netlify

Netlify detecta Next.js (App Router). Build: `pnpm build`; no publiques a mano la carpeta `.next`.

```bash
npx netlify-cli login
npx netlify init
npx netlify env:set NEXT_PUBLIC_NEON_AUTH_URL "https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth"
npx netlify env:set NEXT_PUBLIC_NEON_DATA_API_URL "https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1"
npx netlify deploy --build --prod
```

Añade `https://tu-sitio.netlify.app` (y tu dominio propio, si lo usas) en **Auth → Domains → Your trusted domains**.

### Previews de Vercel

Cada preview tiene un host distinto. Puedes añadir un patrón comodín en trusted domains, por ejemplo `https://*.vercel.app`, o el de tu proyecto. Ver [Configure trusted domains](https://neon.com/docs/auth/guides/configure-domains).

### Stack

Next.js 15 (App Router), TypeScript, Neon Postgres, Neon Data API y Neon Auth. En producción no hay backend propio ni conexión directa a la base.

### Cómo colaborar

1. Fork en GitHub.
2. Clona tu fork y añade el remoto original:

   ```bash
   git clone https://github.com/TU_USUARIO/bill-splitting-app.git
   cd bill-splitting-app
   git remote add upstream https://github.com/pericodes/bill-splitting-app.git
   ```

3. Rama, cambios y pull request hacia `main`. Si el cambio es grande, abre antes un issue.

```bash
git checkout -b feat/mi-cambio
git push -u origin feat/mi-cambio
```

### Problemas frecuentes

| Síntoma | Qué revisar |
| --- | --- |
| Login / registro: origen inválido o redirect no autorizado | El dominio exacto (con `https://`, sin `/` final) está en **Auth → Domains → Your trusted domains**. Si usas dominio propio, ese también. |
| La web carga pero no se pueden crear grupos | Tablas aplicadas y **Refresh schema cache** en Data API. `data-api-grants.sql` después de activar Data API. |
| Variables “no las coge” en Vercel | Nombres `NEXT_PUBLIC_*` exactos y **Redeploy** después de guardarlas. |
| Prisma se niega a correr | `DEV_DATABASE_URL` definida, conexión **directa** (sin `-pooler`), y no estés en `NODE_ENV=production`. |

### Recursos

- [Neon](https://neon.com/docs)
- [Neon Auth](https://neon.com/docs/neon-auth)
- [Trusted domains](https://neon.com/docs/auth/guides/configure-domains)
- [Neon Data API](https://neon.com/docs/data-api/get-started)
- [Vercel](https://vercel.com/docs)
