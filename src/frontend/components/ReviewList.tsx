import React, { useState } from 'react';
import { Review } from '../../types';

interface ReviewListProps {
  reviews: Review[];
}

export default function ReviewList({ reviews }: ReviewListProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (reviews.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
        まだレビューがありません
      </div>
    );
  }

  const closeImageModal = () => setSelectedImage(null);

  return (
    <>
      <div>
        {reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              {review.user?.avatar_url && (
                <img
                  src={review.user.avatar_url}
                  alt={review.user.name}
                  className="review-avatar"
                />
              )}
              <div style={{ flex: 1 }}>
                <div className="review-author">
                  {review.user?.name || '匿名ユーザー'}
                </div>
                <div className="review-date">
                  {new Date(review.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </div>

            <div className="review-rating">
              {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
            </div>

            {review.comment && (
              <div className="review-comment">
                {review.comment}
              </div>
            )}

            {review.images && review.images.length > 0 && (
              <div className="image-gallery">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image.image_url}
                    alt="レビュー画像"
                    className="image-thumbnail"
                    onClick={() => setSelectedImage(image.image_url)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="modal-overlay" onClick={closeImageModal}>
          <div 
            style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              maxWidth: '90vw',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
              <button onClick={closeImageModal} className="close-button">×</button>
            </div>
            <img
              src={selectedImage}
              alt="拡大画像"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}