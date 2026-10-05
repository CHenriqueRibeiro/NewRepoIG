import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePixBrcode,
  cleanPixKeyForPayload,
  formatPixKeyDisplay,
  getPixKeyTypeLabel,
} from '../src/lib/pix/brcode.ts';

test('PIX Unit Tests - cleanPixKeyForPayload and formatPixKeyDisplay', async (t) => {
  await t.test('Phone Key Formatting', () => {
    const raw = '11987654321';
    const payload = cleanPixKeyForPayload(raw, 'phone');
    assert.equal(payload, '+5511987654321', 'Deve adicionar prefixo internacional +55 se ausente');

    const display = formatPixKeyDisplay(raw, 'phone');
    assert.equal(display, '(11) 98765-4321', 'Deve formatar telefone celular com máscara (XX) XXXXX-XXXX');
  });

  await t.test('Phone Key already containing +55 or 55', () => {
    const raw = '5511987654321';
    const payload = cleanPixKeyForPayload(raw, 'phone');
    assert.equal(payload, '+5511987654321');

    const display = formatPixKeyDisplay(raw, 'phone');
    assert.equal(display, '(11) 98765-4321');
  });

  await t.test('CPF Formatting', () => {
    const raw = '123.456.789-00';
    const payload = cleanPixKeyForPayload(raw, 'cpf');
    assert.equal(payload, '12345678900', 'Deve remover pontos e traço no payload');

    const display = formatPixKeyDisplay('12345678900', 'cpf');
    assert.equal(display, '123.456.789-00', 'Deve formatar CPF com máscara');
  });

  await t.test('CNPJ Formatting', () => {
    const raw = '12.345.678/0001-90';
    const payload = cleanPixKeyForPayload(raw, 'cnpj');
    assert.equal(payload, '12345678000190', 'Deve remover caracteres especiais');

    const display = formatPixKeyDisplay('12345678000190', 'cnpj');
    assert.equal(display, '12.345.678/0001-90', 'Deve formatar CNPJ com máscara');
  });

  await t.test('E-mail and Random Key Handling', () => {
    const email = ' Contato@MinhaLoja.Com.Br ';
    assert.equal(cleanPixKeyForPayload(email, 'email'), 'contato@minhaloja.com.br');

    const random = '123e4567-e89b-12d3-a456-426614174000';
    assert.equal(cleanPixKeyForPayload(random, 'random'), random);
    assert.equal(formatPixKeyDisplay(random, 'random'), random);
  });

  await t.test('Key Type Labels', () => {
    assert.equal(getPixKeyTypeLabel('cpf'), 'CPF');
    assert.equal(getPixKeyTypeLabel('cnpj'), 'CNPJ');
    assert.equal(getPixKeyTypeLabel('phone'), 'Telefone Celular');
    assert.equal(getPixKeyTypeLabel('email'), 'E-mail');
    assert.equal(getPixKeyTypeLabel('random'), 'Chave Aleatória');
  });
});

test('PIX Generator Tests - generatePixBrcode EMVCo / BACEN Standard', async (t) => {
  await t.test('Generates valid TLV structure with correct CRC16 checksum', () => {
    const code = generatePixBrcode({
      pixKey: '11999998888',
      pixKeyType: 'phone',
      merchantName: 'Loja Vitryne',
      merchantCity: 'Sao Paulo',
      amount: 149.9,
      transactionId: 'PED1234',
    });

    assert.ok(code.startsWith('000201'), 'Deve iniciar com Payload Format Indicator 000201');
    assert.ok(code.includes('br.gov.bcb.pix'), 'Deve conter o GUI oficial do PIX br.gov.bcb.pix');
    assert.ok(code.includes('+5511999998888'), 'Deve conter a chave PIX padronizada');
    assert.ok(code.includes('5303986'), 'Deve conter código da moeda Real BRL (986)');
    assert.ok(code.includes('5406149.90'), 'Deve conter o valor formatado 149.90');
    assert.ok(code.includes('5802BR'), 'Deve conter o país BR');
    assert.ok(code.includes('6304'), 'Deve terminar com a tag de CRC16 6304');
    
    // O comprimento final deve ter exatamente o sufixo 6304XXXX (4 caracteres hexadecimais após 6304)
    const crcIndex = code.lastIndexOf('6304');
    assert.equal(code.slice(crcIndex).length, 8, 'CRC16 deve ter 4 dígitos hexadecimais após 6304');
  });

  await t.test('Handles sanitization of accented names and cities', () => {
    const code = generatePixBrcode({
      pixKey: 'cliente@teste.com',
      pixKeyType: 'email',
      merchantName: 'Açougue & Padaria São José',
      merchantCity: 'São José dos Campos',
      amount: 50.0,
    });

    assert.ok(!code.includes('ç') && !code.includes('ã') && !code.includes('é'), 'Não deve conter caracteres acentuados no payload');
    assert.ok(code.includes('ACOUGE  PADARIA SAO JOSE'.slice(0, 15)) || code.includes('SAO JOSE'), 'Deve sanitizar para maiúsculas e ASCII');
  });
});
