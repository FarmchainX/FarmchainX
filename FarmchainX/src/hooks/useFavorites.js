import { useEffect, useState } from 'react';

const FAVORITES_STORAGE_KEY = 'fcx_customer_favorites';
const FAVORITES_UPDATED_EVENT = 'fcx:favorites-updated';

function readFavoritesFromStorage() {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistFavorites(nextFavorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => readFavoritesFromStorage());

  const loadFavorites = () => {
    setFavorites(readFavoritesFromStorage());
  };

  useEffect(() => {
    // Keep favorites in sync across tabs and same-tab components.
    window.addEventListener('storage', loadFavorites);
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavorites);
    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavorites);
    };
  }, []);

  const addFavorite = (product) => {
    if (!product || !product.id) return false;
    
    setFavorites((prev) => {
      if (prev.some((fav) => fav.id === product.id)) {
        return prev;
      }
      const updated = [...prev, product];
      persistFavorites(updated);
      return updated;
    });
    return true;
  };

  const removeFavorite = (productId) => {
    setFavorites((prev) => {
      const updated = prev.filter((fav) => fav.id !== productId);
      persistFavorites(updated);
      return updated;
    });
  };

  const isFavorite = (productId) => {
    return favorites.some((fav) => fav.id === productId);
  };

  const toggleFavorite = (product) => {
    if (isFavorite(product.id)) {
      removeFavorite(product.id);
      return false;
    } else {
      addFavorite(product);
      return true;
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    count: favorites.length,
  };
}



