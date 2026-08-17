export type UserRole = 'tailor' | 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl: string;
  bio?: string;
  country: string;
  countryCode: string;
  phone: string;
  whatsappPhone?: string;
  state: string;
  city: string;
  streetAddress?: string;
  isBlocked?: boolean;
  isPromoted?: boolean;
  promotedUntil?: string;
  promotionPlanName?: string;
  ratingAverage: number;
  ratingCount: number;
  followersCount: number;
  followingIds?: string[]; // user IDs this user follows
  specialties?: string[]; // e.g. ["Agbada", "Senator", "Suits", "Bridal", "Embroidery"]
  pricingGuide?: {
    service: string;
    estimatedPrice: string;
    turnaround: string;
  }[];
  availability?: string; // e.g. "Mon - Sat: 9:00 AM - 7:00 PM"
  experienceYears?: number;
  createdAt: string;
}

export interface Garment {
  id: string;
  tailorId: string;
  tailorName: string;
  tailorAvatar: string;
  tailorCountry: string;
  tailorCity: string;
  tailorState: string;
  tailorPhone: string;
  tailorWhatsapp?: string;
  tailorIsPromoted?: boolean;
  title: string;
  description: string;
  tags: string[]; // e.g. ["agbada", "royal", "senator", "ankara", "wedding"]
  price: number;
  currency: string;
  category: string; // "Traditional", "Formal Suits", "Casual", "Bridal & Evening", "Ready-to-Wear", "Accessories"
  gender: 'Men' | 'Women' | 'Unisex' | 'Kids';
  fabricType?: string;
  turnaroundDays?: number;
  imageUrl: string;
  s3Key?: string;
  collectionId?: string;
  collectionName?: string;
  likesCount: number;
  viewsCount: number;
  ratingsCount: number;
  averageRating: number;
  createdAt: string;
}

export interface Collection {
  id: string;
  tailorId: string;
  title: string;
  description: string;
  bannerUrl?: string;
  itemCount: number;
  createdAt: string;
}

export interface Review {
  id: string;
  garmentId?: string;
  tailorId: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  rating: number; // 1 to 5
  comment: string;
  garmentTitle?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  recipientId: string; // specific user ID or "all" / "tailors" / "customers"
  recipientName?: string;
  text: string;
  garmentId?: string;
  garmentTitle?: string;
  garmentImage?: string;
  isAnnouncement?: boolean;
  targetAudience?: 'all' | 'tailors' | 'customers' | 'direct';
  read: boolean;
  createdAt: string;
}

export interface PromotionPlan {
  id: string;
  name: string;
  price: string;
  durationDays: number;
  description: string;
  perks: string[];
  isFeatured?: boolean;
  badgeLabel?: string;
  createdAt: string;
}

export interface CountryInfo {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  lat: number;
  lng: number;
}

export interface AdminLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
