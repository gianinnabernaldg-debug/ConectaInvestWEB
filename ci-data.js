/* ============================================================
   Conecta Invest — capa de datos compartida (Supabase)
   Usada por: index.html, propiedades.html, proyecto.html
   ============================================================ */

const CI_SUPABASE_URL = 'https://lrlmsmekqlzuyjlvlobj.supabase.co';
const CI_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxybG1zbWVrcWx6dXlqbHZsb2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4NjgzMTAsImV4cCI6MjA5NjQ0NDMxMH0.7pq8lVhgtvvu30h143P0lwmkc1WpX1ua3t4MTCyhB7g';

const CI_HEADERS = { apikey: CI_SUPABASE_KEY, Authorization: `Bearer ${CI_SUPABASE_KEY}` };

// Centroides aproximados por comuna — se usan SOLO si el proyecto no trae lat/lng propio.
const CI_COMUNA_COORDS = {
  'las condes': [-33.4089, -70.5693],
  'vitacura': [-33.3898, -70.5651],
  'lo barnechea': [-33.3500, -70.5167],
  'providencia': [-33.4263, -70.6142],
  'nunoa': [-33.4558, -70.5989], 'ñuñoa': [-33.4558, -70.5989],
  'la reina': [-33.4419, -70.5389],
  'macul': [-33.4881, -70.5975],
  'penalolen': [-33.4831, -70.5306], 'peñalolén': [-33.4831, -70.5306],
  'santiago': [-33.4489, -70.6693], 'santiago centro': [-33.4489, -70.6693],
  'huechuraba': [-33.3667, -70.6333],
  'independencia': [-33.4189, -70.6633],
  'recoleta': [-33.4058, -70.6394],
  'quilicura': [-33.3628, -70.7300],
  'conchali': [-33.3833, -70.6667], 'conchalí': [-33.3833, -70.6667],
  'estacion central': [-33.4569, -70.6968], 'estación central': [-33.4569, -70.6968],
  'maipu': [-33.5167, -70.7500], 'maipú': [-33.5167, -70.7500],
  'pudahuel': [-33.4425, -70.7594],
  'cerrillos': [-33.4989, -70.7089],
  'san miguel': [-33.4958, -70.6503],
  'la florida': [-33.5225, -70.5992],
  'puente alto': [-33.6117, -70.5756],
  'colina': [-33.2014, -70.6725],
  'chicureo': [-33.2814, -70.6819],
  'lampa': [-33.2867, -70.8756],
  'san bernardo': [-33.5928, -70.7000],
  'valparaiso': [-33.0472, -71.6127], 'valparaíso': [-33.0472, -71.6127],
  'vina del mar': [-33.0245, -71.5518], 'viña del mar': [-33.0245, -71.5518],
  'concepcion': [-36.8270, -73.0503], 'concepción': [-36.8270, -73.0503],
};
const CI_DEFAULT_COORDS = [-33.4489, -70.6693]; // Santiago centro

function ciNormalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function ciGetCoords(proyecto) {
  const lat = proyecto.lat ?? proyecto.latitud ?? proyecto.latitude;
  const lng = proyecto.lng ?? proyecto.lon ?? proyecto.longitud ?? proyecto.longitude;
  if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
    return { coords: [Number(lat), Number(lng)], exact: true };
  }
  const ubic = ciNormalize(proyecto.ubicacion);
  for (const key in CI_COMUNA_COORDS) {
    if (ubic.includes(key)) return { coords: CI_COMUNA_COORDS[key], exact: false };
  }
  return { coords: CI_DEFAULT_COORDS, exact: false };
}

function ciSlugify(str) {
  return (str || '')
    .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function ciFormatUF(n) {
  return n != null ? Number(n).toLocaleString('es-CL') + ' UF' : 'Consultar';
}

const CI_DISP_LABEL = { inmediata: 'Entrega inmediata', 'pronta entrega': 'Pronta entrega', futura: 'Entrega futura' };
const CI_DISP_CLASS = { inmediata: 'disp-inmediata', 'pronta entrega': 'disp-pronta', futura: 'disp-futura' };

/** Trae los N proyectos más recientes */
async function ciFetchProyectos(limit) {
  const url = `${CI_SUPABASE_URL}/rest/v1/proyectos?select=id,nombre,ubicacion,tipo,operacion,disponibilidad,inmobiliaria_nombre,imagen_principal,created_at&order=created_at.desc${limit ? `&limit=${limit}` : ''}`;
  const res = await fetch(url, { headers: CI_HEADERS });
  if (!res.ok) throw new Error('No se pudieron cargar los proyectos');
  return res.json();
}

/** Trae unidades disponibles (excluye bodega/estacionamiento) para una lista de proyecto_id */
async function ciFetchUnidadesPorProyectos(ids) {
  if (!ids.length) return {};
  const url = `${CI_SUPABASE_URL}/rest/v1/unidades?select=proyecto_id,nombre,piso,habitaciones,m2,precio_uf,tipo&estado=eq.disponible&proyecto_id=in.(${ids.join(',')})&order=precio_uf.asc`;
  const res = await fetch(url, { headers: CI_HEADERS });
  if (!res.ok) throw new Error('No se pudieron cargar las unidades');
  const list = await res.json();
  const grouped = {};
  list.forEach(u => {
    const t = (u.tipo || '').toLowerCase();
    if (t.includes('bodega') || t.includes('estacionamiento')) return;
    (grouped[u.proyecto_id] = grouped[u.proyecto_id] || []).push(u);
  });
  return grouped;
}

/** Trae el detalle completo (todas las columnas) de un proyecto por id */
async function ciFetchProyectoDetalle(id) {
  const url = `${CI_SUPABASE_URL}/rest/v1/proyectos?select=*&id=eq.${encodeURIComponent(id)}`;
  const res = await fetch(url, { headers: CI_HEADERS });
  if (!res.ok) throw new Error('No se pudo cargar el proyecto');
  const rows = await res.json();
  return rows[0] || null;
}

/** Trae TODAS las unidades (cualquier estado) de un proyecto, para la landing de detalle */
async function ciFetchUnidadesDeProyecto(id) {
  const url = `${CI_SUPABASE_URL}/rest/v1/unidades?select=*&proyecto_id=eq.${encodeURIComponent(id)}&order=precio_uf.asc`;
  const res = await fetch(url, { headers: CI_HEADERS });
  if (!res.ok) throw new Error('No se pudieron cargar las unidades');
  return res.json();
}

/** Construye el HTML de una tarjeta de proyecto (usa las clases .prop-card ya definidas en el sitio) */
function ciCardHTML(p, unidades) {
  const disp = (p.disponibilidad || 'inmediata').toLowerCase();
  const precios = (unidades || []).map(u => Number(u.precio_uf) || 0).filter(x => x > 0);
  const minUF = precios.length ? Math.min(...precios) : null;
  const m2s = (unidades || []).map(u => Number(u.m2) || 0).filter(x => x > 0);
  const minM2 = m2s.length ? Math.min(...m2s) : null;
  const totalDisp = (unidades || []).length;
  const { coords } = ciGetCoords(p);
  const detailUrl = `proyecto.html?id=${encodeURIComponent(p.id)}`;

  return `
    <article class="prop-card" data-id="${p.id}" data-lat="${coords[0]}" data-lng="${coords[1]}" data-title="${(p.nombre||'').replace(/"/g,'&quot;')}" data-price="${ciFormatUF(minUF)}" data-tipo="${(p.tipo||'').toLowerCase()}" data-op="${(p.operacion||'').toLowerCase()}" data-disp="${disp}" data-hab="${(unidades||[]).map(u=>u.habitaciones||0).join(',')}" data-ciudad="${ciNormalize(p.ubicacion)}" data-inmo="${ciNormalize(p.inmobiliaria_nombre)}">
      <div class="prop-media">
        ${p.disponibilidad ? `<span class="badge ${CI_DISP_CLASS[disp] || 'disp-inmediata'}">${CI_DISP_LABEL[disp] || p.disponibilidad}</span>` : ''}
        ${p.operacion ? `<span class="badge op ${/arriendo/i.test(p.operacion) ? 'rent' : ''}">${p.operacion}</span>` : ''}
        <span class="price-tag">${ciFormatUF(minUF)}</span>
        ${p.imagen_principal
          ? `<img src="${p.imagen_principal}" alt="${p.nombre || ''}" loading="lazy">`
          : `<div style="width:100%;height:100%;background:linear-gradient(135deg,var(--navy-900),var(--blue-500));"></div>`}
      </div>
      <div class="prop-body">
        ${p.inmobiliaria_nombre ? `<div class="prop-inmo">${p.inmobiliaria_nombre}</div>` : ''}
        <h3>${p.nombre || 'Proyecto'}</h3>
        <div class="prop-loc"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M12 21s-7-6.1-7-11a7 7 0 0114 0c0 4.9-7 11-7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>${p.ubicacion || ''}</div>
        <div class="prop-specs">
          <span>${totalDisp} unid. disp.</span>
          ${p.tipo ? `<span>${p.tipo}</span>` : ''}
          ${minM2 ? `<span>Desde ${minM2} m²</span>` : ''}
        </div>
        <div class="prop-actions">
          <a href="${detailUrl}#cotizar" class="btn btn-outline btn-sm">Cotizar proyecto</a>
          <a href="${detailUrl}" class="btn btn-navy btn-sm">Ver proyecto</a>
        </div>
      </div>
    </article>`;
}

function ciSkeletonHTML(n) {
  return Array.from({ length: n }).map(() => '<div class="prop-skeleton"></div>').join('');
}

function ciErrorHTML(msg) {
  return `<div class="prop-empty"><div class="prop-empty-icon">⚠️</div><div class="prop-empty-text">${msg}</div></div>`;
}

function ciEmptyHTML(msg, sub) {
  return `<div class="prop-empty"><div class="prop-empty-icon">🔍</div><div class="prop-empty-text">${msg}</div>${sub ? `<div class="prop-empty-sub">${sub}</div>` : ''}</div>`;
}
