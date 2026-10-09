import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default leaflet marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const getSeverityColor = (severity, status) => {
  if (status === "resolved") return "#10b981"; // green
  if (severity === "high") return "#ef4444"; // red
  if (severity === "medium") return "#f59e0b"; // amber
  return "#3b82f6"; // blue
};

const createCustomIcon = (severity, status, issueType) => {
  const color = getSeverityColor(severity, status);
  const iconEmoji = {
    water: "💧",
    drainage: "🌊",
    road: "🚧",
    electricity: "⚡",
    street_light: "💡",
    garbage: "🗑️",
    public_safety: "⚠️",
    other: "📍"
  }[issueType] || "📍";

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        background-color: ${color};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2px solid white;
        transition: transform 0.2s;
      ">
        ${iconEmoji}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};

export default function CivicMap({
  complaints = [],
  selectedComplaint = null,
  onSelectComplaint = null,
  pickLocationMode = false,
  pickedLocation = null,
  onLocationSelect = null,
  height = "420px"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around municipal district (Lucknow 26.8467, 80.9462)
      const initialLat = pickedLocation?.lat || (complaints[0]?.latitude || 26.8467);
      const initialLng = pickedLocation?.lng || (complaints[0]?.longitude || 80.9462);

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Map Click in Pick Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (pickLocationMode && onLocationSelect) {
        const { lat, lng } = e.latlng;
        onLocationSelect({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
        });
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [pickLocationMode, onLocationSelect]);

  // Update Picked Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }

    if (pickedLocation?.lat && pickedLocation?.lng) {
      const pinIcon = L.divIcon({
        className: "custom-picker-marker",
        html: `
          <div style="
            background: #6366f1;
            width: 38px;
            height: 38px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(99,102,241,0.5);
            border: 3px solid white;
          ">
            <span style="transform: rotate(45deg); color: white; font-size: 16px;">📍</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([pickedLocation.lat, pickedLocation.lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`<b>Selected Incident Location</b><br/>Lat: ${pickedLocation.lat}, Lng: ${pickedLocation.lng}`)
        .openPopup();

      pickerMarkerRef.current = marker;
      map.panTo([pickedLocation.lat, pickedLocation.lng], { animate: true });
    }
  }, [pickedLocation]);

  // Render Complaints Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (complaints.length === 0) return;

    const bounds = [];

    complaints.forEach((comp) => {
      if (!comp.latitude || !comp.longitude) return;

      const icon = createCustomIcon(comp.severity, comp.status, comp.issue_type);
      const marker = L.marker([comp.latitude, comp.longitude], { icon });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 200px; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px;">
              ${comp.issue_type?.replace("_", " ")}
            </span>
            <span style="font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${comp.status === "resolved" ? "#d1fae5" : comp.status === "in_progress" ? "#fef3c7" : "#fee2e2"}; color: ${comp.status === "resolved" ? "#065f46" : comp.status === "in_progress" ? "#92400e" : "#991b1b"};">
              ${comp.status?.replace("_", " ")}
            </span>
          </div>
          <h4 style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #1e293b; line-height: 1.3;">
            ${comp.title}
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.4;">
            ${comp.description ? (comp.description.slice(0, 85) + (comp.description.length > 85 ? "..." : "")) : ""}
          </p>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            📍 ${comp.address || `${comp.latitude}, ${comp.longitude}`}<br/>
            ⚡ AI Urgency: <b>${comp.ai_urgency_score || 50}/100</b>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        if (onSelectComplaint) {
          onSelectComplaint(comp);
        }
      });

      markersLayer.addLayer(marker);
      bounds.push([comp.latitude, comp.longitude]);
    });

    if (selectedComplaint && selectedComplaint.latitude && selectedComplaint.longitude) {
      map.setView([selectedComplaint.latitude, selectedComplaint.longitude], 15, { animate: true });
    }
  }, [complaints, selectedComplaint, onSelectComplaint]);

  const handleCurrentLocation = () => {
    if (navigator.geolocation && mapInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          if (onLocationSelect) {
            onLocationSelect({ lat, lng });
          }
          mapInstanceRef.current.setView([lat, lng], 15);
        },
        () => {
          alert("Unable to retrieve your current location. Please tap directly on the map.");
        }
      );
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: "12px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
      {pickLocationMode && (
        <div style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(4px)",
          padding: "8px 12px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          gap: "8px",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#1e293b" }}>
            👆 Click on map to set pin
          </span>
          <button
            type="button"
            onClick={handleCurrentLocation}
            style={{
              background: "#2563eb",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            🎯 Locate Me
          </button>
        </div>
      )}
    </div>
  );
}
