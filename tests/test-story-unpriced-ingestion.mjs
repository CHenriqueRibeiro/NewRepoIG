import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('Ingestão de Story sem preço: não publica na vitrine, não inventa Novidades preto e responde com aviso de em breve', async () => {
  // 1. Simular sincronização de Story sem preço e sem categoria óbvia
  const storyMediaId = 'story_test_unpriced_' + Date.now();
  const syncRes = await fetch(`${BASE_URL}/api/instagram/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instagramMediaId: storyMediaId,
      mediaType: 'STORY',
      mediaUrl: 'https://images.unsplash.com/photo-unique-unpriced-story-' + Date.now() + '.jpg',
      caption: 'Look do dia nos bastidores ✨ #lifestyle',
    }),
  });

  assert.equal(syncRes.status, 200);

  // 2. Verificar que o catálogo público da vitrine (/api/catalog) NÃO contém produto sem preço nem 'Novidades preto'
  const catalogRes = await fetch(`${BASE_URL}/api/catalog`);
  assert.equal(catalogRes.status, 200);
  const catalogData = await catalogRes.json();
  const products = catalogData.catalog?.products || [];

  for (const prod of products) {
    const title = (prod.name || prod.title || '').toLowerCase();
    assert.ok(!title.includes('novidades preto'), `Produto na vitrine não pode se chamar "Novidades preto": ${prod.name}`);
    assert.ok(prod.price > 0, `Produto na vitrine deve ter preço > 0: ${prod.name} (${prod.price})`);
  }

  // 3. Perguntar para a IA sobre esse story
  const uniqueBuyerId = 'buyer_unpriced_' + Date.now();
  const queryRes = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: uniqueBuyerId,
      buyerUsername: 'juliana_moda',
      messageText: 'Quanto tá esse look que você postou nos stories?',
      storyMediaId: storyMediaId,
    }),
  });

  assert.equal(queryRes.status, 200);
  const queryData = await queryRes.json();
  assert.equal(queryData.success, true);
  const reply = queryData.result?.replyText || '';

  // 4. A resposta deve dizer que ainda não está no catálogo com valor e em breve será colocada
  assert.ok(!reply.includes('149,90'), 'Não pode inventar R$ 149,90');
  assert.ok(!reply.toLowerCase().includes('novidades preto'), 'Não pode conter Novidades preto');
  assert.ok(
    reply.includes('ainda não está no catálogo') || reply.includes('ainda nao esta no catalogo'),
    'Deve avisar que ainda não está no catálogo com valor oficial'
  );
  assert.ok(
    reply.includes('em breve') || reply.includes('breve'),
    'Deve avisar que em breve será colocada'
  );
});
