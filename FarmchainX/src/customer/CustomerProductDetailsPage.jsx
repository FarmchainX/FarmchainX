import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useFavorites } from '../hooks/useFavorites';
import {
  CustomerInfoCard,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerSecondaryButton,
  CustomerSectionHeader,
  CustomerStatusBadge,
} from './CustomerUI';
import { formatInr } from '../utils/currency';

function CustomerProductDetailsPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/api/customer/products/${id}`).then((res) => setProduct(res.data)).catch(() => {});
    api.get(`/api/customer/reviews/product/${id}`).then((res) => setReviews(res.data || [])).catch(() => {});
  }, [id]);

  const aiScore = useMemo(() => {
    if (!product) return 0;
    return Math.max(82, Math.min(99, Math.round(Number(product.avgRating || 4) * 20 + 10)));
  }, [product]);

  const addToCart = () => {
    setMessage('');
    api.post('/api/customer/cart', { productId: Number(id), quantity }).then(() => {
      setMessage('Added to cart successfully.');
    }).catch(() => {
      setMessage('Unable to add this product right now.');
    });
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product);
  };

  const submitReview = (e) => {
    e.preventDefault();
    setMessage('');
    api.post('/api/customer/reviews', {
      productId: Number(id),
      rating,
      comment,
    }).then(() => {
      setComment('');
      setMessage('Review submitted successfully.');
      return api.get(`/api/customer/reviews/product/${id}`);
    }).then((res) => setReviews(res.data || [])).catch(() => {
      setMessage('You can add a review only after a completed purchase.');
    });
  };

  if (!product) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Loading product...</div>;
  }

  return (
    <CustomerPageShell
      eyebrow="Product Details"
      title={product.name}
      description="View detailed farm information, AI quality indicators, and transparent sourcing details before adding the product to your cart."
      action={<CustomerSecondaryButton to="/customer/shop">Back to shop</CustomerSecondaryButton>}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <CustomerInfoCard className="overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="relative bg-[linear-gradient(135deg,#f1fff5_0%,#fff9ef_100%)] p-5 lg:p-6">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`absolute right-8 top-8 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition ${
                  isFavorite(productId)
                    ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500'
                }`}
                title={isFavorite(productId) ? 'Remove from favorites' : 'Add to favorites'}
                aria-label={isFavorite(productId) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <span className="text-xl">{isFavorite(productId) ? '❤️' : '🤍'}</span>
              </button>
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-[420px] w-full rounded-[28px] object-cover shadow-sm" />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center rounded-[28px] bg-white text-6xl shadow-sm">🥕</div>
              )}
            </div>

            <div className="p-6 lg:p-7">
              <div className="flex flex-wrap items-center gap-2">
                <CustomerStatusBadge status="Verified" />
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">Batch {product.batchCode}</span>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">AI score {aiScore}</span>
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{product.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{product.description || 'No description available.'}</p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <CustomerMetricCard label="Price" value={formatInr(product.pricePerUnit)} accent="emerald" />
                <CustomerMetricCard label="Available" value={`${product.stockQuantity || 0} ${product.unit || ''}`.trim()} accent="emerald" />
              </div>

              <div className="mt-5 space-y-3 rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-900">Farm:</span> {product.farmName || 'N/A'}</p>
                <p><span className="font-semibold text-slate-900">Location:</span> {product.farmLocation || product.location || 'N/A'}</p>
                <p><span className="font-semibold text-slate-900">Category:</span> {product.category || 'N/A'}</p>
                <p><span className="font-semibold text-slate-900">Seed type:</span> {product.seedType || 'N/A'}</p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                  <button type="button" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))} className="h-10 w-10 rounded-xl text-lg text-slate-600 transition hover:bg-slate-50">−</button>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))} className="w-20 border-none bg-transparent text-center text-sm font-semibold text-slate-900 outline-none" />
                  <button type="button" onClick={() => setQuantity((prev) => prev + 1)} className="h-10 w-10 rounded-xl text-lg text-slate-600 transition hover:bg-slate-50">+</button>
                </div>
                <CustomerPrimaryButton type="button" onClick={addToCart}>Add to Cart</CustomerPrimaryButton>
              </div>

              {message && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${message.toLowerCase().includes('unable') || message.toLowerCase().includes('only') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </CustomerInfoCard>

        <div className="space-y-6">
          <CustomerInfoCard title="Traceability overview" subtitle="Confidence details that matter before checkout.">
            <div className="space-y-4 text-sm text-slate-600">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Blockchain verified batch</p>
                <p className="mt-1 leading-6 text-emerald-700/85">This product is linked to batch <span className="font-semibold">{product.batchCode}</span> for transparent origin verification.</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="font-semibold text-amber-800">AI quality signal</p>
                <p className="mt-1 leading-6 text-amber-700/85">A higher AI score highlights stronger visible quality indicators for confident buying.</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Farm information</p>
                <p className="mt-1 leading-6 text-emerald-700/85">{product.farmDescription || 'Farm details will appear here once added by the farmer profile.'}</p>
              </div>
            </div>
          </CustomerInfoCard>

          <CustomerInfoCard title="Quick actions" subtitle="Move faster through the customer flow.">
            <div className="grid gap-3">
              <CustomerSecondaryButton to="/customer/cart">Go to cart</CustomerSecondaryButton>
              <CustomerSecondaryButton to="/customer/scan">Verify another batch</CustomerSecondaryButton>
              <CustomerSecondaryButton to="/customer/orders">View recent orders</CustomerSecondaryButton>
            </div>
          </CustomerInfoCard>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <CustomerInfoCard>
          <CustomerSectionHeader title="Customer reviews" subtitle="Authentic buyer feedback for this product." />
          <div className="mt-5 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500">No reviews yet. Be the first verified buyer to leave feedback after delivery.</p>
            ) : reviews.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{item.customerName}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Verified customer review</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{item.rating}/5</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.comment || 'No comment added.'}</p>
              </div>
            ))}
          </div>
        </CustomerInfoCard>

        <CustomerInfoCard title="Add your review" subtitle="Available after successful completed purchase.">
          <form onSubmit={submitReview} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star</option>)}
            </select>
            <label className="block text-sm font-medium text-slate-700">Comment</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} placeholder="Tell other buyers about freshness, packaging or overall quality" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-300 focus:bg-white focus:ring-4 focus:ring-emerald-100" />
            <CustomerPrimaryButton type="submit" className="w-full">Submit review</CustomerPrimaryButton>
          </form>
        </CustomerInfoCard>
      </div>
    </CustomerPageShell>
  );
}

export default CustomerProductDetailsPage;

