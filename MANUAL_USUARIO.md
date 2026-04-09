# Manual de Usuario - Mesa de Ayuda

Bienvenido al Manual de Usuario de la plataforma **Mesa de Ayuda**, un sistema integral diseñado para facilitar la comunicación, recepción y gestión de incidencias, tanto de usuarios internos (empleados) como de ciudadanos (público general).

---

## 1. Introducción
La plataforma permite canalizar requerimientos o problemas vinculados a las distintas dependencias de la municipalidad/entidad. Existen tres niveles principales de interacción:
1. **Acceso Público (Ciudadanos):** No requieren usuario ni contraseña. Acceden gracias a un "Código PIN" específico de la oficina a la que desean contactar.
2. **Personal / Usuarios del Sistema:** Empleados o trabajadores autorizados. Tienen acceso directo al panel para **crear, responder y resolver** cualquier ticket.
3. **Administrador:** Además de las funciones regulares, este rol maneja el borrado de la base de datos, los ajustes de cuentas de usuario y la administración de los PINs.

---

## 2. Acceso Público (Ciudadanos)

El ciudadano no necesita una cuenta en el sistema. Utiliza un portal público destinado a interacciones rápidas y seguras.

### 2.1 Crear un Ticket (Reclamo o Solicitud)
1. Acceda a la página principal pública de la Mesa de Ayuda.
2. Ingrese el **PIN de la Oficina** correspondiente. Este PIN es proporcionado físicamente o por redes sociales por la dependencia.
3. El sistema validará el código. Si es correcto, mostrará un formulario.
4. Rellene su **Nombre, Correo y Teléfono**.
5. Escriba el **Asunto y Descripción** de su incidencia. Puede adjuntar evidencias o archivos si es necesario.
6. Haga clic en Enviar. 
7. **IMPORTANTE:** El sistema le generará y mostrará en pantalla un **Código de Seguimiento Único** (Ej: `A4F9B2`). **Debe guardar este código** para poder consultar la respuesta o el estado de su caso posteriormente.

### 2.2 Consultar y Responder un Ticket
1. En la página pública, diríjase a la sección "Seguimiento de Ticket".
2. Ingrese el **Código de Seguimiento** de 6 dígitos que guardó.
3. Podrá visualizar el estado de su caso ("Abierto", "En Progreso" o "Cerrado") y leer las respuestas.
4. Si lo desea, puede añadir más mensajes interactuando como en un chat dentro de su panel.

---

## 3. Acceso para Personal / Empleados (Soporte)

Los empleados con credenciales operan como parte de la red de soporte de la mesa de ayuda.

### 3.1 Ingreso al Sistema
1. Diríjase a la URL del panel administrativo (`/login`).
2. Introduzca su **Correo Electrónico** y **Contraseña**.
3. Accederá al tablero principal donde verá todos los tickets activos e históricos de la institución.

### 3.2 Atender, Responder y Resolver Tickets
1. El sistema listará **todos** los tickets procedentes del público o de cualquier otra área.
2. Haga clic en **"Ver Detalles"** sobre un ticket que competa a su área.
3. Puede responder al reporte escribiendo en el chat correspondiente.
4. Use el selector desplegable en la esquina superior para cambiar el **estado del requerimiento** (En progreso, Abierto).
5. Seleccione "Cerrado" cuando haya brindado atención y aporte un comentario de resolución para finalizar y archivar el documento.

### 3.3 Crear Tickets Internos
También puede usar el botón **"Nuevo Ticket"** para reportar fallos a sus pares en otras secretarías o dependencias.

---

## 4. Acceso para Administradores

El administrador maneja la capa gerencial y la protección de datos por encima de la atención de casos.

### 4.1 Gestión de Cuentas (Usuarios)
En la pestaña de **Usuarios**, el administrador puede:
1. Crear nuevos empleados y enviarles sus datos.
2. Definir si el nuevo empleado tendrá rol estándar (`usuario`) o si tendrá poderes privilegiados (`admin`).
3. Editar correos o contraseñas.
4. Eliminar usuarios inactivos o ex-trabajadores.

### 4.2 Gestión de Códigos de Oficinas (PINs)
Los PINs determinan a qué sección irán a parar los reportes del sistema exterior (los ciudadanos).
1. Desde **Códigos de Oficina**, determine un código corto y fácil (Ej: `SALUD25`).
2. Asígnelo a una "Dependencia" y "Sección".
3. Todo ciudadano que escriba este PIN iniciará una carpeta bajo dicha área.

### 4.3 Borrado Masivo y Limpieza
1. Solo el administrador tiene a su disposición los *checkboxes* azules en el registro de tickets.
2. Permite seleccionar varios tickets y realizar un **borrado masivo** y permanente. Úselo con responsabilidad para aligerar la base de datos de expedientes purgados.

---

*Para dudas adicionales o errores no documentados, por favor contacte al administrador del equipo de TI.*
