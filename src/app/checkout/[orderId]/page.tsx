'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Check, Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CatalogConfig } from '@/lib/catalog/types';
import { formatPixKeyDisplay } from '@/lib/pix/brcode';

export default function CheckoutPage({ params }: { params: { orderId: string } }) {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(885);
  const [shippingType, setShippingType] = useState<'motoboy' | 'retirada' | 'sedex'>('motoboy');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [catalog, setCatalog] = useState<CatalogConfig | null>(null);

  const itemPrice = 149.9;
  const shippingCosts = {
    retirada: 0,
    motoboy: 15.0,
    sedex: 28.5,
  };

  const totalAmount = (itemPrice + shippingCosts[shippingType]).toFixed(2);

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.catalog) setCatalog(d.catalog);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (timeLeftSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftSeconds]);

  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timerFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const pixConfig = catalog?.paymentConfig;
  const pixKey = pixConfig?.pixKey || '11999998888';
  const pixKeyType = pixConfig?.pixKeyType || 'phone';
  const beneficiaryName = pixConfig?.pixBeneficiaryName || catalog?.storeName || 'VITRYNE BOUTIQUE';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSendProofToWhatsApp = () => {
    const cleanNumber = catalog?.whatsapp?.replace(/\D/g, '') || '5511999998888';
    const storeName = catalog?.storeName || 'Vitryne Boutique';
    const shippingLabel =
      shippingType === 'motoboy'
        ? 'Motoboy Express'
        : shippingType === 'sedex'
        ? 'Sedex'
        : 'Retirada na Loja';

    const message = `Olá! Realizei o pagamento via *PIX* para o pedido *#${params.orderId}* na *${storeName}*:\n\n📸 *COMPROVANTE DE PAGAMENTO PIX ANEXO ACIMA 📎*\n\n• 1x Vestido Floral Midi de Linho (Tam: 40) - R$ 149.90\n🚚 *FORMA DE ENTREGA:* ${shippingLabel} (R$ ${shippingCosts[shippingType].toFixed(2)})\n💰 *TOTAL PAGO:* R$ ${totalAmount}\n👤 *BENEFICIÁRIO:* ${beneficiaryName}\n\nSegue o comprovante em anexo! Podem confirmar o envio? Obrigado(a)!`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSimulatePayment = () => {
    setIsPaid(true);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-5">
      {/* Timer Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>{timeLeftSeconds > 0 ? 'Reserva Garantida' : 'Tempo Expirado'}</span>
        </div>
        <span className="font-mono text-sm font-bold text-slate-900">
          {timeLeftSeconds > 0 ? timerFormatted : '00:00'}
        </span>
      </div>

      {isPaid ? (
        <div className="p-8 rounded-2xl bg-white border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <h2 className="font-heading font-bold text-xl text-slate-900">
            Pagamento Confirmado
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Seu pedido foi processado com sucesso. Enviamos a confirmação no seu Instagram e WhatsApp.
          </p>
          <div className="p-3 rounded-lg bg-slate-50 text-xs text-slate-500 font-mono">
            Pedido #VIT-8942-SP
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
          {/* Item */}
          <div className="pb-4 border-b border-slate-100 flex justify-between items-start">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Peça Única • Tam. 40
              </span>
              <h3 className="font-heading font-semibold text-slate-900 text-base">
                Vestido Floral Midi de Linho
              </h3>
            </div>
            <div className="font-heading font-bold text-lg text-slate-900">
              R$ {itemPrice.toFixed(2)}
            </div>
          </div>

          {/* Entrega */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Forma de Entrega:
            </label>
            <div className="space-y-1.5">
              <label
                onClick={() => setShippingType('motoboy')}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                  shippingType === 'motoboy'
                    ? 'border-slate-900 bg-slate-50 font-medium'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Motoboy Express (Mesmo Dia)</span>
                <span className="font-bold text-slate-900">R$ 15,00</span>
              </label>

              <label
                onClick={() => setShippingType('retirada')}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                  shippingType === 'retirada'
                    ? 'border-slate-900 bg-slate-50 font-medium'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Retirada na Loja (Cerqueira César)</span>
                <span className="font-bold text-emerald-700">Grátis</span>
              </label>
            </div>
          </div>

          {/* Pagamento */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Método de Pagamento:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  paymentMethod === 'pix'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Chave PIX
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Cartão de Crédito
              </button>
            </div>

            {paymentMethod === 'pix' && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3.5 shadow-xs">
                <div className="p-4 bg-white rounded-xl border border-slate-200/80 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Chave PIX Oficial
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {pixKeyType === 'phone'
                        ? 'Telefone Celular'
                        : pixKeyType === 'cpf'
                        ? 'CPF'
                        : pixKeyType === 'cnpj'
                        ? 'CNPJ'
                        : pixKeyType === 'email'
                        ? 'E-mail'
                        : 'Chave Aleatória'}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm select-all break-all">
                      {formatPixKeyDisplay(pixKey, pixKeyType as any)}
                    </span>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
                    >
                      {copiedPix ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Titular / Favorecido:</span>
                      <strong className="text-slate-800">{beneficiaryName}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Exato:</span>
                      <strong className="text-emerald-700 font-bold text-sm">R$ {totalAmount}</strong>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Copie a chave acima, realize o PIX no aplicativo do seu banco e clique no botão verde para enviar o comprovante no WhatsApp:
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendProofToWhatsApp}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>Enviar Comprovante no WhatsApp</span>
                  </button>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full bg-white hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold"
                    onClick={handleSimulatePayment}
                  >
                    Já Paguei no Meu Banco
                  </Button>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2.5 pt-1">
                <Input placeholder="Número do Cartão" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="MM/AA" />
                  <Input placeholder="CVV" type="password" />
                </div>
                <Input placeholder="Nome Impresso no Cartão" />
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={handleSimulatePayment}
                >
                  Pagar R$ {totalAmount}
                </Button>
              </div>
            )}
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
            <span className="text-slate-500">Total:</span>
            <span className="font-heading font-extrabold text-xl text-slate-900">
              R$ {totalAmount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
