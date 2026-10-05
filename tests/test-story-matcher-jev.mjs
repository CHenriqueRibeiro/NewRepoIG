import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3000';

test('Story Product Matcher Suite (OpenAI Vision + TypeSafe Jev + WhatsApp Dispatch Standby)', async (t) => {
  await t.test('1. Interação com Story contendo peça do catálogo prepara resposta e ação de WhatsApp em standby', async () => {
    // 1. Cadastra o produto no catálogo da loja de teste
    await fetch(`${BASE_URL}/api/catalog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeName: 'Vitryne Boutique',
        slug: 'loja-teste-story',
        whatsapp: '5511999998888',
        products: [
          {
            id: 'prod-vestido-floral',
            name: 'Vestido Midi Floral Rosa',
            category: 'Vestidos',
            price: 189.9,
            stock: 5,
            colors: ['rosa', 'floral'],
            sizes: ['P', 'M', 'G'],
          },
        ],
      }),
    });

    // 2. Simula o seguidor interagindo com o Story
    const res = await fetch(`${BASE_URL}/api/ai/orchestrator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageText: 'Tem esse vestido floral rosa que postou no story tamanho M?',
        buyerUsername: 'juliana_silva',
        storeName: 'Vitryne Boutique',
        catalogSlug: 'loja-teste-story',
        storyUrl: 'https://instagram.com/stories/vitryne/photo-1572804013309',
        storyMediaId: 'story_asset_vestido_123',
      }),
    });

    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.shouldReply, true);
    assert.equal(data.selectedAgentType, 'product_identification', 'Deve selecionar o agente de identificação de produto');

    // Metadados da ação de disparo do WhatsApp
    const metadata = data.executionResult?.metadata;
    assert.ok(metadata, 'Deve conter metadados da execução');
    assert.equal(metadata?.productName, 'Vestido Midi Floral Rosa');

    const whatsappAction = metadata?.whatsappStoryAction;
    assert.ok(whatsappAction, 'Ação de WhatsApp deve ter sido gerada');
    assert.equal(whatsappAction.status, 'standby_ready', 'Status deve estar em standby_ready');
    assert.equal(whatsappAction.enabled, false, 'Disparo automático deve estar desativado por padrão');
    assert.ok(whatsappAction.messageText.includes('OPORTUNIDADE DE STORY'), 'Mensagem formatada para o WhatsApp');
    assert.ok(whatsappAction.messageText.includes('@juliana_silva'), 'Deve conter o lead do cliente');
    assert.ok(whatsappAction.directWhatsAppLink.startsWith('https://wa.me/'), 'Deve conter link direto do WhatsApp');
  });
});
