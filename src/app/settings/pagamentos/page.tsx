'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  KeyRound,
  Check,
  ShieldCheck,
  Smartphone,
  Mail,
  Key,
  FileText,
  Building,
  MapPin,
  MessageCircle,
  Eye,
  AlertCircle,
  Copy,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CatalogConfig, PixKeyType, StorePaymentConfig } from '@/lib/catalog/types';
import {
  formatPixKeyDisplay,
  getPixKeyTypeLabel,
} from '@/lib/pix/brcode';

const KEY_TYPES: Array<{
  id: PixKeyType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  hint: string;
}> = [
  {
    id: 'phone',
    label: 'Telefone Celular',
    icon: Smartphone,
    placeholder: 'Ex: (11) 99999-8888 ou 11999998888',
    hint: 'DDD + 9 dígitos do seu celular cadastrado no banco',
  },
  {
    id: 'cpf',
    label: 'CPF',
    icon: FileText,
    placeholder: 'Ex: 123.456.789-00 ou 12345678900',
    hint: '11 dígitos do CPF do titular da conta bancária',
  },
  {
    id: 'cnpj',
    label: 'CNPJ',
    icon: Building,
    placeholder: 'Ex: 12.345.678/0001-90 ou 12345678000190',
    hint: '14 dígitos do CNPJ da sua empresa/MEI',
  },
  {
    id: 'email',
    label: 'E-mail',
    icon: Mail,
    placeholder: 'Ex: financeiro@sualoja.com.br',
    hint: 'Endereço de e-mail cadastrado como chave PIX',
  },
  {
    id: 'random',
    label: 'Chave Aleatória (EVP)',
    icon: Key,
    placeholder: 'Ex: 123e4567-e89b-12d3-a456-426614174000',
    hint: 'Chave gerada automaticamente pelo seu banco',
  },
];

export default function PaymentsSettingsPage() {
  const [catalog, setCatalog] = useState<CatalogConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [errorFeedback, setErrorFeedback] = useState('');

  // Estados do formulário de PIX
  const [pixEnabled, setPixEnabled] = useState(true);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('phone');
  const [pixKey, setPixKey] = useState('');
  const [pixBeneficiaryName, setPixBeneficiaryName] = useState('');
  const [pixBeneficiaryCity, setPixBeneficiaryCity] = useState('São Paulo');
  const [showPixScreenWithProof, setShowPixScreenWithProof] = useState(true);
  const [allowWhatsAppDirectCheckout, setAllowWhatsAppDirectCheckout] = useState(true);
  const [previewCopied, setPreviewCopied] = useState(false);

  // Carrega catálogo atual ao abrir a página
  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalog');
        if (res.ok) {
          const data = await res.json();
          if (data.catalog) {
            setCatalog(data.catalog);
            const pConfig: StorePaymentConfig | undefined = data.catalog.paymentConfig;
            if (pConfig) {
              setPixEnabled(pConfig.pixEnabled ?? true);
              setPixKeyType(pConfig.pixKeyType || 'phone');
              setPixKey(pConfig.pixKey || '');
              setPixBeneficiaryName(pConfig.pixBeneficiaryName || data.catalog.storeName || '');
              setPixBeneficiaryCity(pConfig.pixBeneficiaryCity || 'São Paulo');
              setShowPixScreenWithProof(pConfig.showPixScreenWithProof ?? true);
              setAllowWhatsAppDirectCheckout(pConfig.allowWhatsAppDirectCheckout ?? true);
            } else {
              setPixBeneficiaryName(data.catalog.storeName || '');
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de pagamento:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const selectedKeyTypeInfo = KEY_TYPES.find((k) => k.id === pixKeyType) || KEY_TYPES[0];

  const handleCopyPreviewKey = () => {
    if (!pixKey) return;
    navigator.clipboard.writeText(pixKey);
    setPreviewCopied(true);
    setTimeout(() => setPreviewCopied(false), 2500);
  };

  const handleSave = async () => {
    if (!catalog) return;
    setIsSaving(true);
    setErrorFeedback('');

    // Validação básica se PIX estiver habilitado
    if (pixEnabled && !pixKey.trim()) {
      setErrorFeedback('Por favor, informe a sua Chave PIX para habilitar o recebimento.');
      setIsSaving(false);
      return;
    }

    const isPixActive = pixEnabled && Boolean(pixKey.trim());

    try {
      const updatedCatalog: CatalogConfig = {
        ...catalog,
        paymentConfig: {
          pixEnabled,
          pixKeyType,
          pixKey: pixKey.trim(),
          pixBeneficiaryName: pixBeneficiaryName.trim(),
          pixBeneficiaryCity: pixBeneficiaryCity.trim() || 'São Paulo',
          showPixScreenWithProof,
          allowWhatsAppDirectCheckout: isPixActive ? false : allowWhatsAppDirectCheckout,
        },
      };

      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCatalog),
      });

      if (!res.ok) {
        throw new Error('Falha ao salvar no servidor');
      }

      setCatalog(updatedCatalog);
      try {
        localStorage.setItem('vitryne_catalog_config', JSON.stringify(updatedCatalog));
      } catch {
        // silencioso
      }

      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 3500);
    } catch (err: any) {
      setErrorFeedback(err.message || 'Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-16 text-center text-slate-400 text-sm">
        Carregando configurações de pagamento...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-16">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Pagamentos &amp; Chave PIX
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Instantâneo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre a chave PIX da sua loja para receber direto na sua conta bancária sem taxas de intermediação.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
          leftIcon={savedFeedback ? <Check className="w-4 h-4 stroke-[3]" /> : undefined}
        >
          {isSaving ? 'Salvando...' : savedFeedback ? 'Configurações Salvas!' : 'Salvar Alterações'}
        </Button>
      </div>

      {/* Alerta de Feedback de Sucesso */}
      {savedFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>
            Chave PIX e opções de finalização salvas com sucesso! Sua vitrine já está atualizada para os clientes.
          </span>
        </div>
      )}

      {/* Alerta de Erro */}
      {errorFeedback && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorFeedback}</span>
        </div>
      )}

      {/* 1. Ativação Geral do PIX */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-slate-900">
                Recebimento Direto via Chave PIX
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5 max-w-lg">
                Seu cliente recebe a chave PIX direta com 1 clique para copiar e envia o comprovante no WhatsApp. O valor cai 100% na sua conta sem QR Code ou taxas de intermediários.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={pixEnabled}
              onChange={(e) => setPixEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {pixEnabled && (
          <div className="space-y-6 pt-1">
            {/* Seleção do Tipo de Chave */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Tipo da sua Chave PIX:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {KEY_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = pixKeyType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setPixKeyType(type.id)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-1 ring-emerald-600'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />}
                      </div>
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input da Chave PIX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Sua Chave PIX ({selectedKeyTypeInfo.label}):</span>
                  <span className="text-[11px] text-slate-400 font-normal">{selectedKeyTypeInfo.hint}</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={selectedKeyTypeInfo.placeholder}
                    className="font-mono text-sm py-2.5 pl-3.5 pr-10"
                  />
                  {pixKey && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-medium text-emerald-600">
                      ✓
                    </div>
                  )}
                </div>
              </div>

              {/* Nome do Titular / Beneficiário */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Nome do Titular / Beneficiário:
                </label>
                <Input
                  type="text"
                  value={pixBeneficiaryName}
                  onChange={(e) => setPixBeneficiaryName(e.target.value)}
                  placeholder="Ex: Maria da Silva ou Nome da Loja"
                  className="text-xs sm:text-sm py-2"
                />
                <p className="text-[11px] text-slate-400">
                  Nome que aparece para o cliente conferir antes de confirmar a transferência.
                </p>
              </div>

              {/* Cidade do Titular */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Cidade da Conta Bancária:
                </label>
                <Input
                  type="text"
                  value={pixBeneficiaryCity}
                  onChange={(e) => setPixBeneficiaryCity(e.target.value)}
                  placeholder="Ex: São Paulo"
                  className="text-xs sm:text-sm py-2"
                />
                <p className="text-[11px] text-slate-400">
                  Cidade do titular cadastrada no banco (padrão BACEN).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Opções de Finalização para o Cliente no Checkout */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="font-heading font-bold text-base text-slate-900">
            Opções de Finalização na Sacola / Checkout
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defina como o seu cliente poderá concluir o pedido ao finalizar as compras na vitrine.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {/* Opção A: Mostrar PIX com Copia e Cola na Tela e enviar comprovante para o WhatsApp */}
          <label className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3.5 cursor-pointer transition-all">
            <input
              type="checkbox"
              checked={showPixScreenWithProof}
              onChange={(e) => setShowPixScreenWithProof(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Mostrar Chave PIX na tela &amp; Enviar Comprovante no WhatsApp
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ao clicar em finalizar pedido, exibe o valor do pedido, a Chave PIX da loja formatada para cópia com 1 clique e o botão{' '}
                <strong>&quot;Enviar Comprovante no WhatsApp&quot;</strong>, direcionando o cliente para o seu WhatsApp com o pedido pronto e comprovante anexo.
              </p>
            </div>
          </label>

          {/* Opção B: Finalizar direto pelo WhatsApp (apenas quando PIX não estiver ativo) */}
          <label
            className={`p-4 rounded-2xl border transition-all ${
              pixEnabled && pixKey.trim()
                ? 'border-slate-200 bg-slate-50/80 opacity-75 cursor-not-allowed'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 cursor-pointer'
            } flex items-start gap-3.5`}
          >
            <input
              type="checkbox"
              checked={pixEnabled && pixKey.trim() ? false : allowWhatsAppDirectCheckout}
              disabled={Boolean(pixEnabled && pixKey.trim())}
              onChange={(e) => setAllowWhatsAppDirectCheckout(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  Permitir Finalizar Pedido Direto pelo WhatsApp (Sem PIX)
                </span>
                {pixEnabled && pixKey.trim() && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                    Desativado com PIX Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pixEnabled && pixKey.trim()
                  ? 'Como a sua Chave PIX está ativa, o cliente só pode finalizar os pedidos pela sacola pagando via PIX com envio de comprovante, impedindo pedidos diretos pelo WhatsApp sem pagamento.'
                  : 'Exibe o botão de enviar o pedido formatado diretamente para o seu WhatsApp comercial, para quem prefere negociar e combinar os detalhes por mensagem.'}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Pré-Visualização em Tempo Real (Live Preview) */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Pré-Visualização do que seu cliente verá no Checkout (Chave Direta)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Tempo Real</span>
        </div>

        {pixEnabled && pixKey ? (
          <div className="p-5 rounded-2xl bg-white text-slate-900 max-w-md mx-auto space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Pagamento com Chave PIX
                </span>
                <span className="font-heading font-black text-2xl text-slate-900">
                  R$ 149,90
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between text-slate-500">
                <span>Beneficiário / Titular:</span>
                <span className="font-semibold text-slate-900">{pixBeneficiaryName || catalog?.storeName || 'Loja'}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tipo de Chave:</span>
                <span className="font-medium text-slate-700">{getPixKeyTypeLabel(pixKeyType)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Cidade da Conta:</span>
                <span className="font-medium text-slate-700">{pixBeneficiaryCity || 'São Paulo'}</span>
              </div>
            </div>

            {/* Chave PIX em destaque com botão de copiar com 1 clique */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-700">
                <span>Chave PIX para Transferência:</span>
                <span className="text-emerald-700 font-semibold lowercase">1 toque para copiar</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2.5">
                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm select-all break-all">
                  {formatPixKeyDisplay(pixKey, pixKeyType)}
                </span>
                <button
                  type="button"
                  onClick={handleCopyPreviewKey}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 transition-colors flex items-center gap-1 shadow-xs"
                >
                  {previewCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{previewCopied ? 'Copiado!' : 'Copiar Chave'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md pointer-events-none"
            >
              <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
              <span>Enviar Comprovante no WhatsApp</span>
            </button>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs space-y-2">
            <KeyRound className="w-8 h-8 mx-auto text-slate-600" />
            <p>Preencha sua Chave PIX acima para visualizar o card de pagamento direto dos seus clientes.</p>
          </div>
        )}
      </div>

      {/* Botão de Salvar no Rodapé */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-500 px-8 font-bold shadow-lg shadow-emerald-600/25"
          leftIcon={savedFeedback ? <Check className="w-4 h-4 stroke-[3]" /> : undefined}
        >
          {isSaving ? 'Salvando...' : savedFeedback ? 'Configurações Salvas!' : 'Salvar Configurações de Pagamento'}
        </Button>
      </div>
    </div>
  );
}
