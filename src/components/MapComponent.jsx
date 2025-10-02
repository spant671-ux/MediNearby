import React, { useEffect, useRef } from 'react';

export default function MapComponent({ doctors, selectedDoctor, userLocation }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
    script.async = true;
    script.onload = () => initMap();
    document.body.appendChild(script);

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && doctors.length > 0) updateMarkers();
  }, [doctors, selectedDoctor]);

  useEffect(() => {
    if (mapInstanceRef.current && selectedDoctor) {
      mapInstanceRef.current.setView([selectedDoctor.lat, selectedDoctor.lng], 15);
      const marker = markersRef.current.find(m => m.options.doctorId === selectedDoctor.id);
      if (marker) marker.openPopup();
    }
  }, [selectedDoctor]);

  const initMap = () => {
    if (!window.L || mapInstanceRef.current) return;

    const map = window.L.map(mapRef.current).setView(userLocation || [27.1767, 78.0081], 13);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    if (userLocation) {
      window.L.marker(userLocation, {
        icon: window.L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white;"></div>',
          iconSize: [20, 20]
        })
      }).addTo(map).bindPopup('Your Location');
    }

    mapInstanceRef.current = map;
    updateMarkers();
  };

  const updateMarkers = () => {
    if (!window.L || !mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

  doctors.forEach(doctor => {
  const isSelected = selectedDoctor?.id === doctor.id;
  const marker = window.L.marker([doctor.lat, doctor.lng], {
    doctorId: doctor.id,
    icon: window.L.divIcon({
      className: 'doctor-marker',
      html: `<div style="background-color: ${isSelected ? '#ef4444' : '#10b981'}; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white;"></div>`,
      iconSize: [12, 12]
    })
  }).addTo(mapInstanceRef.current);

  marker.bindPopup(`<b>${doctor.name}</b><br>${doctor.specialty}<br>${doctor.clinic}`);

  // ✅ Open Google Maps on marker click
  marker.on('click', () => {
    const url = `https://www.google.com/maps?q=${doctor.lat},${doctor.lng}`;
    window.open(url, "_blank");
  });

  markersRef.current.push(marker);
});

  };

  return <div ref={mapRef} className="w-full h-full rounded-xl shadow-lg" style={{ minHeight: '500px' }} />;
}
