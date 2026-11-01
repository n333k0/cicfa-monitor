import type { Institution, Region } from '../sim/types';
import expandedRaw from './institutions.expanded.json';
import { ARGENTINA } from './argentina';

type Kind = Institution['kind'];
// compact row helper
function i(
  id: string, name: string, city: string, country: string,
  region: Region, lon: number, lat: number, prominence: number, kind: Kind,
): Institution {
  return { id, name, city, country, region, lon, lat, prominence, kind };
}

// A global seed of ~160 art institutions. Coordinates are to building/city level.
// Expandable: the simulation treats this list as the complete target surface,
// so appending rows (or ingesting Wikidata/OSM) simply adds nodes to the map.
const SEED_INSTITUTIONS: Institution[] = [
  // ─── North America ──────────────────────────────────────────────
  i('moma', 'Museum of Modern Art', 'New York', 'USA', 'NA', -73.9776, 40.7614, 5, 'museum'),
  i('met', 'The Met', 'New York', 'USA', 'NA', -73.9632, 40.7794, 5, 'museum'),
  i('whitney', 'Whitney Museum', 'New York', 'USA', 'NA', -74.0088, 40.7396, 4, 'museum'),
  i('guggenheim-ny', 'Guggenheim', 'New York', 'USA', 'NA', -73.9590, 40.7829, 5, 'museum'),
  i('newmuseum', 'New Museum', 'New York', 'USA', 'NA', -73.9927, 40.7222, 3, 'museum'),
  i('momaps1', 'MoMA PS1', 'New York', 'USA', 'NA', -73.9476, 40.7456, 3, 'museum'),
  i('dia-beacon', 'Dia Beacon', 'Beacon', 'USA', 'NA', -73.9622, 41.5009, 3, 'foundation'),
  i('nga-dc', 'National Gallery of Art', 'Washington', 'USA', 'NA', -77.0199, 38.8913, 5, 'museum'),
  i('hirshhorn', 'Hirshhorn', 'Washington', 'USA', 'NA', -77.0229, 38.8880, 4, 'museum'),
  i('aic', 'Art Institute of Chicago', 'Chicago', 'USA', 'NA', -87.6238, 41.8796, 5, 'museum'),
  i('mca-chicago', 'MCA Chicago', 'Chicago', 'USA', 'NA', -87.6219, 41.8976, 3, 'museum'),
  i('sfmoma', 'SFMOMA', 'San Francisco', 'USA', 'NA', -122.4010, 37.7857, 4, 'museum'),
  i('deyoung', 'de Young', 'San Francisco', 'USA', 'NA', -122.4686, 37.7715, 3, 'museum'),
  i('lacma', 'LACMA', 'Los Angeles', 'USA', 'NA', -118.3590, 34.0639, 5, 'museum'),
  i('getty', 'The Getty', 'Los Angeles', 'USA', 'NA', -118.4750, 34.0780, 5, 'museum'),
  i('broad', 'The Broad', 'Los Angeles', 'USA', 'NA', -118.2506, 34.0545, 4, 'museum'),
  i('moca-la', 'MOCA', 'Los Angeles', 'USA', 'NA', -118.2497, 34.0536, 3, 'museum'),
  i('hammer', 'Hammer Museum', 'Los Angeles', 'USA', 'NA', -118.4437, 34.0592, 3, 'museum'),
  i('mfab', 'MFA Boston', 'Boston', 'USA', 'NA', -71.0942, 42.3394, 4, 'museum'),
  i('ica-boston', 'ICA Boston', 'Boston', 'USA', 'NA', -71.0419, 42.3531, 3, 'museum'),
  i('perez', 'Pérez Art Museum', 'Miami', 'USA', 'NA', -80.1863, 25.7858, 3, 'museum'),
  i('walker', 'Walker Art Center', 'Minneapolis', 'USA', 'NA', -93.2886, 44.9684, 3, 'museum'),
  i('menil', 'The Menil Collection', 'Houston', 'USA', 'NA', -95.3980, 29.7376, 3, 'collection'),
  i('mfah', 'MFA Houston', 'Houston', 'USA', 'NA', -95.3899, 29.7261, 3, 'museum'),
  i('kimbell', 'Kimbell Art Museum', 'Fort Worth', 'USA', 'NA', -97.3651, 32.7490, 3, 'museum'),
  i('seattle-am', 'Seattle Art Museum', 'Seattle', 'USA', 'NA', -122.3380, 47.6074, 3, 'museum'),
  i('storm-king', 'Storm King', 'New Windsor', 'USA', 'NA', -74.0569, 41.4245, 2, 'foundation'),
  i('ago', 'Art Gallery of Ontario', 'Toronto', 'Canada', 'NA', -79.3925, 43.6536, 4, 'museum'),
  i('nac-canada', 'National Gallery of Canada', 'Ottawa', 'Canada', 'NA', -75.6989, 45.4294, 3, 'museum'),
  i('mbam', 'MBAM', 'Montréal', 'Canada', 'NA', -73.5796, 45.4986, 3, 'museum'),
  i('vag', 'Vancouver Art Gallery', 'Vancouver', 'Canada', 'NA', -123.1207, 49.2829, 3, 'museum'),
  i('munal', 'MUNAL', 'Mexico City', 'Mexico', 'NA', -99.1390, 19.4361, 3, 'museum'),
  i('tamayo', 'Museo Tamayo', 'Mexico City', 'Mexico', 'NA', -99.1817, 19.4254, 3, 'museum'),
  i('jumex', 'Museo Jumex', 'Mexico City', 'Mexico', 'NA', -99.2050, 19.4406, 3, 'foundation'),
  i('soumaya', 'Museo Soumaya', 'Mexico City', 'Mexico', 'NA', -99.2047, 19.4406, 3, 'museum'),
  i('muac', 'MUAC', 'Mexico City', 'Mexico', 'NA', -99.1840, 19.3045, 3, 'museum'),

  // ─── South / Latin America ──────────────────────────────────────
  i('masp', 'MASP', 'São Paulo', 'Brazil', 'SA', -46.6558, -23.5614, 5, 'museum'),
  i('pinacoteca', 'Pinacoteca', 'São Paulo', 'Brazil', 'SA', -46.6333, -23.5343, 4, 'museum'),
  i('mam-sp', 'MAM São Paulo', 'São Paulo', 'Brazil', 'SA', -46.6565, -23.5874, 3, 'museum'),
  i('inhotim', 'Inhotim', 'Brumadinho', 'Brazil', 'SA', -44.2099, -20.1297, 4, 'foundation'),
  i('mam-rio', 'MAM Rio', 'Rio de Janeiro', 'Brazil', 'SA', -43.1690, -22.9129, 3, 'museum'),
  i('malba', 'MALBA', 'Buenos Aires', 'Argentina', 'SA', -58.4028, -34.5769, 4, 'museum'),
  i('mamba', 'MAMBA', 'Buenos Aires', 'Argentina', 'SA', -58.3700, -34.6205, 3, 'museum'),
  i('bellas-artes-ar', 'MNBA', 'Buenos Aires', 'Argentina', 'SA', -58.3929, -34.5839, 3, 'museum'),
  i('mac-santiago', 'MAC Santiago', 'Santiago', 'Chile', 'SA', -70.6540, -33.4350, 3, 'museum'),
  i('mali', 'MALI', 'Lima', 'Peru', 'SA', -77.0375, -12.0680, 3, 'museum'),
  i('mambo', 'MAMBO', 'Bogotá', 'Colombia', 'SA', -74.0695, 4.6097, 3, 'museum'),
  i('botero', 'Museo Botero', 'Bogotá', 'Colombia', 'SA', -74.0738, 4.5967, 3, 'collection'),
  i('maccsi', 'MACC', 'Caracas', 'Venezuela', 'SA', -66.8792, 10.4870, 2, 'museum'),

  // ─── Europe ─────────────────────────────────────────────────────
  i('louvre', 'Musée du Louvre', 'Paris', 'France', 'EU', 2.3376, 48.8606, 5, 'museum'),
  i('pompidou', 'Centre Pompidou', 'Paris', 'France', 'EU', 2.3522, 48.8606, 5, 'museum'),
  i('orsay', "Musée d'Orsay", 'Paris', 'France', 'EU', 2.3266, 48.8600, 5, 'museum'),
  i('palais-tokyo', 'Palais de Tokyo', 'Paris', 'France', 'EU', 2.2967, 48.8643, 4, 'institute'),
  i('flv', 'Fondation Louis Vuitton', 'Paris', 'France', 'EU', 2.2633, 48.8766, 4, 'foundation'),
  i('tate-modern', 'Tate Modern', 'London', 'UK', 'EU', -0.0994, 51.5076, 5, 'museum'),
  i('tate-britain', 'Tate Britain', 'London', 'UK', 'EU', -0.1277, 51.4911, 4, 'museum'),
  i('national-london', 'National Gallery', 'London', 'UK', 'EU', -0.1283, 51.5089, 5, 'museum'),
  i('serpentine', 'Serpentine', 'London', 'UK', 'EU', -0.1757, 51.5048, 3, 'institute'),
  i('vanda', 'V&A', 'London', 'UK', 'EU', -0.1719, 51.4966, 5, 'museum'),
  i('ica-london', 'ICA London', 'London', 'UK', 'EU', -0.1300, 51.5063, 3, 'institute'),
  i('whitechapel', 'Whitechapel Gallery', 'London', 'UK', 'EU', -0.0714, 51.5159, 3, 'gallery'),
  i('reina-sofia', 'Museo Reina Sofía', 'Madrid', 'Spain', 'EU', -3.6946, 40.4080, 5, 'museum'),
  i('prado', 'Museo del Prado', 'Madrid', 'Spain', 'EU', -3.6922, 40.4138, 5, 'museum'),
  i('thyssen', 'Thyssen-Bornemisza', 'Madrid', 'Spain', 'EU', -3.6946, 40.4160, 4, 'museum'),
  i('macba', 'MACBA', 'Barcelona', 'Spain', 'EU', 2.1667, 41.3830, 3, 'museum'),
  i('guggenheim-bilbao', 'Guggenheim Bilbao', 'Bilbao', 'Spain', 'EU', -2.9340, 43.2687, 5, 'museum'),
  i('rijksmuseum', 'Rijksmuseum', 'Amsterdam', 'Netherlands', 'EU', 4.8852, 52.3600, 5, 'museum'),
  i('vangogh', 'Van Gogh Museum', 'Amsterdam', 'Netherlands', 'EU', 4.8810, 52.3584, 5, 'museum'),
  i('stedelijk', 'Stedelijk', 'Amsterdam', 'Netherlands', 'EU', 4.8797, 52.3579, 4, 'museum'),
  i('boijmans', 'Boijmans', 'Rotterdam', 'Netherlands', 'EU', 4.4723, 51.9145, 3, 'museum'),
  i('pinakothek', 'Pinakothek der Moderne', 'Munich', 'Germany', 'EU', 11.5720, 48.1479, 4, 'museum'),
  i('museum-island', 'Museumsinsel', 'Berlin', 'Germany', 'EU', 13.3972, 52.5212, 5, 'museum'),
  i('hamburger-bahnhof', 'Hamburger Bahnhof', 'Berlin', 'Germany', 'EU', 13.3719, 52.5290, 4, 'museum'),
  i('museum-ludwig', 'Museum Ludwig', 'Cologne', 'Germany', 'EU', 6.9609, 50.9410, 4, 'museum'),
  i('documenta', 'documenta', 'Kassel', 'Germany', 'EU', 9.4924, 51.3127, 4, 'biennial'),
  i('stadel', 'Städel', 'Frankfurt', 'Germany', 'EU', 8.6742, 50.1035, 3, 'museum'),
  i('uffizi', 'Uffizi', 'Florence', 'Italy', 'EU', 11.2558, 43.7678, 5, 'museum'),
  i('vatican', 'Vatican Museums', 'Vatican City', 'Vatican', 'EU', 12.4544, 41.9065, 5, 'museum'),
  i('maxxi', 'MAXXI', 'Rome', 'Italy', 'EU', 12.4667, 41.9286, 3, 'museum'),
  i('venice-biennale', 'La Biennale di Venezia', 'Venice', 'Italy', 'EU', 12.3587, 45.4299, 5, 'biennial'),
  i('guggenheim-venice', 'Peggy Guggenheim', 'Venice', 'Italy', 'EU', 12.3318, 45.4308, 4, 'collection'),
  i('prado-brera', 'Pinacoteca di Brera', 'Milan', 'Italy', 'EU', 9.1880, 45.4719, 4, 'museum'),
  i('hangar-bicocca', 'Pirelli HangarBicocca', 'Milan', 'Italy', 'EU', 9.2167, 45.5203, 3, 'foundation'),
  i('beyeler', 'Fondation Beyeler', 'Basel', 'Switzerland', 'EU', 7.6630, 47.5760, 4, 'foundation'),
  i('kunstmuseum-basel', 'Kunstmuseum Basel', 'Basel', 'Switzerland', 'EU', 7.5929, 47.5547, 4, 'museum'),
  i('kunsthaus-zurich', 'Kunsthaus Zürich', 'Zürich', 'Switzerland', 'EU', 8.5486, 47.3700, 4, 'museum'),
  i('ima-vienna', 'Albertina', 'Vienna', 'Austria', 'EU', 16.3681, 48.2045, 4, 'museum'),
  i('mumok', 'mumok', 'Vienna', 'Austria', 'EU', 16.3590, 48.2033, 3, 'museum'),
  i('belvedere', 'Belvedere', 'Vienna', 'Austria', 'EU', 16.3806, 48.1915, 4, 'museum'),
  i('moderna-museet', 'Moderna Museet', 'Stockholm', 'Sweden', 'EU', 18.0849, 59.3254, 4, 'museum'),
  i('louisiana', 'Louisiana', 'Humlebæk', 'Denmark', 'EU', 12.5420, 55.9690, 4, 'museum'),
  i('smk', 'SMK', 'Copenhagen', 'Denmark', 'EU', 12.5775, 55.6890, 3, 'museum'),
  i('national-oslo', 'Nasjonalmuseet', 'Oslo', 'Norway', 'EU', 10.7205, 59.9115, 4, 'museum'),
  i('munch', 'Munchmuseet', 'Oslo', 'Norway', 'EU', 10.7560, 59.9060, 3, 'museum'),
  i('kiasma', 'Kiasma', 'Helsinki', 'Finland', 'EU', 24.9360, 60.1726, 3, 'museum'),
  i('hermitage', 'State Hermitage', 'St Petersburg', 'Russia', 'EU', 30.3146, 59.9398, 5, 'museum'),
  i('tretyakov', 'Tretyakov Gallery', 'Moscow', 'Russia', 'EU', 37.6208, 55.7415, 4, 'museum'),
  i('pushkin', 'Pushkin Museum', 'Moscow', 'Russia', 'EU', 37.6053, 55.7475, 4, 'museum'),
  i('garage', 'Garage', 'Moscow', 'Russia', 'EU', 37.6017, 55.7290, 3, 'museum'),
  i('national-athens', 'EMST', 'Athens', 'Greece', 'EU', 23.7276, 37.9640, 3, 'museum'),
  i('gulbenkian', 'Gulbenkian', 'Lisbon', 'Portugal', 'EU', -9.1537, 38.7375, 3, 'foundation'),
  i('maat', 'MAAT', 'Lisbon', 'Portugal', 'EU', -9.1945, 38.6957, 3, 'museum'),
  i('national-prague', 'National Gallery Prague', 'Prague', 'Czechia', 'EU', 14.4203, 50.1003, 3, 'museum'),
  i('msn-warsaw', 'MSN Warsaw', 'Warsaw', 'Poland', 'EU', 21.0067, 52.2410, 3, 'museum'),

  // ─── Middle East ────────────────────────────────────────────────
  i('louvre-ad', 'Louvre Abu Dhabi', 'Abu Dhabi', 'UAE', 'ME', 54.3984, 24.5339, 5, 'museum'),
  i('guggenheim-ad', 'Guggenheim Abu Dhabi', 'Abu Dhabi', 'UAE', 'ME', 54.4025, 24.5392, 4, 'museum'),
  i('jameel', 'Jameel Arts Centre', 'Dubai', 'UAE', 'ME', 55.3390, 25.2290, 3, 'institute'),
  i('mathaf', 'Mathaf', 'Doha', 'Qatar', 'ME', 51.4890, 25.3140, 3, 'museum'),
  i('nmoq', 'National Museum of Qatar', 'Doha', 'Qatar', 'ME', 51.5440, 25.2870, 4, 'museum'),
  i('sharjah-art', 'Sharjah Art Foundation', 'Sharjah', 'UAE', 'ME', 55.3835, 25.3573, 3, 'biennial'),
  i('istanbul-modern', 'Istanbul Modern', 'Istanbul', 'Turkey', 'ME', 28.9843, 41.0255, 4, 'museum'),
  i('arter', 'Arter', 'Istanbul', 'Turkey', 'ME', 28.9510, 41.0530, 3, 'foundation'),
  i('pera', 'Pera Museum', 'Istanbul', 'Turkey', 'ME', 28.9743, 41.0310, 3, 'museum'),
  i('salt-beyoglu', 'SALT Beyoğlu', 'Istanbul', 'Turkey', 'ME', 28.9770, 41.0320, 3, 'institute'),
  i('tehran-moca', 'Tehran MoCA', 'Tehran', 'Iran', 'ME', 51.3875, 35.7139, 4, 'museum'),
  i('israel-museum', 'Israel Museum', 'Jerusalem', 'Israel', 'ME', 35.2040, 31.7725, 4, 'museum'),
  i('telaviv-museum', 'Tel Aviv Museum of Art', 'Tel Aviv', 'Israel', 'ME', 34.7870, 32.0770, 3, 'museum'),
  i('sursock', 'Sursock Museum', 'Beirut', 'Lebanon', 'ME', 35.5160, 33.8938, 3, 'museum'),

  // ─── Africa ─────────────────────────────────────────────────────
  i('zeitz', 'Zeitz MOCAA', 'Cape Town', 'South Africa', 'AF', 18.4186, -33.9076, 4, 'museum'),
  i('norval', 'Norval Foundation', 'Cape Town', 'South Africa', 'AF', 18.4210, -34.0760, 3, 'foundation'),
  i('javett', 'Javett-UP', 'Pretoria', 'South Africa', 'AF', 28.2310, -25.7540, 2, 'museum'),
  i('macaal', 'MACAAL', 'Marrakech', 'Morocco', 'AF', -8.0290, 31.6060, 3, 'museum'),
  i('cairo-moma', 'Museum of Modern Egyptian Art', 'Cairo', 'Egypt', 'AF', 31.2245, 30.0420, 2, 'museum'),
  i('national-lagos', 'National Museum Lagos', 'Lagos', 'Nigeria', 'AF', 3.3960, 6.4420, 2, 'museum'),
  i('nubuke', 'Nubuke Foundation', 'Accra', 'Ghana', 'AF', -0.1660, 5.6360, 2, 'foundation'),
  i('rmca', 'AfricaMuseum', 'Tervuren', 'Belgium', 'EU', 4.5160, 50.8300, 3, 'museum'),

  // ─── Asia ───────────────────────────────────────────────────────
  i('mplus', 'M+', 'Hong Kong', 'China', 'AS', 114.1600, 22.3020, 5, 'museum'),
  i('tai-kwun', 'Tai Kwun', 'Hong Kong', 'China', 'AS', 114.1540, 22.2820, 3, 'institute'),
  i('para-site', 'Para Site', 'Hong Kong', 'China', 'AS', 114.2190, 22.2840, 2, 'institute'),
  i('uccabeijing', 'UCCA', 'Beijing', 'China', 'AS', 116.4070, 39.9840, 4, 'foundation'),
  i('nams-china', 'National Art Museum of China', 'Beijing', 'China', 'AS', 116.4040, 39.9250, 4, 'museum'),
  i('m-woods', 'M WOODS', 'Beijing', 'China', 'AS', 116.4990, 39.9080, 2, 'museum'),
  i('powerstation', 'Power Station of Art', 'Shanghai', 'China', 'AS', 121.4860, 31.1880, 4, 'museum'),
  i('long-museum', 'Long Museum West Bund', 'Shanghai', 'China', 'AS', 121.4650, 31.1710, 3, 'museum'),
  i('yuz', 'Yuz Museum', 'Shanghai', 'China', 'AS', 121.4480, 31.1790, 3, 'museum'),
  i('rockbund', 'Rockbund Art Museum', 'Shanghai', 'China', 'AS', 121.4900, 31.2430, 3, 'museum'),
  i('nat-tokyo', 'National Art Center', 'Tokyo', 'Japan', 'AS', 139.7260, 35.6650, 4, 'museum'),
  i('mori', 'Mori Art Museum', 'Tokyo', 'Japan', 'AS', 139.7294, 35.6604, 4, 'museum'),
  i('mot-tokyo', 'MOT Tokyo', 'Tokyo', 'Japan', 'AS', 139.8170, 35.6810, 3, 'museum'),
  i('teamlab', 'teamLab Planets', 'Tokyo', 'Japan', 'AS', 139.7900, 35.6480, 3, 'institute'),
  i('2121', '21_21 Design Sight', 'Tokyo', 'Japan', 'AS', 139.7290, 35.6650, 3, 'institute'),
  i('benesse', 'Benesse Art Site', 'Naoshima', 'Japan', 'AS', 133.9950, 34.4600, 4, 'foundation'),
  i('chichu', 'Chichu Art Museum', 'Naoshima', 'Japan', 'AS', 133.9890, 34.4570, 3, 'museum'),
  i('leeum', 'Leeum', 'Seoul', 'South Korea', 'AS', 126.9990, 37.5380, 4, 'museum'),
  i('mmca', 'MMCA', 'Seoul', 'South Korea', 'AS', 126.9800, 37.5790, 4, 'museum'),
  i('amorepacific', 'Amorepacific Museum', 'Seoul', 'South Korea', 'AS', 126.9640, 37.5290, 3, 'museum'),
  i('national-korea', 'National Museum of Korea', 'Seoul', 'South Korea', 'AS', 126.9800, 37.5240, 4, 'museum'),
  i('national-sg', 'National Gallery Singapore', 'Singapore', 'Singapore', 'AS', 103.8510, 1.2900, 4, 'museum'),
  i('sam', 'Singapore Art Museum', 'Singapore', 'Singapore', 'AS', 103.8500, 1.2970, 3, 'museum'),
  i('gillman', 'Gillman Barracks', 'Singapore', 'Singapore', 'AS', 103.8020, 1.2790, 2, 'gallery'),
  i('macan', 'Museum MACAN', 'Jakarta', 'Indonesia', 'AS', 106.7320, -6.1860, 3, 'museum'),
  i('bacc', 'BACC', 'Bangkok', 'Thailand', 'AS', 100.5300, 13.7460, 3, 'institute'),
  i('moca-bangkok', 'MOCA Bangkok', 'Bangkok', 'Thailand', 'AS', 100.5540, 13.8260, 3, 'museum'),
  i('ngma-delhi', 'NGMA', 'New Delhi', 'India', 'AS', 77.2320, 28.6110, 3, 'museum'),
  i('kiran-nadar', 'Kiran Nadar Museum', 'New Delhi', 'India', 'AS', 77.3030, 28.5700, 3, 'museum'),
  i('csmvs', 'CSMVS', 'Mumbai', 'India', 'AS', 72.8330, 18.9270, 3, 'museum'),
  i('ngma-mumbai', 'NGMA Mumbai', 'Mumbai', 'India', 'AS', 72.8320, 18.9250, 2, 'museum'),
  i('taipei-fam', 'Taipei Fine Arts Museum', 'Taipei', 'Taiwan', 'AS', 121.5250, 25.0720, 3, 'museum'),
  i('national-taiwan', 'NTMoFA', 'Taichung', 'Taiwan', 'AS', 120.6630, 24.1470, 2, 'museum'),
  i('national-manila', 'National Museum', 'Manila', 'Philippines', 'AS', 120.9810, 14.5870, 2, 'museum'),

  // ─── Oceania ────────────────────────────────────────────────────
  i('ngv', 'NGV', 'Melbourne', 'Australia', 'OC', 144.9690, -37.8226, 4, 'museum'),
  i('acca', 'ACCA', 'Melbourne', 'Australia', 'OC', 144.9690, -37.8270, 3, 'institute'),
  i('agnsw', 'Art Gallery of NSW', 'Sydney', 'Australia', 'OC', 151.2170, -33.8688, 4, 'museum'),
  i('mca-australia', 'MCA Australia', 'Sydney', 'Australia', 'OC', 151.2090, -33.8599, 3, 'museum'),
  i('qagoma', 'QAGOMA', 'Brisbane', 'Australia', 'OC', 153.0180, -27.4720, 3, 'museum'),
  i('mona', 'MONA', 'Hobart', 'Australia', 'OC', 147.2570, -42.8060, 4, 'museum'),
  i('nga-australia', 'National Gallery of Australia', 'Canberra', 'Australia', 'OC', 149.1360, -35.3000, 4, 'museum'),
  i('aucklandag', 'Auckland Art Gallery', 'Auckland', 'New Zealand', 'OC', 174.7660, -36.8520, 3, 'museum'),
  i('te-papa', 'Te Papa', 'Wellington', 'New Zealand', 'OC', 174.7820, -41.2905, 3, 'museum'),
  i('christchurch-ag', 'Christchurch Art Gallery', 'Christchurch', 'New Zealand', 'OC', 172.6290, -43.5310, 2, 'museum'),
];

// Merge the curated seed with the researched Wikidata+BA dataset (dedupe by id;
// seed entries win). ~2.5k institutions total.
const _seen = new Set(SEED_INSTITUTIONS.map((x) => x.id));
const _argNew = ARGENTINA.filter((x) => !_seen.has(x.id));
for (const x of _argNew) _seen.add(x.id);
const _extra = (expandedRaw as Institution[]).filter((x) => !_seen.has(x.id));
export const INSTITUTIONS: Institution[] = [...SEED_INSTITUTIONS, ..._argNew, ..._extra];

// Boost the whole Argentine scene so it visibly lights up (targeting is
// prominence-weighted) and tag it for filtering / the focus bias.
function isArgentine(x: Institution): boolean { return x.country === 'Argentina' || x.id.startsWith('ar-'); }
for (const x of INSTITUTIONS) {
  if (isArgentine(x)) {
    x.prominence = Math.max(x.prominence, 4);
    x.tags = Array.from(new Set([...(x.tags ?? []), 'argentina']));
  }
}

/** Argentine institutions — the attack engine biases a share of strikes here. */
export const FOCUS_INSTITUTIONS: Institution[] = INSTITUTIONS.filter(isArgentine);

export const INSTITUTION_INDEX: Record<string, Institution> = Object.fromEntries(
  INSTITUTIONS.map((x) => [x.id, x]),
);
