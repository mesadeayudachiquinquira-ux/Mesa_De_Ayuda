# Manual del Programador - MuniSupport

Este documento está dirigido estrictamente a desarrolladores e ingenieros de software que deban heredar, mantener o expandir el código fuente de la plataforma MuniSupport. 

## 1. Stack Tecnológico (MERN)
El proyecto ha sido construido utilizando el conjunto de tecnologías MERN, separando la capa del cliente de la del servidor para garantizar escalabilidad:

### Frontend (Directorio `/frontend`)
- **Core**: React.js 18.x.
- **Empaquetador**: Vite (reemplazando a Webpack por su rapidez extrema).
- **Estilos**: TailwindCSS (Utility-first CSS). Todo el diseño es fluido y nativo, no depende de plantillas cerradas.
- **Enrutamiento**: React Router DOM (Manejo de rutas públicas y privadas).
- **Iconografía**: `lucide-react`.

### Backend (Directorio `/backend`)
- **Entorno**: Node.js (Runtime).
- **Framework**: Express.js (Creación de REST API).
- **Base de Datos**: MongoDB (Motor NoSQL).
- **ORM / ODM**: Mongoose (Modelado y consultas a datos).
- **Autenticación**: JSON Web Tokens (JWT) y encriptación de claves con `bcrypt.js`.

## 2. Estructura de Directorios Internos

### 2.1 Backend (Lógica de Negocio y API)
La API está construida bajo un patrón estructurado de responsabilidades:
* `backend/models/`: Define los esquemas de la base de datos de MongoDB (Ej: `User.js` dicta cómo los documentos del usuario son organizados).
* `backend/controllers/`: Contiene la carga pesada. Por ejemplo, `ticketController.js` maneja la lógica para guardar un nuevo ticket en Mongo.
* `backend/routes/`: Expone las rutas HTTP. Vinculan las URL (creadas con el *Router* de Express) a sus respectivos controladores.
* `backend/middleware/`: Actúan como interceptores. Validadores de JSON Web Tokens que bloquean el acceso al código a personas no autorizadas.
* `backend/server.js`: El cerebro de inicialización. Conecta a la base de datos y echa a andar los puertos de Express.

### 2.2 Frontend (Interfaz Visual y Experiencia de Usuario)
* `frontend/src/pages/`: Archivos para las vistas de página completas navegables (Ej: `Home.jsx`, `Dashboard.jsx`, `Tickets.jsx`).
* `frontend/src/components/`: Piezas pequeñas que se combinan para armar las páginas completas (Tablas, tarjetas, el `Sidebar.jsx`, `Navbar.jsx`).
* `frontend/src/context/`: Alberga el Administrador Global de Sesiones o `AuthContext.jsx`. Mantiene los datos del usuario en memoria para que no tenga que iniciar sesión repetidamente entre vistas.
* `frontend/src/api/`: Contiene configuraciones genéricas y cliente REST (Axios) para hablar estandarizadamente con el Backend.

## 3. Lógica de Autenticación Stateless
El flujo de seguridad principal del sistema no hace uso de Cookies tradicionales sino la estrategia de Tokens:
1. **Inicio de Sesión**: Al suministrar correo y clave, el controlador encripta la clave y la coteja en Base de datos.
2. **Despacho del Token**: El backend firma y devuelve un Token temporal que certifica "Quien" es el usuario y qué "Rol" tiene (Admin o Técnico).
3. **Consumo Automático**: El contexto de React inyecta constantemente este Bearer Token ocultamente a la cabecera en cada petición Axios futura. El servidor valida la franja firmada digitalmente; si es apto, envía la info.

## 4. Reglas Estrictas para Desarrollar a Futuro
1. **Separación de Lógica DB**: Todas las funciones que consulten la Base de Datos (`Ticket.find()`, `User.create()`) **DEBEN** escribirse asiladamente dentro de la carpeta `/controllers`. Las rutas únicamente se encargan del ruteo.
2. **No usar CSS Legacy**: Se restringe cualquier hoja de estilo `.css` que no sea estrictamente el `index.css` global. Todos los retoques estéticos deben configurarse empleando clases *utility* de Tailwind (Ej: `className="bg-blue-600 rounded-xl"`). Esto previene que el aspecto de GovTech se contamine.
3. **Manejo de Operaciones Asíncronas**: Los callbacks de conexión con base de datos siempre serán promesas (Async/Await) y deben anidarse entre bloques formales `try ... catch`. Toda captura de error deberá entregar un código HTTP (500/400/404) y un formato legible JSON como `{ message: 'Aviso del Error.' }`.
