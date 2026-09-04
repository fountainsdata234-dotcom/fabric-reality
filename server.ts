import express from 'express';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import bcrypt from 'bcrypt';
import { createServer as createViteServer } from 'vite';
import { validatePassword, validatePhoneNumber } from './shared/validation';
import { COUNTRIES } from './src/data/countries';
import { getStaticStates, getStaticCities } from './src/data/locationData';

// Load environment variables from .env file
dotenv.config();

// --- AWS S3 Client Initialization (eu-north-1, fabric-reality) ---
const AWS_REGION = process.env.AWS_REGION || 'eu-north-1';
const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'fabric-reality';

// SECURITY BEST PRACTICE: Move hardcoded credentials to environment variables.
// Create a .env file in your project root and add these lines:
// AWS_ACCESS_KEY_ID="YOUR_KEY"
// AWS_SECRET_ACCESS_KEY="YOUR_SECRET"
const ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

let s3Client: S3Client | null = null;
try {
  if (ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  } else {
    console.warn('\x1b[33m%s\x1b[0m', 'WARNING: AWS credentials not found in .env file. S3 uploads will be disabled.');
  }
} catch (err) {
  console.warn('S3 Client initialization note:', err);
}

// --- Country State City API Configuration ---
const CSC_API_KEY = process.env.CSC_API_KEY;
const cscApi = axios.create({
  baseURL: 'https://api.countrystatecity.in/v1',
  headers: { 'X-CSCAPI-KEY': CSC_API_KEY },
});

if (!CSC_API_KEY) {
  console.warn('\x1b[33m%s\x1b[0m', 'WARNING: CSC_API_KEY not found in .env file. Location services will be disabled.');
}

// --- Local File Database Persistence ---
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DatabaseSchema {
  users: any[];
  garments: any[];
  collections: any[];
  reviews: any[];
  messages: any[];
  promotionPlans: any[];
  adminLogs: any[];
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading db file, initializing defaults:', err);
  }

  // Initial Seed without fake garment pictures (real clean state)
  const defaultAdmin = {
    id: 'admin_super_1',
    email: 'fountainsdata234@gmail.com',
    password: 'Obamhi234',
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

  const defaultPlans = [
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

  const initialDb: DatabaseSchema = {
    users: [defaultAdmin],
    garments: [],
    collections: [],
    reviews: [],
    messages: [
      {
        id: 'msg_welcome_broadcast',
        senderId: 'admin_super_1',
        senderName: 'Fabric Reality Admin',
        senderRole: 'admin',
        senderAvatar: '',
        recipientId: 'all',
        text: 'Welcome to Fabric Reality! Discover master bespoke tailors, explore authentic designs, and connect directly on WhatsApp & in-app chat.',
        isAnnouncement: true,
        targetAudience: 'all',
        read: false,
        createdAt: new Date().toISOString(),
      }
    ],
    promotionPlans: defaultPlans,
    adminLogs: [
      {
        id: 'log_init',
        adminEmail: 'fountainsdata234@gmail.com',
        action: 'SYSTEM_INITIALIZED',
        target: 'Fabric Reality Core',
        details: 'Admin portal and AWS S3 storage initialized.',
        timestamp: new Date().toISOString()
      }
    ]
  };

  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(db: DatabaseSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');

    // Also attempt to persist the DB to S3 when available so deployments
    // on serverless platforms (Vercel) can access a shared, persistent copy.
    if (s3Client && BUCKET_NAME) {
      const s3Key = process.env.S3_DB_KEY || 'db.json';
      const body = JSON.stringify(db, null, 2);
      const putParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: body,
        ContentType: 'application/json',
      };
      // Fire-and-forget upload; log errors but don't block request flow
      s3Client.send(new PutObjectCommand(putParams)).then(() => {
        console.log('Database snapshot saved to S3:', s3Key);
      }).catch((err: any) => {
        console.warn('Could not save database snapshot to S3:', err?.message || err);
      });
    }
  } catch (err) {
    console.warn('Note: Could not save db file to disk (in-memory mode):', err);
    // Even if local write fails, still try S3 persistence
    if (s3Client && BUCKET_NAME) {
      const s3Key = process.env.S3_DB_KEY || 'db.json';
      const body = JSON.stringify(db, null, 2);
      const putParams = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: body,
        ContentType: 'application/json',
      };
      s3Client.send(new PutObjectCommand(putParams)).then(() => {
        console.log('Database snapshot saved to S3 after local write failure:', s3Key);
      }).catch((err: any) => {
        console.warn('Could not save database snapshot to S3 after local write failure:', err?.message || err);
      });
    }
  }
}

// Attempt to load DB snapshot from S3 and replace in-memory DB when available.
async function tryLoadDbFromS3() {
  if (!s3Client || !BUCKET_NAME) return;
  const s3Key = process.env.S3_DB_KEY || 'db.json';
  try {
    const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const res = await s3Client.send(getCmd);
    const stream = res.Body as any;
    let data = '';
    if (stream && typeof stream.on === 'function') {
      // Readable stream
      for await (const chunk of stream) {
        data += chunk;
      }
    } else if (typeof stream === 'string') {
      data = stream;
    } else if (stream && typeof stream.transformToString === 'function') {
      data = await stream.transformToString();
    }

    if (data) {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === 'object') {
        db = parsed as DatabaseSchema;
        console.log('Loaded database snapshot from S3:', s3Key);
        // Ensure local file copy exists for local dev
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (err: any) {
    console.warn('No S3 DB snapshot found or failed to load:', err?.message || err);
  }
}

let db = loadDatabase();

const app = express(); // Initialize Express App
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS middleware
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

app.get('/api/locations/countries', async (_req, res) => {
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get('/countries');
      const formatted = response.data.map((c: any) => ({
        name: c.name,
        code: c.iso2,
        dialCode: c.phonecode,
        flag: c.emoji,
        lat: c.latitude,
        lng: c.longitude,
      }));
      return res.json(formatted);
    } catch (error: any) {
      console.warn('Country fetch note (using static list):', error.message);
    }
  }
  res.json(COUNTRIES);
});

app.get('/api/locations/states/:countryCode', async (req, res) => {
  const { countryCode } = req.params;
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get(`/countries/${countryCode}/states`);
      const formatted = response.data.map((s: any) => ({
        name: s.name,
        iso2: s.iso2,
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));
      return res.json(formatted);
    } catch (error: any) {
      console.warn(`State fetch note for ${countryCode} (using static list):`, error.message);
    }
  }
  const fallbackStates = getStaticStates(countryCode).map(s => ({ name: s.name, iso2: s.iso2 }));
  res.json(fallbackStates);
});

app.get('/api/locations/cities/:countryCode/:stateIso', async (req, res) => {
  const { countryCode, stateIso } = req.params;
  if (CSC_API_KEY) {
    try {
      const response = await cscApi.get(`/countries/${countryCode}/states/${stateIso}/cities`);
      const formatted = response.data.map((c: any) => ({
        name: c.name,
      })).sort((a: any, b: any) => a.name.localeCompare(b.name));
      return res.json(formatted);
    } catch (error: any) {
      console.warn(`City fetch note for ${countryCode}/${stateIso} (using static list):`, error.message);
    }
  }
  const fallbackCities = getStaticCities(countryCode, stateIso).map(name => ({ name }));
  res.json(fallbackCities);
});

// Reverse geocode to get country from lat/lng
app.get('/api/locations/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const response = await axios.get(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    res.json({ countryCode: response.data.countryCode || 'NG', city: response.data.city || 'Lagos' });
  } catch (error) {
    res.json({ countryCode: 'NG', city: 'Lagos' });
  }
});

// 1. AWS S3 Upload Endpoint
app.post('/api/upload', async (req, res) => {
  try {
    const { imageBase64, filename, contentType = 'image/jpeg', folder = 'garments' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 data' });
    }

    // Clean base64 string
    const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let detectedType = contentType;

    if (matches && matches.length === 3) {
      detectedType = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(imageBase64, 'base64');
    }

    const extension = detectedType.split('/')[1] || 'jpg';
    const cleanName = (filename || `cloth_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '');
    const s3Key = `${folder}/${Date.now()}_${cleanName}.${extension}`;

    let publicUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${s3Key}`;
    let uploadedToS3 = false;

    if (s3Client) {
      try {
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: detectedType,
        });
        await s3Client.send(command);
        uploadedToS3 = true;
      } catch (s3Err: any) {
        console.warn('Direct S3 Put warning (falling back to inline storage URL):', s3Err?.message || s3Err);
      }
    }

    // If S3 bucket public ACL is restricted, provide the safe data URI fallback or generated s3 url
    const finalUrl = uploadedToS3
      ? publicUrl
      : `data:${detectedType};base64,${buffer.toString('base64')}`;

    res.json({
      success: true,
      url: finalUrl,
      s3Key,
      uploadedToS3,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + (err.message || err) });
  }
});

// 2. Authentication: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role = 'customer',
      country,
      countryCode,
      phone,
      whatsappPhone,
      state,
      city,
      streetAddress,
      specialties,
      bio,
      avatarUrl,
      pricingGuide,
      availability,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Use the more robust validator which returns an object
    const phoneValidation = validatePhoneNumber(phone, countryCode);
    if (phone && !phoneValidation.valid) {
      return res.status(400).json({ error: 'The provided phone number is not valid.' });
    }


    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const isSuperAdminEmail = cleanEmail === 'fountainsdata234@gmail.com';
    const finalRole = isSuperAdminEmail ? 'admin' : role;

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: cleanEmail,
      // SECURITY: Hash the password before saving
      password: await bcrypt.hash(password, 10),
      name: name.trim(),
      role: finalRole,
      avatarUrl: avatarUrl || '',
      bio: bio || (finalRole === 'tailor' ? 'Passionate master tailor delivering precise bespoke fits.' : 'Fashion enthusiast looking for authentic custom fits.'),
      country: country || 'Nigeria',
      countryCode: countryCode || 'NG',
      phone: phone || '',
      whatsappPhone: whatsappPhone || phone || '',
      state: state || '',
      city: city || '',
      streetAddress: streetAddress || '',
      isBlocked: false,
      isPromoted: false,
      ratingAverage: 5.0,
      ratingCount: 0,
      followersCount: 0,
      followingIds: [],
      specialties: specialties || (finalRole === 'tailor' ? ['Traditional', 'Agbada', 'Senator', 'Suits'] : []),
      pricingGuide: pricingGuide || (finalRole === 'tailor' ? [
        { service: 'Bespoke Senator / Kaftan (2pc)', estimatedPrice: '₦15,000 - ₦30,000', turnaround: '3-5 Days' },
        { service: 'Grand 3-Piece Agbada', estimatedPrice: '₦35,000 - ₦75,000', turnaround: '5-7 Days' },
        { service: 'Tailored 2-Piece Suit', estimatedPrice: '₦40,000 - ₦90,000', turnaround: '7-10 Days' }
      ] : []),
      availability: availability || 'Mon - Sat: 9:00 AM - 7:00 PM',
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    saveDatabase(db);

    const { password: _, ...safeUser } = newUser;
    res.json({ success: true, user: safeUser, token: 'jwt_' + newUser.id });
  } catch (err: any) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// 3. Authentication: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Special Sacred Admin Rule: fountainsdata234@gmail.com / Obamhi234
    if (cleanEmail === 'fountainsdata234@gmail.com') {
      // SECURITY: Use a secure, long, and unique password for the admin account, stored as an environment variable.
      // For this example, we'll keep the check, but this should be improved.
      if (password !== (process.env.ADMIN_PASSWORD || 'Obamhi234')) {
        return res.status(401).json({ error: 'Invalid admin credentials.' });
      }
      let adminUser = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!adminUser) {
        adminUser = {
          id: 'admin_super_1',
          email: 'fountainsdata234@gmail.com',
          password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Obamhi234', 10),
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
        db.users.push(adminUser);
        saveDatabase(db);
      } else {
        adminUser.role = 'admin';
      }
      const { password: _, ...safeAdmin } = adminUser;
      return res.json({ success: true, user: safeAdmin, token: 'jwt_' + adminUser.id });
    }

    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (user && !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been temporarily blocked by administration. Please contact support at 08029772375.' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser, token: 'jwt_' + user.id });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// 4. Update Profile (DP Avatar, Bio, Phone, Address, Pricing, Specialties)
app.put('/api/users/profile', (req, res) => {
  try {
    const { userId, avatarUrl, bio, phone, whatsappPhone, state, city, streetAddress, specialties, pricingGuide, availability } = req.body;
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // BLOCK ENFORCEMENT: A blocked tailor cannot update their profile
    if (user.isBlocked && user.role === 'tailor') {
      return res.status(403).json({ error: 'Your account has been suspended. Profile updates are disabled. Contact support at 08029772375.' });
    }

    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;
    if (whatsappPhone !== undefined) user.whatsappPhone = whatsappPhone;
    if (state !== undefined) user.state = state;
    if (city !== undefined) user.city = city;
    if (streetAddress !== undefined) user.streetAddress = streetAddress;
    if (specialties !== undefined) user.specialties = specialties;
    if (pricingGuide !== undefined) user.pricingGuide = pricingGuide;
    if (availability !== undefined) user.availability = availability;

    // Also update tailor's info in their existing garments
    if (user.role === 'tailor') {
      db.garments.forEach((g) => {
        if (g.tailorId === user.id) {
          g.tailorAvatar = user.avatarUrl;
          g.tailorPhone = user.phone;
          g.tailorWhatsapp = user.whatsappPhone;
          g.tailorCity = user.city;
          g.tailorState = user.state;
        }
      });
    }

    saveDatabase(db);
    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 5. Get Tailors (with real geolocation, country, city, tag, rating, and promoted filters)
app.get('/api/tailors', (req, res) => {
  try {
    const { country, state, city, search, tag, promotedOnly } = req.query;

    let tailors = db.users.filter((u) => u.role === 'tailor' && !u.isBlocked);

    if (promotedOnly === 'true') {
      tailors = tailors.filter((t) => t.isPromoted);
    }

    if (country) {
      tailors = tailors.filter((t) => t.country?.toLowerCase() === String(country).toLowerCase());
    }

    if (city) {
      tailors = tailors.filter((t) => t.city?.toLowerCase().includes(String(city).toLowerCase()));
    }

    if (state) {
      tailors = tailors.filter((t) => t.state?.toLowerCase().includes(String(state).toLowerCase()));
    }

    if (tag) {
      const queryTag = String(tag).toLowerCase();
      tailors = tailors.filter((t) =>
        t.specialties?.some((s: string) => s.toLowerCase().includes(queryTag))
      );
    }

    if (search) {
      const q = String(search).toLowerCase();
      tailors = tailors.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.city.toLowerCase().includes(q) ||
          t.state.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q) ||
          t.bio?.toLowerCase().includes(q) ||
          t.specialties?.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    // Sort: Promoted first, then by rating, then by follower count
    tailors.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      if (b.ratingAverage !== a.ratingAverage) return b.ratingAverage - a.ratingAverage;
      return (b.followersCount || 0) - (a.followersCount || 0);
    });

    const safeTailors = tailors.map(({ password: _, ...t }) => t);
    res.json({ success: true, tailors: safeTailors });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tailors' });
  }
});

// 6. Get Single Tailor Profile with their garments, collections, and reviews
app.get('/api/tailors/:id', (req, res) => {
  try {
    const tailor = db.users.find((u) => u.id === req.params.id && u.role === 'tailor');
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    const garments = db.garments.filter((g) => g.tailorId === tailor.id);
    const collections = db.collections.filter((c) => c.tailorId === tailor.id);
    const reviews = db.reviews.filter((r) => r.tailorId === tailor.id);

    const { password: _, ...safeTailor } = tailor;
    res.json({
      success: true,
      tailor: safeTailor,
      garments,
      collections,
      reviews,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch tailor profile' });
  }
});

// 7. Garments API: Get All / Filter
app.get('/api/garments', (req, res) => {
  try {
    const { tag, category, gender, search, tailorId, sort = 'trending' } = req.query;

    // Collect IDs of all blocked tailors so we can exclude their garments
    const blockedTailorIds = new Set(
      db.users.filter((u) => u.isBlocked).map((u) => u.id)
    );

    let garments = db.garments.filter((g) => !blockedTailorIds.has(g.tailorId));

    if (tailorId) {
      garments = garments.filter((g) => g.tailorId === String(tailorId));
    }

    if (tag) {
      const queryTag = String(tag).toLowerCase().trim();
      garments = garments.filter((g) =>
        g.tags?.some((t: string) => t.toLowerCase() === queryTag || t.toLowerCase().includes(queryTag))
      );
    }

    if (category && category !== 'All Categories') {
      garments = garments.filter((g) => g.category?.toLowerCase() === String(category).toLowerCase());
    }

    if (gender && gender !== 'All') {
      garments = garments.filter((g) => g.gender === gender || g.gender === 'Unisex');
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      garments = garments.filter(
        (g) =>
          g.title?.toLowerCase().includes(q) ||
          g.description?.toLowerCase().includes(q) ||
          g.tailorName?.toLowerCase().includes(q) ||
          g.tailorCity?.toLowerCase().includes(q) ||
          g.tailorCountry?.toLowerCase().includes(q) ||
          g.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }

    // Sort calculation
    if (sort === 'trending') {
      // Promoted tailors first, then highest rating * likes, then latest
      garments.sort((a, b) => {
        if (a.tailorIsPromoted && !b.tailorIsPromoted) return -1;
        if (!a.tailorIsPromoted && b.tailorIsPromoted) return 1;
        const scoreA = (a.averageRating || 5) * 10 + (a.likesCount || 0) * 2;
        const scoreB = (b.averageRating || 5) * 10 + (b.likesCount || 0) * 2;
        return scoreB - scoreA;
      });
    } else if (sort === 'latest') {
      garments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sort === 'top_rated') {
      garments.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sort === 'price_low') {
      garments.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_high') {
      garments.sort((a, b) => b.price - a.price);
    }

    res.json({ success: true, garments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch garments' });
  }
});

// 8. Garments API: Post New Garment (Tailors only)
app.post('/api/garments', (req, res) => {
  try {
    const {
      tailorId,
      title,
      description,
      tags = [],
      price,
      currency = '₦',
      category = 'Traditional',
      gender = 'Unisex',
      fabricType = 'Cotton / Wool Blend',
      turnaroundDays = 5,
      imageUrl,
      s3Key,
      collectionId,
    } = req.body;

    if (!tailorId || !title || !imageUrl) {
      return res.status(400).json({ error: 'Tailor ID, garment title, and image are required.' });
    }

    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    // BLOCK ENFORCEMENT: A blocked tailor cannot post garments
    if (tailor.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended by administration. You cannot post new garments. Contact support at 08029772375.' });
    }

    // Process tags
    const processedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean)
      : String(tags)
        .split(',')
        .map((t) => t.toLowerCase().trim())
        .filter(Boolean);

    let collectionName = '';
    if (collectionId) {
      const col = db.collections.find((c) => c.id === collectionId);
      if (col) {
        collectionName = col.title;
        col.itemCount = (col.itemCount || 0) + 1;
      }
    }

    const newGarment = {
      id: 'garment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      tailorId: tailor.id,
      tailorName: tailor.name,
      tailorAvatar: tailor.avatarUrl,
      tailorCountry: tailor.country,
      tailorCity: tailor.city,
      tailorState: tailor.state,
      tailorPhone: tailor.phone,
      tailorWhatsapp: tailor.whatsappPhone || tailor.phone,
      tailorIsPromoted: !!tailor.isPromoted,
      title: title.trim(),
      description: description || '',
      tags: processedTags,
      price: Number(price) || 0,
      currency: currency || '₦',
      category,
      gender,
      fabricType,
      turnaroundDays: Number(turnaroundDays) || 5,
      imageUrl,
      s3Key: s3Key || '',
      collectionId: collectionId || '',
      collectionName,
      likesCount: 0,
      viewsCount: 1,
      ratingsCount: 0,
      averageRating: 5.0,
      createdAt: new Date().toISOString(),
    };

    db.garments.unshift(newGarment);
    saveDatabase(db);

    res.json({ success: true, garment: newGarment });
  } catch (err: any) {
    console.error('Create garment error:', err);
    res.status(500).json({ error: 'Failed to create garment' });
  }
});

// 9. Garments API: Delete Garment (by tailor or admin)
app.delete('/api/garments/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { requesterId, requesterRole } = req.body;

    const garmentIndex = db.garments.findIndex((g) => g.id === id);
    if (garmentIndex === -1) {
      return res.status(404).json({ error: 'Garment not found' });
    }

    const garment = db.garments[garmentIndex];

    // Check permission: Must be owner or admin
    if (requesterRole !== 'admin' && garment.tailorId !== requesterId) {
      return res.status(403).json({ error: 'Unauthorized to delete this garment' });
    }

    db.garments.splice(garmentIndex, 1);

    if (requesterRole === 'admin') {
      db.adminLogs.push({
        id: 'log_' + Date.now(),
        adminEmail: 'fountainsdata234@gmail.com',
        action: 'DELETE_GARMENT',
        target: garment.title,
        details: `Garment ${garment.id} deleted by admin`,
        timestamp: new Date().toISOString(),
      });
    }

    saveDatabase(db);
    res.json({ success: true, message: 'Garment deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete garment' });
  }
});

// 10. Collections API: Create / List
app.post('/api/collections', (req, res) => {
  try {
    const { tailorId, title, description, bannerUrl } = req.body;
    if (!tailorId || !title) {
      return res.status(400).json({ error: 'Tailor ID and Collection Title are required' });
    }

    // BLOCK ENFORCEMENT: A blocked tailor cannot create collections
    const collectionOwner = db.users.find((u) => u.id === tailorId);
    if (collectionOwner?.isBlocked) {
      return res.status(403).json({ error: 'Your account has been suspended. You cannot create collections. Contact support at 08029772375.' });
    }

    const newCollection = {
      id: 'col_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      tailorId,
      title: title.trim(),
      description: description || '',
      bannerUrl: bannerUrl || '',
      itemCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.collections.push(newCollection);
    saveDatabase(db);
    res.json({ success: true, collection: newCollection });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// 11. Real-time Customer Rating & Review System (Customers Only)
app.post('/api/reviews', (req, res) => {
  try {
    const { garmentId, tailorId, customerId, rating, comment } = req.body;

    if (!customerId || !tailorId || !rating) {
      return res.status(400).json({ error: 'Customer ID, tailor ID, and rating (1-5) are required' });
    }

    const customer = db.users.find((u) => u.id === customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) {
      return res.status(404).json({ error: 'Tailor not found' });
    }

    let garmentTitle = '';
    if (garmentId) {
      const garment = db.garments.find((g) => g.id === garmentId);
      if (garment) {
        garmentTitle = garment.title;
        const currentGarmentRatings = db.reviews.filter((r) => r.garmentId === garmentId);
        const newGarmentCount = currentGarmentRatings.length + 1;
        const newGarmentAvg =
          (currentGarmentRatings.reduce((sum, r) => sum + r.rating, 0) + Number(rating)) / newGarmentCount;
        garment.ratingsCount = newGarmentCount;
        garment.averageRating = Number(newGarmentAvg.toFixed(1));
      }
    }

    const newReview = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      garmentId: garmentId || '',
      tailorId,
      customerId: customer.id,
      customerName: customer.name,
      customerAvatar: customer.avatarUrl,
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment: comment || 'Excellent craftsmanship and perfect fit!',
      garmentTitle,
      createdAt: new Date().toISOString(),
    };

    db.reviews.unshift(newReview);

    // Recalculate Tailor Average Rating
    const tailorReviews = db.reviews.filter((r) => r.tailorId === tailorId);
    const totalRatings = tailorReviews.reduce((sum, r) => sum + r.rating, 0);
    tailor.ratingCount = tailorReviews.length;
    tailor.ratingAverage = Number((totalRatings / tailorReviews.length).toFixed(1));

    saveDatabase(db);
    res.json({ success: true, review: newReview, tailorRating: tailor.ratingAverage });
  } catch (err: any) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// 12. Follow / Unfollow Tailors
app.post('/api/followers/toggle', (req, res) => {
  try {
    const { followerId, targetTailorId } = req.body;
    const follower = db.users.find((u) => u.id === followerId);
    const tailor = db.users.find((u) => u.id === targetTailorId);

    if (!follower || !tailor) {
      return res.status(404).json({ error: 'User or Tailor not found' });
    }

    if (!follower.followingIds) follower.followingIds = [];

    const isFollowing = follower.followingIds.includes(targetTailorId);

    if (isFollowing) {
      follower.followingIds = follower.followingIds.filter((id: string) => id !== targetTailorId);
      tailor.followersCount = Math.max(0, (tailor.followersCount || 0) - 1);
    } else {
      follower.followingIds.push(targetTailorId);
      tailor.followersCount = (tailor.followersCount || 0) + 1;
    }

    saveDatabase(db);
    res.json({
      success: true,
      isFollowing: !isFollowing,
      followersCount: tailor.followersCount,
      followingIds: follower.followingIds,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle follow status' });
  }
});

// 13. Like / Unlike Garment
app.post('/api/garments/like', (req, res) => {
  try {
    const { garmentId, increment = true } = req.body;
    const garment = db.garments.find((g) => g.id === garmentId);
    if (!garment) {
      return res.status(404).json({ error: 'Garment not found' });
    }

    if (increment) {
      garment.likesCount = (garment.likesCount || 0) + 1;
    } else {
      garment.likesCount = Math.max(0, (garment.likesCount || 0) - 1);
    }

    saveDatabase(db);
    res.json({ success: true, likesCount: garment.likesCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to like garment' });
  }
});

// 14. In-App Messaging API (Chat between Tailor & Customer, and Admin broadcasts)
app.get('/api/messages', (req, res) => {
  try {
    const { userId, otherUserId } = req.query;
    const user = db.users.find((u) => u.id === userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Filter messages relevant to this user:
    // Direct messages where user is sender or recipient, OR broadcast messages matching audience
    let userMessages = db.messages.filter((m) => {
      if (m.isAnnouncement) {
        if (m.targetAudience === 'all') return true;
        if (m.targetAudience === 'tailors' && user?.role === 'tailor') return true;
        if (m.targetAudience === 'customers' && user?.role === 'customer') return true;
        return false;
      }

      if (otherUserId) {
        return (
          (m.senderId === userId && m.recipientId === otherUserId) ||
          (m.senderId === otherUserId && m.recipientId === userId)
        );
      }

      return m.senderId === userId || m.recipientId === userId;
    });

    res.json({ success: true, messages: userMessages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', (req, res) => {
  try {
    const {
      senderId,
      recipientId,
      text,
      garmentId,
      garmentTitle,
      garmentImage,
      isAnnouncement,
      targetAudience = 'direct',
    } = req.body;

    if (!senderId || !text) {
      return res.status(400).json({ error: 'Sender ID and message text are required' });
    }

    const sender = db.users.find((u) => u.id === senderId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    let recipientName = 'Public';
    if (recipientId && !['all', 'tailors', 'customers'].includes(recipientId)) {
      const recipient = db.users.find((u) => u.id === recipientId);
      if (recipient) recipientName = recipient.name;
    }

    const newMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role,
      senderAvatar: sender.avatarUrl,
      recipientId: recipientId || 'all',
      recipientName,
      text: text.trim(),
      garmentId: garmentId || '',
      garmentTitle: garmentTitle || '',
      garmentImage: garmentImage || '',
      isAnnouncement: !!isAnnouncement,
      targetAudience: isAnnouncement ? targetAudience : 'direct',
      read: false,
      createdAt: new Date().toISOString(),
    };

    db.messages.push(newMessage);
    saveDatabase(db);

    res.json({ success: true, message: newMessage });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// 15. Promotion Plans API (for Tailors to browse & pick)
app.get('/api/promotions', (_req, res) => {
  res.json({ success: true, plans: db.promotionPlans });
});

// 16. Admin Endpoints
// - Block / Unblock Tailor 
app.post('/api/admin/tailors/block', (req, res) => {
  try {
    const { tailorId, isBlocked, adminEmail } = req.body;
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });

    tailor.isBlocked = !!isBlocked;

    // When blocking: also remove promotion so they don't appear in featured/promoted sections
    if (isBlocked) {
      tailor.isPromoted = false;
      tailor.promotionPlanName = undefined;
    }

    // Update all their garments to reflect blocked status (hidden from public listings)
    db.garments.forEach((g) => {
      if (g.tailorId === tailorId) {
        g.tailorIsPromoted = isBlocked ? false : !!tailor.isPromoted;
      }
    });

    db.adminLogs.push({
      id: 'log_' + Date.now(),
      adminEmail: adminEmail || 'fountainsdata234@gmail.com',
      action: isBlocked ? 'BLOCK_TAILOR' : 'UNBLOCK_TAILOR',
      target: tailor.name + ` (${tailor.email})`,
      details: isBlocked
        ? 'Tailor account SUSPENDED: login, garment posting, and collections blocked'
        : 'Tailor account REINSTATED: all access restored',
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, isBlocked: tailor.isBlocked, message: isBlocked ? `${tailor.name} has been suspended.` : `${tailor.name} has been reinstated.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Admin action failed' });
  }
});

// - Delete Tailor Account 
app.post('/api/admin/tailors/delete', (req, res) => {
  try {
    const { tailorId, adminEmail } = req.body;
    const tailorIndex = db.users.findIndex((u) => u.id === tailorId);
    if (tailorIndex === -1) return res.status(404).json({ error: 'Tailor not found' });

    const tailor = db.users[tailorIndex];
    db.users.splice(tailorIndex, 1);

    // Remove their garments too
    db.garments = db.garments.filter((g) => g.tailorId !== tailorId);

    db.adminLogs.push({
      id: 'log_' + Date.now(),
      adminEmail: adminEmail || 'fountainsdata234@gmail.com',
      action: 'DELETE_TAILOR',
      target: tailor.name + ` (${tailor.email})`,
      details: 'Tailor account and all associated garments removed',
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, message: 'Tailor removed' });
  } catch (err: any) {
    res.status(500).json({ error: 'Delete tailor failed' });
  }
});

// - Promote Tailor (Apply promotion badge & boost rank) 
app.post('/api/admin/promote-tailor', (req, res) => {
  try {
    const { tailorId, isPromoted, planName, adminEmail } = req.body;
    const tailor = db.users.find((u) => u.id === tailorId);
    if (!tailor) return res.status(404).json({ error: 'Tailor not found' });

    tailor.isPromoted = !!isPromoted;
    tailor.promotionPlanName = isPromoted ? (planName || 'Spotlight Gold Tier') : undefined;

    // Update their garments to reflect promoted status
    db.garments.forEach((g) => {
      if (g.tailorId === tailorId) {
        g.tailorIsPromoted = !!isPromoted;
      }
    });

    db.adminLogs.push({
      id: 'log_' + Date.now(),
      adminEmail: adminEmail || 'fountainsdata234@gmail.com',
      action: isPromoted ? 'PROMOTE_TAILOR' : 'REMOVE_PROMOTION',
      target: tailor.name,
      details: isPromoted ? `Promoted under ${planName || 'Spotlight'}` : 'Promotion deactivated',
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, isPromoted: tailor.isPromoted });
  } catch (err: any) {
    res.status(500).json({ error: 'Promotion update failed' });
  }
});

// - Post new Promotion Plan / Invoice setup (Admin only) 
app.post('/api/admin/promotions', (req, res) => {
  try {
    const { name, price, durationDays, description, perks, badgeLabel, adminEmail } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Plan name and price are required' });
    }

    const newPlan = {
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      price: price.trim(),
      durationDays: Number(durationDays) || 30,
      description: description || 'Special tailor promotion package with enhanced reach.',
      perks: Array.isArray(perks) ? perks : String(perks).split('\n').filter(Boolean),
      badgeLabel: badgeLabel || 'FEATURED',
      createdAt: new Date().toISOString(),
    };

    db.promotionPlans.unshift(newPlan);

    db.adminLogs.push({
      id: 'log_' + Date.now(),
      adminEmail: adminEmail || 'fountainsdata234@gmail.com',
      action: 'CREATE_PROMOTION_PLAN',
      target: newPlan.name,
      details: `Plan created with price ${newPlan.price}`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, plan: newPlan });
  } catch (err: any) {
    res.status(500).json({ error: 'Create promotion plan failed' });
  }
});

// - Add New Admin 
app.post('/api/admin/add-admin', (req, res) => {
  try {
    const { email, name, password, adminEmail } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, name, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      existing.role = 'admin';
      saveDatabase(db);
      return res.json({ success: true, message: 'Existing user elevated to Admin role' });
    }

    const newAdmin = {
      id: 'admin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      email: cleanEmail,
      password,
      name: name.trim(),
      role: 'admin',
      avatarUrl: '',
      country: 'Nigeria',
      countryCode: 'NG',
      phone: '+2348029772375',
      state: 'Lagos',
      city: 'Lagos',
      ratingAverage: 5.0,
      ratingCount: 0,
      followersCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newAdmin);

    db.adminLogs.push({
      id: 'log_' + Date.now(),
      adminEmail: adminEmail || 'fountainsdata234@gmail.com',
      action: 'ADD_ADMIN',
      target: cleanEmail,
      details: `Appointed ${name} as Co-Admin`,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);
    res.json({ success: true, message: 'New Admin added successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Add admin failed' });
  }
});

// - Get Admin Stats & Logs 
app.get('/api/admin/dashboard', (_req, res) => {
  try {
    const totalTailors = db.users.filter((u) => u.role === 'tailor').length;
    const totalCustomers = db.users.filter((u) => u.role === 'customer').length;
    const totalGarments = db.garments.length;
    const totalReviews = db.reviews.length;
    const totalPromotedTailors = db.users.filter((u) => u.role === 'tailor' && u.isPromoted).length;

    res.json({
      success: true,
      stats: {
        totalTailors,
        totalCustomers,
        totalGarments,
        totalReviews,
        totalPromotedTailors,
      },
      users: db.users.map(({ password: _, ...u }) => u),
      garments: db.garments,
      logs: db.adminLogs.slice(0, 50),
      plans: db.promotionPlans,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
});

async function startLocalServer() {
  const PORT = Number(process.env.PORT) || 3001; // Ensure PORT is a number

  // Try to load DB snapshot from S3 when starting (helps serverless deployments)
  try {
    await tryLoadDbFromS3();
  } catch (err) {
    console.warn('S3 DB load on startup failed:', err);
  }

  // --- Vite Middleware for Development / Static serving for Production ---
  // This MUST be placed AFTER all API routes.
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fabric Reality Server running at http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production') {
  startLocalServer().catch((err) => {
    console.error('Failed to start local server:', err);
  });
}

// Export the app for Vercel
export default app;

// --- Lightweight Health & Debug Endpoints ---
app.get('/api/health', (_req, res) => {
  res.json({ success: true, environment: process.env.NODE_ENV || 'development' });
});

// Debug: Return current in-memory DB snapshot when admin query matches.
app.get('/api/admin/db', (req, res) => {
  const adminEmail = String(req.query.adminEmail || '');
  const allowed = process.env.DEBUG_ADMIN_EMAIL || 'fountainsdata234@gmail.com';
  if (adminEmail !== allowed) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  res.json({ success: true, db });
});

// Centralized error handler to return JSON and log stack traces
// Must be registered after all routes
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(err?.status || 500).json({ success: false, error: err?.message || 'Internal Server Error' });
});
