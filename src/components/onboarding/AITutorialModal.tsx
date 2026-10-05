'use client';

import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function AITutorialModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Como obter sua chave OpenAI em 3 passos"
      description="Guia prático para ativar a inteligência artificial com custo direto de fornecedor."
      maxWidth="lg"
    >
      <div className="space-y-3 my-4">
        {/* Step 1 */}
        <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            1
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">Acesse a OpenAI Platform</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Entre em platform.openai.com e faça login com sua conta Google.
            </p>
            <a
              href="https://platform.openai.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 pt-0.5"
            >
              <span>Abrir OpenAI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            2
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">Insira saldo pré-pago (US$ 5,00)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vá em <strong>Settings &gt; Billing</strong> e adicione US$ 5,00 (cerca de R$ 28,00), suficiente para centenas de atendimentos.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
            3
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-slate-900">Gere sua chave em API Keys</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clique em <em>Create new secret key</em>, copie o código gerado (<code className="text-slate-800 font-mono">sk-proj-...</code>) e cole no Vitryne.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose} variant="primary" size="md">
          Fechar
        </Button>
      </div>
    </Modal>
  );
}
