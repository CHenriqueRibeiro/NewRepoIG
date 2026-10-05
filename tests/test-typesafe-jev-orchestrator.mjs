import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

async function callOrchestrator(messageText, catalogSlug = 'minha-loja') {
  const res = await fetch(`${BASE_URL}/api/ai/orchestrator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageText,
      buyerUsername: 'Mariana',
      storeName: 'Vitryne Boutique',
      catalogSlug,
    }),
  });
  return res.json();
}

test('TypeSafe Jev Multi-Agent Orchestrator Suite', async (t) => {
  await t.test('1. Agente de Endereço & Retirada (StoreAddressAgent)', async () => {
    const data = await callOrchestrator('Onde fica a loja física de vocês? Tem como retirar no local?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true, 'Deve responder à pergunta de endereço');
    assert.equal(data.selectedAgentType, 'store_address', 'Deve escolher o Agente de Endereço & Retirada');
    assert.ok(
      data.replyText.includes('Endereço') || data.replyText.includes('Retirada'),
      'A resposta deve conter dados de localização/retirada'
    );
  });

  await t.test('2. Agente de Envio de Catálogo (CatalogLinkAgent)', async () => {
    // A) Catálogo não criado/aprovado: NUNCA deve enviar link
    const data = await callOrchestrator('Oie, me manda o catálogo completo para eu ver os produtos?', 'loja-nao-criada-ou-aprovada');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true, 'Deve responder ao pedido de catálogo');
    assert.equal(data.selectedAgentType, 'catalog_link', 'Deve escolher o Agente de Envio de Catálogo');
    assert.equal(
      data.replyText.includes('http'),
      false,
      'Não deve conter link quando o catálogo não foi aprovado/publicado'
    );
    assert.ok(
      data.replyText.includes('vitrine') || data.replyText.includes('lançamentos'),
      'Deve acolher cordialmente no chat'
    );

    // B) Catálogo criado/aprovado com produtos: deve conter link oficial
    await fetch(`${BASE_URL}/api/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: 'Loja Publicada',
        slug: 'loja-publicada',
        templateChosen: true,
        isPublished: true,
        products: [{ id: 'item_real_1', name: 'Vestido Real', price: 120, stock: 5 }],
      }),
    });

    const resPublished = await fetch(`${BASE_URL}/api/ai/orchestrator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageText: 'Oie, me manda o catálogo completo para eu ver os produtos?',
        buyerUsername: 'Mariana',
        storeName: 'Loja Publicada',
        catalogSlug: 'loja-publicada',
      }),
    });
    const dataPublished = await resPublished.json();
    assert.ok(
      dataPublished.replyText.includes('loja-publicada'),
      'Catálogo aprovado com produtos deve conter o link oficial'
    );
  });

  await t.test('3. Agente de Pagamento & PIX (CheckoutPixAgent)', async () => {
    const data = await callOrchestrator('Qual a chave pix de vocês? Vou pagar agora, me passa os dados');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true, 'Deve responder ao pedido de PIX');
    assert.equal(data.selectedAgentType, 'checkout_pix', 'Deve escolher o Agente de Pagamento & PIX');
    assert.ok(
      data.replyText.includes('PIX') || data.replyText.includes('sacola'),
      'A resposta deve orientar sobre pagamento PIX'
    );
  });

  await t.test('4. Agente de Identificação de Produto (ProductIdentificationAgent)', async () => {
    const data = await callOrchestrator('Tem o Vestido Floral Midi tamanho M no estoque? Qual o preço?');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true, 'Deve responder à consulta de produto');
    assert.equal(data.selectedAgentType, 'product_identification', 'Deve escolher o Agente de Identificação de Produto');
    assert.ok(data.replyText.length > 20, 'Deve gerar texto explicativo do produto');
  });

  await t.test('5. Agente de Transbordo Humano (HumanHandoffAgent)', async () => {
    const data = await callOrchestrator('Estou com problema grave no meu pedido, quero falar com um atendente humano agora!');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true, 'Deve acolher o cliente e transferir');
    assert.equal(data.selectedAgentType, 'human_handoff', 'Deve escolher o Agente de Transbordo Humano');
    assert.ok(
      data.replyText.includes('equipe') || data.replyText.includes('atendente'),
      'Deve avisar que a equipe humana foi notificada'
    );
  });

  await t.test('6. Silenciamento de Spam / Fora de Escopo', async () => {
    const data = await callOrchestrator('gatinha linda casa comigo zap');

    assert.equal(data.success, true);
    assert.equal(data.shouldReply, false, 'Deve permanecer em silêncio absoluto para cantada/spam');
    assert.equal(data.selectedAgentType, 'silence_ignore', 'Tipo deve ser silence_ignore');
  });
});
