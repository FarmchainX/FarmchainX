import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [20.5937, 78.9629];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function createPinIcon() {
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
        background: white;
        border: 2px solid #8b5cf6;
        box-shadow: 0 12px 24px -16px rgba(15,23,42,0.7);
        font-size: 18px;
      ">📍</div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  });
}

function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  title = 'Pick location on map',
  subtitle = 'Click anywhere on the map to place the pin. You can move it later by clicking again.',
  height = '280px',
}) {
  const hasCoordinates = latitude !== null && latitude !== undefined && latitude !== ''
    && longitude !== null && longitude !== undefined && longitude !== ''
    && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));
  const center = useMemo(() => {
    if (hasCoordinates) {
      return [Number(latitude), Number(longitude)];
    }
    return DEFAULT_CENTER;
  }, [hasCoordinates, latitude, longitude]);

  const pinIcon = useMemo(() => createPinIcon(), []);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ height, position: 'relative', zIndex: 10 }}>
          <MapContainer center={center} zoom={hasCoordinates ? 15 : 5} scrollWheelZoom className="h-full w-full" key={`${center[0]}-${center[1]}`} style={{ position: 'relative', zIndex: 10 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onPick={onChange} />
            {hasCoordinates && <Marker position={center} draggable icon={pinIcon} eventHandlers={{ dragend: (e) => {
              const marker = e.target;
              const pos = marker.getLatLng();
              onChange?.(pos.lat, pos.lng);
            } }} />}
          </MapContainer>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-50 px-2.5 py-1">{hasCoordinates ? 'Pin selected' : 'No pin selected yet'}</span>
        <span className="rounded-full bg-slate-50 px-2.5 py-1">
          {hasCoordinates ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}` : 'Click map to set coordinates'}
        </span>
      </div>
    </div>
  );
}

export default LocationMapPicker;

