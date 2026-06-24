import { BeachReport } from '../types';
import { STATUS_LABELS } from '../constants/labels';
import { getMarkerColor } from './helpers';
import { getReportsRegion } from './mapReports';

const DEFAULT_CENTER = {
  latitude: 43.2965,
  longitude: 5.3698,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getZoomFromDelta(delta: number): number {
  if (delta <= 0.03) return 14;
  if (delta <= 0.08) return 13;
  if (delta <= 0.18) return 12;
  if (delta <= 0.45) return 11;
  if (delta <= 1) return 10;
  return 8;
}

export function createReportMapHtml(reports: BeachReport[]): string {
  const region = getReportsRegion(reports, DEFAULT_CENTER);
  const zoom = getZoomFromDelta(Math.max(region.latitudeDelta, region.longitudeDelta));
  const markers = reports.map((report) => ({
    id: report.id,
    title: escapeHtml(report.title),
    locationName: escapeHtml(report.locationName),
    status: escapeHtml(STATUS_LABELS[report.status]),
    latitude: report.latitude,
    longitude: report.longitude,
    color: getMarkerColor(report.severity, report.status),
  }));

  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #dbeafe; }
    .marker {
      width: 26px;
      height: 26px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #fff;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.28);
    }
    .marker::after {
      content: "";
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #fff;
      top: 6px;
      left: 6px;
    }
    .popup { min-width: 180px; }
    .popup-title { font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 4px; }
    .popup-meta { color: #475569; font-size: 12px; margin-bottom: 4px; }
    .popup-button {
      margin-top: 8px;
      border: 0;
      background: #0ea5e9;
      color: #fff;
      border-radius: 999px;
      padding: 8px 12px;
      font-weight: 800;
      font-size: 12px;
    }
    .empty {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      font-weight: 700;
      text-align: center;
      padding: 24px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const reports = ${JSON.stringify(markers)};
    const center = [${region.latitude}, ${region.longitude}];
    const map = L.map('map', { zoomControl: true }).setView(center, ${zoom});

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    function sendReport(id) {
      const payload = JSON.stringify({ type: 'report', id });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(payload);
      }
      window.parent.postMessage(payload, '*');
    }

    if (!reports.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerText = 'Aucun signalement a afficher sur la carte.';
      document.body.appendChild(empty);
    }

    const bounds = [];
    reports.forEach((report) => {
      const marker = L.marker([report.latitude, report.longitude], {
        icon: L.divIcon({
          className: '',
          iconSize: [30, 42],
          iconAnchor: [15, 34],
          popupAnchor: [0, -30],
          html: '<div class="marker" style="background:' + report.color + '"></div>'
        })
      }).addTo(map);

      marker.bindPopup(
        '<div class="popup">' +
          '<div class="popup-title">' + report.title + '</div>' +
          '<div class="popup-meta">' + report.locationName + '</div>' +
          '<div class="popup-meta">' + report.status + '</div>' +
          '<button class="popup-button" onclick="sendReport(\\'' + report.id + '\\')">Voir le signalement</button>' +
        '</div>'
      );
      marker.on('click', () => sendReport(report.id));
      bounds.push([report.latitude, report.longitude]);
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48] });
    }
  </script>
</body>
</html>`;
}
