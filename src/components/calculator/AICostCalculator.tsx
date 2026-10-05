'use client';

import React, { useState } from 'react';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { Sparkles, ShieldCheck, Check, DollarSign } from 'lucide-react';

export default function AICostCalculator() {
  const [comments, setComments] = useState<number>(500);
  const [stories, setStories] = useState<number>(300);
  const [dmsPerLead, setDmsPerLead] = useState<number>(3);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-6-luna');

  const usdToBrl = 5.5;

  const costVisionPerStory = 0.0008;
  const costTextPerDm = 0.00015;

  const leadsFromComments = comments * 0.4;
  const leadsFromStories = stories * 0.5;
  const totalLeadsInDirect = leadsFromComments + leadsFromStories;

  const totalDmMessages = totalLeadsInDirect * dmsPerLead;
  const totalVisionAnalyzed = stories * 0.8;

  const baseCostUsd = totalVisionAnalyzed * costVisionPerStory + totalDmMessages * costTextPerDm;
  const minCostUsd = Math.max(0.4, Number((baseCostUsd * 0.85).toFixed(2)));
  const maxCostUsd = Math.max(0.9, Number((baseCostUsd * 1.25).toFixed(2)));

  const minCostBrl = (minCostUsd * usdToBrl).toFixed(2).replace('.', ',');
  const maxCostBrl = (maxCostUsd * usdToBrl).toFixed(2).replace('.', ',');

  return (
    <div className="w-full p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Sliders & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-1">
            <h3 className="font-heading font-bold text-lg text-slate-900 tracking-tight">
              Simule o volume de interações da sua loja
            </h3>
            <p className="text-xs text-slate-500">
              Ajuste as métricas aproximadas do seu perfil do Instagram para estimar o consumo:
            </p>
          </div>

          <div className="space-y-5">
            <Slider
              label="Comentários recebidos por mês em posts e Reels:"
              valueDisplay={`${comments.toLocaleString('pt-BR')} comentários`}
              min={50}
              max={3000}
              step={50}
              value={comments}
              onChange={(e) => setComments(Number(e.target.value))}
            />

            <Slider
              label="Respostas e interações em Stories por mês:"
              valueDisplay={`${stories.toLocaleString('pt-BR')} interações`}
              min={20}
              max={2000}
              step={20}
              value={stories}
              onChange={(e) => setStories(Number(e.target.value))}
            />

            <Slider
              label="Média de mensagens no Direct por atendimento:"
              valueDisplay={`${dmsPerLead} mensagens`}
              min={1}
              max={8}
              step={1}
              value={dmsPerLead}
              onChange={(e) => setDmsPerLead(Number(e.target.value))}
            />

            <div className="pt-1">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Modelo de Inteligência Artificial:
              </label>
              <Select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="gpt-6-luna">OpenAI GPT-6 Luna (Ultrarrápido e Ultraeconômico • Recomendado)</option>
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash</option>
                <option value="groq-llama">Groq LLaMA 3.3</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Right: Real-time Calculation & Breakdown Card (5 cols) */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 text-center space-y-5 shadow-sm">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sem Taxa Adicional (Preço de Custo)</span>
            </div>

            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block pt-1">
              Estimativa de Custo Mensal da IA
            </span>
            <div className="font-heading font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              US$ {minCostUsd.toFixed(2)} <span className="text-lg font-normal text-slate-500">a</span> US$ {maxCostUsd.toFixed(2)}
            </div>
            <div className="font-heading font-bold text-base sm:text-lg text-emerald-400">
              Aprox. R$ {minCostBrl} a R$ {maxCostBrl} / mês
            </div>
            <p className="text-[11px] text-slate-400">
              Média estimada de menos de R$ 0,02 por atendimento completo no Direct.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left space-y-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sem mensalidades abusivas de IA</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Você paga direto ao provedor oficial</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A Vitryne não cobra nenhuma comissão por mensagem</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            O valor é cobrado pela OpenAI no seu cartão da plataforma deles conforme o uso real da loja.
          </p>
        </div>
      </div>
    </div>
  );
}
