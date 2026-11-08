import { useState, useCallback } from 'react';
import apiClient from '../api/apiClient';
import type { CartItem } from '../types/cart';
import type { Rate, ShippingQuoteResponse } from '../types/shipping';

export const useShippingQuote = (cartItems: CartItem[]) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<Rate[]>([]);

  const fetchQuote = useCallback(async (postalCodeDestination: string) => {
    const digits = postalCodeDestination.replace(/\D/g, '');
    const cleanCP = digits.length >= 4 ? digits.slice(0, 4) : '';
    if (!cleanCP || cleanCP.length !== 4) {
      setRates([]);
      setError(null);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      setRates([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        postalCodeDestination: cleanCP,
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          variant: item.variant || (item.id.includes('-') ? item.id.split('-').slice(1).join('-') : undefined),
        })),
      };

      const response = await apiClient.post<ShippingQuoteResponse>('/shipping/quote', payload);
      setRates(response.data.rates || []);
    } catch (err: any) {
      console.error('[Shipping Hook] Error fetching quote:', err);
      const errMsg = err.response?.data?.message || 'No se pudo obtener la cotización de envío con Correo Argentino.';
      setError(errMsg);
      setRates([]);
    } finally {
      setLoading(false);
    }
  }, [cartItems]);

  const clearQuote = useCallback(() => {
    setRates([]);
    setError(null);
    setLoading(false);
  }, []);

  const homeOptions = rates.filter((r) => r.deliveredType === 'D');
  const branchOptions = rates.filter((r) => r.deliveredType === 'S');

  return {
    loading,
    error,
    rates,
    homeOptions,
    branchOptions,
    fetchQuote,
    clearQuote,
  };
};

