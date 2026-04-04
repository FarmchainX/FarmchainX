import { useEffect, useState } from 'react';
import api from '../api/client';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import {
  DeliveryEmptyState,
  DeliveryPageIntro,
  DeliveryPanel,
  DeliveryPanelBody,
  DeliveryPrimaryButton,
  DeliverySectionHeader,
  DeliverySecondaryLink,
  DeliveryStatCard,
  DeliveryStatusPill,
} from './DeliveryUI';
import { formatMoney } from './formatters';

function buildOsmEmbedUrl(lat, lon) {
  const delta = 0.02;
  const left = lon - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lon}`;
}

function createMapPin(color, label) {
  return divIcon({
    className: '',
    html: `
      <div style="
        transform: translate(-50%, -100%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 9999px;
        background: ${color};
        border: 2px solid white;
        box-shadow: 0 12px 24px -16px rgba(15,23,42,0.7);
        color: white;
        font-size: 17px;
        font-weight: 700;
      ">${label}</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function midpoint(a, b) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function DeliveryDashboardPage() {
  const [stats, setStats] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [mapMode, setMapMode] = useState('live');
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLocating, setIsLocating] = useState(true);
  const [geoError, setGeoError] = useState('');
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    api.get('/api/delivery/dashboard')
      .then((res) => {
        console.log('Dashboard API response:', res.data);
        setStats(res.data);
        setApiError('');
      })
      .catch((err) => {
        console.error('Dashboard API error:', err);
        setApiError('Failed to load dashboard');
        // Set default stats to prevent UI from breaking
        setStats({
          partnerName: 'Partner',
          online: false,
          todayDeliveries: 0,
          inPickup: 0,
          inTransit: 0,
          earningsToday: 0,
          totalEarnings: 0,
          tasks: [],
        });
      });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false);
      setGeoError('Geolocation is not supported by this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          updatedAt: new Date(),
        });
        setGeoError('');
        setIsLocating(false);
      },
      () => {
        setGeoError('Unable to access live location. Please enable location permission.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 10000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggleOnline = () => {
    const next = !stats?.online;
    api.patch('/api/delivery/dashboard/availability', { online: next })
      .then(() => setStats((prev) => ({ ...prev, online: next })))
      .catch(() => {});
  };

  const tasks = stats?.tasks || [];
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
  const liveMapCenter = currentPosition ? [currentPosition.lat, currentPosition.lon] : null;
  const farmerLocation = selectedTask?.farmerLocation || selectedTask?.pickupLocation || '';
  const customerLocation = selectedTask?.customerLocation || selectedTask?.deliveryAddress || '';
  const farmerPosition = selectedTask?.pickupLatitude && selectedTask?.pickupLongitude
    ? [Number(selectedTask.pickupLatitude), Number(selectedTask.pickupLongitude)]
    : null;
  const customerPosition = selectedTask?.deliveryLatitude && selectedTask?.deliveryLongitude
    ? [Number(selectedTask.deliveryLatitude), Number(selectedTask.deliveryLongitude)]
    : null;
  const routePoints = farmerPosition && customerPosition ? [farmerPosition, customerPosition] : null;

  const mapCenter = (() => {
    if (mapMode === 'farmer' && farmerPosition) return farmerPosition;
    if (mapMode === 'customer' && customerPosition) return customerPosition;
    if (mapMode === 'route' && routePoints) return midpoint(farmerPosition, customerPosition);
    if (liveMapCenter) return liveMapCenter;
    if (farmerPosition) return farmerPosition;
    if (customerPosition) return customerPosition;
    return [20.5937, 78.9629];
  })();

  const mapModeLabel = mapMode === 'farmer'
    ? 'Farmer location'
    : mapMode === 'customer'
      ? 'Customer location'
      : mapMode === 'route'
        ? 'Farmer to customer route'
        : 'Live location';

  // Define missing query variables
  const farmerMapQuery = selectedTask && (selectedTask.farmerLocation || selectedTask.pickupLocation);
  const customerMapQuery = selectedTask && (selectedTask.customerLocation || selectedTask.deliveryAddress);
  const routeQuery = farmerPosition && customerPosition;
  const farmerCoords = farmerPosition ? `${farmerPosition[0].toFixed(5)}, ${farmerPosition[1].toFixed(5)}` : null;
  const customerCoords = customerPosition ? `${customerPosition[0].toFixed(5)}, ${customerPosition[1].toFixed(5)}` : null;

  return (
    <div className="space-y-6">
      <DeliveryPageIntro
        icon="📊"
        title={`Welcome, ${stats?.partnerName || 'Partner'}`}
        description="Track today's load, active tasks, and payout summary from one driver-focused dashboard."
        action={
          <div className="flex items-center gap-2">
            <DeliverySecondaryLink to="/delivery/available">Find Deliveries</DeliverySecondaryLink>
            <DeliveryPrimaryButton onClick={toggleOnline} className={stats?.online ? '' : '!bg-white !bg-none !text-slate-700 !border !border-slate-300 !shadow-none hover:!bg-slate-50'}>
              <span className={`h-2.5 w-2.5 rounded-full ${stats?.online ? 'bg-white/90' : 'bg-sky-500'}`} />
              {stats?.online ? 'Online' : 'Offline'}
            </DeliveryPrimaryButton>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          const totalEarnings = stats?.totalEarnings ?? 0;
          const todayEarnings = stats?.earningsToday ?? 0;
          console.log('Displaying earnings - Total:', totalEarnings, 'Today:', todayEarnings);
          return (
            <>
              <DeliveryStatCard 
                label="Total Earnings" 
                value={formatMoney(totalEarnings)} 
                chip="Lifetime" 
                tone="violet" 
                helper="Total delivered payout so far" 
              />
              <DeliveryStatCard 
                label="Today Earnings" 
                value={formatMoney(todayEarnings)} 
                chip="Today" 
                tone="violet" 
                helper="Today's completed payout total" 
              />
            </>
          );
        })()}
        <DeliveryStatCard label="In Transit" value={stats?.inTransit ?? 0} chip="On route" tone="sky" helper="Orders currently moving" />
        <DeliveryStatCard label="In Pickup" value={stats?.inPickup ?? stats?.pendingPickups ?? 0} chip="Pickup" tone="amber" helper="Assigned or picked-up orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DeliveryPanel className="lg:col-span-2">
          <DeliveryPanelBody>
            <DeliverySectionHeader title="Tasks List" subtitle="Your active assigned deliveries" />
          {tasks.length === 0 ? (
            <DeliveryEmptyState
              title="No active tasks right now"
              description="When you accept deliveries, they’ll appear here with route and status information."
            />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setMapMode('route');
                  }}
                  className={`w-full rounded-2xl border bg-slate-50/60 p-4 text-left transition ${
                    selectedTask?.id === task.id
                      ? 'border-sky-300 ring-2 ring-sky-100'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{task.orderCode} • {task.customerName}</p>
                      <p className="mt-1 text-xs text-slate-500">Farmer: {task.farmerLocation || task.pickupLocation || 'TBD'}</p>
                      <p className="text-xs text-slate-500">Customer: {task.customerLocation || task.deliveryAddress || 'TBD'}</p>
                      {(task.pickupLatitude || task.pickupLongitude || task.deliveryLatitude || task.deliveryLongitude) && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {task.pickupLatitude && task.pickupLongitude ? `Farmer pin ${Number(task.pickupLatitude).toFixed(5)}, ${Number(task.pickupLongitude).toFixed(5)}` : 'Farmer pin not saved'}
                          {' · '}
                          {task.deliveryLatitude && task.deliveryLongitude ? `Customer pin ${Number(task.deliveryLatitude).toFixed(5)}, ${Number(task.deliveryLongitude).toFixed(5)}` : 'Customer pin not saved'}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <DeliveryStatusPill status={task.deliveryStatus} />
                      <span className="rounded-full border border-sky-100 bg-white px-2.5 py-1 text-[11px] font-medium text-sky-700">
                        {task.distanceKm || 0} km route
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          </DeliveryPanelBody>
        </DeliveryPanel>
        <DeliveryPanel>
          <DeliveryPanelBody>
            <DeliverySectionHeader
              title="Live Map"
              subtitle={selectedTask ? `Selected task: ${selectedTask.orderCode}` : 'Select a task to track farmer and customer locations'}
            />
            <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setMapMode('live')}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  mapMode === 'live'
                    ? 'border-sky-300 bg-sky-50 text-sky-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Live
              </button>
              <button
                type="button"
                onClick={() => setMapMode('farmer')}
                disabled={!farmerMapQuery}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  mapMode === 'farmer'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${!farmerMapQuery ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                Farmer
              </button>
              <button
                type="button"
                onClick={() => setMapMode('customer')}
                disabled={!customerMapQuery}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  mapMode === 'customer'
                    ? 'border-violet-300 bg-violet-50 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${!customerMapQuery ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => setMapMode('route')}
                disabled={!routeQuery}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                  mapMode === 'route'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                } ${!routeQuery ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                Route
              </button>
            </div>
            <div className="h-72 overflow-hidden rounded-2xl border border-dashed border-sky-200 bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 p-4" style={{ position: 'relative', zIndex: 1 }}>
              <MapContainer key={`${mapMode}-${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={mapMode === 'route' ? 13 : 15} scrollWheelZoom className="h-full w-full rounded-xl border border-slate-200" style={{ position: 'relative', zIndex: 1 }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {farmerPosition && (
                  <Marker position={farmerPosition} icon={createMapPin('#10b981', 'F')}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-emerald-700">Farmer</p>
                        <p>{farmerLocation || 'Saved farm location'}</p>
                        <p className="text-xs text-slate-500">{farmerPosition[0].toFixed(5)}, {farmerPosition[1].toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                {customerPosition && (
                  <Marker position={customerPosition} icon={createMapPin('#8b5cf6', 'C')}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-violet-700">Customer</p>
                        <p>{customerLocation || 'Saved delivery location'}</p>
                        <p className="text-xs text-slate-500">{customerPosition[0].toFixed(5)}, {customerPosition[1].toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
                {routePoints && mapMode === 'route' && (
                  <Polyline positions={routePoints} pathOptions={{ color: '#0ea5e9', weight: 4, opacity: 0.9 }} />
                )}
                {liveMapCenter && (
                  <Marker position={liveMapCenter} icon={createMapPin('#0284c7', 'Y')}>
                    <Popup>
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-sky-700">Your live location</p>
                        <p className="text-xs text-slate-500">{liveMapCenter[0].toFixed(5)}, {liveMapCenter[1].toFixed(5)}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">Mode: {mapModeLabel}</span>
              <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">{currentPosition ? 'Live location active' : 'Location inactive'}</span>
              {currentPosition?.updatedAt && (
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                  Updated {currentPosition.updatedAt.toLocaleTimeString()}
                </span>
              )}
              {currentPosition && (
                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                  {currentPosition.lat.toFixed(5)}, {currentPosition.lon.toFixed(5)}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Farmer Location</p>
                <p className="mt-1 text-xs text-slate-700">{farmerLocation || 'Not available for selected task'}</p>
                <p className="mt-1 text-[11px] text-slate-500">{farmerCoords ? `Pin: ${farmerCoords}` : 'Pin not saved'}</p>
              </div>
              <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">Customer Location</p>
                <p className="mt-1 text-xs text-slate-700">{customerLocation || 'Not available for selected task'}</p>
                <p className="mt-1 text-[11px] text-slate-500">{customerCoords ? `Pin: ${customerCoords}` : 'Pin not saved'}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMapMode('farmer')}
                disabled={!farmerMapQuery}
                className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  farmerMapQuery
                    ? 'border-sky-200 bg-white text-sky-700 hover:bg-sky-50'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                Navigate to Farmer
              </button>
              <button
                type="button"
                onClick={() => setMapMode('customer')}
                disabled={!customerMapQuery}
                className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition ${
                  customerMapQuery
                    ? 'border-violet-200 bg-white text-violet-700 hover:bg-violet-50'
                    : 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                }`}
              >
                Navigate to Customer
              </button>
            </div>
          </DeliveryPanelBody>
        </DeliveryPanel>
      </div>
    </div>
  );
}

export default DeliveryDashboardPage;

