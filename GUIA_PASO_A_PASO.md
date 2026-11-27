# Guía Paso a Paso — ERP ZUZA Online y Gratuito

Tu sistema de comandas y agenda ya está creado en esta carpeta y funciona **de inmediato** en modo local (con tus datos precargados hasta `ZRA-290` / `DTE 167`, listo para crear `ZRA-291`).

Para dejarlo **100% online, gratis y multiusuario** (accesible desde cualquier celular o computador), sigue estos 4 pasos:

---

## Paso 1: Probar el sistema en tu computador ahora mismo
1. Abre la carpeta del proyecto (`ERP ZUZA`).
2. Haz doble clic en `index.html` (o ábrelo con Chrome/Edge).
   > **Nota:** Como usa módulos ES (`type="module"`), algunos navegadores bloquean `file://`. Si ves la página en blanco, súbela directo al Paso 3 (toma 30 segundos en Netlify Drop) o ábrela con Live Server / `python -m http.server`.

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

## Paso 3: Publicar la Web App Gratis en Internet (Netlify Drop o Vercel)
1. Entra a **[app.netlify.com/drop](https://app.netlify.com/drop)** (crea una cuenta gratuita si te la pide).
2. Arrastra la carpeta completa **`ERP ZUZA`** dentro del recuadro de Netlify Drop.
3. En segundos te dará un enlace público HTTPS (ej: `https://erp-zuza.netlify.app`) que puedes abrir y guardar como acceso directo en el celular de todo tu equipo.

*(Alternativa: también puedes subir la carpeta a un repositorio en GitHub y conectarlo gratis a Vercel o GitHub Pages).*

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
