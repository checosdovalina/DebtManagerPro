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

  try {
    // El plan gratuito es suficiente para la funcionalidad básica
    // Esta API devuelve la primera colonia asociada al CP
    const response = await fetch(`https://api.copomex.com/query/info_cp/${postalCode}?type=simplified&token=pruebas`);
    
    if (!response.ok) {
      console.error('Error al consultar el código postal:', response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Si hay un error en la respuesta
    if (data.error) {
      console.error('Error en la consulta:', data.message);
      return null;
    }
    
    return {
      cp: postalCode,
      estado: data.estado || '',
      municipio: data.municipio || '',
      colonia: data.colonia || '',
    };
  } catch (error) {
    console.error('Error al consultar información del código postal:', error);
    
    // Plan de respaldo: usar una estructura de datos predefinida para algunos códigos comunes
    const fallbackData = getFallbackPostalCodeData(postalCode);
    if (fallbackData) {
      console.log('Usando datos de respaldo para el código postal:', postalCode);
      return fallbackData;
    }
    
    return null;
  }
}

/**
 * Proporciona datos de respaldo para algunos códigos postales comunes
 * en caso de que la API no esté disponible
 */
function getFallbackPostalCodeData(postalCode: string): PostalCodeData | null {
  const commonPostalCodes: Record<string, PostalCodeData> = {
    '06000': { cp: '06000', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Centro' },
    '06100': { cp: '06100', estado: 'Ciudad de México', municipio: 'Cuauhtémoc', colonia: 'Hipódromo Condesa' },
    '11000': { cp: '11000', estado: 'Ciudad de México', municipio: 'Miguel Hidalgo', colonia: 'Lomas de Chapultepec' },
    '44100': { cp: '44100', estado: 'Jalisco', municipio: 'Guadalajara', colonia: 'Centro' },
    '64000': { cp: '64000', estado: 'Nuevo León', municipio: 'Monterrey', colonia: 'Centro' },
    '72000': { cp: '72000', estado: 'Puebla', municipio: 'Puebla', colonia: 'Centro' },
    '97000': { cp: '97000', estado: 'Yucatán', municipio: 'Mérida', colonia: 'Centro' },
    '31000': { cp: '31000', estado: 'Chihuahua', municipio: 'Chihuahua', colonia: 'Centro' },
    '22000': { cp: '22000', estado: 'Baja California', municipio: 'Tijuana', colonia: 'Centro' },
  };

  return commonPostalCodes[postalCode] || null;
}