'use client';

import React, { useState, useMemo } from 'react';
import { TEMPLATES } from '@/lib/catalog/templates';
import { CatalogTemplate } from '@/lib/catalog/types';
import { Check, Sparkles, Wand2, Search, Calendar, ShoppingBag, Clock } from 'lucide-react';

interface TemplateSelectorProps {
  currentTemplateId: string;
  onSelectTemplate: (template: CatalogTemplate) => void;
}

export default function TemplateSelector({
  currentTemplateId,
  onSelectTemplate,
}: TemplateSelectorProps) {
  const [activeSegment, setActiveSegment] = useState<'all' | 'products' | 'services'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const countProducts = useMemo(
    () => TEMPLATES.filter((t) => t.segment !== 'services').length,
    []
  );
  const countServices = useMemo(
    () => TEMPLATES.filter((t) => t.segment === 'services').length,
    []
  );

  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      // Filtro por segmento
      if (activeSegment === 'products' && t.segment === 'services') return false;
      if (activeSegment === 'services' && t.segment !== 'services') return false;

      // Filtro por busca
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.categoryName.toLowerCase().includes(q) ||
        t.tagline.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.config.topics && t.config.topics.some((top) => top.toLowerCase().includes(q)))
      );
    });
  }, [activeSegment, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Banner de Apresentação */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 p-5 rounded-2xl border border-indigo-100/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Templates Profissionais de Alta Conversão</span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Escolha entre <strong>modelos para Produtos Físicos & Gastronomia</strong> ou <strong>Serviços com Agendamento de Horários</strong> (estética automotiva, unhas, cabelo, barbearia, higienização, make e aluguel de roupas). Ao aplicar, a paleta visual, tópicos temáticos e botões de ação são carregados instantaneamente mantendo seus dados protegidos.
          </p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas de Segmento */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveSegment('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeSegment === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({TEMPLATES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('products')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSegment === 'products'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Produtos & Doceria ({countProducts})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSegment('services')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeSegment === 'services'
                ? 'bg-white text-purple-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Serviços & Agendamentos ({countServices})</span>
          </button>
        </div>

        {/* Input de Busca */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar nicho (ex: carro, unha, doce, cabelo)..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid de Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((template) => {
          const isSelected = template.id === currentTemplateId;
          const { theme } = template.config;
          const isService = template.segment === 'services' || template.config.businessType === 'services';

          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              className={`group relative rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col bg-white ${
                isSelected
                  ? 'border-indigo-600 shadow-md shadow-indigo-100 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Badge Superior Esquerdo: Tipo de Negócio */}
              <div className="absolute top-3 left-3 z-10">
                {isService ? (
                  <span className="bg-purple-900/80 backdrop-blur-md text-purple-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-purple-500/30">
                    <Calendar className="w-3 h-3 text-purple-300" />
                    <span>Serviço & Horários</span>
                  </span>
                ) : (
                  <span className="bg-slate-900/80 backdrop-blur-md text-slate-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-white/20">
                    <ShoppingBag className="w-3 h-3 text-amber-300" />
                    <span>Produto Físico</span>
                  </span>
                )}
              </div>

              {/* Badge de Selecionado */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 bg-indigo-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Ativo</span>
                </div>
              )}

              {/* Imagem de Capa do Template */}
              <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-white/80">
                    {template.categoryName}
                  </span>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {template.name}
                  </h3>
                </div>
              </div>

              {/* Conteúdo & Detalhes */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>

                  {/* Detalhes de agendamento se for serviço */}
                  {isService && template.config.schedulingConfig && (
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-purple-700 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Grade: {template.config.schedulingConfig.businessHours || 'Horários flexíveis'}</span>
                    </div>
                  )}
                </div>

                {/* Swatch de Cores e Estilo */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 mr-1">Paleta:</span>
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: theme.primaryColor }}
                      title="Cor Primária"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: theme.backgroundColor }}
                      title="Fundo"
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                      style={{ backgroundColor: theme.cardBackground }}
                      title="Cards"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-700'
                        : isService
                        ? 'bg-purple-50 text-purple-700 group-hover:bg-purple-600 group-hover:text-white'
                        : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>{isSelected ? 'Em Uso' : 'Aplicar'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-sm font-semibold text-slate-700">Nenhum template encontrado com essa busca.</p>
          <p className="text-xs text-slate-500 mt-1">Tente pesquisar por outros termos ou troque a categoria.</p>
        </div>
      )}
    </div>
  );
}
