# Manual Técnico y de Arquitectura - MuniSupport

Este documento describe la arquitectura, puesta en marcha y gestión técnica a nivel de código y servidores de la plataforma MuniSupport. 

## 1. Arquitectura del Proyecto (MERN Stack)
La plataforma está dividida en dos componentes en carpetas separadas:
* **Frontend (Interfaz)**: Aplicación **React.js** construida sobre **Vite** para máxima velocidad. Todo el aspecto visual está diseñado con **Tailwind CSS**.
* **Backend (API y Lógica de Negocio)**: Servidor construido con **Node.js** sumado al marco de trabajo **Express.js**.
* **Base de Datos**: Manejador **MongoDB** (motor NoSQL no relacional) gestionado desde el backend a través de **Mongoose**.

## 2. Requisitos Previos (Environment)
Para instalar o gestionar este código fuente en cualquier ordenador o servidor nuevo, es estrictamente necesario que el sistema tenga instalado lo siguiente:
1. **Node.js** (Se recomienda la versión LTS más reciente, e.g. v18 o superior).
2. **NPM** (Por defecto se instala junto con Node.js).
3. Entorno de Base de Datos Mongo: Puede ser una instalación local de MongoDB Compass/Server o un entorno Cloud como **MongoDB Atlas** (recomendado).

## 3. Instalación Local para Desarrollo o Pruebas

Teniendo ambas carpetas (`backend/` y `frontend/`) descargadas, deben seguirse estos pasos de instalación:

### 3.1 Puesta en Marcha del Backend
1. Abra una terminal e ingrese a la ruta: `cd backend`
2. Ejecute el comando para que node descargue los módulos: `npm install`
3. **Paso crítico**: Cree un archivo de configuración oculto llamado `.env` en la raíz de la carpeta `backend`.
4. El archivo `.env` debe incluir tres variables esenciales:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<usuario>:<password>@clusterX.mongodb.net/mesa_ayuda
   JWT_SECRET=escriba_un_secreto_largo_y_dificil_aqui
   ```
5. Una vez configurado, encienda la API REST ejecutando `npm run dev`.

### 3.2 Puesta en Marcha del Frontend
1. Abra otra pestaña en la terminal e ingrese a la ruta: `cd frontend`
2. Ejecute la instalación de librerías visuales: `npm install`
3. Encienda el servidor visual con: `npm run dev`
4. El sistema se compilará y la terminal le indicará una dirección (usualmente `http://localhost:5173`) para ver su app funcionando.

## 4. Despliegue a Producción (Deployment)
Cuando se finaliza la fase de desarrollo y se traslada a "Producción" (Servidores gubernamentales en vivo), la dinámica cambia y se hace de manera optimizada:

### Para el Frontend (Archivos Estáticos):
Debe ejecutar el comando `npm run build` estando en su carpeta `frontend`. Esto toma todo su código React y genera una carpeta empaquetada llamada `/dist` llena de HTML/JS ligero, que usted puede simplemente cargar al FTP o panel de su Hosting Web oficial (A través de un CPanel, Apache, Nginx o Render).

### Para el Backend (El Motor API):
Debe mover la carpeta a su servidor virtual (VPS). Allí ya no se ejecuta `npm run dev`, sino que se utiliza la herramienta global de control de procesos conocida como **PM2** ejecutando `pm2 start server.js` o `npm start`. Esto garantiza que la API de soporte jamás se detenga aunque se cierre la consola del servidor.

## 5. Estructura Interna 
Para futuros soportes técnicos, estas son las ubicaciones de relevancia para los desarrolladores:
* `backend/models/*.js`: Define cómo se guardan los objetos en la Base de Datos (los esquemas de Tickets, Usuarios, Oficinas y Chats).
* `backend/routes/*.js`: Lista todas las URL "endpoints" protegidas a las que el Frontend enviará peticiones (GET, POST, PUT, DELETE).
* `backend/controllers/*.js`: Los cerebros del código interno, que se comunican realmente con MongoDB.
* `frontend/src/pages/`: Allí ubica las pantallas enteras navegables de la web publicadas bajo el React Router.
* `frontend/src/components/`: Módulos visuales que se re-utilizan (Dashboard Cards, Menús e inputs).
