'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Zap,
  Sparkles,
  Shield,
  ArrowRight,
  Bot,
  MessageSquare,
  Layers,
  Clock,
  TrendingUp,
  AlertCircle,
  ShoppingBag,
  Truck,
  BarChart3,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PlanDetail {
  id: 'iniciante' | 'profissional' | 'completo';
  name: string;
  price: number;
  period: string;
  badge?: string;
  isPopular?: boolean;
  description: string;
  interactionsLimit: string;
  productsLimit: string;
  channels: string;
  highlights: string[];
}

const PLANS: PlanDetail[] = [
  {
    id: 'iniciante',
    name: 'Iniciante',
    price: 0,
    period: '/mês',
    description: 'Para quem está começando a organizar as vendas e quer testar o piloto automático',
    interactionsLimit: '50 interações com IA / mês',
    productsLimit: 'Até 15 produtos ou serviços ativos',
    channels: 'Responde somente no Direct (DMs)',
    highlights: [
      'IA Atendente no Direct (DMs)',
      'Até 15 produtos ou serviços ativos no catálogo (limite de cadastro via Stories)',
      'Dashboard completo de pedidos, vendas e clientes',
      'Catálogo online com link na bio do Instagram',
      'Checkout e finalização direta no WhatsApp',
      'Atendimento por e-mail',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 97,
    period: '/mês',
    badge: 'Mais Escolhido por Boutiques',
    isPopular: true,
    description: 'Automatize Directs e Comentários do feed, qualifique clientes reais e venda 24/7',
    interactionsLimit: '1.500 interações com IA / mês (~50 atendimentos/dia)',
    productsLimit: 'Até 100 produtos ou serviços ativos',
    channels: 'Direct (DMs) + Comentários em Posts do Feed',
    highlights: [
      'IA Atendente nos Directs + Comentários de Posts do Feed',
      'Até 100 produtos ou serviços ativos no catálogo',
      'Auto-cadastro automático de produtos e/ou serviços por Stories (até 100 itens)',
      'Filtro de Intenção de Compra (qualifica compradores reais e poupa cota)',
      'Dashboard completo em tempo real (pedidos, clientes e produtos mais pedidos)',
      'Cálculo automático de valor de entrega',
      'Atendimento via WhatsApp',
    ],
  },
  {
    id: 'completo',
    name: 'Completo',
    price: 197,
    period: '/mês',
    badge: 'Atendimento Total',
    description: 'Atendimento total em todos os canais com IA personalizada exatamente como você deseja',
    interactionsLimit: '5.000 interações com IA / mês (~160 atendimentos/dia)',
    productsLimit: 'Produtos e serviços ILIMITADOS',
    channels: 'TUDO: Directs, Feed, Reels e Stories (enquetes, menções e reações)',
    highlights: [
      'Responde TUDO: Directs, Comentários do Feed, Reels e Stories',
      'IA Personalizada & Sob Medida: Treinada no tom de voz e regras da sua marca',
      'Produtos e serviços ILIMITADOS no catálogo (Stories e cadastros contínuos)',
      'Regras de entrega sob medida: Motoboy express, horário de corte e frete flexível',
      'Dashboard avançado com Inteligência de Demanda Reprimida',
      'Múltiplas contas do Instagram conectadas simultaneamente',
      'Atendimento via WhatsApp',
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
        : `Plano ${planId === 'profissional' ? 'Profissional (R$ 97/mês)' : 'Completo (R$ 197/mês)'} ativado com sucesso para teste!`
    );
    setTimeout(() => setUpgradedMessage(null), 5000);
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Notificação Flutuante de Sucesso / Feedback */}
      {upgradedMessage && (
        <div className="p-4 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{upgradedMessage}</span>
          </div>
          <button
            onClick={() => setUpgradedMessage(null)}
            className="text-white/80 hover:text-white text-xs underline ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header com Status da Assinatura Atual */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Assinatura Ativa</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Seu Plano Atual: <span className="text-indigo-600 capitalize">{activePlan}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gerencie os limites de produtos, franquia de inteligência artificial e canais integrados da sua loja.
            </p>
          </div>

          <div className="text-left md:text-right shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
              Valor da Assinatura
            </span>
            <div className="font-heading font-extrabold text-2xl text-slate-900">
              {activePlan === 'iniciante' && 'R$ 0'}
              {activePlan === 'profissional' && 'R$ 97'}
              {activePlan === 'completo' && 'R$ 197'}
              <span className="text-xs font-normal text-slate-500"> / mês</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
              Sem carência • Cancele quando quiser
            </span>
          </div>
        </div>

        {/* Métricas de Uso do Ciclo Atual */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Métrica 1: Interações IA */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-600" />
                Interações de IA no mês
              </span>
              <span className="font-extrabold text-indigo-700">
                {activePlan === 'iniciante' && '18 / 50 (36%)'}
                {activePlan === 'profissional' && '18 / 1.500 (1%)'}
                {activePlan === 'completo' && '18 / 5.000 (0.3%)'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all"
                style={{
                  width:
                    activePlan === 'iniciante'
                      ? '36%'
                      : activePlan === 'profissional'
                        ? '5%'
                        : '2%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {activePlan === 'iniciante'
                ? '32 interações restantes neste mês'
                : 'Franquia com folga para picos de movimento'}
            </p>
          </div>

          {/* Métrica 2: Produtos Ativos */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Produtos Ativos no Catálogo
              </span>
              <span className="font-extrabold text-emerald-700">
                {activePlan === 'iniciante' && '8 / 15 produtos'}
                {activePlan === 'profissional' && '8 / 100 produtos'}
                {activePlan === 'completo' && '8 / Ilimitados'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width:
                    activePlan === 'iniciante'
                      ? '53%'
                      : activePlan === 'profissional'
                        ? '8%'
                        : '5%',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {activePlan === 'iniciante'
                ? 'Limite de 15 itens mesmo enviando Stories novos'
                : 'Espaço de sobra para novos lançamentos'}
            </p>
          </div>

          {/* Métrica 3: Canais Conectados */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                Canais de Resposta Ativos
              </span>
              <span className="font-extrabold text-blue-700">
                {activePlan === 'iniciante' && 'Direct (DMs)'}
                {activePlan === 'profissional' && 'Direct + Feed'}
                {activePlan === 'completo' && 'Direct, Feed, Reels, Stories'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
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
                ? 'Cobertura total 360° em todo o Instagram'
                : 'Faça upgrade para atender comentários e Reels'}
            </p>
          </div>
        </div>
      </div>

      {/* Seção dos 3 Planos Oficiais */}
      <div className="space-y-6">
        <div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
            Compare e Escolha a Estrutura Ideal para o Seu Negócio
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            O Dashboard está incluso em todos os planos para você acompanhar pedidos e clientes desde o primeiro dia.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {PLANS.map((plan) => {
            const isCurrent = activePlan === plan.id;
            const isProfissional = plan.id === 'profissional';

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-8 flex flex-col justify-between space-y-6 transition-all relative ${isProfissional
                  ? 'bg-blue-600 text-white shadow-xl ring-2 ring-blue-500'
                  : 'bg-white border border-slate-200/90 shadow-xs'
                  }`}
              >
                {plan.badge && (
                  <div
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black tracking-widest uppercase px-3.5 py-1 rounded-full shadow-sm ${isProfissional
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-indigo-600 text-white'
                      }`}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        className={`text-xl font-bold ${isProfissional ? 'text-white' : 'text-slate-950'
                          }`}
                      >
                        {plan.name}
                      </h3>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${isProfissional ? 'text-blue-100' : 'text-slate-500'
                          }`}
                      >
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="flex items-baseline gap-1 pt-1">
                    <span
                      className={`text-4xl font-extrabold ${isProfissional ? 'text-white' : 'text-slate-950'
                        }`}
                    >
                      R$ {plan.price}
                    </span>
                    <span
                      className={`text-xs font-semibold ${isProfissional ? 'text-blue-200' : 'text-slate-500'
                        }`}
                    >
                      {plan.period}
                    </span>
                  </div>

                  {/* Botão de Ação / Upgrade */}
                  <div>
                    {isCurrent ? (
                      <div
                        className={`w-full py-3 px-4 rounded-xl text-xs font-black text-center border ${isProfissional
                          ? 'bg-blue-700/60 text-white border-blue-400/50'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                      >
                        ✓ Plano Atualmente Ativo
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSelectPlan(plan.id)}
                        className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold transition-all text-center shadow-md cursor-pointer ${isProfissional
                          ? 'bg-white text-blue-700 hover:bg-blue-50'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                      >
                        {plan.price === 0
                          ? 'Mudar para Iniciante'
                          : `Ativar Plano ${plan.name} (7 Dias Grátis)`}
                      </button>
                    )}
                  </div>

                  {/* Resumo de limites principais */}
                  <div
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${isProfissional
                      ? 'bg-blue-700/40 border-blue-400/40 text-blue-50'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                  >
                    <div>
                      <strong>Canais:</strong> {plan.channels}
                    </div>
                    <div>
                      <strong>Produtos:</strong> {plan.productsLimit}
                    </div>
                    <div>
                      <strong>Franquia IA:</strong> {plan.interactionsLimit}
                    </div>
                  </div>

                  {/* Lista de Recursos (Highlights) */}
                  <div
                    className={`space-y-3 pt-4 border-t text-xs sm:text-sm ${isProfissional
                      ? 'border-blue-500/50 text-blue-50'
                      : 'border-slate-100 text-slate-600'
                      }`}
                  >
                    {plan.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <Check
                          className={`w-4 h-4 shrink-0 mt-0.5 ${isProfissional
                            ? 'text-amber-300 stroke-[3]'
                            : 'text-emerald-600'
                            }`}
                        />
                        <span className="leading-snug">{item}</span>
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
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div>
          <h3 className="font-heading font-black text-xl text-slate-900 tracking-tight">
            Matriz Comparativa de Recursos
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Veja exatamente o que cada plano oferece para o atendimento da sua loja.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Recurso / Benefício</th>
                <th className="py-3 px-4">Iniciante (R$ 0)</th>
                <th className="py-3 px-4 text-blue-600">Profissional (R$ 97)</th>
                <th className="py-3 px-4 text-indigo-600">Completo (R$ 197)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Onde a IA Responde?</td>
                <td className="py-3 px-4 text-slate-600">Apenas Direct (DMs)</td>
                <td className="py-3 px-4 font-semibold text-blue-700">Direct + Posts do Feed</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">Direct, Feed, Reels e Stories</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Limite de Produtos Ativos</td>
                <td className="py-3 px-4 text-slate-600">Até 15 produtos</td>
                <td className="py-3 px-4 font-semibold text-blue-700">Até 100 produtos</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">ILIMITADO</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Auto-Cadastro por Story</td>
                <td className="py-3 px-4 text-slate-400">Bloqueado após 15 itens</td>
                <td className="py-3 px-4 text-slate-700">Ativo (até 100 itens)</td>
                <td className="py-3 px-4 font-semibold text-indigo-700">Ativo Sem Limite</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Franquia de IA / mês</td>
                <td className="py-3 px-4 text-slate-600">50 interações</td>
                <td className="py-3 px-4 font-semibold text-blue-700">1.500 interações (~50/dia)</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">5.000 interações (~160/dia)</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Filtro de Intenção de Compra</td>
                <td className="py-3 px-4 text-slate-400">Básico</td>
                <td className="py-3 px-4 font-semibold text-emerald-600">✓ Ativo (qualifica clientes reais)</td>
                <td className="py-3 px-4 font-extrabold text-emerald-600">✓ Ativo com alta precisão</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">IA no Tom de Voz da Marca</td>
                <td className="py-3 px-4 text-slate-400">Padrão Vitryne</td>
                <td className="py-3 px-4 text-slate-700">Configuração Rápida</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">100% Personalizada Sob Medida</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Regras de Entrega & Motoboy</td>
                <td className="py-3 px-4 text-slate-600">Manual no WhatsApp</td>
                <td className="py-3 px-4 text-slate-700">Motoboy + Sedex padrão</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">Regras flexíveis por bairro e corte</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Dashboard de Vendas</td>
                <td className="py-3 px-4 font-semibold text-emerald-600">✓ Incluso</td>
                <td className="py-3 px-4 font-semibold text-emerald-600">✓ Tempo Real Incluso</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">✓ Inteligência Demanda Reprimida</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Múltiplas Contas do Instagram</td>
                <td className="py-3 px-4 text-slate-400">1 Conta</td>
                <td className="py-3 px-4 text-slate-400">1 Conta</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">Múltiplas Contas</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-bold text-slate-900">Canal de Atendimento</td>
                <td className="py-3 px-4 text-slate-600">Atendimento por e-mail</td>
                <td className="py-3 px-4 text-slate-700">Atendimento via WhatsApp</td>
                <td className="py-3 px-4 font-extrabold text-indigo-700">Atendimento via WhatsApp</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recarga Opcional de Interações Extras */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-white px-3 py-1 rounded-full border border-indigo-200">
            Recarga Avulsa
          </span>
          <h3 className="font-heading font-bold text-xl text-slate-950">
            Viralizou um Reel ou precisa de mais interações este mês?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Nunca deixe sua loja sem resposta. Você pode contratar um pacote extra de <strong>500 atendimentos inteligentes</strong> por apenas R$ 29,90 sem precisar alterar seu plano mensal.
          </p>
        </div>

        <div className="shrink-0 text-left md:text-right space-y-2">
          <div className="text-2xl font-extrabold text-slate-950">
            R$ 29,90 <span className="text-xs font-normal text-slate-500">/ 500 msgs</span>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setUpgradedMessage('Pacote de 500 interações adicionais contratado com sucesso!');
              setTimeout(() => setUpgradedMessage(null), 5000);
            }}
            className="w-full md:w-auto"
          >
            Adicionar +500 Interações
          </Button>
        </div>
      </div>

      {/* Garantia & Transparência */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-xs text-slate-600">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Sem Contrato de Fidelidade</h4>
            <p>Você pode cancelar, pausar ou migrar de plano a qualquer momento com apenas 1 clique.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5">
          <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Ativação Imediata</h4>
            <p>Seus novos limites e canais são liberados no mesmo segundo em que a assinatura é confirmada.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3.5">
          <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">Dúvidas sobre o Volume?</h4>
            <p>Nosso time ajuda você a dimensionar a quantidade de interações de acordo com o tráfego da sua loja.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
