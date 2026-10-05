import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('1. Estrutura do Catálogo Inteligente e Produtos Permanentes', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent?seed=true`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.products));
  assert.ok(data.products.length >= 2);

  const blusa = data.products.find((p) => p.title.includes('Manga Curta'));
  assert.ok(blusa, 'Blusa Feminina Manga Curta deve existir no catálogo de testes');
  assert.equal(blusa.attributes.cor_principal, 'amarelo');
  assert.equal(blusa.attributes.gola, 'V');
  assert.equal(blusa.attributes.manga, 'curta');
  assert.ok(Array.isArray(blusa.variants));

  // Verifica ground truth de estoque no banco: P=2, M=0, G=3
  const varP = blusa.variants.find((v) => v.name === 'P');
  const varM = blusa.variants.find((v) => v.name === 'M');
  assert.equal(varP?.stock_quantity, 2);
  assert.equal(varM?.stock_quantity, 0);
});

test('2. Sincronização Inteligente com Instagram e Idempotência Estrita', async () => {
  const mediaId = `ig_test_story_${Date.now()}`;

  // 1ª vez: Deve processar a mídia
  const res1 = await fetch(`${BASE_URL}/api/instagram/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instagramMediaId: mediaId,
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      caption: 'Olha que linda essa blusa amarela gola V que acabou de chegar! #lookdodia',
    }),
  });

  assert.equal(res1.status, 200);
  const data1 = await res1.json();
  assert.equal(data1.success, true);
  assert.equal(data1.result.isDuplicateSkipped, false, 'Primeiro envio deve processar normalmente');
  assert.ok(data1.result.decision.confidence >= 0.85, 'Deve dar match com a blusa do catálogo');
  assert.equal(data1.result.decision.match_status, 'auto_matched');

  // 2ª vez com o MESMO instagramMediaId: Idempotência deve ignorar reprocessamento
  const res2 = await fetch(`${BASE_URL}/api/instagram/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instagramMediaId: mediaId,
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
      caption: 'Tentativa duplicada do mesmo evento',
    }),
  });

  assert.equal(res2.status, 200);
  const data2 = await res2.json();
  assert.equal(data2.success, true);
  assert.equal(data2.result.isDuplicateSkipped, true, 'Envio com mesmo ID deve ser ignorado por idempotência');
});

test('3. Situação de Dúvida Visual (Match Duvidoso) e Confirmação Manual', async () => {
  const mediaDuvidaId = `ig_test_duvida_${Date.now()}`;

  // Mídia com atributos de blusa amarela com elementos que geram dúvida (ex: sem especificar gola)
  const res = await fetch(`${BASE_URL}/api/instagram/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instagramMediaId: mediaDuvidaId,
      mediaType: 'IMAGE',
      mediaUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
      caption: 'Blusa amarela perfeita para o dia a dia!',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.result.decision.candidates.length >= 1);

  // Confirmação manual pela lojista escolhendo a Blusa Bufante
  const relationId = data.result.relation.id;
  const resConfirm = await fetch(`${BASE_URL}/api/catalog/intelligent/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      relationId,
      productId: 'prod_blusa_bufante_02',
    }),
  });

  assert.equal(resConfirm.status, 200);
  const confirmData = await resConfirm.json();
  assert.equal(confirmData.success, true);
  assert.equal(confirmData.relation.match_status, 'confirmed');
  assert.equal(confirmData.product.title, 'Blusa Feminina Bufante');
  // Memória visual enriquecida: mais referências
  assert.ok(confirmData.product.images.length >= 2, 'Produto deve acumular nova referência visual');
});

test('4. Consulta de Estoque Real no Atendimento (M=0 Indisponível vs P=2 Disponível)', async () => {
  // Pergunta por tamanho M (estoque = 0)
  const resM = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageText: 'Tem no tamanho M essa blusa feminina manga curta?',
      storyMediaId: 'ig_media_story_test_991',
    }),
  });

  assert.equal(resM.status, 200);
  const dataM = await resM.json();
  assert.equal(dataM.success, true);
  assert.ok(
    dataM.result.replyText.includes('indisponível no tamanho M') ||
    dataM.result.replyText.includes('indisponível'),
    'Deve avisar com precisão que o tamanho M está indisponível'
  );
  assert.ok(
    dataM.result.productDirectLink.includes('blusa'),
    'Link direto deve usar a URL amigável e limpa do produto'
  );

  // Pergunta por tamanho P (estoque = 2)
  const resP = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageText: 'E no tamanho P, tem?',
    }),
  });

  assert.equal(resP.status, 200);
  const dataP = await resP.json();
  assert.equal(dataP.success, true);
  assert.ok(
    dataP.result.replyText.includes('temos o tamanho P') ||
    dataP.result.replyText.includes('disponível'),
    'Deve confirmar que o tamanho P está disponível no estoque'
  );
  assert.equal(dataP.result.processingSource, 'conversation_context', 'Deve reutilizar o contexto da conversa');
  assert.equal(dataP.result.cachedAvoidedAiExecution, true, 'IA pesada deve ter sido poupada');
});

test('5. HNSW pgvector sob Demanda para Busca Textual sem Contexto Prévio', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: `buyer_hnsw_new_${Date.now()}`,
      buyerUsername: 'carla_style',
      messageText: 'Quero aquela blusa amarela de manga curta gola V que você postou ontem',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.result.productTitle, 'Blusa Feminina Manga Curta');
  assert.equal(data.result.processingSource, 'hnsw_text_search');
  assert.ok(
    data.result.productDirectLink.includes('blusa'),
    'Link direto deve usar a URL amigável e limpa do produto'
  );
});

test('6. Limpeza pós-teste dos dados temporários', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent?clear=true`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.products.length, 0, 'Memória deve estar 100% limpa após os testes');
});
