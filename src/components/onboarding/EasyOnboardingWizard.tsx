'use client';

import React, { useState } from 'react';
import { CatalogConfig, CatalogTemplate } from '@/lib/catalog/types';
import { TEMPLATES } from '@/lib/catalog/templates';
import {
  ShoppingBag,
  Sparkles,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Bot,
  Zap,
  MessageCircle,
  ExternalLink,
  Store,
  Layers,
  Heart,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EasyOnboardingWizardProps {
  initialConfig?: CatalogConfig;
  onFinish: (completedConfig: CatalogConfig) => void;
  onCancel?: () => void;
}

export default function EasyOnboardingWizard({
  initialConfig,
  onFinish,
  onCancel,
}: EasyOnboardingWizardProps) {
  // Passos do Wizard: 1 (Tipo de Negócio) -> 2 (Templates) -> 3 (Configuração da IA) -> 4 (Tudo Pronto)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // 1. Tipo de Negócio Escolhido
  const [businessType, setBusinessType] = useState<'products' | 'services'>(
    initialConfig?.businessType === 'services' ? 'services' : 'products'
  );

  // 2. Template Selecionado
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialConfig?.templateId || 'boutique'
  );

  // Nome da Loja
  const [storeName, setStoreName] = useState<string>(
    initialConfig?.storeName || 'Minha Loja'
  );

  // WhatsApp para Fechamento de Vendas / Agendamentos
  const [whatsappNumber, setWhatsappNumber] = useState<string>(
    initialConfig?.whatsapp || ''
  );

  // 3. Configurações da IA
  const [aiTone, setAiTone] = useState<'friendly' | 'elegant' | 'direct'>('friendly');
  const [autoReplyComments, setAutoReplyComments] = useState<boolean>(true);
  const [autoSendDirectLink, setAutoSendDirectLink] = useState<boolean>(true);

  // Templates filtrados de acordo com o tipo escolhido
  const availableTemplates = TEMPLATES.filter((t) => {
    const isServiceTemplate =
      t.segment === 'services' || t.config.businessType === 'services';
    return businessType === 'services' ? isServiceTemplate : !isServiceTemplate;
  });

  // Template atualmente selecionado
  const selectedTemplate =
    TEMPLATES.find((t) => t.id === selectedTemplateId) || availableTemplates[0] || TEMPLATES[0];

  // Avançar para próximo passo
  const handleNextFromStep1 = () => {
    // Ao escolher o tipo, se o template atual não for do tipo correspondente, seleciona o primeiro template da categoria
    const currentIsMatching =
      businessType === 'services'
        ? selectedTemplate.segment === 'services' || selectedTemplate.config.businessType === 'services'
        : !(selectedTemplate.segment === 'services' || selectedTemplate.config.businessType === 'services');

    if (!currentIsMatching && availableTemplates.length > 0) {
      setSelectedTemplateId(availableTemplates[0].id);
      if (storeName === 'Minha Loja') {
        setStoreName(availableTemplates[0].config.storeName);
      }
    }
    setCurrentStep(2);
  };

  const handleSelectTemplate = (template: CatalogTemplate) => {
    setSelectedTemplateId(template.id);
    if (!storeName || storeName === 'Minha Loja') {
      setStoreName(template.config.storeName);
    }
  };

  // Concluir e Gerar Catálogo Final
  const handleFinalize = () => {
    const baseTemplate =
      TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];

    const slug = (storeName || baseTemplate.config.storeName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const finalConfig: CatalogConfig = {
      ...baseTemplate.config,
      storeName: storeName || baseTemplate.config.storeName,
      slug: slug || baseTemplate.config.slug,
      templateId: selectedTemplateId,
      templateChosen: true,
      businessType: businessType,
      whatsapp: whatsappNumber.replace(/\D/g, '') || baseTemplate.config.whatsapp || '5511999999999',
      actionButtonLabel: businessType === 'services' ? 'Agendar no WhatsApp' : 'Comprar no WhatsApp',
      // Regras de agendamento se for serviço
      scheduling:
        businessType === 'services'
          ? {
              enabled: true,
              bookingMode: 'appointment',
              allowMultipleBookings: true,
              businessHours: 'Segunda a Sábado das 08h às 19h',
              timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
              serviceNotice: 'Chegue com 10 min de antecedência.',
            }
          : undefined,
      schedulingConfig:
        businessType === 'services'
          ? {
              enabled: true,
              bookingMode: 'appointment',
              allowMultipleBookings: true,
              businessHours: 'Segunda a Sábado das 08h às 19h',
              timeSlots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'],
            }
          : undefined,
    };

    onFinish(finalConfig);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Barra de Progresso no Topo */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Configuração Rápida Vitryne</span>
          </span>
          <span>Passo {currentStep} de 4</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Conteúdo Principal por Passo */}
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center py-4">
        {/* ===================================================================
            PASSO 1: IDENTIFICAR SE É PRODUTO OU SERVIÇO (CLARO E DIRETO)
        ==================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                1º Passo Essencial
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Qual é o modelo do seu negócio?
              </h1>
              <p className="text-sm text-slate-400">
                Escolha abaixo para personalizarmos seu catálogo com as opções certas (carrinho e frete para produtos ou agenda e WhatsApp para serviços).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-2">
              {/* Opção 1: Produtos Físicos */}
              <div
                onClick={() => setBusinessType('products')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  businessType === 'products'
                    ? 'border-indigo-500 bg-indigo-950/40 shadow-xl shadow-indigo-950/50 ring-2 ring-indigo-500/30'
                    : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Produtos Físicos</span>
                      {businessType === 'products' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Moda, roupas, calçados, joias, eletrônicos, cosméticos, acessórios e alimentos/delivery.
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Fotos, tamanhos (P, M, G) e paleta de cores</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Controle de estoque e aviso de esgotado</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Cálculo de frete, Motoboy e Correios</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-indigo-300">
                    {businessType === 'products' ? 'Selecionado' : 'Clique para escolher'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      businessType === 'products'
                        ? 'border-indigo-400 bg-indigo-600 text-white'
                        : 'border-slate-600'
                    }`}
                  >
                    {businessType === 'products' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>

              {/* Opção 2: Serviços & Agendamentos */}
              <div
                onClick={() => setBusinessType('services')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-4 ${
                  businessType === 'services'
                    ? 'border-purple-500 bg-purple-950/40 shadow-xl shadow-purple-950/50 ring-2 ring-purple-500/30'
                    : 'border-slate-800 bg-slate-800/50 hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Serviços & Procedimentos</span>
                      {businessType === 'services' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Barbearias, salões, unhas, estética, higienização de estofados, lavagem automotiva e aluguel.
                    </p>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Tempo de duração do procedimento (ex: 45 min)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Modo Horário Marcado ou Ordem de Chegada</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Sem frete • Confirmação direta no WhatsApp</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-purple-300">
                    {businessType === 'services' ? 'Selecionado' : 'Clique para escolher'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                      businessType === 'services'
                        ? 'border-purple-400 bg-purple-600 text-white'
                        : 'border-slate-600'
                    }`}
                  >
                    {businessType === 'services' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNextFromStep1}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto px-8 bg-indigo-600 hover:bg-indigo-500 font-bold"
              >
                Continuar com {businessType === 'services' ? 'Serviços' : 'Produtos'}
              </Button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASSO 2: MOSTRAR TEMPLATES CONFORME O TIPO ESCOLHIDO
        ==================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                2º Passo: Visual & Estilo
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Escolha o template do seu nicho
              </h2>
              <p className="text-sm text-slate-400">
                Templates exclusivos para {businessType === 'services' ? 'Serviços & Procedimentos' : 'Produtos & Varejo'}. Você poderá alterar cores e fotos a qualquer momento.
              </p>
            </div>

            {/* Nome da Loja / Negócio */}
            <div className="max-w-md mx-auto bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
              <label className="block text-xs font-bold text-slate-200">
                Nome da Sua Loja ou Negócio
              </label>
              <input
                type="text"
                placeholder={businessType === 'services' ? 'Ex: Barbearia Vip, Studio Glamour' : 'Ex: Aura Boutique, Chic & Belle'}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Grid de Templates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto pr-1">
              {availableTemplates.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-400 bg-slate-800 ring-2 ring-indigo-500/30 shadow-lg'
                        : 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    {/* Imagem do Template */}
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-900 relative">
                      <img
                        src={tmpl.thumbnail}
                        alt={tmpl.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2 right-2">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center shadow-xs ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-black/50 border-white/40'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-xs">
                          {tmpl.categoryName}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-white truncate">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {tmpl.tagline}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[11px]">
                      <span className="text-slate-400">Paleta:</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: tmpl.config.theme?.primaryColor || '#6366f1' }}
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: tmpl.config.theme?.accentColor || '#ec4899' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 max-w-xl mx-auto">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 font-bold px-6"
              >
                Avançar para Configuração da IA
              </Button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASSO 3: CONFIGURAÇÃO DA IA (SIMPLES, CLARA, SEM JARGÕES)
        ==================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                3º Passo: Automação Inteligente
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Como a IA deve atender seus clientes?
              </h2>
              <p className="text-sm text-slate-400">
                A IA atua como sua atendente 24 horas no WhatsApp e no Instagram, tirando dúvidas e enviando o link certo para fechar a venda.
              </p>
            </div>

            <div className="max-w-xl mx-auto space-y-4">
              {/* WhatsApp da Loja para onde vão os pedidos/agendamentos */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2">
                <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp que receberá os pedidos e agendamentos</span>
                </label>
                <input
                  type="tel"
                  placeholder="Ex: (11) 99999-8888"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Os clientes clicarão no botão do catálogo e a mensagem pronta chegará diretamente neste número.
                </p>
              </div>

              {/* Tom de Voz da IA */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-2.5">
                <label className="block text-xs font-bold text-slate-200">
                  Tom de Voz do Atendimento
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'friendly', title: 'Amigável 💖', desc: 'Simpática, atenciosa e com emojis leves' },
                    { id: 'elegant', title: 'Elegante ✨', desc: 'Educada, sofisticada e refinada' },
                    { id: 'direct', title: 'Direta ⚡', desc: 'Objetiva, responde preço e link na hora' },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setAiTone(tone.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        aiTone === tone.id
                          ? 'border-emerald-400 bg-emerald-950/40 text-white font-bold ring-1 ring-emerald-400'
                          : 'border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-xs block">{tone.title}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{tone.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comportamento de Resposta */}
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 space-y-3">
                <label className="block text-xs font-bold text-slate-200">
                  Ações Automáticas da Atendente IA
                </label>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Responder comentários com Link Direto
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Quando comentarem "quero", "preço" ou "valor", envia direct imediato com a peça ou serviço exato.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoReplyComments}
                    onChange={(e) => setAutoReplyComments(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-700/50">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {businessType === 'services'
                        ? 'Facilitar Agendamento Imediato'
                        : 'Verificar Estoque em Tempo Real'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {businessType === 'services'
                        ? 'Envia o botão de confirmação de horário no WhatsApp com o procedimento já selecionado.'
                        : 'Avisa se o tamanho ou cor está disponível e envia o link direto para colocar na sacola.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSendDirectLink}
                    onChange={(e) => setAutoSendDirectLink(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 max-w-xl mx-auto">
              <Button
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                Voltar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(4)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 font-bold px-6"
              >
                Finalizar e Ver Vitrine
              </Button>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASSO 4: TUDO PRONTO! (RESUMO E ACESSO IMEDIATO)
        ==================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Configuração Concluída com Sucesso! 🎉
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Sua vitrine está pronta para vender!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Seu catálogo já foi configurado para <strong>{businessType === 'services' ? 'Serviços & Procedimentos' : 'Produtos Físicos'}</strong> com design moderno e IA integrada.
              </p>
            </div>

            {/* Card com Detalhes */}
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Negócio:</span>
                <span className="text-xs font-bold text-white">{storeName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Tipo de Catálogo:</span>
                <span className="text-xs font-bold text-indigo-400">
                  {businessType === 'services' ? 'Serviços & Agendamento' : 'Produtos & Varejo'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                <span className="text-xs text-slate-400">Template Escolhido:</span>
                <span className="text-xs font-bold text-white">{selectedTemplate.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Atendente de IA:</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Ativa (Tom {aiTone === 'friendly' ? 'Amigável' : aiTone === 'elegant' ? 'Elegante' : 'Direto'})</span>
                </span>
              </div>
            </div>

            {/* Botões Finais de Ação */}
            <div className="space-y-2.5 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleFinalize}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold text-sm py-3.5 shadow-lg shadow-emerald-950/50"
              >
                {businessType === 'services' ? 'Cadastrar Meus Serviços no Catálogo' : 'Cadastrar Meus Produtos no Catálogo'}
              </Button>

              <button
                type="button"
                onClick={handleFinalize}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-medium transition-colors"
              >
                Ou ir direto para o painel principal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé Seguro */}
      <div className="max-w-4xl mx-auto w-full pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Vitryne • Vendas e Agendamentos no WhatsApp e Instagram</span>
        </span>
        {onCancel && currentStep === 1 && (
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Pular configuração
          </button>
        )}
      </div>
    </div>
  );
}
