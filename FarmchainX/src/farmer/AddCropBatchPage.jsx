import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/client';
import LocationMapPicker from '../components/LocationMapPicker';
import { useTranslation } from '../hooks/useTranslation';

const emptyForm = {
  cropName: '',
  seedType: 'Heirloom',
  category: 'Vegetables',
  farmLocation: '',
  farmLatitude: null,
  farmLongitude: null,
  plantingDate: '',
  harvestDate: '',
};

const buildBatchCode = () => `FCX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const buildQrPayload = (batchCode) => `farmchainx:batch:${batchCode}`;

const reverseGeocodeLocation = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
    { headers: { Accept: 'application/json' } },
  );
  if (!response.ok) {
    return `Selected pin: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  }

  const data = await response.json();
  return data?.display_name || `Selected pin: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

function AddCropBatchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedBatch, setSavedBatch] = useState(null);
  const [generatedBatchCode, setGeneratedBatchCode] = useState(() => buildBatchCode());
  const [profileFarmLocation, setProfileFarmLocation] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);

  useEffect(() => {
    api.get('/api/farmer/settings')
      .then(async (res) => {
        const farmLat = res.data?.farmLatitude !== null && res.data?.farmLatitude !== undefined ? Number(res.data.farmLatitude) : null;
        const farmLng = res.data?.farmLongitude !== null && res.data?.farmLongitude !== undefined ? Number(res.data.farmLongitude) : null;
        const savedLocation = res.data?.farmLocation || '';
        let resolvedLocation = savedLocation;

        if (!savedLocation.trim() && Number.isFinite(farmLat) && Number.isFinite(farmLng)) {
          try {
            resolvedLocation = await reverseGeocodeLocation(farmLat, farmLng);
          } catch {
            resolvedLocation = `Selected pin: ${farmLat.toFixed(6)}, ${farmLng.toFixed(6)}`;
          }
        }

        setProfileFarmLocation(resolvedLocation);
        setForm((prev) => ({
          ...prev,
          farmLatitude: Number.isFinite(farmLat) ? farmLat : prev.farmLatitude,
          farmLongitude: Number.isFinite(farmLng) ? farmLng : prev.farmLongitude,
          farmLocation: resolvedLocation || prev.farmLocation,
        }));
      })
      .catch(() => {});
  }, []);

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (resolvingAddress) {
      setError(t('farmer.resolvingAddress', { defaultValue: 'Please wait for the map address to finish loading.' }));
      return;
    }
    if (!form.cropName.trim()) {
      setError(t('farmer.cropNameRequired', { defaultValue: 'Crop name is required.' }));
      return;
    }
    setSaving(true);
    setError('');
    api
      .post('/api/farmer/batches', {
        batchCode: generatedBatchCode,
        cropName: form.cropName.trim(),
        seedType: form.seedType,
        category: form.category,
        plantingDate: form.plantingDate || null,
        expectedHarvestDate: form.harvestDate || null,
        location: form.farmLocation.trim() || profileFarmLocation || null,
      })
      .then((res) => {
        setSavedBatch({
          ...res.data,
          qrPayload: buildQrPayload(res.data.batchCode),
        });
        setForm(emptyForm);
        setGeneratedBatchCode(buildBatchCode());
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
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={savedBatch.qrPayload || buildQrPayload(savedBatch.batchCode)} size={140} includeMargin />
            </div>
            <p className="text-xs text-slate-500">Scan to verify this batch in the customer portal.</p>
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
            <h3 className="text-sm font-semibold text-slate-900">{t('farmer.batchLocation', { defaultValue: 'Batch Location' })}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t('farmer.farmLocation', { defaultValue: 'Saved farm location' })}</p>
                  <p className="text-sm font-medium text-slate-800">{profileFarmLocation || t('farmer.notSet', { defaultValue: 'Not set in profile yet' })}</p>
                  <p className="text-xs text-slate-500">{t('farmer.useProfileLocation', { defaultValue: 'This batch uses your profile farm location. Use the map only if you want to pin a different spot.' })}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <LocationMapPicker
                  latitude={form.farmLatitude}
                  longitude={form.farmLongitude}
                  onChange={async (latitude, longitude) => {
                    setResolvingAddress(true);
                    setForm((prev) => ({
                      ...prev,
                      farmLatitude: latitude,
                      farmLongitude: longitude,
                    }));
                    try {
                      const resolvedAddress = await reverseGeocodeLocation(latitude, longitude);
                      setForm((prev) => ({
                        ...prev,
                        farmLocation: resolvedAddress,
                      }));
                    } catch {
                      setForm((prev) => ({
                        ...prev,
                        farmLocation: `Selected pin: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                      }));
                    } finally {
                      setResolvingAddress(false);
                      setError('');
                    }
                  }}
                  title="Pin the batch location on the map"
                  subtitle="This defaults to your saved farm profile location and can be adjusted if needed."
                  height="240px"
                />
                <div className="mt-4">
                  <label className="block text-slate-600 mb-1 text-sm">{t('farmer.batchAddress', { defaultValue: 'Batch address' })}</label>
                  <input
                    value={form.farmLocation}
                    onChange={updateField('farmLocation')}
                    placeholder="Address will fill when you place a pin"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {resolvingAddress
                      ? t('farmer.resolvingAddress', { defaultValue: 'Looking up address from map pin...' })
                      : t('farmer.addressAutofillHint', { defaultValue: 'You can still edit the address after the pin is selected.' })}
                  </p>
                </div>
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
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <QRCodeSVG value={buildQrPayload(generatedBatchCode)} size={128} includeMargin />
              </div>
            </div>
            <p className="text-[11px] text-center text-slate-500">Batch code: <span className="font-mono text-emerald-700">{generatedBatchCode}</span></p>
            <button type="submit" disabled={saving || resolvingAddress}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60">
              {saving
                ? t('farmer.saving')
                : resolvingAddress
                  ? t('farmer.resolvingAddress', { defaultValue: 'Looking up address...' })
                  : t('farmer.saveBatchGenerateRecord', { defaultValue: '✅ Save Batch & Generate Record' })}
            </button>
          </section>
        </div>
      </form>
    </div>
  );
}

export default AddCropBatchPage;

