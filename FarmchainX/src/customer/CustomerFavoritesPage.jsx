import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import { useFavorites } from '../hooks/useFavorites';
import {
  CustomerEmptyState,
  CustomerPageShell,
  CustomerProductCard,
  CustomerSectionHeader,
  CustomerSecondaryButton,
} from './CustomerUI';

function CustomerFavoritesPage() {
  const { favorites, removeFavorite } = useFavorites();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const requestClearAllFavorites = () => {
    setShowClearConfirm(true);
  };

  const cancelClearAllFavorites = () => {
    setShowClearConfirm(false);
  };

  const confirmClearAllFavorites = () => {
    favorites.forEach((fav) => removeFavorite(fav.id));
    setShowClearConfirm(false);
  };

  return (
    <>
      <CustomerPageShell
        eyebrow="Saved Products"
        title="My Favorites"
        description="All your favorite products in one place. Save items you love and come back to them anytime."
        action={favorites.length > 0 && <CustomerSecondaryButton onClick={requestClearAllFavorites}>Clear all</CustomerSecondaryButton>}
      >
        {favorites.length === 0 ? (
          <CustomerEmptyState
            title="No favorites yet"
            description="Start adding products to your favorites by clicking the heart icon on product cards. Your saved items will appear here."
            action={<CustomerSecondaryButton to="/customer/shop">Browse products</CustomerSecondaryButton>}
          />
        ) : (
          <div>
            <CustomerSectionHeader
              title={`${favorites.length} saved product${favorites.length !== 1 ? 's' : ''}`}
              subtitle="Click on any product to view details or add to cart"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favorites.map((product) => (
                <div key={product.id} className="relative">
                  <CustomerProductCard
                    product={product}
                    to={`/customer/shop/${product.id}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeFavorite(product.id)}
                    className="absolute right-3 top-3 rounded-full bg-white p-2 shadow-md hover:bg-slate-50 transition"
                    title="Remove from favorites"
                  >
                    ❤️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CustomerPageShell>

      <ConfirmDialog
        open={showClearConfirm}
        title="Clear all favorites?"
        message="This will remove all saved products from your favorites list. You can add them again anytime from the shop."
        confirmLabel="Clear favorites"
        cancelLabel="Keep favorites"
        onCancel={cancelClearAllFavorites}
        onConfirm={confirmClearAllFavorites}
      />
    </>
  );
}

export default CustomerFavoritesPage;



