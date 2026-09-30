/**
 * Utility for Brazilian Postal Code (CEP) lookup and Address cross-validation.
 * Compares user-provided street/neighborhood/city against official Correios database via ViaCEP.
 */

export interface ViaCepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface CepValidationResult {
  isValid: boolean;
  message: string;
  isMismatch?: boolean;
  officialData?: {
    cep: string;
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
  };
}

/**
 * Normalizes text for comparison by removing accents, special characters,
 * and common street-type prefixes.
 */
export function normalizeAddressText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

const COMMON_PREFIXES = new Set([
  'rua', 'r', 'avenida', 'av', 'alameda', 'al', 'travessa', 'tv',
  'praca', 'estrada', 'rod', 'rodovia', 'dr', 'doutor', 'prof', 'professor',
  'padre', 'pe', 'santo', 'santa', 'sta', 'sto', 'dom', 'vila', 'v'
]);

/**
 * Extracts meaningful keyword tokens from an address string.
 */
export function extractAddressKeywords(address: string): string[] {
  const normalized = normalizeAddressText(address);
  return normalized
    .split(' ')
    .filter(token => token.length >= 3 && !COMMON_PREFIXES.has(token) && isNaN(Number(token)));
}

/**
 * Fetches address data for a given CEP from the ViaCEP API.
 */
export async function fetchViaCep(cep: string): Promise<ViaCepData | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const data: ViaCepData = await response.json();
    if (data.erro) return null;

    return data;
  } catch (error) {
    console.warn('Erro ao consultar ViaCEP:', error);
    return null;
  }
}

/**
 * Compares the user-provided street address, neighborhood, and city with the official CEP data.
 */
export async function validateCepAndAddress(
  cep: string,
  userAddress: string,
  userNeighborhood?: string,
  userCity?: string
): Promise<CepValidationResult> {
  const cleanCep = cep.replace(/\D/g, '');
  
  if (!cleanCep || cleanCep.length !== 8) {
    return {
      isValid: false,
      message: 'CEP inválido. O CEP deve conter exatamente 8 dígitos numéricos (ex: 01426-001).'
    };
  }

  if (!userAddress.trim()) {
    return {
      isValid: false,
      message: 'Por favor, informe a rua/avenida e o número do endereço.'
    };
  }

  // Fetch official data
  const officialData = await fetchViaCep(cleanCep);

  if (!officialData) {
    return {
      isValid: false,
      message: `O CEP ${cep} não foi encontrado na base oficial dos Correios. Por favor, confira o CEP digitado.`
    };
  }

  const officialInfo = {
    cep: officialData.cep,
    logradouro: officialData.logradouro || '',
    bairro: officialData.bairro || '',
    localidade: officialData.localidade || '',
    uf: officialData.uf || ''
  };

  // 1. Verify City Match if user entered city
  if (userCity && userCity.trim() && officialInfo.localidade) {
    const normalizedUserCity = normalizeAddressText(userCity);
    const normalizedOfficialCity = normalizeAddressText(officialInfo.localidade);
    
    // Check if city differs completely
    if (
      normalizedUserCity &&
      normalizedOfficialCity &&
      !normalizedUserCity.includes(normalizedOfficialCity) &&
      !normalizedOfficialCity.includes(normalizedUserCity)
    ) {
      return {
        isValid: false,
        isMismatch: true,
        officialData: officialInfo,
        message: `Inconsistência de cidade: O CEP ${cep} pertence a ${officialInfo.localidade}/${officialInfo.uf}, mas a cidade informada foi "${userCity}". Por favor, ajuste os dados.`
      };
    }
  }

  // 2. Verify Street/Logradouro Match if official CEP has a specific street
  if (officialInfo.logradouro) {
    const officialKeywords = extractAddressKeywords(officialInfo.logradouro);
    const userKeywords = extractAddressKeywords(userAddress);

    // If official logradouro has substantial keywords (e.g. "Oscar Freire", "Paulista", "Bela Cintra")
    if (officialKeywords.length > 0) {
      const hasMatchingKeyword = officialKeywords.some(officialWord => 
        userKeywords.some(userWord => 
          userWord.includes(officialWord) || officialWord.includes(userWord)
        )
      );

      if (!hasMatchingKeyword && userKeywords.length > 0) {
        return {
          isValid: false,
          isMismatch: true,
          officialData: officialInfo,
          message: `Inconsistência detectada: O CEP ${cep} corresponde a "${officialInfo.logradouro}${officialInfo.bairro ? ` (${officialInfo.bairro})` : ''} - ${officialInfo.localidade}/${officialInfo.uf}". O endereço digitado "${userAddress}" não confere com o CEP oficial.`
        };
      }
    }
  }

  return {
    isValid: true,
    message: `Endereço e CEP validados com sucesso com a base dos Correios: ${officialInfo.logradouro || 'Endereço Geral'}, ${officialInfo.bairro || ''} - ${officialInfo.localidade}/${officialInfo.uf}.`,
    officialData: officialInfo
  };
}
