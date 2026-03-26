"use client";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import { SITE_RADIUS_KM } from "@/lib/geo";
import type { GeoCoords } from "@/lib/geo";
import type { IngestSignal } from "@/lib/ingest";

import "leaflet/dist/leaflet.css";

export type MapViewProps = {
  site: GeoCoords | null;
  signals: IngestSignal[];
};

function signalStyle(s: IngestSignal): { fill: string; stroke: string } {
  switch (s.decisionType) {
    case "refusal":
      return { fill: "#ef4444", stroke: "#b91c1c" };
    case "approval":
      return { fill: "#22c55e", stroke: "#15803d" };
    case "appeal":
      return { fill: "#f97316", stroke: "#c2410c" };
    default:
      return { fill: "#a1a1aa", stroke: "#52525b" };
  }
}

export default function MapView({ site, signals }: MapViewProps) {
  if (!site) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <MapContainer
        key={`${site.lat.toFixed(5)}-${site.lon.toFixed(5)}`}
        center={[site.lat, site.lon]}
        zoom={13}
        scrollWheelZoom
        style={{
          height: 400,
          width: "100%",
          borderRadius: 12,
          border: "1px solid #27272a",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={[site.lat, site.lon]}
          radius={SITE_RADIUS_KM * 1000}
          pathOptions={{
            color: "#3b82f6",
            weight: 2,
            fillColor: "#3b82f6",
            fillOpacity: 0.07,
          }}
        />

        <CircleMarker
          center={[site.lat, site.lon]}
          radius={14}
          pathOptions={{
            color: "#1d4ed8",
            fillColor: "#3b82f6",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <strong>Site</strong>
            <br />
            Analysis centre ({SITE_RADIUS_KM} km radius)
          </Popup>
        </CircleMarker>

        {signals.map((s, i) => {
          if (!s.coords) return null;
          const { fill, stroke } = signalStyle(s);
          return (
            <CircleMarker
              key={`${s.link ?? s.title ?? "sig"}-${i}`}
              center={[s.coords.lat, s.coords.lon]}
              radius={9}
              pathOptions={{
                color: stroke,
                fillColor: fill,
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <strong>
                  {s.decisionType === "refusal"
                    ? "🔴 Refusal"
                    : s.decisionType === "approval"
                      ? "🟢 Approval"
                      : s.decisionType === "appeal"
                        ? "🟠 Appeal"
                        : "Signal"}
                </strong>
                <br />
                {s.title}
                <br />
                Signal strength: {s.score}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 20px",
          marginTop: 10,
          fontSize: 12,
          opacity: 0.85,
        }}
      >
        <span>
          <span style={{ color: "#3b82f6" }}>●</span> Site
        </span>
        <span>
          <span style={{ color: "#ef4444" }}>●</span> Refusal
        </span>
        <span>
          <span style={{ color: "#22c55e" }}>●</span> Approval
        </span>
        <span>
          <span style={{ color: "#f97316" }}>●</span> Appeal
        </span>
        <span>
          <span style={{ color: "#a1a1aa" }}>●</span> Other
        </span>
        <span style={{ opacity: 0.65 }}>Ring = {SITE_RADIUS_KM} km</span>
      </div>
    </div>
  );
}
