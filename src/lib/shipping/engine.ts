export interface ShippingOption {
  id: 'retirada' | 'motoboy' | 'pac' | 'sedex';
  title: string;
  description: string;
  priceCents: number;
  estimatedDays: string;
  available: boolean;
}

export interface ShippingCalculationParams {
  destinationCep: string;
  neighborhood?: string;
  storeSettings: {
    pickupEnabled: boolean;
    pickupAddress?: string;
    motoboyEnabled: boolean;
    motoboyFeeCents: number;
    motoboyNeighborhoods: string[];
    nationalShippingEnabled: boolean;
  };
}

export function calculateShippingOptions(params: ShippingCalculationParams): ShippingOption[] {
  const { destinationCep, neighborhood, storeSettings } = params;
  const options: ShippingOption[] = [];

  // 1. Retirada no Local (Custo R$ 0,00)
  if (storeSettings.pickupEnabled) {
    options.push({
      id: 'retirada',
      title: 'Retirada no Local',
      description: storeSettings.pickupAddress || 'Disponível para retirada no balcão da loja.',
      priceCents: 0,
      estimatedDays: 'Imediato (horário comercial)',
      available: true,
    });
  }

  // 2. Entrega Expressa por Motoboy Local
  if (storeSettings.motoboyEnabled) {
    const isNeighborhoodCovered = neighborhood
      ? storeSettings.motoboyNeighborhoods.some((b) =>
          b.toLowerCase().includes(neighborhood.toLowerCase()) || neighborhood.toLowerCase().includes(b.toLowerCase())
        )
      : true;

    options.push({
      id: 'motoboy',
      title: 'Motoboy Express (Mesmo Dia)',
      description: isNeighborhoodCovered
        ? 'Entrega rápida na sua porta até as 20h'
        : 'Bairro sob consulta de rota expressa',
      priceCents: storeSettings.motoboyFeeCents || 1500,
      estimatedDays: 'Hoje (pedidos até 16h)',
      available: isNeighborhoodCovered,
    });
  }

  // 3. Envio Nacional (Melhor Envio / Correios)
  if (storeSettings.nationalShippingEnabled && destinationCep) {
    options.push({
      id: 'sedex',
      title: 'Sedex Express',
      description: 'Envio prioritário rastreado pelos Correios',
      priceCents: 2850, // R$ 28,50
      estimatedDays: '1 a 2 dias úteis',
      available: true,
    });

    options.push({
      id: 'pac',
      title: 'PAC Econômico',
      description: 'Envio padrão com rastreamento completo',
      priceCents: 1890, // R$ 18,90
      estimatedDays: '4 a 7 dias úteis',
      available: true,
    });
  }

  return options;
}
