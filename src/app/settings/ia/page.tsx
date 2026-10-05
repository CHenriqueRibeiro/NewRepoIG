'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  MessageCircle,
  Moon,
  Info,
  Check,
  CheckCircle2,
  Server,
  Cpu,
  Zap,
  Sliders,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';

export default function AISettingsPage() {
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Modos de Operação
  const [aiMode, setAiMode] = useState<'noturno' | 'guarda_costas' | 'total_24_7' | 'personalizado'>('total_24_7');
  const [bodyguardMinutes, setBodyguardMinutes] = useState(15);
  const [nightStart, setNightStart] = useState('18:00');
  const [nightEnd, setNightEnd] = useState('08:00');
  const [weekendActive, setWeekendActive] = useState(true);

  // Personalização da Comunicação
  const [toneOfVoice, setToneOfVoice] = useState('consultivo');
  const [pauseOnHumanRequest, setPauseOnHumanRequest] = useState(true);
  const [attachSizingGuide, setAttachSizingGuide] = useState(true);
  const [conversationalIntentDiscovery, setConversationalIntentDiscovery] = useState(true);

  const handleSavePreferences = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3500);
  };

  return (
    <div className="w-full max-w-5xl space-y-8 pb-16">
      {/* Header com Visual Moderno & Premium */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Central de Inteligência Artificial
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Ativa &amp; Calibrada
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Defina o comportamento operacional e as diretrizes comerciais da IA para o Instagram da sua loja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
              <Check className="w-4 h-4 stroke-[3]" /> Preferências salvas!
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={handleSavePreferences}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md shadow-slate-900/20 px-6"
            leftIcon={savedFeedback ? <Check className="w-4 h-4 stroke-[3]" /> : undefined}
          >
            {savedFeedback ? 'Salvo com Sucesso!' : 'Salvar Preferências'}
          </Button>
        </div>
      </div>



      {/* Banner de Status Operacional do Backend */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-white">
                Motor de IA Conectado &amp; Operacional no Servidor
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Backend Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chaves de API, credenciais e modelos neurais são gerenciados com segurança via backend (.env).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-[11px]">OpenAI Vision + Fast LLM</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">Latência ~42ms</span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Modos de Atuação (Destaque Principal) */}
      <div className="space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Modo de Atuação da IA
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha a estratégia de atendimento ideal para o momento da sua loja no Instagram.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Selecione uma das 4 estratégias abaixo
          </span>
        </div>

        {/* Grade de Cards 2x2 com Tooltips Informativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Modo 1: Piloto Automático 24/7 */}
          <div
            onClick={() => setAiMode('total_24_7')}
            className={`p-5 rounded-3xl border text-xs cursor-pointer transition-all space-y-3 flex flex-col justify-between relative group ${aiMode === 'total_24_7'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/30'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm bg-white'
              }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${aiMode === 'total_24_7'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 text-indigo-600'
                      }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-slate-900 text-sm">
                        Piloto Automático 24/7
                      </span>
                      <Tooltip
                        content="A IA atende 100% dos comentários e Directs imediatamente, 24 horas por dia, 7 dias por semana. Qualifica o cliente, tira dúvidas sobre peças e entrega o link de compra ou chave PIX em tempo real."
                        side="top"
                      >
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Informações sobre o Piloto Automático 24/7"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block mt-0.5">
                      Máxima Conversão
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${aiMode === 'total_24_7'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                    }`}
                >
                  {aiMode === 'total_24_7' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                A IA atende comentários e DMs instantaneamente (2 a 5 segundos), dia e noite. Perfeito para lojas digitais que querem vender sem depender de atendentes humanos.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Resposta Imediata
              </span>
              <span className="font-semibold text-indigo-700">
                {aiMode === 'total_24_7' ? '● Modo Ativo' : 'Ativar Modo'}
              </span>
            </div>
          </div>

          {/* Modo 2: Plantão Noturno & Fins de Semana */}
          <div
            onClick={() => setAiMode('noturno')}
            className={`p-5 rounded-3xl border text-xs cursor-pointer transition-all space-y-3 flex flex-col justify-between relative group ${aiMode === 'noturno'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/30'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm bg-white'
              }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${aiMode === 'noturno'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-indigo-50 text-indigo-600'
                      }`}
                  >
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-slate-900 text-sm">
                        Plantão Noturno &amp; Fim de Semana
                      </span>
                      <Tooltip
                        content="Sua equipe atende normalmente durante o horário comercial. Assim que encerra o expediente da loja (ou nos sábados/domingos), a IA assume o atendimento automaticamente para não deixar clientes da madrugada sem resposta."
                        side="top"
                      >
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Informações sobre o Plantão Noturno"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 inline-block mt-0.5">
                      Híbrido Humano + IA
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${aiMode === 'noturno'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                    }`}
                >
                  {aiMode === 'noturno' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Sua equipe humana atende no horário de expediente da loja. A IA assume automaticamente à noite e finais de semana para resgatar quem manda mensagem fora de hora.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{nightStart} às {nightEnd} + Fins de Semana</span>
              <span className="font-semibold text-indigo-700">
                {aiMode === 'noturno' ? '● Modo Ativo' : 'Ativar Modo'}
              </span>
            </div>
          </div>

          {/* Modo 3: Guarda-Costas / Anti-Vácuo */}
          <div
            onClick={() => setAiMode('guarda_costas')}
            className={`p-5 rounded-3xl border text-xs cursor-pointer transition-all space-y-3 flex flex-col justify-between relative group ${aiMode === 'guarda_costas'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/30'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm bg-white'
              }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${aiMode === 'guarda_costas'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-amber-50 text-amber-600'
                      }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-slate-900 text-sm">
                        Modo Guarda-Costas (Anti-Vácuo)
                      </span>
                      <Tooltip
                        content="Sua equipe humana tem prioridade total para responder. Se nenhuma pessoa responder dentro do prazo de tolerância (ex: 15 minutos), a IA assume e tira as dúvidas do cliente, garantindo que ninguém desista da compra por demora."
                        side="top"
                      >
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Informações sobre o Modo Guarda-Costas"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 inline-block mt-0.5">
                      Segurança de Atendimento
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${aiMode === 'guarda_costas'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                    }`}
                >
                  {aiMode === 'guarda_costas' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                Sua equipe atende primeiro. Caso o atendimento humano demore mais do que a tolerância escolhida, a IA intervém educadamente para não perder a venda.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tolerância: {bodyguardMinutes} minutos</span>
              <span className="font-semibold text-indigo-700">
                {aiMode === 'guarda_costas' ? '● Modo Ativo' : 'Ativar Modo'}
              </span>
            </div>
          </div>

          {/* Modo 4: Foco em Comentários */}
          <div
            onClick={() => setAiMode('personalizado')}
            className={`p-5 rounded-3xl border text-xs cursor-pointer transition-all space-y-3 flex flex-col justify-between relative group ${aiMode === 'personalizado'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-600/30'
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm bg-white'
              }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${aiMode === 'personalizado'
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700'
                      }`}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-heading font-bold text-slate-900 text-sm">
                        Apenas Comentários de Posts &amp; Reels
                      </span>
                      <Tooltip
                        content="A IA responde dúvidas de valor, tamanhos e modelos diretamente nos comentários públicos de fotos e Reels para gerar engajamento, deixando o Direct reservado para atendimento manual."
                        side="top"
                      >
                        <button
                          type="button"
                          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Informações sobre o Modo de Comentários"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </Tooltip>
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 inline-block mt-0.5">
                      Engajamento Público
                    </span>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${aiMode === 'personalizado'
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300'
                    }`}
                >
                  {aiMode === 'personalizado' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-xs">
                A IA responde dúvidas públicas no Feed e nos Reels e convida o interessado para a vitrine. Suas DMs e Directs continuam sob controle manual da equipe.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Feed &amp; Reels públicos</span>
              <span className="font-semibold text-indigo-700">
                {aiMode === 'personalizado' ? '● Modo Ativo' : 'Ativar Modo'}
              </span>
            </div>
          </div>
        </div>

        {/* Ajustes Finos Específicos do Modo Selecionado */}
        {aiMode === 'noturno' && (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Configurar Horários do Plantão Noturno:
              </span>
              <span className="text-xs text-slate-500">Horário de Brasília (BRT)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">Início do Plantão da IA:</span>
                <input
                  type="time"
                  value={nightStart}
                  onChange={(e) => setNightStart(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 block">Horário que a equipe encerra o dia</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 block">Fim do Plantão da IA:</span>
                <input
                  type="time"
                  value={nightEnd}
                  onChange={(e) => setNightEnd(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 block">Horário que a equipe assume pela manhã</span>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer pt-1 bg-white p-3 rounded-2xl border border-slate-200">
              <input
                type="checkbox"
                checked={weekendActive}
                onChange={(e) => setWeekendActive(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-600 border-slate-300"
              />
              <span>Ativar plantão 24h contínuo nos fins de semana (sábado e domingo)</span>
            </label>
          </div>
        )}

        {aiMode === 'guarda_costas' && (
          <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/90 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-bold text-slate-900 uppercase tracking-wider">Tempo de Tolerância para Resposta Humana:</span>
              <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 text-xs">
                {bodyguardMinutes} minutos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Se um cliente enviar mensagem no Instagram e nenhum atendente humano responder dentro deste limite, a IA assume e tira a dúvida cordialmente.
            </p>
            <div className="grid grid-cols-4 gap-2.5 pt-1">
              {[5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setBodyguardMinutes(mins)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${bodyguardMinutes === mins
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seção 2: Personalização & Regras de Atendimento */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Diretrizes de Conversação &amp; Tom de Voz
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize como a IA fala e reage em momentos específicos do atendimento comercial.
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Regras Ativas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tom de Voz */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Tom de Voz da IA:
              </label>
              <Tooltip
                content="Ajusta o estilo do vocabulário, uso de emojis e nível de formalidade das mensagens que a IA envia para seus clientes no Instagram."
                side="top"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
              </Tooltip>
            </div>
            <Select
              value={toneOfVoice}
              onChange={(e: any) => setToneOfVoice(e.target.value)}
              className="font-medium text-xs sm:text-sm py-2"
            >
              <option value="consultivo">Acolhedor &amp; Consultivo (Produtos &amp; Serviços • Recomendado)</option>
              <option value="elegante">Elegante &amp; Sofisticado (Moda Fina &amp; Joias)</option>
              <option value="descontraido">Jovem &amp; Descontraído (Streetwear, Acessórios &amp; Tendências)</option>
            </Select>
            <p className="text-[11px] text-slate-400">
              Linguagem natural brasileira, empática e focada em ajudar na escolha e fechamento.
            </p>
          </div>

          {/* Toggles de Regras com Tooltips Explicativos */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Gatilhos de Proteção Comercial:
            </span>

            {/* Toggle 1: Pausar com Humano */}
            <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={pauseOnHumanRequest}
                onChange={(e) => setPauseOnHumanRequest(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Transbordo Humano Imediato
                  </span>
                  <Tooltip
                    content="Se o cliente expressar insatisfação, fizer reclamação de entrega ou pedir para falar com uma pessoa, a IA avisa cordialmente que um atendente assumirá e silencia para não atrapalhar."
                    side="left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pausa a IA automaticamente se o cliente solicitar atendente humano ou relatar problema.
                </p>
              </div>
            </label>

            {/* Toggle 2: Qualificação Consultiva */}
            <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={conversationalIntentDiscovery}
                onChange={(e) => setConversationalIntentDiscovery(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Qualificação Consultiva Humana
                  </span>
                  <Tooltip
                    content="Evita despejar links genéricos quando o cliente apenas dá um 'Boa noite'. A IA pergunta gentilmente o que ele procura, descobre o modelo/tamanho e só então recomenda a peça ideal."
                    side="left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Entende a intenção antes de mandar links em saudações simples (&quot;Boa noite&quot;, &quot;Oi&quot;).
                </p>
              </div>
            </label>

            {/* Toggle 3: Orientar Medidas */}
            <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 flex items-start gap-3 cursor-pointer transition-all">
              <input
                type="checkbox"
                checked={attachSizingGuide}
                onChange={(e) => setAttachSizingGuide(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300 mt-0.5"
              />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Consultoria de Tamanho &amp; Estoque Real
                  </span>
                  <Tooltip
                    content="Ao ser questionada sobre tamanhos (P, M, G, 40, etc.), a IA consulta o estoque da variante em tempo real e orienta se a peça veste a numeração do cliente."
                    side="left"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Verifica disponibilidade em tempo real e tira dúvidas sobre caimento e numerações.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Rodapé com Botão de Ação */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Alterações entram em vigor instantaneamente em todas as interações.
          </span>
          <Button
            variant="primary"
            size="md"
            onClick={handleSavePreferences}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 shadow-sm"
          >
            Salvar Preferências
          </Button>
        </div>
      </div>
    </div>
  );
}
