'use client';

import React, { useState } from 'react';
import {
  Check,
  Zap,
  Shield,
  Bot,
  MessageSquare,
  ShoppingBag,
  HelpCircle,
  CheckCircle2,
  Camera,
  Truck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PlanDetail {
  id: 'iniciante' | 'profissional' | 'completo';
  name: string;
  price: number;
  period: string;
  description: string;
  isRecommended?: boolean;
  limits: {
    channels: string;
    products: string;
    aiMessages: string;
    storyImport: string;
  };
  features: string[];
}

const PLANS: PlanDetail[] = [
  {
    id: 'iniciante',
    name: 'Iniciante',
    price: 0,
    period: '/mês',
    description: 'Para quem está começando a organizar as vendas e quer testar o catálogo e atendimento básico.',
    limits: {
      channels: 'Apenas Direct (DMs)',
      products: 'Até 15 produtos ativos',
      aiMessages: '50 respostas IA / mês',
      storyImport: 'Até 15 fotos via Stories',
    },
    features: [
      'IA atende clientes no Direct 24 horas por dia',
      'Até 15 produtos ativos no catálogo online',
      'Cadastro de produtos por foto nos Stories (até 15 itens)',
      'Catálogo online com link para colocar na bio do Instagram',
      'Checkout com envio direto do pedido para o WhatsApp',
      'Painel de controle com pedidos, clientes e vendas',
      'Suporte por e-mail',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 97,
    period: '/mês',
    isRecommended: true,
    description: 'Para lojas que querem vender no automático no Direct e responder comentários de posts do feed.',
    limits: {
      channels: 'Direct + Comentários do Feed',
      products: 'Até 100 produtos ativos',
      aiMessages: '1.500 respostas IA / mês',
      storyImport: 'Até 100 fotos via Stories',
    },
    features: [
      'IA responde Directs e Comentários em posts do Feed',
      'Até 100 produtos ativos no catálogo',
      'Auto-cadastro inteligente por foto dos Stories (até 100 itens)',
      '1.500 respostas automáticas de IA por mês (~50 atendimentos/dia)',
      'Filtro de intenção de compra (qualifica clientes reais antes de gastar cota)',
      'Cálculo automático de valor de entrega (motoboy e frete)',
      'Painel de vendas em tempo real com métricas dos itens mais buscados',
      'Suporte prioritário via WhatsApp',
    ],
  },
  {
    id: 'completo',
    name: 'Completo',
    price: 197,
    period: '/mês',
    description: 'Para marcas e criadores com alto fluxo que precisam de atendimento total em todos os canais.',
    limits: {
      channels: 'Direct, Feed, Reels e Stories',
      products: 'Produtos Ilimitados',
      aiMessages: '5.000 respostas IA / mês',
      storyImport: 'Importação Ilimitada',
    },
    features: [
      'Cobertura total 360°: Direct, Comentários do Feed, Reels e Stories',
      'Produtos e serviços ilimitados no catálogo',
      'Auto-cadastro ilimitado via Stories',
      '5.000 respostas automáticas de IA por mês (~160 atendimentos/dia)',
      'IA com tom de voz e regras personalizadas sob medida para sua marca',
      'Regras avançadas de logística: motoboy express, horários de corte e taxa por bairro',
      'Inteligência de Demanda Reprimida (identifica o que clientes pedem fora de estoque)',
      'Conexão de múltiplas contas do Instagram',
      'Suporte VIP direto via WhatsApp',
    ],
  },
];

export default function PlansPage() {
  const [activePlan, setActivePlan] = useState<'iniciante' | 'profissional' | 'completo'>('iniciante');
  const [upgradedMessage, setUpgradedMessage] = useState<string | null>(null);

  const handleSelectPlan = (planId: 'iniciante' | 'profissional' | 'completo') => {
    setActivePlan(planId);
    setUpgradedMessage(
      planId === 'iniciante'
        ? 'Você voltou para o Plano Iniciante (Grátis).'
        : `Plano ${planId === 'profissional' ? 'Profissional (R$ 97/mês)' : 'Completo (R$ 197/mês)'} ativado com sucesso!`
    );
    setTimeout(() => setUpgradedMessage(null), 5000);
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Notificação Flutuante de Sucesso / Feedback */}
      {upgradedMessage && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-medium text-sm shadow-md flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{upgradedMessage}</span>
          </div>
          <button
            onClick={() => setUpgradedMessage(null)}
            className="text-white/80 hover:text-white text-xs underline ml-4 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header com Status da Assinatura Atual */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Assinatura e Capacidade
            </span>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight mt-1">
              Plano Atual: <span className="text-indigo-600 capitalize">{activePlan}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Acompanhe o consumo da sua cota mensal de inteligência artificial, limite de catálogo e canais ativos.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="text-[11px] text-slate-500 block font-semibold uppercase tracking-wider">
              Mensalidade Vigente
            </span>
            <div className="font-heading font-extrabold text-2xl text-slate-900">
              {activePlan === 'iniciante' && 'R$ 0'}
              {activePlan === 'profissional' && 'R$ 97'}
              {activePlan === 'completo' && 'R$ 197'}
              <span className="text-xs font-normal text-slate-500"> / mês</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              Sem fidelidade • Cancele quando quiser
            </span>
          </div>
        </div>

        {/* Métricas de Uso do Ciclo Atual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Métrica 1: Interações IA */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-600" />
                Respostas com IA no mês
              </span>
              <span className="font-bold text-indigo-700">
                {activePlan === 'iniciante' && '18 de 50'}
                {activePlan === 'profissional' && '18 de 1.500'}
                {activePlan === 'completo' && '18 de 5.000'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width:
                    activePlan === 'iniciante'
                      ? '36%'
                      : activePlan === 'profissional'
                        ? '3%'
                        : '1%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {activePlan === 'iniciante'
                ? '32 respostas restantes neste mês'
                : 'Cota confortável para picos de movimento'}
            </p>
          </div>

          {/* Métrica 2: Produtos Ativos */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Produtos Ativos no Catálogo
              </span>
              <span className="font-bold text-emerald-700">
                {activePlan === 'iniciante' && '8 de 15'}
                {activePlan === 'profissional' && '8 de 100'}
                {activePlan === 'completo' && '8 de Ilimitados'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{
                  width:
                    activePlan === 'iniciante'
                      ? '53%'
                      : activePlan === 'profissional'
                        ? '8%'
                        : '4%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {activePlan === 'iniciante'
                ? 'Limite máximo de 15 itens cadastrados'
                : 'Espaço disponível para novos lançamentos'}
            </p>
          </div>

          {/* Métrica 3: Canais Conectados */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Canais de Atendimento Ativos
              </span>
              <span className="font-bold text-blue-700">
                {activePlan === 'iniciante' && 'Direct (DMs)'}
                {activePlan === 'profissional' && 'Direct + Feed'}
                {activePlan === 'completo' && 'Direct, Feed, Reels, Stories'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{
                  width:
                    activePlan === 'iniciante'
                      ? '33%'
                      : activePlan === 'profissional'
                        ? '66%'
                        : '100%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {activePlan === 'completo'
                ? 'Cobertura total em todos os formatos do Instagram'
                : 'Mude de plano para responder também Feed e Reels'}
            </p>
          </div>
        </div>
      </div>

      {/* Seção dos 3 Planos */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
            Escolha o Plano Ideal para a Sua Loja
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Compare com clareza os limites de produtos, capacidade de atendimento da IA e canais suportados.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = activePlan === plan.id;
            const isProfissional = plan.id === 'profissional';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all bg-white ${
                  isProfissional
                    ? 'border-2 border-indigo-600 shadow-md ring-1 ring-indigo-500/20'
                    : 'border border-slate-200 shadow-xs'
                }`}
              >
                <div className="space-y-5">
                  {/* Cabeçalho do Card */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                      {isProfissional && (
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Preço */}
                  <div className="pt-1 border-t border-slate-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                        R$ {plan.price}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {plan.period}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {plan.price === 0 ? 'Sem custo de assinatura' : 'Cobrança mensal, cancele quando quiser'}
                    </span>
                  </div>

                  {/* Botão de Ação */}
                  <div>
                    {isCurrent ? (
                      <div className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-center bg-slate-100 text-slate-700 border border-slate-200">
                        Plano Atual Ativo
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors text-center cursor-pointer shadow-xs ${
                          isProfissional
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                      >
                        {plan.price === 0 ? 'Voltar para Iniciante' : `Escolher Plano ${plan.name}`}
                      </button>
                    )}
                  </div>

                  {/* Especificações Principais */}
                  <div className="rounded-xl bg-slate-50 border border-slate-200/90 p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Onde atende:</span>
                      <span className="font-semibold text-slate-900 text-right">{plan.limits.channels}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Produtos no catálogo:</span>
                      <span className="font-semibold text-slate-900 text-right">{plan.limits.products}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Respostas com IA:</span>
                      <span className="font-semibold text-slate-900 text-right">{plan.limits.aiMessages}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="text-slate-500 font-medium">Cadastro via Stories:</span>
                      <span className="font-semibold text-slate-900 text-right">{plan.limits.storyImport}</span>
                    </div>
                  </div>

                  {/* Lista de Recursos Inclusos */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      O que está incluso:
                    </span>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-700 leading-snug">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela Comparativa Detalhada */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div>
          <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight">
            Comparativo Completo de Recursos
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Veja em detalhes as diferenças entre os planos e escolha a melhor opção para a sua operação.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Recurso</th>
                <th className="py-3 px-4">Iniciante (R$ 0)</th>
                <th className="py-3 px-4 text-indigo-700">Profissional (R$ 97)</th>
                <th className="py-3 px-4 text-slate-900">Completo (R$ 197)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Onde a IA responde?</td>
                <td className="py-3 px-4 text-slate-600">Apenas Direct (DMs)</td>
                <td className="py-3 px-4 font-medium text-indigo-700">Direct + Feed</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Direct, Feed, Reels e Stories</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Limite de produtos ativos</td>
                <td className="py-3 px-4 text-slate-600">Até 15 produtos</td>
                <td className="py-3 px-4 font-medium text-indigo-700">Até 100 produtos</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Ilimitados</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Auto-cadastro por Story</td>
                <td className="py-3 px-4 text-slate-600">Até 15 fotos</td>
                <td className="py-3 px-4 font-medium text-indigo-700">Até 100 fotos</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Ilimitado</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Respostas com IA por mês</td>
                <td className="py-3 px-4 text-slate-600">50 respostas</td>
                <td className="py-3 px-4 font-medium text-indigo-700">1.500 respostas (~50/dia)</td>
                <td className="py-3 px-4 font-semibold text-slate-900">5.000 respostas (~160/dia)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Filtro de intenção de compra</td>
                <td className="py-3 px-4 text-slate-400">Básico</td>
                <td className="py-3 px-4 font-medium text-emerald-700">Incluso (poupa cota da IA)</td>
                <td className="py-3 px-4 font-semibold text-emerald-700">Incluso com alta precisão</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Personalização de tom de voz</td>
                <td className="py-3 px-4 text-slate-400">Padrão Vitryne</td>
                <td className="py-3 px-4 text-slate-600">Configuração rápida</td>
                <td className="py-3 px-4 font-semibold text-slate-900">100% Personalizada sob medida</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Cálculo de entrega e frete</td>
                <td className="py-3 px-4 text-slate-600">Manual no WhatsApp</td>
                <td className="py-3 px-4 font-medium text-indigo-700">Automático (Correios e motoboy)</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Regras flexíveis por bairro e corte</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Painel de vendas e métricas</td>
                <td className="py-3 px-4 text-slate-600">Incluso</td>
                <td className="py-3 px-4 font-medium text-indigo-700">Tempo real incluso</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Inteligência de demanda reprimida</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Contas do Instagram conectadas</td>
                <td className="py-3 px-4 text-slate-600">1 conta</td>
                <td className="py-3 px-4 text-slate-600">1 conta</td>
                <td className="py-3 px-4 font-semibold text-slate-900">Múltiplas contas</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-900">Canal de suporte</td>
                <td className="py-3 px-4 text-slate-600">E-mail</td>
                <td className="py-3 px-4 font-medium text-indigo-700">WhatsApp</td>
                <td className="py-3 px-4 font-semibold text-slate-900">WhatsApp VIP dedicado</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recarga Opcional de Interações Extras */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900">
            Precisa de mais mensagens este mês sem trocar de plano?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Se sua loja teve um pico de movimento ou um Reel viralizou, você pode adicionar um pacote de <strong>500 atendimentos inteligentes extras</strong> por R$ 29,90. Válido para o mês vigente.
          </p>
        </div>

        <div className="shrink-0 text-left md:text-right space-y-2">
          <div className="text-2xl font-extrabold text-slate-900">
            R$ 29,90 <span className="text-xs font-normal text-slate-500">/ 500 mensagens</span>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setUpgradedMessage('Pacote de 500 mensagens adicionais contratado com sucesso!');
              setTimeout(() => setUpgradedMessage(null), 5000);
            }}
            className="w-full md:w-auto font-medium"
          >
            Adicionar +500 Mensagens
          </Button>
        </div>
      </div>

      {/* Garantia & Transparência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 text-xs text-slate-600">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Sem Contrato de Fidelidade</h4>
            <p>Você pode cancelar, pausar ou alterar de plano a qualquer momento sem nenhuma taxa de cancelamento.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
          <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Ativação Imediata</h4>
            <p>Seus novos limites e canais são liberados no mesmo instante em que a alteração de plano for confirmada.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5 shadow-2xs">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Dúvidas sobre os Limites?</h4>
            <p>Nossa equipe ajuda você a calcular o volume ideal de acordo com a quantidade de mensagens da sua loja.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
