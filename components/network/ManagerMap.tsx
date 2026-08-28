"use client";

import type { ManagerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function markerIcon(verified: boolean) {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:block;width:18px;height:18px;border-radius:999px;border:2px solid white;background:${verified ? "#0f766e" : "#b45309"};box-shadow:0 0 0 2px rgba(15,23,42,.18)"></span>`,
  });
}

function FitBounds({ managers }: { managers: ManagerProfile[] }) {
  const map = useMap();
  useEffect(() => {
    if (!managers.length) {
      map.setView([-25.3, 133.8], 4);
      return;
    }
    const bounds = L.latLngBounds(managers.map((manager) => [manager.lat, manager.lng]));
    map.fitBounds(bounds.pad(0.35));
  }, [managers, map]);
  return null;
}

export default function ManagerMap({
  managers,
  onSelect,
}: {
  managers: ManagerProfile[];
  onSelect: (manager: ManagerProfile) => void;
}) {
  return (
    <MapContainer
      center={[-25.3, 133.8]}
      zoom={4}
      className="h-[520px] w-full rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds managers={managers} />
      {managers.map((manager) => (
        <Marker
          key={manager.id}
          position={[manager.lat, manager.lng]}
          icon={markerIcon(manager.isVerified)}
          eventHandlers={{ click: () => onSelect(manager) }}
        >
          <Popup>
            <button
              onClick={() => onSelect(manager)}
              className={cn("text-left text-sm font-semibold text-slate-900")}
            >
              {manager.profileType === "Couple" && manager.partnerName
                ? `${manager.name.split(" ")[0]} & ${manager.partnerName}`
                : manager.name}
            </button>
            <p className="text-xs text-slate-600">{manager.location}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
