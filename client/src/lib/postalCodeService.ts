export interface PostalCodeData {
  cp: string;
  estado: string;
  municipio: string;
  colonia: string;
}

// Rangos de códigos postales por ciudad/municipio
// Formato: [desde, hasta, estado, municipio]
const CP_RANGES: [number, number, string, string][] = [
  // Ciudad de México
  [1000,  1999,  'Ciudad de México', 'Álvaro Obregón'],
  [2000,  2999,  'Ciudad de México', 'Álvaro Obregón'],
  [3000,  3999,  'Ciudad de México', 'Benito Juárez'],
  [4000,  4999,  'Ciudad de México', 'Coyoacán'],
  [5000,  5999,  'Ciudad de México', 'Cuajimalpa'],
  [6000,  6999,  'Ciudad de México', 'Cuauhtémoc'],
  [7000,  7999,  'Ciudad de México', 'Gustavo A. Madero'],
  [8000,  8999,  'Ciudad de México', 'Iztacalco'],
  [9000,  9999,  'Ciudad de México', 'Iztapalapa'],
  [10000, 10999, 'Ciudad de México', 'La Magdalena Contreras'],
  [11000, 11999, 'Ciudad de México', 'Miguel Hidalgo'],
  [12000, 12999, 'Ciudad de México', 'Milpa Alta'],
  [13000, 13999, 'Ciudad de México', 'Tláhuac'],
  [14000, 14999, 'Ciudad de México', 'Tlalpan'],
  [15000, 15999, 'Ciudad de México', 'Venustiano Carranza'],
  [16000, 16999, 'Ciudad de México', 'Xochimilco'],
  // Estado de México
  [50000, 50999, 'Estado de México', 'Toluca'],
  [52000, 52999, 'Estado de México', 'Huixquilucan'],
  [53000, 54999, 'Estado de México', 'Naucalpan'],
  [55000, 55999, 'Estado de México', 'Ecatepec'],
  [56000, 56999, 'Estado de México', 'Nezahualcóyotl'],
  // Jalisco
  [44000, 44999, 'Jalisco', 'Guadalajara'],
  [45000, 45999, 'Jalisco', 'Zapopan'],
  [46000, 46999, 'Jalisco', 'Lagos de Moreno'],
  [47000, 47999, 'Jalisco', 'San Juan de los Lagos'],
  [49000, 49999, 'Jalisco', 'Ciudad Guzmán'],
  // Nuevo León
  [64000, 64999, 'Nuevo León', 'Monterrey'],
  [65000, 65999, 'Nuevo León', 'Linares'],
  [66000, 66999, 'Nuevo León', 'San Nicolás de los Garza'],
  [67000, 67999, 'Nuevo León', 'Guadalupe'],
  // Coahuila - Torreón y La Laguna
  [27000, 27299, 'Coahuila', 'Torreón'],
  [27300, 27499, 'Coahuila', 'Gómez Palacio'],
  [27500, 27999, 'Coahuila', 'Lerdo'],
  [25000, 25999, 'Coahuila', 'Saltillo'],
  [26000, 26999, 'Coahuila', 'Piedras Negras'],
  // Durango
  [34000, 34999, 'Durango', 'Durango'],
  [35000, 35999, 'Durango', 'Gómez Palacio'],
  // Puebla
  [72000, 72999, 'Puebla', 'Puebla'],
  [73000, 73999, 'Puebla', 'Tehuacán'],
  // Querétaro
  [76000, 76999, 'Querétaro', 'Querétaro'],
  // San Luis Potosí
  [78000, 78999, 'San Luis Potosí', 'San Luis Potosí'],
  // Guanajuato
  [36000, 36999, 'Guanajuato', 'Guanajuato'],
  [37000, 37999, 'Guanajuato', 'León'],
  [38000, 38999, 'Guanajuato', 'Irapuato'],
  // Michoacán
  [58000, 58999, 'Michoacán', 'Morelia'],
  [59000, 59999, 'Michoacán', 'Zamora'],
  // Guerrero
  [39000, 39999, 'Guerrero', 'Chilpancingo'],
  [40000, 40999, 'Guerrero', 'Iguala'],
  // Hidalgo
  [42000, 42999, 'Hidalgo', 'Pachuca'],
  [43000, 43999, 'Hidalgo', 'Tula'],
  // Morelos
  [62000, 62999, 'Morelos', 'Cuernavaca'],
  // Yucatán
  [97000, 97999, 'Yucatán', 'Mérida'],
  // Chihuahua
  [31000, 31999, 'Chihuahua', 'Chihuahua'],
  [32000, 32999, 'Chihuahua', 'Ciudad Juárez'],
  // Sonora
  [83000, 83999, 'Sonora', 'Hermosillo'],
  [84000, 84999, 'Sonora', 'Nogales'],
  // Baja California
  [21000, 21999, 'Baja California', 'Mexicali'],
  [22000, 22999, 'Baja California', 'Tijuana'],
  [23000, 23999, 'Baja California Sur', 'La Paz'],
  // Sinaloa
  [80000, 80999, 'Sinaloa', 'Culiacán'],
  [82000, 82999, 'Sinaloa', 'Mazatlán'],
  // Veracruz
  [91000, 91999, 'Veracruz', 'Xalapa'],
  [94000, 94999, 'Veracruz', 'Veracruz'],
  // Tabasco
  [86000, 86999, 'Tabasco', 'Villahermosa'],
  // Chiapas
  [29000, 29999, 'Chiapas', 'Tuxtla Gutiérrez'],
  [30000, 30999, 'Chiapas', 'Tapachula'],
  // Oaxaca
  [68000, 68999, 'Oaxaca', 'Oaxaca de Juárez'],
  // Aguascalientes
  [20000, 20999, 'Aguascalientes', 'Aguascalientes'],
  // Zacatecas
  [98000, 98999, 'Zacatecas', 'Zacatecas'],
  // Nayarit
  [63000, 63999, 'Nayarit', 'Tepic'],
  // Colima
  [28000, 28999, 'Colima', 'Colima'],
  // Tlaxcala
  [90000, 90999, 'Tlaxcala', 'Tlaxcala'],
  // Campeche
  [24000, 24999, 'Campeche', 'Campeche'],
  // Quintana Roo
  [77000, 77999, 'Quintana Roo', 'Cancún'],
];

// Colonias específicas por código postal exacto
const CP_COLONIAS: Record<string, string> = {
  // Torreón
  '27000': 'Centro', '27010': 'Moderna', '27018': 'Navarro', '27019': 'Torreón Jardín',
  '27020': 'Estrella', '27023': 'Las Villas del Nogalar', '27025': 'Fuentes del Valle',
  '27028': 'Residencial Punta del Este', '27029': 'Colinas de Santiago',
  '27030': 'Antigua Aceitera', '27040': 'Los Ángeles', '27050': 'Los Ángeles',
  '27058': 'Residencial La Hacienda', '27059': 'Las Margaritas',
  '27060': 'Las Américas', '27065': 'Privadas de Anáhuac',
  '27070': 'Cumbres Elite', '27075': 'Jardines de Anáhuac',
  '27080': 'Reserva Santa Elena', '27083': 'Nueva Los Ángeles',
  '27085': 'Las Villas', '27087': 'Hacienda del Bosque',
  '27090': 'Fuentes del Bosque', '27095': 'Villa Olímpica',
  '27100': 'Nueva Aurora', '27105': 'Antigua Aceitera',
  '27110': 'Primero de Mayo', '27120': 'Lucio Blanco',
  '27130': 'Valle Verde', '27140': 'Valle Oriente',
  '27150': 'Valle Dorado', '27160': 'Rinconada Los Fresnos',
  '27170': 'Villa California', '27180': 'Residencial del Norte',
  '27190': 'Ampliación La Rosita', '27200': 'Abastos',
  '27210': 'Torreón Residencial', '27220': 'Privadas de La Hacienda',
  '27250': 'Alamedas', '27260': 'Quintas del Nazas',
  '27268': 'Campestre La Rosita', '27270': 'La Rosita',
  '27277': 'Senderos', '27280': 'San Isidro',
  '27285': 'Nuevo San Isidro', '27290': 'Palmas San Isidro',
  '27294': 'San Luciano', '27296': 'Villas de San Isidro',
  '27298': 'Residencial Villa Jardín',
  // CDMX
  '06000': 'Centro Histórico', '06050': 'Tabacalera',
  '06100': 'Hipódromo Condesa', '06140': 'Condesa',
  '06500': 'Roma Norte', '06700': 'Roma Sur',
  '11560': 'Polanco', '11590': 'Polanco Reforma',
  '04100': 'Del Carmen', '09810': 'Santa Cruz Meyehualco',
  // Guadalajara
  '44160': 'Americana', '44600': 'Colonia Moderna',
  // Monterrey
  '64060': 'Obispado',
  '66220': 'Valle', '66230': 'Del Valle',
};

// Caché en memoria para no relookup el mismo CP
const cache = new Map<string, PostalCodeData>();

function lookupByRange(cp: number): { estado: string; municipio: string } | null {
  for (const [from, to, estado, municipio] of CP_RANGES) {
    if (cp >= from && cp <= to) return { estado, municipio };
  }
  return null;
}

export async function getPostalCodeData(postalCode: string): Promise<PostalCodeData | null> {
  if (!/^\d{5}$/.test(postalCode)) return null;

  // Revisar caché primero
  if (cache.has(postalCode)) return cache.get(postalCode)!;

  const cpNum = parseInt(postalCode, 10);

  // Búsqueda por rango local (cubre cualquier CP en rango, no solo exactos)
  const rangeMatch = lookupByRange(cpNum);
  if (rangeMatch) {
    const result: PostalCodeData = {
      cp: postalCode,
      estado: rangeMatch.estado,
      municipio: rangeMatch.municipio,
      colonia: CP_COLONIAS[postalCode] || '',
    };
    cache.set(postalCode, result);
    return result;
  }

  // Fallback: consultar API de Copomex
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(
      `https://api.copomex.com/query/info_cp/${postalCode}?type=simplified&token=pruebas`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (!data.error && data.estado) {
        const result: PostalCodeData = {
          cp: postalCode,
          estado: data.estado,
          municipio: data.municipio || data.ciudad || '',
          colonia: data.colonia || CP_COLONIAS[postalCode] || '',
        };
        cache.set(postalCode, result);
        return result;
      }
    }
  } catch {
    // timeout o error de red — ignorar silenciosamente
  }

  return null;
}
