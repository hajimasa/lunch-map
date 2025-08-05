import { NearbySearchRequest, ReviewRequest, Review } from '../../types';

const API_BASE = '/api';

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: any = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export const api = {
  // Places API
  searchNearbyPlaces: async (params: NearbySearchRequest) => {
    const searchParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
      ...(params.radius && { radius: params.radius.toString() }),
      ...(params.open_now && { open_now: 'true' }),
    });
    
    return apiRequest(`/places/nearby?${searchParams}`);
  },

  getPlaceDetails: async (placeId: string) => {
    return apiRequest(`/places/details/${placeId}`);
  },

  // Reviews API
  getPlaceReviews: async (placeId: string): Promise<Review[]> => {
    return apiRequest(`/reviews/places/${placeId}`) as Promise<Review[]>;
  },

  createReview: async (review: ReviewRequest) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(review),
    });
  },

  updateReview: async (id: string, review: Partial<ReviewRequest>) => {
    return apiRequest(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(review),
    });
  },

  deleteReview: async (id: string) => {
    return apiRequest(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },

  uploadReviewImage: async (reviewId: string, image: File) => {
    const formData = new FormData();
    formData.append('image', image);

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/reviews/${reviewId}/images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Image upload failed');
    }

    return response.json();
  },

  // User API
  getUserProfile: async () => {
    return apiRequest('/user/profile');
  },

  getUserReviews: async () => {
    return apiRequest('/user/reviews');
  },
};