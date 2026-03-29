import { useEffect, useState } from 'react';
import api from '../api/client';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryPrimaryButton,
} from './DeliveryUI';
import { formatDateTime } from './formatters';

function DeliveryNotificationsPage() {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);

  const load = () => {
    api.get('/api/delivery/notifications').then((res) => {
      setItems(res.data?.items || []);
      setUnread(res.data?.unread || 0);
    }).catch(() => {
      setItems([]);
      setUnread(0);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const markOne = (id) => {
    api.patch(`/api/delivery/notifications/${id}/read`).then(load).catch(() => {});
  };

  const markAll = () => {
    api.patch('/api/delivery/notifications/read-all').then(load).catch(() => {});
  };

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="🔔"
        title="Notifications"
        description={`Unread notifications: ${unread}. Stay updated on assignments, payouts, and system alerts.`}
        action={<DeliveryPrimaryButton onClick={markAll}>Mark all as read</DeliveryPrimaryButton>}
      />

      <DeliveryPanel>
        <DeliveryPanelBody className="divide-y divide-slate-100 !p-0">
        {items.length === 0 ? (
          <div className="p-6">
            <DeliveryEmptyState title="No notifications" description="New assignments, payment updates, and alerts will show here." />
          </div>
        ) : items.map((item) => (
          <div key={item.id} className="p-4 hover:bg-slate-50">
            <div className="flex items-start gap-3">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-sky-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                  <span className="text-[10px] rounded-full px-2 py-1 border border-slate-200 text-slate-500 uppercase">{item.type || 'Alert'}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.message}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] text-slate-400">{formatDateTime(item.createdAt)}</p>
                  {!item.isRead && (
                    <button type="button" onClick={() => markOne(item.id)} className="text-[11px] text-sky-700 font-medium hover:underline">
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </DeliveryPanelBody>
      </DeliveryPanel>
    </div>
  );
}

export default DeliveryNotificationsPage;

