import React, { useState, useEffect } from 'react';
import { useLocation } from '../hooks/useLocation';
import MapComponent from '../components/MapComponent';
import PlaceList from '../components/PlaceList';
import PlaceDetailModal from '../components/PlaceDetailModal';
import { api } from '../utils/api';
import { Place } from '../../types';

export default function MapPage() {
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const searchPlaces = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.searchNearbyPlaces({
        lat: location.lat,
        lng: location.lng,
        radius: 1000,
        open_now: openNowOnly,
      });

      setPlaces((response as any).results || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : '店舗の検索に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      searchPlaces();
    }
  }, [location, openNowOnly]);

  if (locationLoading) {
    return (
      <div className="loading">
        <div>位置情報を取得中...</div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="error">
        <div>{locationError}</div>
        <button onClick={() => window.location.reload()}>再試行</button>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="error">
        <div>位置情報が必要です</div>
      </div>
    );
  }

  return (
    <>
      <div className="filter-container">
        <div className="filter-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={openNowOnly}
              onChange={(e) => setOpenNowOnly(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span>営業中のみ表示</span>
        </div>
      </div>

      <div className="map-container">
        <MapComponent
          center={location}
          places={places}
          onPlaceSelect={setSelectedPlace}
        />
      </div>

      <div className="place-list">
        {loading && (
          <div className="loading">
            <div>店舗を検索中...</div>
          </div>
        )}
        
        {error && (
          <div className="error">
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && (
          <PlaceList
            places={places}
            onPlaceSelect={setSelectedPlace}
          />
        )}
      </div>

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </>
  );
}