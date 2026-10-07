import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getPriceVisibility, updatePriceVisibility as apiUpdatePriceVisibility } from '../services/settingsApi';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [priceVisibility, setPriceVisibility] = useState(() => {
    try {
      const cached = localStorage.getItem('honeywell_product_price_visibility');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (typeof parsed?.priceVisibility === 'boolean') return parsed.priceVisibility;
        if (typeof parsed?.enabled === 'boolean') return parsed.enabled;
      }
    } catch {}
    return true;
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getPriceVisibility();
      if (data && typeof data.priceVisibility === 'boolean') {
        setPriceVisibility(data.priceVisibility);
      } else if (data && typeof data.enabled === 'boolean') {
        setPriceVisibility(data.enabled);
      }
    } catch (err) {
      console.warn('Failed to load price visibility setting:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const handleStorageChange = (e) => {
      if (e.key === 'honeywell_product_price_visibility' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (typeof parsed?.priceVisibility === 'boolean') setPriceVisibility(parsed.priceVisibility);
          else if (typeof parsed?.enabled === 'boolean') setPriceVisibility(parsed.enabled);
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchSettings]);

  const updateSetting = useCallback(async (enabled) => {
    try {
      setPriceVisibility(enabled);
      await apiUpdatePriceVisibility({ enabled });
      return true;
    } catch (err) {
      console.error('Failed to update price visibility setting:', err);
      return false;
    }
  }, []);

  const getProductNumericPrice = useCallback((product) => {
    if (!product) return 0;
    const val = product.sellingPrice ?? product.price ?? product.mrp ?? product.MRP;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }, []);

  const canShowPrice = useCallback((product) => {
    if (!priceVisibility) return false;
    if (!product) return priceVisibility;
    const price = getProductNumericPrice(product);
    return price > 0;
  }, [priceVisibility, getProductNumericPrice]);

  const canPurchase = useCallback((product) => {
    if (!priceVisibility) return false;
    if (!product) return false;
    const price = getProductNumericPrice(product);
    if (price <= 0) return false;
    if (product.stock !== undefined && product.stock <= 0) return false;
    if (product.inStock === false || product.stockStatus === 'OutOfStock') return false;
    return true;
  }, [priceVisibility, getProductNumericPrice]);

  const value = useMemo(() => ({
    priceVisibility,
    loading,
    refreshSettings: fetchSettings,
    updatePriceVisibility: updateSetting,
    canShowPrice,
    canPurchase,
    getProductNumericPrice
  }), [priceVisibility, loading, fetchSettings, updateSetting, canShowPrice, canPurchase, getProductNumericPrice]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    return {
      priceVisibility: true,
      loading: false,
      refreshSettings: () => {},
      updatePriceVisibility: async () => {},
      canShowPrice: () => true,
      canPurchase: () => true,
      getProductNumericPrice: () => 0,
    };
  }
  return ctx;
};
