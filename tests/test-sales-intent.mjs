import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySalesIntent } from '../src/lib/ai/sales-intent-filter.ts';

test('1. Saudações comerciais ("Do Oi ao fechamento")', () => {
  const greetings = ['Oi', 'Olá, boa tarde!', 'Oie tudo bem?', 'Bom dia, como funciona?'];
  for (const msg of greetings) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'greeting');
  }
});

test('2. Intenção de Preço, Formas de Pagamento e Valores', () => {
  const priceMsgs = [
    'Quanto custa essa peça?',
    'Qual o valor com frete?',
    'Aceita cartão ou pix?',
    'Divide em até quantas vezes?',
  ];
  for (const msg of priceMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'price_inquiry');
  }
});

test('3. Intenção de Tamanhos e Medidas', () => {
  const sizeMsgs = ['Tem tamanho M?', 'Veste 40?', 'Tem no G disponível?'];
  for (const msg of sizeMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'size_inquiry');
  }
});

test('4. Alta Intenção de Compra e Indicação de Checkout', () => {
  const purchaseMsgs = [
    'Quero comprar!',
    'Manda o link de compra por favor',
    'Reserva uma pra mim!',
    'Como faço pra comprar?',
  ];
  for (const msg of purchaseMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'purchase_intent');
  }
});

test('5. Consulta de Peças, Catálogo e Vitrine', () => {
  const productMsgs = [
    { text: 'Tem vestido vermelho?', intent: 'product_inquiry' },
    { text: 'Tem blusa branca?', intent: 'product_inquiry' },
    { text: 'Me manda o catálogo com as novidades', intent: 'catalog_inquiry' },
    { text: 'Quero ver a vitrine', intent: 'catalog_inquiry' },
  ];
  for (const { text, intent } of productMsgs) {
    const res = classifySalesIntent({ messageText: text });
    assert.equal(res.shouldReply, true, `Deveria responder para "${text}"`);
    assert.equal(res.intent, intent);
  }
});

test('6. Intenção de Serviços, Procedimentos e Agendamentos', () => {
  const serviceMsgs = [
    'Como faço para agendar um horário?',
    'Tem horário livre amanhã para manicure?',
  ];
  for (const msg of serviceMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'service_inquiry');
  }
});

test('7. Dúvidas de Entrega, Frete, Retirada e Funcionamento da Loja', () => {
  const shippingMsgs = [
    'Vocês entregam por motoboy?',
    'Onde fica a loja física?',
    'Abre no sábado até que horas?',
  ];
  for (const msg of shippingMsgs) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, true, `Deveria responder para "${msg}"`);
    assert.equal(res.intent, 'shipping_inquiry');
  }
});

test('8. Interação com Stories (contexto de Story ativo)', () => {
  const res = classifySalesIntent({ messageText: 'Amei!', hasStoryContext: true });
  assert.equal(res.shouldReply, true);
  assert.equal(res.intent, 'story_interaction');
});

test('9. Encerramentos e Agradecimentos (SILÊNCIO: shouldReply = false)', () => {
  const closings = [
    'Ok',
    'Entendi, obrigado!',
    'Beleza, valeu',
    'Show de bola',
    'Vou ver aqui qualquer coisa chamo',
    '👍',
  ];
  for (const msg of closings) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, false, `NÃO deveria responder para encerramento "${msg}"`);
    assert.equal(res.intent, 'closing');
  }
});

test('10. Mensagens Fora do Assunto / Papo Furado / Flerte / Spam (SILÊNCIO: shouldReply = false)', () => {
  const offTopics = [
    'Você é solteira?',
    'Passa seu zap pessoal',
    'Você é um robô?',
    'Quer fechar uma parceria de marketing para ganhar seguidores?',
    'E o jogo de ontem hein?',
    'Que dia lindo hoje',
  ];
  for (const msg of offTopics) {
    const res = classifySalesIntent({ messageText: msg });
    assert.equal(res.shouldReply, false, `NÃO deveria responder para fora do assunto "${msg}"`);
    assert.equal(res.intent, 'off_topic');
  }
});

test('11. Retomada Instantânea: cliente que falou besteira volta a perguntar sobre compra', () => {
  // 1º passo: cliente fala besteira -> IA silenciada
  const step1 = classifySalesIntent({ messageText: 'Você é um robô?' });
  assert.equal(step1.shouldReply, false);
  assert.equal(step1.intent, 'off_topic');

  // 2º passo: cliente pergunta sobre compra -> IA reativa na hora!
  const step2 = classifySalesIntent({ messageText: 'Tem tamanho G desse vestido?' });
  assert.equal(step2.shouldReply, true);
  assert.equal(step2.intent, 'size_inquiry');

  // 3º passo: cliente quer fechar pedido -> IA pronta para checkout
  const step3 = classifySalesIntent({ messageText: 'Quero comprar!' });
  assert.equal(step3.shouldReply, true);
  assert.equal(step3.intent, 'purchase_intent');
});
