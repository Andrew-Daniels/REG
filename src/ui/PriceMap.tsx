import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface Props {
  lat: number;
  lng: number;
  /** Lower zoom = more area shown ("a little zoomed out"). */
  zoom?: number;
}

/** A small Leaflet/OpenStreetMap map centered on the listing (free, no key). */
export function PriceMap({ lat, lng, zoom = 11 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (!mapRef.current) {
      const map = L.map(ref.current, {
        center: [lat, lng],
        zoom,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
      L.circleMarker([lat, lng], {
        radius: 10,
        color: '#e63946',
        weight: 3,
        fillColor: '#e63946',
        fillOpacity: 0.35,
      }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([lat, lng], zoom);
    }
  }, [lat, lng, zoom]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  return (
    <div className="map-wrap">
      <div className="map" ref={ref} aria-label="map of the listing area" />
      <span className="map-pin" aria-hidden>📍</span>
    </div>
  );
}
