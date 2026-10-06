'use client';

import React, { useState } from 'react';
import {
  X,
  Check,
  Copy,
  Wallet,
  ShieldCheck,
  MessageCircle,
  ExternalLink,
  Info,
  Sparkles,
} from 'lucide-react';
import { StorePaymentConfig } from '@/lib/catalog/types';
import {
  formatPixKeyDisplay,
  getPixKeyTypeLabel,
} from '@/lib/pix/brcode';

export interface PixOrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  storeName: string;
  whatsappNumber: string;
  paymentConfig?: StorePaymentConfig;
  items?: PixOrderItem[];
  shippingLabel?: string;
  shippingCost?: number;
  discountAmount?: number;
  onFallbackDirectWhatsApp?: () => void;
}

export function PixPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  storeName,
  whatsappNumber,
  paymentConfig,
  items = [],
  shippingLabel,
  shippingCost = 0,
  discountAmount = 0,
  onFallbackDirectWhatsApp,
}: PixPaymentModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  // Chave e configurações do lojista
  const pixKey = paymentConfig?.pixKey || '';
  const pixKeyType = paymentConfig?.pixKeyType || 'phone';
  const beneficiaryName = paymentConfig?.pixBeneficiaryName || storeName || 'Loja Vitryne';
  const beneficiaryCity = paymentConfig?.pixBeneficiaryCity || 'SAO PAULO';

  if (!isOpen) return null;

  const cleanWhatsAppNumber = whatsappNumber.replace(/\D/g, '') || '5511999998888';
  const formattedKey = formatPixKeyDisplay(pixKey, pixKeyType);
  const keyTypeLabel = getPixKeyTypeLabel(pixKeyType);

  const handleCopyRawKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 3000);
  };

  const handleSendProofToWhatsApp = () => {
    let itemsList = '';
    items.forEach((item) => {
      const sizeStr = item.size ? ` (Tam: ${item.size})` : '';
      const colorStr = item.color ? ` [Cor: ${item.color}]` : '';
      itemsList += `• ${item.quantity}x ${item.name}${sizeStr}${colorStr} - R$ ${(
        item.price * item.quantity
      ).toFixed(2)}\n`;
    });

    const discountMsg =
      discountAmount > 0 ? `🎟️ *DESCONTO APLICADO:* -R$ ${discountAmount.toFixed(2)}\n` : '';

    const shippingMsg = shippingLabel
      ? `🚚 *FORMA DE ENTREGA:* ${shippingLabel} (${shippingCost === 0 ? 'Grátis' : `R$ ${shippingCost.toFixed(2)}`})\n`
      : '';

    const message = `Olá! Acabei de realizar o pagamento via *PIX* para o meu pedido na *${storeName}*! ✨\n\n📸 *COMPROVANTE DE PAGAMENTO PIX ANEXO ACIMA 📎*\n\n🛍️ *ITENS DO PEDIDO:*\n${itemsList || '• Itens selecionados no catálogo\n'}\n${discountMsg}${shippingMsg}💰 *TOTAL PAGO NO PIX:* R$ ${totalAmount.toFixed(
      2
    )}\n🔑 *CHAVE UTILIZADA:* ${formattedKey || pixKey} (${keyTypeLabel})\n👤 *BENEFICIÁRIO:* ${beneficiaryName}\n\nSegue meu comprovante em anexo! Poderiam confirmar o recebimento e o envio? Muito obrigado(a)!`;

    window.open(
      `https://wa.me/${cleanWhatsAppNumber}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header com Gradiente Elegante */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Wallet className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-extrabold text-base sm:text-lg tracking-tight">
                  Pagar com PIX
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/25">
                  Instantâneo
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                {storeName} • Confirmação direta no WhatsApp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white/90 hover:text-white transition-colors"
            aria-label="Fechar modal de pagamento"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo Rolável */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Card do Valor Total */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-950/70 uppercase tracking-wider block">
                Valor Total do Pedido
              </span>
              <span className="text-2xl sm:text-3xl font-heading font-black text-emerald-700">
                R$ {totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 block mb-1">
                Sem Taxas Adicionais
              </span>
              <span className="text-[10px] text-emerald-900/60">Aprovação imediata</span>
            </div>
          </div>

          {/* Dados do Titular / Beneficiário */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Beneficiário:</span>
              <span className="font-semibold text-slate-800 text-right">{beneficiaryName}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Tipo de Chave:</span>
              <span className="font-medium text-slate-700">{keyTypeLabel}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Cidade da Conta:</span>
              <span className="font-medium text-slate-700">{beneficiaryCity}</span>
            </div>
          </div>

          {/* Bloco Chave PIX com 1 clique para copiar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chave PIX da Loja ({keyTypeLabel})</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold lowercase">1 clique para copiar</span>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
              <span className="font-mono font-bold text-slate-900 text-sm select-all break-all">
                {formattedKey || pixKey || 'Chave não informada'}
              </span>
              <button
                type="button"
                onClick={handleCopyRawKey}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 ${
                  copiedKey
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Chave</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Passo a Passo Ilustrado */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2 text-xs text-amber-950">
            <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[11px] uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-amber-700" />
              <span>Como concluir seu pedido:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-amber-900/90 pl-1">
              <li>
                Clique em <strong>Copiar Chave</strong> acima e abra o aplicativo do seu banco.
              </li>
              <li>
                Escolha a opção <strong>Transferir via PIX</strong>, insira a chave e confirme o valor de <strong>R$ {totalAmount.toFixed(2)}</strong>.
              </li>
              <li>
                Tire print ou salve o comprovante e clique no botão verde abaixo para <strong>enviar o comprovante no WhatsApp da loja</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Rodapé de Ações com Botão de Destaque WhatsApp */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 space-y-2.5 shrink-0">
          <button
            type="button"
            onClick={handleSendProofToWhatsApp}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2.5 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-white text-emerald-600" />
            <span>Enviar Comprovante no WhatsApp</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Seu pedido é reservado na hora</span>
            </div>

            {onFallbackDirectWhatsApp && !(paymentConfig?.pixEnabled && paymentConfig?.pixKey?.trim()) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onFallbackDirectWhatsApp();
                }}
                className="text-slate-600 hover:text-slate-900 underline font-medium"
              >
                Finalizar sem PIX
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
