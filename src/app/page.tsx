'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Instagram,
  Sparkles,
  Send,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Zap,
} from 'lucide-react';

export default function LandingPage() {
  // Estado do formulário de contato
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactHandle, setContactHandle] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  // Estado da newsletter
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  // Estado do Simulador de Interações dos Planos
  const [dailyInteractions, setDailyInteractions] = useState<number>(45);

  // Estado da Demonstração Interativa do Empreendedor
  const [activeDemoTab, setActiveDemoTab] = useState<'direct' | 'story' | 'checkout'>('direct');

  // Estado do FAQ Accordion
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail) return;
    setContactSent(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactHandle('');
      setContactMessage('');
    }, 4000);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSent(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSent(false);
    }, 4000);
  };

  const faqItems = [
    {
      q: 'O que conta como 1 atendimento da IA?',
      a: 'Qualquer interação útil completa com o seu cliente: responder dúvidas de produtos, preços ou detalhes no Direct, informar disponibilidade em comentários de posts e Reels, ou enviar o link do catálogo para fechar a compra no WhatsApp.',
    },
    {
      q: 'Mensagens sem interesse de compra ou spam gastam meu limite?',
      a: 'Não. O Filtro de Intenção de Compra identifica automaticamente mensagens aleatórias, abordagens de spam ou mensagens sem objetivo comercial e as ignora, qualificando apenas clientes reais sem descontar do seu plano mensal.',
    },
    {
      q: 'A IA fala com o jeito e as regras da minha loja?',
      a: 'Sim! Você define a forma de falar (descontraída, acolhedora ou formal), informações de produtos, opções de entrega, prazos e tudo o que a sua equipe costuma responder no dia a dia.',
    },
    {
      q: 'O que acontece quando o cliente faz uma pergunta muito específica?',
      a: 'A IA identifica quando a dúvida precisa da sua intervenção e transfere a conversa para o seu WhatsApp com o histórico completo do que o cliente precisa, poupando seu tempo na triagem.',
    },
    {
      q: 'Funciona para produtos físicos e para serviços?',
      a: 'Sim. A Vitryne atende tanto empreendedores que vendem produtos físicos (vestuário, calçados, eletrônicos, cosméticos, acessórios, alimentos) quanto negócios com agendamentos e orçamentos.',
    },
    {
      q: 'Como os itens entram no catálogo pelo Story do Instagram?',
      a: 'Basta postar a foto ou vídeo da novidade nos Stories da sua conta. A inteligência visual processa a imagem, reconhece o item e já cadastra no seu catálogo com link pronto para venda.',
    },
    {
      q: 'Existe risco de bloqueio no Instagram do meu negócio?',
      a: 'Nenhum risco. A Vitryne utiliza exclusivamente a API Oficial da Meta / Instagram para Empresas, homologada e em total conformidade com as diretrizes de segurança da plataforma.',
    },
    {
      q: 'Preciso deixar computador ligado ou instalar algum aplicativo?',
      a: 'Não. A plataforma roda 100% na nuvem. Você pode fechar o celular e desligar o computador: o atendimento responde e direciona pedidos 24 horas por dia.',
    },
    {
      q: 'Existe fidelidade ou cobrança de porcentagem sobre as minhas vendas?',
      a: 'Nenhuma fidelidade e 0% de comissão sobre suas vendas. Todo o faturamento do seu negócio é 100% seu, e você pode cancelar quando quiser.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-neutral-50 antialiased">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Official Logo Limpa)                                       */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#FAF9F5]/90 backdrop-blur-xl border-b border-neutral-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 h-20 flex items-center justify-between gap-8">
          {/* Logo Oficial Sem Taglines */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/images/vitryne-logo-cropped.png"
              alt="Vitryne"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-10 text-[13px] tracking-wide font-medium text-neutral-600">
            <a href="#como-funciona" className="hover:text-neutral-950 transition-colors">
              Como Funciona
            </a>
            <a href="#beneficios" className="hover:text-neutral-950 transition-colors">
              Benefícios
            </a>
            <a href="#simulador" className="hover:text-neutral-950 transition-colors">
              Simulador de Retorno
            </a>
            <a href="#planos" className="hover:text-neutral-950 transition-colors">
              Planos
            </a>
            <a href="#duvidas" className="hover:text-neutral-950 transition-colors">
              Dúvidas
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-[13px] font-medium text-neutral-700 hover:text-neutral-950 px-3 py-2 transition-colors tracking-wide"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full text-xs font-semibold tracking-wide uppercase text-neutral-50 bg-neutral-950 hover:bg-neutral-800 transition-all duration-200 shadow-sm hover:shadow"
            >
              <span>Criar Vitrine Grátis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Tipografia Moderna Outfit/Inter & Mensagem Direta)       */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 text-center space-y-10">
          {/* Tag de Contexto Sutil */}
          <div className="inline-flex items-center gap-3 text-[11px] sm:text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
            <span className="w-6 h-px bg-neutral-400" />
            <span>Feito para Empreendedores e Lojistas no Instagram</span>
            <span className="w-6 h-px bg-neutral-400" />
          </div>

          {/* Headline Moderna e Direta */}
          <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-neutral-950 tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Venda mais no Instagram, poupe horas do seu dia e elimine o vácuo com seus clientes.
          </h1>

          {/* Subtitle Direto na Dor do Empreendedor */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-600 leading-relaxed max-w-3xl mx-auto font-normal">
            Sua cliente comentou no Reel ou mandou direct fora do horário? A Vitryne responde em 3 segundos com preço, estoque e fotos, tira dúvidas repetitivas e envia o pedido pronto para o seu WhatsApp fechar. Sem vácuo, sem clientes perdidas para a concorrência.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-50 bg-neutral-950 hover:bg-neutral-800 transition-all shadow-md hover:shadow-xl"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#como-funciona"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-800 border border-neutral-300 hover:border-neutral-950 hover:bg-white transition-all"
            >
              Ver Demonstração ao Vivo
            </a>
          </div>

          {/* Métricas Reais do Negócio */}
          <div className="pt-12 sm:pt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-neutral-200/80 text-left">
            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                &lt; 3 seg
              </div>
              <div className="text-xs text-neutral-500 font-mono tracking-tight">
                Tempo de resposta ao cliente
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                0 Vácuo
              </div>
              <div className="text-xs text-neutral-500 font-mono tracking-tight">
                Atendimento 24/7 sem espera
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                +4h / dia
              </div>
              <div className="text-xs text-neutral-500 font-mono tracking-tight">
                Tempo poupado pelo lojista
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-heading text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
                100% Oficial
              </div>
              <div className="text-xs text-neutral-500 font-mono tracking-tight">
                Homologado Meta / Instagram
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. DEMONSTRAÇÃO PRÁTICA (Simulação Real do Fluxo de Vendas)               */}
      {/* ========================================================================= */}
      <section id="como-funciona" className="py-24 sm:py-32 bg-white border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-16">
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
              Fluxo na Prática
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight">
              Veja como o seu cliente é atendido sem você precisar parar o que está fazendo.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
              O cliente pergunta, a inteligência responde na hora com os detalhes certos e direciona o pedido pronto para você fechar no WhatsApp.
            </p>
          </div>

          {/* Interactive Showcase Box */}
          <div className="bg-[#FAF9F5] rounded-3xl border border-neutral-200/80 overflow-hidden shadow-sm">
            {/* Nav Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-neutral-200/80 bg-neutral-100/50">
              <button
                type="button"
                onClick={() => setActiveDemoTab('direct')}
                className={`py-4 px-6 text-left transition-all ${
                  activeDemoTab === 'direct'
                    ? 'bg-[#FAF9F5] border-b-2 sm:border-b-0 sm:border-t-2 border-neutral-950 font-bold text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Passo 01
                </div>
                <div className="text-sm tracking-tight font-semibold">Resposta Imediata no Direct</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('story')}
                className={`py-4 px-6 text-left transition-all ${
                  activeDemoTab === 'story'
                    ? 'bg-[#FAF9F5] border-b-2 sm:border-b-0 sm:border-t-2 border-neutral-950 font-bold text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Passo 02
                </div>
                <div className="text-sm tracking-tight font-semibold">Do Story para a Vitrine</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveDemoTab('checkout')}
                className={`py-4 px-6 text-left transition-all ${
                  activeDemoTab === 'checkout'
                    ? 'bg-[#FAF9F5] border-b-2 sm:border-b-0 sm:border-t-2 border-neutral-950 font-bold text-neutral-950'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Passo 03
                </div>
                <div className="text-sm tracking-tight font-semibold">Pedido Pronto no WhatsApp</div>
              </button>
            </div>

            {/* Display Content */}
            <div className="p-8 sm:p-14">
              {activeDemoTab === 'direct' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-6 space-y-5">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                      01 / Fim do Vácuo
                    </div>
                    <h3 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-950 tracking-tight">
                      O cliente pergunta e recebe a resposta em menos de 3 segundos.
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Seja comentando "preço?" no Reel ou mandando direct de madrugada querendo saber se tem disponibilidade, a Vitryne responde com atenção, fotos e o link direto para comprar. O cliente não esfria e não procura outro perfil.
                    </p>
                    <div className="space-y-2 pt-2 text-xs text-neutral-500 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Responde no Direct e nos Comentários de Posts/Reels</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Filtra spams e curiosos para você não perder tempo</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup do Direct */}
                  <div className="lg:col-span-6">
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-lg p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-950 text-white font-heading text-xs flex items-center justify-center font-bold">
                            L
                          </div>
                          <div>
                            <div className="text-xs font-bold text-neutral-900">Sua Loja no Instagram</div>
                            <div className="text-[10px] text-emerald-600 font-medium">Online • Resposta em 2s</div>
                          </div>
                        </div>
                        <Instagram className="w-4 h-4 text-neutral-400" />
                      </div>

                      <div className="space-y-3 text-xs">
                        <div className="flex justify-end">
                          <div className="bg-neutral-100 text-neutral-800 rounded-2xl rounded-tr-xs px-4 py-2.5 max-w-[85%] leading-relaxed">
                            Oi! Vocês ainda têm esse item disponível? Qual o valor e quanto fica a entrega?
                          </div>
                        </div>

                        <div className="flex justify-start">
                          <div className="bg-neutral-900 text-neutral-50 rounded-2xl rounded-tl-xs px-4 py-3 max-w-[90%] leading-relaxed space-y-2">
                            <p>
                              Olá! Temos sim disponível a pronta entrega ✨ O valor é R$ 189,00. Temos opções de entrega rápida para a sua região ou envio com rastreio para todo o Brasil.
                            </p>
                            <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-3 border border-white/10">
                              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center font-heading text-xs text-white font-semibold">
                                Foto
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-white truncate">Item Selecionado</div>
                                <div className="text-[11px] text-[#E2C9A2]">R$ 189,00 • Pronta Entrega</div>
                              </div>
                            </div>
                            <div className="pt-1">
                              <span className="inline-block bg-white text-neutral-950 font-bold px-3 py-1.5 rounded-lg text-[11px]">
                                Ver no Catálogo / Pedir pelo WhatsApp →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'story' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-6 space-y-5">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                      02 / Sem Cadastro Manual
                    </div>
                    <h3 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-950 tracking-tight">
                      Postou nos Stories? A Vitryne adiciona ao catálogo na hora.
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Chega de passar horas no computador subindo fotos, digitando descrições e títulos em plataformas lentas. Você posta a foto ou vídeo da novidade nos Stories da sua loja e a IA já adiciona o item ao catálogo com link pronto para compartilhar.
                    </p>
                    <div className="space-y-2 pt-2 text-xs text-neutral-500 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Sincronização contínua com as publicações do seu perfil</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Sua vitrine sempre atualizada sem você perder tempo</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup do Story to Catalog */}
                  <div className="lg:col-span-6">
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-lg p-6 space-y-5">
                      <div className="flex items-center justify-between text-xs text-neutral-500 border-b border-neutral-100 pb-3 font-mono">
                        <span>DETECÇÃO DE NOVO ITEM</span>
                        <span className="text-emerald-700 font-semibold">CADASTRADO (1.4s)</span>
                      </div>

                      <div className="flex gap-4 items-center">
                        <div className="w-20 h-28 rounded-xl bg-neutral-900 text-neutral-400 flex flex-col items-center justify-center p-2 text-center text-[10px] shrink-0 border border-neutral-800">
                          <span className="font-heading font-bold text-white text-xs mb-1">Story</span>
                          <span>Novidade do Dia</span>
                        </div>
                        <div className="space-y-1.5 flex-1 text-xs">
                          <span className="text-[10px] font-mono uppercase text-neutral-400 tracking-wider">
                            Adicionado ao Catálogo
                          </span>
                          <div className="font-heading font-bold text-neutral-950 text-base">
                            Novidade Cadastrada
                          </div>
                          <div className="text-neutral-500">
                            Pronta entrega • Variações disponíveis
                          </div>
                          <div className="font-mono text-neutral-900 font-bold">
                            Preço e detalhes automáticos
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs text-neutral-600 leading-relaxed">
                        Link exclusivo gerado para a bio e respostas de Direct prontas para envio automático.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDemoTab === 'checkout' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  <div className="lg:col-span-6 space-y-5">
                    <div className="text-xs font-mono uppercase tracking-widest text-neutral-400">
                      03 / Menos Atrito, Mais Vendas
                    </div>
                    <h3 className="font-heading font-bold text-2xl sm:text-3xl text-neutral-950 tracking-tight">
                      O pedido chega pronto no seu WhatsApp para você só receber.
                    </h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      Em vez de negociar tudo do zero pelo direct, o cliente escolhe o que quer no seu catálogo rápido, define as opções de entrega ou retirada e envia a mensagem pronta no WhatsApp com valor, endereço e Pix. Você ganha tempo e a cliente compra sem demora.
                    </p>
                    <div className="space-y-2 pt-2 text-xs text-neutral-500 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Chave Pix ou link de pagamento enviados em 1 clique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>Zero comissão: 100% do dinheiro das vendas vai para você</span>
                      </div>
                    </div>
                  </div>

                  {/* Mockup do WhatsApp */}
                  <div className="lg:col-span-6">
                    <div className="max-w-md mx-auto bg-white rounded-2xl border border-neutral-200/90 shadow-lg p-6 space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                        <span className="text-xs font-bold text-neutral-900">Seu WhatsApp</span>
                        <span className="text-[10px] font-mono text-neutral-400">NOVO PEDIDO</span>
                      </div>

                      <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/60 text-xs space-y-2 text-neutral-800">
                        <div className="font-bold text-emerald-950">
                          ✨ Pedido Recebido via Vitryne:
                        </div>
                        <div className="text-neutral-700 leading-relaxed font-mono text-[11px]">
                          • 1x Produto Selecionado — R$ 189,00<br />
                          • Entrega: Opção de Envio Selecionada — R$ 18,00<br />
                          <strong>Total a Pagar: R$ 207,00 (Pix)</strong>
                        </div>
                        <div className="pt-1 text-[11px] text-neutral-600">
                          Cliente: Mariana S. • Endereço de entrega preenchido
                        </div>
                      </div>

                      <div className="text-center pt-1">
                        <span className="text-xs font-medium text-neutral-500">
                          Economia de até 25 minutos de conversa repetitiva por pedido
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. OS PILARES DO EMPREENDEDOR (Benefícios Concretos)                        */}
      {/* ========================================================================= */}
      <section id="beneficios" className="py-24 sm:py-32 bg-[#FAF9F5] border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-20">
          <div className="max-w-2xl space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
              Mais Vendas & Menos Trabalho
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight">
              Tudo o que você precisa para vender mais no Instagram sem virar refém do celular.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600">
              Eliminamos os maiores gargalos que fazem empreendedores perderem clientes e tempo todos os dias.
            </p>
          </div>

          {/* Grid dos Pilares */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Pilar 01 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                01 / FIM DO VÁCUO
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Atendimento Imediato em 3 Segundos
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                A cliente não espera horas para saber preço e disponibilidade. Resposta instantânea nos Directs e comentários de Reels, inclusive à noite e nos fins de semana.
              </p>
            </div>

            {/* Pilar 02 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                02 / ECONOMIA DE TEMPO
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Poupe até 4 Horas por Dia
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Chega de passar o dia digitando "preço no direct", repetindo informações e tirando dúvidas repetitivas. A Vitryne faz o trabalho automático enquanto você foca no crescimento da loja.
              </p>
            </div>

            {/* Pilar 03 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                03 / CADASTRO ÁGIL
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Auto-Cadastro a Partir do Story
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Esqueça planilhas e digitação demorada. Basta postar a foto ou vídeo nos Stories do Instagram para que a novidade apareça no catálogo da sua loja com link de compra.
              </p>
            </div>

            {/* Pilar 04 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                04 / QUALIFICAÇÃO
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Filtro Anti-Spam e Foco em Vendas
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Mensagens sem intenção comercial, curiosos e spam são filtrados automaticamente. Sua atenção fica 100% voltada para quem realmente quer comprar.
              </p>
            </div>

            {/* Pilar 05 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                05 / LOGÍSTICA
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Opções de Entrega e Envio na Hora
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Cálculo de entrega expressa, envio pelos Correios ou retirada no local informado na hora, eliminando a principal dúvida que faz o cliente desistir da compra.
              </p>
            </div>

            {/* Pilar 06 */}
            <div className="space-y-4 p-8 bg-white rounded-3xl border border-neutral-200/80 shadow-xs hover:border-neutral-950 transition-colors group">
              <div className="font-mono text-xs text-neutral-400 group-hover:text-neutral-950 transition-colors">
                06 / CONVERSÃO
              </div>
              <h3 className="font-heading font-bold text-xl sm:text-2xl text-neutral-950 tracking-tight">
                Catálogo Rápido na Bio & WhatsApp
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Sua vitrine abre em menos de 1 segundo direto no produto procurado, com link limpo para a bio e fechamento direto no WhatsApp ou Pix sem intermediários.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. COMPARATIVO REAL DO EMPREENDEDOR                                       */}
      {/* ========================================================================= */}
      <section className="py-24 sm:py-32 bg-neutral-950 text-neutral-100 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-16">
          <div className="max-w-3xl space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#C5A880]">
              Comparativo de Rotina
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight">
              O fim do atendimento caótico que limita o crescimento da sua loja.
            </h2>
            <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
              Veja a diferença entre depender de respostas manuais o dia inteiro e ter um sistema inteligente trabalhando por você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Sem Vitryne */}
            <div className="p-8 sm:p-10 rounded-3xl border border-neutral-800 bg-neutral-900/40 space-y-6">
              <div className="text-xs font-mono uppercase tracking-widest text-neutral-500">
                Como é sem a Vitryne
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-neutral-400">
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-mono mt-0.5">—</span>
                  <span>Clientes comentam nos Reels de madrugada e compram no concorrente que respondeu primeiro.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-mono mt-0.5">—</span>
                  <span>Você passa horas digitando as mesmas respostas sobre preço, detalhes e entrega.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-mono mt-0.5">—</span>
                  <span>Novidades demoram dias para serem cadastradas e ficam paradas no estoque.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-400 font-mono mt-0.5">—</span>
                  <span>Dúvidas de entrega e pagamento fazem o cliente desistir na hora de pagar.</span>
                </li>
              </ul>
            </div>

            {/* Com Vitryne */}
            <div className="p-8 sm:p-10 rounded-3xl border border-[#C5A880]/30 bg-neutral-900/80 space-y-6 relative">
              <div className="text-xs font-mono uppercase tracking-widest text-[#E2C9A2]">
                Com a Vitryne Ativa
              </div>
              <ul className="space-y-4 text-xs sm:text-sm text-neutral-300">
                <li className="flex items-start gap-3">
                  <span className="text-[#C5A880] font-mono mt-0.5">+</span>
                  <span>Resposta imediata em 3 segundos no tom de voz da sua loja, 24 horas por dia.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C5A880] font-mono mt-0.5">+</span>
                  <span>Cadastro automático por Story: postou no Instagram, já entra no catálogo da loja.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C5A880] font-mono mt-0.5">+</span>
                  <span>Opções de entrega e envio calculadas na hora, tirando as dúvidas do cliente no mesmo instante.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C5A880] font-mono mt-0.5">+</span>
                  <span>Você recebe o pedido pronto no WhatsApp apenas para confirmar o pagamento e enviar.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. SIMULADOR DE RETORNO DO EMPREENDEDOR                                   */}
      {/* ========================================================================= */}
      <section id="simulador" className="py-24 sm:py-32 bg-[#FAF9F5] border-b border-neutral-200/70">
        <div className="max-w-5xl mx-auto px-6 sm:px-12 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
              Simulador de Retorno
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight">
              Calcule quanto tempo e dinheiro sua loja ganha.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600">
              Estime sua média diária de mensagens no Direct, comentários em Reels e dúvidas nos Stories.
            </p>
          </div>

          {/* Console de Simulação */}
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-neutral-200/80 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Volume Diário Estimado
                </div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-neutral-950 mt-1 tracking-tight">
                  ~{dailyInteractions} mensagens e dúvidas / dia
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Volume Mensal
                </div>
                <div className="font-mono text-sm font-bold text-neutral-800">
                  {(dailyInteractions * 30).toLocaleString('pt-BR')} atendimentos estimados/mês
                </div>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={dailyInteractions}
                onChange={(e) => setDailyInteractions(Number(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-950"
              />
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>5 /dia (iniciante)</span>
                <span>50 /dia (loja ativa)</span>
                <span>100 /dia (marca em crescimento)</span>
                <span>200+ /dia (alto volume)</span>
              </div>
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-neutral-200/70 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Plano Recomendado
                </span>
                <div className="font-heading text-lg text-neutral-950 font-bold tracking-tight">
                  {dailyInteractions * 30 <= 50 ? (
                    'Iniciante (Grátis)'
                  ) : dailyInteractions * 30 <= 1500 ? (
                    <span className="text-neutral-950">Profissional (R$ 97)</span>
                  ) : (
                    <span className="text-neutral-950">Completo (R$ 197)</span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-neutral-200/70 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Tempo Poupado no Mês
                </span>
                <div className="font-mono text-lg font-bold text-emerald-700">
                  ~{Math.round((dailyInteractions * 30 * 2.5) / 60)} horas economizadas
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-neutral-200/70 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Vendas Recuperadas do Vácuo
                </span>
                <div className="font-mono text-lg font-bold text-neutral-950">
                  +R$ {Math.round(dailyInteractions * 30 * 0.18 * 120).toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PLANOS PARA EMPREENDEDORES                                             */}
      {/* ========================================================================= */}
      <section id="planos" className="py-24 sm:py-32 bg-white border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-12 space-y-20">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
              Planos Transparentes
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight">
              Escolha o plano ideal para o tamanho da sua loja.
            </h2>
            <p className="text-sm sm:text-base text-neutral-600">
              Sem contratos de fidelidade. Sem comissão sobre suas vendas. Todo o lucro das vendas é 100% seu.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plano 1: Iniciante */}
            <div
              className={`p-8 sm:p-10 rounded-3xl bg-[#FAF9F5] border flex flex-col justify-between space-y-8 transition-all ${
                dailyInteractions * 30 <= 50
                  ? 'border-neutral-950 ring-1 ring-neutral-950'
                  : 'border-neutral-200/80'
              }`}
            >
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Plano 01
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-neutral-950 mt-1 tracking-tight">Iniciante</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Para quem está começando a organizar as vendas no Direct
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-black text-neutral-950 tracking-tight">R$ 0</span>
                  <span className="text-xs text-neutral-500 font-mono">/mês</span>
                </div>

                <div className="text-xs font-mono text-neutral-600 border-y border-neutral-200 py-2.5">
                  Até 50 atendimentos com IA / mês
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase text-neutral-900 border border-neutral-300 hover:border-neutral-950 transition-all text-center"
                >
                  Criar Loja Grátis
                </Link>

                <ul className="space-y-3 pt-2 text-xs text-neutral-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono">—</span>
                    <span>Responde dúvidas direto no Direct (DMs)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono">—</span>
                    <span>Até 15 produtos ou serviços ativos no catálogo</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono">—</span>
                    <span>Catálogo online com link exclusivo para a bio</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-400 font-mono">—</span>
                    <span>Checkout direto no WhatsApp da loja</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plano 2: Profissional */}
            <div
              className={`p-8 sm:p-10 rounded-3xl bg-neutral-950 text-white border flex flex-col justify-between space-y-8 relative transition-all shadow-xl ${
                dailyInteractions * 30 > 50 && dailyInteractions * 30 <= 1500
                  ? 'border-[#C5A880] ring-1 ring-[#C5A880]'
                  : 'border-neutral-800'
              }`}
            >
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#C5A880]">
                    Mais Escolhido por Empreendedores
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-white mt-1 tracking-tight">Profissional</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Automatize Directs e Comentários do feed 24 horas por dia
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-5xl font-black text-white tracking-tight">R$ 97</span>
                  <span className="text-xs text-neutral-400 font-mono">/mês</span>
                </div>

                <div className="text-xs font-mono text-[#E2C9A2] border-y border-neutral-800 py-2.5">
                  Até 1.500 atendimentos com IA / mês (~50/dia)
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-4 px-4 rounded-full text-xs font-bold tracking-wider uppercase text-neutral-950 bg-white hover:bg-neutral-100 transition-all text-center shadow-sm"
                >
                  Experimentar 7 Dias Grátis
                </Link>

                <ul className="space-y-3 pt-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Responde Directs e Comentários de Posts/Reels</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Até 100 produtos ou serviços ativos no catálogo</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Auto-cadastro em tempo real por Stories do Instagram</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Filtro de Intenção de Compra (ignora spams)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Opções de entrega expressa, envio ou retirada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-[#C5A880] font-mono">+</span>
                    <span>Suporte prioritário via WhatsApp</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plano 3: Completo */}
            <div
              className={`p-8 sm:p-10 rounded-3xl bg-[#FAF9F5] border flex flex-col justify-between space-y-8 transition-all ${
                dailyInteractions * 30 > 1500
                  ? 'border-neutral-950 ring-1 ring-neutral-950'
                  : 'border-neutral-200/80'
              }`}
            >
              <div className="space-y-6">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Plano 03
                  </div>
                  <h3 className="font-heading font-bold text-2xl text-neutral-950 mt-1 tracking-tight">Completo</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    Atendimento total para operações de alto volume
                  </p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-black text-neutral-950 tracking-tight">R$ 197</span>
                  <span className="text-xs text-neutral-500 font-mono">/mês</span>
                </div>

                <div className="text-xs font-mono text-neutral-600 border-y border-neutral-200 py-2.5">
                  Até 5.000 atendimentos com IA / mês (~160/dia)
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-full text-xs font-bold tracking-wider uppercase text-neutral-50 bg-neutral-950 hover:bg-neutral-800 transition-all text-center"
                >
                  Assinar Plano Completo
                </Link>

                <ul className="space-y-3 pt-2 text-xs text-neutral-600">
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-950 font-mono">+</span>
                    <span>Responde TUDO: Directs, Feed, Reels e Stories</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-950 font-mono">+</span>
                    <span>Produtos e serviços ILIMITADOS no catálogo</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-950 font-mono">+</span>
                    <span>IA personalizada no vocabulário e regras do seu negócio</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-950 font-mono">+</span>
                    <span>Regras customizadas de entrega e horário de corte</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-neutral-950 font-mono">+</span>
                    <span>Múltiplas contas do Instagram conectadas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. DÚVIDAS FREQUENTES                                                     */}
      {/* ========================================================================= */}
      <section id="duvidas" className="py-24 sm:py-32 bg-[#FAF9F5] border-b border-neutral-200/70">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
              Tire Suas Dúvidas
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-neutral-950 tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-sm sm:text-base text-neutral-600">
              Tudo o que você precisa saber sobre o atendimento automático e catálogo para a sua loja.
            </p>
          </div>

          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className="py-6 transition-all">
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between text-left gap-6 group"
                  >
                    <span className="font-heading font-bold text-lg sm:text-xl text-neutral-950 group-hover:text-neutral-700 transition-colors tracking-tight">
                      {item.q}
                    </span>
                    <span className="font-mono text-xs text-neutral-400 shrink-0 group-hover:text-neutral-950">
                      {isOpen ? '—' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pt-4 text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CONTATO & DEMONSTRAÇÃO                                                 */}
      {/* ========================================================================= */}
      <section id="contato" className="py-24 sm:py-32 bg-white border-b border-neutral-200/70">
        <div className="max-w-6xl mx-auto px-6 sm:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
                Suporte & Demonstração
              </span>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-neutral-950 tracking-tight">
                Fale com a nossa equipe.
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Quer entender como a Vitryne funciona no seu nicho ou ver uma demonstração com os seus produtos e serviços? Respondemos com rapidez pelo WhatsApp.
              </p>

              <div className="space-y-4 pt-6 border-t border-neutral-100 text-xs font-mono text-neutral-600">
                <div>
                  <span className="text-neutral-400 block text-[10px]">E-MAIL COMERCIAL</span>
                  <span className="text-neutral-900 font-semibold">contato@vitryne.com.br</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">WHATSAPP OFICIAL</span>
                  <span className="text-neutral-900 font-semibold">+55 (11) 98765-4321</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">SUPORTE</span>
                  <span className="text-neutral-900">São Paulo, Brasil</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#FAF9F5] p-8 sm:p-12 rounded-3xl border border-neutral-200/80 shadow-xs">
              {contactSent ? (
                <div className="text-center py-10 space-y-3">
                  <div className="font-heading font-black text-2xl text-neutral-950 tracking-tight">
                    Mensagem Recebida com Sucesso!
                  </div>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                    Nossa equipe entrará em contato via WhatsApp para tirar suas dúvidas e mostrar a demonstração.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-neutral-950 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="seu@negocio.com.br"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-neutral-950 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                        Instagram da Loja (@)
                      </label>
                      <input
                        type="text"
                        value={contactHandle}
                        onChange={(e) => setContactHandle(e.target.value)}
                        placeholder="@sualoja.oficial"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-neutral-950 bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-600">
                      Como podemos ajudar o seu negócio?
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Conte um pouco sobre o volume de mensagens da sua loja e os produtos ou serviços que você vende..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-xs sm:text-sm focus:outline-none focus:border-neutral-950 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-full text-xs font-bold tracking-wider uppercase text-neutral-50 bg-neutral-950 hover:bg-neutral-800 transition-all shadow-sm"
                  >
                    <span>Enviar Mensagem</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. NEWSLETTER DE ESTRATÉGIAS PARA EMPREENDEDORES                          */}
      {/* ========================================================================= */}
      <section className="py-20 bg-[#FAF9F5] border-b border-neutral-200/70">
        <div className="max-w-4xl mx-auto px-6 sm:px-12 text-center space-y-6">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#A68352]">
            Dicas & Estratégias
          </span>
          <h3 className="font-heading font-black text-2xl sm:text-3xl text-neutral-950 tracking-tight">
            Receba estratégias práticas para vender mais no Instagram.
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 max-w-lg mx-auto">
            Novidades do algoritmo da Meta, scripts de resposta rápida e dicas para aumentar suas conversões sem complicação.
          </p>

          {newsletterSent ? (
            <div className="text-xs font-mono text-emerald-800 bg-emerald-50 px-5 py-2.5 rounded-full inline-block border border-emerald-200">
              ✓ Inscrição confirmada com sucesso!
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Seu melhor e-mail comercial"
                className="flex-1 px-4 py-3 rounded-full border border-neutral-300 text-xs focus:outline-none focus:border-neutral-950 bg-white"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-xs font-bold tracking-wider uppercase text-neutral-50 bg-neutral-950 hover:bg-neutral-800 transition-all shrink-0"
              >
                Inscrever-se
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER (Logo Oficial no Rodapé)                                       */}
      {/* ========================================================================= */}
      <footer className="bg-neutral-950 text-neutral-400 py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 space-y-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Coluna 1: Logo Oficial */}
            <div className="space-y-4">
              <Link href="/" className="inline-block">
                <img
                  src="/images/vitryne-logo-cropped.png"
                  alt="Vitryne"
                  className="h-8 w-auto object-contain brightness-0 invert opacity-90 transition-opacity hover:opacity-100"
                />
              </Link>
              <p className="text-xs text-neutral-500 leading-relaxed">
                A plataforma de vendas automáticas e catálogo inteligente para empreendedores e lojistas transformarem conversas no Instagram em vendas no WhatsApp.
              </p>
            </div>

            {/* Coluna 2 */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-300">
                Soluções
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#como-funciona" className="hover:text-white transition-colors">
                    Demonstração ao Vivo
                  </a>
                </li>
                <li>
                  <a href="#beneficios" className="hover:text-white transition-colors">
                    Benefícios para Lojistas
                  </a>
                </li>
                <li>
                  <a href="#simulador" className="hover:text-white transition-colors">
                    Simulador de Retorno
                  </a>
                </li>
                <li>
                  <a href="#planos" className="hover:text-white transition-colors">
                    Tabela de Planos
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 3 */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-300">
                Acesso Rápido
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Acessar Painel
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Criar Vitrine Grátis
                  </Link>
                </li>
                <li>
                  <a href="#duvidas" className="hover:text-white transition-colors">
                    Dúvidas Frequentes
                  </a>
                </li>
                <li>
                  <a href="#contato" className="hover:text-white transition-colors">
                    Fale Conosco
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 4 */}
            <div className="space-y-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-300">
                Segurança & Meta
              </div>
              <div className="text-xs text-neutral-500 space-y-2 leading-relaxed">
                <p>
                  100% integrado via API Oficial da Meta / Instagram para Empresas.
                </p>
                <p className="text-[11px] text-neutral-600">
                  Sem taxas sobre vendas. Sem fidelidade contratual.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-600 font-mono">
            <div>
              &copy; {new Date().getFullYear()} Vitryne Tecnologia Ltda. Todos os direitos reservados.
            </div>
            <div>
              Feito para empreendedores e lojas que vendem pelo Instagram no Brasil 🇧🇷
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
