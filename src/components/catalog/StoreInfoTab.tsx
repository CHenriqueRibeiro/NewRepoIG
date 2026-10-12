'use client';

import React, { useState } from 'react';
import { CatalogConfig, SchedulingConfig } from '@/lib/catalog/types';
import {
  Store,
  Smartphone,
  MessageCircle,
  Check,
  AlertCircle,
  CheckCheck,
  ExternalLink,
  Layers,
  ShoppingBag,
  Calendar,
  Plus,
  X,
  Copy,
  Info,
  Clock,
  Coffee,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StoreInfoTabProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
  onSave?: (updatedConfig?: CatalogConfig) => void;
}

const PRODUCT_NICHES = [
  'Roupas & Moda',
  'Calçados & Tênis',
  'Joias & Semijoias',
  'Cosméticos & Maquiagem',
  'Bolsas & Mochilas',
  'Óculos & Acessórios',
  'Eletrônicos & Celulares',
  'Gastronomia, Doces & Delivery',
  'Decoração & Casa',
  'Pet Shop & Rações',
  'Suplementos & Fitness',
  'Artesanato & Presentes',
  'Infantil, Bebês & Kids',
  'Moda Íntima & Lingerie',
  'Moda Praia & Biquínis',
  'Papelaria & Personalizados',
];

const SERVICE_NICHES = [
  'Barbearia & Barba',
  'Salão de Beleza & Cabelo',
  'Manicure & Nail Designer',
  'Estética Facial & Corporal',
  'Sobrancelhas & Extensão de Cílios',
  'Lavagem & Estética Automotiva',
  'Tatuagem & Piercing',
  'Personal Trainer & Saúde',
  'Consultoria & Treinamentos',
  'Fotografia & Filmagem',
  'Assistência Técnica & Celulares',
  'Massoterapia & Relaxamento',
  'Reformas & Serviços Gerais',
];

const WEEK_DAYS = [
  { id: 'Seg', label: 'Segunda' },
  { id: 'Ter', label: 'Terça' },
  { id: 'Qua', label: 'Quarta' },
  { id: 'Qui', label: 'Quinta' },
  { id: 'Sex', label: 'Sexta' },
  { id: 'Sáb', label: 'Sábado' },
  { id: 'Dom', label: 'Domingo' },
];

function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

function formatBusinessHoursString(
  days: string[],
  open: string,
  close: string,
  hasBreak?: boolean,
  breakStart?: string,
  breakEnd?: string
): string {
  if (!days || days.length === 0) return 'Horário a definir';
  let daysLabel = '';
  if (days.length === 7) {
    daysLabel = 'Todos os dias';
  } else if (
    days.length === 5 &&
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].every((d) => days.includes(d))
  ) {
    daysLabel = 'Segunda a Sexta';
  } else if (
    days.length === 6 &&
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].every((d) => days.includes(d))
  ) {
    daysLabel = 'Segunda a Sábado';
  } else {
    daysLabel = days.join(', ');
  }

  let text = `${daysLabel}: ${open || '09:00'} às ${close || '18:00'}`;
  if (hasBreak && breakStart && breakEnd) {
    text += ` • Pausa: ${breakStart} às ${breakEnd}`;
  }
  return text;
}

export default function StoreInfoTab({ config, onChangeConfig, onSave }: StoreInfoTabProps) {
  const [slugStatus, setSlugStatus] = useState<{
    isChecking: boolean;
    checked: boolean;
    available: boolean;
    suggestion?: string;
  }>({ isChecking: false, checked: false, available: true });

  const [customNicheInput, setCustomNicheInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const businessType = config.businessType === 'services' ? 'services' : 'products';
  const selectedNiches =
    config.niches && config.niches.length > 0
      ? config.niches
      : [businessType === 'services' ? 'Barbearia & Barba' : 'Roupas & Moda'];
  const currentAvailableNiches = businessType === 'services' ? SERVICE_NICHES : PRODUCT_NICHES;

  const updateField = (field: keyof CatalogConfig, value: any) => {
    const updated = {
      ...config,
      [field]: value,
    };
    onChangeConfig(updated);
  };

  const currentScheduling = config.schedulingConfig || config.scheduling || {
    enabled: true,
    openTime: '09:00',
    closeTime: '18:00',
    hasBreak: false,
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    businessHours: 'Segunda a Sábado: 09:00 às 18:00',
  };

  const updateScheduling = (fields: any) => {
    const merged = { ...currentScheduling, ...fields };
    const days = merged.workingDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const open = merged.openTime || '09:00';
    const close = merged.closeTime || '18:00';
    const hasBrk = merged.hasBreak || false;
    const brkStart = merged.breakStartTime || '12:00';
    const brkEnd = merged.breakEndTime || '13:00';
    merged.businessHours = formatBusinessHoursString(days, open, close, hasBrk, brkStart, brkEnd);

    const updated = {
      ...config,
      schedulingConfig: merged,
      scheduling: merged,
    };
    onChangeConfig(updated);
  };

  const verifySlug = async (slugToCheck: string) => {
    const clean = slugToCheck.trim().toLowerCase();
    if (!clean) return;

    setSlugStatus((prev) => ({ ...prev, isChecking: true }));
    try {
      const res = await fetch(
        `/api/catalog/validate-slug?slug=${encodeURIComponent(clean)}&name=${encodeURIComponent(config.storeName || '')}`
      );
      const data = await res.json();
      if (data.isSlugDuplicate || data.isNameDuplicate) {
        setSlugStatus({
          isChecking: false,
          checked: true,
          available: false,
          suggestion: data.suggestedSlug || data.cleanSlug,
        });
      } else {
        setSlugStatus({
          isChecking: false,
          checked: true,
          available: true,
        });
      }
    } catch {
      setSlugStatus({ isChecking: false, checked: true, available: true });
    }
  };

  const toggleNiche = (niche: string) => {
    let next: string[];
    if (selectedNiches.includes(niche)) {
      if (selectedNiches.length > 1) {
        next = selectedNiches.filter((n) => n !== niche);
      } else {
        return;
      }
    } else {
      if (selectedNiches.length >= 5) return;
      next = [...selectedNiches, niche];
    }
    updateField('niches', next);
  };

  const handleAddCustomNiche = () => {
    const trimmed = customNicheInput.trim();
    if (!trimmed || selectedNiches.length >= 5) return;
    if (!selectedNiches.includes(trimmed)) {
      updateField('niches', [...selectedNiches, trimmed]);
    }
    setCustomNicheInput('');
  };

  const copyStoreLink = () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/c/${config.slug || 'minha-loja'}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSave = () => {
    onSave?.(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-7 pb-12 animate-in fade-in duration-200">
      {/* 1. Top Header com Ação de Salvar e Link Rápido */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
              <span>Dados do Negócio</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identidade da vitrine, link exclusivo, telefones de WhatsApp e horários de funcionamento.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={copyStoreLink}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            leftIcon={saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            className={`font-bold text-xs px-5 shadow-md ${saveSuccess
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
          >
            {saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* 2. Identidade Principal do Negócio */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-slate-900 text-base">
              Identidade da Vitrine & Link
            </h3>
            <p className="text-xs text-slate-500">
              Como seus clientes identificam seu negócio online e acessam o catálogo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nome da Loja */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Nome da Loja ou Negócio *
            </label>
            <input
              type="text"
              value={config.storeName || ''}
              onChange={(e) => updateField('storeName', e.target.value)}
              placeholder="Ex: Boutique Bella, Barbearia Prime, Prime Tech"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600"
            />
            <p className="text-[11px] text-slate-500">
              Aparece no topo do catálogo, na mensagem do WhatsApp e no checkout.
            </p>
          </div>

          {/* Link / Slug Personalizado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Link Exclusivo / Slug *
              </label>
              {slugStatus.isChecking ? (
                <span className="text-[11px] text-indigo-600 animate-pulse">Verificando...</span>
              ) : slugStatus.checked && slugStatus.available ? (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> Disponível
                </span>
              ) : null}
            </div>

            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50 focus-within:border-indigo-600 focus-within:bg-white transition-all">
              <span className="px-3 text-xs text-slate-400 font-mono select-none border-r border-slate-200">
                vitryne.com.br/c/
              </span>
              <input
                type="text"
                value={config.slug || ''}
                onChange={(e) => {
                  const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                  updateField('slug', clean);
                  setSlugStatus({ isChecking: false, checked: false, available: true });
                }}
                onBlur={() => verifySlug(config.slug)}
                placeholder="minha-loja"
                className="flex-1 px-3 py-2.5 text-slate-900 font-mono font-bold text-xs sm:text-sm focus:outline-none bg-transparent"
              />
            </div>

            {/* Aviso se o slug já estiver em uso */}
            {slugStatus.checked && !slugStatus.available && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Esse link já está em uso por outro perfil.</span>
                </div>
                {slugStatus.suggestion && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('slug', slugStatus.suggestion);
                      setSlugStatus({ isChecking: false, checked: true, available: true });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors shrink-0"
                  >
                    Usar "{slugStatus.suggestion}"
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Instagram Handle */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold text-slate-800">
              Perfil do Instagram (@)
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50 focus-within:border-indigo-600 focus-within:bg-white max-w-md">
              <span className="px-3 text-xs text-slate-400 font-bold select-none">@</span>
              <input
                type="text"
                value={(config.instagram || '').replace(/^@/, '')}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[^a-zA-Z0-9._]/g, '');
                  updateField('instagram', clean ? `@${clean}` : '');
                }}
                placeholder="sua_loja_oficial"
                className="flex-1 px-2 py-2.5 text-slate-900 text-xs sm:text-sm font-semibold focus:outline-none bg-transparent"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Permite aos clientes visitarem seu Instagram com 1 clique a partir da vitrine.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Modelo Operacional & Nichos de Atuação */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-slate-900 text-base">
              Modelo Operacional & Nichos com IA
            </h3>
            <p className="text-xs text-slate-500">
              A inteligência artificial adapta a extração de produtos e conversas conforme seus nichos
            </p>
          </div>
        </div>

        {/* Alternância Modelo: Produtos vs Serviços */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => {
              updateField('businessType', 'products');
              const hasProductNiche = selectedNiches.some((n) => PRODUCT_NICHES.includes(n));
              if (!hasProductNiche) {
                updateField('niches', ['Roupas & Moda']);
              }
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${businessType === 'products'
                ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
              }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${businessType === 'products' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                }`}
            >
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Produtos Físicos (Vendas)</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Moda, calçados, semi joias, eletrônicos, doces e cosméticos.
              </p>
            </div>
          </div>

          <div
            onClick={() => {
              updateField('businessType', 'services');
              const hasServiceNiche = selectedNiches.some((n) => SERVICE_NICHES.includes(n));
              if (!hasServiceNiche) {
                updateField('niches', ['Barbearia & Barba']);
              }
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${businessType === 'services'
                ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
              }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${businessType === 'services' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                }`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-xs sm:text-sm">Serviços & Procedimentos</div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Barbearias, salões, estética, nail designers e agendamentos.
              </p>
            </div>
          </div>
        </div>

        {/* Gestão dos Nichos */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              Nichos do seu negócio (escolha até 5 simultâneos):
            </span>
            <span
              className={`font-mono font-bold px-2.5 py-0.5 rounded-lg text-xs ${selectedNiches.length >= 5
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-indigo-50 text-indigo-700'
                }`}
            >
              {selectedNiches.length} de 5 selecionados
            </span>
          </div>

          {/* Tags Ativas */}
          <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-12 items-center">
            <span className="text-[11px] font-bold text-slate-500 pr-1">Ativos:</span>
            {selectedNiches.map((niche) => (
              <span
                key={niche}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
              >
                <span>{niche}</span>
                {selectedNiches.length > 1 && (
                  <button
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className="hover:text-indigo-200 p-0.5 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Sugestões do Segmento Selecionado */}
          <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1">
            {currentAvailableNiches.map((niche) => {
              const isSelected = selectedNiches.includes(niche);
              return (
                <button
                  key={niche}
                  type="button"
                  onClick={() => toggleNiche(niche)}
                  disabled={!isSelected && selectedNiches.length >= 5}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${isSelected
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-40'
                    }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-indigo-700" />}
                  <span>{niche}</span>
                </button>
              );
            })}
          </div>

          {/* Adicionar Nicho Personalizado */}
          <div className="flex items-center gap-2 pt-1 max-w-md">
            <input
              type="text"
              value={customNicheInput}
              onChange={(e) => setCustomNicheInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomNiche();
                }
              }}
              placeholder="Outro nicho específico..."
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
            />
            <button
              type="button"
              onClick={handleAddCustomNiche}
              disabled={selectedNiches.length >= 5 || !customNicheInput.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Telefones de WhatsApp & Roteamento de Notificações */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-slate-900 text-base">
              Telefones de WhatsApp & Roteamento
            </h3>
            <p className="text-xs text-slate-500">
              Configure o número de atendimento aos clientes e onde você quer receber avisos de novos pedidos e produtos
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* WhatsApp Comercial */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Comercial da Loja (Atendimento a Clientes) *</span>
            </label>
            <input
              type="tel"
              value={config.whatsappProfessional ? formatPhoneNumber(config.whatsappProfessional) : formatPhoneNumber(config.whatsapp || '')}
              onChange={(e) => {
                const formatted = formatPhoneNumber(e.target.value);
                const digits = formatted.replace(/\D/g, '');
                updateField('whatsappProfessional', formatted);
                updateField('whatsapp', digits);
                if (config.sameWhatsapp) {
                  updateField('whatsappPersonal', formatted);
                }
              }}
              placeholder="Ex: (11) 98765-4321"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600"
            />
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Info className="w-3.5 h-3.5" />
                <span>Finalidade deste número:</span>
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Este é o número que os clientes acionam ao clicar em "Pedir no WhatsApp" ou "Tirar Dúvidas". Os pedidos fechados chegam aqui.
              </p>
            </div>
          </div>

          {/* Checkbox Mesmo Número */}
          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={config.sameWhatsapp ?? (!config.whatsappPersonal || config.whatsappPersonal === config.whatsappProfessional)}
              onChange={(e) => {
                const checked = e.target.checked;
                updateField('sameWhatsapp', checked);
                if (checked) {
                  const currentProf = config.whatsappProfessional || config.whatsapp || '';
                  updateField('whatsappPersonal', currentProf);
                  updateField('alertRecipientNumber', 'professional');
                }
              }}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800">
              Usar o mesmo número para o WhatsApp comercial e o WhatsApp pessoal
            </span>
          </label>

          {/* WhatsApp Pessoal (Se números forem diferentes) */}
          {!config.sameWhatsapp && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
                <span>WhatsApp Pessoal do Responsável / Lojista</span>
              </label>
              <input
                type="tel"
                value={formatPhoneNumber(config.whatsappPersonal || '')}
                onChange={(e) => updateField('whatsappPersonal', formatPhoneNumber(e.target.value))}
                placeholder="Ex: (11) 91234-5678"
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600"
              />
              <p className="text-[11px] text-slate-500">
                Seu número particular do dia a dia, caso queira separar sua vida pessoal do atendimento da loja.
              </p>
            </div>
          )}

          {/* Roteamento de Alertas (Exibido apenas quando números forem diferentes) */}
          {!config.sameWhatsapp && (
            <div className="space-y-2.5 pt-1 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-800">
                Por qual número você deseja receber informações, solicitações e alertas de cadastros de peças/serviços?
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('alertRecipientNumber', 'professional')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${config.alertRecipientNumber === 'professional' || !config.alertRecipientNumber
                      ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <div className="text-xs font-bold text-slate-900">No Comercial</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                    No WhatsApp onde os clientes já falam
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField('alertRecipientNumber', 'personal')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${config.alertRecipientNumber === 'personal'
                      ? 'border-indigo-600 bg-indigo-50/70 text-slate-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <div className="text-xs font-bold text-slate-900">No Pessoal</div>
                  <div className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Direto no seu número particular
                  </div>
                </button>


              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. Dias e Horários de Funcionamento com Pausa */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading font-black text-slate-900 text-base">
              Dias e Horários de Funcionamento
            </h3>
            <p className="text-xs text-slate-500">
              Defina os dias da semana em que sua loja atende, os horários de abertura/fechamento e pausas de almoço
            </p>
          </div>
        </div>

        <div className="space-y-5 max-w-2xl">
          {/* Dias de Atendimento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Dias de Atendimento:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => updateScheduling({ workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'] })}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                >
                  Seg a Sex
                </button>
                <button
                  type="button"
                  onClick={() => updateScheduling({ workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] })}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                >
                  Seg a Sáb
                </button>
                <button
                  type="button"
                  onClick={() => updateScheduling({ workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] })}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold"
                >
                  Todos
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WEEK_DAYS.map((day) => {
                const currentDays = currentScheduling.workingDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                const isSelected = currentDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => {
                      let nextDays: string[];
                      if (isSelected) {
                        nextDays = currentDays.length > 1 ? currentDays.filter((d: string) => d !== day.id) : currentDays;
                      } else {
                        nextDays = [...currentDays, day.id];
                      }
                      updateScheduling({ workingDays: nextDays });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Horários de Abertura e Fechamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Horário de Abertura
              </label>
              <input
                type="time"
                value={currentScheduling.openTime || '09:00'}
                onChange={(e) => updateScheduling({ openTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Horário de Fechamento
              </label>
              <input
                type="time"
                value={currentScheduling.closeTime || '18:00'}
                onChange={(e) => updateScheduling({ closeTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Pausa / Intervalo de Almoço */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(currentScheduling.hasBreak)}
                onChange={(e) => updateScheduling({ hasBreak: e.target.checked })}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span>Possui pausa / intervalo de almoço durante o dia?</span>
              </span>
            </label>

            {currentScheduling.hasBreak && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Início da Pausa (Almoço)
                  </label>
                  <input
                    type="time"
                    value={currentScheduling.breakStartTime || '12:00'}
                    onChange={(e) => updateScheduling({ breakStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Fim da Pausa (Retorno)
                  </label>
                  <input
                    type="time"
                    value={currentScheduling.breakEndTime || '13:00'}
                    onChange={(e) => updateScheduling({ breakEndTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Prévia do Expediente */}
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-950 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-700 shrink-0" />
            <div>
              <span className="font-bold text-purple-900">Expediente configurado: </span>
              <span className="font-semibold text-purple-800">
                {formatBusinessHoursString(
                  currentScheduling.workingDays || ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
                  currentScheduling.openTime || '09:00',
                  currentScheduling.closeTime || '18:00',
                  currentScheduling.hasBreak,
                  currentScheduling.breakStartTime,
                  currentScheduling.breakEndTime
                )}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Botão de Salvar Rápido no rodapé da aba */}
      {onSave && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Check className="w-4 h-4" />}
            onClick={() => onSave(config)}
            className="shadow-md shadow-indigo-600/20 font-bold"
          >
            Salvar Dados do Negócio
          </Button>
        </div>
      )}
    </div>
  );
}
