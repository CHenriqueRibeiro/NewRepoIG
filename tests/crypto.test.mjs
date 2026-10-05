import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';

// Setup environment variable for test
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.BLIND_INDEX_SECRET = 'vitryne_test_secret';

function encryptAES256GCM(plainText, keyHex) {
  const key = Buffer.from(keyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
}

function decryptAES256GCM(encryptedData, keyHex) {
  const [ivBase64, authTagBase64, cipherBase64] = encryptedData.split('.');
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const cipherBuffer = Buffer.from(cipherBase64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  return decrypted.toString('utf8');
}

function verifyMetaWebhookSignature(rawPayload, signatureHeader, appSecret) {
  if (!signatureHeader || !appSecret) return false;
  const [prefix, signatureHash] = signatureHeader.split('=');
  if (prefix !== 'sha256' || !signatureHash) return false;

  const expectedHash = crypto.createHmac('sha256', appSecret).update(rawPayload, 'utf8').digest('hex');
  const signatureBuffer = Buffer.from(signatureHash, 'utf8');
  const expectedBuffer = Buffer.from(expectedHash, 'utf8');
  if (signatureBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

test('AES-256-GCM Criptografia e Decriptografia de Chave de API BYOK', () => {
  const apiKey = 'sk-proj-abc123xyz456secretkey';
  const encrypted = encryptAES256GCM(apiKey, process.env.ENCRYPTION_KEY);
  assert.notStrictEqual(encrypted, apiKey);

  const decrypted = decryptAES256GCM(encrypted, process.env.ENCRYPTION_KEY);
  assert.strictEqual(decrypted, apiKey);
});

test('AES-256-GCM Detecção de Fraude / Adulteração', () => {
  const original = 'pix_key_vital_secret';
  const encrypted = encryptAES256GCM(original, process.env.ENCRYPTION_KEY);
  const parts = encrypted.split('.');
  
  // Modifica 1 byte do ciphertext
  const tamperedCipher = parts[2].slice(0, -2) + 'AA';
  const tampered = `${parts[0]}.${parts[1]}.${tamperedCipher}`;

  assert.throws(() => {
    decryptAES256GCM(tampered, process.env.ENCRYPTION_KEY);
  });
});

test('Validação de Assinatura Meta Webhook com timingSafeEqual', () => {
  const appSecret = 'meta_secret_test_123';
  const payload = JSON.stringify({ object: 'instagram', entry: [] });
  const validHash = crypto.createHmac('sha256', appSecret).update(payload, 'utf8').digest('hex');
  const validHeader = `sha256=${validHash}`;

  assert.strictEqual(verifyMetaWebhookSignature(payload, validHeader, appSecret), true);
  assert.strictEqual(verifyMetaWebhookSignature(payload, 'sha256=invalidhash999', appSecret), false);
  assert.strictEqual(verifyMetaWebhookSignature(payload, validHeader, 'wrong_secret'), false);
});
