import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

const emptyForm = {
  cropName: '',
  seedType: 'Heirloom',
  category: 'Vegetables',
  farmName: '',
  farmLocation: '',
  plantingDate: '',
  harvestDate: '',
};

function AddCropBatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedBatch, setSavedBatch] = useState(null);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.cropName.trim()) {
      setError(t('farmer.cropNameRequired', { defaultValue: 'Crop name is required.' }));
      return;
    }
    setSaving(true);
    setError('');
    api
      .post('/api/farmer/batches', {
        batchCode: `FCX-${Date.now()}`,
        cropName: form.cropName.trim(),
        seedType: form.seedType,
        category: form.category,
        plantingDate: form.plantingDate || null,
        expectedHarvestDate: form.harvestDate || null,
        location: form.farmLocation.trim() || null,
      })
      .then((res) => {
        setSavedBatch(res.data);
        setForm(emptyForm);
      })
      .catch(() => setError(t('farmer.failedSaveBatch', { defaultValue: 'Failed to save batch. Please try again.' })))
      .finally(() => setSaving(false));
  };

  if (savedBatch) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.addCrop')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">{t('farmer.batchCreatedSuccess', { defaultValue: 'Batch Created Successfully!' })}</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-emerald-100 p-8 text-center space-y-4">
          <div className="text-5xl">🌱</div>
          <h3 className="text-lg font-semibold text-emerald-800">{savedBatch.cropName} — {savedBatch.batchCode}</h3>
          <p className="text-sm text-slate-600">{t('farmer.batchRecordedMessage', { defaultValue: 'Your batch has been recorded and a blockchain traceability record has been automatically generated.' })}</p>
          <div className="inline-block bg-slate-50 rounded-xl border border-slate-200 px-6 py-4 text-left text-xs space-y-1">
            <div><span className="text-slate-500">Batch Code: </span><span className="font-mono font-medium text-emerald-700">{savedBatch.batchCode}</span></div>
            <div><span className="text-slate-500">Crop: </span><span className="font-medium">{savedBatch.cropName}</span></div>
            <div><span className="text-slate-500">Category: </span><span className="font-medium">{savedBatch.category}</span></div>
            <div><span className="text-slate-500">Seed Type: </span><span className="font-medium">{savedBatch.seedType}</span></div>
            {savedBatch.plantingDate && <div><span className="text-slate-500">Planting Date: </span><span className="font-medium">{savedBatch.plantingDate}</span></div>}
            {savedBatch.expectedHarvestDate && <div><span className="text-slate-500">Expected Harvest: </span><span className="font-medium">{savedBatch.expectedHarvestDate}</span></div>}
            <div><span className="text-slate-500">Status: </span><span className="font-medium text-emerald-700">{savedBatch.status}</span></div>
          </div>
          <div className="flex gap-3 justify-center mt-2">
            <button onClick={() => setSavedBatch(null)}
              className="rounded-lg bg-emerald-600 text-white px-5 py-2 text-sm font-medium hover:bg-emerald-700">
              {t('farmer.addAnotherBatch', { defaultValue: 'Add Another Batch' })}
            </button>
            <button onClick={() => navigate('/farmer/blockchain')}
              className="rounded-lg border border-slate-200 text-slate-700 px-5 py-2 text-sm font-medium hover:bg-slate-50">
              {t('farmer.blockchainRecords')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.addCrop')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">{t('farmer.createNewCropBatch', { defaultValue: 'Create New Crop Batch' })}</h2>
          <p className="text-sm text-slate-500">{t('farmer.enterDetailedInfo', { defaultValue: 'Enter detailed information for accurate traceability.' })}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">{t('farmer.basicInfo', { defaultValue: 'Basic Info' })}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="block text-slate-600 mb-1">{t('farmer.cropName', { defaultValue: 'Crop Name' })} *</label>
                <input value={form.cropName} onChange={updateField('cropName')} required placeholder="e.g. Tomatoes"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('farmer.seedType', { defaultValue: 'Seed Type' })}</label>
                <select value={form.seedType} onChange={updateField('seedType')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Heirloom</option><option>Hybrid</option><option>Open-Pollinated</option><option>Organic</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 mb-1">{t('farmer.category', { defaultValue: 'Category' })}</label>
                <select value={form.category} onChange={updateField('category')}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>Vegetables</option><option>Fruits</option><option>Grains</option>
                  <option>Pulses</option><option>Spices</option><option>Oilseeds</option>
                </select>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">{t('farmer.farmDetails', { defaultValue: 'Farm Details' })}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-slate-600 mb-1">Farm Name</label>
                  <input value={form.farmName} onChange={updateField('farmName')} placeholder="Greenfield Farm"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Farm Location</label>
                  <input value={form.farmLocation} onChange={updateField('farmLocation')} placeholder="City, State"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 h-40 flex items-center justify-center text-xs text-slate-400">
                Map placeholder
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-3 text-sm">
            <h3 className="text-sm font-semibold text-slate-900">{t('farmer.timeline', { defaultValue: 'Timeline' })}</h3>
            <div>
              <label className="block text-slate-600 mb-1">Planting Date</label>
              <input type="date" value={form.plantingDate} onChange={updateField('plantingDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Expected Harvest Date</label>
              <input type="date" value={form.harvestDate} onChange={updateField('harvestDate')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-3 text-sm">
            <h3 className="text-sm font-semibold text-slate-900">{t('farmer.uploadEvidence', { defaultValue: 'Upload Evidence' })}</h3>
            <label className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer">
              <span>{t('farmer.uploadImages', { defaultValue: 'Upload Images' })}</span><span className="text-xs text-slate-500">{t('farmer.browse', { defaultValue: 'Browse' })}</span>
              <input type="file" accept="image/*" multiple className="hidden" />
            </label>
            <label className="w-full flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50 cursor-pointer">
              <span>{t('farmer.uploadCertifications', { defaultValue: 'Upload Certifications' })}</span><span className="text-xs text-slate-500">{t('farmer.browse', { defaultValue: 'Browse' })}</span>
              <input type="file" accept=".pdf,.jpg,.png" className="hidden" />
            </label>
          </section>

          <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4 text-sm">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t('farmer.blockchainTraceCode', { defaultValue: 'Blockchain Trace Code' })}</h3>
              <p className="text-xs text-slate-500">{t('farmer.autoGeneratedOnSave', { defaultValue: 'A unique on-chain hash is auto-generated on save.' })}</p>
            </div>
            <div className="flex items-center justify-center">
              <div className="h-36 w-36 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-[11px] text-slate-400">
                QR Code
              </div>
            </div>
            <button type="submit" disabled={saving}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60">
              {saving ? t('farmer.saving') : t('farmer.saveBatchGenerateRecord', { defaultValue: '✅ Save Batch & Generate Record' })}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}

export default AddCropBatchPage;

