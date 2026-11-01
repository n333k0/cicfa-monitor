import type { Institution } from '../sim/types';

// Deep Buenos Aires / Argentina coverage (additive to the curated `ar-` rows
// already in institutions.expanded.json). Coordinates are neighbourhood-level for
// commercial galleries (tagged 'approx-coords'); building-level for museums.
type Kind = Institution['kind'];
function a(
  id: string, name: string, city: string, lon: number, lat: number,
  prominence: number, kind: Kind, scene: string, blurb: string, approx = true,
  extraTags: string[] = [],
): Institution {
  const tags = ['argentina', city.toLowerCase().replace(/\s+/g, '-'), scene, ...extraTags];
  if (approx) tags.push('approx-coords');
  return { id, name, city, country: 'Argentina', region: 'SA', lon, lat, prominence, kind, scene, blurb, tags, source: 'curated' };
}

export const ARGENTINA: Institution[] = [
  // ─── Buenos Aires · commercial galleries (gallery district + Retiro/Recoleta) ──
  a('ar-slyzmud', 'SLYZMUD', 'Buenos Aires', -58.4405, -34.5885, 3, 'gallery', 'blue-chip', 'Contemporary gallery in the Villa Crespo gallery district representing a young Argentine roster.'),
  a('ar-pabellon-4', 'Pabellón 4 Arte Contemporáneo', 'Buenos Aires', -58.4512, -34.5884, 3, 'gallery', 'artist-run', 'Chacarita warehouse space for emerging and mid-career Argentine artists.'),
  a('ar-gachi-prieto', 'Gachi Prieto', 'Buenos Aires', -58.4389, -34.5958, 3, 'gallery', 'blue-chip', 'Villa Crespo gallery with an experimental residency and project programme.'),
  a('ar-praxis', 'Praxis Art', 'Buenos Aires', -58.3869, -34.5908, 3, 'gallery', 'blue-chip', 'Long-running Recoleta gallery trading in modern and contemporary Latin American art.'),
  a('ar-aldo-de-sousa', 'Aldo de Sousa', 'Buenos Aires', -58.3742, -34.6002, 2, 'gallery', 'blue-chip', 'Established downtown gallery with a historical Argentine programme.'),
  a('ar-van-riel', 'Galería Van Riel', 'Buenos Aires', -58.3905, -34.6015, 2, 'gallery', 'blue-chip', 'Historic Buenos Aires gallery active since the mid-20th century.'),
  a('ar-palatina', 'Galería Palatina', 'Buenos Aires', -58.3856, -34.5897, 2, 'gallery', 'blue-chip', 'Recoleta gallery dealing in Argentine masters and modern works.'),
  a('ar-zavaleta-lab', 'Zavaleta Lab', 'Buenos Aires', -58.3862, -34.5912, 2, 'gallery', 'blue-chip', 'Contemporary gallery with spaces bridging Buenos Aires collecting circuits.'),
  a('ar-mite', 'Galería Mite', 'Buenos Aires', -58.4372, -34.5951, 3, 'gallery', 'artist-run', 'Villa Crespo gallery with a sharp contemporary and new-media programme.'),
  a('ar-calvaresi', 'Calvaresi Arte Contemporáneo', 'Buenos Aires', -58.3721, -34.6205, 2, 'gallery', 'blue-chip', 'San Telmo contemporary gallery.'),
  a('ar-document-art', 'Document Art Gallery', 'Buenos Aires', -58.4121, -34.5887, 2, 'gallery', 'blue-chip', 'Gallery focused on Latin American conceptual and contemporary practices.'),
  a('ar-daniel-maman', 'Daniel Maman Fine Art', 'Buenos Aires', -58.4022, -34.5781, 2, 'gallery', 'blue-chip', 'Palermo gallery dealing in modern and contemporary Argentine art.'),
  a('ar-jacques-martinez', 'Galería Jacques Martínez', 'Buenos Aires', -58.3889, -34.5986, 2, 'gallery', 'blue-chip', 'Downtown gallery with a longstanding Argentine programme.'),
  a('ar-mar-dulce', 'Galería Mar Dulce', 'Buenos Aires', -58.4268, -34.5962, 2, 'gallery', 'artist-run', 'Small Palermo gallery for illustration, printmaking and emerging art.'),
  a('ar-selvanegra', 'Selvanegra Galería', 'Buenos Aires', -58.4255, -34.5901, 2, 'gallery', 'artist-run', 'Independent Palermo gallery for emerging contemporary artists.'),
  a('ar-granada', 'Galería Granada', 'Buenos Aires', -58.4398, -34.5897, 2, 'gallery', 'artist-run', 'Villa Crespo project gallery.'),
  a('ar-smart', 'SMART Galería', 'Buenos Aires', -58.4381, -34.5944, 2, 'gallery', 'artist-run', 'Contemporary gallery in the Villa Crespo circuit.'),
  a('ar-henrique-faria-ba', 'Henrique Faria Buenos Aires', 'Buenos Aires', -58.3875, -34.5969, 3, 'gallery', 'blue-chip', 'Buenos Aires outpost of the gallery known for Latin American conceptualism.'),
  a('ar-miau-miau', 'Miau Miau', 'Buenos Aires', -58.4276, -34.5887, 2, 'gallery', 'artist-run', 'Palermo artist-run space for experimental contemporary work.'),
  a('ar-munar', 'Munar Arte', 'Buenos Aires', -58.3802, -34.6281, 3, 'project-space', 'artist-run', 'Barracas multidisciplinary arts centre and project space.'),
  a('ar-la-ene', 'La Ene — Nuevo Museo Energía de Arte Contemporáneo', 'Buenos Aires', -58.4011, -34.6035, 3, 'artist-run', 'artist-run', 'Itinerant artist-run "museum" parodying and probing institutional form.'),
  a('ar-larriviere', 'Fundación Larivière', 'Buenos Aires', -58.3691, -34.6287, 3, 'foundation', 'institutional', 'Photography foundation and collection in La Boca / Barracas.'),
  a('ar-osde', 'Espacio de Arte Fundación OSDE', 'Buenos Aires', -58.3792, -34.5981, 3, 'foundation', 'institutional', 'Corporate-foundation exhibition space in the city centre.'),
  a('ar-telefonica', 'Fundación Telefónica Movistar', 'Buenos Aires', -58.3822, -34.6042, 3, 'foundation', 'institutional', 'Media-art and technology exhibition space downtown.'),
  a('ar-borges', 'Centro Cultural Borges', 'Buenos Aires', -58.3745, -34.5986, 3, 'institute', 'institutional', 'Large cultural centre in the Galerías Pacífico with rotating exhibitions.'),
  a('ar-munar-proa21', 'PROA21', 'Buenos Aires', -58.3631, -34.6346, 3, 'foundation', 'institutional', "Fundación PROA's experimental La Boca annex for younger practices."),
  a('ar-tres-pinos', 'Fundación Tres Pinos', 'Buenos Aires', -58.4288, -34.5779, 2, 'foundation', 'institutional', 'Foundation supporting contemporary Argentine art.'),
  a('ar-andreani', 'Fundación Andreani', 'Buenos Aires', -58.3651, -34.6421, 3, 'foundation', 'institutional', 'Contemporary art foundation in a landmark Barracas building.'),

  // ─── Buenos Aires · public museums & centres ──────────────────────
  a('ar-sivori', 'Museo Eduardo Sívori', 'Buenos Aires', -58.4156, -34.5762, 3, 'museum', 'institutional', 'Municipal museum of Argentine art in the Palermo parks.', false),
  a('ar-palais-glace', 'Palais de Glace', 'Buenos Aires', -58.3924, -34.5842, 3, 'institute', 'institutional', 'Palacio Nacional de las Artes, a Recoleta exhibition hall.', false),
  a('ar-larreta', 'Museo de Arte Español Enrique Larreta', 'Buenos Aires', -58.4561, -34.5583, 2, 'museum', 'institutional', 'Belgrano museum of Spanish art in a historic mansion.', false),
  a('ar-jose-hernandez', 'Museo de Arte Popular José Hernández', 'Buenos Aires', -58.4086, -34.5801, 2, 'museum', 'institutional', 'Museum of Argentine folk and popular art.', false),
  a('ar-quinquela', 'Museo Benito Quinquela Martín', 'Buenos Aires', -58.3596, -34.6389, 3, 'museum', 'institutional', 'La Boca museum of Argentine art in the painter’s former home.', false),
  a('ar-grabado', 'Museo Nacional del Grabado', 'Buenos Aires', -58.3736, -34.6141, 2, 'museum', 'institutional', 'National museum of printmaking.', false),
  a('ar-bicentenario', 'Casa Nacional del Bicentenario', 'Buenos Aires', -58.3996, -34.6093, 3, 'institute', 'institutional', 'National cultural centre with contemporary exhibitions.', false),
  a('ar-cc-san-martin', 'Centro Cultural General San Martín', 'Buenos Aires', -58.3889, -34.6036, 2, 'institute', 'institutional', 'Large municipal cultural centre downtown.', false),
  a('ar-pabellon-bellas-artes', 'Pabellón de las Bellas Artes UCA', 'Buenos Aires', -58.3653, -34.6252, 2, 'institute', 'institutional', 'Puerto Madero university exhibition hall.', false),

  // ─── Rosario / Santa Fe ────────────────────────────────────────────
  a('ar-diego-obligado', 'Diego Obligado Galería', 'Rosario', -60.6389, -32.9478, 2, 'gallery', 'blue-chip', 'Leading contemporary gallery in Rosario.'),
  a('ar-subsuelo', 'Subsuelo', 'Rosario', -60.6401, -32.9442, 2, 'artist-run', 'artist-run', 'Rosario artist-run space.'),
  a('ar-rosa-galisteo', 'Museo Rosa Galisteo de Rodríguez', 'Santa Fe', -60.7001, -31.6321, 2, 'museum', 'institutional', 'Provincial fine-arts museum of Santa Fe.', false),

  // ─── Córdoba ───────────────────────────────────────────────────────
  a('ar-caraffa', 'Museo Emilio Caraffa', 'Córdoba', -64.1869, -31.4181, 3, 'museum', 'institutional', 'Provincial fine-arts museum of Córdoba.', false),
  a('ar-genaro-perez', 'Museo Genaro Pérez', 'Córdoba', -64.1842, -31.4098, 2, 'museum', 'institutional', 'Municipal fine-arts museum of Córdoba.', false),
  a('ar-gran-vidrio', 'El Gran Vidrio', 'Córdoba', -64.1901, -31.4165, 2, 'gallery', 'artist-run', 'Córdoba contemporary gallery and project space.'),
  a('ar-casa-13', 'Casa 13', 'Córdoba', -64.1888, -31.4152, 2, 'artist-run', 'artist-run', 'Historic Córdoba artist-run collective and space.'),

  // ─── La Plata / Mar del Plata / Mendoza / North ───────────────────
  a('ar-macla', 'MACLA — Museo de Arte Contemporáneo Latinoamericano', 'La Plata', -57.9545, -34.9214, 3, 'museum', 'institutional', 'Contemporary Latin American art museum in La Plata.', false),
  a('ar-pettoruti', 'Museo Provincial de Bellas Artes Emilio Pettoruti', 'La Plata', -57.9533, -34.9188, 2, 'museum', 'institutional', 'Provincial fine-arts museum of Buenos Aires province.', false),
  a('ar-mar', 'Museo MAR', 'Mar del Plata', -57.5312, -38.0062, 3, 'museum', 'institutional', 'Provincial contemporary art museum on the Mar del Plata coast.', false),
  a('ar-mmamm', 'Museo Municipal de Arte Moderno de Mendoza', 'Mendoza', -68.8458, -32.8908, 2, 'museum', 'institutional', 'Modern art museum beneath the Plaza Independencia, Mendoza.', false),
  a('ar-mac-salta', 'Museo de Arte Contemporáneo de Salta', 'Salta', -65.4106, -24.7886, 2, 'museum', 'institutional', 'Contemporary art museum of Salta.', false),
  a('ar-timoteo-navarro', 'Museo Timoteo Navarro', 'San Miguel de Tucumán', -65.2041, -26.8285, 2, 'museum', 'institutional', 'Provincial fine-arts museum of Tucumán.', false),

  // ─── fairs / events ───────────────────────────────────────────────
  a('ar-mercado-arte', 'Mercado de Arte Contemporáneo', 'Córdoba', -64.1834, -31.4135, 2, 'fair', 'fair', 'Córdoba contemporary art fair.'),
  a('ar-arteco', 'ArteCo', 'Corrientes', -58.8341, -27.4712, 2, 'fair', 'fair', 'Contemporary art fair of the Argentine Northeast.'),
  a('ar-microferia', 'Microferia / MAPA', 'Buenos Aires', -58.4201, -34.5968, 2, 'fair', 'fair', 'Independent / artist-book and small-format art fair circuit.'),
];
