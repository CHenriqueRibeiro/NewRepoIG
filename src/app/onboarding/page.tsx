'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import EasyOnboardingWizard from '@/components/onboarding/EasyOnboardingWizard';
import { CatalogConfig } from '@/lib/catalog/types';

export default function OnboardingPage() {
  const router = useRouter();

  const handleFinish = async (completedConfig: CatalogConfig) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('vitryne_catalog_config', JSON.stringify(completedConfig));
        localStorage.setItem('vitryne_template_chosen', 'true');
      }

      await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedConfig),
      });

      router.push('/catalogo');
    } catch (e) {
      console.error('Erro ao salvar onboarding:', e);
      router.push('/catalogo');
    }
  };

  const handleCancel = () => {
    router.push('/catalogo');
  };

  return (
    <EasyOnboardingWizard
      onFinish={handleFinish}
      onCancel={handleCancel}
    />
  );
}
