import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import type { MapComponentProps } from "../types";

declare global {
  interface Window {
    L: any;
  }
}

export interface MapComponentHandle {
  getMap: () => any;
}

const MapComponent = forwardRef<MapComponentHandle, MapComponentProps>(
  function MapComponent({ doctors, selectedDoctor, userLocation, onSelectDoctor }, ref) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      getMap: () => mapInstanceRef.current,
    }));

    // Load Leaflet
    useEffect(() => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js";
      script.async = true;
      script.onload = () => initMap();
      document.body.appendChild(script);

      return () => {
        if (mapInstanceRef.current) mapInstanceRef.current.remove();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initMap = () => {
      if (!window.L || mapInstanceRef.current || !mapRef.current) return;

      const map = window.L.map(mapRef.current).setView([27.1767, 78.0081], 13);

      // Standard professional OSM tiles
      window.L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      if (userLocation) addUserMarker(userLocation);
      updateMarkers();
    };

    const addUserMarker = (location: [number, number]) => {
      if (!window.L || !mapInstanceRef.current) return;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(location);
      } else {
        userMarkerRef.current = window.L.marker(location, {
          icon: window.L.divIcon({
            className: "user-location-marker",
            html: `
              <div style="position:relative; width:20px; height:20px;">
                <div style="
                  position:absolute; inset:0;
                  background: #2563eb;
                  border-radius: 50%;
                  border: 3px solid #ffffff;
                  box-shadow: 0 0 8px rgba(37,99,235,0.4);
                "></div>
                <div class="user-marker-pulse" style="
                  position:absolute; inset:-4px;
                  border-radius: 50%;
                  border: 2px solid rgba(37,99,235,0.3);
                "></div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(
            '<div style="text-align:center;font-weight:600;font-size:13px;">Your Location</div>'
          );

        userMarkerRef.current.on("click", () => {
          const url = `https://www.google.com/maps?q=${location[0]},${location[1]}`;
          window.open(url, "_blank");
        });
      }

      mapInstanceRef.current.setView(location, 13);
    };

    useEffect(() => {
      if (userLocation && mapInstanceRef.current) {
        addUserMarker(userLocation);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLocation]);

    const updateMarkers = () => {
      if (!window.L || !mapInstanceRef.current) return;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      doctors.forEach((doctor) => {
        const isSelected = selectedDoctor?.id === doctor.id;

        const marker = window.L.marker([doctor.lat, doctor.lng], {
          doctorId: doctor.id,
          icon: window.L.divIcon({
            className: "doctor-marker",
            html: `
              <div style="
                background: ${isSelected ? "#2563eb" : "#10b981"};
                width: ${isSelected ? "14px" : "10px"};
                height: ${isSelected ? "14px" : "10px"};
                border-radius: 50%;
                border: 2px solid #ffffff;
                box-shadow: 0 0 ${isSelected ? "8px" : "4px"} ${isSelected ? "rgba(37,99,235,0.4)" : "rgba(16,185,129,0.3)"};
                transition: all 0.2s ease;
              "></div>
            `,
            iconSize: [isSelected ? 14 : 10, isSelected ? 14 : 10],
            iconAnchor: [isSelected ? 7 : 5, isSelected ? 7 : 5],
          }),
        }).addTo(mapInstanceRef.current);

        marker.bindPopup(
          `<div style="font-size:13px;">
            <div style="font-weight:600;margin-bottom:3px;">${doctor.name}</div>
            <div style="color:#64748b;margin-bottom:2px;">${doctor.specialty}</div>
            <div style="color:#94a3b8;font-size:12px;">${doctor.clinic}</div>
          </div>`
        );

        marker.on("click", () => {
          if (onSelectDoctor) {
            onSelectDoctor(doctor);
          }
        });

        markersRef.current.push(marker);
      });
    };

    useEffect(() => {
      if (mapInstanceRef.current) updateMarkers();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doctors, selectedDoctor]);

    useEffect(() => {
      if (mapInstanceRef.current && selectedDoctor) {
        mapInstanceRef.current.setView(
          [selectedDoctor.lat, selectedDoctor.lng],
          15
        );
        const marker = markersRef.current.find(
          (m: any) => m.options.doctorId === selectedDoctor.id
        );
        if (marker) marker.openPopup();
      }
    }, [selectedDoctor]);

    return (
      <div
        ref={mapRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ minHeight: "500px" }}
      />
    );
  }
);

export default MapComponent;
