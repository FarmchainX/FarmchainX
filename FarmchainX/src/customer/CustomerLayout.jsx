import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import farmchainxLogo from '../assets/farmchainx-logo.svg';
import api from '../api/client';
import ConfirmDialog from '../components/ConfirmDialog';
import Chatbot from '../components/Chatbot';
import { useFavorites } from '../hooks/useFavorites';

const SEEN_NOTIFICATIONS_STORAGE_KEY = 'fcx_customer_seen_notifications';

function readSeenNotificationIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_STORAGE_KEY) || '[]');
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set();
  }
}

function formatNotificationTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

const navItems = [
  { to: '/customer', label: 'Home', icon: '🏠', title: 'Fresh marketplace' },
  { to: '/customer/shop', label: 'Shop', icon: '🛍️', title: 'Discover products' },
  { to: '/customer/orders', label: 'My Orders', icon: '📦', title: 'Orders & tracking' },
  { to: '/customer/favorites', label: 'Favorites', icon: '❤️', title: 'Saved products' },
  { to: '/customer/scan', label: 'Scan QR', icon: '🔎', title: 'Verify authenticity' },
  { to: '/customer/cart', label: 'Cart', icon: '🛒', title: 'Checkout summary' },
  { to: '/customer/profile', label: 'Profile', icon: '👤', title: 'Account & delivery info' },
];

const routeHeaderConfig = [
  {
    matches: (pathname) => pathname === '/customer/order-success',
    title: 'Order confirmation',
    subtitle: 'Your order is placed. Continue shopping or track it from your orders.',
    showNavTabs: false,
  },
  {
    matches: (pathname) => pathname.startsWith('/customer/shop/'),
    title: 'Product details',
    subtitle: 'Review product information before adding to cart.',
    showNavTabs: false,
  },
];

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { count: favoritesCount } = useFavorites();
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationIds, setUnreadNotificationIds] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const name = localStorage.getItem('fcx_fullName') || 'Customer';
  const profileImage = localStorage.getItem('fcx_customer_profile') || '';

  useEffect(() => {
    const token = localStorage.getItem('fcx_token');
    const role = localStorage.getItem('fcx_role');
    if (!token || role !== 'CUSTOMER') {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      setNotificationsLoading(true);
      try {
        const res = await api.get('/api/customer/notifications');
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

  const activeNav = navItems.find((item) => item.to === location.pathname) || navItems.find((item) => location.pathname.startsWith(`${item.to}/`)) || navItems[0];
  const headerConfig = routeHeaderConfig.find((config) => config.matches(location.pathname));
  const headerTitle = headerConfig?.title || activeNav?.title || 'Customer Marketplace';
  const headerSubtitle = headerConfig?.subtitle || 'Explore products and manage your customer account.';
  const showNavTabs = headerConfig?.showNavTabs ?? true;
  const hasUnreadNotifications = unreadNotificationIds.length > 0;

  const markAllNotificationsAsRead = () => {
    localStorage.setItem(
      SEEN_NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications.map((notification) => String(notification.id))),
    );
    setUnreadNotificationIds([]);
  };

  const logout = () => {
    localStorage.removeItem('fcx_token');
    localStorage.removeItem('fcx_role');
    localStorage.removeItem('fcx_fullName');
    localStorage.removeItem('fcx_customer_profile');
    navigate('/login');
  };

  const requestLogout = () => {
    setShowMenu(false);
    setShowLogoutConfirm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
          <button type="button" onClick={() => navigate('/customer')} className="flex items-center gap-3 text-left">
            <img src={farmchainxLogo} alt="FarmchainX" className="h-10 w-10 rounded-full bg-violet-100 object-cover" />
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-950">FarmchainX</p>
              <p className="text-xs text-slate-500">Customer Portal</p>
            </div>
          </button>

          <div className="hidden lg:flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Verified farms • AI quality • Blockchain traceability
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                aria-controls="customer-notifications-menu"
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
                className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-5 w-5"
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
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>
              {showNotifications && (
                <div
                  id="customer-notifications-menu"
                  className="absolute right-0 top-14 z-20 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-[11px] text-slate-500">Updates from FarmchainX admin</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 transition hover:text-slate-600"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        Loading notifications…
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-400">
                        No notifications yet.
                      </div>
                    ) : notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                              unreadNotificationIds.includes(String(notification.id))
                                ? 'bg-violet-500'
                                : 'bg-slate-300'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                              <span className="text-[11px] whitespace-nowrap text-slate-400">
                                {formatNotificationTime(notification.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        markAllNotificationsAsRead();
                        setShowNotifications(false);
                      }}
                      className="w-full text-center text-xs font-medium text-violet-700 transition hover:text-violet-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate('/customer/favorites')}
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
              title="View favorites"
            >
              <span className="text-lg">❤️</span>
              {favoritesCount > 0 && (
                <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowMenu((prev) => !prev);
                  setShowNotifications(false);
                }}
                className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-2 py-1.5 transition hover:bg-slate-50"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden text-left sm:block">
                  <p className="text-xs font-semibold text-slate-900">{name}</p>
                  <p className="text-[11px] text-slate-500">Premium buyer</p>
                </div>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-14 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">Manage your customer account</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/customer/profile')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={requestLogout}
                    className="w-full px-4 py-3 text-left text-sm text-rose-600 transition hover:bg-amber-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-4 pt-1 sm:px-6 xl:px-8">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <div className="mb-3">
              <h1 className="text-xl font-semibold tracking-tight text-slate-950">{headerTitle}</h1>
              <p className="text-sm text-slate-500">{headerSubtitle}</p>
            </div>
            {showNavTabs && (
              <nav className="flex flex-wrap gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/customer'}
                    onClick={() => setShowMenu(false)}
                    className={({ isActive }) => `inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-180px)] max-w-[1440px] flex-col px-4 py-6 sm:px-6 xl:px-8">
        <section className="flex-1 overflow-y-auto">
          <Outlet />
        </section>
      </main>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Logout from customer account?"
        message="You will be signed out from this device and need to login again to continue."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={logout}
      />
      <Chatbot role="CUSTOMER" />
    </div>
  );
}

export default CustomerLayout;

