export type LandingLocale = "es" | "en";

export type FeatureIconKey =
  | "wallet"
  | "split"
  | "balance"
  | "link"
  | "users"
  | "user"
  | "globe"
  | "code";

export type LandingContent = {
  locale: LandingLocale;
  htmlLang: string;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    ogLocale: string;
  };
  nav: {
    skip: string;
    features: string;
    openSource: string;
    deploy: string;
    useApp: string;
    github: string;
    languageName: string;
    languageOther: string;
    languageOtherHref: string;
  };
  hero: {
    badge: string;
    title: string;
    lead: string;
    ctaApp: string;
    ctaGithub: string;
    note: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: { icon: FeatureIconKey; title: string; body: string }[];
  };
  how: {
    title: string;
    subtitle: string;
    steps: { n: string; title: string; body: string }[];
  };
  openSource: {
    title: string;
    body: string;
    repoLabel: string;
    contributeTitle: string;
    contributeBody: string;
    contributeSteps: { title: string; command?: string; body?: string }[];
  };
  requirements: {
    title: string;
    subtitle: string;
    items: { title: string; body: string }[];
  };
  deploy: {
    title: string;
    subtitle: string;
    copy: string;
    copied: string;
    neonTitle: string;
    neonIntro: string;
    neonSteps: string[];
    envTitle: string;
    envIntro: string;
    envFile: string;
    cloneTitle: string;
    cloneIntro: string;
    cloneCommands: { label: string; command: string }[];
    schemaTitle: string;
    schemaIntro: string;
    schemaCommand: string;
    localTitle: string;
    localIntro: string;
    localCommand: string;
    afterTitle: string;
    afterBody: string;
    vercelTitle: string;
    vercelIntro: string;
    vercelSteps: { title: string; command?: string; body?: string }[];
    netlifyTitle: string;
    netlifyIntro: string;
    netlifySteps: { title: string; command?: string; body?: string }[];
  };
  faq: {
    title: string;
    items: { q: string; a: string }[];
  };
  footer: {
    credit: string;
    pericodes: string;
    github: string;
    useApp: string;
  };
};

const envFileEs = `# URL pública de tu despliegue (Vercel, Netlify o local)
APP_URL="https://tu-dominio.vercel.app"

# Neon Data API (consola de Neon → Data API)
NEXT_PUBLIC_NEON_DATA_API_URL="https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1"

# Neon Auth (consola de Neon → Auth)
NEXT_PUBLIC_NEON_AUTH_URL="https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth"

# Solo en tu máquina, para migrar el esquema. Cadena DIRECTA (sin -pooler).
# No hace falta en Vercel/Netlify: en producción la app usa Data API.
DEV_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"`;

const envFileEn = `# Public URL of your deploy (Vercel, Netlify, or local)
APP_URL="https://your-domain.vercel.app"

# Neon Data API (Neon console → Data API)
NEXT_PUBLIC_NEON_DATA_API_URL="https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1"

# Neon Auth (Neon console → Auth)
NEXT_PUBLIC_NEON_AUTH_URL="https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth"

# Local machine only, to apply the schema. DIRECT connection string (no -pooler).
# Not needed on Vercel/Netlify: production talks to Data API.
DEV_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"`;

export const es: LandingContent = {
  locale: "es",
  htmlLang: "es",
  seo: {
    title: "Bill Splitting App: divide gastos compartidos | código abierto",
    description:
      "App web de código abierto para repartir gastos entre amigos, viajes y pisos. Invita con un enlace, salda deudas y despliégala tú mismo en Vercel o Netlify.",
    keywords: [
      "dividir gastos",
      "gastos compartidos",
      "split bills",
      "app código abierto",
      "repartir cuenta",
      "saldos entre amigos",
      "desplegar en Vercel",
      "desplegar en Netlify",
    ],
    ogLocale: "es_ES",
  },
  nav: {
    skip: "Saltar al contenido",
    features: "Funciones",
    openSource: "Código abierto",
    deploy: "Desplegar",
    useApp: "Usar la app",
    github: "GitHub",
    languageName: "ES",
    languageOther: "EN",
    languageOtherHref: "/en",
  },
  hero: {
    badge: "Código abierto · MIT-friendly · GitHub",
    title: "Divide gastos entre amigos, sin hojas de cálculo",
    lead: "Bill Splitting App es un proyecto open source de Pericodes para crear grupos, apuntar quién pagó qué y ver al instante quién debe a quién. Úsala aquí o clónala y despliégala en tu propia cuenta de Vercel o Netlify.",
    ctaApp: "Usar la app",
    ctaGithub: "Ver el repositorio",
    note: "Gratis para usar, auditar y contribuir. Sin cuentas de pago ni tiendas de apps.",
  },
  features: {
    title: "Qué puedes hacer",
    subtitle: "Pensada para viajes, pisos compartidos, cenas y cualquier grupo que quiera saldar cuentas sin fricción.",
    items: [
      {
        icon: "wallet",
        title: "Cuentas compartidas",
        body: "Crea un grupo con nombre, icono y moneda (EUR, USD o GBP). Cada cuenta tiene su propio historial de gastos y participantes.",
      },
      {
        icon: "split",
        title: "Gastos flexibles",
        body: "Un pagador o varios. Partes iguales o importes a medida. La app comprueba que lo pagado y lo asignado cuadren con el total.",
      },
      {
        icon: "balance",
        title: "Saldos automáticos",
        body: "Ves quién debe a quién y cómo saldar con el menor número de transferencias. Los balances se recalculan al añadir o borrar un gasto.",
      },
      {
        icon: "link",
        title: "Invitar con enlace o QR",
        body: "Comparte un enlace de invitación o un código QR. Quien lo abra entra al grupo sin que tengas que añadir su email a mano.",
      },
      {
        icon: "users",
        title: "Participantes provisionales",
        body: "Añade a alguien solo con el nombre para incluirlo en un gasto. Más tarde puede unirse con el enlace y ocupar su sitio.",
      },
      {
        icon: "user",
        title: "Invitado o cuenta registrada",
        body: "Entra con un nombre (perfil local) o regístrate con email. Si te registras después, conservas los grupos de este navegador.",
      },
      {
        icon: "globe",
        title: "Español e inglés",
        body: "La interfaz está en los dos idiomas. Eliges el idioma en Perfil; esta landing también tiene versión en inglés.",
      },
      {
        icon: "code",
        title: "Tú tienes el código",
        body: "Next.js, TypeScript, Neon Postgres y Auth. Sin backend opaco: puedes leer, auditar y desplegar el mismo código que usamos.",
      },
    ],
  },
  how: {
    title: "Cómo funciona",
    subtitle: "Tres pasos. Sin instalar nada si usas esta instancia.",
    steps: [
      {
        n: "1",
        title: "Crea un grupo",
        body: "Entra como invitado o con cuenta. Crea una cuenta compartida (viaje, piso, cena) y añade participantes.",
      },
      {
        n: "2",
        title: "Apunta los gastos",
        body: "Quién pagó, cuánto, y cómo se reparte. Puedes editar o borrar un gasto si te equivocas.",
      },
      {
        n: "3",
        title: "Saldad cuentas",
        body: "La vista de saldos te dice quién transfiere a quién. Cuando esté a cero, el grupo está saldado.",
      },
    ],
  },
  openSource: {
    title: "Open source: úsala, clónala, mejórala",
    body: "El código vive en GitHub. Issues, pull requests y forks son bienvenidos: traducciones, bugs, diseño o nuevas formas de repartir. El proyecto es de Pericodes y se publica para que cualquiera pueda autoalojarlo.",
    repoLabel: "github.com/pericodes/bill-splitting-app",
    contributeTitle: "Cómo colaborar",
    contributeBody: "Haz fork, crea una rama, abre un pull request hacia main. Si es un cambio grande, abre antes un issue.",
    contributeSteps: [
      {
        title: "Haz fork en GitHub",
        body: "Usa el botón Fork en la página del repositorio para copiarlo a tu cuenta.",
      },
      {
        title: "Clona tu fork",
        command: "git clone https://github.com/TU_USUARIO/bill-splitting-app.git\ncd bill-splitting-app\ngit remote add upstream https://github.com/pericodes/bill-splitting-app.git",
      },
      {
        title: "Crea una rama y un pull request",
        command: "git checkout -b feat/mi-cambio\ngit push -u origin feat/mi-cambio",
      },
    ],
  },
  requirements: {
    title: "Requisitos para desplegarla tú",
    subtitle: "Cuentas gratuitas bastan para una instancia personal o de un grupo pequeño.",
    items: [
      {
        title: "Node.js 20 o superior",
        body: "Next.js 15 necesita Node 18.18+, recomendamos la LTS 20. Comprueba con node -v.",
      },
      {
        title: "Git y pnpm",
        body: "El repo usa pnpm-lock.yaml. Instala pnpm con npm install -g pnpm si no lo tienes.",
      },
      {
        title: "Proyecto en Neon",
        body: "Postgres serverless, Data API y Neon Auth. La app no se conecta a Postgres en producción: habla con la Data API.",
      },
      {
        title: "Vercel o Netlify",
        body: "Cualquiera de los dos sirve un proyecto Next.js (App Router). Vercel es el encaje más directo.",
      },
    ],
  },
  deploy: {
    title: "Despliegue paso a paso",
    subtitle: "Primero el esquema en Neon desde tu máquina; después el frontend en Vercel o Netlify. Cada bloque se puede copiar.",
    copy: "Copiar",
    copied: "Copiado",
    neonTitle: "1. Crea el proyecto en Neon",
    neonIntro: "Esto se hace en el navegador, en la consola de Neon (neon.tech). No hay CLI obligatoria.",
    neonSteps: [
      "Crea una cuenta y un proyecto de Postgres (la región más cercana a tus usuarios).",
      "En el proyecto, activa Data API y copia la URL (termina en /rest/v1).",
      "Activa Neon Auth y copia la URL (termina en /auth). Habilita tokens anónimos: la app los usa para la Data API.",
      "Copia la cadena de conexión DIRECTA (host sin -pooler). La usarás solo en local como DEV_DATABASE_URL.",
      "Cuando tengas la URL de Vercel o Netlify, añádela en Neon Auth como origen permitido (si no, el login devolverá Invalid Origin).",
    ],
    envTitle: "2. Variables de entorno",
    envIntro: "Copia .env.example a .env y rellena los valores de Neon. En Vercel/Netlify configurarás las mismas claves NEXT_PUBLIC_* y APP_URL (DEV_DATABASE_URL no hace falta en el hosting).",
    envFile: envFileEs,
    cloneTitle: "3. Clona e instala",
    cloneIntro: "En una terminal, en la carpeta donde quieras el código:",
    cloneCommands: [
      { label: "Clonar el repositorio", command: "git clone https://github.com/pericodes/bill-splitting-app.git" },
      { label: "Entrar en el proyecto", command: "cd bill-splitting-app" },
      { label: "Instalar pnpm si no lo tienes", command: "npm install -g pnpm" },
      { label: "Instalar dependencias", command: "pnpm install" },
      { label: "Crear el fichero de entorno", command: "cp .env.example .env\n# Windows PowerShell:\nCopy-Item .env.example .env" },
    ],
    schemaTitle: "4. Crear tablas y permisos",
    schemaIntro:
      "Desde tu ordenador, con DEV_DATABASE_URL apuntando a Neon (NODE_ENV no debe ser production). Este script aplica migraciones Prisma, columnas generadas y GRANT para los roles anonymous y authenticated de la Data API. Activa Data API en Neon antes de ejecutarlo.",
    schemaCommand: "pnpm db:dev:setup",
    localTitle: "5. Probar en local (opcional)",
    localIntro: "Con el .env relleno, arranca el servidor de desarrollo y abre http://localhost:3000",
    localCommand: "pnpm dev",
    afterTitle: "Después del deploy",
    afterBody:
      "Copia la URL HTTPS que te den Vercel o Netlify. Ponla en APP_URL, vuelve a desplegar si hace falta, y añádela en Neon Auth → orígenes permitidos. Sin ese origen, registro e inicio de sesión fallan.",
    vercelTitle: "Desplegar en Vercel (CLI)",
    vercelIntro: "Con la cuenta de Vercel y el proyecto ya clonado. También puedes importar el repo en vercel.com/new; aquí van los comandos.",
    vercelSteps: [
      { title: "Inicia sesión en Vercel", command: "npx vercel login" },
      {
        title: "Enlaza el proyecto (desde la raíz del repo)",
        command: "npx vercel",
        body: "Acepta los valores por defecto: framework Next.js, directorio raíz, build pnpm build. Te dará una URL de preview.",
      },
      {
        title: "Añade las variables de producción",
        command:
          "npx vercel env add NEXT_PUBLIC_NEON_AUTH_URL production\nnpx vercel env add NEXT_PUBLIC_NEON_DATA_API_URL production\nnpx vercel env add APP_URL production",
        body: "Pega las URLs de Neon. En APP_URL usa la URL definitiva (por ejemplo https://tu-app.vercel.app).",
      },
      {
        title: "Despliega a producción",
        command: "npx vercel --prod",
      },
      {
        title: "Autoriza el origen en Neon",
        body: "En la consola de Neon Auth, añade https://tu-app.vercel.app (sin barra final si la consola lo pide así). Vuelve a generar un deploy si cambiaste APP_URL.",
      },
    ],
    netlifyTitle: "Desplegar en Netlify (CLI)",
    netlifyIntro: "Netlify detecta Next.js (App Router). El comando de build es pnpm build; no publiques a mano la carpeta .next.",
    netlifySteps: [
      { title: "Inicia sesión en Netlify", command: "npx netlify-cli login" },
      {
        title: "Inicializa el sitio en este repo",
        command: "npx netlify init",
        body: "Elige crear un sitio nuevo, el equipo, y build command: pnpm build. Deja que Netlify use el runtime de Next.js.",
      },
      {
        title: "Variables de entorno",
        command:
          "npx netlify env:set NEXT_PUBLIC_NEON_AUTH_URL \"https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth\"\nnpx netlify env:set NEXT_PUBLIC_NEON_DATA_API_URL \"https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1\"\nnpx netlify env:set APP_URL \"https://tu-sitio.netlify.app\"",
      },
      {
        title: "Despliegue de producción",
        command: "npx netlify deploy --build --prod",
      },
      {
        title: "Autoriza el origen en Neon",
        body: "Añade https://tu-sitio.netlify.app en Neon Auth como origen permitido, igual que en Vercel.",
      },
    ],
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        q: "¿Es de código abierto?",
        a: "Sí. El repositorio público es https://github.com/pericodes/bill-splitting-app. Puedes clonar, hacer fork y abrir pull requests.",
      },
      {
        q: "¿Hace falta registrarse para usarla?",
        a: "No. Puedes entrar como invitado con un nombre. El perfil queda en ese navegador. Si más tarde te registras, se conservan los grupos.",
      },
      {
        q: "¿Qué servicios necesito para autoalojarla?",
        a: "Un proyecto Neon (Postgres + Data API + Auth) y un hosting compatible con Next.js: Vercel o Netlify. Las cuentas gratuitas cubren un uso personal.",
      },
      {
        q: "¿Por qué Prisma solo en desarrollo?",
        a: "En producción la app no abre una conexión TCP a Postgres: usa la Data API de Neon. Prisma y DEV_DATABASE_URL sirven para aplicar el esquema desde tu máquina.",
      },
      {
        q: "¿Vercel o Netlify?",
        a: "Los dos valen. Vercel es el entorno nativo de Next.js y suele ser el camino más corto. Netlify funciona con su runtime de Next.js y los mismos env.",
      },
    ],
  },
  footer: {
    credit: "Un proyecto de código abierto de",
    pericodes: "Pericodes",
    github: "GitHub",
    useApp: "Usar la app",
  },
};

export const en: LandingContent = {
  locale: "en",
  htmlLang: "en",
  seo: {
    title: "Bill Splitting App: split shared expenses | open source",
    description:
      "Open-source web app to split bills with friends, trips, and housemates. Invite with a link, settle balances, and deploy it yourself on Vercel or Netlify.",
    keywords: [
      "split bills",
      "shared expenses",
      "bill splitting app",
      "open source",
      "settle up",
      "group expenses",
      "deploy on Vercel",
      "deploy on Netlify",
    ],
    ogLocale: "en_US",
  },
  nav: {
    skip: "Skip to content",
    features: "Features",
    openSource: "Open source",
    deploy: "Deploy",
    useApp: "Open the app",
    github: "GitHub",
    languageName: "EN",
    languageOther: "ES",
    languageOtherHref: "/",
  },
  hero: {
    badge: "Open source · GitHub · Self-host",
    title: "Split expenses with friends, without a spreadsheet",
    lead: "Bill Splitting App is an open-source Pericodes project for shared groups: log who paid what and see who owes whom. Use this instance, or clone it and deploy it on your own Vercel or Netlify account.",
    ctaApp: "Open the app",
    ctaGithub: "View the repository",
    note: "Free to use, audit, and contribute. No paid plan and no app stores.",
  },
  features: {
    title: "What it does",
    subtitle: "Built for trips, shared flats, dinners, and any group that wants to settle up without friction.",
    items: [
      {
        icon: "wallet",
        title: "Shared accounts",
        body: "Create a group with a name, icon, and currency (EUR, USD, or GBP). Each account has its own expense history and members.",
      },
      {
        icon: "split",
        title: "Flexible expenses",
        body: "One payer or several. Equal shares or custom amounts. The app checks that paid and assigned amounts match the total.",
      },
      {
        icon: "balance",
        title: "Automatic balances",
        body: "See who owes whom and how to settle with as few transfers as possible. Balances update when you add or delete an expense.",
      },
      {
        icon: "link",
        title: "Invite with a link or QR",
        body: "Share an invite link or QR code. Anyone who opens it can join the group without you collecting emails by hand.",
      },
      {
        icon: "users",
        title: "Placeholder participants",
        body: "Add someone by name so they can be included in an expense. They can join later with the invite link.",
      },
      {
        icon: "user",
        title: "Guest or registered account",
        body: "Start with a display name (local profile) or sign up with email. If you register later, you keep the groups from this browser.",
      },
      {
        icon: "globe",
        title: "English and Spanish",
        body: "The UI ships in both languages. Pick one in Profile; this landing page also has a Spanish version.",
      },
      {
        icon: "code",
        title: "You own the code",
        body: "Next.js, TypeScript, Neon Postgres, and Auth. No opaque backend: you can read, audit, and deploy the same code we run.",
      },
    ],
  },
  how: {
    title: "How it works",
    subtitle: "Three steps. Nothing to install if you use this instance.",
    steps: [
      {
        n: "1",
        title: "Create a group",
        body: "Continue as a guest or with an account. Create a shared account (trip, flat, dinner) and add participants.",
      },
      {
        n: "2",
        title: "Log expenses",
        body: "Who paid, how much, and how it splits. You can edit or delete an expense if you make a mistake.",
      },
      {
        n: "3",
        title: "Settle up",
        body: "The balances view tells you who should transfer to whom. When everyone is at zero, the group is settled.",
      },
    ],
  },
  openSource: {
    title: "Open source: use it, clone it, improve it",
    body: "The code lives on GitHub. Issues, pull requests, and forks are welcome: translations, bugs, design, or new split modes. It is a Pericodes project, published so anyone can self-host it.",
    repoLabel: "github.com/pericodes/bill-splitting-app",
    contributeTitle: "How to contribute",
    contributeBody: "Fork the repo, create a branch, and open a pull request against main. For a large change, open an issue first.",
    contributeSteps: [
      {
        title: "Fork on GitHub",
        body: "Use the Fork button on the repository page to copy it to your account.",
      },
      {
        title: "Clone your fork",
        command: "git clone https://github.com/YOUR_USER/bill-splitting-app.git\ncd bill-splitting-app\ngit remote add upstream https://github.com/pericodes/bill-splitting-app.git",
      },
      {
        title: "Branch and open a pull request",
        command: "git checkout -b feat/my-change\ngit push -u origin feat/my-change",
      },
    ],
  },
  requirements: {
    title: "What you need to deploy it",
    subtitle: "Free-tier accounts are enough for a personal instance or a small group.",
    items: [
      {
        title: "Node.js 20 or newer",
        body: "Next.js 15 needs Node 18.18+; we recommend the 20 LTS. Check with node -v.",
      },
      {
        title: "Git and pnpm",
        body: "The repo ships a pnpm-lock.yaml. Install pnpm with npm install -g pnpm if needed.",
      },
      {
        title: "A Neon project",
        body: "Serverless Postgres, Data API, and Neon Auth. In production the app does not open a Postgres TCP connection; it talks to the Data API.",
      },
      {
        title: "Vercel or Netlify",
        body: "Either host can run a Next.js App Router project. Vercel is the most direct fit.",
      },
    ],
  },
  deploy: {
    title: "Deploy, command by command",
    subtitle: "Apply the schema on Neon from your machine first, then ship the frontend to Vercel or Netlify. Every block is copyable.",
    copy: "Copy",
    copied: "Copied",
    neonTitle: "1. Create the Neon project",
    neonIntro: "This is done in the browser, in the Neon console (neon.tech). No CLI is required for this step.",
    neonSteps: [
      "Create an account and a Postgres project (pick a region close to your users).",
      "In the project, enable Data API and copy the URL (it ends with /rest/v1).",
      "Enable Neon Auth and copy the URL (it ends with /auth). Turn on anonymous tokens: the app uses them for the Data API.",
      "Copy the DIRECT connection string (host without -pooler). You will use it only locally as DEV_DATABASE_URL.",
      "Once you have the Vercel or Netlify URL, add it in Neon Auth as an allowed origin (otherwise sign-in returns Invalid Origin).",
    ],
    envTitle: "2. Environment variables",
    envIntro: "Copy .env.example to .env and fill in the Neon values. On Vercel/Netlify you will set the same NEXT_PUBLIC_* keys and APP_URL (DEV_DATABASE_URL is not needed on the host).",
    envFile: envFileEn,
    cloneTitle: "3. Clone and install",
    cloneIntro: "In a terminal, in the folder where you want the code:",
    cloneCommands: [
      { label: "Clone the repository", command: "git clone https://github.com/pericodes/bill-splitting-app.git" },
      { label: "Enter the project", command: "cd bill-splitting-app" },
      { label: "Install pnpm if you do not have it", command: "npm install -g pnpm" },
      { label: "Install dependencies", command: "pnpm install" },
      { label: "Create the env file", command: "cp .env.example .env\n# Windows PowerShell:\nCopy-Item .env.example .env" },
    ],
    schemaTitle: "4. Create tables and grants",
    schemaIntro:
      "From your computer, with DEV_DATABASE_URL pointing at Neon (NODE_ENV must not be production). This script applies Prisma migrations, generated columns, and GRANTs for the Data API anonymous and authenticated roles. Enable Data API in Neon before running it.",
    schemaCommand: "pnpm db:dev:setup",
    localTitle: "5. Try it locally (optional)",
    localIntro: "With .env filled in, start the dev server and open http://localhost:3000",
    localCommand: "pnpm dev",
    afterTitle: "After you deploy",
    afterBody:
      "Copy the HTTPS URL Vercel or Netlify gives you. Put it in APP_URL, redeploy if needed, and add it in Neon Auth → allowed origins. Without that origin, sign-up and sign-in fail.",
    vercelTitle: "Deploy on Vercel (CLI)",
    vercelIntro: "With a Vercel account and the repo already cloned. You can also import the repo at vercel.com/new; here are the commands.",
    vercelSteps: [
      { title: "Log in to Vercel", command: "npx vercel login" },
      {
        title: "Link the project (from the repo root)",
        command: "npx vercel",
        body: "Accept the defaults: Next.js framework, project root, pnpm build. You will get a preview URL.",
      },
      {
        title: "Add production environment variables",
        command:
          "npx vercel env add NEXT_PUBLIC_NEON_AUTH_URL production\nnpx vercel env add NEXT_PUBLIC_NEON_DATA_API_URL production\nnpx vercel env add APP_URL production",
        body: "Paste the Neon URLs. For APP_URL use the final URL (for example https://your-app.vercel.app).",
      },
      {
        title: "Deploy to production",
        command: "npx vercel --prod",
      },
      {
        title: "Allow the origin in Neon",
        body: "In the Neon Auth console, add https://your-app.vercel.app. Redeploy if you changed APP_URL.",
      },
    ],
    netlifyTitle: "Deploy on Netlify (CLI)",
    netlifyIntro: "Netlify detects Next.js (App Router). The build command is pnpm build; do not publish the .next folder by hand.",
    netlifySteps: [
      { title: "Log in to Netlify", command: "npx netlify-cli login" },
      {
        title: "Initialize the site in this repo",
        command: "npx netlify init",
        body: "Create a new site, pick the team, and set build command: pnpm build. Let Netlify use the Next.js runtime.",
      },
      {
        title: "Environment variables",
        command:
          "npx netlify env:set NEXT_PUBLIC_NEON_AUTH_URL \"https://ep-xxxx.neonauth.region.aws.neon.tech/neondb/auth\"\nnpx netlify env:set NEXT_PUBLIC_NEON_DATA_API_URL \"https://ep-xxxx.apirest.region.aws.neon.tech/neondb/rest/v1\"\nnpx netlify env:set APP_URL \"https://your-site.netlify.app\"",
      },
      {
        title: "Production deploy",
        command: "npx netlify deploy --build --prod",
      },
      {
        title: "Allow the origin in Neon",
        body: "Add https://your-site.netlify.app in Neon Auth as an allowed origin, same as on Vercel.",
      },
    ],
  },
  faq: {
    title: "FAQ",
    items: [
      {
        q: "Is it open source?",
        a: "Yes. The public repository is https://github.com/pericodes/bill-splitting-app. You can clone it, fork it, and open pull requests.",
      },
      {
        q: "Do I need an account to use it?",
        a: "No. You can continue as a guest with a name. That profile stays in the browser. If you register later, you keep your groups.",
      },
      {
        q: "What do I need to self-host?",
        a: "A Neon project (Postgres + Data API + Auth) and a Next.js host: Vercel or Netlify. Free tiers cover personal use.",
      },
      {
        q: "Why is Prisma development-only?",
        a: "In production the app does not open a TCP connection to Postgres; it uses Neon Data API. Prisma and DEV_DATABASE_URL are for applying the schema from your machine.",
      },
      {
        q: "Vercel or Netlify?",
        a: "Both work. Vercel is the native Next.js environment and is usually the shortest path. Netlify works with its Next.js runtime and the same env vars.",
      },
    ],
  },
  footer: {
    credit: "An open source project by",
    pericodes: "Pericodes",
    github: "GitHub",
    useApp: "Open the app",
  },
};

export const landingByLocale: Record<LandingLocale, LandingContent> = { es, en };
