'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal,
  X,
  Play,
  Trash2,
  Copy,
  Check,
  Activity,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'OAUTH' | 'META_API' | 'WEBHOOK' | 'AI_VISION' | 'CRYPTO' | 'SYSTEM';
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: any;
}

export default function LiveConsoleDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [simulatingEvent, setSimulatingEvent] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Erro ao buscar logs:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = async () => {
    try {
      await fetch('/api/logs', { method: 'DELETE' });
      setLogs([]);
    } catch (err) {
      console.error('Erro ao limpar logs:', err);
    }
  };

  const handleCopy = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type}] [${l.level.toUpperCase()}]: ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/instagram/diagnostics', { method: 'POST' });
      const data = await res.json();
      await fetchLogs();
    } catch (err: any) {
      console.error('Erro no teste de diagnóstico:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDirectMessage = async () => {
    setSimulatingEvent(true);
    try {
      // Injeta um evento de simulação de direct e IA no log
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WEBHOOK',
          level: 'info',
          message: 'Webhook recebido da Meta: Direct Message de @cliente_vitryne',
          details: {
            sender_id: 'ig_user_992182',
            message: 'Olá! Quanto custa esse vestido do Story?',
            reply_to_story_url: 'https://cdn.instagram.com/stories/vestido-floral-midi.jpg',
          },
        }),
      });

      // Simula a IA de Visão e Catálogo processando
      setTimeout(async () => {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'AI_VISION',
            level: 'success',
            message: 'Visão Computacional: Peça identificada como "Vestido Floral Midi de Linho" (R$ 189,90) - Estoque: 4 un.',
            details: {
              intent: 'price_inquiry',
              confidence: 0.98,
              suggested_reply: 'Oi linda! Esse é o nosso Vestido Floral Midi de Linho, saindo a R$ 189,90 em até 3x sem juros! ✨ Quer o link com frete rápido?',
            },
          }),
        });

        // Simula o disparo via graph.instagram.com/v21.0/me/messages
        setTimeout(async () => {
          await fetch('/api/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'META_API',
              level: 'success',
              message: 'POST https://graph.instagram.com/v21.0/me/messages - 200 OK (285ms) - Direct entregue!',
              details: {
                recipient_id: 'ig_user_992182',
                status: 'delivered',
                cost_meta: 'R$ 0,00 (Gratuito)',
              },
            }),
          });
          await fetchLogs();
          setSimulatingEvent(false);
        }, 600);
      }, 700);
    } catch (e) {
      setSimulatingEvent(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button (sempre visível no canto inferior direito) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700/80 hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 group"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <Terminal className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
          <span>Terminal de Logs & Telemetria</span>
          <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
            {logs.length}
          </span>
        </button>
      )}

      {/* Floating Terminal Drawer */}
      {isOpen && (
        <div
          className={`fixed right-4 bottom-4 z-50 transition-all duration-300 flex flex-col rounded-2xl bg-[#090D16] border border-slate-700/80 shadow-2xl overflow-hidden font-mono ${
            isExpanded
              ? 'left-4 top-16 right-4 bottom-4'
              : 'w-[95vw] sm:w-[680px] h-[480px]'
          }`}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0D1322] border-b border-slate-800 text-xs text-slate-300 select-none">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="font-bold text-slate-100 flex items-center gap-1.5 ml-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                Vitryne Telemetry Console
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/80 text-emerald-400">
                Meta v21.0 Online
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                title="Copiar logs"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleClear}
                title="Limpar logs"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restaurar tamanho' : 'Maximizar'}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Fechar console"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-[#0a0f1d] border-b border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                isLoading={loading}
                leftIcon={<Activity className="w-3 h-3 text-emerald-400" />}
                className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              >
                Testar Graph API Real
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleSimulateDirectMessage}
                isLoading={simulatingEvent}
                leftIcon={<Sparkles className="w-3 h-3 text-indigo-400" />}
                className="h-7 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
              >
                Simular DM com Visão
              </Button>
            </div>

            <div className="text-[10px] text-slate-500">
              {logs.length} eventos registrados (sem F12)
            </div>
          </div>

          {/* Terminal Output Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs leading-relaxed select-text">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic py-8 text-center text-xs">
                Nenhum log registrado ainda. Clique em "Testar Graph API Real" para disparar uma chamada.
              </div>
            ) : (
              logs.map((log) => {
                const badgeColor =
                  log.level === 'success'
                    ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60'
                    : log.level === 'warn'
                    ? 'text-amber-400 bg-amber-950/40 border-amber-800/60'
                    : log.level === 'error'
                    ? 'text-rose-400 bg-rose-950/40 border-rose-800/60'
                    : 'text-indigo-300 bg-indigo-950/40 border-indigo-800/60';

                return (
                  <div key={log.id} className="font-mono border-b border-slate-800/40 pb-2">
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 text-[10px] mt-0.5 shrink-0 select-none">
                        {log.timestamp}
                      </span>

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${badgeColor}`}>
                        {log.type}
                      </span>

                      <span className={`flex-1 break-words ${
                        log.level === 'error' ? 'text-rose-300' : log.level === 'success' ? 'text-slate-200' : 'text-slate-300'
                      }`}>
                        {log.message}
                      </span>
                    </div>

                    {log.details && (
                      <pre className="mt-1 ml-16 p-2 rounded-lg bg-[#04070e] border border-slate-800/60 text-[10px] text-slate-400 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  );
}
