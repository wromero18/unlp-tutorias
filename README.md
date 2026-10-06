# UNLP Tutorías

Plataforma para conectar alumnos de la UNLP con tutores particulares. Tiene cargada una carrera representativa de cada una de las **17 facultades de la UNLP** (745 materias en total), cada una con su plan de estudios oficial. Ver la lista completa y las fuentes en la sección de [Carreras cargadas](#carreras-cargadas-745-materias) más abajo.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 6** + SQLite en desarrollo (fácil de migrar a PostgreSQL en producción)
- **NextAuth v5 (Auth.js)** con proveedor de credenciales (usuario/email + contraseña)

## Cómo correrlo

```bash
npm install
npm run db:seed   # carga carreras + materias iniciales
npm run dev
```

Abrir http://localhost:3000

## Estructura funcional (MVP actual)

- **Registro/login** de alumnos y tutores con usuario/email + contraseña ([src/app/register](src/app/register), [src/app/login](src/app/login)). Incluye "¿Olvidaste tu contraseña?" con reseteo por email (ver más abajo).
- **Perfil de tutor**: materias que dicta, bio, tarifa, y estado de suscripción. Desde su panel puede agregar más materias con dos desplegables (carrera → materia) o quitarlas ([src/app/api/tutor/subjects](src/app/api/tutor/subjects)).
- **Directorio de tutores** ([/tutores](src/app/tutores/page.tsx)) — **solo para alumnos**: filtra por carrera y materia mostrando qué tutores la dictan. Un tutor logueado no ve el link "Tutores" en el menú y, si entra por URL directa, lo mandamos a su panel — buscar/elegir materia para un tutor es autogestión en "Mi panel" (arriba), no una búsqueda de otros tutores. Solo aparecen tutores con suscripción activa.
- **Solicitudes de tutoría**: un alumno logueado puede pedirle a un tutor una materia puntual ([src/app/api/tutoring-requests](src/app/api/tutoring-requests)). El tutor ve las solicitudes pendientes en su panel y puede aceptarlas o rechazarlas; las aceptadas pasan a "Tus alumnos".
- **Link y fecha de la clase (Zoom/Meet)**: en "Tus alumnos", el tutor carga el link de la videollamada junto con la fecha y hora programada para cada tutoría aceptada ([src/app/api/tutoring-requests/[id]/meeting-link](src/app/api/tutoring-requests/[id]/meeting-link)). Al alumno le aparece la fecha/hora y un botón "Unirse a la clase" en "Tus solicitudes" apenas el tutor lo carga (el botón no depende del día: queda disponible desde que se guarda el link). Desde ahí también hay un botón directo a "Ver materiales y dejar reseña" del tutor.
- **Reseñas y calificación**: cada tutor tiene una [página de perfil](src/app/tutores/[id]/page.tsx) con estrellas (1 a 5) y comentario. Solo puede reseñar un alumno que ya tuvo una tutoría aceptada con ese tutor ([src/app/api/reviews](src/app/api/reviews)). El promedio se muestra en el directorio, en el perfil del tutor y en su panel ("Tus reseñas").
- **Suscripción**: hay un stub de "activar suscripción" en el panel del tutor ([src/app/api/tutor/subscription](src/app/api/tutor/subscription)) que simula un pago exitoso por 30 días. Todavía no está conectado a una pasarela real.
- **Google Calendar (opción simple)**: el tutor pega el link público de su Google Calendar en su panel y queda embebido tanto ahí como en su perfil público ([src/app/api/tutor/calendar-link](src/app/api/tutor/calendar-link), [src/components/calendar-embed.tsx](src/components/calendar-embed.tsx)). No requiere configuración del lado del servidor, solo que el tutor lo pegue. El link se valida para que sea de `calendar.google.com`.
- **Google Calendar (opción avanzada, OAuth)**: además, si el administrador configura `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, el tutor puede conectar directamente su cuenta de Google y se muestran sus horarios ocupados automáticamente ([src/app/api/google-calendar](src/app/api/google-calendar), [src/lib/google-calendar.ts](src/lib/google-calendar.ts)). Ver instrucciones abajo.
- **Materiales (PDFs y actividades)**: el tutor sube PDFs o crea actividades (consigna de texto) desde su panel, opcionalmente asociados a una materia y a **un alumno puntual** (o a "todos mis alumnos") ([src/app/api/materials](src/app/api/materials)). Un material dirigido a un alumno específico solo lo ve ese alumno; uno general lo ven todos los que tienen una tutoría **aceptada** con ese tutor — se muestran en el perfil público del tutor.

## Cómo activar la opción avanzada de Google Calendar (OAuth)

Esto requiere crear credenciales OAuth propias en Google Cloud — es un paso que tenés que hacer vos con tu cuenta de Google, no algo que se pueda dejar precargado:

1. Entrá a [Google Cloud Console](https://console.cloud.google.com/) y creá un proyecto (o usá uno existente).
2. Andá a **APIs & Services → Library**, buscá "Google Calendar API" y habilitála.
3. Andá a **APIs & Services → OAuth consent screen**. Elegí tipo "External", completá los datos mínimos (nombre de la app, email de soporte). Mientras esté en modo "Testing" alcanza con agregar como "test user" el email de Google con el que vas a probar el login del tutor.
4. Andá a **APIs & Services → Credentials → Create Credentials → OAuth client ID**. Tipo de aplicación: "Web application".
5. En **Authorized redirect URIs** agregá:
   - `http://localhost:3000/api/google-calendar/callback` (desarrollo)
   - `https://tu-dominio-de-produccion.com/api/google-calendar/callback` (cuando despliegues)
6. Copiá el **Client ID** y **Client Secret** generados y pegalos en `.env`:
   ```
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```
7. Reiniciá el servidor (`npm run dev`). El botón "Conectar Google Calendar" del panel del tutor va a empezar a funcionar.

**Nota de seguridad**: el refresh token de Google se guarda hoy en texto plano en la base de datos (columna `googleRefreshToken` de `TutorProfile`), lo cual es aceptable para desarrollo pero no para producción — ahí conviene cifrarlo en la aplicación antes de guardarlo, o usar un secret manager.

## Cómo activar el envío real de emails (recuperar contraseña)

"¿Olvidaste tu contraseña?" (en el login) funciona siempre, pero sin configurar SMTP el link de reseteo no se manda por mail de verdad: queda logueado en la consola del servidor y (solo en desarrollo) se muestra directo en la pantalla, para poder probarlo sin configurar nada. Para que el mail se envíe de verdad:

1. Conseguí credenciales SMTP. Para probar rápido, un servicio como [Resend](https://resend.com) o [Mailtrap](https://mailtrap.io) dan un SMTP gratuito en minutos; para un Gmail personal, generá una ["contraseña de aplicación"](https://myaccount.google.com/apppasswords) (no la contraseña normal de la cuenta).
2. Completá en `.env`:
   ```
   SMTP_HOST="smtp.tu-proveedor.com"
   SMTP_PORT="587"
   SMTP_USER="tu-usuario"
   SMTP_PASSWORD="tu-contraseña-o-api-key"
   EMAIL_FROM="UNLP Tutorías <no-reply@tu-dominio.com>"
   ```
3. Reiniciá el servidor (`npm run dev`). A partir de ahí, "¿Olvidaste tu contraseña?" manda el mail real en vez de mostrar el link en pantalla.

El link de reseteo vence a la hora y se invalida apenas se usa una vez (o si se pide uno nuevo, el anterior queda sin efecto).

## Materiales (PDFs)

Los PDFs que suben los tutores se guardan en `public/uploads/materials/` (con un nombre aleatorio, no el original) y se sirven como archivos estáticos. Esto funciona bien para desarrollo local, pero **no persiste en la mayoría de los hosts de producción** (Vercel, por ejemplo, tiene el filesystem de solo lectura fuera de `/tmp`). Antes de desplegar a producción, reemplazar `src/lib/materials-storage.ts` por una subida a un storage real (S3, Cloudflare R2, Vercel Blob, etc.). Límite actual: 10MB por archivo.

## Seguridad del login y preparación para escala (2000+ usuarios)

Auditoría hecha sobre el registro/login pensando en que se registren ~2000 alumnos y tutores:

- **Contraseñas**: se guardan con `bcrypt` (costo 12), nunca en texto plano. El login compara siempre contra un hash — real o "señuelo" si el usuario no existe — para que el tiempo de respuesta no delate si un email/usuario está registrado ([src/lib/auth.ts](src/lib/auth.ts)).
- **Se corrigió una fuga real**: el panel del tutor mandaba al navegador el objeto completo de cada alumno aceptado (incluyendo `passwordHash`) como parte de los datos del formulario de materiales, por usar `include: { student: true }` en vez de acotar los campos. Se cambió a `select` explícito (`{ id, name }`) en todos los lugares donde se cargan datos de otro usuario ([src/app/dashboard/page.tsx](src/app/dashboard/page.tsx), [src/app/tutores/page.tsx](src/app/tutores/page.tsx), [src/app/tutores/[id]/page.tsx](src/app/tutores/[id]/page.tsx)). Ninguna ruta de API devuelve tampoco datos de usuario sin acotar.
- **Límite de intentos (rate limiting)**: tanto el login como el registro frenan a quien insiste demasiado rápido — 10 intentos de login cada 15 min por cuenta + 30 por IP, y 10 registros por hora por IP ([src/lib/rate-limit.ts](src/lib/rate-limit.ts)). Es en memoria (para un solo servidor Node, como este); si en el futuro se despliega en múltiples instancias o serverless, hay que cambiarlo por un store compartido (Redis/Upstash) manteniendo la misma interfaz.
- **Emails/usuarios normalizados**: se guardan y se comparan siempre en minúsculas, para que "Ana@x.com" y "ana@x.com" no generen cuentas duplicadas o confusión al loguearse.
- **Validación más estricta en el registro**: largo máximo en nombre/email, contraseña acotada a 72 caracteres (bcrypt ignora en silencio lo que sigue de ahí), y manejo de la condición de carrera cuando dos registros con el mismo email/usuario llegan casi al mismo tiempo (antes podía tirar un error 500 sin manejar).
- **Índices en la base de datos**: se agregaron índices en las columnas por las que se filtra seguido (`TutorSubject.subjectId`, `TutoringRequest.tutorId`, `Review.tutorId`, `Material.tutorId`, `Material.studentId`), para que el directorio de tutores y los paneles sigan respondiendo rápido con miles de filas en vez de degradarse con el tiempo.
- **SQLite más resistente a escrituras simultáneas**: se activó modo `WAL` y `busy_timeout` ([src/lib/prisma.ts](src/lib/prisma.ts)), así dos personas registrándose casi a la vez no chocan con un error de "base de datos bloqueada".

**Sobre la escala real**: 2000 usuarios son pocas filas para cualquier base de datos — SQLite lo maneja sin problema en cuanto a *cantidad* de datos. La limitación real de SQLite es la **escritura concurrente entre múltiples procesos/servidores** (no aplica acá si corre en un solo servidor). Si en algún momento se despliega en Vercel/serverless con múltiples instancias, ahí sí conviene pasar a PostgreSQL (Neon, Supabase, etc.) — ver el punto 3 de "Pendientes" abajo; el cambio es solo de `provider` y `DATABASE_URL` en el schema, el resto del código no cambia.

## Pendientes / próximos pasos

1. **Pasarela de pagos real**: reemplazar el stub de `/api/tutor/subscription` por la integración con Mercado Pago (suscripciones recurrentes) o la que se decida, incluyendo el webhook que actualiza `subscriptionStatus`.
2. **Recordatorios de la clase programada**: ya existe `scheduledAt` en `TutoringRequest`, pero falta un aviso (email, notificación) cerca del horario — hoy el alumno/tutor tienen que entrar a mirar el panel.
3. **PostgreSQL en producción**: cambiar `provider = "sqlite"` a `provider = "postgresql"` en [prisma/schema.prisma](prisma/schema.prisma) y `DATABASE_URL` en `.env` por la conexión real (Neon, Supabase, RDS, etc.), luego `npx prisma migrate deploy`.
4. **Perfil de tutor editable** (hoy se crea en el registro pero no hay pantalla para editar bio/tarifa/materias después).
5. **Notificaciones**: hoy el alumno tiene que volver a "Mi panel" para ver si le aceptaron la solicitud; no hay aviso (email, etc.).
6. **Cifrar el refresh token de Google** antes de pasar a producción (ver nota de seguridad arriba).
7. **Storage real para PDFs** antes de desplegar a producción (ver sección de Materiales arriba).
8. **Rate limiting compartido (Redis/Upstash)** si el sitio se despliega en más de una instancia/serverless — el actual es en memoria y no se comparte entre procesos (ver sección de Seguridad arriba).

## Variables de entorno (`.env`)

- `DATABASE_URL`: conexión a la base de datos.
- `AUTH_SECRET`: secreto para firmar las sesiones (JWT) de NextAuth.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `EMAIL_FROM`: credenciales para mandar el mail de "recuperar contraseña" (ver sección de arriba). Sin esto, el link se muestra en la consola del servidor en vez de mandarse.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: credenciales OAuth para la integración con Google Calendar (ver sección de arriba).

## Carreras cargadas (745 materias)

Se eligió **una carrera representativa por cada una de las 17 facultades** de la UNLP (en vez de las 100+ carreras que dicta la universidad en total), cada una con su plan de estudios oficial verificado contra el sitio o el PDF de la propia facultad (dominio `*.unlp.edu.ar`). El detalle completo de materias y fuentes está en [prisma/seed.ts](prisma/seed.ts), con un comentario arriba de cada carrera indicando de dónde salió.

| Facultad | Carrera cargada | Materias |
|---|---|---|
| Ciencias Médicas | Medicina | 61 |
| Ciencias Agrarias y Forestales | Ingeniería Agronómica | 48 |
| Ciencias Veterinarias | Ciencias Veterinarias | 55 |
| Ciencias Naturales y Museo | Biología (orientación Ecología) | 25 |
| Ciencias Astronómicas y Geofísicas | Astronomía | 24 |
| Arquitectura y Urbanismo | Arquitectura | 33 |
| Bellas Artes | Artes Plásticas | 31 |
| Ingeniería | Ingeniería Civil | 66 |
| Informática | Informática (Lic. en Informática) | 33 |
| Ciencias Económicas | Contador Público | 34 |
| Ciencias Jurídicas y Sociales | Abogacía | 51 |
| Humanidades y Ciencias de la Educación | Ciencias de la Educación | 37 |
| Periodismo y Comunicación Social | Comunicación Social | 80 |
| Ciencias Exactas | Farmacia | 42 |
| Odontología | Odontología | 60 |
| Psicología | Psicología | 35 |
| Trabajo Social | Trabajo Social | 30 |

Notas sobre lo que se excluyó a propósito (para no inventar materias): los espacios "a elección" sin nombre fijo en el plan oficial (p. ej. "Optativa", "Asignatura Electiva I/II", menús de idioma como "Inglés o Alemán") no se cargaron como materia — si el plan sí nombra una optativa/seminario puntual (p. ej. los seminarios de orientación de Abogacía), esa sí está incluida.

Si en algún momento se quiere sumar más carreras de una facultad grande (p. ej. todas las de Ciencias Exactas: Química, Física, Bioquímica...) o directamente todas las 100+ carreras de la UNLP, hay que repetir el mismo proceso de investigación por carrera — es trabajo de investigación importante, no solo de código.

## Modelo de datos (resumen)

- `Career` (carrera) → tiene muchas `Subject` (materias).
- `User` → rol `STUDENT` o `TUTOR`, con su `StudentProfile` o `TutorProfile`.
- `TutorProfile` → dicta varias `Subject` (vía `TutorSubject`), tiene estado de suscripción.
- `TutoringRequest` → vincula a un alumno, un tutor y una materia puntual, con estado `PENDING` / `ACCEPTED` / `DECLINED`, y un `meetingLink` + `scheduledAt` opcionales (Zoom/Meet y fecha/hora) que carga el tutor una vez aceptada.
- `Review` → una reseña por alumno y tutor (rating 1-5 + comentario opcional); si el alumno vuelve a reseñar, se actualiza la existente en vez de crear otra.
- `Material` → un PDF o una actividad que un tutor comparte, opcionalmente asociado a una `Subject` y a un `User` (alumno) puntual; si `studentId` es `null`, es general para todos sus alumnos.
- `PasswordResetToken` → token (se guarda su hash, no el valor crudo) para restablecer la contraseña por email, con vencimiento a la hora y de un solo uso.
