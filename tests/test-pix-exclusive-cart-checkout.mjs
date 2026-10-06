import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. DedicatedProductPage: Remoção de Checkout Expresso com PIX e exclusão de WhatsApp Direto com PIX Ativo', () => {
  const fileContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/catalog/DedicatedProductPage.tsx'),
    'utf-8'
  );

  // 1. "Checkout Expresso com PIX" deve ter sido totalmente removido
  assert.ok(
    !fileContent.includes('Checkout Expresso com PIX'),
    'O link/botão "Checkout Expresso com PIX" deve ser removido da DedicatedProductPage'
  );

  // 2. hasPixEnabled deve estar definido
  assert.ok(
    fileContent.includes('const hasPixEnabled = Boolean('),
    'hasPixEnabled deve ser computado para verificar se a loja liberou PIX'
  );

  // 3. "Pedir direto pelo WhatsApp" só pode ser exibido se !hasPixEnabled
  assert.ok(
    fileContent.includes('!hasPixEnabled && ('),
    'Botão de pedir direto pelo WhatsApp só pode existir quando a loja NÃO liberou PIX'
  );

  // 4. "Adicionar à Sacola" deve ocupar a largura total quando hasPixEnabled for verdadeiro
  assert.ok(
    fileContent.includes("hasPixEnabled ? 'w-full' : 'shrink-0'"),
    'No mobile, o botão "Adicionar à Sacola" deve expandir para w-full quando PIX estiver ativo'
  );
});

test('2. CartDrawer: Finalização Exclusiva por PIX e Remoção de Checkout Expresso', () => {
  const fileContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/catalog/CartDrawer.tsx'),
    'utf-8'
  );

  // 1. Link para checkout expresso /checkout/cart- deve ter sido removido
  assert.ok(
    !fileContent.includes('/checkout/cart-'),
    'O link de checkout alternativo /checkout/cart- deve ser removido'
  );
  assert.ok(
    !fileContent.includes('Pagar com PIX Dinâmico ou Cartão'),
    'Texto "Pagar com PIX Dinâmico ou Cartão" deve ser removido'
  );

  // 2. Quando PIX está ativo, não deve haver botão de "Finalizar direto pelo WhatsApp" concorrendo com o PIX
  assert.ok(
    !fileContent.includes('Finalizar direto pelo WhatsApp'),
    'Botão "Finalizar direto pelo WhatsApp" não deve ser exibido quando PIX está ativo na sacola'
  );

  // 3. O botão principal do PIX com comprovante deve existir
  assert.ok(
    fileContent.includes('Pagar com PIX &amp; Enviar Comprovante') ||
    fileContent.includes('Pagar com PIX & Enviar Comprovante'),
    'Botão "Pagar com PIX & Enviar Comprovante" deve ser a ação primária'
  );
});

test('3. PublicCatalogView: Finalização Exclusiva por PIX e Remoção de Checkout Expresso', () => {
  const fileContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/catalog/PublicCatalogView.tsx'),
    'utf-8'
  );

  // 1. Link para checkout alternativo /checkout/vit- deve ter sido removido
  assert.ok(
    !fileContent.includes('/checkout/vit-'),
    'O link de checkout alternativo /checkout/vit- deve ser removido'
  );
  assert.ok(
    !fileContent.includes('Pagar Agora com PIX Dinâmico'),
    'Texto "Pagar Agora com PIX Dinâmico" deve ser removido'
  );

  // 2. Quando PIX está ativo, não deve haver botão de "Finalizar direto pelo WhatsApp" concorrendo com o PIX
  assert.ok(
    !fileContent.includes('Finalizar direto pelo WhatsApp'),
    'Botão "Finalizar direto pelo WhatsApp" não deve ser exibido quando PIX está ativo'
  );
});

test('4. PixPaymentModal: Bloqueio de escape sem PIX quando o lojista liberou PIX', () => {
  const fileContent = fs.readFileSync(
    path.join(process.cwd(), 'src/components/catalog/PixPaymentModal.tsx'),
    'utf-8'
  );

  // Deve haver checagem explícita impedindo "Finalizar sem PIX" se a chave estiver ativa
  assert.ok(
    fileContent.includes('!(paymentConfig?.pixEnabled && paymentConfig?.pixKey?.trim())'),
    'O botão "Finalizar sem PIX" deve ser bloqueado quando o lojista possui chave PIX ativa'
  );
});

test('5. Configurações de Pagamento: allowWhatsAppDirectCheckout é desativado com PIX ativo', () => {
  const fileContent = fs.readFileSync(
    path.join(process.cwd(), 'src/app/settings/pagamentos/page.tsx'),
    'utf-8'
  );

  // 1. Salvar desativa allowWhatsAppDirectCheckout se isPixActive for true
  assert.ok(
    fileContent.includes('allowWhatsAppDirectCheckout: isPixActive ? false : allowWhatsAppDirectCheckout'),
    'Ao salvar configurações, se o PIX estiver ativo, allowWhatsAppDirectCheckout deve ser forçado para false'
  );

  // 2. UI informa lojista sobre desativação automática
  assert.ok(
    fileContent.includes('Desativado com PIX Ativo'),
    'UI deve alertar que pedidos diretos por WhatsApp ficam desativados quando o PIX estiver ativo'
  );
});
