import React, { useState, useEffect } from 'react';
import { Place, Review } from '../../types';
import { api } from '../utils/api';
import ReviewForm from './ReviewForm';
import ReviewList from './ReviewList';

interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
}

export default function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<any>(null);

  useEffect(() => {
    fetchPlaceDetails();
    fetchReviews();
  }, [place.place_id]);

  const fetchPlaceDetails = async () => {
    try {
      const details = await api.getPlaceDetails(place.place_id);
      setPlaceDetails(details);
    } catch (error) {
      console.error('Failed to fetch place details:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const placeReviews = await api.getPlaceReviews(place.place_id);
      setReviews(placeReviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (reviewData: any) => {
    try {
      await api.createReview({
        place_id: place.place_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      
      if (reviewData.images && reviewData.images.length > 0) {
        for (const image of reviewData.images) {
          await api.uploadReviewImage(reviewData.id, image);
        }
      }
      
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'レビューの投稿に失敗しました');
    }
  };

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{place.name}</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>住所:</strong> {placeDetails?.formatted_address || place.vicinity}
          </div>
          
          {placeDetails?.formatted_phone_number && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>電話:</strong> {placeDetails.formatted_phone_number}
            </div>
          )}

          {place.rating && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Google評価:</strong> ★ {place.rating.toFixed(1)}
            </div>
          )}

          {reviews.length > 0 && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>アプリ評価:</strong> ★ {avgRating.toFixed(1)} ({reviews.length}件)
            </div>
          )}

          {place.opening_hours?.open_now !== undefined && (
            <div style={{ 
              marginBottom: '0.5rem',
              color: place.opening_hours.open_now ? '#059669' : '#dc2626',
              fontWeight: '600'
            }}>
              {place.opening_hours.open_now ? '営業中' : '営業時間外'}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="button button-primary"
            style={{ width: '100%' }}
          >
            {showReviewForm ? 'キャンセル' : 'レビューを書く'}
          </button>
        </div>

        {showReviewForm && (
          <div style={{ marginBottom: '1.5rem' }}>
            <ReviewForm onSubmit={handleReviewSubmit} />
          </div>
        )}

        <div>
          <h3 style={{ marginBottom: '1rem' }}>レビュー ({reviews.length})</h3>
          {loading ? (
            <div className="loading">読み込み中...</div>
          ) : (
            <ReviewList reviews={reviews} />
          )}
        </div>
      </div>
    </div>
  );
}