import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import api from '../api/client';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import ConfirmDialog from '../components/ConfirmDialog';

const navItems = [
  { to: '/delivery', label: 'Dashboard', icon: 'dashboard' },
  { to: '/delivery/available', label: 'Available Deliveries', icon: 'list' },
  { to: '/delivery/my-deliveries', label: 'My Deliveries', icon: 'truck' },
  { to: '/delivery/history', label: 'Delivery History', icon: 'history' },
  { to: '/delivery/earnings', label: 'Earnings', icon: 'wallet' },
  { to: '/delivery/notifications', label: 'Notifications', icon: 'bell' },
  { to: '/delivery/profile', label: 'Profile', icon: 'user' },
  { to: '/delivery/settings', label: 'Settings', icon: 'settings' },
];

const titleMap = {
  '/delivery': 'Dashboard',
  '/delivery/available': 'Available Deliveries',
  '/delivery/my-deliveries': 'My Deliveries',
  '/delivery/history': 'Delivery History',
  '/delivery/earnings': 'Earnings',
  '/delivery/notifications': 'Notifications',
  '/delivery/profile': 'Profile',
  '/delivery/settings': 'Settings',
};

function SidebarIcon({ type }) {
  if (type === 'dashboard') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 13h8V3H3zM13 21h8v-6h-8zM13 3v8h8V3zM3 21h8v-6H3z" /></svg>;
  if (type === 'list') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>;
  if (type === 'truck') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
  if (type === 'history') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 6.3L3 8" /><path d="M12 7v6l4 2" /></svg>;
  if (type === 'wallet') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h6" /><circle cx="16" cy="12" r="1" /></svg>;
  if (type === 'bell') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0v4l-2 3h16l-2-3z" /><path d="M10 18a2 2 0 0 0 4 0" /></svg>;
  if (type === 'user') return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>;
  return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1A1.7 1.7 0 0 0 10 3.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1z" /></svg>;
}

function DeliveryLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);
  const [name, setName] = useState(localStorage.getItem('fcx_fullName') || 'Delivery Partner');
  const [image, setImage] = useState(localStorage.getItem('fcx_delivery_profile') || '');
  const [unread, setUnread] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('fcx_token');
    const role = localStorage.getItem('fcx_role');
    if (!token || role !== 'DELIVERY_PARTNER') {
      navigate('/login');
      return;
    }

    api.get('/api/delivery/notifications')
      .then((res) => setUnread(res.data?.unread || 0))
      .catch(() => {});

    api.get('/api/delivery/profile').then((res) => {
      if (res.data?.fullName) {
        setName(res.data.fullName);
        localStorage.setItem('fcx_fullName', res.data.fullName);
      }
      if (res.data?.profileImageUrl) {
        setImage(res.data.profileImageUrl);
        localStorage.setItem('fcx_delivery_profile', res.data.profileImageUrl);
      }
    }).catch(() => {});
  }, [navigate]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!showProfileMenu) return;
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showProfileMenu]);

  useEffect(() => {
    setShowProfileMenu(false);
  }, [location.pathname]);

  const confirmLogout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const requestLogout = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

  const currentTitle = titleMap[location.pathname] || 'Delivery Portal';

  return (
    <div className="min-h-screen flex bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <aside className="w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100 flex flex-col border-r border-slate-700/70">
        <div className="px-4 py-4 border-b border-slate-700/70">
          <div className="rounded-2xl border border-slate-700 bg-slate-800/80 px-3 py-3 flex items-center gap-3">
            <img src={farmchainxLogo} alt="FarmchainX" className="h-9 w-9 rounded-full bg-slate-700 object-cover" />
            <div className="leading-tight">
              <p className="text-lg font-bold text-white">FarmchainX</p>
              <p className="text-xs text-sky-200">Delivery Ops</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/delivery'}
              className={({ isActive }) => `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? 'bg-sky-600/90 text-white shadow-[0_10px_20px_-12px_rgba(14,165,233,0.8)]' : 'text-slate-200 hover:bg-slate-700/70'
              }`}
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-white/90" />}
                  <span className="inline-flex"><SidebarIcon type={item.icon} /></span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {image ? (
              <img src={image} alt="Delivery partner" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium truncate">{name}</p>
              <p className="text-slate-300 text-[11px]">Delivery Partner</p>
            </div>
          </div>
          <button onClick={requestLogout} className="text-slate-300 hover:text-white">Logout</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10 shadow-[0_10px_20px_-18px_rgba(15,23,42,0.35)]">
          <div>
            <p className="text-[11px] text-slate-500">Delivery Partner Operations</p>
            <h1 className="text-lg font-semibold text-slate-900 leading-5">{currentTitle}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Driver View
            </div>
            <NavLink to="/delivery/notifications" className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-700" aria-label="Notifications">
              <SidebarIcon type="bell" />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />}
            </NavLink>
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
              >
                {image ? (
                  <img src={image} alt="Driver profile" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-xs font-medium text-slate-700 max-w-[110px] truncate">{name}</span>
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-11 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card z-20 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/delivery/profile');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-slate-700"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      requestLogout();
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-rose-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <section className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </section>
      </main>
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout from delivery account?"
        message="You will be signed out from this device and need to login again to continue delivery operations."
        confirmLabel="Logout"
        cancelLabel="Stay Logged In"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

export default DeliveryLayout;

