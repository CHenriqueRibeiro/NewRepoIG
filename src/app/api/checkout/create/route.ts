import { NextRequest, NextResponse } from 'next/server';
import { reserveUniquePiece, enterWaitlist, getReservationHolder } from '@/lib/redis/locks';
import { asaas } from '@/lib/asaas/client';
import { calculateShippingOptions } from '@/lib/shipping/engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId = 'prod-vestido-floral-01',
      buyerHandle = '@cliente_vip',
      customerName = 'Comprador Vitryne',
      customerCpf = '123.456.789-00',
      customerPhone = '11999998888',
      itemPrice = 149.9,
      shippingType = 'motoboy',
      cep = '01310-100',
      neighborhood = 'Cerqueira César',
      joinWaitlistIfUnavailable = false,
    } = body;

    // 1. Logística: Calcular frete selecionado
    const shippingOptions = calculateShippingOptions({
      destinationCep: cep,
      neighborhood,
      storeSettings: {
        pickupEnabled: true,
        motoboyEnabled: true,
        motoboyFeeCents: 1500,
        motoboyNeighborhoods: ['Cerqueira César', 'Jardins', 'Pinheiros', 'Moema'],
        nationalShippingEnabled: true,
      },
    });

    const selectedShipping = shippingOptions.find((s) => s.id === shippingType) || shippingOptions[0];
    const shippingAmount = selectedShipping ? selectedShipping.priceCents / 100 : 0;
    const totalAmount = itemPrice + shippingAmount;

    // 2. Trava Atômica de Peça Única no Redis (Script Lua 15 minutos / 900s)
    const lockAcquired = await reserveUniquePiece(productId, buyerHandle, 900);

    if (!lockAcquired) {
      const currentHolder = await getReservationHolder(productId);
      
      // Se não conseguiu e o usuário solicitou entrar na fila
      if (joinWaitlistIfUnavailable) {
        const position = await enterWaitlist(productId, buyerHandle);
        return NextResponse.json({
          status: 'waitlist_joined',
          message: `Esta peça já está reservada por outro cliente. Você entrou na Fila de Espera FIFO na posição #${position}!`,
          waitlistPosition: position,
          currentHolder,
        }, { status: 409 });
      }

      return NextResponse.json({
        status: 'reserved_by_other',
        message: 'Esta peça única está temporariamente reservada no carrinho de outro cliente.',
        currentHolder,
        canJoinWaitlist: true,
      }, { status: 409 });
    }

    // 3. Gerar Cobrança com Split Asaas (PIX Dinâmico)
    const paymentResult = await asaas.createPixPaymentWithSplit({
      customerName,
      customerCpf,
      customerPhone,
      amount: totalAmount,
      description: `Pedido Vitryne - Peça Exclusiva (${productId})`,
      storeWalletId: 'wallet_lojista_demo',
      takeRatePercent: 2.5,
    });

    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return NextResponse.json({
      success: true,
      orderId: paymentResult.paymentId,
      productId,
      totalAmount,
      shippingAmount,
      shippingType: selectedShipping?.title,
      pixCopyPaste: paymentResult.pixCopyPaste,
      pixQrCodeBase64: paymentResult.pixQrCodeBase64,
      reservationExpiresAt,
      split: paymentResult.splitApplied,
      status: 'pending',
    });
  } catch (error: any) {
    console.error('[Checkout Create Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
