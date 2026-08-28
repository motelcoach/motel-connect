"use client";

import type { AdvisorCategory, AdvisorProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import L from "leaflet";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const categoryColour: Record<AdvisorCategory, string> = {
  "Motel Broker": "#0f766e",
  "Lawyer & Legal": "#1e3a5f",
  "Accountant & Tax": "#047857",
  "Finance & Refinancing": "#b45309",
};

function markerIcon(category: AdvisorCategory) {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<span style="display:block;width:18px;height:18px;border-radius:999px;border:2px solid white;background:${categoryColour[category]};box-shadow:0 0 0 2px rgba(15,23,42,.18)"></span>`,
  });
}

function FitBounds({ advisors }: { advisors: AdvisorProfile[] }) {
  const map = useMap();
  useEffect(() => {
    if (!advisors.length) {
      map.setView([-25.3, 133.8], 4);
      return;
    }
    const bounds = L.latLngBounds(advisors.map((advisor) => [advisor.lat, advisor.lng]));
    map.fitBounds(bounds.pad(0.35));
  }, [advisors, map]);
  return null;
}

export default function AdvisorMap({
  advisors,
  onSelect,
}: {
  advisors: AdvisorProfile[];
  onSelect: (advisor: AdvisorProfile) => void;
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
      <FitBounds advisors={advisors} />
      {advisors.map((advisor) => (
        <Marker
          key={advisor.id}
          position={[advisor.lat, advisor.lng]}
          icon={markerIcon(advisor.category)}
          eventHandlers={{ click: () => onSelect(advisor) }}
        >
          <Popup>
            <button
              onClick={() => onSelect(advisor)}
              className={cn("text-left text-sm font-semibold text-slate-900")}
            >
              {advisor.name}
            </button>
            <p className="text-xs text-slate-600">
              {advisor.practiceName} · {advisor.location}
            </p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
