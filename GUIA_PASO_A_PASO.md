# Guía Paso a Paso — ERP ZUZA Online y Gratuito

Tu sistema de comandas y agenda ya está creado en esta carpeta y funciona **de inmediato** en modo local (con tus datos precargados hasta `ZRA-290` / `DTE 167`, listo para crear `ZRA-291`).

Para dejarlo **100% online, gratis y multiusuario** (accesible desde cualquier celular o computador), sigue estos 4 pasos:

---

## Paso 1: Probar el sistema en tu computador ahora mismo
1. Abre la carpeta del proyecto (`ERP ZUZA`).
2. Haz doble clic en `index.html` (o ábrelo con Chrome/Edge).
   > **Nota:** Como usa módulos ES (`type="module"`), algunos navegadores bloquean `file://`. Si ves la página en blanco, súbela directo al Paso 3 en **GitHub Pages** o ábrela con Live Server / `python -m http.server`.

---

## Paso 2: Crear tu Base de Datos Gratuita en Supabase
1. Entra a **[supabase.com](https://supabase.com)** y haz clic en **Start your project** (puedes entrar con tu cuenta de GitHub o Google).
2. Crea un nuevo proyecto (ej. `erp-zuza`), elige la región más cercana (ej. *South America - São Paulo*) y guarda la contraseña de la base de datos.
3. Cuando el proyecto termine de crearse (1-2 minutos), en el menú izquierdo ve a **SQL Editor** → **New query**.
4. Abre el archivo `supabase-schema.sql` de esta carpeta, **copia todo su contenido**, pégalo en el editor SQL de Supabase y presiona **Run**.
   - Esto creará automáticamente las tablas (`razones_sociales`, `contactos`, `productos`, `comandas`, `comanda_items`) y cargará tus clientes y productos reales.
5. En el menú izquierdo ve a **Project Settings** (ícono de engranaje) → **API** y copia:
   - **Project URL** (ej: `https://xxxxxxx.supabase.co`)
   - **Project API keys → `anon` `public`**

---

## Paso 3: Publicar la Web App Gratis en Internet (GitHub Pages)
No necesitas instalar nada en tu computador para subirla; puedes hacerlo directo desde la web de GitHub:

1. Crea una cuenta gratuita en **[github.com](https://github.com)** (o inicia sesión si ya tienes una).
2. Haz clic en el botón **+** (arriba a la derecha) → **New repository**.
3. Ponle un nombre (ej. `erp-zuza`), déjalo en **Public** (en el plan gratuito GitHub Pages requiere repositorio público; tus datos reales estarán protegidos en Supabase, no en el código) y haz clic en **Create repository**.
4. En la pantalla del repositorio nuevo, haz clic en el enlace **uploading an existing file**.
5. Arrastra los archivos de tu carpeta **`ERP ZUZA`** (`index.html`, `app.js`, `seed-data.js`, `styles.css`, `supabase-schema.sql`, `GUIA_PASO_A_PASO.md`) dentro del recuadro y presiona **Commit changes** (botón verde abajo).
6. Ahora ve a la pestaña **Settings** (arriba en tu repositorio) → en el menú izquierdo entra a **Pages**.
7. En **Build and deployment → Branch**, cambia `None` por **`main`** (carpeta `/ (root)`) y presiona **Save**.
8. Espera 1 a 2 minutos y recarga esa misma página: arriba aparecerá tu enlace público HTTPS (ej: `https://tu-usuario.github.io/erp-zuza/`). ¡Ese es el link que puedes abrir y guardar en el celular de todo tu equipo!

---

## Paso 4: Conectar la App con Supabase
1. Abre tu enlace web de **ERP ZUZA**.
2. Ve a la pestaña **Conexión Online (Supabase)**.
3. Pega tu **Supabase Project URL** y tu **Supabase Anon Public Key**, y haz clic en **Guardar y Conectar a Supabase**.
4. Haz clic en **Subir Comandas Locales a Supabase** para migrar las comandas `ZRA-286` a `ZRA-290` a la nube.

¡Listo! Desde ese momento:
- Cada comanda (`ZRA-291`, `ZRA-292`, ...) se guarda en la nube en tiempo real.
- Producción y despacho ven la **Agenda** actualizada al instante.
- Administración puede asignar el número de **DTE**, marcar pagos como **Recibido / PAGO** y descargar el **CSV para Excel** en cualquier momento.
