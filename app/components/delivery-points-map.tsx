"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

// Importar componentes de Leaflet dinámicamente para evitar problemas de SSR
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

// Importar Leaflet solo en el cliente
let L: any = null;
if (typeof window !== "undefined") {
  L = require("leaflet");
}

// Componente para detectar clics en el mapa
function MapClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const { useMapEvents } = require("react-leaflet");
  useMapEvents({
    click: (e: any) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

type DeliveryPoint = {
  id: string;
  name: string;
  address: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  farmer_id?: string;
};

type DeliveryPointsMapProps = {
  deliveryPoints: DeliveryPoint[];
  onPointClick?: (point: DeliveryPoint) => void;
  onMapClick?: (lat: number, lng: number) => void;
  editable?: boolean;
  center?: [number, number];
  zoom?: number;
  tempMarker?: { lat: number; lng: number } | null; // Marcador temporal para el punto que se está editando/creando
};

export function DeliveryPointsMap({
  deliveryPoints,
  onPointClick,
  onMapClick,
  editable = false,
  center = [-40.5739, -73.1342], // Osorno, Chile por defecto
  zoom = 13,
  tempMarker = null,
}: DeliveryPointsMapProps) {
  const [mounted, setMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    // Fix para los iconos de Leaflet en Next.js
    if (typeof window !== "undefined" && L) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    }
  }, []);

  // Crear iconos solo cuando L esté disponible
  const [activeIcon, setActiveIcon] = useState<any>(null);
  const [inactiveIcon, setInactiveIcon] = useState<any>(null);
  const [tempIcon, setTempIcon] = useState<any>(null);

  useEffect(() => {
    if (L && typeof window !== "undefined") {
      setActiveIcon(new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }));

      setInactiveIcon(new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }));

      setTempIcon(new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }));
    }
  }, []);

  // Filtrar puntos que tienen coordenadas
  const pointsWithCoordinates = deliveryPoints.filter(
    (point) => point.latitude !== null && point.longitude !== null
  );

  // Componente para actualizar el mapa cuando cambian las coordenadas
  function MapUpdater({ tempMarker, center, zoom }: { tempMarker: { lat: number; lng: number } | null; center: [number, number]; zoom: number }) {
    const { useMap } = require("react-leaflet");
    const map = useMap();
    
    useEffect(() => {
      if (tempMarker) {
        map.setView([tempMarker.lat, tempMarker.lng], 15, { animate: true });
      } else if (center) {
        map.setView(center, zoom, { animate: true });
      }
    }, [tempMarker, center, zoom, map]);
    
    return null;
  }

  // Actualizar el centro del mapa cuando cambian las coordenadas del marcador temporal o los puntos
  useEffect(() => {
    if (tempMarker) {
      const newCenter: [number, number] = [tempMarker.lat, tempMarker.lng];
      if (Math.abs(mapCenter[0] - newCenter[0]) > 0.0001 || Math.abs(mapCenter[1] - newCenter[1]) > 0.0001) {
        setMapCenter(newCenter);
        setMapZoom(15);
      }
    } else if (pointsWithCoordinates.length > 0 && !editable) {
      const firstPoint = pointsWithCoordinates[0];
      if (firstPoint.latitude && firstPoint.longitude) {
        const newCenter: [number, number] = [firstPoint.latitude, firstPoint.longitude];
        if (Math.abs(mapCenter[0] - newCenter[0]) > 0.0001 || Math.abs(mapCenter[1] - newCenter[1]) > 0.0001) {
          setMapCenter(newCenter);
          setMapZoom(13);
        }
      }
    } else if (center) {
      if (Math.abs(mapCenter[0] - center[0]) > 0.0001 || Math.abs(mapCenter[1] - center[1]) > 0.0001) {
        setMapCenter(center);
        setMapZoom(zoom);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempMarker?.lat, tempMarker?.lng, editable]);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Cargando mapa...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater tempMarker={tempMarker} center={mapCenter} zoom={mapZoom} />
        {editable && <MapClickHandler onMapClick={onMapClick} />}
        
        {/* Marcador temporal para el punto que se está editando/creando */}
        {tempMarker && tempIcon && (
          <Marker
            position={[tempMarker.lat, tempMarker.lng]}
            icon={tempIcon}
          >
            <Popup>
              <div className="p-2">
                <p className="text-sm font-semibold text-blue-700">Ubicación seleccionada</p>
                <p className="text-xs text-slate-600 mt-1">
                  Esta será la ubicación del punto de entrega
                </p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {pointsWithCoordinates.map((point) => (
          <Marker
            key={point.id}
            position={[point.latitude!, point.longitude!]}
            icon={point.is_active !== false ? (activeIcon || undefined) : (inactiveIcon || undefined)}
            eventHandlers={{
              click: () => {
                if (onPointClick) {
                  onPointClick(point);
                }
              },
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-slate-900">{point.name}</h3>
                <p className="text-sm text-slate-600">{point.address}</p>
                <p className="text-xs text-slate-500">Zona: {point.zone}</p>
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                    point.is_active !== false
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {point.is_active !== false ? "Activo" : "Inactivo"}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
