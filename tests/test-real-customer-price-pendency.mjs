import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('Pendências de Loja: Apenas clientes REAIS criam pendência (zero fake de Lojista) e sem seção de peças detectadas', async () => {
  // Limpar pendências anteriores para o teste
  await fetch(`${BASE_URL}/api/catalog/price-confirm?requestId=ALL`, { method: 'DELETE' });

  // 1. Simular sincronização de Story sem preço
  const uniqueTag = 'novidade_inédita_' + Date.now();
  const storyMediaId = 'story_real_customer_test_' + Date.now();
  const syncRes = await fetch(`${BASE_URL}/api/instagram/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instagramMediaId: storyMediaId,
      mediaType: 'STORY',
      mediaUrl: `https://images.unsplash.com/photo-${uniqueTag}.jpg`,
      caption: `Peça exclusiva nos bastidores: ${uniqueTag} ✨`,
    }),
  });

  assert.equal(syncRes.status, 200);
  const syncData = await syncRes.json();
  const targetStoreId = syncData.processedMedia?.store_id || 'store_demo_vitryne';

  // 2. Verificar que NÃO foi criada nenhuma notificação de "Lojista"
  const pendingCheckRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`);
  assert.equal(pendingCheckRes.status, 200);
  const pendingCheckData = await pendingCheckRes.json();
  const pendingRequests = pendingCheckData.requests || [];

  const fakeLojista = pendingRequests.filter(
    (r) => r.buyer_username?.toLowerCase() === 'lojista' || r.buyer_id === 'system_sync'
  );
  assert.equal(fakeLojista.length, 0, 'NÃO deve existir notificação gerada para o Lojista/sistema.');
  assert.equal(pendingRequests.length, 0, 'Nenhuma pendência deve existir antes de um cliente real perguntar.');

  // 3. Cliente REAL (@carol_mendes) pergunta sobre o Story
  const realBuyerId = 'buyer_instagram_carol_' + Date.now();
  const queryRes = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeId: targetStoreId,
      buyerId: realBuyerId,
      buyerUsername: 'carol_mendes',
      messageText: `Quanto custa essa peça que você postou nos stories?`,
      storyMediaId: storyMediaId,
    }),
  });

  assert.equal(queryRes.status, 200);
  const queryData = await queryRes.json();
  assert.equal(queryData.success, true);

  // 4. Agora deve existir EXATAMENTE 1 notificação, e ela deve ser da @carol_mendes (cliente real)
  const afterCustomerRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`);
  assert.equal(afterCustomerRes.status, 200);
  const afterCustomerData = await afterCustomerRes.json();
  const realRequests = afterCustomerData.requests || [];

  assert.equal(realRequests.length, 1, 'Deve existir exatamente 1 pendência agora.');
  assert.equal(realRequests[0].buyer_username, 'carol_mendes', 'A pendência deve ser da cliente real @carol_mendes.');
  assert.ok(
    realRequests[0].inquiry_text.includes('Quanto custa'),
    'Deve conter a pergunta real da cliente.'
  );

  // 5. Lojista confirma o preço e cadastra o produto
  const confirmRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestId: realRequests[0].id,
      productId: realRequests[0].product_id,
      price: 140.0,
      title: `Vestido ${uniqueTag}`,
    }),
  });

  assert.equal(confirmRes.status, 200);
  const confirmData = await confirmRes.json();
  assert.equal(confirmData.success, true);

  // 6. Lista de pendências volta a ficar zerada
  const finalCheckRes = await fetch(`${BASE_URL}/api/catalog/price-confirm`);
  const finalCheckData = await finalCheckRes.json();
  const remaining = (finalCheckData.requests || []).filter((r) => r.status === 'pending');
  assert.equal(remaining.length, 0, 'Todas as pendências foram concluídas.');
});
