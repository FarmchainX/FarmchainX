import { useEffect, useState } from 'react';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';
import { formatInr } from '../utils/currency';

const historyRowsFallback = [
  {
    id: 'TXN10248',
    date: '22 Apr 2024',
    description: 'Order #ORD1024 - Organic Tomatoes',
    amount: '+₹850.00',
    status: 'Completed',
  },
  {
    id: 'TXN10247',
    date: '18 Apr 2024',
    description: 'Order #ORD1023 - Strawberries',
    amount: '+₹420.00',
    status: 'Completed',
  },
  {
    id: 'TXN10245',
    date: '05 Apr 2024',
    description: 'Wallet Withdrawal',
    amount: '-₹500.00',
    status: 'Processed',
  },
];


function StatusPill({ status }) {
  let classes =
    'inline-flex items-center rounded-full text-[11px] px-2 py-1 border ';
  if (status === 'Completed') {
    classes += 'bg-emerald-50 text-emerald-700 border-emerald-100';
  } else if (status === 'Processed') {
    classes += 'bg-sky-50 text-sky-700 border-sky-100';
  } else {
    classes += 'bg-amber-50 text-amber-700 border-amber-100';
  }
  return <span className={classes}>{status}</span>;
}

function SummaryIcon({ symbol, tone = 'emerald' }) {
  const toneClass =
    tone === 'amber'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-base ${toneClass}`}
      aria-hidden="true"
    >
      {symbol}
    </span>
  );
}


function FarmerPaymentsPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState(historyRowsFallback);
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  const fetchSummaryAndHistory = () => {
    api
      .get('/api/farmer/wallet/summary')
      .then((res) => setSummary(res.data))
      .catch(() => {});
    api
      .get('/api/farmer/wallet/transactions')
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setHistory(
            res.data.map((t) => ({
              id: t.id,
              date: t.createdAt,
              description: t.description,
              amount: t.type === 'CREDIT' ? `+${formatInr(t.amount)}` : `-${formatInr(t.amount)}`,
              status: t.type === 'CREDIT' ? 'Completed' : 'Processed',
            })),
          );
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchSummaryAndHistory();
  }, []);

  const totalEarnings =
    summary && summary.totalEarnings != null ? summary.totalEarnings : 3520;
  const withdrawable =
    summary && summary.withdrawableBalance != null
      ? summary.withdrawableBalance
      : 2870;
  const pending =
    summary && summary.pendingPayments != null ? summary.pendingPayments : 650;

  const handleWithdraw = () => {
    setWithdrawError('');
    setWithdrawSuccess('');
    if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
      setWithdrawError(t('farmer.enterValidAmount', { defaultValue: 'Enter a valid amount' }));
      return;
    }
    if (Number(withdrawAmount) > Number(withdrawable)) {
      setWithdrawError(t('farmer.exceedsWithdrawable', { defaultValue: 'Amount exceeds withdrawable balance' }));
      return;
    }
    setWithdrawLoading(true);
    api
      .post('/api/farmer/wallet/withdraw', {
        amount: withdrawAmount,
        description: 'Withdraw to bank',
      })
      .then(() => {
        setWithdrawSuccess(t('farmer.withdrawSuccess', { defaultValue: 'Withdrawal request successful!' }));
        setWithdrawAmount('');
        setWithdrawModal(false);
        fetchSummaryAndHistory();
      })
      .catch((err) => {
        setWithdrawError(
          err?.response?.data || t('farmer.withdrawFailed', { defaultValue: 'Withdrawal failed. Please try again.' })
        );
      })
      .finally(() => setWithdrawLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500">{t('common.dashboard')} / {t('farmer.payments')}</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-1">
            {t('farmer.paymentsWallet', { defaultValue: 'Payments & Wallet' })}
          </h2>
          <p className="text-sm text-slate-500">
            {t('farmer.manageEarnings', { defaultValue: 'Manage your earnings, balances and withdrawals.' })}
          </p>
        </div>
        <button
          className="inline-flex items-center rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
          onClick={() => setWithdrawModal(true)}
        >
          {t('farmer.withdrawToBank', { defaultValue: 'Withdraw to Bank' })}
        </button>
      </div>

      {withdrawSuccess && (
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded mb-2">
          {withdrawSuccess}
        </div>
      )}
      {withdrawError && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded mb-2">
          {withdrawError}
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-xs space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t('farmer.withdrawToBank', { defaultValue: 'Withdraw to Bank' })}</h3>
            <div>
              <label className="block text-sm mb-1">{t('farmer.amount', { defaultValue: 'Amount' })}</label>
              <input
                type="number"
                min="1"
                max={withdrawable}
                className="w-full border border-slate-200 rounded px-3 py-2"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder={`${t('farmer.max', { defaultValue: 'Max' })}: ${formatInr(withdrawable)}`}
                disabled={withdrawLoading}
              />
            </div>
            {withdrawError && (
              <div className="text-red-600 text-xs">{withdrawError}</div>
            )}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium"
                onClick={handleWithdraw}
                disabled={withdrawLoading}
              >
                {withdrawLoading ? t('farmer.processing', { defaultValue: 'Processing...' }) : t('farmer.withdraw', { defaultValue: 'Withdraw' })}
              </button>
              <button
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium"
                onClick={() => {
                  setWithdrawModal(false);
                  setWithdrawError('');
                  setWithdrawAmount('');
                }}
                disabled={withdrawLoading}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Earnings Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col gap-2 items-start">
          <div className="flex items-center gap-3 mb-2">
            <SummaryIcon symbol="₹" />
            <span className="text-xs text-slate-500">{t('farmer.totalEarnings')}</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatInr(totalEarnings)}</p>
          <p className="text-xs text-emerald-600 font-medium">{t('farmer.thisMonth')}</p>
        </div>
        {/* Withdrawable Balance Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col gap-2 items-start relative">
          <div className="flex items-center gap-3 mb-2">
            <SummaryIcon symbol="💼" />
            <span className="text-xs text-slate-500">{t('farmer.withdrawableBalance', { defaultValue: 'Withdrawable Balance' })}</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatInr(withdrawable)}</p>
          <button
            className="absolute top-5 right-5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow"
            onClick={() => setWithdrawModal(true)}
          >
            {t('farmer.withdraw', { defaultValue: 'Withdraw' })}
          </button>
        </div>
        {/* Pending Payments Card */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col gap-2 items-start">
          <div className="flex items-center gap-3 mb-2">
            <SummaryIcon symbol="⏳" tone="amber" />
            <span className="text-xs text-slate-500">{t('farmer.pendingPayments', { defaultValue: 'Pending Payments' })}</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{formatInr(pending)}</p>
          <p className="text-xs text-amber-600 font-medium">{history.length} {t('farmer.transactions', { defaultValue: 'Transactions' })}</p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="col-span-2">
          {/* ...existing code for Transaction History... */}
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 flex flex-col justify-between">
          <h4 className="text-sm font-semibold text-slate-900 mb-2">{t('farmer.monthlyEarnings', { defaultValue: 'Monthly Earnings' })}</h4>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-bold text-emerald-700">{formatInr(totalEarnings)}</span>
            <span className="text-xs text-green-600 font-medium">+12.4%</span>
          </div>
          <div className="h-20 w-full bg-gradient-to-br from-emerald-50 via-slate-50 to-emerald-100 border border-dashed border-emerald-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
            Chart placeholder
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            {t('farmer.transactionHistory', { defaultValue: 'Transaction History' })}
          </h3>
          <select className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-white">
            <option>{t('farmer.last3Months', { defaultValue: 'Last 3 Months' })}</option>
            <option>{t('farmer.last6Months', { defaultValue: 'Last 6 Months' })}</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-4 font-medium">{t('farmer.transactionId', { defaultValue: 'Transaction ID' })}</th>
                <th className="py-2 pr-4 font-medium">{t('farmer.date', { defaultValue: 'Date' })}</th>
                <th className="py-2 pr-4 font-medium">{t('farmer.description', { defaultValue: 'Description' })}</th>
                <th className="py-2 pr-4 font-medium">{t('farmer.amount', { defaultValue: 'Amount' })}</th>
                <th className="py-2 pr-4 font-medium">{t('farmer.status', { defaultValue: 'Status' })}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 text-emerald-700 font-medium">
                    {row.id}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{row.date}</td>
                  <td className="py-2 pr-4 text-slate-700">
                    {row.description}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">{row.amount}</td>
                  <td className="py-2 pr-4">
                    <StatusPill status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FarmerPaymentsPage;

