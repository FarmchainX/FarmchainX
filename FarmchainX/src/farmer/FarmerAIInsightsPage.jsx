import { useTranslation } from '../hooks/useTranslation';

function InsightCard({ title, description, badge }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {badge && (
          <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-1 border border-emerald-100">
            {badge}
          </span>
        )}
      </div>
      <p className="text-slate-600 text-sm">{description}</p>
      <div className="h-28 mt-2 rounded-xl bg-gradient-to-br from-emerald-50 via-slate-50 to-amber-50 border border-dashed border-emerald-100 flex items-center justify-center text-xs text-slate-400">
        {/* Visualization placeholder */}
        Visualization placeholder
      </div>
    </div>
  );
}

function FarmerAIInsightsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.insights')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">
            {t('farmer.insights')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('farmer.aiSubtitle', { defaultValue: 'Disease prediction, yield forecast and weather impact analytics.' })}
          </p>
        </div>
        <select className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-white">
          <option>{t('farmer.thisMonth')}</option>
          <option>{t('farmer.thisSeason', { defaultValue: 'This Season' })}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightCard
          title={t('farmer.diseasePrediction', { defaultValue: 'Disease Prediction' })}
          description={t('farmer.diseasePredictionDesc', { defaultValue: 'AI models analyse humidity, temperature and leaf wetness to predict high-risk disease periods for each batch.' })}
          badge={t('farmer.lowRisk', { defaultValue: 'Low Risk' })}
        />
        <InsightCard
          title={t('farmer.yieldForecast', { defaultValue: 'Yield Forecast' })}
          description={t('farmer.yieldForecastDesc', { defaultValue: 'Forecasted yield for active batches based on historical yield, weather and soil patterns.' })}
          badge={t('farmer.vsLastSeason', { defaultValue: '+12.4% vs last season' })}
        />
        <InsightCard
          title={t('farmer.weatherImpact', { defaultValue: 'Weather Impact' })}
          description={t('farmer.weatherImpactDesc', { defaultValue: 'See how upcoming rainfall and temperature anomalies may affect crop growth stages.' })}
        />
        <InsightCard
          title={t('farmer.riskAlertsTitle', { defaultValue: 'Risk Alerts' })}
          description={t('farmer.riskAlertsDesc', { defaultValue: 'Consolidated alerts for disease risk, extreme weather and supply chain disruptions.' })}
        />
      </div>
    </div>
  );
}

export default FarmerAIInsightsPage;

