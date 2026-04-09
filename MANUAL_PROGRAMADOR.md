# Manual del Programador - Mesa de Ayuda

Este documento está diseñado para proveer una guía técnica exhaustiva a desarrolladores, DevOps e ingenieros de software sobre la arquitectura, el despliegue y la lógica interna de la plataforma **Mesa de Ayuda**.

---

## 1. Stack Tecnológico (MERN)
El proyecto está desarrollado integramente usando Javascript/Typescript, basado en el apilamiento **MERN**:
* **Base de Datos:** MongoDB (Alojada en MongoDB Atlas) - ODM: Mongoose.
* **Backend:** Node.js + Express.js
* **Frontend:** React.js con Vite.
* **Estilos:** Tailwind CSS y utilidades para íconos (Lucide React / React Icons).

---

## 2. Arquitectura de Directorios

El repositorio se divide principalmente en dos carpetas aisladas que se ejecutan sobre puertos y contextos independientes en desarrollo:

```text
mesa-de-ayuda/
├── backend/                  # API REST
│   ├── config/               # Configuraciones (Conexión MongoDB)
│   ├── controllers/          # Lógica de negocio (auth, tickets, usuarios)
│   ├── middleware/           # Validadores de protección JWT y Rate limits
│   ├── models/               # Esquemas de Base de Datos Mongoose
│   ├── routes/               # Declaración de endpoints (Express Router)
│   ├── uploads/              # Archivos y evidencias estáticas
│   ├── utils/                # Funciones auxiliares (Envío de correos, etc.)
│   └── server.js             # Punto de entrada primario
│
└── frontend/                 # Aplicación Cliente React (Vite)
    ├── public/               # Assets estáticos 
    ├── src/
    │   ├── api/              # Configuración base de Axios (Interceptores)
    │   ├── components/       # Componentes React Reutilizables (Navbar, Layouts)
    │   ├── context/          # Manejo de Estado Global (AuthContext)
    │   ├── pages/            # Vistas principales (Tickets, Admin, PublicTrack)
    │   ├── App.jsx           # Enrutamiento (React Router DOM)
    │   └── main.jsx          # Montaje de React DOM
    ├── package.json
    └── tailwind.config.js    # Ajustes del framework CSS 
```

---

## 3. Modelo de Base de Datos (Mongoose)
Los esquemas clave (`/backend/models`) que sostienen la aplicación son:
- **User:** Maneja los usuarios y roles (`admin`, `usuario`). Almacena las contraseñas hasheadas usando `bcryptjs`.
- **Ticket:** Corazón de la aplicación. Posee relaciones tanto lógicas con un usuario creador si es interno (`creadoPor`), como variables string (`nombreContacto`, `correoContacto`) si `esPúblico` es `true`. Dispone de un `codigoAcceso` autogenerado (`crypto.randomBytes`) para seguimientos públicos.
- **Message:** Define el chat estilo hilo (thread) vinculado por el campo `ticketId`.
- **AccessCode:** Los "PINs" vinculados fuertemente a las dependencias. 
- **Notification:** Modelo para campanas de alerta vinculando `usuarioId` y un campo `link` que determina a donde redirigirá el clic en el frontend.

---

## 4. Endpoints y Autenticación del Backend

### 4.1 Autenticación (JWT)
Las rutas sensibles están protegidas por el middleware `protect` (en `/backend/middleware/authMiddleware.js`), el cual intercepta el flujo HTTP leyendo el encabezado `Authorization: Bearer <token>`.
* La inyección de firmas a los JWT emplea `process.env.JWT_SECRET`.
* Se dispone de un sub-middleware especializado `admin` que bloquea peticiones en rutas críticas enviando un `403` si el rol difiere de la cadenta `admin`.

### 4.2 Controladores Principales
* **`ticketController.js`**: Reúne tanto peticiones públicas (creación sin auth) como internas.
    * *Nota especial:* Las rutas como `createPublicTicket` o `addPublicMessage` emiten notificaciones y correos mediante `nodemailer` a los administradores al detectarse una nueva intención ciudadana.
    * Incorpora lógicas de borrado masivo vía `deleteMultipleTickets` (`$in` clause de MongoDB).
* **`officeController.js`**: Interfaz de CRUD estándar expuesta hacia `/api/offices` gestionando los PINs.

---

## 5. El Cliente React (Frontend)

### 5.1 Enrutamiento
Implementado vía `react-router-dom`. Se definen tres grandes bloques en `App.jsx`:
1. **Público:**  Rutas para login local y para el sistema de inicio de tickets mediante PIN.
2. **Privado (Protegido):** `ProtectedRoute` envuelve el dashboard. Redirige si el contexto de autenticación resulta inválido.
3. **Administrativo:** Subrutas habilitadas en el Navbar exclusivamente si `user.rol === 'admin'`.

### 5.2 Manejo de Estados y Axios
El proveedor principal `AuthContext` gestiona la recarga en sesión persistiendo un JSON Web Token en `localStorage`. 
Para no adjuntar el token de forma repetitiva constante, la aplicación usa una instancia en `api/axios.js` la cual utiliza un **Interceptor** para inyectar automáticamente `Bearer <token>` a las banderas *headers* antes de cualquier transmisión de datos que no sea pública.

### 5.3 Optimización y Linter
Actualmente configurado con Vite, se recomienda vigilar severamente el estado de los *Hooks*. ESLint está presente para marcar anomalías por dependencias fantasma en los bloques `useEffect(...)`. 

---

## 6. Variables de Entorno y Configuración Local
Para levantar el ambiente de desarrollo, ambos espacios necesitan un fichero `.env`.

**En el Backend (`backend/.env`):**
```dotenv
PORT=5000
MONGO_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/ayuda
JWT_SECRET=UnSecretoAleatorioLargoYComplejo
JWT_EXPIRE=30d
EMAIL_USER=soporte@tudominio.com # (Servidor SMTP Nodemailer)
EMAIL_PASS=qweasd123
FRONTEND_URL=http://localhost:5173
```

**En el Frontend (`frontend/.env`):** *(Opcional, pre-rutado localmente en Vite)*
```dotenv
VITE_API_URL=http://localhost:5000/api
```

---

## 7. Instrucciones para Arrancar Localmente

Dado que son dos servicios, se necesitan dos terminales:

**Terminal 1 (Backend):**
```bash
cd backend
npm install
npm run dev
# Estará ejecutándose en http://localhost:5000 mediante Nodemon
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
# Estará ejecutándose en http://localhost:5173 optimizado por Vite
```

---

*Cualquier cambio de estructura de datos en MongoDB requiere ajustar el `Schema` correspondiente en `/models`. Los fallos crìticos generalmente se grabarán en la salida estándar, revisar el archivo de Logs si se configura un monitor PM2.*
