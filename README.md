# Página de Aterrizaje - Juan Mago González

Página web profesional para servicios de análisis de seguridad, auditorías de ciberseguridad y automatización con agentes de IA. Plataforma moderna construida con Next.js 16, TypeScript, Tailwind CSS y Prisma, con gestión integral de contactos y leads.

## Stack Tecnológico

- **Framework:** Next.js 16.2.10 (App Router)
- **Lenguaje:** TypeScript 5
- **Estilos:** Tailwind CSS 4 con PostCSS
- **Base de Datos:** Prisma 7.8 (SQLite en desarrollo, PostgreSQL en producción)
- **Validación:** Zod 4.4.3
- **Cliente HTTP:** Axios 1.18.1
- **Runtime:** Node.js 18+

## Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu máquina:

- **Node.js 18+** ([descargar aquí](https://nodejs.org/))
- **npm 8+** (incluido con Node.js)
- **git** ([descargar aquí](https://git-scm.com/))
- Editor de código (VS Code recomendado)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/interactiv3web.git
cd interactiv3web
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y actualiza las variables:

```bash
cp .env.example .env.local
```

Edita `.env.local` y asegúrate de que contenga:

```env
# Base de datos (SQLite para desarrollo local)
DATABASE_URL="file:./dev.db"

# Seguridad de API (genera una clave fuerte para producción)
API_KEY="tu-clave-secreta-aqui"

# Rate Limiting (milisegundos y número máximo de solicitudes)
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="5"

# URL del sitio
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 4. Ejecutar migraciones de base de datos

```bash
npx prisma migrate dev --name init
```

Esto crea la base de datos SQLite local (`dev.db`) y aplica el esquema.

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la página.

## Estructura del Proyecto

```
interactiv3web/
├── src/
│   ├── app/                    # Rutas y layout de Next.js
│   │   ├── api/               # Endpoints de API
│   │   │   └── contact/       # Rutas de contacto
│   │   │       ├── route.ts   # POST /api/contact
│   │   │       └── list/
│   │   │           └── route.ts # GET /api/contact/list
│   │   └── page.tsx           # Página principal
│   ├── components/            # Componentes React reutilizables
│   │   ├── sections/          # Secciones de la página
│   │   └── ui/                # Componentes UI básicos
│   ├── content/               # Configuración de contenido
│   │   └── config.ts          # SITE_CONFIG, HERO, SERVICES, DEMOS
│   ├── lib/                   # Utilidades y helpers
│   │   ├── db.ts             # Instancia de Prisma
│   │   ├── validators.ts     # Esquemas Zod
│   │   ├── api-utils.ts      # Funciones de API
│   │   └── rate-limit.ts     # Control de límite de solicitudes
│   └── types/                # Tipos TypeScript custom
├── prisma/
│   └── schema.prisma         # Esquema de base de datos
├── public/                    # Archivos estáticos
├── .env.example              # Variables de entorno ejemplo
├── .env.local                # Variables de entorno locales (NO commit)
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración TypeScript
├── tailwind.config.ts        # Configuración Tailwind CSS
├── next.config.ts            # Configuración Next.js
└── README.md                 # Este archivo

```

## Esquema de Base de Datos

### Modelo Contact

Tabla principal para almacenar solicitudes de contacto e información de leads:

```typescript
model Contact {
  id            String    @id @default(cuid())
  name          String    // Nombre del contacto
  email         String    // Email del contacto (indexado)
  company       String?   // Nombre de la empresa (opcional)
  serviceType   String    // Tipo de servicio solicitado:
                          // "vulnerability-analysis" | "audit" | "consulting" | "ai-agents"
  message       String    // Mensaje o descripción de la solicitud
  budgetRange   String?   // Rango presupuestario (opcional):
                          // "5k-10k" | "10k-25k" | "25k+"
  status        String    @default("new")
                          // Estado de la solicitud:
                          // "new" (nuevo) | "contacted" (contactado) | "closed" (cerrado)
  createdAt     DateTime  @default(now())  // Fecha de creación
  updatedAt     DateTime  @updatedAt       // Fecha de última actualización

  @@index([email])          // Índice para búsquedas por email
  @@index([status])         // Índice para filtrar por estado
  @@index([createdAt])      // Índice para ordenamiento temporal
}
```

## Gestionar Base de Datos con Prisma Studio

Prisma Studio es una interfaz visual para explorar y editar datos:

```bash
npx prisma studio
```

Se abrirá en [http://localhost:5555](http://localhost:5555) donde puedes:
- Ver todos los contactos
- Editar registros
- Crear nuevos contactos manualmente
- Eliminar registros
- Filtrar y buscar

## Documentación de Endpoints API

### POST /api/contact

Recibe nuevas solicitudes de contacto desde el formulario del sitio.

**URL:** `POST http://localhost:3000/api/contact`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Juan Pérez",
  "email": "juan@empresa.com",
  "company": "Tech Solutions Inc",
  "serviceType": "vulnerability-analysis",
  "message": "Nos gustaría hacer un análisis de seguridad de nuestra aplicación web.",
  "budgetRange": "10k-25k",
  "honeypot": ""
}
```

**Validaciones:**
- `name`: string, mínimo 2 caracteres, máximo 100
- `email`: email válido
- `company`: opcional, máximo 100 caracteres
- `serviceType`: uno de ["vulnerability-analysis", "audit", "consulting", "ai-agents"]
- `message`: string, mínimo 10 caracteres, máximo 2000
- `budgetRange`: opcional, uno de ["5k-10k", "10k-25k", "25k+"]
- `honeypot`: string vacío (campo anti-spam invisible)

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "data": {
    "id": "clh7x2d9q0000pwpq1a2b3c4d"
  },
  "message": "Solicitud recibida. Te contactaremos pronto."
}
```

**Respuesta con error (400/429/500):**
```json
{
  "success": false,
  "error": "Descripción del error",
  "statusCode": 400
}
```

**Códigos de estado:**
- `201`: Solicitud creada exitosamente
- `400`: Datos inválidos
- `429`: Límite de solicitudes excedido (rate limiting)
- `500`: Error interno del servidor

**Ejemplo con cURL:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "company": "Tech Solutions",
    "serviceType": "audit",
    "message": "Necesitamos una auditoría de seguridad completa.",
    "budgetRange": "25k+",
    "honeypot": ""
  }'
```

---

### GET /api/contact/list

Obtiene la lista de todos los contactos/leads registrados. Requiere autenticación API.

**URL:** `GET http://localhost:3000/api/contact/list`

**Headers:**
```
Authorization: Bearer tu-api-key-secreta
```

**Parámetros:** Ninguno

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "contacts": [
      {
        "id": "clh7x2d9q0000pwpq1a2b3c4d",
        "name": "Juan Pérez",
        "email": "juan@empresa.com",
        "company": "Tech Solutions Inc",
        "serviceType": "vulnerability-analysis",
        "message": "Solicitud de análisis...",
        "budgetRange": "10k-25k",
        "status": "new",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "clh7x2d9q0000pwpq1a2b3c4e",
        "name": "María García",
        "email": "maria@empresa.com",
        "company": "Innovatech",
        "serviceType": "consulting",
        "message": "Asesoramiento en seguridad...",
        "budgetRange": "5k-10k",
        "status": "contacted",
        "createdAt": "2024-01-16T14:20:00.000Z",
        "updatedAt": "2024-01-16T15:45:00.000Z"
      }
    ]
  },
  "message": "Leads obtenidos exitosamente"
}
```

**Respuesta de error (401/500):**
```json
{
  "success": false,
  "error": "API_KEY inválida o no proporcionada",
  "statusCode": 401
}
```

**Códigos de estado:**
- `200`: Leads obtenidos exitosamente
- `401`: API_KEY inválida o no proporcionada
- `500`: Error interno del servidor

**Ejemplo con cURL:**
```bash
curl -X GET http://localhost:3000/api/contact/list \
  -H "Authorization: Bearer tu-api-key-secreta"
```

**Ejemplo con JavaScript/Fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/contact/list', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer tu-api-key-secreta'
  }
});

const data = await response.json();
console.log(data);
```

## Despliegue en Vercel

Vercel es la plataforma recomendada para desplegar aplicaciones Next.js. Es el creador de Next.js y proporciona optimizaciones automáticas.

### Paso 1: Preparar el repositorio

Asegúrate de que tu proyecto está versionado en GitHub:

```bash
git add .
git commit -m "chore: prepare for deployment"
git push origin main
```

### Paso 2: Conectar Vercel

1. Accede a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Importa tu repositorio de GitHub
4. Selecciona "Next.js" como framework (se detecta automáticamente)

### Paso 3: Configurar variables de entorno

En la pantalla de configuración de Vercel:

1. Desplázate a "Environment Variables"
2. Añade las siguientes variables:

```
DATABASE_URL=postgresql://usuario:contraseña@host:5432/interactiv3web
API_KEY=tu-clave-api-fuerte-y-unica-aqui
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

**Nota:** Para producción, usa PostgreSQL en lugar de SQLite. Configura una base de datos PostgreSQL en:
- [Vercel Postgres](https://vercel.com/storage/postgres)
- [Supabase](https://supabase.com)
- [Railway](https://railway.app)
- [PlanetScale](https://planetscale.com)

### Paso 4: Desplegar

1. Haz clic en "Deploy"
2. Vercel compilará e instalará dependencias automáticamente
3. Tu sitio estará disponible en `https://tu-proyecto.vercel.app`

### Paso 5: Configurar dominio personalizado (opcional)

En los ajustes del proyecto en Vercel:
1. Selecciona "Domains"
2. Añade tu dominio personalizado (ejemplo: `juanmago.com`)
3. Configura los registros DNS según las instrucciones de Vercel

### Verificación de despliegue

Después del despliegue, verifica que:
- El sitio carga correctamente
- Los formularios funcionan: `POST /api/contact`
- El endpoint de leads funciona con API_KEY: `GET /api/contact/list`
- Las variables de entorno están correctamente configuradas

## Notas de Seguridad

### Validación de Formularios

Todos los datos de entrada se validan usando **Zod** en el servidor (`src/lib/validators.ts`):
- Validación de tipos de datos
- Límites de longitud de strings
- Formatos específicos (email, URL)
- Enumeraciones controladas (serviceType, budgetRange)

```typescript
// Ejemplo de validación
const contactFormSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  serviceType: z.enum(["vulnerability-analysis", "audit", "consulting", "ai-agents"]),
  message: z.string().min(10).max(2000),
  // ... más campos
});
```

### Rate Limiting

Control de tasa de solicitudes (`src/lib/rate-limit.ts`) previene spam y ataques:
- Configurable por IP del cliente
- Ventana deslizante de tiempo
- Límite máximo de solicitudes

Variables de entorno:
```env
RATE_LIMIT_WINDOW_MS=900000    # 15 minutos
RATE_LIMIT_MAX_REQUESTS=5      # 5 solicitudes máximo
```

Respuesta cuando se excede el límite:
```json
{
  "success": false,
  "error": "Has excedido el límite de solicitudes. Intenta más tarde.",
  "statusCode": 429
}
```

### Campo Honeypot

Técnica anti-spam (`src/app/api/contact/route.ts`):
- Campo invisible en HTML (display: none)
- Bots lo llenan automáticamente
- Si contiene datos, la solicitud se filtra silenciosamente
- No revela que fue bloqueada

```html
<!-- En el formulario HTML -->
<input type="text" name="honeypot" style="display: none;" />
```

### Autenticación API_KEY

Protege el endpoint de listado de leads:
- Header: `Authorization: Bearer tu-api-key`
- Se compara con la variable `API_KEY`
- Responde 401 si es inválida

```javascript
const authHeader = request.headers.get("Authorization");
const apiKey = authHeader?.replace("Bearer ", "");

if (!apiKey || !validateApiKey(apiKey)) {
  return errorResponse("API_KEY inválida o no proporcionada", 401);
}
```

**Recomendaciones:**
- Usa una clave fuerte (mínimo 32 caracteres)
- Rota la clave periódicamente
- Nunca expongas la clave en código cliente
- Usa HTTPS en producción (automático en Vercel)

### Prácticas Seguras en Producción

1. **HTTPS obligatorio:** Vercel fuerza HTTPS automáticamente
2. **CORS:** Configura origen de solicitudes permitidas si es necesario
3. **Logs:** Revisa los logs en Vercel para actividad sospechosa
4. **Backups:** Realiza backups regulares de la base de datos
5. **Monitoreo:** Configura alertas para errores 5xx en Vercel

## Editar Contenido del Sitio

Todos los textos, títulos y configuraciones se encuentran en:

**Archivo:** `src/content/config.ts`

```typescript
// Información general del sitio
export const SITE_CONFIG = {
  title: "Juan Mago González - Analista de Seguridad",
  description: "Descripción breve del sitio...",
  author: "Juan Mago González",
  email: "juanmagonzalez577@gmail.com",
  social: {
    linkedin: "https://linkedin.com/in/tu-perfil",
    github: "https://github.com/tu-usuario",
  },
};

// Sección hero (principal)
export const HERO = {
  title: "Seguridad sin compromiso",
  subtitle: "Análisis de vulnerabilidades, auditorías y automatización inteligente",
  cta: "Solicitar presupuesto",
};

// Sección Sobre mí
export const ABOUT = {
  title: "Sobre mí",
  description: `Tu descripción bio aquí...`,
};

// Servicios ofrecidos
export const SERVICES = [
  {
    id: "vulnerability-analysis",
    title: "Análisis de Vulnerabilidades",
    description: "Identificación y evaluación...",
    icon: "🔍",
  },
  // ... más servicios
];

// Demostraciones / Casos de uso
export const DEMOS = [
  {
    id: "demo-1",
    title: "Agente de Análisis de Logs",
    description: "Agente autónomo...",
    embedUrl: "https://url-de-demo.com",
  },
  // ... más demostraciones
];
```

**Para actualizar contenido:**
1. Abre `src/content/config.ts`
2. Modifica las cadenas de texto
3. Guarda el archivo
4. El sitio se recargará automáticamente en desarrollo (hot reload)

## Próximos Pasos / Roadmap

### Corto plazo (Sprint 1-2)
- [ ] Mejorar validaciones de formulario con feedback visual
- [ ] Implementar recaptcha v3 para mayor protección anti-spam
- [ ] Añadir envío de email confirmatorio al usuario
- [ ] Dashboard de administración para gestionar leads

### Mediano plazo (Sprint 3-4)
- [ ] Sistema de autenticación admin con NextAuth.js
- [ ] Notificaciones por email a nuevos leads
- [ ] Exportar leads a CSV/Excel
- [ ] Analytics e instrumentación (Google Analytics, Mixpanel)
- [ ] Tests unitarios e integración (Jest, Testing Library)

### Largo plazo
- [ ] Sistema de calendario para agendar demos
- [ ] Chatbot de IA para soporte automatizado
- [ ] Portal de cliente para ver estado de proyectos
- [ ] Integración con CRM (HubSpot, Pipedrive)
- [ ] Blog de seguridad y artículos técnicos
- [ ] Multilanguage support (English, Portuguese)

## Soporte y Ayuda

### Recursos útiles
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs/)
- [Documentación de Zod](https://zod.dev/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)

### Problemas comunes

**Error: "Cannot find module '@/lib/...'"**
- Verifica que el archivo existe en la ruta especificada
- Revisa que `tsconfig.json` tiene el alias `@` configurado

**Base de datos no se migra**
```bash
# Elimina la BD antigua y recrea
rm dev.db
npx prisma migrate dev --name init
```

**Puerto 3000 ya está en uso**
```bash
# Usa otro puerto
npm run dev -- -p 3001
```

**Cambios en código no se reflejan**
- Recarga la página del navegador (Ctrl+R)
- Si usas hot reload, espera a que se reconstruya

### Contacto para soporte
- Email: [juanmagonzalez577@gmail.com](mailto:juanmagonzalez577@gmail.com)
- LinkedIn: [linkedin.com/in/tu-perfil](https://linkedin.com/in/tu-perfil)
- GitHub Issues: Abre una issue en el repositorio

---

**Última actualización:** Julio 2024
**Versión:** 0.1.0
**Licencia:** MIT
