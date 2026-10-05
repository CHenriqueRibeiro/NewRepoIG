import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCanonicalDescription } from '../src/lib/ai/vision-service.ts';
import { classifySalesIntent } from '../src/lib/ai/sales-intent-filter.ts';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

test('1. Descrição Canônica Dinâmica para Serviços e Produtos Multi-Nicho', () => {
  // A) Serviço (Barbearia / Estética)
  const serviceAttrs = {
    tipo_item: 'servico',
    categoria: 'barbearia',
    procedimento: 'Corte Degradê Navalhado',
    duracao: '45 min',
    detalhes: ['toalha quente', 'pomada matte'],
    estilo: 'moderno',
  };
  const serviceDesc = buildCanonicalDescription(serviceAttrs);
  assert.ok(serviceDesc.includes('Serviço de barbearia'), 'Deve identificar como serviço');
  assert.ok(serviceDesc.includes('Corte Degradê Navalhado'), 'Deve incluir o procedimento');
  assert.ok(serviceDesc.includes('45 min'), 'Deve incluir a duração');
  assert.ok(!serviceDesc.includes('gola'), 'Não deve conter gola');
  assert.ok(!serviceDesc.includes('Peça'), 'Não deve chamar serviço de Peça');

  // B) Eletrônico / Smartphone
  const techAttrs = {
    tipo_item: 'produto',
    categoria: 'smartphone',
    marca: 'Apple',
    cor_principal: 'titânio escuro',
    material: 'titânio aeroespacial',
    detalhes: ['256GB', 'câmera 48MP'],
    estilo: 'tecnologia',
  };
  const techDesc = buildCanonicalDescription(techAttrs);
  assert.ok(techDesc.includes('smartphone'), 'Deve identificar a categoria smartphone');
  assert.ok(techDesc.includes('Apple'), 'Deve conter a marca');
  assert.ok(techDesc.includes('titânio'), 'Deve conter os materiais/especificações');
  assert.ok(!techDesc.includes('gola'), 'Não deve conter gola');
  assert.ok(!techDesc.includes('manga'), 'Não deve conter manga');

  // C) Cosmético / Perfume
  const perfumeAttrs = {
    tipo_item: 'produto',
    categoria: 'perfumaria',
    marca: 'O Boticário',
    volumetria: '100ml',
    cor_principal: 'âmbar',
    detalhes: ['fragrância marcante', 'fixação 12h'],
  };
  const perfumeDesc = buildCanonicalDescription(perfumeAttrs);
  assert.ok(perfumeDesc.includes('perfumaria'), 'Deve identificar perfumaria');
  assert.ok(perfumeDesc.includes('100ml'), 'Deve incluir a volumetria');
  assert.ok(perfumeDesc.includes('O Boticário'), 'Deve incluir a marca');
});

test('2. Classificação de Intenção para Serviços e Agendamentos', () => {
  const serviceMsgs = [
    'Vocês atendem corte de cabelo masculino amanhã?',
    'Tem horário livre para manicure?',
    'Queria agendar uma sessão de limpeza de pele',
    'Como funciona o agendamento de barba?',
  ];
  for (const msg of serviceMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'service_inquiry', `Deveria identificar service_inquiry para "${msg}"`);
  }
});

test('3. Classificação de Intenção para Produtos Diversos (Tech, Cosméticos, Gastronomia)', () => {
  const techPriceMsg = classifySalesIntent({ messageText: 'Qual o valor desse smartphone 256GB?' });
  assert.equal(techPriceMsg.intent, 'price_inquiry');

  const cosmeticStockMsg = classifySalesIntent({ messageText: 'Tem esse perfume 100ml pronta entrega?' });
  assert.equal(cosmeticStockMsg.intent, 'product_inquiry');

  const purchaseMsg = classifySalesIntent({ messageText: 'Quero comprar esse smartphone, manda o link de pagamento' });
  assert.equal(purchaseMsg.intent, 'purchase_intent');
});

test('4. Atendimento Comercial Inteligente para Serviços via API', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_service_test_' + Date.now(),
      messageText: 'Vocês têm horário para corte de cabelo e barba amanhã?',
      buyerUsername: 'carlos_barba',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.result.shouldReply, true);
  assert.equal(data.result.intent, 'service_inquiry');
  assert.ok(
    data.result.replyText.includes('horários') ||
    data.result.replyText.includes('procedimentos') ||
    data.result.replyText.includes('agenda'),
    'Deve responder convidando para agendamento de horário'
  );
  assert.ok(
    !data.result.replyText.includes('vestido') && !data.result.replyText.includes('tamanho'),
    'Não deve falar de vestido ou tamanho de roupa para serviço'
  );
});

test('5. Atendimento Comercial Inteligente para Consulta Geral Sem Presunção de Moda', async () => {
  const res = await fetch(`${BASE_URL}/api/catalog/intelligent/test-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerId: 'buyer_general_test_' + Date.now(),
      messageText: 'Bom dia, como funciona o atendimento de vocês?',
      buyerUsername: 'lucas_cliente',
    }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.result.shouldReply, true);
  assert.ok(
    data.result.replyText.includes('produto') && data.result.replyText.includes('serviço'),
    'Mensagem de funcionamento deve incluir produtos e serviços dinamicamente'
  );
});
