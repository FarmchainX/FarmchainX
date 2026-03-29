import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

function FarmerHelpPage() {
  const { t } = useTranslation();
  const faqItems = [
    {
      question: t('farmer.faqAddBatch', { defaultValue: 'How do I add a new crop batch?' }),
      answer: t('farmer.faqAddBatchAns', { defaultValue: 'Go to the Add Crop Batch section, fill in the details, generate the Blockchain Trace Code, then review and submit.' }),
    },
    {
      question: t('farmer.faqWithdraw', { defaultValue: 'How do I withdraw my earnings?' }),
      answer: t('farmer.faqWithdrawAns', { defaultValue: 'Open the Payments & Wallet page and click on Withdraw to Bank. Ensure your bank details are updated in Settings.' }),
    },
  ];

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tickets, setTickets] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/api/farmer/support/tickets')
      .then((res) => setTickets(res.data || []))
      .catch(() => setTickets([]));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    api
      .post('/api/farmer/support/tickets', {
        subject: subject.trim(),
        description: description.trim(),
      })
      .then((res) => {
        setTickets((prev) => [res.data, ...prev]);
        setSubject('');
        setDescription('');
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
              <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.helpSupport')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">
                {t('farmer.helpSupport')}
          </h2>
          <p className="text-sm text-slate-500">
                {t('farmer.helpSubtitle', { defaultValue: 'Find quick answers or raise a support ticket.' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              {t('farmer.faq', { defaultValue: 'Frequently Asked Questions' })}
            </h3>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="py-3 group open:bg-emerald-50/40 rounded-lg px-2 -mx-2"
                open={item === faqItems[0]}
              >
                <summary className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-slate-900">
                    {item.question}
                  </span>
                  <span className="text-xs text-emerald-700 group-open:hidden">
                    {t('farmer.show', { defaultValue: 'Show' })}
                  </span>
                  <span className="text-xs text-emerald-700 hidden group-open:inline">
                    {t('farmer.hide', { defaultValue: 'Hide' })}
                  </span>
                </summary>
                <p className="text-sm text-slate-600 mt-2">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4 text-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('farmer.raiseSupportTicket', { defaultValue: 'Raise a Support Ticket' })}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-600 mb-1">{t('farmer.subject', { defaultValue: 'Subject' })}</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">{t('farmer.description', { defaultValue: 'Description' })}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 disabled:opacity-60"
            >
              {submitting ? t('farmer.submitting', { defaultValue: 'Submitting...' }) : t('farmer.submitTicket', { defaultValue: 'Submit Ticket' })}
            </button>
          </form>
          {tickets.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">
                {t('farmer.recentTickets', { defaultValue: 'Your recent tickets' })}
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                {tickets.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <span className="font-medium text-emerald-700">
                      #{t.id}
                    </span>
                    <span className="flex-1 mx-2 truncate">{t.subject}</span>
                    <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                      {t.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default FarmerHelpPage;

