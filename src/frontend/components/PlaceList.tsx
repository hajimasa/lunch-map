import React from 'react';
import { Place } from '../../types';

interface PlaceListProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
}

export default function PlaceList({ places, onPlaceSelect }: PlaceListProps) {
  if (places.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        店舗が見つかりませんでした
      </div>
    );
  }

  return (
    <div>
      {places.map((place) => (
        <div
          key={place.place_id}
          className="place-item"
          onClick={() => onPlaceSelect(place)}
        >
          <div className="place-name">{place.name}</div>
          <div className="place-address">{place.vicinity}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {place.rating && (
              <div className="place-rating">
                ★ {place.rating.toFixed(1)}
              </div>
            )}
            {place.opening_hours?.open_now !== undefined && (
              <div style={{ 
                fontSize: '0.75rem',
                color: place.opening_hours.open_now ? '#059669' : '#dc2626',
                fontWeight: '600'
              }}>
                {place.opening_hours.open_now ? '営業中' : '営業時間外'}
              </div>
            )}
          </div>
          {place.price_level && (
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              価格帯: {'¥'.repeat(place.price_level)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}