export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  place_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
  images?: ReviewImage[];
}

export interface ReviewImage {
  id: string;
  review_id: string;
  image_url: string;
  filename: string;
  created_at: string;
}

export interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  price_level?: number;
  opening_hours?: {
    open_now: boolean;
  };
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
  }>;
}

export interface NearbySearchRequest {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
  keyword?: string;
  open_now?: boolean;
}

export interface ReviewRequest {
  place_id: string;
  rating: number;
  comment?: string;
  images?: File[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
}