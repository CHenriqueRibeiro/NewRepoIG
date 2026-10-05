'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SimulatorDrawerProps {
  onEventSent: () => void;
}

export default function SimulatorDrawer({ onEventSent }: SimulatorDrawerProps) {
  const [customComment, setCustomComment] = useState('');
  const [buyerHandle, setBuyerHandle] = useState('@cliente_vip');
  const [loading, setLoading] = useState(false);

  const sendEvent = async (commentText: string, handle = buyerHandle) => {
    setLoading(true);
    try {
      await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'new_comment',
          buyer: handle,
          comment: commentText,
        }),
      });
      onEventSent();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Simulador de Eventos (Sandbox)
          </h3>
          <p className="text-xs text-slate-500">
            Dispare interações para testar a medição de SLA e as respostas da IA
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => sendEvent('Qual o valor da calça e tem tamanho G?')}
        >
          Pergunta de Preço
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => sendEvent('Esse vestido veste 40?')}
        >
          Dúvida de Tamanho
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => sendEvent('Entrega por motoboy hoje?')}
        >
          Dúvida de Frete
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
        <div className="w-full sm:w-44 shrink-0">
          <Input
            type="text"
            placeholder="@usuario"
            value={buyerHandle}
            onChange={(e) => setBuyerHandle(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Digite uma mensagem para testar..."
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customComment) {
                sendEvent(customComment);
                setCustomComment('');
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={!customComment}
          onClick={() => {
            if (customComment) {
              sendEvent(customComment);
              setCustomComment('');
            }
          }}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}
