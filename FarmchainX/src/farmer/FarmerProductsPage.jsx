import { useEffect, useState } from 'react';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import { useTranslation } from '../hooks/useTranslation';
import { formatInr } from '../utils/currency';

function StatusPill({ status }) {
  const colors =
    status === 'SOLD_OUT' || status === 'Sold'
      ? 'bg-slate-100 text-slate-700 border-slate-200'
      : status === 'ARCHIVED'
      ? 'bg-red-50 text-red-700 border-red-100'
      : 'bg-emerald-50 text-emerald-700 border-emerald-100';
  return (
    <span
      className={`inline-flex items-center rounded-full text-[11px] px-2 py-1 border ${colors}`}
    >
      {status}
    </span>
  );
}

function ProductDetailModal({ product, onClose, onRequestDelete }) {
  if (!product) return null;

  const fields = [
    { label: 'Product Name', value: product.name },
    { label: 'Description', value: product.description || '—' },
    { label: 'Batch Code', value: product.batchCode },
    { label: 'Price per Unit', value: `${formatInr(product.pricePerUnit)} / ${product.unit}` },
    { label: 'Stock Quantity', value: `${product.stockQuantity} ${product.unit}` },
    { label: 'Status', value: <StatusPill status={product.status} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header banner */}
        <div className="h-36 bg-gradient-to-tr from-emerald-500 via-emerald-400 to-amber-300 relative overflow-hidden">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/80 hover:bg-white text-slate-600 text-sm flex items-center justify-center font-bold shadow"
          >
            ✕
          </button>
          {!product.imageUrl && (
            <div className="absolute -bottom-6 left-5 h-12 w-12 rounded-full bg-white border-2 border-emerald-500 flex items-center justify-center text-2xl shadow">
              🧺
            </div>
          )}
        </div>

        {/* Body */}
        <div className={`${product.imageUrl ? 'pt-5' : 'pt-10'} px-6 pb-6 space-y-4`}>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Product Details</p>
          </div>

          <div className="divide-y divide-slate-100">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-500 font-medium">{f.label}</span>
                <span className="text-slate-800 font-semibold text-right">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium py-2 hover:bg-slate-50 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onRequestDelete(product)}
              className="flex-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 text-sm font-medium py-2 transition"
            >
              🗑 Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FarmerProductsPage() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    batchId: '',
    pricePerUnit: '',
    unit: 'kg',
    stockQuantity: '',
    imageUrl: '',
  });
  const [batches, setBatches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  const loadProducts = () => {
    api
      .get('/api/farmer/products')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setProducts(
            res.data.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              batchCode: p.batch?.batchCode || '—',
              status: p.status || 'LISTED',
              pricePerUnit: p.pricePerUnit,
              unit: p.unit,
              stockQuantity: p.stockQuantity,
              imageUrl: p.imageUrl || '',
            })),
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadProducts();
    api
      .get('/api/farmer/batches')
      .then((res) => setBatches(res.data || []))
      .catch(() => setBatches([]));
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((prev) => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.batchId) { setError(t('farmer.selectBatchRequired', { defaultValue: 'Please select a batch.' })); return; }
    if (!form.name.trim()) { setError(t('farmer.productNameRequired', { defaultValue: 'Product name is required.' })); return; }
    setSaving(true);
    const payload = {
      batchId: Number(form.batchId),
      name: form.name.trim(),
      description: form.description.trim(),
      pricePerUnit: parseFloat(form.pricePerUnit) || 0,
      unit: form.unit || 'kg',
      stockQuantity: parseInt(form.stockQuantity, 10) || 0,
      imageUrl: form.imageUrl || null,
    };
    api
      .post('/api/farmer/products', payload)
      .then(() => {
        loadProducts();
        setForm({ name: '', description: '', batchId: '', pricePerUnit: '', unit: 'kg', stockQuantity: '', imageUrl: '' });
        setShowForm(false);
      })
      .catch(() => setError(t('farmer.failedAddProduct', { defaultValue: 'Failed to add product. Please try again.' })))
      .finally(() => setSaving(false));
  };

  const deleteProduct = (id) =>
    api.delete(`/api/farmer/products/${id}`).then(() => {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });

  const requestDeleteProduct = (product) => {
    setPendingDeleteProduct(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteProduct = () => {
    if (!pendingDeleteProduct || deletingProduct) return;
    setDeletingProduct(true);
    deleteProduct(pendingDeleteProduct.id)
      .then(() => {
        if (selectedProduct?.id === pendingDeleteProduct.id) {
          setSelectedProduct(null);
        }
        setShowDeleteConfirm(false);
        setPendingDeleteProduct(null);
      })
      .finally(() => setDeletingProduct(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.myProducts')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">{t('farmer.myProducts')}</h2>
          <p className="text-sm text-slate-500">
            {t('farmer.manageProductsSubtitle', { defaultValue: 'Manage products listed from your active crop batches.' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
        >
          + {t('farmer.listNewProduct', { defaultValue: 'List New Product' })}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4 text-sm"
        >
          <h3 className="font-semibold text-slate-900">{t('farmer.addNewProduct', { defaultValue: 'Add New Product' })}</h3>
          {error && <p className="text-red-600 text-xs bg-red-50 rounded px-3 py-2">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 mb-1">Product Name *</label>
              <input
                value={form.name}
                onChange={handleChange('name')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Batch *</label>
              <select
                value={form.batchId}
                onChange={handleChange('batchId')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchCode} — {b.cropName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Description</label>
              <input
                value={form.description}
                onChange={handleChange('description')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Price per Unit (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.pricePerUnit}
                onChange={handleChange('pricePerUnit')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Unit</label>
              <select
                value={form.unit}
                onChange={handleChange('unit')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litre">litre</option>
                <option value="piece">piece</option>
                <option value="dozen">dozen</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={handleChange('stockQuantity')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-slate-600 mb-1">Product Image</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50 px-4 py-3 transition-colors">
                  <span className="text-xl">📷</span>
                  <span className="text-slate-500 text-xs">
                    {form.imageUrl ? 'Change image' : 'Upload product image'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {form.imageUrl && (
                  <div className="relative">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="h-16 w-16 rounded-lg object-cover border border-slate-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center shadow"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-medium hover:bg-emerald-700 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Add Product'}
            </button>
          </div>
        </form>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-10 text-center text-sm text-slate-400">
          No products listed yet. Click "List New Product" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-36 w-full object-cover"
                />
              ) : (
                <div className="h-36 bg-gradient-to-tr from-emerald-100 via-emerald-50 to-amber-50 flex items-center justify-center text-4xl text-emerald-300">
                  🧺
                </div>
              )}
              <div className="p-4 space-y-2 text-sm flex-1 flex flex-col">
                <p className="text-slate-900 font-semibold">{p.name}</p>
                <p className="text-xs text-slate-500">Batch: {p.batchCode}</p>
                {p.description && <p className="text-xs text-slate-500">{p.description}</p>}
                <p className="text-xs text-slate-700 font-medium">
                  ₹{p.pricePerUnit} / {p.unit} &nbsp;·&nbsp; Stock: {p.stockQuantity}
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <StatusPill status={p.status} />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-medium">View Details →</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        requestDeleteProduct(p);
                      }}
                      className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      title="Delete product"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onRequestDelete={requestDeleteProduct}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Product?"
        message={`This will permanently remove ${pendingDeleteProduct?.name || 'this product'} from your listing.`}
        confirmLabel={deletingProduct ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        onCancel={() => {
          if (deletingProduct) return;
          setShowDeleteConfirm(false);
          setPendingDeleteProduct(null);
        }}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
}

export default FarmerProductsPage;

