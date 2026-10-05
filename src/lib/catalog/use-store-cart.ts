'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProductItem, ShippingMethod } from './types';
import { CartItem } from '@/components/catalog/CartDrawer';

export function useStoreCart(storeSlug: string) {
  const slug = storeSlug || 'minha-loja';
  const storageKey = `vitryne_cart_${slug}`;
  const instanceId = useRef(`cart_${Math.random().toString(36).substring(2, 9)}`);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pricingMode, setPricingMode] = useState<'varejo' | 'atacado'>('varejo');
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod>('motoboy');

  // Carrega do localStorage no mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setCart(JSON.parse(saved));
      }
    } catch (err) {
      console.warn('Erro ao carregar carrinho local:', err);
    }
  }, [storageKey]);

  // Sincroniza apenas quando OUTRA aba ou componente disparar a alteração
  useEffect(() => {
    const handleCartSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ sender?: string }>;
      if (customEvent.detail && customEvent.detail.sender === instanceId.current) {
        return; // Ignora evento disparado por esta mesma instância
      }
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          setCart(JSON.parse(saved));
        }
      } catch (err) {
        console.warn('Erro ao sincronizar carrinho:', err);
      }
    };

    window.addEventListener('vitryne_cart_changed', handleCartSync);
    window.addEventListener('storage', handleCartSync);
    return () => {
      window.removeEventListener('vitryne_cart_changed', handleCartSync);
      window.removeEventListener('storage', handleCartSync);
    };
  }, [storageKey]);

  const addToCart = useCallback(
    (product: ProductItem, size?: string, color?: string, qty = 1) => {
      const safeQty = Math.max(1, qty);

      setCart((prev) => {
        const existingIdx = prev.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color
        );

        let nextCart: CartItem[];
        if (existingIdx > -1) {
          nextCart = prev.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: item.quantity + safeQty }
              : item
          );
        } else {
          nextCart = [
            ...prev,
            { product, quantity: safeQty, selectedSize: size, selectedColor: color },
          ];
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(nextCart));
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('vitryne_cart_changed', {
                  detail: { sender: instanceId.current },
                })
              );
            }
          }, 0);
        } catch (e) {
          console.warn('Erro ao salvar carrinho:', e);
        }

        return nextCart;
      });
    },
    [storageKey]
  );

  const updateQuantity = useCallback(
    (index: number, delta: number) => {
      setCart((prev) => {
        if (!prev[index]) return prev;

        const newQty = prev[index].quantity + delta;
        let nextCart: CartItem[];

        if (newQty <= 0) {
          nextCart = prev.filter((_, i) => i !== index);
        } else {
          nextCart = prev.map((item, i) =>
            i === index ? { ...item, quantity: newQty } : item
          );
        }

        try {
          localStorage.setItem(storageKey, JSON.stringify(nextCart));
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('vitryne_cart_changed', {
                  detail: { sender: instanceId.current },
                })
              );
            }
          }, 0);
        } catch (e) {
          console.warn('Erro ao atualizar quantidade:', e);
        }

        return nextCart;
      });
    },
    [storageKey]
  );

  const removeFromCart = useCallback(
    (index: number) => {
      setCart((prev) => {
        const nextCart = prev.filter((_, i) => i !== index);
        try {
          localStorage.setItem(storageKey, JSON.stringify(nextCart));
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('vitryne_cart_changed', {
                  detail: { sender: instanceId.current },
                })
              );
            }
          }, 0);
        } catch (e) {
          console.warn('Erro ao remover do carrinho:', e);
        }
        return nextCart;
      });
    },
    [storageKey]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    try {
      localStorage.setItem(storageKey, JSON.stringify([]));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vitryne_cart_changed', {
            detail: { sender: instanceId.current },
          })
        );
      }
    } catch (e) { }
  }, [storageKey]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    isCartOpen,
    setIsCartOpen,
    pricingMode,
    setPricingMode,
    selectedShipping,
    setSelectedShipping,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
  };
}
