import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Issue } from '../../hooks/useIssues';

interface MapViewProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  onSelectIssue: (issue: Issue) => void;
  centerLatitude: number;
  centerLongitude: number;
  interactive?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
}

// Map center controller helper
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Map click listener for placing report pins
const MapClickHandler: React.FC<{ onMapClick?: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const handler = (e: any) => {
      const { lat, lng } = e.latlng;
      onMapClick(lat, lng);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onMapClick]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  issues,
  selectedIssue,
  onSelectIssue,
  centerLatitude,
  centerLongitude,
  interactive = false,
  onLocationSelect,
}) => {
  
  // Custom SVG Markers
  const createMarkerIcon = (status: string) => {
    let color = 'var(--status-warning)'; // Pending = Yellow
    if (status === 'Community Verified') color = 'var(--status-info)'; // Verified = Blue
    if (status === 'Resolved') color = 'var(--status-success)'; // Resolved = Green
    if (status === 'Rejected') color = 'var(--status-critical)'; // Rejected = Red

    const svgHtml = `
      <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16C0 26.5 16 42 16 42C16 42 32 26.5 32 16C32 7.16 24.84 0 16 0ZM16 22.5C12.41 22.5 9.5 19.59 9.5 16C9.5 12.41 12.41 9.5 16 9.5C19.59 9.5 22.5 12.41 22.5 16C22.5 19.59 19.59 22.5 16 22.5Z" fill="${color}"/>
      </svg>
    `;

    return L.divIcon({
      className: 'custom-leaflet-icon',
      html: svgHtml,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -40],
    });
  };

  const center: [number, number] = selectedIssue 
    ? [selectedIssue.latitude, selectedIssue.longitude] 
    : [centerLatitude, centerLongitude];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={selectedIssue ? 16 : 13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Google Maps Raster Tiles dark styled */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Sync Map View */}
        <ChangeMapView center={center} zoom={selectedIssue ? 16 : 13} />

        {/* Listen for selection click when in reporting mode */}
        {interactive && onLocationSelect && (
          <MapClickHandler onMapClick={onLocationSelect} />
        )}

        {/* Current User Geolocation marker */}
        <Marker
          position={[centerLatitude, centerLongitude]}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                width: 16px;
                height: 16px;
                background: var(--civic-emerald);
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 10px var(--civic-emerald);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.7); }
                  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(20, 184, 166, 0); }
                  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
                }
              </style>
            `,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        >
          <Popup>
            <div style={{ padding: '4px' }}>
              <strong style={{ display: 'block', fontSize: '12px' }}>Your Location</strong>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>GPS Verified Position</span>
            </div>
          </Popup>
        </Marker>

        {/* Render Issue Markers */}
        {!interactive && issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={createMarkerIcon(issue.status)}
            eventHandlers={{
              click: () => onSelectIssue(issue),
            }}
          >
            <Popup>
              <div style={{ padding: '4px', minWidth: '160px' }}>
                <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px', color: 'var(--text-high)' }}>
                  {issue.category.toUpperCase().replace('_', ' ')}
                </strong>
                <span style={{ fontSize: '11px', display: 'block', marginBottom: '4px', color: 'var(--text-muted)' }}>
                  {issue.address}
                </span>
                <span className={`badge badge-${issue.severity}`} style={{ fontSize: '9px' }}>
                  {issue.severity}
                </span>
                <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--civic-emerald)', fontWeight: 600 }}>
                  Consensus Score: {issue.consensusScore}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
