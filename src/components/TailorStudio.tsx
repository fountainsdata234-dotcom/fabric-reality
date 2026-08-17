import React, { useState, useEffect } from 'react';
import {
  Upload,
  PlusCircle,
  Scissors,
  Layers,
  Crown,
  Star,
  Users,
  Clock,
  DollarSign,
  Trash2,
  Phone,
  MessageSquare,
  Sparkles,
  Camera,
  CheckCircle2,
  Globe,
  Tag,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { User, Garment, Collection, PromotionPlan } from '../types';
import { api } from '../services/api';
import { GARMENT_CATEGORIES, POPULAR_TAGS, generateAvatarUrl, COUNTRIES } from '../data/countries';
import confetti from 'canvas-confetti';

interface TailorStudioProps {
  currentUser: User;
  onUserUpdate: (updatedUser: User) => void;
  onOpenChat: () => void;
}

export const TailorStudio: React.FC<TailorStudioProps> = ({
  currentUser,
  onUserUpdate,
  onOpenChat,
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'upload' | 'collections' | 'pricing' | 'promotions' | 'profile'>('portfolio');
  const [myGarments, setMyGarments] = useState<Garment[]>([]);
  const [myCollections, setMyCollections] = useState<Collection[]>([]);
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload Form State
  const [garmentTitle, setGarmentTitle] = useState('');
  const [garmentDescription, setGarmentDescription] = useState('');
  const [garmentPrice, setGarmentPrice] = useState('');
  const [garmentCurrency, setGarmentCurrency] = useState('₦');
  const [garmentCategory, setGarmentCategory] = useState(GARMENT_CATEGORIES[1]);
  const [garmentGender, setGarmentGender] = useState<'Men' | 'Women' | 'Unisex' | 'Kids'>('Unisex');
  const [garmentFabric, setGarmentFabric] = useState('Premium Cashmere Wool / Cotton');
  const [garmentTurnaround, setGarmentTurnaround] = useState('5');
  const [garmentTagsInput, setGarmentTagsInput] = useState('agbada, royal, senator');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Collection Creator
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDesc, setCollectionDesc] = useState('');

  // Profile Editor
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [whatsappPhone, setWhatsappPhone] = useState(currentUser.whatsappPhone || '');
  const [stateName, setStateName] = useState(currentUser.state || '');
  const [cityName, setCityName] = useState(currentUser.city || '');
  const [availability, setAvailability] = useState(currentUser.availability || 'Mon - Sat: 9:00 AM - 7:00 PM');
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl || '');

  // Pricing Guide Editor
  const [pricingItems, setPricingItems] = useState(
    currentUser.pricingGuide || [
      { service: 'Bespoke Senator / Kaftan (2pc)', estimatedPrice: '₦20,000 - ₦35,000', turnaround: '3-5 Days' },
      { service: 'Grand 3-Piece Agbada', estimatedPrice: '₦40,000 - ₦80,000', turnaround: '5-7 Days' },
      { service: 'Bespoke 2-Piece Suit', estimatedPrice: '₦50,000 - ₦110,000', turnaround: '7-10 Days' },
    ]
  );

  useEffect(() => {
    fetchStudioData();
  }, [currentUser.id]);

  const fetchStudioData = async () => {
    setIsLoading(true);
    try {
      const [garmentRes, tailorDetails, promoRes] = await Promise.all([
        api.getGarments({ tailorId: currentUser.id }),
        api.getTailorDetails(currentUser.id),
        api.getPromotionPlans(),
      ]);

      if (garmentRes.garments) setMyGarments(garmentRes.garments);
      if (tailorDetails.collections) setMyCollections(tailorDetails.collections);
      if (promoRes.plans) setPromotionPlans(promoRes.plans);
    } catch (err) {
      console.error('Error loading studio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleGarmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      alert('Please upload a photograph of your crafted garment.');
      return;
    }

    setIsUploadingImage(true);
    try {
      // 1. Upload to AWS S3
      const uploadResult = await api.uploadImage(imagePreview, `cloth_${Date.now()}`, 'garments');
      const imageUrl = uploadResult.url;

      // 2. Process tags
      const tagsArray = garmentTagsInput
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      // 3. Create Garment in DB
      const res = await api.createGarment({
        tailorId: currentUser.id,
        title: garmentTitle,
        description: garmentDescription,
        price: Number(garmentPrice) || 0,
        currency: garmentCurrency,
        category: garmentCategory,
        gender: garmentGender,
        fabricType: garmentFabric,
        turnaroundDays: Number(garmentTurnaround) || 5,
        tags: tagsArray,
        collectionId: selectedCollectionId || undefined,
        imageUrl,
        s3Key: uploadResult.s3Key,
      });

      if (res.garment) {
        setMyGarments([res.garment, ...myGarments]);
        setUploadSuccess(true);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        // Reset form
        setGarmentTitle('');
        setGarmentDescription('');
        setGarmentPrice('');
        setImagePreview('');
        setTimeout(() => {
          setUploadSuccess(false);
          setActiveTab('portfolio');
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish garment. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteGarment = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this garment from your portfolio?')) return;
    try {
      await api.deleteGarment(id, currentUser.id, currentUser.role);
      setMyGarments(myGarments.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionTitle) return;
    try {
      const res = await api.createCollection(currentUser.id, collectionTitle, collectionDesc);
      if (res.collection) {
        setMyCollections([...myCollections, res.collection]);
        setCollectionTitle('');
        setCollectionDesc('');
        alert('Collection created successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create collection');
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({
        userId: currentUser.id,
        bio,
        phone,
        whatsappPhone,
        state: stateName,
        city: cityName,
        availability,
        avatarUrl: avatarPreview,
        pricingGuide: pricingItems,
      });
      if (res.user) {
        onUserUpdate(res.user);
        alert('Profile and contact information updated successfully!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    }
  };

  // Promotion plan selection & WhatsApp route to 08029772375
  const handleSelectPlan = (plan: PromotionPlan) => {
    const message = `Hello Admin, I want to activate the "${plan.name}" (${plan.price}) for my tailor brand "${currentUser.name}" on Fabric Reality! Tailor ID: ${currentUser.id}, Email: ${currentUser.email}. Please provide the invoice and payment confirmation instructions.`;
    const url = `https://wa.me/2348029772375?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Studio Header */}
      <div className="rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 p-6 sm:p-8 border border-stone-800 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={currentUser.avatarUrl || generateAvatarUrl(currentUser.name, 'tailor')}
              alt={currentUser.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg"
            />
            {currentUser.isPromoted && (
              <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-amber-500 text-stone-950 shadow-md">
                <Crown className="w-4 h-4" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-100">{currentUser.name}</h1>
              {currentUser.isPromoted && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-stone-950 text-[10px] font-black uppercase">
                  PROMOTED
                </span>
              )}
            </div>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              {currentUser.city}, {currentUser.country} • Studio ID: {currentUser.id.slice(0, 10)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {currentUser.ratingAverage.toFixed(1)} ({currentUser.ratingCount} reviews)
              </span>
              <span className="text-stone-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {currentUser.followersCount} Followers
              </span>
            </div>
          </div>
        </div>

        {/* Quick studio action pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publish New Cloth</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className="px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all flex items-center gap-2"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Promotion Center</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold border-b border-stone-800">
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'portfolio' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Scissors className="w-3.5 h-3.5" />
          <span>My Portfolio ({myGarments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'upload' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>AWS S3 Upload</span>
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'collections' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Collections ({myCollections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'pricing' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Rates & Hours</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'promotions' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Promotion Plans</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'profile' ? 'bg-amber-500 text-stone-950 shadow' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Studio Settings</span>
        </button>
      </div>

      {/* --- TAB 1: MY PORTFOLIO --- */}
      {activeTab === 'portfolio' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              Published Garments ({myGarments.length})
            </h2>
            <button
              onClick={() => setActiveTab('upload')}
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Another Garment</span>
            </button>
          </div>

          {myGarments.length === 0 ? (
            <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-stone-800 space-y-3">
              <Scissors className="w-10 h-10 text-stone-600 mx-auto" />
              <h3 className="text-base font-bold text-stone-200">Your Portfolio is Empty</h3>
              <p className="text-xs text-stone-400 max-w-md mx-auto">
                Upload authentic photographs of Agbada, Senators, Suits, or Gowns you have crafted. Customers love to see real work!
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload First Garment</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myGarments.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative aspect-[4/5] bg-stone-950">
                    <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteGarment(g.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-300 transition-colors"
                      title="Delete Garment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 space-y-1.5">
                    <h3 className="text-xs font-bold text-stone-100 truncate">{g.title}</h3>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-bold">
                        {g.currency}{g.price > 0 ? g.price.toLocaleString() : 'Negotiable'}
                      </span>
                      <span className="text-stone-400 text-[11px] flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {g.averageRating ? g.averageRating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                    {g.tags && (
                      <div className="flex flex-wrap gap-1">
                        {g.tags.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] text-stone-400">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: AWS S3 UPLOAD FORM --- */}
      {activeTab === 'upload' && (
        <div className="max-w-2xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 shadow-2xl space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
              <Upload className="w-4 h-4" />
              <span>Amazon AWS S3 Cloud Publishing</span>
            </div>
            <h2 className="text-xl font-serif font-black text-stone-100">
              Publish Authentic Garment to Your Portfolio
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Photographs will be stored in high-resolution in the <code>fabric-reality</code> S3 bucket and indexed for smart keyword search.
            </p>
          </div>

          <form onSubmit={handleGarmentSubmit} className="space-y-4 text-xs font-sans">
            {/* Image Selector */}
            <div className="p-4 bg-stone-950 rounded-2xl border-2 border-dashed border-stone-800 text-center space-y-3">
              {imagePreview ? (
                <div className="relative max-w-xs mx-auto aspect-[4/5] rounded-xl overflow-hidden border border-amber-500/40">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-950/80 text-stone-300 hover:text-white"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer py-6">
                  <Upload className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
                  <span className="text-sm font-bold text-stone-200">Select Garment Photo from Device</span>
                  <span className="text-[11px] text-stone-400 mt-1">Supports PNG, JPG, WebP from gallery or camera</span>
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                </label>
              )}
            </div>

            {/* Title & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Garment Title *</label>
                <input
                  type="text"
                  required
                  value={garmentTitle}
                  onChange={(e) => setGarmentTitle(e.target.value)}
                  placeholder="e.g. Royal Agbada with Hand Embroidery"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Estimated Price *</label>
                <div className="flex items-center">
                  <select
                    value={garmentCurrency}
                    onChange={(e) => setGarmentCurrency(e.target.value)}
                    className="px-2.5 py-2.5 bg-stone-800 border border-r-0 border-stone-700 rounded-l-xl text-amber-400 font-bold text-xs"
                  >
                    <option value="₦">₦ (NGN)</option>
                    <option value="$">$ (USD)</option>
                    <option value="£">£ (GBP)</option>
                    <option value="€">€ (EUR)</option>
                    <option value="₵">₵ (GHS)</option>
                  </select>
                  <input
                    type="number"
                    value={garmentPrice}
                    onChange={(e) => setGarmentPrice(e.target.value)}
                    placeholder="45000"
                    className="flex-1 px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-r-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Category & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Style Category *</label>
                <select
                  value={garmentCategory}
                  onChange={(e) => setGarmentCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  {GARMENT_CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Target Fit / Gender *</label>
                <select
                  value={garmentGender}
                  onChange={(e) => setGarmentGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Unisex">Unisex</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>
            </div>

            {/* Tags for Smart Search */}
            <div>
              <label className="block font-semibold text-stone-300 mb-1">
                Smart Search Tags (Comma separated) *
              </label>
              <input
                type="text"
                required
                value={garmentTagsInput}
                onChange={(e) => setGarmentTagsInput(e.target.value)}
                placeholder="e.g. agbada, senator, kaftan, ankara, wedding, royal"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Keywords like "agbada", "senator", "suits" ensure customers find this cloth instantly in search.
              </p>
            </div>

            {/* Fabric & Turnaround Days */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Fabric & Texture</label>
                <input
                  type="text"
                  value={garmentFabric}
                  onChange={(e) => setGarmentFabric(e.target.value)}
                  placeholder="e.g. Italian Wool 120s / Premium Damask"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Turnaround Days</label>
                <input
                  type="number"
                  value={garmentTurnaround}
                  onChange={(e) => setGarmentTurnaround(e.target.value)}
                  placeholder="5"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-semibold text-stone-300 mb-1">Garment Description</label>
              <textarea
                rows={3}
                value={garmentDescription}
                onChange={(e) => setGarmentDescription(e.target.value)}
                placeholder="Describe the cut, embroidery details, buttons, lining, and custom options..."
                className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isUploadingImage}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isUploadingImage ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Publish to AWS S3 & Portfolio</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 3: COLLECTIONS --- */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800">
            <h3 className="text-base font-serif font-bold text-stone-100 mb-3">
              Create a New Curated Collection
            </h3>
            <form onSubmit={handleCreateCollection} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={collectionTitle}
                  onChange={(e) => setCollectionTitle(e.target.value)}
                  placeholder="e.g. Royal Agbada Wedding Lookbook 2026"
                  className="px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
                <input
                  type="text"
                  value={collectionDesc}
                  onChange={(e) => setCollectionDesc(e.target.value)}
                  placeholder="Collection theme, seasonal fabrics, bespoke concept..."
                  className="px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-all"
              >
                Create Collection
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myCollections.map((col) => (
              <div key={col.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <h4 className="text-sm font-bold text-stone-100">{col.title}</h4>
                <p className="text-xs text-stone-400">{col.description || 'Curated tailoring collection.'}</p>
                <div className="pt-2 text-[11px] text-amber-400 font-semibold flex items-center justify-between">
                  <span>{col.itemCount || 0} Garments</span>
                  <span>Active Collection</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: PRICING GUIDE & AVAILABILITY --- */}
      {activeTab === 'pricing' && (
        <div className="max-w-2xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-6">
          <div>
            <h2 className="text-xl font-serif font-black text-stone-100">
              Set Transparent Pricing Guide & Schedule
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Customers appreciate clear estimates before sending measurements.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Weekly Operating Schedule</label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Mon - Sat: 9:00 AM - 7:00 PM"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-stone-300">Standard Service Rate Sheet</label>
              {pricingItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-950 rounded-xl border border-stone-800 grid grid-cols-3 gap-2 text-xs">
                  <input
                    type="text"
                    value={item.service}
                    onChange={(e) => {
                      const updated = [...pricingItems];
                      updated[idx].service = e.target.value;
                      setPricingItems(updated);
                    }}
                    placeholder="Service Name"
                    className="px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-100"
                  />
                  <input
                    type="text"
                    value={item.estimatedPrice}
                    onChange={(e) => {
                      const updated = [...pricingItems];
                      updated[idx].estimatedPrice = e.target.value;
                      setPricingItems(updated);
                    }}
                    placeholder="Estimated Price"
                    className="px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-amber-400 font-bold"
                  />
                  <input
                    type="text"
                    value={item.turnaround}
                    onChange={(e) => {
                      const updated = [...pricingItems];
                      updated[idx].turnaround = e.target.value;
                      setPricingItems(updated);
                    }}
                    placeholder="Turnaround (e.g. 3-5 Days)"
                    className="px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-stone-300"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleProfileSave}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              Save Pricing Guide & Hours
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 5: PROMOTION PLANS --- */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Crown className="w-4 h-4" />
              <span>Tailor Promotion Center</span>
            </div>
            <h2 className="text-2xl font-serif font-black text-stone-100">
              Boost Your Brand to Top Carousel & Search Rank
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              Select a promotional subscription plan. Clicking "Pay" routes directly to our official coordination desk (<strong>08029772375</strong>) to confirm your invoice and activate your spotlight status!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {promotionPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-6 rounded-3xl bg-stone-900 border flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.02] ${
                  plan.isFeatured
                    ? 'border-amber-500 shadow-2xl shadow-amber-500/10'
                    : 'border-stone-800'
                }`}
              >
                {plan.isFeatured && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-stone-950 text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow">
                    RECOMMENDED
                  </div>
                )}

                <div className="space-y-4">
                  <span className="px-2.5 py-1 rounded-md bg-stone-800 text-amber-400 text-[10px] font-bold uppercase">
                    {plan.badgeLabel || 'PRO PLAN'}
                  </span>

                  <h3 className="text-lg font-serif font-bold text-stone-100">{plan.name}</h3>
                  <div className="text-2xl font-black font-serif text-amber-400">{plan.price}</div>
                  <p className="text-xs text-stone-400 leading-relaxed">{plan.description}</p>

                  <ul className="space-y-2 pt-2 border-t border-stone-800 text-xs text-stone-300">
                    {plan.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-800">
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Select & Pay via 08029772375</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: PROFILE & DP SETTINGS --- */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-6">
          <div>
            <h2 className="text-xl font-serif font-black text-stone-100">
              Studio & Contact Information
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Update your gallery DP avatar, WhatsApp number, and address coordinates.
            </p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            {/* Avatar Update */}
            <div className="flex items-center gap-4 p-4 bg-stone-950 rounded-2xl border border-stone-800">
              <img
                src={avatarPreview || generateAvatarUrl(currentUser.name, 'tailor')}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border border-amber-500/50"
              />
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change DP from Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const base64 = reader.result as string;
                        setAvatarPreview(base64);
                        try {
                          const res = await api.uploadImage(base64, `dp_${Date.now()}`, 'avatars');
                          if (res.url) setAvatarPreview(res.url);
                        } catch (err) {
                          console.warn('Avatar preview cached');
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">State / Province</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-300 mb-1">City / District</label>
                <input
                  type="text"
                  value={cityName}
                  onChange={(e) => setCityName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-300 mb-1">WhatsApp Number (Direct Link)</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">About Your Tailoring Craft</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow transition-all"
            >
              Save Profile Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
