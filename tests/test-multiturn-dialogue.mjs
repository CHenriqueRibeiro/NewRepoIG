import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('Conversa Multi-Turno Completa: Sem repetição de link nem loop de "o que você tem em mente"', async () => {
  const buyerId = 'buyer_flow_test_' + Date.now();
  const buyerUsername = 'mariana_silva';

  // TURNO 1: Cliente inicia com "Boa noite"
  const res1 = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId,
      buyerUsername,
      messageText: 'Boa noite',
    }),
  });
  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  assert.ok(data1.result.shouldReply, 'Deve responder ao Boa noite');
  assert.ok(data1.result.replyText.includes('Como posso te ajudar hoje?'));
  assert.equal(data1.result.productDirectLink, undefined);

  // TURNO 2: Cliente diz "estou procurando uma roupa"
  // A IA apresenta a vitrine e pergunta o estilo/tamanho
  const res2 = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId,
      buyerUsername,
      messageText: 'estou procurando uma roupa',
    }),
  });
  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.success, true);
  assert.ok(data2.result.shouldReply);
  assert.ok(!data2.result.replyText.includes('Como posso te ajudar hoje?'));
  assert.ok(data2.result.replyText.includes('o que você tem em mente ou qual estilo/tamanho'));

  // TURNO 3: Cliente responde à pergunta: "quero um vestido para uma festa"
  // A IA DEVE identificar o Vestido, apresentar o produto com link direto e NUNCA repetir "o que você tem em mente"
  const res3 = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId,
      buyerUsername,
      messageText: 'quero um vestido para uma festa',
    }),
  });
  assert.equal(res3.status, 200);
  const data3 = await res3.json();
  assert.equal(data3.success, true);
  assert.ok(data3.result.shouldReply);
  // O Turno 3 NÃO deve repetir a pergunta de "o que você tem em mente"
  assert.ok(
    !data3.result.replyText.includes('o que você tem em mente'),
    'Turno 3 NUNCA deve repetir "o que você tem em mente"'
  );
  // Deve recomendar o Vestido Midi Floral
  assert.ok(
    data3.result.replyText.toLowerCase().includes('vestido') ||
    data3.result.productTitle?.toLowerCase().includes('vestido'),
    'Turno 3 deve identificar o vestido do catálogo'
  );

  // TURNO 4: Cliente pergunta sobre outra categoria: "e vocês tem blusas?"
  const res4 = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId,
      buyerUsername,
      messageText: 'e vocês tem blusas?',
    }),
  });
  assert.equal(res4.status, 200);
  const data4 = await res4.json();
  assert.equal(data4.success, true);
  assert.ok(data4.result.shouldReply);
  assert.ok(!data4.result.replyText.includes('o que você tem em mente'));
  assert.ok(
    data4.result.replyText.toLowerCase().includes('blusa') ||
    data4.result.productTitle?.toLowerCase().includes('blusa')
  );

  // TURNO 5: Cliente pergunta por algo não existente no estoque (ex: "tem tênis?")
  const res5 = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId,
      buyerUsername,
      messageText: 'tem tênis?',
    }),
  });
  assert.equal(res5.status, 200);
  const data5 = await res5.json();
  assert.equal(data5.success, true);
  // NÃO repete a pergunta de "o que você tem em mente"
  assert.ok(!data5.result.replyText.includes('o que você tem em mente'));
  assert.ok(data5.result.replyText.includes('Anotei a sua preferência'));
});
