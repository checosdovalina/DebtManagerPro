// Servicio para consultar información de códigos postales en México

interface PostalCodeData {
  cp: string;           // Código postal
  estado: string;       // Estado
  municipio: string;    // Municipio o Ciudad
  colonia: string;      // Colonia
  error?: boolean;      // Indicador de error
  message?: string;     // Mensaje de error
}

/**
 * Consulta información de un código postal mexicano
 * 
 * Utiliza la API pública de SEPOMEX (API Copomex)
 * 
 * @param postalCode - El código postal a consultar (5 dígitos)
 * @returns Información del código postal o error
 */
export async function getPostalCodeData(postalCode: string): Promise<PostalCodeData | null> {
  // Valida el formato del código postal (5 dígitos)
  if (!/^\d{5}$/.test(postalCode)) {
    console.error('Formato de código postal incorrecto. Debe ser 5 dígitos.');
    return null;
  }

  // Primero intentamos con los datos de respaldo, que son más rápidos y confiables
  const fallbackData = getFallbackPostalCodeData(postalCode);
  if (fallbackData) {
    console.log('Usando datos locales para el código postal:', postalCode);
    return fallbackData;
  }

  // Si no tenemos datos locales, intentamos con la API
  try {
    console.log('Consultando API para el código postal:', postalCode);
    const response = await fetch(`https://api.copomex.com/query/info_cp/${postalCode}?type=simplified&token=pruebas`);
    
    if (!response.ok) {
      console.error('Error al consultar el código postal:', response.statusText);
      // Devolvemos datos genéricos para demostración
      return {
        cp: postalCode,
        estado: 'México',
        municipio: 'Ciudad o Municipio',
        colonia: 'Colonia',
      };
    }
    
    const data = await response.json();
    
    // Si hay un error en la respuesta
    if (data.error) {
      console.error('Error en la consulta:', data.message);
      // Devolvemos datos genéricos para demostración
      return {
        cp: postalCode,
        estado: 'México',
        municipio: 'Ciudad o Municipio',
        colonia: 'Colonia',
      };
    }
    
    return {
      cp: postalCode,
      estado: data.estado || '',
      municipio: data.municipio || '',
      colonia: data.colonia || '',
    };
  } catch (error) {
    console.error('Error al consultar información del código postal:', error);
    
    // Devolvemos datos genéricos para demostración
    return {
      cp: postalCode,
      estado: 'México',
      municipio: 'Ciudad o Municipio',
      colonia: 'Colonia',
    };
  }
}

/**
 * Proporciona datos de respaldo para algunos códigos postales comunes
 * en caso de que la API no esté disponible
 */
function getFallbackPostalCodeData(postalCode: string): PostalCodeData | null {
  const commonPostalCodes: Record<string, PostalCodeData> = {
    // Ciudad de México y área metropolitana
    '06000': { cp: '06000', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Centro Histórico' },
    '06010': { cp: '06010', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Centro' },
    '06050': { cp: '06050', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Tabacalera' },
    '06100': { cp: '06100', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Hipódromo Condesa' },
    '06140': { cp: '06140', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Condesa' },
    '06500': { cp: '06500', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Roma Norte' },
    '06700': { cp: '06700', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Roma Sur' },
    '11000': { cp: '11000', estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Lomas de Chapultepec' },
    '11560': { cp: '11560', estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Polanco' },
    '11590': { cp: '11590', estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Polanco Reforma' },
    '04000': { cp: '04000', estado: 'Ciudad de México', municipio: 'Coyoacán', colonia: 'Villa Coyoacán' },
    '04100': { cp: '04100', estado: 'Ciudad de México', municipio: 'Coyoacán', colonia: 'Del Carmen' },
    '07000': { cp: '07000', estado: 'Ciudad de México', municipio: 'Gustavo A. Madero', colonia: 'Aragón' },
    '09000': { cp: '09000', estado: 'Ciudad de México', municipio: 'Iztapalapa', colonia: 'Iztapalapa Centro' },
    '09810': { cp: '09810', estado: 'Ciudad de México', municipio: 'Iztapalapa', colonia: 'Santa Cruz Meyehualco' },
    '54050': { cp: '54050', estado: 'Estado de México', municipio: 'Tlalnepantla', colonia: 'Tlalnepantla Centro' },
    '53100': { cp: '53100', estado: 'Estado de México', municipio: 'Naucalpan', colonia: 'Ciudad Satélite' },
    '52760': { cp: '52760', estado: 'Estado de México', municipio: 'Huixquilucan', colonia: 'Interlomas' },
    '56600': { cp: '56600', estado: 'Estado de México', municipio: 'Chalco', colonia: 'Chalco Centro' },
    
    // Guadalajara
    '44100': { cp: '44100', estado: 'Jalisco', municipio: 'Guadalajara', colonia: 'Centro' },
    '44160': { cp: '44160', estado: 'Jalisco', municipio: 'Guadalajara', colonia: 'Americana' },
    '44600': { cp: '44600', estado: 'Jalisco', municipio: 'Guadalajara', colonia: 'Colonia Moderna' },
    '45100': { cp: '45100', estado: 'Jalisco', municipio: 'Zapopan', colonia: 'Zapopan Centro' },
    '45050': { cp: '45050', estado: 'Jalisco', municipio: 'Zapopan', colonia: 'Las Águilas' },
    
    // Monterrey
    '64000': { cp: '64000', estado: 'Nuevo León', municipio: 'Monterrey', colonia: 'Centro' },
    '64060': { cp: '64060', estado: 'Nuevo León', municipio: 'Monterrey', colonia: 'Obispado' },
    '66220': { cp: '66220', estado: 'Nuevo León', municipio: 'San Pedro Garza García', colonia: 'Valle' },
    '66230': { cp: '66230', estado: 'Nuevo León', municipio: 'San Pedro Garza García', colonia: 'Del Valle' },
    
    // Otros centros urbanos importantes
    '72000': { cp: '72000', estado: 'Puebla', municipio: 'Puebla', colonia: 'Centro' },
    '72050': { cp: '72050', estado: 'Puebla', municipio: 'Puebla', colonia: 'La Paz' },
    '97000': { cp: '97000', estado: 'Yucatán', municipio: 'Mérida', colonia: 'Centro' },
    '97070': { cp: '97070', estado: 'Yucatán', municipio: 'Mérida', colonia: 'Itzimná' },
    '31000': { cp: '31000', estado: 'Chihuahua', municipio: 'Chihuahua', colonia: 'Centro' },
    '31100': { cp: '31100', estado: 'Chihuahua', municipio: 'Chihuahua', colonia: 'San Felipe' },
    '22000': { cp: '22000', estado: 'Baja California', municipio: 'Tijuana', colonia: 'Centro' },
    '83000': { cp: '83000', estado: 'Sonora', municipio: 'Hermosillo', colonia: 'Centro' },
    '20000': { cp: '20000', estado: 'Aguascalientes', municipio: 'Aguascalientes', colonia: 'Centro' },
    '34000': { cp: '34000', estado: 'Durango', municipio: 'Durango', colonia: 'Centro' },
    '25000': { cp: '25000', estado: 'Coahuila', municipio: 'Saltillo', colonia: 'Centro' },
    '42000': { cp: '42000', estado: 'Hidalgo', municipio: 'Pachuca', colonia: 'Centro' },
    '58000': { cp: '58000', estado: 'Michoacán', municipio: 'Morelia', colonia: 'Centro' },
    '62000': { cp: '62000', estado: 'Morelos', municipio: 'Cuernavaca', colonia: 'Centro' },
    '76000': { cp: '76000', estado: 'Querétaro', municipio: 'Querétaro', colonia: 'Centro' },
    '78000': { cp: '78000', estado: 'San Luis Potosí', municipio: 'San Luis Potosí', colonia: 'Centro' },
    '86000': { cp: '86000', estado: 'Tabasco', municipio: 'Villahermosa', colonia: 'Centro' },
    '91000': { cp: '91000', estado: 'Veracruz', municipio: 'Xalapa', colonia: 'Centro' },
    '98000': { cp: '98000', estado: 'Zacatecas', municipio: 'Zacatecas', colonia: 'Centro' },
    // Para prueba (código genérico)
    '12345': { cp: '12345', estado: 'Estado de Prueba', municipio: 'Municipio de Prueba', colonia: 'Colonia de Prueba' },
  };

  return commonPostalCodes[postalCode] || null;
}