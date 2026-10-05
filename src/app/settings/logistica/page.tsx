'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, MapPin, Truck, Store, X, Bike, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface CityCepRule {
  id: string;
  cidade: string;
  uf: string;
  cepInicial: string;
  cepFinal: string;
  valor: number;
  prazo: string;
  ativo: boolean;
}

const INITIAL_CITY_RULES: CityCepRule[] = [
  {
    id: 'c1',
    cidade: 'São Paulo (Capital - Centro & Zona Sul)',
    uf: 'SP',
    cepInicial: '01000-000',
    cepFinal: '05999-999',
    valor: 15.0,
    prazo: 'Entrega Express (Mesmo dia até 18h)',
    ativo: true,
  },
  {
    id: 'c2',
    cidade: 'São Paulo (Zona Leste & Zona Norte)',
    uf: 'SP',
    cepInicial: '06000-000',
    cepFinal: '09999-999',
    valor: 20.0,
    prazo: 'Até 24h úteis',
    ativo: true,
  },
  {
    id: 'c3',
    cidade: 'Campinas e Região',
    uf: 'SP',
    cepInicial: '13000-000',
    cepFinal: '13139-999',
    valor: 28.0,
    prazo: '1 a 2 dias úteis',
    ativo: true,
  },
  {
    id: 'c4',
    cidade: 'Rio de Janeiro (Capital)',
    uf: 'RJ',
    cepInicial: '20000-000',
    cepFinal: '23799-999',
    valor: 32.5,
    prazo: '2 a 3 dias úteis',
    ativo: true,
  },
];

export default function LogisticsSettingsPage() {
  const [rules, setRules] = useState<CityCepRule[]>(INITIAL_CITY_RULES);
  const [pickupEnabled, setPickupEnabled] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('Rua Oscar Freire, 1024 - Cerqueira César, São Paulo - SP');
  const [nationalEnabled, setNationalEnabled] = useState(true);
  const [uberFlashEnabled, setUberFlashEnabled] = useState(true);
  const [uberFlashAddress, setUberFlashAddress] = useState('Rua Oscar Freire, 1024 - Cerqueira César, São Paulo - SP');
  const [uberFlashNotice, setUberFlashNotice] = useState('A corrida do Uber Flash / 99 Moto é solicitada e paga diretamente pelo cliente após aviso de pedido pronto.');
  const [motoboyCutoffEnabled, setMotoboyCutoffEnabled] = useState(true);
  const [motoboyCutoffTime, setMotoboyCutoffTime] = useState('14:00');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [formCidade, setFormCidade] = useState('');
  const [formUf, setFormUf] = useState('SP');
  const [formCepInicial, setFormCepInicial] = useState('');
  const [formCepFinal, setFormCepFinal] = useState('');
  const [formValor, setFormValor] = useState('15.00');
  const [formPrazo, setFormPrazo] = useState('Mesmo dia');

  const openAddModal = () => {
    setEditingId(null);
    setFormCidade('');
    setFormUf('SP');
    setFormCepInicial('');
    setFormCepFinal('');
    setFormValor('15.00');
    setFormPrazo('1 a 2 dias úteis');
    setIsModalOpen(true);
  };

  const openEditModal = (rule: CityCepRule) => {
    setEditingId(rule.id);
    setFormCidade(rule.cidade);
    setFormUf(rule.uf);
    setFormCepInicial(rule.cepInicial);
    setFormCepFinal(rule.cepFinal);
    setFormValor(rule.valor.toFixed(2));
    setFormPrazo(rule.prazo);
    setIsModalOpen(true);
  };

  const handleSaveCity = () => {
    if (!formCidade.trim() || !formCepInicial.trim()) {
      alert('Preencha o nome da cidade e o CEP inicial.');
      return;
    }

    if (editingId) {
      // Edit
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingId
            ? {
                ...r,
                cidade: formCidade,
                uf: formUf.toUpperCase(),
                cepInicial: formCepInicial,
                cepFinal: formCepFinal || formCepInicial,
                valor: parseFloat(formValor) || 0,
                prazo: formPrazo,
              }
            : r
        )
      );
    } else {
      // Add
      const newRule: CityCepRule = {
        id: `c_${Date.now()}`,
        cidade: formCidade,
        uf: formUf.toUpperCase(),
        cepInicial: formCepInicial,
        cepFinal: formCepFinal || formCepInicial,
        valor: parseFloat(formValor) || 0,
        prazo: formPrazo,
        ativo: true,
      };
      setRules((prev) => [...prev, newRule]);
    }

    setIsModalOpen(false);
    triggerSaved();
  };

  const handleDeleteRule = (id: string, name: string) => {
    if (confirm(`Tem certeza de que deseja excluir o frete para "${name}"?`)) {
      setRules((prev) => prev.filter((r) => r.id !== id));
      triggerSaved();
    }
  };

  const toggleActive = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ativo: !r.ativo } : r))
    );
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 tracking-tight">
            Logística &amp; Regras de Frete
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cadastre as cidades atendidas por faixa de CEP, valores de frete e prazos de entrega.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedFeedback && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Alterações salvas!
            </span>
          )}
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Cadastrar Nova Cidade por CEP
          </Button>
        </div>
      </div>

      {/* Main Table: Cidades Atendidas por Faixa de CEP */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-base text-slate-900">
              Cidades e Regiões de Entrega Cadastradas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O sistema calcula o frete automaticamente quando o cliente informa o CEP da entrega
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            {rules.filter((r) => r.ativo).length} ativas de {rules.length} regiões
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5">Cidade / Região</th>
                <th className="px-5 py-3.5">UF</th>
                <th className="px-5 py-3.5">Faixa de CEP Atendida</th>
                <th className="px-5 py-3.5 text-right">Taxa de Frete</th>
                <th className="px-5 py-3.5">Prazo Estimado</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">
                    Nenhuma cidade cadastrada ainda. Clique em &quot;Cadastrar Nova Cidade por CEP&quot; acima para começar.
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {rule.cidade}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {rule.uf}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 whitespace-nowrap">
                      {rule.cepInicial} até {rule.cepFinal}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      R$ {rule.valor.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                      {rule.prazo}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleActive(rule.id)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                          rule.ativo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {rule.ativo ? 'Ativo' : 'Pausado'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(rule)}
                          title="Editar cidade"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id, rule.cidade)}
                          title="Excluir cidade"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outras Modalidades de Entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Retirada na Loja */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Retirada na Loja Física</h3>
                <p className="text-xs text-slate-500">Sem cobrança de frete para o cliente</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={pickupEnabled}
                onChange={(e) => {
                  setPickupEnabled(e.target.checked);
                  triggerSaved();
                }}
                className="rounded text-slate-900 focus:ring-slate-900"
              />
              <span>Ativo</span>
            </label>
          </div>

          {pickupEnabled && (
            <Input
              label="Endereço Completo para Retirada:"
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
            />
          )}
        </div>

        {/* Envio Nacional Automático */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Envio Nacional (Correios / Transportadoras)</h3>
                <p className="text-xs text-slate-500">Cálculo dinâmico para CEPs fora da sua região</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={nationalEnabled}
                onChange={(e) => {
                  setNationalEnabled(e.target.checked);
                  triggerSaved();
                }}
                className="rounded text-slate-900 focus:ring-slate-900"
              />
              <span>Ativo</span>
            </label>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Quando o cliente digitar um CEP não cadastrado nas suas cidades diretas, o sistema calculará automaticamente o PAC ou Sedex.
          </p>
        </div>

        {/* Horário de Corte do Motoboy */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Horário de Corte do Motoboy</h3>
                <p className="text-xs text-slate-500">Entrega hoje ou próximo dia útil conforme o horário</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={motoboyCutoffEnabled}
                onChange={(e) => {
                  setMotoboyCutoffEnabled(e.target.checked);
                  triggerSaved();
                }}
                className="rounded text-indigo-600 focus:ring-indigo-600"
              />
              <span>Ativo</span>
            </label>
          </div>

          {motoboyCutoffEnabled && (
            <div className="space-y-3">
              <Input
                label="Horário Limite para Entrega no Mesmo Dia:"
                type="time"
                value={motoboyCutoffTime}
                onChange={(e) => {
                  setMotoboyCutoffTime(e.target.value);
                  triggerSaved();
                }}
              />
              <p className="text-xs text-slate-500 leading-relaxed">
                Compras finalizadas até as <strong className="text-slate-800">{motoboyCutoffTime}</strong> serão marcadas para entrega hoje. Pedidos após esse horário serão informados para o próximo dia útil.
              </p>
            </div>
          )}
        </div>

        {/* Retirada por Moto Uber / 99 Moto */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Bike className="w-4 h-4 text-amber-700" />
              <div>
                <h3 className="font-semibold text-slate-900 text-sm">Retirada por Moto Uber / 99 Moto</h3>
                <p className="text-xs text-slate-500">Cliente chama o Uber Flash / 99 no app próprio</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
              <input
                type="checkbox"
                checked={uberFlashEnabled}
                onChange={(e) => {
                  setUberFlashEnabled(e.target.checked);
                  triggerSaved();
                }}
                className="rounded text-slate-900 focus:ring-slate-900"
              />
              <span>Ativo</span>
            </label>
          </div>

          {uberFlashEnabled && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-950 block">Quem paga o Uber / 99 é o cliente:</span>
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    A corrida é solicitada e paga diretamente pelo cliente no app dele. A loja não cobra taxa de frete desta opção e apenas entrega a encomenda ao motoboy.
                  </p>
                </div>
              </div>

              <Input
                label="Endereço de Coleta para o Motorista:"
                type="text"
                value={uberFlashAddress}
                onChange={(e) => setUberFlashAddress(e.target.value)}
              />

              <Input
                label="Instrução / Orientação ao Cliente:"
                type="text"
                value={uberFlashNotice}
                onChange={(e) => setUberFlashNotice(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal: Cadastrar / Editar Cidade por CEP */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Editar Cidade / Região de Entrega' : 'Cadastrar Cidade por CEP'}
        description="Defina o nome da região, faixa de CEP e a taxa cobrada do cliente."
        maxWidth="md"
      >
        <div className="space-y-4 my-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Input
                label="Nome da Cidade / Região:"
                placeholder="Ex: Santos e Baixada Santista"
                value={formCidade}
                onChange={(e) => setFormCidade(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="UF:"
                placeholder="SP"
                maxLength={2}
                value={formUf}
                onChange={(e) => setFormUf(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="CEP Inicial:"
              placeholder="01000-000"
              value={formCepInicial}
              onChange={(e) => setFormCepInicial(e.target.value)}
            />
            <Input
              label="CEP Final:"
              placeholder="05999-999"
              value={formCepFinal}
              onChange={(e) => setFormCepFinal(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor do Frete (R$):"
              type="number"
              step="0.50"
              placeholder="15.00"
              value={formValor}
              onChange={(e) => setFormValor(e.target.value)}
            />
            <Input
              label="Prazo Estimado:"
              placeholder="Ex: Mesmo dia até 18h"
              value={formPrazo}
              onChange={(e) => setFormPrazo(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" onClick={handleSaveCity}>
            {editingId ? 'Salvar Alterações' : 'Cadastrar Cidade'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
