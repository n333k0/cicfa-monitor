// Builds docs/manual/CICFA_Manual.pdf — the CICFA Monitor operations manual.
// Editorial system after the v2 "Tomb" edition: off-black, off-white Helvetica Neue,
// running head + folio, narrow label column, generous margins, colour only for breach.
// Data (weapons, vectors, assets) is imported from the app source so the manual can't drift.
// Run:  npx tsx scripts/build-manual.mjs     (needs docs/manual/shots from scripts/manual-shots.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { AGENTS } from '../src/data/agents.ts';
import { VECTOR_LIST } from '../src/data/vectors.ts';
import { ASSETS, LEVELS } from '../src/sim/intel.ts';

const DIR = 'docs/manual';
const SHOTS = path.resolve(DIR, 'shots');
const img = (n) => `file://${SHOTS}/${n}.jpg`;   // JPEG q88 copies of the PNG captures keep the PDF light
const LOGO = fs.readFileSync(path.join(DIR, 'assets/CICFA_clean_master.svg'), 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<title>.*?<\/title>/, '');
const anatomy = JSON.parse(fs.readFileSync(path.join(SHOTS, 'anatomy.json'), 'utf8'));
const roman = (n) => { const R = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]; let s = ''; for (const [v, r] of R) while (n >= v) { s += r; n -= v; } return s; };
const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// rail icons (same paths as src/components/v2/icons.tsx)
const SVG = (inner) => `<svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICON = {
  map: SVG('<path d="M2 4.5l4.5-2 5 2 4.5-2v11l-4.5 2-5-2-4.5 2z"/><path d="M6.5 2.5v11M11.5 4.5v11"/>'),
  globe: SVG('<circle cx="9" cy="9" r="7"/><ellipse cx="9" cy="9" rx="3" ry="7"/><path d="M2 9h14M3.2 5h11.6M3.2 13h11.6"/>'),
  network: SVG('<circle cx="4" cy="4.5" r="1.8"/><circle cx="14" cy="5" r="1.8"/><circle cx="9" cy="14" r="1.8"/><path d="M5.6 5.3l6.6.2M5 6l3.2 6.4M13.2 6.6L9.9 12.4"/>'),
  sat: SVG('<rect x="7" y="7" width="4" height="4" transform="rotate(45 9 9)"/><path d="M5.5 5.5L2.5 2.5M12.5 12.5l3 3M3.8 7.6l3.8-3.8M10.4 14.2l3.8-3.8"/><path d="M13.5 2.5a2 2 0 0 1 2 2"/>'),
  tilt: SVG('<path d="M1.5 14.5h15L13 7H5z"/><path d="M5.8 10.8h6.4M7.2 7l-1 7.5M10.8 7l1 7.5"/>'),
  index: SVG('<path d="M2.5 4h2M6.5 4h9M2.5 7.3h2M6.5 7.3h9M2.5 10.6h2M6.5 10.6h9M2.5 14h2M6.5 14h9"/>'),
};

// ── page scaffolding ────────────────────────────────────────────────────────
let folio = 1;
const pages = [];
const toc = [];
function page(section, body, { bleed = false, cls = '' } = {}) {
  folio++;
  pages.push(`<section class="page ${cls}">
    ${bleed ? '' : `<header class="rh"><b>CICFA Monitor</b><span>${esc(section)}</span><i>${String(folio).padStart(2, '0')}</i></header>`}
    ${body}
  </section>`);
  return folio;
}
function opener(n, title, lede) {
  return `<div class="opener"><div class="lab"><b>${roman(n)}</b></div><div class="main"><h1>${title}</h1>${lede ? `<p class="lede">${lede}</p>` : ''}</div></div>`;
}
const row = (label, html) => `<div class="row"><div class="lab">${label}</div><div class="main">${html}</div></div>`;
const fig = (name, cap, style = '') => `<figure style="${style}"><img src="${img(name)}"/>${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
function section(n, title, lede, body, opts) { const f = page(title, opener(n, title, lede) + body, opts); toc.push([n, title, f]); return f; }

// ── I · concept ─────────────────────────────────────────────────────────────
section(1, 'Qué es CICFA', 'Cultural Infrastructure Critical Failure Attack. Un monitor de vigilancia en tiempo real sobre el sistema del arte: 2.718 instituciones en el mundo, Buenos Aires en el centro, observadas por una flota de armas ciberculturales.', `
  ${row('Obra', `<p>CICFA MONITOR es una pieza que adopta la estética de las salas de operaciones —la vista de dios, el mapa que todo lo ve, la telemetría que nunca duerme— y la dirige hacia museos, galerías, fundaciones, bienales y espacios autogestionados. La pantalla no informa: escenifica. Cada operación que cruza el mapa ataca la <em>arquitectura simbólica</em> de una institución —su texto curatorial, su lista de donantes, su autoridad— nunca sus sistemas.</p>
  <p>La plataforma combina dos capas que conviven en la misma pantalla y nunca se mezclan: una capa <b>real</b>, construida con fuentes abiertas (dónde está cada institución, cuándo abre, quién la dirige, cómo se ve desde el satélite y desde la calle), y una capa de <b>operaciones</b>, donde las armas del Cyber Weapons Lab actúan sobre el monitor.</p>`)}
  ${row('Edición', `<p>Este manual documenta la <b>Edición II</b> (<span class="mono">/v2</span>): off-black, Helvetica, jerarquía tipográfica de índice editorial, color solo donde es necesario. La Edición I —terminal monoespaciada, rayas glitch— sigue disponible en la raíz del sitio.</p>`)}
  ${row('Acceso', `<p class="mono">n333k0.github.io/cicfa-monitor/v2/</p>`)}
  ${fig('home', 'Edición II · vista MAP, estado inicial')}
`);

// ── II · anatomy ────────────────────────────────────────────────────────────
const ANAT = [
  ['brand', 'Marca + vistas', 'Logo ASCII (figlet Caligraphy2) y selector Map · Globe · Network.'],
  ['lab', 'Cyber Weapons Lab', 'Las diez armas: estado, golpes acumulados, codename y nodo de origen.'],
  ['hot', 'Most-Targeted', 'Las 30 instituciones más golpeadas. Click → Target Profile.'],
  ['region', 'Region Filter', 'Siete regiones; apagar una retira sus instituciones y operaciones del mapa.'],
  ['buffer', 'Signal Buffer // Raw', 'Cascada de señal cruda: dirección, prioridad, operación, objetivo simbólico, checksum.'],
  ['cls', 'Franja de clasificación', 'REC + reloj UTC, código de la obra y teletipo de fuentes vivas.'],
  ['coord', 'Coordenadas', 'Centro de la vista en MGRS real, grados-minutos-segundos y altitud de cámara.'],
  ['spec', 'Spec block', 'Totales de la corrida: operaciones, eventos, ritmo, resultados, volumen exfiltrado.'],
  ['telemetry', 'Threat Telemetry', 'Distribución por vector. Click en un vector para filtrarlo.'],
  ['feed', 'Event Stream', 'Interceptación en vivo de cada operación resuelta.'],
  ['rail', 'Menú de íconos', 'Map, Globe, Network, Satélite, Tilt, Master Index.'],
  ['ticker', 'Teletipo', 'Las últimas operaciones en una línea continua.'],
  ['exfil', 'Exfil total', 'Volumen simbólico acumulado extraído de los registros.'],
];
const markers = ANAT.map(([k], i) => { const r = anatomy[k]; if (!r) return ''; return `<span class="mk" style="left:${(r[0] / 1680) * 100}%;top:${(r[1] / 945) * 100}%">${i + 1}</span>`; }).join('');
section(2, 'Anatomía de la pantalla', 'Dos columnas espejadas sobre el mapa: a la izquierda quién ataca y a quién; a la derecha cuánto, cómo y en qué orden. En el centro, el territorio.', `
  <figure class="anat"><img src="${img('home')}"/>${markers}</figure>
  <div class="legend">${ANAT.map(([, t, d], i) => `<div class="lg"><span class="mk s">${i + 1}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>
`);

// ── III · cyber weapons lab ─────────────────────────────────────────────────
const vg = Object.fromEntries(VECTOR_LIST.map((v) => [v.id, v]));
const STATUS = { live: 'LIVE — opera según su cadencia', degraded: 'DEGRADED — opera con fallas (≈60% de sus disparos)', idle: 'IDLE — armada, sin cadencia propia; dispara solo si un agente la acciona', offline: 'OFFLINE — fuera de servicio' };
const CONN = { simulation: 'ENGINE', webhook: 'WEBHOOK', mcp: 'MCP' };
section(3, 'Cyber Weapons Lab', 'Diez armas, cada una con un nombre de guerra, una doctrina (codename), un nodo de origen en el mapa, un conector y un repertorio de vectores. Son los operadores de la obra.', `
  <table class="idx">
    <thead><tr><th>#</th><th>Arma</th><th>Codename</th><th>Origen</th><th>Vectores</th><th>Cad.</th><th>Con.</th><th>Estado</th></tr></thead>
    <tbody>${AGENTS.map((a, i) => `<tr><td>${roman(i + 1)}</td><td><b>${esc(a.handle)}</b></td><td>${esc(a.codename)}</td><td>${esc(a.originLabel)}</td><td class="gl">${a.vectors.map((v) => `<span title="${vg[v].label}">${vg[v].glyph}</span> ${vg[v].label}`).join('<br/>')}</td><td>${a.cadence || '—'}</td><td>${CONN[a.connector] ?? a.connector}</td><td class="${a.status === 'degraded' ? 'crit' : ''}">${a.status.toUpperCase()}</td></tr>`).join('')}</tbody>
  </table>
  <div class="cols2">
    ${row('Cadencia', '<p>Operaciones por minuto que el arma intenta por su cuenta (×1,9 de actividad global). Una cadencia en blanco significa que el arma no dispara sola: espera a un agente.</p>')}
    ${row('Estado', `<p>${Object.values(STATUS).join('<br/>')}</p>`)}
    ${row('Conector', '<p><b>ENGINE</b> — el motor local de la obra decide objetivo y vector. <b>WEBHOOK</b> y <b>MCP</b> — el arma recibe órdenes de un agente externo (ver IV).</p>')}
    ${row('Interacción', '<p>Click en un arma: la selecciona y abre sus controles — <b>Deploy</b> (disparo inmediato), <b>Solo</b> (el mapa muestra solo sus operaciones), <b>Bring online / Take offline</b>.</p>')}
  </div>
`);

// ── IV · agents on the VPS ──────────────────────────────────────────────────
section(4, 'Agentes en el VPS', 'Cada arma puede quedar conectada a un agente autónomo que corre sin guion en el servidor de CICFA. El agente elige, decide y escribe; el monitor hace visible lo que hizo.', `
  <div class="arch">
    <div class="box"><b>VPS · CICFA</b><span>agentes autónomos<br/>modo godmode · sin guion</span></div><i>→</i>
    <div class="box"><b>Agente ↔ Arma</b><span>un agente por arma<br/>BOYCOTTWARE™, META_RANSOM…</span></div><i>→</i>
    <div class="box"><b>Feed de operaciones</b><span>WebSocket · postMessage<br/>window.CICFA.inject</span></div><i>→</i>
    <div class="box"><b>Motor del monitor</b><span>valida · lanza · resuelve<br/>registra · cuenta</span></div><i>→</i>
    <div class="box"><b>Pantalla</b><span>arco · píxel · anillo<br/>stream · telemetría · perfil</span></div>
  </div>
  ${row('Godmode', '<p>Un agente “unleashed” opera con autonomía total dentro de su arma: decide <b>a quién</b> (cualquiera de las 2.718 instituciones del índice), <b>con qué</b> (uno de sus vectores), <b>cuándo</b> (su propio ritmo), <b>con qué fuerza</b> (severidad 1–5) y <b>con qué palabras</b> (la línea que aparece en el Event Stream). Puede leer la telemetría y el Most-Targeted para elegir su próxima jugada, insistir sobre un objetivo o cambiar de doctrina.</p>')}
  ${row('Cadena', '<p>El agente publica cada operación en el feed. El motor la valida (arma e institución deben existir), la lanza desde el nodo de origen del arma, la hace viajar por el mapa, la resuelve y la deja asentada en el registro, el contador de golpes, el dossier de la institución y la telemetría. Una operación inyectada es indistinguible, en pantalla, de una del motor local.</p>')}
  ${row('Reglas de enfrentamiento', '<p>El único territorio de las armas es el monitor. Los agentes escriben en el feed de CICFA y en ningún otro lugar: no envían tráfico a las instituciones, no tocan sus redes, sus sitios ni sus cuentas. Lo único que la plataforma toma del mundo son fuentes abiertas, de solo lectura (ver XV). La violencia sucede en la representación — ahí es donde la obra la pone.</p>')}
  ${row('Estados', '<p>Un arma con conector WEBHOOK o MCP figura IDLE hasta que su agente la acciona. Al recibir operaciones pasa a LIVE en el Cyber Weapons Lab.</p>')}
`);

// ── V · injection protocol ──────────────────────────────────────────────────
section(5, 'Protocolo de inyección', 'Lo que un agente envía para que una operación exista. Cinco campos; dos obligatorios.', `
  <pre class="code">{
  "agentId":  "mercado",                 <span>// arma que dispara (obligatorio)</span>
  "targetId": "malba",                   <span>// institución del índice (obligatorio)</span>
  "vector":   "exfiltration",            <span>// uno de los 10 vectores</span>
  "severity": 4,                         <span>// 1 – 5</span>
  "line":     "donor-list pull from MALBA · Buenos Aires"
}</pre>
  ${row('Canales', `<p><b>WebSocket</b> — el monitor se suscribe a un feed (<span class="mono">attachWebSocketFeed(url)</span>); cada mensaje JSON es una operación.<br/><b>postMessage</b> — una página anfitriona envía <span class="mono">{ type: "cicfa:inject", payload }</span>.<br/><b>Consola / script</b> — <span class="mono">window.CICFA.inject(payload)</span>.</p>`)}
  ${row('Completado', '<p>Lo que el agente no define lo completa el motor: vector según el repertorio del arma, severidad según el vector (RANSOM pega más fuerte), línea con uno de los verbos del vector. Arma o institución inexistentes: la operación se rechaza.</p>')}
  ${row('Vida de una operación', `<table class="idx sm"><tbody>
    <tr><td><b>INFLIGHT</b></td><td>Sale del nodo de origen. Viaja ~2,2 s + 0,9 ms por km + variación. En el mapa: arco + píxel con su glifo.</td></tr>
    <tr><td><b>IMPACT</b></td><td>Llega. Se suma un golpe a la institución y al arma; crece su anillo.</td></tr>
    <tr><td><b>RESOLVED</b></td><td>1,1 s después se decide el resultado y entra al Event Stream, al Attack Log del dossier y a la telemetría.</td></tr></tbody></table>`)}
  ${row('Resultado', '<p>Vulnerabilidad = 0,35 + 0,06 × severidad. Con probabilidad 0,45 × vulnerabilidad: <b class="crit">breach</b>. Hasta la vulnerabilidad completa: <b>exposed</b> si el vector es EXFIL, si no <b>contained</b>. El resto: <b>blocked</b>.</p>')}
  ${row('Prueba', '<p>Verificado el 2 de noviembre de 2026: la operación de arriba, inyectada en la Edición II, salió de BUENOS AIRES MESH, golpeó MALBA con EXFIL severidad 4 y apareció con su propia línea.</p>')}
`);

// ── VI · vectors ────────────────────────────────────────────────────────────
const assetOf = Object.fromEntries(ASSETS.map((a) => [a.vector, a]));
section(6, 'Vectores', 'Diez maneras de atacar una institución sin tocarla. Cada vector tiene un glifo —el que acompaña al píxel en el mapa y a cada línea del stream— y apunta a un activo simbólico.', `
  <table class="idx vec">
    <thead><tr><th></th><th>Vector</th><th>Id</th><th>Activo</th><th>Si prospera</th><th>Verbos</th><th>Ed. I</th></tr></thead>
    <tbody>${VECTOR_LIST.map((v) => { const a = assetOf[v.id]; return `<tr><td class="glyph">${v.glyph}</td><td><b>${v.label}</b></td><td class="mono">${v.id}</td><td>${a?.asset ?? ''}</td><td>${a?.hit ?? ''}</td><td class="verbs">${v.verbs.join(' · ')}</td><td><i class="sw" style="background:${rgb(v.color)}"></i></td></tr>`; }).join('')}</tbody>
  </table>
  ${row('Peso', '<p>Cada arma elige entre sus vectores con un peso propio de cada uno: RECON y LURE son frecuentes; RANSOM y MANIFEST, raros y pesados. En la Edición I cada vector tiene un color; en la Edición II todo es off-white y solo la brecha es roja.</p>')}
  ${fig('packets-c', 'Píxeles en vuelo: cabeza + estela de dos píxeles y el glifo del vector (☢ ransom, ✉ lure, ◇ recon…)', 'margin-left:40mm')}
`);

// ── VII · outcomes & threat ─────────────────────────────────────────────────
section(7, 'Resultados y amenaza', 'Cómo termina cada operación y cómo se acumula sobre una institución.', `
  ${row('Resultados', `<table class="idx sm"><tbody>
    <tr><td class="crit"><b>breach</b></td><td>La operación prospera. El activo del vector cambia de estado (OVERWRITTEN, LOCKED, EXFILTRATED…). Único resultado en rojo.</td></tr>
    <tr><td><b>exposed</b></td><td>Solo EXFIL: el registro quedó expuesto. Suma al volumen exfiltrado.</td></tr>
    <tr><td><b>contained</b></td><td>Hubo contacto; la institución lo contuvo. El activo queda PROBED.</td></tr>
    <tr><td><b>blocked</b></td><td>Rechazada en el borde.</td></tr></tbody></table>`)}
  ${row('Nivel de amenaza', `<p>Puntaje = golpes + 2 × brechas.</p><table class="idx sm"><tbody>${LEVELS.map((l, i) => `<tr><td class="${i >= 3 ? 'crit' : ''}"><b>${l}</b></td><td class="mono">${['0 – 1', '2 – 4', '5 – 8', '9 – 14', '15 +'][i]}</td><td class="mono bar">${'█'.repeat([1, 4, 8, 13, 20][i])}${'░'.repeat(20 - [1, 4, 8, 13, 20][i])}</td></tr>`).join('')}</tbody></table>`)}
  ${row('Countdown to nothing', '<p>Cada institución tiene su propio plazo —entre 45 segundos y 5 minutos— que corre en el dossier hasta llegar a cero y resolverse en <b>NOTHING HAPPENED</b>. Después vuelve a empezar. La amenaza nunca se cumple; solo se repite.</p>')}
  ${row('Lenguaje institucional', '<p>El texto con que una institución se describe a sí misma se degrada en el dossier a medida que acumula brechas: hasta un 55 % de sus caracteres son reemplazados por █ ▓ ▒ ░ # % & @. La autoridad del texto se disuelve a la vista.</p>')}
  ${row('Activos simbólicos', `<table class="idx sm"><tbody>${ASSETS.map((a) => `<tr><td><b>${a.asset}</b></td><td>${vg[a.vector].glyph} ${vg[a.vector].label}</td><td>INTACT → PROBED → ${a.hit}</td></tr>`).join('')}</tbody></table>`)}
`);

// ── VIII · threat telemetry ─────────────────────────────────────────────────
section(8, 'Threat Telemetry', 'La columna derecha: el estado de la corrida en números, la mezcla de vectores y la interceptación en vivo.', `
  <div class="split"><figure class="tall"><img src="${img('col-r')}"/></figure><div>
    ${row('Spec block', `<table class="idx sm"><tbody>
      <tr><td><b>Institutions</b></td><td>Tamaño del índice (2.718).</td></tr>
      <tr><td><b>Operations live</b></td><td>Armas LIVE o DEGRADED sobre el total.</td></tr>
      <tr><td><b>In flight</b></td><td>Operaciones viajando ahora mismo.</td></tr>
      <tr><td><b>Events logged</b></td><td>Operaciones lanzadas desde el inicio.</td></tr>
      <tr><td><b>Ops per minute</b></td><td>Ritmo del último minuto.</td></tr>
      <tr><td class="crit"><b>Breaches</b></td><td>Operaciones que prosperaron.</td></tr>
      <tr><td><b>Exposed · Contained · Blocked</b></td><td>El resto de los resultados.</td></tr>
      <tr><td><b>Exfiltrated</b></td><td>Volumen simbólico extraído (EXFIL exposed).</td></tr></tbody></table>`)}
    ${row('Distribución', '<p>Cantidad de operaciones por vector. Cada fila es un filtro: click para apagar o encender ese vector en todo el monitor.</p>')}
    ${row('Event Stream', '<p>Cada línea: <b>hora</b> · <b>glifo del vector</b> · <b>ARMA</b> línea de la operación · <b>resultado</b>. La más nueva entra abajo; click en una línea abre el dossier de la institución.</p>')}
  </div></div>
`);

// ── IX · map ────────────────────────────────────────────────────────────────
section(9, 'Mapa', 'La vista principal. Un mundo de líneas finas que se convierte en ciudad al acercarse.', `
  ${fig('city', 'Buenos Aires a nivel ciudad: calles, barrios y las instituciones con nombre')}
  <div class="cols2">
    ${row('Capas', '<p>Costas, fronteras y graticula a escala mundial; al acercarse, la ciudad (OpenFreeMap): calles por jerarquía, agua, parques, edificios y nombres. Los puntos blancos son las 2.718 instituciones; a partir de cierto zoom todas llevan nombre.</p>')}
    ${row('Marcas', '<p><b>Anillo rojo</b> — institución golpeada; crece con los golpes. <b>Arco</b> — trayecto de una operación. <b>Píxel + glifo</b> — la operación en vuelo. <b>Nombre en rojo</b> — nodo de origen de un arma. <b>▣ celeste</b> — cámara pública de tránsito.</p>')}
    ${row('Selección', '<p>Click en una institución: el mapa vuela hacia ella, traza arcos desde sus agresores y líneas a sus seis vecinas más cercanas, y abre el Target Profile.</p>')}
    ${row('Cámaras', '<p>Donde existe un catálogo oficial y abierto (Londres, Los Ángeles, San Francisco, San Diego, Austin, Singapur), las cámaras de tránsito aparecen sobre el mapa; al pasar el mouse se ve su imagen en vivo.</p>')}
  </div>
`);
page('Satélite + Tilt', `
  ${opener(10, 'Satélite y Tilt', 'Los dos controles de cámara del menú de íconos.')}
  ${fig('sat-tilt', 'Palermo, Buenos Aires: imagen satelital real con la cámara inclinada')}
  <div class="cols2">
    ${row(`<span class="ic">${ICON.sat}</span> Satélite`, '<p>Reemplaza el fondo por imagen satelital real (Esri World Imagery), desaturada para que las líneas del monitor sigan mandando. Tecla <b>S</b>.</p>')}
    ${row(`<span class="ic">${ICON.tilt}</span> Tilt`, '<p>Inclina la cámara 50°: la vista oblicua de dios sobre la ciudad. Tecla <b>T</b>.</p>')}
  </div>
`);
toc.push([10, 'Satélite y Tilt', folio]);

// ── XI · globe & network ────────────────────────────────────────────────────
section(11, 'Globo y Red', 'Dos maneras más de mirar lo mismo.', `
  <div class="pair ctr">${fig('globe-c', 'Globo')}${fig('network-c', 'Red')}</div>
  <div class="cols2">
    ${row(`<span class="ic">${ICON.globe}</span> Globo`, '<p>Planeta rojo: océano oscuro, tierra carmesí, costas brillantes y atmósfera. Gira despacio sobre el Atlántico. Nombres de países y de las ciudades donde se concentran instituciones, con su cantidad. Los arcos se levantan sobre la superficie; lo que pasa por detrás no se ve.</p>')}
    ${row(`<span class="ic">${ICON.network}</span> Red`, '<p>El mismo conflicto como grafo: armas en el centro, regiones en un anillo y las 48 instituciones más golpeadas, unidas por quién las atacó. Las distancias son de fuerza, no de geografía.</p>')}
  </div>
`);

// ── XII–XIII · target profile ───────────────────────────────────────────────
section(12, 'Target Profile', 'El dossier de una institución. Se abre con un click en el mapa, en Most-Targeted, en el Event Stream o en el Master Index. Arriba lo real; abajo la operación.', `
  <div class="pair">${fig('profile-top', 'Encabezado + inteligencia de fuentes abiertas')}${fig('profile-real2', 'Registro institucional + reconocimiento')}</div>
  ${row('Encabezado', '<p>Número en el índice (0042 of 2,718), tipo y ciudad, nombre. Ficha: LAT · LON · PRM (prominencia ◆◆◆◆◇) · HIT (golpes) · SCN (escena). ◂ ▸ recorre el Most-Targeted; ✕ cierra.</p>')}
  ${row('Open source intelligence', '<p>De OpenStreetMap, en vivo: si está abierta ahora, horario, dirección, operador, año de fundación, accesibilidad, entrada libre o paga, teléfono, si es patrimonio protegido, descripción y enlaces.</p>')}
  ${row('Institutional record', '<p>De Wikidata: tipo, fundación, visitantes por año, tamaño de la colección, arquitecto, dirección, propietario, estilo, Instagram y X.</p>')}
  ${row('Reconnaissance', '<p>Imagen satelital de la manzana con retícula, y hasta cuatro cámaras públicas de tránsito en 2 km, con su imagen en vivo.</p>')}
`);
section(13, 'Target Profile · operación', 'La mitad inferior del dossier registra lo que las armas le hicieron a la institución.', `
  <div class="pair">${fig('profile-street', 'Calle: fotografías geolocalizadas de Wikimedia Commons')}${fig('profile-op', 'Operación, lenguaje institucional, activos, agresores')}</div>
  <div class="cols2">
    ${row('Street level', '<p>Seis fotografías públicas tomadas a menos de 600 m, con distancia y año. Funciona también donde no hay cámaras, como Buenos Aires.</p>')}
    ${row('Operation', '<p>Nivel de amenaza y barra, estado (bajo operación activa / compromiso sospechado / sin contacto), countdown to nothing, golpes · brechas · contenidas · bloqueadas, volumen exfiltrado.</p>')}
    ${row('Dossier', '<p><b>Institutional language</b> que se degrada; <b>Symbolic assets</b> y su estado; <b>Aggressors</b> (qué armas y cuántas veces); <b>Attack log</b> (las últimas diez); <b>Leak sample</b> (offset · activo · hash · etiqueta, sin verificar); <b>Linked nodes</b> (vecinas más cercanas).</p>')}
    ${row('Real / operación', '<p>Los bloques reales llevan una línea fina a la izquierda y nombran su fuente. Todo lo demás pertenece a la operación.</p>')}
  </div>
`);

// ── XIV · master index ──────────────────────────────────────────────────────
section(14, 'Master Index', 'Las 2.718 instituciones como un catálogo impreso.', `
  ${fig('index', 'Master Index · pliego 01 de 16')}
  <div class="cols2">
    ${row(`<span class="ic">${ICON.index}</span> Lectura`, '<p>Número · romano · NOMBRE · ciudad · categoría. Si la institución fue golpeada, la categoría se reemplaza por sus golpes en rojo (2✕). Ordenadas por prominencia y nombre.</p>')}
    ${row('Uso', '<p>89 filas por página, dos páginas por pliego. ◂ ▸ o las flechas del teclado pasan de pliego; Esc cierra; click en un nombre abre su Target Profile.</p>')}
  </div>
`);

// ── XV · symbols ────────────────────────────────────────────────────────────
const SYM = [
  ['Vectores', VECTOR_LIST.map((v) => [v.glyph, v.label, `${assetOf[v.id]?.asset ?? ''}`])],
  ['Interfaz', [['▸', 'Rollover', 'Todo lo clickeable muestra esta flecha al pasar el mouse'], ['◂ ▸', 'Recorrer', 'Anterior / siguiente (dossier, índice)'], ['✕', 'Cerrar', 'Dossier, índice'], ['↗', 'Enlace externo', 'Sitio, Wikidata, OSM, Instagram, X'], ['◆ ◇', 'Prominencia', 'Peso curatorial 1–5 de la institución'], ['● ○', 'Abierto / cerrado', 'Calculado ahora desde el horario de OSM'], ['█ ░', 'Barra de amenaza', 'Veinte celdas'], ['▚', 'Teletipo', 'Separador de operaciones'], ['●', 'REC', 'Grabación: reloj UTC de la sala'], ['⧉', 'OPEN ↗', 'Sobre una imagen: abre la cámara o la foto original']]],
  ['Mapa', [['○', 'Anillo rojo', 'Institución golpeada; el radio crece con los golpes'], ['·', 'Punto blanco', 'Institución'], ['■ ◇', 'Píxel + glifo', 'Operación en vuelo y su vector'], ['⌒', 'Arco', 'Trayecto origen → objetivo'], ['▣', 'Cámara', 'Cámara pública de tránsito'], ['N', 'Nombre rojo', 'Nodo de origen de un arma']]],
  ['Menú', [[ICON.map, 'Map', 'Vista de mapa'], [ICON.globe, 'Globe', 'Planeta rojo'], [ICON.network, 'Network', 'Grafo'], [ICON.sat, 'Satellite', 'Imagen satelital · S'], [ICON.tilt, 'Tilt', 'Cámara oblicua · T'], [ICON.index, 'Master index', 'Catálogo completo']]],
];
section(15, 'Símbolos', 'Todo lo que aparece en pantalla sin palabras.', `
  <div class="sym">${SYM.map(([g, items]) => `<div class="symg"><h3>${g}</h3>${items.map(([s, n, d]) => `<div class="sy"><span class="s">${s}</span><b>${n}</b><span>${d}</span></div>`).join('')}</div>`).join('')}</div>
`);

// ── XVI · sources + editions ────────────────────────────────────────────────
section(16, 'Fuentes y ediciones', 'Lo real de la plataforma es abierto, de solo lectura y sin claves.', `
  <table class="idx sm"><tbody>
    <tr><td><b>OpenStreetMap · Nominatim</b></td><td>Dirección, horarios, operador, accesibilidad, patrimonio</td></tr>
    <tr><td><b>Wikidata</b></td><td>Fundación, visitantes, colección, arquitecto, dirección, redes</td></tr>
    <tr><td><b>Wikimedia Commons</b></td><td>Fotografías geolocalizadas de la calle</td></tr>
    <tr><td><b>Esri World Imagery</b></td><td>Satélite (mapa y reconocimiento)</td></tr>
    <tr><td><b>OpenFreeMap</b></td><td>Calles, agua, parques, edificios y nombres de la ciudad</td></tr>
    <tr><td><b>Natural Earth</b></td><td>Costas, fronteras, tierra y países del globo</td></tr>
    <tr><td><b>TfL · Caltrans · City of Austin · LTA</b></td><td>Cámaras de tránsito públicas (Londres, LA, SF, San Diego, Austin, Singapur)</td></tr>
    <tr><td><b>MGRS</b></td><td>Coordenadas militares reales del centro de la vista</td></tr>
  </tbody></table>
  ${row('Ediciones', '<p><b>Edición I</b> — terminal monoespaciada JetBrains Mono, color por vector, rayas glitch y scanlines. <b>Edición II</b> — índice editorial: Helvetica, off-black / off-white, una sola tinta de alerta.</p>')}
  ${fig('v1-home', 'Edición I · n333k0.github.io/cicfa-monitor', 'margin-left:40mm')}
`);

// ── cover + contents (built last so the TOC has folios) ─────────────────────
const cover = `<section class="page cover">
  <div class="logo">${LOGO}</div>
  <div class="title"><b>CICFA Monitor</b><span>Manual de operaciones</span></div>
  <div class="foot"><span>DWG-CICFA-01</span><span>Edición II</span><span>Buenos Aires · Noviembre 2026</span></div>
</section>`;
const contents = `<section class="page">
  <header class="rh"><b>CICFA Monitor</b><span>Índice</span><i>02</i></header>
  <div class="opener"><div class="lab"></div><div class="main"><h1>Índice</h1></div></div>
  <div class="row"><div class="lab"><b>Master Index</b></div><div class="main"><table class="idx toc"><tbody>
    ${toc.map(([n, t, f]) => `<tr><td class="n">${n}</td><td class="r">${roman(n)}</td><td><b>${t.toUpperCase()}</b></td><td class="f">${String(f + 1).padStart(2, '0')}</td></tr>`).join('')}
  </tbody></table></div></div>
</section>`;
// folios: cover=1, contents=2 → shift content folios by one
const body = pages.map((p) => p.replace(/<i>(\d\d)<\/i>/, (_, d) => `<i>${String(+d + 1).padStart(2, '0')}</i>`)).join('\n');

const CSS = `
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #0d0d0d; }
body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #ece9e2; font-size: 8.2pt; line-height: 1.5; -webkit-font-smoothing: antialiased; }
.page { width: 210mm; height: 297mm; padding: 14mm 16mm 14mm; position: relative; overflow: hidden; page-break-after: always; background: #0d0d0d; }
.rh { display: grid; grid-template-columns: 40mm 1fr auto; font-size: 6.5pt; margin-bottom: 14mm; }
.rh b { font-weight: 700; } .rh i { font-style: normal; }
.opener, .row { display: grid; grid-template-columns: 40mm 1fr; column-gap: 0; }
.opener { margin-bottom: 9mm; }
.opener .lab b { font-size: 7pt; font-weight: 700; }
h1 { font-size: 22pt; line-height: 1.04; font-weight: 700; text-transform: uppercase; letter-spacing: -0.2pt; }
.lede { font-size: 10pt; line-height: 1.42; margin-top: 4mm; max-width: 118mm; }
.row { margin-bottom: 4.2mm; }
.row .lab { font-size: 7pt; font-weight: 700; padding-right: 4mm; }
.row .main p + p { margin-top: 2mm; }
.row p { max-width: 128mm; }
em { font-style: normal; text-decoration: underline; text-underline-offset: 1.5pt; }
.mono { font-family: "JetBrains Mono", Menlo, monospace; font-size: 7pt; }
.crit { color: #e60026 !important; }
figure { margin: 2mm 0 6mm; }
figure img { width: 100%; display: block; }
figcaption { font-size: 6.5pt; color: #8f8c85; margin-top: 1.6mm; }
.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; margin-bottom: 2mm; }
.pair figure { margin: 0 0 4mm; }
.pair figure img { height: 92mm; object-fit: cover; object-position: top left; }
.pair.ctr figure img { height: 92mm; object-position: center; }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; }
.cols2 .row { grid-template-columns: 24mm 1fr; }
.split { display: grid; grid-template-columns: 52mm 1fr; gap: 8mm; }
.split .row { grid-template-columns: 24mm 1fr; }
figure.tall img { width: 52mm; }
/* tables in the index style */
table.idx { width: 100%; border-collapse: collapse; font-size: 6.8pt; line-height: 1.35; margin-bottom: 6mm; }
table.idx th { text-align: left; font-weight: 700; font-size: 6.2pt; padding: 0 2.5mm 2mm 0; }
table.idx td { padding: 1.2mm 2.5mm 1.2mm 0; vertical-align: top; text-transform: uppercase; }
table.idx tbody tr { border-top: 0.25pt solid #262626; }
table.idx.sm td { text-transform: none; font-size: 7.4pt; }
table.idx.sm td:first-child { white-space: nowrap; width: 34mm; }
table.idx td.gl { white-space: nowrap; }
table.idx.vec td.glyph { font-size: 13pt; line-height: 1; width: 8mm; }
table.idx.vec td.verbs { text-transform: none; color: #b9b6ae; font-size: 6.4pt; }
.sw { display: inline-block; width: 5mm; height: 2.4mm; }
.bar { letter-spacing: -0.5pt; font-size: 6pt; }
table.toc td { font-size: 8pt; padding: 1.6mm 3mm 1.6mm 0; }
table.toc td.n { width: 8mm; text-align: right; font-size: 6.5pt; }
table.toc td.r { width: 12mm; font-size: 6.5pt; }
table.toc td.f { text-align: right; width: 10mm; }
pre.code { font-family: "JetBrains Mono", Menlo, monospace; font-size: 7.4pt; line-height: 1.6; margin: 0 0 7mm 40mm; padding: 5mm 6mm; background: #151515; white-space: pre; }
pre.code span { color: #8f8c85; }
/* anatomy */
.anat { position: relative; }
.mk { position: absolute; transform: translate(-30%, -30%); width: 4.2mm; height: 4.2mm; background: #ece9e2; color: #0d0d0d; font-size: 6.2pt; font-weight: 700; display: grid; place-items: center; }
.mk.s { position: static; transform: none; flex: 0 0 auto; }
.legend { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4mm 6mm; margin-top: 3mm; }
.lg { display: flex; gap: 2.5mm; } .lg b { font-size: 7.4pt; } .lg p { font-size: 7pt; line-height: 1.4; }
/* architecture */
.arch { display: flex; align-items: stretch; gap: 2mm; margin: 0 0 9mm 0; }
.arch .box { flex: 1; border: 0.4pt solid #ece9e2; padding: 3mm; display: flex; flex-direction: column; gap: 1.5mm; }
.arch .box b { font-size: 7.4pt; } .arch .box span { font-size: 6.6pt; line-height: 1.4; color: #b9b6ae; }
.arch i { font-style: normal; align-self: center; font-size: 10pt; }
.ic { display: inline-flex; vertical-align: -3pt; margin-right: 1.5mm; }
/* symbols */
.sym { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm 10mm; }
.symg h3 { font-size: 7pt; font-weight: 700; text-transform: uppercase; margin-bottom: 2.5mm; }
.sy { display: grid; grid-template-columns: 11mm 26mm 1fr; align-items: center; border-top: 0.25pt solid #262626; padding: 1.3mm 0; font-size: 7pt; }
.sy .s { font-size: 11pt; line-height: 1; } .sy b { font-weight: 700; }
/* cover */
.cover { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.cover .logo { width: 46mm; } .cover .logo svg { width: 100%; height: auto; display: block; }
.cover .logo svg g { fill: #ece9e2; }
.cover .title { margin-top: 12mm; text-align: center; display: flex; flex-direction: column; gap: 1.2mm; }
.cover .title b { font-size: 11pt; font-weight: 700; } .cover .title span { font-size: 11pt; }
.cover .foot { position: absolute; left: 16mm; right: 16mm; bottom: 14mm; display: flex; justify-content: space-between; font-size: 6.5pt; }
`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>CICFA Monitor — Manual de operaciones</title><style>${CSS}</style></head><body>${cover}${contents}${body}</body></html>`;
fs.writeFileSync(path.join(DIR, 'manual.html'), html);

const b = await chromium.launch();
const pg = await b.newPage();
await pg.goto('file://' + path.resolve(DIR, 'manual.html'), { waitUntil: 'load' });
await pg.waitForTimeout(800);
await pg.pdf({ path: path.join(DIR, 'CICFA_Manual.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
// page previews for review
const n = await pg.evaluate(() => document.querySelectorAll('.page').length);
await pg.setViewportSize({ width: 794, height: 1123 });
fs.mkdirSync(path.join(DIR, 'preview'), { recursive: true });
for (let i = 0; i < n; i++) {
  const el = (await pg.$$('.page'))[i];
  await el.screenshot({ path: path.join(DIR, 'preview', `p${String(i + 1).padStart(2, '0')}.png`) });
}
await b.close();
console.log('pages', n, '→', path.join(DIR, 'CICFA_Manual.pdf'));
