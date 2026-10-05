'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  Clock,
  MessageCircle,
  Truck,
  TrendingUp,
  Instagram,
  CheckCircle2,
  Send,
  Zap,
  ShieldCheck,
  Star,
  Users,
  Mail,
  Phone,
  MapPin,
  Check,
  Filter,
  ShoppingBag,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Modern Glassmorphism)                                      */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <img
              src="/images/vitryne-logo-cropped.png"
              alt="Vitryne"
              className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#recursos" className="hover:text-slate-900 transition-colors">
              Recursos
            </a>
            <a href="#dificuldades-solucoes" className="hover:text-slate-900 transition-colors">
              Dificuldades & Soluções
            </a>
            <a href="#planos" className="hover:text-slate-900 transition-colors">
              Planos & Valores
            </a>
            <a href="#duvidas" className="hover:text-slate-900 transition-colors">
              Dúvidas Frequentes
            </a>
            <a href="#contato" className="hover:text-slate-900 transition-colors">
              Contato
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 px-3 py-2 transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Criar Vitrine Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Centered with Subtle Top Glow)                           */}
      {/* ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 text-center space-y-8">


          {/* Big Bold Headline */}
          <h1 className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-950 tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Transforme a demora de respostas em Directs, Stories e Comentários no{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-950">
              Maior Lucro da Sua Loja.
            </span>
          </h1>

          {/* High Impact Subtitle */}
          <p className="text-base sm:text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto font-normal">
            Sua cliente comentou no Reel ou mandou direct de madrugada? A inteligência da Vitryne responde em 3 segundos, tira dúvidas de numeração e medidas na hora e direciona o pedido pronto para o seu WhatsApp fechar a venda. Sem vácuo, sem clientes perdidas para a concorrência.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#recursos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Ver Demonstração
            </a>
          </div>



        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. RECURSOS / AS MAIORES DIFICULDADES RESOLVIDAS (3x2 Grid)               */}
      {/* ========================================================================= */}
      <section id="recursos" className="py-20 md:py-28 bg-[#F8FAFC] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">

            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight">
              Tudo o que sua loja precisa para vender 10x mais no Instagram
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Eliminamos as 6 maiores dificuldades que fazem lojistas perderem clientes, tempo e vendas todos os dias.
            </p>
          </div>

          {/* 3x2 Grid de Cards */}
          <div id="dificuldades-solucoes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Filtro de Intenção de Compra & Qualificação
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                Horas perdidas com mensagens sem interesse de compra, cantadas e spam que lotam seus posts e directs.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                A IA atende exclusivamente quem tem real interesse em comprar, tirar dúvidas de medidas ou consultar produtos e serviços. Mensagens aleatórias são filtradas.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Atendimento Imediato Sem Vácuo
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                A cliente comenta "preço?" no Reel ou manda direct à noite e compra na concorrente porque ficou horas sem resposta.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                Resposta humanizada em menos de 3 segundos no direct e no comentário, enviando a foto e o link direto para finalizar o pedido no WhatsApp.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Auto-Cadastro por Story Instantâneo
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                Trabalho cansativo e repetitivo digitando fotos, títulos, preços e medidas toda vez que chega novidade na loja.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                Basta postar o look ou serviço no Story: a inteligência reconhece a peça, monta a descrição e já adiciona ao catálogo na hora.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                IA no Tom de Voz Exclusivo da Sua Marca
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                Respostas robóticas e frias de chatbots comuns que afastam clientes e não passam a essência da sua boutique.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                A IA aprende a falar com o mesmo carinho, elegância ou descontração da sua melhor vendedora, seguindo as regras exclusivas da sua loja.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Entrega Rápida por Motoboy & Correios
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                A cliente desiste no último momento porque não sabe o valor do frete ou quando a peça vai chegar.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                Cálculo instantâneo de entrega no mesmo dia por motoboy (pedidos até 14h) ou frete econômico para todo o Brasil.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-xl text-slate-900">
                Catálogo Ultrarrápido & Compra em 1 Clique
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong className="text-rose-600 block mb-1">Dificuldade:</strong>
                Lojas lentas ou catálogos pesados que demoram para carregar no celular e fazem o cliente desistir.
              </p>
              <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                <strong className="text-emerald-700 block mb-1">A Solução Vitryne:</strong>
                Sua vitrine abre em menos de 1 segundo direto na peça escolhida, com link exclusivo da sua loja e pagamento imediato.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SPLIT SHOWCASE (Unlock Premium Features)                                */}
      {/* ========================================================================= */}
      <section className="py-20 md:py-28 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Lado Esquerdo: Conteúdo Textual e Benefícios */}
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
                Recursos Premium
              </span>
              <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight leading-tight">
                Desbloqueie o Máximo Potencial de Faturamento do Seu Instagram
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Chega de passar o dia respondendo <em>"preço no direct"</em>, digitando as mesmas medidas repetidamente ou perdendo clientes fora do horário comercial. A Vitryne assume o trabalho repetitivo para você focar no que traz crescimento.
              </p>

              <div className="space-y-3.5 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-slate-800">
                    Aumento médio de +340% nas conversões de DMs e Stories
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-slate-800">
                    Economia de até 4 horas diárias da equipe de atendimento
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-sm sm:text-base font-semibold text-slate-800">
                    Resgate e fechamento de clientes que compram fora do expediente
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
                >
                  <span>Ativar na Minha Loja</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Lado Direito: Ilustração / Demonstração Visual */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-50">
                <img
                  src="/images/features-showcase.jpg"
                  alt="Vitryne Automação de E-commerce e Moda"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ========================================================================= */}
      {/* 6. TABELA DE PREÇOS / PLANOS (Choose a Subscription)                      */}
      {/* ========================================================================= */}
      <section id="planos" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
              Tabela de Planos & Interações
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight">
              Escolha a Assinatura Ideal para o Seu Volume
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Planos transparentes com franquia de atendimentos inteligentes para Directs, Reels e Stories. Sem contratos de fidelidade.
            </p>
          </div>

          {/* ======================================================================= */}
          {/* SIMULADOR INTERATIVO DE INTERAÇÕES                                     */}
          {/* ======================================================================= */}
          {/* SIMULADOR DE VOLUME                                                     */}
          {/* ======================================================================= */}
          <div className="max-w-4xl mx-auto bg-slate-50/80 rounded-3xl p-7 sm:p-10 border border-slate-200/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Simulador de Volume
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  Quantas mensagens e comentários sua loja recebe por dia?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Arraste para estimar sua média diária de Directs, Stories e dúvidas nos Reels.
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="text-2xl sm:text-3xl font-black text-slate-950">
                  ~{dailyInteractions}{' '}
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">interações/dia</span>
                </div>
                <div className="text-xs font-medium text-slate-600">
                  ({(dailyInteractions * 30).toLocaleString('pt-BR')} interações estimadas/mês)
                </div>
              </div>
            </div>

            {/* Slider de Interações */}
            <div className="space-y-2 pt-2">
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={dailyInteractions}
                onChange={(e) => setDailyInteractions(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>5 /dia (150/mês)</span>
                <span>50 /dia (1.500/mês)</span>
                <span>100 /dia (3.000/mês)</span>
                <span>200+ /dia (6.000/mês)</span>
              </div>
            </div>

            {/* Indicadores Dinâmicos de Retorno */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                <span className="block text-xs text-slate-500 font-medium">Plano Recomendado</span>
                <div className="text-sm sm:text-base font-extrabold text-slate-950">
                  {dailyInteractions * 30 <= 50 ? (
                    <span className="text-slate-800">Plano Iniciante (Grátis)</span>
                  ) : dailyInteractions * 30 <= 1500 ? (
                    <span className="text-blue-600">Plano Profissional (R$ 97)</span>
                  ) : (
                    <span className="text-indigo-600">Plano Completo (R$ 197)</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                <span className="block text-xs text-slate-500 font-medium">Tempo Poupado</span>
                <div className="text-sm sm:text-base font-extrabold text-emerald-600">
                  ~{Math.round((dailyInteractions * 30 * 2.5) / 60)} horas economizadas/mês
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                <span className="block text-xs text-slate-500 font-medium">Vendas Recuperadas do Vácuo</span>
                <div className="text-sm sm:text-base font-extrabold text-indigo-600">
                  +R$ {Math.round(dailyInteractions * 30 * 0.18 * 120).toLocaleString('pt-BR')}{' '}
                  <span className="text-[10px] text-slate-400 font-normal">estimado</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* OS 3 CARDS DE PLANOS                                                    */}
          {/* ======================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Plano 1: Gratuito / Start */}
            <div className={`bg-white rounded-3xl p-8 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-8 ${dailyInteractions * 30 <= 50 ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
              }`}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Iniciante</h3>
                  <p className="text-xs text-slate-500 mt-1">Para quem está começando a organizar as vendas e testar</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                  <span>Até 50 interações com IA / mês</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-950">R$ 0</span>
                  <span className="text-sm font-semibold text-slate-500">/mês</span>
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all text-center"
                >
                  Criar Loja Grátis
                </Link>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Responde somente no Direct (DMs)</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Até 15 produtos ou serviços ativos</strong> no catálogo (mesmo enviando novos Stories)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Dashboard completo</strong> de vendas, pedidos e clientes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>50 interações com IA / mês para experimentar</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Catálogo online com link para a bio do Instagram</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Checkout e finalização direta no WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Atendimento por e-mail</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plano 2: Profissional (DESTAQUE - AZUL) */}
            <div className={`bg-blue-600 rounded-3xl p-8 sm:p-9 text-white shadow-2xl relative flex flex-col justify-between space-y-8 transform transition-all ${dailyInteractions * 30 > 50 && dailyInteractions * 30 <= 1500 ? 'lg:-translate-y-3 ring-4 ring-blue-300' : 'lg:-translate-y-2'
              }`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-black tracking-widest uppercase px-3.5 py-1 rounded-full shadow-md">
                Mais Escolhido por Boutiques
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white">Profissional</h3>
                  <p className="text-xs text-blue-100 mt-1">Automatize Directs e Comentários do feed e converta 24/7</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/80 text-white text-xs font-extrabold border border-blue-300/40 shadow-xs">
                  <span>Até 1.500 interações com IA / mês</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">R$ 97</span>
                  <span className="text-sm font-semibold text-blue-200">/mês</span>
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-extrabold bg-white text-blue-700 hover:bg-blue-50 transition-all shadow-lg text-center"
                >
                  Experimentar 7 Dias Grátis
                </Link>

                <div className="space-y-3.5 pt-4 border-t border-blue-500/50 text-xs sm:text-sm text-blue-50">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span className="font-extrabold text-white">Responde Directs + Comentários de Posts do Feed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span className="font-semibold text-white">Até 100 produtos ou serviços ativos no catálogo</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span className="font-semibold text-white">Filtro de Intenção de Compra (qualifica clientes reais)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span className="font-semibold text-white">Dashboard completo em tempo real de vendas e pedidos</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span className="font-semibold text-blue-100">1.500 atendimentos/mês (~50 conversas por dia)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span>Auto-cadastro em tempo real por Stories (até 100 itens)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span>Cálculo de entrega por motoboy e Sedex</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span>Pacote extra opcional: +500 interações por R$ 29</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-amber-300 shrink-0 stroke-[3]" />
                    <span>Atendimento via WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plano 3: Completo (TUDO + IA PERSONALIZADA) */}
            <div className={`bg-white rounded-3xl p-8 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-8 ${dailyInteractions * 30 > 1500 ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'
              }`}>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-950">Completo</h3>
                  <p className="text-xs text-slate-500 mt-1">Atendimento total e IA configurada exatamente como você deseja</p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                  <span>Até 5.000 interações com IA / mês</span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-950">R$ 197</span>
                  <span className="text-sm font-semibold text-slate-500">/mês</span>
                </div>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all text-center"
                >
                  Experimentar Plano Completo
                </Link>

                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Responde TUDO: Directs, Feed, Reels e Stories</strong> (enquetes, menções e reações)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>IA Personalizada & Sob Medida:</strong> Treinada no tom de voz e regras exclusivas da sua marca</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Produtos e serviços ILIMITADOS</strong> (Stories e novidades contínuas sem limite)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Regras de entrega sob medida:</strong> Motoboy express, horários de corte e fretes personalizados</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Dashboard avançado:</strong> Métricas completas + Inteligência de Demanda Reprimida</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>5.000 atendimentos mensais (~160 conversas/dia)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Múltiplas contas do Instagram conectadas</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Atendimento via WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. PERGUNTAS FREQUENTES (FAQ & Objeções Respondidas)                      */}
      {/* ========================================================================= */}
      <section id="duvidas" className="py-20 md:py-28 bg-[#F8FAFC] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
              Tire Suas Dúvidas
            </span>
            <h2 className="font-heading font-black text-3xl sm:text-4xl md:text-5xl text-slate-950 tracking-tight">
              Perguntas Frequentes
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Tudo o que você precisa saber sobre a inteligência artificial, regras de atendimento e limites da sua loja.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pergunta 1 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                O que conta como 1 interação útil da IA?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Qualquer atendimento completo: tirar dúvidas de numeração ou medidas no Direct, responder disponibilidade em comentário de Reels ou enviar o link do catálogo para concluir a compra.
              </p>
            </div>

            {/* Pergunta 2 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                Mensagens sem interesse de compra ou spam gastam minha cota?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Não! O Filtro de Intenção de Compra identifica automaticamente mensagens fora de contexto, propostas de spam ou cantadas e as silencia, qualificando apenas clientes reais sem descontar do seu limite mensal.
              </p>
            </div>

            {/* Pergunta 3 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                A IA pode atender no mesmo tom de voz e estilo da minha boutique?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sim! Você define a personalidade da sua loja: modo de falar (mais carinhoso, descontraído ou elegante), termos preferidos, opções de entrega e informações exclusivas dos seus produtos e serviços.
              </p>
            </div>

            {/* Pergunta 4 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                O que acontece se uma cliente fizer uma pergunta muito específica?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A IA identifica instantaneamente quando a dúvida precisa de um toque humano e transfere com delicadeza para a sua equipe no WhatsApp com o histórico completo da conversa.
              </p>
            </div>

            {/* Pergunta 5 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                Como a inteligência aprende sobre os produtos e novidades da loja?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Basta postar o provador ou look no Story do Instagram. A inteligência reconhece a peça e as informações para adicionar automaticamente ao catálogo da sua loja sem digitação manual.
              </p>
            </div>

            {/* Pergunta 6 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                Como funciona a entrega por motoboy e cálculo de envio?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Você pode cadastrar taxa fixa por bairro ou região, entrega expressa no mesmo dia com motoboy (com horário de corte, como pedidos até 14h), envio pelos Correios ou retirada no local.
              </p>
            </div>

            {/* Pergunta 7 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                O Instagram da minha loja corre algum risco de bloqueio?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nenhum risco. A integração é feita através da API Oficial da Meta / Instagram, 100% segura, homologada e de acordo com todas as diretrizes da plataforma.
              </p>
            </div>

            {/* Pergunta 8 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                Preciso deixar computador ligado ou instalar aplicativo no celular?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Não. A Vitryne funciona 100% na nuvem. Você pode desligar seu computador e fechar o celular que o atendimento continua respondendo e fechando vendas 24 horas por dia.
              </p>
            </div>

            {/* Pergunta 9 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                E se um Reel viralizar e eu ultrapassar a franquia do plano?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sua loja nunca para de vender: você pode contratar pacotes adicionais avulsos de 500 atendimentos por apenas R$ 29 ou mudar de plano com 1 clique a qualquer momento.
              </p>
            </div>

            {/* Pergunta 10 */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <strong className="text-slate-900 font-bold text-sm sm:text-base block">
                Existe contrato de fidelidade ou taxa sobre as vendas?
              </strong>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nenhum contrato de fidelidade e nenhuma porcentagem sobre suas vendas. Todo o faturamento da loja é 100% seu, e você pode pausar ou cancelar quando desejar diretamente no painel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FALE CONOSCO (Let's Talk - Split Section)                              */}
      {/* ========================================================================= */}
      <section id="contato" className="py-20 md:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Lado Esquerdo: Informações de Contato */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full border border-indigo-200">
                Fale Conosco
              </span>
              <h2 className="font-heading font-black text-3xl sm:text-4xl text-slate-950 tracking-tight">
                Vamos Conversar?
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Tem dúvidas sobre como a Vitryne funciona na sua loja ou quer ver uma demonstração ao vivo para o seu nicho? Nossa equipe responde em menos de 15 minutos.
              </p>

              <div className="space-y-4 pt-4 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">E-mail Comercial</span>
                    <strong className="text-slate-900">contato@vitryne.com.br</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">WhatsApp Dedicado</span>
                    <strong className="text-slate-900">+55 (11) 98765-4321</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400">Escritório Central</span>
                    <strong className="text-slate-900">Av. Paulista, 1000 - São Paulo, SP</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Lado Direito: Formulário Interativo */}
            <div className="lg:col-span-7 bg-slate-50 p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
              {contactSent ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Mensagem Enviada com Sucesso!</h3>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Agradecemos o seu contato. Nosso time de especialistas entrará em contato com você via WhatsApp em instantes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex: Maria Clara"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="maria@sualoja.com.br"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Instagram da Loja (@)
                      </label>
                      <input
                        type="text"
                        value={contactHandle}
                        onChange={(e) => setContactHandle(e.target.value)}
                        placeholder="@sualoja.moda"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Como podemos te ajudar?
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Conte um pouco sobre o volume de directs da sua loja e quais recursos você deseja ativar..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-extrabold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md"
                  >
                    <span>Enviar Mensagem</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. BANNER NEWSLETTER (Subscribe Our Newsletter)                           */}
      {/* ========================================================================= */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-3xl p-8 sm:p-14 text-center border border-indigo-100 shadow-sm space-y-6">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-700 bg-white/80 px-3.5 py-1 rounded-full border border-indigo-200">
              Conteúdo Exclusivo
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-950 tracking-tight">
              Receba Estratégias que Mais Convertem no Instagram
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Scripts de vendas, novidades do algoritmo da Meta e dicas práticas toda semana diretamente no seu e-mail.
            </p>

            {newsletterSent ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Pronto! Você receberá nossos melhores scripts toda semana.</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Seu melhor e-mail comercial"
                  className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 bg-white"
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-md shrink-0"
                >
                  Inscrever-se
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. DARK MODERN FOOTER                                                    */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Coluna 1: Marca */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-2xl tracking-tight text-white">
                  Vitryne<span className="text-indigo-400">.</span>
                </span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                A plataforma inteligente de atendimento e vendas automáticas pelo Instagram e WhatsApp para lojistas de moda transformarem conversas em clientes fiéis.
              </p>
            </div>

            {/* Coluna 2: Soluções */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Soluções</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#recursos" className="hover:text-white transition-colors">
                    IA Atendente 24/7
                  </a>
                </li>
                <li>
                  <a href="#recursos" className="hover:text-white transition-colors">
                    Auto-Cadastro por Story
                  </a>
                </li>
                <li>
                  <a href="#recursos" className="hover:text-white transition-colors">
                    Filtro de Intenção de Compra
                  </a>
                </li>
                <li>
                  <a href="#recursos" className="hover:text-white transition-colors">
                    Logística Motoboy Hoje
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 3: Recursos */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Recursos</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/catalogo" className="hover:text-white transition-colors">
                    Editor de Vitrine
                  </Link>
                </li>
                <li>
                  <a href="#planos" className="hover:text-white transition-colors">
                    Planos & Preços
                  </a>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Acesso Lojista
                  </Link>
                </li>
                <li>
                  <a href="#contato" className="hover:text-white transition-colors">
                    Suporte Técnico
                  </a>
                </li>
              </ul>
            </div>

            {/* Coluna 4: Empresa */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Empresa</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#equipe" className="hover:text-white transition-colors">
                    Sobre Nós
                  </a>
                </li>
                <li>
                  <a href="#resultados" className="hover:text-white transition-colors">
                    Casos de Sucesso
                  </a>
                </li>
                <li>
                  <a href="#contato" className="hover:text-white transition-colors">
                    Fale com Vendas
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Termos & Privacidade</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Vitryne Tecnologia Ltda. Todos os direitos reservados.
            </div>
            <div className="flex items-center gap-6">
              <span>Feito com paixão para lojistas do Brasil 🇧🇷</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
