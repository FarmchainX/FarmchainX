import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  CustomerEmptyState,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerProductCard,
  CustomerSectionHeader,
} from './CustomerUI';

function CustomerShopPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (category.trim()) params.category = category.trim();
    if (location.trim()) params.location = location.trim();

    api.get('/api/customer/products', { params }).then((res) => {
      setProducts(res.data || []);
    }).catch(() => {});
  }, [search, category, location]);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set);
  }, [products]);

  const totalProducts = products.length;

  return (
    <CustomerPageShell
      eyebrow="Shop"
      title="Curated marketplace for farm-fresh products"
      description="Use clean search and location filters to explore verified batches, compare quality signals, and open product detail pages designed for confident buying."
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CustomerMetricCard label="Live products" value={totalProducts} accent="rose" />
        <CustomerMetricCard label="Categories" value={categories.length || '—'} accent="violet" />
        <CustomerMetricCard label="Search focus" value={search.trim() || 'All'} accent="emerald" />
        <CustomerMetricCard label="Location" value={location.trim() || 'Anywhere'} accent="amber" />
      </div>

      <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.35)]">
        <CustomerSectionHeader
          title="Refine your browse"
          subtitle="Search by name, narrow by category, or browse products near your preferred delivery area."
        />
        <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr_0.9fr_auto]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, crop types or farm names" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100">
            <option value="">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Filter by location" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100" />
          <button type="button" onClick={() => { setSearch(''); setCategory(''); setLocation(''); }} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700">
            Clear filters
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <CustomerSectionHeader
          title="Available products"
          subtitle={`${totalProducts} product${totalProducts === 1 ? '' : 's'} ready to explore with transparent pricing and quality indicators.`}
          action={<Link to="/customer/scan" className="text-sm font-semibold text-amber-600 hover:text-amber-700">Verify a batch instead</Link>}
        />

        {products.length === 0 ? (
          <CustomerEmptyState
            title="No products match these filters"
            description="Try clearing your filters or broadening your search to discover more products from nearby farms."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {products.map((product) => (
              <CustomerProductCard key={product.id} product={product} to={`/customer/shop/${product.id}`} />
            ))}
          </div>
        )}
      </div>
    </CustomerPageShell>
  );
}

export default CustomerShopPage;

