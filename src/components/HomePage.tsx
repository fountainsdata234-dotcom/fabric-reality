import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  TrendingUp,
  Compass,
  Layers,
  Heart,
  Star,
  MessageSquare,
  Phone,
  Crown,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  Clock,
  Shirt,
  MapPin,
  X,
  Share2,
  CheckCircle2,
  Eye,
  Award
} from 'lucide-react';
import { Garment, User, Review } from '../types';
import { api } from '../services/api';
import { formatWhatsAppUrl, generateAvatarUrl, POPULAR_TAGS, GARMENT_CATEGORIES } from '../data/countries';
import { SmoothCarousel } from './SmoothCarousel';
import confetti from 'canvas-confetti';

interface HomePageProps {
  currentUser: User | null;
  onOpenAuth: (mode?: any) => void;
  onOpenTailorStudio: () => void;
  onSelectTailorById: (tailorId: string) => void;
  onStartChat: (recipient: { id: string; name: string; avatarUrl: string; role: any }, garment?: Garment) => void;
  onOpenCollections: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  onOpenAuth,
  onOpenTailorStudio,
  onSelectTailorById,
  onStartChat,
  onOpenCollections,
}) => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'explore' | 'collections'>('trending');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedGender, setSelectedGender] = useState<string>('All');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Selected Garment for Detailed Modal & Rating
  const [activeGarmentModal, setActiveGarmentModal] = useState<Garment | null>(null);
  const [userRating, setUserRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Liked items tracking in local state
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchGarments();
  }, [activeTab, selectedTag, selectedCategory, selectedGender]);

  const fetchGarments = async () => {
    setIsLoading(true);
    try {
      const sortMode = activeTab === 'trending' ? 'trending' : 'latest';
      const res = await api.getGarments({
        sort: sortMode,
        tag: selectedTag || undefined,
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        gender: selectedGender !== 'All' ? selectedGender : undefined,
        search: searchQuery || undefined,
      });

      if (res.garments) {
        setGarments(res.garments);
      }
    } catch (err) {
      console.error('Error fetching garments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGarments();
  };

  // Carousel Items: Promoted items first, then top rated items (Real images only)
  const carouselItems = garments.filter((g) => g.imageUrl).slice(0, 6);

  const nextCarousel = () => {
    if (carouselItems.length > 0) {
      setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    }
  };

  const prevCarousel = () => {
    if (carouselItems.length > 0) {
      setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    }
  };

  // Auto slide carousel every 6s
  useEffect(() => {
    if (carouselItems.length <= 1) return;
    const interval = setInterval(nextCarousel, 6000);
    return () => clearInterval(interval);
  }, [carouselItems.length]);

  const handleLike = async (garment: Garment) => {
    const isLiked = !likedMap[garment.id];
    setLikedMap((prev) => ({ ...prev, [garment.id]: isLiked }));

    try {
      const res = await api.likeGarment(garment.id, isLiked);
      setGarments((prev) =>
        prev.map((g) => (g.id === garment.id ? { ...g, likesCount: res.likesCount } : g))
      );
      if (activeGarmentModal && activeGarmentModal.id === garment.id) {
        setActiveGarmentModal((prev) => (prev ? { ...prev, likesCount: res.likesCount } : null));
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    if (currentUser.role !== 'customer') {
      alert('Only registered fashion customers are permitted to submit garment ratings and reviews.');
      return;
    }

    if (!activeGarmentModal) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.submitReview({
        garmentId: activeGarmentModal.id,
        tailorId: activeGarmentModal.tailorId,
        customerId: currentUser.id,
        rating: userRating,
        comment: reviewComment || 'Flawless craftsmanship, great fit and quality!',
      });

      if (res && res.review) {
        setReviewSuccess(true);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        setGarments((prev) =>
          prev.map((g) =>
            g.id === activeGarmentModal.id
              ? {
                  ...g,
                  ratingsCount: (g.ratingsCount || 0) + 1,
                  averageRating: Number(
                    (((g.averageRating || 5) * (g.ratingsCount || 0) + userRating) /
                      ((g.ratingsCount || 0) + 1)).toFixed(1)
                  ),
                }
              : g
          )
        );
        setTimeout(() => setReviewSuccess(false), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Extract unique active tags from actual database garments for smart search pills
  const activeTagsInDb = Array.from(
    new Set(garments.flatMap((g) => g.tags || []))
  ).slice(0, 10);

  const displayTags = activeTagsInDb.length > 0 ? activeTagsInDb : POPULAR_TAGS.slice(0, 8);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Welcome & Search Hub */}
      <div className="relative rounded-3xl bg-gradient-to-r from-stone-900 via-stone-900 to-stone-950 p-6 sm:p-8 border border-stone-800 shadow-2xl overflow-hidden">
        {/* Ambient Thread Glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover Real Bespoke Haute Couture</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-serif font-black text-stone-100 tracking-tight">
            Authentic Tailor Portfolios & Direct Inquiries
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 max-w-2xl leading-relaxed">
            Search bespoke clothing tags, filter by authentic artisan ratings, and connect with master tailors directly via WhatsApp and live chat.
          </p>

          {/* Smart Search Bar with Smart Category Popup */}
          <form onSubmit={handleSearchSubmit} className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-amber-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by tag (e.g. 'agbada', 'senator', 'wedding suit') or tailor name..."
                className="w-full pl-12 pr-28 py-3.5 bg-stone-950/90 border border-stone-700 rounded-2xl text-stone-100 placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-xs sm:text-sm font-black rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-md"
              >
                Search
              </button>
            </div>

            {/* Smart Category & Tag Dropdown when searching */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-700 shadow-2xl z-30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-xs">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Real Clothing Categories & Active Tags</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-stone-400 hover:text-stone-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="py-3 flex flex-wrap gap-2">
                  {GARMENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setIsSearchFocused(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-stone-950 font-bold border-amber-400'
                          : 'bg-stone-950 text-stone-300 border-stone-800 hover:border-amber-500/40'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-800/60">
                  <span className="text-[11px] text-stone-400 font-semibold mb-1.5 block">
                    Popular Smart Search Tags:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {displayTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          setIsSearchFocused(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 text-xs font-medium"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Navigation Sub-Links Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2 bg-stone-900/60 p-1 rounded-2xl border border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'trending'
                ? 'bg-amber-500 text-stone-950 shadow font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending Designs</span>
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'explore'
                ? 'bg-amber-500 text-stone-950 shadow font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Latest Explore</span>
          </button>

          <button
            onClick={() => onOpenCollections()}
            className="px-4 py-2 rounded-xl flex items-center gap-2 text-stone-400 hover:text-stone-200 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Collections</span>
          </button>
        </div>

        {/* Gender Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          {['All', 'Men', 'Women', 'Unisex'].map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                selectedGender === g
                  ? 'bg-stone-100 text-stone-950 dark:bg-stone-100 dark:text-stone-950 font-bold border-stone-100'
                  : 'bg-stone-900/60 text-stone-400 border-stone-800 hover:text-stone-200'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* --- SMOOTH FASHION SPOTLIGHT CAROUSEL --- */}
      <SmoothCarousel
        garments={garments}
        onInspectGarment={(g) => setActiveGarmentModal(g)}
        onSelectTailor={(tailorId) => onSelectTailorById(tailorId)}
        onLikeGarment={handleLike}
        likedMap={likedMap}
        onOpenAuth={onOpenAuth}
      />

      {/* Style Categories & Quick Filter Chips */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Discover by Fashion World & Style</span>
          </h2>
          {selectedCategory !== 'All Categories' && (
            <button
              onClick={() => setSelectedCategory('All Categories')}
              className="text-xs text-amber-400 hover:underline font-medium"
            >
              Reset Category
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GARMENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold'
                    : 'bg-white/5 border-white/10 text-stone-300 hover:border-amber-500/40 hover:text-white'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- GARMENT GRID FEED --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-black text-stone-900 dark:text-stone-100">
              {activeTab === 'trending' ? '🔥 Trending Bespoke Creations' : '✨ Latest Published Designs'}
            </h2>
            <p className="text-xs text-stone-400">
              {garments.length} authentic garment designs found
            </p>
          </div>

          {selectedTag && (
            <div className="flex items-center gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-xl">
              <span>Filter: #{selectedTag}</span>
              <button onClick={() => setSelectedTag('')} className="hover:text-stone-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-400">Loading authentic garments...</p>
          </div>
        ) : garments.length === 0 ? (
          <div className="py-16 text-center bg-stone-900/30 rounded-3xl border border-stone-800 p-8">
            <Shirt className="w-12 h-12 text-stone-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-200">No Garments Found</h3>
            <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
              Try adjusting your tag or category filters, or publish a bespoke garment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {garments.map((garment) => {
              const isLiked = !!likedMap[garment.id];
              const whatsAppUrl = formatWhatsAppUrl(
                garment.tailorWhatsapp || garment.tailorPhone,
                garment.tailorName,
                garment.title
              );

              return (
                <div
                  key={garment.id}
                  className="group rounded-3xl bg-stone-900/80 border border-stone-800 hover:border-amber-500/50 shadow-xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-1"
                >
                  {/* Image & Badges */}
                  <div className="relative aspect-[4/5] bg-stone-950 overflow-hidden cursor-pointer" onClick={() => setActiveGarmentModal(garment)}>
                    <img
                      src={garment.imageUrl}
                      alt={garment.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Promoted Badge */}
                    {garment.tailorIsPromoted && (
                      <div className="absolute top-2.5 left-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-lg shadow-md flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>PROMOTED</span>
                      </div>
                    )}

                    {/* Like Action Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(garment);
                      }}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                        isLiked
                          ? 'bg-rose-500 text-white shadow-lg'
                          : 'bg-stone-950/60 text-stone-300 hover:text-rose-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                    </button>

                    {/* Bottom overlay with turnaround */}
                    {garment.turnaroundDays && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-stone-950/80 backdrop-blur-sm text-[10px] text-stone-300 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{garment.turnaroundDays}d turnaround</span>
                      </div>
                    )}
                  </div>

                  {/* Details Card Content */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          onClick={() => setActiveGarmentModal(garment)}
                          className="text-sm font-bold text-stone-100 hover:text-amber-400 cursor-pointer line-clamp-1"
                        >
                          {garment.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="font-serif font-black text-amber-400 text-sm">
                          {garment.currency}{garment.price > 0 ? garment.price.toLocaleString() : 'Price on Inquiry'}
                        </span>

                        <span className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {garment.averageRating ? garment.averageRating.toFixed(1) : '5.0'}
                          <span className="text-stone-400 text-[10px] font-normal">
                            ({garment.ratingsCount || 0})
                          </span>
                        </span>
                      </div>

                      {/* Tags */}
                      {garment.tags && garment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {garment.tags.slice(0, 3).map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSelectedTag(tag)}
                              className="px-2 py-0.5 rounded-md bg-stone-950 text-stone-400 hover:text-amber-300 border border-stone-800 text-[10px] font-medium"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tailor Link & Quick Action Buttons */}
                    <div className="pt-3 border-t border-stone-800 space-y-2">
                      <div
                        onClick={() => onSelectTailorById(garment.tailorId)}
                        className="flex items-center gap-2 cursor-pointer group/tailor"
                      >
                        <img
                          src={garment.tailorAvatar || generateAvatarUrl(garment.tailorName, 'tailor')}
                          alt={garment.tailorName}
                          className="w-7 h-7 rounded-full object-cover border border-stone-700"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-stone-300 group-hover/tailor:text-amber-400 truncate">
                            {garment.tailorName}
                          </p>
                          <p className="text-[10px] text-stone-400 truncate">
                            {garment.tailorCity}, {garment.tailorCountry}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Phone className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>

                        <button
                          onClick={() => {
                            if (!currentUser) onOpenAuth('login');
                            else onStartChat({
                              id: garment.tailorId,
                              name: garment.tailorName,
                              avatarUrl: garment.tailorAvatar,
                              role: 'tailor'
                            }, garment);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold flex items-center justify-center gap-1 border border-stone-700 transition-all"
                        >
                          <MessageSquare className="w-3 h-3 text-amber-400" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- DETAILED GARMENT INSPECTION & CUSTOMER RATING MODAL --- */}
      {activeGarmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            <button
              onClick={() => setActiveGarmentModal(null)}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-950/80 text-stone-300 hover:text-white border border-stone-700"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Column */}
            <div className="w-full md:w-1/2 bg-stone-950 relative min-h-[300px] flex items-center justify-center">
              <img
                src={activeGarmentModal.imageUrl}
                alt={activeGarmentModal.title}
                className="w-full h-full object-contain max-h-[480px]"
              />
              {activeGarmentModal.tailorIsPromoted && (
                <div className="absolute top-4 left-4 bg-amber-500 text-stone-950 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  <span>PROMOTED</span>
                </div>
              )}
            </div>

            {/* Information & Rating Form Column */}
            <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-4">
              <div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  {activeGarmentModal.category} • {activeGarmentModal.gender}
                </span>

                <h2 className="text-2xl font-serif font-black text-stone-100 mt-1">
                  {activeGarmentModal.title}
                </h2>

                <div className="flex items-center gap-3 my-3">
                  <span className="text-2xl font-black font-serif text-amber-400">
                    {activeGarmentModal.currency}{activeGarmentModal.price > 0 ? activeGarmentModal.price.toLocaleString() : 'Price on Inquiry'}
                  </span>

                  <span className="flex items-center gap-1 text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {activeGarmentModal.averageRating ? activeGarmentModal.averageRating.toFixed(1) : '5.0'}
                    <span className="text-stone-400 font-normal">({activeGarmentModal.ratingsCount || 0} reviews)</span>
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed">
                  {activeGarmentModal.description || 'Authentic custom bespoke piece designed and tailored with premium craftsmanship.'}
                </p>

                {/* Fabric & Turnaround specs */}
                <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-stone-950 rounded-xl border border-stone-800 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Fabric Specification</span>
                    <span className="font-semibold text-stone-200">{activeGarmentModal.fabricType || 'Cotton / Wool'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 block">Standard Turnaround</span>
                    <span className="font-semibold text-stone-200">{activeGarmentModal.turnaroundDays || 5} Days</span>
                  </div>
                </div>

                {/* Tailor Info */}
                <div
                  onClick={() => {
                    setActiveGarmentModal(null);
                    onSelectTailorById(activeGarmentModal.tailorId);
                  }}
                  className="flex items-center gap-3 p-3 bg-stone-950/70 hover:bg-stone-950 rounded-2xl border border-stone-800 cursor-pointer transition-all"
                >
                  <img
                    src={activeGarmentModal.tailorAvatar || generateAvatarUrl(activeGarmentModal.tailorName, 'tailor')}
                    alt={activeGarmentModal.tailorName}
                    className="w-10 h-10 rounded-full object-cover border border-amber-500/40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-100">{activeGarmentModal.tailorName}</p>
                    <p className="text-[11px] text-amber-400">{activeGarmentModal.tailorCity}, {activeGarmentModal.tailorCountry}</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">View Studio →</span>
                </div>

                {/* --- CUSTOMER RATING SUBMISSION SECTION --- */}
                <div className="mt-4 pt-4 border-t border-stone-800">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-2">
                    <Award className="w-4 h-4" />
                    <span>Rate this Garment (Customers Only)</span>
                  </h4>

                  {reviewSuccess ? (
                    <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Thank you! Your rating has been recorded in real-time.</span>
                    </div>
                  ) : currentUser?.role === 'customer' ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= userRating ? 'fill-amber-400 text-amber-400' : 'text-stone-600'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs text-amber-300 font-bold ml-2">{userRating} / 5 Stars</span>
                      </div>

                      <input
                        type="text"
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write verified feedback on fabric, cut, and fit..."
                        className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                      />

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition-all"
                      >
                        {isSubmittingReview ? 'Submitting...' : 'Post Verified Rating'}
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 text-[11px] text-stone-400">
                      {currentUser ? (
                        <span>You are logged in as a Tailor. Only customer accounts can submit ratings.</span>
                      ) : (
                        <span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveGarmentModal(null);
                              onOpenAuth('login');
                            }}
                            className="text-amber-400 hover:underline font-bold"
                          >
                            Sign in as Customer
                          </button>{' '}
                          to submit a verified 1-5 star review.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Actions */}
              <div className="pt-3 border-t border-stone-800 grid grid-cols-2 gap-2">
                <a
                  href={formatWhatsAppUrl(
                    activeGarmentModal.tailorWhatsapp || activeGarmentModal.tailorPhone,
                    activeGarmentModal.tailorName,
                    activeGarmentModal.title
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp Inquiry</span>
                </a>

                <button
                  onClick={() => {
                    const tailor = {
                      id: activeGarmentModal.tailorId,
                      name: activeGarmentModal.tailorName,
                      avatarUrl: activeGarmentModal.tailorAvatar,
                      role: 'tailor' as const
                    };
                    setActiveGarmentModal(null);
                    if (!currentUser) onOpenAuth('login');
                    else onStartChat(tailor, activeGarmentModal);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>In-App Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
