import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('1. Saudação inicial ("Bom dia") NÃO despeja link de catálogo e inicia qualificação consultiva', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_greeting_001',
      buyerUsername: 'juliana_moda',
      messageText: 'Bom dia!',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  const result = data.result;

  assert.equal(result.shouldReply, true);
  assert.equal(result.intent, 'greeting');
  assert.equal(result.productDirectLink, undefined, 'Não deve ter link direto em saudação pura');
  assert.ok(!result.replyText.includes('http'), 'Texto de saudação NÃO deve conter links de URL');
  assert.ok(result.replyText.includes('Bom dia'), 'Deve cumprimentar com Bom dia');
  assert.ok(
    result.replyText.includes('Como posso te ajudar hoje?') ||
    result.replyText.includes('peça ou look específico'),
    'Deve fazer pergunta consultiva de descoberta'
  );
});

test('2. Saudação com pergunta de funcionamento ("Bom dia, como funciona?")', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_greeting_002',
      buyerUsername: 'ana_clara',
      messageText: 'Bom dia, como funciona?',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  const result = data.result;

  assert.equal(result.shouldReply, true);
  assert.equal(result.intent, 'greeting');
  assert.equal(result.productDirectLink, undefined);
  assert.ok(!result.replyText.includes('http'), 'Não deve conter links de URL');
  assert.ok(result.replyText.includes('prático') || result.replyText.includes('atendimento'));
  assert.ok(result.replyText.includes('Como posso te ajudar') || result.replyText.includes('produto'));
});

test('3. Pedido explícito de catálogo ("Me manda o catálogo")', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_greeting_003',
      buyerUsername: 'mariana',
      messageText: 'Me manda o catálogo com as novidades por favor',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  const result = data.result;

  assert.equal(result.shouldReply, true);
  assert.equal(result.intent, 'catalog_inquiry');
  assert.ok(result.productDirectLink?.includes('minha-loja'), 'Deve incluir link da vitrine quando solicitado');
  assert.ok(result.replyText.includes('minha-loja'), 'Texto deve conter link do catálogo');
});

test('4. Consulta de frete sem produto especificado ("Vocês entregam?")', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_greeting_004',
      buyerUsername: 'patricia',
      messageText: 'Vocês entregam por motoboy?',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  const result = data.result;

  assert.equal(result.shouldReply, true);
  assert.equal(result.intent, 'shipping_inquiry');
  assert.ok(result.replyText.includes('CEP') || result.replyText.includes('bairro'), 'Deve solicitar CEP ou bairro');
});

