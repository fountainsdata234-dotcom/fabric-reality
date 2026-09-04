import { User, Garment, Collection, Review, Message, PromotionPlan, AdminLog, CountryInfo } from '../types';
import { COUNTRIES } from '../data/countries';
import { getStaticStates, getStaticCities } from '../data/locationData';

// --- Local Client Storage Database Keys ---
const CLIENT_DB_KEY = 'fabric_reality_client_db';

interface ClientDbSchema {
  users: User[];
  garments: Garment[];
  collections: Collection[];
  reviews: Review[];
  messages: Message[];
  promotionPlans: PromotionPlan[];
  adminLogs: AdminLog[];
}

function getInitialClientDb(): ClientDbSchema {
  const defaultAdmin: User = {
    id: 'admin_super_1',
    email: 'fountainsdata234@gmail.com',
    name: 'Super Admin',
    role: 'admin',
    avatarUrl: '',
    country: 'Nigeria',
    countryCode: 'NG',
    phone: '+2348029772375',
    whatsappPhone: '+2348029772375',
    state: 'Lagos',
    city: 'Lagos',
    ratingAverage: 5.0,
    ratingCount: 0,
    followersCount: 0,
    createdAt: new Date().toISOString(),
  };

  const defaultPlans: PromotionPlan[] = [
    {
      id: 'plan_starter',
      name: 'Starter Visibility Booster',
      price: '₦15,000 / $15 (30 Days)',
      durationDays: 30,
      description: 'Ideal for emerging tailors looking to get discovered in local city searches.',
      perks: [
        'Promoted Gold Badge on Profile & Clothes',
        '2x Search Frequency Boost',
        'Direct WhatsApp Inquiry Link',
        'Featured in Category Listings'
      ],
      isFeatured: false,
      badgeLabel: 'VERIFIED PRO',
      createdAt: new Date().toISOString()
    },
    {
      id: 'plan_gold',
      name: 'Spotlight Gold Tier',
      price: '₦35,000 / $35 (30 Days)',
      durationDays: 30,
      description: 'The standard for busy fashion houses. Guaranteed top carousel placement.',
      perks: [
        'Top Homepage Hero Carousel Feature',
        '5x Search Algorithm Boost in Area',
        'Interactive Map Top Pin with Gold Halo',
        'Highlighted In-App Message Alerts',
        'Social Proof & Promotion Ribbon'
      ],
      isFeatured: true,
      badgeLabel: 'FEATURED MASTER',
      createdAt: new Date().toISOString()
    },
    {
      id: 'plan_royal',
      name: 'Royal Haute Couture Elite',
      price: '₦70,000 / $70 (60 Days)',
      durationDays: 60,
      description: 'Ultimate visibility across international searches for high-ticket bespoke clients.',
      perks: [
        'Permanent Landing & Homepage Spotlight',
        'Global Tag Ranking (#1 on Agbada, Suits, Bridal)',
        'Dedicated WhatsApp VIP Lead Concierge (08029772375)',
        'Unlimited Collections & High-Res AWS S3 Gallery',
        'Custom Admin Verified Checkmark'
      ],
      isFeatured: false,
      badgeLabel: 'ROYAL ELITE',
      createdAt: new Date().toISOString()
    }
  ];

  const defaultTailors: User[] = [
    {
      id: 'tailor_royal_1',
      email: 'royalbespoke@fabricreality.com',
      name: 'Royal Heritage Bespoke',
      role: 'tailor',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      country: 'Nigeria',
      countryCode: 'NG',
      phone: '+234 802 977 2375',
      whatsappPhone: '+234 802 977 2375',
      state: 'Lagos',
      city: 'Victoria Island',
      streetAddress: '14 Fashion Avenue',
      specialties: ['agbada', 'senator', 'suits', 'bridal'],
      bio: 'Master tailor with over 15 years experience crafting luxury Agbada, Senator suits, and bespoke tuxedo fits.',
      availability: 'Mon - Sat: 8:00 AM - 7:00 PM',
      ratingAverage: 4.9,
      ratingCount: 28,
      followersCount: 142,
      isPromoted: true,
      promotionPlanName: 'Spotlight Gold Tier',
      createdAt: new Date().toISOString()
    },
    {
      id: 'tailor_accra_1',
      email: 'accrastyle@fabricreality.com',
      name: 'Accra Contemporary Cuts',
      role: 'tailor',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      country: 'Ghana',
      countryCode: 'GH',
      phone: '+233 24 123 4567',
      whatsappPhone: '+233 24 123 4567',
      state: 'Greater Accra',
      city: 'East Legon',
      streetAddress: '8 Osu Crescent',
      specialties: ['streetwear', 'ready-to-wear', 'ankara'],
      bio: 'Pioneering Afro-contemporary streetwear, luxury jackets, and modern fusion styling.',
      availability: 'Mon - Fri: 9:00 AM - 6:00 PM',
      ratingAverage: 4.8,
      ratingCount: 19,
      followersCount: 96,
      isPromoted: true,
      promotionPlanName: 'Starter Visibility Booster',
      createdAt: new Date().toISOString()
    }
  ];

  return {
    users: [defaultAdmin, ...defaultTailors],
    garments: [
      {
        id: 'garment_demo_1',
        tailorId: 'tailor_royal_1',
        tailorName: 'Royal Heritage Bespoke',
        tailorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        tailorCountry: 'Nigeria',
        tailorState: 'Lagos',
        tailorCity: 'Victoria Island',
        tailorPhone: '+234 802 977 2375',
        tailorWhatsapp: '+234 802 977 2375',
        title: 'Imperial Hand-Embroidered Grand Agbada',
        description: '4-piece bespoke royal Agbada crafted with heavyweight Swiss damask fabric and gold threading.',
        category: 'Traditional',
        gender: 'Men',
        tags: ['agbada', 'embroidery', 'luxury', 'senator'],
        price: 180000,
        currency: 'NGN',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
        likesCount: 64,
        viewsCount: 240,
        ratingsCount: 14,
        averageRating: 4.9,
        createdAt: new Date().toISOString()
      },
      {
        id: 'garment_demo_2',
        tailorId: 'tailor_accra_1',
        tailorName: 'Accra Contemporary Cuts',
        tailorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
        tailorCountry: 'Ghana',
        tailorState: 'Greater Accra',
        tailorCity: 'East Legon',
        tailorPhone: '+233 24 123 4567',
        tailorWhatsapp: '+233 24 123 4567',
        title: 'Urban Afro-Fusion Bomber Jacket',
        description: 'Handwoven Ankara print sleeves with premium waterproof outer layer and tailored cuffs.',
        category: 'Streetwear & Urban Contemporary',
        gender: 'Unisex',
        tags: ['streetwear', 'ankara', 'bomber', 'ready-to-wear'],
        price: 850,
        currency: 'GHS',
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
        likesCount: 42,
        viewsCount: 156,
        ratingsCount: 8,
        averageRating: 4.8,
        createdAt: new Date().toISOString()
      }
    ],
    collections: [
      {
        id: 'col_royal_1',
        tailorId: 'tailor_royal_1',
        title: 'Monarch Agbada 2026 Collection',
        description: 'Ceremonial fits designed for weddings and VIP summits.',
        itemCount: 1,
        createdAt: new Date().toISOString()
      }
    ],
    reviews: [
      {
        id: 'rev_1',
        tailorId: 'tailor_royal_1',
        garmentId: 'garment_demo_1',
        customerId: 'admin_super_1',
        customerName: 'Obamhi A.',
        customerAvatar: '',
        rating: 5,
        comment: 'Outstanding quality and exact measurements delivered right on schedule for my event!',
        createdAt: new Date().toISOString()
      }
    ],
    messages: [
      {
        id: 'msg_welcome',
        senderId: 'admin_super_1',
        senderName: 'Fabric Reality Admin',
        senderRole: 'admin',
        senderAvatar: '',
        recipientId: 'all',
        text: 'Welcome to Fabric Reality! Discover master bespoke tailors, explore authentic designs, and connect directly on WhatsApp & in-app chat.',
        isAnnouncement: true,
        targetAudience: 'all',
        read: false,
        createdAt: new Date().toISOString()
      }
    ],
    promotionPlans: defaultPlans,
    adminLogs: [
      {
        id: 'log_init',
        adminEmail: 'fountainsdata234@gmail.com',
        action: 'SYSTEM_INITIALIZED',
        target: 'Fabric Reality Core',
        details: 'Admin portal and storage initialized.',
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function loadClientDb(): ClientDbSchema {
  try {
    const raw = localStorage.getItem(CLIENT_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not read client db from localStorage:', e);
  }
  const initial = getInitialClientDb();
  saveClientDb(initial);
  return initial;
}

function saveClientDb(db: ClientDbSchema) {
  try {
    localStorage.setItem(CLIENT_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Could not save client db to localStorage:', e);
  }
}

/**
 * Helper to safely make API calls with fallback to client-side storage
 */
async function safeFetch<T>(url: string, options?: RequestInit): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, error: `Server returned non-JSON (${res.status})` };
    }
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }
    return { ok: true, data };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Network request failed' };
  }
}

export const api = {
  // Upload to AWS S3 / Server with Local Base64 Fallback
  async uploadImage(imageBase64: string, filename: string, folder = 'garments'): Promise<{ url: string; s3Key?: string }> {
    const res = await safeFetch<{ url: string; s3Key?: string }>('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, filename, folder }),
    });

    if (res.ok && res.data?.url) {
      return res.data;
    }

    // Fallback: Use base64 data-URL directly so uploads never fail on static hosting
    return {
      url: imageBase64,
      s3Key: `local_${Date.now()}_${filename}`
    };
  },

  // Location API proxy calls with Instant Static Fallback
  async getCountries(): Promise<CountryInfo[]> {
    const res = await safeFetch<CountryInfo[]>('/api/locations/countries');
    if (res.ok && res.data && res.data.length > 0) {
      return res.data;
    }
    return COUNTRIES;
  },

  async getStates(countryCode: string): Promise<{ name: string; iso2: string }[]> {
    const res = await safeFetch<{ name: string; iso2: string }[]>(`/api/locations/states/${countryCode}`);
    if (res.ok && res.data && res.data.length > 0) {
      return res.data;
    }
    return getStaticStates(countryCode).map(s => ({ name: s.name, iso2: s.iso2 }));
  },

  async getCities(countryCode: string, stateIso: string): Promise<{ name: string }[]> {
    const res = await safeFetch<{ name: string }[]>(`/api/locations/cities/${countryCode}/${stateIso}`);
    if (res.ok && res.data && res.data.length > 0) {
      return res.data;
    }
    return getStaticCities(countryCode, stateIso).map(name => ({ name }));
  },

  async reverseGeocode(lat: number, lng: number): Promise<{ countryCode: string; city?: string }> {
    try {
      const res = await safeFetch<{ countryCode: string; city?: string }>(`/api/locations/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res.ok && res.data?.countryCode) {
        return res.data;
      }
      // Public fallback
      const direct = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      if (direct.ok) {
        const geo = await direct.json();
        return { countryCode: geo.countryCode || 'NG', city: geo.city || geo.locality || '' };
      }
    } catch {
      // ignore
    }
    return { countryCode: 'NG', city: 'Lagos' };
  },

  // Auth - Hybrid Live / Offline LocalStorage
  async register(data: any): Promise<{ user: User; token: string }> {
    const res = await safeFetch<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.user) {
      return res.data;
    }

    // Client-side LocalStorage registration fallback
    const db = loadClientDb();
    const cleanEmail = (data.email || '').trim().toLowerCase();

    const existing = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      name: data.name || 'User',
      role: data.role || 'customer',
      country: data.country || 'Nigeria',
      countryCode: data.countryCode || 'NG',
      phone: data.phone || '',
      whatsappPhone: data.whatsappPhone || data.phone || '',
      state: data.state || 'Lagos',
      city: data.city || 'Ikeja',
      streetAddress: data.streetAddress || '',
      specialties: data.specialties || [],
      bio: data.bio || '',
      avatarUrl: data.avatarUrl || '',
      availability: data.availability || 'Mon - Sat: 9:00 AM - 7:00 PM',
      ratingAverage: 5.0,
      ratingCount: 0,
      followersCount: 0,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    saveClientDb(db);

    const token = `token_client_${Date.now()}`;
    return { user: newUser, token };
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await safeFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok && res.data?.user) {
      return res.data;
    }

    // Client-side LocalStorage login fallback
    const db = loadClientDb();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Built-in Super Admin Credentials Check
    if ((cleanEmail === 'fountainsdata234@gmail.com' || cleanEmail === 'admin') && (password === 'Obamhi234' || password === 'admin')) {
      let admin = db.users.find(u => u.email.toLowerCase() === 'fountainsdata234@gmail.com');
      if (!admin) {
        admin = {
          id: 'admin_super_1',
          email: 'fountainsdata234@gmail.com',
          name: 'Super Admin',
          role: 'admin',
          avatarUrl: '',
          country: 'Nigeria',
          countryCode: 'NG',
          phone: '+2348029772375',
          whatsappPhone: '+2348029772375',
          state: 'Lagos',
          city: 'Lagos',
          ratingAverage: 5.0,
          ratingCount: 0,
          followersCount: 0,
          createdAt: new Date().toISOString()
        };
        db.users.push(admin);
        saveClientDb(db);
      }
      return { user: admin, token: `token_admin_${Date.now()}` };
    }

    const user = db.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      throw new Error('Account not found with this email. Please check or register.');
    }

    // BLOCK ENFORCEMENT: Blocked tailor cannot log in
    if (user.isBlocked) {
      throw new Error('Your account has been suspended by administration. Please contact support at 08029772375.');
    }

    return { user, token: `token_user_${Date.now()}` };
  },

  async updateProfile(data: any): Promise<{ user: User }> {
    const res = await safeFetch<{ user: User }>('/api/users/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.user) {
      return res.data;
    }

    const db = loadClientDb();
    const idx = db.users.findIndex(u => u.id === data.id || u.email === data.email);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...data };
      saveClientDb(db);
      return { user: db.users[idx] };
    }
    throw new Error('Profile update failed');
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

    const res = await safeFetch<{ tailors: User[] }>(`/api/tailors?${query.toString()}`);
    if (res.ok && res.data?.tailors) {
      return res.data;
    }

    const db = loadClientDb();
    let tailors = db.users.filter(u => u.role === 'tailor' && !u.isBlocked);

    if (params.country) {
      tailors = tailors.filter(t => t.country.toLowerCase() === params.country!.toLowerCase() || t.countryCode?.toLowerCase() === params.country!.toLowerCase());
    }
    if (params.state) {
      tailors = tailors.filter(t => t.state.toLowerCase().includes(params.state!.toLowerCase()));
    }
    if (params.city) {
      tailors = tailors.filter(t => t.city.toLowerCase().includes(params.city!.toLowerCase()));
    }
    if (params.tag) {
      tailors = tailors.filter(t => t.specialties?.some(s => s.toLowerCase() === params.tag!.toLowerCase()));
    }
    if (params.promotedOnly) {
      tailors = tailors.filter(t => t.isPromoted);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      tailors = tailors.filter(t => t.name.toLowerCase().includes(q) || t.bio?.toLowerCase().includes(q));
    }

    return { tailors };
  },

  async getTailorDetails(id: string): Promise<{
    tailor: User;
    garments: Garment[];
    collections: Collection[];
    reviews: Review[];
  }> {
    const res = await safeFetch<any>(`/api/tailors/${id}`);
    if (res.ok && res.data?.tailor) {
      return res.data;
    }

    const db = loadClientDb();
    const tailor = db.users.find(u => u.id === id);
    if (!tailor) throw new Error('Tailor not found');

    const garments = db.garments.filter(g => g.tailorId === id);
    const collections = db.collections.filter(c => c.tailorId === id);
    const reviews = db.reviews.filter(r => r.tailorId === id);

    return { tailor, garments, collections, reviews };
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

    const res = await safeFetch<{ garments: Garment[] }>(`/api/garments?${query.toString()}`);
    if (res.ok && res.data?.garments) {
      // Merge server-side garments with any local client-side garments
      // (helps when the app is using a localStorage fallback for new posts)
      try {
        const db = loadClientDb();
        const serverGarments = res.data.garments || [];
        const merged: Garment[] = [...serverGarments];
        for (const localG of db.garments) {
          if (!merged.find((g) => g.id === localG.id)) {
            merged.unshift(localG);
          }
        }
        return { garments: merged };
      } catch (e) {
        return res.data;
      }
    }

    const db = loadClientDb();
    let garments = [...db.garments];

    if (params.tailorId) {
      garments = garments.filter(g => g.tailorId === params.tailorId);
    }
    if (params.tag) {
      garments = garments.filter(g => g.tags?.some(t => t.toLowerCase() === params.tag!.toLowerCase()));
    }
    if (params.category && params.category !== 'All Categories') {
      garments = garments.filter(g => g.category === params.category);
    }
    if (params.gender && params.gender !== 'all') {
      garments = garments.filter(g => g.gender.toLowerCase() === params.gender!.toLowerCase());
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      garments = garments.filter(g => g.title.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q));
    }

    return { garments };
  },

  async createGarment(data: Partial<Garment>): Promise<{ garment: Garment }> {
    const res = await safeFetch<{ garment: Garment }>('/api/garments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.garment) {
      return res.data;
    }

    const db = loadClientDb();
    const tailor = db.users.find(u => u.id === (data.tailorId || 'unknown'));

    // BLOCK ENFORCEMENT: Blocked tailor cannot post garments
    if (tailor?.isBlocked) {
      throw new Error('Your account has been suspended. You cannot post new garments. Contact support at 08029772375.');
    }

    const newGarment: Garment = {
      id: `garm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tailorId: data.tailorId || 'unknown',
      tailorName: data.tailorName || 'Tailor',
      tailorAvatar: data.tailorAvatar || '',
      tailorCountry: data.tailorCountry || 'Nigeria',
      tailorState: data.tailorState || 'Lagos',
      tailorCity: data.tailorCity || 'Ikeja',
      tailorPhone: data.tailorPhone || '',
      tailorWhatsapp: data.tailorWhatsapp || '',
      title: data.title || 'Custom Bespoke Creation',
      description: data.description || '',
      category: data.category || 'Ready-to-Wear & Everyday Luxe',
      gender: data.gender || 'Unisex',
      tags: data.tags || [],
      price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
      currency: data.currency || 'NGN',
      imageUrl: data.imageUrl || '',
      likesCount: 0,
      viewsCount: 0,
      ratingsCount: 0,
      averageRating: 5.0,
      createdAt: new Date().toISOString()
    };

    db.garments.unshift(newGarment);
    saveClientDb(db);
    return { garment: newGarment };
  },

  async deleteGarment(id: string, requesterId: string, requesterRole: string): Promise<any> {
    const res = await safeFetch(`/api/garments/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterId, requesterRole }),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    db.garments = db.garments.filter(g => g.id !== id);
    saveClientDb(db);
    return { success: true };
  },

  async likeGarment(garmentId: string, increment: boolean): Promise<{ likesCount: number }> {
    const res = await safeFetch<{ likesCount: number }>('/api/garments/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ garmentId, increment }),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    const db = loadClientDb();
    const g = db.garments.find(item => item.id === garmentId);
    if (g) {
      g.likesCount = Math.max(0, (g.likesCount || 0) + (increment ? 1 : -1));
      saveClientDb(db);
      return { likesCount: g.likesCount };
    }
    return { likesCount: 0 };
  },

  // Collections
  async createCollection(tailorId: string, title: string, description: string): Promise<{ collection: Collection }> {
    const res = await safeFetch<{ collection: Collection }>('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, title, description }),
    });

    if (res.ok && res.data?.collection) {
      return res.data;
    }

    const db = loadClientDb();

    // BLOCK ENFORCEMENT: Blocked tailor cannot create collections
    const collectionOwner = db.users.find(u => u.id === tailorId);
    if (collectionOwner?.isBlocked) {
      throw new Error('Your account has been suspended. You cannot create collections. Contact support at 08029772375.');
    }

    const newCol: Collection = {
      id: `col_${Date.now()}`,
      tailorId,
      title,
      description,
      itemCount: 0,
      createdAt: new Date().toISOString()
    };
    db.collections.push(newCol);
    saveClientDb(db);
    return { collection: newCol };
  },

  // Reviews
  async submitReview(data: {
    garmentId?: string;
    tailorId: string;
    customerId: string;
    rating: number;
    comment: string;
  }): Promise<{ review: Review; tailorRating: number }> {
    const res = await safeFetch<{ review: Review; tailorRating: number }>('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.review) {
      return res.data;
    }

    const db = loadClientDb();
    const customer = db.users.find(u => u.id === data.customerId);
    const newReview: Review = {
      id: `rev_${Date.now()}`,
      tailorId: data.tailorId,
      garmentId: data.garmentId,
      customerId: data.customerId,
      customerName: customer?.name || 'Customer',
      customerAvatar: customer?.avatarUrl || '',
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString()
    };

    db.reviews.unshift(newReview);

    // Update tailor rating
    const tailorReviews = db.reviews.filter(r => r.tailorId === data.tailorId);
    const avg = tailorReviews.reduce((acc, r) => acc + r.rating, 0) / tailorReviews.length;
    const tailor = db.users.find(u => u.id === data.tailorId);
    if (tailor) {
      tailor.ratingAverage = Number(avg.toFixed(1));
      tailor.ratingCount = tailorReviews.length;
    }

    saveClientDb(db);
    return { review: newReview, tailorRating: Number(avg.toFixed(1)) };
  },

  // Follow
  async toggleFollow(followerId: string, targetTailorId: string): Promise<any> {
    const res = await safeFetch<any>('/api/followers/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ followerId, targetTailorId }),
    });

    if (res.ok && res.data) {
      return res.data;
    }

    const db = loadClientDb();
    const tailor = db.users.find(u => u.id === targetTailorId);
    let count = tailor?.followersCount || 0;
    count = Math.max(0, count + 1);
    if (tailor) {
      tailor.followersCount = count;
    }
    saveClientDb(db);
    return { isFollowing: true, followersCount: count, followingIds: [targetTailorId] };
  },

  // Messages
  async getMessages(userId: string, otherUserId?: string): Promise<{ messages: Message[] }> {
    const query = new URLSearchParams({ userId });
    if (otherUserId) query.set('otherUserId', otherUserId);

    const res = await safeFetch<{ messages: Message[] }>(`/api/messages?${query.toString()}`);
    if (res.ok && res.data?.messages) {
      return res.data;
    }

    const db = loadClientDb();
    const messages = db.messages.filter(
      m => m.recipientId === 'all' ||
           m.recipientId === userId ||
           m.senderId === userId ||
           (otherUserId && (m.senderId === otherUserId || m.recipientId === otherUserId))
    );
    return { messages };
  },

  async sendMessage(data: Partial<Message>): Promise<{ message: Message }> {
    const res = await safeFetch<{ message: Message }>('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok && res.data?.message) {
      return res.data;
    }

    const db = loadClientDb();
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      senderId: data.senderId || 'anon',
      senderName: data.senderName || 'Sender',
      senderRole: data.senderRole || 'customer',
      senderAvatar: data.senderAvatar || '',
      recipientId: data.recipientId || 'all',
      text: data.text || '',
      garmentId: data.garmentId,
      garmentTitle: data.garmentTitle,
      garmentImage: data.garmentImage,
      isAnnouncement: data.isAnnouncement || false,
      targetAudience: data.targetAudience || 'all',
      read: false,
      createdAt: new Date().toISOString()
    };
    db.messages.push(newMsg);
    saveClientDb(db);
    return { message: newMsg };
  },

  // Promotion Plans
  async getPromotionPlans(): Promise<{ plans: PromotionPlan[] }> {
    const res = await safeFetch<{ plans: PromotionPlan[] }>('/api/promotions');
    if (res.ok && res.data?.plans) {
      return res.data;
    }
    const db = loadClientDb();
    return { plans: db.promotionPlans };
  },

  // Admin APIs
  async getAdminDashboard(): Promise<{
    stats: any;
    users: User[];
    garments: Garment[];
    logs: AdminLog[];
    plans: PromotionPlan[];
  }> {
    const res = await safeFetch<any>('/api/admin/dashboard');
    if (res.ok && res.data?.stats) {
      return res.data;
    }

    const db = loadClientDb();
    return {
      stats: {
        totalTailors: db.users.filter(u => u.role === 'tailor').length,
        totalCustomers: db.users.filter(u => u.role === 'customer').length,
        totalGarments: db.garments.length,
        totalReviews: db.reviews.length,
        totalPromotedTailors: db.users.filter(u => u.role === 'tailor' && u.isPromoted).length,
      },
      users: db.users,
      garments: db.garments,
      logs: db.adminLogs,
      plans: db.promotionPlans,
    };
  },

  async adminBlockTailor(tailorId: string, isBlocked: boolean, adminEmail: string): Promise<any> {
    const res = await safeFetch<any>('/api/admin/tailors/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, isBlocked, adminEmail }),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    const user = db.users.find(u => u.id === tailorId);
    if (user) {
      user.isBlocked = isBlocked;
      db.adminLogs.push({
        id: `log_${Date.now()}`,
        adminEmail,
        action: isBlocked ? 'BLOCK_TAILOR' : 'UNBLOCK_TAILOR',
        target: user.name,
        details: `Tailor ${user.name} was ${isBlocked ? 'blocked' : 'unblocked'}`,
        timestamp: new Date().toISOString()
      });
      saveClientDb(db);
    }
    return { success: true, isBlocked };
  },

  async adminDeleteTailor(tailorId: string, adminEmail: string): Promise<any> {
    const res = await safeFetch<any>('/api/admin/tailors/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, adminEmail }),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    const user = db.users.find(u => u.id === tailorId);
    if (user) {
      db.users = db.users.filter(u => u.id !== tailorId);
      db.garments = db.garments.filter(g => g.tailorId !== tailorId);
      db.adminLogs.push({
        id: `log_${Date.now()}`,
        adminEmail,
        action: 'DELETE_TAILOR',
        target: user.name,
        details: `Deleted tailor ${user.name} and associated garments`,
        timestamp: new Date().toISOString()
      });
      saveClientDb(db);
    }
    return { success: true };
  },

  async adminPromoteTailor(tailorId: string, isPromoted: boolean, planName: string, adminEmail: string): Promise<any> {
    const res = await safeFetch<any>('/api/admin/promote-tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tailorId, isPromoted, planName, adminEmail }),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    const user = db.users.find(u => u.id === tailorId);
    if (user) {
      user.isPromoted = isPromoted;
      user.promotionPlanName = isPromoted ? planName : undefined;
      db.adminLogs.push({
        id: `log_${Date.now()}`,
        adminEmail,
        action: isPromoted ? 'PROMOTE_TAILOR' : 'DEMOTE_TAILOR',
        target: user.name,
        details: `${isPromoted ? 'Promoted' : 'Demoted'} ${user.name} on ${planName}`,
        timestamp: new Date().toISOString()
      });
      saveClientDb(db);
    }
    return { success: true, isPromoted };
  },

  async adminCreatePromotionPlan(data: Partial<PromotionPlan> & { adminEmail: string }): Promise<any> {
    const res = await safeFetch<any>('/api/admin/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    const newPlan: PromotionPlan = {
      id: `plan_${Date.now()}`,
      name: data.name || 'Custom Plan',
      price: data.price || '₦10,000 / $10',
      durationDays: data.durationDays || 30,
      description: data.description || '',
      perks: data.perks || [],
      isFeatured: data.isFeatured || false,
      badgeLabel: data.badgeLabel || 'PROMOTED',
      createdAt: new Date().toISOString()
    };
    db.promotionPlans.push(newPlan);
    saveClientDb(db);
    return { success: true, plan: newPlan };
  },

  async adminAddAdmin(email: string, name: string, password: string, adminEmail: string): Promise<any> {
    const res = await safeFetch<any>('/api/admin/add-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, adminEmail }),
    });

    if (res.ok) return res.data;

    const db = loadClientDb();
    const cleanEmail = email.trim().toLowerCase();
    const newAdmin: User = {
      id: `admin_${Date.now()}`,
      email: cleanEmail,
      name,
      role: 'admin',
      avatarUrl: '',
      country: 'Nigeria',
      countryCode: 'NG',
      phone: '+2348029772375',
      whatsappPhone: '+2348029772375',
      state: 'Lagos',
      city: 'Lagos',
      ratingAverage: 5.0,
      ratingCount: 0,
      followersCount: 0,
      createdAt: new Date().toISOString()
    };
    db.users.push(newAdmin);
    db.adminLogs.push({
      id: `log_${Date.now()}`,
      adminEmail,
      action: 'ADD_ADMIN',
      target: cleanEmail,
      details: `Appointed ${name} as Co-Admin`,
      timestamp: new Date().toISOString()
    });
    saveClientDb(db);
    return { success: true, message: 'New Admin added successfully' };
  },
};
