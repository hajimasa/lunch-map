import React, { useState } from 'react';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment: string; images: File[] }) => void;
}

export default function ReviewForm({ onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('評価を選択してください');
      return;
    }

    onSubmit({ rating, comment, images });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} のサイズが大きすぎます（最大5MB）`);
        return false;
      }
      
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} は対応していないファイル形式です`);
        return false;
      }
      
      return true;
    });

    if (images.length + validFiles.length > 5) {
      alert('画像は最大5枚まで選択できます');
      return;
    }

    setImages([...images, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="review-form">
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          評価 *
        </label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          コメント
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="店舗の感想を書いてください（任意）"
          className="textarea"
        />
      </div>

      <div>
        <label htmlFor="images" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          画像 (最大5枚)
        </label>
        <input
          type="file"
          id="images"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageChange}
          className="file-input"
        />
        
        {images.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {images.map((image, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`プレビュー ${index + 1}`}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '0.25rem'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-5px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="submit" className="button button-primary">
        レビューを投稿
      </button>
    </form>
  );
}