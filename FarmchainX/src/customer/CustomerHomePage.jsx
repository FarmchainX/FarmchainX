import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import {
  CustomerEmptyState,
  CustomerHeroPanel,
  CustomerMetricCard,
  CustomerPageShell,
  CustomerPrimaryButton,
  CustomerProductCard,
  CustomerQuickLink,
  CustomerSectionHeader,
  CustomerSecondaryButton,
} from './CustomerUI';
import { formatInr } from '../utils/currency';

function CustomerHomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get('/api/customer/products').then((res) => {
      setProducts((res.data || []).slice(0, 6));
    }).catch(() => {});
  }, []);

  const topRated = products[0];

  return (
    <CustomerPageShell
      eyebrow="Customer Home"
      title="Premium farm shopping with trusted traceability"
      description="Browse verified produce, compare AI-backed quality indicators, and order directly from trusted farms with a modern buying experience."
    >
      <CustomerHeroPanel
        title="Fresh harvest, elegant buying experience, full transparency."
        description="Every customer touchpoint is designed around trust: quality insights, blockchain verification, fast checkout, and a delightful marketplace experience inspired by modern commerce apps."
        actions={[
          <CustomerPrimaryButton key="shop" to="/customer/shop">
            Explore shop
          </CustomerPrimaryButton>,
          <CustomerSecondaryButton key="scan" to="/customer/scan">
            Verify batch
          </CustomerSecondaryButton>,
        ]}
      >
        <div className="grid grid-cols-2 gap-3">
          <CustomerMetricCard label="Verified farms" value="120+" accent="rose" />
          <CustomerMetricCard label="Average AI score" value="94" accent="emerald" />
          <CustomerMetricCard label="Fast dispatch" value="24 hrs" accent="violet" />
          <CustomerMetricCard label="Happy buyers" value="9.2k" accent="amber" />
        </div>
      </CustomerHeroPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CustomerQuickLink to="/customer/shop" title="Shop by freshness" subtitle="Discover fruits, vegetables and staples from trusted farms in a polished product grid." />
        <CustomerQuickLink to="/customer/orders" title="Track every order" subtitle="Follow assignment, transit and delivery states from one clean dashboard." />
        <CustomerQuickLink to="/customer/profile" title="Manage checkout faster" subtitle="Save addresses, payment methods and personal details for a smoother experience." />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
        <div className="space-y-4">
          <CustomerSectionHeader
            title="Featured products"
            subtitle="Handpicked verified listings with strong quality signals and transparent farm information."
            action={<Link to="/customer/shop" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">View full catalogue</Link>}
          />

          {products.length === 0 ? (
            <CustomerEmptyState
              title="No featured products yet"
              description="Once farmers publish live inventory, curated products will appear here for customers."
              action={<CustomerSecondaryButton to="/customer/shop">Go to shop</CustomerSecondaryButton>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {products.map((product) => (
                <CustomerProductCard key={product.id} product={product} to={`/customer/shop/${product.id}`} compact />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.35)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-600">Today’s spotlight</p>
            {topRated ? (
              <>
                <p className="mt-3 text-xl font-semibold text-slate-950">{topRated.name}</p>
                <p className="mt-1 text-sm text-slate-500">{topRated.farmName || 'Trusted Farm'} • {topRated.location || 'Local produce'}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{topRated.description || 'A popular product chosen for quality, freshness and traceable sourcing.'}</p>
                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-emerald-700">{formatInr(topRated.pricePerUnit)}</p>
                    <p className="text-xs text-slate-500">per {topRated.unit}</p>
                  </div>
                  <CustomerSecondaryButton to={`/customer/shop/${topRated.id}`}>View details</CustomerSecondaryButton>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">Top-rated items will appear here after products are listed.</p>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_70px_-44px_rgba(15,23,42,0.35)]">
            <CustomerSectionHeader title="Why customers trust FarmchainX" subtitle="A commerce flow built for confidence." />
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">AI quality badges</p>
                <p className="mt-1 leading-6">Quickly compare visible quality signals across products.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Blockchain batch verification</p>
                <p className="mt-1 leading-6">Validate the origin and authenticity of listed produce.</p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Saved checkout details</p>
                <p className="mt-1 leading-6">Addresses and payment methods make repeat purchases faster.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerPageShell>
  );
}

export default CustomerHomePage;

