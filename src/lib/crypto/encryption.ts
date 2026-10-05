import crypto from 'node:crypto';

// Chave mestra de 32 bytes (256 bits)
const DEFAULT_FALLBACK_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function getMasterKey(): Buffer {
  const hexOrRaw = process.env.ENCRYPTION_KEY || DEFAULT_FALLBACK_KEY;
  if (hexOrRaw.length === 64) {
    return Buffer.from(hexOrRaw, 'hex');
  }
  return crypto.createHash('sha256').update(hexOrRaw).digest();
}

/**
 * Criptografa dados sensíveis (Chaves de API do cliente, Tokens da Meta, Chaves PIX)
 * utilizando o padrão AES-256-GCM com IV randômico de 12 bytes e Auth Tag de 16 bytes.
 * Formato retornado: iv.authTag.cipherText (Base64)
 */
export function encryptAES256GCM(plainText: string): string {
  if (!plainText) return '';
  const key = getMasterKey();
  const iv = crypto.randomBytes(12); // 96 bits recomendado para GCM
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

/**
 * Decriptografa dados sensíveis protegidos por AES-256-GCM.
 * Lança erro caso o conteúdo tenha sido adulterado (validação do Auth Tag).
 */
export function decryptAES256GCM(encryptedData: string): string {
  if (!encryptedData) return '';
  const parts = encryptedData.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato inválido de dado criptografado AES-256-GCM');
  }

  const [ivBase64, authTagBase64, cipherBase64] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const cipherBuffer = Buffer.from(cipherBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Blind Indexing (Busca Cega):
 * Gera um hash determinístico HMAC-SHA256 para permitir indexação e busca exata no PostgreSQL
 * (como e-mail do lojista ou handle do comprador) sem expor a informação em texto puro.
 */
export function generateBlindIndex(value: string): string {
  if (!value) return '';
  const secret = process.env.BLIND_INDEX_SECRET || 'vitryne_blind_index_salt_default';
  const normalized = value.trim().toLowerCase();
  return crypto.createHmac('sha256', secret).update(normalized).digest('hex');
}

/**
 * Validação Criptográfica da Assinatura de Webhook da Meta (HMAC-SHA256).
 * Utiliza crypto.timingSafeEqual para blindagem contra ataques de temporização (timing attacks).
 * Janela de tempo de execução < 10ms.
 */
export function verifyMetaWebhookSignature(
  rawPayload: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) return false;

  // Header formato: sha256=abcdef123...
  const [prefix, signatureHash] = signatureHeader.split('=');
  if (prefix !== 'sha256' || !signatureHash) return false;

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawPayload, 'utf8')
    .digest('hex');

  const signatureBuffer = Buffer.from(signatureHash, 'utf8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf8');

  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

/**
 * Mascaramento seguro de chaves de API para exibição na UI
 * Exemplo: sk-proj-1234567890abcdef -> sk-proj-••••••••cdef
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return '';
  const clean = apiKey.trim();
  if (clean.length <= 8) {
    return '••••••••';
  }
  const prefix = clean.slice(0, Math.min(8, Math.floor(clean.length / 4)));
  const suffix = clean.slice(-4);
  return `${prefix}••••••••${suffix}`;
}
