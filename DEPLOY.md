# Guía de Despliegue en Vercel

## Pasos para desplegar en Vercel

### Opción 1: Desde la interfaz web de Vercel (Recomendado)

1. **Preparar el repositorio Git**
   - Asegúrate de que tu proyecto esté en un repositorio Git (GitHub, GitLab o Bitbucket)
   - Si no tienes un repositorio, créalo en GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin <URL_DE_TU_REPOSITORIO>
     git push -u origin main
     ```

2. **Conectar con Vercel**
   - Ve a [vercel.com](https://vercel.com) e inicia sesión (o crea una cuenta)
   - Haz clic en "Add New Project"
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket
   - Selecciona el repositorio `marketplace-agro`

3. **Configurar el proyecto**
   - **Framework Preset**: Next.js (debería detectarse automáticamente)
   - **Root Directory**: `marketplace-agro` (si tu proyecto está en una subcarpeta)
   - **Build Command**: `npm run build` (o `next build`)
   - **Output Directory**: `.next` (Next.js lo maneja automáticamente)
   - **Install Command**: `npm install`

4. **Configurar Variables de Entorno**
   Agrega las siguientes variables de entorno en la sección "Environment Variables":
   
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://fbjteuenljvsnxwfbspb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianRldWVubGp2c254d2Zic3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MDI3MjUsImV4cCI6MjA3ODk3ODcyNX0.h70B-50cOoglAiWdkdFe1h8W5_Rkw-6aig0VPP81Ts4
   RESEND_API_KEY=tu_clave_api_de_resend_aqui
   ```
   
   **Nota**: 
   - Las variables que empiezan con `NEXT_PUBLIC_` son públicas y accesibles en el cliente
   - `RESEND_API_KEY` es solo para el servidor (no necesita `NEXT_PUBLIC_`)
   - Si no tienes `RESEND_API_KEY`, puedes omitirla (los emails no funcionarán pero el resto sí)

5. **Desplegar**
   - Haz clic en "Deploy"
   - Espera a que termine el build (puede tardar unos minutos)
   - Una vez completado, tendrás una URL como: `https://tu-proyecto.vercel.app`

### Opción 2: Desde la línea de comandos

1. **Instalar Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Iniciar sesión**
   ```bash
   vercel login
   ```

3. **Desplegar**
   ```bash
   cd marketplace-agro
   vercel
   ```
   
   - Sigue las instrucciones en la terminal
   - Cuando pregunte por las variables de entorno, puedes agregarlas después desde el dashboard

4. **Configurar variables de entorno**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add RESEND_API_KEY
   ```

5. **Desplegar a producción**
   ```bash
   vercel --prod
   ```

## Variables de Entorno Requeridas

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | ✅ Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima de Supabase | ✅ Sí |
| `RESEND_API_KEY` | Clave API de Resend para emails | ⚠️ Opcional |

## Verificación Post-Despliegue

1. **Verificar que la aplicación carga correctamente**
   - Visita la URL proporcionada por Vercel
   - Verifica que no hay errores en la consola del navegador

2. **Verificar conexión con Supabase**
   - Intenta iniciar sesión o registrarte
   - Verifica que los productos se cargan correctamente

3. **Verificar logs**
   - En el dashboard de Vercel, ve a la sección "Logs"
   - Revisa que no haya errores críticos

## Solución de Problemas

### Error: "Module not found"
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que `node_modules` no esté en `.gitignore` (no debería estarlo)

### Error: "Environment variable not found"
- Verifica que todas las variables de entorno estén configuradas en Vercel
- Asegúrate de que las variables con `NEXT_PUBLIC_` estén disponibles para producción

### Error: "Build failed"
- Revisa los logs de build en Vercel
- Verifica que no haya errores de TypeScript o ESLint
- Asegúrate de que el comando `npm run build` funcione localmente

### Las imágenes no cargan
- Verifica que `next.config.ts` tenga configurado correctamente `remotePatterns` para Supabase Storage

## Actualizaciones Futuras

Cada vez que hagas `git push` a tu repositorio conectado, Vercel desplegará automáticamente una nueva versión (si tienes el auto-deploy activado).

Para desplegar manualmente:
- Desde el dashboard: Ve a tu proyecto → Deployments → "Redeploy"
- Desde CLI: `vercel --prod`

## Notas Importantes

- El proyecto está configurado para usar Next.js 16
- Las imágenes se sirven desde Supabase Storage
- Los emails requieren `RESEND_API_KEY` para funcionar
- El proyecto usa TypeScript, asegúrate de que no haya errores de tipos antes de desplegar

