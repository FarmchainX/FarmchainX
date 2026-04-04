import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import ConfirmDialog from '../components/ConfirmDialog';
import Chatbot from '../components/Chatbot';
import api from '../api/client';
import { useTranslation } from '../hooks/useTranslation';

const navItemDefs = [
  { to: '/farmer', labelKey: 'common.dashboard', icon: '📊' },
  { to: '/farmer/batches', labelKey: 'farmer.addCrop', icon: '🌱' },
  { to: '/farmer/products', labelKey: 'farmer.myProducts', icon: '🧺' },
  { to: '/farmer/orders', labelKey: 'farmer.orders', icon: '📦' },
  { to: '/farmer/payments', labelKey: 'farmer.payments', icon: '💰' },
  { to: '/farmer/ai', labelKey: 'farmer.insights', icon: '🤖' },
  { to: '/farmer/blockchain', labelKey: 'farmer.blockchainRecords', icon: '⛓️' },
  { to: '/farmer/help', labelKey: 'farmer.helpSupport', icon: '❓' },
  { to: '/farmer/settings', labelKey: 'common.settings', icon: '⚙️' },
];

const SEEN_NOTIFICATIONS_STORAGE_KEY = 'fcx_farmer_seen_notifications';

function readSeenNotificationIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set();
  }
}

function formatNotificationTime(value, locale = 'en-IN') {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function resolveHeaderTitle(pathname, t) {
  if (pathname.startsWith('/farmer/batches')) return t('farmer.addCrop');
  if (pathname.startsWith('/farmer/products')) return t('farmer.myProducts');
  if (pathname.startsWith('/farmer/orders')) return t('farmer.orders');
  if (pathname.startsWith('/farmer/payments')) return t('farmer.payments');
  if (pathname.startsWith('/farmer/ai')) return t('farmer.insights');
  if (pathname.startsWith('/farmer/blockchain')) return t('farmer.blockchainRecords');
  if (pathname.startsWith('/farmer/help')) return t('farmer.helpSupport');
  if (pathname.startsWith('/farmer/settings')) return t('common.settings');
  return t('farmer.dashboard');
}

function FarmerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationIds, setUnreadNotificationIds] = useState([]);
  const [displayName, setDisplayName] = useState(localStorage.getItem('fcx_fullName') || t('farmer.roleFarmer'));
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem('fcx_profileImage') || '',
  );
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const hasUnreadNotifications = unreadNotificationIds.length > 0;

  useEffect(() => {
    const token = localStorage.getItem('fcx_token');
    const role = localStorage.getItem('fcx_role');
    if (!token || role !== 'FARMER') {
      navigate('/login');
    }
    const updateProfile = () => {
      setDisplayName(localStorage.getItem('fcx_fullName') || t('farmer.roleFarmer'));
      setProfileImage(localStorage.getItem('fcx_profileImage') || '');
    };
    window.addEventListener('fcx:profile-updated', updateProfile);
    return () => window.removeEventListener('fcx:profile-updated', updateProfile);
  }, [navigate, t]);

  const navItems = navItemDefs.map((item) => ({ ...item, label: t(item.labelKey) }));
  const headerTitle = resolveHeaderTitle(location.pathname, t);
  const notificationLocale = i18n.resolvedLanguage || i18n.language || 'en-IN';

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const res = await api.get('/api/farmer/notifications');
        if (!active) return;
        const nextNotifications = Array.isArray(res.data) ? res.data : [];
        const seenIds = readSeenNotificationIds();
        setNotifications(nextNotifications);
        setUnreadNotificationIds(
          nextNotifications
            .map((notification) => String(notification.id))
            .filter((id) => !seenIds.has(id)),
        );
      } catch {
        if (!active) return;
        setNotifications([]);
        setUnreadNotificationIds([]);
      } finally {
        if (active) {
          setNotificationsLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const requestLogout = () => {
    setShowMenu(false);
    setShowNotifications(false);
    setShowLogoutConfirm(true);
  };

  const markAllNotificationsAsRead = () => {
    const seenIds = readSeenNotificationIds();
    notifications.forEach((notification) => seenIds.add(String(notification.id)));
    localStorage.setItem(
      SEEN_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(Array.from(seenIds)),
    );
    setUnreadNotificationIds([]);
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 fcx-sidebar text-emerald-50 flex flex-col">
        <div className="px-6 py-5 border-b border-emerald-800/60 flex items-center gap-3">
          <img
            src={farmchainxLogo}
            alt="Farmchainx Logo"
            className="h-9 w-9 rounded-full bg-emerald-700 object-cover"
          />
          <div className="flex flex-col justify-center leading-tight">
            <p className="text-lg font-bold text-white tracking-wide">FarmchainX</p>
            <p className="mt-0.5 text-xs text-emerald-200">{t('farmer.portal')}</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/farmer'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'text-emerald-100 hover:bg-emerald-800/70'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-emerald-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-emerald-600 overflow-hidden flex items-center justify-center text-white text-sm font-bold">
              {profileImage
                ? <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                : <span>{displayName.charAt(0).toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="font-medium">{displayName}</p>
              <p className="text-emerald-200 text-[11px]">{t('farmer.roleFarmer')}</p>
            </div>
          </div>
          <button
            onClick={requestLogout}
            className="text-emerald-200 hover:text-white"
          >
            {t('common.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-slate-50/90">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-900">
              {headerTitle}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 relative">
            <button
              type="button"
              className="hidden md:inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 text-xs font-medium"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {t('farmer.online')}
            </button>
            <button
              type="button"
              aria-label={t('farmer.notifications')}
              title={t('farmer.notifications')}
              aria-expanded={showNotifications}
              aria-controls="farmer-notifications-menu"
              onClick={() => {
                setShowNotifications((prev) => {
                  const next = !prev;
                  if (next) {
                    markAllNotificationsAsRead();
                  }
                  return next;
                });
                setShowMenu(false);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4.5 w-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
                <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
              </svg>
              {hasUnreadNotifications && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </button>
            {showNotifications && (
              <div
                id="farmer-notifications-menu"
                className="absolute right-14 top-12 w-80 bg-white border border-slate-200 rounded-2xl shadow-card overflow-hidden z-20"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t('farmer.notifications')}</p>
                    <p className="text-[11px] text-slate-500">{t('farmer.notificationsSubtitle')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-slate-400 hover:text-slate-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      {t('farmer.loadingNotifications')}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-slate-400">
                      {t('farmer.noNotifications')}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className="w-full text-left px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                              unreadNotificationIds.includes(String(notification.id))
                                ? 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                              <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatNotificationTime(notification.createdAt, notificationLocale)}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-5">{notification.message}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                  <button
                    type="button"
                    className="w-full text-center text-xs font-medium text-emerald-700 hover:text-emerald-800"
                    onClick={() => {
                      markAllNotificationsAsRead();
                      setShowNotifications(false);
                    }}
                  >
                    {t('farmer.markAllRead')}
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setShowMenu((v) => !v);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500">{t('farmer.roleFarmer')}</p>
              </div>
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Farmer profile"
                  className="h-8 w-8 rounded-full bg-slate-200 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 rounded-xl shadow-card text-xs text-slate-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    navigate('/farmer/settings');
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50"
                >
                  {t('farmer.profileAndSettings')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    requestLogout();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-red-600"
                >
                  {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <Outlet />
        </section>
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        title={t('farmer.logoutTitle')}
        message={t('farmer.logoutMessage')}
        confirmLabel={t('common.logout')}
        cancelLabel={t('farmer.stayLoggedIn')}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
      <Chatbot role="FARMER" />
    </div>
  );
}

export default FarmerLayout;

