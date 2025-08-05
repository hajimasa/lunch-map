import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Review } from '../../types';

export default function MyPage() {
  const { user, logout } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserReviews();
  }, []);

  const fetchUserReviews = async () => {
    try {
      const userReviews = await api.getUserReviews() as Review[];
      setReviews(userReviews);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'レビューの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('このレビューを削除しますか？')) {
      return;
    }

    try {
      await api.deleteReview(reviewId);
      setReviews(reviews.filter(review => review.id !== reviewId));
    } catch (error) {
      alert('レビューの削除に失敗しました');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <img src={user.avatar_url} alt={user.name} style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{user.name}</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>{user.email}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{reviews.length}</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>投稿数</div>
          </div>
        </div>
        <button onClick={logout} className="button button-secondary">
          ログアウト
        </button>
      </div>

      <div>
        <h3 style={{ marginBottom: '1rem' }}>投稿履歴</h3>
        
        {loading && (
          <div className="loading">
            <div>読み込み中...</div>
          </div>
        )}

        {error && (
          <div className="error">
            <div>{error}</div>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            まだレビューがありません
          </div>
        )}

        {!loading && !error && reviews.map((review) => (
          <div key={review.id} className="review-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  店舗ID: {review.place_id}
                </div>
                <div className="review-rating">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
              </div>
              <button
                onClick={() => handleDeleteReview(review.id)}
                style={{
                  background: 'none',
                  border: '1px solid #dc2626',
                  color: '#dc2626',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                削除
              </button>
            </div>
            
            {review.comment && (
              <div className="review-comment" style={{ marginBottom: '0.5rem' }}>
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
                  />
                ))}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {new Date(review.created_at).toLocaleDateString('ja-JP')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}