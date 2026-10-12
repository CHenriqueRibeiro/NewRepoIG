'use client';

import React, { useState, useEffect } from 'react';
import { CatalogConfig, ProductItem, SchedulingConfig } from '@/lib/catalog/types';
import { TEMPLATES } from '@/lib/catalog/templates';
import {
  ShoppingBag,
  Sparkles,
  Calendar,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  MessageCircle,
  Store,
  AlertCircle,
  Plus,
  X,
  Smartphone,
  CheckCheck,
  Rocket,
  Clock,
  MapPin,
  Coffee,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EasyOnboardingWizardProps {
  initialConfig?: CatalogConfig;
  onFinish: (completedConfig: CatalogConfig, destination?: 'products' | 'dashboard') => void;
  onCancel?: () => void;
  isModal?: boolean;
}

// Nichos específicos para Produtos Físicos (Vendas no Varejo/Atacado)
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

// Nichos específicos para Serviços & Procedimentos (Agendamentos e Atendimentos)
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

// Formatação automática de telefone brasileiro
function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Formatação legível do horário e expediente
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

export default function EasyOnboardingWizard({
  initialConfig,
  onFinish,
  onCancel,
  isModal = false,
}: EasyOnboardingWizardProps) {
  // Passos do Wizard:
  // 1: Nichos & Segmento (Produtos vs Serviços com listas dedicadas)
  // 2: Dados do Negócio (Nome, Link, Telefones Comercial/Pessoal, Horários de Funcionamento e Pausa, Localização)
  // 3: Conclusão & Destino (Preencher Catálogo Agora ou Finalizar Cadastro Inicial)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // 1. Modelo de Negócio
  const [businessType, setBusinessType] = useState<'products' | 'services'>(
    initialConfig?.businessType === 'services' ? 'services' : 'products'
  );

  // 2. Nichos Selecionados (Até 5)
  const [selectedNiches, setSelectedNiches] = useState<string[]>(
    initialConfig?.niches && initialConfig.niches.length > 0
      ? initialConfig.niches.slice(0, 5)
      : initialConfig?.businessType === 'services'
        ? ['Barbearia & Barba']
        : ['Roupas & Moda']
  );
  const [customNicheInput, setCustomNicheInput] = useState('');

  // 3. Nome da Loja / Catálogo & Slug
  const [storeName, setStoreName] = useState<string>(
    initialConfig?.storeName && initialConfig.storeName !== 'Minha Loja'
      ? initialConfig.storeName
      : ''
  );
  const [catalogSlug, setCatalogSlug] = useState<string>(
    initialConfig?.slug && initialConfig.slug !== 'minha-loja'
      ? initialConfig.slug
      : ''
  );
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{
    checked: boolean;
    available: boolean;
    suggestion?: string;
  }>({ checked: false, available: true });

  // 4. Telefones de WhatsApp
  const [whatsappProfessional, setWhatsappProfessional] = useState<string>(
    initialConfig?.whatsappProfessional
      ? formatPhoneNumber(initialConfig.whatsappProfessional)
      : initialConfig?.whatsapp
        ? formatPhoneNumber(initialConfig.whatsapp)
        : ''
  );
  const [whatsappPersonal, setWhatsappPersonal] = useState<string>(
    initialConfig?.whatsappPersonal
      ? formatPhoneNumber(initialConfig.whatsappPersonal)
      : ''
  );
  const [sameWhatsapp, setSameWhatsapp] = useState<boolean>(
    initialConfig?.sameWhatsapp ?? (Boolean(initialConfig?.whatsapp) && !initialConfig?.whatsappPersonal)
  );
  const [alertRecipient, setAlertRecipient] = useState<'professional' | 'personal' | 'both'>(
    initialConfig?.alertRecipientNumber || 'professional'
  );

  // 5. Dias e Horários de Funcionamento com Pausa
  const [workingDays, setWorkingDays] = useState<string[]>(
    initialConfig?.schedulingConfig?.workingDays ||
    initialConfig?.scheduling?.workingDays ||
    ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  );
  const [openTime, setOpenTime] = useState<string>(
    initialConfig?.schedulingConfig?.openTime ||
    initialConfig?.scheduling?.openTime ||
    '09:00'
  );
  const [closeTime, setCloseTime] = useState<string>(
    initialConfig?.schedulingConfig?.closeTime ||
    initialConfig?.scheduling?.closeTime ||
    '18:00'
  );
  const [hasBreak, setHasBreak] = useState<boolean>(
    initialConfig?.schedulingConfig?.hasBreak ||
    initialConfig?.scheduling?.hasBreak ||
    false
  );
  const [breakStartTime, setBreakStartTime] = useState<string>(
    initialConfig?.schedulingConfig?.breakStartTime ||
    initialConfig?.scheduling?.breakStartTime ||
    '12:00'
  );
  const [breakEndTime, setBreakEndTime] = useState<string>(
    initialConfig?.schedulingConfig?.breakEndTime ||
    initialConfig?.scheduling?.breakEndTime ||
    '13:00'
  );

  // 6. Localização
  const [locationText, setLocationText] = useState<string>(
    initialConfig?.locationText || 'São Paulo, SP'
  );

  // Produtos já existentes preservados
  const registeredItems: ProductItem[] = initialConfig?.products || [];

  // Lista dinâmica de nichos conforme o modelo selecionado
  const currentAvailableNiches = businessType === 'services' ? SERVICE_NICHES : PRODUCT_NICHES;

  // Sincroniza nome da loja com perfil conectado se estiver vazio
  useEffect(() => {
    async function fetchConnectedProfile() {
      if (!storeName) {
        try {
          const res = await fetch('/api/auth/instagram/status');
          const data = await res.json();
          if (data?.connected && data?.account) {
            const profileName = data.account.name || data.account.username || 'Minha Loja';
            setStoreName(profileName);
            const autoSlug = profileName
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            setCatalogSlug(autoSlug);
          }
        } catch { }
      }
    }
    fetchConnectedProfile();
  }, []);

  // Quando alterna o tipo (Produtos vs Serviços), ajusta nichos sugeridos automaticamente
  const handleSelectBusinessType = (type: 'products' | 'services') => {
    setBusinessType(type);

    const targetList = type === 'services' ? SERVICE_NICHES : PRODUCT_NICHES;
    const filtered = selectedNiches.filter((n) => targetList.includes(n));
    if (filtered.length > 0) {
      setSelectedNiches(filtered);
    } else {
      const defaultNiche = type === 'services' ? 'Barbearia & Barba' : 'Roupas & Moda';
      setSelectedNiches([defaultNiche]);
    }
  };

  // Sincroniza número pessoal e alerta quando "mesmo número" estiver ativo
  useEffect(() => {
    if (sameWhatsapp) {
      setWhatsappPersonal(whatsappProfessional);
      setAlertRecipient('professional');
    }
  }, [sameWhatsapp, whatsappProfessional]);

  // Atualiza slug conforme o nome muda (se não editado manualmente)
  const handleStoreNameChange = (val: string) => {
    setStoreName(val);
    const generated = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    setCatalogSlug(generated);
    setSlugStatus({ checked: false, available: true });
  };

  // Verificação de disponibilidade de Slug
  const verifySlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck.trim()) return;
    setIsCheckingSlug(true);
    try {
      const res = await fetch(
        `/api/catalog/validate-slug?slug=${encodeURIComponent(slugToCheck)}&name=${encodeURIComponent(storeName)}`
      );
      const data = await res.json();
      if (data.isSlugDuplicate || data.isNameDuplicate) {
        setSlugStatus({
          checked: true,
          available: false,
          suggestion: data.suggestedSlug || data.cleanSlug,
        });
      } else {
        setSlugStatus({
          checked: true,
          available: true,
        });
      }
    } catch {
      setSlugStatus({ checked: true, available: true });
    } finally {
      setIsCheckingSlug(false);
    }
  };

  // Gerenciamento de Nichos (Máximo 5)
  const toggleNiche = (niche: string) => {
    if (selectedNiches.includes(niche)) {
      if (selectedNiches.length > 1) {
        setSelectedNiches(selectedNiches.filter((n) => n !== niche));
      }
    } else {
      if (selectedNiches.length >= 5) return;
      setSelectedNiches([...selectedNiches, niche]);
    }
  };

  const handleAddCustomNiche = () => {
    const trimmed = customNicheInput.trim();
    if (!trimmed) return;
    if (selectedNiches.length >= 5) return;
    if (!selectedNiches.includes(trimmed)) {
      setSelectedNiches([...selectedNiches, trimmed]);
    }
    setCustomNicheInput('');
  };

  // Gerenciamento de Dias da Semana
  const toggleWorkingDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const setWorkingDaysPreset = (preset: 'weekdays' | 'mon_sat' | 'all') => {
    if (preset === 'weekdays') {
      setWorkingDays(['Seg', 'Ter', 'Qua', 'Qui', 'Sex']);
    } else if (preset === 'mon_sat') {
      setWorkingDays(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    } else if (preset === 'all') {
      setWorkingDays(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
    }
  };

  // Finalizar Cadastro Inicial e Salvar
  const handleCompleteOnboarding = (destination: 'products' | 'dashboard' = 'products') => {
    const baseTemplate = TEMPLATES[0];
    const finalSlug = (catalogSlug || storeName || 'minha-vitrine')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const cleanProf = whatsappProfessional.replace(/\D/g, '');
    const cleanPers = whatsappPersonal.replace(/\D/g, '');
    const effectiveWhatsapp = (sameWhatsapp ? cleanProf : cleanProf || cleanPers) || '5511999999999';

    const computedHours = formatBusinessHoursString(
      workingDays,
      openTime,
      closeTime,
      hasBreak,
      breakStartTime,
      breakEndTime
    );

    const updatedSchedulingConfig: SchedulingConfig = {
      ...(initialConfig?.schedulingConfig || initialConfig?.scheduling || { enabled: true }),
      enabled: true,
      openTime,
      closeTime,
      hasBreak,
      breakStartTime: hasBreak ? breakStartTime : undefined,
      breakEndTime: hasBreak ? breakEndTime : undefined,
      workingDays,
      businessHours: computedHours,
    };

    const finalConfig: CatalogConfig = {
      ...(initialConfig || baseTemplate.config),
      storeName: storeName.trim() || 'Minha Loja',
      slug: finalSlug,
      templateChosen: true,
      businessType,
      niches: selectedNiches,
      whatsapp: effectiveWhatsapp,
      whatsappProfessional: cleanProf,
      whatsappPersonal: cleanPers,
      sameWhatsapp,
      alertRecipientNumber: alertRecipient,
      locationText: locationText.trim() || 'São Paulo, SP',
      schedulingConfig: updatedSchedulingConfig,
      scheduling: updatedSchedulingConfig,
      products: registeredItems,
    };

    onFinish(finalConfig, destination);
  };

  const totalSteps = 3;

  return (
    <div
      className={`${isModal
        ? 'fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto'
        : 'min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8'
        }`}
    >
      <div className="max-w-4xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-slate-300/40 text-slate-900 flex flex-col justify-between min-h-[580px] my-auto">
        {/* Header e Barra de Progresso */}
        <div className="w-full space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 tracking-tight">
                  Assistente de Configuração Vitryne
                </h3>
                <p className="text-xs text-slate-500">
                  Configure sua vitrine para vender no Instagram e WhatsApp em poucos minutos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-lg">
                Etapa {currentStep} de {totalSteps}
              </span>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  title="Fechar assistente"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* ===================================================================
            PASSO 1: MODELO & NICHOS DEDICADOS (PRODUTOS VS SERVIÇOS)
        ==================================================================== */}
        {currentStep === 1 && (
          <div className="py-6 space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Qual é o modelo e o nicho do seu negócio?
              </h2>
              <p className="text-sm text-slate-500">
                Escolha se você vende produtos físicos ou presta serviços. A lista de nichos se adapta automaticamente.
              </p>
            </div>

            {/* Toggle Tipo: Produtos Físicos vs Serviços */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                onClick={() => handleSelectBusinessType('products')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${businessType === 'products'
                  ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${businessType === 'products'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Produtos Físicos (Vendas)</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Roupas, calçados, joias, eletrônicos, doces, cosméticos e itens de pronta entrega ou envio.
                  </p>
                </div>
              </div>

              <div
                onClick={() => handleSelectBusinessType('services')}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${businessType === 'services'
                  ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/20'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${businessType === 'services'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-600'
                    }`}
                >
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">Serviços & Procedimentos</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Barbearias, salões, estética, unhas, lavagem automotiva, aulas e agendamentos.
                  </p>
                </div>
              </div>
            </div>

            {/* Seleção de Nichos Dedicados */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  {businessType === 'products'
                    ? 'Nichos de vendas de produtos (escolha até 5):'
                    : 'Nichos de prestação de serviços (escolha até 5):'}
                </span>
                <span
                  className={`font-mono font-bold px-2 py-0.5 rounded-md ${selectedNiches.length >= 5
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-indigo-50 text-indigo-700'
                    }`}
                >
                  {selectedNiches.length} de 5 selecionados
                </span>
              </div>

              {/* Nichos Atualmente Selecionados */}
              {selectedNiches.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center pr-1">Selecionados:</span>
                  {selectedNiches.map((niche) => (
                    <span
                      key={niche}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold shadow-xs"
                    >
                      {niche}
                      <button
                        type="button"
                        onClick={() => toggleNiche(niche)}
                        className="hover:text-indigo-200 ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Nuvem de Opções de Nicho */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1 border border-slate-100 rounded-xl">
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
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 disabled:opacity-40'
                        }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-indigo-700" />}
                      <span>{niche}</span>
                    </button>
                  );
                })}
              </div>

              {/* Adicionar Nicho Customizado */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Não encontrou seu nicho? Digite abaixo para cadastrar:
                </label>
                <div className="flex gap-2">
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
                    placeholder="Ex: Acessórios Automotivos, Moda Praia, etc."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomNiche}
                    disabled={selectedNiches.length >= 5 || !customNicheInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors disabled:opacity-40 flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>
                {selectedNiches.length >= 5 && (
                  <p className="text-[11px] text-amber-600 font-semibold mt-1.5">
                    Limite de 5 nichos atingido. Remova um para adicionar outro.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASSO 2: DADOS DO NEGÓCIO (NOME, LINK, TELEFONES, HORÁRIOS & DIAS)
        ==================================================================== */}
        {currentStep === 2 && (
          <div className="py-5 space-y-6 animate-in fade-in duration-200 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Dados do seu Negócio
              </h2>
              <p className="text-sm text-slate-500">
                Configure as informações essenciais da sua vitrine: nome, link, telefones e horário de funcionamento.
              </p>
            </div>

            {/* 1. Identidade da Loja & Link */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Store className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Identidade da Vitrine</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Nome da Loja ou Negócio *
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => handleStoreNameChange(e.target.value)}
                    onBlur={() => verifySlugAvailability(catalogSlug)}
                    placeholder="Ex: Studio Bella, Closet Fashion, Prime Tech"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cidade / Localização</span>
                  </label>
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="Ex: São Paulo, SP • Envio para todo o Brasil"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-semibold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Link Exclusivo com Prévia e Validação */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Link exclusivo para divulgar:</span>
                  <button
                    type="button"
                    onClick={() => verifySlugAvailability(catalogSlug)}
                    disabled={isCheckingSlug || !catalogSlug}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    {isCheckingSlug ? 'Verificando...' : 'Verificar disponibilidade'}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white border border-slate-300 font-mono text-xs sm:text-sm text-slate-900">
                  <span className="text-slate-400 shrink-0">vitryne.com.br/c/</span>
                  <input
                    type="text"
                    value={catalogSlug}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                      setCatalogSlug(clean);
                      setSlugStatus({ checked: false, available: true });
                    }}
                    onBlur={() => verifySlugAvailability(catalogSlug)}
                    className="flex-1 bg-transparent text-slate-900 font-bold focus:outline-none"
                  />
                </div>

                {slugStatus.checked && (
                  <div>
                    {slugStatus.available ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Link vitryne.com.br/c/{catalogSlug} disponível!</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Link em uso.</span>
                        </div>
                        {slugStatus.suggestion && (
                          <button
                            type="button"
                            onClick={() => {
                              setCatalogSlug(slugStatus.suggestion!);
                              setSlugStatus({ checked: true, available: true });
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[11px] hover:bg-amber-600"
                          >
                            Usar "{slugStatus.suggestion}"
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Telefones de WhatsApp & Roteamento */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Telefones de WhatsApp & Contato</h3>
              </div>

              {/* WhatsApp Comercial da Loja */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>WhatsApp Comercial da Loja (Clientes) *</span>
                </label>
                <input
                  type="tel"
                  value={whatsappProfessional}
                  onChange={(e) => setWhatsappProfessional(formatPhoneNumber(e.target.value))}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-emerald-600 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Esse é o número para quando o cliente entrar em contato com a loja para tirar dúvidas ou finalizar pedidos.
                </p>
              </div>

              {/* Checkbox Mesmo Número */}
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={sameWhatsapp}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSameWhatsapp(checked);
                    if (checked) {
                      setWhatsappPersonal(whatsappProfessional);
                      setAlertRecipient('professional');
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Usar o mesmo número para o WhatsApp comercial e o WhatsApp pessoal
                </span>
              </label>

              {/* WhatsApp Pessoal (Se desmarcado) */}
              {!sameWhatsapp && (
                <div className="space-y-3 pt-1 animate-in fade-in">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-indigo-600" />
                      <span>WhatsApp Pessoal do Responsável / Empreendedor</span>
                    </label>
                    <input
                      type="tel"
                      value={whatsappPersonal}
                      onChange={(e) => setWhatsappPersonal(formatPhoneNumber(e.target.value))}
                      placeholder="Ex: (11) 91234-5678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  {/* Roteamento de Alertas */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Onde você deseja receber avisos e solicitações da nossa parte?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAlertRecipient('professional')}
                        className={`p-3 rounded-xl border text-left transition-all ${alertRecipient === 'professional'
                          ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <div className="text-xs font-bold text-slate-900">No Comercial</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">WhatsApp da loja</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAlertRecipient('personal')}
                        className={`p-3 rounded-xl border text-left transition-all ${alertRecipient === 'personal'
                          ? 'border-indigo-600 bg-indigo-50/70 text-slate-900 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <div className="text-xs font-bold text-slate-900">No Pessoal</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Seu número particular</div>
                      </button>


                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dias e Horários de Funcionamento com Pausa */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Clock className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Dias e Horários de Funcionamento</h3>
              </div>

              {/* Dias de Funcionamento */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Dias de Atendimento:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setWorkingDaysPreset('weekdays')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      Seg a Sex
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkingDaysPreset('mon_sat')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      Seg a Sáb
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkingDaysPreset('all')}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold"
                    >
                      Todos
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const isSelected = workingDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleWorkingDay(day.id)}
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

              {/* Horário de Abertura e Fechamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Horário de Abertura
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Horário de Fechamento
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Pausa / Intervalo de Almoço */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBreak}
                    onChange={(e) => setHasBreak(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Coffee className="w-3.5 h-3.5 text-amber-700" />
                    <span>Possui pausa / intervalo de almoço durante o dia?</span>
                  </span>
                </label>

                {hasBreak && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Início da Pausa (Almoço)
                      </label>
                      <input
                        type="time"
                        value={breakStartTime}
                        onChange={(e) => setBreakStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-600">
                        Fim da Pausa (Retorno)
                      </label>
                      <input
                        type="time"
                        value={breakEndTime}
                        onChange={(e) => setBreakEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Prévia do Expediente */}
              <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200/80 text-xs text-purple-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-700 shrink-0" />
                <div>
                  <span className="font-bold text-purple-900">Expediente configurado: </span>
                  <span className="font-semibold text-purple-800">
                    {formatBusinessHoursString(workingDays, openTime, closeTime, hasBreak, breakStartTime, breakEndTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            PASSO 3: ESCOLHA DE CONTINUAÇÃO (PREENCHER CATÁLOGO OU FINALIZAR)
        ==================================================================== */}
        {currentStep === 3 && (
          <div className="py-6 space-y-7 animate-in fade-in duration-200">
            <div className="space-y-1 text-center max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 border border-indigo-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Dados essenciais configurados!
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Sua vitrine está pronta. Escolha agora como prefere prosseguir:
              </p>
            </div>

            {/* As duas opções claras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
              {/* Opção 1: Preencher Catálogo Agora (Ação Principal) */}
              <div
                onClick={() => handleCompleteOnboarding('products')}
                className="p-6 rounded-2xl border-2 border-indigo-600 bg-indigo-50/50 hover:bg-indigo-50/80 cursor-pointer transition-all flex flex-col justify-between group shadow-md hover:shadow-lg ring-2 ring-indigo-500/10"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="inline-block px-2 py-0.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700 rounded-md">
                      Recomendado
                    </div>
                    <h3 className="font-heading font-black text-slate-900 text-base">
                      Preencher Catálogo Agora
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Leva você direto para a página completa de itens para cadastrar fotos, valores, tamanhos e destaques do seu catálogo.
                    </p>
                  </div>
                </div>

                <div className="pt-5">
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteOnboarding('products');
                    }}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold text-xs shadow-md shadow-indigo-600/20"
                  >
                    Ir para Gerenciador de Itens
                  </Button>
                </div>
              </div>

              {/* Opção 2: Finalizar Cadastro Inicial */}
              <div
                onClick={() => handleCompleteOnboarding('dashboard')}
                className="p-6 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 cursor-pointer transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-slate-900 text-base">
                      Finalizar Cadastro Inicial
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Conclui o assistente agora e salva suas configurações. Você pode adicionar produtos e serviços com calma depois.
                    </p>
                  </div>
                </div>

                <div className="pt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCompleteOnboarding('dashboard');
                    }}
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs"
                  >
                    Concluir e Ir para o Painel
                  </Button>
                </div>
              </div>
            </div>

            {/* Resumo Rápido dos Dados */}
            <div className="max-w-xl mx-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Loja:</span>
                <span className="font-bold text-slate-900">{storeName || 'Minha Loja'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Link exclusivo:</span>
                <span className="font-mono font-bold text-indigo-700">vitryne.com.br/c/{catalogSlug}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Localização:</span>
                <span className="font-semibold text-slate-800">{locationText}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>WhatsApp Comercial:</span>
                <span className="font-mono font-bold text-slate-900">{whatsappProfessional || 'Não informado'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Expediente:</span>
                <span className="font-bold text-purple-700">
                  {formatBusinessHoursString(workingDays, openTime, closeTime, hasBreak, breakStartTime, breakEndTime)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Modelo:</span>
                <span className="font-bold text-slate-900">
                  {businessType === 'products' ? 'Produtos Físicos' : 'Serviços & Procedimentos'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Nichos ({selectedNiches.length}):</span>
                <span className="font-bold text-indigo-700">{selectedNiches.join(', ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Botoes de Navegação Inferior */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setCurrentStep((currentStep - 1) as any)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="text-slate-700 border-slate-300 hover:bg-slate-100 text-xs font-bold"
            >
              Voltar
            </Button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                if (currentStep === 2) {
                  verifySlugAvailability(catalogSlug);
                }
                setCurrentStep((currentStep + 1) as any);
              }}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 text-xs shadow-md shadow-indigo-600/20"
            >
              Próxima Etapa
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => handleCompleteOnboarding('dashboard')}
                className="text-slate-700 border-slate-300 hover:bg-slate-100 text-xs font-bold"
              >
                Finalizar Cadastro Inicial
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => handleCompleteOnboarding('products')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 text-xs shadow-md shadow-indigo-600/20"
              >
                Preencher Catálogo Agora
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
