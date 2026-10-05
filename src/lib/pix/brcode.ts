import type { PixKeyType } from '../catalog/types.ts';

/**
 * Utilitário oficial para geração de BR Code / PIX Copia e Cola (Padrão Banco Central do Brasil - BACEN)
 */

interface GeneratePixParams {
  pixKey: string;
  pixKeyType: PixKeyType;
  merchantName?: string;
  merchantCity?: string;
  amount?: number; // Valor em reais (ex: 149.90)
  transactionId?: string; // Identificador da transação (ex: 'PED1234')
}

/**
 * Formata um campo no padrão TLV (Tag-Length-Value) do padrão EMVCo / BACEN
 */
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Normaliza e higieniza strings para o padrão ASCII suportado pelo BACEN (sem acentos e pontuações especiais)
 */
function sanitizeAscii(str: string, maxLength: number): string {
  const normalized = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .trim();
  return normalized.slice(0, maxLength);
}

/**
 * Limpa e padroniza a chave PIX de acordo com seu tipo para o payload oficial
 */
export function cleanPixKeyForPayload(rawKey: string, keyType: PixKeyType): string {
  const trimmed = (rawKey || '').trim();
  if (keyType === 'phone') {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('55')) {
      return `+${digits}`;
    }
    return `+55${digits}`;
  }
  if (keyType === 'cpf' || keyType === 'cnpj') {
    return trimmed.replace(/\D/g, '');
  }
  if (keyType === 'email') {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

/**
 * Formata a chave PIX para exibição visual humanizada no checkout
 */
export function formatPixKeyDisplay(rawKey: string, keyType: PixKeyType): string {
  const clean = (rawKey || '').trim();
  if (!clean) return '';

  if (keyType === 'phone') {
    const digits = clean.replace(/\D/g, '').replace(/^55/, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return clean;
  }

  if (keyType === 'cpf') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }
    return clean;
  }

  if (keyType === 'cnpj') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 14) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
    }
    return clean;
  }

  return clean;
}

/**
 * Rótulo amigável do tipo da chave
 */
export function getPixKeyTypeLabel(keyType: PixKeyType): string {
  switch (keyType) {
    case 'cpf':
      return 'CPF';
    case 'cnpj':
      return 'CNPJ';
    case 'phone':
      return 'Telefone Celular';
    case 'email':
      return 'E-mail';
    case 'random':
      return 'Chave Aleatória';
    default:
      return 'Chave PIX';
  }
}

/**
 * Cálculo do Checksum CRC16 (Polinômio 0x1021, valor inicial 0xFFFF - CCITT)
 */
function calculateCrc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    const code = payload.charCodeAt(i);
    crc ^= (code & 0xff) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload oficial BACEN PIX Copia e Cola (BR Code)
 */
export function generatePixBrcode(params: GeneratePixParams): string {
  const {
    pixKey,
    pixKeyType,
    merchantName = 'LOJA VITRYNE',
    merchantCity = 'SAO PAULO',
    amount,
    transactionId = '***',
  } = params;

  const formattedKey = cleanPixKeyForPayload(pixKey, pixKeyType);
  if (!formattedKey) return '';

  // 00 - Payload Format Indicator (01)
  let payload = formatTlv('00', '01');

  // 26 - Merchant Account Information (GUI + Chave Pix)
  const gui = formatTlv('00', 'br.gov.bcb.pix');
  const key = formatTlv('01', formattedKey);
  payload += formatTlv('26', `${gui}${key}`);

  // 52 - Merchant Category Code (0000 para geral)
  payload += formatTlv('52', '0000');

  // 53 - Transaction Currency (986 = Real BRL)
  payload += formatTlv('53', '986');

  // 54 - Transaction Amount (se fornecido)
  if (amount && amount > 0) {
    payload += formatTlv('54', amount.toFixed(2));
  }

  // 58 - Country Code (BR)
  payload += formatTlv('58', 'BR');

  // 59 - Merchant Name (max 25 chars)
  const cleanName = sanitizeAscii(merchantName, 25) || 'LOJA VITRYNE';
  payload += formatTlv('59', cleanName);

  // 60 - Merchant City (max 15 chars)
  const cleanCity = sanitizeAscii(merchantCity, 15) || 'SAO PAULO';
  payload += formatTlv('60', cleanCity);

  // 62 - Additional Data Field Template (TXID)
  const txidClean = sanitizeAscii(transactionId, 25) || '***';
  const additionalData = formatTlv('05', txidClean);
  payload += formatTlv('62', additionalData);

  // 63 - CRC16 (Tag 63, Length 04)
  payload += '6304';
  const crc = calculateCrc16(payload);

  return `${payload}${crc}`;
}
