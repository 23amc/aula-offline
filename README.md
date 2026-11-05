# EduGo

App educativa que funciona sin conexión, para móvil y web. Los alumnos estudian lecciones, hacen tests y repasan lo que más fallan; los profesores ven las notas y gestionan el contenido.

## Cómo está organizado

```
src/
├── main.jsx            Punto de entrada
├── app/                App.jsx: pantallas y navegación
├── acceso/             Registro e inicio de sesión
├── alumno/             Menú, lección, preguntas, corrección, práctica de mates e ilustraciones
├── esquemas/           Mapas mentales: de cada lección, editables y con IA
├── calendario/         Fechas del alumno y del profesor
├── interfaz/           Iconos y gráficos compartidos
├── docente/            Panel del profesor
├── ia/                 La mascota: chat, modo básico y modelo local
├── herramientas/       Pizarra y panel lateral
├── accesibilidad/      Ajustes y lectura en voz alta
├── idiomas/            Selector de idioma
│   └── traducciones/   Un archivo por idioma
├── datos/              Almacenamiento, sincronización y Supabase
│   └── contenido/      Lecciones, tests y ayuda de la mascota
├── estilos/            CSS
└── assets/             Logo usado por la app
supabase/schema.sql     Base de datos
docs/marca/             Logo original y QR de la app
```

## Dónde cambiar cada cosa

| Quiero… | Archivo |
|---|---|
| Editar lecciones | `src/datos/contenido/lecciones.json` (o el panel del profesor) |
| Editar preguntas de los tests | `src/datos/contenido/tests.json` (o el panel del profesor) |
| Cambiar un texto de la interfaz | `src/idiomas/traducciones/` |
| Añadir un idioma | Crear su archivo en `traducciones/` y añadirlo a `IDIOMAS` en `src/idiomas/i18n.js` |
| Añadir un tipo de actividad | `src/alumno/Actividad.jsx` y `src/alumno/actividades.js` |
| Cambiar colores y aspecto | Variables al principio de `src/estilos/base.css` |
| Cambiar lo que sabe la mascota | `src/datos/contenido/ayudaIA.json` |
| Cambiar los ejercicios de práctica de mates | `src/alumno/practica.js` |
| Cambiar cómo se corrigen las respuestas escritas | `src/alumno/correccion.js` |

Las lecciones pueden llevar `ejemplos` (resueltos paso a paso) y `esquema` (ramas del mapa mental). Las tareas de tipo `problema` se responden escribiendo: la nota la pone siempre una corrección exacta (números, fracciones, «doce», faltas leves de ortografía) y, si la IA avanzada está activa, la mascota explica el error usando los `pasos` de la solución.

## Uso

```bash
npm install
npm run dev      # Desarrollo
npm run build    # Versión para publicar, en dist/
npx cap sync     # Copiar a las apps de iOS y Android
```

Requiere un archivo `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. La base de datos se crea ejecutando `supabase/schema.sql` en Supabase; al actualizar la app, vuelve a ejecutarlo (no borra datos) para tener las fechas del profesor, los ejemplos y las tareas de tipo problema. El PIN del profesor se fija aparte; no lo guardes en el repositorio, que es público:

```sql
select privado.establecer_pin_docente('TU_PIN');
```
