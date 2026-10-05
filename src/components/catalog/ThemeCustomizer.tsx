'use client';

import React, { useState, useEffect } from 'react';
import { CatalogConfig, CatalogTheme, isColorDark } from '@/lib/catalog/types';
import {
  Palette,
  Type,
  LayoutGrid,
  Store,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import { TYPOGRAPHY_PRESETS, getTypographyPreset } from '@/lib/catalog/typography';

interface ThemeCustomizerProps {
  config: CatalogConfig;
  onChangeConfig: (newConfig: CatalogConfig) => void;
}

const PRESET_PALETTES = [
  {
    name: 'Boutique Dourado',
    primary: '#785936',
    background: '#FAF8F5',
    card: '#FFFFFF',
    text: '#292524',
    buttonText: '#FFFFFF',
    fontPresetId: 'boutique-playfair',
    heroCardBg: '#FAF6F0',
    heroCardText: '#1C1917',
    heroCardBorder: '#E8DCCF',
  },
  {
    name: 'Luxo Dark & Gold',
    primary: '#D4AF37',
    background: '#0F1117',
    card: '#1A1D27',
    text: '#F8FAFC',
    buttonText: '#0F1117',
    fontPresetId: 'semijoias-cormorant',
    heroCardBg: '#1A1D27',
    heroCardText: '#F8FAFC',
    heroCardBorder: '#2D3748',
  },
  {
    name: 'Fitness High Energy',
    primary: '#10B981',
    background: '#0A0E17',
    card: '#131A29',
    text: '#F8FAFC',
    buttonText: '#0A0E17',
    fontPresetId: 'fitness-oswald',
    heroCardBg: '#131A29',
    heroCardText: '#F8FAFC',
    heroCardBorder: '#1E293B',
  },
  {
    name: 'Suplementos & Black Titanium',
    primary: '#EF4444',
    background: '#09090B',
    card: '#18181B',
    text: '#FAFAFA',
    buttonText: '#FFFFFF',
    fontPresetId: 'fitness-oswald',
    heroCardBg: '#18181B',
    heroCardText: '#FAFAFA',
    heroCardBorder: '#27272A',
  },
  {
    name: 'Rosa Trendy Y2K',
    primary: '#EC4899',
    background: '#FDF4FF',
    card: '#FFFFFF',
    text: '#3B0764',
    buttonText: '#FFFFFF',
    fontPresetId: 'trendy-syne',
    heroCardBg: '#FDF2F8',
    heroCardText: '#831843',
    heroCardBorder: '#FBCFE8',
  },
  {
    name: 'Streetwear Carbon',
    primary: '#F97316',
    background: '#121214',
    card: '#1E1E24',
    text: '#FFFFFF',
    buttonText: '#000000',
    fontPresetId: 'street-space',
    heroCardBg: '#1E1E24',
    heroCardText: '#FFFFFF',
    heroCardBorder: '#27272A',
  },
  {
    name: 'Botânico Verde Sálvia',
    primary: '#15803D',
    background: '#F0FDF4',
    card: '#FFFFFF',
    text: '#14532D',
    buttonText: '#FFFFFF',
    fontPresetId: 'beauty-dmserif',
    heroCardBg: '#ECFDF5',
    heroCardText: '#064E3B',
    heroCardBorder: '#A7F3D0',
  },
  {
    name: 'Marítimo & Areia',
    primary: '#0284C7',
    background: '#FFFBEB',
    card: '#FFFFFF',
    text: '#1E293B',
    buttonText: '#FFFFFF',
    fontPresetId: 'praia-cinzel',
    heroCardBg: '#F0F9FF',
    heroCardText: '#0C4A6E',
    heroCardBorder: '#BAE6FD',
  },
  {
    name: 'Velvet Noir Bordô',
    primary: '#BE123C',
    background: '#181114',
    card: '#24161C',
    text: '#FFF1F2',
    buttonText: '#FFFFFF',
    fontPresetId: 'sensual-prata',
    heroCardBg: '#24161C',
    heroCardText: '#FFF1F2',
    heroCardBorder: '#4C1D30',
  },
  {
    name: 'Clean White Minimal',
    primary: '#0F172A',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    buttonText: '#FFFFFF',
    fontPresetId: 'clean-outfit',
    heroCardBg: '#FFFFFF',
    heroCardText: '#0F172A',
    heroCardBorder: '#E2E8F0',
  },
];

const HERO_CARD_PRESETS = [
  {
    name: 'Suplementos & Fitness Dark',
    bg: '#111827',
    text: '#FFFFFF',
    border: '#1F2937',
    description: 'Preto e grafite esportivo (ideal para suplementos e treinos)',
  },
  {
    name: 'Clean Minimalista Branco',
    bg: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    description: 'Branco puro contemporâneo e neutro',
  },
  {
    name: 'Cinza Titânio / Slate',
    bg: '#F1F5F9',
    text: '#0F172A',
    border: '#CBD5E1',
    description: 'Cinza claro refinado de alta legibilidade',
  },
  {
    name: 'Carbon Dark & Streetwear',
    bg: '#09090B',
    text: '#FAFAFA',
    border: '#27272A',
    description: 'Preto profundo moderno e urbano',
  },
  {
    name: 'Azul Noturno / Tech',
    bg: '#0B192C',
    text: '#F8FAFC',
    border: '#1E3A8A',
    description: 'Tom azul profundo para eletrônicos e tech',
  },
  {
    name: 'Verde Botânico & Saúde',
    bg: '#064E3B',
    text: '#ECFDF5',
    border: '#047857',
    description: 'Verde escuro orgânico, saúde e bem-estar',
  },
  {
    name: 'Boutique Nude Tradicional',
    bg: '#FAF6F0',
    text: '#1C1917',
    border: '#E8DCCF',
    description: 'Tom nude quente clássico de joalheria',
  },
  {
    name: 'Bordô Velvet Intenso',
    bg: '#24161C',
    text: '#FFF1F2',
    border: '#4C1D30',
    description: 'Bordô sofisticado e marcante',
  },
];

export default function ThemeCustomizer({
  config,
  onChangeConfig,
}: ThemeCustomizerProps) {
  const { theme } = config;

  const [nameValidation, setNameValidation] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    suggestion: string;
    message?: string;
  }>({ isChecking: false, isDuplicate: false, suggestion: '' });

  const [slugValidation, setSlugValidation] = useState<{
    isChecking: boolean;
    isDuplicate: boolean;
    isValid: boolean;
    suggestion: string;
    message?: string;
  }>({ isChecking: false, isDuplicate: false, isValid: false, suggestion: '' });

  // Preenchimento automático com o nome do perfil conectado se estiver genérico ("Minha Loja")
  useEffect(() => {
    async function syncProfileName() {
      if (
        !config.storeName ||
        config.storeName === 'Minha Loja' ||
        !config.slug ||
        config.slug === 'minha-loja'
      ) {
        try {
          const res = await fetch('/api/auth/instagram/status');
          const data = await res.json();
          if (data?.connected && data?.account) {
            const profileName = data.account.name || data.account.username || 'Quota';
            const baseSlug = (data.account.username || profileName)
              .toLowerCase()
              .replace(/^@/, '')
              .replace(/[^a-z0-9-_]/g, '-');

            // Valida duplicidade do slug gerado pelo perfil
            const valRes = await fetch(
              `/api/catalog/validate-slug?name=${encodeURIComponent(profileName)}&slug=${encodeURIComponent(baseSlug)}&currentSlug=${config.slug || ''}`
            );
            const valData = await valRes.json();
            const finalSlug = valData.suggestedSlug || baseSlug;
            const finalName = valData.suggestedName || profileName;

            onChangeConfig({
              ...config,
              storeName: config.storeName === 'Minha Loja' || !config.storeName ? finalName : config.storeName,
              slug: config.slug === 'minha-loja' || !config.slug ? finalSlug : config.slug,
            });
          }
        } catch (e) {
          console.warn('[ThemeCustomizer] Erro ao sincronizar nome do perfil:', e);
        }
      }
    }
    syncProfileName();
  }, []);

  const updateStoreField = (field: keyof CatalogConfig, value: any) => {
    onChangeConfig({
      ...config,
      [field]: value,
    });
  };

  const validateField = async (type: 'name' | 'slug', value: string) => {
    try {
      const targetName = type === 'name' ? value : config.storeName;
      const targetSlug = type === 'slug' ? value : config.slug;

      const res = await fetch(
        `/api/catalog/validate-slug?name=${encodeURIComponent(targetName)}&slug=${encodeURIComponent(targetSlug)}&currentSlug=${config.slug}`
      );
      const data = await res.json();

      if (type === 'name') {
        setNameValidation({
          isChecking: false,
          isDuplicate: Boolean(data.isNameDuplicate),
          suggestion: data.suggestedName || '',
          message: data.message,
        });
      }

      if (type === 'slug' || type === 'name') {
        setSlugValidation({
          isChecking: false,
          isDuplicate: Boolean(data.isSlugDuplicate),
          isValid: Boolean(data.isValid),
          suggestion: data.suggestedSlug || '',
          message: data.message,
        });
      }
    } catch (e) {
      console.warn('[Validation error]', e);
    }
  };

  const updateThemeField = (field: keyof CatalogTheme, value: any) => {
    onChangeConfig({
      ...config,
      theme: {
        ...config.theme,
        [field]: value,
      },
    });
  };

  const applyPreset = (preset: (typeof PRESET_PALETTES)[0]) => {
    onChangeConfig({
      ...config,
      theme: {
        ...config.theme,
        primaryColor: preset.primary,
        backgroundColor: preset.background,
        cardBackground: preset.card,
        textColor: preset.text,
        buttonTextColor: preset.buttonText,
        fontFamily: preset.fontPresetId,
        typographyPresetId: preset.fontPresetId,
        heroCardBackground: preset.heroCardBg,
        heroCardTextColor: preset.heroCardText,
        heroCardBorderColor: preset.heroCardBorder,
      },
    });
  };

  const handleSelectTypography = (presetId: string) => {
    onChangeConfig({
      ...config,
      theme: {
        ...config.theme,
        fontFamily: presetId,
        typographyPresetId: presetId,
      },
    });
  };

  return (
    <div className="space-y-8">
      {/* 1. Identidade da Loja */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Store className="w-4 h-4 text-indigo-600" />
          <span>Informações Principais da Loja</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome da Loja (Perfil)
            </label>
            <input
              type="text"
              value={config.storeName}
              onChange={(e) => {
                updateStoreField('storeName', e.target.value);
                if (nameValidation.isDuplicate) {
                  setNameValidation((prev) => ({ ...prev, isDuplicate: false }));
                }
              }}
              onBlur={(e) => validateField('name', e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 transition-all ${
                nameValidation.isDuplicate
                  ? 'border-amber-400 bg-amber-50/20 focus:ring-amber-500/30'
                  : 'border-slate-300 focus:ring-indigo-500/30'
              }`}
              placeholder="Ex: Nome da sua loja"
            />
            {nameValidation.isDuplicate && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Já existe outro perfil com este nome. Sugerimos <strong>{nameValidation.suggestion}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateStoreField('storeName', nameValidation.suggestion);
                    setNameValidation({ isChecking: false, isDuplicate: false, suggestion: '' });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 text-xs cursor-pointer shrink-0 transition-colors"
                >
                  Usar
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link Personalizado / Slug
            </label>
            <div
              className={`flex rounded-xl border overflow-hidden focus-within:ring-2 transition-all ${
                slugValidation.isDuplicate
                  ? 'border-amber-400 bg-amber-50/20 focus-within:ring-amber-500/30'
                  : 'border-slate-300 focus-within:ring-indigo-500/30'
              }`}
            >
              <span className="bg-slate-100 px-3 py-2.5 text-xs text-slate-500 font-mono flex items-center shrink-0">
                vitryne.com/
              </span>
              <input
                type="text"
                value={config.slug}
                onChange={(e) => {
                  updateStoreField(
                    'slug',
                    e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
                  );
                  setSlugValidation((prev) => ({ ...prev, isValid: false, isDuplicate: false }));
                }}
                onBlur={(e) => validateField('slug', e.target.value)}
                className="w-full px-2.5 py-2.5 text-sm border-0 focus:outline-hidden font-mono"
                placeholder="nome-do-perfil"
              />
            </div>
            {slugValidation.isDuplicate && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2 animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Link já em uso. Sugerimos <strong>vitryne.com/{slugValidation.suggestion}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateStoreField('slug', slugValidation.suggestion);
                    setSlugValidation({ isChecking: false, isDuplicate: false, isValid: true, suggestion: '' });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 font-bold text-amber-950 text-xs cursor-pointer shrink-0 transition-colors"
                >
                  Usar
                </button>
              </div>
            )}
            {slugValidation.isValid && !slugValidation.isDuplicate && (
              <p className="mt-1.5 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link exclusivo disponível</span>
              </p>
            )}
          </div>
        </div>

        {/* Mensagem do Topo do Catálogo */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Mensagem de Boas-Vindas (Topo do Catálogo)</span>
            </h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título Principal
            </label>
            <input
              type="text"
              value={config.heroTitle || ''}
              onChange={(e) => updateStoreField('heroTitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Ex: As peças certas para você"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subtítulo Descritivo
            </label>
            <input
              type="text"
              value={config.heroSubtitle || ''}
              onChange={(e) => updateStoreField('heroSubtitle', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500/30"
              placeholder="Ex: Escolha seus produtos e finalize seu pedido com total facilidade."
            />
          </div>
        </div>
      </div>

      {/* 2. Paletas de Cores Prontas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <span>Paletas Visuais Selecionadas</span>
          </h3>
          <span className="text-xs text-slate-500">Clique para aplicar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PRESET_PALETTES.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:shadow-xs text-left transition-all group"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: preset.primary }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: preset.background }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                  style={{ backgroundColor: preset.card }}
                />
              </div>
              <div className="font-semibold text-xs text-slate-800 group-hover:text-indigo-600 truncate">
                {preset.name}
              </div>
            </button>
          ))}
        </div>

        {/* Seletores Individuais de Cor */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Ajuste Fino de Cores
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Cor Primária / Botão
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateThemeField('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono text-slate-600">
                  {theme.primaryColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Fundo da Página
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => updateThemeField('backgroundColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono text-slate-600">
                  {theme.backgroundColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Fundo dos Cards
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.cardBackground}
                  onChange={(e) => updateThemeField('cardBackground', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono text-slate-600">
                  {theme.cardBackground}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Cor dos Textos
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.textColor}
                  onChange={(e) => updateThemeField('textColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono text-slate-600">
                  {theme.textColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Texto do Botão
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.buttonTextColor}
                  onChange={(e) => updateThemeField('buttonTextColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <span className="text-xs font-mono text-slate-600">
                  {theme.buttonTextColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Personalização do Card do Topo (Hero Banner) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Cor do Card do Topo (Banner Principal)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Alterne a cor do card superior da loja. Perfeito para lojas de suplementos, academia ou produtos masculinos que não combinam com tons claros ou rosados.
            </p>
          </div>
          {theme.heroCardBackground && (
            <button
              type="button"
              onClick={() => {
                updateThemeField('heroCardBackground', undefined);
                updateThemeField('heroCardTextColor', undefined);
                updateThemeField('heroCardBorderColor', undefined);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-800 underline self-start sm:self-auto"
            >
              Restaurar Padrão
            </button>
          )}
        </div>

        {/* Presets de Cor para o Card do Topo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Modelos de Cor para o Card do Topo (Clique para aplicar)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {HERO_CARD_PRESETS.map((preset, idx) => {
              const isCurrent = theme.heroCardBackground === preset.bg;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChangeConfig({
                      ...config,
                      theme: {
                        ...config.theme,
                        heroCardBackground: preset.bg,
                        heroCardTextColor: preset.text,
                        heroCardBorderColor: preset.border,
                      },
                    });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isCurrent
                      ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                  style={{ backgroundColor: preset.bg }}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className="font-bold text-xs truncate"
                      style={{ color: preset.text }}
                    >
                      {preset.name}
                    </span>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: preset.bg, borderColor: preset.border }}
                    />
                  </div>
                  <p
                    className="text-[10px] leading-tight line-clamp-2"
                    style={{ color: preset.text, opacity: 0.75 }}
                  >
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ajuste Fino Personalizado do Card do Topo */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Ajuste Fino Manual (Seletores de Cor)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Fundo do Card do Topo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.heroCardBackground || '#FAF6F0'}
                  onChange={(e) => updateThemeField('heroCardBackground', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={theme.heroCardBackground || '#FAF6F0'}
                  onChange={(e) => updateThemeField('heroCardBackground', e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                  placeholder="#FAF6F0"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Cor dos Textos do Topo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.heroCardTextColor || (isColorDark(theme.heroCardBackground) ? '#FFFFFF' : '#1C1917')}
                  onChange={(e) => updateThemeField('heroCardTextColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={theme.heroCardTextColor || (isColorDark(theme.heroCardBackground) ? '#FFFFFF' : '#1C1917')}
                  onChange={(e) => updateThemeField('heroCardTextColor', e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                  placeholder="#FFFFFF"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Borda do Card do Topo
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={theme.heroCardBorderColor || '#E8DCCF'}
                  onChange={(e) => updateThemeField('heroCardBorderColor', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={theme.heroCardBorderColor || '#E8DCCF'}
                  onChange={(e) => updateThemeField('heroCardBorderColor', e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono"
                  placeholder="#E8DCCF"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 10 Modelos de Tipografia por Segmento */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Type className="w-4 h-4 text-indigo-600" />
              <span>10 Modelos de Tipografia por Segmento</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha o estilo de fonte ideal para a personalidade da sua marca. Mude quando quiser em 1 clique!
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 shrink-0">
            10 Estilos Exclusivos
          </span>
        </div>

        {/* Grid dos 10 Modelos de Tipografia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TYPOGRAPHY_PRESETS.map((preset, idx) => {
            const currentPreset = getTypographyPreset(
              theme.typographyPresetId,
              theme.fontFamily
            );
            const isSelected = currentPreset.id === preset.id;

            return (
              <div
                key={preset.id}
                onClick={() => handleSelectTypography(preset.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-600/10'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                {/* Header do Card com Segmento */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md inline-block mb-1">
                      {preset.segment}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <span>{idx + 1}. {preset.name}</span>
                    </h4>
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-slate-300 shrink-0" />
                  )}
                </div>

                {/* Exemplo de Texto Renderizado na Fonte Real */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                  <div
                    className="text-base sm:text-lg text-slate-900 leading-snug"
                    style={{
                      fontFamily: preset.titleFont,
                      letterSpacing: preset.letterSpacing,
                      textTransform: preset.titleTransform,
                    }}
                  >
                    {preset.sampleText}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Fonte: {preset.titleFont.split(',')[0].replace(/"/g, '')}
                  </div>
                </div>

                {/* Descrição & Tagline */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-slate-700">
                    {preset.tagline}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Formato de Visualização dos Produtos */}
        <div className="pt-6 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
            <span>Disposição dos Produtos no Celular</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => updateThemeField('layoutStyle', 'grid-2')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                theme.layoutStyle === 'grid-2'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-semibold">Grade Dupla (2x2)</div>
              <div className="text-[10px] text-slate-500">Mais produtos na tela</div>
            </button>

            <button
              type="button"
              onClick={() => updateThemeField('layoutStyle', 'feed-1')}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-center transition-all ${
                theme.layoutStyle === 'feed-1'
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="text-sm font-semibold">Feed Grande (1x1)</div>
              <div className="text-[10px] text-slate-500">Fotos grandes estilo Instagram</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
