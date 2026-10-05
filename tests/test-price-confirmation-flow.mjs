import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('Estratégia 3: Micro-Confirmação em 1 Clique e Aprendizado de Preço para Stories', async () => {
  // 1. Simular uma pergunta de preço para um produto recém-sincronizado sem etiqueta de preço (price_cents: 0)
  // Criar ou garantir produto sem preço no catálogo inteligente via query com story recém postado
  const queryRes = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_story_asker_123',
      buyerUsername: 'carol_cliente',
      messageText: 'Qual o valor desse macacão que você postou nos stories?',
      // Se não houver correspondência com preço ou for item zerado, a IA dispara a requisição de confirmação
    }),
  });

  assert.equal(queryRes.status, 200);
  const queryData = await queryRes.json();
  assert.equal(queryData.success, true);
  const result = queryData.result;

  assert.equal(result.shouldReply, true);
  // O texto NÃO deve inventar preço falso
  assert.ok(!result.replyText.includes('149,90'), 'NUNCA deve inventar preço hardcoded como R$ 149,90');

  // 2. Verificar a rota GET /api/catalog/price-confirm para listar requisições
  const listRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`);
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.success, true);
  assert.ok(Array.isArray(listData.requests), 'Deve retornar lista de requisições');

  // Se houver pendências ou criar uma programática para testar a confirmação em 1 clique:
  // Disparamos um POST de confirmação com um ID de teste
  const testProductId = 'prod_story_test_99';
  const testReqId = 'req_test_' + Date.now();

  // Testar rota POST /api/catalog/price-confirm
  const confirmRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: testReqId,
      productId: testProductId,
      price: 219.90,
    }),
  });

  assert.equal(confirmRes.status, 200);
  const confirmData = await confirmRes.json();
  assert.equal(confirmData.success, true);
  assert.equal(confirmData.priceCents, 21990);
  assert.equal(confirmData.formattedPrice, 'R$\u00a0219,90');
});
