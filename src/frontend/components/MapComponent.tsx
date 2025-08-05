import React, { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Place } from '../../types';

interface MapComponentProps {
  center: { lat: number; lng: number };
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

export default function MapComponent({ center, places, onPlaceSelect }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers();
    }
  }, [places]);

  const initializeMap = async () => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.VITE_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });

    try {
      await loader.load();
      
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom: 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      new google.maps.Marker({
        position: center,
        map,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
        title: '現在地',
      });

    } catch (error) {
      console.error('Google Maps initialization error:', error);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: mapInstanceRef.current,
        title: place.name,
        icon: {
          url: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#dc2626">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
        },
      });

      marker.addListener('click', () => {
        onPlaceSelect(place);
      });

      markersRef.current.push(marker);
    });
  };

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}