# Conecta Invest — Sitio web

Sitio estático (HTML + CSS + JS, sin build) para conectainvest.cl.

## Estructura
- `index.html` — Home
- `propiedades.html` — Listado de propiedades
- `vercel.json` — URLs limpias (permite entrar a `/propiedades` sin `.html`)

## Deploy
1. Sube este repo a GitHub.
2. En Vercel: **Add New → Project → Import** este repo.
3. Framework Preset: **Other**. No requiere build command ni output directory (deja los campos vacíos o por defecto).
4. Deploy.

## Dominio propio
En el proyecto de Vercel → **Settings → Domains** → agrega `conectainvest.cl` y `www.conectainvest.cl`,
y actualiza los registros DNS donde tengas el dominio (hoy en WordPress) según lo que indique Vercel
(normalmente un registro A a `76.76.21.21` y/o un CNAME a `cname.vercel-dns.com`).

## Páginas pendientes
Únete al equipo, Soy Oficina de Corretaje, Master Broker, Broker Independiente, Vender mi Stock, Contacto
(los links del menú ya apuntan a estos archivos `.html`, falta crearlos).
