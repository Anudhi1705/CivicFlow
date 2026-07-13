import React, { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import L from "leaflet";

interface MapPickerProps {
  lat: number;
  lng: number;
  address?: string;
  onChange: (lat: number, lng: number, address: string) => void;
  readOnly?: boolean;
}

const CITY_PRESETS = [
  { name: "Downtown Center", lat: 37.7749, lng: -122.4194, address: "Oak St & 5th Ave, Downtown, SF" },
  { name: "Westside Library", lat: 37.7833, lng: -122.4167, address: "101 Library Lane, Westside, SF" },
  { name: "CivicFlow Park Alley", lat: 37.7699, lng: -122.4468, address: "CivicFlow Park Alley, Civic Heights, SF" },
  { name: "Maple Northpark", lat: 37.7946, lng: -122.4018, address: "452 Maple Ave, Northpark, SF" }
];

export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, address = "", onChange, readOnly = false }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  // Custom visual CSS/SVG marker icon to avoid bundler image issues
  const customIcon = L.divIcon({
    html: `<div class="relative flex items-center justify-center">
             <div class="absolute -top-7 bg-red-600 text-white rounded-full p-1 shadow-md border-2 border-white flex items-center justify-center animate-bounce">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="w-3.5 h-3.5">
                 <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
               </svg>
             </div>
             <span class="absolute top-0 w-2.5 h-2.5 bg-red-500 rounded-full opacity-75 animate-ping"></span>
             <span class="relative w-2 h-2 bg-red-700 rounded-full border border-white"></span>
           </div>`,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Reverse geocoding handler with offline smart estimation
  const handleLocationChange = async (newLat: number, newLng: number) => {
    setGeocoding(true);
    let resolvedAddress = "";
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`,
        {
          headers: { "Accept-Language": "en" }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const fullAddress = data.display_name || "";
        const parts = fullAddress.split(", ");
        // Extract top 3 elements of address for clean styling
        resolvedAddress = parts.slice(0, Math.min(3, parts.length)).join(", ");
      } else {
        throw new Error();
      }
    } catch (e) {
      // Offline fallback estimation based on quadrant coordinates
      if (newLat > 37.785) {
        resolvedAddress = `${Math.floor(newLat * 1000) % 500} Maple Ave, Northpark, CivicFlow`;
      } else if (newLat < 37.770) {
        resolvedAddress = `${Math.floor(newLat * 1000) % 300} CivicFlow Rd, Civic Heights, CivicFlow`;
      } else if (newLng < -122.43) {
        resolvedAddress = `${Math.floor(newLng * -1000) % 400} Library Lane, Westside, CivicFlow`;
      } else {
        resolvedAddress = `${Math.floor(newLat * 1000) % 200} Oak St & 5th Ave, Downtown, CivicFlow`;
      }
    } finally {
      setGeocoding(false);
      onChange(parseFloat(newLat.toFixed(5)), parseFloat(newLng.toFixed(5)), resolvedAddress || "CivicFlow Community Hub");
    }
  };

  // Initialize Map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const initialLat = lat || 37.7749;
      const initialLng = lng || -122.4194;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: !readOnly,
        dragging: !readOnly,
        touchZoom: !readOnly,
        doubleClickZoom: !readOnly,
      }).setView([initialLat, initialLng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      mapRef.current = map;

      // Draw Marker if coordinates present
      if (lat && lng) {
        const marker = L.marker([lat, lng], {
          icon: customIcon,
          draggable: !readOnly
        }).addTo(map);

        if (!readOnly) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            handleLocationChange(pos.lat, pos.lng);
          });
        }
        markerRef.current = marker;
      }

      // Add Map Click Listener for non-readOnly maps
      if (!readOnly) {
        map.on("click", (e) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            const marker = L.marker([clickLat, clickLng], {
              icon: customIcon,
              draggable: true
            }).addTo(map);

            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              handleLocationChange(pos.lat, pos.lng);
            });
            markerRef.current = marker;
          }
          handleLocationChange(clickLat, clickLng);
        });
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Sync prop changes
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      const currentMarkerLatLng = markerRef.current ? markerRef.current.getLatLng() : null;
      if (!currentMarkerLatLng || currentMarkerLatLng.lat !== lat || currentMarkerLatLng.lng !== lng) {
        mapRef.current.setView([lat, lng], mapRef.current.getZoom());
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], {
            icon: customIcon,
            draggable: !readOnly
          }).addTo(mapRef.current);

          if (!readOnly) {
            marker.on("dragend", () => {
              const pos = marker.getLatLng();
              handleLocationChange(pos.lat, pos.lng);
            });
          }
          markerRef.current = marker;
        }
      }
    }
  }, [lat, lng]);

  return (
    <div id="map-picker-container" className="space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider flex items-center gap-1.5">
          <MapPin size={14} className="text-blue-600 animate-pulse" />
          <span>Report Location {readOnly ? "(Coordinates Fixed)" : "(Click / Drag Marker)"}</span>
        </label>
        <span className={`text-xxs font-bold px-2.5 py-1 rounded-full w-fit ${geocoding ? "bg-amber-50 text-amber-600 animate-pulse" : "bg-blue-50 text-blue-700"}`}>
          {geocoding ? "Resolving Address..." : address || "No location picked yet"}
        </span>
      </div>

      <div className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs">
        <div ref={mapContainerRef} className="w-full h-[260px] z-10" id="leaflet-map-element"></div>
        
        {/* Coordinates floating badge */}
        <div className="absolute bottom-2 left-2 bg-slate-950/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] font-mono font-medium z-20 flex gap-2 items-center shadow-md">
          <span>LAT: {lat ? lat.toFixed(5) : "0.00"}</span>
          <span className="text-slate-500">|</span>
          <span>LNG: {lng ? lng.toFixed(5) : "0.00"}</span>
        </div>
      </div>

      {/* Preset Buttons for Quick Pinning */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xxs text-slate-400 font-mono uppercase font-bold">Quick Select:</span>
          {CITY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.lat, preset.lng, preset.address)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                address.includes(preset.name) || (Math.abs(lat - preset.lat) < 0.001 && Math.abs(lng - preset.lng) < 0.001)
                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
