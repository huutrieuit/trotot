export type RoomType = "phong_tro" | "chung_cu" | "nha_nguyen_can" | "homestay";
export type ListingStatus = "pending" | "active" | "rented" | "hidden";
export type District = string; // defined per-city in src/config/cities.ts

/** Nguồn gốc tin đăng */
export type ListingSource =
  | "landlord"  // Chủ nhà tự đăng
  | "admin"     // Admin đăng thay (lấy từ FB, khảo sát thực địa, ...)
  | "claimed";  // Admin đăng → chủ nhà đã nhận về tài khoản

export interface Amenities {
  wifi: boolean;
  ac: boolean;
  washer: boolean;
  parking: boolean;
  security: boolean;
  elevator: boolean;
  kitchen: boolean;
  balcony: boolean;
  pet: boolean;
}

export interface Listing {
  id: string;
  landlord_id: string;
  city: string; // city slug, e.g. "da-nang"
  source: ListingSource;
  source_note?: string;  // ghi chú nguồn: "Lấy từ group FB Thuê trọ Đà Nẵng"
  source_url?: string;   // link gốc nếu có
  title: string;
  description: string;
  address: string;
  district: District;
  lat: number;
  lng: number;
  price: number;
  area: number;
  room_type: RoomType;
  max_occupants: number;
  gender_preference: "all" | "male" | "female";
  amenities: Amenities;
  status: ListingStatus;
  contact_phone: string;
  contact_phone2?: string;
  view_count: number;
  contact_count: number;
  created_at: string;
  images: ListingImage[];
  landlord?: LandlordProfile;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  order: number;
}

export interface LandlordProfile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone: string;
  verified_phone: boolean;
  verified_id: boolean;
}

export interface SearchFilters {
  district?: District;
  room_type?: RoomType;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  amenities?: Partial<Amenities>;
  gender_preference?: "all" | "male" | "female";
}

export type SortOption = "newest" | "price_asc" | "price_desc" | "popular";
