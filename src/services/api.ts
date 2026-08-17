import { User, Garment, Collection, Review, Message, PromotionPlan, AdminLog, CountryInfo } from '../types';

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
};

export const api = {
  // Upload to AWS S3 / Server
  async uploadImage(imageBase64: string, filename: string, folder = 'garments'): Promise<{ url: string; s3Key?: string }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, filename, folder }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  },

  // Location API proxy calls
  async getCountries(): Promise<CountryInfo[]> {
    const response = await fetch('/api/locations/countries');
    return handleResponse(response);
  },

  async getStates(countryCode: string): Promise<any[]> {
    const response = await fetch(`/api/locations/states/${countryCode}`);
    return handleResponse(response);
  },

  async getCities(countryCode: string, stateIso: string): Promise<any[]> {
    const response = await fetch(`/api/locations/cities/${countryCode}/${stateIso}`);
    return handleResponse(response);
  },

  async reverseGeocode(lat: number, lng: number): Promise<{ countryCode: string; city?: string }> {
    const response = await fetch(`/api/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
    return handleResponse(response);
  },


  // Auth
  async register(data: any): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Registration failed');
    return result;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Login failed');
    return result;
  },

  async updateProfile(data: any): Promise<{ user: User }> {
    const res = await fetch('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Profile update failed');
    return result;
  },

  // Tailors
  async getTailors(params: {
    country?: string;
    state?: string;
    city?: string;
    search?: string;
    tag?: string;
    promotedOnly?: boolean;
  } = {}): Promise<{ tailors: User[] }> {
    const query = new URLSearchParams();
    if (params.country) query.set('country', params.country);
    if (params.state) query.set('state', params.state);
    if (params.city) query.set('city', params.city);
    if (params.search) query.set('search', params.search);
    if (params.tag) query.set('tag', params.tag);
    if (params.promotedOnly) query.set('promotedOnly', 'true');

    const res = await fetch(`/api/tailors?${query.toString()}`);
    return res.json();
  },

  async getTailorDetails(id: string): Promise<{
    tailor: User;
    garments: Garment[];
    collections: Collection[];
    reviews: Review[];
  }> {
    const res = await fetch(`/api/tailors/${id}`);
    if (!res.ok) throw new Error('Tailor not found');
    return res.json();
  },

  // Garments
  async getGarments(params: {
    tag?: string;
    category?: string;
    gender?: string;
    search?: string;
    tailorId?: string;
    sort?: string;
  } = {}): Promise<{ garments: Garment[] }> {
    const query = new URLSearchParams();
    if (params.tag) query.set('tag', params.tag);
    if (params.category) query.set('category', params.category);
    if (params.gender) query.set('gender', params.gender);
    if (params.search) query.set('search', params.search);
    if (params.tailorId) query.set('tailorId', params.tailorId);
    if (params.sort) query.set('sort', params.sort);

    const res = await fetch(`/api/garments?${query.toString()}`);
    return res.json();
  },

  async createGarment(data: Partial<Garment>): Promise<{ garment: Garment }> {
    const res = await fetch('/api/garments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to create garment');
    return result;
  },

  async deleteGarment(id: string, requesterId: string, requesterRole: string): Promise<any> {
    const res = await fetch(`/api/garments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, requesterRole }),
    });
    return res.json();
  },

  async likeGarment(garmentId: string, increment: boolean): Promise<{ likesCount: number }> {
    const res = await fetch('/api/garments/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garmentId, increment }),
    });
    return res.json();
  },

  // Collections
  async createCollection(tailorId: string, title: string, description: string): Promise<{ collection: Collection }> {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, title, description }),
    });
    return res.json();
  },

  // Reviews
  async submitReview(data: {
    garmentId?: string;
    tailorId: string;
    customerId: string;
    rating: number;
    comment: string;
  }): Promise<{ review: Review; tailorRating: number }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to submit review');
    return result;
  },

  // Follow
  async toggleFollow(followerId: string, targetTailorId: string): Promise<{
    isFollowing: boolean;
    followersCount: number;
    followingIds: string[];
  }> {
    const res = await fetch('/api/followers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId, targetTailorId }),
    });
    return res.json();
  },

  // Messages
  async getMessages(userId: string, otherUserId?: string): Promise<{ messages: Message[] }> {
    const query = new URLSearchParams({ userId });
    if (otherUserId) query.set('otherUserId', otherUserId);
    const res = await fetch(`/api/messages?${query.toString()}`);
    return res.json();
  },

  async sendMessage(data: Partial<Message>): Promise<{ message: Message }> {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Promotion Plans
  async getPromotionPlans(): Promise<{ plans: PromotionPlan[] }> {
    const res = await fetch('/api/promotions');
    return res.json();
  },

  // Admin APIs
  async getAdminDashboard(): Promise<{
    stats: any;
    users: User[];
    garments: Garment[];
    logs: AdminLog[];
    plans: PromotionPlan[];
  }> {
    const res = await fetch('/api/admin/dashboard');
    return res.json();
  },

  async adminBlockTailor(tailorId: string, isBlocked: boolean, adminEmail: string) {
    const res = await fetch('/api/admin/tailors/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, isBlocked, adminEmail }),
    });
    return res.json();
  },

  async adminDeleteTailor(tailorId: string, adminEmail: string) {
    const res = await fetch('/api/admin/tailors/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, adminEmail }),
    });
    return res.json();
  },

  async adminPromoteTailor(tailorId: string, isPromoted: boolean, planName: string, adminEmail: string) {
    const res = await fetch('/api/admin/promote-tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, isPromoted, planName, adminEmail }),
    });
    return res.json();
  },

  async adminCreatePromotionPlan(data: Partial<PromotionPlan> & { adminEmail: string }) {
    const res = await fetch('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async adminAddAdmin(email: string, name: string, password: string, adminEmail: string) {
    const res = await fetch('/api/admin/add-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, adminEmail }),
    });
    return res.json();
  },
};
