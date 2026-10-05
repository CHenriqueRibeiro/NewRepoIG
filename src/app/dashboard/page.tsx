'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Instagram, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import DemandRadarMetrics, { InstagramMediaItem } from '@/components/dashboard/DemandRadarMetrics';

export default function DashboardPage() {
  const [account, setAccount] = useState<any>(null);
  const [mediaList, setMediaList] = useState<InstagramMediaItem[]>([]);
  const [realComments, setRealComments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchRealData = async () => {
    try {
      setRefreshing(true);

      const mediaRes = await fetch('/api/instagram/media');
      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        if (mediaData.success) {
          setMediaList(mediaData.mediaList || []);
          setRealComments(mediaData.realComments || []);
          setAccount(mediaData.profile || null);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar dados reais do Instagram:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRealData();
  }, []);

  const handleUsername = account?.username || 'instagram';

  return (
    <div className="w-full space-y-6">
      {/* Top Header do Radar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
              Radar de Demanda &amp; Oportunidades
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualização de demanda, intenções de compra, leads quentes e indicadores para tomada de decisão na conta @{handleUsername}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={refreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchRealData}
          >
            Sincronizar com Instagram
          </Button>
        </div>
      </div>

      {/* Demand Radar Metrics: Executive Decision KPIs, Demand Curve Chart, Opportunity Matrix & Live Leads */}
      <DemandRadarMetrics
        mediaList={mediaList}
        account={account}
        realComments={realComments}
      />
    </div>
  );
}
