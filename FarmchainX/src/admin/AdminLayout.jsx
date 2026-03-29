import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import ConfirmDialog from '../components/ConfirmDialog';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { to: '/admin/farmers', label: 'Farmers', icon: 'farmer' },
  { to: '/admin/customers', label: 'Customers', icon: 'customers' },
  { to: '/admin/delivery-partners', label: 'Delivery Partners', icon: 'delivery' },
  { to: '/admin/blockchain-logs', label: 'Blockchain Logs', icon: 'blockchain' },
  { to: '/admin/transactions', label: 'Transactions', icon: 'transactions' },
  { to: '/admin/disputes', label: 'Disputes', icon: 'disputes' },
  { to: '/admin/reports', label: 'Reports', icon: 'reports' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

const pageMeta = {
  '/admin': {
    eyebrow: 'Operations overview',
    title: 'Admin Control Center',
    subtitle: 'Monitor platform health, users, orders, and revenue from one place.',
  },
  '/admin/farmers': {
    eyebrow: 'Farmer management',
    title: 'Farmers',
    subtitle: 'Review farm accounts, farm details, activation status, and risk flags.',
  },
  '/admin/customers': {
    eyebrow: 'Customer management',
    title: 'Customers',
    subtitle: 'Inspect customer accounts, order history, spending activity, and moderation status.',
  },
  '/admin/delivery-partners': {
    eyebrow: 'Logistics operations',
    title: 'Delivery Partners',
    subtitle: 'Create drivers, activate or deactivate profiles, and review delivery stats.',
  },
  '/admin/blockchain-logs': {
    eyebrow: 'Traceability ledger',
    title: 'Blockchain Logs',
    subtitle: 'Inspect verified batch traces, hashes, timestamps, and blockchain status.',
  },
  '/admin/transactions': {
    eyebrow: 'Payments & refunds',
    title: 'Transactions',
    subtitle: 'Review payments, order amounts, and process admin refunds safely.',
  },
  '/admin/disputes': {
    eyebrow: 'Resolution center',
    title: 'Disputes',
    subtitle: 'Track raised cases, priorities, impacted orders, and resolution notes.',
  },
  '/admin/reports': {
    eyebrow: 'Analytics & insights',
    title: 'Reports',
    subtitle: 'Review revenue analytics, order trends, and top-performing categories.',
  },
  '/admin/notifications': {
    eyebrow: 'Broadcast center',
    title: 'Notifications',
    subtitle: 'Send announcements to farmers, customers, and delivery partners.',
  },
  '/admin/settings': {
    eyebrow: 'Admin preferences',
    title: 'Settings',
    subtitle: 'Update admin profile, password, and sign out securely.',
  },
};

function Icon({ type }) {
  if (type === 'dashboard') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 3v8h8V3zM3 21h8v-6H3z" /></svg>;
  if (type === 'farmer') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21c4.4-3 7-6.8 7-11a7 7 0 1 0-14 0c0 4.2 2.6 8 7 11Z" /><path d="M9.5 11.5c1.7.1 2.9-.4 3.8-1.7.6 1.3 1.7 2 3.2 2.2" /></svg>;
  if (type === 'customers') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="3.5" /><path d="M20 21v-2a4 4 0 0 0-3-3.9" /><path d="M16.5 3.2a3.5 3.5 0 0 1 0 6.6" /></svg>;
  if (type === 'delivery') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 4h15v11H1z" /><path d="M16 8h4l3 3v4h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
  if (type === 'blockchain') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 4H5a2 2 0 0 0-2 2v4" /><path d="M15 4h4a2 2 0 0 1 2 2v4" /><path d="M15 20h4a2 2 0 0 0 2-2v-4" /><path d="M9 20H5a2 2 0 0 1-2-2v-4" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>;
  if (type === 'transactions') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M6 10h12" /><path d="M8 14h4" /></svg>;
  if (type === 'disputes') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>;
  if (type === 'reports') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19h16" /><path d="M7 16V9" /><path d="M12 16V5" /><path d="M17 16v-3" /></svg>;
  if (type === 'notifications') return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 1 0-12 0v4l-2 3h16l-2-3z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
  return <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z" /></svg>;
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [adminName, setAdminName] = useState(localStorage.getItem('fcx_fullName') || 'Administrator');

  useEffect(() => {
    const token = localStorage.getItem('fcx_token');
    const role = localStorage.getItem('fcx_role');
    if (!token || role !== 'ADMIN') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const meta = useMemo(() => {
    return pageMeta[location.pathname] || pageMeta['/admin'];
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    localStorage.removeItem('fcx_fullName');
    setShowLogoutConfirm(false);
    navigate('/admin/login');
  };

  const initials = adminName ? adminName.charAt(0).toUpperCase() : 'A';

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[294px] shrink-0 flex-col border-r border-slate-800/70 bg-[linear-gradient(180deg,#090f1f_0%,#111936_56%,#161f44_100%)] text-slate-100 lg:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
              <img src={farmchainxLogo} alt="FarmchainX" className="h-11 w-11 rounded-2xl bg-white/10 object-cover p-1.5" />
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">FarmchainX</p>
                <p className="text-xs text-slate-300">Admin Control Room</p>
              </div>
            </div>
          </div>

          <div className="px-5 pt-5">
            <div className="rounded-[28px] border border-indigo-400/20 bg-[linear-gradient(135deg,rgba(99,102,241,0.28),rgba(76,29,149,0.18))] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-indigo-100/80">Platform governance</p>
              <p className="mt-2 text-sm leading-6 text-slate-100">Approve users, monitor orders, review disputes, and control platform notifications.</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) => `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,#6366f1_0%,#7c3aed_100%)] text-white shadow-[0_22px_40px_-25px_rgba(99,102,241,0.95)]'
                    : 'text-slate-300 hover:bg-white/6 hover:text-white'
                }`}
              >
                {({ isActive }) => (
                  <>
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${isActive ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/5 text-slate-300 group-hover:border-white/15 group-hover:bg-white/10'}`}>
                      <Icon type={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 px-5 py-5">
            <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#4338ca_100%)] text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{adminName}</p>
                <p className="text-xs text-slate-300">System Administrator</p>
              </div>
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-600">{meta.eyebrow}</p>
                <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-slate-950">{meta.title}</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-500">{meta.subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 lg:inline-flex">
                  Platform operations live
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/admin/settings')}
                  className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c3aed_0%,#4338ca_100%)] text-sm font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[140px] truncate text-sm font-semibold text-slate-900">{adminName}</span>
                    <span className="block text-[11px] text-slate-500">Admin account</span>
                  </span>
                </button>
              </div>
            </div>
          </header>

          <section className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 xl:px-8">
            <Outlet context={{ setAdminName }} />
          </section>
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout from admin portal?"
        message="You will be signed out from the admin control room and need OTP verification again to re-enter."
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </div>
  );
}

export default AdminLayout;

